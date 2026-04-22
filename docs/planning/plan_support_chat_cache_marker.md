# Plan: Activate Anthropic Prompt Caching for the Support Chatbot

**Status:** ready to implement
**Scope:** ~5 lines of code, 1 file
**Risk:** low — reversible, no schema change, no data migration

---

## Context

Storytica has an AI-powered support chatbot (Haiku 4.5) that lives at:

- API route: `app/api/support/chat/route.ts`
- Widget: `components/support-chat/SupportChatWidget.tsx`
- Tools: `lib/support/tools.ts` (11 tool definitions)
- System prompt: `lib/support/systemPrompt.ts`
- Convex backend: `convex/supportChat.ts`, `convex/supportTools.ts`

Every request sends tools + system prompt + message history to Haiku. Tools + system are relatively static; message history grows per conversation.

## The bug

The route already sets `cache_control` on the system block:

```ts
// app/api/support/chat/route.ts — current code
system: [
  {
    type: "text",
    text: system,
    cache_control: { type: "ephemeral" },
  },
],
```

Anthropic renders requests in order **`tools → system → messages`**. Putting the marker on the system block means the cached prefix is **tools + system only** — messages are NOT part of the cached prefix.

Measured prefix sizes:

| Caller | Tools | System | Prefix total |
|---|---:|---:|---:|
| Authed user | ~1,860 tokens | ~1,600 tokens | **~3,460 tokens** |
| Anonymous visitor | ~250 tokens | ~1,300 tokens | **~1,550 tokens** |

**Haiku 4.5's minimum cacheable prefix is 4,096 tokens.** Both are under. With the marker pinned to system, the prefix size is fixed and **will never cross 4,096 regardless of conversation length** → caching never activates. `cache_creation_input_tokens` and `cache_read_input_tokens` both stay at 0 forever.

## The fix

Move to **top-level `cache_control`**, which auto-places the breakpoint at the end of the last cacheable block (which is the last message). Then the cached prefix is tools + system + **full message history**, and grows with every turn.

### Exact change

**File:** `app/api/support/chat/route.ts`

Find this block (currently around line 224):

```ts
const messageStream = anthropic.messages.stream({
  model: SUPPORT_MODEL,
  max_tokens: MAX_TOKENS,
  system: [
    {
      type: "text",
      text: system,
      cache_control: { type: "ephemeral" },
    },
  ],
  tools: toolsForRequest,
  messages: anthropicMessages,
});
```

Replace with:

```ts
const messageStream = anthropic.messages.stream({
  model: SUPPORT_MODEL,
  max_tokens: MAX_TOKENS,
  system,
  tools: toolsForRequest,
  messages: anthropicMessages,
  cache_control: { type: "ephemeral" },
});
```

Changes:
1. `system` becomes a plain string (no wrapper array, no inline `cache_control`)
2. Add top-level `cache_control: { type: "ephemeral" }` on the request object
3. That's it

### Type check

The `@anthropic-ai/sdk` version in this project is `^0.78.0`. Top-level `cache_control` on `messages.stream()` is supported. If TypeScript complains, the escape hatch is to cast the params — but the build uses `ignoreBuildErrors: true` (see `next.config.ts`) so it won't block deployment.

If the installed SDK version turns out NOT to accept top-level `cache_control`, the fallback is to put the marker on the **last user message's content block** instead:

```ts
// Fallback approach — append breakpoint to last message
const messagesForApi = [...anthropicMessages];
const last = messagesForApi[messagesForApi.length - 1];
if (last && typeof last.content === "string") {
  messagesForApi[messagesForApi.length - 1] = {
    ...last,
    content: [
      { type: "text", text: last.content, cache_control: { type: "ephemeral" } },
    ],
  };
} else if (Array.isArray(last?.content)) {
  const lastBlock = last.content[last.content.length - 1];
  if (lastBlock && lastBlock.type === "text") {
    messagesForApi[messagesForApi.length - 1] = {
      ...last,
      content: last.content.slice(0, -1).concat([
        { ...lastBlock, cache_control: { type: "ephemeral" } },
      ]),
    };
  }
}
// then pass messages: messagesForApi
```

But try the top-level approach first — it's cleaner.

## Verification

### 1. Add temporary logging

In the tool-loop `for (let iter ...)` block, after `const final = await messageStream.finalMessage();`, add:

```ts
console.log("[support-chat] usage", {
  input: final.usage?.input_tokens,
  cache_write: (final.usage as any)?.cache_creation_input_tokens,
  cache_read: (final.usage as any)?.cache_read_input_tokens,
  output: final.usage?.output_tokens,
});
```

### 2. Send 3 chat messages in the same session

Use the widget (or curl) with variant `landing` (anon, smaller prefix — will take more turns to activate) or sign in first and chat as authed.

### 3. Expected behaviour in the terminal running `npm run dev`

Below 4,096 tokens total:
```
[support-chat] usage { input: 2800, cache_write: 0, cache_read: 0, output: 180 }
```

Crossed threshold (first turn that activates caching):
```
[support-chat] usage { input: 200, cache_write: 4100, cache_read: 0, output: 180 }
  ^ cache_write now populated ^
```

Next turn in same session:
```
[support-chat] usage { input: 150, cache_write: 400, cache_read: 4100, output: 180 }
  ^ cache_read populated — cache HIT                    ^
```

If `cache_read_input_tokens` stays at 0 across turns, something else is invalidating the cache (see silent invalidators below).

### 4. Remove the debug log once verified

## Silent invalidators to watch for

If `cache_read` stays at 0 even after the fix, audit for these (see `shared/prompt-caching.md` in the Claude skill for the full list):

- `Date.now()` or timestamp interpolated into the system prompt → currently not present ✓
- Tool definitions reordered or regenerated per request → currently static ✓
- System prompt built from `Array.sort()` without stable keys → not applicable ✓
- Model string changed mid-session → not applicable ✓

The current system prompt builder (`buildSystemPrompt`) is deterministic — same inputs produce same string. Safe.

## Expected impact

At current scale (low-volume chat), savings are **~$1–2/day** per 1,000 chats once caching activates. Real win is future-proofing:

- If the KB grows and the system prompt gets bigger (or few-shot examples get added), caching activates earlier and saves more.
- Long multi-turn troubleshooting conversations benefit most — every turn after turn 2-3 reads the full prior conversation from cache at ~10% cost.

## TTL consideration (optional, later)

Default cache TTL is 5 minutes — if a user pauses mid-chat for longer, cache goes cold on the next message. For a chat surface where users may drift for ~10–20 minutes, consider upgrading to 1-hour TTL:

```ts
cache_control: { type: "ephemeral", ttl: "1h" }
```

Trade-off: 2× write premium instead of 1.25×. Break-even requires 3+ reads per write (vs 2 for 5-minute TTL). Don't do this until after verifying the 5-minute TTL works and measuring actual chat session timing.

## Files touched

- `app/api/support/chat/route.ts` — the 5-line change above
- Nothing else

No Convex deploy needed. No schema change. Next turn of any authed chat should show cache activity in the logs.

## Rollback

If something breaks, revert the single `messages.stream({...})` call to its original form (system as `[{type:"text", text:system, cache_control:{type:"ephemeral"}}]`, remove top-level `cache_control`). Behaviour returns to the previous no-op caching state.
