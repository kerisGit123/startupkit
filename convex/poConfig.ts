import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get PO Configuration from platform_config
 */
export const getPOConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "PO_config"))
      .collect();
    
    // Convert to object
    const config: Record<string, any> = {};
    for (const item of configs) {
      config[item.key] = item.value;
    }
    
    return {
      poPrefix: config.poPrefix || "PO-",
      poNumberFormat: config.poNumberFormat || "Year + Running",
      poLeadingZeros: config.poLeadingZeros || 4,
      poCurrentCounter: config.poCurrentCounter || 1,
    };
  },
});

/**
 * Update PO Configuration in platform_config
 */
export const updatePOConfig = mutation({
  args: {
    poPrefix: v.optional(v.string()),
    poNumberFormat: v.optional(v.string()),
    poLeadingZeros: v.optional(v.number()),
    poCurrentCounter: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates = [
      { key: "poPrefix", value: args.poPrefix },
      { key: "poNumberFormat", value: args.poNumberFormat },
      { key: "poLeadingZeros", value: args.poLeadingZeros },
      { key: "poCurrentCounter", value: args.poCurrentCounter },
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
            category: "PO_config",
            description: `PO ${update.key}`,
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
 * Generate next PO number based on configuration
 */
function generateNextPONumber(
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
 * Get next PO number and increment counter
 */
export const getNextPONumber = mutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "PO_config"))
      .collect();

    const configObj: Record<string, any> = {};
    for (const item of config) {
      configObj[item.key] = item.value;
    }

    const prefix = configObj.poPrefix || "PO-";
    const format = configObj.poNumberFormat || "Year + Running";
    const leadingZeros = configObj.poLeadingZeros || 4;
    const counter = configObj.poCurrentCounter || 1;

    const poNumber = generateNextPONumber(prefix, format, leadingZeros, counter);

    // Increment counter
    const counterConfig = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "poCurrentCounter"))
      .first();

    if (counterConfig) {
      await ctx.db.patch(counterConfig._id, {
        value: counter + 1,
        updatedAt: Date.now(),
      });
    }

    return { poNumber };
  },
});

/**
 * Reset PO counter
 */
export const resetPOCounter = mutation({
  args: { newCounter: v.number() },
  handler: async (ctx, { newCounter }) => {
    const counterConfig = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "poCurrentCounter"))
      .first();

    if (counterConfig) {
      await ctx.db.patch(counterConfig._id, {
        value: newCounter,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: "poCurrentCounter",
        value: newCounter,
        category: "PO_config",
        description: "PO current counter",
        isEncrypted: false,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    }

    return { success: true };
  },
});
