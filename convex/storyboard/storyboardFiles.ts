import { mutation, query, internalMutation } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
  storageByCompany,
  storageByCategory,
  storageByFileType,
  syncFileAggregates,
} from "./aggregates";

export const logUpload = mutation({
  args: {
    companyId: v.optional(v.string()), // Accept companyId from caller (optional to match schema)
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()), // Make userId optional - companyId should be sufficient
    projectId: v.optional(v.id("storyboard_projects")),
    r2Key: v.optional(v.string()), // Optional for AI files
    filename: v.string(),
    fileType: v.string(),
    mimeType: v.string(),
    size: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
    uploadedBy: v.optional(v.string()), // Make uploadedBy optional too
    status: v.string(),
    categoryId: v.optional(v.union(
      v.id("storyboard_elements"),     // Parent element ID
      v.id("storyboard_items"),        // Parent storyboard item ID  
      v.id("storyboard_projects"),     // Parent project ID
      v.null()                         // No parent
    )), // Parent entity ID for cleanup
    
    // NEW: Enhanced fields for AI generation
    creditsUsed: v.optional(v.number()),   // Credits consumed for this file
    taskId: v.optional(v.string()),       // KIE AI task ID (only for category="generated")
    sourceUrl: v.optional(v.string()),     // KIE AI link (set by callback)
    metadata: v.optional(v.any()),         // Generation metadata for compositing
    defaultAI: v.optional(v.id("storyboard_kie_ai")), // Which KIE AI key was used
    model: v.optional(v.string()),                    // AI model used for generation
    prompt: v.optional(v.string()),                   // AI generation prompt used
    aspectRatio: v.optional(v.string()),              // "16:9" | "9:16" | "1:1" etc.
  },
  handler: async (ctx, args) => {
    const { companyId, userId, ...restArgs } = args;

    if (!companyId) {
      throw new Error("Company ID is required");
    }
    
    const insertData: any = {
      ...restArgs,
      companyId: companyId, // Use provided companyId exactly as provided
      userId: userId || companyId, // Use userId or fallback to companyId
      uploadedAt: Date.now(),
      createdAt: Date.now(),
      isFavorite: false, // Default to not favorited
      
      // Handle r2Key - AI files don't have R2 keys initially
      r2Key: restArgs.r2Key, // Keep undefined for AI files
      
      // Include new fields if provided
      creditsUsed: restArgs.creditsUsed,
      sourceUrl: restArgs.sourceUrl,
      metadata: restArgs.metadata,
    };
    
    // Remove undefined values to satisfy schema
    Object.keys(insertData).forEach(key => {
      if (insertData[key] === undefined) {
        delete insertData[key];
      }
    });

    const fileId = await ctx.db.insert("storyboard_files", insertData);
    const inserted = await ctx.db.get(fileId);
    if (inserted) await syncFileAggregates(ctx, null, inserted);
    return fileId;
  },
});

export const getById = query({
  args: { id: v.id("storyboard_files") },
  handler: async (ctx, { id }) => {
    const file = await ctx.db.get(id);
    if (!file) return null;
    
    console.log("File details:", { 
      filename: file.filename, 
      isFavorite: file.isFavorite,
      id: file._id 
    });
    
    return file;
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_files") },
  handler: async (ctx, { id }) => {
    const file = await ctx.db.get(id);
    if (!file) return;

    // Ownership check when called from client (has auth context).
    // Server-side API routes use ConvexHttpClient without auth and enforce
    // ownership themselves before calling this mutation.
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const callerCompanyId = (identity as any).org_id ?? identity.subject;
      const fileOwner = file.companyId || file.uploadedBy;
      if (fileOwner && fileOwner !== callerCompanyId && fileOwner !== identity.subject) {
        throw new Error("Forbidden: you do not own this file");
      }
    }

    // Soft delete — keep record for credit audit trail
    await ctx.db.patch(id, {
      r2Key: "",
      sourceUrl: "",
      status: "deleted",
      deletedAt: Date.now(),
      size: 0,
      isShared: false,
      tags: [],
      isFavorite: false,
    });

    const after = await ctx.db.get(id);
    await syncFileAggregates(ctx, file, after);
  },
});

