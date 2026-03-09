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

    await ctx.db.insert("storyboard_credit_usage", {
      orgId: project.orgId,
      userId: addedBy,
      projectId,
      action: "member_added",
      creditsUsed: 0,
      model: "",
      metadata: { memberId: userId, role },
      createdAt: Date.now(),
    });
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

export const getOrgUsage = query({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const usage = await ctx.db
      .query("storyboard_credit_usage")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const totalCredits = usage.reduce((sum, u) => sum + u.creditsUsed, 0);
    const byMember: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    for (const u of usage) {
      byMember[u.userId] = (byMember[u.userId] ?? 0) + u.creditsUsed;
      byAction[u.action] = (byAction[u.action] ?? 0) + u.creditsUsed;
    }

    return { totalCredits, byMember, byAction, entries: usage.length };
  },
});
