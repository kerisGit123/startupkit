import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Convert a purchase order to an invoice
 */
export const convertPOToInvoice = mutation({
  args: {
    poId: v.id("purchase_orders"),
    selectedItemIndexes: v.array(v.number()),
    overrides: v.optional(v.object({
      tax: v.optional(v.number()),
      taxRate: v.optional(v.number()),
      discount: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
    clerkUserId: v.string(),
  },
  handler: async (ctx, { poId, selectedItemIndexes, overrides, clerkUserId }) => {
    // Get PO
    const po = await ctx.db.get(poId);
    if (!po) {
      throw new Error("Purchase order not found");
    }

    // Check if already converted
    if (po.convertedToInvoiceId) {
      throw new Error("Purchase order has already been converted to an invoice");
    }

    // Validate at least one item selected
    if (selectedItemIndexes.length === 0) {
      throw new Error("At least one item must be selected for conversion");
    }

    // Get selected items
    const selectedItems = selectedItemIndexes.map(index => po.items[index]).filter(Boolean);
    if (selectedItems.length === 0) {
      throw new Error("No valid items selected");
    }

    // Calculate subtotal from selected items
    const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);

    // Use overrides or calculate from subtotal
    const tax = overrides?.tax ?? (po.tax ? Math.round(subtotal * (po.taxRate || 0) / 100) : 0);
    const taxRate = overrides?.taxRate ?? po.taxRate;
    const discount = overrides?.discount ?? po.discount ?? 0;
    const total = subtotal + tax - discount;

    // Generate invoice number
    const { invoiceNumber } = await ctx.runMutation(
      internal.invoiceConfig.getNextInvoiceNumber,
      {}
    );

    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNo: invoiceNumber,
      userId: po.userId,
      companyId: po.companyId,
      amount: total,
      currency: po.currency,
      status: "draft",
      invoiceType: "invoice",
      transactionType: "one_time",
      purchaseOrderId: poId,
      purchaseOrderNo: po.poNo,
      sourceType: "purchase_order",
      items: selectedItems,
      billingDetails: {
        name: po.vendorName,
        email: po.vendorEmail || "",
        address: po.vendorAddress,
      },
      subtotal,
      tax,
      taxRate,
      discount,
      total,
      notes: `Converted from PO-${po.poNo}${overrides?.notes ? `\n\n${overrides.notes}` : ""}${po.notes ? `\n\n${po.notes}` : ""}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update PO with conversion tracking
    await ctx.db.patch(poId, {
      convertedToInvoiceId: invoiceId,
      convertedAt: Date.now(),
      convertedByClerkUserId: clerkUserId,
      status: "received",
      updatedAt: Date.now(),
    });

    return { 
      success: true, 
      invoiceId, 
      invoiceNo: invoiceNumber 
    };
  },
});
