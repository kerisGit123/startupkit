# Element Generator Enhancement (LTX-Style Asset Management System)

## Overview
Enhance the existing Element Generator (currently called Asset Generator) to support full LTX-style element management with 6 element types: character, object, logo, font, style, other. This system enables users to create, manage, and use reusable elements as visual references for consistent AI generation across frames.

## Current State Analysis
Based on the existing ElementLibrary component and LTX reference images:

### What Exists:
- **ElementLibrary Component**: Basic element creation/management
- **Convex Backend**: `storyboard_elements` table with proper schema
- **R2 Upload Integration**: Image upload to Cloudflare R2
- **3 Element Types**: character, object, logo (limited)
- **Basic CRUD Operations**: Create, list, update, remove elements

### What's Missing:
- **3 Missing Element Types**: font, style, other (shown in LTX pics)
- **Element Type Selection UI**: LTX-style type selector (pic5)
- **Advanced Element Creation**: Multiple reference URLs, better upload flow
- **Frame-Element Assignment**: No relationship system yet
- **@Mention System**: No element references in dialogue/description
- **Visual Reference Integration**: No AI generation integration
- **Element Usage Tracking**: Limited usage analytics

## Target State (LTX-Style Enhancement)
- **6 Element Types**: character, object, logo, font, style, other (matching LTX)
- **Enhanced Creation Flow**: Multiple uploads, type-specific creation
- **Frame Assignment System**: Assign elements to frames as references
- **@Mention Integration**: Type "@" to reference elements in dialogue
- **Visual Reference Generation**: Use elements for consistent AI generation
- **Usage Analytics**: Track element usage across frames

---

## Features

### 1. Element Reference System
- **@Mention Integration**: Type "@" in dialogue/description to add elements as references
- **Visual Reference Display**: Selected elements show as photo references during AI generation
- **Consistent Generation**: Elements ensure consistent characters/props across frames
- **Direct Tag Integration**: Elements can be tagged directly in generation prompts

### 2. Frame-Element Assignment
- **Element Picker Modal**: Select/deselect elements for individual frames
- **Visual Indicators**: Show assigned elements on framecards with small icons
- **Bulk Assignment**: Assign elements to multiple frames efficiently
- **Element Filtering**: Filter frames by assigned elements

### 3. Element Management
- **Reuse ElementLibrary**: Leverage existing ElementLibrary component
- **Element Types**: Characters, Props, Logos, Fonts, Styles
- **Reference Images**: Multiple reference URLs per element
- **Usage Tracking**: Track element usage across frames

---

## Element Architecture (LTX-Style System)

### **Understanding the LTX Architecture:**

Based on the LTX reference video and your question, here's how the element system should work:

#### **1. Two-Level Element System:**

**Storyboard-Level Elements** (Global Reference Library):
- **Already Exists**: `storyboard_elements` table 
- **Purpose**: Reference image library for easy access
- **Usage**: Only used during AI generation (video/image)
- **Not Active**: Elements are just stored references, not actively used
- **Convenience**: Easy to find and reuse reference images
- **Reusable across the entire storyboard project**
- **Created once, used multiple times across frames**
- **Like a "master library" for the storyboard**

**Frame-Level Elements** (Frame-Specific Assignment):
- **Already Exists**: `elements` array in `storyboard_items` table 
- **Purpose**: Elements actively used for that specific frame's generation
- **Usage**: Only the assigned elements are used during that frame's AI generation
- **Active**: These are the actual references sent to the AI
- **Frame-Specific**: Each frame can have different active references
- **Elements appear as visual elements on frame cards**

#### **2. LTX Workflow:**
1. **Create Elements**: Add characters/props to storyboard library (global)
2. **Assign to Frames**: Add elements to specific frame's `elements` array (frame-specific)
3. **Visual References**: Elements show as references during AI generation
4. **Consistency**: Same character appears consistently across assigned frames

#### **3. Existing Convex Schema Analysis:**

