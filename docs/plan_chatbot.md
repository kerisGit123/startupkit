# Chatbot System — Storytica Support Assistant

> **Last updated:** 2026-04-25
> **Status:** Production
> **Model:** Claude Haiku 4.5 via Anthropic SDK

---

## Architecture Overview

```
User (browser)
  │
  ├── FAQ Balloon clicked ──► Hardcoded answer (zero API calls)
  │
  └── Custom question typed
        │
        ▼
  SupportChatWidget.tsx (client)
        │  POST /api/support/chat
        │  SSE streaming
        ▼
  route.ts (server)
        │
        ├── Rate limit check (Convex)
        ├── Session management (Convex)
        ├── Build system prompt
        ├── Attach tools (authed vs anon)
        │
        ▼
  Claude Haiku 4.5 (Anthropic API)
        │
        ├── Text response ──► streamed to client
        └── Tool calls ──► dispatchTool() ──► Convex queries ──► back to Haiku
```

---

## File Map

| File | Purpose |
|------|---------|
| `components/support-chat/SupportChatWidget.tsx` | Client widget — UI, FAQ decision tree, SSE streaming, message rendering |
| `app/api/support/chat/route.ts` | Server route — auth, rate limit, Anthropic streaming, tool loop, session persistence |
| `lib/support/anthropic.ts` | Anthropic client singleton, model config constants |
| `lib/support/systemPrompt.ts` | System prompt builder — product facts, rules, escalation, knowledge base instructions |
| `lib/support/tools.ts` | Tool definitions (AUTHED_TOOLS, ANON_TOOLS) + `dispatchTool()` handler |
| `convex/supportChat.ts` | Convex mutations/queries — sessions, messages, rate limits |
| `convex/supportTools.ts` | Convex queries for tool calls — profile, subscription, credits, invoices, generations, tickets |
| `app/(marketing)/faq/page.tsx` | Dedicated FAQ page — 50+ questions, 8 categories |

---

## Client Widget (`SupportChatWidget.tsx`)

### Props
- `variant: "landing" | "studio"` — determines system prompt context hint

### State
- `messages` — array of `{ id, role, content, isStreaming?, isError? }`
- `sessionId` — Convex session ID (authed users only)
- `faqPath` — decision tree navigation stack (`FaqNode[][]`)
- `faqSearch` — search filter text
- `streaming` — whether a response is in progress
- `activeTool` — name of tool currently being called (shown as indicator)

### FAQ Decision Tree (`FAQ_TREE`)

Hardcoded FAQ balloons that answer common questions with **zero API calls**:

| Top-level balloon | Follow-ups | Total paths |
|---|---|---|
| What does Storytica do? | AI models (6 models + tips each), character consistency, export | ~20 |
| How do credits work? | Generation costs, estimates per plan, top-ups, expiry | 4 |
| What are the plans & pricing? | Free plan, cancel, Pro vs Business | 3 |
| How do I use...? | Element Library, Canvas, Script-to-Storyboard, Video Editor, Batch Gen, Camera Studio, Director's View, AI Analyze, Prompt Enhance | 9 |
| Does it support teams? | Roles, seat limits | 2 |
| Is my content private? | — | 1 |
| View all FAQ | Opens `/faq` page | — |

**Search:** Filters across all nodes using word-start matching + hidden `tags` field.
**Navigation:** Home button (reset to root), Back button (up one level).
**Rendering:** Answers use `\n` line breaks, `**bold**` labels, `- bullet` lists. Rendered by `renderInlineMarkdown()` with `whitespace-pre-wrap`.

### Message Flow (custom question)

1. User types message → added to `messages` as `role: "user"`
2. Empty assistant message added with `isStreaming: true`
3. `POST /api/support/chat` with `{ message, variant, sessionId?, clientHistory? }`
4. SSE events received: `text` (delta), `tool_call`, `tool_result`, `session`, `done`, `error`
5. Text deltas appended to assistant message content
6. On `done`, `isStreaming` set to false

### Markdown Renderer (`renderInlineMarkdown`)

Supports inline only:
- `**bold**` → `<strong>`
- `*italic*` → `<em>`
- `[text](url)` → `<a>` (with URL safety check)

No block-level rendering. Newlines preserved by CSS `whitespace-pre-wrap`.

---

## Server Route (`app/api/support/chat/route.ts`)

### Request
```typescript
POST /api/support/chat
{
  message: string;         // max 4000 chars
  variant: "landing" | "studio";
  sessionId?: string;      // Convex session ID for continuing conversation
  clientHistory?: { role: "user" | "assistant"; content: string }[];  // anon only
}
```

### Flow

