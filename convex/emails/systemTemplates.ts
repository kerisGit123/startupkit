import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Generate or regenerate a system email template
export const generateSystemTemplate = mutation({
  args: {
    templateType: v.union(
      v.literal("welcome_email"),
      v.literal("password_reset"),
      v.literal("subscription_email"),
      v.literal("payment_notification"),
      v.literal("usage_alert"),
      v.literal("admin_notification")
    ),
    overwrite: v.boolean(),
  },
  handler: async (ctx, args) => {
    const key = `template_${args.templateType}`;
    
    // Check if template exists
    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    
    if (existing && !args.overwrite) {
      return { 
        success: false, 
        error: "Template already exists. Set overwrite=true to replace it." 
      };
    }
    
    // Generate template based on type
    const template = getDefaultTemplate(args.templateType);
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: template,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("platform_config", {
        key,
        value: template,
        category: "email_template_system",
        description: `System template for ${args.templateType.replace(/_/g, ' ')}`,
        isEncrypted: false,
        updatedAt: Date.now(),
        updatedBy: "system",
      });
    }
    
    return { success: true, template };
  },
});

// Check if a system template exists
export const checkTemplateExists = query({
  args: {
    templateType: v.string(),
  },
  handler: async (ctx, { templateType }) => {
    const key = `template_${templateType}`;
    const template = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    
    return {
      exists: !!template,
      template: template?.value,
    };
  },
});

// Get all system template statuses
export const getAllTemplateStatuses = query({
  args: {},
  handler: async (ctx) => {
    const templateTypes = [
      "welcome_email",
      "password_reset",
      "subscription_email",
      "payment_notification",
      "usage_alert",
      "admin_notification",
    ];
    
    const statuses: Record<string, boolean> = {};
    
    for (const type of templateTypes) {
      const key = `template_${type}`;
      const template = await ctx.db
        .query("platform_config")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      statuses[type] = !!template;
    }
    
    return statuses;
  },
});

