import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const logUpload = mutation({
  args: {
    companyId: v.optional(v.string()), // Accept companyId from caller (optional to match schema)
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
    categoryId: v.optional(v.union(
      v.id("storyboard_elements"),     // Parent element ID
      v.id("storyboard_items"),        // Parent storyboard item ID  
      v.id("storyboard_projects"),     // Parent project ID
      v.null()                         // No parent
    )), // Parent entity ID for cleanup
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
    
    if (!userId) {
      console.error('[logUpload] No userId provided');
      throw new Error("User ID is required");
    }
    
    console.log('[logUpload] Using provided companyId:', companyId);
    
    return await ctx.db.insert("storyboard_files", {
      ...restArgs,
      companyId: companyId, // Use provided companyId exactly as provided
      userId: userId, // Use provided userId exactly as provided
      uploadedAt: Date.now(),
      createdAt: Date.now(),
      isFavorite: false, // Default to not favorited
    });
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
  },
  handler: async (ctx, { id, category }) => {
    const file = await ctx.db.get(id);
    if (!file) {
      throw new Error("File not found");
    }
    
    const updateData: any = {};
    if (category !== undefined) {
      updateData.category = category;
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

