import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Stripe amounts are stored in cents (e.g. 1000 = RM10.00)
// This helper converts cents to actual currency value
const toCurrency = (cents: number) => Math.round((cents / 100) * 100) / 100;

// ============================================
// QUERIES
// ============================================

// Get all financial ledger entries with filtering
export const getAllLedgerEntries = query({
  args: {
    type: v.optional(v.union(
      v.literal("subscription_charge"),
      v.literal("subscription_refund"),
      v.literal("one_time_payment"),
      v.literal("credit_purchase"),
      v.literal("refund"),
      v.literal("chargeback"),
      v.literal("adjustment")
    )),
    revenueSource: v.optional(v.union(
      v.literal("stripe_subscription"),
      v.literal("stripe_payment"),
      v.literal("manual"),
      v.literal("referral_bonus"),
      v.literal("credit_adjustment")
    )),
    userId: v.optional(v.id("users")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let entries = await ctx.db.query("financial_ledger").collect();

    // Apply filters
    if (args.type) {
      entries = entries.filter(e => e.type === args.type);
    }
    if (args.revenueSource) {
      entries = entries.filter(e => e.revenueSource === args.revenueSource);
    }
    if (args.userId) {
      entries = entries.filter(e => e.userId === args.userId);
    }
    if (args.contactId) {
      entries = entries.filter(e => e.contactId === args.contactId);
    }
    if (args.companyId) {
      entries = entries.filter(e => e.companyId === args.companyId);
    }
    if (args.startDate) {
      entries = entries.filter(e => e.transactionDate >= args.startDate!);
    }
    if (args.endDate) {
      entries = entries.filter(e => e.transactionDate <= args.endDate!);
    }

    // Convert amounts from Stripe cents to actual currency
    return entries
      .sort((a, b) => b.transactionDate - a.transactionDate)
      .map(e => ({ ...e, amount: toCurrency(e.amount) }));
  },
});

// Get ledger entry by ID
export const getLedgerEntryById = query({
  args: { id: v.id("financial_ledger") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get ledger entry by ledgerId
export const getLedgerEntryByLedgerId = query({
  args: { ledgerId: v.string() },
  handler: async (ctx, { ledgerId }) => {
    return await ctx.db
      .query("financial_ledger")
      .withIndex("by_ledgerId", (q) => q.eq("ledgerId", ledgerId))
      .first();
  },
});

// Get revenue by source
export const getRevenueBySource = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let entries = await ctx.db.query("financial_ledger").collect();

    // Filter by date range
    if (args.startDate) {
      entries = entries.filter(e => e.transactionDate >= args.startDate!);
    }
    if (args.endDate) {
      entries = entries.filter(e => e.transactionDate <= args.endDate!);
    }

    // Only count positive amounts (revenue, not refunds)
    entries = entries.filter(e => e.amount > 0);

    // Group by revenue source
    const bySource: Record<string, number> = {};
    for (const entry of entries) {
      const source = entry.revenueSource;
      bySource[source] = (bySource[source] || 0) + entry.amount;
    }

    // Convert from cents to currency
    const result: Record<string, number> = {};
    for (const [source, amount] of Object.entries(bySource)) {
      result[source] = toCurrency(amount);
    }
    return result;
  },
});

// Calculate MRR (Monthly Recurring Revenue)
export const calculateMRR = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const entries = await ctx.db
      .query("financial_ledger")
      .withIndex("by_type", (q) => q.eq("type", "subscription_charge"))
      .collect();

    // Filter to last 30 days
    const recentEntries = entries.filter(e => 
      e.transactionDate >= thirtyDaysAgo && e.amount > 0
    );

    // Sum up subscription charges (in cents)
    const totalRevenue = recentEntries.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate average daily revenue and multiply by 30
    const mrr = (totalRevenue / 30) * 30;

    return {
      mrr: toCurrency(mrr),
      period: "last_30_days",
      totalTransactions: recentEntries.length,
    };
  },
});

// Calculate ARR (Annual Recurring Revenue)
export const calculateARR = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const entries = await ctx.db
      .query("financial_ledger")
      .withIndex("by_type", (q) => q.eq("type", "subscription_charge"))
      .collect();

    const recentEntries = entries.filter(e => 
      e.transactionDate >= thirtyDaysAgo && e.amount > 0
    );

    const totalRevenue = recentEntries.reduce((sum, e) => sum + e.amount, 0);
    const mrr = (totalRevenue / 30) * 30;
    const arr = mrr * 12;

    return {
      arr: toCurrency(arr),
      mrr: toCurrency(mrr),
    };
  },
});

