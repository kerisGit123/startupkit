import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// SERVER-ONLY TOOL BACKINGS
// ============================================
// These functions are called exclusively by the support-chat API route on
// the Next.js server (app/api/support/chat/route.ts). They accept userId /
// companyId as explicit args rather than relying on ctx.auth, because the
// server forwards no Clerk token to Convex. Each call must include the
// SUPPORT_INTERNAL_SECRET to block direct client invocation.
// ============================================

function assertSecret(secret: string) {
  const expected = process.env.SUPPORT_INTERNAL_SECRET;
  if (!expected) {
    throw new Error("SUPPORT_INTERNAL_SECRET is not configured");
  }
  if (secret !== expected) {
    throw new Error("Invalid support tool secret");
  }
}

// ============================================
// PROFILE
// ============================================
export const getUserProfile = query({
  args: {
    secret: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (!user) return null;
    return {
      email: user.email ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      fullName: user.fullName ?? null,
      isBlocked: user.isBlocked ?? false,
      createdAt: user.createdAt ?? null,
    };
  },
});

// ============================================
// SUBSCRIPTION
// ============================================
export const getActiveSubscription = query({
  args: {
    secret: v.string(),
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);

    // Primary source: credits_balance.ownerPlan (set by Clerk webhook)
    // This is the source of truth for the effective plan in both
    // personal workspaces and orgs.
    const balance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    // Fallback: check org_subscriptions (legacy Stripe-managed plans)
    const sub = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    const plan = balance?.ownerPlan ?? sub?.plan ?? null;
    if (!plan) return null;

    return {
      plan,
      status: sub?.status ?? (plan === "free" ? "free" : "active"),
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    };
  },
});

// ============================================
// CREDITS
// ============================================
export const getCreditBalance = query({
  args: {
    secret: v.string(),
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const row = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    return { balance: row?.balance ?? 0 };
  },
});

export const listCreditTransactions = query({
  args: {
    secret: v.string(),
    companyId: v.string(),
    limit: v.optional(v.number()),
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const limit = args.limit ?? 50;

    if (args.sinceMs) {
      // Use compound index for efficient date-range query
      const rows = await ctx.db
        .query("credits_ledger")
        .withIndex("by_companyId_createdAt", (q) =>
          q.eq("companyId", args.companyId).gte("createdAt", args.sinceMs!)
        )
        .order("desc")
        .take(limit);
      return rows.map((r) => ({
        type: r.type,
        tokens: r.tokens,
        reason: r.reason ?? null,
        amountPaid: r.amountPaid ?? null,
        createdAt: r.createdAt,
      }));
    }

    const rows = await ctx.db
      .query("credits_ledger")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(limit);
    return rows.map((r) => ({
      type: r.type,
      tokens: r.tokens,
      reason: r.reason ?? null,
      amountPaid: r.amountPaid ?? null,
      createdAt: r.createdAt,
    }));
  },
});

// ============================================
// GENERATIONS
// ============================================
export const listRecentGenerations = query({
  args: {
    secret: v.string(),
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const items = await ctx.db
      .query("storyboard_items")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(args.limit ?? 10);
    return items.map((i) => ({
      itemId: i._id,
      projectId: i.projectId,
      title: i.title,
      generationStatus: i.generationStatus,
      imageGeneration: i.imageGeneration
        ? {
            model: i.imageGeneration.model,
            status: i.imageGeneration.status,
            creditsUsed: i.imageGeneration.creditsUsed,
          }
        : null,
      videoGeneration: i.videoGeneration
        ? {
            model: i.videoGeneration.model,
            status: i.videoGeneration.status,
            creditsUsed: i.videoGeneration.creditsUsed,
            duration: i.videoGeneration.duration,
            quality: i.videoGeneration.quality,
          }
        : null,
      hasImage: Boolean(i.imageUrl),
      hasVideo: Boolean(i.videoUrl),
      updatedAt: i.updatedAt,
    }));
  },
});

export const getGenerationDetails = query({
  args: {
    secret: v.string(),
    companyId: v.string(),
    itemId: v.id("storyboard_items"),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;
    if (item.companyId !== args.companyId) return null;
    return {
      title: item.title,
      description: item.description ?? null,
      generationStatus: item.generationStatus,
      imageGeneration: item.imageGeneration ?? null,
      videoGeneration: item.videoGeneration ?? null,
      hasImage: Boolean(item.imageUrl),
      hasVideo: Boolean(item.videoUrl),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  },
});

// ============================================
// INVOICES
// ============================================
export const listInvoices = query({
  args: {
    secret: v.string(),
    companyId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const rows = await ctx.db
      .query("invoices")
      .filter((q) => q.eq(q.field("companyId"), args.companyId))
      .order("desc")
      .take(args.limit ?? 5);
    return rows.map((r) => ({
      invoiceNo: r.invoiceNo,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      invoiceType: r.invoiceType,
      createdAt: r._creationTime,
    }));
  },
});

// ============================================
// SUPPORT TICKETS
// ============================================
export const listMyTickets = query({
  args: {
    secret: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);
    const rows = await ctx.db
      .query("support_tickets")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 10);
    return rows.map((r) => ({
      ticketNumber: r.ticketNumber,
      subject: r.subject,
      category: r.category,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },
});

export const createSupportTicketForUser = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    companyId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    subject: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("billing"),
      v.literal("plans"),
      v.literal("usage"),
      v.literal("general"),
      v.literal("credit"),
      v.literal("technical"),
      v.literal("invoice"),
      v.literal("service"),
      v.literal("other")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, args) => {
    assertSecret(args.secret);

    const ticketCount = await ctx.db.query("support_tickets").collect();
    const ticketNumber = `TKT-${String(ticketCount.length + 1).padStart(6, "0")}`;
    const now = Date.now();

    const ticketId = await ctx.db.insert("support_tickets", {
      ticketNumber,
      companyId: args.companyId,
      userId: args.userId,
      userEmail: args.userEmail,
      subject: args.subject,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: "open",
      slaBreached: false,
      createdAt: now,
      updatedAt: now,
    });

    let inboxPriority: "low" | "normal" | "high";
    if (args.priority === "urgent" || args.priority === "high") {
      inboxPriority = "high";
    } else if (args.priority === "low") {
      inboxPriority = "low";
    } else {
      inboxPriority = "normal";
    }

    await ctx.db.insert("inbox_messages", {
      threadId: ticketNumber,
      channel: "ticket",
      direction: "inbound",
      subject: `[${ticketNumber}] ${args.subject}`,
      body: args.description,
      status: "unread",
      priority: inboxPriority,
      tags: [args.category, args.priority, "support-bot"],
      sentAt: now,
      createdAt: now,
      updatedAt: now,
      metadata: {
        ticketId,
        ticketNumber,
        category: args.category,
        originalPriority: args.priority,
        userEmail: args.userEmail,
        userName: args.userName,
        slaBreached: false,
        source: "support_chatbot",
      },
    });

    return { ticketId, ticketNumber };
  },
});
