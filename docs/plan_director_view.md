# Director's View — SceneEditor Enhancement Plan

## Implementation Status

> **Last updated:** 2026-04-24
> All Phase 1, 2, and 3 features are **IMPLEMENTED**. Phase 3.5 (Camera Control) added. Phase 4 remains planned.

| Phase | Feature | Status | File(s) |
|-------|---------|--------|---------|
| **1** | Storyboard Strip (filmstrip) | **DONE** | `StoryboardStrip.tsx` |
| **1** | Snapshot to self / next frame | **DONE** | `StoryboardStrip.tsx`, `SceneEditor.tsx`, `snapshotUtils.ts` |
| **1** | Video hover preview | **DONE** | `StoryboardStrip.tsx` |
| **1** | Video Preview snapshot buttons | **DONE** | `GeneratedImageCard.tsx`, `GeneratedImagesPanel/index.tsx` |
| **2** | Right-click context menu | **DONE** | `StoryboardStrip.tsx` |
| **2** | Drag reorder in strip | **DONE** | `StoryboardStrip.tsx`, `SceneEditor.tsx` |
| **2** | Animatic playback (image + video) | **DONE** | `StoryboardStrip.tsx`, `SceneEditor.tsx` |
| **2** | Generated Outputs Row | **DONE** | `StoryboardStrip.tsx`, `SceneEditor.tsx` |
| **2** | Comparison Mode (prev/current/next) | **DONE** | `StoryboardStrip.tsx` |
| **2** | Director's Notes | **DONE** | `StoryboardStrip.tsx`, `SceneEditor.tsx` |
| **3** | Blend Modes in VideoEditor | **DONE** | `VideoEditor.tsx` |
| **3** | Subtitle Track in VideoEditor | **DONE** | `VideoEditor.tsx` |
| **3.5** | Camera Motion Presets (15 presets) | **DONE** | `VideoImageAIPanel.tsx`, `PromptTextarea.tsx` |
| **3.5** | Camera Studio (floating panel, 4 selectors) | **DONE** | `VirtualCameraStyle.tsx`, `VideoImageAIPanel.tsx` |
| **3.5** | Prompt Context Menu (Copy/Paste/Camera Motion) | **DONE** | `PromptTextarea.tsx` |
| **3.5** | Add Frame button in filmstrip | **DONE** | `StoryboardStrip.tsx`, `SceneEditor.tsx` |
| **4** | Multi-shot AI generation | Planned | — |
| **4** | Script-to-storyboard import | Planned | — |

---

## Architecture Overview

### Files Created

| File | Purpose |
|------|---------|
| `app/storyboard-studio/components/editor/StoryboardStrip.tsx` | Main filmstrip component (~900 lines) with all Phase 1 & 2 features |
| `app/storyboard-studio/components/shared/VideoPreviewDialog.tsx` | Shared video player dialog with snapshot buttons (used by GeneratedImageCard + SceneEditor) |
| `lib/storyboard/snapshotUtils.ts` | Shared `captureVideoFrame()` and `captureImageFrame()` utilities |
| `app/storyboard-studio/components/ai/VirtualCameraStyle.tsx` | Camera Studio floating panel — 4 selector cards (Camera/Lens/Focal Length/Aperture) with product images |

### Files Modified (2026-04-24 Session)

| File | Changes |
|------|---------|
| `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` | Camera motion presets (15 options), Camera Studio integration, prompt assembly for virtual camera |
| `app/storyboard-studio/components/shared/PromptTextarea.tsx` | Built-in right-click context menu (Copy/Paste/Camera Motion submenu), cursor position preservation |
| `app/storyboard-studio/components/editor/StoryboardStrip.tsx` | Add frame (+) button at end of filmstrip, `onAddFrame` prop |
| `app/storyboard-studio/components/editor/SceneEditor.tsx` | `createItem` mutation, `handleAddFrame` handler for filmstrip |
| `app/storyboard-studio/shared/CanvasEditor.tsx` | Fixed Ctrl+C/V interception — added `isContentEditable` guard so clipboard works in prompt textarea |

### Files Modified

