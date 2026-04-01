# GPT Image Generation — Crop & Composite Technique

## Overview

When a user selects a crop area on the canvas and triggers AI image generation (e.g. "wear hat"), the system must:

1. **Crop** the selected area from the original image
2. **Send** the cropped area to KIE AI for generation
3. **Receive** the generated image back
4. **Scale & fit** the generated image into the exact crop rectangle
5. **Composite** it onto the original image to produce a seamless final result

---

## Architecture — Full Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (SceneEditor.tsx)                                 │
│                                                             │
│  1. User draws crop rectangle on canvas (canvas coords)     │
│  2. cropImageToRectangle() transforms canvas → image coords │
│  3. Crops the area, uploads to R2 as temps/crop-{ts}.png    │
│  4. Calls generateImageWithCredits() with:                  │
│     - cropped image URL                                     │
│     - crop coords (image space, via ref)                    │
│     - original image URL (R2, not data URL)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  API ROUTE (generate-image/route.ts)                        │
│                                                             │
│  Passes all params to triggerImageGeneration()              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  KIE AI TRIGGER (lib/storyboard/kieAI.ts)                   │
│                                                             │
│  1. Creates placeholder file record in Convex               │
│  2. Stores metadata: cropX, cropY, cropWidth, cropHeight,   │
│     originalImageUrl                                        │
│  3. Sends cropped image + prompt to KIE AI API              │
│  4. KIE AI processes asynchronously, calls back when done   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  KIE CALLBACK (api/kie-callback/route.ts)                   │
│                                                             │
│  1. Receives generated image from KIE AI                    │
│  2. Stores raw result: temps/generated-image-kie-{ts}.png   │
│  3. Fetches original image via originalImageUrl             │
│  4. Resizes generated image to cropWidth × cropHeight       │
│  5. Composites onto original at (cropX, cropY) using sharp  │
│  6. Stores final: {companyId}/generated/generated-image-    │
│     final-{ts}.png                                          │
│  7. Updates Convex file record with final URL               │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Technique — Coordinate Transformation

The crop rectangle is drawn on the **canvas** (CSS pixels), but the original image has its own **pixel dimensions**. The image is displayed with `object-fit: contain`, which adds letterboxing offsets.

### The Math

```
Canvas rectangle: { x, y, width, height }  (CSS pixels, relative to container)
Container size:   containerW × containerH   (CSS pixels)
Image natural:    imgW × imgH               (actual pixels)
```

**Step 1 — Calculate rendered image size and offset (object-contain logic):**

```javascript
const imgAspect = imgW / imgH;
const containerAspect = containerW / containerH;

let renderedW, renderedH, offsetX, offsetY;

if (imgAspect > containerAspect) {
  // Image wider than container → black bars top/bottom
  renderedW = containerW;
  renderedH = containerW / imgAspect;
  offsetX = 0;
  offsetY = (containerH - renderedH) / 2;
} else {
  // Image taller than container → black bars left/right
  renderedH = containerH;
  renderedW = containerH * imgAspect;
  offsetX = (containerW - renderedW) / 2;
  offsetY = 0;
}
```

**Step 2 — Calculate scale factors:**

```javascript
const scaleX = imgW / renderedW;
const scaleY = imgH / renderedH;
```

**Step 3 — Transform canvas coords → image coords:**

```javascript
const destRect = {
  x: (rectangle.x - offsetX) * scaleX,
  y: (rectangle.y - offsetY) * scaleY,
  width: rectangle.width * scaleX,
  height: rectangle.height * scaleY,
};
```

### Example (from real logs)

```
Image: 499×499, Container: 1242×699
Rendered: 699×699 at offset (271.7, 0)
Scale: 0.714 × 0.714

Canvas rect: { x: 486.5, y: 95, w: 277, h: 277 }
Image rect:  { x: 153.4, y: 67.8, w: 197.8, h: 197.8 }
```

---

## Core Functions

### 1. `cropImageToRectangle()` — SceneEditor.tsx

**Purpose:** Transform canvas coordinates to image space, crop the selected area.

```
Input:  base64Image, rectangle (canvas coords), canvasDisplaySize
Output: cropped image as base64 data URL
Side effect: sets imageCropCoordsRef.current (sync) with image-space coords
```

**Key behavior:**
- Loads the image to get natural dimensions (imgW × imgH)
- Uses `originalCanvasDisplaySize` (stored when rectangle was first created) for consistent transforms even if container resizes
- Applies object-contain math to calculate offset and scale
- Constrains result to image bounds (0px padding)
- Stores transformed coords in both `imageCropCoordsRef` (ref, sync) and `imageCropCoords` (state, async)

### 2. `generateImageWithCredits()` — SceneEditor.tsx

**Purpose:** Send generation request to API with all metadata.

**Parameter order (critical!):**
```
pos 1:  prompt
pos 2:  style
pos 3:  quality
pos 4:  aspectRatio ("1:1")
pos 5:  itemId (activeShot?.id)
pos 6:  creditsUsed
pos 7:  model
pos 8:  imageUrl (cropped image R2 URL)
pos 9:  referenceImageUrls
pos 10: maskUrl
pos 11: existingFileId
pos 12: cropX          ← from imageCropCoordsRef.current
pos 13: cropY          ← from imageCropCoordsRef.current
pos 14: cropWidth      ← from imageCropCoordsRef.current
pos 15: cropHeight     ← from imageCropCoordsRef.current
pos 16: originalImageUrl (R2 URL, not data URL)
```

