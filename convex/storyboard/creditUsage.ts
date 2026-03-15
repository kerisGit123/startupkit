import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    orgId: v.string(),
    userId: v.string(),
    projectId: v.id("storyboard_projects"),
    itemId: v.optional(v.id("storyboard_items")),
    action: v.string(),
    model: v.string(),
    creditsUsed: v.number(),
    metadata: v.optional(v.any()),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboard_credit_usage", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByOrg = query({
  args: { orgId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { orgId, limit }) => {
    const q = ctx.db
      .query("storyboard_credit_usage")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .order("desc");
    return limit ? await q.take(limit) : await q.collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("storyboard_credit_usage")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});

export const getOrgSummary = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const all = await ctx.db
      .query("storyboard_credit_usage")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const total = all.reduce((s, r) => s + r.creditsUsed, 0);
    const byUser: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byModel: Record<string, number> = {};

    for (const r of all) {
      byUser[r.userId] = (byUser[r.userId] ?? 0) + r.creditsUsed;
      byAction[r.action] = (byAction[r.action] ?? 0) + r.creditsUsed;
      byModel[r.model] = (byModel[r.model] ?? 0) + r.creditsUsed;
    }

    return { total, byUser, byAction, byModel, count: all.length };
  },
});