export const toggleFavorite = mutation({
  args: { id: v.id("storyboard_files") },
  handler: async (ctx, { id }) => {
    console.log("toggleFavorite called with id:", id);
    
    const file = await ctx.db.get(id);
    if (!file) {
      console.log("File not found for id:", id);
      throw new Error("File not found");
    }
    
    console.log("File found:", { filename: file.filename, isFavorite: file.isFavorite });
    
    const currentFavorite = file.isFavorite ?? false; // Default to false if undefined
    const newFavorite = !currentFavorite;
    
    console.log("Changing favorite from:", currentFavorite, "to:", newFavorite);
    
    await ctx.db.patch(id, {
      isFavorite: newFavorite,
    });
    
    console.log("Successfully updated favorite status");
    return newFavorite;
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_files"),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    defaultAI: v.optional(v.id("storyboard_kie_ai")),
    taskId: v.optional(v.string()),
    responseCode: v.optional(v.number()),
    responseMessage: v.optional(v.string()),
  },
  handler: async (ctx, { id, category, status, defaultAI, taskId, responseCode, responseMessage }) => {
    const file = await ctx.db.get(id);
    if (!file) {
      throw new Error("File not found");
    }

    const updateData: any = {};
    if (category !== undefined) {
      updateData.category = category;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (defaultAI !== undefined) {
      updateData.defaultAI = defaultAI;
    }
    if (taskId !== undefined) {
      updateData.taskId = taskId;
    }
    if (responseCode !== undefined) {
      updateData.responseCode = responseCode;
    }
    if (responseMessage !== undefined) {
      updateData.responseMessage = responseMessage;
    }

    await ctx.db.patch(id, updateData);

    const after = await ctx.db.get(id);
    await syncFileAggregates(ctx, file, after);

    return { success: true };
  },
});

export const updateCategory = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    categoryId: v.optional(v.union(
      v.id("storyboard_elements"),     // Parent element ID
      v.id("storyboard_items"),        // Parent storyboard item ID  
      v.id("storyboard_projects"),     // Parent project ID
      v.null()                         // No parent
    )),
  },
  handler: async (ctx, { fileId, categoryId }) => {
    const file = await ctx.db.get(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    
    await ctx.db.patch(fileId, { categoryId });
    return { success: true, fileId, categoryId };
  },
});

export const deleteWithR2 = mutation({
  args: { id: v.id("storyboard_files") },
  handler: async (ctx, { id }) => {
    const file = await ctx.db.get(id);
    if (!file) throw new Error("File not found");

    // Ownership check when called from client (has auth context).
    // Server-side API routes use ConvexHttpClient without auth and enforce
    // ownership themselves before calling this mutation.
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const callerCompanyId = (identity as any).org_id ?? identity.subject;
      const fileOwner = file.companyId || file.uploadedBy;
      if (fileOwner && fileOwner !== callerCompanyId && fileOwner !== identity.subject) {
        throw new Error("Forbidden: you do not own this file");
      }
    }

    // TODO: Delete from R2 bucket
    // This would require R2 admin credentials or a separate API route

    // Delete from database
    await ctx.db.delete(id);

    await syncFileAggregates(ctx, file, null);

    return file.r2Key;
  },
});

export const listByCategories = query({
  args: {
    companyId: v.string(),
    categories: v.array(v.string()), // Array of categories to include
  },
  handler: async (ctx, { companyId, categories }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "deleted"),
          q.or(
            ...categories.map(category => q.eq(q.field("category"), category))
          )
        )
      )
      .collect();
  },
});

export const listByCategory = query({
  args: {
    companyId: v.string(),
    category: v.string(), // 'temps', 'uploads', 'generated', 'elements', 'storyboard', 'videos'
  },
  handler: async (ctx, { companyId, category }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId_category", (q) =>
        q.eq("companyId", companyId).eq("category", category)
      )
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .collect();
  },
});

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("storyboard_files").order("desc").collect();
  },
});

export const listByCompany = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .collect();
    return files;
  },
});

