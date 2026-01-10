import { mutation } from "./_generated/server";

// Force fix mutation to mark ALL notifications as read
// This bypasses the take(10) limit and marks everything
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    console.log("=== FORCE FIX: Starting ===");
    console.log("User:", identity.subject);

    // Get ALL subscriptions (no limit, no time filter)
    const allSubscriptions = await ctx.db
      .query("subscription_transactions")
      .collect();

    // Get ALL purchases (no limit, no time filter)
    const allPurchases = await ctx.db
      .query("credits_ledger")
      .collect();

    // Get ALL tickets (no limit, no time filter)
    const allTickets = await ctx.db
      .query("support_tickets")
      .collect();

    console.log(`Found ${allSubscriptions.length} subscriptions, ${allPurchases.length} purchases, ${allTickets.length} tickets`);

    // Get existing read notifications
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const readIds = new Set(readNotifications.map(n => n.notificationId));
    console.log(`Already marked as read: ${readIds.size} notifications`);
    
    let markedCount = 0;
    const markedItems: any[] = [];
    
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
        markedItems.push({ type: 'subscription', id: subId, plan: sub.plan });
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
        markedItems.push({ type: 'purchase', id: purchaseId, tokens: purchase.tokens });
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
        markedItems.push({ type: 'ticket', id: ticketId, subject: ticket.subject });
      }
    }
    
    console.log(`=== FORCE FIX: Marked ${markedCount} notifications as read ===`);
    console.log("Marked items:", markedItems);
    
    return {
      success: true,
      markedCount,
      markedItems,
      message: `Successfully marked ${markedCount} notifications as read`,
    };
  },
});
