import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// ─── Auto-Share (Internal) ──────────────────────────────────────────────
// Called by server-side callback for free plan users. No auth required.

export const autoShareFile = internalMutation({
  args: {
    fileId: v.id("storyboard_files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return;
    if (file.isShared === true) return;
    if (file.category !== "generated" || !file.r2Key) return;

    await ctx.db.patch(args.fileId, {
      isShared: true,
      sharedAt: Date.now(),
      sharedBy: file.userId || "system",
    });
  },
});

// ─── Share File ─────────────────────────────────────────────────────────
// Validates eligibility, sets isShared=true permanently.

export const shareFile = mutation({
  args: {
    fileId: v.id("storyboard_files"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    // Already shared — idempotent
    if (file.isShared === true) return { success: true, alreadyShared: true };

    // Validate ownership
    const callerCompanyId = (identity.orgId || identity.subject) as string;
    if (file.companyId !== callerCompanyId && file.userId !== identity.subject) {
      throw new Error("You can only share your own files");
    }

    // Validate eligibility: category=generated, categoryId not empty, size>0
    if (file.category !== "generated") throw new Error("Only AI-generated files can be shared");
    if (!file.categoryId) throw new Error("File must belong to a storyboard item");
    if ((file.size ?? 0) <= 0) throw new Error("File must have content");
    if (!file.r2Key) throw new Error("File must have an R2 key to be shared");

    await ctx.db.patch(args.fileId, {
      isShared: true,
      sharedAt: Date.now(),
      sharedBy: identity.subject,
    });

    return { success: true, alreadyShared: false };
  },
});

// ─── Unshare File ───────────────────────────────────────────────────────
// Sets isShared=false. Only paid users or org members can unshare.

export const unshareFile = mutation({
  args: {
    fileId: v.id("storyboard_files"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    if (!file.isShared) return { success: true, alreadyUnshared: true };

    // Validate ownership
    const callerCompanyId = (identity.orgId || identity.subject) as string;
    if (file.companyId !== callerCompanyId && file.userId !== identity.subject) {
      throw new Error("You can only unshare your own files");
    }

    // Validate eligibility
    if (file.category !== "generated") throw new Error("Only generated files can be unshared");
    if (!file.categoryId) throw new Error("File must belong to a storyboard item");
    if ((file.size ?? 0) <= 0) throw new Error("File must have content");

    // Free personal users cannot unshare — sharing is the cost of free tier
    const isPersonal = !callerCompanyId.startsWith("org_");
    if (isPersonal) {
      const balanceRow = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", callerCompanyId))
        .first();
      const plan = balanceRow?.ownerPlan ?? "free";
      if (plan === "free") {
        throw new Error("Free users cannot unshare files. Upgrade to a paid plan to control sharing.");
      }
    }

    await ctx.db.patch(args.fileId, {
      isShared: false,
    });

    return { success: true, alreadyUnshared: false };
  },
});

// ─── List Shared Files ──────────────────────────────────────────────────
// Paginated gallery listing with user info.

export const listSharedFiles = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(v.literal("recent")),
    filterModel: v.optional(v.string()),
    filterFileType: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 40;
    const sortBy = args.sortBy ?? "recent";

    // Fetch shared files
    let files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_isShared", (q) => q.eq("isShared", true))
      .order("desc")
      .collect();

    // Filter by model
    if (args.filterModel) {
      files = files.filter(f => f.model === args.filterModel);
    }

    // Filter by file type
    if (args.filterFileType) {
      files = files.filter(f => f.fileType === args.filterFileType);
    }

    // "recent" is already sorted by sharedAt desc via the index

    // Apply limit
    files = files.slice(0, limit);

    // Join creator info — org files show org name, personal files show user name
    const filesWithUser = await Promise.all(
      files.map(async (file) => {
        const isOrg = file.companyId?.startsWith("org_");

        if (isOrg && file.companyId) {
          // Look up org name from credits_balance
          const orgBalance = await ctx.db
            .query("credits_balance")
            .withIndex("by_companyId", (q) => q.eq("companyId", file.companyId!))
            .first();
          return {
            ...file,
            userName: orgBalance?.organizationName || file.companyId,
            userAvatar: null,
            isOrgCreator: true,
          };
        }

        // Personal file — show user name
        const user = file.userId
          ? await ctx.db
              .query("users")
              .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", file.userId!))
              .first()
          : null;

        return {
          ...file,
          userName: user?.fullName || user?.firstName || "Anonymous",
          userAvatar: user?.imageUrl || null,
          isOrgCreator: false,
        };
      })
    );

    return filesWithUser;
  },
});

