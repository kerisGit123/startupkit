import { mutation } from "./_generated/server";

// Force fix mutation to mark all notifications as read
// This is exposed in the admin UI as a button
export const forceMarkAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get ALL items (no time filter - force everything)
    const allSubscriptions = await ctx.db
      .query("subscription_transactions")
      .collect();

    const allPurchases = await ctx.db
      .query("credits_ledger")
      .collect();

    const allTickets = await ctx.db
      .query("support_tickets")
      .collect();

    // Get existing read notifications
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const readIds = new Set(readNotifications.map(n => n.notificationId));
    
    let markedCount = 0;
    
    // Mark ALL subscriptions as read
    for (const sub of allSubscriptions) {
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
    
    // Mark ALL purchases as read
    for (const purchase of allPurchases) {
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
    
    // Mark ALL tickets as read
    for (const ticket of allTickets) {
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
      message: `Successfully marked ${markedCount} notifications as read`,
    };
  },
});
