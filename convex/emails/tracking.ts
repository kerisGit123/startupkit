import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Record an email open event (triggered by tracking pixel)
 */
export const recordOpen = mutation({
  args: {
    campaignId: v.id("email_campaigns"),
    userEmail: v.string(),
  },
  handler: async (ctx, { campaignId, userEmail }) => {
    // Check if already recorded for this user+campaign to avoid double counting
    const existing = await ctx.db
      .query("email_events")
      .filter((q) =>
        q.and(
          q.eq(q.field("campaignId"), campaignId),
          q.eq(q.field("userEmail"), userEmail),
          q.eq(q.field("eventType"), "opened")
        )
      )
      .first();

    if (existing) return; // Already tracked

    // Record event
    await ctx.db.insert("email_events", {
      campaignId,
      userId: "",
      userEmail,
      eventType: "opened",
      timestamp: Date.now(),
    });

    // Increment campaign opened count
    const campaign = await ctx.db.get(campaignId);
    if (campaign) {
      await ctx.db.patch(campaignId, {
        openedCount: (campaign.openedCount || 0) + 1,
      });
    }
  },
});

/**
 * Record an email unsubscribe event
 */
export const recordUnsubscribe = mutation({
  args: {
    userEmail: v.string(),
  },
  handler: async (ctx, { userEmail }) => {
    // Check if already unsubscribed
    const existing = await ctx.db
      .query("email_unsubscribes")
      .filter((q) => q.eq(q.field("email"), userEmail))
      .first();

    if (existing) return; // Already unsubscribed

    await ctx.db.insert("email_unsubscribes", {
      email: userEmail,
      unsubscribedFrom: "marketing",
      unsubscribedAt: Date.now(),
    });
  },
});

/**
 * Record an email click event (triggered by click redirect)
 */
export const recordClick = mutation({
  args: {
    campaignId: v.id("email_campaigns"),
    userEmail: v.string(),
    url: v.string(),
  },
  handler: async (ctx, { campaignId, userEmail, url }) => {
    // Check if already recorded for this user+campaign to avoid double counting
    const existing = await ctx.db
      .query("email_events")
      .filter((q) =>
        q.and(
          q.eq(q.field("campaignId"), campaignId),
          q.eq(q.field("userEmail"), userEmail),
          q.eq(q.field("eventType"), "clicked")
        )
      )
      .first();

    if (existing) return; // Already tracked

    // Record event
    await ctx.db.insert("email_events", {
      campaignId,
      userId: "",
      userEmail,
      eventType: "clicked",
      timestamp: Date.now(),
    });

    // Increment campaign clicked count
    const campaign = await ctx.db.get(campaignId);
    if (campaign) {
      await ctx.db.patch(campaignId, {
        clickedCount: (campaign.clickedCount || 0) + 1,
      });
    }
  },
});
