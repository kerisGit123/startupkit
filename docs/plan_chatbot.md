# Chatbot System — Storytica Support Assistant

> **Last updated:** 2026-05-01
> **Status:** Production — Phase 1 complete, Phase 2 pending
> **Primary Model:** DeepSeek V3 via OpenRouter (~$0.0009/msg)
> **Fallback Model:** Claude Haiku 4.5 via Anthropic SDK (~$0.0032/msg)

---

## Architecture Overview

```
User (browser)
  │
  ├── FAQ Balloon clicked ──► Hardcoded answer (zero API calls)
  │     Categories: FAQ, How to, Models, My Account, Support
  │
  └── Custom question / Account balloon clicked
        │
        ▼
  SupportChatWidget.tsx (client)
        │  POST /api/support/chat
        │  SSE streaming
        │  JSON leak filter (strips DeepSeek artifacts)
        ▼
  route.ts (server)
        │
        ├── Rate limit check (Convex)
        ├── Session management (Convex)
        ├── Build system prompt (with current date injection)
        ├── Attach tools (authed: 10 tools, anon: 1 tool)
        │
        ├── Try DeepSeek V3 (OpenRouter) ──► primary
        │     └── On failure ──► fallback to Haiku
        └── Or Haiku directly (if no OPENROUTER_API_KEY)
              │
              ├── Text response ──► streamed to client (filtered)
              └── Tool calls ──► dispatchTool() ──► Convex queries ──► back to model
```

---

## DeepSeek V3 — Reliability Notes

### Known Issues (as of 2026-04-27)

| Issue | Severity | Mitigation |
|-------|----------|------------|
| **Language leaking** — randomly outputs Chinese, Arabic, Bengali text mid-response | Medium | Language-matching rule in system prompt + client-side artifact filter. Not 100% reliable. |
| **Data fabrication** — invents plausible-sounding transactions, dates, amounts not in tool results | High | "Never fabricate" rule in system prompt + `INSTRUCTION` field injected into tool results. Mostly effective but occasional leaks. |
| **JSON tool call leaks** — outputs raw JSON `{"category":"billing",...}` as text instead of proper function calls | Medium | Client-side regex filter strips JSON blocks, tool separators. Final cleanup on message complete. |
| **Ignores instructions** — sometimes ignores "do not create tickets" or "use pre-computed numbers" rules | Low | Removed `create_support_ticket` from tool list entirely (can't call what doesn't exist). Pre-computed summaries reduce need for AI reasoning. |
| **Over-asking clarifying questions** — asks 3-4 questions before acting, even when told "max 1" | Low | Decision tree in system prompt maps common questions to exact tool+field. Reduced but not eliminated. |

### Why DeepSeek Despite Issues?

- **72% cheaper** than Haiku ($0.0009 vs $0.0032 per message)
- FAQ balloons handle 70-80% of questions with zero API calls
- Pre-computed summaries mean the AI just reads numbers, rarely needs to reason
- Guardrails (anti-fabrication, no-math, decision tree) catch most issues
- Haiku available as automatic fallback if DeepSeek errors

### If Quality Becomes Unacceptable

To switch primary to Haiku, set `OPENROUTER_API_KEY` to empty in env. The route automatically falls back to Haiku when no OpenRouter key is set. Cost increases ~3.5x.

---

## File Map

| File | Purpose |
|------|---------|
| `components/support-chat/SupportChatWidget.tsx` | Client widget — UI, categorized FAQ, follow-up suggestions, thumbs up/down, JSON leak filter, `#nav:` link handler |
| `app/api/support/chat/route.ts` | Server route — auth, rate limit, DeepSeek/Haiku streaming, tool loop, session persistence, error-fallback ticket |
| `lib/openrouter.ts` | OpenRouter client for DeepSeek V3, Anthropic→OpenAI format adapters |
| `lib/support/anthropic.ts` | Anthropic client singleton, model config constants (Haiku fallback) |
| `lib/support/systemPrompt.ts` | System prompt builder — rules, date injection, decision tree, anti-fabrication guardrails |
| `lib/support/tools.ts` | Tool definitions (10 authed + 1 anon) + `dispatchTool()` + MODEL_PRICING table |
| `convex/supportChat.ts` | Convex mutations/queries — sessions, messages, rate limits |
| `convex/supportTools.ts` | Convex queries for tool calls — profile, subscription (from credits_balance.ownerPlan), credits, invoices, generations |

---

## Client Widget (`SupportChatWidget.tsx`)

