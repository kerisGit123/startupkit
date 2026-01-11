import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Log User Activity (for MAU tracking)
// ============================================
export const logActivity = mutation({
  args: {
    userId: v.string(),
    companyId: v.string(),
    activityType: v.union(
      v.literal("login"),
      v.literal("api_call"),
      v.literal("feature_usage"),
      v.literal("page_view"),
      v.literal("action")
    ),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Log the activity
    await ctx.db.insert("user_activity_logs", {
      userId: args.userId,
      companyId: args.companyId,
      activityType: args.activityType,
      timestamp,
      metadata: args.metadata,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    // Update user's last activity timestamp
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.userId))
      .first();

    if (user) {
      const updates: Record<string, number> = {
        lastActivityAt: timestamp,
        updatedAt: timestamp,
      };

      // If it's a login, update lastLoginAt and increment loginCount
      if (args.activityType === "login") {
        updates.lastLoginAt = timestamp;
        updates.loginCount = (user.loginCount || 0) + 1;
      }

      await ctx.db.patch(user._id, updates);
    }

    return { success: true, timestamp };
  },
});

// ============================================
// Track User Login
// ============================================
export const trackLogin = mutation({
  args: {
    clerkUserId: v.string(),
    companyId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const now = Date.now();

    // If user doesn't exist, create user record with Clerk data
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkUserId: args.clerkUserId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        fullName: args.fullName,
        imageUrl: args.imageUrl,
        username: args.username,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        lastActivityAt: now,
        loginCount: 1,
      });
      
      user = await ctx.db.get(userId);
      if (!user) {
        return { success: false, error: "Failed to create user" };
      }
    } else {
      // Update existing user with login timestamps and Clerk data
      await ctx.db.patch(user._id, {
        email: args.email || user.email,
        firstName: args.firstName || user.firstName,
        lastName: args.lastName || user.lastName,
        fullName: args.fullName || user.fullName,
        imageUrl: args.imageUrl || user.imageUrl,
        username: args.username || user.username,
        lastLoginAt: now,
        lastActivityAt: now,
        loginCount: (user.loginCount || 0) + 1,
        updatedAt: now,
      });
    }

    // Check if IP or Country is blocked (only if enabled in production)
    const enableIpBlocking = process.env.ENABLE_IP_BLOCKING === 'true';
    
    if (enableIpBlocking && args.ipAddress && args.ipAddress !== 'client-side' && args.ipAddress !== 'unknown') {
      const ipAddress = args.ipAddress;
      
      // Check IP blacklist
      const ipBlocked = await ctx.db
        .query("ip_blacklist")
        .withIndex("by_ipAddress", (q) => q.eq("ipAddress", ipAddress))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (ipBlocked) {
        // Check if expired
        if (!ipBlocked.expiresAt || ipBlocked.expiresAt > now) {
          return { 
            success: false, 
            blocked: true, 
            reason: ipBlocked.reason || "Your IP address has been blocked",
            timestamp: now 
          };
        }
      }
    }

    // Log the login activity
    await ctx.db.insert("user_activity_logs", {
      userId: args.clerkUserId,
      companyId: args.companyId,
      activityType: "login",
      timestamp: now,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return { success: true, timestamp: now };
  },
});

// ============================================
// Get Monthly Active Users (MAU)
// ============================================
export const getMonthlyActiveUsers = query({
  args: {
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack || 30;
    const cutoffTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const activeUsers = await ctx.db
      .query("users")
      .withIndex("by_lastLoginAt")
      .filter((q) => q.gte(q.field("lastLoginAt"), cutoffTime))
      .collect();

    return {
      count: activeUsers.length,
      users: activeUsers.map((u) => ({
        id: u._id,
        clerkUserId: u.clerkUserId,
        email: u.email,
        fullName: u.fullName,
        lastLoginAt: u.lastLoginAt,
        lastActivityAt: u.lastActivityAt,
        loginCount: u.loginCount,
      })),
    };
  },
});

// ============================================
// Get User Activity History
// ============================================
export const getUserActivityHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const activities = await ctx.db
      .query("user_activity_logs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return activities;
  },
});

// ============================================
// Get Activity Stats by Type
// ============================================
export const getActivityStatsByType = query({
  args: {
    companyId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let activities;

    if (args.companyId) {
      const companyId = args.companyId;
      activities = await ctx.db
        .query("user_activity_logs")
        .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
        .collect();
    } else {
      activities = await ctx.db
        .query("user_activity_logs")
        .collect();
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      activities = activities.filter((a) => {
        if (args.startDate && a.timestamp < args.startDate) return false;
        if (args.endDate && a.timestamp > args.endDate) return false;
        return true;
      });
    }

    // Group by activity type
    const stats: Record<string, number> = {};
    activities.forEach((activity) => {
      stats[activity.activityType] = (stats[activity.activityType] || 0) + 1;
    });

    return {
      total: activities.length,
      byType: stats,
    };
  },
});

// ============================================
// Update API Call Tracking
// ============================================
export const trackApiCall = mutation({
  args: {
    companyId: v.string(),
    userId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update org_settings with API call tracking
    const settings = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    if (settings) {
      await ctx.db.patch(settings._id, {
        lastApiCallAt: now,
        totalApiCall: (settings.totalApiCall || 0) + 1,
        lastActivityCheck: now,
        updatedAt: now,
        updatedBy: args.userId,
      });
    }

    // Log the API call activity
    await ctx.db.insert("user_activity_logs", {
      userId: args.userId,
      companyId: args.companyId,
      activityType: "api_call",
      timestamp: now,
      metadata: args.metadata,
    });

    return { success: true };
  },
});
