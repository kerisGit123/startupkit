# AI Director — Implementation Plan

> **Status:** Ready to build
> **Last updated:** 2026-04-25
> **Priority:** P0 — highest-impact core product feature
> **Model:** Claude Haiku 4.5 (same as support chat, can upgrade to Sonnet for richer creative output)

---

## What It Is

An AI co-director embedded in the storyboard studio. Not a generic chatbot — a creative assistant that can read your project, write prompts, set camera angles, break scripts into shots, suggest elements, and guide filmmaking decisions.

Think of it as having a film school graduate sitting next to you who can instantly look at your storyboard and give specific, actionable creative direction.

**Competitive context:** Higgsfield has "Mr. Higgs" AI co-director. Nobody else does. Ours will be better because it feeds directly into our richer pipeline (element library, camera studio, style system, multi-model AI, timeline editor).

---

## What It Can Do

### READ tools (understand the project)

| Tool | What it does | Convex function |
|---|---|---|
| `get_project_overview` | Returns project name, scene count, frame count, style, format, color palette, script excerpt | `storyboard/projects.get` + `storyboardItems.listByProject` |
| `get_scene_frames` | Returns all frames in a scene with their prompts, generation status, notes, duration | `storyboardItems.listByProject` filtered by sceneId |
| `get_frame_details` | Returns a single frame's full data — prompt, video prompt, notes, linked elements, generation status, tags | `storyboardItems.listByProject` + filter |
| `get_element_library` | Lists all characters, environments, props available in this project | `storyboardElements.listByProject` |
| `get_project_style` | Returns current style prompt, format preset, color palette, visual theme | `storyboard/projects.get` |
| `get_prompt_templates` | Lists saved prompt templates the user can reference | `promptTemplates.getByCompany` |
| `get_presets` | Lists saved camera/style presets | `storyboard/presets.list` |

### WRITE tools (take creative actions)

| Tool | What it does | Convex function |
|---|---|---|
| `update_frame_prompt` | Rewrite or improve a frame's image prompt and/or video prompt | `storyboardItems.update` (imagePrompt, videoPrompt) |
| `update_frame_notes` | Add or update director notes on a frame | `storyboardItems.updateFrameNotes` |
| `update_frame_status` | Set frame status (draft/in-progress/completed) | `storyboardItems.updateFrameStatus` |
| `update_project_style` | Set or modify the project style prompt, format preset, or color palette | `storyboard/projects.update` |
| `create_frames` | Add new frames to a scene with prompts, descriptions, and element links | `storyboardItems.create` |
| `reorder_frames` | Move frames to new positions | `storyboardItems.reorder` |
| `break_script_into_shots` | Parse script text into scenes and frames with auto-generated prompts, camera suggestions, and element extraction | `parseScriptScenes` + `storyboardItems.buildStoryboard` |

### KNOWLEDGE tools (filmmaking expertise)

| Tool | What it does | Source |
|---|---|---|
| `get_model_recommendations` | Recommend which AI model to use based on shot type, style, and budget | Hardcoded knowledge (model strengths, credit costs) |
| `search_knowledge_base` | Search knowledge base for tips, guides, feature explanations | `knowledgeBase.searchArticlesUnified` |

---

## System Prompt Design

The AI Director needs a persona and filmmaking knowledge baked into the system prompt:

```
IDENTITY
- You are the AI Director for this storyboard project
- You're a knowledgeable, collaborative creative partner
- Tone: professional but approachable, like a seasoned AD (assistant director)
- You give specific, actionable suggestions — not vague advice

PROJECT CONTEXT (injected per-request)
- Project name, scene count, frame count
- Current style/format/palette
- Element library summary (character names, environment names)

FILMMAKING KNOWLEDGE
- Shot types: establishing, close-up, medium, wide, OTS, POV, insert, cutaway
- Camera movements: dolly, crane, pan, tilt, track, orbit, handheld, steadicam
- Composition: rule of thirds, leading lines, depth, framing, negative space
- Lighting: key/fill/back, golden hour, high-key, low-key, chiaroscuro, neon
- Pacing: shot duration, cutting rhythm, tension/release, montage
- Continuity: 180-degree rule, eyeline match, match cut, screen direction
- Genre conventions: horror (low angles, shadows), comedy (wider shots, bright),
  thriller (dutch angles, tight framing), documentary (handheld, natural light)

PROMPT WRITING EXPERTISE
- How to write effective AI image/video prompts
- When to include camera angle, lighting, mood, color in prompts
- How to use @element mentions for character consistency
- Style prompt best practices (specific > vague, visual > abstract)

TOOL USAGE RULES
- Always read project context before making suggestions
- When updating prompts, explain what you changed and why
- When breaking scripts into shots, suggest camera angles for each
- Reference elements by name when they exist in the library
- Don't generate images/videos directly — help the user prepare prompts
- Credit costs: mention approximate cost when recommending models

SAFETY
- Never reveal internal details (API providers, costs, schema)
- Stay focused on the project — decline off-topic requests
- Don't make up filmmaking rules — be honest when unsure
```

