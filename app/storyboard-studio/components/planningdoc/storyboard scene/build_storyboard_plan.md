# 🎬 Storyboard Build Plan with n8n Integration

## 🎯 Objective
Integrate n8n workflow "storyboard - Script Extractor" into the existing storyboard build system to replace manual script processing with AI-powered extraction.

## 🎨 Recent UI Improvements (March 2026)

### ✅ Element Badge System
- **Z-Index Overlay**: Element badges now use z-index positioning instead of creating extra sections
- **Proper Positioning**: Elements positioned at `bottom-36` (144px from bottom) with `z-10`
- **Interactive Badges**: Hover effects with X buttons for element removal
- **Color Coding**: Purple (characters), Emerald (environments), Blue (props)
- **Legacy Support**: Handles both new `elementNames` format and legacy `linkedElements`

### ✅ Tags System Enhancement  
- **Original Functionality Preserved**: Kept all existing tag editor features
- **Z-Index Priority**: Tags now have highest z-index (`z-30`) for visibility
- **No Reinvention**: Maintained original tag management system
- **Clean Layout**: Tags don't interfere with description text

### ✅ Action Buttons
- **+ Element Button**: Added purple button for element library access
- **Proper Positioning**: Action buttons at `bottom-12` with `z-20` 
- **Hover Effects**: Appears on card hover with smooth transitions
- **Functional**: Opens ElementLibrary modal for adding elements

### 📏 Current Z-Index Hierarchy
```
1. Tags (z-30) - Highest priority, original functionality
2. Action Buttons (z-20) - + Element, Duplicate, Delete  
3. Element Badges (z-10) - Character/Environment/Prop badges
```

---

## 🏗️ Current System Overview

### Scene Auto-Generation:
- **Script Input**: User writes script in script editor (pic3)
- **Algorithm Processing**: System automatically generates scenes when script is saved
- **Scene Selection**: User can view/select generated scenes (pic2)

### Build Dialog Options (pic1):
- **Build Type**: Normal Build, Enhanced Build
- **Rebuild Strategy**: 
  - **Add/Update Scenes (Smart Mode)**: Unchecked scenes = Add new, Checked scenes = Update existing
  - **Replace All (Destructive Mode)**: Complete rebuild of all content
- **Element Strategy**: Preserve Elements, Regenerate Elements

### Build Types:
- **Normal Build**: Generate frames without AI extraction
- **Enhanced Build**: Generate frames + AI extraction

### Rebuild Strategies:
- **Add/Update Scenes**: Handles both adding and updating in one option
- **Replace All**: Remove and replace all content

### Element Strategies:
- **Preserve Elements**: Keep existing elements
- **Regenerate Elements**: Re-extract all elements

### Build Dialog UI/UX Implementation Details
- **Tabbed Interface**: Basic Settings Tab and Advanced Settings Tab
- **Color Theme Consistency**: Neutral background, Indigo accents, and Subtle borders
- **Responsive Design**: Desktop and Mobile layouts

---

## 🔧 Current Implementation Status (March 2026)

### ✅ **Build System Working Correctly**

The storyboard build system is now fully functional with the following improvements:

#### **1. Enhanced Build + Regenerate** ✅
**Problem**: Enhanced elements from smart environment detection weren't being used.

**Fix**: When `buildType: "enhanced"` and `elementStrategy: "regenerate"`, the system now:
- Calls the enhanced extraction API
- Extracts smart environments using pattern matching (deep ocean, research facility, aquarium, etc.)
- Passes these enhanced elements to the backend
- Creates elements with `createdBy: "system-enhanced"` and detailed descriptions

#### **2. Normal Build + Element Strategy** ✅
**Problem**: Normal build didn't respect element strategy properly.

**Fix**:
- **Normal Build + Preserve**: Passes `undefined` to skip element creation
- **Normal Build + Regenerate**: Passes `[]` to allow fallback element creation from scene locations

#### **3. Hard Rebuild (Replace All)** ✅
**Already Working**: The backend correctly deletes all existing storyboard items and elements before rebuilding.

### 📊 **Current Build Matrix**

| Build Type | Element Strategy | Result |
|------------|------------------|--------|
| **Enhanced** | Regenerate | Smart AI-detected environments (e.g., "The Deep Ocean", "Research Control Room") |
| **Enhanced** | Preserve | No new elements created, keeps existing ones |
| **Normal** | Regenerate | Fallback elements from scene locations |
| **Normal** | Preserve | No new elements created, keeps existing ones |

### 🎯 **Testing Recommendation**
Try: **Replace All + Enhanced Build + Regenerate Elements**

This should:
1. Delete all existing items and elements
2. Extract smart environments using AI pattern matching
3. Create properly named, consolidated environments instead of 9 generic ones
4. Show elements like "The Deep Ocean", "Giant Aquarium Facility", "Research Control Room" in the Element Library

---

## 🔧 n8n Webhook Integration (Completed)

### 📋 **Webhook Configuration**
The "storyboard - script element extractor" workflow has been converted from form-based to webhook-based integration.

