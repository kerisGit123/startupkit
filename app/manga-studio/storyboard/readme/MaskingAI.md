# Masking AI — Model Integration & Image Generation Flow

## Overview

The masking system supports three distinct mask types, each mapped to specific AI models. All mask-based generation follows a common pattern: **crop → generate → composite**. The generated region is blended back into the original image to produce a seamless result.

---

## Mask Types & Model Mapping

| Mask Tool | Input Shape | Models Used | Typical Use Case |
|-----------|-------------|-------------|------------------|
| **Brush (Inpaint)** | Freeform painted mask dots | `ideogram/character-edit` | Precise edits, faceshift, fine details |
| **Rectangle Mask** | Bounding box (x, y, w, h) | `flux-kontext-pro`, `grok`, `qwen-z-image` | Region inpainting, object replacement |
| **Square Mask** | 1:1 square region | `gpt-image`, `nano-banana-edit` | Square crops, character edits, faces |

---

## Common Generation Pipeline

All masking flows share three stages:

### 1. Crop Region Extraction
- Convert mask coordinates from **container-space** to **image-space** (natural image pixels)
- For rectangle/square: crop the original image to the bounding box
- For brush: crop to a tight bounding box around all mask dots (with padding)
- Output: base64 PNG of the cropped region

### 2. Model-Specific Generation
- Send the cropped image + mask (or bounding box) to the selected model
- Model returns a generated version of the cropped region

### 3. Composite / Blend Back
- Draw the original full-size image onto an off-screen canvas
- Paste the generated region back into the original position
- Output: final combined image (base64)

---

## Brush Inpaint (Freeform Mask)

### Technique Flow
1. **Mask Collection**
   - User paints dots → stored as `canvasState.mask[]` in image-space coordinates
   - `commitMaskSnapshot()` saves current mask state for undo

2. **Tight Crop**
   - Compute bounding box around all mask dots (`minX/minY`, `maxX/maxY`)
   - Add padding (e.g., 20px) to avoid edge artifacts
   - Crop original image to this tight region

3. **Mask Canvas**
   - Create a mask canvas matching the crop size
   - Draw filled circles for each dot (scaled to crop dimensions)
   - Export mask as base64 PNG (black/white)

4. **Model Call**
   - Model: `ideogram/character-edit`
   - Payload: cropped image + mask PNG + user prompt
   - Model returns generated cropped region

5. **Composite**
   - Draw original full image onto canvas
   - Place generated region back at original crop offset
   - Result: seamless blend

### Key Implementation Details
- **Coordinate conversion:** Dots stored in natural image pixels; scaled to crop size for mask canvas
- **Mask format:** Binary mask (white = paint, black = keep original)
- **Padding:** Prevents hard edges; especially important for character edits

---

## Rectangle Mask (Bounding Box)

### Technique Flow
1. **Rectangle Definition**
   - User drags resizable `<div>` overlay → stored as `rectangle: { x, y, w, h }` in container-space
   - `isSquareMode = false`

2. **Crop to Rectangle**
   - Convert rectangle to image-space:
     ```ts
     imgX = (rect.x - imageLeft) / scale;
     imgY = (rect.y - imageTop) / scale;
     imgW = rect.w / scale;
     imgH = rect.h / scale;
     ```
   - Crop original image to this exact region

3. **Model Selection & Call**
   - **flux-kontext-pro** (default, high quality)
   - **grok** (fast generation)
   - **qwen-z-image** (high detail)
   - Payload: cropped image + text prompt (no explicit mask needed; the crop itself defines the region)

4. **Composite**
   - Same as brush: draw original, paste generated region at `(imgX, imgY)`

### Why No Explicit Mask?
- Rectangle mask models accept a **cropped image** as input; the crop itself defines the edit region
- The model regenerates the entire cropped patch based on the prompt

---

## Square Mask (1:1 Region)

### Technique Flow
1. **Square Constraint**
   - Same as rectangle but `isSquareMode = true`
   - Enforces 1:1 aspect ratio during drag/resize

2. **Crop & Generate**
   - Crop to square region
   - Models:
     - **gpt-image** (GPT Image 1.5)
     - **nano-banana-edit** (square-optimized)
   - Payload: square cropped image + prompt

3. **Composite**
   - Same pipeline

