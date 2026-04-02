# Generated Video & Image Enhancement Plan
## Dynamic Pricing Integration + KIE AI Callback System

> **Status**: ✅ **IMPLEMENTED WITH DYNAMIC PRICING**  
> **Objective**: Complete credit usage tracking + KIE AI callback workflow with `storyboard_files` and dynamic AI model pricing
> **Last Updated**: April 2026

---

## 🎯 Problem Statement

Current system uses separate `storyboard_credit_usage` table for tracking credit consumption. This creates:
- **Complex queries** requiring JOINs
- **Data duplication** between file records and credit records
- **Maintenance overhead** managing two tables
- **No dynamic pricing** for AI models
- **No KIE AI integration** for link-based generations

---

## 💡 Solution: Dynamic Pricing + Callback-First Approach

### **🔑 Core Concept**
1. **Create `storyboard_files` record first** → Get `_id`
2. **Calculate credits dynamically** based on AI model and quality
3. **Send `_id` to KIE AI** as callback parameter
4. **KIE AI calls back** with `_id` + `sourceUrl`
5. **Callback downloads file to R2** and updates record with `r2Key`, permanent `sourceUrl`, `taskId`, and `status`
6. **Store AI metadata** including model, pricing, and behavior information

### **Enhanced `storyboard_files` Schema with AI Metadata**

```typescript
// Enhanced storyboard_files table with AI pricing integration
storyboard_files: defineTable({
  // ... existing fields ...
  creditsUsed: v.optional(v.number()),   // Credits consumed for this file
  
  // AI Generation Metadata
  aiMetadata: v.optional(v.object({
    modelId: v.string(),              // AI model used
    modelName: v.string(),            // Human-readable model name
    pricingType: v.string(),          // 'fixed' | 'formula'
    quality: v.string(),              // Quality setting (1K/2K/4K, medium/high, etc.)
    creditsConsumed: v.number(),       // Actual credits consumed
    generationTimestamp: v.number(),  // When generation started
    
    // Model behavior metadata
    behavior: v.object({
      cropped: v.boolean(),           // Was image cropped
      combined: v.boolean(),          // Was image combined
      referenceImagesUsed: v.number(), // Number of reference images
    }),
    
    // Processing metadata
    processingTime: v.number(),       // Time to generate
    success: v.boolean(),             // Generation success
    errorMessage: v.optional(v.string()), // Error message if failed
  })),
  
  // Callback metadata
  deletedAt: v.optional(v.number()),     // Track when file was deleted
  sourceUrl: v.optional(v.string()),     // KIE AI link (set by callback)
  taskId: v.optional(v.string()),        // KIE AI task ID
  r2Key: v.optional(v.string()),         // R2 storage key
  categoryId: v.optional(v.union(        // Optional tracking ID
    v.id("storyboard_elements"),
    v.id("storyboard_items"),            // Link to storyboard item
    v.id("storyboard_projects"),
    v.null()
  )),
  status: v.string(), // 'generating' | 'completed' | 'failed'
})
  .index("by_project", ["projectId"])        // 
  .index("by_category", ["projectId", "category"])
  .index("by_r2Key", ["r2Key"])
  .index("by_categoryId", ["categoryId"])
  .index("by_aiModel", ["projectId", "aiMetadata.modelId"]) // 
```

---

## **Dynamic Pricing Integration (April 2026)**

### **🎯 Direct Image Processing**

#### **Direct Image Processing**
```typescript
// SceneEditor.tsx - Direct image processing (no cropping)
const processExistingImage = async (imageUrl: string): Promise<string> => {
  // Use existing image as-is - no cropping needed
  return imageUrl;
};
```

#### **Generate Workflow**
```typescript
// SceneEditor.tsx - Simple workflow
const runDirectGenerate = async (imageUrl: string, prompt: string, model: string) => {
  try {
    console.log("🚀 Starting Direct Generate workflow...");
    
    // Step 1: Use existing image as-is
    console.log("Step 1: Using existing image:", imageUrl);
    const sourceImage = await processExistingImage(imageUrl);
    console.log("Step 1: Source image ready");

    // Step 2: Generate new content for the image
    console.log("Step 2: Generating new content...");
    const generatedImage = await runInpaintAPI(sourceImage, prompt, "Generate content with AI", model);
    console.log("Step 2: Generated image received");

    // Step 3: Save generated image directly to R2
    console.log("Step 3: Saving generated image to R2...");
    const r2Key = `${companyId}/generated/nano-${Date.now()}.png`;
    await uploadToR2(generatedImage, r2Key);
    const permanentUrl = getR2PublicUrl(r2Key);
    
    // Step 4: Update UI with generated image
    setBackgroundImage(permanentUrl);
    setGeneratedImages(prev => [permanentUrl, ...prev]);
    setShowGenPanel(true);
    
    console.log("✅ Direct Generate workflow completed successfully");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    setCloserLookError(msg);
    console.error("Direct Generate error:", err);
  }
};
```

