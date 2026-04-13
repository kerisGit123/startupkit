# Files, Storage & Generated Media

> **Owns**: R2 file storage, upload/delete mechanics, file browser UI, generated image/video lifecycle, callback completion, credit tracking
> **Status**: Implemented
> **Pricing**: See `plan_price_management.md`

---

# File Management & R2 Storage

## Overview

**Convex for metadata + Cloudflare R2 for files** — the hybrid approach that gives you searchable metadata with direct file access.

## ✅ Current Implementation Summary

- **`storyboard_files` is the canonical metadata layer** for uploaded and generated assets
- **R2 is the canonical binary/file storage layer** for finalized assets
- **Uploaded files** are written directly into R2 and immediately represented in `storyboard_files`
- **Generated images/videos** use a placeholder-first flow, then become finalized when callback processing stores the returned asset into R2 and patches the record with `sourceUrl`, `r2Key`, `size`, `taskId`, and `status`
- **File browser and generated-asset UI surfaces** both depend on the same underlying `storyboard_files` records

### **Current Flow Types**

- **Manual upload flow**: upload → R2 → metadata row available immediately
- **Generated asset flow**: placeholder row → external generation/callback → download result → upload final asset to R2 → patch metadata row
- **Delete flow**: remove R2 object and remove or update associated metadata depending on UI path and asset state

---

```
uploadToR2()  →  POST /api/storyboard/upload   →  ① R2 (stores object)
                                                →  ② storyboard_files (stores metadata row)

deleteFromR2() →  POST /api/storyboard/delete-file   →  ① R2 (deletes object)
               →  POST /api/storyboard/delete-convex →  ② storyboard_files (deletes row)
```

**Both functions are atomic pairs. Every upload writes two things. Every delete removes two things.**

---

## Pricing Integration

> See `plan_price_management.md` for AI model pricing. This doc covers file storage mechanics only.

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

The `uploadToR2()` client function auto-selects the upload strategy based on file size:

- **Small files (≤4MB)**: Uses `/api/storyboard/upload` with FormData body
- **Large files (>4MB)**: Uses `/api/storyboard/upload-binary` with raw bytes + metadata in headers (`x-filename`, `x-category`, `x-company-id`, `x-project-id`). This bypasses Turbopack's FormData parsing limit which fails for files over ~4MB.

The binary route reads `request.arrayBuffer()` instead of `request.formData()`, uploads to R2 via server-side S3 SDK, and logs the file to `storyboard_files` database.

Client-side 50MB size check in FileBrowser shows toast error for oversized files.

```typescript
// lib/uploadToR2.ts - auto-selects upload strategy
const usePresignedUrl = file && file.size > 4 * 1024 * 1024;

if (usePresignedUrl && file) {
  // Large files: raw bytes via binary upload route
  const response = await fetch('/api/storyboard/upload-binary', {
    method: 'POST',
    body: file,
    headers: {
      'Content-Type': file.type,
      'x-filename': encodeURIComponent(file.name),
      'x-category': category || 'uploads',
      'x-company-id': companyId || userId || '',
      ...(projectId ? { 'x-project-id': projectId } : {}),
    },
  });
} else {
  // Small files: FormData upload (original approach)
  const formData = new FormData();
  formData.append('file', file);
  // ... category, projectId, companyId, etc.
  await fetch('/api/storyboard/upload', { method: 'POST', body: formData });
}
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
User Request → AI Generation → Temp Storage → User Approval → Permanent Storage
```

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
- [x] **AI File Workflow**: Temp-to-permanent storage with metadata preservation

The implementation is now fully unified and uses the same core techniques across both components, with **zero external URL dependencies**.

---

# File Browser

## 🎯 Overview

File browser allows users to:
- **Browse** uploaded files in project context
- **Filter** by type, category, date
- **Preview** images and videos
- **Download** files
- **Delete** files with credit tracking
- **Search** file names and tags
- **Upload** files to company storage
- **View AI generation metadata** including model used, credits consumed, prompt context, and processing status

