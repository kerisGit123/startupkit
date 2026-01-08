import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSubscription = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const sub = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    return sub ?? null;
  },
});

export const upsertSubscription = mutation({
  args: {
    companyId: v.string(),
    plan: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        status: args.status,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("org_subscriptions", {
        companyId: args.companyId,
        plan: args.plan,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        status: args.status,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getEntitlements = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const sub = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    
    const plan = sub?.plan || "free";
    
    const defaults = {
      free: { 
        scansPerMonth: 5, 
        storageMB: 10, 
        features: ["5 Scans per month"] 
      },
      starter: { 
        scansPerMonth: 50, 
        storageMB: 100, 
        features: ["50 Scans per month", "Organization"] 
      },
      pro: { 
        scansPerMonth: 200, 
        storageMB: 300, 
        features: ["200 Scans per month", "AI Summary", "Organization"] 
      },
    } as const;
    
    const freeOverride = Number(process.env.FREE_STORAGE_MB);
    const starterOverride = Number(process.env.STARTER_STORAGE_MB);
    const proOverride = Number(process.env.PRO_STORAGE_MB);
    
    const withOverrides: Record<string, any> = {
      free: { 
        ...defaults.free, 
        storageMB: Number.isFinite(freeOverride) ? freeOverride : defaults.free.storageMB 
      },
      starter: { 
        ...defaults.starter, 
        storageMB: Number.isFinite(starterOverride) ? starterOverride : defaults.starter.storageMB 
      },
      pro: { 
        ...defaults.pro, 
        storageMB: Number.isFinite(proOverride) ? proOverride : defaults.pro.storageMB 
      },
    };
    
    const e = withOverrides[(plan as string).toLowerCase()] || withOverrides.free;
    return { plan, ...e };
  },
});

export const getSubscriptionHistory = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const transactions = await ctx.db
      .query("subscription_transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .order("desc")
      .take(50);
    return transactions;
  },
});

export const recordTransaction = mutation({
  args: {
    companyId: v.string(),
    action: v.string(),
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    source: v.optional(v.string()),
    eventType: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const windowMs = 60_000;
    const recent: any[] = [];
    const cursor = ctx.db
      .query("subscription_transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc");
    
    for await (const doc of cursor) {
      if (doc.createdAt && now - doc.createdAt > windowMs) break;
      recent.push(doc);
      if (recent.length >= 50) break;
    }
    
    const isDup = recent.some((d) =>
      d.action === args.action &&
      (d.plan || null) === (args.plan || null) &&
      (d.status || null) === (args.status || null) &&
      (d.stripeCustomerId || null) === (args.stripeCustomerId || null) &&
      (d.stripeSubscriptionId || null) === (args.stripeSubscriptionId || null) &&
      (d.source || null) === (args.source || null) &&
      (d.eventType || null) === (args.eventType || null)
    );
    
    if (isDup) return true;
    
    await ctx.db.insert("subscription_transactions", {
      companyId: args.companyId,
      action: args.action,
      plan: args.plan,
      status: args.status,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      source: args.source,
      eventType: args.eventType,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: now,
    });
    return true;
  },
});
