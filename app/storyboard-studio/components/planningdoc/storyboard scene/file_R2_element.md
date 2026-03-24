# R2 & Element Library Integration

Simple integration for ElementAIPanel to add image references from R2 storage and element library.

---

## 🎯 **Objective**

Enable users to click buttons in ElementAIPanel to open R2 file explorer and element library, then add selected images as references for AI generation.

---

## 📋 **Types**

```typescript
interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
}

interface ReferenceImage {
  id: string;
  url: string;
  source: 'r2' | 'element';
  name?: string;
  metadata?: ReferenceImageMetadata;
}
```

---

## 🔧 **Handler**

```typescript
const handleImageSelect = (
  source: 'r2' | 'element',
  data: { 
    url: string; 
    name?: string; 
    metadata?: Partial<ReferenceImageMetadata>;
  }
) => {
  try {
    if (!data.url?.trim()) {
      throw new Error('URL required');
    }

    const referenceImage: ReferenceImage = {
      id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: data.url.trim(),
      source,
      name: data.name || `${source} image`,
      metadata: {
        companyId: userCompanyId,
        addedAt: Date.now(),
        ...data.metadata,
      }
    };

    // Add to ElementAIPanel reference images
    onAddReferenceImage?.(referenceImage);
    
    // Close appropriate modal
    if (source === 'r2') setShowFileBrowser(false);
    else if (source === 'element') setShowElementLibrary(false);
    
  } catch (error) {
    console.error(`[handleImageSelect]`, error);
    toast.error(error instanceof Error ? error.message : 'Failed to add image');
  }
};
```

---

## 🗂️ **Component Integration**

### **R2 File Browser Integration**

The R2 File Browser allows users to browse and select images from Cloudflare R2 storage. When opened from ElementAIPanel:

```typescript
{showFileBrowser && projectId && (
  <FileBrowser
    projectId={projectId}
    onClose={() => setShowFileBrowser(false)}
    onSelectFile={(url, type, file) => 
      type === 'image' && handleImageSelect('r2', { 
        url,
        name: file.name,
        metadata: { 
          fileId: file._id,
          r2Key: file.r2Key 
        }
      })
    }
    filterTypes={['image']} // Only show images
    multiSelect={false} // Single selection for ElementAIPanel
  />
)}
```

**Key Features:**
- **Image filtering** - Only shows image files
- **Company security** - Automatic companyId filtering
- **Metadata tracking** - Stores file ID and R2 key
- **Single selection** - One image at a time for references

---

### **Element Library Integration**

The Element Library allows users to browse and select from their character/prop/logo library. When opened from ElementAIPanel:

```typescript
{showElementLibrary && projectId && userId && (
  <ElementLibrary
    projectId={projectId}
    userId={userId}
    user={user}
    onClose={() => setShowElementLibrary(false)}
    onSelectElement={(urls, name, element) => 
      urls.forEach(url => handleImageSelect('element', { 
        url, 
        name,
        metadata: { 
          elementId: element._id,
          type: element.type 
        }
      }))
    }
    imageSelectionMode={true} // Enable specific image selection
    onSelectImage={(url, elementName, element) => 
      handleImageSelect('element', { 
        url, 
        name: elementName,
        metadata: { 
          elementId: element._id,
          type: element.type 
        }
      })
    }
  />
)}
```

**Key Features:**
- **Image selection mode** - When opened from ElementAIPanel
- **Multi-image support** - Elements with multiple reference images
- **Element metadata** - Track element ID and type
- **Batch selection** - Can add all images from an element

---

## 🎨 **UI Integration Examples**

### **Reference Section in ElementAIPanel**
```typescript
// Add buttons to existing reference images section
<div className="flex gap-3 overflow-x-auto pb-2">
  <AddReferenceButton onClick={() => setShowFileBrowser(true)} />
  <AddElementButton onClick={() => setShowElementLibrary(true)} />
  
  {referenceImages.map(ref => (
    <ReferenceThumbnail
      key={ref.id}
      image={ref.url}
      label={ref.name}
      source={ref.source}
      onClick={() => insertMention(ref)}
      onRemove={() => removeReference(ref.id)}
    />
  ))}
</div>
```

