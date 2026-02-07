import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertFromClerk = mutation({
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
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const fields = {
      clerkUserId: args.clerkUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      fullName: args.fullName,
      imageUrl: args.imageUrl,
      username: args.username,
      updatedAt: now,
      deletionTime: undefined as number | undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    const id = await ctx.db.insert("users", {
      ...fields,
      createdAt: now,
    });
    return id;
  },
});

export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    return user;
  },
});

export const deleteFromClerk = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!existing) return null;

    await ctx.db.patch(existing._id, { deletionTime: now, updatedAt: now });
    return existing._id;
  },
});
