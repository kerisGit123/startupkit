# Scene Edit Image System - Planning Document

> **Purpose**: Comprehensive planning for scene-based image editing and AI generation system
> **Scope**: SceneEditor integration with AI panels for image editing, element generation, and video creation
> **Phase**: Production-ready implementation with advanced AI capabilities and dynamic pricing

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

### **Data Flow Architecture**:
```
SceneEditor (Canvas) → AI Panel Selection → Model Processing → R2 Storage → Element Library → Scene Integration
```

### **State Management Pattern**:
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

### **LTX Style Compliance**:
- **Color System**: Full LTX color variable integration
- **Typography**: Consistent text hierarchy and styling
- **Interactive States**: Proper hover, focus, and selected states
- **Border Radius**: Consistent `rounded-xl` patterns
- **Transitions**: Smooth animations with proper duration

### **Panel Layout**:

**Mobile-First Design Principles**:
- **Responsive Panels**: Adaptive panel sizing for mobile/tablet/desktop
- **Touch-Optimized**: Minimum 44px touch targets for all interactive elements
- **Gesture Support**: Pinch-to-zoom, swipe navigation, and drag gestures
- **Compact Mode**: Collapsible panels to maximize canvas space on mobile
- **Bottom Navigation**: Mobile-optimized toolbar placement

**Responsive Breakpoints**:
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

**Mobile-Specific Features**:
- **Sliding Panels**: Smooth slide-in/out animations optimized for touch
- **Swipe Gestures**: Swipe to dismiss panels, switch between AI modes
- **Floating Action Buttons**: Quick access to common tools
- **Haptic Feedback**: Tactile response for touch interactions
- **Keyboard Adaptation**: Mobile keyboard handling for text input

**Tool Organization**:
- **Logical Grouping**: Categorized tool layouts for different screen sizes
- **Progressive Disclosure**: Show essential tools first, advanced tools on demand
- **Context Menus**: Long-press context menus for quick actions
- **Keyboard Shortcuts**: Efficient workflow support (desktop focus)
- **Voice Commands**: Voice-activated tool selection (mobile enhancement)

**Canvas Integration**:
- **Touch-Enabled Canvas**: Multi-touch drawing and gesture support
- **Adaptive Zoom**: Smooth zoom with pinch gestures and fit-to-screen options
- **Tool Palette**: Responsive tool layout with scrollable categories
- **Color Picker**: Touch-friendly color selection with swatches
- **Layer Management**: Compact layer view for mobile screens
- **Grid & Guides**: Optional alignment assistance with touch controls

**Mobile Canvas Optimizations**:
- **Touch Precision**: Enhanced touch accuracy for fine details
- **Stabilization**: Hand-stabilization for smoother drawing
- **Pressure Sensitivity**: Support for stylus pressure on compatible devices
- **Palm Rejection**: Ignore accidental palm touches during drawing
- **Auto-Hide UI**: Hide UI elements during active drawing

---

## 🔧 **Technical Implementation Details**

### **Canvas Editor Integration**:

**Drawing Tools**:
```typescript
// Available tools from CanvasEditor
type CanvasTool = CanvasActiveTool;
// Includes: select, brush, eraser, text, shape, etc.
```

**Mask System**:
```typescript
// Brush inpaint mask
const maskBrushSize = 10; // Adjustable brush size
const maskOpacity = 0.8;  // Adjustable opacity
const mask = Array<{ x: number; y: number }>; // Pixel coordinates
```

**Reference Image Handling**:
```typescript
interface ReferenceImage {
  id: string;
  url: string;
  source: 'upload' | 'r2' | 'element';
  name?: string;
  metadata?: ReferenceImageMetadata;
}
```

### **AI Model Integration**:

**Model Selection**:
```typescript
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "character-remix", label: "Character Remix", icon: "🟣" },
  { id: "ideogram/character-edit", label: "Character Edit", icon: "🔵" },
  // ... 5+ more models
];
```

**Prompt Enhancement**:
```typescript
// @mention system for references
const promptWithMentions = "Edit character @ref:character_1 to smile";
// Supports element references, file references, and AI guidance
```

### **R2 Storage Integration**:

**File Structure**:
```
{companyId}/elements/{timestamp}-{filename}
{companyId}/generated/{timestamp}-{filename}
{companyId}/references/{timestamp}-{filename}
```

**Metadata Tracking**:
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

### **Canvas Performance**:
- **Virtualization**: Large canvas rendering optimization
- **Debounced Updates**: Smooth tool interactions
- **Memory Management**: Efficient canvas state handling
- **GPU Acceleration**: Hardware-accelerated rendering

