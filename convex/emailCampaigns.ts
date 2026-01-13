import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// List all campaigns
export const listCampaigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("email_campaigns")
      .order("desc")
      .collect();
  },
});

// Get campaign by ID
export const getCampaign = query({
  args: { id: v.id("email_campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create campaign
export const createCampaign = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
    plainTextBody: v.optional(v.string()),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("active_users"),
      v.literal("inactive_users"),
      v.literal("premium_users"),
      v.literal("free_users"),
      v.literal("custom")
    ),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.db.insert("email_campaigns", {
      ...args,
      isActive: true, // New campaigns are active by default
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "admin",
    });
    return campaignId;
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    id: v.id("email_campaigns"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    htmlBody: v.optional(v.string()),
    targetAudience: v.optional(v.union(
      v.literal("all"),
      v.literal("active_users"),
      v.literal("inactive_users"),
      v.literal("premium_users"),
      v.literal("free_users"),
      v.literal("custom")
    )),
    isActive: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("cancelled")
    )),
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

// Send campaign immediately
export const sendCampaign = action({
  args: { campaignId: v.id("email_campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.runQuery(api.emailCampaigns.getCampaign, {
      id: args.campaignId,
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Update status to sending
    await ctx.runMutation(api.emailCampaigns.updateCampaign, {
      id: args.campaignId,
      status: "sending",
    });

    // Get recipients based on target audience
    const recipients = await ctx.runQuery(api.emailCampaigns.getRecipients, {
      targetAudience: campaign.targetAudience,
    });

    // Send emails (batch processing)
    let sentCount = 0;
    for (const recipient of recipients) {
      try {
        // Create recipient record
        await ctx.runMutation(api.emailCampaigns.createRecipient, {
          campaignId: args.campaignId,
          userId: recipient._id,
          email: recipient.email || "",
        });

        // TODO: Integrate with Resend to send actual email
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
      }
    }

    // Update campaign status
    await ctx.runMutation(api.emailCampaigns.updateCampaign, {
      id: args.campaignId,
      status: "sent",
    });

    await ctx.runMutation(api.emailCampaigns.updateCampaignStats, {
      id: args.campaignId,
      sentCount,
      totalRecipients: recipients.length,
    });

    return { success: true, sentCount, totalRecipients: recipients.length };
  },
});

// Get recipients based on audience
export const getRecipients = query({
  args: {
    targetAudience: v.union(
      v.literal("all"),
      v.literal("active_users"),
      v.literal("inactive_users"),
      v.literal("premium_users"),
      v.literal("free_users"),
      v.literal("custom")
    ),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();

    switch (args.targetAudience) {
      case "all":
        return allUsers;
      case "active_users":
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return allUsers.filter(u => (u.lastActivityAt || 0) > sevenDaysAgo);
      case "inactive_users":
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return allUsers.filter(u => (u.lastActivityAt || 0) < thirtyDaysAgo);
      default:
        return allUsers;
    }
  },
});

// Create recipient record
export const createRecipient = mutation({
  args: {
    campaignId: v.id("email_campaigns"),
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("campaign_recipients", {
      ...args,
      status: "sent",
      sentAt: Date.now(),
    });
  },
});

// Update campaign stats
export const updateCampaignStats = mutation({
  args: {
    id: v.id("email_campaigns"),
    sentCount: v.number(),
    totalRecipients: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...stats } = args;
    await ctx.db.patch(id, {
      ...stats,
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Track email event
export const trackEvent = mutation({
  args: {
    campaignId: v.optional(v.id("email_campaigns")),
    email: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed")
    ),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("email_events", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get campaign analytics
export const getCampaignAnalytics = query({
  args: { campaignId: v.id("email_campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    const events = await ctx.db
      .query("email_events")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const opened = events.filter(e => e.eventType === "opened").length;
    const clicked = events.filter(e => e.eventType === "clicked").length;
    const bounced = events.filter(e => e.eventType === "bounced").length;

    return {
      campaign,
      totalSent: campaign?.sentCount || 0,
      opened,
      clicked,
      bounced,
      openRate: campaign?.sentCount ? (opened / campaign.sentCount * 100).toFixed(2) : 0,
      clickRate: campaign?.sentCount ? (clicked / campaign.sentCount * 100).toFixed(2) : 0,
      bounceRate: campaign?.sentCount ? (bounced / campaign.sentCount * 100).toFixed(2) : 0,
    };
  },
});
