Building the Max Imagine Video Editor
A developer guide covering the architecture, design decisions, and implementation details of the browser-based video editor built with vanilla JavaScript, HTML5, and the WebCodecs API.
---
Table of Contents
Overview
Architecture
File Structure
HTML Layout
JavaScript Module (video-editor.js)
Data Layer (db.js / SheetDB)
CSS Structure
Core Concepts
Timeline Implementation
Playback Engine
Drag & Drop System
Video Rendering / Export
Keyboard Shortcuts
Extending the Editor
---
Overview
The video editor is a single-page browser application that lets users:
Browse a media gallery of project videos and images
Drag and drop clips onto a multi-track timeline
Trim, split, copy/paste, and reorder clips
Scrub through the timeline with a playhead
Play back the composition in real time with frame-accurate preview
Render the final result to an MP4 file entirely client-side using WebCodecs + mp4-muxer
No server-side processing is needed for editing or rendering. The backend (`api.php` via `SheetDB`) is only used for persisting the timeline state and fetching media assets.
---
Architecture
```
┌─────────────────────────────────────────────────────┐
│  video-editor.html                                  │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Left Panel│  │ Preview Panel│  │   Toolbar    │ │
│  │ (Gallery) │  │  (<video>)   │  │  (Mode tog.) │ │
│  └───────────┘  └──────────────┘  └──────────────┘ │
│  ┌─────────────────────────────────────────────────┐│
│  │  Timeline Section                               ││
│  │  ┌──────────────────────────┐ ┌──────────────┐  ││
│  │  │ Toolbar (play/trim/zoom) │ │ Save / Render│  ││
│  │  └──────────────────────────┘ └──────────────┘  ││
│  │  ┌─ Ruler (canvas) ────────────────────────────┐││
│  │  │ 0:00  0:01  0:02  0:03  ...                 │││
│  │  └─────────────────────────────────────────────┘││
│  │  ┌─ Video Track ───────────────────────────────┐││
│  │  │ [Clip A]  [Clip B]       [Clip C]           │││
│  │  └─────────────────────────────────────────────┘││
│  │  ┌─ Audio Track ───────────────────────────────┐││
│  │  │                                             │││
│  │  └─────────────────────────────────────────────┘││
│  │  │← Playhead                                    ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
         │                              │
   ┌─────┴─────┐                  ┌─────┴─────┐
   │ db.js     │                  │ mp4-muxer │
   │ (SheetDB) │                  │ (CDN lib) │
   └───────────┘                  └───────────┘
```
The whole editor lives inside a single IIFE (`const VideoEditor = (() => { ... })()`) that exposes a minimal public API. All state is encapsulated — no globals leak.
---
File Structure
File	Purpose
`video-editor.html`	Standalone page for the video editor (also embeddable via `frame.html`)
`video-editor.js`	All editor logic — clip management, playback, timeline rendering, drag/drop, export
`db.js`	Data access layer (`SheetDB`) — wraps REST calls to `api.php` for persistence
`style.css`	All styles including video editor classes (`.ve-*` namespace, starts ~line 2090)
`frame.html`	The main frame editor page that can toggle between Frame mode and Video Editor mode
---
HTML Layout
The HTML (`video-editor.html`) is structured into three major areas:
1. Toolbar (Header)
```html
<header class="toolbar">
  <!-- Back button, logo, mode toggle (Frame / Video Editor) -->
</header>
```
The mode toggle switches between Frame view and Video Editor view. On the standalone page (`video-editor.html`), clicking "Frame" navigates to `frame.html?project=...`.
2. Workspace (`<main class="video-editor">`)
Split into two columns:
Left panel (`.ve-left-panel`): Tabbed interface with "Gallery" and "Generated" tabs. Displays media thumbnails from the project's uploaded/generated assets.
Right panel (`.ve-preview-panel`): A `<video>` element for previewing the currently selected or playing clip, plus a timecode display.
3. Timeline Section (`.ve-timeline-section`)
Timeline toolbar: Play/Pause, Stop, Split, Trim Start/End, Copy, Paste, Delete, Save, Render, Zoom controls
Ruler: A `<canvas>` element that draws tick marks and time labels
Tracks: Two track lanes (Video track 0 and Audio track 1) where clips are rendered as positioned `<div>` elements
Playhead: An absolutely-positioned vertical line indicating current playback position
4. Render Modal
A hidden overlay (`#renderModal`) that appears during video export, showing a progress bar and cancel button.
Script Loading
```html
<script src="https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.min.js"></script>
<script>
  ['db.js','video-editor.js'].forEach(function(f){
    document.write('<script src="'+f+'?v='+_v+'"><\/script>');
  });
</script>
```
Scripts are cache-busted with `Date.now()`. The mp4-muxer library is loaded from CDN for client-side MP4 encoding.
---
JavaScript Module
Module Pattern
`video-editor.js` uses a revealing module pattern via an IIFE:
```javascript
const VideoEditor = (() => {
  // Private state and functions
  let clips = [];
  let playing = false;
  // ...

  return {
    setMode,
    refresh: refreshMediaPanels,
    save: saveTimeline,
    render: renderVideo,
    positionSlider,
    initStandalone,
  };
})();
```
State Variables
Variable	Type	Description
`clips`	Array	All clips on the timeline. Each clip: `{id, src, name, track, startTime, duration, trimStart, trimEnd, originalDur}`
`clipIdCounter`	Number	Auto-incrementing ID for new clips
`selectedClipId`	Number/null	Currently selected clip
`clipboard`	Object/null	Copied clip data for paste
`playing`	Boolean	Whether playback is active
`currentTime`	Number	Current playhead position in seconds
`totalDuration`	Number	Total duration of all clips on the timeline
`pixelsPerSecond`	Number	Zoom level (default 80, range 20–400)
`dragState`	Object/null	Active drag operation metadata
`dirty`	Boolean	Whether the timeline has unsaved changes
Clip Data Model
Each clip object:
```javascript
{
  id: 1,                 // Unique identifier
  src: "path/to/video.mp4",  // Source URL
  name: "clip_name",    // Display name
  track: 0,             // Track index (0 = video, 1 = audio)
  startTime: 2.5,       // Position on timeline (seconds)
  duration: 10.0,       // Original media duration
  trimStart: 1.0,       // Seconds trimmed from the beginning
  trimEnd: 0.5,         // Seconds trimmed from the end
  originalDur: 10.0,    // Backup of original duration
}
```
The visible duration of a clip is: `duration - trimStart - trimEnd`.
---
Data Layer
The editor uses `SheetDB` (defined in `db.js`) for persistence:
```javascript
// Save timeline state
await SheetDB.saveMeta('videoEditorTimeline', jsonString);

// Load timeline state
const json = await SheetDB.loadMeta('videoEditorTimeline');

// Get project media
const images = await SheetDB.getProjectImages();

// Get generated videos (stored as cell data with "video_" prefix)
const data = await SheetDB.loadAllCells();
```
What Gets Persisted
The `serializeTimeline()` function saves:
All clip objects (src, position, trim points, track assignment)
The `clipIdCounter` so new IDs don't collide
Current `pixelsPerSecond` (zoom level)
Current `currentTime` (playhead position)
API Endpoints (via `api.php`)
Action	Method	Purpose
`projects/{id}/meta`	POST	Save key-value metadata (timeline JSON)
`projects/{id}/meta/{key}`	GET	Load metadata by key
`projects/{id}/images`	GET	List all project media files
`projects/{id}/cells`	GET	Load all cells (contains generated video references)
---
CSS Structure
All video editor styles use the `.ve-` prefix namespace and live in `style.css` starting around line 2090. The editor uses a dark theme (`background: #0f1117`).
Key CSS classes:
Class	Element
`.video-editor`	Root container, fills viewport minus toolbar/statusbar
`.ve-workspace`	Flexbox row: left panel + preview panel
`.ve-left-panel`	Gallery/Generated media sidebar
`.ve-preview-panel`	Video preview area
`.ve-timeline-section`	Bottom section with ruler + tracks
`.ve-track`	A track lane
`.ve-clip`	A clip block on the track (absolutely positioned)
`.ve-clip-handle-left/right`	Trim handles on clip edges
`.ve-playhead`	The vertical playhead indicator
`.ve-ruler-canvas`	The `<canvas>` for time ruler markings
---
Core Concepts
Coordinate System
The timeline uses a time-to-pixel mapping controlled by `pixelsPerSecond`:
```javascript
const leftPx = clip.startTime * pixelsPerSecond;  // time → position
const widthPx = visibleDuration * pixelsPerSecond; // duration → width
const time = xPixels / pixelsPerSecond;            // position → time
```
The `TRACK_LABEL_W` constant (70px) offsets the track label column.
Rendering Loop
Clips are rendered as absolutely-positioned `<div>` elements inside their track container. Every time the clip array changes, `renderClips()` rebuilds the DOM:
Clear both track containers
Loop through `clips[]`
For each clip, create a `<div>` with correct `left` and `width` based on time and zoom
Attach video thumbnail, info overlay, and trim handles
Bind mousedown for drag/select
Recalculating Duration
`recalcTotalDuration()` iterates all clips to find the rightmost endpoint:
```javascript
totalDuration = max(clip.startTime + visibleDuration) for all clips
```
This is called after any clip position, trim, or deletion change.
---
Timeline Implementation
Ruler (Canvas)
The ruler is drawn on a `<canvas>` element using `drawRuler()`:
Determine visible time range based on scroll position
Calculate tick spacing based on zoom level (`getTickStep()`)
Draw major ticks with time labels and minor sub-ticks
Redrawn on scroll, zoom, or resize events
Tick step logic:
```
pps >= 200  → 0.5s ticks
pps >= 100  → 1s ticks
pps >= 50   → 2s ticks
pps >= 25   → 5s ticks
else        → 10s ticks
```
Clip Snapping
After a move drag ends, `snapClips()` aligns clips that are within 0.3 seconds of each other:
```javascript
if (Math.abs(curr.startTime - prevEnd) < 0.3) {
  curr.startTime = prevEnd;  // Snap to previous clip's end
}
```
---
Playback Engine
Playback uses `requestAnimationFrame` for smooth, frame-accurate timing:
Start: Record `performance.now()` as the start real-time and `currentTime` as the offset
Tick: On each animation frame, calculate elapsed time and update `currentTime`
Preview sync: Find which clip overlaps `currentTime`, set the `<video>` element's `src` and `currentTime` to the correct offset (accounting for `trimStart`)
Clip transitions: When the playhead crosses from one clip to another, the preview video source is swapped
Stop: When `currentTime >= totalDuration` or user stops, cancel the animation frame and pause the video
```javascript
function tickPlayback() {
  if (!playing) return;
  const elapsed = (performance.now() - playStartRealTime) / 1000;
  currentTime = playStartOffset + elapsed;
  // Update playhead, sync preview...
  animFrameId = requestAnimationFrame(tickPlayback);
}
```
Scrubbing
Click or drag on the ruler, tracks background, or playhead head to scrub:
Convert mouse position to time using `(clientX - rect.left + scrollLeft - TRACK_LABEL_W) / pixelsPerSecond`
Call `seekTo(t)` which updates `currentTime`, the playhead, and syncs the preview
---
Drag & Drop System
Adding Clips from Gallery
Media cards in the left panel are draggable:
```javascript
card.addEventListener('dragstart', e => {
  e.dataTransfer.setData('text/x-ve-media', url);
  e.dataTransfer.effectAllowed = 'copy';
});
```
Track lanes listen for `dragover` and `drop`:
```javascript
trackEl.addEventListener('drop', e => {
  const url = e.dataTransfer.getData('text/x-ve-media');
  const dropTime = (dropX) / pixelsPerSecond;
  // Create clip at drop position...
});
```
Clicking a media card also adds the clip to the end of track 0.
Moving Clips
Mousedown on a clip starts a move drag:
Record initial `startX` and the clip's `origStart` time
On mousemove, calculate `dx` in pixels, convert to `dt` in seconds
Update `clip.startTime = max(0, origStart + dt)`
Re-render clips on every move frame
On mouseup, snap clips and mark dirty
Trimming Clips
Mousedown on a clip handle (`.ve-clip-handle-left` or `.ve-clip-handle-right`) starts a trim drag:
Left handle: Adjusts `trimStart` and `startTime` together (clip slides right as it trims)
Right handle: Adjusts `trimEnd` (clip shrinks from the right)
Both are clamped so visible duration never goes below 0.1 seconds
---
Video Rendering / Export
The render pipeline uses the WebCodecs API (`VideoEncoder`) and mp4-muxer to produce an MP4 entirely in the browser.
Pipeline Steps
Load all media — Create `<video>` / `<img>` elements for each clip
Configure encoder — H.264 (avc1.640028), 1920x1080, 30fps, 8Mbps
Frame-by-frame loop:
For each frame (frame 0 to `totalDuration * 30`), calculate the time `t`
Find which clip is active at time `t`
Seek the video element to the correct offset
Draw the video frame onto a `<canvas>`, fit to 1920x1080
Create a `VideoFrame` from the canvas and encode it
Keyframes every 4 seconds (`KEYFRAME_INTERVAL = FPS * 4`)
Flush encoder and finalize the muxer
Download the resulting `ArrayBuffer` as a `.mp4` blob
Back-pressure Handling
The encoder has a queue limit to prevent memory issues:
```javascript
if (encoder.encodeQueueSize > 10) {
  await new Promise(r => {
    encoder.ondequeue = () => { encoder.ondequeue = null; r(); };
  });
}
```
Cancellation
The render loop checks `renderCancelled` on each frame and throws to abort cleanly.
Browser Requirements
WebCodecs (`VideoEncoder`) is required — Chrome/Edge 94+. A check is performed before starting:
```javascript
if (typeof VideoEncoder === 'undefined') {
  alert('Your browser does not support WebCodecs...');
  return;
}
```
---
Keyboard Shortcuts
Key	Action
`Space`	Play / Pause
`S`	Split selected clip at playhead
`Delete` / `Backspace`	Delete selected clip
`Ctrl+C`	Copy selected clip
`Ctrl+V`	Paste clip at playhead
`Ctrl+S`	Save timeline
`Arrow Left`	Seek back 0.5s
`Arrow Right`	Seek forward 0.5s
Shortcuts are disabled when focus is on an input, textarea, or contenteditable element.
---
Extending the Editor
Adding a New Track Type
Add a new `<div class="ve-track">` in the HTML with a unique `data-track` index
Add a `trackClips{N}` DOM reference in the JS
Update `renderClips()` to route clips to the correct container
Update drag-drop listeners for the new track
Adding Audio Support
The audio track (track 1) structure is already in the HTML but not fully wired. To add audio playback:
Create an `<audio>` element pool (or use `AudioContext`)
In `tickPlayback()`, find audio clips overlapping `currentTime` and sync their playback
In `renderVideo()`, add an audio track to the muxer and mix audio frames
Adding Transitions
Between-clip transitions would require:
Extending the clip data model with `transitionIn` / `transitionOut` properties
During render, blending two video frames when clips overlap
Drawing a visual indicator on the timeline between clips
Adding Undo/Redo
Implement a history stack:
```javascript
let history = [];
let historyIndex = -1;

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.parse(JSON.stringify(clips)));
  historyIndex++;
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  clips = JSON.parse(JSON.stringify(history[historyIndex]));
  // Re-render...
}
```
Call `pushHistory()` before every destructive operation (move, trim, split, delete, paste).
---
Dependencies
Dependency	Version	Purpose	Load Method
mp4-muxer	5.2.2	Mux H.264 frames into MP4 container	CDN script tag
Inter Font	—	UI typography	Google Fonts
WebCodecs API	—	H.264 video encoding (browser built-in)	Native
No build tools, bundlers, or frameworks are used. The editor is pure vanilla JS.