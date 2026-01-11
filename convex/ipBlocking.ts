import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Super admin emails that cannot be blocked
const SUPER_ADMIN_EMAILS = ["shangwey123@gmail.com"];

// ============================================
// Add IP to Blacklist
// ============================================
export const addIpToBlacklist = mutation({
  args: {
    ipAddress: v.string(),
    reason: v.optional(v.string()),
    blockedBy: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if this IP belongs to a super admin
    const superAdminUser = await ctx.db
      .query("users")
      .filter((q) => {
        const emailMatch = SUPER_ADMIN_EMAILS.some(email => 
          q.eq(q.field("email"), email)
        );
        return emailMatch;
      })
      .first();

    if (superAdminUser) {
      // Get super admin's recent login to check IP
      const recentLogin = await ctx.db
        .query("user_activity_logs")
        .withIndex("by_userId", (q) => q.eq("userId", superAdminUser.clerkUserId!))
        .filter((q) => q.eq(q.field("activityType"), "login"))
        .order("desc")
        .first();

      if (recentLogin && recentLogin.ipAddress === args.ipAddress) {
        return { 
          success: false, 
          error: "Cannot block super admin IP address. This IP belongs to a system administrator." 
        };
      }
    }

    // Check if IP already exists
    const existing = await ctx.db
      .query("ip_blacklist")
      .withIndex("by_ipAddress", (q) => q.eq("ipAddress", args.ipAddress))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      return { success: false, error: "IP address already blacklisted" };
    }

    const now = Date.now();
    const id = await ctx.db.insert("ip_blacklist", {
      ipAddress: args.ipAddress,
      reason: args.reason,
      blockedBy: args.blockedBy,
      blockedAt: now,
      expiresAt: args.expiresAt,
      isActive: true,
    });

    return { success: true, id, message: `IP ${args.ipAddress} added to blacklist` };
  },
});

// ============================================
// Remove IP from Blacklist
// ============================================
export const removeIpFromBlacklist = mutation({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("ip_blacklist")
      .withIndex("by_ipAddress", (q) => q.eq("ipAddress", args.ipAddress))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!entry) {
      return { success: false, error: "IP address not found in blacklist" };
    }

    await ctx.db.patch(entry._id, { isActive: false });

    return { success: true, message: `IP ${args.ipAddress} removed from blacklist` };
  },
});

// ============================================
// Add Country to Blacklist
// ============================================
export const addCountryToBlacklist = mutation({
  args: {
    countryCode: v.string(),
    countryName: v.string(),
    reason: v.optional(v.string()),
    blockedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if country already exists
    const existing = await ctx.db
      .query("country_blacklist")
      .withIndex("by_countryCode", (q) => q.eq("countryCode", args.countryCode))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      return { success: false, error: "Country already blacklisted" };
    }

    const now = Date.now();
    const id = await ctx.db.insert("country_blacklist", {
      countryCode: args.countryCode.toUpperCase(),
      countryName: args.countryName,
      reason: args.reason,
      blockedBy: args.blockedBy,
      blockedAt: now,
      isActive: true,
    });

    return { success: true, id, message: `Country ${args.countryName} added to blacklist` };
  },
});

// ============================================
// Remove Country from Blacklist
// ============================================
export const removeCountryFromBlacklist = mutation({
  args: {
    countryCode: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("country_blacklist")
      .withIndex("by_countryCode", (q) => q.eq("countryCode", args.countryCode.toUpperCase()))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!entry) {
      return { success: false, error: "Country not found in blacklist" };
    }

    await ctx.db.patch(entry._id, { isActive: false });

    return { success: true, message: `Country ${args.countryCode} removed from blacklist` };
  },
});

// ============================================
// Check if IP is Blocked
// ============================================
export const checkIpBlocked = query({
  args: {
    ipAddress: v.string(),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Never block super admins
    if (args.userEmail && SUPER_ADMIN_EMAILS.includes(args.userEmail)) {
      return { blocked: false, superAdmin: true };
    }

    const now = Date.now();
    
    const entry = await ctx.db
      .query("ip_blacklist")
      .withIndex("by_ipAddress", (q) => q.eq("ipAddress", args.ipAddress))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!entry) {
      return { blocked: false };
    }

    // Check if expired (but don't modify in query)
    if (entry.expiresAt && entry.expiresAt < now) {
      return { blocked: false, expired: true };
    }

    return {
      blocked: true,
      reason: entry.reason,
      blockedAt: entry.blockedAt,
      expiresAt: entry.expiresAt,
    };
  },
});

// ============================================
// Check if Country is Blocked
// ============================================
export const checkCountryBlocked = query({
  args: {
    countryCode: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("country_blacklist")
      .withIndex("by_countryCode", (q) => q.eq("countryCode", args.countryCode.toUpperCase()))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!entry) {
      return { blocked: false };
    }

    return {
      blocked: true,
      countryName: entry.countryName,
      reason: entry.reason,
      blockedAt: entry.blockedAt,
    };
  },
});

// ============================================
// Get All Blacklisted IPs
// ============================================
export const getBlacklistedIps = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const includeInactive = args.includeInactive || false;

    const entries = includeInactive
      ? await ctx.db.query("ip_blacklist").collect()
      : await ctx.db
          .query("ip_blacklist")
          .withIndex("by_isActive", (q) => q.eq("isActive", true))
          .collect();

    return entries.map((entry) => ({
      id: entry._id,
      ipAddress: entry.ipAddress,
      reason: entry.reason,
      blockedBy: entry.blockedBy,
      blockedAt: entry.blockedAt,
      expiresAt: entry.expiresAt,
      isActive: entry.isActive,
    }));
  },
});

// ============================================
// Get All Blacklisted Countries
// ============================================
export const getBlacklistedCountries = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const includeInactive = args.includeInactive || false;

    const entries = includeInactive
      ? await ctx.db.query("country_blacklist").collect()
      : await ctx.db
          .query("country_blacklist")
          .withIndex("by_isActive", (q) => q.eq("isActive", true))
          .collect();

    return entries.map((entry) => ({
      id: entry._id,
      countryCode: entry.countryCode,
      countryName: entry.countryName,
      reason: entry.reason,
      blockedBy: entry.blockedBy,
      blockedAt: entry.blockedAt,
      isActive: entry.isActive,
    }));
  },
});

// ============================================
// Get Blocking Statistics
// ============================================
export const getBlockingStats = query({
  handler: async (ctx) => {
    const activeIps = await ctx.db
      .query("ip_blacklist")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const activeCountries = await ctx.db
      .query("country_blacklist")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const totalIps = await ctx.db.query("ip_blacklist").collect();
    const totalCountries = await ctx.db.query("country_blacklist").collect();

    return {
      activeIpCount: activeIps.length,
      activeCountryCount: activeCountries.length,
      totalIpCount: totalIps.length,
      totalCountryCount: totalCountries.length,
    };
  },
});