---

## Architecture

### Request Flow

```
StoryboardWorkspacePage
  |
  +-- DirectorChatPanel (new component, docked right side or floating)
        |  POST /api/director/chat
        |  SSE streaming (same pattern as support chat)
        |
        v
  route.ts (server)
        |
        +-- Auth check (must be signed in + have project access)
        +-- Load project context (inject into system prompt)
        +-- Load conversation history (Convex)
        +-- Attach director tools
        |
        v
  Claude Haiku 4.5 (Anthropic API)
        |
        +-- Text response --> streamed to panel
        +-- Tool calls --> dispatchDirectorTool() --> Convex queries/mutations --> back to Claude
```

### SSE Events (same as support chat)

```
data: {"type":"session","sessionId":"..."}
data: {"type":"text","delta":"Let me look at your project..."}
data: {"type":"tool_call","name":"get_project_overview"}
data: {"type":"tool_result","name":"get_project_overview","isError":false}
data: {"type":"text","delta":"Your project has 8 scenes with 24 frames. I notice..."}
data: {"type":"done"}
```

### Conversation Storage

New Convex table `director_chat_sessions`:

```typescript
director_chat_sessions: defineTable({
  projectId: v.id("storyboard_projects"),
  userId: v.string(),
  companyId: v.string(),
  messages: v.array(v.object({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    toolCalls: v.optional(v.array(v.object({
      name: v.string(),
      input: v.optional(v.any()),
      output: v.optional(v.string()),
    }))),
  })),
  messageCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_user_project", ["userId", "projectId"])
```

One session per user per project. History persists across studio sessions.

---

## File Structure

```
lib/director/
  agent-tools.ts          -- Tool definitions (Anthropic.Tool[])
  tool-executor.ts        -- dispatchDirectorTool() against Convex
  system-prompt.ts        -- buildDirectorSystemPrompt() with filmmaking knowledge
  constants.ts            -- Model knowledge, shot type descriptions

app/api/director/
  chat/route.ts           -- SSE streaming endpoint (follows support chat pattern)

convex/
  directorChat.ts         -- Session storage mutations/queries

components/director/
  DirectorChatPanel.tsx   -- Chat UI panel for the studio
```

---

## Tool Definitions (Detail)

### `get_project_overview`
```typescript
{
  name: "get_project_overview",
  description: "Get an overview of the current storyboard project — scenes, frames, style, format, elements. Always call this first to understand the project before giving advice.",
  input_schema: { type: "object", properties: {}, required: [] }
}
```
**Executor:** Query project + count items + list elements. Return:
```json
{
  "name": "My Short Film",
  "sceneCount": 5,
  "frameCount": 18,
  "style": "cinematic",
  "stylePrompt": "cinematic lighting, 35mm film grain...",
  "formatPreset": "film",
  "colorPalette": ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"],
  "elements": {
    "characters": ["Captain Rivera", "Dr. Chen"],
    "environments": ["Space Station Bridge", "Planet Surface"],
    "props": ["Holographic Map", "Laser Pistol"]
  },
  "scriptExcerpt": "First 500 chars of script..."
}
```

### `get_scene_frames`
```typescript
{
  name: "get_scene_frames",
  description: "Get all frames in a specific scene with their prompts, status, and settings. Use scene IDs like 'scene-1', 'scene-2', etc.",
  input_schema: {
    type: "object",
    properties: {
      scene_id: { type: "string", description: "Scene ID (e.g., 'scene-1')" }
    },
    required: ["scene_id"]
  }
}
```

