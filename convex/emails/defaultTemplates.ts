import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Generate all 6 default email templates and store in email_templates table
export const generateAllDefaultTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = getDefaultTemplatesData();
    const results = [];
    
    for (const template of templates) {
      try {
        // Check if template already exists by type (not name) to prevent duplicates
        const existing = await ctx.db
          .query("email_templates")
          .filter((q) => q.and(
            q.eq(q.field("type"), template.type),
            q.eq(q.field("category"), "system")
          ))
          .first();
        
        if (existing) {
          // Update existing template
          await ctx.db.patch(existing._id, {
            name: template.name,
            subject: template.subject,
            html: template.html,
            htmlBody: template.html,
            variables: template.variables,
            type: template.type,
            category: "system",
            updatedAt: Date.now(),
            isActive: true,
          });
          results.push({ name: template.name, action: "updated", success: true });
        } else {
          // Create new template
          await ctx.db.insert("email_templates", {
            name: template.name,
            subject: template.subject,
            html: template.html,
            htmlBody: template.html,
            plainTextBody: "",
            variables: template.variables,
            type: template.type,
            category: "system",
            createdBy: "system",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true,
            isDefault: true,
          });
          results.push({ name: template.name, action: "created", success: true });
        }
      } catch (error) {
        results.push({ 
          name: template.name, 
          action: "failed", 
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount === templates.length,
      generated: successCount,
      total: templates.length,
      results,
    };
  },
});

// Get all email templates
export const getAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("email_templates")
      .order("desc")
      .collect();
  },
});

// Get template by ID
export const getTemplateById = query({
  args: { id: v.id("email_templates") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
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
      v.literal("admin_notification")
    )
  },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("email_templates")
      .filter((q) => q.eq(q.field("type"), type))
      .first();
  },
});

// Get all templates with their types (system templates only)
export const getTemplatesByTypes = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("email_templates")
      .filter((q) => q.eq(q.field("category"), "system"))
      .collect();
    
    return {
      welcome: templates.find(t => t.type === "welcome"),
      password_reset: templates.find(t => t.type === "password_reset"),
      subscription: templates.find(t => t.type === "subscription"),
      payment: templates.find(t => t.type === "payment"),
      usage_alert: templates.find(t => t.type === "usage_alert"),
      admin_notification: templates.find(t => t.type === "admin_notification"),
    };
  },
});

// Update template
export const updateTemplate = mutation({
  args: {
    id: v.id("email_templates"),
    subject: v.optional(v.string()),
    html: v.optional(v.string()),
    htmlBody: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Helper function to get default template data
function getDefaultTemplatesData() {
  return [
    {
      name: "Welcome Email",
      type: "welcome" as const,
      subject: "Welcome to {company_name}!",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
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
      <p>Thank you for joining {company_name}! Your account has been successfully created.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{login_link}" class="button">Get Started →</a>
      </div>
      <p>If you have any questions, reach out at {company_email}.</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["company_name", "user_name", "login_link", "company_email", "current_year"],
    },
    {
      name: "Password Reset",
      type: "password_reset" as const,
      subject: "Reset Your Password - {company_name}",
      html: `<!DOCTYPE html>
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
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "company_name", "reset_password_link", "current_year"],
    },
    {
      name: "Subscription Email",
      type: "subscription" as const,
      subject: "Subscription Payment - Invoice {invoiceNo}",
      html: `<!DOCTYPE html>
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
        <p><strong>Invoice Number:</strong> {invoiceNo}</p>
        <p><strong>Plan:</strong> {subscription_plan}</p>
        <p><strong>Amount:</strong> {amount}</p>
        <p><strong>Status:</strong> {subscription_status}</p>
        <p><strong>Next Billing Date:</strong> {next_billing_date}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{login_link}" class="button">Manage Subscription</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "company_name", "invoiceNo", "subscription_plan", "amount", "subscription_status", "next_billing_date", "login_link", "current_year"],
    },
    {
      name: "Payment Notification",
      type: "payment" as const,
      subject: "Payment Received - Invoice {invoiceNo}",
      html: `<!DOCTYPE html>
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
        <p><strong>Invoice Number:</strong> {invoiceNo}</p>
        <div class="amount">{payment_amount}</div>
        <p><strong>Credits Purchased:</strong> {credits_purchased}</p>
        <p><strong>Date:</strong> {payment_date}</p>
        <p><strong>Payment Method:</strong> {payment_method}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{invoice_link}" class="button">View Invoice</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "invoiceNo", "payment_amount", "credits_purchased", "payment_date", "payment_method", "invoice_link", "current_year", "company_name"],
    },
    {
      name: "Usage Alert",
      type: "usage_alert" as const,
      subject: "Usage Alert - {company_name}",
      html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 40px 30px; background: #ffffff; }
    .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 20px 0; }
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
        <p><strong>You've used {usage_percentage}% of your limit</strong></p>
        <p>{usage_amount} / {usage_limit}</p>
      </div>
      <p>To avoid service interruption, consider upgrading your plan.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{login_link}" class="button">Upgrade Plan</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["user_name", "company_name", "usage_amount", "usage_limit", "usage_percentage", "login_link", "current_year"],
    },
    {
      name: "Admin Notification",
      type: "admin_notification" as const,
      subject: "Admin Alert - {company_name}",
      html: `<!DOCTYPE html>
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
    </div>
    <div class="footer">
      <p>&copy; {current_year} {company_name}</p>
    </div>
  </div>
</body>
</html>`,
      variables: ["notification_type", "notification_priority", "notification_time", "notification_message", "admin_dashboard_link", "company_name", "current_year"],
    },
  ];
}
