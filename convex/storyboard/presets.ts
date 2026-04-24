import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ── Queries ──────────────────────────────────────────────────────────────────

/** List all presets for a workspace, optionally filtered by category */
export const list = query({
  args: {
    companyId: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { companyId, category }) => {
    if (category) {
      return await ctx.db
        .query("storyboard_presets")
        .withIndex("by_category", (q) => q.eq("companyId", companyId).eq("category", category))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("storyboard_presets")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

/** Get a single preset by ID */
export const get = query({
  args: { id: v.id("storyboard_presets") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// ── Mutations ────────────────────────────────────────────────────────────────

/** Create a new preset */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    format: v.string(),
    prompt: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    companyId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboard_presets", {
      ...args,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/** Update a preset */
export const update = mutation({
  args: {
    id: v.id("storyboard_presets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    format: v.optional(v.string()),
    prompt: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Preset not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.description !== undefined) updates.description = fields.description;
    if (fields.format !== undefined) updates.format = fields.format;
    if (fields.prompt !== undefined) updates.prompt = fields.prompt;
    if (fields.thumbnailUrl !== undefined) updates.thumbnailUrl = fields.thumbnailUrl;

    await ctx.db.patch(id, updates);
    return { success: true };
  },
});

/** Delete a preset */
export const remove = mutation({
  args: { id: v.id("storyboard_presets") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Preset not found");
    await ctx.db.delete(id);
    return { success: true };
  },
});

/** Increment usage count when a preset is loaded */
export const incrementUsage = mutation({
  args: { id: v.id("storyboard_presets") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) return;
    await ctx.db.patch(id, {
      usageCount: (existing.usageCount || 0) + 1,
      updatedAt: Date.now(),
    });
  },
});
