# Scene Editor & Canvas System

> **Owns**: SceneEditor orchestration, canvas geometry/masks/tools, cross-panel editing flow, AI panel integration
> **Status**: Implemented
> **Pricing**: See `plan_price_management.md`

---

## ✅ Current Implementation Summary (April 2026)

- **`SceneEditor.tsx` is the central orchestration layer** for scene editing, AI panel switching, generation calls, and callback-aware media handling
- **Canvas editing** is shared across original/generated contexts using a unified state model
- **Edit-image flows** support mask-based and crop-based generation behavior depending on model/tool mode
- **Generated assets** are increasingly tracked through `storyboard_files` and callback-completed storage flows instead of only transient local state
- **Video generation flows** now live alongside image generation in the same scene editing surface

### **Current Responsibility Split**

- **`SceneEditor.tsx`**: orchestration, generation entry points, shot state, project/media coordination
- **`EditImageAIPanel.tsx`**: image editing controls, quality/model selection, prompting, mask/edit UX
- **`ElementImageAIPanel.tsx`**: reusable asset/element generation workflows
- **video/image panels**: model-specific generation controls that delegate actual mutation/API work back into the scene editor layer

---

## 🎯 **System Overview**

The Scene Edit Image System integrates three core components to provide a complete scene-based content creation workflow with dynamic pricing integration:

1. **SceneEditor.tsx** - Main scene editing interface with canvas and AI integration
2. **EditImageAIPanel.tsx** - AI-powered image editing and inpainting panel with dynamic pricing
3. **ElementImageAIPanel.tsx** - Element generation and AI image creation panel

---

## 🏗️ **Component Architecture**

### **1. SceneEditor.tsx - Core Scene Management**

**Role**: Central scene editing interface with canvas, tools, and AI panel integration

**Key Features**:
- **Canvas Editor**: Advanced drawing and annotation tools
- **Multi-AI Panel Support**: Switch between edit, video, and element AI panels
- **Shot Management**: Multiple shots per scene with navigation
- **Reference Images**: Support for background and reference images
- **Real-time Collaboration**: Comments, tags, and annotations
- **Zoom & Pan**: Advanced viewport controls
- **Element Integration**: Save generated content as reusable elements
- **Dynamic Pricing Integration**: Real-time credit calculation and display
- **Model Behavior Handling**: Proper cropping logic for different AI models

**Technical Implementation**:
```typescript
interface SceneEditorProps {
  shots: Shot[];
  initialShotId: string;
  onClose: () => void;
  onShotsChange: (shots: Shot[]) => void;
  onSaveImageAsElement?: (draft: { imageUrl: string; name?: string; type?: string }) => void;
  projectId?: Id<"storyboard_projects">;
  userId?: string;
  user?: any;
  userCompanyId?: string;
}
```

**State Management**:
- Active shot tracking and navigation
- AI panel mode switching (edit/element/video)
- Reference image management
- Canvas state and tool selection
- Dynamic pricing state integration

### **2. EditImageAIPanel.tsx - Image Editing AI**

**Role**: AI-powered image editing, inpainting, and modification tools

**Key Features**:
- **Multiple AI Models**: 8+ specialized models for different editing tasks
- **Brush Inpainting**: Advanced mask-based editing with brush controls
- **Area Selection**: Rectangle and freeform selection tools
- **Reference Images**: Upload and use reference images for AI guidance
- **Prompt Enhancement**: Advanced prompt editing with @mentions
- **Real-time Preview**: Live preview of AI edits
- **Undo/Redo**: Full editing history support

**AI Models Available**:
- Nano Banana 2/1 - General image editing
- Stable Diffusion - Classic generation
- GPT Image 1.5 Text - Text-to-image
- Nano Banana Edit - Specialized editing
- Flux 2 Flex - Image-to-image
- Character Remix - Character editing
- Qwen Image Edit - Advanced editing
- Ideogram Character Edit - Character-specific