> **Important**: The browser primarily displays files that have already been persisted to R2. Placeholder rows that are still `processing` without an `r2Key` are tracked in `storyboard_files`, but they are not treated as fully available downloadable assets until callback processing completes.

> **Boundary**: File persistence architecture lives in `plan_file_final.md`, generated image lifecycle details live in `plan_generatedImage_final02.md`, and generated video lifecycle details live in `plan_generatedvideo_final02.md`. This file focuses on how the browser surfaces those finalized records.

---

## 🎨 Recent Updates (April 2026)

### **Current File Browser Behavior**
- **Uploaded files** are stored directly to R2 and appear immediately
- **Generated images** appear after callback processing uploads the returned asset into R2 and updates `sourceUrl`, `r2Key`, `size`, and `status`
- **Generated videos** follow the same pattern once callback handling resolves the final result URL and persists the video to R2
- **Metadata-first workflow** is used for AI assets: placeholder row first, then callback completion updates the file row
- **Project-scoped listing** is driven from `storyboard_files` and filtered by project/category

### **Enhanced File Information**
```typescript
// File metadata now includes AI generation details
interface FileMetadata {
  model?: string;
  quality?: string;
  prompt?: string;
  creditsUsed?: number;
  generatedMode?: string;
  generatedDuration?: string;
  generatedAspectRatio?: string;
  referenceCount?: number;
  fileSizeBytes?: number;
  processedAt?: string;
}
```

---

## 🏗️ Architecture

### **Data Flow**
```
Manual Upload → uploadToR2() → R2 Storage + storyboard_files row
AI Generate → placeholder storyboard_files row → KIE callback → final asset persisted to R2 → row updated with sourceUrl/r2Key/size
File Browser UI → Convex query → project/category filtering → preview / download / delete
```

### **Key Components**
- **FileBrowser.tsx** - Main browser component ✅ **IMPLEMENTED**
- **FilePreview.tsx** - File preview modal with AI metadata (built into FileBrowser)
- **FileFilters.tsx** - Filter and search controls (built into FileBrowser)
- **FileActions.tsx** - Download/delete actions (built into FileBrowser)
- **GeneratedImagesPanel / GeneratedImageCard** - Specialized generated asset surface for active shot items

---

## 📁 File Categories

### **Category Types**
```typescript
export const FILE_CATEGORIES = {
  uploads: {
    label: "Uploaded Files",
    icon: "📁",
    description: "User-uploaded images and files",
    includes: ["manual_upload", "reference_images"]
  },
  generated: {
    label: "AI Generated",
    icon: "🤖",
    description: "AI generated images and videos",
    includes: ["nano-banana-2", "gpt-image", "recraft-crisp", "topaz-upscale", "bytedance/seedance-1.5-pro", "google/veo-3.1"]
  },
  elements: {
    label: "Elements",
    icon: "🧩",
    description: "Characters, props, logos"
  },
  storyboard: {
    label: "Storyboard Assets",
    icon: "📖",
    description: "Storyboard-specific files"
  },
  videos: {
    label: "Videos",
    icon: "🎬",
    description: "Generated video content"
  }
};
```

### **File Types**
```typescript
export const FILE_TYPES = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    icon: "🖼️",
    previewable: true
  },
  video: {
    extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv'],
    icon: "🎥",
    previewable: true
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
    icon: "🎵",
    previewable: false
  },
  document: {
    extensions: ['.pdf', '.doc', '.docx', '.txt'],
    icon: "📄",
    previewable: false
  }
};
```

---

## 🔍 Filter & Search System

### **Filter Options**
```typescript
interface FileFilters {
  category: string[];          // File categories (uploads, elements, etc.)
  fileType: string[];          // Image, video, audio
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sizeRange: {
    min: number | null;
    max: number | null;
  };
  tags: string[];              // File tags
  creditsUsed: {
    hasCredits: boolean | null; // Filter by credit usage
    minCredits: number | null;
    maxCredits: number | null;
  };
  searchQuery: string;         // Text search in filename/tags
  hasR2Key: boolean | null;    // Filter by files with finalized R2 storage
}

// Query Logic - finalized browser listing prefers files with R2 storage
const useFilesQuery = (projectId: string, filters: FileFilters) => {
  return useQuery(api.storyboard.storyboardFiles.listByProject, {
    projectId,
    filters: {
      ...filters,
      hasR2Key: true,
    }
  });
};
```

