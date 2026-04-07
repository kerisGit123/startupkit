---
description: Canvas Implementation Plan - Production Ready with Credit Integration
---

# Canvas Implementation Plan

## Overview
This document outlines the **current production canvas implementation** in Storyboard Studio, including sizing behavior, tool state, zoom handling, mask behavior, and how the canvas integrates with image editing and AI workflows.

## ✅ Current Status: **PRODUCTION READY**

### **Completed Features (100%)**
- ✅ Canvas editor with full tool support (bubbles, text, assets, shapes, inpainting)
- ✅ Multi-model AI integration with quality-based pricing
- ✅ Credit system integration (real-time balance checking)
- ✅ Reference image management with R2 storage
- ✅ Zoom, pan, and responsive design
- ✅ Organization-aware credit usage
- ✅ Hybrid billing model integration
- ✅ Shared canvas-state workflow across original/generated editing flows
- ✅ Stable brush and mask coordinate behavior
- ✅ Updated fit logic with additional bottom UI spacing

---

## 🧩 Current Implementation Notes (April 2026)

### **What the canvas is responsible for**
- Rendering the active image in a controlled aspect-ratio container
- Managing annotation objects, text, bubbles, assets, and shapes
- Managing inpaint masks and rectangle-based edit regions
- Providing a shared interaction surface for `EditImageAIPanel` and scene-level editing flows

### **Current Boundary**
- **Canvas owns interaction geometry and editing state**, not long-term generated asset persistence
- **Generated image lifecycle and callback-completed storage** are documented in `plan_generatedImage_final02.md`
- **File persistence and R2 architecture** are documented in `plan_file_final.md`
- **Scene orchestration around the canvas** is documented in `plan_scene_edit_image.md`

### **What changed in the latest implementation**
- **Canvas sizing** now reserves explicit top and bottom UI space before fitting the drawing area
- **Canvas scale-up** applies a mild 1.1x display boost after aspect-ratio fitting for better visibility
- **Shared mask behavior** keeps editing state consistent while switching between original and generated image contexts
- **Brush positioning** uses container/image geometry consistently to reduce drift and offset issues

---

## 💰 Quality-Based Pricing Integration (March 2026)

### **Overview**
Advanced pricing system for AI models with dynamic quality selection and real-time credit calculation integrated into the canvas-based AI editing workflow.

### **Dynamic Sizing Algorithm**
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

### **Sizing Behavior Summary**
- The outer container determines the maximum drawable region
- Width is fitted first, then height is clamped if the chosen aspect ratio would overflow vertically
- Extra bottom space is intentionally reserved for toolbar and panel controls
- Final rendered canvas is slightly enlarged for usability without changing the logical drawing coordinate system

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

## Mask System

### Brush Inpainting
- Real-time mask painting with adjustable brush size
- Eraser mode for mask correction
- Opacity control for mask visibility
- Undo/redo stack for mask operations
- **Fixed coordinate calculation** for accurate brush positioning across all images
- **Consistent brush behavior** across original, generated, and panel images
- **Shared mask state** so painted areas remain consistent while the editing context changes

### Coordinate Calculation System
The brush system uses a simplified coordinate calculation approach based on the rendered image rect inside the canvas container:
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

### **Shared Editing Behavior**
- The mask and editor state are treated as canvas-space data rather than per-image CSS-space data
- Switching between panels should not silently reset the active mask unless the calling flow explicitly clears it
- Tool changes from AI panels should map into a single authoritative canvas tool state to avoid conflicts

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

### **Current Integration Expectations**
- `SceneEditor` owns the authoritative canvas state and passes it into the canvas wrapper/components
- AI panels should adjust tool mode, prompt/configuration, and generation actions without duplicating canvas state logic
- Generated result workflows should reuse the same canvas interaction model rather than spawning separate coordinate systems

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

The current canvas implementation is already production-capable and acts as the shared editing surface for annotation and AI-assisted editing. The most important implementation details are the aspect-ratio fit logic, reserved UI padding, shared mask/tool state, and consistent coordinate calculations that keep editing stable across original and generated image flows.