#### **Webhook URL**
```
https://n8n.srv1010007.hstgr.cloud/webhook/storyboard-script-extractor
```

#### **Request Payload Structure**
```json
{
  "project_id": "storyboard_project_id",
  "script_type": "ANIMATED_STORIES",
  "language": "en",
  "script": "Your script content here...",
  "build_strategy": "add_update",
  "webhook_url": "https://your-domain.com/api/storyboard/n8n-webhook"
}
```

#### **Response Webhook Structure**
```json
{
  "project_id": "storyboard_project_id",
  "status": "ready",
  "message": "Build completed successfully",
  "elements": {
    "characters": [...],
    "environments": [...],
    "props": [...]
  },
  "scenes": [...]
}
```

---

## 🔧 New Integration Architecture (Real-Time n8n → Convex)

### 📋 Complete Build Flow (Non-Blocking + Real-Time Updates)

```
User Selects Script Type (Dropdown) → Clicks Build Button
    ↓
1. Set Convex Task Status: taskStatus="processing", taskType="script", taskMessage="Building storyboard..."
    ↓
2. Strategy Processing (replace/add_update scenes) → Clear data if needed
    ↓
3. Send to n8n: https://n8n.srv1010007.hstgr.cloud/workflow/nvWSNw6bq3X81w8WPeeep
    ↓
4. n8n Processes: Extracts elements + scenes from script
    ↓
5. n8n Directly Updates Convex: storyboard_elements table + storyboard_items table
    ↓
6. n8n Updates Task Status: taskStatus="ready", taskMessage="Build completed"
    ↓
7. Storyboard Page Auto-Updates: Shows task status on storyboard card (real-time)
```

### 🎯 Key Architecture Benefits

#### ✅ **Non-Blocking System**
- **User clicks build** → Immediate UI feedback (no waiting)
- **n8n processes in background** → System remains responsive
- **Real-time updates** → UI updates automatically when complete

#### ✅ **Direct n8n → Convex Integration**
- **No intermediate server** → n8n talks directly to Convex
- **Faster processing** → Less network hops, direct data updates
- **Simpler architecture** → Fewer moving parts, cleaner code

#### ✅ **Perfect User Experience**
- **Immediate feedback** → User sees "processing" right away
- **Real-time updates** → Card updates automatically when done
- **Clear status** → User knows exactly what's happening

---

## 🔧 n8n Workflow Conversion Steps (Completed)

### **🔄 From Form to Webhook Migration**

The "storyboard - script element extractor" workflow has been successfully converted from form-based to webhook-based integration.

#### **BEFORE (Form-based)**
```
[Form Trigger] → [Script Processing] → [Form Response]
```

#### **AFTER (Webhook-based)**
```
[Webhook Trigger] → [Script Processing] → [HTTP Request (Callback)]
```

### **📋 Conversion Steps Completed**

#### **Step 1: Webhook Trigger Setup**
- **Path**: `/storyboard-script-extractor`
- **HTTP Method**: POST
- **Response Mode**: Wait for response
- **Authentication**: None

#### **Step 2: Request Body Configuration**
The webhook receives JSON payload with:
- `project_id`: Convex storyboard project ID
- `script_type`: Script type (ANIMATED_STORIES, etc.)
- `language`: Language code (en, zh, etc.)
- `script`: Full script content
- `build_strategy`: "add_update" or "replace_all"
- `webhook_url`: Callback URL for results

#### **Step 3: HTTP Request Node for Callback**
- **Method**: POST to `{{ $json.webhook_url }}`
- **Headers**: Content-Type: application/json
- **Body**: JSON response with extracted elements and scenes

#### **Step 4: Response Structure**
```json
{
  "project_id": "{{ $json.project_id }}",
  "status": "ready",
  "message": "Build completed successfully",
  "elements": {
    "characters": [...],
    "environments": [...],
    "props": [...]
  },
  "scenes": [...]
}
```

### **✅ Verification Checklist**
- [x] Webhook trigger configured with correct path
- [x] HTTP request node added for callback
- [x] JSON payload structure matches expected format
- [x] Error handling implemented
- [x] Workflow activated and tested
- [x] Callback URL receives correct data
- [x] Task status updates work in UI

---

## 🔧 Required Convex Mutations for n8n Integration

### Elements Batch Create Mutation (n8n calls this directly)
```javascript
// convex/mutations/elements.ts
export const createBatch = mutation({
  args: {
    elements: v.array(v.object({
      type: v.string(), // "character" | "environment" | "prop"
      name: v.string(),
      description: v.string(),
      confidence: v.number(),
      type: v.string(), // element type from n8n
      appearsInScenes: v.array(v.number())
    })),
    projectId: v.id("storyboard_projects")
  },
  handler: async (ctx, args) => {
    for (const element of args.elements) {
      await ctx.db.insert("storyboard_elements", {
        ...element,
        projectId: args.projectId
      });
    }
    return { success: true, count: args.elements.length };
  }
});
```

