import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Default referral settings
const DEFAULT_REFERRAL_REWARD = 50; // Credits for referrer
const DEFAULT_REFERRAL_BONUS = 10; // Credits for new user

// ============================================
// Generate Referral Code for User
// ============================================
export const generateReferralCode = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already has a referral code
    const existing = await ctx.db
      .query("referral_codes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return { success: true, code: existing.code, existing: true };
    }

    // Get user info for code generation
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.userId))
      .first();

    // Generate unique code
    const username = user?.username || user?.firstName || "USER";
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${username.substring(0, 6).toUpperCase()}${randomPart}`;

    // Check uniqueness
    const codeExists = await ctx.db
      .query("referral_codes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (codeExists) {
      // Retry with different random part
      const newRandomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCode = `${username.substring(0, 6).toUpperCase()}${newRandomPart}`;
      
      await ctx.db.insert("referral_codes", {
        userId: args.userId,
        code: newCode,
        createdAt: Date.now(),
        isActive: true,
        totalReferrals: 0,
        totalCreditsEarned: 0,
      });

      return { success: true, code: newCode, existing: false };
    }

    await ctx.db.insert("referral_codes", {
      userId: args.userId,
      code,
      createdAt: Date.now(),
      isActive: true,
      totalReferrals: 0,
      totalCreditsEarned: 0,
    });

    return { success: true, code, existing: false };
  },
});

// ============================================
// Get User's Referral Code
// ============================================
export const getReferralCode = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const referralCode = await ctx.db
      .query("referral_codes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return referralCode;
  },
});

// ============================================
// Validate Referral Code
// ============================================
export const validateReferralCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const referralCode = await ctx.db
      .query("referral_codes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!referralCode) {
      return { valid: false, error: "Invalid referral code" };
    }

    if (!referralCode.isActive) {
      return { valid: false, error: "Referral code is inactive" };
    }

    // Get referrer info
    const referrer = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", referralCode.userId))
      .first();

    return {
      valid: true,
      code: referralCode.code,
      referrerId: referralCode.userId,
      referrerName: referrer?.fullName || "Unknown User",
    };
  },
});

// ============================================
// Track Referral (Called when new user signs up with code)
// ============================================
export const trackReferral = mutation({
  args: {
    referralCode: v.string(),
    newUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate referral code
    const refCode = await ctx.db
      .query("referral_codes")
      .withIndex("by_code", (q) => q.eq("code", args.referralCode.toUpperCase()))
      .first();

    if (!refCode || !refCode.isActive) {
      return { success: false, error: "Invalid or inactive referral code" };
    }

    // Check if user already used a referral code
    const existingReferral = await ctx.db
      .query("referrals")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", args.newUserId))
      .first();

    if (existingReferral) {
      return { success: false, error: "User already referred" };
    }

    // Prevent self-referral
    if (refCode.userId === args.newUserId) {
      return { success: false, error: "Cannot refer yourself" };
    }

    // Get referral settings
    const settings = await ctx.db
      .query("org_settings")
      .first();

    const rewardAmount = settings?.referralRewardCredits ?? DEFAULT_REFERRAL_REWARD;
    const bonusAmount = settings?.referralBonusCredits ?? DEFAULT_REFERRAL_BONUS;

    // Create referral record
    await ctx.db.insert("referrals", {
      referralCode: args.referralCode.toUpperCase(),
      referrerId: refCode.userId,
      referredUserId: args.newUserId,
      referredAt: Date.now(),
      status: "pending",
      rewardAmount,
      bonusAmount,
    });

    return { success: true, message: "Referral tracked successfully" };
  },
});

// ============================================
// Complete Referral & Award Credits
// ============================================
export const completeReferral = mutation({
  args: {
    referredUserId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🔍 completeReferral called for user:", args.referredUserId);
    
    // Find pending referral
    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", args.referredUserId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!referral) {
      console.log("❌ No pending referral found for user:", args.referredUserId);
      return { success: false, error: "No pending referral found" };
    }

    console.log("✅ Found pending referral:", {
      referrerId: referral.referrerId,
      referredUserId: referral.referredUserId,
      rewardAmount: referral.rewardAmount,
      bonusAmount: referral.bonusAmount,
    });

    const now = Date.now();

    // Award credits to referrer
    console.log("💰 Awarding", referral.rewardAmount, "credits to referrer:", referral.referrerId);
    await ctx.db.insert("credits_ledger", {
      companyId: referral.referrerId,
      tokens: referral.rewardAmount,
      reason: `Referral reward for referring user`,
      createdAt: now,
    });
    
    // Update referrer's balance
    const referrerBalance = await ctx.db
      .query("credits_balance")
      .withIndex("by_companyId", (q) => q.eq("companyId", referral.referrerId))
      .first();
    
    if (referrerBalance) {
      await ctx.db.patch(referrerBalance._id, {
        balance: referrerBalance.balance + referral.rewardAmount,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("credits_balance", {
        companyId: referral.referrerId,
        balance: referral.rewardAmount,
        updatedAt: now,
      });
    }
    console.log("✅ Referrer balance updated");

    // Award bonus to referred user (if configured)
    if (referral.bonusAmount && referral.bonusAmount > 0) {
      console.log("🎁 Awarding", referral.bonusAmount, "bonus credits to new user:", referral.referredUserId);
      await ctx.db.insert("credits_ledger", {
        companyId: referral.referredUserId,
        tokens: referral.bonusAmount,
        reason: `Welcome bonus for using referral code`,
        createdAt: now,
      });
      
      // Update new user's balance
      const newUserBalance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", referral.referredUserId))
        .first();
      
      if (newUserBalance) {
        await ctx.db.patch(newUserBalance._id, {
          balance: newUserBalance.balance + referral.bonusAmount,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("credits_balance", {
          companyId: referral.referredUserId,
          balance: referral.bonusAmount,
          updatedAt: now,
        });
      }
      console.log("✅ New user balance updated");
    } else {
      console.log("⚠️ No bonus amount configured or bonus is 0");
    }

    // Update referral status
    await ctx.db.patch(referral._id, {
      status: "rewarded",
      rewardedAt: now,
    });
    console.log("✅ Referral status updated to 'rewarded'");

    // Update referral code stats
    const refCode = await ctx.db
      .query("referral_codes")
      .withIndex("by_code", (q) => q.eq("code", referral.referralCode))
      .first();

    if (refCode) {
      await ctx.db.patch(refCode._id, {
        totalReferrals: refCode.totalReferrals + 1,
        totalCreditsEarned: refCode.totalCreditsEarned + referral.rewardAmount,
      });
      console.log("✅ Referral code stats updated");
    }

    console.log("🎉 Referral completed successfully!");
    return {
      success: true,
      rewardAmount: referral.rewardAmount,
      bonusAmount: referral.bonusAmount,
    };
  },
});

// ============================================
// Get Referral Statistics for User
// ============================================
export const getReferralStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const refCode = await ctx.db
      .query("referral_codes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!refCode) {
      return {
        hasCode: false,
        totalReferrals: 0,
        totalCreditsEarned: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
      };
    }

    const allReferrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", args.userId))
      .collect();

    const pendingCount = allReferrals.filter((r) => r.status === "pending").length;
    const completedCount = allReferrals.filter((r) => r.status === "rewarded").length;

    return {
      hasCode: true,
      code: refCode.code,
      totalReferrals: refCode.totalReferrals,
      totalCreditsEarned: refCode.totalCreditsEarned,
      pendingReferrals: pendingCount,
      completedReferrals: completedCount,
      referrals: allReferrals,
    };
  },
});

// ============================================
// Get Referral Leaderboard
// ============================================
export const getReferralLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const allCodes = await ctx.db
      .query("referral_codes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Sort by total referrals
    const sorted = allCodes.sort((a, b) => b.totalReferrals - a.totalReferrals);
    const top = sorted.slice(0, limit);

    // Enrich with user data
    const enriched = await Promise.all(
      top.map(async (code, index) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", code.userId))
          .first();

        return {
          rank: index + 1,
          userId: code.userId,
          userName: user?.fullName || "Unknown User",
          userEmail: user?.email,
          totalReferrals: code.totalReferrals,
          totalCreditsEarned: code.totalCreditsEarned,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// Get User's Referral Rank
// ============================================
export const getUserReferralRank = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userCode = await ctx.db
      .query("referral_codes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCode) {
      return { rank: null, totalUsers: 0 };
    }

    const allCodes = await ctx.db
      .query("referral_codes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const sorted = allCodes.sort((a, b) => b.totalReferrals - a.totalReferrals);
    const rank = sorted.findIndex((c) => c.userId === args.userId) + 1;

    return {
      rank,
      totalUsers: sorted.length,
      totalReferrals: userCode.totalReferrals,
      totalCreditsEarned: userCode.totalCreditsEarned,
    };
  },
});

// ============================================
// Get Referral Settings (Admin)
// ============================================
export const getReferralSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("org_settings").first();

    return {
      enabled: settings?.referralEnabled ?? true,
      rewardCredits: settings?.referralRewardCredits ?? DEFAULT_REFERRAL_REWARD,
      bonusCredits: settings?.referralBonusCredits ?? DEFAULT_REFERRAL_BONUS,
    };
  },
});

// ============================================
// Update Referral Settings (Admin)
// ============================================
export const updateReferralSettings = mutation({
  args: {
    enabled: v.optional(v.boolean()),
    rewardCredits: v.optional(v.number()),
    bonusCredits: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("org_settings").first();

    if (!settings) {
      return { success: false, error: "Organization settings not found" };
    }

    await ctx.db.patch(settings._id, {
      referralEnabled: args.enabled !== undefined ? args.enabled : settings.referralEnabled,
      referralRewardCredits: args.rewardCredits !== undefined ? args.rewardCredits : settings.referralRewardCredits,
      referralBonusCredits: args.bonusCredits !== undefined ? args.bonusCredits : settings.referralBonusCredits,
    });

    return { success: true, message: "Referral settings updated" };
  },
});