### **@Mention System Enhancement**
```typescript
// Enhanced @mention with source indicators
const insertMention = (reference: ReferenceImage) => {
  const mentionText = reference.source === 'element' 
    ? `@${reference.name}` 
    : `@${reference.source}${reference.id.slice(-4)}`;
  
  // Insert into ContentEditable prompt editor
  insertBadgeAtCaret(mentionText, reference.url, reference.source);
};
```

### **Reference Badge Components**
```typescript
// ReferenceThumbnail component
const ReferenceThumbnail = ({ image, label, source, onClick, onRemove }) => (
  <div className="relative group">
    <img 
      src={image} 
      alt={label}
      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
      onClick={onClick}
    />
    <div className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1">
      {source === 'element' ? 'EL' : 'R2'}
    </div>
    <button
      onClick={onRemove}
      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100"
    >
      ×
    </button>
  </div>
);
```

---

## ✅ **Validation**

```typescript
const canOpenFileBrowser = () => !!(projectId && userCompanyId);
const canOpenElementLibrary = () => !!(projectId && userId && user && userCompanyId);
```

---

## ✅ **Integration Status**

| Component | Status | Notes |
|-----------|--------|-------|
| **R2 File Browser** | ✅ Complete | Component exists, integration ready |
| **Element Library** | ✅ Complete | Component exists, integration ready |
| **Reference Handler** | ✅ Complete | Unified handler for both sources |
| **@Mention System** | ✅ Complete | Enhanced with source indicators |
| **Company Security** | ✅ Complete | Automatic companyId filtering |

---

## 🚀 **Implementation**

### **1. Add Buttons to ElementAIPanel**
- Add "Browse Files" button → opens R2 FileBrowser
- Add "Browse Elements" button → opens ElementLibrary

### **2. Reference Image Management**
- Horizontal scroll display with drag-and-drop
- Visual badges with source indicators (R2/Element)
- @mention integration for prompt references

### **3. Modal Management**
- Automatic modal closing after image selection
- Error handling for invalid URLs
- Toast notifications for user feedback

---

## 🎯 **Key Benefits**

- **Simple**: Focused only on R2 and Element Library
- **Complete**: All components exist and ready for integration
- **Secure**: Company-based filtering automatically applied
- **User-Friendly**: Intuitive drag-and-drop and @mention system
- **Modern**: Consistent with ElementAIPanel design

This integration provides a complete, production-ready solution for adding image references from R2 storage and element library to the ElementAIPanel.

---

# Element Library Image Selection Enhancement

## 🎯 **Objective**

Enable users to select specific images from elements that contain multiple images **only when the Element Library is opened from ElementAIPanel**. The existing Element Library functionality must remain completely unchanged for all other use cases.

---

## 📋 **Current Behavior Analysis**

### **Current Element Library Structure**

```typescript
interface ElementLibraryProps {
  projectId: Id<"storyboard_projects">;
  userId: string;
  user: ClerkUser; // Proper typing
  onClose: () => void;
  onSelectElement?: (referenceUrls: string[], name: string) => void;
  initialCreateDraft?: {
    imageUrls?: string[];
    name?: string;
    type?: string;
  } | null;
  selectedItemId?: Id<"storyboard_items"> | null;
}
```

### **Current Selection Behavior**

```typescript
// ElementLibrary.tsx - Current onClick behavior
onClick={() => onSelectElement?.(element.referenceUrls ?? [element.thumbnailUrl], element.name)}
```

- **Current**: Adds ALL images from `referenceUrls` array
- **Need**: Allow specific image selection **only** when opened from ElementAIPanel
- **Constraint**: Must NOT disrupt existing Element Library functionality

---

## 🔄 **Enhanced Workflow**

### **New User Flow (ElementAIPanel only)**

1. **User clicks Elements button** in ElementAIPanel
2. **Element Library opens** with `imageSelectionMode="enabled"` flag
3. **User clicks element with multiple images** → Opens image selection view
4. **User hovers over images** → Add (+) button appears on each image
5. **User clicks Add on specific image** → Image added to ElementAIPanel references
6. **Modal closes** and selected image appears in ElementAIPanel

### **Existing Behavior (All other cases)**

- **Element Library opened from workspace**: Works exactly as before
- **Element Library opened from other contexts**: Works exactly as before
- **No disruption to existing functionality**: Zero changes to current behavior

---

## 🛠️ **Modern Implementation Plan**

