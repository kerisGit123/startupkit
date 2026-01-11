import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Create Alert
// ============================================
export const createAlert = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("success"), v.literal("error")),
    targetType: v.union(v.literal("all"), v.literal("specific_user"), v.literal("role"), v.literal("label")),
    targetValue: v.optional(v.string()),
    createdBy: v.string(),
    expiresAt: v.optional(v.number()),
    isDismissible: v.boolean(),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const alertId = await ctx.db.insert("alerts", {
      title: args.title,
      message: args.message,
      type: args.type,
      targetType: args.targetType,
      targetValue: args.targetValue,
      createdBy: args.createdBy,
      createdAt: now,
      expiresAt: args.expiresAt,
      isDismissible: args.isDismissible,
      isActive: true,
      priority: args.priority || 0,
    });

    return { success: true, alertId };
  },
});

// ============================================
// Get Active Alerts for User
// ============================================
export const getActiveAlertsForUser = query({
  args: {
    userId: v.string(),
    userRole: v.optional(v.string()),
    userLabels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all active alerts
    const allAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Filter alerts for this user
    const relevantAlerts = allAlerts.filter((alert) => {
      // Check if expired
      if (alert.expiresAt && alert.expiresAt < now) {
        return false;
      }

      // Check target type
      if (alert.targetType === "all") {
        return true;
      }

      if (alert.targetType === "specific_user" && alert.targetValue === args.userId) {
        return true;
      }

      if (alert.targetType === "role" && alert.targetValue === args.userRole) {
        return true;
      }

      if (alert.targetType === "label" && args.userLabels?.includes(alert.targetValue || "")) {
        return true;
      }

      return false;
    });

    // Get dismissed alerts for this user
    const dismissals = await ctx.db
      .query("alert_dismissals")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const dismissedAlertIds = new Set(dismissals.map((d) => d.alertId));

    // Filter out dismissed alerts
    const visibleAlerts = relevantAlerts.filter((alert) => {
      if (!alert.isDismissible) return true; // Non-dismissible always show
      return !dismissedAlertIds.has(alert._id);
    });

    // Sort by priority (higher first) then by creation date (newer first)
    return visibleAlerts.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt;
    });
  },
});

// ============================================
// Dismiss Alert
// ============================================
export const dismissAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already dismissed
    const existing = await ctx.db
      .query("alert_dismissals")
      .withIndex("by_alert_user", (q) => q.eq("alertId", args.alertId).eq("userId", args.userId))
      .first();

    if (existing) {
      return { success: true, message: "Already dismissed" };
    }

    await ctx.db.insert("alert_dismissals", {
      alertId: args.alertId,
      userId: args.userId,
      dismissedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// Get All Alerts (Admin)
// ============================================
export const getAllAlerts = query({
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    // Enrich with creator info and dismissal count
    const enriched = await Promise.all(
      alerts.map(async (alert) => {
        const creator = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", alert.createdBy))
          .first();

        const dismissals = await ctx.db
          .query("alert_dismissals")
          .withIndex("by_alertId", (q) => q.eq("alertId", alert._id))
          .collect();

        return {
          ...alert,
          creatorName: creator?.fullName || "Unknown",
          dismissalCount: dismissals.length,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// Update Alert
// ============================================
export const updateAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
    type: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("success"), v.literal("error"))),
    expiresAt: v.optional(v.number()),
    isDismissible: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { alertId, ...updates } = args;

    await ctx.db.patch(alertId, updates);

    return { success: true };
  },
});

// ============================================
// Delete Alert
// ============================================
export const deleteAlert = mutation({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, args) => {
    // Delete alert
    await ctx.db.delete(args.alertId);

    // Delete all dismissals
    const dismissals = await ctx.db
      .query("alert_dismissals")
      .withIndex("by_alertId", (q) => q.eq("alertId", args.alertId))
      .collect();

    for (const dismissal of dismissals) {
      await ctx.db.delete(dismissal._id);
    }

    return { success: true };
  },
});

// ============================================
// Get Alert Statistics
// ============================================
export const getAlertStats = query({
  handler: async (ctx) => {
    const allAlerts = await ctx.db.query("alerts").collect();
    const activeAlerts = allAlerts.filter((a) => a.isActive);
    const now = Date.now();
    const expiredAlerts = allAlerts.filter((a) => a.expiresAt && a.expiresAt < now);

    const allDismissals = await ctx.db.query("alert_dismissals").collect();

    return {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      expiredAlerts: expiredAlerts.length,
      totalDismissals: allDismissals.length,
    };
  },
});
