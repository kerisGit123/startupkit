# File & Asset Management — Planning

> **Schema**: See `corePlaning.md` → tables `storyboard_files`, `storyboard_elements`
> **Owns**: R2 bucket operations, file upload/download, element CRUD, file browser UI
> **Phase**: 1 (R2 setup) + 6 (Element library, file browser UI)

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
├── org-{orgId}/           # Organization-based storage
│   ├── uploads/           # User uploaded files
│   ├── generated/         # AI generated images
│   ├── elements/          # LTX-style element references
│   ├── storyboard/        # Storyboard frame images
│   └── videos/            # Video AI results
├── user-{userId}/         # User-based storage (personal accounts)
│   ├── uploads/           # User uploaded files
│   ├── generated/         # AI generated images
│   ├── elements/          # LTX-style element references
│   ├── storyboard/        # Storyboard frame images
│   └── videos/            # Video AI results
└── project-{projectId}/   # Optional project-based storage
    ├── uploads/           # User uploaded files
    ├── generated/         # AI generated images
    ├── elements/          # LTX-style element references
    ├── storyboard/        # Storyboard frame images
    └── videos/            # Video AI results
```

### Naming Convention

```typescript
// File key = {orgPrefix|userPrefix|projectPrefix}/{category}/{timestamp}-{filename}
// Organization examples:
// "org-abc123/uploads/1704600000000-image.jpg"
// "org-abc123/generated/1704600001000-ai-image.png"
// "org-abc123/elements/hero-character.png"
// "org-abc123/videos/scene-1-kling.mp4"

// User examples (personal accounts):
// "user-xyz789/uploads/1704600002000-photo.jpg"
// "user-xyz789/generated/1704600003000-ai-art.png"

// Project examples (optional):
// "project-abc123/uploads/1704600004000-project-image.jpg"
// "project-abc123/generated/1704600005000-project-ai-image.png"
```

### Environment

```
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyboardbucket
```

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
// app/api/storyboard/log-upload/route.ts
import { convex, api } from '@/lib/convex-server';

export async function POST(request: Request) {
  const body = await request.json();
  const {
    orgId,
    userId,
    projectId,
    r2Key,
    filename,
    fileType,
    mimeType,
    size,
    category,
    tags,
    uploadedBy,
    status,
  } = body;

  // Log the upload in Convex with new schema
  const result = await api.storyboard.storyboardFiles.logUpload({
    orgId,
    userId,
    projectId,
    r2Key,
    filename,
    fileType,
    mimeType,
    size,
    category,
    tags: tags || [],
    uploadedBy: uploadedBy || "unknown",
    status: status || "ready",
  });

  console.log(`[log-upload] Logged file: ${filename}`);
  
  return Response.json({ success: true, fileId: result });
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

export const listByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .order("desc")
      .collect();
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("storyboard_files").order("desc").collect();
  },
});
```

---

## Element CRUD (Phase 6)

```typescript
// convex/elements.ts

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    type: v.string(),        // character | object | logo | font | style
    description: v.optional(v.string()),
    thumbnailUrl: v.string(),
    referenceUrls: v.array(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('elements', {
      ...args,
      usageCount: 0,
      status: 'ready',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByProject = query({
  args: { projectId: v.id('projects'), type: v.optional(v.string()) },
  handler: async (ctx, { projectId, type }) => {
    let q = ctx.db.query('elements').withIndex('by_project', q => q.eq('projectId', projectId));
    if (type) {
      q = q.filter(q2 => q2.eq(q2.field('type'), type));
    }
    return await q.collect();
  },
});
```

---

## File Browser UI (Phase 6)

```typescript
// components/FileBrowser.tsx
interface FileBrowserProps {
  projectId: string;
}

export function FileBrowser({ projectId }: FileBrowserProps) {
  const [category, setCategory] = useState<string>('all');
  const files = useQuery(api.files.listByProject, {
    projectId,
    category: category === 'all' ? undefined : category,
  });

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2">
        {['all', 'uploads', 'generated', 'elements', 'videos'].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              category === c ? 'bg-emerald-600 text-white' : 'bg-gray-100'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* File grid */}
      <div className="grid grid-cols-4 gap-3">
        {files?.map(file => (
          <div key={file._id} className="border rounded-lg p-2">
            {file.fileType === 'image' ? (
              <img src={`/api/files/download/${file._id}`} alt={file.filename}
                className="w-full h-24 object-cover rounded" />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                {file.fileType}
              </div>
            )}
            <p className="text-xs mt-1 truncate">{file.filename}</p>
          </div>
        ))}
      </div>
    </div>
  );
}