// ─── Get Shared Models ──────────────────────────────────────────────────
// Returns unique model names from shared files for the filter dropdown.

export const getSharedModels = query({
  handler: async (ctx) => {
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_isShared", (q) => q.eq("isShared", true))
      .collect();

    const models = new Set<string>();
    for (const file of files) {
      if (file.model) models.add(file.model);
    }

    return Array.from(models).sort();
  },
});

// ─── Top Creators ───────────────────────────────────────────────────────
// Returns top creators by shared file count.
// Groups by companyId — org files credit the org, personal files credit the user.

export const getTopCreators = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxCreators = args.limit ?? 10;

    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_isShared", (q) => q.eq("isShared", true))
      .collect();

    // Count by companyId (org or personal)
    const counts: Record<string, number> = {};
    for (const file of files) {
      const key = file.companyId || file.userId || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    }

    // Sort by count desc, take top N
    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCreators);

    // Join creator data — org or user
    const creators = await Promise.all(
      topIds.map(async ([companyId, count]) => {
        const isOrg = companyId.startsWith("org_");

        if (isOrg) {
          const orgBalance = await ctx.db
            .query("credits_balance")
            .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
            .first();
          return {
            userId: companyId,
            userName: orgBalance?.organizationName || companyId,
            userAvatar: null,
            creationCount: count,
            isOrg: true,
          };
        }

        // Personal user
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", companyId))
          .first();
        return {
          userId: companyId,
          userName: user?.fullName || user?.firstName || "Anonymous",
          userAvatar: user?.imageUrl || null,
          creationCount: count,
          isOrg: false,
        };
      })
    );

    return creators;
  },
});

// ─── Get File With User ─────────────────────────────────────────────────
// Single file detail with user info.