### **Step 1: Simplified State Management with useReducer**

```typescript
// Modern state management with useReducer
interface ImageSelectionState {
  mode: 'disabled' | 'enabled' | 'selecting';
  selectedElement: Element | null;
}

type ImageSelectionAction = 
  | { type: 'ENABLE_MODE' }
  | { type: 'DISABLE_MODE' }
  | { type: 'START_SELECTION'; element: Element }
  | { type: 'END_SELECTION' };

const imageSelectionReducer = (
  state: ImageSelectionState, 
  action: ImageSelectionAction
): ImageSelectionState => {
  switch (action.type) {
    case 'ENABLE_MODE':
      return { ...state, mode: 'enabled' };
    case 'DISABLE_MODE':
      return { mode: 'disabled', selectedElement: null };
    case 'START_SELECTION':
      return { mode: 'selecting', selectedElement: action.element };
    case 'END_SELECTION':
      return { mode: 'enabled', selectedElement: null };
    default:
      return state;
  }
};

// Usage in component
const [imageSelectionState, dispatch] = useReducer(imageSelectionReducer, {
  mode: 'disabled',
  selectedElement: null
});
```

### **Step 2: Enhanced ElementLibrary Interface**

```typescript
interface ElementLibraryProps {
  // ... existing props (unchanged)
  imageSelectionMode?: boolean; // Simple boolean flag
  onSelectImage?: (imageUrl: string, elementName: string, element: Element) => void;
}

// Enhanced types
interface Element {
  _id: Id<"storyboard_elements">;
  name: string;
  thumbnailUrl?: string;
  referenceUrls?: string[];
  type: string;
  visibility?: "private" | "public";
  tags?: string[];
  description?: string;
}

interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
  source: 'element-library-image' | 'element-library-element' | 'r2-file' | 'upload';
  imageIndex?: number;
  elementType?: string;
  elementName?: string;
  selectedAt?: number;
}
```

### **Step 3: Optimized Element Grid with Memoization**

```typescript
// Memoized click handler to prevent unnecessary re-renders
const handleElementClick = useCallback((element: Element) => {
  if (imageSelectionMode && element.referenceUrls?.length > 1) {
    dispatch({ type: 'START_SELECTION', element });
  } else {
    onSelectElement?.(element.referenceUrls ?? [element.thumbnailUrl], element.name);
  }
}, [imageSelectionMode, onSelectElement]);

// Memoized multi-image badge
const MultiImageBadge = useMemo(() => {
  if (!imageSelectionMode || !element.referenceUrls?.length) return null;
  
  return (
    <div className="absolute top-2 left-2 z-10">
      <span className="text-xs bg-purple-500/80 text-white rounded px-2 py-1 font-medium backdrop-blur-sm">
        {element.referenceUrls.length} images
      </span>
    </div>
  );
}, [imageSelectionMode, element.referenceUrls?.length]);

// Simplified JSX
<div onClick={() => handleElementClick(element)} className="block w-full text-left cursor-pointer">
  {MultiImageBadge}
  {/* ... rest of element card */}
</div>
```

### **Step 4: Modern Image Selection Modal**

```typescript
// Custom hook for image selection logic
const useImageSelection = (element: Element | null, onSelectImage?: Function) => {
  const handleImageSelect = useCallback((url: string, index: number) => {
    if (!element || !onSelectImage) return;
    
    try {
      onSelectImage(url, `${element.name} - Image ${index + 1}`, element);
      dispatch({ type: 'END_SELECTION' });
      onClose();
    } catch (error) {
      console.error('Error selecting image:', error);
      // Show toast notification
    }
  }, [element, onSelectImage, onClose]);

  return { handleImageSelect };
};

// Image selection component
const ImageSelectionGrid = ({ element }: { element: Element }) => {
  const { handleImageSelect } = useImageSelection(element, onSelectImage);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {element.referenceUrls?.map((url, index) => (
        <ImageCard
          key={`${element._id}-${index}`}
          url={url}
          index={index}
          elementName={element.name}
          onSelect={() => handleImageSelect(url, index)}
        />
      ))}
    </div>
  );
};

// Optimized image card component
const ImageCard = React.memo(({ 
  url, 
  index, 
  elementName, 
  onSelect 
}: {
  url: string;
  index: number;
  elementName: string;
  onSelect: () => void;
}) => (
  <div className="group relative overflow-hidden rounded-lg border border-neutral-800/50 bg-neutral-900">
    <img 
      src={url} 
      alt={`${elementName} - Image ${index + 1}`} 
      className="aspect-square w-full object-cover" 
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
    
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <button
        onClick={onSelect}
        className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600 transition-colors"
        title="Add this image to references"
        aria-label={`Add image ${index + 1} to references`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
    
    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-1">
      {index + 1}
    </div>
  </div>
));
```

