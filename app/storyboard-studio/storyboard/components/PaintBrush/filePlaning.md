# File & Asset Management — Planning

> **Schema**: See `corePlaning.md` → tables `files`, `elements`
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

## R2 Bucket Structure

```
storyboardbucket/
├── project-{projectId}/
│   ├── uploads/           # User uploaded files
│   ├── generated/         # AI generated images
│   ├── elements/          # LTX-style element references
│   ├── storyboard/        # Storyboard frame images
│   └── videos/            # Video AI results
└── temp/                  # Temporary uploads (auto-expire)
```

### Naming Convention

```typescript
// File key = project-{projectId}/{category}/{filename}
// Examples:
// "project-abc123/generated/scene-1-frame-1.jpg"
// "project-abc123/elements/hero-character.png"
// "project-abc123/videos/scene-1-kling.mp4"
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
// app/api/files/upload/route.ts
import { uploadToR2 } from '@/lib/r2';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const projectId = formData.get('projectId') as string;
  const category = formData.get('category') as string; // uploads | generated | elements
  const userId = formData.get('userId') as string;      // Clerk user ID

  if (!file || !projectId) {
    return Response.json({ error: 'Missing file or projectId' }, { status: 400 });
  }

  // 1. Upload to R2
  const key = `project-${projectId}/${category}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToR2(key, buffer, file.type);

  // 2. Record in Convex (files table — see corePlaning.md)
  const fileRecord = await convex.mutation(api.files.create, {
    projectId,
    r2Key: key,
    filename: file.name,
    fileType: file.type.split('/')[0], // image | video | audio
    mimeType: file.type,
    size: file.size,
    category,
    tags: [],
    uploadedBy: userId,
    uploadedAt: Date.now(),
    status: 'ready',
    createdAt: Date.now(),
  });

  return Response.json({ url, fileRecord });
}
```

---

## Convex File Mutations

```typescript
// convex/files.ts

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    r2Key: v.string(),
    filename: v.string(),
    fileType: v.string(),
    mimeType: v.string(),
    size: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
    status: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('files', args);
  },
});

export const listByProject = query({
  args: { projectId: v.id('projects'), category: v.optional(v.string()) },
  handler: async (ctx, { projectId, category }) => {
    let q = ctx.db.query('files').withIndex('by_project', q => q.eq('projectId', projectId));
    if (category) {
      q = q.filter(q2 => q2.eq(q2.field('category'), category));
    }
    return await q.collect();
  },
});

export const remove = mutation({
  args: { fileId: v.id('files') },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (file) {
      // Note: R2 deletion happens in API route, not here
      await ctx.db.delete(fileId);
    }
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