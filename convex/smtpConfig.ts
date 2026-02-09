import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get SMTP settings from platform_config (category: "smtp")
export const getSmtpConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "smtp"))
      .collect();
    const config: Record<string, string> = {};
    for (const item of configs) {
      config[item.key] = String(item.value ?? "");
    }
    return {
      smtpHost: config.smtpHost || "",
      smtpPort: config.smtpPort || "587",
      smtpUsername: config.smtpUsername || "",
      smtpPassword: config.smtpPassword || "",
      smtpFromEmail: config.smtpFromEmail || "",
      smtpFromName: config.smtpFromName || "",
      smtpUseTLS: config.smtpUseTLS === "true",
      smtpApiKey: config.smtpApiKey || "",
      smtpActive: config.smtpActive === "true",
    };
  },
});

// Save SMTP settings to platform_config (category: "smtp")
export const updateSmtpConfig = mutation({
  args: {
    smtpHost: v.optional(v.string()),
    smtpPort: v.optional(v.string()),
    smtpUsername: v.optional(v.string()),
    smtpPassword: v.optional(v.string()),
    smtpFromEmail: v.optional(v.string()),
    smtpFromName: v.optional(v.string()),
    smtpUseTLS: v.optional(v.boolean()),
    smtpApiKey: v.optional(v.string()),
    smtpActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates = [
      { key: "smtpHost", value: args.smtpHost, description: "SMTP Host", isEncrypted: false },
      { key: "smtpPort", value: args.smtpPort, description: "SMTP Port", isEncrypted: false },
      { key: "smtpUsername", value: args.smtpUsername, description: "SMTP Username", isEncrypted: false },
      { key: "smtpPassword", value: args.smtpPassword, description: "SMTP Password", isEncrypted: true },
      { key: "smtpFromEmail", value: args.smtpFromEmail, description: "SMTP From Email", isEncrypted: false },
      { key: "smtpFromName", value: args.smtpFromName, description: "SMTP From Name", isEncrypted: false },
      { key: "smtpUseTLS", value: args.smtpUseTLS !== undefined ? String(args.smtpUseTLS) : undefined, description: "Use TLS/SSL", isEncrypted: false },
      { key: "smtpApiKey", value: args.smtpApiKey, description: "API Key (Brevo/Sendinblue)", isEncrypted: true },
      { key: "smtpActive", value: args.smtpActive !== undefined ? String(args.smtpActive) : undefined, description: "SMTP Active Toggle", isEncrypted: false },
    ];
    for (const update of updates) {
      if (update.value !== undefined) {
        const existing = await ctx.db
          .query("platform_config")
          .withIndex("by_category", (q) => q.eq("category", "smtp"))
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
            category: "smtp",
            description: update.description,
            isEncrypted: update.isEncrypted,
            updatedAt: Date.now(),
            updatedBy: "admin",
          });
        }
      }
    }
    return { success: true };
  },
});