**Technical Implementation**:
```typescript
export type AIEditMode = "describe" | "area-edit" | "annotate";

interface EditImageAIPanelProps {
  mode: AIEditMode;
  onModeChange: (mode: AIEditMode) => void;
  onGenerate: () => void;
  credits?: number;
  model?: string;
  onModelChange?: (model: string) => void;
  referenceImages?: ReferenceImage[];
  isGenerating?: boolean;
  userPrompt?: string;
  onUserPromptChange?: (prompt: string) => void;
  // Canvas integration props
  isEraser?: boolean;
  maskBrushSize?: number;
  maskOpacity?: number;
  canvasState?: { mask: Array<{ x: number; y: number }> };
  onToolSelect?: (tool: string) => void;
  // Additional canvas controls
  onCropExecute?: (aspectRatio: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  selectedColor?: string;
  onDeleteSelected?: () => void;
}
```

### **3. ElementImageAIPanel.tsx - Element Generation AI**

**Role**: AI-powered element generation and image creation for reusable assets

**Key Features**:
- **Element Generation**: Create reusable elements from AI
- **Advanced Models**: 10+ specialized models for different content types
- **R2 Integration**: Direct storage to Cloudflare R2
- **Element Library**: Integration with element library system
- **Reference Management**: Advanced reference image handling
- **Prompt Library**: Access to saved prompts and templates
- **File Browser**: Direct access to project files
- **Character Consistency**: Maintain character appearance across generations

**Technical Implementation**:
```typescript
export type ImageAIEditMode = "describe";

interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
}

interface ElementImageAIPanelProps {
  mode: ImageAIEditMode;
  onModeChange: (mode: ImageAIEditMode) => void;
  onGenerate: () => void;
  credits?: number;
  model?: string;
  referenceImages?: ReferenceImage[];
  userCompanyId?: string;
  projectId?: Id<"storyboard_projects">;
  userId?: string;
  user?: any;
  // Canvas integration
  isEraser?: boolean;
  maskBrushSize?: number;
  canvasState?: { mask: Array<{ x: number; y: number }> };
  onAddCanvasElement?: (file: File) => void;
  backgroundImage?: string | null;
  // View controls
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  zoomLevel?: number;
}
```

---

## 🔄 **Integration Flow**

### **Scene Editor → AI Panels Integration**

1. **Panel Switching**: Seamless switching between edit, video, and element AI modes
2. **Canvas State Sharing**: Real-time canvas state synchronization
3. **Reference Image Management**: Shared reference system across panels
4. **Generated Content Flow**: Direct integration of AI results into scene
5. **Element Creation**: Save AI results as reusable elements

### **Data Flow Architecture**
```
SceneEditor (Canvas) → AI Panel Selection → Model Processing → R2 Storage → Element Library → Scene Integration
```

### **State Management Pattern**
```typescript
// Scene Editor manages AI panel state
const [activeAIPanel, setActiveAIPanel] = useState<'editimage' | 'video' | 'element'>('editimage');

// Shared state for canvas integration
const canvasState = {
  mask: Array<{ x: number; y: number }>,
  backgroundImage: string | null,
  zoomLevel: number,
  selectedColor: string
};

// AI panel receives shared state
<EditImageAIPanel
  canvasState={canvasState}
  onToolSelect={handleToolSelect}
  onSetOriginalImage={setOriginalImage}
  // ... other props
/>
```

---

## 🎨 **UI/UX Design System**

### **LTX Style Compliance**
- **Color System**: Full LTX color variable integration
- **Typography**: Consistent text hierarchy and styling
- **Interactive States**: Proper hover, focus, and selected states
- **Border Radius**: Consistent `rounded-xl` patterns
- **Transitions**: Smooth animations with proper duration

### **Panel Layout**

#### **Mobile-First Design Principles**

