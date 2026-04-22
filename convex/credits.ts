import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";

/**
 * Unified credit system.
 *
 * Two tables:
 *   - credits_balance  → current balance snapshot per companyId
 *   - credits_ledger   → append-only log of all credit movements
 *
 * Every ledger row carries a typed `type` field so we can filter and
 * analyze without relying on free-form `reason` strings:
 *
 *   org_created      Marker written by Clerk webhook on org creation.
 *                    Establishes authoritative ownership via userId.
 *   purchase         User bought a top-up pack.
 *   subscription     Monthly subscription credit refill.
 *   usage            AI generation deducted credits.
 *   refund           Credits added back via refund.
 *   transfer_out     Credits sent to another owned org (paired with transfer_in).
 *   transfer_in      Credits received from another owned org (paired with transfer_out).
 *   admin_adjustment Manual support tweak — EXCLUDED from ownership derivation.
 *
 * Ownership of a company is derived by getCompanyCreator:
 *   1. org_created marker (Clerk-authoritative, set by webhook)
 *   2. Earliest purchase/subscription with userId (legacy fallback)
 *   3. Earliest storyboard_projects.ownerId (ancient-data fallback)
 */

// ─── Types ───────────────────────────────────────────────────────────────

const LedgerTypeValidator = v.union(
  v.literal("org_created"),
  v.literal("purchase"),
  v.literal("subscription"),
  v.literal("usage"),
  v.literal("refund"),
  v.literal("transfer_out"),
  v.literal("transfer_in"),
  v.literal("admin_adjustment"),
  v.literal("subscription_change"),
);

// ─── Balance writers ─────────────────────────────────────────────────────

/**
 * Stripe refund → proportional credit reversal.
 *
 * Called by the `charge.refunded` Stripe webhook. Finds the original
 * purchase ledger row by stripePaymentIntentId, computes how many credits
 * to claw back (proportional to the refund amount), then deducts them and
 * writes a `refund` row. If the user already spent the credits their balance
 * can go negative — that's intentional (they owe us the service).
 *
 * Idempotent on (stripeChargeId, refundId): if the same refund fires twice
 * we skip the second write.
 */
export const reverseCreditsOnRefund = mutation({
  args: {
    stripePaymentIntentId: v.string(),
    stripeChargeId: v.string(),
    stripeRefundId: v.string(),
    refundAmountCents: v.number(),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    const now = Date.now();

    // Idempotency: skip if we already processed this refund
    const alreadyProcessed = await ctx.db
      .query("credits_ledger")
      .filter((q) => q.eq(q.field("reason"), `stripe_refund:${args.stripeRefundId}`))
      .first();
    if (alreadyProcessed) return { skipped: true, reason: "already_processed" };

    // Find the original purchase row
    const purchaseRow = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        // We don't know companyId here so scan by stripePaymentIntentId via filter
        q.eq("companyId", "__scan__").eq("type", "purchase"),
      )
      .filter((q) => false) // intentional no-op — use the full scan below
      .first();

    // Full scan by stripePaymentIntentId (credits_ledger doesn't have a
    // by_stripePaymentIntentId index, so we filter on the by_company_type
    // index for "purchase" rows across all companies)
    const allPurchaseRows = await ctx.db
      .query("credits_ledger")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "purchase"),
          q.eq(q.field("stripePaymentIntentId"), args.stripePaymentIntentId),
        ),
      )
      .collect();

    if (allPurchaseRows.length === 0) {
      return { skipped: true, reason: "no_matching_purchase_row" };
    }

    const original = allPurchaseRows[0];
    const originalAmountCents = original.amountPaid ?? 0;
    const originalTokens = original.tokens;

    if (originalAmountCents <= 0 || originalTokens <= 0) {
      return { skipped: true, reason: "original_row_has_no_amount_or_tokens" };
    }

    // Proportional: how many credits to reverse?
    const ratio = Math.min(1, args.refundAmountCents / originalAmountCents);
    const tokensToReverse = Math.round(originalTokens * ratio);

    if (tokensToReverse <= 0) return { skipped: true, reason: "zero_tokens_to_reverse" };

    // Write the reversal ledger row (negative tokens = deduction)
    await ctx.db.insert("credits_ledger", {
      companyId: original.companyId,
      tokens: -tokensToReverse,
      type: "refund",
      userId: original.userId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      reason: `stripe_refund:${args.stripeRefundId}`,
      createdAt: now,
    });

    // Patch balance — allow going negative (user consumed more than they paid for)
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", original.companyId))
      .first();

    if (balance) {
      await ctx.db.patch(balance._id, {
        balance: balance.balance - tokensToReverse,
        updatedAt: now,
      });
    }

    return {
      skipped: false,
      companyId: original.companyId,
      tokensReversed: tokensToReverse,
      ratio,
    };
  },
});

/**
 * Add credits back to a company's balance (refund flow).
 */
/**
 * Public refund — accepts EITHER an authenticated owner of the workspace
 * (client SceneEditor on local generation errors) OR a webhook secret
 * (KIE callback / async failure paths that have no Clerk identity).
 */
