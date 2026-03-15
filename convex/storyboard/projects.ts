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
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
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
    const storyboardItems = await ctx.db
      .query("storyboard_items")
      .filter((q) => q.eq("projectId", id))
      .collect();
    
    console.log(`[Project Remove] Found ${storyboardItems.length} storyboard items to delete`);
    
    for (const item of storyboardItems) {
      await ctx.db.delete(item._id);
    }

    // 2. Remove all private elements for this project
    const privateElements = await ctx.db
      .query("storyboard_elements")
      .filter((q) => 
        q.eq("projectId", id) && 
        q.eq("visibility", "private")
      )
      .collect();
    
    console.log(`[Project Remove] Found ${privateElements.length} private elements to delete`);
    
    for (const element of privateElements) {
      await ctx.db.delete(element._id);
    }

    // 3. Remove all files for this project
    const projectFiles = await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq("projectId", id))
      .collect();
    
    console.log(`[Project Remove] Found ${projectFiles.length} files to delete`);
    
    for (const file of projectFiles) {
      await ctx.db.delete(file._id);
    }

    // 4. Remove all credit usage records for this project
    const creditUsage = await ctx.db
      .query("storyboard_credit_usage")
      .filter((q) => q.eq("projectId", id))
      .collect();
    
    console.log(`[Project Remove] Found ${creditUsage.length} credit usage records to delete`);
    
    for (const usage of creditUsage) {
      await ctx.db.delete(usage._id);
    }

    // 5. Finally, delete the project itself
    await ctx.db.delete(id);
    
    console.log(`[Project Remove] Successfully deleted project ${id} and all associated data`);
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
  },
  handler: async (ctx, { id, script, scenes, isAIGenerated, aiModel }) => {
    await ctx.db.patch(id, {
      script,
      scenes,
      isAIGenerated,
      metadata: {
        sceneCount: scenes.length,
        estimatedDuration: scenes.length * 5,
        aiModel: aiModel ?? "",
      },
      updatedAt: Date.now(),
    });
  },
});
