# Video Editor — Current State & Enhancement Plan

> **Date:** 2026-04-25
> **Status:** Current state documented, enhancements planned
> **File:** `app/storyboard-studio/components/editor/VideoEditor.tsx` (1,795 lines)

---

## 1. Current Architecture

### Tech Stack
- **Playback:** HTML5 `<video>` + `<audio>` elements, `requestAnimationFrame` loop (60fps)
- **Export (Video):** WebCodecs `VideoEncoder` + `mp4-muxer` -> H.264 MP4 (1920x1080, 30fps, 8Mbps)
- **Export (Audio):** Web Audio API -> WAV (44.1kHz, 16-bit stereo)
- **Storage:** Exported files saved to Cloudflare R2 + `storyboard_files` collection
- **Browser Support:** Chrome/Edge only (WebCodecs requirement)

### Three-Track Timeline

```
+-- Ruler (adaptive ticks: 1s/5s/10s/30s/60s based on zoom) --+
|                                                                |
+-- Video Track (120px) ----------------------------------------+
|  [Clip 1: video] [Clip 2: image] [Clip 3: video]             |
+-- Audio Track (100px) ----------------------------------------+
|  [Audio 1: music]          [Audio 2: voiceover]               |
+-- Subtitle Track (60px) --------------------------------------+
|  [Sub1: "Hello"]  [Sub2: "World"]                             |
+---------------------------------------------------------------+
```

### Data Models

```typescript
// Video/Image/Audio clips
interface TimelineClip {
  id: string;
  type: "video" | "image" | "audio";
  src: string;
  name: string;
  duration: number;
  trimStart: number;          // seconds trimmed from start
  trimEnd: number;            // seconds trimmed from end
  originalDuration: number;
  blendMode?: BlendMode;      // normal, multiply, screen, overlay, etc.
  opacity?: number;           // 0-100
}

// Subtitle clips
interface SubtitleClip {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "center" | "bottom";
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  fontWeight: "normal" | "bold";
}

type BlendMode = "normal" | "multiply" | "screen" | "overlay"
  | "darken" | "lighten" | "color-dodge" | "color-burn";
```

### Clip Operations (already built)

| Operation | How it works |
|-----------|-------------|
| **Add clip** | Drag from file browser, auto-routes to video or audio track |
| **Trim** | Left/right resize handles, min 0.1s visible duration |
| **Split** | `S` key or button, splits at playhead position |
| **Range Cut** | Dialog with start/end needles, extracts middle portion |
| **Reorder** | Drag-and-drop within track |
| **Delete** | Delete key or button |
| **Copy/Paste** | Ctrl+C / Ctrl+V with clipboard state |
| **Undo** | History array of timeline states |
| **Blend mode** | Per-clip dropdown (8 modes) |
| **Opacity** | Per-clip slider (0-100%) |

### Subtitle System (already built)

| Feature | Status |
|---------|--------|
| Add subtitle at playhead | Done |
| Text input (inline editing) | Done |
| Position (top/center/bottom) | Done |
| Font weight (normal/bold) | Done |
| Font color picker | Done |
| Background color | Done |
| Font size | Done |
| Timeline visualization | Done (yellow gradient blocks) |
| Playback preview overlay | Done (positioned div) |
| Export rendering on canvas | Done (ctx.fillText with background rect) |

### Export Pipeline

**Video Export (MP4):**
1. Load all clips as blobs / ImageBitmap
2. Initialize `VideoEncoder` (H.264 high profile) + `mp4-muxer`
3. For each frame (30fps): draw clip to canvas, apply blend mode + opacity, render active subtitle
4. Encode frame, keyframe every 4 seconds
5. Finalize muxer, download as MP4 + save to R2

**Audio Export (WAV):**
1. Load all audio clips as blobs
2. Decode with Web Audio API
3. Apply trim (startSample/endSample)
4. Interleave stereo channels to PCM
5. Build WAV header, download + save to R2

---

## 2. What's Missing / Enhancement Opportunities

### Priority 1: Subtitle Enhancements (Low effort)

Current subtitles are basic. Improvements:

| Enhancement | Effort | Notes |
|-------------|--------|-------|
| Text outline/shadow | Small | Add `ctx.strokeText()` in export, CSS text-shadow in preview |
| Multi-line wrapping | Small | Word-wrap based on canvas width, currently single-line |
| Font family selector | Small | Reuse canvas editor's FontFamily type |
| Opacity control | Small | Add alpha to backgroundColor |
| Animation (fade in/out) | Medium | Interpolate alpha over first/last 0.3s of clip |
| Import SRT/VTT | Medium | Parse standard subtitle formats |
| Auto-generate from TTS | Medium | Use ElevenLabs TTS timestamps if available |

