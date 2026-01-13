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
 * This marks the user as deleted but doesn't remove from Clerk
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

    const now = Date.now();

    // Mark user as deleted
    await ctx.db.patch(userId, {
      deletionTime: now,
      updatedAt: now,
    });

    return {
      success: true,
      deletedUser: {
        email: user.email,
        fullName: user.fullName,
      },
    };
  },
});
