import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get single setting by key
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return config?.value ?? null;
  },
});

// Get all settings by category
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
    
    // Convert to key-value object
    const settings: Record<string, unknown> = {};
    for (const config of configs) {
      settings[config.key] = config.value;
    }
    return settings;
  },
});

// Get all settings (for admin dashboard)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("platform_config").collect();
    return configs;
  },
});

// Set or update a single setting
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.string(),
    isEncrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: "super_admin", // TODO: Get from auth context
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: args.key,
        value: args.value,
        category: args.category,
        description: args.description,
        isEncrypted: args.isEncrypted ?? false,
        updatedAt: Date.now(),
        updatedBy: "super_admin",
      });
    }
    return { success: true };
  },
});

// Batch update multiple settings
export const batchSet = mutation({
  args: {
    settings: v.array(
      v.object({
        key: v.string(),
        value: v.any(),
        category: v.string(),
        description: v.string(),
        isEncrypted: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, { settings }) => {
    for (const setting of settings) {
      const existing = await ctx.db
        .query("platform_config")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: setting.value,
          updatedAt: Date.now(),
          updatedBy: "super_admin",
        });
      } else {
        await ctx.db.insert("platform_config", {
          ...setting,
          isEncrypted: setting.isEncrypted ?? false,
          updatedAt: Date.now(),
          updatedBy: "super_admin",
        });
      }
    }
    return { success: true };
  },
});

// Delete a setting
export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    
    if (config) {
      await ctx.db.delete(config._id);
      return { success: true };
    }
    return { success: false, error: "Setting not found" };
  },
});