### Props
- `variant: "landing" | "studio"` — determines system prompt context hint
- `onNavigate?: (navKey: string) => void` — called when user clicks `#nav:` links (e.g. navigate to Support page)

### State
- `messages` — array of `{ id, role, content, isStreaming?, isError?, rating? }`
- `sessionId` — Convex session ID (authed users only)
- `faqPath` — decision tree navigation stack
- `faqCategory` — selected category tab (FAQ, How to, Models, My Account, Support)
- `faqSearch` — search filter text
- `streaming` — whether a response is in progress
- `activeTool` — name of tool currently being called

### FAQ Categories (balloon tabs)

| Category | Icon | Auth | Type | Content |
|----------|------|------|------|---------|
| FAQ | 💬 | All | Hardcoded | Product, credits, pricing, teams, privacy |
| How to | 📖 | All | Hardcoded | Element Library, Canvas, Script, Video Editor, etc. |
| Models | 🤖 | All | Hardcoded | Per-model pricing + tips (NB2, GPT, Seedance, Z-Image, etc.) |
| My Account | 👤 | Signed-in | AI (askAI) | Balance, spending, plan, refunds, invoices, generation failures |
| Support | 🎫 | Signed-in | Hardcoded + AI | Refund policy, bug diagnosis tree, contact support → `#nav:support` links |

**My Account** balloons send the question to the AI via `sendMessage(overrideMessage)`.
**Support** balloons guide users through self-service diagnosis before showing ticket links.

### Proactive Follow-up Suggestions

After AI answers, clickable chips appear based on keyword matching:
- "balance" → suggests: spending, buy credits, plan
- "spend/spent" → suggests: balance, refund, invoices
- "refund" → suggests: generation fail, refund check, invoices
- "fail/error" → suggests: refund, generation fail, balance
- 7 keyword patterns total

### Thumbs Up/Down Rating

Every completed assistant message shows small 👍/👎 buttons. Rating stored on the message object (ready for persistence to DB).

### JSON Leak Filter

DeepSeek sometimes outputs tool calls as text. Client-side filter:
1. **Streaming filter** — strips JSON blocks, tool separators from each delta
2. **Final cleanup** — on message complete, regex removes any remaining artifacts
3. Patterns: `` ```json {...}``` ``, standalone `{"key":"value"}`, `<|tool_sep|>` markers

### In-App Navigation Links

FAQ text uses `#nav:support` links. Click handler intercepts these and calls `onNavigate("support")` to navigate within the studio without page reload. Chat widget closes after navigation.

---

## System Prompt (`lib/support/systemPrompt.ts`)

### Structure
```
SHARED_RULES          — role, tone, safety, confidentiality, LANGUAGE MATCHING
dateContext            — "Today is 2026-04-27. Month start is 2026-04-01."
PRODUCT_FACTS         — what Storytica is, models, pricing summary
KNOWLEDGE_BASE_RULES  — always search KB first for factual questions
AUTHED_EXTRAS         — anti-fabrication rule, no-math rule, decision tree (10 patterns)
  or ANON_EXTRAS      — no account tools, encourage signup
ESCALATION_RULES      — diagnose first, direct to Support page (no AI ticket creation)
variantHint()         — context: landing page vs studio
```

### Key Rules (added 2026-04-27)

- **Language matching** — "ALWAYS reply in the same language the user writes in"
- **Current date injection** — dynamic today + month start so "this month" works
- **Never fabricate** — every number, date, transaction must come from a tool result
- **Never do math** — use pre-computed summary fields directly
- **Decision tree** — 10 common questions mapped to exact tool + field
- **No ticket creation** — AI cannot create tickets, directs users to Support page
- **INSTRUCTION field** — injected into tool results: "ONLY use exact numbers below"

### Decision Tree (common questions → tool + field)

| User asks | Tool | Read field |
|-----------|------|------------|
| "How many credits?" | `get_my_credit_balance` | `balance` |
| "How much spent this month?" | `list_my_credit_transactions` + `since_date` | `summary.netCreditsUsed` + `breakdownByCategory` |
| "What plan am I on?" | `get_my_subscription` | `plan`, `planName` |
| "Did I get a refund?" | `list_my_credit_transactions` | `summary.totalCreditsRefunded` |
| "Why did generation fail?" | `list_my_recent_generations` + `list_my_credit_transactions` | Both (analyze covers refund entries) |
| "How much does X cost?" | `get_ai_model_pricing` | Quote pricing text directly |
| "Show invoices" | `list_my_invoices` | List each row |
| "Why balance changed?" | `list_my_credit_transactions` | `recentTransactions` (exact data only) |
| "I want a refund" | `list_my_credit_transactions` | Check auto-refunds → direct to Support page |
| "Report a bug" | Diagnose with tools | Direct to Support page if unresolved |

