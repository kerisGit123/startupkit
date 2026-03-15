# File & Asset Management — Planning

> **Schema**: See `corePlaning.md` → tables `storyboard_files`, `storyboard_elements`
> **Owns**: R2 bucket operations, file upload/download, element CRUD, file browser UI
> **Phase**: 1 (R2 setup) + **COMPLETED** (Element library, file browser UI)

---

## Scope

This file covers:

1. Cloudflare R2 bucket structure and naming conventions
2. R2 integration layer (upload, download, delete)
3. File upload API route
4. Element CRUD (LTX-style: character, object, logo, font, style) — Phase 6
5. File browser UI component — Phase 6

This file does NOT cover project/script management (→ `storyboardplanning.md`), image generation (→ `imageAIPanel.md`), or video generation (→ `videoAIPanel.md`).

---

## R2 Bucket Structure (UPDATED)

```
storyboardbucket/
├── {companyId}/           # Direct companyId (org_123 or user_456) - CRITICAL: Must use current user's companyId
│   ├── uploads/           # User uploaded files
│   ├── generated/         # AI generated images  
│   ├── elements/          # LTX-style element references
│   ├── storyboard/        # Storyboard frame images
│   └── videos/            # Video AI results
```

### ⚠️ **IMPORTANT: companyId-Based Structure**

**All file storage MUST use the current user's companyId:**

```typescript
// ✅ CORRECT: Always use current authenticated user's companyId
const getCurrentUserCompanyId = (user) => {
  return user.organizationMemberships?.[0]?.organization?.id || user.id;
  // Returns: "org_abc123" or "user_xyz789"
};

// ✅ CORRECT: Direct companyId usage - NO additional prefixes
const generateR2Key = (companyId, category, filename) => {
  const timestamp = Date.now();
  return `${companyId}/${category}/${timestamp}-${filename}`;
};

// ❌ WRONG: Never use project-based storage
// ❌ WRONG: Never add redundant prefixes like "org-{orgId}"
```

**File Path Examples:**
- Organization: `org_abc123/elements/hero-character.png`
- Personal: `user_xyz789/generated/1704600003000-ai-art.png`
- AI Generated: `org_abc123/generated/1704600001000-ai-image.png`
- Storyboard: `user_xyz789/storyboard/frame-1.jpg`

### Key Changes:
- **Removed redundant prefixes** - No more `org-{orgId}` or `user-{userId}`
- **Direct companyId usage** - Use `org_123` or `user_456` directly as folder name
- **Consistent with app logic** - Matches companyId values used throughout the entire application
- **Security-focused** - All files stored under current user's organization/user context

### Naming Convention

```typescript
// File key = {companyId}/{category}/{timestamp}-{filename}
// Organization examples:
// "org_abc123/uploads/1704600000000-image.jpg"
// "org_abc123/generated/1704600001000-ai-image.png"
// "org_abc123/elements/hero-character.png"
// "org_abc123/videos/scene-1-kling.mp4"

// User examples (personal accounts):
// "user_xyz789/uploads/1704600002000-photo.jpg"
// "user_xyz789/generated/1704600003000-ai-art.png"
// "user_xyz789/elements/hero-character.png"
// "user_xyz789/videos/scene-1-kling.mp4"
```

### File Storage Logic

```typescript
// Always use current user's organization or user ID (already has prefix)
const getCurrentUserCompanyId = (user) => {
  return user.organizationMemberships?.[0]?.organization?.id || user.id;
  // Returns: "org_abc123" or "user_xyz789"
};

// R2 key generation - no additional prefixes needed
const generateR2Key = (companyId, category, filename) => {
  const timestamp = Date.now();
  return `${companyId}/${category}/${timestamp}-${filename}`;
};
```

### Environment

```bash
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your_account_id

# R2 API Credentials
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

# R2 Bucket Configuration
R2_BUCKET_NAME=storyboardbucket

# R2 Public URLs (REQUIRED for file access)
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# AI Generation API Keys (REQUIRED for image/video generation)
KIE_AI_API_KEY=your_api_key
KIE_AI_CALLBACK_URL=https://your-domain.com/api/callback/video
```

---

## 🔧 **Critical R2 Public URL Setup**