export const listFiltered = query({
  args: {
    companyId: v.string(),
    category: v.optional(v.string()),
    fileType: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Special case: temps files have NO companyId — query by category directly
    if (args.category === "temps") {
      let tempsQuery = ctx.db
        .query("storyboard_files")
        .filter((q) => q.and(
          q.eq(q.field("category"), "temps"),
          q.neq(q.field("status"), "deleted")
        ));

      if (args.fileType) {
        const ft = args.fileType;
        tempsQuery = tempsQuery.filter((q) => q.eq(q.field("fileType"), ft));
      }

      const results = await tempsQuery.order("desc").paginate(args.paginationOpts);

      if (args.searchTerm) {
        const term = args.searchTerm.toLowerCase();
        return { ...results, page: results.page.filter((file) => file.filename.toLowerCase().includes(term)) };
      }
      return results;
    }

    // Normal case: use by_companyId index
    let baseQuery = ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.neq(q.field("status"), "deleted"));

    // Apply server-side filters
    if (args.category && args.fileType) {
      const cat = args.category;
      const ft = args.fileType;
      baseQuery = baseQuery.filter((q) =>
        q.and(q.eq(q.field("category"), cat), q.eq(q.field("fileType"), ft))
      );
    } else if (args.category) {
      const cat = args.category;
      baseQuery = baseQuery.filter((q) => q.eq(q.field("category"), cat));
    } else if (args.fileType) {
      const ft = args.fileType;
      baseQuery = baseQuery.filter((q) => q.eq(q.field("fileType"), ft));
    }

    const results = await baseQuery.order("desc").paginate(args.paginationOpts);

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      return { ...results, page: results.page.filter((file) => file.filename.toLowerCase().includes(term)) };
    }

    return results;
  },
});

export const listByCategoryId = query({
  args: { 
    categoryId: v.optional(v.union(
      v.id("storyboard_elements"),     // Parent element ID
      v.id("storyboard_items"),        // Parent storyboard item ID  
      v.id("storyboard_projects"),     // Parent project ID
      v.null()                         // No parent
    ))
  },
  handler: async (ctx, { categoryId }) => {
    if (!categoryId) {
      // Return files with no categoryId (orphaned files)
      const files = await ctx.db
        .query("storyboard_files")
        .filter((q) => q.eq(q.field("categoryId"), undefined))
        .collect();
      return files;
    }
    
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", categoryId))
      .collect();
    return files;
  },
});

export const listByOrg = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    return await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .order("desc")
      .collect();
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("storyboard_projects"),
    category: v.optional(v.string())
  },
  handler: async (ctx, { projectId, category }) => {
    if (category) {
      return await ctx.db
        .query("storyboard_files")
        .withIndex("by_category", (q) =>
          q.eq("projectId", projectId).eq("category", category)
        )
        .filter((q) => q.neq(q.field("status"), "deleted"))
        .collect();
    }

    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .collect();
  },
});

export const listByCategoryAndProject = query({
  args: { 
    companyId: v.string(),
    projectId: v.string(),
    category: v.string()
  },
  handler: async (ctx, { companyId, projectId, category }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => 
        q.eq("companyId", companyId)
      )
      .filter((q) => 
        q.and(
          q.eq(q.field("projectId"), projectId),
          q.eq(q.field("category"), category)
        )
      )
      .collect();
  },
});

export const getByR2Key = query({
  args: { r2Key: v.string() },
  handler: async (ctx, { r2Key }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_r2Key", (q) => q.eq("r2Key", r2Key))
      .first();
  },
});

// Migration: convert old "music" fileType back to "audio" (music/audio merged)
export const migrateMusicToAudio = mutation({
  handler: async (ctx) => {
    const allFiles = await ctx.db.query("storyboard_files").collect();
    let updated = 0;
    for (const file of allFiles) {
      if (file.fileType === "music") {
        await ctx.db.patch(file._id, { fileType: "audio" });
        updated++;
      }
    }
    return { updated, total: allFiles.length };
  },
});

// Migration: fix category "uploaded" → "uploads"
export const migrateUploadedToUploads = mutation({
  handler: async (ctx) => {
    const allFiles = await ctx.db.query("storyboard_files").collect();
    let updated = 0;
    for (const file of allFiles) {
      if (file.category === "uploaded") {
        await ctx.db.patch(file._id, { category: "uploads" });
        updated++;
      }
    }
    return { updated, total: allFiles.length };
  },
});

// List completed audio files for Extend Music dropdown
export const listAudioFiles = query({
  args: {
    companyId: v.string(),
    categoryId: v.optional(v.string()),
  },
  handler: async (ctx, { companyId, categoryId }) => {
    // Use by_companyId index + server-side filter for fileType/status
    // instead of fetching ALL company files then filtering in JS
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .filter((q) =>
        q.and(
          q.eq(q.field("fileType"), "audio"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();
    return files
      .filter(f =>
        f.metadata?.audioId &&
        (!categoryId || String(f.categoryId) === categoryId)
      )
      .map(f => ({
        _id: f._id,
        audioId: (f.metadata as any)?.audioId as string,
        name: (f.metadata as any)?.musicTitle || f.filename || "Untitled",
        duration: (f.metadata as any)?.musicDuration,
        model: f.model,
        taskId: f.taskId,
        sourceUrl: f.sourceUrl,
        prompt: f.prompt,
        personaCreated: !!(f.metadata as any)?.personaCreated,
      }))
      .sort((a, b) => (b.name > a.name ? -1 : 1));
  },
});

// Rename a file (also updates metadata.musicTitle for audio files)
export const renameFile = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    const updates: any = { filename: args.filename };
    // Also update musicTitle in metadata for audio files
    if (file?.metadata) {
      updates.metadata = { ...file.metadata, musicTitle: args.filename };
    }
    await ctx.db.patch(args.fileId, updates);
  },
});

