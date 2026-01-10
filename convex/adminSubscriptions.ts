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

export const getSubscriptionStats = query({
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("org_subscriptions").collect();
    
    const activeSubscriptions = subscriptions.filter(s => s.status === "active");
    const canceledSubscriptions = subscriptions.filter(s => s.cancelAtPeriodEnd);
    
    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    activeSubscriptions.forEach(sub => {
      if (sub.plan === "starter") {
        mrr += 19.90;
      } else if (sub.plan === "pro") {
        mrr += 29.00;
      }
    });

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      canceledSubscriptions: canceledSubscriptions.length,
      mrr: mrr.toFixed(2),
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
