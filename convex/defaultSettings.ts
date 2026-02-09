import { mutation, query } from "./_generated/server";

/**
 * Check if default settings have been initialized
 */
export const hasDefaults = query({
  args: {},
  handler: async (ctx) => {
    const marker = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "defaults_initialized"))
      .first();
    return !!marker;
  },
});

/**
 * Generate default settings for a fresh system installation.
 * Sets up invoice config, SO config, company info, and email defaults.
 */
export const generateDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const defaults = [
      // Invoice Config
      { key: "invoicePrefix", value: "INV-", category: "invoice_config", description: "Invoice number prefix" },
      { key: "invoiceNumberFormat", value: "Year + Running", category: "invoice_config", description: "Invoice number format" },
      { key: "invoiceLeadingZeros", value: 4, category: "invoice_config", description: "Invoice leading zeros" },
      { key: "invoiceCurrentCounter", value: 1, category: "invoice_config", description: "Invoice current counter" },

      // SO (Sales Order) Config
      { key: "poPrefix", value: "SO-", category: "PO_config", description: "Sales order number prefix" },
      { key: "poNumberFormat", value: "Year + Running", category: "PO_config", description: "Sales order number format" },
      { key: "poLeadingZeros", value: 4, category: "PO_config", description: "Sales order leading zeros" },
      { key: "poCurrentCounter", value: 1, category: "PO_config", description: "Sales order current counter" },

      // Company Defaults
      { key: "companyName", value: "My Company", category: "company", description: "Company name" },
      { key: "companyEmail", value: "info@mycompany.com", category: "company", description: "Company email" },
      { key: "companyPhone", value: "", category: "company", description: "Company phone" },
      { key: "companyAddress", value: "", category: "company", description: "Company address" },
      { key: "companyCurrency", value: "USD", category: "company", description: "Default currency" },

      // Invoice & SO Config
      { key: "defaultTerm", value: "NET 30", category: "invoice_po_config", description: "Default payment term" },
      { key: "currency", value: "USD", category: "invoice_po_config", description: "Default currency" },
      { key: "serviceTaxCode", value: "", category: "invoice_po_config", description: "Service tax code" },
      { key: "serviceTax", value: 0, category: "invoice_po_config", description: "Service tax percentage" },
      { key: "serviceTaxEnable", value: false, category: "invoice_po_config", description: "Enable service tax" },
      { key: "roundingEnable", value: false, category: "invoice_po_config", description: "Enable rounding" },

      // SMTP Email Defaults
      { key: "smtpHost", value: "", category: "smtp", description: "SMTP Host" },
      { key: "smtpPort", value: "587", category: "smtp", description: "SMTP Port" },
      { key: "smtpUsername", value: "", category: "smtp", description: "SMTP Username" },
      { key: "smtpFromEmail", value: "noreply@mycompany.com", category: "smtp", description: "SMTP From Email" },
      { key: "smtpFromName", value: "My Company", category: "smtp", description: "SMTP From Name" },
      { key: "smtpActive", value: "false", category: "smtp", description: "SMTP Active Toggle" },

      // Marker
      { key: "defaults_initialized", value: true, category: "system", description: "Whether default settings have been generated" },
    ];

    let created = 0;
    let skipped = 0;

    for (const setting of defaults) {
      const existing = await ctx.db
        .query("platform_config")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();

      if (!existing) {
        await ctx.db.insert("platform_config", {
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: setting.description,
          isEncrypted: setting.key === "smtpPassword" || setting.key === "smtpApiKey",
          updatedAt: Date.now(),
          updatedBy: "system",
        });
        created++;
      } else {
        skipped++;
      }
    }

    return { success: true, created, skipped, total: defaults.length };
  },
});