### **AI Processing**:
- **Parallel Processing**: Multiple AI requests support
- **Progressive Loading**: Preview generation during processing
- **Caching**: Intelligent result caching
- **Error Handling**: Robust error recovery

### **State Management**:
- **React.memo**: Component optimization
- **useCallback**: Event handler optimization
- **useMemo**: Expensive computation caching
- **Lazy Loading**: On-demand component loading

### **Mobile UX Considerations**:

**Screen Real Estate Management**:
- **Progressive Disclosure**: Hide complex tools behind expandable sections
- **Contextual Toolbars**: Show relevant tools based on current task
- **Minimalist Interface**: Reduce cognitive load on smaller screens
- **Adaptive Layouts**: Reorganize UI elements based on screen orientation

**Input Adaptations**:
- **Mobile Keyboard**: Optimize text input for mobile keyboards
- **Voice Input**: Voice-to-text for prompt entry
- **Camera Integration**: Direct camera access for reference images
- **File Upload**: Mobile-optimized file selection interface

**Accessibility Enhancements**:
- **Screen Reader Support**: Full accessibility for visually impaired users
- **High Contrast Mode**: Support for system high contrast preferences
- **Large Text Support**: Respect system font size preferences
- **Switch Control**: Support for external accessibility devices

**Orientation Handling**:
- **Landscape Mode**: Optimized layout for horizontal orientation
- **Auto-Rotation**: Smooth transition between orientations
- **Lock Mode**: Option to lock orientation for focused work
- **Responsive Tools**: Tool layout adapts to orientation changes

**Mobile-Specific Workflows**:
- **Quick Actions**: One-tap common operations
- **Gesture Shortcuts**: Custom gesture mappings for frequent tasks
- **Template Library**: Mobile-optimized template selection
- **Recent Projects**: Quick access to recent work

### **Mobile Testing & Validation**:

**Device Compatibility**:
- **iOS Devices**: iPhone SE (375px) to iPhone Pro Max (430px)
- **Android Devices**: Various screen sizes from 360px to 412px width
- **Tablet Support**: iPad (768px+) and Android tablets (600px+)
- **Touch Variations**: Finger touch, stylus, and Apple Pencil support

**Mobile Testing Scenarios**:
- **One-Handed Usage**: Critical functions accessible with thumb
- **Portrait/Landscape**: Full functionality in both orientations
- **Touch Accuracy**: Reliable touch target registration
- **Gesture Recognition**: Consistent gesture behavior across devices
- **Performance**: Smooth performance on mid-range mobile devices

**Progressive Enhancement**:
- **Core Functionality**: Essential features work on all devices
- **Enhanced Features**: Advanced features on capable devices
- **Graceful Degradation**: Reduced functionality on low-end devices
- **Network Adaptation**: Adjust quality based on connection speed

**Mobile Analytics & Monitoring**:
- **Touch Interaction Tracking**: Monitor touch patterns and usability
- **Performance Metrics**: Canvas rendering and AI processing times
- **Error Rates**: Mobile-specific error tracking
- **User Behavior**: Mobile usage patterns and feature adoption

### **Mobile Performance Optimizations**:

**Touch Performance**:
- **Touch Event Optimization**: Efficient touch event handling with passive listeners
- **Gesture Debouncing**: Smooth gesture recognition without performance impact
- **Hardware Acceleration**: GPU-accelerated touch interactions and animations
- **Memory Management**: Optimized canvas state for mobile devices

**Mobile-Specific Optimizations**:
- **Viewport Meta Tag**: Proper mobile viewport configuration
- **Touch Target Optimization**: Minimum 44px targets for reliable touch interaction
- **Reduced Motion**: Respect user's motion preferences for accessibility
- **Battery Optimization**: Efficient rendering to preserve battery life

**Responsive Canvas Performance**:
- **Adaptive Resolution**: Dynamic canvas resolution based on device capabilities
- **LOD (Level of Detail)**: Simplified rendering for zoomed-out views on mobile
- **Progressive Loading**: Load canvas content progressively on slower connections
- **Offline Support**: Basic canvas functionality available offline

---

## 🔐 **Security & Multi-tenancy**

### **CompanyId-based Security**:
- **Server-side Validation**: All operations validated server-side
- **Data Isolation**: Complete tenant separation
- **Access Control**: Role-based permissions
- **Audit Trail**: Comprehensive logging

### **R2 Security**:
- **Signed URLs**: Temporary access URLs
- **Path Isolation**: Company-based file organization
- **Metadata Protection**: Secure metadata handling
- **Cleanup Automation**: Orphaned file cleanup

