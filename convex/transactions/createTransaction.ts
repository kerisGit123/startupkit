import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { requireWebhookSecret } from "../credits";

/**
 * Create a payment transaction (credit purchase)
 * This replaces the old credits_ledger insert
 */
export const createPaymentTransaction = mutation({
  args: {
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    amount: v.number(),
    currency: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    console.log("[createPaymentTransaction] Starting", args);

    try {
      // 1. Create transaction record
      console.log("[createPaymentTransaction] Creating transaction record");
      const transactionId = await ctx.db.insert("transactions", {
        companyId: args.companyId,
        userId: args.userId,
        type: "payment",
        transactionType: "one_time",
        amount: args.amount,
        currency: args.currency,
        tokens: args.tokens,
        stripePaymentIntentId: args.stripePaymentIntentId,
        stripeCheckoutSessionId: args.stripeCheckoutSessionId,
        createdAt: Date.now(),
      });
      console.log("[createPaymentTransaction] Transaction created", { transactionId });
      
      // 2. Generate invoice - TODO: Handle this separately to avoid circular reference
      console.log("[createPaymentTransaction] Invoice generation skipped due to circular reference");
      // const { invoiceNo, invoiceId } = await ctx.runMutation(
      //   internal.invoices.createInvoiceForTransaction,
      //   { transactionId }
      // );
      const invoiceNo = `INV-${Date.now()}`;
      const invoiceId = undefined;
      console.log("[createPaymentTransaction] Invoice generated", { invoiceNo, invoiceId });
      
      // 3. Update transaction with invoice reference
      console.log("[createPaymentTransaction] Updating transaction with invoice reference");
      await ctx.db.patch(transactionId, {
        invoiceId,
        invoiceNo,
      });
      
      // 4. Update credits balance
      console.log("[createPaymentTransaction] Updating credits balance");
      const existingBalance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .first();
      
      if (existingBalance) {
        await ctx.db.patch(existingBalance._id, {
          balance: existingBalance.balance + args.tokens,
          updatedAt: Date.now(),
        });
        console.log("[createPaymentTransaction] Credits balance updated", { 
          oldBalance: existingBalance.balance, 
          newBalance: existingBalance.balance + args.tokens 
        });
      } else {
        await ctx.db.insert("credits_balance", {
          companyId: args.companyId,
          balance: args.tokens,
          updatedAt: Date.now(),
        });
        console.log("[createPaymentTransaction] Credits balance created", { balance: args.tokens });
      }
      
      console.log("[createPaymentTransaction] Success", { transactionId, invoiceNo, invoiceId });
      return { transactionId, invoiceNo, invoiceId };
    } catch (error) {
      console.error("[createPaymentTransaction] ERROR", error);
      throw error;
    }
  },
});

/**
 * Create a subscription transaction
 * This replaces the old subscription_transactions insert
 */
export const createSubscriptionTransaction = internalMutation({
  args: {
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    amount: v.number(),
    currency: v.string(),
    plan: v.string(),
    status: v.string(),
    action: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    eventType: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      companyId: args.companyId,
      userId: args.userId,
      type: "subscription",
      transactionType: "recurring",
      amount: args.amount,
      currency: args.currency,
      plan: args.plan,
      status: args.status,
      action: args.action,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      eventType: args.eventType,
      currentPeriodEnd: args.currentPeriodEnd,
      source: args.source,
      createdAt: Date.now(),
    });
    
    // 2. Generate invoice (only for paid events) - TODO: Handle this separately to avoid circular reference
    if (args.action === "renewed" || args.action === "created" || args.action === "upgraded") {
      console.log("[createSubscriptionTransaction] Invoice generation skipped due to circular reference");
      // const { invoiceNo, invoiceId } = await ctx.runMutation(
      //   internal.invoices.createInvoiceForTransaction,
      //   { transactionId }
      // );
      const invoiceNo = `INV-${Date.now()}`;
      const invoiceId = undefined;
      
      // 3. Update transaction with invoice reference
      await ctx.db.patch(transactionId, {
        invoiceId,
        invoiceNo,
      });
      
      return { transactionId, invoiceNo, invoiceId };
    }
    
    return { transactionId };
  },
});

/**
 * Create a manual credit transaction (admin only)
 */
export const createCreditTransaction = internalMutation({
  args: {
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    tokens: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      companyId: args.companyId,
      userId: args.userId,
      type: "credit",
      transactionType: "one_time",
      amount: 0, // Manual credits have no cost
      currency: "USD",
      tokens: args.tokens,
      reason: args.reason,
      createdAt: Date.now(),
    });
    
    // 2. Update credits balance
    const existingBalance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    
    if (existingBalance) {
      await ctx.db.patch(existingBalance._id, {
        balance: existingBalance.balance + args.tokens,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId: args.companyId,
        balance: args.tokens,
        updatedAt: Date.now(),
      });
    }
    
    return { transactionId };
  },
});
