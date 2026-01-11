import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Get Users Active Today
// ============================================
export const getUsersActiveToday = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const users = await ctx.db
      .query("users")
      .withIndex("by_lastLoginAt")
      .filter((q) => q.gte(q.field("lastLoginAt"), startTimestamp))
      .take(limit);

    return {
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        clerkUserId: u.clerkUserId,
        email: u.email || "No email",
        fullName: u.fullName || "Unknown User",
        imageUrl: u.imageUrl,
        lastLoginAt: u.lastLoginAt,
        userLabel: u.userLabel,
        isBlocked: u.isBlocked,
      })),
    };
  },
});

// ============================================
// Get Daily Active Users (DAU) for Date Range
// ============================================
export const getDailyActiveUsers = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_timestamp")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), args.startDate),
          q.lte(q.field("timestamp"), args.endDate)
        )
      )
      .collect();

    // Group by date and count unique users
    const dailyUsers: Record<string, Set<string>> = {};

    activities.forEach((activity) => {
      const date = new Date(activity.timestamp).toISOString().split("T")[0];
      if (!dailyUsers[date]) {
        dailyUsers[date] = new Set();
      }
      dailyUsers[date].add(activity.userId);
    });

    // Convert to array format
    const result = Object.entries(dailyUsers).map(([date, users]) => ({
      date,
      count: users.size,
      timestamp: new Date(date).getTime(),
    }));

    return result.sort((a, b) => a.timestamp - b.timestamp);
  },
});

// ============================================
// Get Activity by Hour (for charts)
// ============================================
export const getActivityByHour = query({
  args: {
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const targetDate = args.date || Date.now();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const activities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_timestamp")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), startOfDay.getTime()),
          q.lte(q.field("timestamp"), endOfDay.getTime())
        )
      )
      .collect();

    // Group by hour
    const hourlyActivity: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyActivity[i] = 0;
    }

    activities.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    return Object.entries(hourlyActivity).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      label: `${hour.padStart(2, "0")}:00`,
    }));
  },
});

// ============================================
// Get Login History with Details
// ============================================
export const getLoginHistory = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.string()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const loginQuery = ctx.db
      .query("user_activity_logs")
      .withIndex("by_activityType", (q) => q.eq("activityType", "login"))
      .order("desc");

    const logins = await loginQuery.take(limit + 1);

    // Filter by userId if provided
    const filteredLogins = args.userId
      ? logins.filter((l) => l.userId === args.userId)
      : logins;

    // Enrich with user data
    const enrichedLogins = await Promise.all(
      filteredLogins.map(async (login) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", login.userId))
          .first();

        return {
          ...login,
          user: user
            ? {
                fullName: user.fullName,
                email: user.email,
                imageUrl: user.imageUrl,
                userLabel: user.userLabel,
              }
            : null,
        };
      })
    );

    const hasMore = enrichedLogins.length > limit;
    const results = hasMore ? enrichedLogins.slice(0, limit) : enrichedLogins;
    const nextCursor = hasMore ? results[results.length - 1].timestamp : null;

    return {
      logins: results,
      hasMore,
      nextCursor,
    };
  },
});

// ============================================
// Get Today's Activity Summary
// ============================================
export const getTodayActivitySummary = query({
  handler: async (ctx) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const activities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), startTimestamp))
      .collect();

    // Count unique users
    const uniqueUsers = new Set(activities.map((a) => a.userId));

    // Count by activity type
    const byType: Record<string, number> = {};
    activities.forEach((activity) => {
      byType[activity.activityType] = (byType[activity.activityType] || 0) + 1;
    });

    return {
      activeUsers: uniqueUsers.size,
      totalActivities: activities.length,
      byType,
      logins: byType.login || 0,
      apiCalls: byType.api_call || 0,
      featureUsage: byType.feature_usage || 0,
      pageViews: byType.page_view || 0,
    };
  },
});

// ============================================
// Get Top Active Users
// ============================================
export const getTopActiveUsers = query({
  args: {
    limit: v.optional(v.number()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const days = args.days || 7;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const activities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), cutoffTime))
      .collect();

    // Count activities per user
    const userActivityCount: Record<string, number> = {};
    activities.forEach((activity) => {
      userActivityCount[activity.userId] =
        (userActivityCount[activity.userId] || 0) + 1;
    });

    // Sort and get top users
    const topUserIds = Object.entries(userActivityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([userId, count]) => ({ userId, count }));

    // Enrich with user data
    const topUsers = await Promise.all(
      topUserIds.map(async ({ userId, count }) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", userId))
          .first();

        return {
          userId,
          activityCount: count,
          user: user
            ? {
                fullName: user.fullName,
                email: user.email,
                imageUrl: user.imageUrl,
                userLabel: user.userLabel,
                lastLoginAt: user.lastLoginAt,
              }
            : null,
        };
      })
    );

    return topUsers;
  },
});

