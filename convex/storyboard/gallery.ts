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
      thumbsUp: 0,
      thumbsDown: 0,
      totalDonations: 0,
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

    // Validate eligibility — relaxed for older files that may lack prompt/credits
    if (file.category === "combine") throw new Error("Combined files cannot be shared");
    if (file.category !== "generated") throw new Error("Only AI-generated files can be shared");
    if (!file.r2Key) throw new Error("File must have an R2 key to be shared");

    // Set shared — permanent, no undo
    await ctx.db.patch(args.fileId, {
      isShared: true,
      sharedAt: Date.now(),
      sharedBy: identity.subject,
      thumbsUp: 0,
      thumbsDown: 0,
      totalDonations: 0,
    });

    return { success: true, alreadyShared: false };
  },
});

// ─── List Shared Files ──────────────────────────────────────────────────
// Paginated gallery listing with user info.

export const listSharedFiles = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("recent"), v.literal("popular"), v.literal("most_donated"))),
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

    // Sort
    if (sortBy === "popular") {
      files.sort((a, b) => (b.thumbsUp ?? 0) - (a.thumbsUp ?? 0));
    } else if (sortBy === "most_donated") {
      files.sort((a, b) => (b.totalDonations ?? 0) - (a.totalDonations ?? 0));
    }
    // "recent" is already sorted by sharedAt desc via the index

    // Apply limit
    files = files.slice(0, limit);

    // Join user info
    const filesWithUser = await Promise.all(
      files.map(async (file) => {
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

export const getTopCreators = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxCreators = args.limit ?? 10;

    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_isShared", (q) => q.eq("isShared", true))
      .collect();

    // Count by userId
    const counts: Record<string, number> = {};
    for (const file of files) {
      if (file.userId) {
        counts[file.userId] = (counts[file.userId] || 0) + 1;
      }
    }

    // Sort by count desc, take top N
    const topUserIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCreators);

    // Join user data
    const creators = await Promise.all(
      topUserIds.map(async ([userId, count]) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", userId))
          .first();
        return {
          userId,
          userName: user?.fullName || user?.firstName || "Anonymous",
          userAvatar: user?.imageUrl || null,
          creationCount: count,
        };
      })
    );

    return creators;
  },
});

// ─── Rate File ──────────────────────────────────────────────────────────
// Toggle thumbs up/down. One vote per user per file.

export const rateFile = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    rating: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");
    if (!file.isShared) throw new Error("File is not shared");

    // Note: self-rating is allowed for now (single-user testing)
    // To re-enable: if (file.userId === identity.subject) throw new Error("You cannot rate your own file");

    // Check for existing vote
    const existingRating = await ctx.db
      .query("storyboard_gallery_ratings")
      .withIndex("by_file_user", (q) =>
        q.eq("fileId", args.fileId).eq("userId", identity.subject)
      )
      .first();

    if (!existingRating) {
      // No existing vote — add new
      await ctx.db.insert("storyboard_gallery_ratings", {
        fileId: args.fileId,
        userId: identity.subject,
        rating: args.rating,
        createdAt: Date.now(),
      });

      // Increment counter
      const field = args.rating === "up" ? "thumbsUp" : "thumbsDown";
      await ctx.db.patch(args.fileId, {
        [field]: (file[field] ?? 0) + 1,
      });

      return { action: "added", rating: args.rating };
    }

    if (existingRating.rating === args.rating) {
      // Same vote — remove (un-vote)
      await ctx.db.delete(existingRating._id);

      const field = args.rating === "up" ? "thumbsUp" : "thumbsDown";
      await ctx.db.patch(args.fileId, {
        [field]: Math.max((file[field] ?? 0) - 1, 0),
      });

      return { action: "removed", rating: args.rating };
    }

    // Different vote — switch
    await ctx.db.patch(existingRating._id, {
      rating: args.rating,
      createdAt: Date.now(),
    });

    const oldField = existingRating.rating === "up" ? "thumbsUp" : "thumbsDown";
    const newField = args.rating === "up" ? "thumbsUp" : "thumbsDown";
    await ctx.db.patch(args.fileId, {
      [oldField]: Math.max((file[oldField] ?? 0) - 1, 0),
      [newField]: (file[newField] ?? 0) + 1,
    });

    return { action: "switched", rating: args.rating };
  },
});