// Helper function to get default template HTML
function getDefaultTemplate(type: string) {
  const templates: Record<string, { subject: string; html: string; variables: string[]; lastGenerated: number; isCustomized: boolean }> = {
    welcome_email: {
      subject: "Welcome to {company_name}!",
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 30px; background: #ffffff; }
            .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #5568d3; }
            .features { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .feature-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .feature-item:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">Welcome to {company_name}!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">We're thrilled to have you on board</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hi {user_name},</p>
              <p>Thank you for joining {company_name}! Your account has been successfully created and you're all set to get started.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{login_link}" class="button">Get Started →</a>
              </div>
              
              <div class="features">
                <h3 style="margin-top: 0;">What you can do:</h3>
                <div class="feature-item">✓ Access all premium features</div>
                <div class="feature-item">✓ Manage your account settings</div>
                <div class="feature-item">✓ Track your usage and analytics</div>
                <div class="feature-item">✓ Get 24/7 customer support</div>
              </div>
              
              <p>If you have any questions or need help getting started, don't hesitate to reach out to us at <a href="mailto:{company_email}">{company_email}</a>.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>The {company_name} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; {current_year} {company_name}. All rights reserved.</p>
              <p style="margin: 10px 0;">{company_address}</p>
              <p><a href="{unsubscribe_link}" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ["company_name", "user_name", "login_link", "company_email", "current_year", "company_address", "unsubscribe_link"],
      lastGenerated: Date.now(),
      isCustomized: false,
    },
    
    password_reset: {
      subject: "Reset Your Password - {company_name}",
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 30px; background: #ffffff; }
            .button { display: inline-block; padding: 14px 32px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi {user_name},</p>
              <p>We received a request to reset your password for your {company_name} account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_password_link}" class="button">Reset Password</a>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                For security reasons, we never send your password via email. If you're having trouble, please contact our support team at <a href="mailto:{company_email}">{company_email}</a>.
              </p>
            </div>
            <div class="footer">
              <p>&copy; {current_year} {company_name}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ["user_name", "company_name", "reset_password_link", "company_email", "current_year"],
      lastGenerated: Date.now(),
      isCustomized: false,
    },
    
    subscription_email: {
      subject: "Your Subscription Update - {company_name}",
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 30px; background: #ffffff; }
            .info-box { background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📋 Subscription Update</h1>
            </div>
            <div class="content">
              <p>Hi {user_name},</p>
              <p>This is a notification about your {company_name} subscription.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">Subscription Details</h3>
                <p><strong>Plan:</strong> {subscription_plan}</p>
                <p><strong>Status:</strong> {subscription_status}</p>
                <p><strong>Next Billing Date:</strong> {next_billing_date}</p>
              </div>
              
              <p>You can manage your subscription, update payment methods, or view your billing history anytime from your account dashboard.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{login_link}" class="button">Manage Subscription</a>
              </div>
              
              <p>If you have any questions about your subscription, please contact us at <a href="mailto:{company_email}">{company_email}</a>.</p>
            </div>
            <div class="footer">
              <p>&copy; {current_year} {company_name}</p>
              <p><a href="{unsubscribe_link}" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ["user_name", "company_name", "subscription_plan", "subscription_status", "next_billing_date", "login_link", "company_email", "current_year", "unsubscribe_link"],
      lastGenerated: Date.now(),
      isCustomized: false,
    },
    
    payment_notification: {
      subject: "Payment Confirmation - {company_name}",
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 30px; background: #ffffff; }
            .payment-box { background: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #3b82f6; margin: 10px 0; }
            .button { display: inline-block; padding: 14px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✓ Payment Received</h1>
            </div>
            <div class="content">
              <p>Hi {user_name},</p>
              <p>Thank you! We've successfully received your payment.</p>
              
              <div class="payment-box">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <div class="amount">{payment_amount}</div>
                <p><strong>Date:</strong> {payment_date}</p>
                <p><strong>Payment Method:</strong> {payment_method}</p>
                <p><strong>Invoice:</strong> #{invoice_number}</p>
              </div>
              
              <p>Your payment has been processed and your account has been updated accordingly.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{invoice_link}" class="button">View Invoice</a>
              </div>
              
              <p>If you have any questions about this payment, please contact us at <a href="mailto:{company_email}">{company_email}</a>.</p>
            </div>
            <div class="footer">
              <p>&copy; {current_year} {company_name}</p>
              <p>{company_address}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ["user_name", "payment_amount", "payment_date", "payment_method", "invoice_number", "invoice_link", "company_email", "current_year", "company_name", "company_address"],
      lastGenerated: Date.now(),
      isCustomized: false,
    },
    
    usage_alert: {
      subject: "Usage Alert - {company_name}",
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 30px; background: #ffffff; }
            .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .usage-bar { background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .usage-fill { background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .button { display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Usage Alert</h1>
            </div>
            <div class="content">
              <p>Hi {user_name},</p>
              <p>This is a notification about your {company_name} usage.</p>
              
              <div class="alert-box">
                <h3 style="margin-top: 0; color: #f59e0b;">Current Usage</h3>
                <div class="usage-bar">
                  <div class="usage-fill" style="width: {usage_percentage}%;">
                    {usage_amount} / {usage_limit}
                  </div>
                </div>
                <p style="margin-bottom: 0;"><strong>You've used {usage_percentage}% of your limit</strong></p>
              </div>
              
              <p>To avoid service interruption, consider upgrading your plan or purchasing additional credits.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{login_link}" class="button">Upgrade Plan</a>
              </div>
              
              <p>Questions? Contact us at <a href="mailto:{company_email}">{company_email}</a>.</p>
            </div>
            <div class="footer">
              <p>&copy; {current_year} {company_name}</p>
              <p><a href="{unsubscribe_link}" style="color: #6b7280;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ["user_name", "company_name", "usage_amount", "usage_limit", "usage_percentage", "login_link", "company_email", "current_year", "unsubscribe_link"],
      lastGenerated: Date.now(),
      isCustomized: false,
    },
    
    admin_notification: {
      subject: "Admin Alert - {company_name}",
      html: String.raw`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6366f1; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 30px; background: #ffffff; }
            .notification-box { background: #eef2ff; border: 2px solid #6366f1; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; padding: 14px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔔 Admin Notification</h1>
            </div>
            <div class="content">
              <p>Hi Admin,</p>
              <p>This is an administrative notification from {company_name}.</p>
              
              <div class="notification-box">
                <h3 style="margin-top: 0; color: #6366f1;">Notification Details</h3>
                <p><strong>Type:</strong> {notification_type}</p>
                <p><strong>Priority:</strong> {notification_priority}</p>
                <p><strong>Time:</strong> {notification_time}</p>
                <hr style="border: none; border-top: 1px solid #c7d2fe; margin: 15px 0;">
                <p>{notification_message}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{admin_dashboard_link}" class="button">View Dashboard</a>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
                This is an automated administrative notification. Please do not reply to this email.
              </p>
            </div>
            <div class="footer">
              <p>&copy; {current_year} {company_name}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      variables: ["notification_type", "notification_priority", "notification_time", "notification_message", "admin_dashboard_link", "company_name", "current_year"],
      lastGenerated: Date.now(),
      isCustomized: false,
    },
  };
  
  return templates[type] || templates.welcome_email;
}
