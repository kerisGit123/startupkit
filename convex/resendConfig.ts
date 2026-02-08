import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get Resend Configuration from platform_config (category = "resend")
 */
export const getResendConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "resend"))
      .collect();

    const config: Record<string, string> = {};
    for (const item of configs) {
      config[item.key] = String(item.value ?? "");
    }

    return {
      resendActive: config.resendActive === "true",
      resendApiKey: config.resendApiKey || "",
      resendFromEmail: config.resendFromEmail || "",
      resendFromName: config.resendFromName || "",
      resendReplyTo: config.resendReplyTo || "",
    };
  },
});

/**
 * Update Resend Configuration in platform_config
 */
export const updateResendConfig = mutation({
  args: {
    resendActive: v.optional(v.string()),
    resendApiKey: v.optional(v.string()),
    resendFromEmail: v.optional(v.string()),
    resendFromName: v.optional(v.string()),
    resendReplyTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates = [
      { key: "resendActive", value: args.resendActive, description: "Resend Active Toggle" },
      { key: "resendApiKey", value: args.resendApiKey, description: "Resend API Key", isEncrypted: true },
      { key: "resendFromEmail", value: args.resendFromEmail, description: "Resend From Email" },
      { key: "resendFromName", value: args.resendFromName, description: "Resend From Name" },
      { key: "resendReplyTo", value: args.resendReplyTo, description: "Resend Reply-To Email" },
    ];

    for (const update of updates) {
      if (update.value !== undefined) {
        // Must filter by BOTH category and key to avoid collisions with
        // same key names in other categories (e.g. "email" category)
        const existing = await ctx.db
          .query("platform_config")
          .withIndex("by_category", (q) => q.eq("category", "resend"))
          .filter((q) => q.eq(q.field("key"), update.key))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            value: update.value,
            updatedAt: Date.now(),
            updatedBy: "admin",
          });
        } else {
          await ctx.db.insert("platform_config", {
            key: update.key,
            value: update.value,
            category: "resend",
            description: update.description,
            isEncrypted: update.isEncrypted ?? false,
            updatedAt: Date.now(),
            updatedBy: "admin",
          });
        }
      }
    }

    return { success: true };
  },
});
