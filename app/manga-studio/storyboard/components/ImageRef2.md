# Area-Edit Mode Reference Image Implementation

## Overview
The area-edit mode now supports both faceshift functionality with reference images from the ImageAI Panel using the `ideogram/character-edit` model, AND square mask functionality with different models including GPT Image 1.5 and nano-banana-edit.

## Reference Image Source

### ImageAI Panel Reference Images
- **Location**: Bottom of ImageAI Panel (below trash icon)
- **Component**: `renderReferencePanel()` in `ImageAIPanel.tsx` (lines 733-779)
- **State**: `aiRefImages` (array of `{id, url}` objects)
- **Upload Handler**: `handleRightImageUpload` (lines 233-242)

### Upload Flow
1. User clicks "Add Image" button in ImageAI Panel
2. `handleRightImageUpload` is called
3. File is converted to blob URL
4. `onAddReferenceImage(file)` is called
5. Updates `aiRefImages` state: `[{id: 'ref-123', url: 'blob:http://...'}]`

## System Integration

### Area-Edit Mode Detection
```javascript
// SceneEditor.tsx - generateImageWithElements function
if (aiEditMode === "area-edit") {
  // Check if square mask is being used
  const isSquareMaskActive = canvasTool === "rectInpaint" && isSquareMode;
  
  if (isSquareMaskActive) {
    // Use square mask logic with selected model (GPT Image 1.5, nano-banana-edit, etc.)
    await runRectangleInpaint();
    return;
  }
  
  // For faceshift, require character-edit model
  if (aiModel === "ideogram/character-edit") {
    // Use faceshift logic
    await runCharacterEditInpaint(aiRefImageUrls, promptToUse);
  }
}
```

### Square Mask Mode Processing

#### 1. Square Mode Detection
```javascript
const isSquareMaskActive = canvasTool === "rectInpaint" && isSquareMode;
```

#### 2. Data Source Selection
```javascript
// Use ImageAI Panel data when in area-edit mode
const promptToUse = aiEditMode === "area-edit" ? imageInpaintPrompt : inpaintPrompt;
const refImagesToUse = aiEditMode === "area-edit" ? aiRefImages.map(img => img.url) : imageReferenceImages;
```

#### 3. Model Options for Square Mode
```javascript
// Available models for square mask (ImageAIPanel.tsx)
[
  { value: "gpt-image-1-5-text-to-image", label: "🟦 GPT Image 1.5 Text", sub: "Square Mode" },
  { value: "nano-banana-edit", label: "🟩 Nano Banana Edit", sub: "Square Mode" }
];
```

#### 4. Request Body Structure
```javascript
const requestBody = {
  prompt: promptToUse,                    // From ImageAI Panel
  model: inpaintModel,                    // GPT Image 1.5 or nano-banana-edit
  image: croppedImage,                     // Square cropped region
  isSquareMode: true,                      // Square mode flag
  rectangle: rectangle,                    // Square coordinates
  canvasDisplaySize: canvasDisplaySize,    // Canvas dimensions
  referenceImages: refImagesToUse          // From ImageAI Panel
};
```

### Data Processing Pipeline

#### 1. Reference Image Processing (Area-Edit)
```javascript
// Convert aiRefImages to string array
const refImagesToUse = aiRefImages.map(img => img.url);
// Result: ['blob:http://localhost:3000/56f65ab8-4955-4a28-9c83-781df76ab32f']
```

#### 2. Square Image Cropping
```javascript
// Crop square region from full image
const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
```

#### 3. Model-Specific Processing
- **GPT Image 1.5**: Supports reference images, square cropping
- **nano-banana-edit**: Supports reference images, square cropping
- **Character-edit**: Faceshift mode (brush mask only)

## Model Connection

### Supported Models in Area-Edit Mode

#### Square Mask Models:
- **GPT Image 1.5** (`gpt-image`) - World knowledge
- **nano-banana-edit** (`nano-banana-edit`) - High fidelity

#### Faceshift Model:
- **Character-edit** (`ideogram/character-edit`) - Face editing

### API Flow
1. **Request**: POST `/api/n8n-image-proxy`
2. **Square Mode**: Cropped square + reference images + prompt
3. **Faceshift Mode**: Full image + mask + reference images + prompt
4. **Response**: Generated image URL
5. **Composite**: Square result composited back into original image

## Key Components

### ImageAI Panel (`ImageAIPanel.tsx`)
- **Reference Panel**: Lines 733-779
- **Upload Handler**: Lines 233-242
- **State Management**: `aiRefImages` → `onAddReferenceImage`
- **Tool Selection**: Rectangle mask and square mask tools
- **Model Selection**: Dynamic models based on mask type
- **Generate Button**: Integrated with main generation flow

### SceneEditor (`SceneEditor.tsx`)
- **Area-Edit Logic**: Lines 977-993 (mode detection)
- **Square Mask Logic**: Lines 1432-1530 (processing)
- **Faceshift Logic**: Lines 1005-1020 (character-edit)

## Debug Flow
```javascript
console.log("[runRectangleInpaint] Mode:", aiEditMode);
console.log("[runRectangleInpaint] Using prompt:", promptToUse);
console.log("[runRectangleInpaint] Reference images:", refImagesToUse.length);
console.log("[runRectangleInpaint] Model:", aiModel);
console.log("[rectInpaint] Square mode:", isSquareMode);
console.log("[rectInpaint] Adding", refImagesToUse.length, "reference images for square mode");
```

## Usage Instructions

### Square Mask in Area-Edit Mode:
1. **Select Area-Edit Mode**: Choose area-edit in ImageAI Panel
2. **Add Square**: Click "Add Square" to create 1:1 square mask
3. **Select Model**: Choose "🟦 GPT Image 1.5" or "🟩 Nano Banana Edit"
4. **Upload Reference Images**: Click "Add Image" in ImageAI Panel (below trash icon)
5. **Enter Prompt**: Describe what to generate in the square area
6. **Generate**: Click cyan-green Generate button

### Faceshift in Area-Edit Mode:
1. **Select Area-Edit Mode**: Choose area-edit in ImageAI Panel
2. **Select Model**: Choose "Character-edit" for faceshift
3. **Upload Reference Images**: Click "Add Image" in ImageAI Panel (below trash icon)
4. **Paint Mask**: Use brush tool to paint face areas
5. **Enter Prompt**: Describe face changes
6. **Generate**: Click cyan-green Generate button

## Result
The area-edit mode now supports:
- ✅ **Square mask generation** with GPT Image 1.5 and nano-banana-edit models
- ✅ **Faceshift generation** with character-edit model
- ✅ **ImageAI Panel integration** for reference images, prompts, and background images
- ✅ **Automatic model detection** based on mask type and selection
- ✅ **Proper image processing** and compositing for both modes