### Model Characteristics
- **gpt-image**: Strong at faces, character edits
- **nano-banana-edit**: Lightweight, fast square edits

---

## Composite / Blending Technique

All mask types use the same composite step:

```ts
// 1. Full-size canvas
const canvas = document.createElement('canvas');
canvas.width = originalImage.naturalWidth;
canvas.height = originalImage.naturalHeight;
const ctx = canvas.getContext('2d');

// 2. Draw original
ctx.drawImage(originalImage, 0, 0);

// 3. Draw generated region back
const genImg = new Image();
genImg.onload = () => {
  ctx.drawImage(genImg, cropX, cropY); // cropX/cropY are in natural image pixels
  const result = canvas.toDataURL('image/png');
};
```

**Result:** The generated region seamlessly replaces the original area.

---

## Model-Specific Payload Patterns

### Brush Inpaint (Character-Edit)
```ts
{
  image: croppedBase64,
  mask: maskBase64,
  prompt: userPrompt,
  model: 'ideogram/character-edit'
}
```

### Rectangle/Square (Flux, Grok, Qwen)
```ts
{
  image: croppedBase64,
  prompt: userPrompt,
  model: 'flux-kontext-pro' | 'grok' | 'qwen-z-image'
}
```

### Square (GPT, Nano Banana)
```ts
{
  image: croppedBase64,
  prompt: userPrompt,
  model: 'gpt-image' | 'nano-banana-edit'
}
```

---

## UI → Model Mapping (ImageAIPanel.tsx)

The UI dynamically shows model options based on active mask type:

```ts
const inpaintModelOptions = activeTool === "square-mask" ? [
  { value: "gpt-image", label: "🟦 GPT Image 1.5", sub: "Square Mode" },
  { value: "nano-banana-edit", label: "🟩 Nano Banana Edit", sub: "Square Mode" },
] : activeTool === "rectangle-mask" ? [
  { value: "flux-kontext-pro", label: "Flux Kontext Pro", sub: "Best for rectangle inpainting" },
  { value: "grok", label: "Grok Imagine", sub: "Fast generation" },
  { value: "qwen-z-image", label: "Qwen Z Image", sub: "High quality" },
] : (activeTool === "brush" || activeTool === "eraser" || activeTool === "pen-brush") ? [
  { value: "ideogram/character-edit", label: "Character-edit", sub: "Faceshift" },
] : [];
```

---

## Coordinate Systems Cheat Sheet

| Space | Origin | Usage |
|-------|--------|-------|
| **Container-space** | Canvas container top-left | Rectangle overlay positions |
| **Image-space** | Natural image top-left | Model inputs, mask dots |
| **Crop-space** | Cropped region top-left | Mask canvas generation |

**Conversion (container → image):**
```ts
imageX = (containerX - imageLeft) / scale;
imageY = (containerY - imageTop) / scale;
```

**Conversion (image → crop):**
```ts
cropX = imageX - cropLeft;
cropY = imageY - cropTop;
```

---

## Error Handling & Edge Cases

- **Empty mask:** Skip generation if no dots painted
- **Tiny crops:** Enforce minimum size (e.g., 32×32) to avoid model errors
- **Out-of-bounds:** Clamp rectangle/square to image bounds
- **Model fallback:** If selected model fails, retry with default (flux-kontext-pro)

---

## Performance Tips

- **Canvas reuse:** Reuse mask canvas between frames; clear with `clearRect`
- **Base64 size:** Crop tightly before encoding to reduce payload
- **Batch dots:** For brush, collect all dots before redrawing mask canvas
- **Debounce generation:** Avoid rapid successive calls; show loading state

---

## Extending: Adding New Models

1. Add model option to `inpaintModelOptions` in `ImageAIPanel.tsx`
2. Implement payload format in generation function
3. Add model-specific handling if needed (e.g., different mask format)
4. Test with sample crops

---

## Summary

- **Brush:** Freeform mask + character-edit model → precise edits
- **Rectangle:** Bounding box crop → flux/grok/qwen → region replacement
- **Square:** 1:1 crop → gpt/nano-banana → character/face edits
- **All:** Crop → generate → composite pipeline with coordinate conversion

This pattern enables flexible, model-agnostic masking while keeping the UI and coordinate math consistent.