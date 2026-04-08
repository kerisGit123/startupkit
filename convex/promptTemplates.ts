import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("character"), v.literal("environment"), v.literal("prop"), v.literal("style"), v.literal("camera"), v.literal("action"), v.literal("other"), v.literal("custom")),
    prompt: v.string(),
    notes: v.optional(v.string()),
    companyId: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const templateId = await ctx.db.insert("promptTemplates", {
      ...args,
      usageCount: 0,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

export const update = mutation({
  args: {
    id: v.id("promptTemplates"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("character"), v.literal("environment"), v.literal("prop"), v.literal("style"), v.literal("camera"), v.literal("action"), v.literal("other"), v.literal("custom"))),
    prompt: v.optional(v.string()),
    notes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...updateData } = args;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("promptTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const get = query({
  args: { id: v.id("promptTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCompany = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("promptTemplates")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    return templates;
  },
});

export const getPublicTemplates = query({
  args: { type: v.optional(v.union(v.literal("character"), v.literal("environment"), v.literal("prop"), v.literal("style"), v.literal("camera"), v.literal("action"), v.literal("other"), v.literal("custom"))) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("promptTemplates")
      .withIndex("public_templates", (q) => q.eq("isPublic", true));
    
    if (args.type) {
      query = query.filter((q) => q.eq("type", args.type));
    }
    
    return await query.collect();
  },
});

export const incrementUsage = mutation({
  args: { id: v.id("promptTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    await ctx.db.patch(args.id, {
      usageCount: template.usageCount + 1,
    });

    return args.id;
  },
});

export const resetDefaults = mutation({
  args: {
    companyId: v.string(),
    prompts: v.array(
      v.object({
        name: v.string(),
        type: v.union(
          v.literal("character"),
          v.literal("environment"),
          v.literal("prop"),
          v.literal("style"),
          v.literal("camera"), v.literal("action"), v.literal("other"), v.literal("custom")
        ),
        prompt: v.string(),
        notes: v.optional(v.string()),
        isPublic: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const promptNames = new Set(args.prompts.map((prompt) => prompt.name));
    const companyTemplates = await ctx.db
      .query("promptTemplates")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    for (const template of companyTemplates) {
      if (promptNames.has(template.name)) {
        await ctx.db.delete(template._id);
      }
    }

    const createdIds: Id<"promptTemplates">[] = [];

    for (const prompt of args.prompts) {
      const templateId = await ctx.db.insert("promptTemplates", {
        name: prompt.name,
        type: prompt.type,
        prompt: prompt.prompt,
        notes: prompt.notes,
        companyId: args.companyId,
        isPublic: prompt.isPublic,
        usageCount: 0,
        createdAt: Date.now(),
      });
      createdIds.push(templateId);
    }

    return createdIds;
  },
});
