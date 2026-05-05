import { v } from "convex/values";
import { query } from "./_generated/server";

// Reads from financial_ledger (not credits_ledger) using the by_type index so
// only credit_purchase rows are fetched. credits_ledger grows on every AI
// generation (usage entries) which would cause this subscription to re-fire
// constantly. financial_ledger only changes on actual financial events.

export const getAllPurchases = query({
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("financial_ledger")
      .withIndex("by_type", (q) => q.eq("type", "credit_purchase"))
      .order("desc")
      .collect();

    return await Promise.all(
      entries.map(async (entry) => {
        // companyId === Clerk user ID for personal workspaces (top-ups always
        // go to personal workspace — see webhook comment in createPaymentTransaction)
        const user = entry.companyId
          ? await ctx.db
              .query("users")
              .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", entry.companyId!))
              .first()
          : null;

        return {
          _id: entry._id,
          createdAt: entry.transactionDate,
          companyId: entry.companyId,
          tokens: entry.tokensAmount || 0,
          amountPaid: entry.amount,
          currency: entry.currency,
          stripePaymentIntentId: entry.stripePaymentIntentId,
          description: entry.description,
          userEmail: user?.email || "Unknown",
          userName: user?.fullName || user?.firstName || "Unknown",
        };
      })
    );
  },
});

export const getPurchaseStats = query({
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("financial_ledger")
      .withIndex("by_type", (q) => q.eq("type", "credit_purchase"))
      .collect();

    const totalPurchases = entries.length;
    const totalRevenue = entries.reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = entries.reduce((sum, e) => sum + (e.tokensAmount || 0), 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthTs = startOfMonth.getTime();

    const thisMonth = entries.filter((e) => e.transactionDate >= startOfMonthTs);
    const monthlyRevenue = thisMonth.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalPurchases,
      totalRevenue: (totalRevenue / 100).toFixed(2),
      totalCredits,
      monthlyRevenue: (monthlyRevenue / 100).toFixed(2),
      thisMonthPurchases: thisMonth.length,
    };
  },
});

export const getPurchasesByUser = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financial_ledger")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .filter((q) => q.eq(q.field("type"), "credit_purchase"))
      .order("desc")
      .collect();
  },
});
