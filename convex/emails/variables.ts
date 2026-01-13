import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Variable Management System
 * Stores email template variables in platform_config with category = "variable"
 */

// List all variables
export const listVariables = query({
  handler: async (ctx) => {
    const variables = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "variable"))
      .collect();
    
    return variables.sort((a, b) => a.key.localeCompare(b.key));
  },
});

// Get single variable by key
export const getVariable = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const variable = await ctx.db
      .query("platform_config")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), "variable"),
          q.eq(q.field("key"), key)
        )
      )
      .first();
    
    return variable;
  },
});

// Save variable (create or update)
export const saveVariable = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { key, value, description }) => {
    // Check if variable already exists
    const existing = await ctx.db
      .query("platform_config")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), "variable"),
          q.eq(q.field("key"), key)
        )
      )
      .first();
    
    if (existing) {
      // Update existing variable
      await ctx.db.patch(existing._id, {
        value,
        description: description || key,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new variable
      return await ctx.db.insert("platform_config", {
        category: "variable",
        key,
        value,
        description: description || key,
        isEncrypted: false,
        updatedAt: Date.now(),
        updatedBy: "system",
      });
    }
  },
});

// Delete variable
export const deleteVariable = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const variable = await ctx.db
      .query("platform_config")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), "variable"),
          q.eq(q.field("key"), key)
        )
      )
      .first();
    
    if (variable) {
      await ctx.db.delete(variable._id);
    }
  },
});

