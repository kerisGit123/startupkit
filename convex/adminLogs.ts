import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logActivity = mutation({
  args: {
    adminUserId: v.string(),
    adminEmail: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("admin_activity_logs", {
      adminUserId: args.adminUserId,
      adminEmail: args.adminEmail,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      details: args.details,
      ipAddress: args.ipAddress,
      createdAt: Date.now(),
    });
  },
});

export const getRecentLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const logs = await ctx.db
      .query("admin_activity_logs")
      .order("desc")
      .take(limit);

    return logs;
  },
});

export const getLogsByAdmin = query({
  args: {
    adminUserId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const logs = await ctx.db
      .query("admin_activity_logs")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .order("desc")
      .take(limit);

    return logs;
  },
});

export const getLogsByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const logs = await ctx.db
      .query("admin_activity_logs")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc")
      .take(limit);

    return logs;
  },
});

export const getLogsByTarget = query({
  args: {
    targetType: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("admin_activity_logs")
      .withIndex("by_targetType", (q) => q.eq("targetType", args.targetType))
      .filter((q) => q.eq(q.field("targetId"), args.targetId))
      .order("desc")
      .collect();

    return logs;
  },
});