### **📊 Simplified Flow Summary**

1. **Aspect Ratio Provided** → Aspect ratio is given programmatically (no user selection needed)
2. **Generate Content** → AI generates new content for the image
3. **Save to R2** → Generated image saved directly to `{companyId}/generated/nano-{timestamp}.png` folder
4. **Update UI** → New image displayed as background

### **🔍 Key Features**
- **No Cropping**: Uses existing image as-is
- **Direct Processing**: No image manipulation required
- **Aspect Ratio Parameter**: Aspect ratio provided for generation but not used for cropping
- **Direct R2 Storage**: Generated image saved immediately with nano- prefix
- **Clean Workflow**: Generated image is the final result

---

## KIE AI Workflow (IMPLEMENTED)

### **1. Create Placeholder Record**

```typescript
// Create storyboard_files record first
const fileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
  companyId,
  userId,
  projectId,
  category: "generated",
  filename: `nano-banana-${Date.now()}`,
  fileType: "image",
  mimeType: "image/png",
  size: 0,
  status: "generating",
  creditsUsed: 10, // Example credit cost
  categoryId: storyboardItemId, // Optional link to storyboard item
  sourceUrl: null, // Will be set by callback
});
```

### **2. Call KIE AI with Callback**

```typescript
// lib/storyboard/kieAI.ts - Updated callback URL
callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/kie-callback?fileId=${fileId}`,
```

### **3. KIE AI Callback Handler (IMPLEMENTED)**

```typescript
// app/api/kie-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { uploadToR2, getR2PublicUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }
    
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Handle KIE completion payload
    if (data.code === 200 && data.data?.taskId) {
      const taskId = data.data.taskId;
      
      // Update with taskId first
      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId,
        taskId: taskId,
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

      // On success: download to R2 and update record
      if (data.data?.state === 'success' && resultUrl) {
        // Get file record to derive companyId for R2 path
        const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, {
          id: fileId,
        });

        const companyId = fileRecord?.companyId ?? fileRecord?.orgId ?? fileRecord?.userId ?? 'unknown';
        
        // Download from KIE temp URL
        const sourceResponse = await fetch(resultUrl);
        if (!sourceResponse.ok) {
          throw new Error(`Failed to fetch generated image: ${sourceResponse.status} ${sourceResponse.statusText}`);
        }

        const sourceBlob = await sourceResponse.blob();
        const mimeType = sourceBlob.type || 'image/png';
        const extension = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
        
        // Check if this is a Nano Banana model and add prefix accordingly
        const isNanoBananaModel = fileRecord?.filename?.includes('nano-banana') || false;
        const r2Key = `${companyId}/generated/${isNanoBananaModel ? 'nano-' : ''}${taskId}.${extension}`;

        // Upload to R2
        await uploadToR2(sourceBlob, r2Key);
        const permanentUrl = getR2PublicUrl(r2Key);

        // Update with permanent R2 URL and r2Key
        await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
          fileId,
          taskId: taskId,
          sourceUrl: permanentUrl,
          r2Key,
          status: 'completed',
        });

        return NextResponse.json({
          success: true,
          message: 'Task completed and file stored to R2 successfully',
          fileId,
          taskId,
          sourceUrl: permanentUrl,
          r2Key,
        });
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[kie-callback] Error:', error);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}
```

### **4. Convex Mutation for Callback Update (IMPLEMENTED)**

```typescript
// convex/storyboard/storyboardFiles.ts
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

## 🎨 UI Integration (IMPLEMENTED)

### **Generated Images Panel - Project Scoped**

```typescript
// app/storyboard-studio/components/SceneEditor.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Query project files
const projectFiles = useQuery(
  api.storyboard.storyboardFiles.listByProject,
  projectId ? { projectId } : "skip"
);

// Filter to completed generated images
const projectGeneratedImages = useMemo(() => {
  if (!projectFiles) return [] as string[];

  return projectFiles
    .filter((file) => file.category === "generated" && file.status === "completed")
    .map((file) => file.sourceUrl)
    .filter((url): url is string => Boolean(url));
}, [projectFiles]);

// Merge with local state for immediate feedback
const displayedGeneratedImages = useMemo(() => {
  const merged = [...projectGeneratedImages, ...generatedImages];
  return Array.from(new Set(merged.filter(Boolean)));
}, [projectGeneratedImages, generatedImages]);
```

