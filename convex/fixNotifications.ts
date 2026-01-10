import { mutation } from "./_generated/server";

// Mutation to clear notification read entries older than 7 days
export const clearOldReadNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Get all read notifications for this user
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    let deletedCount = 0;
    
    // Delete entries older than 7 days
    for (const notif of readNotifications) {
      if (notif.readAt < sevenDaysAgo) {
        await ctx.db.delete(notif._id);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} old notification read entries`,
    };
  },
});

// Mutation to mark all current notifications as read
export const markAllCurrentAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Get all recent items
    const recentSubscriptions = await ctx.db
      .query("subscription_transactions")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    const recentPurchases = await ctx.db
      .query("credits_ledger")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    const recentTickets = await ctx.db
      .query("support_tickets")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    // Get already read notifications
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const readIds = new Set(readNotifications.map(n => n.notificationId));
    
    let markedCount = 0;
    
    // Mark all unread subscriptions as read
    for (const sub of recentSubscriptions) {
      const subId = sub._id.toString();
      if (!readIds.has(subId)) {
        await ctx.db.insert("notifications_read", {
          notificationId: subId,
          type: sub.action === "canceled" ? "subscription_canceled" : "new_subscription",
          userId: identity.subject,
          readAt: Date.now(),
        });
        markedCount++;
      }
    }
    
    // Mark all unread purchases as read
    for (const purchase of recentPurchases) {
      const purchaseId = purchase._id.toString();
      if (!readIds.has(purchaseId)) {
        await ctx.db.insert("notifications_read", {
          notificationId: purchaseId,
          type: "new_purchase",
          userId: identity.subject,
          readAt: Date.now(),
        });
        markedCount++;
      }
    }
    
    // Mark all unread tickets as read
    for (const ticket of recentTickets) {
      const ticketId = ticket._id.toString();
      if (!readIds.has(ticketId)) {
        await ctx.db.insert("notifications_read", {
          notificationId: ticketId,
          type: "new_ticket",
          userId: identity.subject,
          readAt: Date.now(),
        });
        markedCount++;
      }
    }
    
    return {
      success: true,
      markedCount,
      message: `Marked ${markedCount} notifications as read`,
    };
  },
});
