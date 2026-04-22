import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const toolCallValidator = v.object({
  toolName: v.string(),
  toolUseId: v.string(),
  input: v.string(),
  output: v.optional(v.string()),
  isError: v.optional(v.boolean()),
});

export const createSession = mutation({
  args: {
    userId: v.optional(v.string()),
    orgId: v.optional(v.string()),
    variant: v.union(v.literal("landing"), v.literal("studio")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("support_chat_sessions", {
      userId: args.userId,
      orgId: args.orgId,
      variant: args.variant,
      messageCount: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      createdAt: now,
      lastMessageAt: now,
    });
  },
});

export const appendMessage = mutation({
  args: {
    sessionId: v.id("support_chat_sessions"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("tool")
    ),
    content: v.string(),
    toolCalls: v.optional(v.array(toolCallValidator)),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();

    const messageId = await ctx.db.insert("support_chat_messages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      createdAt: now,
    });

    const titleUpdate =
      !session.title && args.role === "user" && args.content.trim().length > 0
        ? { title: args.content.trim().slice(0, 80) }
        : {};

    await ctx.db.patch(args.sessionId, {
      ...titleUpdate,
      messageCount: session.messageCount + 1,
      totalTokensIn: session.totalTokensIn + (args.tokensIn ?? 0),
      totalTokensOut: session.totalTokensOut + (args.tokensOut ?? 0),
      lastMessageAt: now,
    });

    return messageId;
  },
});

export const listMySessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const sessions = await ctx.db
      .query("support_chat_sessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 20);

    return sessions.map((s) => ({
      _id: s._id,
      title: s.title ?? "New conversation",
      variant: s.variant,
      messageCount: s.messageCount,
      createdAt: s.createdAt,
      lastMessageAt: s.lastMessageAt,
    }));
  },
});

export const getSessionMessages = query({
  args: { sessionId: v.id("support_chat_sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (session.userId !== identity.subject) return null;

    const messages = await ctx.db
      .query("support_chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      session: {
        _id: session._id,
        title: session.title ?? "New conversation",
        variant: session.variant,
        createdAt: session.createdAt,
      },
      messages: messages.map((m) => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls ?? [],
        createdAt: m.createdAt,
      })),
    };
  },
});

export const checkAndIncrementRateLimit = mutation({
  args: {
    key: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const windowStart = Math.floor(now / hourMs) * hourMs;

    const existing = await ctx.db
      .query("support_chat_rate_limits")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!existing) {
      await ctx.db.insert("support_chat_rate_limits", {
        key: args.key,
        count: 1,
        windowStart,
      });
      return { allowed: true, remaining: args.limit - 1, resetAt: windowStart + hourMs };
    }

    if (existing.windowStart !== windowStart) {
      await ctx.db.patch(existing._id, { count: 1, windowStart });
      return { allowed: true, remaining: args.limit - 1, resetAt: windowStart + hourMs };
    }

    if (existing.count >= args.limit) {
      return { allowed: false, remaining: 0, resetAt: windowStart + hourMs };
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return {
      allowed: true,
      remaining: args.limit - existing.count - 1,
      resetAt: windowStart + hourMs,
    };
  },
});

export const getSessionForServer = query({
  args: { sessionId: v.id("support_chat_sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const messages = await ctx.db
      .query("support_chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      session,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls ?? [],
      })),
    };
  },
});

// ============================================
// ADMIN REPORTING
// ============================================
// Haiku 4.5 pricing (USD per 1M tokens). Conservative — ignores prompt-cache
// reads (which are cheaper) since we don't store cache-hit breakdown yet.
const HAIKU_INPUT_PER_1M = 1.0;
const HAIKU_OUTPUT_PER_1M = 5.0;

async function assertSuperAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
  db: { query: (table: string) => { withIndex: (...a: unknown[]) => { first: () => Promise<unknown> } } };
}) {
  const identity = (await ctx.auth.getUserIdentity()) as
    | ({ subject: string; public_metadata?: { role?: string } } & Record<string, unknown>)
    | null;
  if (!identity) throw new Error("Unauthenticated");

  const roleFromJwt = identity.public_metadata?.role;
  if (roleFromJwt === "super_admin") return;

  const adminRow = (await (ctx.db as any)
    .query("admin_users")
    .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", identity.subject))
    .first()) as { role?: string; isActive?: boolean } | null;

  if (adminRow && adminRow.role === "super_admin" && adminRow.isActive) return;

  throw new Error("Forbidden — super_admin role required");
}

function estimateCost(tokensIn: number, tokensOut: number): number {
  return (
    (tokensIn / 1_000_000) * HAIKU_INPUT_PER_1M +
    (tokensOut / 1_000_000) * HAIKU_OUTPUT_PER_1M
  );
}

