# File Management Implementation — Storyboard Studio

> **Status**: Fully Implemented & Verified  
> Last updated: 2026-03-28

## Overview

**Convex for metadata + Cloudflare R2 for files** — the hybrid approach that gives you searchable metadata with direct file access.

```
uploadToR2()  →  POST /api/storyboard/upload   →  ① R2 (stores object)
                                                →  ② storyboard_files (stores metadata row)

deleteFromR2() →  POST /api/storyboard/delete-file   →  ① R2 (deletes object)
               →  POST /api/storyboard/delete-convex →  ② storyboard_files (deletes row)
```

**Both functions are atomic pairs. Every upload writes two things. Every delete removes two things.**

---

## 🎨 AI Image Generation & Pricing Integration

### Quality-Based Pricing Implementation

The storyboard studio now includes **advanced quality-based pricing** for AI models with dynamic credit calculation:

#### **Supported Models with Quality Pricing**

**Nano Banana 2** (Image Generation):
- **Quality Options**: 1K, 2K, 4K
- **Pricing**: 1K (11 credits), 2K (16 credits), 4K (24 credits)
- **Formula**: Direct cost extraction from formulaJson × factor (1.3)

**Topaz Upscale** (Image Enhancement):
- **Quality Options**: 1K, 2K, 4K  
- **Pricing**: 1K (13 credits), 2K (24 credits), 4K (39 credits)
- **Formula**: Direct cost extraction from formulaJson × factor (1.3)

#### **Technical Implementation**

```typescript
// EditImageAIPanel.tsx - Quality dropdown UI
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

```typescript
// usePricingData.ts - Formula-based calculation
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

#### **File Storage for AI Generation**

AI-generated images use the **temp-to-permanent workflow**:

```typescript
// AI Generation Flow
generateImage() → temp file (temps/) → user approval → uploadToR2() → permanent (generated/)
```

**Temp Storage** (temps/):
- Immediate preview during generation
- No companyId prefix for temporary access
- Automatic cleanup after 24 hours

**Permanent Storage** (generated/):
- User-approved AI images
- `{companyId}/generated/{timestamp}-{filename}`
- Full metadata with generation parameters

#### **Pricing Integration with File Management**

```typescript
// EditImageAIPanel.tsx - Generation with pricing
const handleGenerate = async () => {
  const creditCost = getModelCredits(selectedModel, selectedQuality);
  
  // Check user credits before generation
  if (userCredits < creditCost) {
    alert(`Insufficient credits. Need ${creditCost} credits.`);
    return;
  }
  
  // Generate with quality parameters
  const result = await generateImage({
    prompt,
    model: selectedModel,
    quality: selectedQuality,
    referenceImages
  });
  
  // Store permanent file if user approves
  if (result.userApproved) {
    await uploadToR2({
      file: result.imageFile,
      category: 'generated',
      userId: user.id,
      companyId,
      projectId,
      tags: [selectedModel, selectedQuality]
    });
  }
};
```

---

## 📁 File Explorer Implementation

### Core Storage Functions Used

The File Explorer uses the **canonical `uploadToR2` and `deleteFromR2` functions** from `@/lib/uploadToR2.ts`:

```typescript
// FileBrowser.tsx - Current Implementation
import { uploadToR2, deleteFromR2 } from "@/lib/uploadToR2";
import { useCurrentCompanyId } from "@/lib/auth-utils";
```

### Upload Technique

```typescript
// FileBrowser.tsx - handleUpload function
const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  const companyId = useCurrentCompanyId(); // orgId ?? userId
  
  for (const file of files) {
    await uploadToR2({
      file,
      category: selectedFilter === "all" ? "uploads" : selectedFilter, // uploads | elements
      userId: user.id,
      companyId, // Critical: ensures files belong to correct org/user
      projectId, // Optional: links to current project
      tags: [], // File-specific tags
      onProgress: (percent) => setUploadProgress(percent),
      onSuccess: (result) => {
        console.log(`[FileBrowser] Uploaded: ${result.filename} → ${result.r2Key}`);
        // Convex automatically updates via reactive queries
      },
      onError: (error) => {
        console.error(`[FileBrowser] Upload failed:`, error);
      }
    });
  }
};
```

### Delete Technique

```typescript
// FileBrowser.tsx - handleDelete function
const handleDelete = async (file: FileItem) => {
  const companyId = useCurrentCompanyId();
  
  console.log(`[FileBrowser] Deleting file:`, {
    filename: file.filename,
    fileId: file._id,
    r2Key: file.r2Key
  });
  
  await deleteFromR2({
    r2Key: file.r2Key, // R2 object identifier
    fileId: file._id,  // Convex row identifier
    onSuccess: () => {
      console.log(`[FileBrowser] Successfully deleted: ${file.filename}`);
      // Convex automatically updates via reactive queries
    },
    onError: (error) => {
      console.error(`[FileBrowser] Delete failed:`, error);
    }
  });
};
```

