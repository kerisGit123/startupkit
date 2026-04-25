import { query } from "./_generated/server";

/**
 * Public query for landing page social proof.
 * Returns only safe aggregate counts — no PII, no revenue data.
 */
export const getPublicStats = query({
  handler: async (ctx) => {
    const [users, projects, files] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("storyboard_projects").collect(),
      ctx.db.query("storyboard_files").collect(),
    ]);

    const totalCreators = users.length;
    const totalProjects = projects.length;
    const totalGenerations = files.length;

    return { totalCreators, totalProjects, totalGenerations };
  },
});
