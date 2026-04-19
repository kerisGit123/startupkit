# Video Combiner — Simple Cut & Combine Tool

## Goal

A simple tool to cut/trim video and audio, then combine clips + images into a single MP4 output. NOT a full timeline editor — focused on the 90% use case: arrange scenes, trim unwanted parts, add intro/outro, add music, export.

## Target Users

Storyboard Studio users who generate AI videos/images and want to produce a final cut.

## Core Features

### 1. Media Browser (Left Panel)
- Load videos, images, audio from `storyboard_files` by project
- Filter by file type
- Click or drag to add to sequence

### 2. Preview Player (Right Panel)
- Play selected clip
- Shows trim controls when a clip is selected

### 3. Trim Control (like pic1 reference — audio trim UI)
- Waveform visualization for audio
- Thumbnail strip for video
- Draggable start/end handles
- Shows IN point, OUT point, total duration
- Shows how much is being trimmed (% saved)
- Play button to preview trimmed section only

### 4. Sequence Bar (Bottom)
- Horizontal strip showing clips in order
- Drag to reorder
- Each clip shows: thumbnail, name, trimmed duration
- Scissors icon (✂) indicates trimmed clips
- Click a clip to select it for preview/trim

### 5. Image Clips
- Images become clips with configurable duration (default 3s)
- Useful for welcome/intro screens and "The End" cards
- Duration adjustable via slider or input

### 6. Audio Track
- Background music/audio layer
- Same trim UI as video
- Volume control per audio clip
- Can be longer than video sequence (will be cut to match)

### 7. Export
- Resolution: 720p / 1080p / 4K dropdown
- Format: MP4 (H.264 + AAC)
- Server-side FFmpeg processing via API route
- Progress indicator
- Output saved to `storyboard_files` as a new file

## Architecture

```
Browser (UI)                    Server (Processing)
┌──────────────┐               ┌──────────────────┐
│ React Component│  ──POST──>  │ /api/storyboard/  │
│ - Media browser│  (EDL JSON) │  combine-video    │
│ - Preview      │             │                   │
│ - Trim UI      │             │ 1. Download clips  │
│ - Sequence bar │             │    from R2         │
│ - Export btn   │  <──SSE──   │ 2. FFmpeg concat   │
│                │  (progress) │ 3. Upload to R2    │
└──────────────┘               └──────────────────┘
```

### Edit Decision List (EDL) — sent to server

```json
{
  "projectId": "xxx",
  "resolution": "1080p",
  "clips": [
    {
      "type": "image",
      "r2Key": "org_xxx/generated/welcome.png",
      "duration": 3
    },
    {
      "type": "video",
      "r2Key": "org_xxx/generated/scene1.mp4",
      "trimStart": 2.0,
      "trimEnd": 8.0
    },
    {
      "type": "video",
      "r2Key": "org_xxx/generated/scene2.mp4",
      "trimStart": 0,
      "trimEnd": 5.5
    },
    {
      "type": "image",
      "r2Key": "org_xxx/generated/theend.png",
      "duration": 3
    }
  ],
  "audio": {
    "r2Key": "org_xxx/uploads/music.mp3",
    "trimStart": 0,
    "trimEnd": 15,
    "volume": 0.7
  }
}
```

### Server Processing (FFmpeg)

1. Download all clip files from R2 to temp dir
2. For each video clip: `ffmpeg -i input.mp4 -ss {trimStart} -to {trimEnd} -c copy trimmed_N.mp4`
3. For each image clip: `ffmpeg -loop 1 -i input.png -t {duration} -pix_fmt yuv420p image_N.mp4`
4. Concat all clips: `ffmpeg -f concat -i filelist.txt -c copy combined.mp4`
5. Mix audio: `ffmpeg -i combined.mp4 -i music.mp3 -filter_complex "[1:a]volume=0.7[a]" -map 0:v -map "[a]" -shortest final.mp4`
6. Upload final.mp4 to R2
7. Log as new storyboard_file

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  Video Combiner                          [Export MP4]│
│  ┌──────────┐  ┌───────────────────────────────────┐│
│  │ Media    │  │  Preview Player                   ││
│  │ Browser  │  │  ┌─────────────────────────────┐  ││
│  │          │  │  │                             │  ││
│  │ 📹 Videos│  │  │      Video / Image          │  ││
│  │ 🖼 Images│  │  │      Preview Here           │  ││
│  │ 🎵 Audio │  │  │                             │  ││
│  │          │  │  └─────────────────────────────┘  ││
│  │ [files]  │  │                                   ││
│  │ [files]  │  │  ┌─ Trim ──────────────────────┐  ││
│  │ [files]  │  │  │ [|████████████|         ]   │  ││
│  │          │  │  │ IN: 0:02   OUT: 0:08        │  ││
│  │          │  │  │ Duration: 6s (trimmed 50%)  │  ││
│  │          │  │  └─────────────────────────────┘  ││
│  └──────────┘  └───────────────────────────────────┘│
│                                                      │
│  ┌─ Sequence ───────────────────────────────────────┐│
│  │ [Welcome 3s] [Scene1 ✂6s] [Scene2 5s] [End 3s] ││
│  │ 🎵 music.mp3 ✂0:00-0:17  Vol: ██░              ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Trim UI Detail (inspired by audio trim reference)

### Video Trim
- Show video thumbnail strip (extract frames at 1fps intervals)
- Draggable cyan handles for IN/OUT points
- Playhead scrubber
- Play button to preview trimmed section

### Audio Trim
- Show waveform visualization (canvas-based)
- Same draggable handles
- Volume control
- Play preview

### Image Duration
- Simple slider: 1s — 10s
- Or number input

## Tech Stack

- **UI**: React component within storyboard-studio
- **Waveform**: WaveSurfer.js or custom canvas
- **Video thumbnails**: HTML5 video element + canvas capture
- **Preview**: HTML5 video/audio elements
- **Export**: Server-side FFmpeg via API route
- **Storage**: R2 (input and output)
- **Progress**: Server-Sent Events (SSE) or polling

## Phase Plan

### Phase 1 — MVP
- [ ] Media browser (load from storyboard_files)
- [ ] Sequence bar (add, reorder, remove clips)
- [ ] Basic trim (start/end handles, no waveform)
- [ ] Image clips with duration
- [ ] Export via FFmpeg API route
- [ ] Save output to storyboard_files

### Phase 2 — Polish
- [ ] Waveform visualization for audio
- [ ] Video thumbnail strip for trim UI
- [ ] Volume control per audio clip
- [ ] Preview playback of full sequence
- [ ] Progress bar during export

### Phase 3 — Advanced (if needed)
- [ ] Multiple audio tracks
- [ ] Simple transitions (fade in/out)
- [ ] Text overlay (title cards)
- [ ] Undo/redo