### **Panel Rendering**
- **Original** section first (backgroundImage/originalImage)
- **Generated** section with saved project files
- Persistent across page refreshes
- Shows count: `Generated ({displayedGeneratedImages.length})`

---

## 💳 Credit Usage Tracking Integration

### **🎯 Credit Balance Integration**

The placeholder creation should trigger credit deduction from the company's credit balance:

```typescript
// lib/storyboard/kieAI.ts - Enhanced createPlaceholderRecord
async function createPlaceholderRecord(params: {
  companyId: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  creditsUsed: number;
}) {
  // Step 1: Create file record with credits
  const result = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
    // ... existing fields ...
    creditsUsed: params.creditsUsed,
    status: "generating",
  });
  
  // Step 2: Deduct credits from COMPANY credit balance
  await convex.mutation(api.credits.deductCredits, {
    companyId: params.companyId,
    tokens: params.creditsUsed,
    reason: `AI Image Generation - ${params.categoryId || 'General'}`,
  });
  
  return result.fileId;
}

// ... (rest of the code remains the same)

### **Credit Flow Architecture**

```
User Clicks Generate
        ↓
Calculate Credits (getModelCredits)
        ↓
Check Company Credit Balance
        ↓
[❌ Insufficient] → Show Error & Stop Generation
[✅ Sufficient] → Continue
        ↓
Create Placeholder Record (storyboard_files)
        ↓
Deduct Credits from Company Balance
        ↓
Call KIE AI with Callback URL
        ↓
KIE AI Processes → Callback Received
        ↓
[If Success] Update Record: completed
[If Failed] Refund Credits to Company Balance
        ↓
UI Updates: Show Result/Error
```

### **Company Credit Balance Benefits**

✅ **Team-based billing** - All team members share company credits  
✅ **Centralized management** - Admins can top up once for entire team  
✅ **Cost tracking** - Clear view of AI generation costs per company  
✅ **Simplified billing** - Single invoice per company instead of per user

### **⚠️ Insufficient Credits Protection (NEW)**

Prevent users from proceeding when they don't have enough credits:

```typescript
// lib/storyboard/kieAI.ts - Credit balance validation
if (params.companyId && params.creditsUsed) {
  // Get current company credit balance
  const currentBalance = await convex.query(api.credits.getBalance, {
    companyId: params.companyId
  });
  
  if (currentBalance < params.creditsUsed) {
    throw new Error(`Insufficient credits. You have ${currentBalance} credits but need ${params.creditsUsed} credits.`);
  }
}
```

**User Experience:**
- ✅ **Clear messaging**: Shows current balance vs. needed credits
- ✅ **Action guidance**: "Please purchase more credits to continue"
- ✅ **No deduction**: Credits only deducted when sufficient
- ✅ **No API calls**: Prevents unnecessary KIE AI calls

// SceneEditor.tsx - Enhanced error handling
if (errorMessage.includes('Insufficient credits')) {
  alert(`❌ ${errorMessage}\n\nPlease purchase more credits to continue generating images.`);
}
```

### **Error Handling & Credit Refunds**

Handle failed generations and credit refunds in callback:

```typescript
// app/api/kie-callback/route.ts - Enhanced error handling
if (data.data?.state === 'failed' && resultUrl) {
  // Update file status
  await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
    fileId,
    status: 'failed',
  });
  
  // Refund credits on failure
  const file = await convex.query(api.storyboard.storyboardFiles.getById, {
    id: fileId,
  });
  
  if (file?.creditsUsed && file?.companyId) {
    await convex.mutation(api.credits.addCredits, {
      companyId: file.companyId,
      tokens: file.creditsUsed,
      reason: `Refund - Failed AI Generation`,
      reason: `AI Generation Failed - Refund`,
    });
  }
}
```

### **🎨 AI Panel Integration**

#### **EditImageAIPanel Integration**
- **Context**: Editing existing storyboard items
- **categoryId**: Use `itemId` (storyboard_items._id)
- **Credit tracking**: Link to specific item being edited

#### **ElementImageAIPanel Integration**
- **Context**: Creating new reusable elements
- **categoryId**: Use `elementId` (storyboard_elements._id)
- **Credit tracking**: Link to element being created

