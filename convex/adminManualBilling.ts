import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

const PLAN_LABELS: Record<string, string> = {
  pro_personal: "Pro Plan",
  business: "Business Plan",
};

// ─── Create offline subscription invoice ─────────────────────────────────────
// Plan is NOT activated here — only when the invoice is marked paid.
export const createOfflineInvoice = mutation({
  args: {
    companyId: v.string(),          // clerkUserId of the offline client
    billingName: v.string(),
    billingEmail: v.string(),
    billingAddress: v.optional(v.string()),
    billingPhone: v.optional(v.string()),
    billingCompanyName: v.optional(v.string()),
    billingCompanyLicense: v.optional(v.string()),
    billingTinNumber: v.optional(v.string()),
    billingCountry: v.optional(v.string()),
    planTier: v.union(v.literal("pro_personal"), v.literal("business")),
    billingInterval: v.union(v.literal("monthly"), v.literal("annual")),
    amount: v.number(),             // in cents (e.g. 4500 = $45.00)
    currency: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Read shared invoice config and increment the running counter
    const config = await ctx.db.query("invoice_config").first();
    const prefix = config?.invoicePrefix ?? "INV-";
    const zeros = config?.invoiceLeadingZeros ?? 4;
    const runningNo = config?.invoiceRunningNo ?? 1;

    // Derive invoice number — mirrors the "year_running" format used by the main system
    const d = new Date(now);
    const year = d.getFullYear().toString().slice(-2);
    const type = config?.invoiceNoType ?? "year_running";
    let invoiceNo: string;
    if (type === "running") {
      invoiceNo = `${prefix}${String(runningNo).padStart(zeros, "0")}`;
    } else {
      invoiceNo = `${prefix}${year}${String(runningNo).padStart(zeros, "0")}`;
    }

    if (config) {
      await ctx.db.patch(config._id, {
        invoiceRunningNo: runningNo + 1,
        invoiceCurrentNo: invoiceNo,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("invoice_config", {
        invoicePrefix: prefix,
        invoiceNoType: "year_running",
        invoiceLeadingZeros: zeros,
        invoiceRunningNo: runningNo + 1,
        invoiceCurrentNo: invoiceNo,
        lastResetDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    const intervalLabel = args.billingInterval === "annual" ? "/year" : "/month";
    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNo,
      companyId: args.companyId,
      amount: args.amount,
      currency: args.currency,
      status: "issued",
      invoiceType: "subscription",
      transactionType: "recurring",
      sourceType: "manual",
      planTier: args.planTier,
      billingInterval: args.billingInterval,
      items: [{
        description: `${PLAN_LABELS[args.planTier]} (${args.billingInterval})${intervalLabel}`,
        quantity: 1,
        unitPrice: args.amount,
        total: args.amount,
      }],
      billingDetails: {
        name: args.billingName,
        email: args.billingEmail,
        address: args.billingAddress,
        phone: args.billingPhone,
        companyName: args.billingCompanyName,
        companyLicense: args.billingCompanyLicense,
        tinNumber: args.billingTinNumber,
        country: args.billingCountry,
      },
      subtotal: args.amount,
      total: args.amount,
      dueDate: args.dueDate,
      notes: args.notes,
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { invoiceId, invoiceNo };
  },
});

// ─── Mark offline invoice as paid + activate plan ────────────────────────────
export const markOfflineInvoicePaid = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (!invoice.planTier) throw new Error("Not an offline subscription invoice");
    if (!invoice.companyId) throw new Error("Invoice has no companyId");
    if (invoice.status === "paid") throw new Error("Already paid");

    const now = Date.now();
    await ctx.db.patch(args.invoiceId, { status: "paid", paidAt: now, updatedAt: now });

    // Propagate plan upgrade — runs after this mutation completes
    await ctx.scheduler.runAfter(0, api.credits.propagateOwnerPlanChange, {
      ownerUserId: invoice.companyId,
      newPlan: invoice.planTier,
    });

    return { success: true, planTier: invoice.planTier };
  },
});

// ─── Check + downgrade overdue offline subscriptions (called at login) ───────
// Finds any "issued" manual subscription invoice where dueDate has passed,
// marks them "overdue", and schedules a downgrade to Free.
export const checkAndDowngradeOverdue = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const candidates = await ctx.db
      .query("invoices")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .filter((q) =>
        q.and(
          q.eq(q.field("sourceType"), "manual"),
          q.eq(q.field("invoiceType"), "subscription"),
          q.eq(q.field("status"), "issued"),
        )
      )
      .collect();

    const overdue = candidates.filter(
      (inv) => inv.dueDate !== undefined && inv.dueDate < now
    );

    if (overdue.length === 0) return { downgraded: false };

    // Get user info for the alert message
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    const userName = user?.fullName || user?.email || args.clerkUserId;
    const invoiceNos = overdue.map((i) => i.invoiceNo).join(", ");

    for (const inv of overdue) {
      await ctx.db.patch(inv._id, { status: "overdue", updatedAt: now });
    }

    await ctx.scheduler.runAfter(0, api.credits.propagateOwnerPlanChange, {
      ownerUserId: args.clerkUserId,
      newPlan: "free",
    });

    // Notify admins so they can follow up
    await ctx.scheduler.runAfter(0, api.alerts.createAlert, {
      title: "Offline Subscription Expired",
      message: `${userName}'s offline subscription lapsed (${invoiceNos}). Plan reverted to Free. Create a new invoice to reinstate.`,
      type: "warning",
      targetType: "role",
      targetValue: "super_admin",
      createdBy: "system",
      isDismissible: true,
      priority: 8,
    });

    return { downgraded: true, count: overdue.length };
  },
});

// ─── Query: all offline subscription invoices (admin list) ───────────────────
export const getOfflineSubscriptions = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_invoiceType", (q) => q.eq("invoiceType", "subscription"))
      .order("desc")
      .filter((q) => q.eq(q.field("sourceType"), "manual"))
      .take(300);
  },
});

// ─── Query: offline invoices for one user (user drawer) ──────────────────────
export const getOfflineInvoicesForUser = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("sourceType"), "manual"),
          q.eq(q.field("invoiceType"), "subscription"),
        )
      )
      .collect();
  },
});
