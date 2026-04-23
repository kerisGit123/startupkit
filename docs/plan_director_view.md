# Director's View — SceneEditor Enhancement Plan

## The Problem

As a film director working in the SceneEditor, I'm editing **one storyboard frame at a time** in isolation. I can't see:
- What the **previous frame** looks like (visual continuity)
- What the **next frame** should transition to
- The **overall flow** of my storyboard sequence
- How my **generated outputs** (images, videos, music) relate to the narrative timeline

The GeneratedImagesPanel (left sidebar) shows outputs for the current frame, but it's a vertical list — not a filmmaking-oriented view.

## What Film Directors Actually Need

### 1. Visual Continuity Strip (The "God View")

Film directors use a **storyboard strip** — a horizontal row of frame thumbnails showing the sequence. When editing frame 5, you see frames 3-4 on the left and frames 6-7 on the right.

**Current flow:**
```
[Generated Panel]  [Canvas: Frame 5]  [Tools]
     (vertical)        (isolated)
```

**Director's flow:**
```
[Frame 3] [Frame 4] [FRAME 5 — ACTIVE] [Frame 6] [Frame 7]
                     [Canvas Editor]
                     [Prompt + Toolbar]
```

### 2. Key Requirements

A film director needs to answer these questions instantly:
- "Does this frame match the previous one visually?" (continuity)
- "What's the camera angle/mood transition?" (flow)
- "Which frames still need work?" (status)
- "What's the overall pacing?" (duration)

---

## Proposed Solution: Storyboard Strip

### Concept

A **horizontal filmstrip** at the top of the SceneEditor, showing neighboring storyboard items as small thumbnails. The active frame is highlighted and centered.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ◀  [03]  [04]  [05 ★]  [06]  [07]  ▶     1:24 / 5:30     │  ← Storyboard Strip
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Canvas / Editor                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Prompt textarea                              Actions ▾     │
│  IMAGE  VIDEO  MUSIC  AUDIO  │ Model  │ 1:1  1K  PNG       │  ← Toolbar
└─────────────────────────────────────────────────────────────┘
```

### Storyboard Strip Details

#### Media Priority (What Shows as Thumbnail)

This strip focuses on **image and video only** — audio/music is handled by the VideoEditor timeline. The thumbnail shows the **most complete visual** output:

| Priority | Source | Indicator |
|----------|--------|-----------|
| 1st | `videoUrl` | Small play triangle overlay + VIDEO badge |
| 2nd | `primaryImage` / `imageUrl` | IMAGE badge |
| 3rd | Generated image files (latest completed) | AI badge |
| 4th | Gray placeholder | Empty frame icon |

Video wins over image because it's the more complete output.

#### Frame Card Design

```
┌────────────────────┐
│ ▶ [video/image]    │  ← 80x56px thumbnail (16:9 crop)
│   ┌─────┐          │     video: play icon overlay
│   │VIDEO│          │     badges: top-left (VIDEO/IMAGE/AI)
│   └─────┘          │     audio: small waveform icon bottom-right
├────────────────────┤
│ 03  Battle  ● 2.5s │  ← frame#, title (truncated), status dot, duration
└────────────────────┘

