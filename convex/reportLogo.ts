import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for report logo
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Save report logo storage ID
export const saveReportLogo = mutation({
  args: {
    storageId: v.string(),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = args.companyId || "default";
    
    // Check if report logo already exists
    const existing = await ctx.db
      .query("report_logos")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .first();

    if (existing) {
      // Delete old logo file from storage
      if (existing.storageId) {
        await ctx.storage.delete(existing.storageId);
      }
      
      // Update with new logo
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        updatedAt: Date.now(),
      });
      
      return existing._id;
    } else {
      // Create new logo entry
      const logoId = await ctx.db.insert("report_logos", {
        companyId,
        storageId: args.storageId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      return logoId;
    }
  },
});

// Get report logo URL
export const getReportLogoUrl = query({
  args: {
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = args.companyId || "default";
    
    const logo = await ctx.db
      .query("report_logos")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .first();

    if (!logo || !logo.storageId) {
      return null;
    }

    const url = await ctx.storage.getUrl(logo.storageId);
    return url;
  },
});

// Delete report logo
export const deleteReportLogo = mutation({
  args: {
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = args.companyId || "default";
    
    const logo = await ctx.db
      .query("report_logos")
      .filter((q) => q.eq(q.field("companyId"), companyId))
      .first();

    if (logo) {
      // Delete file from storage
      if (logo.storageId) {
        await ctx.storage.delete(logo.storageId);
      }
      
      // Delete database entry
      await ctx.db.delete(logo._id);
    }
  },
});
