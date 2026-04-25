import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * AI Director chat session storage.
 * One session per user per project. History persists across studio visits.
 */

// Get or create a director chat session for a project
export const getOrCreateSession = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    userId: v.string(),
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find existing session for this user + project
    const existing = await ctx.db
      .query("director_chat_sessions")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId)
      )
      .first();

    if (existing) return existing._id;

    // Create new session
    return await ctx.db.insert("director_chat_sessions", {
      projectId: args.projectId,
      userId: args.userId,
      companyId: args.companyId,
      messages: [],
      messageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get session with messages
export const getSession = query({
  args: {
    projectId: v.id("storyboard_projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("director_chat_sessions")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId)
      )
      .first();
  },
});

// Append a message pair (user + assistant) to session
export const appendMessages = mutation({
  args: {
    sessionId: v.id("director_chat_sessions"),
    userMessage: v.string(),
    assistantMessage: v.string(),
    toolCalls: v.optional(
      v.array(
        v.object({
          name: v.string(),
          input: v.optional(v.any()),
          output: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    const now = Date.now();
    const messages = [...session.messages];

    messages.push({
      role: "user" as const,
      content: args.userMessage,
      timestamp: now,
    });

    messages.push({
      role: "assistant" as const,
      content: args.assistantMessage,
      timestamp: now,
      ...(args.toolCalls && { toolCalls: args.toolCalls }),
    });

    // Keep last 50 messages to prevent unbounded growth
    const trimmed = messages.slice(-50);

    await ctx.db.patch(session._id, {
      messages: trimmed,
      messageCount: session.messageCount + 2,
      updatedAt: now,
    });
  },
});

// Clear session history (start fresh)
export const clearSession = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("director_chat_sessions")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId)
      )
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        messages: [],
        messageCount: 0,
        updatedAt: Date.now(),
      });
    }
  },
});