export const refundCredits = mutation({
  args: {
    companyId: v.string(),
    tokens: v.number(),
    reason: v.optional(v.string()),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId: string | undefined;
    if (args._secret) {
      requireWebhookSecret(args._secret);
    } else {
      userId = await requireWorkspaceAccess(ctx, args.companyId);
    }
    const now = Date.now();

    await ctx.db.insert("credits_ledger", {
      companyId: args.companyId,
      tokens: args.tokens,
      type: "refund",
      userId,
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

/**
 * Deduct credits from a company's balance. Defaults `type` to "usage" for
 * AI generation flows. Optional usage metadata (projectId, itemId, model,
 * action) replaces the previous storyboard_credit_usage table — passing
 * these fields makes the ledger entry fully queryable for UsageDashboard.
 *
 * Auto-grants monthly credits if `plan` is provided and the current
 * cycle's subscription grant hasn't been issued yet (lazy allocation).
 */
export const deductCredits = mutation({
  args: {
    companyId: v.string(),
    tokens: v.number(),
    reason: v.optional(v.string()),
    type: v.optional(LedgerTypeValidator),
    projectId: v.optional(v.id("storyboard_projects")),
    itemId: v.optional(v.id("storyboard_items")),
    model: v.optional(v.string()),
    action: v.optional(v.string()),
    // Client-supplied plan from useSubscription(). Used to auto-grant
    // the monthly allowance if the current cycle hasn't been granted yet.
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const callerUserId = identity?.subject;

    // ── Server-side lapsed check (defense in depth) ──
    // Block deduction if the workspace is an org whose subscription
    // has lapsed. The UI already hides generation buttons, but a
    // malicious caller could invoke the mutation directly — this check
    // closes that loophole.
    const isOrg = args.companyId.startsWith("org_");
    if (isOrg) {
      const preCheckBalance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
        .first();
      if (preCheckBalance?.ownerPlan === "free") {
        throw new Error(
          "This organization's subscription has lapsed. Resubscribe to continue generating content.",
        );
      }
    }

    // ── Auto-grant monthly credits if due ──
    if (args.plan) {
      await grantMonthlyCreditsIfDue(ctx, {
        companyId: args.companyId,
        plan: args.plan,
        userId: callerUserId,
        now,
      });
    }

    // ── Re-fetch balance after potential grant ──
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
      type: args.type ?? "usage",
      userId: callerUserId,
      reason: args.reason,
      projectId: args.projectId,
      itemId: args.itemId,
      model: args.model,
      action: args.action,
      createdAt: now,
    });

    await ctx.db.patch(balance._id, {
      balance: balance.balance - args.tokens,
      updatedAt: now,
    });

    return true;
  },
});

/**
 * Shared grant helper — used by both `deductCredits` (lazy allocation)
 * and `ensureMonthlyGrant` (explicit trigger).
 */
async function grantMonthlyCreditsIfDue(
  ctx: { db: any },
  args: {
    companyId: string;
    plan: string;
    userId?: string;
    now: number;
  },
): Promise<{ granted: boolean; amount?: number; reason?: string }> {
  // ── Anti-abuse: refuse to grant while the workspace is in a cycling block ──
  // propagateOwnerPlanChange sets cyclingBlockedUntil when it detects a user
  // has flipped plans >= 5 times in the last 30d. While the block is active,
  // we let paid features work (plan snapshot unchanged) but refuse to mint
  // any fresh monthly credits.
  const balanceForCheck = await ctx.db
    .query("credits_balance")
    .withIndex("by_companyId", (q: any) => q.eq("companyId", args.companyId))
    .first();
  if (
    balanceForCheck?.cyclingBlockedUntil &&
    balanceForCheck.cyclingBlockedUntil > args.now
  ) {
    return { granted: false, reason: "cycling_blocked" };
  }

  const monthStart = (() => {
    const d = new Date(args.now);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  })();

  const existingGrant = await ctx.db
    .query("credits_ledger")
    .withIndex("by_company_type", (q: any) =>
      q.eq("companyId", args.companyId).eq("type", "subscription"),
    )
    .order("desc")
    .first();

  // Three cases for re-granting:
  //   - same plan, same month        → skip (no-op)
  //   - plan change, new amount > old → upgrade: skip clawback, add full new
  //   - plan change, new amount < old → downgrade: claw back leftover, add new
  //   - same plan, new month         → calendar rollover: claw back, add new
  //
  // Skipping clawback on upgrades means a free → pro mid-month user gets the
  // full +2500 instead of being penalized for unused free credits. The
  // downgrade clawback prevents accumulating credits by cycling subscriptions.
  let planChanged = false;
  let isDowngrade = false;
  if (existingGrant && existingGrant.createdAt >= monthStart) {
    const prevPlan = existingGrant.reason?.match(/Monthly grant: (\w+)/)?.[1];
    if (prevPlan === args.plan) {
      return { granted: false, reason: "already_granted_same_plan" };
    }
    planChanged = true; // same month, different plan
    const prevAmount = (prevPlan && MONTHLY_CREDITS[prevPlan]) ?? 0;
    const newAmount = MONTHLY_CREDITS[args.plan] ?? 0;
    isDowngrade = newAmount < prevAmount;
  }

  const monthlyAmount = MONTHLY_CREDITS[args.plan] ?? 0;
  if (monthlyAmount <= 0) return { granted: false };

  // Model B: orgs NEVER receive auto-grants. All subscription credits
  // land in the user's personal workspace. The user then distributes
  // to their orgs via the Transfer Credits dialog. This prevents
  // double-granting (personal gets 2500 + org gets 2500 = 5000 for
  // one $39.90 subscription).
  const isOrg = args.companyId.startsWith("org_");
  if (isOrg) {
    return { granted: false, reason: "orgs_receive_credits_via_transfer_only" };
  }

  // Claw back the previous cycle's leftover credits IF either:
  //   - calendar-month rollover (no plan change), OR
  //   - plan downgrade (so users can't game by cycling pro → free → pro)
  // Skip clawback on plan upgrades so the user gets the full new allowance
  // they paid for.
  const shouldClawback = existingGrant && (!planChanged || isDowngrade);
  if (shouldClawback) {
    const previousSubTokens = existingGrant.tokens;
    const usageSince = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q: any) =>
        q.eq("companyId", args.companyId).eq("type", "usage"),
      )
      .filter((q: any) => q.gt(q.field("createdAt"), existingGrant.createdAt))
      .collect();

    const usedSincePrev = usageSince.reduce(
      (sum: number, row: any) => sum + Math.abs(row.tokens),
      0,
    );
    const leftover = Math.max(0, previousSubTokens - usedSincePrev);

    if (leftover > 0) {
      const balance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q: any) =>
          q.eq("companyId", args.companyId),
        )
        .first();

      if (balance) {
        await ctx.db.patch(balance._id, {
          balance: Math.max(0, balance.balance - leftover),
          updatedAt: args.now,
        });
      }

      await ctx.db.insert("credits_ledger", {
        companyId: args.companyId,
        tokens: -leftover,
        type: "admin_adjustment",
        userId: args.userId,
        reason: "monthly_rollover_clawback",
        createdAt: args.now,
      });
    }
  }

  // Grant the new month's credits
  await ctx.db.insert("credits_ledger", {
    companyId: args.companyId,
    tokens: monthlyAmount,
    type: "subscription",
    userId: args.userId,
    reason: `Monthly grant: ${args.plan}`,
    createdAt: args.now,
  });

  const balance = await ctx.db
    .query("credits_balance")
    .withIndex("by_companyId", (q: any) => q.eq("companyId", args.companyId))
    .first();

  if (balance) {
    await ctx.db.patch(balance._id, {
      balance: balance.balance + monthlyAmount,
      updatedAt: args.now,
    });
  } else {
    await ctx.db.insert("credits_balance", {
      companyId: args.companyId,
      balance: monthlyAmount,
      updatedAt: args.now,
    });
  }

  return { granted: true, amount: monthlyAmount };
}

// ─── Ownership ────────────────────────────────────────────────────────────

/**
 * Idempotent marker writer called by the Clerk `organization.created`
 * webhook. Records the Clerk-authoritative creator of an org as a
 * zero-token ledger entry with type "org_created". getCompanyCreator
 * reads this as the primary ownership source.
 */
export const recordOrgCreator = mutation({
  args: {
    companyId: v.string(),
    userId: v.string(),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    // Idempotent: if marker already exists, do nothing
    const existing = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "org_created"),
      )
      .first();

    if (existing) {
      return { alreadyExists: true, existingUserId: existing.userId };
    }

    await ctx.db.insert("credits_ledger", {
      companyId: args.companyId,
      tokens: 0,
      type: "org_created",
      userId: args.userId,
      reason: "Clerk organization.created webhook",
      createdAt: Date.now(),
    });

    return { alreadyExists: false };
  },
});

