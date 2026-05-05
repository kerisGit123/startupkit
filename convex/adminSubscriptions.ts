import { v } from "convex/values";
import { query } from "./_generated/server";

const PAID_PLANS = ["pro_personal", "business"];

const PLAN_PRICES: Record<string, number> = {
  pro_personal: 45.00,
  business: 119.00,
};

// Subscriptions are tracked via credits_balance.ownerPlan (Clerk Billing).
// The old org_subscriptions table is no longer populated.
export const getAllSubscriptions = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("credits_balance").collect();
    const paid = rows.filter((r) => r.ownerPlan && PAID_PLANS.includes(r.ownerPlan));

    return await Promise.all(
      paid.map(async (row) => {
        const user = row.creatorUserId
          ? await ctx.db
              .query("users")
              .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", row.creatorUserId!))
              .first()
          : null;

        const isLapsed = !!row.lapsedAt;
        return {
          _id: row._id,
          _creationTime: row._id,
          companyId: row.companyId,
          plan: row.ownerPlan ?? "unknown",
          status: isLapsed ? "canceled" : "active",
          cancelAtPeriodEnd: false,
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          userEmail: user?.email || row.ownerEmail || "Unknown",
          userName: user?.fullName || user?.firstName || user?.email || row.organizationName || "Unknown",
        };
      })
    );
  },
});

export const getSubscriptionStats = query({
  handler: async (ctx) => {
    const rows = await ctx.db.query("credits_balance").collect();
    const paid = rows.filter((r) => r.ownerPlan && PAID_PLANS.includes(r.ownerPlan));

    const active = paid.filter((r) => !r.lapsedAt);
    const canceled = paid.filter((r) => !!r.lapsedAt);

    let mrr = 0;
    active.forEach((r) => { mrr += PLAN_PRICES[r.ownerPlan ?? ""] || 0; });

    const churnRate = paid.length > 0
      ? ((canceled.length / paid.length) * 100).toFixed(1)
      : "0.0";

    return {
      totalSubscriptions: paid.length,
      activeSubscriptions: active.length,
      cancelingSubscriptions: 0,
      canceledSubscriptions: canceled.length,
      mrr: mrr.toFixed(2),
      churnRate,
    };
  },
});

export const getSubscriptionsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("credits_balance").collect();
    return rows.filter((r) => {
      if (!r.ownerPlan || !PAID_PLANS.includes(r.ownerPlan)) return false;
      const isLapsed = !!r.lapsedAt;
      const status = isLapsed ? "canceled" : "active";
      return status === args.status;
    });
  },
});
