import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    sceneId: v.string(),
    order: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    generatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboard_items", {
      ...args,
      elements: [],
      annotations: [],
      isAIGenerated: false,
      generationStatus: "none",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByProject = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_items"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    generationStatus: v.optional(v.string()),
    tags: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.string(),
    }))),
    imageGeneration: v.optional(v.object({
      model: v.string(),
      creditsUsed: v.number(),
      status: v.string(),
      taskId: v.optional(v.string()),
    })),
    videoGeneration: v.optional(v.object({
      model: v.string(),
      mode: v.string(),
      quality: v.string(),
      duration: v.number(),
      creditsUsed: v.number(),
      status: v.string(),
      taskId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const reorder = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    itemOrders: v.array(v.object({
      itemId: v.id("storyboard_items"),
      newOrder: v.number(),
    })),
  },
  handler: async (ctx, { projectId, itemOrders }) => {
    for (const { itemId, newOrder } of itemOrders) {
      await ctx.db.patch(itemId, { order: newOrder, updatedAt: Date.now() });
    }
    await ctx.db.patch(projectId, { updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_items") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const updateByTaskId = mutation({
  args: {
    taskId: v.string(),
    imageUrl: v.optional(v.string()),
    generationStatus: v.string(),
  },
  handler: async (ctx, { taskId, imageUrl, generationStatus }) => {
    const items = await ctx.db.query("storyboard_items").collect();
    const item = items.find((i) => i.imageGeneration?.taskId === taskId);
    if (!item) return;

    await ctx.db.patch(item._id, {
      generationStatus,
      imageUrl,
      ...(item.imageGeneration
        ? { imageGeneration: { ...item.imageGeneration, status: generationStatus } }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const updateByVideoTaskId = mutation({
  args: {
    taskId: v.string(),
    videoUrl: v.optional(v.string()),
    generationStatus: v.string(),
  },
  handler: async (ctx, { taskId, videoUrl, generationStatus }) => {
    const items = await ctx.db.query("storyboard_items").collect();
    const item = items.find((i) => i.videoGeneration?.taskId === taskId);
    if (!item) return;

    await ctx.db.patch(item._id, {
      generationStatus,
      videoUrl,
      ...(item.videoGeneration
        ? { videoGeneration: { ...item.videoGeneration, status: generationStatus } }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const createBatch = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    items: v.array(v.object({
      sceneId: v.string(),
      order: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      duration: v.number(),
      generatedBy: v.string(),
      generationStatus: v.string(),
    })),
  },
  handler: async (ctx, { projectId, items }) => {
    const ids: string[] = [];
    for (const item of items) {
      const id = await ctx.db.insert("storyboard_items", {
        projectId,
        ...item,
        elements: [],
        annotations: [],
        isAIGenerated: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});