1. **Auth check** — `auth()` from Clerk. Determines authed vs anon path.
2. **Rate limit** — Convex mutation `checkAndIncrementRateLimit`. Authed: 30/hr, Anon: 10/hr.
3. **Session** — Authed: create or continue Convex session. Anon: no persistence.
4. **Build messages** — Authed: load full session history from Convex. Anon: use `clientHistory` (last 12 messages).
5. **System prompt** — `buildSystemPrompt({ authed, variant })`.
6. **Prompt caching** — `cache_control: { type: "ephemeral" }` on system prompt and last message.
7. **Tool loop** — Up to `MAX_TOOL_ITERATIONS` (8) rounds. Each round:
   - Stream response from Haiku
   - If `stop_reason === "end_turn"` or no tool calls → done
   - Otherwise: execute tools via `dispatchTool()`, append results, loop
8. **Persist** — Authed: save assistant message + tool calls + token usage to Convex.
9. **Error fallback** — On failure: auto-create support ticket, stream fallback message.

### Response (SSE)
```
data: {"type":"session","sessionId":"..."}
data: {"type":"text","delta":"Hello! "}
data: {"type":"tool_call","name":"get_my_credit_balance"}
data: {"type":"tool_result","name":"get_my_credit_balance","isError":false}
data: {"type":"text","delta":"You have 2,450 credits."}
data: {"type":"done"}
```

---

## System Prompt (`lib/support/systemPrompt.ts`)

### Structure
```
SHARED_RULES          — role, tone, safety, confidentiality
PRODUCT_FACTS         — what Storytica is, models, pricing summary
KNOWLEDGE_BASE_RULES  — always search KB first for factual questions
AUTHED_EXTRAS         — tool usage instructions (signed-in users)
  or ANON_EXTRAS      — no account tools, encourage signup
ESCALATION_RULES      — when to create support tickets (authed only)
variantHint()         — context: landing page vs studio
```

### Key Rules
- **Off-topic refusal** — only answers Storytica questions
- **Never reveal** — supplier names (Kie AI), costs/margins, API routes, schema
- **Prompt injection defense** — ignore "ignore previous instructions" attempts
- **Knowledge Base first** — always call `search_knowledge_base` before using baseline knowledge
- **Proactive tool use** — call tools immediately, don't ask user for IDs
- **Credit pricing** — defers to `get_ai_model_pricing` tool (no hardcoded costs in prompt)

### Token Size
~2,100 tokens (after removing hardcoded credit table). Previously ~2,500.

---

## Tools (`lib/support/tools.ts`)

### Anon Tools (1)
| Tool | Purpose |
|------|---------|
| `search_knowledge_base` | Query team-curated KB articles |

### Authed Tools (11)
| Tool | Purpose | Inputs |
|------|---------|--------|
| `get_my_profile` | Name, email, account date, blocked status | — |
| `get_my_subscription` | Plan, status, renewal date, cancellation | — |
| `get_my_credit_balance` | Current credit balance | — |
| `list_my_credit_transactions` | Recent ledger entries (purchases, usage, grants) | `limit?` (1-20) |
| `get_ai_model_pricing` | Credit costs per model/resolution | `model_name?` |
| `list_my_recent_generations` | Recent storyboard generations with status | `limit?` (1-20) |
| `get_generation_details` | Detailed status for one generation | `item_id` |
| `list_my_invoices` | Billing history / receipts | `limit?` (1-10) |
| `list_my_support_tickets` | Existing tickets with status | — |
| `create_support_ticket` | Escalate to human support | `subject`, `description`, `category`, `priority` |
| `search_knowledge_base` | Query KB articles | `query` |

### Tool Dispatch
`dispatchTool()` switches on tool name, calls Convex queries via `ctx.convex`, formats results as JSON strings. All Convex calls authenticated via `SUPPORT_INTERNAL_SECRET`.

---

## Database (Convex)

### Tables
| Table | Fields | Purpose |
|-------|--------|---------|
| `support_chat_sessions` | userId, orgId, variant, title, messageCount, totalTokensIn/Out, timestamps | One per conversation |
| `support_chat_messages` | sessionId, role, content, toolCalls[], tokensIn/Out, createdAt | Message history |
| `support_chat_rate_limits` | key, count, windowStart | Hourly rate limiting |

### Indexes
- `support_chat_sessions.by_userId` — lookup user's sessions
- `support_chat_sessions.by_createdAt` — admin reports
- `support_chat_rate_limits.by_key` — rate limit lookup

---

## Configuration

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API access |
| `SUPPORT_INTERNAL_SECRET` | Yes | Authenticates tool calls to Convex |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex backend URL |

### Constants (`lib/support/anthropic.ts`)
| Constant | Value | Purpose |
|----------|-------|---------|
| `SUPPORT_MODEL` | `claude-haiku-4-5` | Model used for chat |
| `MAX_TOKENS` | `4096` | Max response tokens |
| `MAX_TOOL_ITERATIONS` | `8` | Max tool call rounds per message |