- **Responsive Panels**: Adaptive panel sizing for mobile/tablet/desktop
- **Touch-Optimized**: Minimum 44px touch targets for all interactive elements
- **Gesture Support**: Pinch-to-zoom, swipe navigation, and drag gestures
- **Compact Mode**: Collapsible panels to maximize canvas space on mobile
- **Bottom Navigation**: Mobile-optimized toolbar placement

#### **Responsive Breakpoints**

```css
/* Mobile: 320px - 768px */
.panel-mobile {
  width: 100%;
  height: 40vh;
  bottom: 0;
  border-radius: 24px 24px 0 0;
}

/* Tablet: 768px - 1024px */
.panel-tablet {
  width: 50%;
  height: 60vh;
  right: 0;
  border-radius: 24px 0 0 24px;
}

/* Desktop: 1024px+ */
.panel-desktop {
  width: 400px;
  height: 100vh;
  right: 0;
  border-radius: 24px 0 0 24px;
}
```

#### **Mobile-Specific Features**

- **Sliding Panels**: Smooth slide-in/out animations optimized for touch
- **Swipe Gestures**: Swipe to dismiss panels, switch between AI modes
- **Floating Action Buttons**: Quick access to common tools
- **Haptic Feedback**: Tactile response for touch interactions
- **Keyboard Adaptation**: Mobile keyboard handling for text input

#### **Tool Organization**

- **Logical Grouping**: Categorized tool layouts for different screen sizes
- **Progressive Disclosure**: Show essential tools first, advanced tools on demand
- **Context Menus**: Long-press context menus for quick actions
- **Keyboard Shortcuts**: Efficient workflow support (desktop focus)
- **Voice Commands**: Voice-activated tool selection (mobile enhancement)

#### **Canvas Integration**

- **Touch-Enabled Canvas**: Multi-touch drawing and gesture support
- **Adaptive Zoom**: Smooth zoom with pinch gestures and fit-to-screen options
- **Tool Palette**: Responsive tool layout with scrollable categories
- **Color Picker**: Touch-friendly color selection with swatches
- **Layer Management**: Compact layer view for mobile screens
- **Grid & Guides**: Optional alignment assistance with touch controls

#### **Mobile Canvas Optimizations**

- **Touch Precision**: Enhanced touch accuracy for fine details
- **Stabilization**: Hand-stabilization for smoother drawing
- **Pressure Sensitivity**: Support for stylus pressure on compatible devices
- **Palm Rejection**: Ignore accidental palm touches during drawing
- **Auto-Hide UI**: Hide UI elements during active drawing

---

## 🔧 **Technical Implementation Details**

### **Canvas Editor Integration**

#### **Drawing Tools**

```typescript
// Available tools from CanvasEditor
type CanvasTool = CanvasActiveTool;
// Includes: select, brush, eraser, text, shape, etc.
```

#### **Mask System**

```typescript
// Brush inpaint mask
const maskBrushSize = 10; // Adjustable brush size
const maskOpacity = 0.8;  // Adjustable opacity
const mask = Array<{ x: number; y: number }>; // Pixel coordinates
```

#### **Reference Image Handling**

```typescript
interface ReferenceImage {
  id: string;
  url: string;
  source: 'upload' | 'r2' | 'element';
  name?: string;
  metadata?: ReferenceImageMetadata;
}
```

### **AI Model Integration**

#### **Model Selection**

```typescript
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "character-remix", label: "Character Remix", icon: "🟣" },
  { id: "ideogram/character-edit", label: "Character Edit", icon: "🔵" },
  // ... 5+ more models
];
```

#### **Prompt Enhancement**

```typescript
// @mention system for references
const promptWithMentions = "Edit character @ref:character_1 to smile";
// Supports element references, file references, and AI guidance
```

### **R2 Storage Integration**

#### **File Structure**

```
{companyId}/elements/{timestamp}-{filename}
{companyId}/generated/{timestamp}-{filename}
{companyId}/references/{timestamp}-{filename}
```

#### **Metadata Tracking**

```typescript
interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
}
```

---

## 📊 **Performance Optimizations**

### **Canvas Performance**

