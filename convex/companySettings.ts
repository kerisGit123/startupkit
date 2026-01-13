import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get company settings
export const getCompanySettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("org_settings").first();
    return settings;
  },
});

// Update company settings
export const updateCompanySettings = mutation({
  args: {
    companyName: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    companyEmail: v.optional(v.string()),
    passwordResetLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("org_settings").first();
    
    if (!settings) {
      // Create new settings if none exist
      await ctx.db.insert("org_settings", {
        companyId: "default",
        subjectType: "organization",
        companyName: args.companyName,
        companyAddress: args.companyAddress,
        companyCountry: args.companyCountry,
        companyPhone: args.companyPhone,
        companyEmail: args.companyEmail,
        passwordResetLink: args.passwordResetLink,
        updatedAt: Date.now(),
        updatedBy: "system",
      });
    } else {
      // Update existing settings
      await ctx.db.patch(settings._id, {
        companyName: args.companyName ?? settings.companyName,
        companyAddress: args.companyAddress ?? settings.companyAddress,
        companyCountry: args.companyCountry ?? settings.companyCountry,
        companyPhone: args.companyPhone ?? settings.companyPhone,
        companyEmail: args.companyEmail ?? settings.companyEmail,
        passwordResetLink: args.passwordResetLink ?? settings.passwordResetLink,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});
