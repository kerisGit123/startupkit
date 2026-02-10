import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get SO Configuration from platform_config (category: SO_config)
 */
export const getSOConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "SO_config"))
      .collect();
    
    const config: Record<string, any> = {};
    for (const item of configs) {
      config[item.key] = item.value;
    }
    
    return {
      soPrefix: config.soPrefix || "SO-",
      soNumberFormat: config.soNumberFormat || "Year + Running",
      soLeadingZeros: config.soLeadingZeros || 4,
      soCurrentCounter: config.soCurrentCounter || 1,
    };
  },
});

/**
 * Update SO Configuration in platform_config
 */
export const updateSOConfig = mutation({
  args: {
    soPrefix: v.optional(v.string()),
    soNumberFormat: v.optional(v.string()),
    soLeadingZeros: v.optional(v.number()),
    soCurrentCounter: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates = [
      { key: "soPrefix", value: args.soPrefix },
      { key: "soNumberFormat", value: args.soNumberFormat },
      { key: "soLeadingZeros", value: args.soLeadingZeros },
      { key: "soCurrentCounter", value: args.soCurrentCounter },
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
            category: "SO_config",
            description: `SO ${update.key}`,
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
 * Generate next SO number based on configuration
 */
function generateNextSONumber(
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
    case "Month + Running": {
      const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
      return `${prefix}${yearShort}${month}${paddedCounter}`;
    }
    default:
      return `${prefix}${yearShort}${paddedCounter}`;
  }
}

/**
 * Get next SO number and increment counter
 */
export const getNextSONumber = mutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "SO_config"))
      .collect();

    const configObj: Record<string, any> = {};
    for (const item of config) {
      configObj[item.key] = item.value;
    }

    const prefix = configObj.soPrefix || "SO-";
    const format = configObj.soNumberFormat || "Year + Running";
    const leadingZeros = configObj.soLeadingZeros || 4;
    const counter = configObj.soCurrentCounter || 1;

    const soNumber = generateNextSONumber(prefix, format, leadingZeros, counter);

    // Increment counter
    const counterConfig = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "soCurrentCounter"))
      .first();

    if (counterConfig) {
      await ctx.db.patch(counterConfig._id, {
        value: counter + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: "soCurrentCounter",
        value: counter + 1,
        category: "SO_config",
        description: "SO current counter",
        isEncrypted: false,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    }

    return { soNumber };
  },
});

/**
 * Reset SO counter
 */
export const resetSOCounter = mutation({
  args: { newCounter: v.number() },
  handler: async (ctx, { newCounter }) => {
    const counterConfig = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "soCurrentCounter"))
      .first();

    if (counterConfig) {
      await ctx.db.patch(counterConfig._id, {
        value: newCounter,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: "soCurrentCounter",
        value: newCounter,
        category: "SO_config",
        description: "SO current counter",
        isEncrypted: false,
        updatedAt: Date.now(),
        updatedBy: "admin",
      });
    }

    return { success: true };
  },
});
