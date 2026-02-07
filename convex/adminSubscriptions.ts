import { v } from "convex/values";
import { query } from "./_generated/server";

export const getAllSubscriptions = query({
  handler: async (ctx) => {
    const subscriptions = await ctx.db
      .query("org_subscriptions")
      .order("desc")
      .collect();

    // Get user details for each subscription
    const subscriptionsWithUsers = await Promise.all(
      subscriptions.map(async (sub) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", sub.companyId))
          .first();

        return {
          ...sub,
          userEmail: user?.email || "Unknown",
          userName: user?.fullName || user?.firstName || "Unknown",
        };
      })
    );

    return subscriptionsWithUsers;
  },
});

const PLAN_PRICES: Record<string, number> = {
  starter: 19.90,
  pro: 29.00,
  business: 99.00,
};

export const getSubscriptionStats = query({
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("org_subscriptions").collect();
    
    const activeSubscriptions = subscriptions.filter(s => s.status === "active" && !s.cancelAtPeriodEnd);
    const cancelingSubscriptions = subscriptions.filter(s => s.cancelAtPeriodEnd);
    const canceledSubscriptions = subscriptions.filter(s => s.status === "canceled" || s.status === "cancelled");
    
    // Calculate MRR (Monthly Recurring Revenue) from active subs only
    let mrr = 0;
    activeSubscriptions.forEach(sub => {
      mrr += PLAN_PRICES[sub.plan] || 0;
    });
    // Include canceling subs (still active until period end)
    cancelingSubscriptions.forEach(sub => {
      if (sub.status === "active") {
        mrr += PLAN_PRICES[sub.plan] || 0;
      }
    });

    // Plan breakdown
    const planBreakdown: Record<string, number> = {};
    subscriptions.forEach(sub => {
      const plan = sub.plan || "unknown";
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    });

    // Churn rate (canceled / total)
    const churnRate = subscriptions.length > 0 
      ? ((canceledSubscriptions.length + cancelingSubscriptions.length) / subscriptions.length * 100).toFixed(1)
      : "0.0";

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length + cancelingSubscriptions.filter(s => s.status === "active").length,
      cancelingSubscriptions: cancelingSubscriptions.length,
      canceledSubscriptions: canceledSubscriptions.length,
      mrr: mrr.toFixed(2),
      churnRate,
      planBreakdown,
    };
  },
});

export const getSubscriptionsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("org_subscriptions")
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();

    return subscriptions;
  },
});
