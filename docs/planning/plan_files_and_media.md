# Files, Storage & Generated Media

> **Owns**: R2 file storage, upload/delete mechanics, file browser UI, generated image/video/audio lifecycle, callback completion, credit tracking
> **Status**: Implemented
> **Pricing**: See `plan_price_management.md`

---

# File Management & R2 Storage

## Overview

**Convex for metadata + Cloudflare R2 for files** — the hybrid approach that gives you searchable metadata with direct file access.

## Current Implementation Summary

- **`storyboard_files` is the canonical metadata layer** for uploaded and generated assets
- **R2 is the canonical binary storage layer** for finalized assets
- **Uploaded files** are written directly into R2 and immediately represented in `storyboard_files`
- **Generated images/videos/audio** use a placeholder-first flow, then become finalized when the callback handler stores the returned asset into R2 and patches the record with `sourceUrl`, `r2Key`, `size`, `taskId`, and `status`
- **All user deletes are soft deletes** — the record is zeroed (`r2Key=""`, `sourceUrl=""`) and marked `status="deleted"` with `deletedAt` timestamp. Hard deletion is admin-only via `batchHardDelete`
- **File browser and generated-asset UI surfaces** both read from the same `storyboard_files` records

### Current Flow Types

- **Manual upload flow**: upload → R2 → metadata row available immediately
- **Generated asset flow**: placeholder row → external generation/callback → download result → upload final asset to R2 → patch metadata row
- **Delete flow**: soft delete (zero R2 fields, mark deleted) — R2 object is removed but Convex row is preserved for audit

---

```
uploadToR2()  →  POST /api/storyboard/upload (≤4MB FormData)
                 POST /api/storyboard/upload-binary (>4MB raw bytes)
                   ↓ both paths
                 ① R2 (stores object)
                 ② storyboard_files (stores metadata row)

deleteFromR2() →  POST /api/storyboard/delete-file   →  ① R2 (deletes object)
               →  POST /api/storyboard/delete-convex →  ② storyboard_files (soft delete row)
```

**Upload auto-selects route by size. Delete is always two-step. All deletes are soft.**

---

## Pricing Integration

> See `plan_price_management.md` for AI model pricing. This doc covers file storage mechanics only.

---

## File Explorer Implementation

### Core Storage Functions

Both File Explorer and Element Library use the canonical functions from `lib/uploadToR2.ts`:

```typescript
import { uploadToR2, deleteFromR2 } from "@/lib/uploadToR2";
import { useCurrentCompanyId } from "@/lib/auth-utils";
```

### Upload Strategy (Size-Based Auto-Selection)

```typescript
// lib/uploadToR2.ts
const usePresignedUrl = file && file.size > 4 * 1024 * 1024;

if (usePresignedUrl && file) {
  // Large files: raw bytes via binary upload route
  await fetch('/api/storyboard/upload-binary', {
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
  // Small files: FormData upload
  const formData = new FormData();
  formData.append('file', file);
  // ... category, projectId, companyId, tags
  await fetch('/api/storyboard/upload', { method: 'POST', body: formData });
}
```

- Small files (≤4MB): `/api/storyboard/upload` with FormData
- Large files (>4MB): `/api/storyboard/upload-binary` with raw bytes + metadata in headers — bypasses Turbopack's FormData parsing limit
- Both routes log to `storyboard_files`; the binary route supports `x-skip-log=true` to skip Convex logging

### Delete Flow (Soft Delete)

```typescript
await deleteFromR2({
  r2Key: file.r2Key,
  fileId: file._id,
  onSuccess: () => { /* Convex reactive query auto-updates UI */ },
});
```

Step 1 (`/api/storyboard/delete-file`) removes the R2 object. Step 2 (`/api/storyboard/delete-convex`) calls the `remove` mutation which zeros `r2Key`/`sourceUrl` and sets `status="deleted"`.

### Data Query & Filtering

```typescript
const files = useQuery(api.storyboard.storyboardFiles.listByCompany, {
  companyId: useCurrentCompanyId(), // orgId ?? userId
});

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

---

## File Storage Categories & Paths

| Category | R2 Path Pattern | TTL | Used By |
| -------- | --------------- | --- | ------- |
| `uploads` | `{companyId}/uploads/{ts}-{filename}` | permanent | File Explorer (user uploads) |
| `elements` | `{companyId}/elements/{ts}-{filename}` | permanent | Element Library |
| `generated` | `{companyId}/generated/{ts}-{filename}` | permanent | AI image/video generation |
| `storyboard` | `{companyId}/storyboard/{ts}-{filename}` | permanent | Storyboard-specific assets |
| `videos` | `{companyId}/videos/{ts}-{filename}` | permanent | Finalized video exports |
| `temps` | `temps/{ts}-{filename}` | 30 days | Previews, working files |

`temps` is the only category with no `companyId` prefix — it's a flat shared folder with a 30-day TTL. The upload route supports `useTemp=true` for this.

---

## Core Technical Implementation

### Authentication & Company ID

```typescript
const companyId = useCurrentCompanyId(); // orgId ?? userId
```

### File Path Generation (R2 Key)

```typescript
// Special case: temps category uses no companyId prefix
if (category === 'temps') return `temps/${timestamp}-${filename}`;
return `${companyId}/${category}/${timestamp}-${filename}`;
```

### URL Construction

```typescript
const getFileUrl = (r2Key: string) =>
  `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""}/${r2Key}`;
