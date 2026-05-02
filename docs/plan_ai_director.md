# AI Director + Agent — Architecture & Status

> **Status:** Built — system prompt + tools updated (Session #33), end-to-end testing pending
> **Last updated:** 2026-05-02 (Session #33)
> **Model:** Claude Haiku 4.5 (Director + Agent + Vision) — Claude API only

---

## What It Is

Two AI modes embedded in the storyboard studio:

**AI Director** — Free creative advisor for all Pro+ users. Reads your project, writes prompts, analyzes images, suggests camera angles and lighting, plans shot lists, creates scene breakdowns. Cannot trigger generation — the user clicks "Generate" manually.

**AI Agent** — Autonomous executor ($120/seat/month). Everything Director does + triggers image/video generation, post-processing, uses element references for character consistency, loads prompt templates and presets. Always shows a plan with credit costs before executing.

**Director is the free teaser. Agent is the product.**

---

## Tool Inventory (24 tools)

### Director Tools (14 — free for Pro+)

| Tool | Category | What it does |
|------|----------|-------------|
| `get_project_overview` | Read | Project context: scenes, frames, style, genre, elements, script |
| `get_scene_frames` | Read | All frames in a scene with prompts/status |
| `get_frame_details` | Read | Full frame details + imageUrl, videoUrl, audioUrl |
| `get_element_library` | Read | Elements with referenceUrls + primaryIndex (primary variant) |
| `update_frame_prompt` | Write | Improve image and/or video prompts with @ElementName |
| `update_frame_notes` | Write | Add director notes to frames |
| `update_project_style` | Write | Set genre preset + format preset + style prompt |
| `create_frames` | Write | Batch create frames in an existing scene |
| `batch_update_prompts` | Write | Bulk prompt improvements across multiple frames |
| `analyze_frame_image` | Vision | Look at generated image, give visual feedback |
| `suggest_shot_list` | Plan | Shot list recommendation by scene type (action/dialogue/reveal/opening/drama) |
| `generate_scene` | Plan | Create a complete scene in one call — auto-assigns scene_id |
| `get_model_recommendations` | Knowledge | Model suggestions by category |
| `search_knowledge_base` | Knowledge | KB search for tips/guides |

### Agent Tools (10 — seat required)

| Tool | Category | What it does | Credits |
|------|----------|-------------|---------|
| `get_credit_balance` | Read | Check org credit balance | Free |
| `get_model_pricing` | Read | Compare model costs | Free |
| `get_prompt_templates` | Read | Load proven prompts by type | Free |
| `get_presets` | Read | Load camera angles, color palettes, pill bar presets | Free |
| `browse_project_files` | Read | Find uploaded/generated files | Free |
| `enhance_prompt` | Execute | Rough prompt → cinematic detailed prompt | ~1 cr |
| `create_execution_plan` | Plan | Show plan with cost, approve/cancel | Free |
| `trigger_image_generation` | Execute | Generate image with reference element/frame | 1-18 cr |
| `trigger_video_generation` | Execute | Generate video from frame image | 5-90 cr |
| `trigger_post_processing` | Execute | Enhance, relight, remove BG, reframe | 1-7 cr |

---

## Model Routing

### Decision: Claude Haiku 4.5 for all Director/Agent modes

Director and Agent use the **Claude API exclusively** — required for the Claude Agent Skills architecture path (see below). DeepSeek V3 stays only for the Support chatbot (FAQ/billing, no tool chaining complexity).

| Feature | Model | Cost/msg | Why |
|---------|-------|----------|-----|
| Support Chat | DeepSeek V3 (via OpenRouter) | $0.0016 | FAQ, billing — separate system, no skills architecture |
| Director | Claude Haiku 4.5 (Anthropic SDK) | $0.006 | Claude Skills compatible, reliable tool use |
| Agent | Claude Haiku 4.5 (Anthropic SDK) | $0.006 | Credits at stake, reliable 24-tool chaining |
| Vision | Claude Haiku 4.5 (Anthropic SDK) | $0.006 | Vision support built-in |

### Agent Seat Economics (Haiku-only)

| Scale | Monthly cost | Margin on $120 seat |
| ----- | ------------ | ------------------- |
| 5,000 msgs/month (cap) | $30 | 75% |
| 3,000 msgs/month (typical) | $18 | 85% |

After cap: 1 credit/msg overflow (seamless, no hard lock).

---

## Architecture

### Request Flow

```
DirectorChatPanel (React, docked right side)
  |
  POST /api/director/chat  { projectId, message, mode, currentFrameNumber }
  |  SSE streaming
  v
route.ts (server)
  |
  +-- Auth check (Clerk)
  +-- Load project context → inject into system prompt
  +-- Load conversation history (last 20 from Convex)
  +-- Select tools via getToolsForMode(mode)
  +-- Both modes → Claude Haiku 4.5 (Anthropic SDK)
  |
  v
Claude Haiku 4.5
  |
  +-- Text response → streamed via SSE
  +-- Tool calls → dispatchDirectorTool() → Convex / API routes → back to LLM
  +-- Plan approval → plan_approval SSE event → UI shows Approve/Cancel card
  +-- Up to 8 tool iterations per message
```

### SSE Events

```
data: {"type":"text","delta":"Let me look at your project..."}
data: {"type":"tool_call","name":"get_project_overview"}
data: {"type":"tool_result","name":"get_project_overview","isError":false}
data: {"type":"text","delta":"Your project has 8 scenes..."}
data: {"type":"plan_approval","steps":[...],"totalCredits":30,"balance":500}
data: {"type":"done"}
```

### Chat Persistence

- `director_chat_sessions` table: one session per user per project
- Stores last 50 messages with tool call logs
- Frontend shows last 10 messages + "Load previous" button
- Backend sends last 20 to LLM for context regardless of UI

### Async Task Queue (for future use)

- `agent_tasks` table: stores execution plans with step-by-step status
- `director_analytics` table: tool calls, corrections, plan approvals/rejections
- Future: Kie callback can wake agent to continue next step

---

## File Structure

```
lib/director/
  agent-tools.ts          -- 24 tool definitions + getToolsForMode()
  tool-executor.ts        -- dispatchDirectorTool() — all tool implementations
  system-prompt.ts        -- buildDirectorSystemPrompt() + buildAgentSystemPrompt()
  constants.ts            -- Model knowledge, shot types, camera movements

app/api/director/
  chat/route.ts           -- SSE streaming, mode routing, plan approval events

convex/
  directorChat.ts         -- Session CRUD (getOrCreate, append, clear)
  agentTasks.ts           -- Task queue CRUD + analytics logging
  schema.ts               -- director_chat_sessions, agent_tasks, director_analytics

components/director/
  DirectorChatPanel.tsx   -- Chat UI: mode toggle, plan cards, history, persistent chip strip, quick actions
```

### Claude Agent Skills — Future Refactor

The current flat-file structure (`lib/director/`) is functionally equivalent to the Claude Agent Skills pattern. Planned migration after end-to-end testing:

```text
skills/
  director-agent/
    instructions.md    ← system-prompt.ts content
    tools.json         ← agent-tools.ts definitions
    examples/          ← example conversations (samurai story, car commercial, etc.)
    genres/            ← genre-specific prompt snippets
  support-agent/
    instructions.md    ← lib/support/systemPrompt.ts content
    tools.json         ← lib/support/tools.ts definitions
    knowledge/         ← static FAQ, pricing, policies
```

**Why defer:** Agent Skills migration is pure refactoring — no user-facing change. Test the agent first, migrate after it's proven.

---

## Pricing Model (DECIDED)

**Brain = seat. Hands = credits.**

| Plan | Director | Agent Teaser | Agent Seats |
| ---- | -------- | ------------ | ----------- |
| Free | No | No | No |
| Pro ($45/mo) | Free, unlimited | 30 msgs/month | Buy up to 1 ($120/mo) |
| Business ($119/mo) | Free, unlimited | 30 msgs/month | Buy up to 3 ($120/mo each) |
| Ultra ($299/mo) | Free, unlimited | — | 1 included + up to 5 ($120/mo each) |

Agent conversations covered by seat. Generation triggered by agent costs credits from org pool (same pricing as manual generation).

### Implementation needed (deferred until agent is proven)

- Agent seat table + Stripe add-on subscription
- Seat assignment UI in org owner dashboard
- Teaser counter (30 msgs/month, resets monthly)
- Overflow billing (1 credit/msg after cap)

---

## Competitive Position

| Aspect | Higgsfield Mr. Higgs | Our AI Director + Agent |
| ------ | -------------------- | ----------------------- |
| Advises on prompts | Yes | Yes + filmmaking rationale + shot planning |
| Triggers generation | No | Yes (Agent Mode) |
| Plan approval | No | Yes — shows cost before executing |
| Character consistency | Soul ID | Element @mention + referenceUrls at generation |
| Prompt templates | No | Yes — loads from workspace library |
| Camera/style presets | Limited | Full pill bar (Camera/Angle/Motion/Speed/Palette) |
| Post-processing | No | Yes — enhance, relight, remove BG, reframe |
| Vision analysis | No | Yes — looks at generated images |
| Project context | Per-shot | Full project (scenes, frames, elements, genre, style) |
| Conversation history | Unclear | Persistent per project, loads on reopen |
| Shot list planning | No | Yes — `suggest_shot_list` by scene type |
| Build scene from premise | No | Yes — `generate_scene` one-call scene creation |
| Autonomous workflows | No | Yes — "build me a 6-frame story" end-to-end |

**No competitor has an AI that both advises and executes within full project context.**

---

## Studio Context (updated 2026-05-02 Session #33 — ALL DONE)

All items below are now reflected in the system prompt (`lib/director/system-prompt.ts`) rewritten in Session #33:

| Area | Status | What the agent now knows |
| ---- | ------ | ------------------------ |
| **Genre system** | ✅ Done | 16 presets, `update_project_style(genre_preset=)`, pairing examples |
| **Format system** | ✅ Done | 12 presets, independent axis from genre, `update_project_style(format_preset=)` |
| **Pill bar** | ✅ Done | Camera/Angle/Motion/Speed/Palette — agent references by pill bar category names |
| **Element @mention** | ✅ Done | Always uses `@ElementName` in prompts; explains auto-attach pipeline |
| **Element Forge** | ✅ Done | Primary variant as identity sheet; `referenceUrls[primaryIndex]` |
| **Post-processing** | ✅ Done | Full table: Enhance/Relight/Remove BG/Reframe/Inpaint/Upscale with credits |
| **Script pipeline** | ✅ Done | Agent knows Build Storyboard, Extend Story, `create_frames` workflow |
| **New tools** | ✅ Done | `suggest_shot_list` + `generate_scene` added to Director tool set |

---

## Roadmap

### Phase 1 — Core Complete (Session #33 ✅)

- [x] 24 tools built and implemented
- [x] System prompt rewritten with full studio context
- [x] `suggest_shot_list` + `generate_scene` tools added
- [x] `update_project_style` supports genre + format + style
- [ ] End-to-end test: "build me a 6-frame story about a samurai at dawn"
- [ ] Tune system prompt from real agent behavior

### Phase 2 — Newbie Quick Create (after Phase 1 proven)

Zero-friction entry: type one sentence → full storyboard generated automatically.

- [ ] Empty project magic wand UI (big textarea + genre/format pickers when 0 frames)
- [ ] `POST /api/director/quick-create` — silent agent loop, no chat UI
- [ ] Uses `generate_scene` + `trigger_image_generation` under the hood
- [ ] Progress bar → redirect to finished storyboard

### Phase 3 — Advanced Director Tools

- [ ] `check_continuity` — character/prop/lighting consistency across frames
- [ ] `batch_fix_frames` — re-prompt all frames from a style note
- [ ] `analyze_emotional_arc` — pacing review across scenes
- [ ] `audit_style_drift` — flag frames drifting from project genre
- [ ] `apply_director_reference` — "shoot like Blade Runner 2049"
- [ ] `check_coverage` — confirm all story beats are covered
- [ ] `create_shot_variations` — 3 angle variants for same moment
- [ ] `smart_animate` — suggest motion preset per frame type

### Phase 4 — Agent Skills Migration + Billing

- [ ] Migrate `lib/director/` to `skills/director-agent/` folder structure
- [ ] Agent seat table + Stripe add-on subscription
- [ ] Seat assignment UI in org owner dashboard
- [ ] Teaser counter (30 msgs/month) + overflow billing
- [ ] Message usage counters (Director daily, Agent monthly)
- [ ] Async resume (Kie callback wakes agent for long jobs)
