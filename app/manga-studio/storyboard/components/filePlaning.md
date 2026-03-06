# Storyboard Studio File Management System Design

## 📋 **Project Overview**

**Storyboard Studio** - A multi-tenant creative platform for video production teams, enabling seamless file management for video, audio, and image assets with intelligent tagging and organization.

### **Core Requirements**
- Multi-tenant architecture with organizations
- Support for video, audio, and image files
- Intelligent tagging system (Uploads vs Creations, Characters, Locations, Props)
- Real-time collaboration
- High-performance file operations
- Scalable storage solution

---

## 🏗️ **Technology Stack**

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14+ | React-based UI with real-time updates |
| **Authentication** | Clerk | Multi-tenant auth with organizations |
| **Database** | Convex | Real-time metadata, permissions, relationships |
| **Storage** | Cloudflare R2 | Scalable object storage with zero egress fees |
| **File Processing** | FFmpeg | Video/audio processing capabilities |
| **CDN** | Cloudflare | Global content delivery |
| **API** | Next.js API Routes | File operations and business logic |

---

## 🎯 **Key Features**

### **File Management**
- ✅ Multi-format support (video, audio, images)
- ✅ Drag-and-drop upload interface
- ✅ Bulk operations (upload, delete, move)
- ✅ Real-time progress tracking
- ✅ Preview capabilities
- ✅ Version control for assets

### **Organization & Tagging**
- ✅ Organization-based isolation
- ✅ Smart tagging system
- ✅ Collections (Characters, Locations, Props)
- ✅ Search and filtering
- ✅ Custom metadata fields

### **Collaboration**
- ✅ Real-time file sharing
- ✅ Permission-based access
- ✅ Activity tracking
- ✅ Comments and annotations

---

## 📁 **Cloudflare R2 Bucket Structure**

### **Hierarchical Organization**
```
storyboardbucket/
├── org-{organizationId}/
│   ├── uploads/
│   │   ├── images/
│   │   ├── videos/
│   │   └── audio/
│   ├── creations/
│   │   ├── characters/
│   │   ├── locations/
│   │   ├── props/
│   │   └── scenes/
│   ├── projects/
│   │   └── {projectId}/
│   │       ├── assets/
│   │       └── exports/
│   └── temp/
│       └── {userId}/
│           └── uploads/
```

### **Key Naming Conventions**
```typescript
// File key structure
const fileKey = `org-${orgId}/${category}/${type}/${fileId}-${filename}`;

// Examples:
// "org-abc123/uploads/images/file-456-scene1.jpg"
// "org-abc123/creations/characters/file-789-hero.png"
// "org-abc123/projects/proj-456/assets/file-123-background.mp4"
```

---

## 🗄️ **Convex Database Schema**

### **Core Tables**