| File | Changes |
|------|---------|
| `app/storyboard-studio/components/editor/SceneEditor.tsx` | StoryboardStrip integration, snapshot handlers, video snapshot handlers, reorder/status/delete/notes handlers, animatic video playback callbacks, output selection, VideoPreviewDialog for video outputs, canvas reset on shot navigation |
| `app/storyboard-studio/components/editor/SceneEditorHeader.tsx` | Aspect ratio redesigned as grid popup (matches VideoImageAIPanel style), CSS variables |
| `app/storyboard-studio/components/editor/FrameInfoDialog.tsx` | Redesigned as cinema-grade inspector: readout cards, NLE tab bar, section headers with accent icons. Font weights bumped to font-semibold/font-bold for visibility. Background `bg-(--bg-secondary)` matching toolbar |
| `app/storyboard-studio/components/editor/VideoEditor.tsx` | Extended `TimelineClip` with `blendMode` + `opacity`. Added `SubtitleClip` type, subtitle track rendering, subtitle preview overlay, blend mode/opacity controls, export integration for both |
| `app/storyboard-studio/components/shared/DarkModal.tsx` | Updated to CSS variables (`bg-(--bg-primary)`, `border-(--border-primary)`, `text-(--text-tertiary)`) |
| `app/storyboard-studio/components/GeneratedImagesPanel/GeneratedImageCard.tsx` | Replaced inline video dialog with shared `VideoPreviewDialog`. Removed unused `videoPreviewRef`/`snapping` state |
| `app/storyboard-studio/components/GeneratedImagesPanel/index.tsx` | Threaded `onVideoSnapshotToSelf`, `onVideoSnapshotToNext`, `onVideoSnapshotToSelf` callbacks |
| `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` | Category tab font weight bumped from `font-medium` to `font-semibold`, inactive color `text-[#8A8A8A]` for better readability |

### No Schema Changes

All features use existing Convex tables and fields. No new tables, no migrations.

---

## Phase 1: Storyboard Strip + Snapshots (DONE)

### StoryboardStrip Component

**Location:** `app/storyboard-studio/components/editor/StoryboardStrip.tsx`

