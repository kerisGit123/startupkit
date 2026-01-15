import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Get PO configuration settings
 */
export const getPOConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("platform_config")
      .filter((q) => q.eq(q.field("category"), "po_config"))
      .collect();
    
    const settings: Record<string, any> = {};
    for (const item of config) {
      settings[item.key] = item.value;
    }
    
    return {
      poPrefix: settings.poPrefix || "PO-",
      poNumberFormat: settings.poNumberFormat || "Year + Running",
      poLeadingZeros: settings.poLeadingZeros || 4,
      poCurrentCounter: settings.poCurrentCounter || 1,
      poNextNumber: generateNextPONumber(
        settings.poPrefix || "PO-",
        settings.poNumberFormat || "Year + Running",
        settings.poLeadingZeros || 4,
        settings.poCurrentCounter || 1
      ),
    };
  },
});

/**
 * Update PO configuration
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
            category: "po_config",
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
  const yearShort = year.toString().slice(-2); // Last 2 digits (e.g., 26 for 2026)
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
      .filter((q) => q.eq(q.field("category"), "po_config"))
      .collect();
    
    const settings: Record<string, any> = {};
    for (const item of config) {
      settings[item.key] = item.value;
    }

    const prefix = settings.poPrefix || "PO-";
    const format = settings.poNumberFormat || "Year + Running";
    const leadingZeros = settings.poLeadingZeros || 4;
    const counter = settings.poCurrentCounter || 1;

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

    return { poNumber, nextCounter: counter + 1 };
  },
});
