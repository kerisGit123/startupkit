import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const logUpload = mutation({
  args: {
    orgId: v.optional(v.string()),
    userId: v.optional(v.string()),
    projectId: v.optional(v.id("storyboard_projects")),
    // Remove companyId - calculate from auth context
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
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    
    const companyId = (userOrganizationId || userId) as string;
    
    return await ctx.db.insert("storyboard_files", {
      ...args,
      companyId, // Use the calculated companyId
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

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("storyboard_files").order("desc").collect();
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
