# Chatbot System — Storytica Support Assistant

> **Last updated:** 2026-04-27
> **Status:** Production
> **Model:** DeepSeek V3 via OpenRouter (planned migration from Claude Haiku 4.5)

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

---

## Model Routing Strategy

> **Decided:** 2026-04-27

### Model Assignments

| Feature | Model | Provider | Cost/msg | Status |
|---------|-------|----------|----------|--------|
| **Support Chat** | DeepSeek V3 | OpenRouter | ~$0.0009 | DECIDED — Phase 1 |
| **Director** (free for Pro+) | DeepSeek V3 | OpenRouter | ~$0.0009 | DECIDED — Phase 1 |
| **Agent** ($120/seat) | Claude Haiku 4.5 | Anthropic SDK | ~$0.0032 | DECIDED — stays on Haiku |
| **Vision** (image analysis) | Claude Haiku 4.5 | Anthropic SDK | ~$0.0032 | DECIDED — only Haiku supports vision |

### Director Capabilities (on DeepSeek V3 — no vision)

| Can do | Can't do |
|--------|----------|
| Read project data (frames, scenes, elements) | See/analyze images (no vision) |
| Enhance/improve prompts | Trigger generation (no credits) |
| Suggest style, composition, lighting | Execute any actions |
| Recommend models | Access post-processing |
| Search knowledge base | |
| Create/batch update frame prompts | |

Director understands your project through data (prompts, metadata, element names) but cannot look at actual images.

### Agent Smart Routing (Phase 2 — future optimization)

Agent starts on Haiku-only. Future phase could mix models within Agent mode:

| Agent action | Model | Why |
|---|---|---|
| Conversation / planning | DeepSeek V3 | Cheap, good enough for text |
| create_execution_plan | DeepSeek V3 | Just building a JSON plan |
| Tool calls (spending credits) | Haiku | Reliable routing, credits at stake |
| Vision (analyze_frame_image) | Haiku | Only option |
| trigger_image/video/post_processing | Haiku | Actually spending money |

Complexity note: requires switching models mid-conversation based on predicted tool usage. Defer until costs justify it.

### Routing Logic (auto, not user-selectable)

```text
Support Chat:
  model = DeepSeek V3 (via OpenRouter)
  fallback = Haiku (if OPENROUTER_API_KEY not set or OpenRouter error)

Director/Agent Chat:
  if mode == "director":
      model = DeepSeek V3 (via OpenRouter)
  elif mode == "agent":
      model = Claude Haiku 4.5 (via Anthropic SDK)

  if OPENROUTER_API_KEY not set:
      fallback = Claude Haiku 4.5 for everything
```

No user-facing model picker. Reasons:
1. Users care about results, not model names
2. Smart routing gives best cost/quality tradeoff automatically
3. Prevents users from picking expensive models and eroding margins

### Implementation Notes — OpenRouter Format Adapter

OpenRouter uses OpenAI-compatible tool calling format, not Anthropic format.
Need a one-time adapter (~100 lines) to translate:
- `AUTHED_TOOLS` / `ANON_TOOLS` → OpenAI function schema
- OpenAI `tool_calls` response → Anthropic-style `tool_use` blocks
- Existing `dispatchTool()` stays unchanged

### Cost Projections

**Per-message cost** (~1,500 input + 500 output tokens):

| Model | Per message | Per 100 msgs |
|-------|-----------|-------------|
| DeepSeek V3 | $0.00089 | $0.089 |
| Haiku 4.5 | $0.0032 | $0.32 |
| **Savings** | **72%** | |

**Director daily cost on DeepSeek V3:**

| Usage level | Msgs/day | Cost/day | Cost/month |
|---|---|---|---|
| Light user | 10 | $0.009 | $0.27 |
| Average user | 30 | $0.027 | $0.81 |
| Heavy user (at 100 cap) | 100 | $0.089 | $2.67 |
| 50 users average | 1,500 total | $1.35 | $40.50 |
| 100 users average | 3,000 total | $2.70 | $81.00 |

**At scale (monthly):**

