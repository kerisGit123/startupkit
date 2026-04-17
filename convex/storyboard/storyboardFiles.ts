import { mutation, query, internalMutation } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

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
  },
  handler: async (ctx, args) => {
    // Since we're calling from API route with auth, we can work without auth context
    // The API route is already authenticated via Clerk
    console.log('[logUpload] Called from API route with args:', {
      hasCompanyId: !!args.companyId,
      hasUserId: !!args.userId,
      companyId: args.companyId?.substring(0, 10) + '...',
      userId: args.userId?.substring(0, 10) + '...'
    });
    
    // Use the companyId and userId from args (no auth context needed)
    const { companyId, userId, ...restArgs } = args;
    
    if (!companyId) {
      console.error('[logUpload] No companyId provided');
      throw new Error("Company ID is required");
    }
    
    // userId is now optional - log if missing but don't throw error
    if (!userId) {
      console.warn('[logUpload] No userId provided, but continuing with companyId:', companyId);
    }
    
    console.log('[logUpload] Using provided companyId:', companyId);
    
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
    
    return await ctx.db.insert("storyboard_files", insertData);
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
    await ctx.db.delete(id);
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
    
    // TODO: Delete from R2 bucket
    // This would require R2 admin credentials or a separate API route
    
    // Delete from database
    await ctx.db.delete(id);
    
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
        q.or(
          ...categories.map(category => q.eq(q.field("category"), category))
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
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .filter((q) => q.eq(q.field("category"), category))
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
        .filter((q) => q.eq(q.field("category"), "temps"));

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
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId));

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
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    
    if (category) {
      return files.filter(file => file.category === category);
    }
    
    return files;
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
  },
  handler: async (ctx, { fileId, sourceUrl, taskId, status, r2Key, metadata, size, responseCode, responseMessage, creditsUsed }) => {
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

    if (responseCode !== undefined) {
      updateData.responseCode = responseCode;
    }

    if (responseMessage !== undefined) {
      updateData.responseMessage = responseMessage;
    }

    if (creditsUsed !== undefined) {
      updateData.creditsUsed = creditsUsed;
    }

    await ctx.db.patch(fileId, updateData);
    console.log('[updateFromCallback] Updated file:', { fileId, status, hasSourceUrl: !!sourceUrl, hasR2Key: !!r2Key, hasMetadata: metadata !== undefined, hasSize: size !== undefined, responseCode, responseMessage: responseMessage?.substring(0, 50) });
    return { success: true };
  },
});

// Removed: migrateCreditUsage — one-time migration that read from the
// deleted storyboard_credit_usage table. Already run; no longer needed.

// ── Logs: total storage usage by company ─────────────────────────────────
export const getStorageUsage = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    let totalSize = 0;
    const byCategory: Record<string, { count: number; size: number }> = {};
    const byFileType: Record<string, { count: number; size: number }> = {};

    for (const file of files) {
      const size = file.size ?? 0;
      totalSize += size;

      const cat = file.category || "other";
      if (!byCategory[cat]) byCategory[cat] = { count: 0, size: 0 };
      byCategory[cat].count++;
      byCategory[cat].size += size;

      const ft = file.fileType || "other";
      if (!byFileType[ft]) byFileType[ft] = { count: 0, size: 0 };
      byFileType[ft].count++;
      byFileType[ft].size += size;
    }

    const categoryStats = Object.entries(byCategory)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.size - a.size);

    const fileTypeStats = Object.entries(byFileType)
      .map(([fileType, stats]) => ({ fileType, ...stats }))
      .sort((a, b) => b.size - a.size);

    return { totalFiles: files.length, totalSize, categoryStats, fileTypeStats };
  },
});

// ── Logs: analytics for generated files ──────────────────────────────────
export const getGenerationAnalytics = query({
  args: {
    companyId: v.string(),
    fromTimestamp: v.number(),
    toTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId_category", (q) =>
        q.eq("companyId", args.companyId).eq("category", "generated")
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.fromTimestamp),
          q.lte(q.field("createdAt"), args.toTimestamp)
        )
      )
      .collect();

    // Aggregate by model
    const byModel: Record<string, { count: number; credits: number; storage: number; success: number; failed: number }> = {};
    let totalCredits = 0;
    let totalGenerations = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalStorage = 0;

    for (const file of files) {
      const model = file.model || (file.metadata as any)?.model || (file.metadata as any)?.modelId || "unknown";
      if (!byModel[model]) {
        byModel[model] = { count: 0, credits: 0, storage: 0, success: 0, failed: 0 };
      }
      byModel[model].count++;
      byModel[model].credits += file.creditsUsed ?? 0;
      byModel[model].storage += file.size ?? 0;
      totalCredits += file.creditsUsed ?? 0;
      totalStorage += file.size ?? 0;
      totalGenerations++;

      if (file.status === "ready" || file.status === "completed") {
        byModel[model].success++;
        totalSuccess++;
      } else if (file.status === "failed" || file.status === "error") {
        byModel[model].failed++;
        totalFailed++;
      }
    }

    // Sort by count descending
    const modelStats = Object.entries(byModel)
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by day for chart
    const byDay: Record<string, { count: number; credits: number }> = {};
    for (const file of files) {
      const day = new Date(file.createdAt).toISOString().split("T")[0];
      if (!byDay[day]) byDay[day] = { count: 0, credits: 0 };
      byDay[day].count++;
      byDay[day].credits += file.creditsUsed ?? 0;
    }

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
    // Query only "generated" category (combine files don't use credits/AI keys)
    const generatedFiles = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId_category", (q) =>
        q.eq("companyId", args.companyId).eq("category", "generated")
      )
      .collect();

    let allFiles = generatedFiles
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    // Filter by status if specified
    if (args.status) {
      allFiles = allFiles.filter(f => f.status === args.status);
    }

    // Manual pagination
    const cursor = args.paginationOpts.cursor;
    const numItems = args.paginationOpts.numItems;
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = allFiles.findIndex(f => f._id === cursor);
      if (cursorIndex >= 0) startIndex = cursorIndex + 1;
    }
    const page = allFiles.slice(startIndex, startIndex + numItems);
    const isDone = startIndex + numItems >= allFiles.length;

    // Resolve defaultAI references to get key names
    const enriched = await Promise.all(
      page.map(async (file) => {
        let aiKeyName: string | null = null;
        if (file.defaultAI) {
          const aiKey = await ctx.db.get(file.defaultAI);
          aiKeyName = aiKey?.name ?? null;
        }
        return { ...file, aiKeyName };
      })
    );

    return {
      page: enriched,
      isDone,
      continueCursor: isDone ? null : (page[page.length - 1]?._id ?? null),
    };
  },
});

