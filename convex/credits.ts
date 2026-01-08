import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addCredits = mutation({
  args: {
    companyId: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    amountPaid: v.optional(v.number()),
    currency: v.optional(v.string()),
    reason: v.optional(v.string()),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.insert("credits_ledger", {
      companyId: args.companyId,
      tokens: args.tokens,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      amountPaid: args.amountPaid,
      currency: args.currency,
      reason: args.reason,
      createdAt: now,
    });
    
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    
    if (balance) {
      await ctx.db.patch(balance._id, {
        balance: balance.balance + args.tokens,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId: args.companyId,
        balance: args.tokens,
        updatedAt: now,
      });
    }
    
    return true;
  },
});

export const deductCredits = mutation({
  args: {
    companyId: v.string(),
    tokens: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    
    if (!balance || balance.balance < args.tokens) {
      throw new Error("Insufficient credits");
    }
    
    await ctx.db.insert("credits_ledger", {
      companyId: args.companyId,
      tokens: -args.tokens,
      reason: args.reason,
      createdAt: now,
    });
    
    await ctx.db.patch(balance._id, {
      balance: balance.balance - args.tokens,
      updatedAt: now,
    });
    
    return true;
  },
});

export const getBalance = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    
    return balance?.balance ?? 0;
  },
});

export const getLedger = query({
  args: {
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const ledger = await ctx.db
      .query("credits_ledger")
      .filter((q) => q.eq(q.field("companyId"), args.companyId))
      .order("desc")
      .take(limit);

    return ledger;
  },
});

export const getPurchaseHistory = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("credits_ledger")
      .filter((q) => 
        q.and(
          q.eq(q.field("companyId"), args.companyId),
          q.gt(q.field("tokens"), 0)
        )
      )
      .order("desc")
      .take(50);

    return purchases;
  },
});
