import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get conversion preview data for PO to Invoice
 */
export const getConversionPreview = query({
  args: {
    poId: v.id("purchase_orders"),
    selectedItemIndexes: v.array(v.number()),
  },
  handler: async (ctx, { poId, selectedItemIndexes }) => {
    const po = await ctx.db.get(poId);
    if (!po) {
      throw new Error("Purchase order not found");
    }

    // Get selected items
    const selectedItems = selectedItemIndexes.map(index => po.items[index]).filter(Boolean);
    
    // Calculate totals
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = po.taxRate ? Math.round(subtotal * po.taxRate / 100) : (po.tax || 0);
    const discount = po.discount || 0;
    const total = subtotal + tax - discount;

    return {
      selectedItems,
      subtotal,
      tax,
      taxRate: po.taxRate,
      discount,
      total,
      currency: po.currency,
    };
  },
});
