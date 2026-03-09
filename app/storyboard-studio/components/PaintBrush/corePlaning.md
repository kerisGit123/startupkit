# Storyboard Studio — Core Planning (Orchestrator)

## 📋 Brief Description

**Storyboard Studio** is a SaaS platform for TikTok and YouTube story channel creators in Southeast Asia. Users create storyboards, generate AI images per frame, then convert those images into short-form videos — all inside one workspace.

Clerk Organizations handle team management: one billing account per org, individual staff usage tracking, and admin visibility into what each member generates. This lets small studios run 5–10 creators under a single subscription instead of juggling separate accounts.

**Core flow:**

```
Script (manual or GPT-5.2) → Storyboard Items → AI Images (Kie AI) → AI Videos (Veo-3-1 / Kling 3.0)
```

**Target users:** TikTok story creators, YouTube Shorts channels, small animation studios, freelance content teams — primarily Malaysia / SEA / Asia.

---

## 🎯 Key Features

### Storyboard & Script *(storyboardplanning.md)*

- 2-level structure: Project (with embedded script + scenes) → StoryboardItems
- AI script generation with camera, lighting, perspective, action details
- Drag-and-drop frame reordering, annotations, element overlays
- Layout templates: comic, film, timeline

### Image Generation *(imageAIPanel.md)*

- Kie AI integration via unified API gateway
- Style presets: realistic, cartoon, anime, cinematic
- Prompt enhancement via GPT-5.2
- Batch generation for entire storyboards
- Character consistency across frames

### Video Generation *(videoAIPanel.md)*

- 2 models: Veo-3-1 (fixed price, premium) + Kling 3.0 (per-second, flexible)
- Image-to-video, text-to-video, lip-sync, multi-shot modes
- Direct storyboard item integration — one click from frame to video
- Async callback-based generation with status polling

### File & Asset Management *(filePlaning.md)*

- Cloudflare R2 project-based storage
- LTX-style element library (character, object, logo, font, style)
- Upload, generated, element, storyboard, video folders per project
- File tagging and search

### Team & Billing (Clerk Organizations)

- Org-level subscription, one invoice
- Per-member credit usage tracking
- Admin dashboard: see what each staff member generates
- Role-based access: admin, editor, viewer
- Individual performance + cost analytics

---

## 🛠️ Tech Stack (Single Source of Truth)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14+ (App Router) | SSR, routing, API routes |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS + Framer Motion | UI + animations |
| Components | Radix UI, Lucide, Sonner, Dnd Kit | Primitives, icons, toasts, drag-drop |
| State | Zustand | Local state management |
| Database | Convex | Real-time DB, mutations, queries, scheduling |
| Auth | Clerk (Organizations) | Multi-tenant auth, org billing, roles |
| Storage | Cloudflare R2 | File storage (zero egress) |
| Script AI | GPT-5.2 API | Script generation with technical details |
| Image AI | Kie AI API | Image generation (multiple styles) |
| Video AI | Kie AI API (Veo-3-1 + Kling 3.0) | Video generation |
| CDN | Cloudflare | Global delivery |

---

## 🗄️ Unified Database Schema (Single Source of Truth)

All 4 files reference this schema. Do NOT duplicate it — link back here.

