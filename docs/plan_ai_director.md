# AI Director + Agent — Architecture & Status

> **Status:** Built — ready for live testing
> **Last updated:** 2026-04-27 (Session #14)
> **Model:** DeepSeek V3 (Director/Support) + Claude Haiku 4.5 (Agent/Vision)

---

## What It Is

Two AI modes embedded in the storyboard studio:

**AI Director** — Free creative advisor for all Pro+ users. Reads your project, writes prompts, analyzes images, suggests camera angles and lighting. Cannot trigger generation — the user clicks "Generate" manually.

**AI Agent** — Autonomous executor ($120/seat/month). Everything Director does + triggers image/video generation, post-processing, uses element references for character consistency, loads prompt templates and presets. Always shows a plan with credit costs before executing.

**Director is the free teaser. Agent is the product.**

---

## Tool Inventory (22 tools)

### Director Tools (12 — free for Pro+)

| Tool | Category | What it does |
|------|----------|-------------|
| `get_project_overview` | Read | Project context: scenes, frames, style, elements, script |
| `get_scene_frames` | Read | All frames in a scene with prompts/status |
| `get_frame_details` | Read | Full frame details + imageUrl, videoUrl, audioUrl |
| `get_element_library` | Read | Elements with referenceUrls + thumbnailUrl |
| `update_frame_prompt` | Write | Improve image and/or video prompts |
| `update_frame_notes` | Write | Add director notes to frames |
| `update_project_style` | Write | Set project-wide style + format preset |
| `create_frames` | Write | Batch create frames in a scene |
| `batch_update_prompts` | Write | Bulk prompt improvements |
| `analyze_frame_image` | Vision | Look at generated image, give visual feedback |
| `get_model_recommendations` | Knowledge | Model suggestions by category |
| `search_knowledge_base` | Knowledge | KB search for tips/guides |

### Agent Tools (10 — seat required)

| Tool | Category | What it does | Credits |
|------|----------|-------------|---------|
| `get_credit_balance` | Read | Check org credit balance | Free |
| `get_model_pricing` | Read | Compare model costs | Free |
| `get_prompt_templates` | Read | Load proven prompts by type | Free |
| `get_presets` | Read | Load camera angles, color palettes, camera studio | Free |
| `browse_project_files` | Read | Find uploaded/generated files | Free |
| `enhance_prompt` | Execute | Rough prompt → cinematic detailed prompt | ~1 cr |
| `create_execution_plan` | Plan | Show plan with cost, approve/cancel | Free |
| `trigger_image_generation` | Execute | Generate image with reference element/frame | 1-18 cr |
| `trigger_video_generation` | Execute | Generate video from frame image | 5-90 cr |
| `trigger_post_processing` | Execute | Enhance, relight, remove BG, reframe | 1-7 cr |

---

## Model Routing

### Decision: Use DeepSeek V3 for cheap tasks, Haiku for critical tasks

| Feature | Model | Cost/msg | Why |
|---------|-------|----------|-----|
| Support Chat | DeepSeek V3 (via OpenRouter) | $0.0016 | FAQ, billing, tickets — no creativity needed |
| Director | DeepSeek V3 (via OpenRouter) | $0.0016 | Advice, simple tool calls |
| Agent | Haiku (via Anthropic SDK) | $0.006 | Credits at stake, reliable tool routing |
| Vision | Haiku (via Anthropic SDK) | $0.006 | Only Haiku supports vision |

### Agent Seat — User Chooses Model

| Model choice | Messages/month | Max cost | Margin on $120 seat |
|-------------|---------------|---------|---------------------|
| DeepSeek (default) | 7,000 | $11.20 | 91% |
| Auto (smart routing) | 6,000 | ~$15 | 87% |
| Haiku (premium) | 5,000 | $30 | 75% |

After cap: 1 credit/msg overflow (seamless, no hard lock).

### Cost savings vs Haiku-only:

| Scale | Haiku only | With DeepSeek routing | Savings |
|-------|-----------|----------------------|---------|
| 50 active Director users | $270/month | $72/month | $198/month |
| 100 Agent seats (active) | $900/month | $372/month | $528/month |

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
  +-- Select model: DeepSeek (director) or Haiku (agent)
  |
  v
Claude Haiku 4.5 / DeepSeek V3 (via OpenRouter)
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
  agent-tools.ts          -- 22 tool definitions + getToolsForMode()
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
  DirectorChatPanel.tsx   -- Chat UI: mode toggle, plan cards, history, quick actions
```

---

## Pricing Model (DECIDED)

**Brain = seat. Hands = credits.**

| Plan | Director | Agent Teaser | Agent Seats |
|------|----------|-------------|-------------|
| Free | No | No | No |
| Pro ($45/mo) | Free, unlimited | 30 msgs/month | Buy up to 1 ($120/mo) |
| Business ($119/mo) | Free, unlimited | 30 msgs/month | Buy up to 3 ($120/mo each) |
| Ultra ($299/mo) | Free, unlimited | — | 1 included + up to 5 ($120/mo each) |

Agent conversations covered by seat. Generation triggered by agent costs credits from org pool (same pricing as manual generation).

### Implementation needed (deferred):

- Agent seat table + Stripe add-on subscription
- Seat assignment UI in org owner dashboard
- Teaser counter (30 msgs/month, resets monthly)
- Overflow billing (1 credit/msg after cap)
- Model choice selector in Agent settings (DeepSeek/Haiku/Auto)

---

## Competitive Position

| Aspect | Higgsfield Mr. Higgs | Our AI Director + Agent |
|--------|---------------------|------------------------|
| Advises on prompts | Yes | Yes + filmmaking rationale |
| Triggers generation | No | Yes (Agent Mode) |
| Plan approval | No | Yes — shows cost before executing |
| Character consistency | Soul ID | Element referenceUrls passed to generation |
| Prompt templates | No | Yes — loads from workspace library |
| Camera/style presets | Limited | Full preset system (angles, lens, palettes) |
| Post-processing | No | Yes — enhance, relight, remove BG, reframe |
| Vision analysis | No | Yes — looks at generated images |
| Project context | Per-shot | Full project (all scenes, frames, elements, style) |
| Conversation history | Unclear | Persistent per project, loads on reopen |
| Model choice | Proprietary | User picks DeepSeek (cheap) or Haiku (quality) |
| Autonomous workflows | No | Yes — "build me a 6-frame story" end-to-end |

**No competitor has an AI that both advises and executes within project context.**

---

## What's Left

| Item | Priority | Status |
|------|----------|--------|
| End-to-end test with dev server | High | Next session |
| Tune system prompt from real usage | High | After testing |
| DeepSeek routing implementation | Medium | Next session |
| Billing (seats, teaser, overflow) | Later | After agent proven |
| Async resume (Kie callback wakes agent) | Low | Polish |
