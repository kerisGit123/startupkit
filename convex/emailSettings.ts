import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get email settings
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("org_settings")
      .first();
    
    if (!settings) {
      return null;
    }

    return {
      emailEnabled: settings.emailEnabled ?? false,
      welcomeEmailEnabled: settings.sendWelcomeEmail ?? true,
      passwordResetEnabled: settings.sendPasswordResetEmail ?? true,
      subscriptionEmailEnabled: settings.sendSubscriptionEmails ?? true,
      paymentNotificationEnabled: settings.sendPaymentNotifications ?? true,
      usageAlertEnabled: settings.sendUsageAlerts ?? true,
      adminNotificationEnabled: settings.sendAdminNotifications ?? true,
      senderName: settings.emailFromName ?? "",
      senderEmail: settings.emailFromAddress ?? "",
    };
  },
});

// Update email settings
export const updateSettings = mutation({
  args: {
    emailEnabled: v.optional(v.boolean()),
    welcomeEmailEnabled: v.optional(v.boolean()),
    passwordResetEnabled: v.optional(v.boolean()),
    subscriptionEmailEnabled: v.optional(v.boolean()),
    paymentNotificationEnabled: v.optional(v.boolean()),
    usageAlertEnabled: v.optional(v.boolean()),
    adminNotificationEnabled: v.optional(v.boolean()),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("org_settings")
      .first();

    if (!settings) {
      // Create new settings if none exist
      await ctx.db.insert("org_settings", {
        companyId: "default",
        subjectType: "organization",
        emailEnabled: args.emailEnabled ?? false,
        sendWelcomeEmail: args.welcomeEmailEnabled ?? true,
        sendPasswordResetEmail: args.passwordResetEnabled ?? true,
        sendSubscriptionEmails: args.subscriptionEmailEnabled ?? true,
        sendPaymentNotifications: args.paymentNotificationEnabled ?? true,
        sendUsageAlerts: args.usageAlertEnabled ?? true,
        sendAdminNotifications: args.adminNotificationEnabled ?? true,
        emailFromName: args.senderName ?? "",
        emailFromAddress: args.senderEmail ?? "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: "system",
        updatedBy: "system",
      });
    } else {
      // Update existing settings - map to correct field names
      const updateData: any = {
        updatedAt: Date.now(),
        updatedBy: "system",
      };
      
      if (args.emailEnabled !== undefined) updateData.emailEnabled = args.emailEnabled;
      if (args.welcomeEmailEnabled !== undefined) updateData.sendWelcomeEmail = args.welcomeEmailEnabled;
      if (args.passwordResetEnabled !== undefined) updateData.sendPasswordResetEmail = args.passwordResetEnabled;
      if (args.subscriptionEmailEnabled !== undefined) updateData.sendSubscriptionEmails = args.subscriptionEmailEnabled;
      if (args.paymentNotificationEnabled !== undefined) updateData.sendPaymentNotifications = args.paymentNotificationEnabled;
      if (args.usageAlertEnabled !== undefined) updateData.sendUsageAlerts = args.usageAlertEnabled;
      if (args.adminNotificationEnabled !== undefined) updateData.sendAdminNotifications = args.adminNotificationEnabled;
      if (args.senderName !== undefined) updateData.emailFromName = args.senderName;
      if (args.senderEmail !== undefined) updateData.emailFromAddress = args.senderEmail;
      
      await ctx.db.patch(settings._id, updateData);
    }

    return { success: true };
  },
});
