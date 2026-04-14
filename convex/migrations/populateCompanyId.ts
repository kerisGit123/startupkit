import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration script to populate companyId for existing records
 * This should be run once after adding companyId fields to the schema
 */
export const populateCompanyId = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting companyId population...");

    // Get all projects that don't have companyId but have orgId
    const projects = await ctx.db
      .query("storyboard_projects")
      .collect();

    const projectsToUpdate = projects.filter(p => !p.companyId && p.orgId);
    console.log(`[Migration] Found ${projectsToUpdate.length} projects to update`);

    for (const project of projectsToUpdate) {
      // Use organization ID or user ID as companyId (direct logic)
      const companyId = project.orgId || project.ownerId;
      
      await ctx.db.patch(project._id, {
        companyId,
        updatedAt: Date.now(),
      });
      
      console.log(`[Migration] Updated project ${project._id} with companyId: ${companyId}`);
    }

    // Update all elements that don't have companyId
    const elements = await ctx.db
      .query("storyboard_elements")
      .collect();

    const elementsToUpdate = elements.filter(e => !e.companyId);
    console.log(`[Migration] Found ${elementsToUpdate.length} elements to update`);

    for (const element of elementsToUpdate) {
      // Get the project to inherit companyId
      const project = await ctx.db.get(element.projectId);
      const companyId = project?.orgId || project?.ownerId;
      
      await ctx.db.patch(element._id, {
        companyId,
        updatedAt: Date.now(),
      });
      
      console.log(`[Migration] Updated element ${element._id} with companyId: ${companyId}`);
    }

    // Update all storyboard items that don't have companyId
    const items = await ctx.db
      .query("storyboard_items")
      .collect();

    const itemsToUpdate = items.filter(i => !i.companyId);
    console.log(`[Migration] Found ${itemsToUpdate.length} storyboard items to update`);

    for (const item of itemsToUpdate) {
      // Get the project to inherit companyId
      const project = await ctx.db.get(item.projectId);
      const companyId = project?.orgId || project?.ownerId;
      
      await ctx.db.patch(item._id, {
        companyId,
        updatedAt: Date.now(),
      });
      
      console.log(`[Migration] Updated item ${item._id} with companyId: ${companyId}`);
    }

    // Update all files that don't have companyId
    const files = await ctx.db
      .query("storyboard_files")
      .collect();

    const filesToUpdate = files.filter(f => !f.companyId);
    console.log(`[Migration] Found ${filesToUpdate.length} files to update`);

    for (const file of filesToUpdate) {
      let companyId = `default-org`;
      
      // If file has a project, inherit companyId from project
      if (file.projectId) {
        const project = await ctx.db.get(file.projectId);
        companyId = project?.orgId || project?.ownerId;
      } else if (file.orgId) {
        // Use orgId as fallback
        companyId = file.orgId;
      }
      
      await ctx.db.patch(file._id, {
        companyId,
      });
      
      console.log(`[Migration] Updated file ${file._id} with companyId: ${companyId}`);
    }

    // Removed: update block for storyboard_credit_usage — table no longer exists.

    console.log("[Migration] companyId population completed!");
    
    return {
      projectsUpdated: projectsToUpdate.length,
      elementsUpdated: elementsToUpdate.length,
      itemsUpdated: itemsToUpdate.length,
      filesUpdated: filesToUpdate.length,
    };
  },
});

/**
 * Helper function to verify companyId migration was successful
 */
export const verifyCompanyIdMigration = query({
  args: {},
  handler: async (ctx) => {
    const results = {
      projects: {
        total: 0,
        withCompanyId: 0,
        withoutCompanyId: 0,
      },
      elements: {
        total: 0,
        withCompanyId: 0,
        withoutCompanyId: 0,
      },
      items: {
        total: 0,
        withCompanyId: 0,
        withoutCompanyId: 0,
      },
      files: {
        total: 0,
        withCompanyId: 0,
        withoutCompanyId: 0,
      },
    };

    // Check projects
    const projects = await ctx.db.query("storyboard_projects").collect();
    results.projects.total = projects.length;
    results.projects.withCompanyId = projects.filter(p => p.companyId).length;
    results.projects.withoutCompanyId = projects.filter(p => !p.companyId).length;

    // Check elements
    const elements = await ctx.db.query("storyboard_elements").collect();
    results.elements.total = elements.length;
    results.elements.withCompanyId = elements.filter(e => e.companyId).length;
    results.elements.withoutCompanyId = elements.filter(e => !e.companyId).length;

    // Check items
    const items = await ctx.db.query("storyboard_items").collect();
    results.items.total = items.length;
    results.items.withCompanyId = items.filter(i => i.companyId).length;
    results.items.withoutCompanyId = items.filter(i => !i.companyId).length;

    // Check files
    const files = await ctx.db.query("storyboard_files").collect();
    results.files.total = files.length;
    results.files.withCompanyId = files.filter(f => f.companyId).length;
    results.files.withoutCompanyId = files.filter(f => !f.companyId).length;

    // Removed: storyboard_credit_usage check — table no longer exists.

    return results;
  },
});
