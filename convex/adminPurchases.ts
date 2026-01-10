import { v } from "convex/values";
import { query } from "./_generated/server";

export const getAllPurchases = query({
  handler: async (ctx) => {
    const purchases = await ctx.db
      .query("credits_ledger")
      .order("desc")
      .collect();

    // Get user details for each purchase
    const purchasesWithUsers = await Promise.all(
      purchases.map(async (purchase) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", purchase.companyId))
          .first();

        return {
          ...purchase,
          userEmail: user?.email || "Unknown",
          userName: user?.fullName || user?.firstName || "Unknown",
        };
      })
    );

    return purchasesWithUsers;
  },
});

export const getPurchaseStats = query({
  handler: async (ctx) => {
    const purchases = await ctx.db.query("credits_ledger").collect();
    
    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const totalCredits = purchases.reduce((sum, p) => sum + p.tokens, 0);
    
    // Get this month's purchases
    const now = Date.now();
    const startOfMonth = new Date(new Date().setDate(1)).setHours(0, 0, 0, 0);
    const thisMonthPurchases = purchases.filter(p => p.createdAt >= startOfMonth);
    const monthlyRevenue = thisMonthPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    return {
      totalPurchases,
      totalRevenue: (totalRevenue / 100).toFixed(2), // Convert from cents
      totalCredits,
      monthlyRevenue: (monthlyRevenue / 100).toFixed(2),
      thisMonthPurchases: thisMonthPurchases.length,
    };
  },
});

export const getPurchasesByUser = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("credits_ledger")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    return purchases;
  },
});