| Scale | Haiku only | With DeepSeek routing | Savings |
|-------|-----------|----------------------|---------|
| 50 active Director users | $144/mo | $40/mo | $104/mo (72%) |
| 100 active Director users | $288/mo | $81/mo | $207/mo (72%) |
| Support chat (100 users, 5 msgs/day avg) | $48/mo | $13/mo | $35/mo (72%) |
| Agent seats (stays on Haiku) | no change | no change | — |

Director on DeepSeek is essentially free to run. Even 100 heavy users maxing the daily cap costs ~$267/month — easily covered by a handful of Pro subscriptions ($45/mo each).

### Fallback Behavior

- If `OPENROUTER_API_KEY` is not set, all routes fall back to Haiku via Anthropic SDK
- If OpenRouter returns an error, retry once with Haiku as fallback
- Support chat graceful degradation (auto-ticket creation) still applies

### Pricing Decision: Director is FREE for Pro+

Director is not charged separately. Rationale:
- Cost is negligible (~$0.81/user/month avg on DeepSeek)
- Free Director drives Agent seat upsell ($120/month)
- Paywall would kill adoption and conversion funnel
- If costs spike, tighten daily cap (100 → 50) instead of adding paywall

### Agent Seat Architecture (via Stripe + Convex, not Clerk)

Clerk handles: WHO is in the org + their role
Convex handles: WHAT features each user has access to (seat type)
Stripe handles: billing for quantity-based seat subscriptions

Flow:
1. Org admin buys N agent seats via Stripe (quantity-based subscription item)
2. Stripe webhook → Convex creates/updates `agent_seats` records
3. Org admin assigns seats to specific members (UI in org settings)
4. User opens Agent mode → check `agent_seats` for their userId
5. No seat → teaser mode (30 free msgs/month) or "ask your admin"

---

## Message Usage Limits

### Per-Feature Limits

| Feature | Limit | Window | Overflow Behavior |
|---------|-------|--------|-------------------|
| **Support Chat (authed)** | 30 msgs | per hour | 429 rate limit, show reset time |
| **Support Chat (anon)** | 10 msgs | per hour | 429 rate limit, show reset time |
| **Director** (free for Pro+) | 100 msgs | per day | Soft cap, "try again tomorrow" message |
| **Agent** ($120/seat) | 5,000 msgs | per month | 1 credit/msg overflow (seamless, no hard lock) |
| **Agent teaser** (Pro/Business, no seat) | 30 msgs | per month | "Upgrade to Agent seat" prompt |

### Tracking

- Support chat: existing `support_chat_rate_limits` table (hourly window)
- Director: new daily counter in `director_chat_sessions` or dedicated rate limit table
- Agent: monthly counter tracked per seat in Convex, reset on billing cycle
- Agent teaser: monthly counter per user, reset on calendar month

### UI Patterns (inspired by Claude usage bar)

- Show remaining messages in chat header: "82/100 messages today"
- Progress bar fills as usage increases
- Warning at 80% usage: bar turns amber
- At limit: clear message with reset time, no hard lockout feeling
- Agent overflow: "You've used your 5,000 included messages. Additional messages cost 1 credit each." (seamless, auto-deduct)

---

## Implementation Checklist

### Phase 1 — Model Routing
- [ ] Create `lib/openrouter.ts` — OpenRouter client for DeepSeek V3
- [ ] Add `OPENROUTER_API_KEY` to `env.example`
- [ ] Switch Support chat from Haiku to DeepSeek V3 (with Haiku fallback)
- [ ] Switch Director chat to DeepSeek V3 for `mode=director`
- [ ] Keep Agent chat on Haiku for `mode=agent` + vision tasks
- [ ] Test: Support chat answers FAQ/billing questions correctly on DeepSeek
- [ ] Test: Director gives creative advice on DeepSeek
- [ ] Test: Agent executes tool chains reliably on Haiku
- [ ] Test: Vision (analyze_frame_image) works on Haiku only

### Phase 2 — Message Usage Limits
- [ ] Add daily message counter for Director (Convex table/field)
- [ ] Add monthly message counter for Agent seats (Convex table/field)
- [ ] Add teaser counter for Agent (30 free msgs/month for Pro/Business without seat)
- [ ] UI: message count display in chat header
- [ ] UI: progress bar with amber warning at 80%
- [ ] UI: limit-reached message with reset time
- [ ] Agent overflow: seamless 1 credit/msg deduction after cap
