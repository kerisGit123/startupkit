---
description: Canvas Implementation Plan
---

# Canvas Implementation Plan

## Overview
This document outlines the current canvas implementation in the storyboard studio, covering the core components, styling, dimensions, and interaction patterns.

---

## 💰 Quality-Based Pricing Integration (March 2026)

### **Overview**
Advanced pricing system for AI models with dynamic quality selection and real-time credit calculation integrated into the canvas-based AI editing workflow.

### **Implemented Models with Quality Pricing**

#### **Nano Banana 2** (Canvas-Based Image Generation)
- **Quality Options**: 1K, 2K, 4K
- **Pricing**: 
  - 1K: 8 × 1.3 = **11 credits**
  - 2K: 12 × 1.3 = **16 credits**  
  - 4K: 18 × 1.3 = **24 credits**
- **Formula**: Direct cost extraction from formulaJson × factor (1.3)

#### **Topaz Upscale** (Canvas-Based Image Enhancement)
- **Quality Options**: 1K, 2K, 4K
- **Pricing**:
  - 1K: 10 × 1.3 = **13 credits**
  - 2K: 18 × 1.3 = **24 credits**
  - 4K: 30 × 1.3 = **39 credits**
- **Formula**: Direct cost extraction from formulaJson × factor (1.3)

### **Canvas Integration with Quality Pricing**

#### **Quality Selection in Canvas Context**
```typescript
// EditImageAIPanel.tsx - Quality dropdown for canvas-based AI editing
{(normalizedModel === "nano-banana-2" || normalizedModel === "topaz/image-upscale") && (
  <div className="quality-dropdown">
    {["1K", "2K", "4K"].map((quality) => (
      <button onClick={() => {
        setSelectedQuality(quality);
        alertModelCredits(currentModelId, quality);
      }}>
        {quality}
      </button>
    ))}
  </div>
)}
```

#### **Canvas-Based Generation with Quality Parameters**
```typescript
// CanvasEditor.tsx - Generate with quality-based pricing
const handleCanvasGeneration = async () => {
  const selectedModel = "nano-banana-2"; // or "topaz/image-upscale"
  const selectedQuality = "2K"; // from quality dropdown
  const creditCost = getModelCredits(selectedModel, selectedQuality);
  
  // Check user credits before generation
  if (userCredits < creditCost) {
    alert(`Insufficient credits. Need ${creditCost} credits for ${selectedQuality} generation.`);
    return;
  }
  
  // Generate with canvas context and quality parameters
  const result = await generateFromCanvas({
    canvasState,
    model: selectedModel,
    quality: selectedQuality,
    referenceImages,
    maskData: canvasState.mask
  });
  
  // Store generated result with quality metadata
  await uploadToR2({
    file: result.imageFile,
    category: 'generated',
    userId,
    companyId,
    projectId,
    tags: [selectedModel, selectedQuality, 'canvas-generated']
  });
};
```

#### **Canvas Mask Integration with Quality Pricing**
```typescript
// CanvasEditor.tsx - Apply AI edits with quality-based pricing
const handleApplyAIEdit = async () => {
  const selectedModel = "nano-banana-2";
  const selectedQuality = "4K"; // user-selected quality
  const creditCost = getModelCredits(selectedModel, selectedQuality);
  
  // Canvas mask data for inpainting
  const maskData = canvasState.mask;
  const baseImage = canvasState.backgroundImage;
  
  // Generate with quality parameters
  const result = await aiInpaint({
    image: baseImage,
    mask: maskData,
    model: selectedModel,
    quality: selectedQuality,
    prompt: userPrompt
  });
  
  // Update canvas with result
  setCanvasState(prev => ({
    ...prev,
    backgroundImage: result.imageUrl,
    generatedWithQuality: selectedQuality,
    creditCost: creditCost
  }));
};
```

### **Canvas-Specific Quality Features**

#### **✅ Quality-Aware Canvas Operations**
- **Generation Quality**: Canvas-based generation respects quality selection
- **Edit Quality**: AI edits (inpainting, upscaling) use quality parameters
- **Cost Display**: Real-time credit cost updates in canvas context
- **Metadata Storage**: Quality information stored with canvas-generated assets

#### **✅ Canvas Workflow Integration**
```typescript
// Canvas workflow with quality-based pricing
const canvasWorkflow = {
  1: "Select AI model (Nano Banana 2 / Topaz Upscale)",
  2: "Choose quality (1K, 2K, 4K)",
  3: "Create mask or select area on canvas",
  4: "Review credit cost for selected quality",
  5: "Generate with quality parameters",
  6: "Store result with quality metadata"
};
```

#### **✅ Quality Metadata in Canvas State**
```typescript
interface CanvasEditorState {
  // ... existing state
  generatedWithQuality?: string; // "1K", "2K", "4K"
  creditCost?: number; // Actual cost for last generation
  modelUsed?: string; // "nano-banana-2" or "topaz/image-upscale"
}
```

---

## Core Components

### 1. CanvasEditor (`shared/CanvasEditor.tsx`)
**Purpose**: Main canvas component handling all drawing, editing, and interaction logic.

