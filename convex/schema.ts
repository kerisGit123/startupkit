import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // CORE: User Management
  // ============================================
  users: defineTable({
    clerkUserId: v.optional(v.string()),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    deletionTime: v.optional(v.number()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"]),

  // ============================================
  // CORE: Organization Settings (Tenant Config)
  // ============================================
  org_settings: defineTable({
    companyId: v.string(),
    subjectType: v.union(v.literal("organization"), v.literal("user")),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    companyLogoId: v.optional(v.id("_storage")),
    aiEnabled: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // CORE: Subscription Management
  // ============================================
  org_subscriptions: defineTable({
    companyId: v.string(),
    plan: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_subscription", ["stripeSubscriptionId"]),

  // ============================================
  // CORE: Subscription Audit Log
  // ============================================
  subscription_transactions: defineTable({
    companyId: v.string(),
    action: v.string(),
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    source: v.optional(v.string()),
    eventType: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // CORE: Credits System (One-time Purchases)
  // ============================================
  credits_ledger: defineTable({
    companyId: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    amountPaid: v.optional(v.number()),
    currency: v.optional(v.string()),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  credits_balance: defineTable({
    companyId: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  }).index("by_companyId", ["companyId"]),
});
