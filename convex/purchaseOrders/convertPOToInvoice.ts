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

    // Generate invoice number inline to avoid circular reference
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

    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2);
    const paddedCounter = counter.toString().padStart(leadingZeros, "0");

    let invoiceNumber: string;
    switch (format) {
      case "Year + Running":
        invoiceNumber = `${prefix}${yearShort}${paddedCounter}`;
        break;
      case "Running Only":
        invoiceNumber = `${prefix}${paddedCounter}`;
        break;
      case "Month + Running":
        const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
        invoiceNumber = `${prefix}${yearShort}${month}${paddedCounter}`;
        break;
      default:
        invoiceNumber = `${prefix}${yearShort}${paddedCounter}`;
    }

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
      notes: `Converted from ${po.poNo}${overrides?.notes ? `\n\n${overrides.notes}` : ""}${po.notes ? `\n\n${po.notes}` : ""}`,
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