**Key Features**:
- Multi-tool support (bubbles, text, assets, shapes, inpainting, crop, move)
- Aspect ratio preservation and dynamic sizing
- Zoom and pan functionality
- Mask painting and erasing
- Rectangle mask for AI editing
- Element selection and manipulation
- Undo/redo stack for mask operations
- Color picker integration
- Drag and resize operations

**Props Interface**:
```typescript
interface CanvasEditorProps {
  panelId: string;
  imageUrl?: string | null;
  activeTool: CanvasActiveTool;
  state: CanvasEditorState;
  onStateChange: (s: CanvasEditorState) => void;
  brushSize: number;
  isEraser: boolean;
  maskOpacity: number;
  aspectRatio?: string;
  rectangle?: { x: number; y: number; width: number; height: number } | null;
  onRectangleChange?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  rectangleVisible?: boolean;
  isSquareMode?: boolean;
  selectedColor?: string;
  onColorPickerClick?: () => void;
  onDeleteSelected?: () => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  mode?: "describe" | "area-edit" | "annotate";
  onSetOriginalImage?: (imageUrl: string) => void;
  zoomLevel?: number;
  // ... additional props
}
```

### 2. CanvasArea (`components/CanvasArea.tsx`)
**Purpose**: Wrapper component that manages canvas rendering and navigation between shots.

**Key Features**:
- Navigation between multiple shots
- Conditional rendering based on active AI panel
- Integration with SceneEditor state management
- Props passing to CanvasEditor

**Rendering Logic**:
```typescript
{activeAIPanel === 'element' || activeAIPanel === 'editimage' ? (
  <CanvasEditor
    panelId={panelId}
    imageUrl={backgroundImage || activeShot?.imageUrl}
    activeTool={canvasActiveTool}
    state={canvasState}
    onStateChange={setCanvasState}
    // ... props mapping
  />
) : null}
```

### 3. Canvas Types (`shared/canvas-types.ts`)
**Purpose**: TypeScript definitions for all canvas-related data structures.

**Key Types**:
- `Bubble`: Speech/thought bubbles with tails and styling
- `TextElement`: Text with font, color, and positioning
- `AssetElement`: Image assets with transform properties
- `ShapeElement`: Arrows, lines, rectangles, circles
- `MaskDot`: Points for mask painting
- `CanvasEditorState`: Complete canvas state
- `CanvasActiveTool`: Available tools

## Canvas Dimensions and Styling

### Aspect Ratio System
The canvas supports multiple aspect ratios with automatic sizing:
- **16:9** (16/9 = 1.78) - Standard widescreen
- **9:16** (9/16 = 0.56) - Vertical/portrait
- **1:1** (1/1 = 1.0) - Square

### Dynamic Sizing Algorithm
```typescript
const PAD = 100;           // Side padding
const TOP_PAD = 100;       // Top padding  
const BOTTOM_EXTRA = 128;  // Bottom padding for UI

// Calculate maximum available space
const maxW = outerSize.w - PAD * 2;
const maxH = outerSize.h - TOP_PAD - PAD - BOTTOM_EXTRA;

// Fit by width first, adjust height if overflow
let w = maxW;
let h = w / ar;
if (h > maxH) {
  h = maxH;
  w = h * ar;
}

// Apply 1.1x scale for better visibility
canvasStyle = { width: `${w * 1.1}px`, height: `${h * 1.1}px` };
```

### Canvas Container Structure
```typescript
<div ref={outerRef} className="relative w-full h-full flex items-center justify-center bg-[#0d0d12] overflow-hidden">
  <div ref={containerRef} className="relative bg-[#13131a]" data-canvas-editor="true"
    style={{ ...canvasStyle, cursor }}
    onMouseDown={handleMouseDown}
  >
    {/* Canvas content */}
  </div>
</div>
```

## Tool System

### Available Tools
- **canvas-object**: Default selection/move mode
- **inpaint**: Brush painting for masks
- **rectInpaint**: Rectangle mask for AI editing
- **crop**: Aspect ratio cropping
- **move**: Canvas pan/drag mode
- **text**: Text element creation
- **bubbles**: Speech bubble creation
- **assets**: Asset placement
- **shapes**: Arrow, line, rectangle, circle drawing

### Tool State Management
Each tool has specific:
- Cursor styles
- Mouse event handlers
- UI overlays
- Keyboard shortcuts
- State persistence

## Zoom Implementation

### Zoom Controls
```typescript
// Zoom controls in AI panels
<div className="flex items-center gap-1 bg-[#1a1a24] rounded-lg p-1 border border-white/10">
  <button onClick={() => onZoomChange?.(Math.max(25, zoomLevel - 25))}>
    <ZoomOut />
  </button>
  <span>{zoomLevel}%</span>
  <button onClick={() => onZoomChange?.(Math.min(200, zoomLevel + 25))}>
    <ZoomIn />
  </button>
  <button onClick={() => onZoomChange?.(100)}>
    <Maximize2 />
  </button>
</div>
```

### Zoom Levels
- **Minimum**: 25%
- **Maximum**: 200%
- **Default**: 100% (fit to screen)
- **Step**: 25% increments

