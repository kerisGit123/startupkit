import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all transactions for a company
 * Can filter by type (subscription, payment, credit)
 */
export const getCompanyTransactions = query({
  args: {
    companyId: v.string(),
    type: v.optional(v.union(
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("credit")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId));
    
    const transactions = await q
      .order("desc")
      .take(args.limit || 100);
    
    // Filter by type if specified
    const filtered = args.type 
      ? transactions.filter(t => t.type === args.type)
      : transactions;
    
    // Join with users to get email
    const transactionsWithUser = await Promise.all(
      filtered.map(async (tx) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", tx.companyId))
          .first();
        
        return {
          ...tx,
          userEmail: user?.email || null,
          userName: user?.fullName || user?.firstName || null,
        };
      })
    );
    
    return transactionsWithUser;
  },
});

/**
 * Get transaction with its invoice
 */
export const getTransactionWithInvoice = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) return null;
    
    const invoice = transaction.invoiceId
      ? await ctx.db.get(transaction.invoiceId)
      : null;
    
    return { transaction, invoice };
  },
});

/**
 * Get user transactions
 */
export const getUserTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);
    
    return transactions;
  },
});

/**
 * Get transactions by type
 */
export const getTransactionsByType = query({
  args: {
    companyId: v.string(),
    type: v.union(
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("credit")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(args.limit || 100);
    
    // Filter by companyId
    return transactions.filter(t => t.companyId === args.companyId);
  },
});

/**
 * Get transaction statistics for a company
 */
export const getTransactionStats = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    const stats = {
      total: transactions.length,
      totalAmount: 0,
      byType: {
        subscription: 0,
        payment: 0,
        credit: 0,
        referral: 0,
        bonus: 0,
        refund: 0,
      },
      totalCredits: 0,
    };
    
    for (const tx of transactions) {
      stats.totalAmount += tx.amount;
      if (tx.type in stats.byType) {
        stats.byType[tx.type as keyof typeof stats.byType]++;
      }
      if (tx.tokens) {
        stats.totalCredits += tx.tokens;
      }
    }
    
    return stats;
  },
});