### StoryboardItems Batch Create Mutation (n8n calls this directly)
```javascript
// convex/mutations/storyboardItems.ts
export const createBatch = mutation({
  args: {
    scenes: v.array(v.object({
      sceneNumber: v.number(),
      title: v.string(),
      duration: v.string(),
      description: v.string(),
      visualPrompt: v.string(),
      elements: v.object({
        characters: v.array(v.string()),
        environments: v.array(v.string()),
        props: v.array(v.string())
      })
    })),
    projectId: v.id("storyboard_projects")
  },
  handler: async (ctx, args) => {
    for (const scene of args.scenes) {
      await ctx.db.insert("storyboard_items", {
        ...scene,
        projectId: args.projectId
      });
    }
    return { success: true, count: args.scenes.length };
  }
});
```

### Task Status Update Mutation (n8n calls this directly)
```javascript
// convex/mutations/storyboards.ts
export const updateTaskStatus = mutation({
  args: {
    storyboardId: v.id("storyboards"),
    taskStatus: v.string(),
    taskMessage: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, {
      taskStatus: args.taskStatus,
      taskMessage: args.taskMessage
    });
```

**Result**: Basic, inconsistent imagery, limited visual quality

#### **✅ Enhanced Build (AI-Powered Prompts)**
```javascript
// Detailed, cinematic-quality prompts with visual rules
"Dark deep ocean abyss, faint blue light filtering through water, mysterious atmosphere, deep sea particles floating, cinematic lighting, ultra-realistic, epic wide cinematic perspective, cinematic short-film lighting, mysterious suspenseful atmosphere with room haze particles, water particles floating, deep shadow contrast, atmospheric depth, clear perspective, cinematic short-film lighting, environment continuity, height/scale control, softness + film grain, ultra realistic, 8k detail, cinematic film still, professional photography, dramatic shadows, volumetric light rays, accurate location context"
```

**Result**: Professional, consistent, cinematic-quality imagery

### **🔧 How Enhanced Scripts Work**

#### **1. AI Extraction Process**
```javascript
// When Enhanced Build is selected:
const response = await fetch('/api/storyboard/enhanced-script-extraction', {
  method: 'POST',
  body: JSON.stringify({
    scriptContent: src,
    projectId: pid
  })
});
```

#### **2. AI Prompt Enhancement**
The AI service takes your basic script and **enhances each scene** with:
- **Cinematic rules** (perspective, lighting, atmosphere)
- **Quality specifications** (8k detail, professional photography)
- **Visual consistency** (environment continuity, height/scale control)
- **Professional terminology** (volumetric light rays, film grain)

#### **3. Visual Consistency Rules**
From the enhanced script examples:
- **Perspective**: Epic wide cinematic perspective
- **Lighting**: Cinematic short-film lighting, deep shadow contrast
- **Atmosphere**: Mysterious suspenseful with particles
- **Quality**: Ultra realistic, 8k detail, professional photography
- **Continuity**: Clear perspective, environment continuity

### **🎯 Example: Scene 1 - Deep Ocean Mystery**

#### **Base Prompt (Normal)**
```
"Dark deep ocean abyss, faint blue light filtering through water, mysterious atmosphere, deep sea particles floating, cinematic lighting, ultra-realistic."
```

#### **Enhanced Prompt (AI-Powered)**
```
"Dark deep ocean abyss, faint blue light filtering through water, mysterious atmosphere, deep sea particles floating, cinematic lighting, ultra-realistic, epic wide cinematic perspective, cinematic short-film lighting, mysterious suspenseful atmosphere with room haze particles, water particles floating, deep shadow contrast, atmospheric depth, clear perspective, cinematic short-film lighting, environment continuity, height/scale control, softness + film grain, ultra realistic, 8k detail, cinematic film still, professional photography, dramatic shadows, volumetric light rays, softness + film grain, accurate location context"
```

### **🎨 Benefits of Enhanced Scripts**

#### **✅ Visual Quality**
- **8K Detail**: Ultra-high resolution imagery
- **Professional Photography**: Cinematic quality standards
- **Film Grain**: Authentic cinematic texture
- **Dramatic Shadows**: Professional lighting effects

#### **✅ Consistency**
- **Visual Rules**: Consistent perspective and lighting across all scenes
- **Environment Continuity**: Seamless transitions between scenes
- **Height/Scale Control**: Proper proportions and scale
- **Atmospheric Depth**: Rich, layered visual environments

#### **✅ Cinematic Quality**
- **Wide Perspective**: Epic cinematic framing
- **Short-Film Lighting**: Professional movie lighting techniques
- **Particle Effects**: Atmospheric particles for depth
- **Volumetric Light**: Realistic light ray rendering

### **🔗 Integration in Build System**

#### **Build Type Selection**
```javascript
// In BuildStoryboardModal.tsx
<label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-800/50 rounded-lg hover:bg-neutral-900 transition-colors">
  <input
    type="radio"
    name="buildType"
    checked={buildConfig.buildType === "enhanced"}
    onChange={() => setBuildConfig(prev => ({ ...prev, buildType: "enhanced" }))}
    className="w-4 h-4 text-indigo-500 mt-1"
  />
  <div className="flex-1">
    <div className="font-medium text-white">Enhanced Build</div>
    <div className="text-sm text-neutral-400">Generate frames + AI extraction</div>
  </div>
</label>
```

