import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Search users by email (for admin testing/deletion)
 */
export const searchByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    if (!email || email.length < 3) {
      return [];
    }

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("deletionTime"), undefined))
      .collect();

    // Filter by email containing the search term (case-insensitive)
    const filtered = users.filter((user) =>
      user.email?.toLowerCase().includes(email.toLowerCase())
    );

    return filtered.slice(0, 10).map((user) => ({
      _id: user._id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
    }));
  },
});

/**
 * Delete a user from Convex (admin only)
 * This marks the user as deleted AND removes all related data
 */
export const deleteUserFromConvex = mutation({
  args: {
    userId: v.id("users"),
    superAdminEmail: v.string(),
  },
  handler: async (ctx, { userId, superAdminEmail }) => {
    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Protect super admin from deletion
    if (user.email === superAdminEmail) {
      throw new Error("Cannot delete super admin user");
    }

    const clerkUserId = user.clerkUserId;

    // Delete all related data for this user
    const deletedRecords = {
      emailLogs: 0,
      notifications: 0,
    };

    // 1. Delete email logs sent to this user
    if (user.email) {
      const emailLogs = await ctx.db
        .query("email_logs")
        .filter((q) => q.eq(q.field("sentTo"), user.email))
        .collect();
      for (const log of emailLogs) {
        await ctx.db.delete(log._id);
        deletedRecords.emailLogs++;
      }
    }

    // 2. Delete admin notifications for this user
    if (clerkUserId) {
      const notifications = await ctx.db
        .query("admin_notifications")
        .filter((q) => q.eq(q.field("userId"), clerkUserId))
        .collect();
      for (const notification of notifications) {
        await ctx.db.delete(notification._id);
        deletedRecords.notifications++;
      }
    }

    // 3. Finally, delete the user record itself
    await ctx.db.delete(userId);

    return {
      success: true,
      deletedUser: {
        email: user.email,
        fullName: user.fullName,
      },
      deletedRecords,
    };
  },
});
