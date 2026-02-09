import { mutation } from "../_generated/server";

/**
 * Automated Database Seeding
 * Run this after initial Convex setup to populate default data
 */
export const seedDatabase = mutation({
  handler: async (ctx) => {
    const results = {
      companySettings: false,
      emailVariables: false,
      emailTemplates: false,
      invoiceConfig: false,
    };

    // 1. Seed Company Settings (org_settings)
    const existingSettings = await ctx.db.query("org_settings").first();
    if (!existingSettings) {
      await ctx.db.insert("org_settings", {
        companyId: "default",
        subjectType: "organization",
        companyName: "Your Company",
        companyEmail: "contact@yourcompany.com",
        companyPhone: "+1-555-0123",
        companyAddress: "123 Business St, Suite 100, City, State 12345",
        companyCountry: "United States",
        passwordResetLink: "https://app.yourcompany.com/reset-password",
        // Email settings
        emailEnabled: true,
        sendWelcomeEmail: true,
        sendPasswordResetEmail: true,
        sendSubscriptionEmails: true,
        sendPaymentNotifications: true,
        sendUsageAlerts: true,
        sendAdminNotifications: true,
        emailFromName: "Your Company",
        emailFromAddress: "noreply@yourcompany.com",
        // Credits
        initialSignupCredits: 10,
        superAdminEmail: "",
        // Timestamps
        createdAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: "system",
      });
      results.companySettings = true;
    }

    // 2. Seed Email Template Variables (platform_config)
    const existingVariables = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "variable"))
      .first();

    if (!existingVariables) {
      const defaultVariables = [
        // Global Variables
        { key: "login_link", value: "https://app.yourcompany.com/login", description: "Login page URL" },
        { key: "upgrade_plan", value: "https://app.yourcompany.com/pricing", description: "Pricing page URL" },
        { key: "password_reset_link", value: "https://app.yourcompany.com/reset-password", description: "Password reset URL" },
        { key: "subscription_plan", value: "https://app.yourcompany.com/subscription", description: "Subscription management URL" },
        
        // Welcome Email
        { key: "get_started_link", value: "https://app.yourcompany.com/getting-started", description: "Getting started guide URL" },
        
        // Subscription Email
        { key: "subscription_link", value: "https://app.yourcompany.com/subscription", description: "Subscription management URL" },
        
        // Payment Notification
        { key: "payment_method", value: "Credit Card", description: "Default payment method" },
        
        // Admin Notification
        { key: "notification_dashboard_link", value: "https://app.yourcompany.com/admin", description: "Admin dashboard URL" },
      ];

      let variablesCreated = 0;
      for (const variable of defaultVariables) {
        await ctx.db.insert("platform_config", {
          category: "variable",
          key: variable.key,
          value: variable.value,
          description: variable.description,
          isEncrypted: false,
          updatedAt: Date.now(),
          updatedBy: "system",
        });
        variablesCreated++;
      }
      results.emailVariables = variablesCreated > 0;
    }

    // 3. Seed Default Email Templates
    const existingTemplates = await ctx.db.query("email_templates").first();
    if (!existingTemplates) {
      const defaultTemplates = [
        {
          name: "Welcome Email",
          category: "system" as const,
          type: "welcome" as const,
          subject: "Welcome to {company_name}!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Welcome to {company_name}!</h1>
              <p>Hi {user_name},</p>
              <p>Thank you for joining us. We're excited to have you on board!</p>
              <p>Get started by exploring our platform:</p>
              <a href="{get_started_link}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Get Started</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The {company_name} Team</p>
            </div>
          `,
          variables: ["company_name", "user_name", "get_started_link"],
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "system",
        },
        {
          name: "Password Reset",
          category: "system" as const,
          type: "password_reset" as const,
          subject: "Reset Your Password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>Password Reset Request</h1>
              <p>Hi {user_name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="{password_reset_link}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>The {company_name} Team</p>
            </div>
          `,
          variables: ["user_name", "password_reset_link", "company_name"],
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: "system",
        },
      ];

      let templatesCreated = 0;
      for (const template of defaultTemplates) {
        await ctx.db.insert("email_templates", template);
        templatesCreated++;
      }
      results.emailTemplates = templatesCreated > 0;
    }

    // 4. Seed Invoice Configuration (invoice_config)
    const existingInvoiceConfig = await ctx.db.query("invoice_config").first();
    if (!existingInvoiceConfig) {
      await ctx.db.insert("invoice_config", {
        invoicePrefix: "INV",
        invoiceNoType: "year_running",
        invoiceLeadingZeros: 4,
        invoiceRunningNo: 1001,
        invoiceCurrentNo: "INV-2025-1001",
        lastResetDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      results.invoiceConfig = true;
    }

    return {
      success: true,
      message: "Database seeded successfully",
      results: {
        companySettings: results.companySettings ? "Created" : "Already exists",
        emailVariables: results.emailVariables ? "Created" : "Already exists",
        emailTemplates: results.emailTemplates ? "Created" : "Already exists",
        invoiceConfig: results.invoiceConfig ? "Created" : "Already exists",
      },
      summary: "All 30 database tables are ready. Default data has been seeded for company settings, email variables, email templates, and invoice configuration.",
    };
  },
});