**Integration:** Inserted between `<SceneEditorHeader>` and the main canvas area in `SceneEditor.tsx`.

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│ SceneEditorHeader                                                │
├──────────────────────────────────────────────────────────────────┤
│ ▶ ⊞ ◀ [01] [02] [03★] |S2| [04] [05] ▶    3/5  15.0s          │ ← Strip (82px)
│  Outputs: [img1][img2][vid1]                          3         │ ← Outputs Row (46px, conditional)
├──────────────────────────────────────────────────────────────────┤
│                        Canvas / Editor                           │
└──────────────────────────────────────────────────────────────────┘
```

**Props interface:**
```typescript
interface StoryboardStripProps {
  shots: Shot[];
  activeShotId: string;
  onNavigateToShot: (shotId: string) => void;
  projectFiles?: any[];
  isMobile?: boolean;
  onSnapshotToSelf?: () => Promise<void>;
  onSnapshotToNext?: () => Promise<void>;
  onReorder?: (updates: { id: string; newOrder: number }[]) => void;
  onFrameStatusChange?: (shotId: string, status: "draft" | "in-progress" | "completed") => void;
  onDuplicate?: (shotId: string) => void;
  onDelete?: (shotId: string) => void;
  onPlayVideo?: (videoUrl: string) => void;
  onStopVideo?: () => void;
  onSelectOutput?: (url: string) => void;
  onEditNotes?: (shotId: string, notes: string) => void;
}
```

**Design system:** All colors use CSS variables from `plan_final_design.md`:
- Container: `bg-(--bg-secondary)/95 backdrop-blur-md border-b border-(--border-primary)`
- Frame card: `bg-(--bg-primary) border border-(--border-primary) rounded-lg`
- Active: `border-(--accent-blue) ring-1 ring-(--accent-blue)/30 scale-105`
- Text: `text-(--text-secondary)`, `text-(--text-tertiary)`
- Icons: `strokeWidth={1.75}` per design spec
- Badges: `text-[9px] px-1.5 py-0.5 rounded-md font-semibold` — VIDEO (bg-red-500), IMAGE (bg-emerald-500)

### Frame Card Features

| Feature | Implementation |
|---------|---------------|
| Thumbnail priority | videoUrl (with play overlay) > imageUrl > gray Film placeholder |
| Status dot | Green (`--color-success`) = has video, Amber (`--color-warning`) = has image, Gray = empty |
| Scene grouping | Vertical dividers with "S1", "S2" labels between scene boundaries |
| Auto-scroll | Active frame centers with smooth scroll on navigation |
| Scroll arrows | Left/right chevrons appear when strip overflows |
| Mouse wheel | Vertical scroll → horizontal scroll on strip |
| Frame counter | Right side: "3 / 12" + total duration |
| Mobile | Hidden by default, "Filmstrip (N)" pill button toggles visibility |
| Notes indicator | Yellow StickyNote icon (bottom-right) when `shot.notes` is non-empty |
| Drag handle | GripVertical icon (top-right, hover-visible) when reorder is enabled |

### Video Hover Preview

Hover a video frame for 500ms → muted autoplay starts in the thumbnail. Mouse leave → video stops. Play icon overlay hides during playback.

### Snapshot System

**Strip snapshot buttons** (active frame only, visible on hover):
- Camera icon → snapshot current canvas → save as this frame's `imageUrl`
- SkipForward icon → snapshot → save as next frame's `imageUrl` (continuity bridge)

**Implementation:** When active shot has an existing `imageUrl`, copies the URL directly (avoids CORS canvas taint). When no image exists, falls back to `buildUploadFile()` canvas capture.

**Video Preview modal snapshot** (GeneratedImagesPanel):
- "This frame" button → `captureVideoFrame(videoUrl, currentTime)` → upload to R2 → save as current shot's imageUrl
- "Next frame" button → same capture → save as next shot's imageUrl

**Shared utility** (`lib/storyboard/snapshotUtils.ts`):
```typescript
captureVideoFrame(videoUrl: string, seekTime?: number): Promise<Blob>
captureImageFrame(imageUrl: string): Promise<Blob>
```
Both fetch as blob to avoid CORS, draw to offscreen canvas, return PNG blob.

---

## Phase 2: Enhanced Director Features (DONE)

### Right-click Context Menu

Right-click any frame → design-system styled dropdown:
- **Mark Complete / Mark as Draft** — toggles `frameStatus` via `updateFrameStatus` mutation
- **Add Notes / Edit Notes** — `prompt()` dialog → saves via `updateFrameNotes` mutation
- **Duplicate** — prop ready (not wired to a create mutation yet)
- **Delete** — removes frame, navigates to adjacent, prevents deleting last frame

Styling: `bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl` matching model dropdown spec.

### Drag Reorder

- Hover → grip icon appears top-right
- Drag to new position → blue left-border indicator on drop target
- Drop → calls `reorderItems` Convex mutation with recalculated order indices
- Local state updates immediately for responsive feedback
- Dragged card at 40% opacity

### Animatic Playback

Play button (▶) left of filmstrip, toggles play/pause:

| Frame type | Behavior |
|---|---|
| Image frame | Holds for `frame.duration` seconds (default 3s if 0 or unset), then advances |
| Video frame | Tells SceneEditor to play video in canvas via `videoState`, uses hidden `<video>` to detect actual video end, advances when video finishes |

- Loops back to frame 1 after last frame
- Click any frame or pause button to stop
- 60s safety timeout for video frames
- Blue highlight on play button while active

### Generated Outputs Row

Below the filmstrip, a 46px row shows generated images/videos for the active frame:
- Filtered from `projectFiles` by `categoryId === activeShotId`, `category === "generated" | "combine"`
- 48x36px thumbnails with model name, VIDEO badge ("V"), and spinner for generating files
- Click → loads output in the canvas via `switchCanvasImage`
- Count shown on right side
- Auto-hides when no outputs exist
- Hidden during comparison mode

### Comparison Mode

Toggle button (Columns3 icon) next to animatic button:
- Replaces filmstrip with **Previous | Current | Next** side-by-side (140px each)
- Active frame has blue ring, prev/next clickable to navigate
- Empty slots show dashed "No prev" / "No next" placeholders
- Notes indicator visible on comparison frames
- Exits when toggled off, restoring normal filmstrip

### Director's Notes

- Yellow StickyNote icon on frame thumbnails when `shot.notes` is non-empty
- Right-click → "Add Notes" / "Edit Notes" in context menu
- Uses `prompt()` for quick inline editing
- Saved to Convex via `updateFrameNotes` mutation
- Visible in both filmstrip and comparison mode
- Tooltip shows note text on hover

---

## Phase 3: VideoEditor Enhancements (DONE)

### Blend Modes

**Extended `TimelineClip` interface:**
```typescript
interface TimelineClip {
  // ...existing fields...
  blendMode?: BlendMode;  // "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn"
  opacity?: number;       // 0-100, default 100
}
```

**Controls:** When a video/image clip is selected, the controls bar shows:
- Blend mode dropdown (8 modes)
- Opacity slider (0-100%) with percentage label

**Preview:** Applied via CSS `mixBlendMode` + `opacity` on the preview `<video>` and `<img>` elements.

**Export:** Applied via Canvas2D `globalCompositeOperation` + `globalAlpha` before drawing each frame. State saved/restored per frame to avoid leaking.

**Timeline badges:**
- Orange "BLEND MODE" badge on clips with non-normal blend mode
- White opacity badge showing percentage when < 100%

### Subtitle Track

**New `SubtitleClip` type:**
```typescript
interface SubtitleClip {
  id: string;
  text: string;
  startTime: number;      // absolute time in timeline (seconds)
  endTime: number;         // absolute time in timeline (seconds)
  position: "top" | "center" | "bottom";
  fontSize: number;        // px, default 32
  fontColor: string;       // hex, default "#FFFFFF"
  backgroundColor: string; // hex with alpha, default "#00000080"
  fontWeight: "normal" | "bold";
}
```

**Track layout:** Third track below Audio, yellow-themed:
- Track label: "Subs" with Type icon, `h-[60px]`
- Timeline container height: 280px → 340px
- Clips positioned absolutely by `startTime`/`endTime` on timeline
- Yellow gradient background, selected ring highlight

**Controls bar** (when subtitle track selected):
- "Add Sub" button — creates 3s subtitle at playhead position
- Text input for subtitle content
- Position dropdown (top/center/bottom)
- Font weight dropdown (normal/bold)
- Color picker for font color
- Delete button

**Preview overlay:** Active subtitle rendered in real-time on the video preview area, positioned according to `position` field.

**Export integration:** Subtitles burned into exported video via Canvas2D text rendering:
- `ctx.font` with weight and size
- Background rect behind text
- Centered text at vertical position based on `position` field

---

## Phase 4: AI-Powered Features (FUTURE — mostly small gaps)

> **Note:** Both Script-to-Storyboard and Multi-shot AI generation are **already built**.
> Phase 4 is about filling small gaps, not building from scratch.

### Script-to-Storyboard (70-80% complete)

| Component | File | Status |
|-----------|------|--------|
| Script tab with textarea + scene preview | `workspace/[projectId]/page.tsx` | EXISTS |
| `parseScriptScenes()` — regex parsing of `SCENE N: Title` | `lib/storyboard/sceneParser.ts` | EXISTS |
| `buildStoryboard` mutation — creates items + elements | `convex/storyboard/storyboardItems.ts` | EXISTS |
| Build dialog with script type + language | `BuildStoryboardDialogSimplified.tsx` | EXISTS |
| n8n webhook — forwards to n8n, receives callback | `app/api/n8n-webhook/route.ts` | EXISTS |
| Real-time build status tracking | `convex/storyboard/build.ts` | EXISTS |
| Element creation (characters, environments) | `convex/storyboard/storyboardItems.ts` | EXISTS |
| Scene structure in project schema | `convex/schema.ts` | EXISTS |

**Remaining small gaps:**

| Gap | Description | Effort |
|-----|-------------|--------|
| AI script generation | `handleGenerateScript` UI exists but doesn't call AI service to write scripts from prompts | Small |
| AI element detection | `buildStoryboard` accepts `enhancedElements` but nothing auto-generates them from script | Medium |
| Batch frame generation | No "Generate all frames" button to auto-generate images for every scene | Small |
| Style metadata flow | Project `visualStyle`/`genre` stored but not auto-appended to generation prompts | Small |

**Data flow (already working):**

```
User Script Input
    ↓
