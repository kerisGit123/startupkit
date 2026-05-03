# AI Director + Agent — Architecture & Status

> **Status:** Built + Script Generation live (Sessions #33–#36), end-to-end testing pending
> **Last updated:** 2026-05-03 (Session #36)
> **Models:** Haiku 4.5 default · Sonnet 4.6 for post-invoke_skill iteration + Cinematic mode

---

## What It Is

Two AI modes embedded in the storyboard studio:

**AI Director** — Free creative advisor for all Pro+ users. Reads your project, writes prompts, analyzes images, suggests camera angles and lighting, plans shot lists, creates scene breakdowns. Cannot trigger generation — the user clicks "Generate" manually.

**AI Agent** — Autonomous executor ($120/seat/month). Everything Director does + triggers image/video generation, post-processing, writes scripts via Skills API, builds full storyboards end-to-end. Always shows a plan with credit costs before executing generation.

**Director is the free teaser. Agent is the product.**

---

## Tool Inventory (26 tools)

### Director Tools (14 — free for Pro+)

| Tool | Category | What it does |
| ---- | -------- | ------------ |
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

### Agent Tools (12 — seat required)

| Tool | Category | What it does | Credits |
| ---- | -------- | ------------ | ------- |
| `get_credit_balance` | Read | Check org credit balance | Free |
| `get_model_pricing` | Read | Compare model costs | Free |
| `get_prompt_templates` | Read | Load proven prompts by type | Free |
| `get_presets` | Read | Load camera angles, color palettes, pill bar presets | Free |
| `browse_project_files` | Read | Find uploaded/generated files | Free |
| `enhance_prompt` | Execute | Rough prompt → cinematic detailed prompt | ~1 cr |
| `create_execution_plan` | Plan | Show plan with cost, approve/cancel before generation | Free |
| `trigger_image_generation` | Execute | Generate image with reference element/frame | 1–18 cr |
| `trigger_video_generation` | Execute | Generate video from frame image | 5–90 cr |
| `trigger_post_processing` | Execute | Enhance, relight, remove BG, reframe | 1–7 cr |
| `invoke_skill` | Script | Write script via Claude Agent Skills Beta (multi-act) | 6–18 cr/min |
| `save_script` | Write | Save completed script to project | Free |

---

## Model Routing

### Per-call model selection

| Situation | Model | Why |
| --------- | ----- | --- |
| All Director messages | Haiku 4.5 | Fast, cheap, sufficient for advisory |
| All Agent messages (default) | Haiku 4.5 | Tool chaining, 24 tools |
| After `invoke_skill` succeeds | Sonnet 4.6 (one iteration) | Ensures Director accurately follows "pass raw text to save_script" — upgrade auto-resets after that one call |
| `invoke_skill` with `quality: "cinematic"` | Sonnet 4.6 | User chose premium mode |
| Support chatbot | DeepSeek V3 (OpenRouter) | Separate system, no skills architecture |

### scriptMode (UI toggle → API body → system prompt)

Users pick **Quick** or **Cinematic** in the balloon area above the chat input. This is injected into the system prompt and determines which model `invoke_skill` uses:

```text
QUICK mode (default):
  → Haiku 4.5 via Skills Beta
  → 6 cr/min simple stories, 8 cr/min action/VFX stories

CINEMATIC mode:
  → Sonnet 4.6 via Skills Beta
  → 18 cr/min flat (covers higher token cost + margin)
```

### Agent Seat Economics

| Scale | Monthly cost | Margin on $120 seat |
| ----- | ------------ | ------------------- |
| 5,000 msgs/month (cap) | $30 | 75% |
| 3,000 msgs/month (typical) | $18 | 85% |

After cap: 1 credit/msg overflow (seamless, no hard lock).

---

## invoke_skill — Script Generation

### How it works

Uses the **Claude Agent Skills Beta API** (`betas: ["code-execution-2025-08-25", "skills-2025-10-02"]`). The skill reads reference files internally (video-prompt-builder), causing 31K–84K input token overhead before generating any output.

**Multi-act architecture** (solves the 20-scene problem):

- Duration ≤ 2 min → single call
- Duration > 2 min → split into 2-min acts, called sequentially
- Each act gets a continuity summary from the previous act
- Outputs merged with SCENE numbering fixed across act boundaries

```text
durationMin = parsed from brief ("5 minutes" → 5.0)
numActs = ceil(durationMin / 2)

For each act:
  → callSkillAct(originalBrief, actNum, totalActs, prevSummary)
  → extract continuity summary
  → merge with prev acts

Final: mergeActScripts([act1, act2, act3, ...])
```

### Credit pricing

```text
Quick mode (Haiku):
  - Simple story: 6 cr/min
  - Action/VFX/dragon/battle/sci-fi: 8 cr/min (detected via regex)
  - Minimum: 6 cr (under 1 min still costs minimum)

Cinematic mode (Sonnet):
  - 18 cr/min flat (covers $0.12–0.18 input token cost per call)
  - Minimum: 18 cr

Formula: max(ratePerMin, ceil(durationMin) × ratePerMin)
```

### Estimated costs shown in UI (balloon area)

| Story | Quick | Cinematic |
| ----- | ----- | --------- |
| Dragon epic 5 min | ~40 cr | ~90 cr |
| Romance 2 min | ~12 cr | ~36 cr |
| Kids adventure 1 min | ~6 cr | ~18 cr |
| Sci-fi thriller 3 min | ~24 cr | ~54 cr |
| Mystery 2 min | ~12 cr | ~36 cr |
| Fantasy 4 min | ~32 cr | ~72 cr |

---

## Visual Lock — Pricing

Scene-based pricing: `max(3, ceil(totalScenes / 10) × 3) credits`

| Script size | Scenes | Cost |
| ----------- | ------ | ---- |
| Short | 1–10 | 3 cr |
| Medium | 11–20 | 6 cr |
| Long | 21–30 | 9 cr |
| Epic | 40 scenes | 12 cr |

Pre-flight balance check: queries balance before calling Haiku. Returns HTTP 402 with error message if insufficient — avoids running API call user can't pay for.

---

## DirectorChatPanel UI

### Balloon Area (always visible above input, both modes)

A category navigation system (Home → Category → Pills) that lives above the textarea. Replaces the old empty-state-only quick actions.

**Navigation:**

- Home view: row of category pill buttons
- Category selected: `← Home · 🎬 This frame` breadcrumb + action pills (max-height scroll)
- Confirm state: amber banner replaces pills entirely

**Director mode categories:**

| Category | Pills |
| -------- | ----- |
| 📋 Storyboard | What is this storyboard about? (local), Review shot variety, Pacing check, Consistency check, Script help |
| 🎬 This frame | What is the current frame about? (local), Analyze the current image · 1cr (confirm), Camera angle advice, Lighting setup, What's wrong with this frame?, Add director notes |
| ✨ Improve | Improve all prompts, Visual style suggestion, Full storyboard review, Rewrite this frame's prompt |

**Agent mode categories:**

| Category | Pills |
| -------- | ----- |
| 📝 Write story | 6 story starters with credit estimates, Quick/Cinematic toggle inline |
| 🖼️ Generate | Generate all images, Animate all frames, Enhance all images, Smart generate plan, Build full storyboard |
| 💳 Credits | Check my credit balance (local), How much for all images? (local), Cheapest way to generate (local), Image vs video cost (local) |

### Credit confirm banner

Any pill that charges user credits shows an amber confirmation banner before executing:

```text
[pill click]
  ↓
confirmingAction state set → balloon shows:
  ┌─────────────────────────────────────────────┐
  │ 🐉 Dragon epic · 5 min · Quick mode          │
  │ This will deduct ~40 credits from your        │
  │ balance (350 cr available).                   │
  │  [Confirm · ~40cr]  [Cancel]                 │
  └─────────────────────────────────────────────┘
  ↓ confirm
sendMessage(prompt) + setQuickCategory(null)
```

- **Exact cost** (no `~`): image analyze (1 cr)
- **Estimated cost** (with `~`): write story pills (depends on actual story complexity)
- Generate pills (generate all images, animate, enhance) → **not** confirmed in balloon — the Agent's `create_execution_plan` shows exact per-frame costs in the chat first

### Local answers (zero AI cost, zero credits)

These pills read from `useQuery` data already loaded in the panel — no API call:

| Pill | Data source |
| ---- | ----------- |
| "What is this storyboard about?" | `storyItems` — frame count, scenes, image/video status, sample prompts |
| "What is the current frame about?" | `storyItems` — imagePrompt, videoPrompt, description, notes, generation status. Shows `_Not set_` if empty. Matched by `sceneId` then sorted `order`. |
| "Check my credit balance" | `api.credits.getBalance` — balance + image/video capacity |
| "How much for all images?" | `storyItems` filtered for no imageUrl/imageStorageId × model costs |
| "Cheapest way to generate" | Static pricing table |
| "Image vs video cost" | Static pricing table |

### Direct image analysis (non-Director path)

"Analyze the current image · 1cr" (when `currentFrameImageUrl` exists):

- Calls `/api/ai-analyze` directly (Gemini 2.5 Flash via OpenRouter)
- Deducts 1 credit via `api.credits.deductCredits` on confirm
- Injects result as local assistant message — no Director conversation overhead, no tool calls, no history loading
- Falls back to `handleCurrentFrameAbout()` (local data) if no image exists

---

## Architecture

### Request Flow

```text
DirectorChatPanel (React, docked right side)
  |
  POST /api/director/chat  { projectId, message, mode, scriptMode, currentFrameNumber, currentSceneId }
  |  SSE streaming
  v
route.ts (server)
  |
  +-- Auth check (Clerk)
  +-- Load project context → inject into system prompt
  +-- Load conversation history (last 20 from Convex)
  +-- Select tools via getToolsForMode(mode)
  +-- Inject scriptMode into system prompt (agent mode only):
  |     "USER SCRIPT MODE: QUICK (Haiku, 8cr/min). Always pass quality: 'quick'"
  +-- Default model: claude-haiku-4-5
  |
  v
Agentic loop (up to MAX_TOOL_ITERATIONS):
  |
  +-- Claude Haiku 4.5 (or Sonnet after invoke_skill)
  +-- Text response → streamed via SSE
  +-- Tool calls → dispatchDirectorTool() → Convex / API routes → back to LLM
  +-- plan_approval event → UI shows Approve/Cancel card in chat
  +-- invoke_skill success → nextModel = Sonnet for one iteration
  |
  v
Persist session → directorChat.appendMessages (Convex)
```

### SSE Events

```json
data: {"type":"text","delta":"Let me look at your project..."}
data: {"type":"tool_call","name":"get_project_overview"}
data: {"type":"tool_result","name":"get_project_overview","isError":false}
data: {"type":"text","delta":"Your project has 8 scenes..."}
data: {"type":"plan_approval","steps":[...],"totalCredits":30,"balance":500}
data: {"type":"done","toolsUsed":["get_project_overview","invoke_skill","save_script"]}
```

### Chat Persistence

- `director_chat_sessions` table: one session per user per project
- Stores last 50 messages with tool call logs
- Frontend shows last 10 messages + "Load previous" button
- Backend sends last 20 to LLM for context regardless of UI

---

## File Structure

```text
lib/director/
  agent-tools.ts          -- 26 tool definitions + getToolsForMode()
  tool-executor.ts        -- dispatchDirectorTool() — all tool implementations
                             invoke_skill: multi-act, credit deduction, model routing
                             save_script: saves to project
  system-prompt.ts        -- buildDirectorSystemPrompt() + buildAgentSystemPrompt()
  constants.ts            -- Model knowledge, shot types, camera movements

app/api/director/
  chat/route.ts           -- SSE streaming, scriptMode injection, model upgrade logic

convex/
  directorChat.ts         -- Session CRUD (getOrCreate, append, clear)
  agentTasks.ts           -- Task queue CRUD + analytics logging
  schema.ts               -- director_chat_sessions, agent_tasks, director_analytics

components/director/
  DirectorChatPanel.tsx   -- Chat UI: mode tabs, balloon category nav, credit confirm
                             banner, local answers, direct image analysis, plan cards
```

---

## Pricing Model (DECIDED)

**Brain = seat. Hands = credits.**

| Plan | Director | Agent Teaser | Agent Seats |
| ---- | -------- | ------------ | ----------- |
| Free | No | No | No |
| Pro ($45/mo) | Free, unlimited | 30 msgs/month | Buy up to 1 ($120/mo) |
| Business ($119/mo) | Free, unlimited | 30 msgs/month | Buy up to 3 ($120/mo each) |
| Ultra ($299/mo) | Free, unlimited | — | 1 included + up to 5 ($120/mo each) |

Agent conversations covered by seat. Generation triggered by agent costs credits from org pool (same pricing as manual generation). `invoke_skill` credits charged on success only.

---

## Competitive Position

| Aspect | Higgsfield Mr. Higgs | Our AI Director + Agent |
| ------ | -------------------- | ----------------------- |
| Advises on prompts | Yes | Yes + filmmaking rationale + shot planning |
| Triggers generation | No | Yes (Agent Mode) |
| Plan approval | No | Yes — shows cost before executing |
| Script writing | No | Yes — invoke_skill, multi-act, Quick/Cinematic |
| Character consistency | Soul ID | Element @mention + referenceUrls at generation |
| Prompt templates | No | Yes — loads from workspace library |
| Camera/style presets | Limited | Full pill bar (Camera/Angle/Motion/Speed/Palette) |
| Post-processing | No | Yes — enhance, relight, remove BG, reframe |
| Vision analysis | No | Yes — direct Gemini 2.5 Flash, 1cr, instant |
| Project context | Per-shot | Full project (scenes, frames, elements, genre, style) |
| Conversation history | Unclear | Persistent per project, loads on reopen |
| Shot list planning | No | Yes — `suggest_shot_list` by scene type |
| Build scene from premise | No | Yes — `generate_scene` one-call scene creation |
| Autonomous workflows | No | Yes — "build me a 6-frame story" end-to-end |

**No competitor has an AI that both advises and executes within full project context.**

---

## Honest Self-Assessment (Session #36)

> Rated before end-to-end testing. Goal: know exactly what to fix before charging real money.

| Area | Score | Verdict |
| ---- | ----- | ------- |
| Architecture & backend | 8/10 | SSE streaming, tool chaining, prompt caching, model upgrade, multi-act — all solid |
| UI/UX | 7/10 | Balloon nav, credit confirm, local answers are good. invoke_skill spinner (30–60s, no progress) is weak |
| Pricing logic | 7.5/10 | Margin analysis rigorous. Quick/Cinematic, scene-based Visual Lock, per-pill estimates, pre-flight 402 |
| Completeness | 5/10 | Too many untested paths, no seat billing, two vision paths diverging |
| **Overall** | **6.5/10** | **Good enough to demo. Not ready to charge for Agent mode.** |

### Gaps that block monetisation

**Critical — fix before charging for Agent:**

- **Agent seat billing does not exist.** Agent mode is effectively free. No paywall, no teaser counter, no seat table.
- **End-to-end flow never tested.** The full "write me a dragon story → `invoke_skill` → `save_script` → `build_storyboard`" path has not been run once in production.
- **`invoke_skill` 30–60s blank spinner.** User sees "Building script..." with no progress signal. For the most expensive action in the product, this is bad UX.

**Should fix before real users:**

- **Two separate vision paths diverging.** `analyze_frame_image` tool (Director, via tool executor) vs direct `/api/ai-analyze` (balloon pill, Gemini 2.5 Flash). They return different formats, charge differently, have no shared error handling.
- **Director advisory questions have no rate limiting.** Each Director message costs us ~$0.006 Haiku API with no cost recovery on free plan. At scale, heavy Director users are loss-making.
- **20-message hardcap is a blunt instrument.** No conversation compression or smart summarisation — long sessions lose context abruptly at the 20-message window.
- **System prompt not tuned from real sessions.** Written speculatively; actual agent behaviour under real prompts is unknown.

**Polish / nice to have:**

- `quickCategory` persists when navigating between frames — balloon shows stale category breadcrumb
- No error recovery for partial `invoke_skill` failures mid-multi-act
- No typing indicator during local-answer computation (instant, but visually jarring)

---

## Session History

### Session #33 — Core build ✅

- 24 tools built and implemented
- System prompt rewritten with full studio context
- `suggest_shot_list` + `generate_scene` tools added
- `update_project_style` supports genre + format + style

### Session #36 — Script generation + balloon UX ✅

- `invoke_skill` tool: multi-act architecture, Quick/Cinematic pricing, complexity detection
- `save_script` tool added
- `quality` parameter on invoke_skill: "quick" | "cinematic"
- After invoke_skill success → upgrade to Sonnet 4.6 for one iteration
- Visual Lock: scene-based pricing `ceil(scenes/10) × 3cr`, pre-flight balance check
- DirectorChatPanel: full balloon category nav redesign (Home → Category → Pills)
- Director categories: Storyboard, This frame, Improve
- Agent categories: Write story (with credit estimates), Generate, Credits
- Credit confirm banner: any deduction-causing pill shows cost + balance before proceeding
- Local answers (zero credits): storyboard overview, current frame about, credits calc
- Direct image analysis: `/api/ai-analyze` (Gemini 2.5 Flash, 1cr, confirm required)
- `handleCurrentFrameAbout`: reads imagePrompt + videoPrompt from storyItems, shows `_Not set_`
- Write story pills show estimated credit cost per scriptMode, confirm before sendMessage

---

## Roadmap

### Phase 1 — Core Built, Pre-launch Gaps Remain

- [x] 26 tools built and implemented
- [x] System prompt rewritten with full studio context
- [x] invoke_skill: multi-act script generation, tiered pricing
- [x] Balloon category nav with credit confirm pattern
- [x] Local answers (zero AI cost) for data-lookup pills
- [ ] **BLOCKER:** End-to-end test — "write me a dragon story" → invoke_skill → save_script → build_storyboard
- [ ] **BLOCKER:** Agent seat billing + paywall (currently free for all)
- [ ] invoke_skill progress signal — stream act-by-act status instead of blank spinner
- [ ] Unify vision paths — one shared route used by both Director tool and balloon pill
- [ ] Director rate limiting — daily message cap for free-plan users
- [ ] Conversation compression — smart summarise beyond the 20-message window
- [ ] Tune system prompt from real agent behaviour

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