---

## Tools (`lib/support/tools.ts`)

### Anon Tools (1)
| Tool | Purpose |
|------|---------|
| `search_knowledge_base` | Query team-curated KB articles |

### Authed Tools (10 — `create_support_ticket` removed)
| Tool | Purpose | Inputs |
|------|---------|--------|
| `get_my_profile` | Name, email, account date, blocked status | — |
| `get_my_subscription` | Plan (from credits_balance.ownerPlan), status, renewal | — |
| `get_my_credit_balance` | Current credit balance | — |
| `list_my_credit_transactions` | Ledger entries with pre-computed summary | `limit?` (1-1000), `since_date?` (ISO) |
| `get_ai_model_pricing` | Credit costs from MODEL_PRICING table (28 models) | `model_name?` |
| `list_my_recent_generations` | Recent storyboard generations with status | `limit?` (1-20) |
| `get_generation_details` | Detailed status for one generation | `item_id` |
| `list_my_invoices` | Billing history / receipts | `limit?` (1-10) |
| `list_my_support_tickets` | Existing tickets with status | — |
| `search_knowledge_base` | Query KB articles | `query` |

**Note:** `create_support_ticket` was removed from AI tools. Users create tickets through the Support page. The tool dispatch code still exists for the error-fallback auto-ticket flow (server-side only, when the AI pipeline crashes).

### Credit Transaction Tool — Pre-computed Output

The `list_my_credit_transactions` tool returns:

```json
{
  "INSTRUCTION": "ONLY use exact numbers below...",
  "period": "Since 2026-04-01",
  "summary": {
    "totalCreditsDeducted": 6614,
    "totalCreditsRefunded": 1342,
    "netCreditsUsed": 5272,
    "usageTransactionCount": 329
  },
  "breakdownByCategory": [
    { "category": "AI Video Generation", "creditsSpent": 5299, "creditsRefunded": 1169, "netCredits": 4130 },
    ...
  ],
  "recentTransactions": [ ... last 20 usage/refund rows ... ]
}
```

The AI reads `summary` and `breakdownByCategory` directly — no arithmetic needed.

### MODEL_PRICING Table (28 models)

Hardcoded from `lib/storyboard/pricing.ts`. Includes exact credit costs for all models:
- Image: NB2, NB Pro, Z-Image (1 cr), GPT Image 2, Character Edit, NB Edit, etc.
- Video: Seedance 1.5/2.0/2.0 Fast, Kling 3.0, Veo 3.1, Grok, Lip Sync
- Audio: Music, Cover Song, Extend, TTS
- Utility: AI Analyze (image/video/audio), Prompt Enhance

### Category Normalization (`normalizeCategory`)

Maps varied reason strings to consistent categories for spending breakdowns:
- `"AI video generation with seedance-1.5"` → "AI Video Generation"
- `"AI Generation Failed - video.mp4"` → "AI Video Generation" (inferred from .mp4 extension)
- `"AI Analyze video — refund (failed)"` → "AI Analyze Video"
- `"Refund: Cover song failed"` → "AI Cover Song"

---

## Database (Convex)

### Tables
| Table | Purpose |
|-------|---------|
| `support_chat_sessions` | One per conversation (userId, variant, messageCount, tokens) |
| `support_chat_messages` | Message history (role, content, toolCalls, tokens) |
| `support_chat_rate_limits` | Hourly rate limiting by key |

### Key Index (added 2026-04-27)
- `credits_ledger.by_companyId_createdAt` — compound index for efficient date-range credit queries

### Subscription Source
- `getActiveSubscription` reads `credits_balance.ownerPlan` (set by Clerk webhook), NOT `org_subscriptions` (empty/legacy table)

---

## Configuration

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | No* | DeepSeek V3 access. If missing, falls back to Haiku. |
| `ANTHROPIC_API_KEY` | Yes | Haiku fallback |
| `SUPPORT_INTERNAL_SECRET` | Yes | Authenticates tool calls to Convex |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex backend URL |

*Set to empty to force Haiku-only mode.

### Constants
| Constant | Value | Location |
|----------|-------|----------|
| `DEEPSEEK_MODEL` | `deepseek/deepseek-chat-v3-0324` | `lib/openrouter.ts` |
| `SUPPORT_MODEL` | `claude-haiku-4-5` | `lib/support/anthropic.ts` |
| `MAX_TOKENS` | `4096` | `lib/support/anthropic.ts` |
| `MAX_TOOL_ITERATIONS` | `8` | `lib/support/anthropic.ts` |