### **Step 5: Optimized ElementAIPanel Integration**

```typescript
// Memoized callback to prevent re-renders
const handleImageSelect = useCallback((imageUrl: string, elementName: string, element: Element) => {
  handleImageSelect('element', {
    url: imageUrl,
    name: elementName,
    metadata: {
      source: 'element-library-image',
      selectedAt: Date.now(),
      elementId: element._id,
      elementType: element.type,
      elementName: element.name
    }
  });
}, [handleImageSelect]);

// Memoized element selection callback
const handleElementSelect = useCallback((referenceUrls: string[], name: string, element: Element) => {
  if (referenceUrls?.length > 0) {
    referenceUrls.forEach(url => handleImageSelect('element', { 
      url, 
      name,
      metadata: { 
        source: 'element-library-element',
        elementId: element._id,
        elementType: element.type,
        elementName: element.name,
        selectedAt: Date.now()
      }
    }));
  }
}, [handleImageSelect]);

// Simplified ElementLibrary props
<ElementLibrary
  projectId={projectId}
  userId={userId}
  user={user}
  onClose={() => setShowElementLibrary(false)}
  imageSelectionMode={true} // Simple boolean
  onSelectImage={handleImageSelect}
  onSelectElement={handleElementSelect}
/>
```

---

## 🎨 **Modern UI/UX Enhancements**

### **Performance Optimizations**

- **React.memo**: Prevent unnecessary re-renders of image cards
- **useCallback**: Memoize event handlers
- **useMemo**: Cache expensive computations
- **Lazy loading**: Load images only when visible
- **Virtualization**: For large element libraries (future enhancement)

### **Accessibility Improvements**

- **ARIA labels**: Proper labels for all interactive elements
- **Keyboard navigation**: Support for Tab and Enter keys
- **Screen reader support**: Descriptive alt text and announcements
- **Focus management**: Proper focus trapping in modals

### **Error Handling**

```typescript
// Error boundary for image selection
const ImageSelectionErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={<div className="p-4 text-red-400">Failed to load image selection</div>}
    onError={(error) => console.error('Image selection error:', error)}
  >
    {children}
  </ErrorBoundary>
);

// Toast notifications for user feedback
const useImageSelectionToast = () => {
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    // Implement toast notification
    toast[type](message);
  }, []);
  
  return { showToast };
};

// AI Generation Jobs Table
      onTouchEnd={() => setTimeout(() => setShowActions(false), 3000)}
    >
      <img src={result.url} className="w-full h-full object-cover" />
      
      {/* Mobile: Always show actions on touch */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent 
        transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
          <button className="flex-1 py-1 bg-blue-500 text-white text-xs rounded">
            💾
          </button>
          <button className="flex-1 py-1 bg-emerald-500 text-white text-xs rounded">
            📁
          </button>
          <button className="flex-1 py-1 bg-gray-600 text-white text-xs rounded">
            🔍
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📝 Prompt Template Management

### Template System Architecture
```typescript
// Simplified template model
const templateSystem = {
  // Store reusable prompts as a simple saved library
  // No category picker in the prompt library UI
  // Search, usage count, public/private sharing, and quick apply only
  // New prompts default to a single reusable template type behind the scenes
};
```

### Simplified Template Model
- Store reusable prompts as a simple saved library
- No category picker in the prompt library UI
- Search, usage count, public/private sharing, and quick apply only
- New prompts default to a single reusable template type behind the scenes

### Template Data Structure
```typescript
// Prompt Templates Table
storyboard_promptTemplates: defineTable({
  name: v.string(),
  prompt: v.string(),
  companyId: v.string(),
  isPublic: v.boolean(),
  tags: v.optional(v.array(v.string())),
  isFavourite: v.optional(v.boolean()),
  createdAt: v.number(),
}).index("by_company", ["companyId"])
  .index("public_templates", ["isPublic"])
  .index("favourite_templates", ["isFavourite"]),
