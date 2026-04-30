import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// NOTE: The buildStoryboard action has been replaced by the API route
// /api/storyboard/build-storyboard which handles script parsing,
// element extraction, and frame creation directly.

// Internal mutation for setting task status
export const setTaskStatus = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    taskStatus: v.string(),
    taskType: v.optional(v.string()),
    taskMessage: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      taskStatus: args.taskStatus,
      taskMessage: args.taskMessage
    };
    
    if (args.taskType) {
      updateData.taskType = args.taskType;
    }
    
    await ctx.db.patch(args.projectId, updateData);
    return { success: true };
  }
});

// Internal mutation for clearing existing data
export const clearExistingData = mutation({
  args: {
    projectId: v.id("storyboard_projects")
  },
  handler: async (ctx, args) => {
    // Clear existing elements
    const existingElements = await ctx.db.query("storyboard_elements")
      .filter((q: any) => q.eq(q.field("projectId"), args.projectId))
      .collect();
    
    for (const element of existingElements) {
      await ctx.db.delete(element._id);
    }
    
    // Clear existing scenes
    const existingScenes = await ctx.db.query("storyboard_items")
      .filter((q: any) => q.eq(q.field("projectId"), args.projectId))
      .collect();
    
    for (const scene of existingScenes) {
      await ctx.db.delete(scene._id);
    }
    
    return { success: true };
  }
});

// Internal mutation for saving preamble/description during build
export const updateProjectDescription = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      description: args.description,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Internal query for getting script content
export const getScriptContent = query({
  args: {
    projectId: v.id("storyboard_projects")
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project?.script || "";
  }
});

// List existing elements for a project (used by smart_merge build)
export const listElementsForBuild = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyboard_elements")
      .filter((q: any) => q.eq(q.field("projectId"), args.projectId))
      .collect();
  },
});

// List existing items for a project (used by smart_merge build)
export const listItemsForBuild = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q: any) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

// Clear only storyboard items (scenes/frames), preserve elements
export const clearItems = mutation({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("storyboard_items")
      .filter((q: any) => q.eq(q.field("projectId"), args.projectId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return { deleted: items.length };
  },
});

// Clear only specific scenes by their sceneId (for replace_section)
export const clearItemsBySceneIds = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    sceneIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const sceneIdSet = new Set(args.sceneIds);
    const items = await ctx.db
      .query("storyboard_items")
      .filter((q: any) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    let deleted = 0;
    for (const item of items) {
      if (item.sceneId && sceneIdSet.has(item.sceneId)) {
        await ctx.db.delete(item._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

// Get build status for real-time updates
export const getBuildStatus = query({
  args: {
    projectId: v.id("storyboard_projects")
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    return {
      taskStatus: project.taskStatus || "idle",
      taskMessage: project.taskMessage || "",
      taskType: project.taskType || ""
    };
  }
});

