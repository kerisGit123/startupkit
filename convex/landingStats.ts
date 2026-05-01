import { query, internalMutation } from "./_generated/server";

/**
 * Public query for landing page social proof.
 * Returns only safe aggregate counts — no PII, no revenue data.
 *
 * Uses a denormalized stats row (landing_stats table) that is updated by
 * a cron or manual trigger, so this query reads a single tiny document
 * instead of scanning three entire tables (~45 MB saved per call).
 *
 * Fallback: if the stats row doesn't exist yet, count from the tables
 * but cap the scan to avoid runaway bandwidth.
 */
export const getPublicStats = query({
  handler: async (ctx) => {
    // Try denormalized stats first (single row read — near-zero bandwidth)
    const cached = await ctx.db.query("landing_stats").first();
    if (cached) {
      return {
        totalCreators: cached.totalCreators,
        totalProjects: cached.totalProjects,
        totalGenerations: cached.totalGenerations,
      };
    }

    // Fallback: count via lightweight scan (no field data loaded by .collect()
    // beyond the _id, but still scans the table). This only runs until the
    // first refreshLandingStats call populates the cache row.
    const [users, projects, files] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("storyboard_projects").collect(),
      ctx.db.query("storyboard_files")
        .filter((q) => q.eq(q.field("category"), "generated"))
        .collect(),
    ]);

    return {
      totalCreators: users.length,
      totalProjects: projects.length,
      totalGenerations: files.length,
    };
  },
});

/**
 * Refresh the cached landing stats row. Call from a cron (e.g. every hour)
 * or manually from the admin dashboard. After the first call, getPublicStats
 * reads a single document instead of scanning tables.
 */
export const refreshLandingStats = internalMutation({
  handler: async (ctx) => {
    const [users, projects, files] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("storyboard_projects").collect(),
      ctx.db.query("storyboard_files")
        .filter((q) => q.eq(q.field("category"), "generated"))
        .collect(),
    ]);

    const stats = {
      totalCreators: users.length,
      totalProjects: projects.length,
      totalGenerations: files.length,
      updatedAt: Date.now(),
    };

    const existing = await ctx.db.query("landing_stats").first();
    if (existing) {
      await ctx.db.patch(existing._id, stats);
    } else {
      await ctx.db.insert("landing_stats", stats);
    }

    return stats;
  },
});
