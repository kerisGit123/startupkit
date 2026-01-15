import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ============================================
// HELPER FUNCTIONS
// ============================================

const MONTH_CODES = [
  "JA", "FE", "MR", "AP", "MY", "JN",
  "JL", "AU", "SE", "OC", "NO", "DE"
];

function getMonthCode(month: number): string {
  return MONTH_CODES[month] || "JA";
}

function formatWithLeadingZeros(num: number, zeros: number): string {
  return num.toString().padStart(zeros, "0");
}

function shouldResetCounter(
  lastResetDate: number,
  invoiceNoType: string,
  now: number
): boolean {
  const lastReset = new Date(lastResetDate);
  const current = new Date(now);

  if (invoiceNoType === "year_running" || invoiceNoType === "full_year_running" || 
      invoiceNoType === "year_dash_running") {
    // Reset if year changed
    return lastReset.getFullYear() !== current.getFullYear();
  }

  if (invoiceNoType === "year_month_running" || invoiceNoType === "year_month_en_running" ||
      invoiceNoType === "year_month_en_dash_running" || invoiceNoType === "custom") {
    // Reset if year or month changed
    return (
      lastReset.getFullYear() !== current.getFullYear() ||
      lastReset.getMonth() !== current.getMonth()
    );
  }

  return false;
}

function generateInvoiceNumberString(
  prefix: string,
  type: string,
  runningNo: number,
  leadingZeros: number,
  date: Date
): string {
  const year = date.getFullYear().toString().slice(-2);
  const fullYear = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const monthCode = getMonthCode(date.getMonth());
  const formattedRunning = formatWithLeadingZeros(runningNo, leadingZeros);

  let invoiceNumber = "";

  switch (type) {
    case "year_running":
      invoiceNumber = `${year}${formattedRunning}`;
      break;
    case "year_month_running":
      invoiceNumber = `${year}${month}${formattedRunning}`;
      break;
    case "year_month_en_running":
      invoiceNumber = `${year}${monthCode}${formattedRunning}`;
      break;
    case "full_year_running":
      invoiceNumber = `${fullYear}${formattedRunning}`;
      break;
    case "year_dash_running":
      invoiceNumber = `${year}-${formattedRunning}`;
      break;
    case "year_month_en_dash_running":
      invoiceNumber = `${year}${monthCode}-${formattedRunning}`;
      break;
    case "custom":
      // Custom format: YY + MM + S/P + Running (S=Subscription, P=Payment)
      invoiceNumber = `${year}${month}S${formattedRunning}`;
      break;
    default:
      invoiceNumber = `${year}${formattedRunning}`;
  }

  return `${prefix}${invoiceNumber}`;
}

// ============================================
// CONFIGURATION QUERIES & MUTATIONS
// ============================================

// Get invoice configuration
export const getInvoiceConfig = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("invoice_config").first();
    return config;
  },
});

