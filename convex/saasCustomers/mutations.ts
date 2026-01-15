import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a new SaaS customer
 */
export const createCustomer = mutation({
  args: {
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerType: v.union(v.literal("saas"), v.literal("local")),
    companyRegistrationNo: v.optional(v.string()),
    taxId: v.optional(v.string()),
    contactPersonName: v.optional(v.string()),
    contactPersonEmail: v.optional(v.string()),
    contactPersonPhone: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    companyId: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const customerId = await ctx.db.insert("saas_customers", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { customerId, success: true };
  },
});

/**
 * Update an existing customer
 */
export const updateCustomer = mutation({
  args: {
    customerId: v.id("saas_customers"),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerType: v.optional(v.union(v.literal("saas"), v.literal("local"))),
    companyRegistrationNo: v.optional(v.string()),
    taxId: v.optional(v.string()),
    contactPersonName: v.optional(v.string()),
    contactPersonEmail: v.optional(v.string()),
    contactPersonPhone: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    lastEditedBy: v.optional(v.string()),
  },
  handler: async (ctx, { customerId, ...updates }) => {
    const existing = await ctx.db.get(customerId);
    if (!existing) {
      throw new Error("Customer not found");
    }

    await ctx.db.patch(customerId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete (soft delete) a customer
 */
export const deleteCustomer = mutation({
  args: {
    customerId: v.id("saas_customers"),
  },
  handler: async (ctx, { customerId }) => {
    const existing = await ctx.db.get(customerId);
    if (!existing) {
      throw new Error("Customer not found");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(customerId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Hard delete a customer (permanent)
 */
export const permanentDeleteCustomer = mutation({
  args: {
    customerId: v.id("saas_customers"),
  },
  handler: async (ctx, { customerId }) => {
    await ctx.db.delete(customerId);
    return { success: true };
  },
});
