import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const listTemplates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("email_templates")
      .order("desc")
      .collect();
  },
});

export const getTemplate = query({
  args: { templateId: v.id("email_templates") },
  handler: async (ctx, { templateId }) => {
    return await ctx.db.get(templateId);
  },
});

export const createTemplate = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    variables: v.array(v.string()),
    type: v.optional(v.union(
      v.literal("welcome"),
      v.literal("password_reset"),
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("usage_alert"),
      v.literal("admin_notification"),
      v.literal("custom")
    )),
    category: v.optional(v.union(v.literal("system"), v.literal("custom"), v.literal("campaign"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("email_templates", {
      name: args.name,
      subject: args.subject,
      htmlBody: args.htmlContent,
      plainTextBody: "",
      variables: args.variables,
      type: args.type || "custom",
      category: args.category || "custom",
      isActive: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("email_templates"),
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    variables: v.array(v.string()),
  },
  handler: async (ctx, { templateId, htmlContent, ...updates }) => {
    await ctx.db.patch(templateId, {
      ...updates,
      htmlBody: htmlContent,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("email_templates") },
  handler: async (ctx, { templateId }) => {
    const template = await ctx.db.get(templateId);
    if (template?.category === "custom") {
      await ctx.db.delete(templateId);
    } else if (template?.category === "system") {
      throw new Error("Cannot delete system templates");
    } else {
      throw new Error("Cannot delete this template");
    }
  },
});

export const duplicateTemplate = mutation({
  args: { templateId: v.id("email_templates") },
  handler: async (ctx, { templateId }) => {
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");
    
    const now = Date.now();
    return await ctx.db.insert("email_templates", {
      ...template,
      name: `${template.name} (Copy)`,
      category: "custom",
      createdAt: now,
      updatedAt: now,
    });
  },
});
