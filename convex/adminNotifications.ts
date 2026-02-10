import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const subscriptions = await ctx.db
      .query("subscription_transactions")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .order("desc")
      .take(10);

    const purchases = await ctx.db
      .query("credits_ledger")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .order("desc")
      .take(10);

    const tickets = await ctx.db
      .query("support_tickets")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .order("desc")
      .take(10);

    const appointments = await ctx.db
      .query("chat_appointments")
      .filter((q) => q.gte(q.field("createdAt"), sevenDaysAgo))
      .order("desc")
      .take(10);

    const notifications: { id: string; type: string; title: string; description: string; time: number; read: boolean }[] = [];

    // Get all read notifications for this user
    const readNotifications = await ctx.db
      .query("notifications_read")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    
    const readIds = new Set(readNotifications.map(n => n.notificationId));

    // Add subscription notifications
    for (const sub of subscriptions) {
      const subId = sub._id.toString();
      notifications.push({
        id: subId,
        type: sub.action === "canceled" ? "subscription_canceled" : "new_subscription",
        title: sub.action === "canceled" 
          ? `Subscription Canceled - ${sub.plan || 'plan'}`
          : `New Subscription - ${sub.plan || 'plan'}`,
        description: sub.companyId,
        time: sub.createdAt,
        read: readIds.has(subId),
      });
    }

    // Add credit reward notifications (purchases, referrals, bonuses)
    for (const purchase of purchases) {
      const purchaseId = purchase._id.toString();
      const isPaid = purchase.amountPaid && purchase.amountPaid > 0;
      const title = isPaid 
        ? `Credit Purchase - ${purchase.tokens} credits`
        : `Credit Reward - ${purchase.tokens} credits`;
      const description = isPaid 
        ? `MYR ${purchase.amountPaid}`
        : "Referral/Signup Bonus";
      
      notifications.push({
        id: purchaseId,
        type: isPaid ? "credit_purchase" : "credit_reward",
        title,
        description,
        time: purchase.createdAt,
        read: readIds.has(purchaseId),
      });
    }

    // Add ticket notifications
    for (const ticket of tickets) {
      const ticketId = ticket._id.toString();
      notifications.push({
        id: ticketId,
        type: "new_ticket",
        title: `New Support Ticket - ${ticket.subject}`,
        description: ticket.userEmail,
        time: ticket.createdAt,
        read: readIds.has(ticketId),
      });
    }

    // Add booking appointment notifications
    for (const appt of appointments) {
      const apptId = appt._id.toString();
      notifications.push({
        id: apptId,
        type: "booking_appointment",
        title: `Booking Appointment - ${appt.customerName}`,
        description: `${appt.appointmentTime} | ${appt.purpose || "No purpose specified"}`,
        time: appt.createdAt,
        read: readIds.has(apptId),
      });
    }

    // Sort by time (most recent first)
    notifications.sort((a, b) => b.time - a.time);

    return notifications.slice(0, 30);
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.string(), type: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Check if already marked as read by this user
    const existing = await ctx.db
      .query("notifications_read")
      .withIndex("by_user_notification", (q) => 
        q.eq("userId", identity.subject).eq("notificationId", args.notificationId)
      )
      .first();
    
    if (!existing) {
      // Mark as read by inserting into notifications_read table
      await ctx.db.insert("notifications_read", {
        notificationId: args.notificationId,
        type: args.type,
        userId: identity.subject,
        readAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    // Count recent items (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
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
    
    let unreadCount = 0;
    
    for (const sub of recentSubscriptions) {
      if (!readIds.has(sub._id.toString())) unreadCount++;
    }
    for (const purchase of recentPurchases) {
      if (!readIds.has(purchase._id.toString())) unreadCount++;
    }
    for (const ticket of recentTickets) {
      if (!readIds.has(ticket._id.toString())) unreadCount++;
    }
    
    return unreadCount;
  },
});
