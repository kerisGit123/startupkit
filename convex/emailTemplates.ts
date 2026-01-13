import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all email templates
export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("email_templates")
      .order("desc")
      .collect();
    return templates;
  },
});

// Get template by type
export const getTemplateByType = query({
  args: { 
    type: v.union(
      v.literal("welcome"),
      v.literal("password_reset"),
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("usage_alert"),
      v.literal("admin_notification"),
      v.literal("custom")
    )
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("email_templates")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    return template;
  },
});

// Get template by ID
export const getTemplate = query({
  args: { id: v.id("email_templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("welcome"),
      v.literal("password_reset"),
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("usage_alert"),
      v.literal("admin_notification"),
      v.literal("custom")
    ),
    subject: v.string(),
    htmlBody: v.string(),
    plainTextBody: v.optional(v.string()),
    variables: v.array(v.string()),
    isActive: v.boolean(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert("email_templates", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "admin",
    });
    return templateId;
  },
});

// Update template
export const updateTemplate = mutation({
  args: {
    id: v.id("email_templates"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    htmlBody: v.optional(v.string()),
    plainTextBody: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Delete template
export const deleteTemplate = mutation({
  args: { id: v.id("email_templates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Replace variables in template
export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

// Auto-generate default templates
export const generateDefaultTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultTemplates = [
      {
        name: "Welcome Email - Default",
        type: "welcome" as const,
        subject: "Welcome to {{company_name}}, {{username}}! 🎉",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to {{company_name}}! 🎉</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hi {{username}},</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Thank you for signing up! We're thrilled to have you join our community.</p>
              <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 18px; color: #1e40af; margin: 0; font-weight: bold;">🎁 Welcome Gift: {{credits}} Credits</p>
                <p style="font-size: 14px; color: #1e40af; margin: 10px 0 0 0;">Start exploring all our features right away!</p>
              </div>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">Here's what you can do next:</p>
              <ul style="color: #374151; line-height: 1.8;">
                <li>Complete your profile</li>
                <li>Explore our features</li>
                <li>Check out our getting started guide</li>
              </ul>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">If you have any questions, our support team is here to help!</p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 30px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
            </div>
          </div>
        `,
        plainTextBody: "Welcome to {{company_name}}! 🎉\n\nHi {{username}},\n\nThank you for signing up! We're thrilled to have you join our community.\n\n🎁 Welcome Gift: {{credits}} Credits\nStart exploring all our features right away!\n\nHere's what you can do next:\n- Complete your profile\n- Explore our features\n- Check out our getting started guide\n\nIf you have any questions, our support team is here to help!\n\nBest regards,\nThe {{company_name}} Team",
        variables: ["username", "company_name", "credits"],
        isActive: true,
        isDefault: true,
      },
      {
        name: "Password Reset",
        type: "password_reset" as const,
        subject: "Reset Your Password - {{company_name}}",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Reset Your Password</h1>
            <p>Hi {{username}},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{link}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The {{company_name}} Team</p>
          </div>
        `,
        plainTextBody: "Reset Your Password\n\nHi {{username}},\n\nWe received a request to reset your password. Click the link below:\n\n{{link}}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe {{company_name}} Team",
        variables: ["username", "link", "company_name"],
        isActive: true,
        isDefault: true,
      },
      {
        name: "Subscription Confirmation",
        type: "subscription" as const,
        subject: "Subscription Confirmed - {{plan}} Plan",
        htmlBody: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\"><h1 style=\"color: #333;\">Subscription Confirmed!</h1><p>Hi {{username}},</p><p>Your subscription to the <strong>{{plan}}</strong> plan has been confirmed.</p><p><strong>Amount:</strong> ${{amount}}</p><p><strong>Date:</strong> {{date}}</p><p>Thank you for your continued support!</p><p>Best regards,<br>The {{company_name}} Team</p></div>",
        plainTextBody: "Subscription Confirmed!\n\nHi {{username}},\n\nYour subscription to the {{plan}} plan has been confirmed.\n\nAmount: ${{amount}}\nDate: {{date}}\n\nThank you for your continued support!\n\nBest regards,\nThe {{company_name}} Team",
        variables: ["username", "plan", "date", "company_name"],
        isActive: true,
        isDefault: true,
      },
      {
        name: "Payment Receipt",
        type: "payment" as const,
        subject: "Payment Receipt - {{company_name}}",
        htmlBody: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\"><h1 style=\"color: #333;\">Payment Receipt</h1><p>Hi {{username}},</p><p>Thank you for your payment!</p><p><strong>Amount:</strong> ${{amount}}</p><p><strong>Credits Added:</strong> {{credits}}</p><p><strong>Date:</strong> {{date}}</p><p>Your payment has been processed successfully.</p><p>Best regards,<br>The {{company_name}} Team</p></div>",
        plainTextBody: "Payment Receipt\n\nHi {{username}},\n\nThank you for your payment!\n\nAmount: ${{amount}}\nCredits Added: {{credits}}\nDate: {{date}}\n\nYour payment has been processed successfully.\n\nBest regards,\nThe {{company_name}} Team",
        variables: ["username", "credits", "date", "company_name"],
        isActive: true,
        isDefault: true,
      },
      {
        name: "Usage Alert",
        type: "usage_alert" as const,
        subject: "Usage Alert - Low Credits",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff6b6b;">Usage Alert</h1>
            <p>Hi {{username}},</p>
            <p>Your credit balance is running low.</p>
            <p><strong>Current Balance:</strong> {{credits}} credits</p>
            <p>Consider purchasing more credits to continue using our services without interruption.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{link}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Purchase Credits</a>
            </div>
            <p>Best regards,<br>The {{company_name}} Team</p>
          </div>
        `,
        plainTextBody: "Usage Alert\n\nHi {{username}},\n\nYour credit balance is running low.\n\nCurrent Balance: {{credits}} credits\n\nConsider purchasing more credits to continue using our services.\n\nPurchase Credits: {{link}}\n\nBest regards,\nThe {{company_name}} Team",
        variables: ["username", "credits", "link", "company_name"],
        isActive: true,
        isDefault: true,
      },
      {
        name: "Admin Notification",
        type: "admin_notification" as const,
        subject: "Admin Alert - {{company_name}}",
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Admin Notification</h1>
            <p>Hi Admin,</p>
            <p>This is an automated notification from {{company_name}}.</p>
            <p><strong>User:</strong> {{username}} ({{email}})</p>
            <p><strong>Date:</strong> {{date}}</p>
            <p>Please review and take appropriate action if needed.</p>
            <p>Best regards,<br>System</p>
          </div>
        `,
        plainTextBody: "Admin Notification\n\nHi Admin,\n\nThis is an automated notification from {{company_name}}.\n\nUser: {{username}} ({{email}})\nDate: {{date}}\n\nPlease review and take appropriate action if needed.\n\nBest regards,\nSystem",
        variables: ["username", "email", "date", "company_name"],
        isActive: true,
        isDefault: true,
      },
    ];

    const createdIds = [];
    for (const template of defaultTemplates) {
      // Check if template already exists
      const existing = await ctx.db
        .query("email_templates")
        .withIndex("by_type", (q) => q.eq("type", template.type))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("email_templates", {
          name: template.name,
          type: template.type,
          subject: template.subject,
          htmlBody: template.htmlBody,
          plainTextBody: template.plainTextBody,
          variables: template.variables,
          isActive: template.isActive,
          isDefault: template.isDefault,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "system",
        });
        createdIds.push(id);
      }
    }

    return { success: true, created: createdIds.length };
  },
});