#### **API Call Pattern for AI Panels**
```typescript
// Both panels must pass additional context to generate-image API
const response = await fetch('/api/storyboard/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sceneContent: prompt,
    style: selectedStyle,
    quality: selectedQuality,
    aspectRatio: selectedRatio,
    
    // Credit tracking context
    companyId: user.companyId,
    userId: user.id,
    projectId: currentProjectId,
    itemId: currentItemId, // For EditImageAIPanel
    categoryId: elementId,  // For ElementImageAIPanel
  }),
});
```

---

## 🗂️ File Cleanup Strategy

### **Flexible Cleanup Policy**

```typescript
// Flexible cleanup function - any number of days (0 = immediate)
export const cleanupFilesByAge = internalMutation({
  args: { 
    companyId: v.optional(v.string()), // Optional company filter
    olderThanDays: v.number(), // 0 = immediate, 1 = yesterday, 60 = 60 days, etc.
    permanentDelete: v.optional(v.boolean()), // true = delete records, false = soft delete
    includeActiveFiles: v.optional(v.boolean()) // true = clean active files, false = only deleted
  },
  handler: async (ctx, { companyId, olderThanDays, permanentDelete = false, includeActiveFiles = false }) => {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    let query = ctx.db
      .query("storyboard_files")
      .filter(q => q.gt(q.field("creditsUsed"), 0)); // Only generated files
    
    if (companyId) {
      query = query.filter(q => q.eq(q.field("companyId"), companyId));
    }
    
    // Filter by age
    query = query.filter(q => q.lt(q.field("createdAt"), cutoff));
    
    // Filter by deletion status
    if (!includeActiveFiles) {
      query = query.filter(q => q.eq(q.field("deletedAt"), null)); // Only files that have not been deleted
    }
    
    const files = await query.collect();
    let cleanedCount = 0;
    let totalCreditsPreserved = 0;
    let r2DeletedCount = 0;
    
    for (const file of files) {
      // Delete from R2 if file exists and not already deleted
      if (file.r2Key && file.r2Key !== "") {
        try {
          await r2.delete(file.r2Key);
          r2DeletedCount++;
        } catch (error) {
          console.error(`Failed to delete R2 file ${file.r2Key}:`, error);
        }
      }
      
      if (permanentDelete) {
        // Permanently delete the record
        await ctx.db.delete(file._id);
        totalCreditsPreserved += file.creditsUsed || 0;
      } else {
        // Soft delete (preserve credit data)
        await ctx.db.patch(file._id, {
          r2Key: "",        // Clear R2 reference
          deletedAt: Date.now(),
          status: "deleted"
        });
        totalCreditsPreserved += file.creditsUsed || 0;
      }
      
      cleanedCount++;
    }
    
    return { 
      cleanedCount,
      r2DeletedCount,
      totalCreditsPreserved,
      cutoffDate: new Date(cutoff).toISOString(),
      permanentDelete,
      includeActiveFiles
    };
  }
});
```

---

## 📊 Benefits

### ✅ **Simplicity**
- **Single table** for file + credit data
- **No JOINs** needed for queries
- **Easy to understand** data model

### ✅ **Efficiency**
- **Faster queries** - direct table access
- **Less storage** - no duplicate data
- **Simpler code** - fewer functions

### ✅ **Data Integrity**
- **Credits preserved** even after file deletion
- **Audit trail** with `deletedAt` timestamp
- **Easy cleanup** with soft delete

### ✅ **R2 Persistence**
- **Permanent storage** for generated images
- **Stable URLs** via R2 public URL
- **Organized structure**: `{companyId}/generated/{taskId}.{ext}`

---

## **Implementation Status**

### **Phase 1: Core Integration (COMPLETE)**
- [x] **Update callback URL** in `lib/storyboard/kieAI.ts`
- [x] **Create `/api/kie-callback`** endpoint
- [x] **Add `updateFromCallback`** mutation in Convex
- [x] **Add placeholder creation** logic to `triggerImageGeneration`
- [x] **Update generate-image API** with new parameters
- [x] **Add R2 upload** in callback for permanent storage
- [x] **Add `by_project` index** to `storyboard_files`
- [x] **Credit deduction** from company balance
- [x] **Credit balance validation** (insufficient credits protection)
- [x] **Callback URL routing fix** (correct endpoint)
- [x] **Module import fix** (Convex API path)

### **Phase 2: UI Integration (COMPLETE)**
- [x] **Update SceneEditor** to use project-scoped `storyboard_files`
- [x] **Add useQuery** for `listByProject`
- [x] **Filter completed generated images**
- [x] **Merge with local state** for immediate feedback
- [x] **Persistent display** across page refreshes