## 🔧 Current Implementation Notes

### **Implemented**
1. **Project-scoped file queries** backed by `storyboard_files`
2. **R2-backed preview/download** for finalized assets
3. **Generated asset metadata** persisted through callback processing
4. **Video support** in generated file flows and preview surfaces

### **Known Constraint**
1. **Processing placeholders** without `r2Key` are not complete browser assets yet
2. **Callback completion** is required before generated files behave like normal downloadable files

## 📈 Success Metrics
- **Search performance** - Fast filtering and pagination
- **Preview quality** - Quick image/video loading
- **User experience** - Intuitive file management
- **Credit tracking** - Accurate usage display
- **Storage efficiency** - Proper cleanup integration

## 🔄 Status: Implemented
### **File Browser Status**
- **File browser** is live and backed by `storyboard_files`
- **Uploaded files** are immediately available once stored in R2
- **Generated assets** become browser-ready only after callback completion updates `r2Key`, `sourceUrl`, and `size`

### **Follow-up Notes**
- Placeholder rows with `status = processing` still matter for tracking, but they are not final downloadable records yet
- Generated-image and generated-video surfaces in the workspace remain the primary UI for in-progress AI outputs

---

# Generated Media Lifecycle

## Current Implementation Summary (April 2026)

- **`storyboard_files` is the canonical metadata layer** for generated image and video outputs
- **Callback/finalization flow is the operational model** for externally generated assets (both image and video jobs)
- **Image models** (Nano Banana 2, GPT 1.5, Flux, Ideogram, etc.) and **video models** (Seedance 1.5 Pro, Veo 3.1) share the same placeholder-first persistence direction
- **Generated outputs** are finalized by storing returned media in R2 and patching the corresponding `storyboard_files` row with task/result metadata

### Responsibility Split

- **Generation panels / SceneEditor**: collect prompt/model/quality/duration inputs and initiate generation
- **Server API routes**: validate model-specific parameters and create/forward generation requests
- **Callback/status handlers**: reconcile asynchronous provider responses, fetch result URLs, and finalize records
- **`storyboard_files` + R2**: persist metadata and finalized binary assets for later reuse

---

## Generated Media Panel Rules

### Panel Behavior
- **Source of truth**: generated media cards come from real `storyboard_files` rows
- **Project/item scoping**: generated files are filtered by project and active storyboard item/shot linkage
- **Completed rule**: completed/ready cards should only appear when a finalized asset exists (`r2Key` + usable URL)
- **Processing rule**: generating/processing cards represent placeholder rows that are not finalized yet
- **Delete behavior**: panel actions update record state rather than relying only on hard deletion semantics
- **GPT area-edit outputs** follow the same persistence direction

### UI Direction
- **Completed cards** are intentionally compact and media-focused
- **Processing cards** emphasize state/progress/debug visibility
- **Copy actions** should use the real `storyboard_files._id`
- **The generated media panel and file browser are complementary views over the same persisted records**

---

## Problem Statement

The legacy `storyboard_credit_usage` table created complex queries, data duplication, and maintenance overhead. The solution consolidates everything into `storyboard_files` with a callback-first approach.

---

## Solution: Callback-First Approach

### Core Concept
1. **Create `storyboard_files` record first** → Get `_id`
2. **Calculate credits dynamically** based on AI model and quality
3. **Send `_id` to KIE AI** as callback parameter
4. **KIE AI calls back** with `_id` + `sourceUrl`
5. **Callback downloads file to R2** and updates record with `r2Key`, permanent `sourceUrl`, `taskId`, and `status`
6. **Store AI metadata** including model, pricing, and behavior information

### Enhanced `storyboard_files` Schema

