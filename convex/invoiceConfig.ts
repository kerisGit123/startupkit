import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get Invoice Configuration from platform_config
 */
export const getInvoiceConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "invoice_config"))
      .collect();
    
    // Convert to object
    const config: Record<string, any> = {};
    for (const item of configs) {
      config[item.key] = item.value;
    }
    
    return {
      invoicePrefix: config.invoicePrefix || "INV-",
      invoiceNumberFormat: config.invoiceNumberFormat || "Year + Running",
      invoiceLeadingZeros: config.invoiceLeadingZeros || 4,
      invoiceCurrentCounter: config.invoiceCurrentCounter || 1,
    };
  },
});

/**
 * Update Invoice Configuration in platform_config
 */
export const updateInvoiceConfig = mutation({
  args: {
    invoicePrefix: v.optional(v.string()),
    invoiceNumberFormat: v.optional(v.string()),
    invoiceLeadingZeros: v.optional(v.number()),
    invoiceCurrentCounter: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates = [
      { key: "invoicePrefix", value: args.invoicePrefix },
      { key: "invoiceNumberFormat", value: args.invoiceNumberFormat },
      { key: "invoiceLeadingZeros", value: args.invoiceLeadingZeros },
      { key: "invoiceCurrentCounter", value: args.invoiceCurrentCounter },
    ];

    for (const update of updates) {
      if (update.value !== undefined) {
        const existing = await ctx.db
          .query("platform_config")
          .withIndex("by_key", (q) => q.eq("key", update.key))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            value: update.value,
            updatedAt: Date.now(),
            updatedBy: "admin",
          });
        } else {
          await ctx.db.insert("platform_config", {
            key: update.key,
            value: update.value,
            category: "invoice_config",
            description: `Invoice ${update.key}`,
            isEncrypted: false,
            updatedAt: Date.now(),
            updatedBy: "admin",
          });
        }
      }
    }

    return { success: true };
  },
});

/**
 * Generate next invoice number based on configuration
 */
function generateNextInvoiceNumber(
  prefix: string,
  format: string,
  leadingZeros: number,
  counter: number
): string {
  const year = new Date().getFullYear();
  const yearShort = year.toString().slice(-2);
  const paddedCounter = counter.toString().padStart(leadingZeros, "0");

  switch (format) {
    case "Year + Running":
      return `${prefix}${yearShort}${paddedCounter}`;
    case "Running Only":
      return `${prefix}${paddedCounter}`;
    case "Month + Running":
      const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
      return `${prefix}${yearShort}${month}${paddedCounter}`;
    default:
      return `${prefix}${yearShort}${paddedCounter}`;
  }
}

/**
 * Get next invoice number and increment counter
 */
export const getNextInvoiceNumber = mutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "invoice_config"))
      .collect();

    const configObj: Record<string, any> = {};
    for (const item of config) {
      configObj[item.key] = item.value;
    }

    const prefix = configObj.invoicePrefix || "INV-";
    const format = configObj.invoiceNumberFormat || "Year + Running";
    const leadingZeros = configObj.invoiceLeadingZeros || 4;
    const counter = configObj.invoiceCurrentCounter || 1;

    const invoiceNumber = generateNextInvoiceNumber(prefix, format, leadingZeros, counter);

    // Increment counter
    const counterConfig = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "invoiceCurrentCounter"))
      .first();

    if (counterConfig) {
      await ctx.db.patch(counterConfig._id, {
        value: counter + 1,
        updatedAt: Date.now(),
      });
    }

    return { invoiceNumber };
  },
});

/**
 * Reset invoice counter
 */
export const resetInvoiceCounter = mutation({
  args: { newCounter: v.number() },
  handler: async (ctx, { newCounter }) => {
    const counterConfig = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "invoiceCurrentCounter"))
      .first();

    if (counterConfig) {
      await ctx.db.patch(counterConfig._id, {
        value: newCounter,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: "invoiceCurrentCounter",
        value: newCounter,
        category: "invoice_config",
        description: "Invoice current counter",
        isEncrypted: false,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    }

    return { success: true };
  },
});