parseScriptScenes() extracts scenes
    ↓
BuildStoryboardDialog collects scriptType + language
    ↓
/api/n8n-webhook (frontend request handler)
    ↓
n8n processes script → extracts elements & scenes
    ↓
/api/n8n-webhook (callback handler) receives results
    ↓
buildStoryboard mutation creates storyboard items + elements
    ↓
Project status updates to "ready"
    ↓
UI displays parsed storyboard with linked elements
```

### Multi-Shot AI Generation (ALREADY BUILT via Seedance 2.0)

Multi-shot video generation is **already implemented** through Seedance 2.0's UGC and Showcase modes. This is our equivalent of Kling 3.0's "AI Director".

**Seedance 2.0 models in system:**

| Model ID | Pricing | Status |
|----------|---------|--------|
| `bytedance/seedance-2` | 11.5 cr/s base, formula | Active |
| `bytedance/seedance-2-fast` | 9 cr/s base, formula | Active |
| `bytedance/seedance-1.5-pro` | 7 cr/s base, formula | Active (legacy) |

**7 generation modes (all implemented):**

| Mode | What it does | Multi-shot? |
|------|-------------|-------------|
| `text-to-video` | Prompt → video | No |
| `first-frame` | Image + prompt → video | No |
| `first-last-frame` | Start + end image → video (continuity!) | Partial |
| `multimodal` | Up to 9 ref images + 3 ref videos + audio → video | Yes |
| **`ugc`** | **Product (3 imgs) + Influencer (3 imgs) → multi-cut video** | **Yes** |
| **`showcase`** | **Subject (6 imgs) + Presenter (1 img) + Scene (2 imgs) → multi-angle video** | **Yes** |
| `lipsync` | Character image + audio → talking head video | No |

**Key files:**

| File | What it does |
|------|-------------|
| `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` | Mode selection UI, UGC/Showcase image slots, badge conversion |
| `lib/storyboard/videoAI.ts` (lines 148-219) | `generateSeedance2()` — builds Kie AI request body |
| `app/api/storyboard/generate-seedance2/route.ts` | API route handler |
| `lib/storyboard/pricing.ts` (lines 235-285) | `getSeedance20()` / `getSeedance20Fast()` formulas |

**What could be enhanced (future):**

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Auto-sequence pipeline | Take storyboard frames 1-6, feed as Subject images into Showcase mode, generate connected video | Medium |
| Cross-frame consistency | Use `first-last-frame` mode to chain videos: last frame of shot N → first frame of shot N+1 | Small |
| Batch multi-shot | "Generate all videos" — iterate through shots, use previous shot's last frame as next shot's first frame | Medium |

---

## Competitive Analysis

### Updated Gap Analysis (Post-Implementation)

| # | Feature | Status | Who Had It |
|---|---------|--------|-----------|
| 1 | Storyboard Strip in SceneEditor | **DONE** | DaVinci, Storyboarder |
| 2 | Snapshot to next frame | **DONE** | Runway |
| 3 | Video hover preview | **DONE** | YouTube, Netflix |
| 4 | Drag reorder in SceneEditor | **DONE** | Boords, all NLEs |
| 5 | Animatic playback | **DONE** | Boords, Storyboarder |
| 6 | Scene grouping | **DONE** | LTX Studio |
| 7 | Blend modes | **DONE** | Movavi, DaVinci, Premiere |
| 8 | Subtitle track | **DONE** | Movavi, Premiere, DaVinci |
| 9 | Script-to-storyboard (core pipeline) | **EXISTS** (70-80%) | LTX Studio |

**Remaining gaps:** Auto subtitles (speech recognition), AI script writing, batch frame generation, multi-shot AI generation.

### Our Unique Position (Updated)

We are the only tool that combines **pre-production (storyboard) + AI generation (image/video/music) + editing (canvas/timeline) + director's continuity view** in one web-based platform. With blend modes and subtitle track, our VideoEditor now covers the core editing features of desktop tools like Movavi, while our AI capabilities (15+ models) remain unmatched.

### Priority Roadmap (Updated)

| Phase | Features | Status |
|-------|----------|--------|
| **Phase 1** | Storyboard Strip + Snapshot + Video hover preview | **DONE** |
| **Phase 2** | Drag reorder + Animatic + Scene grouping + Outputs Row + Comparison + Notes | **DONE** |
| **Phase 3** | Blend modes + Subtitle track | **DONE** |
| **Phase 4** | AI script writing + Batch generation + Style metadata flow | Future (small gaps) |
| **Phase 5** | Multi-shot AI generation + Auto subtitles | Future (large) |
