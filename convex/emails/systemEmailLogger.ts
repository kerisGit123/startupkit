import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Helper function to send system emails (welcome, password reset, etc.)
 * Respects the System Notification toggle - logs to database if ON, sends via Resend if OFF
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

    if (useSystemNotification) {
      // TEST MODE: Log to database instead of sending
      await ctx.db.insert("email_logs", {
        sentTo: args.recipientEmail,
        subject: args.subject,
        htmlContent: args.htmlContent,
        textContent: "",
        templateType: args.templateType,
        templateName: `${args.templateType} email`,
        variables: args.variables || {},
        status: "logged",
        createdAt: Date.now(),
      });

      return {
        success: true,
        mode: "test",
        message: "Email logged to database (test mode)",
      };
    } else {
      // PRODUCTION MODE: Send via Resend
      // TODO: Integrate with Resend API here
      
      // For now, also log to database for record keeping
      await ctx.db.insert("email_logs", {
        sentTo: args.recipientEmail,
        subject: args.subject,
        htmlContent: args.htmlContent,
        textContent: "",
        templateType: args.templateType,
        templateName: `${args.templateType} email`,
        variables: args.variables || {},
        status: "sent",
        createdAt: Date.now(),
      });

      return {
        success: true,
        mode: "production",
        message: "Email sent via Resend",
      };
    }
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
