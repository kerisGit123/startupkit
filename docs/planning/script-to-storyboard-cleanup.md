# Script-to-Storyboard: Cleanup & Consolidation Plan

## Problem: 5 systems doing the same job

There are currently 5 overlapping code paths for "script -> storyboard frames":

### 1. `lib/storyboard/sceneParser.ts` (regex only)
- Simple regex parser: `SCENE [number]: [title]` format
- Used by: workspace page (live preview), generate-script route
- **Keep** — lightweight, used for live scene count preview in Script tab

### 2. `app/api/storyboard/enhanced-script-extraction/route.ts` (GPT-4o, 740 lines)
- Heavy AI extraction: calls GPT-4o per scene for element extraction
- Hardcoded to a specific script format (Sea Eater/Bloop creature design)
- Called from workspace page before build
- **DELETE** — replaced by scriptAnalyzer.ts

### 3. `app/api/storyboard/generate-script/route.ts` (Kie AI)
- AI generates a NEW script from a prompt (not parsing existing)
- **Keep** — different purpose (script creation, not parsing)

### 4. `convex/storyboard/n8nWebhookCallback.ts` (Convex mutation)
- Receives parsed data from n8n and saves to Convex
- No longer called by anything (n8n routes deleted)
- **DELETE** — dead code

### 5. `lib/storyboard/scriptAnalyzer.ts` + `app/api/storyboard/build-storyboard/route.ts` (NEW)
- Hybrid regex+Haiku parser, handles structured and freeform scripts
- Scales to 60+ scenes (regex extracts heavy text, AI only does elements)
- **Keep** — this is the new single source of truth

## Dead Convex mutations to remove

| File | Export | Why dead |
|---|---|---|
| `convex/storyboard/storyboardItems.ts` | `createFromN8n` | Was for n8n webhook, no callers |
| `convex/storyboard/storyboardItems.ts` | `buildStoryboard` | Old mutation, no callers |
| `convex/storyboard/storyboardElements.ts` | `createFromN8n` | Was for n8n webhook, no callers |
| `convex/storyboard/n8nWebhookCallback.ts` | entire file | n8n routes deleted |

## Dead code in workspace page

`app/storyboard-studio/workspace/[projectId]/page.tsx` has a build flow that:
1. Calls `enhanced-script-extraction` API route (will be deleted)
2. Processes the result client-side (filteredScenes, elementStrategy, etc.)
3. Sends processed data to build endpoint

After cleanup, the build flow is:
1. Call `/api/storyboard/build-storyboard` with `{ projectId, rebuildStrategy }`
2. Done. The API route handles everything server-side.

The client-side pre-processing code (~100 lines) around the build call becomes dead code.

## Execution order

### Phase 1: Delete dead files
- [ ] Delete `app/api/storyboard/enhanced-script-extraction/` (740 lines)
- [ ] Delete `convex/storyboard/n8nWebhookCallback.ts`

### Phase 2: Remove dead exports from Convex
- [ ] Remove `createFromN8n` from `convex/storyboard/storyboardItems.ts`
- [ ] Remove `buildStoryboard` mutation from `convex/storyboard/storyboardItems.ts`
- [ ] Remove `createFromN8n` from `convex/storyboard/storyboardElements.ts`

### Phase 3: Simplify workspace page build flow
- [ ] Remove `enhanced-script-extraction` fetch call and surrounding pre-processing
- [ ] Remove `parseScriptScenes` import if no longer used for build (keep if used for live preview)
- [ ] Simplify build function: just call `/api/storyboard/build-storyboard`
- [ ] Remove unused config options (buildType, scriptType, language, elementStrategy) from build dialog

### Phase 4: Verify
- [ ] `npm run build` passes
- [ ] Grep for any remaining references to deleted code
- [ ] Test: paste structured script -> Build Storyboard -> frames appear
- [ ] Test: manual frame creation still works

## What remains after cleanup

```
Script tab
  |-- Live preview: sceneParser.ts (regex, instant)
  |-- "Generate Script" button: generate-script/route.ts (Kie AI)
  |-- "Build Storyboard" button: build-storyboard/route.ts
        |-- scriptAnalyzer.ts (regex for structured, Haiku for freeform + elements)
        |-- Saves elements + frames to Convex
        |-- Real-time progress via Convex mutations

Storyboard tab
  |-- Frames from build OR manual "+" creation
  |-- Image generation: image-gen-proxy/route.ts (Kie AI)
  |-- Video generation: existing generate-* routes
```

3 clear paths, no overlap, no redundancy.