```typescript
// ============================================
// TABLE 1: projects (2-level: project = storyboard)
// Owner: storyboardplanning.md
// Used by: ALL files
// ============================================
projects: defineTable({
  // --- Identity ---
  name: v.string(),
  description: v.optional(v.string()),
  orgId: v.string(),           // Clerk organization ID
  ownerId: v.string(),         // Clerk user ID (creator)
  teamMemberIds: v.array(v.string()), // Clerk user IDs
  status: v.string(),          // draft | active | completed | archived
  tags: v.array(v.string()),   // for filtering: ["tiktok", "horror", "comedy"]

  // --- Script (embedded) ---
  script: v.string(),
  scenes: v.array(v.object({
    id: v.string(),
    title: v.string(),
    content: v.string(),
    characters: v.array(v.string()),
    locations: v.array(v.string()),
    technical: v.optional(v.object({
      camera: v.array(v.string()),
      lighting: v.array(v.string()),
      perspective: v.array(v.string()),
      action: v.array(v.string()),
    })),
  })),

  // --- Settings ---
  settings: v.object({
    frameRatio: v.string(),    // "9:16" (TikTok), "16:9" (YouTube), "1:1"
    style: v.string(),         // "realistic", "cartoon", "anime", "cinematic"
    layout: v.string(),        // "grid", "timeline", "comic"
  }),

  metadata: v.object({
    sceneCount: v.number(),
    estimatedDuration: v.number(),
    aiModel: v.string(),       // "gpt-5.2"
  }),

  isAIGenerated: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_org", ["orgId"])
.index("by_owner", ["orgId", "ownerId"])
.index("by_status", ["orgId", "status"])
.index("by_tags", ["tags"]),

// ============================================
// TABLE 2: storyboardItems (frames)
// Owner: storyboardplanning.md
// Used by: imageAIPanel.md, videoAIPanel.md, filePlaning.md
// ============================================
storyboardItems: defineTable({
  projectId: v.id("projects"),
  sceneId: v.string(),
  order: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  duration: v.number(),

  // --- Media ---
  imageUrl: v.optional(v.string()),
  imagePrompt: v.optional(v.string()),
  videoUrl: v.optional(v.string()),
  audioUrl: v.optional(v.string()),

  // --- Image generation metadata (imageAIPanel) ---
  imageGeneration: v.optional(v.object({
    model: v.string(),
    creditsUsed: v.number(),
    status: v.string(),        // pending | generating | completed | failed
    taskId: v.optional(v.string()),
  })),

  // --- Video generation metadata (videoAIPanel) ---
  videoGeneration: v.optional(v.object({
    model: v.string(),         // "veo-3-1" | "kling-3.0"
    mode: v.string(),          // "image-to-video" | "text-to-video" | "lip-sync"
    quality: v.string(),
    duration: v.number(),
    creditsUsed: v.number(),
    status: v.string(),        // pending | generating | completed | failed
    taskId: v.optional(v.string()),
  })),

  // --- Overlays ---
  elements: v.array(v.object({
    id: v.string(),
    type: v.string(),          // "text" | "character" | "prop" | "shape"
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    size: v.object({ width: v.number(), height: v.number() }),
    elementId: v.optional(v.id("elements")),
  })),

  annotations: v.array(v.object({
    id: v.string(),
    content: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    author: v.string(),
    createdAt: v.number(),
  })),

  generatedBy: v.string(),     // Clerk user ID — who generated this
  isAIGenerated: v.boolean(),
  generationStatus: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_project", ["projectId"])
.index("by_order", ["projectId", "order"]),

// ============================================
// TABLE 3: files (R2 storage records)
// Owner: filePlaning.md
// Used by: imageAIPanel.md, videoAIPanel.md
// ============================================
files: defineTable({
  projectId: v.id("projects"),
  r2Key: v.string(),
  filename: v.string(),
  fileType: v.string(),        // image | video | audio
  mimeType: v.string(),
  size: v.number(),
  category: v.string(),        // uploads | generated | elements | storyboard | videos
  tags: v.array(v.string()),

  uploadedBy: v.string(),      // Clerk user ID
  uploadedAt: v.number(),
  status: v.string(),          // uploading | ready | error
  createdAt: v.number(),
})
.index("by_project", ["projectId"])
.index("by_category", ["projectId", "category"]),

// ============================================
// TABLE 4: elements (LTX-style reusable assets)
// Owner: filePlaning.md
// Used by: storyboardplanning.md, imageAIPanel.md, videoAIPanel.md
// ============================================
elements: defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  type: v.string(),            // character | object | logo | font | style
  description: v.optional(v.string()),
  thumbnailUrl: v.string(),
  referenceUrls: v.array(v.string()),
  tags: v.array(v.string()),

  createdBy: v.string(),       // Clerk user ID
  usageCount: v.number(),
  status: v.string(),          // draft | ready | archived
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_project", ["projectId"])
.index("by_type", ["projectId", "type"]),

// ============================================
// TABLE 5: creditUsage (per-member cost tracking)
// Owner: corePlaning.md
// Used by: imageAIPanel.md, videoAIPanel.md
// ============================================
creditUsage: defineTable({
  orgId: v.string(),           // Clerk org
  userId: v.string(),          // Clerk user
  projectId: v.id("projects"),
  itemId: v.optional(v.id("storyboardItems")),
  action: v.string(),          // "script_generation" | "image_generation" | "video_generation"
  model: v.string(),           // "gpt-5.2" | "kie-pro-v2" | "veo-3-1" | "kling-3.0"
  creditsUsed: v.number(),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
})
.index("by_org", ["orgId"])
.index("by_user", ["orgId", "userId"])
.index("by_project", ["projectId"]),
```

