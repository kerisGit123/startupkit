import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Update User Label (Admin Function)
// ============================================
export const updateUserLabel = mutation({
  args: {
    userId: v.id("users"),
    userLabel: v.optional(v.string()),
    userTags: v.optional(v.array(v.string())),
    adminNotes: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const updateData: Record<string, string | string[] | number | undefined> = {
      updatedAt: Date.now(),
    };

    if (args.userLabel !== undefined) updateData.userLabel = args.userLabel;
    if (args.userTags !== undefined) updateData.userTags = args.userTags;
    if (args.adminNotes !== undefined) updateData.adminNotes = args.adminNotes;

    await ctx.db.patch(args.userId, updateData);

    return { success: true };
  },
});

// ============================================
// Block/Unblock User (Admin Function)
// ============================================
export const toggleUserBlock = mutation({
  args: {
    userId: v.id("users"),
    isBlocked: v.boolean(),
    reason: v.optional(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      isBlocked: args.isBlocked,
      adminNotes: args.reason 
        ? `${user.adminNotes || ""}\n[${new Date().toISOString()}] ${args.isBlocked ? "Blocked" : "Unblocked"}: ${args.reason}`
        : user.adminNotes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// Get Users by Label (Admin Query)
// ============================================
export const getUsersByLabel = query({
  args: {
    userLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_userLabel", (q) => q.eq("userLabel", args.userLabel))
      .collect();

    return users;
  },
});

// ============================================
// Get All User Labels (Admin Query)
// ============================================
export const getAllUserLabels = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const labels = new Set<string>();
    users.forEach((user) => {
      if (user.userLabel) {
        labels.add(user.userLabel);
      }
    });

    return Array.from(labels).sort();
  },
});

// ============================================
// Get Blocked Users (Admin Query)
// ============================================
export const getBlockedUsers = query({
  handler: async (ctx) => {
    const blockedUsers = await ctx.db
      .query("users")
      .withIndex("by_isBlocked", (q) => q.eq("isBlocked", true))
      .collect();

    return blockedUsers;
  },
});

// ============================================
// Search Users (Admin Query)
// ============================================
export const searchUsers = query({
  args: {
    searchTerm: v.optional(v.string()),
    userLabel: v.optional(v.string()),
    isBlocked: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").collect();

    // Filter by search term (email, name, username)
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(term) ||
          u.fullName?.toLowerCase().includes(term) ||
          u.username?.toLowerCase().includes(term)
      );
    }

    // Filter by label
    if (args.userLabel) {
      users = users.filter((u) => u.userLabel === args.userLabel);
    }

    // Filter by blocked status
    if (args.isBlocked !== undefined) {
      users = users.filter((u) => u.isBlocked === args.isBlocked);
    }

    // Limit results
    const limit = args.limit || 100;
    return users.slice(0, limit);
  },
});

// ============================================
// Get User Details with Activity (Admin Query)
// ============================================
export const getUserDetailsWithActivity = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    // Get org settings
    const orgSettings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    // Get subscription
    const subscription = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    // Get recent activity (last 10 activities)
    const recentActivity = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkUserId))
      .order("desc")
      .take(10);

    // Get credits balance
    const credits = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.clerkUserId))
      .first();

    return {
      user,
      orgSettings,
      subscription,
      recentActivity,
      credits: credits?.balance || 0,
    };
  },
});

// ============================================
// Bulk Update User Labels (Admin Function)
// ============================================
export const bulkUpdateUserLabels = mutation({
  args: {
    userIds: v.array(v.id("users")),
    userLabel: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = [];

    for (const userId of args.userIds) {
      try {
        await ctx.db.patch(userId, {
          userLabel: args.userLabel,
          updatedAt: now,
        });
        results.push({ userId, success: true });
      } catch (error) {
        results.push({ 
          userId, 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    return {
      total: args.userIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

// ============================================
// Add User Tags (Admin Function)
// ============================================
export const addUserTags = mutation({
  args: {
    userId: v.id("users"),
    tags: v.array(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const existingTags = user.userTags || [];
    const newTags = [...new Set([...existingTags, ...args.tags])];

    await ctx.db.patch(args.userId, {
      userTags: newTags,
      updatedAt: Date.now(),
    });

    return { success: true, tags: newTags };
  },
});

// ============================================
// Remove User Tags (Admin Function)
// ============================================
export const removeUserTags = mutation({
  args: {
    userId: v.id("users"),
    tags: v.array(v.string()),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const existingTags = user.userTags || [];
    const newTags = existingTags.filter((tag) => !args.tags.includes(tag));

    await ctx.db.patch(args.userId, {
      userTags: newTags,
      updatedAt: Date.now(),
    });

    return { success: true, tags: newTags };
  },
});

// ============================================
// Get User Statistics (Admin Query)
// ============================================
export const getUserStatistics = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const stats = {
      total: users.length,
      blocked: users.filter((u) => u.isBlocked).length,
      activeLastMonth: users.filter(
        (u) => u.lastLoginAt && u.lastLoginAt >= thirtyDaysAgo
      ).length,
      activeLastWeek: users.filter(
        (u) => u.lastLoginAt && u.lastLoginAt >= sevenDaysAgo
      ).length,
      withLabels: users.filter((u) => u.userLabel).length,
      withTags: users.filter((u) => u.userTags && u.userTags.length > 0).length,
      byLabel: {} as Record<string, number>,
    };

    // Count users by label
    users.forEach((user) => {
      if (user.userLabel) {
        stats.byLabel[user.userLabel] = (stats.byLabel[user.userLabel] || 0) + 1;
      }
    });

    return stats;
  },
});
