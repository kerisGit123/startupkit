import { query } from "./_generated/server";

export const getDashboardStats = query({
  handler: async (ctx) => {
    // Get all data
    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("org_subscriptions").collect();
    const purchases = await ctx.db.query("credits_ledger").collect();
    const tickets = await ctx.db.query("support_tickets").collect();

    // Calculate stats
    const totalUsers = users.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
    
    // Calculate MRR
    let mrr = 0;
    subscriptions.filter(s => s.status === "active").forEach(sub => {
      if (sub.plan === "starter") {
        mrr += 19.90;
      } else if (sub.plan === "pro") {
        mrr += 29.00;
      }
    });

    // Open tickets
    const openTickets = tickets.filter(t => 
      t.status === "open" || t.status === "in_progress"
    ).length;

    // Recent activity (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = users.filter(u => 
      u.createdAt && u.createdAt >= thirtyDaysAgo
    ).length;
    const newSubscriptionsThisMonth = subscriptions.filter(s => 
      s.createdAt >= thirtyDaysAgo
    ).length;

    // Revenue from purchases
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const monthlyPurchaseRevenue = purchases
      .filter(p => p.createdAt >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    return {
      totalUsers,
      activeSubscriptions,
      mrr: mrr.toFixed(2),
      openTickets,
      newUsersThisMonth,
      newSubscriptionsThisMonth,
      totalRevenue: (totalRevenue / 100).toFixed(2),
      monthlyPurchaseRevenue: (monthlyPurchaseRevenue / 100).toFixed(2),
      totalPurchases: purchases.length,
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const activities = [];

    // Get recent subscriptions
    const recentSubs = await ctx.db
      .query("subscription_transactions")
      .order("desc")
      .take(5);

    for (const sub of recentSubs) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", sub.companyId))
        .first();

      activities.push({
        type: "subscription",
        action: sub.action,
        plan: sub.plan,
        userEmail: user?.email || "Unknown",
        createdAt: sub.createdAt,
      });
    }

    // Get recent purchases
    const recentPurchases = await ctx.db
      .query("credits_ledger")
      .order("desc")
      .take(5);

    for (const purchase of recentPurchases) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", purchase.companyId))
        .first();

      activities.push({
        type: "purchase",
        tokens: purchase.tokens,
        amount: purchase.amountPaid,
        userEmail: user?.email || "Unknown",
        createdAt: purchase.createdAt,
      });
    }

    // Sort by date
    activities.sort((a, b) => b.createdAt - a.createdAt);

    return activities.slice(0, 10);
  },
});
