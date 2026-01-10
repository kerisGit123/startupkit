import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createAdminUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("billing_admin"),
      v.literal("support_admin")
    ),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) {
      throw new Error("Admin user already exists");
    }

    const adminId = await ctx.db.insert("admin_users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      role: args.role,
      isActive: true,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });

    return adminId;
  },
});

export const updateAdminRole = mutation({
  args: {
    clerkUserId: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("billing_admin"),
      v.literal("support_admin")
    ),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!admin) {
      throw new Error("Admin user not found");
    }

    await ctx.db.patch(admin._id, {
      role: args.role,
    });
  },
});

export const deactivateAdmin = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!admin) {
      throw new Error("Admin user not found");
    }

    await ctx.db.patch(admin._id, {
      isActive: false,
    });
  },
});

export const updateLastLogin = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (admin) {
      await ctx.db.patch(admin._id, {
        lastLoginAt: Date.now(),
      });
    }
  },
});

export const getAdminByClerkId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admin_users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    return admin;
  },
});

export const getAllAdmins = query({
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("admin_users")
      .order("desc")
      .collect();

    return admins;
  },
});

export const getActiveAdmins = query({
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("admin_users")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    return admins;
  },
});

export const getAdminsByRole = query({
  args: {
    role: v.union(
      v.literal("super_admin"),
      v.literal("billing_admin"),
      v.literal("support_admin")
    ),
  },
  handler: async (ctx, args) => {
    const admins = await ctx.db
      .query("admin_users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();

    return admins;
  },
});