```typescript
// Organizations Table
organizations: defineTable({
  name: v.string(),
  slug: v.string(),
  ownerId: v.id("users"),
  memberIds: v.array(v.id("users")),
  settings: v.object({
    storageQuota: v.number(),          // bytes
    allowedFileTypes: v.array(v.string()),
    maxFileSize: v.number(),          // bytes
    enableVersioning: v.boolean(),
  }),
  subscription: v.object({
    plan: v.string(),                 // free, pro, enterprise
    storageUsed: v.number(),          // bytes
    lastCalculated: v.number(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_slug", ["slug"])
.index("by_owner", ["ownerId"])
.index("by_member", ["memberIds"]),

// Files Table
files: defineTable({
  organizationId: v.id("organizations"),
  projectId: v.optional(v.id("projects")),
  r2Key: v.string(),                 // Cloudflare R2 object key
  filename: v.string(),              // Original filename
  displayName: v.string(),            // User-friendly name
  fileType: v.string(),               // image, video, audio, document
  mimeType: v.string(),
  size: v.number(),                   // bytes
  checksum: v.string(),               // SHA-256 hash
  
  // Categorization
  category: v.string(),               // uploads, creations, projects
  subcategory: v.optional(v.string()), // characters, locations, props
  
  // Metadata
  metadata: v.optional(v.object({
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    duration: v.optional(v.number()),    // for video/audio
    fps: v.optional(v.number()),
    codec: v.optional(v.string()),
    bitrate: v.optional(v.number()),
  })),
  
  // Tags and Collections
  tags: v.array(v.string()),          // ["character", "hero", "main"]
  collections: v.array(v.string()),   // ["Characters", "Scene 1"]
  
  // Ownership and Permissions
  uploadedBy: v.id("users"),
  uploadedAt: v.number(),
  lastModifiedBy: v.optional(v.id("users")),
  lastModifiedAt: v.optional(v.number()),
  
  // Version Control
  version: v.number(),
  parentFileId: v.optional(v.id("files")), // for versioning
  
  // Status
  status: v.string(),                 // uploading, processing, ready, error
  processingProgress: v.optional(v.number()), // 0-100
  
  // Usage Tracking
  downloadCount: v.number(),
  lastAccessedAt: v.optional(v.number()),
  
  // AI/Storyboard Integration
  storyboardItemIds: v.array(v.id("storyboardItems")), // linked items
  aiProcessed: v.boolean(),           // AI analysis completed
  aiTags: v.optional(v.array(v.string())), // AI-generated tags
})
.index("by_organization", ["organizationId"])
.index("by_project", ["projectId"])
.index("by_user", ["uploadedBy"])
.index("by_category", ["category"])
.index("by_tags", ["tags"])
.index("by_status", ["status"])
.index("by_storyboard_items", ["storyboardItemIds"]),

// Projects Table
projects: defineTable({
  organizationId: v.id("organizations"),
  name: v.string(),
  description: v.optional(v.string()),
  ownerId: v.id("users"),
  memberIds: v.array(v.id("users")),
  settings: v.object({
    assetFolder: v.string(),          // R2 folder path
    exportSettings: v.object({
      resolution: v.string(),
      format: v.string(),
      quality: v.number(),
    }),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_organization", ["organizationId"])
.index("by_owner", ["ownerId"])
.index("by_member", ["memberIds"]),

// File Tags Table (for advanced tag management)
fileTags: defineTable({
  organizationId: v.id("organizations"),
  name: v.string(),
  color: v.string(),
  category: v.string(),               // character, location, prop, custom
  description: v.optional(v.string()),
  createdBy: v.id("users"),
  usageCount: v.number(),
  createdAt: v.number(),
})
.index("by_organization", ["organizationId"])
.index("by_category", ["category"])
.index("by_name", ["name"]),

// File Activity Log
fileActivity: defineTable({
  fileId: v.id("files"),
  organizationId: v.id("organizations"),
  userId: v.id("users"),
  action: v.string(),                 // upload, download, delete, modify, share
  details: v.optional(v.string()),   // JSON string of additional details
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  timestamp: v.number(),
})
.index("by_file", ["fileId"])
.index("by_organization", ["organizationId"])
.index("by_user", ["userId"])
.index("by_timestamp", ["timestamp"]),
```

---

## 🔧 **API Design**

### **Core File Operations**

```typescript
// API Routes Structure
/api/v1/files/
├── upload                    // POST - Upload file
├── list                      // GET - List files
├── get/[fileId]             // GET - Get file info
├── download/[fileId]        // GET - Download file
├── delete/[fileId]          // DELETE - Delete file
├── move/[fileId]            // PUT - Move file
├── copy/[fileId]            // POST - Copy file
├── update/[fileId]          // PUT - Update metadata
├── tags                     // GET/POST - Manage tags
└── search                   // GET - Search files

// Bucket Management (Admin only)
/api/v1/admin/buckets/
├── create                   // POST - Create bucket
├── list                     // GET - List buckets
├── delete/[bucketName]     // DELETE - Delete bucket
├── info/[bucketName]        // GET - Bucket info
└── usage/[organizationId]   // GET - Storage usage
```

### **API Implementation Examples**