#### **Execution Flow**
1. **User selects "Enhanced Build"** → Modal captures this choice
2. **Script parsing** → Scenes extracted from script
3. **AI Enhancement** → Each scene enhanced with detailed prompts
4. **Element Extraction** → AI identifies characters, objects, environments
5. **Storyboard Generation** → High-quality frames with consistent visuals

### **🎬 Result Comparison**

| Feature | Normal Build | Enhanced Build |
|---------|-------------|---------------|
| **Image Quality** | Basic | **8K Ultra-Realistic** |
| **Consistency** | Variable | **Cinematic Consistency** |
| **Lighting** | Simple | **Professional Film Lighting** |
| **Perspective** | Random | **Epic Wide Cinematic** |
| **Atmosphere** | Basic | **Rich Particle Effects** |
| **Processing Time** | Fast | **Slower but Comprehensive** |

### **🚀 When to Use Enhanced Scripts**

#### **✅ Best For**
- **First-time builds** - Establish visual quality baseline
- **Professional projects** - High-quality cinematic output
- **Consistency critical** - Multiple scenes with unified style
- **Client presentations** - Impressive, professional results
// components/storyboard/BuildStoryboardDialog.tsx - Current Implementation
const BUILD_TYPES = [
  { value: "normal", label: "Normal Build", description: "Generate frames without AI extraction" },
  { value: "enhanced", label: "Enhanced Build", description: "Generate frames + AI-powered extraction" }
];

const REBUILD_STRATEGIES = [
  { value: "add_update", label: "Add/Update Scenes", description: "Keep existing content, add/update specific scenes" },
  { value: "replace_all", label: "Replace All", description: "Remove and replace all content" }
];

const ELEMENT_STRATEGIES = [
  { value: "preserve", label: "Preserve Elements", description: "Keep existing elements" },
  { value: "regenerate", label: "Regenerate Elements", description: "Re-extract all elements with AI" }
];

const SCRIPT_TYPES = [
  { value: "ANIMATED_STORIES", label: "Animated Stories", description: "General animated storytelling" },
  { value: "KIDS_ANIMATED_STORIES", label: "Kids Animated Stories", description: "Child-friendly animation content" },
  { value: "EDUCATIONAL_ANIMATIONS", label: "Educational Animations", description: "Learning-focused animations" },
  { value: "TUTORIAL_ANIMATIONS", label: "Tutorial Animations", description: "Step-by-step tutorials" },
  { value: "DOCUMENTARY_SHORTS", label: "Documentary Shorts", label: "Short documentary films" },
  { value: "EDUCATIONAL_SCIENCE_HISTORY", label: "Educational Science History", description: "Historical and scientific content" },
  { value: "FINANCE_EDUCATION", label: "Finance Education", description: "Financial concepts and tutorials" },
  { value: "AI_MUSIC_SONG_VIDEO", label: "AI Music Song Video", description: "Music video generation" },
  { value: "HEALTH_EDUCATION", label: "Health Education", description: "Medical and wellness content" },
  { value: "ADVERTISING", label: "Advertising", description: "Commercial content creation" },
  { value: "TUTORIAL_STEP_BY_STEP", label: "Tutorial Step by Step", description: "Detailed tutorials" }
];

const LANGUAGES = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "ar", label: "العربية", flag: "🇸🇦" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "ko", label: "한국어", flag: "🇰🇷" }
];

// Component state
const [activeTab, setActiveTab] = useState<DialogTab>("basic");
const [buildType, setBuildType] = useState(currentBuildType || "enhanced");
const [rebuildStrategy, setRebuildStrategy] = useState(currentRebuildStrategy || "add_update");
const [elementStrategy, setElementStrategy] = useState(currentElementStrategy || "regenerate");
const [scriptType, setScriptType] = useState("ANIMATED_STORIES");
const [language, setLanguage] = useState("en");
const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
const [isSubmitting, setIsSubmitting] = useState(false);

// Handle build function
const handleBuild = async () => {
  setIsSubmitting(true);
  try {
    const response = await fetch('/api/n8n-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: projectId,
        buildType,
        rebuildStrategy,
        scriptType,
        language,
        companyId: project?.companyId || '',
        script: project?.script || ''
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Build request failed');
    }
    
    const result = await response.json();
    
    if (result.success) {
      onSuccess?.();
      onOpenChange(false);
    } else {
      throw new Error(result.error || 'Build failed');
    }
  } catch (error) {
    console.error('Build failed:', error);
  } finally {
    setIsSubmitting(false);
  }
};

// Dialog UI structure
const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User, color: "text-purple-400" },
  { key: "prop", label: "Props", Icon: Package, color: "text-blue-400" },
  { key: "environment", label: "Environment", Icon: Trees, color: "text-emerald-400" },
  { key: "logo", label: "Logos", Icon: Shapes, color: "text-pink-400" },
  { key: "font", label: "Fonts", Icon: Type, color: "text-yellow-400" },
  { key: "style", label: "Styles", Icon: Palette, color: "text-orange-400" },
  { key: "other", label: "Other", Icon: Sparkles, color: "text-gray-300" },
] as const;

