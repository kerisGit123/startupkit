import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    orgId: v.string(),
    ownerId: v.string(),
    // Remove companyId - calculate from auth context
    settings: v.object({
      frameRatio: v.string(),
      style: v.string(),
      layout: v.string(),
    }),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, { name, description, orgId, ownerId, settings, isFavorite }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    
    const companyId = (userOrganizationId || userId) as string;
    
    return await ctx.db.insert("storyboard_projects", {
      name,
      description,
      orgId,
      ownerId,
      companyId, // Use the calculated companyId
      teamMemberIds: [],
      status: "draft",
      isFavorite: isFavorite ?? false,
      tags: [],
      script: "",
      scenes: [],
      settings,
      metadata: {
        sceneCount: 0,
        estimatedDuration: 0,
        aiModel: "",
      },
      isAIGenerated: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByOrg = query({
  args: { orgId: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, { orgId, status }) => {
    let q = ctx.db
      .query("storyboard_projects")
      .withIndex("by_org", (q) => q.eq("orgId", orgId));
    const results = await q.order("desc").collect();
    if (status) return results.filter((p) => p.status === status);
    return results;
  },
});

export const get = query({
  args: { id: v.id("storyboard_projects") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    script: v.optional(v.string()),
    imageUrl: v.optional(v.string()), // NEW: Image URL for project's main image
    scenes: v.optional(v.array(v.object({
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
    }))),
    metadata: v.optional(v.object({
      sceneCount: v.number(),
      estimatedDuration: v.number(),
      aiModel: v.string(),
    })),
    isAIGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, imageUrl, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Project not found");
    }

    // Create updated document
    const updatedDoc = { ...existing, ...fields, updatedAt: Date.now() };
    
    // Handle imageUrl specially: if imageUrl is undefined, remove it from the document
    if (imageUrl !== undefined) {
      updatedDoc.imageUrl = imageUrl;
    } else {
      // Remove imageUrl field entirely
      delete updatedDoc.imageUrl;
    }

    await ctx.db.replace(id, updatedDoc);
  },
});

export const duplicate = mutation({
  args: { id: v.id("storyboard_projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (!project) {
      throw new Error("Storyboard project not found");
    }

    const duplicatedProjectId = await ctx.db.insert("storyboard_projects", {
      name: `${project.name} (copy)`,
      description: project.description,
      orgId: project.orgId,
      ownerId: project.ownerId,
      companyId: project.companyId,
      teamMemberIds: project.teamMemberIds,
      status: project.status,
      isFavorite: false,
      tags: project.tags,
      script: project.script,
      scenes: project.scenes,
      settings: project.settings,
      metadata: project.metadata,
      isAIGenerated: project.isAIGenerated,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const storyboardItems = await ctx.db
      .query("storyboard_items")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();

    for (const item of storyboardItems) {
      await ctx.db.insert("storyboard_items", {
        projectId: duplicatedProjectId,
        companyId: project.companyId, // Inherit companyId from project
        sceneId: item.sceneId,
        order: item.order,
        title: item.title,
        description: item.description,
        duration: item.duration,
        imageUrl: item.imageUrl,
        imagePrompt: item.imagePrompt,
        videoUrl: item.videoUrl,
        audioUrl: item.audioUrl,
        tags: item.tags,
        imageGeneration: item.imageGeneration,
        videoGeneration: item.videoGeneration,
        elements: item.elements,
        annotations: item.annotations,
        generatedBy: item.generatedBy,
        isAIGenerated: item.isAIGenerated,
        generationStatus: item.generationStatus,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return duplicatedProjectId;
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_projects") },
  handler: async (ctx, { id }) => {
    // Get user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    // Get the project to verify it exists and get its ID
    const project = await ctx.db.get(id);
    if (!project) {
      throw new Error("Project not found");
    }

    console.log(`[Project Remove] Starting cleanup for project: ${id}`);

    // 1. Remove all storyboard items for this project
    try {
      const storyboardItems = await ctx.db
        .query("storyboard_items")
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();
      
      console.log(`[Project Remove] Found ${storyboardItems.length} storyboard items to delete`);
      
      for (const item of storyboardItems) {
        await ctx.db.delete(item._id);
        console.log(`[Project Remove] Deleted storyboard item: ${item._id}`);
      }
    } catch (error) {
      console.error(`[Project Remove] Error deleting storyboard items:`, error);
    }

    // 2. Remove all private elements for this project
    try {
      // First get all elements for this project
      const allElements = await ctx.db
        .query("storyboard_elements")
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();
      
      // Filter for private elements only
      const privateElements = allElements.filter(element => element.visibility === "private");
      
      console.log(`[Project Remove] Found ${privateElements.length} private elements to delete (out of ${allElements.length} total elements)`);
      
      for (const element of privateElements) {
        await ctx.db.delete(element._id);
        console.log(`[Project Remove] Deleted private element: ${element._id}`);
      }
    } catch (error) {
      console.error(`[Project Remove] Error deleting private elements:`, error);
    }

    // 3. Remove all files for this project
    try {
      const projectFiles = await ctx.db
        .query("storyboard_files")
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();
      
      console.log(`[Project Remove] Found ${projectFiles.length} files to delete`);
      
      for (const file of projectFiles) {
        await ctx.db.delete(file._id);
        console.log(`[Project Remove] Deleted project file: ${file._id}`);
      }
    } catch (error) {
      console.error(`[Project Remove] Error deleting project files:`, error);
    }

    // NOTE: Credit usage records are PRESERVED for billing and audit purposes
    // These records track user charges and should not be deleted

    // 4. Finally, delete the project itself
    await ctx.db.delete(id);
    
    // 5. Verification - Check if deletion was successful
    const remainingItems = await ctx.db
      .query("storyboard_items")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    const remainingElements = await ctx.db
      .query("storyboard_elements")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    const remainingFiles = await ctx.db
      .query("storyboard_files")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    console.log(`[Project Remove] Verification - Remaining data after deletion:`);
    console.log(`  - Storyboard items: ${remainingItems.length} (should be 0)`);
    console.log(`  - Elements: ${remainingElements.length} (should be public elements only)`);
    console.log(`  - Files: ${remainingFiles.length} (should be 0)`);
    
    console.log(`[Project Remove] Successfully deleted project ${id} and all associated data (credit usage preserved)`);
  },
});

// Update project build status without changing script content
export const updateBuildStatus = mutation({
  args: {
    id: v.id("storyboard_projects"),
    taskStatus: v.optional(v.string()),          // "idle" | "processing" | "ready" | "error"
    taskMessage: v.optional(v.string()), // "Building storyboard..." etc.
    scriptType: v.optional(v.string()), // "ANIMATED_STORIES" | "KIDS_ANIMATED_STORIES" | etc.
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
    isAIGenerated: v.boolean(),
  },
  handler: async (ctx, { id, taskStatus, taskMessage, scriptType, scenes, isAIGenerated }) => {
    await ctx.db.patch(id, {
      taskStatus,
      taskMessage,
      scriptType,
      scenes,
      isAIGenerated,
      metadata: {
        sceneCount: scenes.length,
        estimatedDuration: scenes.length * 5,
        aiModel: "",
      },
      updatedAt: Date.now(),
    });
  },
});

export const updateScript = mutation({
  args: {
    id: v.id("storyboard_projects"),
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
    isAIGenerated: v.boolean(),
    aiModel: v.optional(v.string()),
    taskStatus: v.optional(v.string()),          // "idle" | "processing" | "ready" | "error"
    taskMessage: v.optional(v.string()), // "Building storyboard..." etc.
    scriptType: v.optional(v.string()), // "ANIMATED_STORIES" | "KIDS_ANIMATED_STORIES" | etc.
  },
  handler: async (ctx, { id, script, scenes, isAIGenerated, aiModel, taskStatus, taskMessage, scriptType }) => {
    await ctx.db.patch(id, {
      script,
      scenes,
      isAIGenerated,
      taskStatus,
      taskMessage,
      scriptType,
      metadata: {
        sceneCount: scenes.length,
        estimatedDuration: scenes.length * 5,
        aiModel: aiModel ?? "",
      },
      updatedAt: Date.now(),
    });
  },
});