Active frame: border-[#3B82F6], slightly larger scale(1.05)
```

#### Hover Behavior — Mini Preview

When hovering a frame for 500ms+:

- **Video frame**: Auto-play muted video in the thumbnail (like YouTube hover preview)
- **Image frame**: Show full image (no crop) in a slightly larger tooltip (160x100px)

This gives the director an instant visual preview without navigating away.

#### Click Behavior

- **Single click** → navigate to that frame (existing `setActiveShotId`)
- **Double click** → navigate + auto-play video if available
- **Right click** → context menu (mark complete, duplicate, delete)

#### Media Type Toggle (Active Frame Only)

When a frame has BOTH image and video, the active frame shows a small toggle:

```
                    [FRAME 5 — ACTIVE]
                      ● ○
                    img vid
```

Click to switch between image/video view — useful to check "do I have a video for this frame yet?"

### Data Available (Already in the System)

Per storyboard item we already have:
- `imageUrl` / `primaryImage` — image thumbnail
- `videoUrl` — video output
- `order` — position in sequence
- `title` — frame name
- `duration` — timing
- `frameStatus` — draft / in-progress / completed
- `generationStatus` — none / pending / generating / completed / failed

Plus via `storyboard_files` (filtered by `categoryId === item._id`):
- Generated images and videos for this frame
- Generation status, model used

All accessed via existing `shots[]` array + `projectFiles[]` props in SceneEditor.

Note: Audio/music is NOT part of this strip — that's handled by the VideoEditor timeline.

### Implementation Approach

**Option A: Inline Strip (Recommended)**
- A thin horizontal bar (56-72px tall) between the SceneEditorHeader and the canvas
- Shows 5-9 frames depending on screen width
- Auto-scrolls to keep active frame centered
- Minimal — doesn't steal vertical space from the canvas

**Option B: Expandable Film Roll**
- Collapsed: just shows frame number + status dots in a thin 32px bar
- Expanded: reveals thumbnails (click to toggle)
- More compact when collapsed

**Option C: Side Strip**
- Vertical strip on the far left (before GeneratedImagesPanel)
- Always visible, doesn't affect canvas width
- Works well on wide screens

### Recommendation: Option A (Inline Strip)

Reasons:
- Most natural for filmmakers (horizontal = timeline)
- Minimal vertical footprint (56px)
- Uses existing navigation (`setActiveShotId`, `shots[]`)
- No conflict with GeneratedImagesPanel (left sidebar)
- Auto-centers on active — "god view" without manual scrolling

---

## Component Design

### New Component: `StoryboardStrip.tsx`

```
Location: app/storyboard-studio/components/editor/StoryboardStrip.tsx

Props:
  shots: Shot[]                    — all storyboard items, sorted by order
  activeShotId: string             — current active frame
  onNavigateToShot: (id) => void   — navigation callback
  projectFiles?: any[]             — for generation status + generated media lookup

Design tokens (from plan_final_design.md):
  Container: bg-[#15181C]/95 backdrop-blur-md border-b border-[#32363E]
             h-[72px] px-4 flex items-center
  Frame card: bg-[#0B0D10] rounded-md border border-[#1E2126]
              w-[80px] h-[56px] (thumbnail 16:9)
              hover:border-[#32363E] transition
  Active frame: border-[#3B82F6] ring-1 ring-[#3B82F6]/30 scale-105
  Frame number: text-[10px] text-[#9CA3AF] font-medium
  Title: text-[9px] text-[#9CA3AF] truncate max-w-[60px]
  Duration: text-[9px] text-[#9CA3AF]
  Status dot: w-1.5 h-1.5 rounded-full
    - completed: bg-emerald-400
    - in-progress: bg-amber-400
    - draft: bg-[#32363E]
  Badges: text-[7px] px-1 py-0.5 rounded font-semibold
    - VIDEO: bg-red-500 text-white
    - IMAGE: bg-emerald-500 text-white
  Play overlay: w-5 h-5 bg-black/50 rounded-full (play triangle, video frames only)
  Scroll arrows: w-6 h-6 rounded-md text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5
  Media toggle (active, when both img+vid exist): w-1.5 h-1.5 rounded-full
    - selected: bg-[#E5E7EB]
    - unselected: bg-[#32363E]
  Duration: text-[9px] text-[#9CA3AF]
  Status dot: w-1.5 h-1.5 rounded-full (green/yellow/gray)
  Scroll arrows: text-[#9CA3AF] hover:text-[#E5E7EB]
```

### Integration Point

In SceneEditor's main render (line ~3947):
```
<div className="fixed inset-0 ...">
  <SceneEditorHeader ... />        ← existing
  <StoryboardStrip ... />          ← NEW (56px height)
  <div className="flex-1 relative">
    <canvas / editor area>
    <toolbars>
  </div>
</div>
```

### Interaction Design

1. **Click frame** → navigate to that shot
2. **Hover frame** → show tooltip with title + description
3. **Drag frame** → reorder (future enhancement)
4. **Right-click frame** → context menu (mark complete, duplicate, delete)
5. **Scroll wheel** on strip → horizontal scroll through frames
6. **Active frame auto-centers** with smooth scroll animation

---

---

## Snapshot Feature — "Last Frame → Next Frame" Continuity

### The Director's Workflow

A film director finishes shot 5, takes the **last frame** of the video, and uses it as the **opening reference** for shot 6. This ensures visual continuity between shots.

### What Already Exists

**VideoEditor snapshot** (lines 1019-1101):
- Captures current video frame using offscreen canvas + `drawImage` + `toBlob`
- Creates a PNG blob from any point in the video playback
- Currently saves as a new clip on the video track

**SceneEditor snapshot** (lines 151-275):
- `buildSnapshotCanvas()` — captures the canvas editor content
- `buildUploadFile()` — converts to File object for R2 upload
- `handleSaveToR2()` — uploads to R2 and logs to `storyboard_files`

**Database fields already exist** (no new table needed):
- `storyboard_items.imageUrl` — frame reference image
- `storyboard_items.primaryImage` — primary image for cards
- `storyboard_files` — generated files linked via `categoryId`

### Snapshot Flow for Director's View

#### Save to Current Frame
```
User clicks "Snapshot" on video at 3:45
  → capture frame via canvas.drawImage(video)
  → canvas.toBlob("image/png")
  → uploadToR2(blob)
  → update storyboard_items[current].imageUrl = r2Url
  → Strip thumbnail updates immediately
```

#### Save to Next Frame (Continuity Bridge)
```
User clicks "Snapshot → Next Frame"
  → capture frame (same as above)
  → uploadToR2(blob)
  → update storyboard_items[next].imageUrl = r2Url
  → Next frame in strip now shows this image as its starting reference
  → Director navigates to next frame, sees the continuity reference
```

### Implementation — Reuse Existing Code

The snapshot logic from VideoEditor can be extracted into a shared utility:

```typescript
// lib/storyboard/snapshotUtils.ts (new utility, ~50 lines)

export async function captureVideoFrame(videoElement: HTMLVideoElement): Promise<Blob> {
  // Reuse VideoEditor's canvas capture pattern (lines 1069-1086)
  const w = videoElement.videoWidth || 1920;
  const h = videoElement.videoHeight || 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(videoElement, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(), "image/png");
  });
}

export async function captureImageFrame(imageUrl: string): Promise<Blob> {
  // Fetch image, draw to canvas, return blob
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;
  await new Promise(r => { img.onload = r; });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(), "image/png");
  });
}
```

### Snapshot Buttons in the Storyboard Strip

The strip's active frame card gets two small action buttons on hover:

```
┌────────────────────┐
│   [current frame]  │
│        📷 ⏭       │  ← "Save frame" and "Send to next"
├────────────────────┤
│ 05  Battle  ● 2.5s │
└────────────────────┘
```

- **📷 Camera icon** — snapshot current canvas/video → save as this frame's imageUrl
- **⏭ Forward icon** — snapshot → save as NEXT frame's imageUrl (continuity bridge)

### No New Tables Required

Everything fits existing schema:
- `storyboard_items.imageUrl` — stores the snapshot URL
- `storyboard_items.primaryImage` — optional, for card display
- `storyboard_files` — snapshot saved as a generated file (category: "snapshot")
- R2 storage — existing upload pipeline (`uploadToR2()`)

The only new code is:
1. `snapshotUtils.ts` — shared capture utility (~50 lines)
2. Snapshot buttons in StoryboardStrip — 2 buttons with handlers
3. A Convex mutation call to update `imageUrl` on the target item (existing `update` mutation)

---

## Phase 2: Enhanced Director Features (Future)

### A. Generated Outputs Row
Show generated images/videos as a secondary row below the storyboard strip for the active frame:
```
[Frame 3] [Frame 4] [FRAME 5]  [Frame 6]
                     [gen1][gen2][gen3]    ← generated images/videos for active frame
```

### B. Comparison Mode
Side-by-side: previous frame | current frame | next frame.
Useful for checking visual continuity between shots.

### C. Director's Notes
Per-frame notes overlay visible in the strip — quick annotations without opening the full editor.

### D. Color Grading Preview
Show the color palette/mood of each frame as a small color bar below the thumbnail.

---

## Summary

**Phase 1 (this plan):** Build `StoryboardStrip.tsx` — a horizontal filmstrip showing neighboring frames with thumbnails, status, and duration. Integrate between header and canvas.

**Effort:** Small component (~200 lines), uses existing data and navigation. No backend changes needed.

**Impact:** Transforms the isolated single-frame editor into a director's continuity view. Film directors can see the flow, check visual consistency, and navigate frames without leaving the editor.

---

## Competitive Analysis

### What We Already Have (The 80%)

| Feature | Competitor | Our Equivalent |
|---------|-----------|----------------|
| Element consistency | LTX Elements | `linkedElements` + `elementNames` + prompt @mentions |
| Character consistency | Kling character locking | Reference images + prompt mentions + style system |
| Multi-shot video | Kling 6-shot | Seedance multimodal/showcase/UGC modes |
| Filmstrip timeline | Storyboarder, Movavi | VideoEditor (multi-track with filmstrip thumbnails) |
| Drag reorder | Boords, all NLEs | Storyboard board view (card drag reorder) |
| Animatic | Boords | Video generation (image to video per frame) |
| In-editor AI | Runway | EditImageAIPanel (inpaint, area edit, image-to-image) |
| Frame as input | Runway | Reference images + VideoEditor snapshot |
| Canvas arrangement | Premiere Freeform | Storyboard card grid (reorderable cards) |
| Multi-model AI | None match | 15+ models (image, video, music, audio, TTS) |
| Canvas draw + AI | None match | EditImageAIPanel (draw/annotate + AI inpaint) |
| Real-time sync | None match | Convex (instant, no save button) |
| Integrated music AI | None match | AI Music, Cover Song, Extend, Create Persona |
| Text-to-speech | None match | ElevenLabs TTS integrated |
| Credit-based pricing | None match | Per-model credits (not subscription-locked) |

### The Missing 20% — What We Don't Have Yet

| # | Feature | What It Is | Who Has It | Effort |
|---|---------|-----------|-----------|--------|
| 1 | **Storyboard Strip in SceneEditor** | See neighboring frames while editing one frame | DaVinci dual timeline, Storyboarder filmstrip | Small — ~250 lines, no backend |
| 2 | **Snapshot to next frame** | Capture last frame of video, set as next frame's reference | Runway "use current frame" | Small — reuse existing snapshot code |
| 3 | **Video hover preview** | Auto-play muted video on thumbnail hover | YouTube, Netflix | Small — HTML5 video onMouseEnter |
| 4 | **Drag reorder in SceneEditor** | Reorder frames from within the strip (not just board view) | Boords, all NLEs | Medium — drag-and-drop + Convex mutation |
| 5 | **Animatic playback** | Play through all frames as timed slideshow | Boords, Storyboarder | Medium — timer + image/video sequence |
| 6 | **Scene grouping** | Group shots under scene headers in strip | LTX Studio | Medium — visualize existing `sceneId` |
| 7 | **Blend modes** | Overlay compositing modes on video tracks | Movavi, DaVinci, Premiere | Medium — canvas compositing in VideoEditor |
| 8 | **Auto subtitles** | Speech-to-text auto-generated timed subtitles | Movavi, Premiere, DaVinci | Large — needs speech recognition API |

Items 1-3 are Phase 1 (this sprint). Items 4-6 are Phase 2. Items 7-8 are Phase 3+.

### Competitor Deep Dive

#### Movavi Video Editor

**What it is:** Desktop video editor targeting beginners/hobbyists ($80 one-time).

**Their UI layout:**
```
+------------------+-------------------+
|   Tool Panel     |   Preview Monitor |
|   (left tabs)    |   (playback)      |
+------------------+-------------------+
|   Multi-track Timeline (full width)  |
|   [Subtitles track]                  |
|   [Video track - filmstrip]          |
|   [Audio track - waveform]           |
+--------------------------------------+
```

**Their strengths vs ours:**
- Clean, minimal UI (low learning curve)
- Blend modes on overlay tracks (overlay, color dodge, linear dodge, lighten)
- Auto subtitles with font/color customization
- Built-in content library (transitions, stickers, music)
- Lightweight — runs on low-end hardware

**Their weaknesses vs ours:**
- No AI generation at all (no image/video/music AI)
- No storyboard/pre-production planning
- No real-time collaboration
- Fixed UI (cannot customize layout)
- No canvas drawing/annotation
- Desktop only (not web-based)
- No element/character consistency system
- Export is manual (no direct publish)

**What to adopt from Movavi:**
- Blend modes on video tracks (achievable with canvas compositing)
- The clean "filmstrip thumbnail" density in timeline (our VideoEditor could show more frames)
- Subtitle track concept (we have TTS, could add subtitle track to VideoEditor)

#### LTX Studio

**Their strengths vs ours:**
- Script-to-storyboard auto-division (we don't have script import)
- "Retake" — re-shoot specific moments without full regeneration
- Camera keyframes (crane, orbit, tracking) as visual controls

**Their weaknesses vs ours:**
- Fewer AI models (their own models only)
- No music/audio AI generation
- No canvas draw/edit
- No real-time database

#### Kling 3.0

**Their strengths vs ours:**
- "AI Director" — sequence-level prompting (one prompt → 6 camera cuts)
- Character locking via latent representation (more robust than prompt-based)

**Their weaknesses vs ours:**
- Only video generation (no image editing, no music, no storyboard)
- No editing tools
- No timeline/sequencing

#### DaVinci Resolve

**Their strengths vs ours:**
- Industry-leading color grading (we have none)
- Dual timeline "god view" (we're building the strip)
- Fairlight audio (full DAW)
- Fusion compositing (full node-based VFX)

**Their weaknesses vs ours:**
- No AI generation
- Desktop only, heavy hardware requirements
- Steep learning curve
- No storyboard planning
- No real-time collaboration (free version)

### Our Unique Position

We are the only tool that combines **pre-production (storyboard) + AI generation (image/video/music) + editing (canvas/timeline)** in one web-based platform. Every competitor does 1-2 of these; none do all three.

The 20% gap is purely **in-editor visual context** (the storyboard strip) and **convenience features** (blend modes, auto subtitles, animatic playback). None of these require architectural changes — they're UI additions on top of existing data.

### Priority Roadmap

| Phase | Features | Effort |
|-------|----------|--------|
| **Phase 1** (now) | Storyboard Strip + Snapshot to next frame + Video hover preview | 1-2 days |
| **Phase 2** | Drag reorder in strip + Animatic playback + Scene grouping | 3-5 days |
| **Phase 3** | Blend modes in VideoEditor + Subtitle track | 1-2 weeks |
| **Phase 4** | Multi-shot AI generation + Script-to-storyboard | 2-4 weeks |
