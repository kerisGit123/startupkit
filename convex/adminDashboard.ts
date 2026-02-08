import { query } from "./_generated/server";

const PLAN_PRICES: Record<string, number> = {
  starter: 19.90,
  pro: 29.00,
  business: 99.00,
};

export const getDashboardStats = query({
  handler: async (ctx) => {
    // Get all data
    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("org_subscriptions").collect();
    const purchases = await ctx.db.query("credits_ledger").collect();
    const tickets = await ctx.db.query("support_tickets").collect();

    // Calculate stats
    const totalUsers = users.length;
    const activeSubs = subscriptions.filter(s => s.status === "active");
    const activeSubscriptions = activeSubs.length;
    const canceledSubs = subscriptions.filter(s => s.status === "canceled" || s.status === "cancelled");
    
    // Calculate MRR
    let mrr = 0;
    activeSubs.forEach(sub => {
      mrr += PLAN_PRICES[sub.plan] || 0;
    });
    const arr = mrr * 12;

    // Churn rate (canceled in last 30 days / active at start of period)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentCanceled = canceledSubs.filter(s => 
      s.updatedAt && s.updatedAt >= thirtyDaysAgo
    ).length;
    const activeAtPeriodStart = subscriptions.filter(s => 
      s.createdAt < thirtyDaysAgo && (s.status === "active" || (s.updatedAt && s.updatedAt >= thirtyDaysAgo))
    ).length;
    const churnRate = activeAtPeriodStart > 0 ? (recentCanceled / activeAtPeriodStart) * 100 : 0;

    // Average subscription length (months)
    const subsWithDuration = subscriptions.filter(s => s.createdAt);
    const avgSubLengthMs = subsWithDuration.length > 0
      ? subsWithDuration.reduce((sum, s) => {
          const end = s.status === "active" ? Date.now() : (s.updatedAt || Date.now());
          return sum + (end - s.createdAt);
        }, 0) / subsWithDuration.length
      : 0;
    const avgSubLengthMonths = avgSubLengthMs / (30 * 24 * 60 * 60 * 1000);

    // Customer Lifetime Value (CLV) = Avg Sub Length (months) x ARPU (avg revenue per user per month)
    const arpu = activeSubscriptions > 0 ? mrr / activeSubscriptions : 0;
    const clv = arpu * avgSubLengthMonths;

    // Net Revenue Retention = (Starting MRR - Lost MRR + Expansion MRR) / Starting MRR
    // Simplified: compare MRR from subs that existed 30 days ago vs now
    const lastMonthActiveSubs = subscriptions.filter(s => s.createdAt < thirtyDaysAgo && s.status === "active");
    let lastMonthMRR = 0;
    lastMonthActiveSubs.forEach(s => { lastMonthMRR += PLAN_PRICES[s.plan] || 0; });
    const nrr = lastMonthMRR > 0 ? (mrr / lastMonthMRR) * 100 : 100;

    // Open tickets
    const openTickets = tickets.filter(t => 
      t.status === "open" || t.status === "in_progress"
    ).length;

    // Recent activity (last 30 days)
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

    // Today's bookings
    const todayStr = new Date().toDateString();
    const appointments = await ctx.db.query("chat_appointments").collect();
    const todaysBookings = appointments.filter(a => 
      a.appointmentDate && new Date(a.appointmentDate).toDateString() === todayStr
    ).length;

    return {
      totalUsers,
      activeSubscriptions,
      mrr: mrr.toFixed(2),
      arr: arr.toFixed(2),
      openTickets,
      newUsersThisMonth,
      newSubscriptionsThisMonth,
      totalRevenue: (totalRevenue / 100).toFixed(2),
      monthlyPurchaseRevenue: (monthlyPurchaseRevenue / 100).toFixed(2),
      totalPurchases: purchases.length,
      todaysBookings,
      // SaaS Metrics
      churnRate: churnRate.toFixed(1),
      avgSubLengthMonths: avgSubLengthMonths.toFixed(1),
      clv: clv.toFixed(2),
      nrr: nrr.toFixed(1),
      canceledSubscriptions: canceledSubs.length,
    };
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const activities: { type: string; action?: string; plan?: string; tokens?: number; amount?: number; userEmail: string; createdAt: number }[] = [];

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
