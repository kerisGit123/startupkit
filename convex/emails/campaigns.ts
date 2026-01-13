import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const listCampaigns = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("email_campaigns")
      .order("desc")
      .collect();
  },
});

export const getCampaign = query({
  args: { campaignId: v.id("email_campaigns") },
  handler: async (ctx, { campaignId }) => {
    return await ctx.db.get(campaignId);
  },
});

export const createCampaign = mutation({
  args: {
    name: v.string(),
    templateId: v.id("email_templates"),
    recipientType: v.union(
      v.literal("all_users"),
      v.literal("specific_users"),
      v.literal("user_segment"),
      v.literal("active_7_days"),
      v.literal("inactive_1_month"),
      v.literal("user_label")
    ),
    recipientIds: v.optional(v.array(v.string())),
    userLabel: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get template to use its subject
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    
    // Count recipients
    let totalRecipients = 0;
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    if (args.recipientType === "all_users") {
      const users = await ctx.db.query("users").collect();
      totalRecipients = users.filter(u => !u.deletionTime).length;
    } else if (args.recipientType === "active_7_days") {
      const users = await ctx.db.query("users").collect();
      totalRecipients = users.filter(u => 
        !u.deletionTime && 
        u.lastActivityAt && 
        u.lastActivityAt >= sevenDaysAgo
      ).length;
    } else if (args.recipientType === "inactive_1_month") {
      const users = await ctx.db.query("users").collect();
      totalRecipients = users.filter(u => 
        !u.deletionTime && 
        (!u.lastActivityAt || u.lastActivityAt < oneMonthAgo)
      ).length;
    } else if (args.recipientType === "user_label") {
      const users = await ctx.db.query("users").collect();
      totalRecipients = users.filter(u => 
        !u.deletionTime && 
        u.userTags?.includes(args.userLabel || "")
      ).length;
    } else if (args.recipientType === "user_segment") {
      const users = await ctx.db.query("users").collect();
      totalRecipients = users.filter(u => !u.deletionTime).length;
    } else {
      totalRecipients = args.recipientIds?.length || 0;
    }

    return await ctx.db.insert("email_campaigns", {
      name: args.name,
      subject: template.subject,
      templateId: args.templateId,
      recipientType: args.recipientType,
      recipientUserIds: args.recipientIds,
      userLabel: args.userLabel,
      status: args.scheduledAt ? "scheduled" : "draft",
      scheduledAt: args.scheduledAt,
      totalRecipients,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      failedCount: 0,
      createdBy: "admin", // TODO: Get from auth
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const sendCampaign = mutation({
  args: { 
    campaignId: v.id("email_campaigns"),
    testMode: v.optional(v.boolean()), // If true, log to database instead of sending
  },
  handler: async (ctx, { campaignId, testMode = false }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    // Check if templateId exists
    if (!campaign.templateId) {
      throw new Error("Campaign has no template assigned");
    }

    const template = await ctx.db.get(campaign.templateId);
    if (!template) {
      throw new Error(`Template not found for ID: ${campaign.templateId}`);
    }

    // Get platform config
    const emailSettings = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "email"))
      .collect();
    
    const settings: Record<string, any> = {};
    for (const setting of emailSettings) {
      settings[setting.key] = setting.value;
    }

    // Check if system notification (test mode) is enabled
    const useTestMode = testMode || settings.useSystemNotification === true;

    if (!useTestMode && !settings.resendApiKey) {
      throw new Error("Resend API key not configured. Enable System Notification (test mode) to log emails without sending.");
    }

    // Get recipients
    let recipients: any[] = [];
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    if (campaign.recipientType === "all_users") {
      recipients = await ctx.db.query("users").collect();
      recipients = recipients.filter(u => !u.deletionTime && u.email);
    } else if (campaign.recipientType === "active_7_days") {
      const users = await ctx.db.query("users").collect();
      recipients = users.filter(u => 
        !u.deletionTime && 
        u.email &&
        u.lastActivityAt && 
        u.lastActivityAt >= sevenDaysAgo
      );
    } else if (campaign.recipientType === "inactive_1_month") {
      const users = await ctx.db.query("users").collect();
      recipients = users.filter(u => 
        !u.deletionTime && 
        u.email &&
        (!u.lastActivityAt || u.lastActivityAt < oneMonthAgo)
      );
    } else if (campaign.recipientType === "user_label") {
      const users = await ctx.db.query("users").collect();
      recipients = users.filter(u => 
        !u.deletionTime && 
        u.email &&
        u.userTags?.includes(campaign.userLabel || "")
      );
    } else if (campaign.recipientType === "user_segment") {
      const allUsers = await ctx.db.query("users").collect();
      recipients = allUsers.filter(u => !u.deletionTime && u.email);
    } else if (campaign.recipientType === "specific_users" && campaign.recipientUserIds) {
      // Find users by email address
      for (const emailOrId of campaign.recipientUserIds) {
        // Try to find by email first
        const userByEmail = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("email"), emailOrId))
          .first();
        
        if (userByEmail && !userByEmail.deletionTime && userByEmail.email) {
          recipients.push(userByEmail);
        } else {
          // Fallback: try by clerkUserId
          const userById = await ctx.db
            .query("users")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", emailOrId))
            .first();
          if (userById && !userById.deletionTime && userById.email) {
            recipients.push(userById);
          }
        }
      }
    } else if (campaign.recipientUserIds) {
      for (const userId of campaign.recipientUserIds) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", userId))
          .first();
        if (user && !user.deletionTime && user.email) {
          recipients.push(user);
        }
      }
    }

    // Update campaign status
    await ctx.db.patch(campaignId, {
      status: "sending",
      sentAt: Date.now(),
    });

    let sentCount = 0;

    // Load all variables from platform_config
    const platformVariables = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "variable"))
      .collect();
    
    const variablesFromConfig: Record<string, string> = {};
    for (const variable of platformVariables) {
      variablesFromConfig[variable.key] = variable.value;
    }

    // Get company settings for company variables
    const companySettings = await ctx.db.query("org_settings").first();

    for (const user of recipients) {
      try {
        // Build variables for this user
        // Priority: Programmatic > Dynamic > Static (from platform_config)
        const now = new Date();
        const variables: Record<string, string> = {
          // Programmatic variables (highest priority)
          current_year: now.getFullYear().toString(),
          event_date: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
          event_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
          
          // Dynamic variables from database
          user_name: user.fullName || user.firstName || user.email?.split('@')[0] || "User",
          company_name: companySettings?.companyName || settings.emailFromName || "StartupKit",
          company_email: companySettings?.companyEmail || settings.emailFromAddress || "support@startupkit.com",
          company_phone: companySettings?.companyPhone || "",
          company_address: companySettings?.companyAddress || "",
          
          // Static variables from platform_config (lowest priority, will be overridden if already set)
          ...variablesFromConfig,
        };

        // Replace variables in template
        let htmlContent = template.html || template.htmlBody || "";
        let subject = template.subject || "";
        
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{${key}\\}`, 'g');
          htmlContent = htmlContent.replace(regex, value);
          subject = subject.replace(regex, value);
        }

        if (useTestMode) {
          // TEST MODE: Log to database instead of sending
          await ctx.db.insert("email_logs", {
            sentTo: user.email!,
            subject,
            htmlContent,
            textContent: "",
            templateType: template.type || "custom",
            templateName: template.name,
            campaignId,
            variables,
            status: "logged",
            createdAt: Date.now(),
          });
        } else {
          // PRODUCTION MODE: Actually send via Resend
          // TODO: Integrate with Resend API here
          
          // Log to email_logs for record keeping
          await ctx.db.insert("email_logs", {
            sentTo: user.email!,
            subject,
            htmlContent,
            textContent: "",
            templateType: template.type || "custom",
            templateName: template.name,
            campaignId,
            variables,
            status: "sent",
            createdAt: Date.now(),
          });
        }

        // Log event for analytics
        await ctx.db.insert("email_events", {
          campaignId,
          userId: user.clerkUserId || user._id,
          userEmail: user.email!,
          eventType: "sent",
          timestamp: Date.now(),
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to process email for ${user.email}:`, error);
        
        // Log failed email
        await ctx.db.insert("email_logs", {
          sentTo: user.email!,
          subject: template.subject || "",
          htmlContent: template.html || template.htmlBody || "",
          templateType: template.type || "custom",
          templateName: template.name,
          campaignId,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          createdAt: Date.now(),
        });
      }
    }

    // Update campaign
    await ctx.db.patch(campaignId, {
      status: "sent",
      sentCount,
      deliveredCount: sentCount,
    });

    return { sentCount };
  },
});

export const pauseCampaign = mutation({
  args: { campaignId: v.id("email_campaigns") },
  handler: async (ctx, { campaignId }) => {
    await ctx.db.patch(campaignId, { 
      status: "draft",
      updatedAt: Date.now(),
    });
  },
});

export const resumeCampaign = mutation({
  args: { campaignId: v.id("email_campaigns") },
  handler: async (ctx, { campaignId }) => {
    await ctx.db.patch(campaignId, { 
      status: "sending",
      updatedAt: Date.now(),
    });
  },
});

export const deleteCampaign = mutation({
  args: { campaignId: v.id("email_campaigns") },
  handler: async (ctx, { campaignId }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign) throw new Error("Campaign not found");
    
    // Allow deletion of any campaign
    await ctx.db.delete(campaignId);
  },
});
