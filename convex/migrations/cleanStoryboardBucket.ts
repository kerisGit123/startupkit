import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Clean all files from the storyboard R2 bucket
 * This should be run before repopulating with new companyId logic
 */
export const cleanStoryboardBucket = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[Cleanup] Starting storyboard bucket cleanup...");

    // Get all files from storyboard_files table
    const files = await ctx.db
      .query("storyboard_files")
      .collect();

    console.log(`[Cleanup] Found ${files.length} files to delete from database`);

    // Delete all file records from database
    for (const file of files) {
      await ctx.db.delete(file._id);
      console.log(`[Cleanup] Deleted file record: ${file.filename}`);
    }

    // Note: R2 files need to be deleted separately via R2 API
    // This only cleans the database records
    console.log("[Cleanup] Database cleanup completed!");
    console.log("[Cleanup] Note: R2 files need to be deleted manually or via R2 API");

    return {
      filesDeleted: files.length,
    };
  },
});

/**
 * Clean all storyboard-related tables
 * This should be run after cleaning R2 bucket
 */
export const cleanStoryboardTables = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[Cleanup] Starting storyboard tables cleanup...");

    const results = {
      projects: 0,
      elements: 0,
      items: 0,
      files: 0,
    };

    // Clean storyboard_elements
    const elements = await ctx.db.query("storyboard_elements").collect();
    for (const element of elements) {
      await ctx.db.delete(element._id);
      results.elements++;
    }

    // Clean storyboard_items
    const items = await ctx.db.query("storyboard_items").collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
      results.items++;
    }

    // Clean storyboard_files (if any remain)
    const files = await ctx.db.query("storyboard_files").collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
      results.files++;
    }

    // Removed: storyboard_credit_usage cleanup — table no longer exists.

    // Clean storyboard_projects (keep this for last as others reference it)
    const projects = await ctx.db.query("storyboard_projects").collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
      results.projects++;
    }

    console.log("[Cleanup] All storyboard tables cleaned!");
    console.log("[Cleanup] Results:", results);

    return results;
  },
});
