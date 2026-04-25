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
import { query, mutation } from "./_generated/server";
import { requireWebhookSecret } from "./credits";

/**
 * Bootstrap mutation: insert the caller into admin_users with super_admin
 * role. Gated by webhook secret so only the API route can call it (the
 * route checks Clerk publicMetadata.role first). In dev with no
 * WEBHOOK_SECRET set, this is unrestricted — fine for local setup.
 */
export const bootstrapSuperAdmin = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    const existing = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (existing) {
      // Upgrade to super_admin if not already, ensure active
      if (existing.role !== "super_admin" || !existing.isActive) {
        await ctx.db.patch(existing._id, {
          role: "super_admin",
          isActive: true,
        });
        return { ok: true, action: "upgraded", id: existing._id };
      }
      return { ok: true, action: "already_super_admin", id: existing._id };
    }
    const id = await ctx.db.insert("admin_users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      role: "super_admin",
      isActive: true,
      createdAt: Date.now(),
      createdBy: args.clerkUserId, // self-bootstrap
    });
    return { ok: true, action: "inserted", id };
  },
});

export const getUserBillingProfile = query({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    // Super-admin only. Accept two signals:
    //   1. Clerk JWT `public_metadata.role === "super_admin"` — primary,
    //      requires the `public_metadata` claim in the Clerk JWT template
    //   2. admin_users table row with role=super_admin and isActive=true —
    //      fallback for users bootstrapped before the JWT fix
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const publicMetadata = (identity as any).public_metadata as
      | { role?: string }
      | undefined;
    const roleFromJwt = publicMetadata?.role;
    const jwtSuperAdmin = roleFromJwt === "super_admin";

    let dbSuperAdmin = false;
    if (!jwtSuperAdmin) {
      const adminRow = await ctx.db
        .query("admin_users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
        .first();
      dbSuperAdmin =
        !!adminRow && adminRow.role === "super_admin" && adminRow.isActive;
    }

    if (!jwtSuperAdmin && !dbSuperAdmin) {
      throw new Error(
        "Forbidden — super_admin role required (set publicMetadata.role in Clerk OR register via /admin/fraud-check bootstrap)",
      );
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

    // 4. Pull financial ledger entries tied to any of these workspaces.
    //    (Replaced legacy `transactions` table reads — financial_ledger is source of truth)
    const allTransactions: any[] = [];
    for (const cid of allCompanyIds) {
      const txs = await ctx.db
        .query("financial_ledger")
        .filter((q) => q.eq(q.field("companyId"), cid))
        .collect();
      for (const tx of txs) {
        allTransactions.push({ ...tx, _workspaceId: cid });
      }
    }
    allTransactions.sort((a, b) => (b.transactionDate ?? b.createdAt) - (a.transactionDate ?? a.createdAt));

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

    // ── Risk verdict (merchant-perspective dispute score) ──────────────
    // Score: 0 = weak defense (chargeback likely legitimate)
    //       100 = strong defense (chargeback likely fraud/abuse)
    let score = 50;
    const scoreReasons: { sign: "+" | "-"; points: number; text: string }[] = [];

    if (usagePercent >= 80) {
      score += 30;
      scoreReasons.push({ sign: "+", points: 30, text: `Used ${usagePercent}% of credits — strong "received the service" argument` });
    } else if (usagePercent >= 50) {
      score += 20;
      scoreReasons.push({ sign: "+", points: 20, text: `Used ${usagePercent}% of credits` });
    } else if (usagePercent >= 20) {
      score += 10;
      scoreReasons.push({ sign: "+", points: 10, text: `Used ${usagePercent}% of credits` });
    }

    if (fileCount > 50) {
      score += 20;
      scoreReasons.push({ sign: "+", points: 20, text: `${fileCount} generations delivered (concrete proof of service)` });
    } else if (fileCount > 10) {
      score += 10;
      scoreReasons.push({ sign: "+", points: 10, text: `${fileCount} generations delivered` });
    } else if (fileCount > 0) {
      score += 5;
      scoreReasons.push({ sign: "+", points: 5, text: `${fileCount} generation(s) delivered` });
    }

    if (accountAgeDays >= 90) {
      score += 15;
      scoreReasons.push({ sign: "+", points: 15, text: `Account ${accountAgeDays} days old — sustained legitimate use` });
    } else if (accountAgeDays >= 30) {
      score += 10;
      scoreReasons.push({ sign: "+", points: 10, text: `Account ${accountAgeDays} days old` });
    }

    if (accountAgeDays < 7 && totalPurchasedAmountCents > 5000) {
      score -= 25;
      scoreReasons.push({ sign: "-", points: 25, text: `Account <7 days old with >$50 purchase — possible carding` });
    }
    if (purchases.length >= 3 && accountAgeDays < 14) {
      score -= 20;
      scoreReasons.push({ sign: "-", points: 20, text: `${purchases.length} purchases in ${accountAgeDays} days — rapid spending` });
    }
    if (refunds.length > purchases.length && purchases.length > 0) {
      score -= 15;
      scoreReasons.push({ sign: "-", points: 15, text: `More refunds than purchases — abuse pattern` });
    }
    if (usagePercent < 5 && totalPurchasedAmountCents >= 1000) {
      score -= 20;
      scoreReasons.push({ sign: "-", points: 20, text: `Paid ≥$10 but used <5% — weak "received service" argument` });
    }

    score = Math.max(0, Math.min(100, score));

    let verdictLevel: "strong" | "moderate" | "weak";
    let verdictLabel: string;
    let verdictAdvice: string;
    if (score >= 70) {
      verdictLevel = "strong";
      verdictLabel = "Strong dispute defense — likely chargeback abuse";
      verdictAdvice =
        "The user consumed the service. A chargeback here is likely abuse. Submit this evidence to Stripe to fight the dispute. Consider suspending the account if confirmed.";
    } else if (score >= 40) {
      verdictLevel = "moderate";
      verdictLabel = "Moderate dispute defense — review manually";
      verdictAdvice =
        "Mixed signals. Some evidence supports fighting the dispute, some doesn't. Consider reviewing recent activity manually, or offering the user a partial refund to resolve amicably before Stripe decides.";
    } else {
      verdictLevel = "weak";
      verdictLabel = "Weak dispute defense — may be legitimate complaint";
      verdictAdvice =
        "The user paid but barely used the service. A chargeback here has a reasonable basis. Consider accepting the chargeback rather than fighting it. If there's a pattern of this (buy, dispute, repeat), treat as fraud and suspend.";
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
        tokens: tx.tokensAmount,
        plan: tx.subscriptionPlan,
        action: tx.description,
        stripePaymentIntentId: tx.stripePaymentIntentId,
        stripeSubscriptionId: tx.stripeSubscriptionId,
        invoiceNo: tx.ledgerId,
        createdAt: tx.transactionDate ?? tx.createdAt,
      })),
      redFlags,
      positiveSignals,
      verdict: {
        score,
        level: verdictLevel,
        label: verdictLabel,
        advice: verdictAdvice,
        reasons: scoreReasons,
      },
      // Anti-abuse fields from credits_balance (personal workspace)
      cyclingBlockedUntil: personalRow?.cyclingBlockedUntil ?? null,
    };
  },
});
