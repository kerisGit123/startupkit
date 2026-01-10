import { query } from "./_generated/server";

export const getAnalytics = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const purchases = await ctx.db.query("credits_ledger").collect();
    const subscriptions = await ctx.db.query("org_subscriptions").collect();

    // Revenue analytics - combine subscriptions and purchases
    const purchaseRevenue = purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0) / 100;
    const subscriptionRevenue = subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => {
        const plan = s.plan || "free";
        const prices: Record<string, number> = { starter: 19.90, pro: 29.00, business: 99 };
        return sum + (prices[plan] || 0);
      }, 0);
    
    const totalRevenue = purchaseRevenue + subscriptionRevenue;
    
    const thisMonthPurchaseRevenue = purchases
      .filter(p => {
        const createdDate = new Date(p.createdAt);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0) / 100;
    
    const thisMonthRevenue = thisMonthPurchaseRevenue + subscriptionRevenue;

    // User growth
    const activeUsers = users.filter(u => !u.deletionTime).length;
    const newUsersThisMonth = users.filter(u => {
      const createdDate = new Date(u._creationTime);
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length;

    // Subscription metrics
    const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
    const mrr = subscriptions
      .filter(s => s.status === "active")
      .reduce((sum, s) => {
        const plan = s.plan || "free";
        const prices: Record<string, number> = { starter: 19.90, pro: 29.00, business: 99 };
        return sum + (prices[plan] || 0);
      }, 0);

    // Monthly data for charts (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthPurchases = purchases.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === month && pDate.getFullYear() === year;
      });

      const monthUsers = users.filter(u => {
        const uDate = new Date(u._creationTime);
        return uDate.getMonth() === month && uDate.getFullYear() === year;
      });

      const monthSubs = subscriptions.filter(s => {
        const sDate = new Date(s.createdAt);
        return sDate.getMonth() === month && sDate.getFullYear() === year;
      });
      
      const monthSubRevenue = monthSubs.reduce((sum, s) => {
        const plan = s.plan || "free";
        const prices: Record<string, number> = { starter: 19.90, pro: 29.00, business: 99 };
        return sum + (prices[plan] || 0);
      }, 0);
      
      const monthPurchaseRevenue = monthPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0) / 100;

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthPurchaseRevenue + monthSubRevenue,
        users: monthUsers.length,
        purchases: monthPurchases.length,
      });
    }

    // Purchase and subscription monthly data
    const purchaseMonthlyData = [];
    const subscriptionMonthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const monthPurchases = purchases.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === month && pDate.getFullYear() === year;
      });

      const monthSubscriptions = subscriptions.filter(s => {
        const sDate = new Date(s.createdAt);
        return sDate.getMonth() === month && sDate.getFullYear() === year;
      });

      // Calculate total amount for subscriptions
      const subscriptionAmount = monthSubscriptions.reduce((sum, s) => {
        const plan = s.plan || "free";
        const prices: Record<string, number> = { starter: 19.90, pro: 29.00, business: 99 };
        return sum + (prices[plan] || 0);
      }, 0);

      purchaseMonthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        count: monthPurchases.length,
        amount: monthPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0) / 100,
      });

      subscriptionMonthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        count: monthSubscriptions.length,
        amount: subscriptionAmount,
      });
    }

    return {
      totalRevenue,
      thisMonthRevenue,
      activeUsers,
      newUsersThisMonth,
      activeSubscriptions,
      mrr,
      monthlyData,
      totalPurchases: purchases.length,
      totalSubscriptions: subscriptions.length,
      purchaseMonthlyData,
      subscriptionMonthlyData,
    };
  },
});
