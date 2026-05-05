import { v } from "convex/values";
import { query } from "./_generated/server";

// Users table only — re-fires on label/block/login changes (rare).
// Do NOT join credits_balance here: balance changes on every AI generation
// and would cause this subscription to re-fire for every admin with the
// users page open.
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").collect();
    // Personal workspace companyId === clerkUserId — no DB join needed
    return users.map(user => ({
      ...user,
      companyId: user.clerkUserId ?? null,
    }));
  },
});

// Separate lightweight subscription for plan data.
// Re-fires on any credits_balance write, but the projected payload is tiny
// (~50 bytes/row vs full user objects) so bandwidth impact is minimal.
export const getAdminUserPlanMap = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("credits_balance").collect();
    return rows.map(r => ({ companyId: r.companyId, ownerPlan: r.ownerPlan ?? null }));
  },
});

const PAID_PLANS = ["pro_personal", "business"];

export const getUserStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const balanceRows = await ctx.db.query("credits_balance").collect();

    const activeUsers = users.filter(u => !u.deletionTime);
    const totalUsers = activeUsers.length;

    // Only count personal workspaces (companyId === clerkUserId) to avoid
    // double-counting org workspaces owned by the same user
    const clerkUserIds = new Set(activeUsers.map(u => u.clerkUserId).filter(Boolean));
    const activeSubscriptions = balanceRows.filter(
      r => r.ownerPlan && PAID_PLANS.includes(r.ownerPlan) && !r.lapsedAt
        && clerkUserIds.has(r.companyId)
    ).length;
    const freeUsers = Math.max(0, totalUsers - activeSubscriptions);

    return { totalUsers, activeSubscriptions, freeUsers };
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

    const orgSettings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    const subscription = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    const credits = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    return {
      user,
      orgSettings,
      subscription,
      credits: credits?.balance ?? null,
    };
  },
});
