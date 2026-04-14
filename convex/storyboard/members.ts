import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const addMember = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    userId: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer"), v.literal("admin")),
    addedBy: v.string(),
  },
  handler: async (ctx, { projectId, userId, role, addedBy }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    if (project.teamMemberIds.includes(userId)) return;

    await ctx.db.patch(projectId, {
      teamMemberIds: [...project.teamMemberIds, userId],
      updatedAt: Date.now(),
    });
    // Note: "member_added" used to be logged to storyboard_credit_usage
    // with creditsUsed: 0. That table is gone and member events are
    // already tracked by Clerk natively, so the log was removed.
  },
});

export const removeMember = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(projectId, {
      teamMemberIds: project.teamMemberIds.filter((id) => id !== userId),
      updatedAt: Date.now(),
    });
  },
});

export const listProjectsByMember = query({
  args: { orgId: v.string(), userId: v.string() },
  handler: async (ctx, { orgId, userId }) => {
    const all = await ctx.db
      .query("storyboard_projects")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    return all.filter(
      (p) => p.ownerId === userId || p.teamMemberIds.includes(userId)
    );
  },
});

// Removed: getOrgUsage query — used to query the deleted
// storyboard_credit_usage table. No callers in the codebase.
// Usage analytics now live in credits.getOrgUsageSummary /
// credits.listOrgUsage which read from credits_ledger.