// Get total revenue
export const getTotalRevenue = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let entries = await ctx.db.query("financial_ledger").collect();

    // Filter by date range
    if (args.startDate) {
      entries = entries.filter(e => e.transactionDate >= args.startDate!);
    }
    if (args.endDate) {
      entries = entries.filter(e => e.transactionDate <= args.endDate!);
    }

    // Calculate totals
    const revenue = entries
      .filter(e => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    const refunds = entries
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const netRevenue = revenue - refunds;

    return {
      revenue: toCurrency(revenue),
      refunds: toCurrency(refunds),
      netRevenue: toCurrency(netRevenue),
      transactionCount: entries.length,
    };
  },
});

// Get revenue analytics
export const getRevenueAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get all entries
    const allEntries = await ctx.db.query("financial_ledger").collect();

    // Current period (last 30 days)
    const currentEntries = allEntries.filter(e => 
      e.transactionDate >= thirtyDaysAgo && e.transactionDate <= now
    );
    const currentRevenue = currentEntries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const currentRefunds = currentEntries.filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const currentNet = currentRevenue - currentRefunds;

    // Previous period (30-60 days ago)
    const previousEntries = allEntries.filter(e => 
      e.transactionDate >= sixtyDaysAgo && e.transactionDate < thirtyDaysAgo
    );
    const previousRevenue = previousEntries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const previousRefunds = previousEntries.filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const previousNet = previousRevenue - previousRefunds;

    // Calculate growth
    const growth = previousNet > 0 ? ((currentNet - previousNet) / previousNet) * 100 : 0;

    // Calculate MRR (subscription charges in last 30 days)
    const subscriptionEntries = currentEntries.filter(e => 
      e.type === "subscription_charge" && e.amount > 0
    );
    const totalSubRevenue = subscriptionEntries.reduce((sum, e) => sum + e.amount, 0);
    const mrr = (totalSubRevenue / 30) * 30;

    // Calculate ARR
    const arr = mrr * 12;

    // Revenue by source (convert from cents)
    const bySource: Record<string, number> = {};
    for (const entry of currentEntries.filter(e => e.amount > 0)) {
      const source = entry.revenueSource;
      bySource[source] = (bySource[source] || 0) + entry.amount;
    }
    const convertedBySource: Record<string, number> = {};
    for (const [source, amount] of Object.entries(bySource)) {
      convertedBySource[source] = toCurrency(amount);
    }

    return {
      currentPeriod: {
        revenue: toCurrency(currentRevenue),
        refunds: toCurrency(currentRefunds),
        netRevenue: toCurrency(currentNet),
        transactionCount: currentEntries.length,
      },
      previousPeriod: {
        revenue: toCurrency(previousRevenue),
        refunds: toCurrency(previousRefunds),
        netRevenue: toCurrency(previousNet),
        transactionCount: previousEntries.length,
      },
      growth: Math.round(growth * 100) / 100,
      mrr: toCurrency(mrr),
      arr: toCurrency(arr),
      revenueBySource: convertedBySource,
    };
  },
});

// Get monthly revenue trend (real data for charts)
export const getMonthlyRevenueTrend = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const monthCount = args.months || 6;
    const now = new Date();
    const allEntries = await ctx.db.query("financial_ledger").collect();

    const trends = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthEntries = allEntries.filter(
        (e) => e.transactionDate >= monthStart.getTime() && e.transactionDate <= monthEnd.getTime()
      );

      const revenue = monthEntries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      const refunds = monthEntries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const subscriptions = monthEntries
        .filter((e) => e.type === "subscription_charge" && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);
      const oneTime = monthEntries
        .filter((e) => e.type === "one_time_payment" && e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

      trends.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        year: monthStart.getFullYear(),
        revenue: toCurrency(revenue),
        refunds: toCurrency(refunds),
        net: toCurrency(revenue - refunds),
        subscriptions: toCurrency(subscriptions),
        oneTime: toCurrency(oneTime),
        transactions: monthEntries.length,
      });
    }

    return trends;
  },
});