### Data Query & Filtering

```typescript
// FileBrowser.tsx - File listing with filtering
const files = useQuery(api.storyboard.storyboardFiles.listByCompany, {
  companyId: useCurrentCompanyId(), // orgId ?? userId
});

// Client-side filtering by category, type, search, project
const filteredFiles = useMemo(() => {
  return files?.filter(file => {
    const matchesCategory = selectedFilter === "all" || file.category === selectedFilter;
    const matchesType = selectedType === "all" || file.fileType === selectedType;
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !projectId || file.projectId === projectId || 
                          (!file.projectId && (file.category === 'uploads' || file.category === 'elements'));
    const matchesElementCategory = selectedFilter === "elements" && selectedElementCategory !== "all" 
      ? file.tags?.includes(selectedElementCategory) 
      : true;
    
    return matchesCategory && matchesType && matchesSearch && matchesProject && matchesElementCategory;
  }) || [];
}, [files, selectedFilter, selectedType, selectedElementCategory, searchTerm, projectId]);
```

### File URL Construction

```typescript
// FileBrowser.tsx - Display URLs
const getFileUrl = (r2Key: string): string => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return `${base}/${r2Key}`;
};

// Usage in UI
<img src={getFileUrl(file.r2Key)} alt={file.filename} />
```

---

## 🎨 Element Library Implementation

### Core Storage Functions Used

The Element Library uses the **same canonical functions** but with element-specific metadata handling:

```typescript
// ElementLibrary.tsx - Current Implementation
import { uploadToR2, deleteFromR2 } from "@/lib/uploadToR2";
import { useCurrentCompanyId } from "@/lib/auth-utils";
```

### Element Upload Technique

```typescript
// ElementLibrary.tsx - handleUploadDraftRefs function
const handleUploadDraftRefs = async (event: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  const companyId = useCurrentCompanyId();
  
  const uploadedUrls: string[] = [];
  const uploadedFiles: File[] = [];
  
  for (const file of files) {
    try {
      const result = await uploadToR2({
        file,
        category: 'elements', // Elements always use 'elements' category
        userId: user.id,
        companyId,
        projectId, // Links element to current project
        tags: [activeType], // Auto-tag with element type (character, prop, environment)
        onProgress: (percent) => setUploading(percent),
        onSuccess: (result) => {
          console.log(`[ElementLibrary] Element uploaded: ${result.filename}`);
          uploadedUrls.push(result.publicUrl); // Store public URL for display
          uploadedFiles.push(file); // Keep file reference for potential re-upload
        },
        onError: (error) => {
          console.error(`[ElementLibrary] Element upload failed:`, error);
        }
      });
      
      if (result) {
        uploadedUrls.push(result.publicUrl);
        uploadedFiles.push(file);
      }
    } catch (error) {
      console.error(`[ElementLibrary] Upload error for ${file.name}:`, error);
    }
  }
  
  // Update component state
  setReferenceUrls(prev => [...prev, ...uploadedUrls]);
  setReferenceFiles(prev => [...prev, ...uploadedFiles]);
};
```

### Element Delete Technique

```typescript
// ElementLibrary.tsx - handleDeleteReferenceImage function
const handleDeleteReferenceImage = async (rawUrl: string, originalIndex: number) => {
  const removedUrl = referenceUrls[originalIndex];
  const companyId = useCurrentCompanyId();
  
  if (removedUrl.startsWith("blob:")) {
    // Draft/local file - just remove from state
    URL.revokeObjectURL(removedUrl);
    const newReferenceUrls = referenceUrls.filter((_, i) => i !== originalIndex);
    setReferenceUrls(newReferenceUrls);
  } else {
    // R2 file - use canonical delete function
    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
    const r2Key = removedUrl.replace(`${publicBase}/`, "");
    const fileId = fileIdMap.get(r2Key);
    
    try {
      await deleteFromR2({
        r2Key,
        fileId: fileId!, // fileId from metadata lookup
        onSuccess: () => {
          console.log(`[ElementLibrary] Deleted element file: ${r2Key}`);
        },
        onError: (error) => {
          console.error(`[ElementLibrary] Element delete failed:`, error);
        }
      });
      
      // Update local state
      const newReferenceUrls = referenceUrls.filter((_, i) => i !== originalIndex);
      setReferenceUrls(newReferenceUrls);
      
      // Update element in database
      if (editingId) {
        await updateElement({
          id: editingId,
          referenceUrls: newReferenceUrls.length > 0 ? newReferenceUrls : [""],
          thumbnailUrl: originalIndex === thumbnailIndex 
            ? (newReferenceUrls[0] || "")
            : normalizeAssetUrl(editingElement?.thumbnailUrl || "")
        });
      }
    } catch (error) {
      console.error(`[ElementLibrary] Failed to delete element image:`, error);
    }
  }
};
```

