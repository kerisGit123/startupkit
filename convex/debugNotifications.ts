import { query } from "./_generated/server";

// Debug query to identify the 5 unread notifications
export const identifyUnreadNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "Not authenticated" };
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

    // Get read notifications
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const readIds = new Set(readNotifications.map(n => n.notificationId));
    
    // Find unread items
    const unreadItems = [];
    
    for (const sub of recentSubscriptions) {
      const subId = sub._id.toString();
      if (!readIds.has(subId)) {
        unreadItems.push({
          type: 'subscription',
          id: subId,
          plan: sub.plan,
          action: sub.action,
          companyId: sub.companyId,
          createdAt: sub.createdAt,
          createdAtDate: new Date(sub.createdAt).toISOString(),
        });
      }
    }
    
    for (const purchase of recentPurchases) {
      const purchaseId = purchase._id.toString();
      if (!readIds.has(purchaseId)) {
        unreadItems.push({
          type: 'purchase',
          id: purchaseId,
          tokens: purchase.tokens,
          amountPaid: purchase.amountPaid,
          companyId: purchase.companyId,
          createdAt: purchase.createdAt,
          createdAtDate: new Date(purchase.createdAt).toISOString(),
        });
      }
    }
    
    for (const ticket of recentTickets) {
      const ticketId = ticket._id.toString();
      if (!readIds.has(ticketId)) {
        unreadItems.push({
          type: 'ticket',
          id: ticketId,
          subject: ticket.subject,
          ticketNumber: ticket.ticketNumber,
          userEmail: ticket.userEmail,
          createdAt: ticket.createdAt,
          createdAtDate: new Date(ticket.createdAt).toISOString(),
        });
      }
    }
    
    // Sort by creation time
    unreadItems.sort((a, b) => b.createdAt - a.createdAt);
    
    return {
      userId: identity.subject,
      totalUnread: unreadItems.length,
      totalRead: readNotifications.length,
      totalSubscriptions: recentSubscriptions.length,
      totalPurchases: recentPurchases.length,
      totalTickets: recentTickets.length,
      unreadItems: unreadItems,
      readNotificationIds: Array.from(readIds),
    };
  },
});