### Rate Limits
| User type | Limit | Window |
|-----------|-------|--------|
| Authed | 30 messages | per hour |
| Anon | 10 messages | per hour |

---

## Cost Optimization

### FAQ Balloons (biggest saving)
- ~50 FAQ paths answer common questions with zero API calls
- Covers: pricing, models, credits, features, teams, privacy, how-to guides
- Searchable with word-start matching + tags
- **Estimated 70-80% reduction** in Haiku calls

### System Prompt Trim
- Removed 15-line hardcoded credit cost table (~400 tokens saved per call)
- Replaced with instruction to use `get_ai_model_pricing` tool
- Also prevents stale pricing answers

### Prompt Caching
- `cache_control: { type: "ephemeral" }` on system prompt and last message
- Cached tokens cost 10% of normal input rate
- Cache write costs 25% premium (one-time)

### Potential Future Optimizations
- **Sliding window** — limit authed history to last 10 messages (saves ~10-25% on long conversations)
- **Streaming abort** — user can close chat mid-stream (already supported via AbortController)
- **Knowledge Base expansion** — more KB articles = fewer cases where Haiku improvises

---

## FAQ Page (`/faq`)

### Route
- Path: `/faq`
- File: `app/(marketing)/faq/page.tsx`
- Public route (added to `middleware.ts`)
- Linked from: landing page FAQ section ("View all FAQ"), footer, chat widget balloon

### Content (8 categories, 50+ questions)
1. **Getting Started** — what is Storytica, sign up, free plan, what you can create
2. **AI Models** — available models, per-model costs (NB2, GPT Image 2, Seedance 2.0/Fast/1.5 Pro, Z-Image), model comparison
3. **Model Tips & Best Practices** — per-model usage tips, img2vid vs txt2vid, audio vs no audio
4. **Credits & Pricing** — how credits work, generation costs, estimates per plan, top-ups, expiry, cancel
5. **Features & Tools** — script-to-storyboard, canvas editor, element library, video editor, camera studio, director's view, batch gen, AI analyze, prompt enhance, export, music
6. **Team & Collaboration** — team support, seat limits, roles
7. **Privacy & Security** — content training, file storage, data safety

### Style
- Dark theme matching landing page (#111111 background)
- Bubble/card style — rounded cards that expand on click
- Categorized sections with teal accent headers
- CTA at bottom to sign up or go home

---

## Admin Reports

> **Note:** The standalone `support-chat-reports` page was removed in the admin cleanup (2025-04-25).
> Chat session data is still in Convex (`support_chat_sessions`, `support_chat_messages` tables)
> and can be queried via the inbox or directly in the Convex dashboard.

---

## Error Handling

### Graceful Degradation
When Anthropic API fails:
1. Auto-creates a support ticket with the user's last message (authed only)
2. Streams a friendly fallback message with ticket number
3. Persists fallback message to session history
4. User can retry or reach support via dashboard

### Rate Limiting
- Returns `429` with JSON: `{ error: "rate_limited", message: "...", resetAt: timestamp }`
- UI shows the rate limit message in an error-styled bubble

---

## Extending the Chatbot

### Adding a new tool
1. Add tool name to `ToolName` union type in `lib/support/tools.ts`
2. Add tool definition to `AUTHED_TOOLS` array (name, description, input_schema)
3. Add `case` to `dispatchTool()` switch statement
4. Add Convex query/mutation in `convex/supportTools.ts`
5. Export from `convex/_generated/api.d.ts` (auto-generated)

### Adding FAQ questions
1. Add to `FAQ_TREE` in `SupportChatWidget.tsx` — include `q`, `a`, optional `tags`, optional `followUp`
2. Add matching question to `FAQ_DATA` in `app/(marketing)/faq/page.tsx`
3. Use `\n` for line breaks, `**bold**` for labels, `- ` for bullet lists in answers

### Changing the model
- Edit `SUPPORT_MODEL` in `lib/support/anthropic.ts`
- Supported: any Anthropic model ID (e.g. `claude-sonnet-4-5`, `claude-haiku-4-5`)
- Cost implication: Sonnet is ~10x more expensive than Haiku

### Adding a new system prompt section
- Edit `buildSystemPrompt()` in `lib/support/systemPrompt.ts`
- Keep total system prompt under ~3,000 tokens to maintain cache efficiency
- Use the knowledge base for frequently-changing content instead of hardcoding

### Adjusting rate limits
- `RATE_LIMIT_AUTHED` and `RATE_LIMIT_ANON` constants in `app/api/support/chat/route.ts`
- Window is 1 hour, managed by Convex `support_chat_rate_limits` table
