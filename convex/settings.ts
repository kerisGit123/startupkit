import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensureOrgSettings = mutation({
  args: {
    companyId: v.string(),
    subjectType: v.union(v.literal("organization"), v.literal("user")),
    aiEnabled: v.boolean(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    const now = Date.now();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("org_settings", {
      companyId: args.companyId,
      subjectType: args.subjectType,
      aiEnabled: args.aiEnabled,
      updatedAt: now,
      updatedBy: args.updatedBy,
      createdAt: now,
    });
  },
});

export const getSettings = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const settings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    return settings ?? null;
  },
});

export const updateSettings = mutation({
  args: {
    companyId: v.string(),
    // Company Information
    companyName: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyTin: v.optional(v.string()),
    companyLicense: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    companyEmail: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companyTimezone: v.optional(v.string()),
    companyCurrency: v.optional(v.string()),
    companyNote: v.optional(v.string()),
    
    // Additional Business Details
    companyVatNumber: v.optional(v.string()),
    companyRegistrationNumber: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    technicalContactEmail: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    
    // Legacy fields
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    
    // API Keys (should be encrypted before passing)
    secretKey: v.optional(v.string()),
    openaiKey: v.optional(v.string()),
    openaiSecret: v.optional(v.string()),
    
    // Activity Tracking
    lastActivityCheck: v.optional(v.number()),
    lastApiCallAt: v.optional(v.number()),
    totalApiCall: v.optional(v.number()),
    
    // System Fields
    aiEnabled: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    const now = Date.now();

    const updateData: Record<string, string | number | boolean | undefined> = {
      updatedAt: now,
      updatedBy: args.updatedBy,
    };

    // Add all optional fields if provided
    if (args.companyName !== undefined) updateData.companyName = args.companyName;
    if (args.companyAddress !== undefined) updateData.companyAddress = args.companyAddress;
    if (args.companyCountry !== undefined) updateData.companyCountry = args.companyCountry;
    if (args.companyTin !== undefined) updateData.companyTin = args.companyTin;
    if (args.companyLicense !== undefined) updateData.companyLicense = args.companyLicense;
    if (args.companyPhone !== undefined) updateData.companyPhone = args.companyPhone;
    if (args.companyEmail !== undefined) updateData.companyEmail = args.companyEmail;
    if (args.companyWebsite !== undefined) updateData.companyWebsite = args.companyWebsite;
    if (args.companyTimezone !== undefined) updateData.companyTimezone = args.companyTimezone;
    if (args.companyCurrency !== undefined) updateData.companyCurrency = args.companyCurrency;
    if (args.companyNote !== undefined) updateData.companyNote = args.companyNote;
    if (args.companyVatNumber !== undefined) updateData.companyVatNumber = args.companyVatNumber;
    if (args.companyRegistrationNumber !== undefined) updateData.companyRegistrationNumber = args.companyRegistrationNumber;
    if (args.billingEmail !== undefined) updateData.billingEmail = args.billingEmail;
    if (args.technicalContactEmail !== undefined) updateData.technicalContactEmail = args.technicalContactEmail;
    if (args.companySize !== undefined) updateData.companySize = args.companySize;
    if (args.industry !== undefined) updateData.industry = args.industry;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.contactNumber !== undefined) updateData.contactNumber = args.contactNumber;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.secretKey !== undefined) updateData.secretKey = args.secretKey;
    if (args.openaiKey !== undefined) updateData.openaiKey = args.openaiKey;
    if (args.openaiSecret !== undefined) updateData.openaiSecret = args.openaiSecret;
    if (args.lastActivityCheck !== undefined) updateData.lastActivityCheck = args.lastActivityCheck;
    if (args.lastApiCallAt !== undefined) updateData.lastApiCallAt = args.lastApiCallAt;
    if (args.totalApiCall !== undefined) updateData.totalApiCall = args.totalApiCall;
    if (args.aiEnabled !== undefined) updateData.aiEnabled = args.aiEnabled;
    if (args.onboardingCompletedAt !== undefined) updateData.onboardingCompletedAt = args.onboardingCompletedAt;
    if (args.trialEndsAt !== undefined) updateData.trialEndsAt = args.trialEndsAt;

    if (!existing) {
      // Create new settings if they don't exist
      return await ctx.db.insert("org_settings", {
        companyId: args.companyId,
        subjectType: "organization",
        createdAt: now,
        updatedAt: now,
        updatedBy: args.updatedBy,
        ...updateData,
      });
    }

    await ctx.db.patch(existing._id, updateData);

    return existing._id;
  },
});