/**
 * Derive the creator (owner) of a company using a 3-layer lookup:
 *
 *   1. org_created marker — Clerk-authoritative (written by webhook)
 *   2. Earliest purchase/subscription with userId — legacy fallback
 *   3. Earliest storyboard_projects.ownerId — ancient-data fallback
 *
 * Returns null if ownership cannot be determined.
 */
export const getCompanyCreator = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    // Layer 1: Clerk-authoritative marker
    const orgCreated = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "org_created"),
      )
      .first();
    if (orgCreated?.userId) return orgCreated.userId;

    // Layer 2: Earliest real financial inflow
    const earliestPurchase = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "purchase"),
      )
      .order("asc")
      .first();

    const earliestSubscription = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "subscription"),
      )
      .order("asc")
      .first();

    const inflows = [earliestPurchase, earliestSubscription]
      .filter((e): e is NonNullable<typeof e> => !!e && !!e.userId)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (inflows.length > 0) return inflows[0].userId ?? null;

    // Layer 3: Earliest project owner (legacy orgs with no ledger yet)
    const earliestProject = await ctx.db
      .query("storyboard_projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.companyId))
      .order("asc")
      .first();

    return earliestProject?.ownerId ?? null;
  },
});

// ─── Transfer ─────────────────────────────────────────────────────────────

/**
 * Atomically transfer credits between two orgs owned by the same caller.
 *
 * Safety layers:
 *   1. Requires authenticated caller
 *   2. Ownership check via getCompanyCreator on BOTH source and destination
 *   3. Rate limit: max 10 transfer_out per caller per rolling hour
 *   4. Different-orgs guard
 *   5. Balance sufficiency check
 *   6. Atomic mutation (Convex rolls back on any throw)
 *   7. Paired ledger entries with counterpartCompanyId linkage
 */
export const transferCredits = mutation({
  args: {
    fromCompanyId: v.string(),
    toCompanyId: v.string(),
    tokens: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const callerUserId = identity.subject;

    // 2. Validate
    if (args.fromCompanyId === args.toCompanyId) {
      throw new Error("Source and destination organizations must be different");
    }
    if (args.tokens <= 0) {
      throw new Error("Transfer amount must be greater than zero");
    }

    // 3. Ownership check — both ends (inlined getCompanyCreator logic to
    //    keep this atomic in a single mutation)
    const fromCreator = await resolveCompanyCreator(ctx, args.fromCompanyId);
    if (!fromCreator) {
      throw new Error("Source organization has no determinable owner");
    }
    if (fromCreator !== callerUserId) {
      throw new Error("You are not the owner of the source organization");
    }

    const toCreator = await resolveCompanyCreator(ctx, args.toCompanyId);
    if (!toCreator) {
      throw new Error("Destination organization has no determinable owner");
    }
    if (toCreator !== callerUserId) {
      throw new Error("You are not the owner of the destination organization");
    }

    // 4. Rate limit: max 10 transfer_out per caller per rolling hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentTransfers = await ctx.db
      .query("credits_ledger")
      .withIndex("by_user", (q) => q.eq("userId", callerUserId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "transfer_out"),
          q.gt(q.field("createdAt"), oneHourAgo),
        ),
      )
      .collect();

    if (recentTransfers.length >= 10) {
      throw new Error(
        "Transfer rate limit exceeded (max 10 per hour). Try again later.",
      );
    }

    // 5. Fetch source balance, ensure sufficient funds
    const fromBal = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) =>
        q.eq("companyId", args.fromCompanyId),
      )
      .first();

    if (!fromBal || fromBal.balance < args.tokens) {
      throw new Error("Insufficient credits in source organization");
    }

    const toBal = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.toCompanyId))
      .first();

    const now = Date.now();

    // 6. Atomic debit/credit
    await ctx.db.patch(fromBal._id, {
      balance: fromBal.balance - args.tokens,
      updatedAt: now,
    });

    if (toBal) {
      await ctx.db.patch(toBal._id, {
        balance: toBal.balance + args.tokens,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId: args.toCompanyId,
        balance: args.tokens,
        updatedAt: now,
      });
    }

    // 7. Paired ledger entries
    await ctx.db.insert("credits_ledger", {
      companyId: args.fromCompanyId,
      tokens: -args.tokens,
      type: "transfer_out",
      userId: callerUserId,
      counterpartCompanyId: args.toCompanyId,
      reason: args.reason ?? "credit_transfer",
      createdAt: now,
    });

    await ctx.db.insert("credits_ledger", {
      companyId: args.toCompanyId,
      tokens: args.tokens,
      type: "transfer_in",
      userId: callerUserId,
      counterpartCompanyId: args.fromCompanyId,
      reason: args.reason ?? "credit_transfer",
      createdAt: now,
    });

    return {
      fromBalance: fromBal.balance - args.tokens,
      toBalance: (toBal?.balance ?? 0) + args.tokens,
    };
  },
});

/**
 * Internal helper that mirrors getCompanyCreator. Inlined so that
 * transferCredits can call it directly (mutations can't call queries).
 */
export async function resolveCompanyCreator(
  ctx: { db: any },
  companyId: string,
): Promise<string | null> {
  // Layer 0: credits_balance.creatorUserId — the most reliable source,
  // set by the user.created and organization.created webhooks via
  // setOwnerPlan. Works for both personal workspaces and orgs.
  const balanceRow = await ctx.db
    .query("credits_balance")
    .withIndex("by_companyId", (q: any) =>
      q.eq("companyId", companyId),
    )
    .first();
  if (balanceRow?.creatorUserId) return balanceRow.creatorUserId;

  // Layer 1: org_created ledger marker (Clerk webhook)
  const orgCreated = await ctx.db
    .query("credits_ledger")
    .withIndex("by_company_type", (q: any) =>
      q.eq("companyId", companyId).eq("type", "org_created"),
    )
    .first();
  if (orgCreated?.userId) return orgCreated.userId;

  const earliestPurchase = await ctx.db
    .query("credits_ledger")
    .withIndex("by_company_type", (q: any) =>
      q.eq("companyId", companyId).eq("type", "purchase"),
    )
    .order("asc")
    .first();

  const earliestSubscription = await ctx.db
    .query("credits_ledger")
    .withIndex("by_company_type", (q: any) =>
      q.eq("companyId", companyId).eq("type", "subscription"),
    )
    .order("asc")
    .first();

  const inflows = [earliestPurchase, earliestSubscription]
    .filter((e: any) => !!e && !!e.userId)
    .sort((a: any, b: any) => a.createdAt - b.createdAt);
  if (inflows.length > 0) return inflows[0].userId ?? null;

  const earliestProject = await ctx.db
    .query("storyboard_projects")
    .withIndex("by_org", (q: any) => q.eq("orgId", companyId))
    .order("asc")
    .first();

  return earliestProject?.ownerId ?? null;
}