```

### `storyboard_files` Schema (Actual)

```typescript
storyboard_files: defineTable({
  // Ownership
  companyId: v.optional(v.string()),
  orgId: v.optional(v.string()),
  userId: v.optional(v.string()),
  projectId: v.optional(v.id("storyboard_projects")),

  // File identity
  r2Key: v.optional(v.string()),
  filename: v.string(),
  fileType: v.string(),     // "image" | "video" | "audio" (was "music" — migrated)
  mimeType: v.string(),
  size: v.number(),
  category: v.string(),     // "uploads" | "generated" | "elements" | "storyboard" | "videos" | "temps"
  tags: v.array(v.string()),
  uploadedBy: v.string(),
  uploadedAt: v.number(),
  status: v.string(),       // "uploading" | "ready" | "generating" | "completed" | "failed" | "deleted"
  createdAt: v.number(),
  isFavorite: v.optional(v.boolean()),

  // AI generation
  creditsUsed: v.optional(v.number()),
  taskId: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  categoryId: v.optional(v.union(
    v.id("storyboard_elements"),
    v.id("storyboard_items"),
    v.id("storyboard_projects"),
    v.null()
  )),
  defaultAI: v.optional(v.id("storyboard_kie_ai")),
  model: v.optional(v.string()),
  prompt: v.optional(v.string()),
  aspectRatio: v.optional(v.string()),   // "16:9" | "9:16" | "1:1" | "4:3"
  responseCode: v.optional(v.number()),  // KIE response code (200, 402, 422, 429, 500, 501…)
  responseMessage: v.optional(v.string()),
  metadata: v.optional(v.any()),         // shouldComposite, crop coords, audioId, musicTitle, musicDuration

  // Soft delete
  deletedAt: v.optional(v.number()),

  // Community gallery
  isShared: v.optional(v.boolean()),
  sharedAt: v.optional(v.number()),
  sharedBy: v.optional(v.string()),
})
  .index("by_project", ["projectId"])
  .index("by_category", ["projectId", "category"])
  .index("by_r2Key", ["r2Key"])
  .index("by_categoryId", ["categoryId"])
```

---

# File Browser

## File Browser Overview

The File Browser surfaces finalized `storyboard_files` records in a project-scoped browseable UI.

Users can: browse, filter by type/category/date, preview images/videos, download, delete, search by filename/tag, upload, and view AI generation metadata (model, credits, prompt, status).

> Processing placeholder rows (`status="generating"` with no `r2Key`) are tracked but not treated as downloadable assets until callback completion patches `r2Key` + `sourceUrl`.

---

## Architecture

```
Manual Upload → uploadToR2() → R2 + storyboard_files row (status=ready)
AI Generate  → placeholder row (status=generating) → KIE callback → R2 → row updated (status=completed)
File Browser → Convex listByProject query → filter/preview/download/delete
```

### Key Components

- `components/FileBrowser.tsx` — main browser (filter, search, preview, download, delete)
- `GeneratedImagesPanel` / `GeneratedImageCard` — specialized surface for in-progress AI outputs in the workspace

---

## File Categories (Browser)

```typescript
const FILE_CATEGORIES = {
  uploads:    { label: "Uploaded Files",    includes: ["manual_upload"] },
  generated:  { label: "AI Generated",      includes: ["images", "videos", "audio"] },
  elements:   { label: "Elements",          includes: ["characters", "props", "environments"] },
  storyboard: { label: "Storyboard Assets" },
  videos:     { label: "Videos" },
};
// temps files are not surfaced in the main browser (working files only)
```

---

## Filter System

```typescript
interface FileFilters {
  category: string[];
  fileType: string[];
  dateRange: { from: Date | null; to: Date | null };
  sizeRange: { min: number | null; max: number | null };
  tags: string[];
  searchQuery: string;
  hasR2Key: boolean | null; // browser prefers finalized files only
}
```

---

# Generated Media Lifecycle

## Summary

- `storyboard_files` is the single metadata store for all generated outputs (images, videos, audio)
- All generation uses a **placeholder-first** flow: create record → deduct credits → call KIE → callback finalizes
- **Image models**: Nano Banana 2, GPT 1.5, Flux, Ideogram, Recraft, and others
- **Video models**: Seedance 1.5 Pro, Veo 3.1
- **Audio models**: Suno (returns 2 variations per request)

---

## Responsibility Split

| Layer | Responsibility |
| ----- | -------------- |
| Generation panels / SceneEditor | Collect prompt/model/quality/duration, initiate request |
| Server API routes | Validate params, create placeholder record, forward to KIE |
| `kie-callback` handler | Reconcile async responses, fetch result, persist to R2, patch record |
| `storyboard_files` + R2 | Canonical metadata + binary storage |

---

## KIE AI Callback Flow

### Step 1 — Create Placeholder

```typescript
const fileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
  companyId, userId, projectId,
  category: "generated",
  filename: `ai-generated-${Date.now()}`,
  fileType: "image",          // or "video" | "audio"
  mimeType: "image/png",
  size: 0,
  status: "generating",
  creditsUsed: creditsToDeduct,
  categoryId: storyboardItemId,
  model: modelId,
  prompt: promptText,
});
```

### Step 2 — Call KIE with Callback URL

```typescript
callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/kie-callback?fileId=${fileId}`
```