interface ElementLibraryProps {
  projectId: Id<"storyboard_projects">;
  userId: string;
  user: any; // Clerk user object
  onClose: () => void;
  onSelectElement?: (referenceUrls: string[], name: string) => void;
  initialCreateDraft?: {
    imageUrls?: string[];
    name?: string;
    type?: string;
  } | null;
  selectedItemId?: Id<"storyboard_items"> | null; // For adding elements to specific storyboard item
}

// Mutations for element management
const removeUnusedElements = useMutation(api.storyboard.storyboardItemElements.removeUnusedElements);
const addElementToItem = useMutation(api.storyboard.storyboardItemElements.addElementToItem);

// Component state
const [activeType, setActiveType] = useState(initialType);
const [showCreate, setShowCreate] = useState(Boolean(initialCreateDraft));
const [editingId, setEditingId] = useState<Id<"storyboard_elements"> | null>(null);
const [newName, setNewName] = useState(initialCreateDraft?.name ?? "");
const [referenceUrls, setReferenceUrls] = useState<string[]>(initialCreateDraft?.imageUrls ?? []);
const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
const [thumbnailIndex, setThumbnailIndex] = useState(0);
const [saving, setSaving] = useState(false);
const [uploading, setUploading] = useState(false);
const [visibility, setVisibility] = useState<"private" | "public">("private");
const [tags, setTags] = useState<string[]>([]);
const [tagInput, setTagInput] = useState("");
const [selectedTags, setSelectedTags] = useState<string[]>([]); // For filtering

// New state for tabs and description
const [activeTab, setActiveTab] = useState<"basic" | "visibility" | "details">("basic");
const [description, setDescription] = useState("");