---

## 🚀 **Implementation Status**

### **✅ Completed Features**:

**SceneEditor.tsx**:
- ✅ Full canvas editing system
- ✅ Multi-AI panel integration
- ✅ Shot management and navigation
- ✅ Reference image handling
- ✅ Zoom and viewport controls
- ✅ Element saving functionality
- ✅ Real-time collaboration tools
- ✅ Mobile-responsive design

**EditImageAIPanel.tsx**:
- ✅ 8+ AI model integration
- ✅ Brush inpainting system
- ✅ Area selection tools
- ✅ Reference image management
- ✅ Prompt enhancement with @mentions
- ✅ Real-time preview
- ✅ Undo/redo functionality
- ✅ Canvas state integration
- ✅ **QUALITY-BASED PRICING**: Dynamic quality selection for Nano Banana 2 and Topaz Upscale
- ✅ **FORMULA JSON CALCULATIONS**: Direct cost extraction from formulaJson with factor multiplication
- ✅ **REAL-TIME CREDIT UPDATES**: Immediate credit recalculation on quality changes
- ✅ **ACCURATE ALERT MESSAGING**: Quality-specific alerts showing correct model names and credits

**ElementImageAIPanel.tsx**:
- ✅ 10+ specialized AI models
- ✅ R2 storage integration
- ✅ Element library connectivity
- ✅ Advanced reference handling
- ✅ Prompt library integration
- ✅ File browser integration
- ✅ Character consistency features
- ✅ Canvas element addition

### **📱 Mobile Implementation Status (2026)
- ✅ **Mobile-First Design**: All components responsive with mobile-first approach
- ✅ **Touch Interactions**: Touch-optimized controls and gesture support  
- ✅ **Responsive Layouts**: Adaptive layouts for different screen sizes
- ✅ **Mobile Performance**: Optimized for mobile devices
- ✅ **Mobile UI Components**: Touch-friendly buttons, panels, and controls
- ✅ **Gesture Handling**: Pinch-to-zoom, swipe navigation, touch drawing
- ✅ **Mobile Canvas**: Touch-enabled canvas with proper event handling
- ✅ **Mobile AI Panels**: Full-screen AI panels on mobile devices
- ✅ **Mobile Toolbars**: Adaptive toolbars with mobile-friendly controls
- ✅ **Mobile Navigation**: Bottom navigation and mobile-optimized menus

#### 🎯 Current Implementation (2026) - PRODUCTION READY
- ✅ **SceneEditor.tsx**: Mobile-responsive canvas editing with touch support
- ✅ **EditImageAIPanel.tsx**: Mobile-optimized AI panel with touch interactions
- ✅ **ElementImageAIPanel.tsx**: Mobile-friendly element generation interface
- ✅ **Mobile Breakpoints**: 640px, 768px, 1024px with adaptive layouts
- ✅ **Touch Events**: Comprehensive touch event handling for all interactions
- ✅ **Mobile Performance**: Optimized rendering and interaction performance
- ✅ **Mobile UI**: Consistent mobile experience across all components addition

### **🎯 Production Ready Status**: 100%

All three components are fully implemented and production-ready with:

- **Complete LTX Style Compliance**: Professional UI/UX design
- **Advanced AI Integration**: Multiple models and capabilities
- **Robust Error Handling**: Comprehensive error management
- **Mobile Optimization**: Touch-friendly interfaces
- **Performance Optimization**: Efficient rendering and processing
- **Security Implementation**: Multi-tenant data protection
- **Documentation**: Complete API and usage documentation

---

## 📋 **Usage Examples**

### **Basic Scene Editing**:
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

### **AI Panel Integration**:
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

### **Element Generation**:
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

## 💰 **Quality-Based Pricing Implementation (March 2026)**

### **Overview**
Advanced pricing system for AI models with dynamic quality selection and real-time credit calculation integrated into the EditImageAIPanel.

### **Implemented Models with Quality Pricing**

#### **Nano Banana 2**
- **Quality Options**: 1K, 2K, 4K
- **Formula JSON**: Direct cost extraction with factor multiplication
- **Pricing**: 
  - 1K: 8 × 1.3 = **11 credits**
  - 2K: 12 × 1.3 = **16 credits**  
  - 4K: 18 × 1.3 = **24 credits**

#### **Topaz Upscale**
- **Quality Options**: 1K, 2K, 4K
- **Formula JSON**: Direct cost extraction with factor multiplication
- **Pricing**:
  - 1K: 10 × 1.3 = **13 credits**
  - 2K: 18 × 1.3 = **24 credits**
  - 4K: 30 × 1.3 = **39 credits**