### Step 3 — Callback Handler (`app/api/kie-callback/route.ts`)

The callback handler has grown to cover several content types and edge cases:

**File type resolution order:**

1. `isMusic` — fileType field is 'audio'/'music', OR model name contains 'suno'
2. `isAudio` — MIME type or URL contains audio signatures
3. `isVideo` — URL or MIME contains video signatures
4. Else: image

**Veo 3.1 fallback**: If callback arrives with a taskId but no resultUrl, the handler directly queries the Veo API (`/api/v1/veo/record-info?taskId=...`) to fetch the final URL.

**Suno multi-track**: Suno returns 2 audio variations per request. The callback saves both tracks as separate `storyboard_files` records (the second at zero additional credits).

Suno response formats handled:
```
Format 1: { code: 200, data: { callbackType: "complete", data: [{ id, audio_url }] } }
Format 2: { data: { response: { sunoData: [{ id, audioUrl }] } } }
Format 3: { data: { sunoData: [...] } }
Format 4: bare array of HTTP URLs
```

**Image compositing**: If `metadata.shouldComposite === true`, the callback composites the generated image into the crop region of the original (`cropX`, `cropY`, `cropWidth`, `cropHeight` from metadata).

**Auto-sharing**: Free personal-plan users' generated files with prompts are automatically shared to the community gallery (`isShared=true`).

**Element auto-append**: If `category === 'elements'`, the generated image URL is appended to the linked element's `referenceUrls`.

**Response code tracking**: All KIE responses are stored in `responseCode` + `responseMessage` for debugging. Codes: 200 (success), 402 (insufficient credits), 422 (Veo still processing), 429 (rate limited), 501 (generation failed), 505 (feature disabled).

**Credit refund on failure**: If `responseCode !== 200` and `creditsUsed > 0`, credits are automatically refunded.

### Step 4 — Final Record State

```typescript
await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
  fileId,
  taskId,
  sourceUrl: permanentR2Url,
  r2Key,
  status: 'completed',
  size: fileSizeBytes,
  fileType,           // may correct original fileType based on URL
  responseCode: 200,
  isShared,
  sharedAt,
  sharedBy,
  aspectRatio,
});
```

---

## Credit Flow

```
User clicks Generate
  → getModelCredits() calculates cost
  → Check balance; reject if insufficient
  → Create placeholder (status=generating)
  → Deduct credits
  → Call KIE AI
  → Callback arrives
      [success] → persist to R2, patch status=completed
      [failure] → patch status=failed, refund creditsUsed
```

### Insufficient Credits Check

```typescript
const currentBalance = await convex.query(api.credits.getBalance, { companyId });
if (currentBalance < creditsUsed) {
  throw new Error(`Insufficient credits. Have ${currentBalance}, need ${creditsUsed}.`);
}
```

---

## Video-Specific: Direct Generate Flow

For flows that don't need cropping (video, direct image):

```typescript
const r2Key = `${companyId}/generated/nano-${Date.now()}.png`;
await uploadToR2(generatedBlob, r2Key);
const permanentUrl = getR2PublicUrl(r2Key);
setBackgroundImage(permanentUrl);
```

No placeholder row needed; result is persisted directly.

---

## GPT Crop-to-Final Flow

