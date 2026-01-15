import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Update an existing purchase order with audit trail
 */
export const updatePurchaseOrder = mutation({
  args: {
    poId: v.id("purchase_orders"),
    updates: v.object({
      vendorName: v.optional(v.string()),
      vendorEmail: v.optional(v.string()),
      vendorAddress: v.optional(v.string()),
      items: v.optional(v.array(v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        total: v.number(),
      }))),
      subtotal: v.optional(v.number()),
      tax: v.optional(v.number()),
      taxRate: v.optional(v.number()),
      discount: v.optional(v.number()),
      total: v.optional(v.number()),
      notes: v.optional(v.string()),
      paymentTerms: v.optional(v.string()),
      dueDate: v.optional(v.number()),
      deliveryDate: v.optional(v.number()),
      status: v.optional(v.union(
        v.literal("draft"),
        v.literal("issued"),
        v.literal("approved"),
        v.literal("received"),
        v.literal("cancelled")
      )),
    }),
    clerkUserId: v.string(),
  },
  handler: async (ctx, { poId, updates, clerkUserId }) => {
    // Get existing PO
    const existingPO = await ctx.db.get(poId);
    if (!existingPO) {
      throw new Error("Purchase order not found");
    }

    // Check if PO is locked (converted to invoice)
    if (existingPO.convertedToInvoiceId) {
      throw new Error("Cannot edit a purchase order that has been converted to an invoice");
    }

    // Update PO with audit trail
    await ctx.db.patch(poId, {
      ...updates,
      lastEditedByClerkUserId: clerkUserId,
      lastEditedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, poId };
  },
});
