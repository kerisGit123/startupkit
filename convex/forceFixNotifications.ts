import { mutation } from "./_generated/server";

// NUCLEAR OPTION: Force mark ALL recent items as read
export const forceMarkAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Get ALL recent items (not just 10)
    const allSubscriptions = await ctx.db
      .query("subscription_transactions")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    const allPurchases = await ctx.db
      .query("credits_ledger")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    const allTickets = await ctx.db
      .query("support_tickets")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .collect();

    // Get existing read notifications
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const readIds = new Set(readNotifications.map(n => n.notificationId));
    
    let markedCount = 0;
    const markedItems = [];
    
    // Force mark ALL subscriptions as read
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
        markedItems.push({ type: 'subscription', id: subId, plan: sub.plan });
      }
    }
    
    // Force mark ALL purchases as read
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
        markedItems.push({ type: 'purchase', id: purchaseId, tokens: purchase.tokens });
      }
    }
    
    // Force mark ALL tickets as read
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
        markedItems.push({ type: 'ticket', id: ticketId, subject: ticket.subject });
      }
    }
    
    return {
      success: true,
      markedCount,
      markedItems,
      totalSubscriptions: allSubscriptions.length,
      totalPurchases: allPurchases.length,
      totalTickets: allTickets.length,
      message: `Force marked ${markedCount} notifications as read`,
    };
  },
});
