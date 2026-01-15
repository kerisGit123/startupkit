import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all customers with optional filters
 */
export const getAllCustomers = query({
  args: {
    companyId: v.optional(v.string()),
    customerType: v.optional(v.union(v.literal("saas"), v.literal("local"))),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, { companyId, customerType, includeInactive = false }) => {
    let customers;
    
    // Apply filters
    if (companyId) {
      customers = await ctx.db
        .query("saas_customers")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect();
    } else {
      customers = await ctx.db.query("saas_customers").collect();
    }

    // Filter by type
    if (customerType) {
      customers = customers.filter((c) => c.customerType === customerType);
    }

    // Filter by active status
    if (!includeInactive) {
      customers = customers.filter((c) => c.isActive);
    }

    return customers;
  },
});

/**
 * Get a single customer by ID
 */
export const getCustomerById = query({
  args: {
    customerId: v.id("saas_customers"),
  },
  handler: async (ctx, { customerId }) => {
    return await ctx.db.get(customerId);
  },
});

/**
 * Search customers by name or email
 */
export const searchCustomers = query({
  args: {
    searchTerm: v.string(),
    companyId: v.optional(v.string()),
    customerType: v.optional(v.union(v.literal("saas"), v.literal("local"))),
  },
  handler: async (ctx, { searchTerm, companyId, customerType }) => {
    let customers = await ctx.db.query("saas_customers").collect();

    // Filter by company
    if (companyId) {
      customers = customers.filter((c) => c.companyId === companyId);
    }

    // Filter by type
    if (customerType) {
      customers = customers.filter((c) => c.customerType === customerType);
    }

    // Filter by active status
    customers = customers.filter((c) => c.isActive);

    // Search by name or email
    const lowerSearch = searchTerm.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(lowerSearch) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(lowerSearch))
    );

    return customers;
  },
});

/**
 * Get customer statistics
 */
export const getCustomerStats = query({
  args: {
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, { companyId }) => {
    let customers = await ctx.db.query("saas_customers").collect();

    if (companyId) {
      customers = customers.filter((c) => c.companyId === companyId);
    }

    const activeCustomers = customers.filter((c) => c.isActive);
    const saasCustomers = activeCustomers.filter((c) => c.customerType === "saas");
    const localCustomers = activeCustomers.filter((c) => c.customerType === "local");

    return {
      total: activeCustomers.length,
      saas: saasCustomers.length,
      local: localCustomers.length,
      inactive: customers.filter((c) => !c.isActive).length,
    };
  },
});