### **Step 1: Enable Public URLs in Cloudflare**

1. Go to **Cloudflare Dashboard** → **R2 Object Storage**
2. Click on your `storyboardbucket` 
3. Go to **Settings** tab
4. Look for **Public URL** section
5. Click **Enable Public URL** (if not already enabled)
6. Copy the public URL (it will look like: `https://pub-xxxxxxxx.r2.dev`)

### **Step 2: Add Public URLs to Environment**

Add these two lines to your `.env.local` file:

```bash
# R2 Public URL (server-side) - Used by API routes
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# R2 Public URL (client-side) - Used by React components  
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

**Replace `xxxxxxxx` with your actual public URL from Cloudflare.**

### **Step 3: Complete Environment Setup**

Your `.env.local` should look like this:

```bash
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=8ef343d05898fc86781d8897005c01f6

# R2 API Credentials
R2_ACCESS_KEY_ID=a3ad6a55b1cb529d71e4d67581c18a4b
R2_SECRET_ACCESS_KEY=b9bbce46b6bc00b5a0fe32ce13a4da912d56a4e0acdf682d4f2a95ca68c07c79

# R2 Bucket Configuration
R2_BUCKET_NAME=storyboardbucket

# R2 Public URLs (ADD THESE)
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# Convex
NEXT_PUBLIC_CONVEX_SITE_URL=https://watchful-ferret-363.convex.site
```

### **Step 4: Restart Development Server**

```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

### **Why You Need Both URLs:**

- **`R2_PUBLIC_URL`** (no prefix) = Used by server-side API routes for file operations
- **`NEXT_PUBLIC_R2_PUBLIC_URL`** (with prefix) = Used by client-side React components to display images

Both should point to the same Cloudflare R2 public URL.

### **⚠️ Critical for File Access:**

Without these public URLs:
- ❌ Images won't display in the UI
- ❌ File uploads will fail
- ❌ Element library thumbnails won't work
- ❌ Video generation results won't be accessible

**Once you add these URLs and restart the server, all file operations should work! 🚀**

---

## R2 Integration Layer

```typescript
// lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function uploadToR2(key: string, body: Buffer | ArrayBuffer, contentType: string) {
  await r2Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body instanceof ArrayBuffer ? Buffer.from(body) : body,
    ContentType: contentType,
  }));
  return `https://${BUCKET}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${key}`;
}