// Get comprehensive financial summary for admin dashboard
export const getFinancialSummary = query({
  args: {},
  handler: async (ctx) => {
    const allEntries = await ctx.db.query("financial_ledger").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // All-time totals
    const allTimeRevenue = allEntries
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    const allTimeRefunds = allEntries
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    // Last 30 days
    const last30 = allEntries.filter((e) => e.transactionDate >= thirtyDaysAgo);
    const last30Revenue = last30.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);

    // Last 7 days
    const last7 = allEntries.filter((e) => e.transactionDate >= sevenDaysAgo);
    const last7Revenue = last7.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);

    // Average transaction value
    const positiveEntries = allEntries.filter((e) => e.amount > 0);
    const avgTransactionValue =
      positiveEntries.length > 0
        ? positiveEntries.reduce((sum, e) => sum + e.amount, 0) / positiveEntries.length
        : 0;

    // Top customers by revenue
    const customerRevenue: Record<string, { total: number; count: number; stripeId?: string }> = {};
    for (const entry of allEntries.filter((e) => e.amount > 0)) {
      const key = entry.stripeCustomerId || entry.companyId || "unknown";
      if (!customerRevenue[key]) {
        customerRevenue[key] = { total: 0, count: 0, stripeId: entry.stripeCustomerId };
      }
      customerRevenue[key].total += entry.amount;
      customerRevenue[key].count++;
    }

    const topCustomers = Object.entries(customerRevenue)
      .map(([key, data]) => ({ customer: key, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Convert topCustomers totals from cents
    const convertedTopCustomers = topCustomers.map(c => ({
      ...c,
      total: toCurrency(c.total),
    }));

    return {
      allTime: {
        revenue: toCurrency(allTimeRevenue),
        refunds: toCurrency(allTimeRefunds),
        net: toCurrency(allTimeRevenue - allTimeRefunds),
        transactions: allEntries.length,
      },
      last30Days: {
        revenue: toCurrency(last30Revenue),
        transactions: last30.length,
      },
      last7Days: {
        revenue: toCurrency(last7Revenue),
        transactions: last7.length,
      },
      avgTransactionValue: toCurrency(avgTransactionValue),
      topCustomers: convertedTopCustomers,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// Generate unique ledger ID
function generateLedgerId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `TXN-${year}-${random}`;
}

// Create new ledger entry
export const createLedgerEntry = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    type: v.union(
      v.literal("subscription_charge"),
      v.literal("subscription_refund"),
      v.literal("one_time_payment"),
      v.literal("credit_purchase"),
      v.literal("refund"),
      v.literal("chargeback"),
      v.literal("adjustment")
    ),
    revenueSource: v.union(
      v.literal("stripe_subscription"),
      v.literal("stripe_payment"),
      v.literal("manual"),
      v.literal("referral_bonus"),
      v.literal("credit_adjustment")
    ),
    description: v.string(),
    userId: v.optional(v.id("users")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.string()),
    subscriptionId: v.optional(v.id("org_subscriptions")),
    invoiceId: v.optional(v.id("invoices")),
    stripePaymentIntentId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    subscriptionPlan: v.optional(v.string()),
    subscriptionPeriodStart: v.optional(v.number()),
    subscriptionPeriodEnd: v.optional(v.number()),
    tokensAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    transactionDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ledgerId = generateLedgerId();

    return await ctx.db.insert("financial_ledger", {
      ledgerId,
      amount: args.amount,
      currency: args.currency,
      type: args.type,
      revenueSource: args.revenueSource,
      description: args.description,
      userId: args.userId,
      contactId: args.contactId,
      companyId: args.companyId,
      subscriptionId: args.subscriptionId,
      invoiceId: args.invoiceId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeInvoiceId: args.stripeInvoiceId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      subscriptionPlan: args.subscriptionPlan,
      subscriptionPeriodStart: args.subscriptionPeriodStart,
      subscriptionPeriodEnd: args.subscriptionPeriodEnd,
      tokensAmount: args.tokensAmount,
      notes: args.notes,
      metadata: args.metadata,
      transactionDate: args.transactionDate || now,
      recordedAt: now,
      isReconciled: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update ledger entry
export const updateLedgerEntry = mutation({
  args: {
    id: v.id("financial_ledger"),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    isReconciled: v.optional(v.boolean()),
    reconciledBy: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const entry = await ctx.db.get(id);
    if (!entry) {
      throw new Error("Ledger entry not found");
    }

    const now = Date.now();
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: now,
    };

    if (updates.isReconciled && !entry.isReconciled) {
      updateData.reconciledAt = now;
    }

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Reconcile ledger entry
export const reconcileLedgerEntry = mutation({
  args: {
    id: v.id("financial_ledger"),
    reconciledBy: v.string(),
  },
  handler: async (ctx, { id, reconciledBy }) => {
    const entry = await ctx.db.get(id);
    if (!entry) {
      throw new Error("Ledger entry not found");
    }

    await ctx.db.patch(id, {
      isReconciled: true,
      reconciledAt: Date.now(),
      reconciledBy,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// ============================================
// MIGRATION FUNCTIONS (Internal)
// ============================================

// Migrate from transactions table
export const migrateFromTransactions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    let migratedCount = 0;

    for (const txn of transactions) {
      // Check if already migrated
      const existing = await ctx.db
        .query("financial_ledger")
        .filter((q) => q.eq(q.field("legacyTransactionId"), txn._id))
        .first();

      if (existing) continue;

      // Map transaction type to ledger type
      let ledgerType: "subscription_charge" | "subscription_refund" | "one_time_payment" | "credit_purchase" | "refund" | "chargeback" | "adjustment" = "one_time_payment";
      if (txn.type === "subscription") {
        ledgerType = "subscription_charge";
      } else if (txn.type === "credit") {
        ledgerType = "credit_purchase";
      } else if (txn.type === "refund") {
        ledgerType = "refund";
      }

      // Map source
      let revenueSource: "stripe_subscription" | "stripe_payment" | "manual" | "referral_bonus" | "credit_adjustment" = "manual";
      if (txn.stripeSubscriptionId) {
        revenueSource = "stripe_subscription";
      } else if (txn.stripePaymentIntentId) {
        revenueSource = "stripe_payment";
      } else if (txn.type === "referral") {
        revenueSource = "referral_bonus";
      }

      await ctx.db.insert("financial_ledger", {
        ledgerId: generateLedgerId(),
        amount: txn.amount,
        currency: txn.currency,
        type: ledgerType,
        revenueSource: revenueSource,
        description: txn.reason || `Migrated from transactions: ${txn.type}`,
        userId: txn.userId,
        companyId: txn.companyId,
        invoiceId: txn.invoiceId,
        stripePaymentIntentId: txn.stripePaymentIntentId,
        stripeSubscriptionId: txn.stripeSubscriptionId,
        stripeCustomerId: txn.stripeCustomerId,
        subscriptionPlan: txn.plan,
        tokensAmount: txn.tokens,
        transactionDate: txn.createdAt,
        recordedAt: Date.now(),
        isReconciled: true,
        reconciledAt: Date.now(),
        reconciledBy: "system_migration",
        legacyTransactionId: txn._id,
        createdAt: txn.createdAt,
        updatedAt: Date.now(),
      });

      migratedCount++;
    }

    return { migratedCount };
  },
});

// Migrate from subscription_transactions table
export const migrateFromSubscriptionTransactions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const subTransactions = await ctx.db.query("subscription_transactions").collect();
    let migratedCount = 0;

    for (const txn of subTransactions) {
      // Check if already migrated
      const existing = await ctx.db
        .query("financial_ledger")
        .filter((q) => q.eq(q.field("legacySubscriptionTransactionId"), txn._id))
        .first();

      if (existing) continue;

      // Only migrate if there's an amount (actual financial transaction)
      if (!txn.amount) continue;

      await ctx.db.insert("financial_ledger", {
        ledgerId: generateLedgerId(),
        amount: txn.amount,
        currency: txn.currency || "USD",
        type: "subscription_charge",
        revenueSource: "stripe_subscription",
        description: `Subscription ${txn.action}: ${txn.plan || "Unknown Plan"}`,
        companyId: txn.companyId,
        stripeSubscriptionId: txn.stripeSubscriptionId,
        stripeCustomerId: txn.stripeCustomerId,
        subscriptionPlan: txn.plan,
        subscriptionPeriodEnd: txn.currentPeriodEnd,
        transactionDate: txn.createdAt,
        recordedAt: Date.now(),
        isReconciled: true,
        reconciledAt: Date.now(),
        reconciledBy: "system_migration",
        legacySubscriptionTransactionId: txn._id,
        createdAt: txn.createdAt,
        updatedAt: Date.now(),
      });

      migratedCount++;
    }

    return { migratedCount };
  },
});

// Migrate from credits_ledger table
export const migrateFromCreditsLedger = internalMutation({
  args: {},
  handler: async (ctx) => {
    const creditEntries = await ctx.db.query("credits_ledger").collect();
    let migratedCount = 0;

    for (const credit of creditEntries) {
      // Check if already migrated
      const existing = await ctx.db
        .query("financial_ledger")
        .filter((q) => q.eq(q.field("legacyCreditLedgerId"), credit._id))
        .first();

      if (existing) continue;

      await ctx.db.insert("financial_ledger", {
        ledgerId: generateLedgerId(),
        amount: credit.amountPaid || 0,
        currency: credit.currency || "USD",
        type: "credit_purchase",
        revenueSource: credit.stripePaymentIntentId ? "stripe_payment" : "manual",
        description: credit.reason || `Credit purchase: ${credit.tokens} tokens`,
        companyId: credit.companyId,
        invoiceId: credit.invoiceId,
        stripePaymentIntentId: credit.stripePaymentIntentId,
        tokensAmount: credit.tokens,
        transactionDate: credit.createdAt,
        recordedAt: Date.now(),
        isReconciled: true,
        reconciledAt: Date.now(),
        reconciledBy: "system_migration",
        legacyCreditLedgerId: credit._id,
        createdAt: credit.createdAt,
        updatedAt: Date.now(),
      });

      migratedCount++;
    }

    return { migratedCount };
  },
});
