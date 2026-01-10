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

  // ============================================
  // ADMIN: Admin Users
  // ============================================
  admin_users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("billing_admin"),
      v.literal("support_admin")
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    createdBy: v.string(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_role", ["role"])
    .index("by_isActive", ["isActive"]),

  // ============================================
  // ADMIN: Activity Logs
  // ============================================
  admin_activity_logs: defineTable({
    adminUserId: v.string(),
    adminEmail: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_adminUserId", ["adminUserId"])
    .index("by_action", ["action"])
    .index("by_targetType", ["targetType"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // ADMIN: Support Tickets
  // ============================================
  support_tickets: defineTable({
    ticketNumber: v.string(),
    companyId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    subject: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("billing"),
      v.literal("technical"),
      v.literal("dispute"),
      v.literal("general")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedTo: v.optional(v.string()),
    stripeDisputeId: v.optional(v.string()),
    relatedSubscriptionId: v.optional(v.string()),
    relatedPaymentId: v.optional(v.string()),
    firstResponseAt: v.optional(v.number()),
    slaBreached: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_ticketNumber", ["ticketNumber"])
    .index("by_companyId", ["companyId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_priority", ["priority"])
    .index("by_slaBreached", ["slaBreached"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // ADMIN: Ticket Messages
  // ============================================
  ticket_messages: defineTable({
    ticketId: v.id("support_tickets"),
    senderId: v.string(),
    senderType: v.union(v.literal("customer"), v.literal("admin")),
    senderName: v.string(),
    message: v.string(),
    isInternal: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_ticketId", ["ticketId"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // ADMIN: Notifications
  // ============================================
  admin_notifications: defineTable({
    type: v.union(
      v.literal("new_ticket"),
      v.literal("dispute"),
      v.literal("payment_failed"),
      v.literal("customer_at_risk"),
      v.literal("sla_breach")
    ),
    title: v.string(),
    message: v.string(),
    targetRole: v.union(
      v.literal("super_admin"),
      v.literal("billing_admin"),
      v.literal("support_admin"),
      v.literal("all")
    ),
    relatedId: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_targetRole", ["targetRole"])
    .index("by_isRead", ["isRead"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // ADMIN: Customer Health Scores
  // ============================================
  customer_health_scores: defineTable({
    companyId: v.string(),
    userId: v.string(),
    score: v.number(),
    status: v.union(
      v.literal("healthy"),
      v.literal("at_risk"),
      v.literal("critical")
    ),
    factors: v.object({
      lastLoginDays: v.number(),
      ticketCount: v.number(),
      paymentFailures: v.number(),
      usageScore: v.number(),
      subscriptionAge: v.number(),
    }),
    calculatedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_score", ["score"]),
});