// Component render structure
return (
  <div className="fixed inset-0 bg-black/98 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
    <div className="w-full max-w-6xl bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800/50 max-h-[95vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
            <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">Element Library</h2>
            <p className="text-xs text-neutral-400 hidden sm:block">Create and manage reusable visual elements</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
          <X className="w-3.5 h-3.5 sm:w-5 h-4 sm:h-5" />
        </button>
      </div>

      <div className="border-b border-neutral-800/50 px-3 sm:px-6 py-2 sm:py-4">
        <div className="flex gap-1 flex-wrap overflow-x-auto">
          {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              className={`flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeType === key
                  ? "bg-indigo-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Element creation/editing form */}
        {showCreate && (
          <div className="p-3 sm:p-6 border-b border-neutral-800/50">
            {/* Form fields */}
          </div>
        )}

        {/* Element list */}
        <div className="p-3 sm:p-6">
          {/* Element grid */}
        </div>
      </div>
    </div>
  </div>
);
```

### **Storyboard Item Card Implementation**
```javascript
// workspace/[projectId]/page.tsx - FrameCard Props (Current Implementation)
interface FrameCardProps {
  item: { 
    _id: string; 
    title: string; 
    description?: string; 
    imageUrl?: string; 
    videoUrl?: string; 
    duration: number; 
    generationStatus: string; 
    order: number; 
    tags?: Array<{ id: string; name: string; color: string }>; 
    isFavorite?: boolean; 
    frameStatus?: string; 
    notes?: string; 
    linkedElements?: Array<{ id: string; name: string; type: string }> 
  };
  index: number;
  frameRatio: string;
  selected: boolean;
  projectId: string;
  onSelect: () => void;
  onDelete: () => void;
  onImageUploaded: (id: string, url: string) => void;
  onDoubleClick: () => void;
  onDuplicate: () => void;
  onTagsChange: (tags: Array<{ id: string; name: string; color: string }>) => void;
  onFavoriteToggle?: () => void;
  // NEW: Safe optional props for status and notes
  onStatusChange?: (status: 'draft' | 'in-progress' | 'completed') => void;
  onNotesChange?: (notes: string) => void;
  onTitleChange?: (title: string) => void;
  onRemoveElement?: (elementId: string) => void;
  onAddElement?: () => void;
  userId: string;
  // Build dialog props
  onBuildStoryboard?: () => void;
}

// Element badge system with z-index (Current Implementation)
<div className="absolute bottom-36 left-2 right-2 flex flex-wrap gap-1.5 pointer-events-none z-10">
  <div className="flex flex-wrap gap-1.5">
    {/* Display elements from elementNames */}
    {item.elementNames && (
      <>
        {/* Characters */}
        {item.elementNames.characters?.map((elementName, index) => (
          <div
            key={`character-${index}`}
            className="group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border bg-purple-600/80 border-purple-500/30 text-white hover:bg-purple-600 transition-colors pointer-events-auto"
            title={`Character: ${elementName}`}
          >
            <span className="pr-1">{elementName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveElement(`character-${index}`);
              }}
              className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
        {/* Environments */}
        {item.elementNames.environments?.map((elementName, index) => (
          <div
            key={`environment-${index}`}
            className="group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border bg-emerald-600/80 border-emerald-500/30 text-white hover:bg-emerald-600 transition-colors pointer-events-auto"
            title={`Environment: ${elementName}`}
          >
            <span className="pr-1">{elementName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveElement(`environment-${index}`);
              }}
              className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
        {/* Props */}
        {item.elementNames.props?.map((elementName, index) => (
          <div
            key={`prop-${index}`}
            className="group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border bg-blue-600/80 border-blue-500/30 text-white hover:bg-blue-600 transition-colors pointer-events-auto"
            title={`Prop: ${elementName}`}
          >
            <span className="pr-1">{elementName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveElement(`prop-${index}`);
              }}
              className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
      </>
    )}
  </div>
</div>

// Action buttons (Current Implementation)
<div className="absolute bottom-12 right-3 flex gap-2 z-20">
  {/* Add Element button */}
  <button
    onClick={(e) => { e.stopPropagation(); onAddElement?.(); }}
    className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
    title="Add element to this scene"
  >
    <div className="w-8 h-8 bg-purple-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
      <Plus className="w-3.5 h-3.5 text-white" />
    </div>
  </button>
  
  {/* Duplicate button */}
  <button
    onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
    className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
  >
    <div className="w-8 h-8 bg-gray-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
      <Copy className="w-3.5 h-3.5 text-white" />
    </div>
  </button>
  
  {/* Delete button */}
  <button
    onClick={(e) => { e.stopPropagation(); onDelete(); }}
    className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
  >
    <div className="w-8 h-8 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
      <Trash2 className="w-3.5 h-3.5 text-white" />
    </div>
  </button>
</div>

// Tags with highest z-index (Current Implementation)
<div className="relative z-30">
  <div 
    className="flex flex-wrap gap-1 items-center cursor-pointer group"
    onClick={(e) => { 
      e.stopPropagation(); 
      setShowTagEditor(!showTagEditor);
    }}
  >
    {item.tags && item.tags.length > 0 ? (
      <>
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag.id}
            className="text-xs px-1.5 py-0.5 rounded-full font-medium transition-all duration-200 hover:scale-105"
            style={{ 
              backgroundColor: tag.color + '25', 
              color: tag.color,
              border: `1px solid ${tag.color}40`
            }}
          >
            {tag.name}
          </span>
        ))}
        {item.tags.length > 3 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
            +{item.tags.length - 3}
          </span>
        )}
      </>
    ) : (
      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition-colors">
        + Tags
      </span>
    )}
  </div>
</div>

// Enhanced Build with n8n
async function enhancedBuildWithN8N(options) {
  try {
    // Step 1: Call n8n workflow
    const extractedData = await callN8nWorkflow(options);
    
    // Step 2: Process elements
    const processedElements = await processElements(extractedData.elements);
    
    // Step 3: Save elements to Elements Card
    await saveElementsToCard(processedElements, options.projectId);
    
    // Step 4: Process scenes
    const processedScenes = await processScenes(extractedData.scenes);
    
    // Step 5: Save scenes to StoryboardItem Card
    await saveScenesToCard(processedScenes, options.projectId);
    
    // Step 6: Generate frames
    await generateFrames(processedScenes, processedElements);
    
    return { success: true, elements: processedElements, scenes: processedScenes };
    
  } catch (error) {
    console.error('Enhanced build failed:', error);
    throw error;
  }
}

// Save Elements Directly
### **Before Each Build**
1. **Verify Script Content**: Ensure script has clear scene descriptions
2. **Check n8n Status**: Confirm workflow is active
3. **Test Convex Connection**: Run `npx convex dev --once`
4. **Verify API Keys**: Check AI service credentials

### **Build Testing Checklist**
- [ ] Normal Build works
- [ ] Enhanced Build works
- [ ] Elements extract correctly
- [ ] Task status updates work
- [ ] Error handling works
- [ ] UI remains responsive

### **Advanced Testing**
- Test with different script types
- Test with large scripts (50+ scenes)
- Test error recovery scenarios
## 🚀 Future Enhancements

### **Priority 1: Performance**
- Build progress indicators (Leverage existing task system)

#### **Current Task System (Already Implemented)**
```javascript
// ✅ ALREADY EXISTS: Task-based status tracking
interface TaskStatus {
  taskStatus: "processing" | "ready" | "error" | "idle";
  taskMessage: string; // Specific message like "Generating images..."
  taskType: "image" | "video" | "script" | "ai_enhanced" | "normal";
}

// ✅ ALREADY EXISTS: Universal task status updates
await ctx.db.patch(args.storyboardId, { 
  taskStatus: "processing",
  taskMessage: "Building storyboard...",
  taskType: "script"
});
```

#### **Enhanced Progress Indicators (Recommended)**
```javascript
// LEVERAGE EXISTING TASK SYSTEM: Add progress percentage to task messages
const PROGRESS_MESSAGES = {
  "script": {
    start: "Starting build process...",
    processing: "Processing script with AI...",
    ready: "Build completed successfully!"
  },
  "image": {
    start: "Starting image generation...",
    processing: "Generating images... (1/5)",
    ready: "Images generated!"
  },
  "video": {
    start: "Starting video generation...",
    processing: "Generating video... (3/5)",
    ready: "Video generated!"
  }
};

// Update task messages with progress info
function updateTaskWithProgress(step, total, type) {
  const progress = `(${step}/${total})`;
  return `${PROGRESS_MESSAGES[type].processing.replace("...", progress)}`;
}
```

#### **UI Implementation (Recommended)**
```javascript
// components/StoryboardCard.tsx - Enhanced with progress
export function StoryboardCard({ storyboard }) {
  const getProgressInfo = (taskType, taskStatus, taskMessage) => {
    if (taskStatus === "processing" && taskMessage.includes("/")) {
      // Extract progress from message like "Generating images... (1/5)"
      const match = taskMessage.match(/\((\d+)\/(\d+)\)/);
      if (match) {
        const [_, current, total] = match;
        return { current: parseInt(current), total: parseInt(total) };
      }
    }
    return null;
  };
  
  const progressInfo = getProgressInfo(storyboard.taskType, storyboard.taskStatus, storyboard.taskMessage);
  
  return (
    <div className="relative storyboard-card border rounded-lg p-4">
      {/* Progress bar for processing tasks */}
      {storyboard.taskStatus === "processing" && progressInfo && (
        <div className="absolute top-2 left-2 right-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${(progressInfo.current / progressInfo.total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {progressInfo.current}/{progressInfo.total}
          </span>
        </div>
      )}
      
      {/* Existing status badge */}
      {storyboard.taskStatus !== "idle" && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded ${
            storyboard.taskStatus === "processing" ? "bg-blue-100 text-blue-800" :
            storyboard.taskStatus === "ready" ? "bg-green-100 text-green-800" :
            "bg-red-100 text-red-800"
          }`}>
            {storyboard.taskMessage || storyboard.taskStatus}
          </span>
        </div>
      )}
      
      {/* Card content */}
      <h3 className="font-semibold text-lg">{storyboard.title}</h3>
      <p className="text-gray-600 text-sm mt-1">{storyboard.description}</p>
    </div>
  );
}
```

### **Priority 2: User Experience**
- User experience improvements

## 📞 Support & Resources

### **Technical Support**
- **Convex Logs**: `npx convex dev --logs`
- **n8n Dashboard**: Check workflow execution history
- **Browser Console**: Check for JavaScript errors

### **Documentation**
- **n8n Workflow Guide**: Available in n8n dashboard
- **Convex Functions**: Check `convex/` directory
- **UI Components**: Check `components/storyboard/` directory

### **Quick Commands**
```bash
# Deploy Convex changes
npx convex dev --once

# Check n8n workflow status
# Visit: https://n8n.srv1010007.hstgr.cloud

# View build logs
# Check browser console + Convex logs
```

---

**🎬 Storyboard Build System - Complete Implementation Guide**
```javascript
async function buildStoryboard(options) {
  const {
    buildType,
    rebuildStrategy,
    elementStrategy,
    scriptContent,
    scriptType,
    language,
    projectId
  } = options;
      
      // 5. Save new scenes directly
      await saveScenesDirectly(ctx, args.storyboardId, n8nResult.scenes);
      
      // 6. Mark as ready
      await ctx.db.patch(args.storyboardId, { 
        status: "ready"
      });
      
      return { success: true };
      
    } catch (error) {
      // 7. Handle errors
      await ctx.db.patch(args.storyboardId, { 
        status: "error"
      });
      throw error;
    }
  }
});

async function saveElementsDirectly(ctx, storyboardId, elements) {
  // Save characters
  if (elements.characters) {
    for (const char of elements.characters) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: "character",
        name: char.name,
        description: char.description,
        confidence: char.confidence
      });
    }
  }
  
  // Save environments
  if (elements.environments) {
    for (const env of elements.environments) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: "environment",
        name: env.name,
        description: env.description,
        confidence: env.confidence
      });
    }
  }
  
  // Save props
  if (elements.props) {
    for (const prop of elements.props) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: "prop",
        name: prop.name,
        description: prop.description,
        confidence: prop.confidence
      });
    }
  }
}

async function saveScenesDirectly(ctx, storyboardId, scenes) {
  for (const scene of scenes) {
    await ctx.db.insert("scenes", {
      storyboardId,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      elements: scene.elements
    });
  }
}
```

### Universal Status for All Processes
```javascript
// Image Generation - Uses same status field
export const generateImages = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { status: "processing" });
    
    try {
      const imageResults = await callKieAI(args);
      await saveImages(ctx, args.storyboardId, imageResults);
      await ctx.db.patch(args.storyboardId, { status: "ready" });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { status: "error" });
    }
  }
});

// Video Generation - Uses same status field
export const generateVideo = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { status: "processing" });
    
    try {
      const videoResult = await callVideoService(args);
      await saveVideo(ctx, args.storyboardId, videoResult);
      await ctx.db.patch(args.storyboardId, { status: "ready" });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { status: "error" });
    }
  }
});
```

### Universal Task Status for All Processes
```javascript
// Image Generation - Uses same task fields with specific messages
export const generateImages = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { 
      taskStatus: "processing",
      taskMessage: "Generating images...",
      taskType: "image"
    });
    
    try {
      const imageResults = await callKieAI(args);
      await saveImages(ctx, args.storyboardId, imageResults);
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "ready",
        taskMessage: "Images generated"
      });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "error",
        taskMessage: "Image generation failed"
      });
    }
  }
});

// Video Generation - Uses same task fields with specific messages
export const generateVideo = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { 
      taskStatus: "processing",
      taskMessage: "Generating video...",
      taskType: "video"
    });
    
    try {
      const videoResult = await callVideoService(args);
      await saveVideo(ctx, args.storyboardId, videoResult);
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "ready",
        taskMessage: "Video generated"
      });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "error",
        taskMessage: "Video generation failed"
      });
    }
  }
});
```

### Simplified UI Implementation (Task-Based Status)
```javascript
// components/StoryboardCard.tsx
// SIMPLIFIED: One configuration object for all task status states
const TASK_STATUS_CONFIG = {
  processing: { 
    icon: Spinner, 
    color: "bg-blue-100 text-blue-800",
    textColor: "text-blue-500"
  },
  ready: { 
    icon: CheckCircle, 
    color: "bg-green-100 text-green-800",
    textColor: "text-green-500"
  },
  error: { 
    icon: AlertCircle, 
    color: "bg-red-100 text-red-800",
    textColor: "text-red-500"
  }
};

// SIMPLIFIED: One function gets all task status information
const getTaskStatusInfo = (taskStatus) => TASK_STATUS_CONFIG[taskStatus] || {};

export function StoryboardCard({ storyboard }) {
  const taskStatusInfo = getTaskStatusInfo(storyboard.taskStatus);
  const Icon = taskStatusInfo.icon;
  
  return (
    <div className="relative storyboard-card border rounded-lg p-4">
      {/* Small loading indicator - top-left corner */}
      {storyboard.taskStatus === "processing" && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-white rounded-full p-1 shadow-md">
            <Icon className={`w-4 h-4 ${taskStatusInfo.textColor}`} />
          </div>
        </div>
      )}
      
      {/* Status badge - top-right corner with specific message */}
      {storyboard.taskStatus !== "idle" && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded ${taskStatusInfo.color}`}>
            {storyboard.taskMessage || storyboard.taskStatus}
          </span>
        </div>
      )}
      
      {/* Your existing card content */}
      <h3 className="font-semibold text-lg">{storyboard.title}</h3>
      <p className="text-gray-600 text-sm mt-1">{storyboard.description}</p>
    </div>
  );
}
```
    // n8n workflow error
    showUserMessage('AI extraction service unavailable. Using normal build.');
    return await normalBuild(options);
  } else if (error.response?.status === 400) {
    // Invalid input
    showUserMessage('Invalid script format. Please check your script.');
    throw error;
  } else {
    // Network error
    showUserMessage('Connection error. Please try again.');
    throw error;
  }
}
```

### Data Validation
```javascript
function validateExtractedData(data) {
  const required = ['projectId', 'scriptType', 'language', 'elements', 'scenes'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}
```

---

##  Implementation Timeline

### Week 1: Foundation
- Set up n8n API integration
- Create service layer
- Implement basic error handling

### Week 2: Core Logic
- Replace existing build function
- Implement element processing
- Add scene processing

### Week 3: Integration
- Connect to Elements Card
- Connect to StoryboardItem Card
- Implement frame generation

### Week 4: Testing & Optimization
- Test with all script types
- Performance optimization
- Error handling refinement
- User experience improvements

---

## 🎯 Final Architecture

```
User Writes Script (pic3) → Auto-Scene Generation → Scene Selection (pic2)
                                                    ↓
User Clicks "Build storyboard" → Build Dialog (pic1) → Build Options
                                                    ↓
Enhanced Build + Script Type + Language → n8n Workflow → Structured JSON
                                                    ↓
Elements Processing → Elements Card → Frame Generation
                                                    ↓
Scenes Processing → StoryboardItem Card → Complete Build
```

---

## 🔍 Scene Auto-Generation Algorithm Analysis

### Current Algorithm (Good Approach):
```javascript
// When user saves script, system automatically:
function generateScenesFromScript(scriptContent) {
  // 1. Parse script for scene markers (# Scene 1, ## Scene 2, etc.)
  // 2. Extract scene content (duration, visual prompt, characters)
  // 3. Create scene objects with metadata
  // 4. Store scenes for user selection (pic2)
  // 5. Allow user to review/edit generated scenes
}
```

### ✅ Benefits of Current Approach:
- **Immediate feedback** - Users see scenes right away
- **User control** - Can edit/adjust scenes before build
- **Efficiency** - No waiting for AI processing during scene creation
- **Flexibility** - Manual scene editing available

### ✅ Integration with n8n:
- **Scene generation** stays local (fast, immediate)
- **Element extraction** handled by n8n (AI-powered)
- **Final processing** combines both approaches
- **Best of both worlds** - speed + AI intelligence