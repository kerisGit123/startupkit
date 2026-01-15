import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all purchase orders
 */
export const getAllPurchaseOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchase_orders")
      .order("desc")
      .take(args.limit || 100);
  },
});

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = query({
  args: {
    poId: v.id("purchase_orders"),
  },
  handler: async (ctx, { poId }) => {
    return await ctx.db.get(poId);
  },
});

/**
 * Get purchase order by PO number
 */
export const getPurchaseOrderByNumber = query({
  args: {
    poNo: v.string(),
  },
  handler: async (ctx, { poNo }) => {
    return await ctx.db
      .query("purchase_orders")
      .withIndex("by_poNo", (q) => q.eq("poNo", poNo))
      .first();
  },
});

/**
 * Get purchase orders by status
 */
export const getPurchaseOrdersByStatus = query({
  args: {
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("approved"),
      v.literal("received"),
      v.literal("cancelled")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchase_orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(args.limit || 50);
  },
});