### 3. `triggerImageGeneration()` — lib/storyboard/kieAI.ts

**Purpose:** Create Convex file record with metadata, send request to KIE AI.

**Metadata stored:**
```json
{
  "model": "gpt-image",
  "cropX": 153.4,
  "cropY": 67.8,
  "cropWidth": 197.8,
  "cropHeight": 197.8,
  "originalImageUrl": "https://pub-xxx.r2.dev/companyId/image.png"
}
```

### 4. `compositeGeneratedIntoOriginal()` — api/kie-callback/route.ts

**Purpose:** Server-side compositing using `sharp`.

```
Input:  originalImageUrl, cropX, cropY, cropWidth, cropHeight, generatedBuffer
Output: Buffer of the final combined image
```

**Steps:**
1. Fetch original image from R2
2. Round crop coords to integers (sharp requirement)
3. Clamp to original image bounds
4. Resize generated image to `cropWidth × cropHeight` with `fit: 'fill'`
5. Composite onto original at `(cropX, cropY)` using `sharp.composite()`
6. Return final PNG buffer

---

## Bugs Found & Fixed

### Bug 1: Stale React State for Crop Coordinates (ROOT CAUSE)

**Problem:** `setImageCropCoords()` inside `cropImageToRectangle()` is a React state update (batched). When `generateImageWithCredits()` reads `imageCropCoords?.x` later in the **same event handler**, it gets the **previous render's value** — coordinates from the last generation, not the current one.

**Impact:** On 2nd+ generation, crop coords sent to server are from the PREVIOUS generation. The generated image gets placed at the wrong position.

**Fix:** Added `imageCropCoordsRef` (a `useRef`) that is set **synchronously** alongside the state update. The `generateImageWithCredits` call reads from `imageCropCoordsRef.current` which has the correct value immediately.

```javascript
// In cropImageToRectangle:
imageCropCoordsRef.current = imageCropCoordsForCompositing; // sync ✓
setImageCropCoords(imageCropCoordsForCompositing);          // async (batched)

// In generateImageWithCredits call:
imageCropCoordsRef.current?.x,    // reads correct value ✓
// NOT: imageCropCoords?.x        // would read stale value ✗
```

### Bug 2: Parameter Order Mismatch

**Problem:** `existingFileId` was passed at position 5 (`itemId` slot) but missing at position 11, causing all crop coordinates to shift into wrong metadata fields.

**Fix:** Corrected parameter order — `activeShot?.id` at pos 5, `existingFileId` at pos 11, crop coords at pos 12-15.

### Bug 3: Data URL as originalImageUrl

**Problem:** `backgroundImage` could be a `data:` URL from a previous canvas operation. Passing a huge base64 string as `originalImageUrl` through Convex metadata is unreliable and may fail on the server.

**Fix:** Prefer R2 URL over data URL:
```javascript
(backgroundImage && !backgroundImage.startsWith('data:')
  ? backgroundImage
  : activeShot?.imageUrl) || backgroundImage
```

### Bug 4: Float Coordinates for Sharp

**Problem:** `sharp.composite()` requires integer `left`/`top` values. Float coordinates from the frontend would cause errors or silent rounding.

**Fix:** `Math.round()` all crop coordinates, then clamp to image bounds before passing to sharp.

---

## R2 Storage Paths

| Stage | Path | Description |
|-------|------|-------------|
| Cropped input | `temps/{ts}-crop-{ts}.png` | The cropped area sent to KIE AI |
| KIE raw output | `temps/generated-image-kie-{ts}.png` | Raw AI-generated image |
| Final composite | `{companyId}/generated/generated-image-final-{ts}.png` | Combined image (original + generated) |

---

## Key Design Decisions

1. **Server-side compositing (sharp)** — Not browser canvas. Ensures consistent results regardless of client device, avoids CORS issues with cross-origin images, and produces high-quality output.

2. **Ref + State pattern** — `imageCropCoordsRef` for synchronous access in the same event handler, `imageCropCoords` state for React re-renders. This avoids the batched state update pitfall.

3. **Fixed aspect ratio "1:1"** — All crop areas use 1:1 aspect ratio for GPT Image models to simplify the compositing math.

4. **Coordinate transformation at crop time** — Canvas-to-image space transformation happens once in `cropImageToRectangle`, and the resulting image-space coords are passed through the entire pipeline unchanged.

5. **R2 URL preference** — Always prefer fetchable R2 URLs over data URLs for `originalImageUrl` to ensure the server can reliably fetch the original image.

---

## Files Involved

| File | Role |
|------|------|
| `SceneEditor.tsx` | Crop rectangle UI, coordinate transformation, generation trigger |
| `EditImageAIPanel.tsx` | AI panel UI (model picker, prompt, quality, credits) |
| `generate-image/route.ts` | API route — passes params to kieAI |
| `lib/storyboard/kieAI.ts` | KIE AI trigger — stores metadata, sends to API |
| `kie-callback/route.ts` | Callback — composites generated image onto original |
| `shared/CanvasEditor.tsx` | Canvas rendering with `objectFit: "contain"` |
