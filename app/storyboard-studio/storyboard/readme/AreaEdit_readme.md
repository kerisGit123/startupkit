# Area Edit — Technical Reference

## Overview

The Area Edit canvas system is a layered image editing environment built with React, CSS transforms, and HTML Canvas. It allows users to pan, zoom, paint masks, draw selection regions, and manage overlay elements (bubbles, text, assets) on top of a background image — all inside a single interactive canvas container.

---

## Architecture

```
SceneEditor.tsx          ← top-level orchestrator (zoom state, tool routing)
  └── CanvasArea.tsx     ← thin layout wrapper; mounts CanvasEditor
        └── CanvasEditor.tsx   ← core canvas, all mouse logic
ImageAIPanel.tsx         ← left/right toolbars, mode tabs, generates prompts
```

The background image is an `<img>` element positioned absolutely inside the canvas container. Overlays (mask canvas, bubbles, text, assets) are layered on top using absolute positioning and matching CSS transforms.

---

## Core Technique: CSS Transform Pipeline

All positioning and scaling is done with a single CSS transform on the `<img>` element:

```css
transform: translate(Xpx, Ypx) scale(S);
transform-origin: top left;
```

**Why `top left` origin?** With `top left`, the translate coordinates are screen-pixel offsets from the container's top-left corner. This makes math straightforward: `X = containerLeft → imageLeft`, `Y = containerTop → imageTop`. Using `center` would make the translate values relative to the image center, which complicates coordinate mapping for brush masks and rectangle overlays.

**Rule:** Every function that writes the image transform must use `transformOrigin: 'top left'` and the format `translate(Xpx, Ypx) scale(S)`. Mixing origins or formats causes visual jumps.

---

## Features

### 1. Fit to Screen

**File:** `SceneEditor.tsx → handleFitToScreen()`

**Technique:**
- Query the canvas container's pixel dimensions (`offsetWidth`, `offsetHeight`)
- Compute `scale = Math.min(containerW / imageNatW, containerH / imageNatH)` — fills the container while preserving aspect ratio
- Center the image: `offsetX = (containerW - imageNatW * scale) / 2`
- Apply `translate(offsetX, offsetY) scale(scale)` with `transformOrigin: top left`
- Store `scale` in `fitScaleRef.current` as the **100% baseline** for zoom

```ts
fitScaleRef.current = scale;   // 100% zoom = this scale
setZoomLevel(100);
```

---

### 2. Zoom In / Zoom Out

**File:** `SceneEditor.tsx → applyZoomToImage(displayPercent)`

**Technique:**
- Zoom level is a percentage *relative to fit scale*, not absolute CSS scale
- `newScale = fitScaleRef.current * (displayPercent / 100)`
- Zoom is **center-anchored**: the viewport center stays fixed as scale changes
  - Get `currentTx/currentTy` from `getBoundingClientRect()` difference (actual rendered position, immune to stale state)
  - Compute image-space coordinates of the viewport center
  - Recalculate `tx/ty` so that same image point remains under the viewport center
- Apply `translate(tx, ty) scale(newScale)` with `transformOrigin: top left`

```ts
const vcX = containerWidth / 2;
const imgCenterX = (vcX - currentTx) / currentScale;
const tx = vcX - imgCenterX * newScale;
```

**Range:** 20% – 200% (step 20%)

**Important:** Never use `dataset.zoom` to store/retrieve scale. Always read actual scale from `getBoundingClientRect().width / naturalWidth`.

---

### 3. Move / Pan Image

**File:** `CanvasEditor.tsx → handleMouseDown` + `useEffect onMove`

**Technique:**
- On `mousedown` (move tool active): capture starting mouse position and current image position using `getBoundingClientRect()` — not parsed from the CSS transform string
  ```ts
  currentX = iRect.left - cRect.left;   // actual rendered offset
  currentY = iRect.top  - cRect.top;
  currentScale = iRect.width / image.naturalWidth;  // actual scale
  ```
- Store all three in `dragRef.current` (`origX`, `origY`, `origScale`)
- On `mousemove`: `newX = origX + (mouseX - startX)`, apply with the **captured** `origScale`

**Key bug fix:** Previously used `dataset.zoom / 100` for scale during drag. This defaulted to `scale(1.0)` when `dataset.zoom` wasn't set, causing the image to snap to natural size. Fix: always derive scale from the rendered rect at drag-start time.

**Cursor:** `grab` when move tool active inside canvas, `default` outside.

---

### 4. Paint Brush (Inpaint Mask)

**File:** `CanvasEditor.tsx → addMaskDot`

**Technique:**
- Each painted point is stored as `{ x, y }` in `canvasState.mask[]` — coordinates are in **image-space** (pixels relative to the natural image size)
- On every render, a `<canvas>` element overlays the image, sized and positioned to exactly match the transformed image via `getBoundingClientRect()`
- The mask canvas redraws all dots scaled to the current displayed image size: `displayX = imageSpaceX * (renderedWidth / naturalWidth)`
- Brush size is in image-space pixels, scaled the same way for rendering