// ============================================
// Get Retention Metrics
// ============================================
export const getRetentionMetrics = query({
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allUsers = await ctx.db.query("users").collect();

    // Calculate metrics
    const totalUsers = allUsers.length;
    const activeLastDay = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= oneDayAgo
    ).length;
    const activeLastWeek = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= sevenDaysAgo
    ).length;
    const activeLastMonth = allUsers.filter(
      (u) => u.lastLoginAt && u.lastLoginAt >= thirtyDaysAgo
    ).length;

    // New users in last 30 days
    const newUsers = allUsers.filter(
      (u) => u.createdAt && u.createdAt >= thirtyDaysAgo
    ).length;

    // Returning users (logged in before 30 days ago and again in last 30 days)
    const returningUsers = allUsers.filter(
      (u) =>
        u.createdAt &&
        u.createdAt < thirtyDaysAgo &&
        u.lastLoginAt &&
        u.lastLoginAt >= thirtyDaysAgo
    ).length;

    // Inactive users (not logged in for 30+ days)
    const inactiveUsers = allUsers.filter(
      (u) => !u.lastLoginAt || u.lastLoginAt < thirtyDaysAgo
    ).length;

    return {
      totalUsers,
      activeLastDay,
      activeLastWeek,
      activeLastMonth,
      newUsers,
      returningUsers,
      inactiveUsers,
      retentionRate:
        totalUsers > 0 ? ((activeLastMonth / totalUsers) * 100).toFixed(2) : "0",
      churnRate:
        totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(2) : "0",
    };
  },
});

// ============================================
// Get Activity Comparison (Current vs Previous Period)
// ============================================
export const getActivityComparison = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const now = Date.now();
    const currentPeriodStart = now - days * 24 * 60 * 60 * 1000;
    const previousPeriodStart = currentPeriodStart - days * 24 * 60 * 60 * 1000;

    // Get current period activities
    const currentActivities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), currentPeriodStart))
      .collect();

    // Get previous period activities
    const previousActivities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_timestamp")
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), previousPeriodStart),
          q.lt(q.field("timestamp"), currentPeriodStart)
        )
      )
      .collect();

    const currentUniqueUsers = new Set(currentActivities.map((a) => a.userId))
      .size;
    const previousUniqueUsers = new Set(previousActivities.map((a) => a.userId))
      .size;

    const currentTotal = currentActivities.length;
    const previousTotal = previousActivities.length;

    const userGrowth =
      previousUniqueUsers > 0
        ? (((currentUniqueUsers - previousUniqueUsers) / previousUniqueUsers) *
            100).toFixed(2)
        : "0";

    const activityGrowth =
      previousTotal > 0
        ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(2)
        : "0";

    return {
      current: {
        users: currentUniqueUsers,
        activities: currentTotal,
      },
      previous: {
        users: previousUniqueUsers,
        activities: previousTotal,
      },
      growth: {
        users: userGrowth,
        activities: activityGrowth,
      },
    };
  },
});

// ============================================
// Delete Activity Logs (Cleanup)
// ============================================
export const deleteActivityLogs = mutation({
  args: {
    olderThanDays: v.optional(v.number()),
    deleteAll: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.deleteAll) {
      // Delete all activity logs
      const allLogs = await ctx.db.query("user_activity_logs").collect();
      
      for (const log of allLogs) {
        await ctx.db.delete(log._id);
      }
      
      return { success: true, deleted: allLogs.length, message: "All activity logs deleted" };
    }
    
    if (args.olderThanDays) {
      const cutoffTime = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;
      
      const oldLogs = await ctx.db
        .query("user_activity_logs")
        .withIndex("by_timestamp")
        .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
        .collect();
      
      for (const log of oldLogs) {
        await ctx.db.delete(log._id);
      }
      
      return { 
        success: true, 
        deleted: oldLogs.length, 
        message: `Deleted ${oldLogs.length} logs older than ${args.olderThanDays} days` 
      };
    }
    
    return { success: false, error: "No deletion criteria specified" };
  },
});