### Rate Limits
| User type | Limit | Window |
|-----------|-------|--------|
| Authed | 30 messages | per hour |
| Anon | 10 messages | per hour |

---

## Cost Optimization

### FAQ Balloons (biggest saving)
- 5 category tabs with ~60+ FAQ paths — zero API calls
- Covers: pricing, models, credits, features, teams, privacy, how-to, bug diagnosis
- **Estimated 70-80% reduction** in AI calls

### Pre-computed Summaries
- Credit totals computed server-side in `dispatchTool()`
- AI reads numbers, never calculates
- Eliminates math errors from DeepSeek

### MODEL_PRICING Table
- 28 models with exact prices from `pricing.ts`
- AI quotes from table, never guesses costs

### Prompt Caching (Haiku fallback)
- `cache_control: { type: "ephemeral" }` on system prompt and last message

---

## Error Handling

### Graceful Degradation
When AI pipeline fails completely:
1. Auto-creates support ticket with user's message (server-side only)
2. Streams friendly fallback message with ticket number
3. Persists to session history

### DeepSeek → Haiku Fallback
If DeepSeek request throws, route catches and retries with Haiku. Logged as `[support-chat] DeepSeek failed, falling back to Haiku`.

---

## Extending the Chatbot

### Adding a new tool
1. Add tool name to `ToolName` union in `lib/support/tools.ts`
2. Add tool definition to `AUTHED_TOOLS` array
3. Add `case` to `dispatchTool()` switch
4. Add Convex query in `convex/supportTools.ts`
5. Update decision tree in `systemPrompt.ts` if it's a common question

### Adding FAQ questions
1. Add to appropriate category in `FAQ_CATEGORIES` in `SupportChatWidget.tsx`
2. For AI-powered questions: set `askAI: true`
3. For ticket links: use `#nav:support` URLs
4. Update `FOLLOW_UP_MAP` if the question should appear as a suggestion

### Changing the primary model
- Remove `OPENROUTER_API_KEY` from env to force Haiku
- Or change `DEEPSEEK_MODEL` in `lib/openrouter.ts` to another OpenRouter model

---

## Implementation Checklist

### Phase 1 — Model Routing
- [x] Create `lib/openrouter.ts` — OpenRouter client for DeepSeek V3
- [x] Add `OPENROUTER_API_KEY` to `env.example`
- [x] Switch Support chat from Haiku to DeepSeek V3 (with Haiku fallback)
- [x] Switch Director chat to DeepSeek V3 for `mode=director`
- [x] Keep Agent chat on Haiku for `mode=agent` + vision tasks
- [x] Test: Support chat answers FAQ/billing questions correctly on DeepSeek
- [x] Fix: Credit spending query (compound index, sinceMs, limit 500)
- [x] Fix: Pre-computed summaries (no AI math)
- [x] Fix: Plan detection (credits_balance.ownerPlan)
- [x] Fix: Model pricing table (28 models from pricing.ts)
- [x] Fix: Anti-fabrication guardrails + decision tree
- [x] Fix: Language matching + date injection
- [x] Fix: JSON leak filter (client-side)
- [x] Add: Categorized FAQ balloons (5 tabs)
- [x] Add: Proactive follow-up suggestions
- [x] Add: Thumbs up/down rating
- [x] Add: Guided bug report / refund diagnosis tree
- [x] Add: In-app navigation via #nav: links
- [x] Remove: create_support_ticket from AI tools (users go to Support page)

### Phase 2 — Message Usage Limits
- [ ] Add daily message counter for Director (Convex table/field)
- [ ] Add monthly message counter for Agent seats (Convex table/field)
- [ ] Add teaser counter for Agent (30 free msgs/month for Pro/Business without seat)
- [ ] UI: message count display in chat header
- [ ] UI: progress bar with amber warning at 80%
- [ ] UI: limit-reached message with reset time
- [ ] Agent overflow: seamless 1 credit/msg deduction after cap

### Phase 3 — Future Improvements
- [ ] Persist thumbs up/down ratings to Convex for analytics
- [ ] Satisfaction dashboard (% positive, worst-rated questions)
- [ ] Conversation memory across sessions (returning user context)
- [ ] Invoice integration (pull from Stripe/Clerk billing data)
- [ ] Consider switching primary to Haiku if DeepSeek quality unacceptable