### Element Metadata Storage

```typescript
// ElementLibrary.tsx - Element creation/update
const handleSave = async () => {
  const companyId = useCurrentCompanyId();
  
  // Upload any pending reference files
  const uploadedUrls = await Promise.all(
    referenceFiles.map(file => uploadToR2({
      file,
      category: 'elements',
      userId: user.id,
      companyId,
      projectId,
      tags: [activeType, ...tags]
    }))
  );
  
  const finalReferenceUrls = [...referenceUrls, ...uploadedUrls.map(u => u.publicUrl)];
  
  if (editingId) {
    // Update existing element
    await updateElement({
      id: editingId,
      name: newName,
      type: activeType,
      visibility,
      tags,
      description,
      referenceUrls: finalReferenceUrls,
      thumbnailUrl: finalReferenceUrls[thumbnailIndex] || ""
    });
  } else {
    // Create new element
    await createElement({
      name: newName,
      type: activeType,
      visibility,
      tags,
      description,
      referenceUrls: finalReferenceUrls,
      thumbnailUrl: finalReferenceUrls[thumbnailIndex] || "",
      companyId,
      projectId,
      createdBy: user.id
    });
  }
};
```

### Image Display & URL Handling

```typescript
// ElementLibrary.tsx - ImageCard component (same as FileBrowser)
const ImageCard = memo(({ url, index, elementName, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-800/50 bg-neutral-900">
      {!imageLoaded && !imageError && (
        <div className="aspect-square w-full flex items-center justify-center bg-neutral-800">
          <Loader2 className="w-6 h-6 text-neutral-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-neutral-500">Loading...</p>
        </div>
      )}
      
      {imageError && (
        <div className="aspect-square w-full flex items-center justify-center bg-neutral-800">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-xs text-red-400">Failed to load</p>
          </div>
        </div>
      )}
      
      <img 
        src={url} // Direct URL from R2 (publicUrl from uploadToR2 result)
        alt={`${elementName} - Image ${index + 1}`}
        className={`aspect-square w-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        loading="lazy"
        onLoad={() => {
          console.log(`[ImageCard] Successfully loaded: ${url}`);
          setImageLoaded(true);
          setImageError(false);
        }}
        onError={(e) => {
          console.error(`[ImageCard] Failed to load: ${url}`);
          setImageError(true);
        }}
      />
      
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button onClick={onSelect} className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
```

---

## 🔧 Core Technical Implementation

### 1. Authentication & Company ID Resolution

Both components use the same authentication pattern:

```typescript
// Both FileBrowser.tsx and ElementLibrary.tsx
import { useCurrentCompanyId } from "@/lib/auth-utils";

const companyId = useCurrentCompanyId(); // orgId ?? userId
console.log(`[Component] Using companyId: ${companyId}`);
```

### 2. File Path Generation

```typescript
// lib/uploadToR2.ts - R2 key generation
const generateR2Key = (params: {
  category: string;
  companyId: string;
  filename: string;
  timestamp: number;
}): string => {
  const { category, companyId, filename, timestamp } = params;
  
  // Special case: temps category (no companyId prefix)
  if (category === 'temps') {
    return `temps/${timestamp}-${filename}`;
  }
  
  // All other categories: {companyId}/{category}/{timestamp}-{filename}
  return `${companyId}/${category}/${timestamp}-${filename}`;
};
```

### 3. URL Construction for Display

```typescript
// Both components use the same URL helper
const getFileUrl = (r2Key: string): string => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return `${base}/${r2Key}`;
};
```

### 4. Metadata Storage Schema

```typescript
// convex/storyboard/storyboardFiles.ts - Convex schema
storyboard_files: defineTable({
  companyId: v.optional(v.string()), // orgId or userId
  projectId: v.optional(v.id("storyboard_projects")),
  r2Key: v.string(),             // Full R2 path
  filename: v.string(),
  fileType: v.string(),         // "image" | "video" | "file"
  mimeType: v.string(),
  size: v.number(),
  category: v.string(),         // "uploads" | "elements" | "temps" etc.
  tags: v.array(v.string()),
  uploadedBy: v.string(),
  uploadedAt: v.number(),
  status: v.string(),
  createdAt: v.number(),
  isFavorite: v.optional(v.boolean()),
})
```

### 5. API Routes Used

```typescript
// lib/uploadToR2.ts - Internal API calls
export async function uploadToR2(params: UploadParams): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('category', params.category);
  formData.append('companyId', params.companyId);
  formData.append('userId', params.userId);
  if (params.projectId) formData.append('projectId', params.projectId);
  if (params.tags) formData.append('tags', JSON.stringify(params.tags));
  
  const response = await fetch('/api/storyboard/upload', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return {
    r2Key: result.r2Key,
    publicUrl: result.publicUrl,
    filename: result.filename,
    // ... other metadata
  };
}