** Already Exists (No Changes Needed):**
```typescript
// storyboard_elements table (Global Reference Library)
storyboard_elements: defineTable({
  projectId: v.id("storyboard_projects"),
  name: v.string(),
  type: v.string(), // character | object | logo | font | style | other
  description: v.optional(v.string()),
  thumbnailUrl: v.string(),
  referenceUrls: v.array(v.string()),
  tags: v.array(v.string()),
  createdBy: v.string(),
  usageCount: v.number(),
  status: v.string(), // draft | ready | archived
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_type", ["projectId", "type"]),

// storyboard_items table (Frames with elements array)
storyboard_items: defineTable({
  // ... existing fields
  elements: v.array(v.object({
    id: v.string(),
    type: v.string(),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    size: v.object({ width: v.number(), height: v.number() }),
  })),
  // ... existing fields
})

// storyboard_projects table (Already exists)
storyboard_projects: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  orgId: v.string(),
  // ... other fields
})

// storyboard_files table (Already exists)
storyboard_files: defineTable({
  orgId: v.optional(v.string()),
  userId: v.optional(v.string()),
  projectId: v.optional(v.id("storyboard_projects")),
  r2Key: v.string(),
  filename: v.string(),
  fileType: v.string(),   // image | video | audio
  mimeType: v.string(),
  size: v.number(),
  category: v.string(),   // uploads | generated | elements | storyboard | videos
  tags: v.array(v.string()),
  uploadedBy: v.string(),
  uploadedAt: v.number(),
  status: v.string(),     // uploading | ready | error
  createdAt: v.number(),
  isFavorite: v.optional(v.boolean()),
})
```

#### **4. NO NEW TABLES NEEDED!**

Your existing schema already supports the LTX-style element system:

- **`storyboard_elements`**: Global reference library (already exists)
- **`storyboard_items.elements`**: Frame-specific elements (already exists)
- **`storyboard_files`**: File storage for element images (already exists)

**Just need to enhance the existing `elements` array structure to reference storyboard_elements!**

### 2. @Mention System