// Initialize invoice configuration (first-time setup)
export const initializeInvoiceConfig = mutation({
  args: {
    invoicePrefix: v.optional(v.string()),
    invoiceNoType: v.optional(v.union(
      v.literal("year_running"),
      v.literal("year_month_running"),
      v.literal("year_month_en_running")
    )),
    invoiceLeadingZeros: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("invoice_config").first();
    
    if (existing) {
      return {
        success: false,
        error: "Invoice configuration already exists. Use updateInvoiceConfig to modify.",
        configId: existing._id,
      };
    }

    const now = Date.now();
    const configId = await ctx.db.insert("invoice_config", {
      invoicePrefix: args.invoicePrefix || "INV-",
      invoiceNoType: args.invoiceNoType || "year_running",
      invoiceLeadingZeros: args.invoiceLeadingZeros || 4,
      invoiceRunningNo: 1,
      invoiceCurrentNo: "",
      lastResetDate: now,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      configId,
      message: "Invoice configuration initialized successfully",
    };
  },
});

// Update invoice configuration
export const updateInvoiceConfig = mutation({
  args: {
    invoicePrefix: v.optional(v.string()),
    invoiceNoType: v.optional(v.union(
      v.literal("year_running"),
      v.literal("year_month_running"),
      v.literal("year_month_en_running"),
      v.literal("full_year_running"),
      v.literal("custom"),
      v.literal("year_dash_running"),
      v.literal("year_month_en_dash_running")
    )),
    invoiceLeadingZeros: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("invoice_config").first();
    
    if (!config) {
      return {
        success: false,
        error: "Invoice configuration not found. Please initialize first.",
      };
    }

    const updates: {
      updatedAt: number;
      invoicePrefix?: string;
      invoiceNoType?: "year_running" | "year_month_running" | "year_month_en_running";
      invoiceLeadingZeros?: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.invoicePrefix !== undefined) {
      updates.invoicePrefix = args.invoicePrefix;
    }
    if (args.invoiceNoType !== undefined) {
      updates.invoiceNoType = args.invoiceNoType;
    }
    if (args.invoiceLeadingZeros !== undefined) {
      if (args.invoiceLeadingZeros < 1 || args.invoiceLeadingZeros > 10) {
        return {
          success: false,
          error: "Leading zeros must be between 1 and 10",
        };
      }
      updates.invoiceLeadingZeros = args.invoiceLeadingZeros;
    }

    await ctx.db.patch(config._id, updates);

    return {
      success: true,
      message: "Invoice configuration updated successfully",
    };
  },
});

// Set invoice counter to specific number
export const setInvoiceCounter = mutation({  
  args: {
    counterValue: v.number(),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("invoice_config").first();
    
    if (!config) {
      return {
        success: false,
        error: "Invoice configuration not found",
      };
    }

    if (args.counterValue < 1) {
      return {
        success: false,
        error: "Counter value must be at least 1",
      };
    }

    await ctx.db.patch(config._id, {
      invoiceRunningNo: args.counterValue,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: `Invoice counter set to ${args.counterValue}`,
    };
  },
});

// Manually reset invoice counter
export const resetInvoiceCounter = mutation({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("invoice_config").first();
    
    if (!config) {
      return {
        success: false,
        error: "Invoice configuration not found",
      };
    }

    await ctx.db.patch(config._id, {
      invoiceRunningNo: 1,
      lastResetDate: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Invoice counter reset to 1",
    };
  },
});

// ============================================
// INVOICE NUMBER GENERATION
// ============================================

// Internal function to generate invoice number
async function generateInvoiceNumberInternal(ctx: {
  db: any;
}) {
  let config = await ctx.db.query("invoice_config").first();
  
  // Auto-initialize if not exists
  if (!config) {
    const configId = await ctx.db.insert("invoice_config", {
      invoicePrefix: "INV-",
      invoiceNoType: "year_running",
      invoiceLeadingZeros: 4,
      invoiceRunningNo: 1,
      invoiceCurrentNo: "INV-260001",
      lastResetDate: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    config = await ctx.db.get(configId);
    if (!config) {
      throw new Error("Failed to initialize invoice configuration");
    }
  }

  const now = Date.now();
  const currentDate = new Date(now);
  
  // Check if we need to reset the counter
  let runningNo = config.invoiceRunningNo;
  if (shouldResetCounter(config.lastResetDate, config.invoiceNoType, now)) {
    runningNo = 1;
    await ctx.db.patch(config._id, {
      invoiceRunningNo: 1,
      lastResetDate: now,
    });
  }

  // Generate the invoice number
  const invoiceNo = generateInvoiceNumberString(
    config.invoicePrefix,
    config.invoiceNoType,
    runningNo,
    config.invoiceLeadingZeros,
    currentDate
  );

  // Increment the running number for next invoice
  await ctx.db.patch(config._id, {
    invoiceRunningNo: runningNo + 1,
    invoiceCurrentNo: invoiceNo,
    updatedAt: now,
  });

  return {
    invoiceNo,
    runningNo,
  };
}

// Generate next invoice number (public mutation)
export const generateInvoiceNumber = mutation({
  args: {},
  handler: async (ctx) => {
    return await generateInvoiceNumberInternal(ctx);
  },
});

// Preview next invoice number (without incrementing)
export const previewNextInvoiceNumber = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("invoice_config").first();
    
    if (!config) {
      return {
        success: false,
        error: "Invoice configuration not found",
      };
    }

    const now = Date.now();
    const currentDate = new Date(now);
    
    let runningNo = config.invoiceRunningNo;
    if (shouldResetCounter(config.lastResetDate, config.invoiceNoType, now)) {
      runningNo = 1;
    }

    const invoiceNo = generateInvoiceNumberString(
      config.invoicePrefix,
      config.invoiceNoType,
      runningNo,
      config.invoiceLeadingZeros,
      currentDate
    );

    return {
      success: true,
      nextInvoiceNo: invoiceNo,
      nextRunningNo: runningNo,
      willReset: shouldResetCounter(config.lastResetDate, config.invoiceNoType, now),
    };
  },
});

// ============================================
// INVOICE CRUD OPERATIONS
// ============================================

// Create invoice
export const createInvoice = mutation({
  args: {
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    billingDetails: v.object({
      name: v.string(),
      email: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      postalCode: v.optional(v.string()),
    }),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    notes: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    autoIssue: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Generate invoice number
    const { invoiceNo } = await generateInvoiceNumberInternal(ctx);

    const now = Date.now();
    const invoiceData: {
      invoiceNo: string;
      userId?: typeof args.userId;
      companyId?: string;
      amount: number;
      currency: string;
      status: "draft" | "issued" | "paid" | "cancelled" | "overdue";
      items: typeof args.items;
      billingDetails: typeof args.billingDetails;
      subtotal: number;
      tax?: number;
      taxRate?: number;
      discount?: number;
      total: number;
      notes?: string;
      stripePaymentIntentId?: string;
      stripeInvoiceId?: string;
      dueDate?: number;
      issuedAt?: number;
      createdAt: number;
      updatedAt: number;
    } = {
      invoiceNo,
      userId: args.userId,
      companyId: args.companyId,
      amount: args.amount,
      currency: args.currency,
      status: (args.autoIssue ? "issued" : "draft") as "draft" | "issued",
      items: args.items,
      billingDetails: args.billingDetails,
      subtotal: args.subtotal,
      tax: args.tax,
      taxRate: args.taxRate,
      discount: args.discount,
      total: args.total,
      notes: args.notes,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeInvoiceId: args.stripeInvoiceId,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    };

    if (args.autoIssue) {
      invoiceData.issuedAt = now;
    }

    const invoiceId = await ctx.db.insert("invoices", invoiceData);

    return {
      success: true,
      invoiceId,
      invoiceNo,
      message: args.autoIssue ? "Invoice created and issued" : "Invoice created as draft",
    };
  },
});

// Get invoice by ID
export const getInvoiceById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get invoice by invoice number
export const getInvoiceByNumber = query({
  args: { invoiceNo: v.string() },
  handler: async (ctx, { invoiceNo }) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_invoiceNo", (q) => q.eq("invoiceNo", invoiceNo))
      .first();
  },
});

