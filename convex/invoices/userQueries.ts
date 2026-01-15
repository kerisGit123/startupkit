import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get user's invoices with filtering
 */
export const getUserInvoicesWithFilters = query({
  args: {
    companyId: v.string(),
    invoiceType: v.optional(v.union(
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("all")
    )),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    )),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all user invoices by companyId
    let invoices = await ctx.db
      .query("invoices")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .collect();

    // Filter by invoice type
    if (args.invoiceType && args.invoiceType !== "all") {
      invoices = invoices.filter(inv => inv.invoiceType === args.invoiceType);
    }

    // Filter by status
    if (args.status) {
      invoices = invoices.filter(inv => inv.status === args.status);
    }

    // Search by invoice number or description
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      invoices = invoices.filter(inv => 
        inv.invoiceNo.toLowerCase().includes(query) ||
        inv.items.some(item => item.description.toLowerCase().includes(query)) ||
        inv.billingDetails.name.toLowerCase().includes(query)
      );
    }

    // Apply limit
    const limitedInvoices = invoices.slice(0, args.limit || 50);

    // Enrich with transaction details
    const enrichedInvoices = await Promise.all(
      limitedInvoices.map(async (invoice) => {
        const transaction = invoice.transactionId
          ? await ctx.db.get(invoice.transactionId)
          : null;

        return {
          ...invoice,
          transaction: transaction ? {
            type: transaction.type,
            plan: transaction.plan,
            tokens: transaction.tokens,
          } : null,
        };
      })
    );

    return enrichedInvoices;
  },
});

/**
 * Get single invoice details for user
 */
export const getUserInvoiceDetail = query({
  args: {
    invoiceId: v.id("invoices"),
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    
    // Verify invoice belongs to company
    if (!invoice || invoice.companyId !== args.companyId) {
      return null;
    }

    const transaction = invoice.transactionId
      ? await ctx.db.get(invoice.transactionId)
      : null;

    return {
      ...invoice,
      transaction,
    };
  },
});

/**
 * Get user invoice statistics
 */
export const getUserInvoiceStats = query({
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
      totalPaid: 0,
      totalPending: 0,
      byType: {
        subscription: 0,
        payment: 0,
      },
      byStatus: {
        paid: 0,
        issued: 0,
        overdue: 0,
        cancelled: 0,
        draft: 0,
      },
    };

    for (const inv of invoices) {
      stats.totalAmount += inv.total;
      
      if (inv.status === "paid") {
        stats.totalPaid += inv.total;
      } else if (inv.status === "issued" || inv.status === "overdue") {
        stats.totalPending += inv.total;
      }

      stats.byType[inv.invoiceType]++;
      stats.byStatus[inv.status]++;
    }

    return stats;
  },
});
