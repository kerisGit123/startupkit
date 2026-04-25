import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get company settings for the authenticated user's company
export const getCompanySettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const companyId = String(identity.orgId || identity.subject);
      const settings = await ctx.db
        .query("org_settings")
        .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
        .first();
      if (settings) return settings;
    }
    // Fallback to first record for backward compatibility
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
    companyTin: v.optional(v.string()),
    companyLicense: v.optional(v.string()),
    companyNote: v.optional(v.string()),
    defaultAI: v.optional(v.id("storyboard_kie_ai")),
    passwordResetLink: v.optional(v.string()),
    SSTRegNo: v.optional(v.string()),
    regNo: v.optional(v.string()),
    defaultTerm: v.optional(v.string()),
    websiteURL: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    bankName: v.optional(v.string()),
    paymentNote: v.optional(v.string()),
    serviceTaxCode: v.optional(v.string()),
    serviceTax: v.optional(v.number()),
    serviceTaxEnable: v.optional(v.boolean()),
    roundingEnable: v.optional(v.boolean()),
    documentFooter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's companyId
    const identity = await ctx.auth.getUserIdentity();
    const companyId = String(identity?.orgId || identity?.subject || "default");

    // Find settings for this specific company/user
    let settings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();

    // Fallback: check for legacy "default" record
    if (!settings) {
      settings = await ctx.db.query("org_settings").first();
    }

    if (!settings) {
      // Create new settings with correct companyId
      await ctx.db.insert("org_settings", {
        companyId,
        subjectType: identity?.orgId ? "organization" : "user",
        companyName: args.companyName,
        companyAddress: args.companyAddress,
        companyCountry: args.companyCountry,
        companyPhone: args.companyPhone,
        companyEmail: args.companyEmail,
        companyTin: args.companyTin,
        companyLicense: args.companyLicense,
        companyNote: args.companyNote,
        defaultAI: args.defaultAI,
        passwordResetLink: args.passwordResetLink,
        SSTRegNo: args.SSTRegNo,
        regNo: args.regNo,
        defaultTerm: args.defaultTerm,
        websiteURL: args.websiteURL,
        bankAccount: args.bankAccount,
        bankName: args.bankName,
        paymentNote: args.paymentNote,
        serviceTaxCode: args.serviceTaxCode,
        serviceTax: args.serviceTax,
        serviceTaxEnable: args.serviceTaxEnable,
        roundingEnable: args.roundingEnable,
        documentFooter: args.documentFooter,
        updatedAt: Date.now(),
        updatedBy: identity?.subject || "system",
      });
    } else {
      // Update existing settings — also fix companyId if it's "default"
      await ctx.db.patch(settings._id, {
        ...(settings.companyId === "default" ? { companyId } : {}),
        companyName: args.companyName ?? settings.companyName,
        companyAddress: args.companyAddress ?? settings.companyAddress,
        companyCountry: args.companyCountry ?? settings.companyCountry,
        companyPhone: args.companyPhone ?? settings.companyPhone,
        companyEmail: args.companyEmail ?? settings.companyEmail,
        companyTin: args.companyTin ?? settings.companyTin,
        companyLicense: args.companyLicense ?? settings.companyLicense,
        companyNote: args.companyNote ?? settings.companyNote,
        defaultAI: args.defaultAI ?? settings.defaultAI,
        passwordResetLink: args.passwordResetLink ?? settings.passwordResetLink,
        SSTRegNo: args.SSTRegNo ?? settings.SSTRegNo,
        regNo: args.regNo ?? settings.regNo,
        defaultTerm: args.defaultTerm ?? settings.defaultTerm,
        websiteURL: args.websiteURL ?? settings.websiteURL,
        bankAccount: args.bankAccount ?? settings.bankAccount,
        bankName: args.bankName ?? settings.bankName,
        paymentNote: args.paymentNote ?? settings.paymentNote,
        serviceTaxCode: args.serviceTaxCode ?? settings.serviceTaxCode,
        serviceTax: args.serviceTax ?? settings.serviceTax,
        serviceTaxEnable: args.serviceTaxEnable ?? settings.serviceTaxEnable,
        roundingEnable: args.roundingEnable ?? settings.roundingEnable,
        documentFooter: args.documentFooter ?? settings.documentFooter,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});
