# File Browser Implementation Plan
## Storyboard Studio File Management

> **Status**: ✅ **IMPLEMENTED & INTEGRATED**  
> **Objective**: Document the current file browser behavior as a consumer of persisted uploaded and generated asset records

---

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