```typescript
// app/api/v1/files/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const organizationId = formData.get('organizationId') as string;
  const category = formData.get('category') as string; // uploads, creations
  const subcategory = formData.get('subcategory') as string;
  const tags = JSON.parse(formData.get('tags') as string || '[]');
  
  // Verify user permissions
  const userId = await getCurrentUserId();
  const hasPermission = await convex.query(api.files.checkUploadPermission, {
    organizationId,
    userId,
  });
  
  if (!hasPermission) {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }
  
  // Generate file metadata
  const fileId = crypto.randomUUID();
  const fileExtension = file.name.split('.').pop();
  const r2Key = `org-${organizationId}/${category}/${subcategory || 'general'}/${fileId}-${file.name}`;
  
  // Upload to R2
  const uploadResult = await uploadToR2(r2Key, file);
  
  // Extract metadata
  const metadata = await extractFileMetadata(file);
  
  // Store in Convex
  const fileRecord = await convex.mutation(api.files.create, {
    organizationId,
    r2Key,
    filename: file.name,
    displayName: file.name,
    fileType: getFileType(file.type),
    mimeType: file.type,
    size: file.size,
    checksum: await calculateChecksum(file),
    category,
    subcategory,
    metadata,
    tags,
    uploadedBy: userId,
    uploadedAt: Date.now(),
    status: 'ready',
  });
  
  // Log activity
  await convex.mutation(api.fileActivity.log, {
    fileId: fileRecord._id,
    organizationId,
    userId,
    action: 'upload',
    details: JSON.stringify({ size: file.size, type: file.type }),
  });
  
  return Response.json({ success: true, file: fileRecord });
}

// app/api/v1/files/list/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const category = searchParams.get('category');
  const tags = searchParams.get('tags')?.split(',') || [];
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  const files = await convex.query(api.files.list, {
    organizationId,
    category,
    tags,
    limit,
    offset,
  });
  
  return Response.json({ files, total: files.length });
}
```

---

## 💾 **R2 Integration Layer**

```typescript
// lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class R2FileManager {
  private client: S3Client;
  private bucketName: string;
  
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.R2_BUCKET_NAME!;
  }
  
  async uploadFile(key: string, file: File | Buffer, mimeType?: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file instanceof File ? await file.arrayBuffer() : file,
      ContentType: mimeType || (file instanceof File ? file.type : 'application/octet-stream'),
    });
    
    return await this.client.send(command);
  }
  
  async getFile(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    
    return await this.client.send(command);
  }
  
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    
    return await this.client.send(command);
  }
  
  async copyFile(sourceKey: string, destinationKey: string) {
    // Implementation for copy operation
  }
  
  async moveFile(sourceKey: string, destinationKey: string) {
    await this.copyFile(sourceKey, destinationKey);
    await this.deleteFile(sourceKey);
  }
  
  async listFiles(prefix: string) {
    // Implementation for listing files
  }
  
  async getBucketInfo() {
    // Implementation for bucket statistics
  }
}

export const r2Manager = new R2FileManager();
```

---

## 🎨 **Frontend Components**

```typescript
// components/FileUpload.tsx
interface FileUploadProps {
  organizationId: string;
  category: 'uploads' | 'creations';
  subcategory?: string;
  onUploadComplete: (files: FileRecord[]) => void;
}

export function FileUpload({ organizationId, category, subcategory, onUploadComplete }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);
      formData.append('category', category);
      formData.append('subcategory', subcategory || '');
      formData.append('tags', JSON.stringify([]));
      
      const response = await fetch('/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      return response.json();
    });
    
    try {
      const results = await Promise.all(uploadPromises);
      onUploadComplete(results.map(r => r.file));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="file-upload-area">
      <input
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        disabled={isUploading}
      />
      {isUploading && <div>Uploading files...</div>}
    </div>
  );
}

// components/FileBrowser.tsx
export function FileBrowser({ organizationId }: { organizationId: string }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { data, isLoading } = useQuery(api.files.list, {
    organizationId,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    tags: selectedTags,
  });
  
  useEffect(() => {
    if (data) setFiles(data);
  }, [data]);
  
  return (
    <div className="file-browser">
      <div className="file-filters">
        <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} />
        <TagFilter value={selectedTags} onChange={setSelectedTags} />
      </div>
      
      <div className="file-grid">
        {files.map((file) => (
          <FileCard key={file._id} file={file} />
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 **Performance & Scaling Considerations**

### **Optimization Strategies**
1. **CDN Integration**: Cloudflare CDN for global file delivery
2. **Lazy Loading**: Load file metadata on demand
3. **Caching**: Redis cache for frequently accessed metadata
4. **Compression**: Automatic image/video compression
5. **Thumbnail Generation**: Create thumbnails for videos/images
6. **Streaming**: Video streaming with progressive loading

### **Storage Optimization**
```typescript
// Automatic file compression
const optimizeFile = async (file: File): Promise<File> => {
  if (file.type.startsWith('image/')) {
    return await compressImage(file, { quality: 0.8, maxWidth: 1920 });
  }
  if (file.type.startsWith('video/')) {
    return await compressVideo(file, { quality: 'medium' });
  }
  return file;
};
```

---

## 🔒 **Security & Permissions**

### **Access Control Matrix**
```typescript
interface FilePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canDownload: boolean;
}