// List all invoices with filters
export const listInvoices = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    )),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 100);
      return invoices;
    } else if (args.userId) {
      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(args.limit || 100);
      return invoices;
    } else if (args.companyId) {
      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId!))
        .order("desc")
        .take(args.limit || 100);
      return invoices;
    } else {
      const invoices = await ctx.db
        .query("invoices")
        .order("desc")
        .take(args.limit || 100);
      return invoices;
    }
  },
});

// Update invoice status
export const updateInvoiceStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, { id, status }) => {
    const invoice = await ctx.db.get(id);
    
    if (!invoice) {
      return {
        success: false,
        error: "Invoice not found",
      };
    }

    const now = Date.now();
    const updates: {
      status: "draft" | "issued" | "paid" | "cancelled" | "overdue";
      updatedAt: number;
      issuedAt?: number;
      paidAt?: number;
    } = {
      status,
      updatedAt: now,
    };

    if (status === "issued" && !invoice.issuedAt) {
      updates.issuedAt = now;
    }

    if (status === "paid" && !invoice.paidAt) {
      updates.paidAt = now;
    }

    await ctx.db.patch(id, updates);

    return {
      success: true,
      message: `Invoice status updated to ${status}`,
    };
  },
});

// Update invoice
export const updateInvoice = mutation({
  args: {
    id: v.id("invoices"),
    amount: v.optional(v.number()),
    items: v.optional(v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    }))),
    billingDetails: v.optional(v.object({
      name: v.string(),
      email: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      postalCode: v.optional(v.string()),
    })),
    subtotal: v.optional(v.number()),
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.optional(v.number()),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const invoice = await ctx.db.get(id);
    
    if (!invoice) {
      return {
        success: false,
        error: "Invoice not found",
      };
    }

    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return {
        success: false,
        error: `Cannot update ${invoice.status} invoice`,
      };
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Invoice updated successfully",
    };
  },
});

// Delete invoice (only drafts)
export const deleteInvoice = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, { id }) => {
    const invoice = await ctx.db.get(id);
    
    if (!invoice) {
      return {
        success: false,
        error: "Invoice not found",
      };
    }

    if (invoice.status !== "draft") {
      return {
        success: false,
        error: "Only draft invoices can be deleted",
      };
    }

    // If this invoice was converted from a PO, reverse the conversion
    if (invoice.purchaseOrderId) {
      const po = await ctx.db.get(invoice.purchaseOrderId);
      if (po) {
        await ctx.db.patch(invoice.purchaseOrderId, {
          status: "draft",
          convertedToInvoiceId: undefined,
          convertedByClerkUserId: undefined,
          convertedAt: undefined,
        });
      }
    }

    await ctx.db.delete(id);

    return {
      success: true,
      message: "Invoice deleted successfully",
    };
  },
});

// Get invoice statistics
export const getInvoiceStats = query({
  args: {
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let invoices;

    if (args.userId) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .collect();
    } else if (args.companyId) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId!))
        .collect();
    } else {
      invoices = await ctx.db.query("invoices").collect();
    }

    const stats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === "draft").length,
      issued: invoices.filter(i => i.status === "issued").length,
      paid: invoices.filter(i => i.status === "paid").length,
      cancelled: invoices.filter(i => i.status === "cancelled").length,
      overdue: invoices.filter(i => i.status === "overdue").length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      paidAmount: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0),
      pendingAmount: invoices.filter(i => i.status === "issued" || i.status === "overdue").reduce((sum, i) => sum + i.total, 0),
    };

    return stats;
  },
});
