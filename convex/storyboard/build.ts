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