**Coordinate mapping (screen → image space):**
```ts
const imageX = (screenX - iRect.left) / (iRect.width / naturalWidth);
const imageY = (screenY - iRect.top)  / (iRect.height / naturalHeight);
```

**Eraser mode:** same pipeline, but dots are removed by finding all stored points within the brush radius and filtering them out.

**Cursor:** `crosshair` (brush) / `cell` (eraser) inside canvas, `default` outside.

---

### 5. Brush Size

**File:** `ImageAIPanel.tsx` (brush size menu), `SceneEditor.tsx` (state)

- `maskBrushSize` is in image-space pixels (not screen pixels)
- Preset sizes: 10, 20, 30, 50, 80
- Stored in parent state (`SceneEditor`), passed down as prop
- The dot in the toolbar scales visually: `Math.min(size / 6, 8)` px for UI preview

---

### 6. Rectangle Mask

**File:** `CanvasEditor.tsx` (rectangle drag), `SceneEditor.tsx` (rectangle state)

**Technique:**
- A draggable/resizable `<div>` overlay, positioned in **container-space** pixels
- On generation, the rectangle coordinates are converted to image-space by subtracting the image's rendered position and dividing by display scale
- Used with models like `flux-kontext-pro` that accept a bounding box for inpainting

---

### 7. Square Mask

- Same as Rectangle Mask but constrained to 1:1 aspect ratio
- Activated by `isSquareMode` flag
- Used with GPT Image / Nano Banana Edit which require square input regions

---

### 8. Crop Rectangle

**File:** `CanvasEditor.tsx`, `SceneEditor.tsx → runCrop()`

**Technique:**
- A resizable overlay (separate from the inpaint rectangle) defines the crop region
- `runCrop()` draws the original image onto an off-screen canvas cropped to the rectangle area (converted to natural image coordinates), then exports as base64
- Result replaces the background image and resets zoom/position via `handleFitToScreen()`
- Aspect ratio presets (16:9, 9:16, 1:1, 4:3, 3:4) constrain the crop rectangle

---

### 9. Transformation & Positioning (Bubbles / Text / Assets)

**File:** `CanvasEditor.tsx`

All overlay elements store `x, y, w, h, rotation` in canvas state. They are rendered as absolute `<div>` elements inside the container.

- **Move:** drag updates `x, y` directly in state
- **Resize:** 8-handle resize logic updates `x, y, w, h` while keeping opposite corner fixed
- **Rotate:** `Math.atan2` angle from element center, stored as degrees
- **Flip:** `scaleX(-1)` / `scaleY(-1)` via CSS transform

Coordinates are in **container-space** pixels (not image-space), so they stay visually correct regardless of zoom/pan.

---

### 10. Select Tool (No-Op Mode)

**File:** `ImageAIPanel.tsx`

- `activeTool = "elements"` — no drawing, no mask painting, no dragging
- Clicking the `MousePointer` icon at the top of the left toolbar activates this mode
- Resets `isEraser`, closes all menus, calls `onToolSelect("elements")`
- In `CanvasEditor`, when `activeTool` is neither `"inpaint"` nor `"move"`, all canvas mouse handlers are no-ops for the background image

---

## Tool Modes vs Canvas Behaviour

| Active Tool     | Cursor (inside) | Mouse Behaviour                        |
|-----------------|-----------------|----------------------------------------|
| `elements`      | `default`        | No-op (select mode)                    |
| `inpaint` brush | `crosshair`      | Paints mask dots in image-space        |
| `inpaint` erase | `cell`           | Erases mask dots within radius         |
| `move`          | `grab`           | Pans/translates the background image   |
| `crop`          | `default`        | Drag/resize crop rectangle             |
| `rectangle-mask`| `default`        | Drag/resize inpaint rectangle          |
| `square-mask`   | `default`        | Drag/resize 1:1 square mask            |

Cursors only apply **inside** the canvas container (`data-canvas-editor="true"` div). The browser reverts to the inherited cursor outside.

---

## Annotate Mode

When mode is `"annotate"`, the left toolbar shows only annotation tools (hand, copy-select, text, arrow, line, square, pen, pen-size). All mask tools (brush, eraser, rectangle-mask, square-mask, crop) are hidden, as annotation mode works on overlay elements, not the pixel mask layer.

---

## Potential Improvements

- **Undo/redo for mask:** The current `commitMaskSnapshot()` approach stores snapshots but full undo history is not yet wired to the toolbar undo button.
- **Pinch-to-zoom:** Touch events for mobile would require adding `touchstart`/`touchmove` handlers mirroring the mouse drag logic.
- **Zoom anchor on scroll wheel:** Add `onWheel` to the outer container for scroll-based zoom using the cursor as anchor point instead of viewport center.
- **Mask resolution:** Mask dots are stored as center points; switching to a binary pixel buffer (typed array) would improve performance for large images or high dot counts.
- **Rectangle mask persistence:** After generating, the rectangle stays visible. A "clear rectangle" button or auto-dismiss on generation would improve UX.
- **Transform persistence:** Currently transforms live only in the DOM (`img.style.transform`). Persisting `tx`, `ty`, `scale` to React state would survive image re-renders without needing to re-read from the DOM.
