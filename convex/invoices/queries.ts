import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all invoices for a company
 */
export const getCompanyInvoices = query({
  args: {
    companyId: v.string(),
    invoiceType: v.optional(v.union(
      v.literal("subscription"),
      v.literal("payment")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("invoices")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId));
    
    const invoices = await q
      .order("desc")
      .take(args.limit || 100);
    
    // Enrich invoices with transaction details and user info
    const enrichedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const transaction = invoice.transactionId
          ? await ctx.db.get(invoice.transactionId)
          : null;
        
        // Get user details from companyId
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", invoice.companyId))
          .first();
        
        return {
          ...invoice,
          userEmail: user?.email || null,
          userName: user?.fullName || user?.firstName || null,
          transaction: transaction ? {
            type: transaction.type,
            transactionType: transaction.transactionType,
            plan: transaction.plan,
            tokens: transaction.tokens,
            stripeCheckoutSessionId: transaction.stripeCheckoutSessionId,
            stripeCustomerId: transaction.stripeCustomerId,
            stripeSubscriptionId: transaction.stripeSubscriptionId,
            stripePaymentIntentId: transaction.stripePaymentIntentId,
            eventType: transaction.eventType,
            source: transaction.source,
          } : null,
        };
      })
    );
    
    if (args.invoiceType) {
      return enrichedInvoices.filter(inv => inv.invoiceType === args.invoiceType);
    }
    
    return enrichedInvoices;
  },
});

/**
 * Get invoice by invoice number
 */
export const getInvoiceByNumber = query({
  args: { invoiceNo: v.string() },
  handler: async (ctx, { invoiceNo }) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_invoiceNo", (q) => q.eq("invoiceNo", invoiceNo))
      .first();
  },
});

/**
 * Get invoice with transaction details
 */
export const getInvoiceWithTransaction = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice) return null;
    
    const transaction = invoice.transactionId
      ? await ctx.db.get(invoice.transactionId)
      : null;
    
    return { invoice, transaction };
  },
});

/**
 * Get invoices by type
 */
export const getInvoicesByType = query({
  args: {
    invoiceType: v.union(
      v.literal("subscription"),
      v.literal("payment")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_invoiceType", (q) => q.eq("invoiceType", args.invoiceType))
      .order("desc")
      .take(args.limit || 100);
  },
});

/**
 * Get user invoices
 */
export const getUserInvoices = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);
  },
});

/**
 * Get invoice statistics
 */
export const getInvoiceStats = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();
    
    const stats = {
      total: invoices.length,
      totalAmount: 0,
      byType: {
        subscription: 0,
        payment: 0,
      },
      byStatus: {
        paid: 0,
        pending: 0,
        cancelled: 0,
        draft: 0,
        issued: 0,
        overdue: 0,
      },
    };
    
    for (const inv of invoices) {
      stats.totalAmount += inv.amount;
      if (inv.invoiceType) {
        stats.byType[inv.invoiceType]++;
      }
      stats.byStatus[inv.status]++;
    }
    
    return stats;
  },
});
