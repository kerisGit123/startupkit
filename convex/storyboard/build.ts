import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { internal } from "../_generated/api";

// Action for external API calls (buildStoryboard)
export const buildStoryboard = action({
  args: {
    projectId: v.id("storyboard_projects"),
    buildType: v.string(),        // "normal" | "enhanced"
    rebuildStrategy: v.string(),   // "add_update" | "replace_all"
    scriptType: v.string(),        // "ANIMATED_STORIES" | etc.
    language: v.string()           // "en" | "zh"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    // 1. Set task status immediately (using mutation)
    const taskType = args.buildType === "enhanced" ? "ai_enhanced" : "normal";
    const initialMessage = args.buildType === "enhanced" 
      ? "Starting enhanced AI build..." 
      : "Starting normal build...";
    
    await ctx.runMutation(internal.storyboard.build.setTaskStatus, {
      projectId: args.projectId,
      taskStatus: "processing",
      taskType: taskType,
      taskMessage: initialMessage
    });

    // 2. Strategy processing - clear data if needed (using mutation)
    if (args.rebuildStrategy === "replace_all") {
      await ctx.runMutation(internal.storyboard.build.clearExistingData, {
        projectId: args.projectId
      });
    }

    // 3. Send to Site API (fire and forget)
    try {
      // Get script content first
      const script = await ctx.runQuery(internal.storyboard.build.getScriptContent, {
        projectId: args.projectId
      });
      
      // Call our Site API which will forward to n8n
      // For Convex actions in cloud, we need to use the actual deployment URL
      const appUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.NEXT_PUBLIC_CONVEX_SITE_URL || 
                     'http://localhost:3000';
      const response = await fetch(`${appUrl}/api/n8n-webhook`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer n8n-webhook-secret-2024`
        },
        body: JSON.stringify({
          storyboardId: args.projectId,
          scriptType: args.scriptType,
          language: args.language,
          buildStrategy: args.rebuildStrategy,
          script: script
        })
      });
      
      if (!response.ok) {
        throw new Error(`n8n workflow error: ${response.status}`);
      }
      
      // 4. Return immediately - n8n will handle the rest
      return { success: true, message: "Build started successfully" };
      
    } catch (error) {
      // 5. Handle errors - update task status
      await ctx.runMutation(internal.storyboard.build.setTaskStatus, {
        projectId: args.projectId,
        taskStatus: "error",
        taskMessage: "Failed to start build process"
      });
      throw error;
    }
  }
});

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