```typescript
storyboard_files: defineTable({
  // ... existing fields ...
  creditsUsed: v.optional(v.number()),

  // AI Generation Metadata
  aiMetadata: v.optional(v.object({
    modelId: v.string(),
    modelName: v.string(),
    pricingType: v.string(),          // 'fixed' | 'formula'
    quality: v.string(),              // '1K', '2K', '4K', 'medium', 'high', etc.
    creditsConsumed: v.number(),
    generationTimestamp: v.number(),
    behavior: v.object({
      cropped: v.boolean(),
      combined: v.boolean(),
      referenceImagesUsed: v.number(),
    }),
    processingTime: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  })),

  // Callback metadata
  deletedAt: v.optional(v.number()),
  sourceUrl: v.optional(v.string()),
  taskId: v.optional(v.string()),
  r2Key: v.optional(v.string()),
  categoryId: v.optional(v.union(
    v.id("storyboard_elements"),
    v.id("storyboard_items"),
    v.id("storyboard_projects"),
    v.null()
  )),
  status: v.string(), // 'generating' | 'completed' | 'failed'
})
  .index("by_project", ["projectId"])
  .index("by_category", ["projectId", "category"])
  .index("by_r2Key", ["r2Key"])
  .index("by_categoryId", ["categoryId"])
  .index("by_aiModel", ["projectId", "aiMetadata.modelId"])
```

---

## KIE AI Workflow (Implemented)

### 1. Create Placeholder Record

```typescript
const fileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
  companyId,
  userId,
  projectId,
  category: "generated",
  filename: `ai-generated-${Date.now()}`,
  fileType: "image", // or "video"
  mimeType: "image/png",
  size: 0,
  status: "generating",
  creditsUsed: 10,
  categoryId: storyboardItemId,
  sourceUrl: null,
});
```

### 2. Call KIE AI with Callback

```typescript
callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/kie-callback?fileId=${fileId}`,
```

### 3. Callback Handler

```typescript
// app/api/kie-callback/route.ts
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    if (data.code === 200 && data.data?.taskId) {
      const taskId = data.data.taskId;

      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId,
        taskId,
        status: 'processing',
      });

      // Parse resultUrl from KIE payload
      const resultJsonRaw = data.data?.resultJson;
      let resultUrl: string | undefined;

      if (typeof resultJsonRaw === 'string') {
        try {
          const parsedResultJson = JSON.parse(resultJsonRaw);
          if (Array.isArray(parsedResultJson?.resultUrls) && parsedResultJson.resultUrls.length > 0) {
            resultUrl = parsedResultJson.resultUrls[0];
          }
        } catch (parseError) {
          console.warn('[kie-callback] Failed to parse resultJson:', parseError);
        }
      }

      if (data.data?.state === 'success' && resultUrl) {
        const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, { id: fileId });
        const companyId = fileRecord?.companyId ?? fileRecord?.orgId ?? fileRecord?.userId ?? 'unknown';

        const sourceResponse = await fetch(resultUrl);
        if (!sourceResponse.ok) {
          throw new Error(`Failed to fetch generated media: ${sourceResponse.status}`);
        }

        const sourceBlob = await sourceResponse.blob();
        const mimeType = sourceBlob.type || 'image/png';
        const extension = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';

        // Nano Banana prefix for identification
        const isNanoBananaModel = fileRecord?.filename?.includes('nano-banana') || false;
        const r2Key = `${companyId}/generated/${isNanoBananaModel ? 'nano-' : ''}${taskId}.${extension}`;

        await uploadToR2(sourceBlob, r2Key);
        const permanentUrl = getR2PublicUrl(r2Key);

        await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
          fileId,
          taskId,
          sourceUrl: permanentUrl,
          r2Key,
          status: 'completed',
        });

        return NextResponse.json({ success: true, fileId, taskId, sourceUrl: permanentUrl, r2Key });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[kie-callback] Error:', error);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}