## Mask System

### Brush Inpainting
- Real-time mask painting with adjustable brush size
- Eraser mode for mask correction
- Opacity control for mask visibility
- Undo/redo stack for mask operations
- **Fixed coordinate calculation** for accurate brush positioning across all images
- **CSS transform handling** for proper brush alignment on transformed images
- **Consistent brush behavior** across original, generated, and panel images
- **Image loading verification** to ensure proper coordinate calculations

### Coordinate Calculation System
The brush system uses a simplified coordinate calculation approach:
```typescript
// Calculate scale from actual rendered dimensions
const scale = imgRect.width / image.naturalWidth;

// Use actual visual position (already includes CSS transforms)
const imgLeft = imgRect.left - containerRect.left;
const imgTop = imgRect.top - containerRect.top;

// Convert to image-pixel space
const x = (mouseX - imgLeft) / scale;
const y = (mouseY - imgTop) / scale;
```

**Key Improvements**:
- Eliminates manual CSS transform parsing
- Uses browser's native getBoundingClientRect() for accurate positioning
- Handles all image types consistently (original, generated, panel images)
- Prevents coordinate drift and offset issues

### Rectangle Masks
- Fixed aspect ratio rectangles (1:1 by default)
- Dynamic resizing with aspect ratio preservation
- Integration with AI editing models
- Visual feedback with handles and borders

## Element Management

### Selection System
```typescript
interface CanvasSelection {
  selectedBubbleId: string | null;
  selectedTextId: string | null;
  selectedAssetId: string | null;
  selectedShapeId: string | null;
}
```

### Transform Operations
- **Move**: Drag elements to new positions
- **Resize**: 8-point resize handles with aspect ratio lock
- **Rotate**: Rotation handles with angle snapping
- **Flip**: Horizontal and vertical flipping
- **Z-index**: Layer ordering management

## Color System

### Color Picker Integration
- Selected color state management
- Color picker click handler
- Application to text, shapes, and elements
- Preset color palettes

## AI Integration

### Mode Support
The canvas supports three AI editing modes:
- **describe**: Text-to-image generation
- **area-edit**: Region-based image editing
- **annotate**: Element annotation and tagging

### AI-Specific Features
- Reference image management
- Model selection per mode
- Prompt integration
- Generation result handling

## Performance Considerations

### Optimization Strategies
- ResizeObserver for efficient container size tracking
- RequestAnimationFrame for smooth animations
- Event delegation for mouse interactions
- Canvas state memoization
- Lazy loading of assets

### Memory Management
- Cleanup of event listeners
- Canvas state reset on panel changes
- Asset URL revocation
- Undo/redo stack size limits

## Mobile Responsiveness

### Touch Support
- Touch event handling for mobile devices
- Gesture recognition for pinch-to-zoom
- Touch-friendly UI controls
- Responsive canvas sizing

### Mobile UI Adaptations
- Collapsible panels
- Touch-optimized tool buttons
- Simplified color picker
- Mobile-specific keyboard shortcuts

## Integration Points

### SceneEditor Integration
```typescript
// State management
const [canvasState, setCanvasState] = useState<CanvasEditorState>(emptyCanvasState());
const [canvasTool, setCanvasTool] = useState<CanvasActiveTool>("canvas-object");
const [zoomLevel, setZoomLevel] = useState(100);

// Zoom handlers
const handleZoomIn = () => setZoomLevel(prev => Math.min(200, prev + 25));
const handleZoomOut = () => setZoomLevel(prev => Math.max(25, prev - 25));
const handleFitToScreen = () => setZoomLevel(100);
```

### AI Panel Integration
- Shared zoom state across panels
- Consistent tool selection
- Unified color picker
- Synchronized aspect ratio changes

## Future Enhancements

### Planned Features
- Advanced layer management
- Custom brush shapes
- Vector drawing tools
- Animation timeline
- Collaborative editing
- Advanced masking tools
- 3D object placement

### Technical Improvements
- WebGL rendering for performance
- Offscreen canvas for complex operations
- Web Workers for heavy computations
- IndexedDB for large project storage
- Real-time synchronization

## Troubleshooting

### Common Issues
1. **Canvas sizing problems**: Check aspect ratio and container dimensions
2. **Zoom not working**: Verify zoom state and handler connections
3. **Mask not visible**: Check opacity settings and brush size
4. **Selection not working**: Ensure mouse event handlers are properly bound
5. **Performance issues**: Monitor canvas state size and render frequency
6. **Brush positioning offset**: Fixed by using simplified coordinate calculation with getBoundingClientRect()
7. **Brush drift on transformed images**: Resolved by eliminating manual CSS transform parsing
8. **Inconsistent brush behavior across images**: Fixed by using consistent image selection and coordinate system

### Debug Tools
- Canvas state inspection in React DevTools
- Console logging for mouse events
- Visual debugging with overlay borders
- Performance profiling with Chrome DevTools

## Conclusion

The current canvas implementation provides a robust foundation for image editing and annotation with extensive tool support, responsive design, and AI integration. The modular architecture allows for easy extension and maintenance while maintaining performance across different devices and use cases.