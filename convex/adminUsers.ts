import { v } from "convex/values";
import { query } from "./_generated/server";

export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    return users;
  },
});

export const getUserStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("org_subscriptions").collect();
    
    const totalUsers = users.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
    
    return {
      totalUsers,
      activeSubscriptions,
      freeUsers: totalUsers - activeSubscriptions,
    };
  },
});

export const getUserWithSubscription = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) return null;

    // Get user's organization settings
    const orgSettings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    // Get user's subscription
    const subscription = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    // Get credits balance
    const credits = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    return {
      user,
      orgSettings,
      subscription,
      credits: credits?.balance || 0,
    };
  },
});