---

## 🔗 File Interrelationship Map

```
                    ┌──────────────────────┐
                    │   corePlaning.md      │
                    │   (this file)         │
                    │   - Unified schema    │
                    │   - Tech stack        │
                    │   - Impl. order       │
                    │   - Team/billing      │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ storyboard       │ │ imageAIPanel.md  │ │ videoAIPanel.md  │
│ planning.md      │ │                  │ │                  │
│                  │ │ - Kie AI config  │ │ - Veo/Kling API  │
│ - Project CRUD   │ │ - Prompt enhance │ │ - Pricing model  │
│ - Script gen     │ │ - Style presets  │ │ - Modes (i2v,    │
│ - Scene parsing  │ │ - Batch gen      │ │   t2v, lipsync)  │
│ - Editor UI      │ │ - UI panel       │ │ - Callback flow  │
│ - Item CRUD      │ │                  │ │ - UI panel       │
│                  │ │  Reads:          │ │                  │
│  Reads:          │ │  storyboardItems │ │  Reads:          │
│  projects,       │ │  projects,       │ │  storyboardItems │
│  storyboardItems │ │  files, elements │ │  projects, files │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  filePlaning.md     │
                    │                    │
                    │  - R2 bucket ops   │
                    │  - Upload/download │
                    │  - Element CRUD    │
                    │  - File browser UI │
                    │                    │
                    │  Reads:            │
                    │  files, elements   │
                    └────────────────────┘
```

### Data flow:

```
User writes/generates script  ──► storyboardplanning.md (projects table)
       │
       ▼
Scenes parsed into items      ──► storyboardplanning.md (storyboardItems table)
       │
       ▼
Each item gets AI image       ──► imageAIPanel.md → Kie AI → R2 → storyboardItems.imageUrl
       │
       ▼
Each item gets AI video       ──► videoAIPanel.md → Veo/Kling → R2 → storyboardItems.videoUrl
       │
       ▼
All files stored in R2        ──► filePlaning.md (files table, elements table)
       │
       ▼
Every AI action logs credits  ──► corePlaning.md (creditUsage table)
```

---

## 🏗️ Implementation Order

### Phase 1 — Foundation (Week 1–2) ⚡ START HERE

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Convex schema (all 5 tables from this file) | corePlaning.md | P0 |
| 2 | Clerk org setup (org creation, roles, invite) | corePlaning.md | P0 |
| 3 | Project CRUD (create, list, update, delete) | storyboardplanning.md | P0 |
| 4 | R2 bucket setup + upload/download | filePlaning.md | P0 |
| 5 | Project dashboard UI (list projects, create) | storyboardplanning.md | P0 |

### Phase 2 — Script & Storyboard (Week 3–4)

| # | Task | File | Priority |
|---|------|------|----------|
| 6 | Script editor (manual write) | storyboardplanning.md | P0 |
| 7 | AI script generation (GPT-5.2) | storyboardplanning.md | P1 |
| 8 | Scene parser (script → scenes → items) | storyboardplanning.md | P0 |
| 9 | Storyboard editor UI (frame grid, reorder) | storyboardplanning.md | P0 |
| 10 | StoryboardItem component (frame card) | storyboardplanning.md | P0 |

### Phase 3 — Image AI (Week 5–6)

| # | Task | File | Priority |
|---|------|------|----------|
| 11 | Kie AI API integration | imageAIPanel.md | P0 |
| 12 | Image generation for single item | imageAIPanel.md | P0 |
| 13 | Batch generation (all items) | imageAIPanel.md | P1 |
| 14 | Style presets UI | imageAIPanel.md | P1 |
| 15 | Credit logging per generation | corePlaning.md | P0 |