export const getFileWithUser = query({
  args: {
    fileId: v.id("storyboard_files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;
    if (!file.isShared) return null;

    // Get creator info — org files show org name, personal files show user name
    const isOrg = file.companyId?.startsWith("org_");

    if (isOrg && file.companyId) {
      const orgBalance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", file.companyId!))
        .first();
      return {
        ...file,
        userName: orgBalance?.organizationName || file.companyId,
        userAvatar: null,
        isOrgCreator: true,
      };
    }

    const user = file.userId
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", file.userId!))
          .first()
      : null;

    return {
      ...file,
      userName: user?.fullName || user?.firstName || "Anonymous",
      userAvatar: user?.imageUrl || null,
      isOrgCreator: false,
    };
  },
});

// ─── One-Time Migration: Set aspectRatio on existing generated files ────
// Looks up the parent project's settings.frameRatio and applies it.
// Safe to run multiple times — only patches files missing aspectRatio.

export const migrateAspectRatios = mutation({
  handler: async (ctx) => {
    // Get all generated files that have categoryId and r2Key but no aspectRatio
    const allFiles = await ctx.db
      .query("storyboard_files")
      .collect();

    const eligible = allFiles.filter(
      (f) =>
        f.category === "generated" &&
        f.categoryId &&
        f.r2Key &&
        !f.aspectRatio
    );

    console.log(`[migrateAspectRatios] Found ${eligible.length} files to migrate`);

    let updated = 0;
    let skipped = 0;

    // Cache project lookups
    const projectCache: Record<string, string> = {};

    for (const file of eligible) {
      let ratio: string | null = null;

      // 1. Try to get from metadata (generation params may have it)
      if (file.metadata) {
        const meta = file.metadata as any;
        if (meta.aspectRatio) ratio = meta.aspectRatio;
        else if (meta.aspect_ratio) ratio = meta.aspect_ratio;
      }

      // 2. Try to get from parent project's settings.frameRatio
      if (!ratio && file.projectId) {
        const projectIdStr = file.projectId as string;
        if (projectCache[projectIdStr]) {
          ratio = projectCache[projectIdStr];
        } else {
          const project = await ctx.db.get(file.projectId);
          if (project?.settings?.frameRatio) {
            ratio = project.settings.frameRatio;
            projectCache[projectIdStr] = ratio;
          }
        }
      }

      // 3. Fallback: detect from file type heuristic
      if (!ratio) {
        // Videos are commonly 16:9, images vary
        ratio = file.fileType === "video" ? "16:9" : "1:1";
      }

      // Normalize ratio format
      if (ratio === "9:16" || ratio === "16:9" || ratio === "1:1" || ratio === "4:3" || ratio === "3:4") {
        await ctx.db.patch(file._id, { aspectRatio: ratio });
        updated++;
      } else {
        // Try to map non-standard formats
        const normalized = ratio.includes("16") && ratio.includes("9")
          ? (ratio.indexOf("16") < ratio.indexOf("9") ? "16:9" : "9:16")
          : "1:1";
        await ctx.db.patch(file._id, { aspectRatio: normalized });
        updated++;
      }
    }

    return { total: eligible.length, updated, skipped };
  },
});

// ─── Migration: Share eligible org files to gallery ─────────────────────
// Re-shares org generated files that have content (category=generated, r2Key, size>0).

export const migrateShareOrgFiles = mutation({
  handler: async (ctx) => {
    const allFiles = await ctx.db
      .query("storyboard_files")
      .collect();

    const eligible = allFiles.filter(
      f => f.companyId?.startsWith("org_") &&
        f.isShared !== true &&
        f.category === "generated" &&
        f.r2Key &&
        (f.size ?? 0) > 0 &&
        f.status !== "deleted" &&
        !f.deletedAt
    );

    let shared = 0;
    for (const file of eligible) {
      await ctx.db.patch(file._id, {
        isShared: true,
        sharedAt: file.sharedAt || Date.now(),
        sharedBy: file.sharedBy || file.userId || "system",
      });
      shared++;
    }

    return { eligible: eligible.length, shared };
  },
});

// ─── Migration: Fix files with wrong companyId ──────────────────────────
// Files created under org projects but stored with user_xxx companyId.
// Looks up the project's companyId and corrects the file's companyId.

export const migrateFixFileCompanyIds = mutation({
  handler: async (ctx) => {
    // Step 1: Fix projects — use orgId as companyId if orgId starts with org_
    const allProjects = await ctx.db.query("storyboard_projects").collect();
    let projectsFixed = 0;
    for (const project of allProjects) {
      if (project.orgId?.startsWith("org_") && project.companyId !== project.orgId) {
        await ctx.db.patch(project._id, { companyId: project.orgId });
        projectsFixed++;
      }
    }

    // Step 2: Fix files — look up project's orgId for the correct companyId
    const allFiles = await ctx.db.query("storyboard_files").collect();
    const candidates = allFiles.filter(
      f => f.companyId?.startsWith("user_") && f.projectId
    );

    const projectCache: Record<string, string | null> = {};
    let filesFixed = 0;
    let skipped = 0;

    for (const file of candidates) {
      const pid = file.projectId as string;
      if (!(pid in projectCache)) {
        const project = await ctx.db.get(file.projectId!);
        projectCache[pid] = project?.orgId?.startsWith("org_") ? project.orgId : null;
      }

      const correctCompanyId = projectCache[pid];
      if (correctCompanyId && correctCompanyId !== file.companyId) {
        await ctx.db.patch(file._id, { companyId: correctCompanyId });
        filesFixed++;
      } else {
        skipped++;
      }
    }

    return { projectsFixed, filesTotal: candidates.length, filesFixed, skipped };
  },
});
