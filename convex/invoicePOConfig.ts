import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get Invoice & PO Configuration from platform_config (category: invoicePO)
 */
export const getInvoicePOConfig = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("platform_config")
      .withIndex("by_category", (q) => q.eq("category", "invoicePO"))
      .collect();
    
    // Convert to object
    const config: Record<string, any> = {};
    for (const item of configs) {
      config[item.key] = item.value;
    }
    
    return {
      SSTRegNo: config.SSTRegNo || "",
      regNo: config.regNo || "",
      defaultTerm: config.defaultTerm || "",
      websiteURL: config.websiteURL || "",
      bankAccount: config.bankAccount || "",
      bankName: config.bankName || "",
      paymentNote: config.paymentNote || "",
      serviceTaxCode: config.serviceTaxCode || "",
      serviceTax: config.serviceTax || 0,
      serviceTaxEnable: config.serviceTaxEnable || false,
      roundingEnable: config.roundingEnable || false,
      documentFooter: config.documentFooter || "This is a computer-generated document. No signature is required.",
      // Report Header Settings
      reportCompanyName: config.reportCompanyName || "",
      reportCompanyAddress: config.reportCompanyAddress || "",
      reportCompanyPhone: config.reportCompanyPhone || "",
      reportCompanyEmail: config.reportCompanyEmail || "",
      reportLogoUrl: config.reportLogoUrl || "",
      showReportLogo: config.show_report_logo ?? true,
      currency: config.currency || "RM",
      footer: config.footer || config.documentFooter || "This is a computer-generated document. No signature is required.",
      generateFooterDate: config.generate_footer_date ?? true,
      serviceTaxInvoiceEnable: config.serviceTaxInvoiceEnable ?? true,
      discountInvoice: config.discount_invoice ?? false,
    };
  },
});

/**
 * Update Invoice & PO Configuration in platform_config
 */
export const updateInvoicePOConfig = mutation({
  args: {
    SSTRegNo: v.optional(v.string()),
    regNo: v.optional(v.string()),
    defaultTerm: v.optional(v.string()),
    websiteURL: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    bankName: v.optional(v.string()),
    paymentNote: v.optional(v.string()),
    serviceTaxCode: v.optional(v.string()),
    serviceTax: v.optional(v.number()),
    serviceTaxEnable: v.optional(v.boolean()),
    roundingEnable: v.optional(v.boolean()),
    documentFooter: v.optional(v.string()),
    reportCompanyName: v.optional(v.string()),
    reportCompanyAddress: v.optional(v.string()),
    reportCompanyPhone: v.optional(v.string()),
    reportCompanyEmail: v.optional(v.string()),
    reportLogoUrl: v.optional(v.string()),
    showReportLogo: v.optional(v.boolean()),
    currency: v.optional(v.string()),
    generateFooterDate: v.optional(v.boolean()),
    serviceTaxInvoiceEnable: v.optional(v.boolean()),
    discountInvoice: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates = [
      { key: "SSTRegNo", value: args.SSTRegNo, description: "SST Registration Number" },
      { key: "regNo", value: args.regNo, description: "Registration Number" },
      { key: "defaultTerm", value: args.defaultTerm, description: "Default Payment Terms" },
      { key: "websiteURL", value: args.websiteURL, description: "Website URL" },
      { key: "bankAccount", value: args.bankAccount, description: "Bank Account Number" },
      { key: "bankName", value: args.bankName, description: "Bank Name" },
      { key: "paymentNote", value: args.paymentNote, description: "Payment Instructions/Note" },
      { key: "serviceTaxCode", value: args.serviceTaxCode, description: "Service Tax Code" },
      { key: "serviceTax", value: args.serviceTax, description: "Service Tax Percentage" },
      { key: "serviceTaxEnable", value: args.serviceTaxEnable, description: "Enable Service Tax" },
      { key: "roundingEnable", value: args.roundingEnable, description: "Enable Rounding" },
      { key: "documentFooter", value: args.documentFooter, description: "Document Footer Text" },
      { key: "reportCompanyName", value: args.reportCompanyName, description: "Report Company Name" },
      { key: "reportCompanyAddress", value: args.reportCompanyAddress, description: "Report Company Address" },
      { key: "reportCompanyPhone", value: args.reportCompanyPhone, description: "Report Company Phone" },
      { key: "reportCompanyEmail", value: args.reportCompanyEmail, description: "Report Company Email" },
      { key: "reportLogoUrl", value: args.reportLogoUrl, description: "Report Logo URL" },
      { key: "show_report_logo", value: args.showReportLogo, description: "Show Report Logo" },
      { key: "currency", value: args.currency, description: "Currency Code" },
      { key: "footer", value: args.documentFooter, description: "Report Footer Text" },
      { key: "generate_footer_date", value: args.generateFooterDate, description: "Show Generation Date in Footer" },
      { key: "serviceTaxInvoiceEnable", value: args.serviceTaxInvoiceEnable, description: "Enable Service Tax for Invoices" },
      { key: "discount_invoice", value: args.discountInvoice, description: "Enable Discount for Invoices" },
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
            category: "invoicePO",
            description: update.description,
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