### Phase 4 — Video AI (Week 7–8)

| # | Task | File | Priority |
|---|------|------|----------|
| 16 | Veo-3-1 API integration | videoAIPanel.md | P0 |
| 17 | Kling 3.0 API integration | videoAIPanel.md | P1 |
| 18 | Image-to-video from storyboard item | videoAIPanel.md | P0 |
| 19 | Callback handler + status polling | videoAIPanel.md | P0 |
| 20 | Video panel UI | videoAIPanel.md | P1 |

### Phase 5 — Team & Billing (Week 9–10)

| # | Task | File | Priority |
|---|------|------|----------|
| 21 | Admin dashboard (org usage overview) | corePlaning.md | P0 |
| 22 | Per-member credit usage report | corePlaning.md | P0 |
| 23 | Cost analytics (by project, by member) | corePlaning.md | P1 |
| 24 | Role-based access (admin/editor/viewer) | corePlaning.md | P1 |

### Phase 6 — Polish (Week 11–12)

| # | Task | File | Priority |
|---|------|------|----------|
| 25 | Element library (LTX-style) | filePlaning.md | P2 |
| 26 | Export (PDF storyboard, MP4 compilation) | storyboardplanning.md | P2 |
| 27 | File browser UI | filePlaning.md | P2 |
| 28 | Character consistency system | imageAIPanel.md | P2 |

---

## 👥 Clerk Organization — Team & Billing Design

### Organization Structure

```typescript
// Clerk Organization mapping
// org.id → projects.orgId
// user.id → projects.ownerId, storyboardItems.generatedBy, creditUsage.userId

// Roles:
// "org:admin"  → full access, billing, see all staff usage
// "org:editor" → create/edit projects, generate content
// "org:viewer" → view-only access to projects
```

### Admin Dashboard Queries

```typescript
// convex/creditUsage.ts

// Total org usage this month
export const getOrgUsage = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const startOfMonth = getStartOfMonth();
    return await ctx.db.query("creditUsage")
      .withIndex("by_org", q => q.eq("orgId", orgId))
      .filter(q => q.gte(q.field("createdAt"), startOfMonth))
      .collect();
  },
});

// Per-member breakdown
export const getMemberUsage = query({
  args: { orgId: v.string(), userId: v.string() },
  handler: async (ctx, { orgId, userId }) => {
    return await ctx.db.query("creditUsage")
      .withIndex("by_user", q => q.eq("orgId", orgId).eq("userId", userId))
      .collect();
  },
});

// Log every AI action
export const logCreditUsage = mutation({
  args: {
    orgId: v.string(),
    userId: v.string(),
    projectId: v.id("projects"),
    itemId: v.optional(v.id("storyboardItems")),
    action: v.string(),
    model: v.string(),
    creditsUsed: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("creditUsage", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
```

### What Admin Can See

- **Total credits used** this month by org
- **Per-member breakdown**: who used how much, on what
- **Per-project cost**: total credits spent on each project
- **Generation history**: what each member generated (images, videos)
- **Action type split**: how much on scripts vs images vs videos

---

## 📏 Simplification Rules (Applied to All 4 Files)

1. **Schema lives here only** — other files reference `corePlaning.md` for schema, they do NOT duplicate it
2. **No Korean-specific language** — we target SEA/Asia broadly; multi-language support, not Korean-first
3. **Aspect ratios default to 9:16** (TikTok) and 16:9 (YouTube), not film ratios
4. **Clerk org ID on every query** — all data is org-scoped for multi-tenancy
5. **generatedBy on storyboardItems** — track which team member generated each frame
6. **creditUsage logged on every AI call** — script gen, image gen, video gen
7. **No over-engineered elements** — start simple, add LTX-style elements in Phase 6
8. **One API gateway** — all Kie AI calls (image + video) go through same API key/callback pattern

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Script generation | < 20s |
| Image per frame | < 30s |
| Video per frame | < 3 min |
| Storyboard (10 frames) | < 5 min end-to-end |
| Org admin dashboard load | < 2s |
| Monthly active orgs | > 100 (6 months) |
