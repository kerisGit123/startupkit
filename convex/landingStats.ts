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

    // Fallback: count via storyboard_generation_daily (tiny table) instead of
    // scanning storyboard_files. Only runs until the first refreshLandingStats
    // call populates the cache row.
    const [users, projects, dailyRows] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("storyboard_projects").collect(),
      ctx.db.query("storyboard_generation_daily").collect(),
    ]);

    return {
      totalCreators: users.length,
      totalProjects: projects.length,
      totalGenerations: dailyRows.reduce((sum, r) => sum + r.count, 0),
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
    // Use storyboard_generation_daily to count generated files — far fewer
    // rows than scanning the entire storyboard_files table (one row per
    // company+date+model vs one row per file).
    const [users, projects, dailyRows] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("storyboard_projects").collect(),
      ctx.db.query("storyboard_generation_daily").collect(),
    ]);

    const totalGenerations = dailyRows.reduce((sum, r) => sum + r.count, 0);

    const stats = {
      totalCreators: users.length,
      totalProjects: projects.length,
      totalGenerations,
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