/**
 * Throw unless the authenticated caller owns `companyId`. Personal
 * workspaces (companyId === user's own Clerk subject) always pass.
 * Returns the caller's userId for convenience.
 */
export async function requireOwner(
  ctx: { db: any; auth: any },
  companyId: string,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  if (companyId === identity.subject) return identity.subject;
  const creator = await resolveCompanyCreator(ctx, companyId);
  if (creator !== identity.subject) {
    throw new Error("You are not the owner of this workspace");
  }
  return identity.subject;
}

/**
 * Throw unless the authenticated caller can access `companyId`. Tries
 * five increasingly-broad signals:
 *   1. Personal workspace (companyId === user's Clerk subject)
 *   2. Active-org JWT claim (`identity.orgId === companyId`) — only fires
 *      when the Clerk JWT template includes `org_id`. The default
 *      template here does NOT, so this is a no-op until configured.
 *   3. Workspace creator (per resolveCompanyCreator)
 *   4. Owns any project in this workspace (via storyboard_projects
 *      by_owner index)
 *   5. Has any ledger row authored by this user in this workspace
 *
 * Brand-new invited members with zero activity will fail until they
 * perform any action that creates evidence (a project or a deduction).
 * The proper fix is to add `org_id`/`org_role` to the Clerk JWT template
 * — see commit message for instructions.
 */
export async function requireWorkspaceAccess(
  ctx: { db: any; auth: any },
  companyId: string,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const userId = identity.subject;

  // 1 + 2: Quick checks via JWT
  if (companyId === userId) return userId;
  if ((identity as any).orgId === companyId) return userId;

  // 3: Creator
  const creator = await resolveCompanyCreator(ctx, companyId);
  if (creator === userId) return userId;

  // 4: Owns a project in this workspace
  const ownedProject = await ctx.db
    .query("storyboard_projects")
    .withIndex("by_owner", (q: any) =>
      q.eq("orgId", companyId).eq("ownerId", userId),
    )
    .first();
  if (ownedProject) return userId;

  // 5: Has any ledger evidence (deduction, refund, etc.) — scans via
  // by_companyId then filters; acceptable for typical workspace sizes.
  const ledgerEvidence = await ctx.db
    .query("credits_ledger")
    .withIndex("by_companyId", (q: any) => q.eq("companyId", companyId))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first();
  if (ledgerEvidence) return userId;

  throw new Error("You do not have access to this workspace");
}

/**
 * Throw unless the request carries the WEBHOOK_SECRET shared between
 * Convex env and Next.js API routes (Stripe / Clerk / KIE callbacks).
 * Used to gate mutations that have no Clerk user identity (called by
 * server-side handlers via ConvexHttpClient).
 *
 * Setup:
 *   1. `npx convex env set WEBHOOK_SECRET <random-32-bytes>`
 *   2. Add `WEBHOOK_SECRET=<same-value>` to `.env.local`
 *   3. The API route reads `process.env.WEBHOOK_SECRET` and passes it
 *      as `_secret`.
 *
 * In dev (no secret set anywhere) this is a no-op so the existing
 * webhook flows keep working. In prod, deploy will fail to call these
 * mutations until the env var is configured.
 */
export function requireWebhookSecret(secret: string | undefined): void {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return; // dev mode bypass — see docstring
  if (secret !== expected) {
    throw new Error(
      "Forbidden — call requires WEBHOOK_SECRET (server-only mutation)",
    );
  }
}

// ─── Monthly credit grant (Option 3: on-demand lazy allocation) ───────────

/**
 * Per-plan monthly credit allowance.
 * Keep in sync with lib/plan-config.ts PLAN_LIMITS.monthlyCredits.
 * Duplicated here because Convex mutations can't import from lib/.
 */
const MONTHLY_CREDITS: Record<string, number> = {
  free: 100,
  pro_personal: 2500, // merged old Pro (2000) + Starter Team (2500) → use 2500
  business: 6900,
};

/**
 * Explicit monthly grant trigger. Idempotent — safe to call multiple
 * times; only issues a grant if the current cycle hasn't been granted.
 *
 * `deductCredits` already calls the same logic internally (lazy
 * allocation), so this is only needed if you want to pre-fill the
 * balance on first dashboard load or from a cron.
 *
 * Monthly credits do NOT roll over. Any leftover from the previous
 * cycle is clawed back before the new grant is added.
 */
export const ensureMonthlyGrant = mutation({
  args: {
    companyId: v.string(),
    plan: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Read userId from auth if not passed explicitly (CreditBalanceDisplay
    // doesn't pass it, but the mutation can read from the session).
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.userId ?? identity?.subject;

    return await grantMonthlyCreditsIfDue(ctx, {
      companyId: args.companyId,
      plan: args.plan,
      userId,
      now: Date.now(),
    });
  },
});

// ─── Dev / Testing helpers ────────────────────────────────────────────────
// These mutations are intended for the /testing page inside storyboard-studio.
// They let the developer reset state so the auto-grant flow can be tested
// end-to-end without hand-editing rows in the Convex dashboard.
//
// Security: these mutations require an authenticated caller and only
// operate on the caller's own company. They cannot be used to tamper with
// another user's data. Remove or restrict further before production launch.

/**
 * Reset the caller's personal workspace credits for testing purposes:
 *   1. Delete all subscription-type ledger entries for this cycle
 *      (so the auto-grant will fire again on next dashboard load)
 *   2. Set credits_balance for this company to 0
 *
 * The caller can pass `companyId` explicitly (e.g. to reset a specific
 * owned org) or omit it to reset the currently-active workspace from
 * identity.orgId || identity.subject.
 */
export const resetCreditsForTesting = mutation({
  args: {
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const companyId =
      args.companyId ?? (identity.orgId as string) ?? identity.subject;

    if (companyId !== identity.subject) {
      const creator = await resolveCompanyCreator(ctx, companyId);
      if (creator !== identity.subject) {
        throw new Error("You are not the owner of this workspace");
      }
    }

    // 1. Delete THIS MONTH's subscription ledger entries so the grant
    //    check will allow a fresh grant on next load.
    const monthStart = (() => {
      const d = new Date();
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    })();

    const subsThisMonth = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", companyId).eq("type", "subscription"),
      )
      .filter((q) => q.gte(q.field("createdAt"), monthStart))
      .collect();

    for (const row of subsThisMonth) {
      await ctx.db.delete(row._id);
    }

    // 2. Reset balance to 0 (create row if missing)
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();

    if (balance) {
      await ctx.db.patch(balance._id, {
        balance: 0,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId,
        balance: 0,
        updatedAt: Date.now(),
      });
    }

    return {
      companyId,
      deletedSubscriptionEntries: subsThisMonth.length,
      newBalance: 0,
    };
  },
});