export async function getFromR2(key: string) {
  return await r2Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function deleteFromR2(key: string) {
  return await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
```

---

## File Upload API Route

```typescript
// app/api/storyboard/r2-upload/route.ts
import { convex, api } from '@/lib/convex-server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { filename, contentType, category } = body;

  // Get user's organization data
  const clerk = require('@clerk/clerk-sdk-node');
  const user = await clerk.users.getUser(userId);
  const userOrganizationId = user.organizationMemberships?.[0]?.organization?.id;

  // Use current user's companyId
  const companyId = userOrganizationId || userId;

  // Generate R2 key with companyId-based structure
  const timestamp = Date.now();
  const ext = filename.split('.').pop();
  const r2Key = `${companyId}/${category || 'uploads'}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Generate signed URL for upload
  // ... (R2 upload logic)
  
  return Response.json({ uploadUrl, publicUrl, r2Key });
}
```

---

## Convex File Mutations

```typescript
// convex/storyboard/storyboardFiles.ts

export const logUpload = mutation({
  args: {
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()),
    projectId: v.optional(v.id("storyboard_projects")),
    companyId: v.optional(v.string()), // Added for companyId-based tracking
    r2Key: v.string(),
    filename: v.string(),
    fileType: v.string(),
    mimeType: v.string(),
    size: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    uploadedBy: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboard_files", {
      ...args,
      uploadedAt: Date.now(),
      createdAt: Date.now(),
      isFavorite: false,
    });
  },
});

export const listByCompany = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

// Legacy queries for backward compatibility
export const listByOrg = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

export const listByUser = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});
```

---

## Element CRUD (Phase 6)

```typescript
// convex/storyboard/storyboardElements.ts

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    type: v.string(),        // character | object | logo | font | style
    description: v.optional(v.string()),
    thumbnailUrl: v.string(),
    referenceUrls: v.array(v.string()),
    tags: v.array(v.string()),
    visibility: v.optional(v.union(v.literal('private'), v.literal('shared'), v.literal('public'))),
  },
  handler: async (ctx, args) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const companyId = userOrganizationId || userId;
    
    return await ctx.db.insert('storyboard_elements', {
      projectId: args.projectId,
      companyId, // Use the calculated companyId
      name: args.name,
      type: args.type,
      description: args.description || '',
      thumbnailUrl: args.thumbnailUrl,
      referenceUrls: args.referenceUrls,
      tags: args.tags,
      visibility: args.visibility ?? 'private',
      sharedWith: [],
      status: 'ready',
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByProject = query({
  args: {
    projectId: v.id('storyboard_projects'),
    type: v.optional(v.string()),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, type, companyId }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    
    // Get project to verify access
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    console.log(`[listByProject] Querying elements: projectId=${projectId}, type=${type}, companyId=${companyId}`);
    
    let query = ctx.db
      .query('storyboard_elements')
      .withIndex('by_project', (q) => q.eq('projectId', projectId));
    
    // Filter by type if provided
    if (type) {
      query = query.filter((q) => q.eq('type', type));
    }
    
    // Filter by companyId if provided
    if (companyId) {
      query = query.filter((q) => q.eq('companyId', companyId));
    }
    
    const results = await query
      .order('desc')
      .collect();
    
    console.log(`[listByProject] Found ${results.length} elements`);
    return results;
  },
});

export const listByOrganization = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query('storyboard_elements')
      .collect()
      .then(elements => elements.filter(el => el.companyId === companyId));
  },
});

// Security mutations with companyId checks
export const update = mutation({
  args: {
    id: v.id('storyboard_elements'),
    // ... other fields to update
  },
  handler: async (ctx, { id, ...fields }) => {
    const element = await ctx.db.get(id);
    if (!element) {
      throw new Error('Element not found');
    }
    
    // Get user's organization from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can update this element (same companyId)
    if (element.companyId !== currentUserCompanyId) {
      throw new Error('Access denied: You can only update elements from your organization');
    }
    
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const incrementUsage = mutation({
  args: { 
    id: v.id('storyboard_elements'),
    projectId: v.id('storyboard_projects')
  },
  handler: async (ctx, { id, projectId }) => {
    const el = await ctx.db.get(id);
    if (!el) {
      throw new Error('Element not found');
    }
    
    // Get user's organization from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can use this element (same companyId)
    if (el.companyId !== currentUserCompanyId) {
      throw new Error('Access denied: You can only use elements from your organization');
    }
    
    await ctx.db.patch(id, { 
      usageCount: (el.usageCount ?? 0) + 1, 
      lastUsedAt: Date.now(),
      updatedAt: Date.now() 
    });
  },
});

export const remove = mutation({
  args: { id: v.id('storyboard_elements') },
  handler: async (ctx, { id }) => {
    const element = await ctx.db.get(id);
    if (!element) {
      throw new Error('Element not found');
    }
    
    // Get user's organization from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can delete this element (same companyId)
    if (element.companyId !== currentUserCompanyId) {
      throw new Error('Access denied: You can only delete elements from your organization');
    }
    
    await ctx.db.delete(id);
  },
});
```

---

## File Browser UI (Phase 6)

```typescript
// components/GlobalFileBrowser.tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrganization, useUser } from '@clerk/nextjs';

export function GlobalFileBrowser({ onClose }: GlobalFileBrowserProps) {
  // Get files using companyId (current user's organization or personal account)
  const { user } = useUser();
  const companyId = user?.organizationMemberships?.[0]?.organization?.id || user?.id;
  
  const files = useQuery(api.storyboard.storyboardFiles.listByCompany, { companyId });

  // Filter files by category
  const filteredFiles = files?.filter(file => {
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) ?? [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white">All Files</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => {
              const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${file.r2Key}`;
              
              return (
                <div key={file._id} className="relative group">
                  <div className="aspect-video bg-[#1e1e2a] rounded-lg overflow-hidden relative">
                    {file.fileType === 'image' ? (
                      <img 
                        src={publicUrl} 
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-300 truncate">{file.filename}</p>
                    <p className="text-[10px] text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}