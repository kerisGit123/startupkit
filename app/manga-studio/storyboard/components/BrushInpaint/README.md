# Brush Inpaint Components

This folder contains the refactored Brush Inpaint functionality for the FaceShift feature.

## 📁 File Structure

```
BrushInpaint/
├── index.ts              # Main exports
├── BrushInpaintPanel.tsx # Main component with sub-components
└── README.md             # This documentation
```

## 🎯 Components

### BrushInpaintPanel (Main)
The main component that orchestrates all Brush Inpaint functionality.

**Props:**
- `title`: string - Panel title (e.g., "Brush Inpaint - FaceShift")
- `description`: string - Panel description
- Brush settings: `isEraser`, `setIsEraser`, `maskBrushSize`, `setMaskBrushSize`, `maskOpacity`, `setMaskOpacity`
- Canvas state: `canvasState`, `setCanvasState`
- Generation: `inpaintPrompt`, `setInpaintPrompt`, `refImages`, `setRefImages`, `isInpainting`, `inpaintError`, `onGenerate`
- Results: `generatedImages`, `showGenPanel`, `setShowGenPanel`

### Sub-Components (Internal)

#### BrushControls
- Brush/Eraser toggle
- Brush preview
- Size and opacity sliders
- Clear mask button

#### GenerationSettings
- Inpaint prompt textarea
- Reference image upload
- Generate button with loading state
- Error display

#### StatusPanel
- Mask status indicator
- Results panel toggle

## 🚀 Usage

```tsx
import { BrushInpaintPanel } from "./BrushInpaint";

// In your component
<BrushInpaintPanel
  title="Brush Inpaint - FaceShift"
  description="Paint areas to inpaint with FaceShift AI"
  isEraser={isEraser}
  setIsEraser={setIsEraser}
  maskBrushSize={maskBrushSize}
  setMaskBrushSize={setMaskBrushSize}
  maskOpacity={maskOpacity}
  setMaskOpacity={setMaskOpacity}
  canvasState={canvasState}
  setCanvasState={setCanvasState}
  inpaintPrompt={inpaintPrompt}
  setInpaintPrompt={setInpaintPrompt}
  refImages={refImages}
  setRefImages={setRefImages}
  isInpainting={isInpainting}
  inpaintError={inpaintError}
  onGenerate={handleGenerate}
  generatedImages={generatedImages}
  showGenPanel={showGenPanel}
  setShowGenPanel={setShowGenPanel}
/>
```

## 🎨 Features

- **FaceShift Integration**: Optimized for character/face modification
- **Real-time Brush Preview**: Visual feedback for brush size and mode
- **Reference Image Support**: Optional reference image for better results
- **Mask Status Tracking**: Live feedback on painted areas
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during generation

## 🔧 Maintenance

### Adding New Features
1. Modify the relevant sub-component
2. Update props in `BrushInpaintPanelProps` interface
3. Update the main component's usage

### Styling
- Uses Tailwind CSS classes
- Dark theme with blue accent colors
- Consistent with the overall SceneEditor design

### State Management
- All state is managed by the parent SceneEditor component
- Components receive props and callback functions
- No internal state in sub-components for better predictability

## 📝 Notes

- Always uses FaceShift (character-remix model)
- Single reference image support only
- Aspect ratio detection for character-remix model
- Integrated with the main SceneEditor workflow