// Update file record from KIE AI callback
export const updateFromCallback = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    sourceUrl: v.optional(v.string()),
    taskId: v.optional(v.string()),
    status: v.string(),
    r2Key: v.optional(v.string()),
    metadata: v.optional(v.any()),
    size: v.optional(v.number()),
    responseCode: v.optional(v.number()),
    responseMessage: v.optional(v.string()),
    creditsUsed: v.optional(v.number()), // Set to 0 after refund
    fileType: v.optional(v.string()), // Override fileType (e.g. when audio detected from URL)
    // Gallery sharing fields (auto-share for free users)
    isShared: v.optional(v.boolean()),
    sharedAt: v.optional(v.number()),
    sharedBy: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
  },
  handler: async (ctx, { fileId, sourceUrl, taskId, status, r2Key, metadata, size, responseCode, responseMessage, creditsUsed, fileType, isShared, sharedAt, sharedBy, aspectRatio }) => {
    const updateData: any = { status };

    if (sourceUrl) {
      updateData.sourceUrl = sourceUrl;
    }

    if (taskId) {
      updateData.taskId = taskId;
    }

    if (r2Key) {
      updateData.r2Key = r2Key;
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    if (size !== undefined) {
      updateData.size = size;
    }

    if (fileType) {
      updateData.fileType = fileType;
    }

    if (responseCode !== undefined) {
      updateData.responseCode = responseCode;
    }

    if (responseMessage !== undefined) {
      updateData.responseMessage = responseMessage;
    }

    if (creditsUsed !== undefined) {
      updateData.creditsUsed = creditsUsed;
    }

    // Gallery sharing fields
    if (isShared !== undefined) updateData.isShared = isShared;
    if (sharedAt !== undefined) updateData.sharedAt = sharedAt;
    if (sharedBy !== undefined) updateData.sharedBy = sharedBy;
    if (aspectRatio !== undefined) updateData.aspectRatio = aspectRatio;

    const before = await ctx.db.get(fileId);
    await ctx.db.patch(fileId, updateData);
    const after = await ctx.db.get(fileId);
    await syncFileAggregates(ctx, before, after);

    return { success: true };
  },
});

// Removed: migrateCreditUsage — one-time migration that read from the
// deleted storyboard_credit_usage table. Already run; no longer needed.

// ── Logs: total storage usage by company ─────────────────────────────────
// Reads from the aggregate component — O(log n) tree walks instead of a
// full table scan. Aggregates are maintained by syncFileAggregates in each
// mutation path. If a new category/fileType appears that isn't in the
// hardcoded list below, its breakdown row is omitted but the total still
// reflects it via storageByCompany.
const KNOWN_CATEGORIES = ["uploads", "generated", "elements", "storyboard", "videos", "temps", "other"];
const KNOWN_FILE_TYPES = ["image", "video", "audio", "other"];

export const getStorageUsage = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const namespace = args.companyId;

    const [totalFiles, totalSize] = await Promise.all([
      storageByCompany.count(ctx, { namespace }),
      storageByCompany.sum(ctx, { namespace }),
    ]);

    const categoryStats = (
      await Promise.all(
        KNOWN_CATEGORIES.map(async (category) => {
          const bounds = { prefix: [category] as [string] };
          const [count, size] = await Promise.all([
            storageByCategory.count(ctx, { namespace, bounds }),
            storageByCategory.sum(ctx, { namespace, bounds }),
          ]);
          return { category, count, size };
        })
      )
    )
      .filter((s) => s.count > 0)
      .sort((a, b) => b.size - a.size);

    const fileTypeStats = (
      await Promise.all(
        KNOWN_FILE_TYPES.map(async (fileType) => {
          const bounds = { prefix: [fileType] as [string] };
          const [count, size] = await Promise.all([
            storageByFileType.count(ctx, { namespace, bounds }),
            storageByFileType.sum(ctx, { namespace, bounds }),
          ]);
          return { fileType, count, size };
        })
      )
    )
      .filter((s) => s.count > 0)
      .sort((a, b) => b.size - a.size);

    return { totalFiles, totalSize, categoryStats, fileTypeStats };
  },
});