/**
 * Backfill `type: "usage"` on historical ledger rows that were created
 * before the `type` field was added to the schema. Detects rows by
 * `reason` matching "AI ...generation" patterns (the text used by
 * legacy deductCredits callers).
 *
 * Only operates on the caller's own company. Safe to run multiple
 * times — skips rows that already have a type.
 */
export const cleanupUntypedLedgerRows = mutation({
  args: {
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const companyId =
      args.companyId ?? (identity.orgId as string) ?? identity.subject;

    if (companyId !== identity.subject) {
      const creator = await resolveCompanyCreator(ctx, companyId);
      if (creator !== identity.subject) {
        throw new Error("You are not the owner of this workspace");
      }
    }

    const allRows = await ctx.db
      .query("credits_ledger")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .collect();

    const untyped = allRows.filter((r) => r.type === undefined);
    let patchedUsage = 0;
    let skipped = 0;

    for (const row of untyped) {
      const reason = row.reason ?? "";
      // Heuristic: any row with a negative token count and a reason
      // containing "generation" is an AI usage event.
      const looksLikeUsage =
        row.tokens < 0 && /generation/i.test(reason);

      if (looksLikeUsage) {
        await ctx.db.patch(row._id, {
          type: "usage",
          userId: row.userId ?? identity.subject,
        });
        patchedUsage++;
      } else {
        skipped++;
      }
    }

    return {
      scanned: allRows.length,
      untypedFound: untyped.length,
      patchedAsUsage: patchedUsage,
      skippedUnknown: skipped,
    };
  },
});

/**
 * Testing: simulate a lapsed subscription for the current org workspace.
 * Sets ownerPlan to "free" and lapsedAt to now. The LapsedBanner will
 * appear and deductCredits/create project will be blocked.
 *
 * Does NOT touch Clerk — the user's actual subscription stays intact.
 * To undo, use restoreOrgPlanForTesting.
 */
export const simulateOrgLapseForTesting = mutation({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    if (!args.companyId.startsWith("org_")) {
      throw new Error("Lapse simulation only applies to orgs, not personal workspaces");
    }

    const creator = await resolveCompanyCreator(ctx, args.companyId);
    if (creator !== identity.subject) {
      throw new Error("You are not the owner of this workspace");
    }

    const row = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    if (!row) throw new Error(`No credits_balance row for ${args.companyId}`);

    await ctx.db.patch(row._id, {
      ownerPlan: "free",
      lapsedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { ok: true, companyId: args.companyId };
  },
});

/**
 * Testing: restore an org's plan from the simulated lapse state.
 * Sets ownerPlan to the specified plan and clears lapsedAt.
 */
export const restoreOrgPlanForTesting = mutation({
  args: {
    companyId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const creator = await resolveCompanyCreator(ctx, args.companyId);
    if (creator !== identity.subject) {
      throw new Error("You are not the owner of this workspace");
    }

    const row = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    if (!row) throw new Error(`No credits_balance row for ${args.companyId}`);

    await ctx.db.patch(row._id, {
      ownerPlan: args.plan,
      lapsedAt: undefined,
      updatedAt: Date.now(),
    });

    return { ok: true, companyId: args.companyId, restoredPlan: args.plan };
  },
});

/**
 * Testing: nuclear reset — DELETE ALL data for the calling user across
 * every storyboard table that uses companyId.
 *
 * Flow:
 *   1. Collects all companyIds: personal workspace + every org the user created
 *   2. For each companyId, deletes rows from 6 tables:
 *      credits_balance, credits_ledger, storyboard_projects,
 *      storyboard_items, storyboard_files, storyboard_elements
 *   3. Returns the list of R2 keys that were on the storyboard_files
 *      rows BEFORE deletion (so the caller can delete R2 objects separately)
 *
 * IMPORTANT: This mutation cannot delete R2 files (Convex mutations can't
 * make HTTP calls). The API route /api/testing/nuclear-reset handles R2
 * deletion, then calls this mutation for the Convex cleanup.
 *
 * Does NOT touch Clerk (subscriptions, orgs, user account stay intact).
 */
export const nuclearResetForTesting = mutation({
  args: {
    // userId is passed explicitly by the API route (which authenticates
    // via Clerk server-side). We can't rely on ctx.auth here because
    // the Convex server client used by API routes doesn't carry the
    // user's session token.
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) throw new Error("userId is required");

    // ── Collect all companyIds ──────────────────────────────────────
    const companyIds: string[] = [userId];

    // Orgs by creatorUserId
    const ownedOrgRows = await ctx.db
      .query("credits_balance")
      .withIndex("by_creatorUserId", (q) => q.eq("creatorUserId", userId))
      .collect();
    for (const row of ownedOrgRows) {
      if (!companyIds.includes(row.companyId)) {
        companyIds.push(row.companyId);
      }
    }

    // Personal workspace fallback (might not have creatorUserId set)
    const personalRow = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", userId))
      .first();
    if (personalRow && !companyIds.includes(personalRow.companyId)) {
      companyIds.push(personalRow.companyId);
    }

    // Also check storyboard_projects for any orgs not tracked in credits_balance
    const allProjects = await ctx.db
      .query("storyboard_projects")
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();
    for (const proj of allProjects) {
      const cid = proj.companyId ?? proj.orgId;
      if (cid && !companyIds.includes(cid)) {
        companyIds.push(cid);
      }
    }

    const deleted: Record<string, number> = {};
    const r2Keys: string[] = [];

    // Helper: delete all rows from a table matching a companyId via index
    async function deleteByCompanyId(
      tableName: string,
      indexName: string,
      cid: string,
    ) {
      if (!deleted[tableName]) deleted[tableName] = 0;
      const rows = await (ctx.db as any)
        .query(tableName)
        .withIndex(indexName, (q: any) => q.eq("companyId", cid))
        .collect();
      for (const row of rows) {
        // Collect R2 keys from storyboard_files before deleting
        if (tableName === "storyboard_files" && row.r2Key) {
          r2Keys.push(row.r2Key);
        }
        await ctx.db.delete(row._id);
        deleted[tableName]++;
      }
    }

    // ── Delete from ALL tables for each companyId ────────────────────
    for (const cid of companyIds) {
      // Storyboard content
      await deleteByCompanyId("storyboard_files", "by_companyId", cid);
      await deleteByCompanyId("storyboard_elements", "by_companyId", cid);
      await deleteByCompanyId("storyboard_items", "by_companyId", cid);
      await deleteByCompanyId("storyboard_projects", "by_companyId", cid);

      // Credits & financial
      await deleteByCompanyId("credits_ledger", "by_companyId", cid);
      await deleteByCompanyId("credits_balance", "by_companyId", cid);
      await deleteByCompanyId("financial_ledger", "by_companyId", cid);
      await deleteByCompanyId("transactions", "by_companyId", cid);

      // Subscriptions & billing
      await deleteByCompanyId("org_subscriptions", "by_companyId", cid);
      await deleteByCompanyId("invoices", "by_companyId", cid);
      await deleteByCompanyId("subscription_transactions", "by_companyId", cid);
      await deleteByCompanyId("purchase_orders", "by_companyId", cid);

      // Settings & support
      await deleteByCompanyId("org_settings", "by_companyId", cid);
      await deleteByCompanyId("support_tickets", "by_companyId", cid);
      await deleteByCompanyId("customer_health_scores", "by_companyId", cid);

      // User activity & misc
      await deleteByCompanyId("user_activity_logs", "by_companyId", cid);

      // Prompt templates (uses "by_company" index name)
      await deleteByCompanyId("promptTemplates", "by_company", cid);

      // Contacts & SaaS customers (uses "by_company" index name)
      await deleteByCompanyId("contacts", "by_company", cid);
      await deleteByCompanyId("saas_customers", "by_company", cid);
    }

    // ── Delete the user's own record from the users table ────────────
    const userRow = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q: any) =>
        q.eq("clerkUserId", userId),
      )
      .first();
    if (userRow) {
      await ctx.db.delete(userRow._id);
      deleted.users = 1;
    }

    // ── Delete referral codes owned by this user ─────────────────────
    const referralRows = await ctx.db
      .query("referral_codes")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    deleted.referral_codes = 0;
    for (const row of referralRows) {
      await ctx.db.delete(row._id);
      deleted.referral_codes++;
    }

    return { companyIds, deleted, r2Keys };
  },
});

