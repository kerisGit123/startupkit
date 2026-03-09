import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.string(),
    referenceUrls: v.array(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboard_elements", {
      ...args,
      usageCount: 0,
      status: "ready",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByProject = query({
  args: { projectId: v.id("storyboard_projects"), type: v.optional(v.string()) },
  handler: async (ctx, { projectId, type }) => {
    if (type) {
      return await ctx.db
        .query("storyboard_elements")
        .withIndex("by_type", (q) => q.eq("projectId", projectId).eq("type", type))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("storyboard_elements")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_elements"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    referenceUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const incrementUsage = mutation({
  args: { id: v.id("storyboard_elements") },
  handler: async (ctx, { id }) => {
    const el = await ctx.db.get(id);
    if (!el) return;
    await ctx.db.patch(id, { usageCount: (el.usageCount ?? 0) + 1, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_elements") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