- **Virtualization**: Large canvas rendering optimization
- **Debounced Updates**: Smooth tool interactions
- **Memory Management**: Efficient canvas state handling
- **GPU Acceleration**: Hardware-accelerated rendering

### **AI Processing**

- **Parallel Processing**: Multiple AI requests support
- **Progressive Loading**: Preview generation during processing
- **Caching**: Intelligent result caching
- **Error Handling**: Robust error recovery

### **State Management**

- **React.memo**: Component optimization
- **useCallback**: Event handler optimization
- **useMemo**: Expensive computation caching
- **Lazy Loading**: On-demand component loading

### **Mobile UX Considerations**

#### **Screen Real Estate Management**

- **Progressive Disclosure**: Hide complex tools behind expandable sections
- **Contextual Toolbars**: Show relevant tools based on current task
- **Minimalist Interface**: Reduce cognitive load on smaller screens
- **Adaptive Layouts**: Reorganize UI elements based on screen orientation

#### **Input Adaptations**

- **Mobile Keyboard**: Optimize text input for mobile keyboards
- **Voice Input**: Voice-to-text for prompt entry
- **Camera Integration**: Direct camera access for reference images
- **File Upload**: Mobile-optimized file selection interface

#### **Accessibility Enhancements**

- **Screen Reader Support**: Full accessibility for visually impaired users
- **High Contrast Mode**: Support for system high contrast preferences
- **Large Text Support**: Respect system font size preferences
- **Switch Control**: Support for external accessibility devices

#### **Orientation Handling**

- **Landscape Mode**: Optimized layout for horizontal orientation
- **Auto-Rotation**: Smooth transition between orientations
- **Lock Mode**: Option to lock orientation for focused work
- **Responsive Tools**: Tool layout adapts to orientation changes

#### **Mobile-Specific Workflows**

- **Quick Actions**: One-tap common operations
- **Gesture Shortcuts**: Custom gesture mappings for frequent tasks
- **Template Library**: Mobile-optimized template selection
- **Recent Projects**: Quick access to recent work

### **Mobile Testing & Validation**

#### **Device Compatibility**

- **iOS Devices**: iPhone SE (375px) to iPhone Pro Max (430px)
- **Android Devices**: Various screen sizes from 360px to 412px width
- **Tablet Support**: iPad (768px+) and Android tablets (600px+)
- **Touch Variations**: Finger touch, stylus, and Apple Pencil support

#### **Mobile Testing Scenarios**

- **One-Handed Usage**: Critical functions accessible with thumb
- **Portrait/Landscape**: Full functionality in both orientations
- **Touch Accuracy**: Reliable touch target registration
- **Gesture Recognition**: Consistent gesture behavior across devices
- **Performance**: Smooth performance on mid-range mobile devices

#### **Progressive Enhancement**

- **Core Functionality**: Essential features work on all devices
- **Enhanced Features**: Advanced features on capable devices
- **Graceful Degradation**: Reduced functionality on low-end devices
- **Network Adaptation**: Adjust quality based on connection speed

#### **Mobile Analytics & Monitoring**

- **Touch Interaction Tracking**: Monitor touch patterns and usability
- **Performance Metrics**: Canvas rendering and AI processing times
- **Error Rates**: Mobile-specific error tracking
- **User Behavior**: Mobile usage patterns and feature adoption

### Mobile Performance Optimizations

#### Touch Performance

- Touch Event Optimization: Efficient touch event handling with passive listeners
- Gesture Debouncing: Smooth gesture recognition without performance impact
- Hardware Acceleration: GPU-accelerated touch interactions and animations
- Memory Management: Optimized canvas state for mobile devices

#### Mobile-Specific Optimizations

- Viewport Meta Tag: Proper mobile viewport configuration
- Touch Target Optimization: Minimum 44px targets for reliable touch interaction
- Reduced Motion: Respect user's motion preferences for accessibility
- Battery Optimization: Efficient rendering to preserve battery life

