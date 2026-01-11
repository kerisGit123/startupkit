import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Sync User Data from Clerk
// ============================================
export const syncUserFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const now = Date.now();

    if (!user) {
      // Create new user with Clerk data
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
      });
      
      return { success: true, userId, created: true };
    }

    // Update existing user with Clerk data
    await ctx.db.patch(user._id, {
      email: args.email || user.email,
      firstName: args.firstName || user.firstName,
      lastName: args.lastName || user.lastName,
      fullName: args.fullName || user.fullName,
      imageUrl: args.imageUrl || user.imageUrl,
      username: args.username || user.username,
      updatedAt: now,
    });

    return { success: true, userId: user._id, created: false };
  },
});