const getFilePermissions = async (
  userId: string,
  fileId: string,
  organizationId: string
): Promise<FilePermissions> => {
  const user = await convex.query(api.users.get, { id: userId });
  const file = await convex.query(api.files.get, { id: fileId });
  const org = await convex.query(api.organizations.get, { id: organizationId });
  
  const isOwner = org.ownerId === userId;
  const isFileUploader = file.uploadedBy === userId;
  const isOrgMember = org.memberIds.includes(userId);
  
  return {
    canView: isOrgMember,
    canEdit: isOwner || isFileUploader,
    canDelete: isOwner || isFileUploader,
    canShare: isOrgMember,
    canDownload: isOrgMember,
  };
};
```

---

## 📈 **Implementation Steps**

### **Phase 1: Foundation (Week 1-2)**
1. ✅ Set up Cloudflare R2 bucket and credentials
2. ✅ Create Convex schema for files and organizations
3. ✅ Implement basic file upload/download API
4. ✅ Create file metadata management
5. ✅ Set up authentication with organizations

### **Phase 2: Core Features (Week 3-4)**
1. ✅ Implement file browser UI
2. ✅ Add tagging system
3. ✅ Create file organization (categories, subcategories)
4. ✅ Implement search and filtering
5. ✅ Add file preview capabilities

### **Phase 3: Advanced Features (Week 5-6)**
1. ✅ Implement file versioning
2. ✅ Add bulk operations
3. ✅ Create file sharing and collaboration
4. ✅ Implement activity tracking
5. ✅ Add storage usage analytics

### **Phase 4: Optimization (Week 7-8)**
1. ✅ Implement CDN integration
2. ✅ Add file compression and optimization
3. ✅ Create thumbnail generation
4. ✅ Implement streaming for large files
5. ✅ Add performance monitoring

---

## 💡 **Additional Features**

### **AI-Powered Features**
- **Auto-tagging**: AI analyzes files and suggests tags
- **Duplicate detection**: Find similar files
- **Content analysis**: Extract text, objects, scenes from images/videos
- **Smart recommendations**: Suggest related files

### **Advanced Organization**
- **Smart folders**: Dynamic folders based on criteria
- **Workflows**: Automated file processing pipelines
- **Integrations**: Connect with external tools (Adobe, Figma)
- **Export options**: Multiple format exports

---

## 🎯 **Success Metrics**

### **Performance KPIs**
- File upload speed: < 5 seconds for 100MB files
- Search response time: < 500ms
- File load time: < 2 seconds
- Storage utilization: > 80% efficiency

### **User Experience KPIs**
- User satisfaction: > 4.5/5
- File organization efficiency: 50% time saved
- Collaboration improvement: 30% faster project completion
- Error rate: < 1% for file operations

---

## 🔧 **Monitoring & Analytics**

```typescript
// File operation tracking
const trackFileOperation = async (operation: string, metadata: any) => {
  await convex.mutation(api.analytics.track, {
    event: `file_${operation}`,
    metadata,
    timestamp: Date.now(),
  });
};

// Storage usage monitoring
const monitorStorageUsage = async (organizationId: string) => {
  const usage = await convex.query(api.organizations.getStorageUsage, { organizationId });
  
  if (usage.percentage > 80) {
    await sendNotification(organizationId, 'storage_warning', {
      used: usage.used,
      limit: usage.limit,
    });
  }
};
```

---

## 🚀 **Next Steps**

1. **Immediate**: Set up R2 bucket and Convex schema
2. **Week 1**: Implement basic file operations
3. **Week 2**: Create frontend components
4. **Week 3**: Add tagging and organization
5. **Week 4**: Implement collaboration features

This design provides a robust, scalable file management system specifically tailored for storyboard production workflows, with intelligent organization, real-time collaboration, and enterprise-grade performance.