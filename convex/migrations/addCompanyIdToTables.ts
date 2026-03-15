import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Add companyId to all storyboard tables
export const addCompanyIdToProjects = mutation({
  handler: async (ctx) => {
    // This would be handled by Convex schema updates
    // In production, you'd update the schema definition in schema.ts
    console.log("Adding companyId to storyboard_projects");
  },
});

export const addCompanyIdToElements = mutation({
  handler: async (ctx) => {
    console.log("Adding companyId to storyboard_elements");
  },
});

export const addCompanyIdToItems = mutation({
  handler: async (ctx) => {
    console.log("Adding companyId to storyboard_items");
  },
});

export const addCompanyIdToFiles = mutation({
  handler: async (ctx) => {
    console.log("Adding companyId to storyboard_files");
  },
});

export const addCompanyIdToMembers = mutation({
  handler: async (ctx) => {
    console.log("Adding companyId to storyboard_members");
  },
});

export const addCompanyIdToCreditUsage = mutation({
  handler: async (ctx) => {
    console.log("Adding companyId to storyboard_credit_usage");
  },
});

// Populate companyId from existing relationships
export const populateCompanyId = mutation({
  handler: async (ctx) => {
    // Get all projects
    const projects = await ctx.db.query("storyboard_projects").collect();
    
    for (const project of projects) {
      // Get project owner's organization
      // Note: This assumes you have a users table or Clerk integration
      // In production, you'd get the orgId from Clerk
      const mockOrgId = `org_${project.createdBy}`; // Mock implementation
      
      await ctx.db.patch(project._id, {
        companyId: mockOrgId
      });
      
      // Update all elements in this project
      const elements = await ctx.db
        .query("storyboard_elements")
        .collect()
        .then(elements => elements.filter(el => el.projectId === project._id));
      
      for (const element of elements) {
        await ctx.db.patch(element._id, {
          companyId: mockOrgId
        });
      }
      
      // Update all frames in this project
      const frames = await ctx.db
        .query("storyboard_items")
        .collect()
        .then(frames => frames.filter(frame => frame.projectId === project._id));
      
      for (const frame of frames) {
        await ctx.db.patch(frame._id, {
          companyId: mockOrgId
        });
      }
      
      // Update all files in this project
      const files = await ctx.db
        .query("storyboard_files")
        .collect()
        .then(files => files.filter(file => file.projectId === project._id));
      
      for (const file of files) {
        await ctx.db.patch(file._id, {
          companyId: mockOrgId
        });
      }
      
      // Update all members in this project
      const members = await ctx.db
        .query("storyboard_members")
        .collect()
        .then(members => members.filter(member => member.projectId === project._id));
      
      for (const member of members) {
        await ctx.db.patch(member._id, {
          companyId: mockOrgId
        });
      }
      
      // Update all credit usage in this project
      const creditUsage = await ctx.db
        .query("storyboard_credit_usage")
        .collect()
        .then(usage => usage.filter(usage => usage.projectId === project._id));
      
      for (const usage of creditUsage) {
        await ctx.db.patch(usage._id, {
          companyId: mockOrgId
        });
      }
    }
    
    console.log("Populated companyId for all existing records");
  },
});
