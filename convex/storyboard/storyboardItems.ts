import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// Per-plan frame-per-project limits. Keep in sync with lib/plan-config.ts.
const FRAME_LIMITS: Record<string, number> = {
  free: 20,
  pro_personal: Number.MAX_SAFE_INTEGER,
  business: Number.MAX_SAFE_INTEGER,
};

export const create = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    sceneId: v.string(),
    order: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    generatedBy: v.string(),
    // Optional fields — set during script build so frames are born complete
    imagePrompt: v.optional(v.string()),
    videoPrompt: v.optional(v.string()),
    defaultImageModel: v.optional(v.string()),
    defaultVideoModel: v.optional(v.string()),
    linkedElements: v.optional(v.array(v.object({
      id: v.id("storyboard_elements"),
      name: v.string(),
      type: v.string(),
    }))),
    frameStatus: v.optional(v.string()),
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

    // Enforce frame limit for free users (server-side defense)
    let effectivePlan = "free";
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    if (balance?.ownerPlan && FRAME_LIMITS[balance.ownerPlan] !== undefined) {
      effectivePlan = balance.ownerPlan;
    }

    const maxFrames = FRAME_LIMITS[effectivePlan] ?? 20;
    const existingItems = await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (existingItems.length >= maxFrames) {
      throw new Error(
        `Frame limit reached for ${effectivePlan} plan (${maxFrames} frames per project). Upgrade to Pro for unlimited.`,
      );
    }

    return await ctx.db.insert("storyboard_items", {
      ...args,
      companyId, // Use the calculated companyId
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
    primaryImage: v.optional(v.string()), // NEW: Primary image field
    imagePrompt: v.optional(v.string()),
    videoPrompt: v.optional(v.string()),
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
    elementNames: v.optional(v.object({
      characters: v.array(v.string()),
      environments: v.array(v.string()),
      props: v.array(v.string()),
    })),
    linkedElements: v.optional(v.array(v.object({
      id: v.id("storyboard_elements"),
      name: v.string(),
      type: v.string(),
    }))),
    defaultImageModel: v.optional(v.string()),
    defaultVideoModel: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

// NEW: Set primary image for a storyboard item and clear all others in the project
export const setPrimaryImage = mutation({
  args: {
    itemId: v.id("storyboard_items"),
    primaryImageUrl: v.string(),
  },
  handler: async (ctx, { itemId, primaryImageUrl }) => {
    // Get the current item to find its project
    const currentItem = await ctx.db.get(itemId);
    if (!currentItem) {
      throw new Error("Storyboard item not found");
    }

    const projectId = currentItem.projectId;

    // Clear all primaryImage fields from all items in this project
    const allProjectItems = await ctx.db
      .query("storyboard_items")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    // Clear primaryImage from all items first
    await Promise.all(
      allProjectItems.map(async (item) => {
        if (item.primaryImage) {
          await ctx.db.patch(item._id, { 
            primaryImage: undefined,
            updatedAt: Date.now() 
          });
        }
      })
    );

    // Set primaryImage on the current item
    await ctx.db.patch(itemId, { 
      primaryImage: primaryImageUrl,
      updatedAt: Date.now() 
    });

    console.log(`[setPrimaryImage] Set primary image for item ${itemId} in project ${projectId}`);
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
    const item = await ctx.db.get(id);
    if (!item) {
      console.log(`[Remove Item] Item not found: ${id}`);
      return; // Don't throw error, just return if item doesn't exist
    }
    await ctx.db.delete(id);
    console.log(`[Remove Item] Deleted item: ${id}`);
  },
});

export const updateFavorite = mutation({
  args: {
    id: v.id("storyboard_items"),
    isFavorite: v.boolean(),
  },
  handler: async (ctx, { id, isFavorite }) => {
    await ctx.db.patch(id, { 
      isFavorite, 
      updatedAt: Date.now() 
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
    })),
  },
  handler: async (ctx, { projectId, items }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Use current user's organization
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const actualCompanyId = userOrganizationId || userId;
    
    const ids: string[] = [];
    for (const item of items) {
      const id = await ctx.db.insert("storyboard_items", {
        projectId,
        companyId: String(actualCompanyId),
        ...item,
        elements: [],
        annotations: [],
        isAIGenerated: false,
        generationStatus: "idle",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

// NEW: Frame status and notes mutations (safe implementation)
export const updateFrameStatus = mutation({
  args: {
    id: v.id("storyboard_items"),
    frameStatus: v.optional(v.string()),
  },
  handler: async (ctx, { id, frameStatus }) => {
    // Validate status if provided
    if (frameStatus) {
      const validStatuses = ['draft', 'in-progress', 'completed'];
      if (!validStatuses.includes(frameStatus)) {
        throw new Error(`Invalid frameStatus: ${frameStatus}`);
      }
    }
    
    await ctx.db.patch(id, {
      frameStatus,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

export const updateFrameNotes = mutation({
  args: {
    id: v.id("storyboard_items"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, notes }) => {
    await ctx.db.patch(id, {
      notes,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});