// ─── Donate to File ─────────────────────────────────────────────────────
// Deducts from donor, credits to file owner. No ownership validation needed.

export const donateToFile = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.amount <= 0) throw new Error("Donation must be positive");
    if (args.amount > 100) throw new Error("Maximum donation is 100 credits");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");
    if (!file.isShared) throw new Error("File is not shared");
    if (!file.companyId) throw new Error("File owner not found");

    const donorCompanyId = (identity.orgId || identity.subject) as string;

    // Note: self-donation is allowed for now (single-user testing)
    // To re-enable: if (donorCompanyId === file.companyId) throw new Error("You cannot donate to your own file");

    // Check donor balance
    const donorBalance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", donorCompanyId))
      .first();

    if (!donorBalance || donorBalance.balance < args.amount) {
      throw new Error("Insufficient credits for donation");
    }

    const now = Date.now();

    // Deduct from donor
    await ctx.db.patch(donorBalance._id, {
      balance: donorBalance.balance - args.amount,
      updatedAt: now,
    });

    await ctx.db.insert("credits_ledger", {
      companyId: donorCompanyId,
      tokens: -args.amount,
      type: "donation_out",
      userId: identity.subject,
      counterpartCompanyId: file.companyId,
      reason: `Gallery donation to file ${args.fileId}`,
      createdAt: now,
    });

    // Credit to file owner
    const ownerBalance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", file.companyId!))
      .first();

    if (ownerBalance) {
      await ctx.db.patch(ownerBalance._id, {
        balance: ownerBalance.balance + args.amount,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId: file.companyId!,
        balance: args.amount,
        updatedAt: now,
      });
    }

    await ctx.db.insert("credits_ledger", {
      companyId: file.companyId!,
      tokens: args.amount,
      type: "donation_in",
      userId: identity.subject,
      counterpartCompanyId: donorCompanyId,
      reason: `Gallery donation received for file ${args.fileId}`,
      createdAt: now,
    });

    // Record donation
    await ctx.db.insert("storyboard_gallery_donations", {
      fileId: args.fileId,
      fromCompanyId: donorCompanyId,
      fromUserId: identity.subject,
      toCompanyId: file.companyId!,
      amount: args.amount,
      createdAt: now,
    });

    // Update total donations on file
    await ctx.db.patch(args.fileId, {
      totalDonations: (file.totalDonations ?? 0) + args.amount,
    });

    return { success: true, amount: args.amount };
  },
});

// ─── Get File With User ─────────────────────────────────────────────────
// Single file detail with user info + caller's existing rating.

export const getFileWithUser = query({
  args: {
    fileId: v.id("storyboard_files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;
    if (!file.isShared) return null;

    // Get file owner info
    const user = file.userId
      ? await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", file.userId!))
          .first()
      : null;

    // Get caller's existing rating (if authenticated)
    let callerRating: "up" | "down" | null = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const rating = await ctx.db
        .query("storyboard_gallery_ratings")
        .withIndex("by_file_user", (q) =>
          q.eq("fileId", args.fileId).eq("userId", identity.subject)
        )
        .first();
      callerRating = rating?.rating ?? null;
    }

    return {
      ...file,
      userName: user?.fullName || user?.firstName || "Anonymous",
      userAvatar: user?.imageUrl || null,
      callerRating,
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

    console.log(`[migrateAspectRatios] Done: ${updated} updated, ${skipped} skipped`);
    return { total: eligible.length, updated, skipped };
  },
});
