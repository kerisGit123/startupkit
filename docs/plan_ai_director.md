# AI Director + Agent — Architecture & Status

> **Status:** Built + Script Generation live (Sessions #33–#41), pipeline production-ready
> **Last updated:** 2026-05-05 (Session #41)
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
| `get_frame_details` | Read | Full frame details (hasImage/hasVideo/hasAudio booleans — URL strings excluded) |
| `get_element_library` | Read | Elements with hasImage + imageCount (referenceUrls excluded — agent uses element name to trigger generation) |
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
  +-- Load conversation history (last 20 from Convex, last 10 messages sent to LLM)
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
  +-- Tool results capped at 1200 chars in currentMessages (full output used in current iteration)
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
data: {"type":"quick_actions","actions":[{"label":"Generate all","message":"..."}]}
data: {"type":"open_batch_generate"}
data: {"type":"done","toolsUsed":["get_project_overview","invoke_skill","save_script"]}
```

`open_batch_generate` — emitted by `route.ts` immediately after `invoke_skill` returns `framesCreated > 0`. `DirectorChatPanel` handles it via `onOpenBatchGenerate` prop → `page.tsx` opens `BatchGenerateDialog` directly. No Director round-trip needed for the most common post-build action.

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

## Honest Self-Assessment (Session #41)

> Sessions #39–#41: reliability pass + extend flow + post-build UX + script cleanup + runtime bug fixes. Core pipeline production-ready.

| Area | Score | Verdict |
| ---- | ----- | ------- |
| Architecture & backend | 9/10 | Extend flow complete: story context injection, script append, element dedup, semantic name matching, frame offset, preamble error gate, batch generate SSE event. |
| UI/UX | 8.5/10 | Replace/extend confirmation, credit estimate, skeleton cards, draft status, per-frame Generate + Regenerate, Clean Script button, batch generate auto-opens after build. |
| Pricing logic | 8/10 | Credit estimate before `invoke_skill`. Credit usage surfaced in return payload (`creditsUsed`). |
| Completeness | 7.5/10 | E2E flow validated. `BatchGenerateDialog` opens automatically post-build. Stripe still not wired — zero self-serve monetisation. Vision paths still diverge. |
| **Overall** | **8.3/10** | **Agent pipeline production-ready for demo and manual seat sales. Remaining gaps are monetisation + scale, not core functionality.** |

### Gaps that block full self-serve monetisation

**High priority (next session):**

- **Stripe integration for agent seat add-on** — `agentModeEnabled` must be toggled automatically on `customer.subscription.created/deleted`. Currently requires manual Convex dashboard edit. `setAgentAccess` mutation exists — only Stripe wiring is missing.

**Should fix before scale:**

- **Two separate vision paths diverging.** `analyze_frame_image` tool (Director, via tool executor) vs direct `/api/ai-analyze` (balloon pill, Gemini 2.5 Flash). They return different formats, charge differently, have no shared error handling.
- **Director/Agent API usage has no credit offset.** A full story-build session costs ~$0.30–$0.50 in Haiku API with no cost recovery. At scale, heavy users are loss-making.
- **20-message hardcap is a blunt instrument.** No conversation compression — long sessions lose context abruptly.
- **Orphaned R2 URLs in `referenceUrls`.** Files deleted from R2 but URL still in DB → `ThumbnailCropper` shows "Image could not be loaded" fallback. Orphan cleanup cron should null out stale entries on delete.

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

### Session #39 — Extend story flow + pipeline reliability ✅

**Script pipeline hardened:**

- Preamble strip: `callSkillAct` output now strips everything before the first `SCENE N` block — chatty skill commentary never reaches the DB or parser
- SKILL.md format fixed: scene blocks use `SCENE N`, `Image Prompt:`, `Video Prompt:` (no `###` prefix, no bold emoji) — `parseStructuredScript` now reliably fires instead of falling back to freeform Haiku
- Old `### SCENE` patterns in `tool-executor.ts` updated to handle both old and new format (`(?:###\s*)?SCENE\s+\d+`)
- Wrong query name fixed: `getProjectScript` → `getScriptContent` — script append was silently failing every time on extend

**Extend story flow (new):**

- `strategy` parameter added to `invoke_skill` (`replace_all` | `extend`)
- Replace vs Extend confirmation: Director detects existing frame count, shows button choice before calling skill — no more silent append to old story
- Script append: on extend, loads existing script and concatenates new scenes (old + new shown in Script tab)
- Frame order/sceneId offset: new frames start from `existingItems.length` — no collision with existing frame IDs
- Element deduplication: existing elements seeded into `savedElementMap` (lowercase key) — same-name elements never duplicated
- Semantic element name matching: existing elements passed as context to Haiku extractor — "The Child" correctly maps to "The Girl in Hiding" rather than creating a duplicate
- Director prompt: when extending, calls `get_element_library` first and includes existing character names in the skill brief

**Template prompts:**

- `lib/director/template-prompts.ts` created — 39 hardcoded prompt strings (C01–C14 characters, E01–E14 environments, P01–P12 props)
- `selectTemplateForElement` rewritten — two-layer scoring (nameHas + match fn) picks best template in-process, zero DB round-trips

**UX improvements:**

- "Thinking..." shown immediately when Director starts (before first tool_call SSE event)
- Credit estimate + confirm buttons shown before `invoke_skill` runs — users see ~Xcr cost upfront
- After `invoke_skill` returns → immediate `suggest_actions` with frame generation options
- `taskStatus: "building"` set during auto-build — top nav shows progress indicator
- 6 skeleton cards shown in storyboard grid while Director is building
- New frames created by Director born with `frameStatus: "draft"` (was "Set Status" / unknown)
- Per-frame "Generate" button (amber) in No Media state — opens SceneEditor directly

### Session #40 — Post-build UX + extend story context + script cleanup ✅

**Fix 1 — Extend knows its story (`tool-executor.ts`):**

- Last 4 existing scenes (title + description) loaded from Convex before calling skill
- Prepended to prompt: `"CONTINUING THIS STORY — last 4 of N scenes: Scene 7: ... New scenes must start from scene N+1..."`
- Skill now writes a genuine continuation rather than a fresh independent story

**Fix 2 — Batch generate opens automatically after script build (`route.ts`, `DirectorChatPanel.tsx`, `page.tsx`):**

- After `invoke_skill` returns `framesCreated > 0`, `route.ts` emits `open_batch_generate` SSE event
- `DirectorChatPanel` handles it via new `onOpenBatchGenerate` prop
- `page.tsx` opens `BatchGenerateDialog` directly — no Director intermediary, no dead button

**Fix 3 — Preamble strip hard error instead of silent fallback (`tool-executor.ts`):**

- If skill returns zero `SCENE` blocks (`firstScene === -1`), tool returns `isError: true` with clear message
- Chatty garbage text never saved to DB; build aborts cleanly with user-visible error

**Fix 4 — Regenerate button on frames that already have an image (`page.tsx`):**

- Amber `RefreshCw` button added to frame hover overlay (alongside "Set as storyboard URL")
- Calls `onDoubleClick(item)` → opens SceneEditor AI panel — same path as the empty-frame Generate button

**Fix 5 — Credit usage surfaced after generation (`tool-executor.ts`):**

- `creditsUsed: totalCredits` added to `invoke_skill` JSON return payload
- `"Used X credits."` appended to the note string — Director's follow-up naturally surfaces this to user

**Fix 6 — Clean Script button in Script tab (`page.tsx`):**

- Appears only when preamble exists (`firstScenePos > 0`)
- Strips everything before first `SCENE` block, calls `handleScriptChange` (marks dirty), toasts confirmation
- Fixes legacy projects created before preamble strip was added

### Session #41 — Runtime bug fixes ✅

**`VideoImageAIPanel.tsx` — `aspectRatio` temporal dead zone:**

- `const [aspectRatio, setAspectRatio] = useState("16:9")` was declared after the `handleGenerateProductionSheet` useCallback that referenced it in its dep array → JavaScript TDZ error on every render. Moved declaration immediately above the callback.

**`ThumbnailCropper.tsx` — JSX parse error:**

- `)}` closing the `{imgError ? ... : ...}` ternary was positioned after the Footer `<div>`, making Footer an illegal second sibling in the else branch. Moved `)}` to right after the crop area's closing tags — Footer now renders outside the ternary.

---

### Session #38 — API cost optimisation ✅

- `stringifyResult` switched to compact JSON (no indentation) — ~15% off all tool output token counts
- `get_element_library`: removed `referenceUrls` array, replaced with `imageCount: N` — agent never needs raw URL strings, it passes element name to `trigger_image_generation` which resolves the URL internally
- `get_frame_details`: removed `imageUrl`, `videoUrl`, `audioUrl` URL strings — booleans `hasImage`/`hasVideo`/`hasAudio` already present and sufficient
- `get_scene_frames`: `imagePrompt` capped at 400 chars, `videoPrompt` at 200 chars, with `...` suffix when truncated — full prompts stored in Convex and sent to generation API unaffected
- `route.ts`: tool results capped at 1200 chars when accumulated in `currentMessages` — prevents early large tool results (e.g. `get_project_overview`) from being re-sent at full size on every subsequent iteration within the same request
- **Script generation quality: unaffected** — `invoke_skill` runs as an isolated Skills API call; none of these changes touch the act prompt or the model that generates the script
- Estimated savings: ~10–20% per session. Biggest remaining cost driver is system prompt + tools cold cache writes ($0.024/cold open) — not addressed as trimming risks quality

### Session #37 — E2E flow fix + progress signal + seat paywall ✅

- System prompt: removed confirmation pause between invoke_skill → save_script → build_storyboard; pipeline now runs automatically in one go
- `onProgress` callback on `DirectorToolContext` — `invoke_skill` reports per-act progress; `build_storyboard` reports parse/elements/frames steps
- Route sends `{ type: "tool_progress", message }` SSE event; UI shows it inline below the spinning tool indicator
- Agent seat billing: `agentModeEnabled` + `agentSeatCount` added to `org_settings` schema; `getAgentAccess` query in `directorChat.ts`; 403 gate in route; paywall card in DirectorChatPanel when seat not active
- Director mode unaffected — `agentAccess === false` only hides the input area in Agent tab, not Director

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
- [x] E2E flow fixed — invoke_skill → auto save → auto build runs in one tool call
- [x] Agent seat paywall — `agentModeEnabled` on `org_settings`, 403 gate, paywall UI
- [x] invoke_skill progress signal — per-act and per-step status via SSE `tool_progress`
- [x] Script pipeline hardened — preamble strip, SKILL.md format fixed, structured parser reliable
- [x] Extend story flow — replace/extend confirmation, script append, element dedup, frame offset, semantic name matching
- [x] Credit estimate shown before invoke_skill runs
- [x] Skeleton cards + taskStatus during auto-build
- [x] Frame status "draft" on creation, per-frame Generate + Regenerate buttons
- [x] Batch generate auto-opens after invoke_skill via SSE `open_batch_generate` event
- [x] Extend passes story context — last 4 scene summaries prepended to skill prompt
- [x] Preamble strip hard error — zero SCENE blocks returns isError instead of saving garbage
- [x] Clean Script button — strips preamble from legacy scripts in Script tab
- [x] Credit usage returned in invoke_skill payload and surfaced to user
- [ ] Unify vision paths — one shared route used by both Director tool and balloon pill
- [ ] Director rate limiting — daily message cap for free-plan users
- [ ] Conversation compression — smart summarise beyond the 20-message window
- [ ] Tune system prompt from real agent behaviour (needs first real production runs)
- [ ] Stripe integration for agent seat add-on subscription (Phase 4)

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
