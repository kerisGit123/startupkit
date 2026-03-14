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

## Implementation Details

### 1. Frame-Element Relationship Table

#### New Convex Schema
```typescript
// convex/schema.ts
frameElements: defineTable({
  frameId: v.id("storyboard_items"),
  elementId: v.id("storyboard_elements"),
  assignedAt: v.number(),
  assignedBy: v.string(),
})
  .index("frameId")
  .index("elementId"),
```

#### Enhanced Frame Interface
```typescript
interface Frame {
  _id: Id<"storyboard_items">;
  // ... existing fields
  
  // Frame-specific elements (computed from frameElements table)
  assignedElements: Array<{
    elementId: Id<"storyboard_elements">;
    elementType: 'character' | 'object' | 'logo' | 'font' | 'style';
    elementName: string;
    thumbnailUrl: string;
    referenceUrls: string[];
  }>;
}
```

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