/**
 * Query: list all R2 keys across all workspaces owned by the caller.
 * Used by the nuclear-reset API route to delete R2 objects BEFORE
 * calling nuclearResetForTesting (which deletes the metadata rows).
 *
 * Finds companyIds from credits_balance (by creatorUserId) AND from
 * storyboard_projects (by ownerId) to catch orgs that might not have
 * a credits_balance row yet.
 */
export const listAllR2KeysForUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    if (!userId) return { r2Keys: [], companyIds: [] };

    const companyIds: string[] = [userId];

    // From credits_balance
    const ownedOrgRows = await ctx.db
      .query("credits_balance")
      .withIndex("by_creatorUserId", (q) => q.eq("creatorUserId", userId))
      .collect();
    for (const row of ownedOrgRows) {
      if (!companyIds.includes(row.companyId)) companyIds.push(row.companyId);
    }

    // Also from storyboard_projects (catch orgs without credits_balance)
    const ownedProjects = await ctx.db
      .query("storyboard_projects")
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();
    for (const proj of ownedProjects) {
      const cid = proj.companyId ?? proj.orgId;
      if (cid && !companyIds.includes(cid)) companyIds.push(cid);
    }

    const r2Keys: string[] = [];
    for (const cid of companyIds) {
      const files = await ctx.db
        .query("storyboard_files")
        .withIndex("by_companyId", (q) => q.eq("companyId", cid))
        .collect();
      for (const f of files) {
        if (f.r2Key) r2Keys.push(f.r2Key);
      }
    }

    return { r2Keys, companyIds };
  },
});

/**
 * Seed a test balance for the caller's own company. Useful for testing
 * deductCredits / transferCredits flows without having to buy credits.
 * Inserts an `admin_adjustment` ledger entry so the audit trail is clean.
 */
export const seedCreditsForTesting = mutation({
  args: {
    amount: v.number(),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const companyId =
      args.companyId ?? (identity.orgId as string) ?? identity.subject;

    if (companyId !== identity.subject) {
      const creator = await resolveCompanyCreator(ctx, companyId);
      if (creator !== identity.subject) {
        throw new Error("You are not the owner of this workspace");
      }
    }

    const now = Date.now();
    await ctx.db.insert("credits_ledger", {
      companyId,
      tokens: args.amount,
      type: "admin_adjustment",
      userId: identity.subject,
      reason: "testing_seed",
      createdAt: now,
    });

    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();

    if (balance) {
      await ctx.db.patch(balance._id, {
        balance: balance.balance + args.amount,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId,
        balance: args.amount,
        updatedAt: now,
      });
    }

    return { companyId, added: args.amount };
  },
});

// ─── Owner plan snapshot (for User Plan inheritance model) ──────────────

/**
 * Get the effective plan for a workspace (personal or org).
 *
 * In the all-user-plans model, Clerk's `has({ plan })` only checks the
 * current viewer's plan. But we want orgs to inherit their creator's
 * plan so that invited members see the correct team features.
 *
 * This query reads the `ownerPlan` snapshot from credits_balance:
 *   - For personal workspaces: returns the user's own plan (they ARE the owner)
 *   - For orgs: returns the creator's plan at the time the org was created,
 *     updated whenever the creator's subscription changes via webhook
 *
 * If no snapshot exists (e.g. legacy data), returns null — the caller
 * should fall back to the viewer's own Clerk has() check.
 */
export const getOwnerPlan = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    return {
      companyId: args.companyId,
      ownerPlan: row?.ownerPlan ?? null,
      creatorUserId: row?.creatorUserId ?? null,
    };
  },
});

/**
 * Write/update the owner snapshot for a single workspace.
 * Called by:
 *   - organization.created webhook → initial snapshot for a new org
 *   - user signup flow → snapshot for a personal workspace
 *   - admin tools → manual correction
 *
 * organizationName is set once at creation time and preserved for the
 * audit trail. Subsequent calls do NOT overwrite it unless explicitly
 * passed (so a rename in Clerk doesn't silently drop the original name).
 */
export const setOwnerPlan = mutation({
  args: {
    companyId: v.string(),
    creatorUserId: v.string(),
    ownerPlan: v.string(),
    organizationName: v.optional(v.string()),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    const now = Date.now();
    const existing = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    if (existing) {
      const patch: Record<string, unknown> = {
        ownerPlan: args.ownerPlan,
        creatorUserId: args.creatorUserId,
        updatedAt: now,
      };
      // Only set organizationName if caller passed it AND we don't
      // already have one (first-write wins for the audit trail)
      if (args.organizationName && !existing.organizationName) {
        patch.organizationName = args.organizationName;
      }
      await ctx.db.patch(existing._id, patch);
      return { existed: true, _id: existing._id };
    }

    // Create a fresh row with 0 balance + ownership metadata
    const _id = await ctx.db.insert("credits_balance", {
      companyId: args.companyId,
      balance: 0,
      updatedAt: now,
      ownerPlan: args.ownerPlan,
      creatorUserId: args.creatorUserId,
      organizationName: args.organizationName,
    });
    return { existed: false, _id };
  },
});