### **Technical Implementation**

#### **Quality Dropdown UI**
```typescript
// Conditional rendering based on model selection
{(normalizedModel === "nano-banana-2" || normalizedModel === "topaz/image-upscale") && (
  <QualityDropdown
    qualities={["1K", "2K", "4K"]}
    selectedQuality={selectedQuality}
    onQualityChange={(quality) => {
      setSelectedQuality(quality);
      alertModelCredits(currentModelId, quality);
    }}
  />
)}
```

#### **Formula-Based Credit Calculation**
```typescript
const getModelCredits = (modelId: string, selectedQuality: string): number => {
  const model = models.find(m => m.modelId === modelId);
  
  if (model.formulaJson) {
    const formula = JSON.parse(model.formulaJson);
    const quality = formula.pricing?.qualities?.find(q => q.name === selectedQuality);
    if (quality) {
      const factor = model.factor || 1;
      return Math.ceil(quality.cost * factor);
    }
  }
  
  return Math.ceil((model.creditCost || 0) * (model.factor || 1));
};
```

#### **Quality-Aware Alert System**
```typescript
const alertModelCredits = (selectedModelId: string, quality?: string) => {
  // Direct formula calculation for immediate accuracy
  const creditCharge = calculateFromFormula(modelId, quality);
  const qualityInfo = ` (${quality})`;
  
  window.alert(`${modelLabel}${qualityInfo} will charge ${creditCharge} credits.`);
};
```

### **Key Features**

#### **✅ Dynamic Quality Selection**
- Quality dropdown appears only for Nano Banana 2 and Topaz Upscale models
- Hidden by default when other models are selected
- Immediate UI updates when quality changes

#### **✅ Real-Time Credit Calculation**
- Credits update instantly when quality is selected
- Formula-based pricing uses exact costs from formulaJson
- Factor multiplication applied consistently (1.3 for both models)

#### **✅ Accurate Alert Messaging**
- Alerts show correct model name and selected quality
- No state timing issues - quality passed directly to alert
- Example: "Topaz Upscale (4K) will charge 39 credits."

#### **✅ Formula JSON Integration**
- Direct cost extraction from formula quality arrays
- Eliminates hardcoded multiplier calculations
- Consistent with admin pricing management formulas

### **User Experience Flow**

1. **Model Selection**: User selects Nano Banana 2 or Topaz Upscale
2. **Quality Dropdown**: Appears automatically with 1K, 2K, 4K options
3. **Quality Selection**: User clicks desired quality (e.g., "4K")
4. **Immediate Update**: 
   - UI shows new credit cost
   - Alert displays correct pricing with quality
   - State updates for future interactions

### **Integration with Scene Editor**

#### **Canvas State Integration**
- Quality selection persists across canvas interactions
- Credit calculations update in real-time during scene editing
- Alert messaging integrated with canvas tool selection

#### **Element Generation Support**
- Quality-based pricing extends to element generation workflow
- Consistent pricing across all AI panels in scene editor
- Element saving maintains quality metadata

### **Debugging & Monitoring**

#### **Console Logging**
```typescript
console.log("[EditImageAIPanel] Quality-based pricing:", { 
  modelId, 
  selectedQuality, 
  creditCharge, 
  formulaSource: 'formulaJson'
});
```

#### **Alert Debug Info**
```typescript
console.log("[EditImageAIPanel] Alert with quality:", { 
  selectedModelId, 
  qualityForCalculation, 
  modelLabel, 
  creditCharge 
});
```

### **Implementation Files**

- **`EditImageAIPanel.tsx`**: Quality dropdown UI and calculation logic
- **`usePricingData.ts`**: Dynamic pricing data with formula support
- **`PricingCalculator.tsx`**: Enhanced calculator with quality parameters
- **`convex/storyboard/pricing.ts`**: Default models with assignedFunction field

### **Benefits Achieved**

- **✅ User-Friendly**: Clear quality selection with immediate feedback
- **✅ Accurate Pricing**: Formula-based calculations match admin settings
- **✅ Real-Time Updates**: No delays or stale data issues
- **✅ Consistent Experience**: Alerts match UI calculations exactly
- **✅ Maintainable**: Formula-driven pricing reduces hardcoded values

---

*This planning document serves as the comprehensive guide for the Scene Edit Image System, providing detailed technical specifications, implementation guidelines, and usage patterns for the integrated scene editing and AI generation workflow.* 🎨✨