// ── Logs: analytics for generated files ──────────────────────────────────
// Reads from storyboard_generation_daily (maintained by syncGenerationDaily
// in each generated-file mutation). Bandwidth is bounded by days × models
// in the window — typically well under 1 KB even for 90-day queries.
export const getGenerationAnalytics = query({
  args: {
    companyId: v.string(),
    fromTimestamp: v.number(),
    toTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const fromDate = new Date(args.fromTimestamp).toISOString().split("T")[0];
    const toDate = new Date(args.toTimestamp).toISOString().split("T")[0];

    const rows = await ctx.db
      .query("storyboard_generation_daily")
      .withIndex("by_companyId_date", (q) =>
        q.eq("companyId", args.companyId).gte("date", fromDate).lte("date", toDate)
      )
      .collect();

    const byModel: Record<string, { count: number; credits: number; storage: number; success: number; failed: number }> = {};
    const byDay: Record<string, { count: number; credits: number }> = {};

    let totalGenerations = 0;
    let totalCredits = 0;
    let totalStorage = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const r of rows) {
      if (!byModel[r.model]) {
        byModel[r.model] = { count: 0, credits: 0, storage: 0, success: 0, failed: 0 };
      }
      byModel[r.model].count += r.count;
      byModel[r.model].credits += r.credits;
      byModel[r.model].storage += r.storage;
      byModel[r.model].success += r.success;
      byModel[r.model].failed += r.failed;

      if (!byDay[r.date]) byDay[r.date] = { count: 0, credits: 0 };
      byDay[r.date].count += r.count;
      byDay[r.date].credits += r.credits;

      totalGenerations += r.count;
      totalCredits += r.credits;
      totalStorage += r.storage;
      totalSuccess += r.success;
      totalFailed += r.failed;
    }

    const modelStats = Object.entries(byModel)
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.count - a.count);

    const dailyStats = Object.entries(byDay)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalGenerations,
      totalCredits,
      totalStorage,
      totalSuccess,
      totalFailed,
      modelStats,
      dailyStats,
    };
  },
});

// ── Logs: generated files with credits consumed ──────────────────────────
export const listGenerationLogs = query({
  args: {
    companyId: v.string(),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Native paginate on by_companyId_category — avoids loading entire
    // generated-files history into memory. Status applied as server-side filter.
    const baseQuery = ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) =>
        q.eq("companyId", args.companyId)
      )
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("category"), "generated"),
            q.eq(q.field("category"), "elements")
          ),
          q.neq(q.field("status"), "deleted")
        )
      );

    const filteredQuery = args.status
      ? baseQuery.filter((q) => q.eq(q.field("status"), args.status))
      : baseQuery;

    const results = await filteredQuery.order("desc").paginate(args.paginationOpts);

    // Filter out crop thumbnails (element uploads tagged "thumbnail")
    const filtered = results.page.filter(
      (file) => !(file.category === "elements" && file.tags?.includes("thumbnail"))
    );

    // Resolve defaultAI references to get key names (only for this page)
    const enriched = await Promise.all(
      filtered.map(async (file) => {
        let aiKeyName: string | null = null;
        if (file.defaultAI) {
          const aiKey = await ctx.db.get(file.defaultAI);
          aiKeyName = aiKey?.name ?? null;
        }
        return { ...file, aiKeyName };
      })
    );

    return { ...results, page: enriched };
  },
});

// ─── Update Tags ────────────────────────────────────────────────────────
// Toggle a tag on/off for a file. Validates ownership.

export const updateFileTags = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    // Validate ownership
    const callerCompanyId = (identity.orgId || identity.subject) as string;
    if (file.companyId !== callerCompanyId && file.userId !== identity.subject) {
      throw new Error("You can only tag your own files");
    }

    // Eligibility: only generated files with categoryId and size > 0
    if (file.category !== "generated") throw new Error("Only generated files can be tagged");
    if (!file.categoryId) throw new Error("File must belong to a storyboard item");
    if ((file.size ?? 0) <= 0) throw new Error("File must have content");

    const currentTags = file.tags || [];
    const hasTag = currentTags.includes(args.tag);

    const newTags = hasTag
      ? currentTags.filter(t => t !== args.tag)
      : [...currentTags, args.tag];

    await ctx.db.patch(args.fileId, { tags: newTags });

    return { tags: newTags, action: hasTag ? "removed" : "added" };
  },
});

