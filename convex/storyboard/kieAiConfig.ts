import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getAllKeys = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("storyboard_kie_ai").order("desc").collect();
  },
});

export const getDefaultKey = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("storyboard_kie_ai")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();
  },
});

export const getKeyById = query({
  args: { id: v.id("storyboard_kie_ai") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

export const createKey = mutation({
  args: {
    name: v.string(),
    apiKey: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // If setting as default, unset all other defaults first
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("storyboard_kie_ai")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();
      for (const key of existingDefaults) {
        await ctx.db.patch(key._id, { isDefault: false, updatedAt: timestamp });
      }
    }

    return await ctx.db.insert("storyboard_kie_ai", {
      name: args.name,
      apiKey: args.apiKey,
      isDefault: args.isDefault,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const updateKey = mutation({
  args: {
    id: v.id("storyboard_kie_ai"),
    name: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("KIE AI key not found");

    const timestamp = Date.now();

    // If setting as default, unset all other defaults first
    if (fields.isDefault === true) {
      const existingDefaults = await ctx.db
        .query("storyboard_kie_ai")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();
      for (const key of existingDefaults) {
        if (key._id !== id) {
          await ctx.db.patch(key._id, { isDefault: false, updatedAt: timestamp });
        }
      }
    }

    const updateData: Record<string, any> = { updatedAt: timestamp };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.apiKey !== undefined) updateData.apiKey = fields.apiKey;
    if (fields.isDefault !== undefined) updateData.isDefault = fields.isDefault;
    if (fields.isActive !== undefined) updateData.isActive = fields.isActive;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const deleteKey = mutation({
  args: { id: v.id("storyboard_kie_ai") },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("KIE AI key not found");
    await ctx.db.delete(id);
    return id;
  },
});