#### MentionableTextarea Component
```typescript
function MentionableTextarea({ value, onChange, availableElements }: {
  value: string;
  onChange: (value: string) => void;
  availableElements: Array<{ id: string; name: string; type: string; thumbnailUrl: string }>;
}) {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      e.preventDefault();
      const textBeforeCursor = value.substring(0, cursorPosition);
      const textAfterCursor = value.substring(cursorPosition);
      
      // Insert @ and show mention menu
      const newValue = textBeforeCursor + '@' + textAfterCursor;
      onChange(newValue);
      setCursorPosition(cursorPosition + 1);
      setShowMentionMenu(true);
      setMentionQuery('');
    }
  };
  
  const handleMentionSelect = (element: any) => {
    const textBeforeAt = value.substring(0, cursorPosition - 1);
    const textAfterCursor = value.substring(cursorPosition);
    const mention = `@${element.name}`;
    
    const newValue = textBeforeAt + mention + textAfterCursor;
    onChange(newValue);
    setCursorPosition(textBeforeAt.length + mention.length);
    setShowMentionMenu(false);
  };
  
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursorPosition(e.target.selectionStart)}
        placeholder="Type @ to add elements as references..."
        className="w-full h-24 bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60 resize-none"
      />
      
      {/* Mention Dropdown */}
      {showMentionMenu && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[#1c1c26] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          <div className="p-2">
            {availableElements
              .filter(el => el.name.toLowerCase().includes(mentionQuery.toLowerCase()))
              .map((element) => (
                <button
                  key={element.id}
                  onClick={() => handleMentionSelect(element)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition hover:bg-white/5 text-gray-300 hover:text-white"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                    <img src={element.thumbnailUrl} alt={element.name} className="w-full h-full object-cover" />
                  </div>
                  <span>{element.name}</span>
                  <span className="text-xs text-gray-500 ml-auto capitalize">{element.type}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Frame Element Picker

#### Element Picker Component
```typescript
function FrameElementPicker({ projectId, currentElements, onElementsChange, onClose }: {
  projectId: Id<"storyboard_projects">;
  currentElements: Array<{ elementId: Id<"storyboard_elements">; elementType: string; elementName: string; thumbnailUrl: string }>;
  onElementsChange: (elements: Array<{ elementId: Id<"storyboard_elements">; elementType: string; elementName: string; thumbnailUrl: string }>) => void;
  onClose: () => void;
}) {
  const [activeType, setActiveType] = useState("character");
  
  // Use existing ElementLibrary queries
  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    type: activeType,
  });
  
  const handleToggleElement = (element: any) => {
    const isAssigned = currentElements.some(el => el.elementId === element._id);
    
    if (isAssigned) {
      // Remove element
      onElementsChange(currentElements.filter(el => el.elementId !== element._id));
    } else {
      // Add element
      onElementsChange([...currentElements, {
        elementId: element._id,
        elementType: element.type,
        elementName: element.name,
        thumbnailUrl: element.thumbnailUrl
      }]);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8 shrink-0">
          <h2 className="text-sm font-bold text-white">Assign Elements</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/8 rounded-lg transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Type tabs */}
        <div className="flex gap-1 p-3 border-b border-white/6 shrink-0">
          {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
            <button key={key}
              onClick={() => setActiveType(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                activeType === key ? "bg-white/12 text-white" : "text-gray-400 hover:text-white hover:bg-white/6"
              }`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
            </button>
          ))}
        </div>
        
        {/* Elements grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!elements ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : elements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <User className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No {activeType}s available</p>
              <p className="text-xs text-gray-600 mt-0.5">Create elements in the Element Library first</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {elements.map((el) => {
                const isAssigned = currentElements.some(assigned => assigned.elementId === el._id);
                return (
                  <button
                    key={el._id}
                    onClick={() => handleToggleElement(el)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                      isAssigned 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/8 hover:border-white/20 bg-[#12121a]'
                    }`}
                  >
                    <img src={el.thumbnailUrl} alt={el.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-1">
                      <p className="text-[9px] text-white font-medium truncate">{el.name}</p>
                    </div>
                    {isAssigned && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/8 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {currentElements.length} element{currentElements.length !== 1 ? 's' : ''} assigned
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs text-white rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. Backend Functions

#### Convex Mutations
```typescript
// convex/storyboard/storyboardItems.ts

export const assignElement = mutation({
  args: {
    frameId: v.id("storyboard_items"),
    elementId: v.id("storyboard_elements"),
  },
  handler: async (ctx, args) => {
    const { frameId, elementId } = args;
    
    await ctx.db.insert("frameElements", {
      frameId,
      elementId,
      assignedAt: Date.now(),
      assignedBy: ctx.auth.userId || 'unknown',
    });
    
    return { frameId, elementId };
  },
});

export const removeElement = mutation({
  args: {
    frameId: v.id("storyboard_items"),
    elementId: v.id("storyboard_elements"),
  },
  handler: async (ctx, args) => {
    const { frameId, elementId } = args;
    
    const existing = await ctx.db
      .query("frameElements")
      .withIndex("frameId")
      .eq("frameId", frameId)
      .eq("elementId", elementId)
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    
    return { frameId, elementId };
  },
});

export const getFrameElements = query({
  args: {
    frameId: v.id("storyboard_items"),
  },
  handler: async (ctx, args) => {
    const { frameId } = args;
    
    const relationships = await ctx.db
      .query("frameElements")
      .withIndex("frameId")
      .eq("frameId", frameId)
      .collect();
    
    const elements = await Promise.all(
      relationships.map(async (rel) => {
        const element = await ctx.db.get(rel.elementId);
        return element ? {
          elementId: element._id,
          elementType: element.type,
          elementName: element.name,
          thumbnailUrl: element.thumbnailUrl,
          referenceUrls: element.referenceUrls,
        } : null;
      })
    );
    
    return elements.filter(Boolean);
  },
});

// Add missing imports
import { Type, Palette, MoreHorizontal, Edit2 } from "lucide-react";

// Update ELEMENT_TYPES constant
const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User,     color: "text-purple-400" },
  { key: "object",    label: "Props",       Icon: Package, color: "text-blue-400"   },
  { key: "logo",      label: "Logos",       Icon: ImageIcon,color: "text-emerald-400"},
  { key: "font",      label: "Fonts",       Icon: Type,    color: "text-orange-400" },
  { key: "style",     label: "Styles",      Icon: Palette, color: "text-pink-400"   },
  { key: "other",     label: "Other",       Icon: MoreHorizontal, color: "text-gray-400" },
];

// Enhanced creation form with multiple uploads
const [referenceUrls, setReferenceUrls] = useState<string[]>([]);

const handleMultipleUploads = async (files: FileList) => {
  const uploadPromises = Array.from(files).map(file => uploadToR2(file));
  const urls = await Promise.all(uploadPromises);
  setReferenceUrls(prev => [...prev, ...urls]);
};

// File: convex/schema.ts
// Current schema already supports all needed fields
// Just ensure validation allows the new types

// File: convex/schema.ts
frameElements: defineTable({
  frameId: v.id("storyboard_items"),
  elementId: v.id("storyboard_elements"),
  assignedAt: v.number(),
  assignedBy: v.string(),
})
  .index("by_frame", ["frameId"])
  .index("by_element", ["elementId"]);

// File: convex/storyboard/frameElements.ts
export const assignElement = mutation({
  args: { frameId: v.id("storyboard_items"), elementId: v.id("storyboard_elements") },
  handler: async (ctx, args) => {
    // Implementation for assigning elements to frames
  },
});

export const getFrameElements = query({
  args: { frameId: v.id("storyboard_items") },
  handler: async (ctx, args) => {
    // Implementation for getting frame elements
  },
});
```

---

## Immediate Improvements Needed (Based on LTX Images)

### 1. **Expand Element Types** (pic5 reference)
**Current**: 3 types (character, object, logo)  
**Target**: 6 types (character, object, logo, font, style, other)

#### Update ElementLibrary Component
```typescript
// Replace existing ELEMENT_TYPES array
const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User,     color: "text-purple-400" },
  { key: "object",    label: "Props",       Icon: Package, color: "text-blue-400"   },
  { key: "logo",      label: "Logos",       Icon: ImageIcon,color: "text-emerald-400"},
  { key: "font",      label: "Fonts",       Icon: Type,    color: "text-orange-400" },
  { key: "style",     label: "Styles",      Icon: Palette, color: "text-pink-400"   },
  { key: "other",     label: "Other",       Icon: MoreHorizontal, color: "text-gray-400" },
];
```

#### Add Missing Icons
```typescript
import { Plus, X, User, Package, Image as ImageIcon, Trash2, Loader2, Type, Palette, MoreHorizontal, Edit2 } from "lucide-react";
```

### 2. **Enhanced Element Creation Flow** (pic4, pic6 reference)
**Current**: Single URL upload, basic form  
**Target**: Multiple uploads, type-specific creation

#### Enhanced Creation Modal
```typescript
// Enhanced creation form with multiple uploads
function ElementCreationForm({ type, onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [referenceUrls, setReferenceUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleMultipleUploads = async (files) => {
    // Upload multiple files to R2
    const uploadPromises = files.map(file => uploadToR2(file));
    const urls = await Promise.all(uploadPromises);
    setReferenceUrls(prev => [...prev, ...urls]);
  };

  return (
    <div className="space-y-4">
      {/* Type-specific creation fields */}
      {type === 'font' && (
        <div>
          <label className="text-xs text-gray-400">Font Family</label>
          <input type="text" placeholder="e.g., Inter, Roboto" />
        </div>
      )}
      
      {type === 'style' && (
        <div>
          <label className="text-xs text-gray-400">Style Description</label>
          <textarea placeholder="e.g., Anime style, Watercolor, Cyberpunk" />
        </div>
      )}
      
      {/* Multiple reference image uploads */}
      <div className="border-2 border-dashed border-white/20 rounded-lg p-4">
        <input 
          type="file" 
          multiple 
          accept="image/*"
          onChange={(e) => handleMultipleUploads(Array.from(e.target.files))}
        />
        <p className="text-xs text-gray-500 mt-2">Upload multiple reference images</p>
      </div>
    </div>
  );
}
```

### 3. **Improved Element Display** (pic4 reference)
**Current**: Basic grid layout  
**Target**: Enhanced cards with usage stats, better thumbnails

#### Enhanced Element Cards
```typescript
function ElementCard({ element, onSelect, onEdit, onDelete }) {
  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden border-2 border-white/10 hover:border-purple-500/50 transition-all bg-[#12121a]">
      {/* Thumbnail */}
      <img 
        src={element.thumbnailUrl} 
        alt={element.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
      
      {/* Overlay with info */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
        <p className="text-[10px] text-white font-medium truncate">{element.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px] text-gray-400 capitalize">{element.type}</span>
          <span className="text-[8px] text-purple-400">{element.usageCount} uses</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={() => onEdit(element)} className="p-1 bg-white/10 rounded hover:bg-white/20">
          <Edit2 className="w-3 h-3 text-white" />
        </button>
        <button onClick={() => onDelete(element._id)} className="p-1 bg-red-500/20 rounded hover:bg-red-500/30">
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
}
```

### 4. **Element Type Selection UI** (pic5 reference)
**Current**: Simple tabs  
**Target**: LTX-style type selector with icons and descriptions

#### Enhanced Type Selector
```typescript
function ElementTypeSelector({ selectedType, onTypeChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
        <button
          key={key}
          onClick={() => onTypeChange(key)}
          className={`p-3 rounded-xl border-2 transition-all ${
            selectedType === key 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-white/10 hover:border-white/20 bg-white/5'
          }`}
        >
          <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
          <p className="text-xs text-white font-medium">{label}</p>
        </button>
      ))}
    </div>
  );
}
```

---

## Implementation Phases (Updated)

### Phase 1: Element Types Expansion (Week 1)
- ✅ Add 3 missing element types (font, style, other)
- ✅ Update ELEMENT_TYPES array with new icons
- ✅ Add missing Lucide icons imports
- ✅ Test element creation with all 6 types

### Phase 2: Enhanced Creation Flow (Week 1-2)
- ✅ Multiple file upload support
- ✅ Type-specific creation fields
- ✅ Enhanced creation modal UI
- ✅ Better reference URL management

### Phase 3: Improved UI/UX (Week 2)
- ✅ Enhanced element cards with usage stats
- ✅ Better hover states and transitions
- ✅ LTX-style type selector
- ✅ Improved grid layout and responsive design

### Phase 4: Frame Assignment System (Week 2-3)
- ✅ Frame-element relationship table
- ✅ Element picker for frames
- ✅ Visual indicators on framecards
- ✅ Element filtering in frame view

### Phase 5: @Mention Integration (Week 3)
- ✅ MentionableTextarea component
- ✅ Element reference extraction
- ✅ Integration with dialogue/description fields
- ✅ Auto-assignment on @mention

### Phase 6: AI Generation Integration (Week 3-4)
- ✅ Element reference extraction for generation
- ✅ Visual reference display during generation
- ✅ Consistent element generation
- ✅ Generation quality improvements

---

## Technical Implementation Plan

### 1. Update ElementLibrary Component
```typescript
// File: app/storyboard-studio/components/storyboard/ElementLibrary.tsx

// Add missing imports
import { Type, Palette, MoreHorizontal, Edit2 } from "lucide-react";

// Update ELEMENT_TYPES constant
const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User,     color: "text-purple-400" },
  { key: "object",    label: "Props",       Icon: Package, color: "text-blue-400"   },
  { key: "logo",      label: "Logos",       Icon: ImageIcon,color: "text-emerald-400"},
  { key: "font",      label: "Fonts",       Icon: Type,    color: "text-orange-400" },
  { key: "style",     label: "Styles",      Icon: Palette, color: "text-pink-400"   },
  { key: "other",     label: "Other",       Icon: MoreHorizontal, color: "text-gray-400" },
];

// Enhanced creation form with multiple uploads
const [referenceUrls, setReferenceUrls] = useState<string[]>([]);

const handleMultipleUploads = async (files: FileList) => {
  const uploadPromises = Array.from(files).map(file => uploadToR2(file));
  const urls = await Promise.all(uploadPromises);
  setReferenceUrls(prev => [...prev, ...urls]);
};
```

### 2. Update Convex Schema (if needed)
```typescript
// File: convex/schema.ts
// Current schema already supports all needed fields
// Just ensure validation allows the new types
```

### 3. Add Frame-Element Relationship Table
```typescript
// File: convex/schema.ts
frameElements: defineTable({
  frameId: v.id("storyboard_items"),
  elementId: v.id("storyboard_elements"),
  assignedAt: v.number(),
  assignedBy: v.string(),
})
  .index("by_frame", ["frameId"])
  .index("by_element", ["elementId"]),
```

### 4. Add Backend Functions
```typescript
// File: convex/storyboard/frameElements.ts
export const assignElement = mutation({
  args: { frameId: v.id("storyboard_items"), elementId: v.id("storyboard_elements") },
  handler: async (ctx, args) => {
    // Implementation for assigning elements to frames
  },
});

export const getFrameElements = query({
  args: { frameId: v.id("storyboard_items") },
  handler: async (ctx, args) => {
    // Implementation for getting frame elements
  },
});
```

---

## Success Metrics

### 1. Element Creation Metrics
- Element creation rate by type
- Multiple upload usage frequency
- Reference image count per element

### 2. Element Usage Metrics
- Element assignment frequency
- Frame-element relationship count
- Element reuse across frames

### 3. User Experience Metrics
- Element picker usage
- @mention system adoption
- Generation consistency improvements

---

## Conclusion

This enhancement transforms the basic Element Generator into a comprehensive LTX-style element management system. By expanding element types, improving the creation flow, and adding frame assignment capabilities, users will have powerful tools for maintaining consistency across their storyboard frames while enjoying an intuitive, feature-rich interface.