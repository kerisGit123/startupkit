import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = mutation({
  args: {
    poNo: v.string(),
    vendorName: v.string(),
    vendorEmail: v.optional(v.string()),
    vendorAddress: v.optional(v.string()),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    notes: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    deliveryDate: v.optional(v.number()),
    currency: v.optional(v.string()),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const poId = await ctx.db.insert("purchase_orders", {
      poNo: args.poNo,
      companyId: args.companyId || "default",
      vendorName: args.vendorName,
      vendorEmail: args.vendorEmail,
      vendorAddress: args.vendorAddress,
      amount: args.total,
      currency: args.currency || "MYR",
      status: "draft",
      items: args.items,
      subtotal: args.subtotal,
      tax: args.tax,
      taxRate: args.taxRate,
      discount: args.discount,
      total: args.total,
      notes: args.notes,
      paymentTerms: args.paymentTerms,
      dueDate: args.dueDate,
      deliveryDate: args.deliveryDate,
      createdAt: now,
      updatedAt: now,
      createdBy: "admin",
    });

    return { poId, success: true };
  },
});

/**
 * Update purchase order status
 */
export const updatePOStatus = mutation({
  args: {
    poId: v.id("purchase_orders"),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("approved"),
      v.literal("received"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { poId, status }) => {
    const updates: any = {
      status,
      updatedAt: Date.now(),
    };

    if (status === "issued") {
      updates.issuedAt = Date.now();
    } else if (status === "approved") {
      updates.approvedAt = Date.now();
      updates.approvedBy = "admin"; // TODO: Get from auth
    }

    await ctx.db.patch(poId, updates);
    return { success: true };
  },
});

/**
 * Delete purchase order
 */
export const deletePurchaseOrder = mutation({
  args: {
    poId: v.id("purchase_orders"),
  },
  handler: async (ctx, { poId }) => {
    await ctx.db.delete(poId);
    return { success: true };
  },
});