// Auto-generate all default variables
export const generateDefaultVariables = mutation({
  handler: async (ctx) => {
    const defaultVariables = [
      // Global variables
      { key: "login_link", value: "https://app.startupkit.com/login", description: "login_link" },
      { key: "upgrade_plan", value: "https://app.startupkit.com/pricing", description: "upgrade_plan" },
      { key: "password_reset_link", value: "https://app.startupkit.com/reset-password", description: "password_reset_link" },
      { key: "subscription_plan", value: "https://app.startupkit.com/subscription", description: "subscription_plan" },
      
      // Welcome Email
      { key: "get_started_link", value: "https://app.startupkit.com/getting-started", description: "get_started_link" },
      
      // Subscription Email
      { key: "subscription_link", value: "https://app.startupkit.com/subscription", description: "subscription_link" },
      
      // Payment Notification
      { key: "payment_method", value: "Credit Card", description: "payment_method" },
      
      // Usage Alert
      { key: "usage_percentage", value: "80%", description: "usage_percentage" },
      { key: "usage_amount", value: "800", description: "usage_amount" },
      { key: "usage_limit", value: "1000", description: "usage_limit" },
      
      // Admin Notification
      { key: "notification_dashboard_link", value: "https://app.startupkit.com/admin", description: "notification_dashboard_link" },
      
      // Newsletter Template
      { key: "month", value: "January", description: "month" },
      { key: "article_1_title", value: "Article Title 1", description: "article_1_title" },
      { key: "article_1_summary", value: "This is a summary of the first article...", description: "article_1_summary" },
      { key: "article_1_link", value: "https://blog.startupkit.com/article-1", description: "article_1_link" },
      { key: "article_2_title", value: "Article Title 2", description: "article_2_title" },
      { key: "article_2_summary", value: "This is a summary of the second article...", description: "article_2_summary" },
      { key: "article_2_link", value: "https://blog.startupkit.com/article-2", description: "article_2_link" },
      { key: "article_3_title", value: "Article Title 3", description: "article_3_title" },
      { key: "article_3_summary", value: "This is a summary of the third article...", description: "article_3_summary" },
      { key: "article_3_link", value: "https://blog.startupkit.com/article-3", description: "article_3_link" },
      { key: "unsubscribe_link", value: "https://app.startupkit.com/unsubscribe", description: "unsubscribe_link" },
      
      // Engagement Email
      { key: "feature_1", value: "Advanced Analytics Dashboard", description: "feature_1" },
      { key: "feature_2", value: "Team Collaboration Tools", description: "feature_2" },
      { key: "feature_3", value: "Automated Workflows", description: "feature_3" },
      { key: "welcome_back_link", value: "https://app.startupkit.com/dashboard", description: "welcome_back_link" },
      
      // Product Update
      { key: "feature_name", value: "New Feature Name", description: "feature_name" },
      { key: "feature_description", value: "This feature helps you work more efficiently...", description: "feature_description" },
      { key: "benefit_1", value: "Save time with automation", description: "benefit_1" },
      { key: "benefit_2", value: "Improve team collaboration", description: "benefit_2" },
      { key: "benefit_3", value: "Get better insights", description: "benefit_3" },
      { key: "support_email", value: "support@startupkit.com", description: "support_email" },
      { key: "try_it_now_link", value: "https://app.startupkit.com/features", description: "try_it_now_link" },
      
      // Survey Request
      { key: "survey_duration", value: "5 minutes", description: "survey_duration" },
      { key: "survey_topic", value: "Product Feedback", description: "survey_topic" },
      { key: "incentive", value: "$10 Amazon Gift Card", description: "incentive" },
      { key: "survey_deadline", value: "31/01/2026", description: "survey_deadline" },
      { key: "rsvp_link", value: "https://app.startupkit.com/survey", description: "rsvp_link" },
      
      // Sales Announcement
      { key: "product_name", value: "Premium Plan", description: "product_name" },
      { key: "discount_percentage", value: "20%", description: "discount_percentage" },
      { key: "promo_code", value: "SAVE20", description: "promo_code" },
      { key: "expiry_date", value: "31/01/2026", description: "expiry_date" },
      { key: "attendee_count", value: "100", description: "attendee_count" },
      { key: "shownow_link", value: "https://app.startupkit.com/shop", description: "shownow_link" },
      
      // Event Invitation
      { key: "event_name", value: "Product Launch Event", description: "event_name" },
      { key: "event_location", value: "Virtual Event", description: "event_location" },
      { key: "event_description", value: "Join us for an exciting product launch...", description: "event_description" },
      { key: "rsvp_deadline", value: "31/01/2026", description: "rsvp_deadline" },
      { key: "event_rsvp_link", value: "https://app.startupkit.com/events/rsvp", description: "event_rsvp_link" },
    ];

    let created = 0;
    let skipped = 0;

    for (const variable of defaultVariables) {
      // Check if variable already exists
      const existing = await ctx.db
        .query("platform_config")
        .filter((q) => 
          q.and(
            q.eq(q.field("category"), "variable"),
            q.eq(q.field("key"), variable.key)
          )
        )
        .first();
      
      if (!existing) {
        // Create new variable
        await ctx.db.insert("platform_config", {
          category: "variable",
          key: variable.key,
          value: variable.value,
          description: variable.description,
          isEncrypted: false,
          updatedAt: Date.now(),
          updatedBy: "system",
        });
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped, total: defaultVariables.length };
  },
});

// Get variables grouped by template type
export const getVariablesByGroup = query({
  handler: async (ctx) => {
    const allVariables = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "variable"))
      .collect();
    
    const groups: Record<string, typeof allVariables> = {
      global: [],
      welcome: [],
      password_reset: [],
      subscription: [],
      payment: [],
      usage_alert: [],
      admin_notification: [],
      newsletter: [],
      engagement: [],
      product_update: [],
      survey: [],
      sales: [],
      event: [],
    };

    // Group variables by prefix/purpose
    for (const variable of allVariables) {
      const key = variable.key;
      
      if (["login_link", "upgrade_plan", "company_name", "company_email", "password_reset_link", "subscription_plan"].includes(key)) {
        groups.global.push(variable);
      } else if (key.startsWith("get_started")) {
        groups.welcome.push(variable);
      } else if (key.includes("password_reset")) {
        groups.password_reset.push(variable);
      } else if (key.includes("subscription") || key === "next_billing_date") {
        groups.subscription.push(variable);
      } else if (key.includes("payment") || key.includes("invoice") || key.includes("credits")) {
        groups.payment.push(variable);
      } else if (key.includes("usage")) {
        groups.usage_alert.push(variable);
      } else if (key.includes("notification")) {
        groups.admin_notification.push(variable);
      } else if (key.includes("article") || key === "month" || key === "unsubscribe_link") {
        groups.newsletter.push(variable);
      } else if (key.startsWith("feature_") || key === "welcome_back_link") {
        groups.engagement.push(variable);
      } else if (key.includes("benefit") || key === "support_email" || key === "try_it_now_link" || key === "feature_name" || key === "feature_description") {
        groups.product_update.push(variable);
      } else if (key.includes("survey") || key === "incentive" || (key === "rsvp_link" && !key.includes("event"))) {
        groups.survey.push(variable);
      } else if (key.includes("discount") || key.includes("promo") || key.includes("product_name") || key === "shownow_link" || key === "attendee_count" || (key === "expiry_date" && !key.includes("event"))) {
        groups.sales.push(variable);
      } else if (key.includes("event") || (key === "rsvp_deadline" && !key.includes("survey"))) {
        groups.event.push(variable);
      }
    }

    return groups;
  },
});