export const adminGetStats = query({
  args: { sinceMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx as any);

    const since = args.sinceMs ?? 0;
    const sessions = await ctx.db
      .query("support_chat_sessions")
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    let totalMessages = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let landingCount = 0;
    let studioCount = 0;
    let anonCount = 0;
    const userSet = new Set<string>();

    for (const s of sessions) {
      totalMessages += s.messageCount;
      totalTokensIn += s.totalTokensIn;
      totalTokensOut += s.totalTokensOut;
      if (s.variant === "landing") landingCount += 1;
      else if (s.variant === "studio") studioCount += 1;
      if (s.userId) userSet.add(s.userId);
      else anonCount += 1;
    }

    const totalSessions = sessions.length;
    const estCost = estimateCost(totalTokensIn, totalTokensOut);

    return {
      totalSessions,
      totalMessages,
      totalTokensIn,
      totalTokensOut,
      estCostUsd: estCost,
      uniqueUsers: userSet.size,
      anonSessions: anonCount,
      landingSessions: landingCount,
      studioSessions: studioCount,
      avgMessagesPerSession:
        totalSessions > 0 ? totalMessages / totalSessions : 0,
      haikuInputPer1M: HAIKU_INPUT_PER_1M,
      haikuOutputPer1M: HAIKU_OUTPUT_PER_1M,
    };
  },
});

export const adminListSessions = query({
  args: {
    sinceMs: v.optional(v.number()),
    variant: v.optional(v.union(v.literal("landing"), v.literal("studio"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx as any);

    const since = args.sinceMs ?? 0;
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);

    let sessions = await ctx.db
      .query("support_chat_sessions")
      .filter((q) => q.gte(q.field("createdAt"), since))
      .order("desc")
      .take(limit * 2); // over-fetch so filter below still returns ~limit rows

    if (args.variant) {
      sessions = sessions.filter((s) => s.variant === args.variant);
    }
    sessions = sessions.slice(0, limit);

    const enriched = await Promise.all(
      sessions.map(async (s) => {
        let userEmail: string | null = null;
        let userName: string | null = null;
        if (s.userId) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", s.userId!))
            .first();
          if (user) {
            userEmail = user.email ?? null;
            userName = user.fullName ?? user.firstName ?? null;
          }
        }
        return {
          _id: s._id,
          userId: s.userId ?? null,
          userEmail,
          userName,
          orgId: s.orgId ?? null,
          variant: s.variant,
          title: s.title ?? null,
          messageCount: s.messageCount,
          tokensIn: s.totalTokensIn,
          tokensOut: s.totalTokensOut,
          estCostUsd: estimateCost(s.totalTokensIn, s.totalTokensOut),
          createdAt: s.createdAt,
          lastMessageAt: s.lastMessageAt,
        };
      })
    );

    return enriched;
  },
});

export const adminGetSessionDetail = query({
  args: { sessionId: v.id("support_chat_sessions") },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx as any);

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    let userEmail: string | null = null;
    let userName: string | null = null;
    if (session.userId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", session.userId!))
        .first();
      if (user) {
        userEmail = user.email ?? null;
        userName = user.fullName ?? user.firstName ?? null;
      }
    }

    const messages = await ctx.db
      .query("support_chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      session: {
        _id: session._id,
        userId: session.userId ?? null,
        userEmail,
        userName,
        orgId: session.orgId ?? null,
        variant: session.variant,
        title: session.title ?? null,
        messageCount: session.messageCount,
        tokensIn: session.totalTokensIn,
        tokensOut: session.totalTokensOut,
        estCostUsd: estimateCost(session.totalTokensIn, session.totalTokensOut),
        createdAt: session.createdAt,
        lastMessageAt: session.lastMessageAt,
      },
      messages: messages.map((m) => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls ?? [],
        tokensIn: m.tokensIn ?? null,
        tokensOut: m.tokensOut ?? null,
        createdAt: m.createdAt,
      })),
    };
  },
});

// ============================================
// ADMIN CLEANUP
// ============================================
// Per-mutation cap — Convex mutations have execution-time limits. If there are
// more items to delete than the cap, the admin re-runs the cleanup.
const CLEANUP_BATCH_CAP = 500;

export const adminCountStaleSessions = query({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx as any);

    const cutoff = Date.now() - args.olderThanMs;
    const stale = await ctx.db
      .query("support_chat_sessions")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    let messageCount = 0;
    for (const s of stale) {
      messageCount += s.messageCount;
    }

    return {
      sessionCount: stale.length,
      messageCount,
      cutoffDate: new Date(cutoff).toISOString(),
    };
  },
});

export const adminCleanupStaleSessions = mutation({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx as any);

    const cutoff = Date.now() - args.olderThanMs;
    const stale = await ctx.db
      .query("support_chat_sessions")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(CLEANUP_BATCH_CAP);

    let deletedSessions = 0;
    let deletedMessages = 0;

    for (const session of stale) {
      // Delete all messages for this session
      const messages = await ctx.db
        .query("support_chat_messages")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const m of messages) {
        await ctx.db.delete(m._id);
        deletedMessages += 1;
      }
      await ctx.db.delete(session._id);
      deletedSessions += 1;
    }

    // Check if more remain
    const nextStale = await ctx.db
      .query("support_chat_sessions")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(1);

    return {
      deletedSessions,
      deletedMessages,
      hasMore: nextStale.length > 0,
    };
  },
});
