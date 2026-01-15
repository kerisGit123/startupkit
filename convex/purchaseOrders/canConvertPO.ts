import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Check if a purchase order can be converted to an invoice
 */
export const canConvertPO = query({
  args: {
    poId: v.id("purchase_orders"),
  },
  handler: async (ctx, { poId }) => {
    const po = await ctx.db.get(poId);
    if (!po) {
      return { canConvert: false, reason: "Purchase order not found" };
    }

    if (po.convertedToInvoiceId) {
      return { canConvert: false, reason: "Already converted to invoice" };
    }

    if (po.status === "cancelled") {
      return { canConvert: false, reason: "Cannot convert cancelled purchase order" };
    }

    if (po.items.length === 0) {
      return { canConvert: false, reason: "No items in purchase order" };
    }

    return { canConvert: true };
  },
});
