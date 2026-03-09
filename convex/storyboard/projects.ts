import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    orgId: v.string(),
    ownerId: v.string(),
    settings: v.object({
      frameRatio: v.string(),
      style: v.string(),
      layout: v.string(),
    }),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, { name, description, orgId, ownerId, settings, isFavorite }) => {
    return await ctx.db.insert("storyboard_projects", {
      name,
      description,
      orgId,
      ownerId,
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
    await ctx.db.delete(id);
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
