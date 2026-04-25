import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { requireWebhookSecret } from "../credits";

/**
 * Create a payment transaction (credit purchase).
 *
 * DEPRECATION NOTE (2025-04-26):
 * This function writes to THREE tables for backward compatibility:
 * 1. `transactions` (LEGACY — kept for existing invoice joins, will be removed)
 * 2. `credits_ledger` (credit balance tracking, ownership derivation)
 * 3. `financial_ledger` (NEW unified revenue ledger — source of truth going forward)
 *
 * New code should read from `financial_ledger` or `credits_ledger`, NOT `transactions`.
 */
export const createPaymentTransaction = mutation({
  args: {
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    purchaserClerkUserId: v.optional(v.string()), // Clerk userId for ledger attribution
    amount: v.number(),
    currency: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);

    // Idempotency: Stripe retries on 5xx, and may emit overlapping
    // events. If we've already created a transaction for this
    // PaymentIntent or Checkout Session, short-circuit.
    if (args.stripePaymentIntentId) {
      const existing = await ctx.db
        .query("transactions")
        .filter((q) =>
          q.eq(q.field("stripePaymentIntentId"), args.stripePaymentIntentId),
        )
        .first();
      if (existing) {
        console.log("[createPaymentTransaction] Idempotent skip — PI already processed", {
          piId: args.stripePaymentIntentId,
          transactionId: existing._id,
        });
        return {
          transactionId: existing._id,
          invoiceNo: existing.invoiceNo,
          invoiceId: existing.invoiceId,
          deduplicated: true,
        };
      }
    }
    if (args.stripeCheckoutSessionId) {
      const existing = await ctx.db
        .query("transactions")
        .filter((q) =>
          q.eq(q.field("stripeCheckoutSessionId"), args.stripeCheckoutSessionId),
        )
        .first();
      if (existing) {
        console.log("[createPaymentTransaction] Idempotent skip — session already processed", {
          sessionId: args.stripeCheckoutSessionId,
          transactionId: existing._id,
        });
        return {
          transactionId: existing._id,
          invoiceNo: existing.invoiceNo,
          invoiceId: existing.invoiceId,
          deduplicated: true,
        };
      }
    }

    console.log("[createPaymentTransaction] Starting", args);
    const now = Date.now();

    try {
      // 1. Create transaction record
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
        createdAt: now,
      });

      // 2. Invoice number stub — real invoice generation deferred
      const invoiceNo = `INV-${now}`;
      const invoiceId = undefined;
      await ctx.db.patch(transactionId, { invoiceId, invoiceNo });

      // 3. Insert ledger row so purchase shows up in CreditTransactionHistory,
      //    getPurchaseHistory, and ownership-derivation fallbacks.
      await ctx.db.insert("credits_ledger", {
        companyId: args.companyId,
        tokens: args.tokens,
        type: "purchase",
        userId: args.purchaserClerkUserId,
        stripePaymentIntentId: args.stripePaymentIntentId,
        stripeCheckoutSessionId: args.stripeCheckoutSessionId,
        amountPaid: args.amount,
        currency: args.currency,
        reason: `Stripe top-up: ${args.tokens} credits`,
        createdAt: now,
      });

      // 4. Write to financial_ledger (NEW unified revenue ledger)
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
      await ctx.db.insert("financial_ledger", {
        ledgerId: `TXN-${year}-${random}`,
        amount: args.amount,
        currency: args.currency,
        type: "credit_purchase",
        revenueSource: "stripe_payment",
        description: `Credit top-up: ${args.tokens} credits`,
        companyId: args.companyId,
        stripePaymentIntentId: args.stripePaymentIntentId,
        tokensAmount: args.tokens,
        transactionDate: now,
        recordedAt: now,
        isReconciled: false,
        legacyTransactionId: transactionId,
        createdAt: now,
        updatedAt: now,
      });

      // 5. Update credits balance (single source of truth)
      const existingBalance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .first();

      if (existingBalance) {
        await ctx.db.patch(existingBalance._id, {
          balance: existingBalance.balance + args.tokens,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("credits_balance", {
          companyId: args.companyId,
          balance: args.tokens,
          updatedAt: now,
        });
      }

      console.log("[createPaymentTransaction] Success", { transactionId, invoiceNo, tokens: args.tokens });
      return { transactionId, invoiceNo, invoiceId, deduplicated: false };
    } catch (error) {
      console.error("[createPaymentTransaction] ERROR", error);
      throw error;
    }
  },
});

