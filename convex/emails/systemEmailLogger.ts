import { mutation, internalMutation } from "..//_generated/server";
import { action } from "..//_generated/server";
import { internalQuery } from "..//_generated/server";
import { v } from "convex/values";
import { internal } from "..//_generated/api";

/**
 * Internal mutation to log emails to database
 */
export const logSystemEmail = internalMutation({
  args: {
    sentTo: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    templateType: v.string(),
    variables: v.optional(v.any()),
    status: v.union(v.literal("logged"), v.literal("sent"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("email_logs", {
      sentTo: args.sentTo,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: "",
      templateType: args.templateType,
      templateName: `${args.templateType} email`,
      variables: args.variables || {},
      status: args.status,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });
  },
});

/**
 * Helper function to send system emails (welcome, password reset, etc.)
 * Respects the System Notification toggle - logs to database if ON, sends via SMTP if OFF
 * This is a mutation-based version for test/log mode only
 */
export const sendSystemEmail = mutation({
  args: {
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    templateType: v.union(
      v.literal("welcome"),
      v.literal("password_reset"),
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("usage_alert"),
      v.literal("admin_notification")
    ),
    subject: v.string(),
    htmlContent: v.string(),
    variables: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get platform config to check System Notification toggle
    const emailSettings = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "email"))
      .collect();
    
    const settings: Record<string, any> = {};
    for (const setting of emailSettings) {
      settings[setting.key] = setting.value;
    }

    const useSystemNotification = settings.useSystemNotification === true;

    // In mutation context, always log to DB. For actual sending, use the action version.
    await ctx.db.insert("email_logs", {
      sentTo: args.recipientEmail,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: "",
      templateType: args.templateType,
      templateName: `${args.templateType} email`,
      variables: args.variables || {},
      status: useSystemNotification ? "logged" : "logged",
      createdAt: Date.now(),
    });

    return {
      success: true,
      mode: useSystemNotification ? "test" : "pending",
      message: useSystemNotification
        ? "Email logged to database (test mode)"
        : "Email logged. Use sendSystemEmailAction for actual sending.",
    };
  },
});

/**
 * Action-based email sender that calls the Next.js SMTP API route.
 * Use this when you need to actually send emails from Convex actions.
 */
export const sendSystemEmailAction = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    templateType: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    variables: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Read email settings from platform_config via a query
    const settings = await ctx.runQuery(internal.emails.systemEmailLogger.getEmailConfig);

    const useSystemNotification = settings.useSystemNotification === true;

    if (useSystemNotification) {
      // TEST MODE: Log to database instead of sending
      await ctx.runMutation(internal.emails.systemEmailLogger.logSystemEmail, {
        sentTo: args.recipientEmail,
        subject: args.subject,
        htmlContent: args.htmlContent,
        templateType: args.templateType,
        variables: args.variables,
        status: "logged",
      });

      return {
        success: true,
        mode: "test",
        message: "Email logged to database (System Notification mode is ON)",
      };
    }

    // PRODUCTION MODE: Send via SMTP API route
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/send-system-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: args.recipientEmail,
          subject: args.subject,
          html: args.htmlContent,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || "SMTP send failed";
        await ctx.runMutation(internal.emails.systemEmailLogger.logSystemEmail, {
          sentTo: args.recipientEmail,
          subject: args.subject,
          htmlContent: args.htmlContent,
          templateType: args.templateType,
          variables: args.variables,
          status: "failed",
          errorMessage: errorMsg,
        });
        return { success: false, error: errorMsg };
      }

      // Log successful send
      await ctx.runMutation(internal.emails.systemEmailLogger.logSystemEmail, {
        sentTo: args.recipientEmail,
        subject: args.subject,
        htmlContent: args.htmlContent,
        templateType: args.templateType,
        variables: args.variables,
        status: "sent",
      });

      return {
        success: true,
        mode: "production",
        messageId: data.messageId,
        message: "Email sent via SMTP",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.emails.systemEmailLogger.logSystemEmail, {
        sentTo: args.recipientEmail,
        subject: args.subject,
        htmlContent: args.htmlContent,
        templateType: args.templateType,
        variables: args.variables,
        status: "failed",
        errorMessage: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  },
});

/**
 * Internal query to read email config from platform_config table.
 * Used by sendSystemEmailAction to check settings before sending.
 */
export const getEmailConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const emailSettings = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "email"))
      .collect();

    const settings: Record<string, string | boolean> = {};
    for (const setting of emailSettings) {
      settings[setting.key] = setting.value as string | boolean;
    }

    return settings;
  },
});

/**
 * Example usage in your auth/user management code:
 * 
 * // When a new user signs up:
 * await sendSystemEmail({
 *   recipientEmail: user.email,
 *   recipientName: user.fullName,
 *   templateType: "welcome",
 *   subject: "Welcome to StartupKit!",
 *   htmlContent: welcomeEmailHtml, // With variables already replaced
 *   variables: {
 *     user_name: user.fullName,
 *     company_name: "StartupKit",
 *     login_link: "https://app.startupkit.com/login"
 *   }
 * });
 * 
 * // When user requests password reset:
 * await sendSystemEmail({
 *   recipientEmail: user.email,
 *   recipientName: user.fullName,
 *   templateType: "password_reset",
 *   subject: "Reset Your Password",
 *   htmlContent: passwordResetHtml,
 *   variables: {
 *     user_name: user.fullName,
 *     reset_password_link: resetLink
 *   }
 * });
 */