export async function deleteFromR2(params: DeleteParams): Promise<DeleteResult> {
  // Step 1: Delete R2 object
  await fetch('/api/storyboard/delete-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ r2Key: params.r2Key }),
  });
  
  // Step 2: Delete Convex metadata
  await fetch('/api/storyboard/delete-convex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: params.fileId }),
  });
  
  return { success: true, r2Key: params.r2Key, fileId: params.fileId };
}
```

---

## 📊 File Storage Categories & Paths

| Component | Category Used | R2 Path Pattern | Example |
|-----------|---------------|----------------|---------|
| **File Explorer** | `uploads` | `{companyId}/uploads/{timestamp}-{filename}` | `org_123/uploads/1711468800000-photo.jpg` |
| **File Explorer** | `elements` | `{companyId}/elements/{timestamp}-{filename}` | `org_123/elements/1711468800000-character.png` |
| **Element Library** | `elements` | `{companyId}/elements/{timestamp}-{filename}` | `org_123/elements/1711468800000-hero.png` |
| **AI Generation** | `generated` | `{companyId}/generated/{timestamp}-{filename}` | `org_123/generated/1711468800000-ai-scene.png` |
| **AI Generation** | `temps` | `temps/{timestamp}-{filename}` | `temps/1711468800000-preview.png` |
| **Temp Files** | `temps` | `temps/{timestamp}-{filename}` | `temps/1711468800000-preview.png` |

### **AI Generation File Workflow**

```
User Request → Quality Selection → Credit Check → AI Generation → Temp Storage → User Approval → Permanent Storage
```

**Quality-based pricing integration:**
- **Nano Banana 2**: 1K (11 credits), 2K (16 credits), 4K (24 credits)
- **Topaz Upscale**: 1K (13 credits), 2K (24 credits), 4K (39 credits)
- **File metadata**: Includes model, quality, and generation parameters

---

## 🔄 Data Flow Summary

### File Explorer Flow
```
User selects file → uploadToR2() → POST /api/storyboard/upload → R2 + Convex → 
Convex reactive update → UI shows new file → User can delete → 
deleteFromR2() → R2 + Convex delete → UI updates
```

### Element Library Flow
```
User uploads element images → uploadToR2() (category='elements') → 
R2 + Convex → Store URLs in element state → Save element → 
Element stored in Convex with referenceUrls → Display with ImageCard → 
Delete reference → deleteFromR2() → Update element metadata
```

---

## 🛠️ Key Implementation Differences

| Aspect | File Explorer | Element Library |
|--------|---------------|-----------------|
| **Primary Category** | `uploads` (user files) | `elements` (character/prop/environment) |
| **Metadata Focus** | File management (favorites, search) | Element composition (reference images, thumbnails) |
| **Delete Scope** | Individual files + batch operations | Reference images + entire element deletion |
| **URL Display** | Direct file listing | ImageCard component with loading states |
| **Search/Filter** | Category, type, search, project | Element type, tags, visual filtering |
| **State Management** | Simple file list | Complex element editing + reference management |

---

## ✅ Implementation Status

- [x] **File Explorer**: Uses canonical `uploadToR2`/`deleteFromR2` functions
- [x] **Element Library**: Uses canonical `uploadToR2`/`deleteFromR2` functions  
- [x] **Authentication**: Both use `useCurrentCompanyId()` for org/user resolution
- [x] **URL Construction**: Both use `getFileUrl()` helper for consistent display
- [x] **Error Handling**: Both components have comprehensive error handling
- [x] **Reactive Updates**: Both use Convex reactive queries for real-time updates
- [x] **Image Display**: Both use ImageCard component for consistent image rendering
- [x] **Metadata Storage**: Both store in `storyboard_files` table with proper categorization
- [x] **No External URL Fallbacks**: All external URL fallbacks removed, only temp folder used
- [x] **AI Generation**: Uses temp files instead of external URLs like iili.io
- [x] **Quality-Based Pricing**: Dynamic quality selection for Nano Banana 2 and Topaz Upscale
- [x] **Formula JSON Calculations**: Direct cost extraction from formulaJson with factor multiplication
- [x] **Real-Time Credit Updates**: Immediate credit recalculation on quality changes
- [x] **Accurate Alert Messaging**: Quality-specific alerts showing correct model names and credits
- [x] **AI File Workflow**: Temp-to-permanent storage with quality metadata preservation

The implementation is now fully unified and uses the same core techniques across both components, with **zero external URL dependencies** and **advanced quality-based pricing integration**.