### Priority 2: Audio Mixing (Medium effort)

Currently audio clips are sequential (no overlap). Improvements:

| Enhancement | Effort | Notes |
|-------------|--------|-------|
| Volume per clip | Small | Add `volume` field to TimelineClip, apply to audio element |
| Fade in/out | Medium | Gain node ramp in Web Audio during export |
| Audio from video clips | Medium | Extract audio track, mix with audio track |
| Waveform visualization | Medium | Web Audio API `analyserNode` for visual feedback |

### Priority 3: Multi-Layer Video (High effort)

Currently one video track. Picture-in-picture or overlay would need:

| Enhancement | Effort | Notes |
|-------------|--------|-------|
| Second video track (overlay) | High | Stack two video tracks, composite with blend/opacity |
| Picture-in-picture | High | Position/scale overlay clip on canvas |
| Transition effects | High | Crossfade, wipe between clips |

### Priority 4: Timeline UX (Medium effort)

| Enhancement | Effort | Notes |
|-------------|--------|-------|
| Snap to grid | Small | Quantize clip positions to ruler ticks |
| Clip thumbnails strip | Medium | Generate multiple thumbnails per video clip |
| Keyboard shortcuts panel | Small | Show available shortcuts (S=split, Space=play, etc.) |
| Zoom to fit | Small | Auto-calculate pxPerSec to show all clips |

---

## 3. Relationship to Other Components

```
SceneEditor (frame-by-frame editing)
    |
    +-- CanvasEditor (drawing, bubbles, text, shapes, inpaint)
    |       |
    |       +-- BubbleSVG (10 bubble types, SVG rendering)
    |       +-- TextElement (font families, positioning)
    |       +-- ShapeElement (rectangles, ellipses, lines)
    |
    +-- VideoImageAIPanel (AI generation, camera tools)
    |       |
    |       +-- CameraAnglePicker (3D angle, Pro+)
    |       +-- ColorPalettePicker (palette extraction, Pro+)
    |       +-- SpeedRampEditor (speed curves, Pro+)
    |       +-- VirtualCameraStyle (camera studio, Pro+)
    |
    +-- StoryboardStrip (filmstrip navigation)

VideoEditor (multi-track timeline, independent from SceneEditor)
    |
    +-- Video Track (clips from storyboard frames)
    +-- Audio Track (music AI, uploaded audio)
    +-- Subtitle Track (timed text overlays)
    +-- Export: MP4 (WebCodecs) + WAV (Web Audio)
```

---

## 4. Feature Gating

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Video editor access | No | Yes | Yes |
| Subtitle track | No | Yes | Yes |
| Blend modes + opacity | No | Yes | Yes |
| Video export (MP4) | No | Yes | Yes |
| Audio export (WAV) | No | Yes | Yes |

Free users see the video editor in the navigation but get a lock icon + upgrade prompt when clicking.

---

## 5. Technical Limitations

| Limitation | Impact | Possible Fix |
|------------|--------|-------------|
| Chrome/Edge only (WebCodecs) | No Firefox/Safari export | Fallback to ffmpeg.wasm (heavy, ~25MB) |
| No audio in video export | MP4 is video-only | Mux audio track during export (mp4-muxer supports audio) |
| Sequential clips only | No overlapping clips per track | Would need position-based timeline (significant refactor) |
| Memory pressure on large projects | 1GB+ files may crash | Stream processing, worker-based encoding |
| 1920x1080 fixed export | No resolution options | Add resolution selector (720p, 1080p, 4K) |
| 30fps fixed | No framerate options | Add FPS selector (24, 30, 60) |

---

## 6. Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `app/storyboard-studio/components/editor/VideoEditor.tsx` | 1,795 | Main editor: timeline, playback, export |
| `app/storyboard-studio/shared/CanvasEditor.tsx` | 2,966 | Canvas: drawing, bubbles, text, shapes |
| `app/storyboard-studio/shared/canvas-types.ts` | 131 | Type definitions (Bubble, TextElement, etc.) |
| `app/storyboard-studio/shared/canvas-helpers.ts` | 167 | SVG path generation, math helpers |
| `app/storyboard-studio/shared/canvas-components.tsx` | 400+ | BubbleSVG, ResizeHandles, MaskCanvas |
| `app/storyboard-studio/components/modals/ExportModal.tsx` | 260 | Export format selection modal |