### `get_frame_details`
```typescript
{
  name: "get_frame_details",
  description: "Get full details for a specific frame by its order number (1-based). Returns prompt, video prompt, notes, linked elements, generation status.",
  input_schema: {
    type: "object",
    properties: {
      frame_number: { type: "number", description: "Frame number (1-based, e.g., 1 for the first frame)" }
    },
    required: ["frame_number"]
  }
}
```

### `update_frame_prompt`
```typescript
{
  name: "update_frame_prompt",
  description: "Update the image prompt and/or video prompt for a specific frame. Use this to improve, rewrite, or add detail to a frame's generation prompt. Always explain what you changed and why.",
  input_schema: {
    type: "object",
    properties: {
      frame_number: { type: "number", description: "Frame number (1-based)" },
      image_prompt: { type: "string", description: "New image generation prompt (optional, only if changing)" },
      video_prompt: { type: "string", description: "New video generation prompt (optional, only if changing)" }
    },
    required: ["frame_number"]
  }
}
```

### `update_frame_notes`
```typescript
{
  name: "update_frame_notes",
  description: "Add or update director notes on a frame. Notes are visible in the Director's View filmstrip.",
  input_schema: {
    type: "object",
    properties: {
      frame_number: { type: "number", description: "Frame number (1-based)" },
      notes: { type: "string", description: "Director notes for this frame" }
    },
    required: ["frame_number", "notes"]
  }
}
```

### `update_project_style`
```typescript
{
  name: "update_project_style",
  description: "Update the project-wide visual style. This affects all future generations. You can set the style prompt (descriptive text appended to every prompt), format preset (film/documentary/reel/etc.), or both.",
  input_schema: {
    type: "object",
    properties: {
      style_prompt: { type: "string", description: "Visual style description (e.g., 'cinematic lighting, 35mm film grain, shallow depth of field, warm color grading')" },
      format_preset: { type: "string", enum: ["film", "documentary", "youtube", "reel", "commercial", "music-video", "vlog", "tutorial", "presentation", "podcast", "product-demo", "cinematic-ad"], description: "Content format preset" }
    },
    required: []
  }
}
```

### `break_script_into_shots`
```typescript
{
  name: "break_script_into_shots",
  description: "Parse a script or scene description into individual shots/frames with AI-generated prompts. Each shot gets a title, description, image prompt with camera angle and lighting suggestions, and recommended duration. Use this when the user pastes a script or asks you to plan a scene.",
  input_schema: {
    type: "object",
    properties: {
      script_text: { type: "string", description: "The script or scene description to break into shots" },
      style_hint: { type: "string", description: "Optional visual style hint (e.g., 'noir', 'vibrant anime', 'documentary')" },
      target_frame_count: { type: "number", description: "Approximate number of frames to create (default: auto based on script length)" }
    },
    required: ["script_text"]
  }
}
```
**Note:** This tool doesn't call `parseScriptScenes` directly. Instead, Claude uses its filmmaking knowledge to break the script into shots and returns structured JSON. The executor then calls `storyboardItems.create` for each frame. This is better than regex parsing because Claude understands narrative structure, pacing, and shot selection.

### `get_model_recommendations`
```typescript
{
  name: "get_model_recommendations",
  description: "Get AI model recommendations based on what the user wants to generate. Returns model name, credit cost, and why it's good for this use case.",
  input_schema: {
    type: "object",
    properties: {
      shot_type: { type: "string", description: "What the user wants: 'image', 'video', 'music', 'upscale', 'lipsync'" },
      description: { type: "string", description: "Brief description of the shot (e.g., 'fast action scene with camera movement', 'static portrait close-up')" }
    },
    required: ["shot_type"]
  }
}
```
**Executor:** Returns hardcoded model knowledge (no API call needed):
```
IMAGE models:
- Nano Banana 2 (5-10 cr) — fast, good general purpose, best for storyboard frames
- Nano Banana Pro (18-24 cr) — higher quality, better detail
- GPT Image 2 (15 cr) — best for photorealistic, text in images
- Z-Image (1 cr) — cheapest, good for quick drafts
- Flux 2 Pro (10 cr) — excellent composition, artistic styles

VIDEO models:
- Seedance 1.5 Pro (5-90 cr) — best value, good quality, supports audio
- Seedance 2.0 (varies) — highest quality, multi-shot support (UGC/Showcase)
- Kling 3.0 Motion (varies) — best for motion control, camera movements
- Veo 3.1 (60-250 cr) — Google's model, excellent for cinematic quality
- Grok Imagine (varies) — good for stylized video
```