```

### 4. Convex Mutation for Callback Update

```typescript
export const updateFromCallback = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    sourceUrl: v.optional(v.string()),
    taskId: v.optional(v.string()),
    r2Key: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, { fileId, sourceUrl, taskId, r2Key, status }) => {
    const updateData: any = { status };
    if (sourceUrl) updateData.sourceUrl = sourceUrl;
    if (taskId) updateData.taskId = taskId;
    if (r2Key) updateData.r2Key = r2Key;
    await ctx.db.patch(fileId, updateData);
    return { success: true };
  },
});
```

---

## Video-Specific: Direct Generate Workflow

For video/direct generation flows that don't require cropping:

```typescript
const runDirectGenerate = async (imageUrl: string, prompt: string, model: string) => {
  try {
    const sourceImage = await processExistingImage(imageUrl); // Use as-is, no cropping
    const generatedImage = await runInpaintAPI(sourceImage, prompt, "Generate content with AI", model);

    const r2Key = `${companyId}/generated/nano-${Date.now()}.png`;
    await uploadToR2(generatedImage, r2Key);
    const permanentUrl = getR2PublicUrl(r2Key);

    setBackgroundImage(permanentUrl);
    setGeneratedImages(prev => [permanentUrl, ...prev]);
    setShowGenPanel(true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    setCloserLookError(msg);
  }
};
```

**Key characteristics**: No cropping, direct R2 storage with nano- prefix, aspect ratio provided programmatically.

---

## GPT Crop-to-Final-Asset Flow

```text
User selects crop area on canvas
        |
SceneEditor derives crop region + original image context
        |
EditImageAIPanel resolves GPT model / quality / credits
        |
Create placeholder storyboard_files record
        |
Send cropped/context image to generation route / provider
        |
Async callback or result-finalization flow completes
        |
Result is composited/finalized as needed
        |
Upload final asset to R2 and patch storyboard_files
        |
Generated image panels and file browser consume finalized record
```

---

## UI Integration

### Generated Media Panel - Project Scoped

```typescript
const projectFiles = useQuery(
  api.storyboard.storyboardFiles.listByProject,
  projectId ? { projectId } : "skip"
);

const projectGeneratedImages = useMemo(() => {
  if (!projectFiles) return [] as string[];
  return projectFiles
    .filter((file) => file.category === "generated" && file.status === "completed")
    .map((file) => file.sourceUrl)
    .filter((url): url is string => Boolean(url));
}, [projectFiles]);

const displayedGeneratedImages = useMemo(() => {
  const merged = [...projectGeneratedImages, ...generatedImages];
  return Array.from(new Set(merged.filter(Boolean)));
}, [projectGeneratedImages, generatedImages]);
```

---

## Credit Usage Tracking

### Credit Flow Architecture

```
User Clicks Generate
        |
Calculate Credits (getModelCredits)
        |
Check Company Credit Balance
        |
[Insufficient] -> Show Error & Stop
[Sufficient] -> Continue
        |
Create Placeholder Record (storyboard_files)
        |
Deduct Credits from Company Balance
        |
Call KIE AI with Callback URL
        |
KIE AI Processes -> Callback Received
        |
[Success] Update Record: completed
[Failed] Refund Credits to Company Balance
        |
UI Updates: Show Result/Error
```

### Placeholder Creation with Credit Deduction

```typescript
async function createPlaceholderRecord(params: {
  companyId: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  creditsUsed: number;
}) {
  const result = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
    creditsUsed: params.creditsUsed,
    status: "generating",
  });

  await convex.mutation(api.credits.deductCredits, {
    companyId: params.companyId,
    tokens: params.creditsUsed,
    reason: `AI Generation - ${params.categoryId || 'General'}`,
  });

  return result.fileId;
}
```

### Insufficient Credits Protection

```typescript
if (params.companyId && params.creditsUsed) {
  const currentBalance = await convex.query(api.credits.getBalance, {
    companyId: params.companyId
  });

  if (currentBalance < params.creditsUsed) {
    throw new Error(`Insufficient credits. You have ${currentBalance} credits but need ${params.creditsUsed} credits.`);
  }
}
```

### Error Handling & Credit Refunds

```typescript
if (data.data?.state === 'failed') {
  await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
    fileId,
    status: 'failed',
  });

  const file = await convex.query(api.storyboard.storyboardFiles.getById, { id: fileId });

  if (file?.creditsUsed && file?.companyId) {
    await convex.mutation(api.credits.addCredits, {
      companyId: file.companyId,
      tokens: file.creditsUsed,
      reason: `AI Generation Failed - Refund`,
    });
  }
}
```

### AI Panel Integration

- **EditImageAIPanel**: Uses `itemId` as `categoryId` for item-level credit tracking
- **ElementImageAIPanel**: Uses `elementId` as `categoryId` for element-level credit tracking

```typescript
const response = await fetch('/api/storyboard/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sceneContent: prompt,
    style: selectedStyle,
    quality: selectedQuality,
    aspectRatio: selectedRatio,
    companyId: user.companyId,
    userId: user.id,
    projectId: currentProjectId,
    itemId: currentItemId,
    categoryId: elementId,
  }),
});
```

---

## File Cleanup Strategy

```typescript
export const cleanupFilesByAge = internalMutation({
  args: {
    companyId: v.optional(v.string()),
    olderThanDays: v.number(),
    permanentDelete: v.optional(v.boolean()),
    includeActiveFiles: v.optional(v.boolean())
  },
  handler: async (ctx, { companyId, olderThanDays, permanentDelete = false, includeActiveFiles = false }) => {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    let query = ctx.db
      .query("storyboard_files")
      .filter(q => q.gt(q.field("creditsUsed"), 0));

    if (companyId) {
      query = query.filter(q => q.eq(q.field("companyId"), companyId));
    }
    query = query.filter(q => q.lt(q.field("createdAt"), cutoff));

    if (!includeActiveFiles) {
      query = query.filter(q => q.eq(q.field("deletedAt"), null));
    }

    const files = await query.collect();
    let cleanedCount = 0;
    let r2DeletedCount = 0;

    for (const file of files) {
      if (file.r2Key && file.r2Key !== "") {
        try {
          await r2.delete(file.r2Key);
          r2DeletedCount++;
        } catch (error) {
          console.error(`Failed to delete R2 file ${file.r2Key}:`, error);
        }
      }

      if (permanentDelete) {
        await ctx.db.delete(file._id);
      } else {
        await ctx.db.patch(file._id, {
          r2Key: "",
          deletedAt: Date.now(),
          status: "deleted"
        });
      }
      cleanedCount++;
    }

    return { cleanedCount, r2DeletedCount, cutoffDate: new Date(cutoff).toISOString() };
  }
});
```

---

## Implementation Status

### Phase 1: Core Integration (Complete)
- [x] Callback URL in `lib/storyboard/kieAI.ts`
- [x] `/api/kie-callback` endpoint with R2 upload
- [x] `updateFromCallback` Convex mutation
- [x] Placeholder creation in `triggerImageGeneration`
- [x] `by_project` index on `storyboard_files`
- [x] Credit deduction and balance validation
- [x] Callback URL routing and module import fixes

### Phase 2: UI Integration (Complete)
- [x] SceneEditor with project-scoped `storyboard_files`
- [x] `useQuery` for `listByProject` with completed filter
- [x] Local state merge for immediate feedback
- [x] Persistent display across page refreshes

### Phase 3: Paint Brush / Mask (Complete)
- [x] Unified coordinate system using main canvas image
- [x] Single shared mask persisting across panel switches
- [x] Tool selection conflict resolution
- [x] Show/hide mask toggle with 65% opacity

### Phase 4: Schema Migration (Optional)
- [ ] Migrate existing data from `storyboard_credit_usage`

### Phase 5: N8N Integration (Optional)
- [ ] Update N8N workflow to call callback endpoint

---

## Files Modified
- `app/api/kie-callback/route.ts` — Callback with R2 upload
- `app/api/storyboard/kie-callback/route.ts` — Callback endpoint
- `lib/storyboard/kieAI.ts` — Callback URL
- `convex/schema.ts` — `by_project` index
- `app/storyboard-studio/components/SceneEditor.tsx` — Project-scoped UI
- `middleware.ts` — Public callback routes
- `convex/storyboard/storyboardFiles.ts` — `updateFromCallback` mutation

## Environment Variables
```bash
NEXT_PUBLIC_APP_URL=https://your-app.com
KIE_AI_API_KEY=your_kie_ai_key
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=storyboardbucket
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```