```
User selects crop area on canvas
  → SceneEditor derives crop region + original image context
  → EditImageAIPanel resolves GPT model / quality / credits
  → Create placeholder storyboard_files record
     (metadata: { shouldComposite: true, cropX, cropY, cropWidth, cropHeight })
  → Send cropped context to generation route
  → Callback downloads result, composites into original, uploads to R2
  → Patch storyboard_files (status=completed, r2Key, sourceUrl)
  → Generated image panels + file browser surface finalized record
```

---

## Generated Media Panel Rules

- Completed cards only appear when `r2Key` + `sourceUrl` are present
- Processing cards represent placeholder rows still waiting for callback
- Delete actions soft-delete records (status="deleted"), not hard delete
- Panel and file browser are complementary views over the same `storyboard_files` records

---

## Storage Analytics

`convex/storyboard/aggregates.ts` maintains rolling aggregates for storage usage:

- `storageByCompany` — total bytes + count per company
- `storageByCategory` — breakdown by category within company
- `storageByFileType` — breakdown by fileType

**Eligibility**: file must have `companyId`, not be soft-deleted, size > 0.  
**Shared files excluded**: files with `isShared=true` don't count against the creator's quota.

Daily generation rollup (`storyboard_generation_daily`) tracks count/credits/storage/success/failure per model per day.

---

## File Cleanup / Deletion Strategy

All user-facing deletes are **soft deletes**:

- `r2Key` and `sourceUrl` zeroed out
- `status` set to `"deleted"`
- `deletedAt` timestamp set
- R2 object is removed; Convex row is preserved for audit

Admin hard deletion:

- `batchHardDelete` mutation — permanently removes selected Convex rows
- `batchMarkOrphaned` mutation — flags rows whose R2 objects are missing

There is no separate cleanup cron module. Admins use dashboard routes (`delete-orphan-file`, `delete-project`) for bulk operations.

---

## UI Integration — Project-Scoped Generated Images

```typescript
const projectFiles = useQuery(
  api.storyboard.storyboardFiles.listByProject,
  projectId ? { projectId } : "skip"
);

const projectGeneratedImages = useMemo(() => {
  if (!projectFiles) return [] as string[];
  return projectFiles
    .filter(f => f.category === "generated" && f.status === "completed")
    .map(f => f.sourceUrl)
    .filter((url): url is string => Boolean(url));
}, [projectFiles]);
```

---

## Implementation Status

### Core

- [x] `storyboard_files` schema with all generation, soft-delete, and gallery fields
- [x] Dual upload routes (FormData ≤4MB, binary >4MB)
- [x] Soft delete via `remove` mutation + R2 object removal
- [x] `by_project`, `by_category`, `by_r2Key`, `by_categoryId` indices

### Callback Handler

- [x] Image generation (all KIE models)
- [x] Video generation (Seedance, Kling)
- [x] Veo 3.1 fallback direct-poll when callback has no resultUrl
- [x] Audio/Suno multi-track (2 variations saved as separate records)
- [x] Image compositing for GPT crop flows
- [x] Auto-share for free personal-plan users
- [x] Element auto-append generated image to referenceUrls
- [x] Response code logging + credit refund on failure
- [x] File type correction based on actual URL signature

### UI

- [x] File browser (filter, search, preview, download, delete)
- [x] Generated image panel (project-scoped, completed-only)
- [x] Local state merge for immediate feedback pre-callback

### Analytics

- [x] Storage aggregates per company/category/fileType
- [x] Daily generation rollup per model
- [x] Admin hard delete + orphan marking

### Pending (Optional)

- [ ] Migrate remaining `storyboard_credit_usage` rows to `storyboard_files`
- [ ] N8N workflow update to use callback endpoint

---

## Key Files

| File | Role |
|------|------|
| `lib/uploadToR2.ts` | Client upload/delete functions, size-based route selection |
| `app/api/storyboard/upload/route.ts` | FormData upload handler (≤4MB) |
| `app/api/storyboard/upload-binary/route.ts` | Raw binary upload handler (>4MB) |
| `app/api/storyboard/delete-file/route.ts` | R2 object deletion |
| `app/api/storyboard/delete-convex/route.ts` | Convex soft delete |
| `app/api/kie-callback/route.ts` | KIE AI callback — full finalization logic |
| `convex/storyboard/storyboardFiles.ts` | All queries and mutations for storyboard_files |
| `convex/storyboard/aggregates.ts` | Storage usage rolling aggregates |
| `lib/storyboard/kieResponse.ts` | KIE response code utilities |
| `components/FileBrowser.tsx` | File browser UI |

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL=https://your-app.com
KIE_AI_API_KEY=your_kie_ai_key
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=storyboardbucket
R2_PUBLIC_URL=https://pub-xxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```
