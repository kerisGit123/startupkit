import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// List all personas for a company
export const list = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyboard_personas")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

// Create a new persona
export const create = mutation({
  args: {
    companyId: v.string(),
    userId: v.string(),
    personaId: v.string(),
    name: v.string(),
    description: v.string(),
    sourceTaskId: v.optional(v.string()),
    sourceAudioId: v.optional(v.string()),
    sourceFileId: v.optional(v.id("storyboard_files")),
    style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboard_personas", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Delete a persona
export const remove = mutation({
  args: { id: v.id("storyboard_personas") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Update persona name/description/style
export const update = mutation({
  args: {
    id: v.id("storyboard_personas"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    style: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(id, filtered);
    }
  },
});
