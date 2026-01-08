import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensureOrgSettings = mutation({
  args: {
    companyId: v.string(),
    subjectType: v.union(v.literal("organization"), v.literal("user")),
    aiEnabled: v.boolean(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    const now = Date.now();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("org_settings", {
      companyId: args.companyId,
      subjectType: args.subjectType,
      aiEnabled: args.aiEnabled,
      updatedAt: now,
      updatedBy: args.updatedBy,
      createdAt: now,
    });
  },
});

export const getSettings = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const settings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    return settings ?? null;
  },
});

export const updateSettings = mutation({
  args: {
    companyId: v.string(),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    aiEnabled: v.optional(v.boolean()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    const now = Date.now();

    if (!existing) {
      // Create new settings if they don't exist
      return await ctx.db.insert("org_settings", {
        companyId: args.companyId,
        companyName: args.companyName,
        email: args.email,
        contactNumber: args.contactNumber,
        address: args.address,
        aiEnabled: args.aiEnabled ?? true,
        subjectType: "organization",
        updatedAt: now,
        updatedBy: args.updatedBy,
        createdAt: now,
      });
    }

    await ctx.db.patch(existing._id, {
      companyName: args.companyName,
      email: args.email,
      contactNumber: args.contactNumber,
      address: args.address,
      aiEnabled: args.aiEnabled,
      updatedAt: now,
      updatedBy: args.updatedBy,
    });

    return existing._id;
  },
});