/**
 * List orgs whose subscription has been lapsed for at least N days
 * AND have NOT already been R2-purged. Used by the super-admin purge
 * flow to find eligible candidates.
 *
 * Filters:
 *   - companyId starts with "org_" (orgs only, not personal workspaces)
 *   - lapsedAt is defined (subscription was cancelled)
 *   - lapsedAt is older than `olderThanDays`
 *   - purgedAt is undefined (hasn't been R2-cleaned yet)
 *
 * Returns a list of { companyId, creatorUserId, ownerPlan, lapsedAt,
 * lapsedDays, balance }. Balance is informational — not cleared by purge.
 */
export const listLapsedOrgs = query({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const allLapsed = await ctx.db
      .query("credits_balance")
      .withIndex("by_lapsedAt")
      .filter((q) =>
        q.and(
          q.neq(q.field("lapsedAt"), undefined),
          q.lt(q.field("lapsedAt"), cutoff),
          q.eq(q.field("purgedAt"), undefined), // exclude already-purged
        ),
      )
      .collect();

    // Only return orgs (not personal workspaces)
    return allLapsed
      .filter((row) => row.companyId.startsWith("org_"))
      .map((row) => ({
        companyId: row.companyId,
        organizationName: row.organizationName ?? null,
        creatorUserId: row.creatorUserId,
        ownerPlan: row.ownerPlan,
        lapsedAt: row.lapsedAt,
        lapsedDays: row.lapsedAt
          ? Math.floor((Date.now() - row.lapsedAt) / (24 * 60 * 60 * 1000))
          : 0,
        balance: row.balance,
      }));
  },
});

/**
 * Super-admin mutation: soft-delete the R2 files for a lapsed org.
 *
 * Deliberately preserves ALL transaction data (credits_balance,
 * credits_ledger, storyboard_files rows, projects, items, elements).
 * Only touches:
 *   - storyboard_files: clears r2Key on every row for this companyId,
 *     marking them as "file deleted but metadata/audit record intact"
 *   - credits_balance: sets purgedAt timestamp
 *
 * Why this shape:
 *   - credits_ledger rows are the financial audit trail (tax / billing
 *     reconciliation). Cannot be deleted.
 *   - storyboard_files rows record credit usage per generation. Used
 *     for billing reconciliation and cost analysis. Cannot be deleted.
 *   - credits_balance rows are the running totals. Cannot be deleted.
 *   - Projects/items/elements may still be referenced by the ledger
 *     entries and files. Cannot be deleted.
 *
 * This is the industry-standard "soft delete" pattern used by
 * compliance-sensitive SaaS (anything with financial records).
 *
 * The API route handles R2 deletion separately (external to Convex)
 * and Clerk org deletion separately (external to Convex). This
 * mutation is the Convex-side bookkeeping after those external ops
 * have completed.
 */
export const completeCompanyPurge = mutation({
  args: {
    companyId: v.string(),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    const now = Date.now();

    // 1. Clear r2Key on all storyboard_files rows for this companyId.
    //    This marks each file as "R2 object deleted, metadata preserved."
    const fileRows = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();

    let filesCleared = 0;
    for (const row of fileRows) {
      if (row.r2Key !== undefined) {
        await ctx.db.patch(row._id, {
          r2Key: undefined,
        });
        filesCleared++;
      }
    }

    // 2. Mark the credits_balance row as purged. This is the signal
    //    to the UI that "this workspace's files are gone but the
    //    financial audit trail is intact."
    const balanceRow = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    if (balanceRow) {
      await ctx.db.patch(balanceRow._id, {
        purgedAt: now,
        updatedAt: now,
      });
    }

    return {
      companyId: args.companyId,
      filesCleared,
      totalFileRows: fileRows.length,
      balanceMarkedPurged: !!balanceRow,
      purgedAt: now,
    };
  },
});

/**
 * Fetch all R2 keys associated with a company. Called by the purge
 * flow BEFORE purgeCompanyData so the API route can delete the R2
 * objects before the metadata rows are gone.
 */
export const listCompanyR2Keys = query({
  args: {
    companyId: v.string(),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args._secret);
    const files = await ctx.db
      .query("storyboard_files")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .collect();
    return files
      .filter((f): f is typeof f & { r2Key: string } => typeof f.r2Key === "string" && !!f.r2Key)
      .map((f) => f.r2Key);
  },
});

/**
 * Propagate a plan change across all workspaces owned by a user.
 * Called by subscription.created / subscription.updated / subscription.deleted
 * webhooks when a user's plan changes. Updates the personal workspace AND
 * every org they created in a single mutation.
 *
 * Also manages the `lapsedAt` timestamp:
 *   - Downgrading to "free" → set lapsedAt = now (starts the 3-month clock)
 *   - Upgrading from "free" → clear lapsedAt (re-subscription unfreezes the org)
 */
