/**
 * Fraud check / chargeback evidence aggregator.
 *
 * Single query that takes a user identifier (Clerk userId OR email) and
 * returns a comprehensive billing profile suitable for:
 *   - Submitting evidence in Stripe chargeback disputes
 *   - Reporting suspected fraud to Clerk
 *   - Internal investigation before suspending an account
 *
 * Restricted to super_admin role at the page level. The Convex query
 * is internalQuery — only callable from the API route which checks role.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

export const getUserBillingProfile = query({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    // Super-admin only. We don't trust the Clerk JWT `roles` claim here
    // because the JWT template in this deployment emits the literal
    // string `"{{org.roles}}"` (unresolved template variable). Instead,
    // look up the caller in our admin_users table — the source of truth.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const adminRow = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!adminRow || adminRow.role !== "super_admin" || !adminRow.isActive) {
      throw new Error("Forbidden — super_admin role required");
    }

    // 1. Resolve identifier → Clerk userId.
    const id = args.identifier.trim();
    let userRow = null as null | { _id: any; clerkUserId?: string; email?: string; fullName?: string; firstName?: string; lastName?: string; _creationTime: number };

    if (id.startsWith("user_")) {
      // Looks like a Clerk userId
      userRow = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", id))
        .first();
    } else if (id.includes("@")) {
      // Looks like an email
      userRow = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", id))
        .first();
    }

    if (!userRow || !userRow.clerkUserId) {
      return {
        found: false,
        identifier: id,
        message:
          "No user found. Try a Clerk userId (starts with 'user_') or the exact registered email.",
      };
    }

    const clerkUserId = userRow.clerkUserId;

    // 2. Find all workspaces this user owns (personal + org creator).
    const ownedOrgs = await ctx.db
      .query("credits_balance")
      .withIndex("by_creatorUserId", (q) => q.eq("creatorUserId", clerkUserId))
      .collect();

    const personalRow = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", clerkUserId))
      .first();

    const allCompanyIds = new Set<string>([clerkUserId]);
    if (personalRow) allCompanyIds.add(personalRow.companyId);
    for (const o of ownedOrgs) allCompanyIds.add(o.companyId);

    // 3. Aggregate ledger across all owned workspaces.
    const allLedgerRows: any[] = [];
    for (const cid of allCompanyIds) {
      const rows = await ctx.db
        .query("credits_ledger")
        .withIndex("by_companyId", (q) => q.eq("companyId", cid))
        .collect();
      for (const row of rows) {
        allLedgerRows.push({ ...row, _workspaceId: cid });
      }
    }
    allLedgerRows.sort((a, b) => b.createdAt - a.createdAt);

    // 4. Pull Stripe transactions tied to any of these workspaces.
    const allTransactions: any[] = [];
    for (const cid of allCompanyIds) {
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_companyId", (q) => q.eq("companyId", cid))
        .collect();
      for (const tx of txs) {
        allTransactions.push({ ...tx, _workspaceId: cid });
      }
    }
    allTransactions.sort((a, b) => b.createdAt - a.createdAt);

    // 5. Pull file generations (proves credits were actually consumed).
    let fileCount = 0;
    let firstFileAt: number | null = null;
    let lastFileAt: number | null = null;
    for (const cid of allCompanyIds) {
      const files = await ctx.db
        .query("storyboard_files")
        .withIndex("by_companyId", (q) => q.eq("companyId", cid))
        .collect();
      fileCount += files.length;
      for (const f of files) {
        const t = (f as any).createdAt ?? f._creationTime;
        if (!firstFileAt || t < firstFileAt) firstFileAt = t;
        if (!lastFileAt || t > lastFileAt) lastFileAt = t;
      }
    }

    // 6. Compute summary stats.
    const purchases = allLedgerRows.filter((r) => r.type === "purchase");
    const subscriptions = allLedgerRows.filter((r) => r.type === "subscription");
    const refunds = allLedgerRows.filter((r) => r.type === "refund");
    const usage = allLedgerRows.filter((r) => r.type === "usage");
    const adminAdj = allLedgerRows.filter((r) => r.type === "admin_adjustment");

    const totalPurchasedCredits = purchases.reduce((s, r) => s + r.tokens, 0);
    const totalPurchasedAmountCents = purchases.reduce(
      (s, r) => s + (r.amountPaid ?? 0),
      0,
    );
    const totalSubscriptionCredits = subscriptions.reduce(
      (s, r) => s + r.tokens,
      0,
    );
    const totalUsedCredits = usage.reduce((s, r) => s + Math.abs(r.tokens), 0);
    const totalRefundedCredits = refunds.reduce((s, r) => s + r.tokens, 0);

    // Current balance across all owned workspaces.
    let currentBalanceTotal = 0;
    if (personalRow) currentBalanceTotal += personalRow.balance;
    for (const o of ownedOrgs) {
      if (o.companyId !== clerkUserId) currentBalanceTotal += o.balance;
    }

    // Stripe payment IDs in chronological order — useful for cross-reference
    // with Stripe's dispute submission UI.
    const stripeIds = purchases
      .map((p) => ({
        paymentIntent: p.stripePaymentIntentId,
        checkoutSession: p.stripeCheckoutSessionId,
        amountCents: p.amountPaid,
        currency: p.currency,
        tokens: p.tokens,
        createdAt: p.createdAt,
      }))
      .filter((s) => s.paymentIntent || s.checkoutSession);

    // 7. Heuristic red flags (informational — not auto-suspension).
    const accountAgeMs = Date.now() - userRow._creationTime;
    const accountAgeDays = Math.floor(accountAgeMs / (24 * 3600 * 1000));

    const firstPurchase = purchases[purchases.length - 1]; // chronologically first
    const daysFromSignupToFirstPurchase = firstPurchase
      ? Math.floor(
          (firstPurchase.createdAt - userRow._creationTime) /
            (24 * 3600 * 1000),
        )
      : null;

    const usagePercent =
      totalPurchasedCredits + totalSubscriptionCredits > 0
        ? Math.round(
            (totalUsedCredits /
              (totalPurchasedCredits + totalSubscriptionCredits)) *
              100,
          )
        : 0;

    const redFlags: string[] = [];
    if (
      daysFromSignupToFirstPurchase !== null &&
      daysFromSignupToFirstPurchase < 1 &&
      totalPurchasedAmountCents > 5000
    ) {
      redFlags.push(
        `Large purchase ($${(totalPurchasedAmountCents / 100).toFixed(2)}) within 24h of signup`,
      );
    }
    if (purchases.length >= 5 && accountAgeDays < 7) {
      redFlags.push(
        `${purchases.length} purchases in first ${accountAgeDays} days (rapid spending)`,
      );
    }
    if (refunds.length > purchases.length) {
      redFlags.push(
        `More refunds (${refunds.length}) than purchases (${purchases.length}) — investigate`,
      );
    }

    // Positive signals — useful as evidence the user RECEIVED what they paid for
    const positiveSignals: string[] = [];
    if (usagePercent >= 50) {
      positiveSignals.push(
        `${usagePercent}% of total credits have been spent (${totalUsedCredits.toLocaleString()} of ${(totalPurchasedCredits + totalSubscriptionCredits).toLocaleString()})`,
      );
    }
    if (fileCount > 0) {
      positiveSignals.push(
        `${fileCount} AI generations completed and stored (proof of service delivery)`,
      );
    }
    if (accountAgeDays >= 30) {
      positiveSignals.push(
        `Account has been active for ${accountAgeDays} days (sustained legitimate use)`,
      );
    }

    return {
      found: true,
      user: {
        clerkUserId,
        email: userRow.email,
        fullName: userRow.fullName ?? userRow.firstName,
        signedUpAt: userRow._creationTime,
        accountAgeDays,
      },
      workspaces: Array.from(allCompanyIds),
      summary: {
        currentBalanceTotal,
        totalPurchasedCredits,
        totalPurchasedAmountCents,
        totalSubscriptionCredits,
        totalUsedCredits,
        totalRefundedCredits,
        usagePercent,
        purchaseCount: purchases.length,
        usageEventCount: usage.length,
        refundEventCount: refunds.length,
        adminAdjustmentCount: adminAdj.length,
        fileCount,
        firstFileAt,
        lastFileAt,
        firstPurchaseAt: firstPurchase?.createdAt ?? null,
        daysFromSignupToFirstPurchase,
      },
      stripeIds,
      recentLedger: allLedgerRows.slice(0, 30).map((r) => ({
        type: r.type,
        tokens: r.tokens,
        reason: r.reason,
        amountPaid: r.amountPaid,
        currency: r.currency,
        createdAt: r.createdAt,
        workspaceId: r._workspaceId,
        userId: r.userId,
      })),
      transactions: allTransactions.map((tx) => ({
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        tokens: tx.tokens,
        plan: tx.plan,
        action: tx.action,
        stripePaymentIntentId: tx.stripePaymentIntentId,
        stripeCheckoutSessionId: tx.stripeCheckoutSessionId,
        stripeSubscriptionId: tx.stripeSubscriptionId,
        invoiceNo: tx.invoiceNo,
        createdAt: tx.createdAt,
      })),
      redFlags,
      positiveSignals,
    };
  },
});