### `search_knowledge_base`
Same as support chat — reuses existing `knowledgeBase.searchArticlesUnified`.

---

## UI: DirectorChatPanel

### Placement
- Floating panel docked to right side of storyboard workspace
- Toggle button in the studio toolbar (same row as the AI panel toggle)
- Can be collapsed/expanded
- Doesn't overlap with the AI generation panel (they stack or tab)

### Features
- SSE streaming with typing indicator
- Tool call indicators ("Looking at your project...", "Updating frame 3...")
- Quick action buttons at bottom:
  - "Review my storyboard" — triggers full project review
  - "Improve prompts" — batch prompt improvement
  - "Break down script" — opens script input
- Message history persists per project
- Markdown rendering (same as support chat)

### Props
```typescript
interface DirectorChatPanelProps {
  projectId: string;
  companyId: string;
}
```

---

## Implementation Phases

### Phase 1: Core Agent (MVP)

**Build the agent with READ + WRITE tools. No UI yet — test via API.**

Files to create:
1. `lib/director/agent-tools.ts` — all tool definitions
2. `lib/director/tool-executor.ts` — `dispatchDirectorTool()`
3. `lib/director/system-prompt.ts` — `buildDirectorSystemPrompt()`
4. `lib/director/constants.ts` — model knowledge, shot type descriptions
5. `app/api/director/chat/route.ts` — SSE streaming endpoint
6. `convex/directorChat.ts` — session storage

**Test with curl/Postman:** Send messages, verify tools execute correctly, check that prompts get updated in the actual project.

### Phase 2: Studio UI

**Build the chat panel and wire it into the workspace.**

Files to create:
1. `components/director/DirectorChatPanel.tsx` — chat UI
2. Modify `app/storyboard-studio/workspace/[projectId]/page.tsx` — add toggle + panel

### Phase 3: Smart Context

**Make the director context-aware of what the user is currently doing.**

- Pass current selected frame/scene to the system prompt
- Auto-suggest improvements when user selects a frame
- "Review this frame" quick action on each frame card

### Phase 4: Vision Integration (Future)

**Let the director "see" generated images/videos.**

- Send generated frame images to Claude (vision) for visual feedback
- "Does this match the prompt?" — visual QA
- "How can I improve this shot?" — visual composition suggestions
- Uses existing Gemini AI Analyze infrastructure as fallback

---

## Cost Estimate

| Component | Cost per message | Notes |
|---|---|---|
| Claude Haiku 4.5 | ~$0.001-0.003 | Input: ~2K tokens (system) + ~1K (history) + ~500 (tools). Output: ~500 tokens |
| Tool calls | ~$0.001-0.002 per tool | Additional round-trips (typically 1-3 tools per message) |
| Total per message | ~$0.003-0.008 | ~3-8x cheaper than a Sonnet call |
| Prompt caching | -40-50% | System prompt cached after first message in session |

**At 10 messages/session, 100 sessions/day:** ~$3-8/day. Negligible compared to AI generation costs.

**Option to charge:** Could deduct 1 credit per director message to offset costs and prevent abuse. Or include free in Pro/Business plans.

---

## What Makes Ours Better Than Higgsfield's Mr. Higgs

| Aspect | Mr. Higgs (Higgsfield) | Our AI Director |
|---|---|---|
| Prompt writing | Populates prompts | Writes prompts WITH camera angles, lighting, element @mentions, style context |
| Camera control | Sets camera angles | Suggests angles + explains WHY (filmmaking rationale) |
| Project awareness | Per-shot context | Full project context — all scenes, all frames, all elements, style, format |
| Script breakdown | Basic shot list | Intelligent breakdown with pacing, continuity, genre-appropriate shot selection |
| Element library | Soul ID references | Full element @mention system — characters, environments, props |
| Style system | Per-shot style | Project-wide style prompt + format preset + color palette |
| Multi-model | Yes | Yes + model recommendations based on shot type and budget |
| Pipeline depth | Generation only | Generation + canvas editing + timeline + export guidance |
| Conversation | Unclear | Full multi-turn with persistent history per project |