export const propagateOwnerPlanChange = mutation({
  args: {
    ownerUserId: v.string(),
    newPlan: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find ALL workspaces this user owns:
    //   1. Rows where creatorUserId === ownerUserId (orgs they created)
    //   2. The row where companyId === ownerUserId (their personal workspace)
    //      This row might not have creatorUserId set (legacy data), so we
    //      look it up by companyId directly as a fallback.
    const byCreatorIndex = await ctx.db
      .query("credits_balance")
      .withIndex("by_creatorUserId", (q) =>
        q.eq("creatorUserId", args.ownerUserId),
      )
      .collect();

    const personalRow = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) =>
        q.eq("companyId", args.ownerUserId),
      )
      .first();

    // Merge: add personal row if not already in the creatorUserId results
    const allOwnedRows = [...byCreatorIndex];
    if (
      personalRow &&
      !allOwnedRows.some((r) => r._id === personalRow._id)
    ) {
      allOwnedRows.push(personalRow);
    }

    const downgradingToFree = args.newPlan === "free";
    let updated = 0;
    let previousPlan: string | null = null;

    for (const row of allOwnedRows) {
      const patch: Record<string, unknown> = {
        updatedAt: now,
      };

      // Capture the prior plan from the personal workspace row for the audit entry.
      if (row.companyId === args.ownerUserId) {
        previousPlan = row.ownerPlan ?? null;
      }

      if (row.ownerPlan !== args.newPlan) {
        patch.ownerPlan = args.newPlan;
      }

      // Backfill creatorUserId if missing (legacy personal workspace rows)
      if (!row.creatorUserId && row.companyId === args.ownerUserId) {
        patch.creatorUserId = args.ownerUserId;
      }

      // Track lapsed timestamp for ALL workspaces (personal and org).
      // Personal workspaces also need a lapsed signal so the UI can
      // show a "subscription ended" banner there too — they don't get
      // the file-purge treatment but the flag drives banner display.
      if (downgradingToFree && !row.lapsedAt) {
        patch.lapsedAt = now; // start the lapse clock
      } else if (!downgradingToFree && row.lapsedAt) {
        patch.lapsedAt = undefined; // clear on re-subscription
      }

      // Only patch if something actually changed
      if (Object.keys(patch).length > 1) {
        // (> 1 because updatedAt is always in the patch)
        await ctx.db.patch(row._id, patch);
        updated++;
      }
    }

    // ── Audit + cycling detection ──
    // Only log a ledger row if the plan actually changed. We anchor the
    // entry at the OWNER'S PERSONAL workspace so cycling detection has a
    // single deterministic location to count from (regardless of how
    // many orgs the user happens to own).
    let cyclingBlocked = false;
    if (previousPlan !== args.newPlan) {
      await ctx.db.insert("credits_ledger", {
        companyId: args.ownerUserId,
        tokens: 0,
        type: "subscription_change",
        userId: args.ownerUserId,
        reason: `Plan change: ${previousPlan ?? "unknown"} → ${args.newPlan}`,
        createdAt: now,
      });

      // Count subscription_change events in the last 30 days. If >= 5,
      // flag the owner as a cycler for 30 days — during the block window,
      // grantMonthlyCreditsIfDue caps the grant to zero.
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const recentChanges = await ctx.db
        .query("credits_ledger")
        .withIndex("by_company_type", (q) =>
          q
            .eq("companyId", args.ownerUserId)
            .eq("type", "subscription_change"),
        )
        .filter((q) => q.gt(q.field("createdAt"), thirtyDaysAgo))
        .collect();

      if (recentChanges.length >= 5) {
        cyclingBlocked = true;
        const blockUntil = now + 30 * 24 * 60 * 60 * 1000;
        // Apply the block to every workspace the owner controls so that
        // lazy auto-grants in any of them respect the same clock.
        for (const row of allOwnedRows) {
          await ctx.db.patch(row._id, {
            cyclingBlockedUntil: blockUntil,
            updatedAt: now,
          });
        }
      }

      // Eagerly run the monthly-grant helper on the personal workspace.
      // grantMonthlyCreditsIfDue handles both sides of the plan change:
      //   - downgrade/cancel  → claw back leftover + grant new (free=100)
      //   - upgrade           → additive new grant, no clawback
      //   - cycling-blocked   → grant skipped; clawback deferred (pre-existing)
      // Running this here (instead of waiting for next deductCredits) makes
      // the clawback visible at the moment of cancellation — matches the
      // published policy in docs/billing-policy.md §2.3.
      if (personalRow) {
        await grantMonthlyCreditsIfDue(ctx, {
          companyId: personalRow.companyId,
          plan: args.newPlan,
          userId: args.ownerUserId,
          now,
        });
      }
    }

    return {
      ownerUserId: args.ownerUserId,
      newPlan: args.newPlan,
      totalOwned: allOwnedRows.length,
      updated,
      cyclingBlocked,
    };
  },
});

/**
 * List all workspaces owned by the current user, with balances.
 * Used by the Transfer Credits dialog instead of Clerk's
 * useOrganizationList (which has cache/timing issues).
 *
 * Returns personal workspace + all orgs where creatorUserId === caller.
 */
export const listOwnedWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const workspaces: {
      id: string;
      name: string;
      kind: "personal" | "org";
      balance: number;
    }[] = [];

    // Personal workspace
    const personal = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", userId))
      .first();
    if (personal) {
      workspaces.push({
        id: personal.companyId,
        name: personal.organizationName ?? "Personal Workspace",
        kind: "personal",
        balance: personal.balance,
      });
    }

    // Owned orgs
    const orgs = await ctx.db
      .query("credits_balance")
      .withIndex("by_creatorUserId", (q) => q.eq("creatorUserId", userId))
      .collect();
    for (const org of orgs) {
      if (org.companyId !== userId) {
        workspaces.push({
          id: org.companyId,
          name: org.organizationName ?? org.companyId.slice(0, 16) + "…",
          kind: "org",
          balance: org.balance,
        });
      }
    }

    return workspaces;
  },
});

// ─── Readers ──────────────────────────────────────────────────────────────

export const getBalance = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    await requireWorkspaceAccess(ctx, companyId);
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();

    return balance?.balance ?? 0;
  },
});

export const getCompanyBalance = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    await requireWorkspaceAccess(ctx, companyId);
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();

    return {
      balance: balance?.balance ?? 0,
    };
  },
});

export const getLedger = query({
  args: {
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceAccess(ctx, args.companyId);
    const limit = args.limit || 100;
    const ledger = await ctx.db
      .query("credits_ledger")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
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
    await requireWorkspaceAccess(ctx, args.companyId);
    const purchases = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "purchase"),
      )
      .order("desc")
      .take(50);

    return purchases;
  },
});

/**
 * Transfer history for a specific org (both outgoing and incoming).
 * Each entry includes `counterpartCompanyId` so the UI can look up
 * the other org's name from Clerk.
 */
export const listTransferHistory = query({
  args: {
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceAccess(ctx, args.companyId);
    const limit = args.limit ?? 50;
    const transfersOut = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "transfer_out"),
      )
      .order("desc")
      .take(limit);

    const transfersIn = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", args.companyId).eq("type", "transfer_in"),
      )
      .order("desc")
      .take(limit);

    return [...transfersOut, ...transfersIn]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/**
 * Usage summary for UsageDashboard. Replaces the former
 * storyboard/creditUsage.getOrgSummary.
 */
export const getOrgUsageSummary = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    await requireWorkspaceAccess(ctx, companyId);
    const all = await ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q) =>
        q.eq("companyId", companyId).eq("type", "usage"),
      )
      .collect();

    // tokens are negative for usage — we want absolute credits used
    const total = all.reduce((s, r) => s + Math.abs(r.tokens), 0);
    const byUser: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const byModel: Record<string, number> = {};

    for (const r of all) {
      const credits = Math.abs(r.tokens);
      if (r.userId) {
        byUser[r.userId] = (byUser[r.userId] ?? 0) + credits;
      }
      if (r.action) {
        byAction[r.action] = (byAction[r.action] ?? 0) + credits;
      }
      if (r.model) {
        byModel[r.model] = (byModel[r.model] ?? 0) + credits;
      }
    }

    return { total, byUser, byAction, byModel, count: all.length };
  },
});

/**
 * Recent usage entries for UsageDashboard. Replaces the former
 * storyboard/creditUsage.listByOrg.
 */
export const listOrgUsage = query({
  args: { companyId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { companyId, limit }) => {
    await requireWorkspaceAccess(ctx, companyId);
    const q = ctx.db
      .query("credits_ledger")
      .withIndex("by_company_type", (q2) =>
        q2.eq("companyId", companyId).eq("type", "usage"),
      )
      .order("desc");
    return limit ? await q.take(limit) : await q.collect();
  },
});