#### Responsive Canvas Performance

- Adaptive Resolution: Dynamic canvas resolution based on device capabilities
- LOD (Level of Detail): Simplified rendering for zoomed-out views on mobile
- Progressive Loading: Load canvas content progressively on slower connections
- Offline Support: Basic canvas functionality available offline

---

## Security & Multi-tenancy

- CompanyId-based Security: Server-side validation, data isolation, access control, and audit trail
- R2 Security: Signed URLs, path isolation, metadata protection, and cleanup automation

---

## Implementation Status

### Completed Features

- Complete LTX Style Compliance: Professional UI/UX design
- Advanced AI Integration: Multiple models and capabilities
- Robust Error Handling: Comprehensive error management
- Mobile Optimization: Touch-friendly interfaces
- Performance Optimization: Efficient rendering and processing
- Security Implementation: Multi-tenant data protection
- Documentation: Complete API and usage documentation

---

## Usage Examples

### Basic Scene Editing

```typescript
// Initialize SceneEditor with AI panels
<SceneEditor
  shots={shots}
  initialShotId={shotId}
  onClose={handleClose}
  onShotsChange={handleShotsChange}
  onSaveImageAsElement={handleSaveAsElement}
  projectId={projectId}
  userCompanyId={companyId}
/>
```

### AI Panel Integration

```typescript
// Switch between AI modes
const handleAIPanelSwitch = (panel: 'editimage' | 'video' | 'element') => {
  setActiveAIPanel(panel);
};

// Canvas state sharing
const canvasState = {
  mask: currentMask,
  backgroundImage: currentImage,
  zoomLevel: zoom,
  selectedColor: activeColor
};
```

### **Element Generation**

```typescript
// Generate element from AI
const handleGenerateElement = async (prompt: string, model: string) => {
  const result = await generateImage({
    prompt,
    model,
    referenceImages,
    companyId: userCompanyId
  });
  
  // Save as element
  await saveAsElement({
    imageUrl: result.url,
    name: generatedName,
    type: 'character',
    companyId: userCompanyId
  });
};
```

---

## 🔮 **Future Enhancements**

### **Advanced AI Features**:
- **3D Scene Generation**: AI-powered 3D scene creation
- **Motion Graphics**: Animated element generation
- **Style Transfer**: Advanced style application
- **Batch Processing**: Multi-image generation

### **Collaboration Features**:
- **Real-time Co-editing**: Multiple users editing simultaneously
- **Version Control**: Scene versioning and history
- **Comment System**: Enhanced commenting and annotations
- **Share Links**: Secure scene sharing

### **Performance Improvements**:
- **WebGL Acceleration**: GPU-accelerated canvas
- **Streaming AI**: Progressive AI result streaming
- **Smart Caching**: Intelligent result and asset caching
- **Background Processing**: Non-blocking AI operations

---

## Upload Override (April 2026)

### Overview
The Upload Override button in SceneEditor opens a FileBrowser modal, allowing the user to select an existing image from their file library to replace the current frame image.

### Flow
1. User clicks the Upload Override button in the SceneEditor toolbar
2. FileBrowser opens in selection mode (modal overlay)
3. User selects an image from the paginated, filtered file list
4. Selected image is saved to `storyboard_files` with `category="generated"` and linked to the current frame's `itemId`
5. The frame's display image updates to the selected file

### Key Behavior
- Only images are selectable (not videos/audio/docs)
- The selected file is re-categorized as `"generated"` in `storyboard_files`
- The file is linked to the current storyboard item via `categoryId`
- This provides a manual override path when AI generation results are unsatisfactory

---

## Pricing Integration

> See `plan_price_management.md` for quality-based pricing. SceneEditor delegates credit calculation to `getModelCredits()`.

---

*This planning document serves as the comprehensive guide for the Scene Edit Image System, providing detailed technical specifications, implementation guidelines, and usage patterns for the integrated scene editing and AI generation workflow.*

---

# Canvas System

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