```

### Template Selector Component
```typescript
const PromptLibraryTrigger = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400"
    >
      Open Prompt Library
    </button>
  );
};
```

### Prompt Library Modal
```typescript
const PromptLibraryModal = ({ isOpen, onClose, templates }) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl overflow-y-auto border-l border-white/10 bg-[#141414]">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">Prompt Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {templates.map(template => (
            <div key={template.id} className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="font-medium text-white">{template.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                {template.prompt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Template Integration Flow
1. **User writes prompt** and can optionally open prompt library
2. **User selects a saved prompt** to replace or seed the prompt field
3. **User can save a new reusable prompt** from the same dark modal flow
4. **Company-based templates** remain supported with public/private sharing
5. **Simple integration**: no category selection, no category validation, no extra complexity

---

## Database Schema

### AI Generation Jobs Table
```typescript
// convex/schema.ts
storyboard_ai_generation_jobs: defineTable({
  companyId: v.string(),
  projectId: v.string(),
  type: v.union(v.literal("image"), v.literal("video")),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  prompt: v.string(),
  referenceImageUrls: v.optional(v.array(v.string())),
  aspectRatio: v.optional(v.string()),
  resolution: v.optional(v.string()),
  outputFormat: v.optional(v.string()),
  resultUrls: v.optional(v.array(v.string())),
  creditsUsed: v.number(),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
}).index("by_company", ["companyId"])
  .index("by_project", ["projectId"])
  .index("by_status", ["status"]),
```

---

## ⚙️ Convex Mutations Implementation

### AI Generation Jobs Mutations
```typescript
// convex/storyboard/imageGeneration.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "../auth";

export const create = mutation({
  args: {
    companyId: v.string(),
    projectId: v.string(),
    type: v.union(v.literal("image"), v.literal("video")),
    prompt: v.string(),
    referenceImageUrls: v.optional(v.array(v.string())),
    aspectRatio: v.optional(v.string()),
    resolution: v.optional(v.string()),
    outputFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const jobId = await ctx.db.insert("storyboard_ai_generation_jobs", {
      ...args,
      status: "pending",
      creditsUsed: 1, // Simplified credit system to basic deduction only
      createdAt: Date.now(),
    });

    return jobId;
  },
});

export const update = mutation({
  args: {
    jobId: v.id("storyboard_ai_generation_jobs"),
    status: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed"))),
    resultUrls: v.optional(v.array(v.string())),
    errorMessage: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const { jobId, ...updateData } = args;
    
    await ctx.db.patch(jobId, updateData);
    return jobId;
  },
});

export const get = query({
  args: { jobId: v.id("storyboard_ai_generation_jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const listByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("storyboard_ai_generation_jobs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    return jobs;
  },
});

export const listByCompany = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("storyboard_ai_generation_jobs")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    return jobs;
  },
});
```

### Prompt Templates Mutations
```typescript
// convex/promptTemplates.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
    prompt: v.string(),
    companyId: v.string(),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
    isFavourite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const templateId = await ctx.db.insert("storyboard_promptTemplates", {
      ...args,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_promptTemplates"),
    name: v.optional(v.string()),
    prompt: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    isFavourite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const { id, ...updateData } = args;
    
    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_promptTemplates") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const get = query({
  args: { id: v.id("storyboard_promptTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCompany = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("storyboard_promptTemplates")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    return templates;
  },
});

export const getPublicTemplates = query({
  args: {},
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("storyboard_promptTemplates")
      .withIndex("public_templates", (q) => q.eq("isPublic", true))
      .collect();
    
    return templates;
  },
});

export const toggleFavourite = mutation({
  args: {
    id: v.id("storyboard_promptTemplates"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserId(ctx);
    if (!identity) throw new Error("Unauthorized");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");
    
    await ctx.db.patch(args.id, {
      isFavourite: !template.isFavourite
    });
    
    return args.id;
  },
});

export const getFavourites = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyboard_promptTemplates")
      .withIndex("favourite_templates", (q) => 
        q.eq("isFavourite", true).eq("companyId", args.companyId)
      )
      .collect();
  },
});
```

---

## 🧩 Core Components

### PromptLibrary Component
```typescript
// components/storyboard/Pro# Element Library & AI Generation Integration

## 🎯 **Objective**
Enable users to add image references from R2 storage and element library to AI generation in ElementAIPanel.

---

## 📋 **Types**
```typescript
interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
}

interface ReferenceImage {
  id: string;
  url: string;
  source: 'r2' | 'element';
  name?: string;
  metadata?: ReferenceImageMetadata;
}
```

---

## 🔧 **Handler**
```typescript
const handleImageSelect = (
  source: 'r2' | 'element',
  data: { url: string; name?: string; metadata?: Partial<ReferenceImageMetadata> }
) => {
  try {
    if (!data.url?.trim()) throw new Error('URL required');
    
    const referenceImage: ReferenceImage = {
      id: crypto.randomUUID(),
      url: data.url,
      source,
      name: data.name,
      metadata: {
        companyId: userCompanyId,
        addedAt: Date.now(),
        ...data.metadata
      }
    };
    
    onAddReferenceImage?.(referenceImage);
    
    // Close appropriate modal
    if (source === 'r2') setShowFileBrowser(false);
    else if (source === 'element') setShowElementLibrary(false);
    
  } catch (error) {
    console.error('Image selection failed:', error);
  }
};
```

---

## 🎨 **UI Integration**

### **R2 File Browser**
```typescript
{showFileBrowser && projectId && (
  <FileBrowser
    projectId={projectId}
    onClose={() => setShowFileBrowser(false)}
    onSelectFile={(url, type, file) => 
      type === 'image' && handleImageSelect('r2', { 
        url,
        name: file.name,
        metadata: { fileId: file._id, r2Key: file.r2Key }
      })
    }
  />
)}
```

### **Element Library**
```typescript
{showElementLibrary && projectId && userId && (
  <ElementLibrary
    projectId={projectId}
    userId={userId}
    user={user}
    onClose={() => setShowElementLibrary(false)}
    onSelectElement={(referenceUrls, name, element) => 
      handleImageSelect('element', { 
        url: referenceUrls[0], 
        name,
        metadata: { elementId: element._id }
      })
    }
    imageSelectionMode={true}
    onSelectImage={(url, elementName, element) => 
      handleImageSelect('element', { 
        url, 
        name: elementName,
        metadata: { elementId: element._id }
      })
    }
  />
)}
```

### **Reference Images Section**
```typescript
<div className="flex gap-3 overflow-x-auto pb-2">
  <AddReferenceButton onClick={() => setShowFileBrowser(true)} />
  <AddElementButton onClick={() => setShowElementLibrary(true)} />
  
  {referenceImages.map(ref => (
    <ReferenceImageBadge
      key={ref.id}
      image={ref}
      onRemove={() => onRemoveReferenceImage?.(ref.id)}
    />
  ))}
</div>
```

---

## ✅ **Validation**
```typescript
const canOpenFileBrowser = () => !!(projectId && userCompanyId);
const canOpenElementLibrary = () => !!(projectId && userId && user && userCompanyId);
```

---

## 📊 **Status**
| Component | Status | Notes |
|-----------|--------|-------|
| **R2 File Browser** | ✅ Complete | Component exists, integration ready |
| **Element Library** | ✅ Complete | Component exists, integration ready |
| **Reference Handler** | ✅ Complete | Unified handler for both sources |
| **@Mention System** | ✅ Complete | Enhanced with source indicators |
| **Company Security** | ✅ Complete | Automatic companyId filtering |

---

## 🚀 **Implementation Steps**

### **1. Add Buttons to ElementAIPanel**
- Add "Browse Files" button → opens R2 FileBrowser
- Add "Browse Elements" button → opens ElementLibrary

### **2. Reference Image Management**
- Unified handler for both R2 and Element sources
- Automatic modal closing after selection
- Error handling for invalid URLs

### **3. @Mention System Enhancement**
- Add source indicators (@R2, @EL, @IMG)
- Company-based filtering for security
- Reference image badges with remove functionality

---

## 🎯 **Key Benefits**
- **Simple**: Focused only on R2 and Element Library
- **Complete**: All components exist and ready for integration
- **Secure**: Company-based filtering automatically applied
- **User-Friendly**: Intuitive drag-and-drop and @mention system
- **Modern**: Consistent with ElementAIPanel design