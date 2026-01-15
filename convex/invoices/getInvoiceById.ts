import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get invoice by ID
 */
export const getInvoiceById = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    return await ctx.db.get(invoiceId);
  },
});
