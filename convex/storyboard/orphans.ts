import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrphanFile {
  _id: string;
  filename: string;
  fileType: string;
  category: string;
  r2Key: string;
  sourceUrl: string;
  size: number;
  creditsUsed: number;
  model: string | null;
  projectId: string | null;
  projectName: string | null;
  projectExists: boolean;
  defaultAI: string | null;
  createdAt: number;
}

// ─── detectOrphans ────────────────────────────────────────────────────────────
//
// Scans storyboard_files owned by companyId for orphans: files whose categoryId
// references a deleted parent (storyboard_item or storyboard_element). Returns
// up to 100 records enriched with project name and whether the project still exists.
// Called once from the UI via useAction — not reactive.

export const detectOrphans = action({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }): Promise<OrphanFile[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const callerCompanyId = (identity as any).org_id ?? identity.subject;
    if (callerCompanyId !== companyId) throw new Error("Forbidden");

    const candidates: any[] = await ctx.runQuery(
      api.storyboard.orphans.listCandidatesByCompany,
      { companyId, limit: 100 }
    );

    const orphans: OrphanFile[] = [];

    for (const file of candidates) {
      const parentExists: boolean = await ctx.runQuery(
        api.storyboard.orphans.parentExists,
        { id: file.categoryId as string }
      );
      if (parentExists) continue;

      let projectName: string | null = null;
      let projectExists = false;
      if (file.projectId) {
        const proj: any = await ctx.runQuery(
          api.storyboard.orphans.getProjectTitle,
          { projectId: file.projectId }
        );
        if (proj) {
          projectName = proj.title ?? "Untitled Project";
          projectExists = true;
        }
      }

      orphans.push({
        _id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        category: file.category,
        r2Key: file.r2Key ?? "",
        sourceUrl: file.sourceUrl ?? "",
        size: file.size ?? 0,
        creditsUsed: file.creditsUsed ?? 0,
        model: file.model ?? null,
        projectId: file.projectId ?? null,
        projectName,
        projectExists,
        defaultAI: file.defaultAI ?? null,
        createdAt: file.createdAt ?? file.uploadedAt ?? 0,
      });
    }

    return orphans;
  },
});

// ─── rescueFile ───────────────────────────────────────────────────────────────
//
// Re-parents an orphan file to a live storyboard item chosen by the user.
// Sets categoryId = targetItemId and status = "completed".

export const rescueFile = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    targetItemId: v.id("storyboard_items"),
  },
  handler: async (ctx, { fileId, targetItemId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(fileId);
    if (!file) throw new Error("File not found");

    const callerCompanyId = (identity as any).org_id ?? identity.subject;
    if (file.companyId !== callerCompanyId) throw new Error("Forbidden");

    const targetItem = await ctx.db.get(targetItemId);
    if (!targetItem) throw new Error("Target storyboard item not found");

    await ctx.db.patch(fileId, {
      categoryId: targetItemId,
      status: "completed",
    });

    return { success: true };
  },
});

// ─── Helper queries (called by detectOrphans action) ─────────────────────────

export const listCandidatesByCompany = query({
  args: { companyId: v.string(), limit: v.number() },
  handler: async (ctx, { companyId, limit }) => {
    return await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "deleted"),
          q.neq(q.field("categoryId"), null),
          q.neq(q.field("categoryId"), undefined)
        )
      )
      .take(limit);
  },
});

export const parentExists = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id as any);
    return doc !== null;
  },
});

export const getProjectTitle = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return { title: (project as any).title ?? (project as any).name ?? null };
  },
});