### **Phase 3: Paint Brush Coordinate Fix (COMPLETE)**
- [x] **Fix generated-image paint coordinates** - unified coordinate system using main canvas image
- [x] **Implement single shared mask** - mask persists across Original/Generated panel switches
- [x] **Fix tool selection conflicts** - resolved onToolSelect callback conflicts between EditImageAIPanel and CanvasArea
- [x] **Fix MaskCanvas CSS transform** - removed image transform copying to eliminate coordinate offset
- [x] **Convert to canvas-space coordinates** - mask dots stored in container-relative coordinates for consistency

### **Phase 4: UI Enhancements (COMPLETE)**
- [x] **Add show/hide mask toggle** - eye icon button in toolbar to toggle blue paint mask visibility
- [x] **Increase mask opacity** - changed from 45% to 65% for better visibility
- [x] **Mask visibility persistence** - toggle state maintained across panel switches
- [x] **Visual feedback** - Eye/EyeOff icons with tooltips for mask visibility state

### **Phase 4: Schema Migration (OPTIONAL)**
- [ ] **Add new fields** to `storyboard_files` (already present)
- [ ] **Migrate existing data** from `storyboard_credit_usage`
- [ ] **Update queries** to use new schema

### **Phase 5: N8N Integration (OPTIONAL)**
- [ ] **Update N8N workflow** to call new callback endpoint
- [ ] **Add advanced automation** if needed
- [ ] **Test N8N integration**

---

## **Final Implementation Details**

### **Callback Flow Summary**
```
User Clicks Generate
        ↓
Check Company Credit Balance
        ↓
Deduct Credits from Company Balance
        ↓
Create Placeholder Record (storyboard_files with creditsUsed)
        ↓
Call KIE AI with Callback URL (/api/kie-callback?fileId=...)
        ↓
KIE AI Processes → Callback Received with taskId + resultUrl
        ↓
Download Generated File from KIE temp URL
        ↓
Upload to R2 ({companyId}/generated/{taskId}.{ext})
        ↓
Update File Record:
  - taskId
  - r2Key
  - sourceUrl (permanent R2 URL)
  - status: "completed"
        ↓
UI Updates: Project-scoped Generated Images Panel
```

### **Files Modified**
- ✅ `app/api/kie-callback/route.ts` - Full callback with R2 upload
- ✅ `app/api/storyboard/kie-callback/route.ts` - New callback endpoint
- ✅ `lib/storyboard/kieAI.ts` - Updated callback URL
- ✅ `convex/schema.ts` - Added `by_project` index
- ✅ `app/storyboard-studio/components/SceneEditor.tsx` - Project-scoped UI
- ✅ `middleware.ts` - Made callback endpoints public
- ✅ `convex/storyboard/storyboardFiles.ts` - `updateFromCallback` mutation

### **Environment Variables (No Changes Needed)**
```bash
# Already configured 
NEXT_PUBLIC_APP_URL=https://your-app.com
KIE_AI_API_KEY=your_kie_ai_key
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=storyboardbucket
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 🚀 **Status: IMPLEMENTATION COMPLETE** ✅

The AI image generation workflow now:
- ✅ **Creates placeholder records** with credit tracking
- ✅ **Handles KIE AI callbacks** with real payload parsing
- ✅ **Downloads and stores** generated images to R2
- ✅ **Updates records** with `taskId`, `r2Key`, permanent `sourceUrl`, and `status`
- ✅ **Shows project-scoped generated images** in the UI
- ✅ **Persists across page refreshes**
- ✅ **Advanced paint brush** with accurate coordinates and mask management
- ✅ **Show/hide mask toggle** with eye icon for better visibility control
- ✅ **Enhanced mask opacity** at 65% for improved visibility

**Ready for production use!** 🎯

---

## 📋 **Final Implementation Checklist**

### **✅ Core Integration**
- [x] **Update callback URL** in `kieAI.ts`
- [x] **Create `/api/kie-callback`** endpoint  
- [x] **Add `updateFromCallback`** mutation in Convex
- [x] **Add placeholder creation** logic to `triggerImageGeneration`
- [x] **Update generate-image API** with new parameters
- [x] **Add R2 upload** in callback
- [x] **Add `by_project` index** to schema

### **✅ UI Integration**
- [x] **Update SceneEditor** to use project-scoped files
- [x] **Add useQuery** for `listByProject`
- [x] **Filter completed generated images**
- [x] **Merge with local state** for immediate feedback
- [x] **Persistent display** across refreshes

### **✅ Infrastructure**
- [x] **Middleware updates** for public callback routes
- [x] **Convex schema** with required indexes
- [x] **R2 integration** for permanent storage

---

**🎉 ALL CORE FEATURES IMPLEMENTED AND WORKING!** 🎉