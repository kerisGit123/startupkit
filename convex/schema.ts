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
    
    // Activity Tracking for MAU
    lastLoginAt: v.optional(v.number()),
    lastActivityAt: v.optional(v.number()),
    loginCount: v.optional(v.number()),
    
    // Admin Labels & Tags
    userLabel: v.optional(v.string()),
    userTags: v.optional(v.array(v.string())),
    isBlocked: v.optional(v.boolean()),
    adminNotes: v.optional(v.string()),
    
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    deletionTime: v.optional(v.number()),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"])
    .index("by_lastLoginAt", ["lastLoginAt"])
    .index("by_userLabel", ["userLabel"])
    .index("by_isBlocked", ["isBlocked"]),

  // ============================================
  // CORE: Platform Configuration (SaaS Settings)
  // ============================================
  platform_config: defineTable({
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.string(),
    isEncrypted: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  // ============================================
  // EMAIL: Templates
  // ============================================
  email_templates: defineTable({
    name: v.string(),
    subject: v.string(),
    html: v.optional(v.string()),
    htmlBody: v.optional(v.string()),
    plainTextBody: v.optional(v.string()),
    variables: v.array(v.string()),
    category: v.optional(v.union(v.literal("system"), v.literal("custom"), v.literal("campaign"))),
    type: v.optional(v.union(
      v.literal("welcome"),
      v.literal("password_reset"),
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("usage_alert"),
      v.literal("admin_notification"),
      v.literal("custom")
    )),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
  })
    .index("by_category", ["category"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"])
    .index("by_active", ["isActive"]),

  // ============================================
  // EMAIL: Campaigns
  // ============================================
  email_campaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    templateId: v.optional(v.id("email_templates")),
    systemTemplateKey: v.optional(v.string()),
    recipientType: v.union(
      v.literal("all_users"),
      v.literal("specific_users"),
      v.literal("user_segment"),
      v.literal("active_7_days"),
      v.literal("inactive_1_month"),
      v.literal("user_label")
    ),
    recipientUserIds: v.optional(v.array(v.string())),
    userLabel: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    totalRecipients: v.number(),
    sentCount: v.number(),
    deliveredCount: v.number(),
    openedCount: v.number(),
    clickedCount: v.number(),
    failedCount: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_scheduledAt", ["scheduledAt"]),

  // ============================================
  // EMAIL: Events & Analytics
  // ============================================
  email_events: defineTable({
    campaignId: v.optional(v.id("email_campaigns")),
    userId: v.string(),
    userEmail: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained")
    ),
    timestamp: v.number(),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_userId", ["userId"])
    .index("by_eventType", ["eventType"]),

  // ============================================
  // EMAIL: Logs (for testing/debugging)
  // ============================================
  email_logs: defineTable({
    sentTo: v.string(), // recipient email
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.optional(v.string()),
    templateType: v.optional(v.string()), // e.g., "welcome", "sales_announcement"
    templateName: v.optional(v.string()),
    campaignId: v.optional(v.id("email_campaigns")),
    variables: v.optional(v.any()), // Store the variables used
    status: v.union(
      v.literal("logged"), // Logged but not sent (test mode)
      v.literal("sent"), // Actually sent via Resend
      v.literal("failed") // Failed to send
    ),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sentTo", ["sentTo"])
    .index("by_templateType", ["templateType"])
    .index("by_campaignId", ["campaignId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // ============================================
  // CORE: Organization Settings (Tenant Config)
  // ============================================
  org_settings: defineTable({
    companyId: v.string(),
    subjectType: v.union(v.literal("organization"), v.literal("user")),
    
    // Company Information
    companyName: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyTin: v.optional(v.string()),
    companyLicense: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    companyEmail: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companyTimezone: v.optional(v.string()),
    companyCurrency: v.optional(v.string()),
    companyFaviconId: v.optional(v.id("_storage")),
    companyLogoId: v.optional(v.id("_storage")),
    companyNote: v.optional(v.string()),
    
    // Additional Business Details
    companyVatNumber: v.optional(v.string()),
    companyRegistrationNumber: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    technicalContactEmail: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    
    // Referral Program Settings
    referralEnabled: v.optional(v.boolean()),
    referralRewardCredits: v.optional(v.number()), // Credits for referrer
    referralBonusCredits: v.optional(v.number()), // Bonus for new user
    
    // Email Settings
    emailEnabled: v.optional(v.boolean()), // Master toggle for all emails
    sendWelcomeEmail: v.optional(v.boolean()),
    sendPasswordResetEmail: v.optional(v.boolean()),
    sendSubscriptionEmails: v.optional(v.boolean()),
    sendUsageAlerts: v.optional(v.boolean()),
    sendAdminNotifications: v.optional(v.boolean()),
    sendPaymentNotifications: v.optional(v.boolean()),
    resendApiKey: v.optional(v.string()), // Resend API key
    emailFromName: v.optional(v.string()), // e.g., "Your SaaS"
    emailFromAddress: v.optional(v.string()), // e.g., "noreply@yourdomain.com"
    passwordResetLink: v.optional(v.string()), // Clerk password reset URL
    
    // Credit Settings
    initialSignupCredits: v.optional(v.number()), // Credits given on signup
    
    // Super Admin Settings
    superAdminEmail: v.optional(v.string()), // Super admin email (cannot be deleted)
    
    // Legacy fields (for backward compatibility)
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    
    // API & Integration Keys (should be encrypted)
    secretKey: v.optional(v.string()),
    openaiKey: v.optional(v.string()),
    openaiSecret: v.optional(v.string()),
    
    // Activity Tracking
    lastActivityCheck: v.optional(v.number()),
    lastApiCallAt: v.optional(v.number()),
    totalApiCall: v.optional(v.number()),
    
    // System Fields
    aiEnabled: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
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
  // EMAIL: Unsubscribes
  // ============================================
  email_unsubscribes: defineTable({
    userId: v.optional(v.id("users")),
    email: v.string(),
    unsubscribedFrom: v.union(
      v.literal("all"),
      v.literal("marketing"),
      v.literal("transactional"),
      v.literal("notifications")
    ),
    reason: v.optional(v.string()),
    unsubscribedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_user", ["userId"]),

  // ============================================
  // CORE: Subscription Event Log (Audit trail for all subscription changes)
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
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    reason: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_action", ["action"]),

  // ============================================
  // CORE: Unified Transactions (Financial records that affect credits/money)
  // ============================================
  transactions: defineTable({
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    
    // Transaction Type
    type: v.union(
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("credit"),
      v.literal("referral"),
      v.literal("bonus"),
      v.literal("refund")
    ),
    transactionType: v.union(
      v.literal("recurring"),
      v.literal("one_time")
    ),
    
    // Financial Details
    amount: v.number(),
    currency: v.string(),
    tokens: v.optional(v.number()),
    
    // Stripe Integration
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    
    // Subscription Details (when type = "subscription")
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
    action: v.optional(v.string()),
    source: v.optional(v.string()),
    eventType: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    
    // Invoice Link
    invoiceId: v.optional(v.id("invoices")),
    invoiceNo: v.optional(v.string()),
    
    // Metadata
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_userId", ["userId"])
    .index("by_type", ["type"])
    .index("by_invoiceId", ["invoiceId"])
    .index("by_stripePaymentIntentId", ["stripePaymentIntentId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  // ============================================
  // CORE: Credits System (One-time Purchases) - LEGACY (Keep for backward compatibility)
  // ============================================
  credits_ledger: defineTable({
    companyId: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    amountPaid: v.optional(v.number()),
    currency: v.optional(v.string()),
    reason: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
    invoiceNo: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_invoiceId", ["invoiceId"]),

  credits_balance: defineTable({
    companyId: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // CORE: User Activity Logs (MAU Tracking)
  // ============================================
  user_activity_logs: defineTable({
    userId: v.string(),
    companyId: v.string(),
    activityType: v.union(
      v.literal("login"),
      v.literal("api_call"),
      v.literal("feature_usage"),
      v.literal("page_view"),
      v.literal("action")
    ),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_companyId", ["companyId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_activityType", ["activityType"]),

  // ============================================
  // ADMIN: Notifications Read Tracking
  // ============================================
  notifications_read: defineTable({
    notificationId: v.string(),
    type: v.string(),
    userId: v.string(),
    readAt: v.number(),
  })
    .index("by_notification", ["notificationId"])
    .index("by_user", ["userId"])
    .index("by_user_notification", ["userId", "notificationId"]),

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
      v.literal("plans"),
      v.literal("usage"),
      v.literal("general"),
      v.literal("credit"),
      v.literal("technical"),
      v.literal("invoice"),
      v.literal("service"),
      v.literal("other")
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

  // ============================================
  // SECURITY: IP & Country Blocking
  // ============================================
  ip_blacklist: defineTable({
    ipAddress: v.string(),
    reason: v.optional(v.string()),
    blockedBy: v.string(), // Admin user ID
    blockedAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration
    isActive: v.boolean(),
  })
    .index("by_ipAddress", ["ipAddress"])
    .index("by_isActive", ["isActive"]),

  country_blacklist: defineTable({
    countryCode: v.string(), // ISO 3166-1 alpha-2 (e.g., "US", "CN")
    countryName: v.string(),
    reason: v.optional(v.string()),
    blockedBy: v.string(),
    blockedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_countryCode", ["countryCode"])
    .index("by_isActive", ["isActive"]),

  // ============================================
  // REFERRAL PROGRAM
  // ============================================
  referral_codes: defineTable({
    userId: v.string(), // User who owns this referral code
    code: v.string(), // Unique referral code (e.g., "JOHN2024ABC")
    createdAt: v.number(),
    isActive: v.boolean(),
    totalReferrals: v.number(), // Count of successful referrals
    totalCreditsEarned: v.number(), // Total credits earned from referrals
  })
    .index("by_userId", ["userId"])
    .index("by_code", ["code"]),

  referrals: defineTable({
    referralCode: v.string(), // The referral code used
    referrerId: v.string(), // User who referred
    referredUserId: v.string(), // User who was referred
    referredAt: v.number(), // When they signed up
    status: v.union(
      v.literal("pending"), // Signed up but not verified
      v.literal("completed"), // Verified and active
      v.literal("rewarded"), // Credits awarded
      v.literal("cancelled") // User deleted account
    ),
    rewardAmount: v.number(), // Credits awarded to referrer
    bonusAmount: v.optional(v.number()), // Bonus credits for referred user
    rewardedAt: v.optional(v.number()), // When reward was given
    metadata: v.optional(v.string()), // Additional tracking data (JSON string)
  })
    .index("by_referralCode", ["referralCode"])
    .index("by_referrerId", ["referrerId"])
    .index("by_referredUserId", ["referredUserId"])
    .index("by_status", ["status"]),

  // ============================================
  // ALERT/REMINDER SYSTEM
  // ============================================
  alerts: defineTable({
    title: v.string(), // Alert title
    message: v.string(), // Alert message
    type: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("success"),
      v.literal("error")
    ),
    targetType: v.union(
      v.literal("all"), // All users
      v.literal("specific_user"), // Specific user ID
      v.literal("role"), // Users with specific role
      v.literal("label") // Users with specific label
    ),
    targetValue: v.optional(v.string()), // User ID, role name, or label
    createdBy: v.string(), // Admin who created
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration
    isDismissible: v.boolean(), // Can users dismiss it?
    isActive: v.boolean(),
    priority: v.optional(v.number()), // Display order (higher = top)
  })
    .index("by_isActive", ["isActive"])
    .index("by_targetType", ["targetType"])
    .index("by_createdAt", ["createdAt"]),

  alert_dismissals: defineTable({
    alertId: v.id("alerts"),
    userId: v.string(),
    dismissedAt: v.number(),
  })
    .index("by_alertId", ["alertId"])
    .index("by_userId", ["userId"])
    .index("by_alert_user", ["alertId", "userId"]),

  // ============================================
  // INVOICE SYSTEM
  // ============================================
  invoice_config: defineTable({
    invoicePrefix: v.string(),
    invoiceNoType: v.union(
      v.literal("year_running"),
      v.literal("year_month_running"),
      v.literal("year_month_en_running"),
      v.literal("full_year_running"),
      v.literal("custom"),
      v.literal("year_dash_running"),
      v.literal("year_month_en_dash_running")
    ),
    invoiceLeadingZeros: v.number(),
    invoiceRunningNo: v.number(),
    invoiceCurrentNo: v.string(),
    lastResetDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  invoices: defineTable({
    invoiceNo: v.string(),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    ),
    invoiceType: v.union(
      v.literal("subscription"),
      v.literal("payment")
    ),
    transactionType: v.union(
      v.literal("recurring"),
      v.literal("one_time")
    ),
    transactionId: v.optional(v.id("transactions")),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    billingDetails: v.object({
      name: v.string(),
      email: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      country: v.optional(v.string()),
      postalCode: v.optional(v.string()),
    }),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    notes: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invoiceNo", ["invoiceNo"])
    .index("by_userId", ["userId"])
    .index("by_companyId", ["companyId"])
    .index("by_status", ["status"])
    .index("by_invoiceType", ["invoiceType"])
    .index("by_transactionType", ["transactionType"])
    .index("by_createdAt", ["createdAt"])
    .index("by_issuedAt", ["issuedAt"]),
});
