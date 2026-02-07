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
    
    // Invoice & PO Configuration Fields (DEPRECATED - moved to platform_config with category "invoicePO")
    SSTRegNo: v.optional(v.string()), // SST Registration Number
    regNo: v.optional(v.string()), // Registration Number
    defaultTerm: v.optional(v.string()), // Default payment terms
    websiteURL: v.optional(v.string()), // Company website
    bankAccount: v.optional(v.string()), // Bank account number
    bankName: v.optional(v.string()), // Bank name
    paymentNote: v.optional(v.string()), // Payment instructions/notes
    serviceTaxCode: v.optional(v.string()), // Service tax code
    serviceTax: v.optional(v.number()), // Service tax percentage
    serviceTaxEnable: v.optional(v.boolean()), // Enable service tax
    roundingEnable: v.optional(v.boolean()), // Enable rounding
    documentFooter: v.optional(v.string()), // Footer text for invoices and POs
    
    // Referral Program Settings
    referralEnabled: v.optional(v.boolean()),
    referralRewardCredits: v.optional(v.number()), // Credits for referrer
    referralBonusCredits: v.optional(v.number()), // Bonus for new user
    referralRequireEmailVerification: v.optional(v.boolean()), // Require email verification for credits
    
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
  // CORE: Financial Ledger (Single Source of Truth for ALL Revenue)
  // ============================================
  financial_ledger: defineTable({
    // Unique Identifier
    ledgerId: v.string(), // "TXN-2026-001234"
    
    // Core Financial Data
    amount: v.number(),
    currency: v.string(),
    
    // Transaction Classification
    type: v.union(
      v.literal("subscription_charge"),
      v.literal("subscription_refund"),
      v.literal("one_time_payment"),
      v.literal("credit_purchase"),
      v.literal("refund"),
      v.literal("chargeback"),
      v.literal("adjustment")
    ),
    
    // Revenue Attribution
    revenueSource: v.union(
      v.literal("stripe_subscription"),
      v.literal("stripe_payment"),
      v.literal("manual"),
      v.literal("referral_bonus"),
      v.literal("credit_adjustment")
    ),
    
    // Relationships
    userId: v.optional(v.id("users")),
    contactId: v.optional(v.id("contacts")),
    companyId: v.optional(v.string()),
    subscriptionId: v.optional(v.id("org_subscriptions")),
    invoiceId: v.optional(v.id("invoices")),
    
    // Stripe Integration
    stripePaymentIntentId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeChargeId: v.optional(v.string()),
    
    // Subscription Details (for subscription charges)
    subscriptionPlan: v.optional(v.string()),
    subscriptionPeriodStart: v.optional(v.number()),
    subscriptionPeriodEnd: v.optional(v.number()),
    
    // Credit/Token Details (for credit purchases)
    tokensAmount: v.optional(v.number()),
    
    // Description & Metadata
    description: v.string(),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    
    // Timestamps
    transactionDate: v.number(), // When transaction actually occurred
    recordedAt: v.number(), // When recorded in system
    
    // Reconciliation & Audit
    isReconciled: v.boolean(),
    reconciledAt: v.optional(v.number()),
    reconciledBy: v.optional(v.string()),
    
    // Legacy References (for migration tracking)
    legacyTransactionId: v.optional(v.id("transactions")),
    legacySubscriptionTransactionId: v.optional(v.id("subscription_transactions")),
    legacyCreditLedgerId: v.optional(v.id("credits_ledger")),
    
    // System Fields
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ledgerId", ["ledgerId"])
    .index("by_userId", ["userId"])
    .index("by_contactId", ["contactId"])
    .index("by_companyId", ["companyId"])
    .index("by_type", ["type"])
    .index("by_source", ["revenueSource"])
    .index("by_date", ["transactionDate"])
    .index("by_subscription", ["stripeSubscriptionId"])
    .index("by_payment_intent", ["stripePaymentIntentId"])
    .index("by_invoice", ["invoiceId"])
    .index("by_reconciled", ["isReconciled"]),

  // ============================================
  // CORE: Unified Transactions (LEGACY - Being replaced by financial_ledger)
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
    // Attachment support
    attachments: v.optional(v.array(v.object({
      storageId: v.string(),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
      fileUrl: v.optional(v.string()),
    }))),
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
  // Note: Invoice configuration moved to platform_config table with category "invoice_config"
  // PO configuration moved to platform_config table with category "PO_config"
  // Invoice & PO shared config moved to platform_config table with category "invoicePO"

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
      v.literal("payment"),
      v.literal("invoice")
    ),
    transactionType: v.union(
      v.literal("recurring"),
      v.literal("one_time")
    ),
    transactionId: v.optional(v.id("transactions")),
    purchaseOrderId: v.optional(v.id("purchase_orders")),
    purchaseOrderNo: v.optional(v.string()),
    sourceType: v.optional(v.union(
      v.literal("stripe_subscription"),
      v.literal("stripe_payment"),
      v.literal("purchase_order"),
      v.literal("manual")
    )),
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
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
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

  // ============================================
  // PURCHASE ORDERS
  // ============================================
  purchase_orders: defineTable({
    poNo: v.string(),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.string()),
    vendorName: v.string(),
    vendorEmail: v.optional(v.string()),
    vendorAddress: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("issued"),
      v.literal("approved"),
      v.literal("received"),
      v.literal("cancelled")
    ),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    paymentTerms: v.optional(v.string()),
    deliveryDate: v.optional(v.number()),
    issuedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
    createdByClerkUserId: v.optional(v.string()),
    lastEditedByClerkUserId: v.optional(v.string()),
    lastEditedAt: v.optional(v.number()),
    convertedToInvoiceId: v.optional(v.id("invoices")),
    convertedAt: v.optional(v.number()),
    convertedByClerkUserId: v.optional(v.string()),
  })
    .index("by_poNo", ["poNo"])
    .index("by_userId", ["userId"])
    .index("by_companyId", ["companyId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_issuedAt", ["issuedAt"]),

  // PO Share Links - Public shareable links with expiration
  po_share_links: defineTable({
    poId: v.id("purchase_orders"),
    shareToken: v.string(), // UUID for public access
    expiresAt: v.number(), // Timestamp when link expires
    createdAt: v.number(),
    accessCount: v.number(), // Track how many times accessed
    lastAccessedAt: v.optional(v.number()),
    isActive: v.boolean(), // Can be manually deactivated
  })
    .index("by_po", ["poId"])
    .index("by_token", ["shareToken"])
    .index("by_expiry", ["expiresAt"]),

  // ============================================
  // CRM: Unified Contacts (Consolidates Customers & Leads)
  // ============================================
  contacts: defineTable({
    // Basic Information
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    
    // Contact Type & Lifecycle
    type: v.union(
      v.literal("lead"),
      v.literal("customer"),
      v.literal("partner")
    ),
    lifecycleStage: v.union(
      v.literal("prospect"),      // Initial contact
      v.literal("qualified"),     // Qualified lead
      v.literal("customer"),      // Active customer
      v.literal("at_risk"),       // Customer at risk of churning
      v.literal("churned")        // Lost customer
    ),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("blocked")
    ),
    
    // Lead-specific fields
    leadSource: v.optional(v.string()), // "chatbot", "website", "referral", "manual"
    leadScore: v.optional(v.number()), // 0-100
    
    // Customer-specific fields
    customerSince: v.optional(v.number()),
    totalRevenue: v.optional(v.number()),
    subscriptionId: v.optional(v.id("org_subscriptions")),
    
    // Business Information
    companyRegistrationNo: v.optional(v.string()),
    taxId: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    
    // Contact Person (for companies)
    contactPersonName: v.optional(v.string()),
    contactPersonEmail: v.optional(v.string()),
    contactPersonPhone: v.optional(v.string()),
    
    // Assignment & Ownership
    assignedTo: v.optional(v.id("users")),
    
    // Tags & Categorization
    tags: v.array(v.string()),
    labels: v.array(v.string()),
    
    // Notes & Communication
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    
    // Metadata
    companyId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
    lastEditedBy: v.optional(v.string()),
    
    // Legacy references (for migration)
    legacyCustomerId: v.optional(v.id("saas_customers")),
    legacyLeadId: v.optional(v.id("leads")),
  })
    .index("by_email", ["email"])
    .index("by_type", ["type"])
    .index("by_lifecycle", ["lifecycleStage"])
    .index("by_status", ["status"])
    .index("by_company", ["companyId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_createdAt", ["createdAt"]),

  // SaaS Customers - Reusable customer data for POs and Invoices (LEGACY - use contacts table)
  saas_customers: defineTable({
    companyId: v.optional(v.string()),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerType: v.union(v.literal("saas"), v.literal("local")), // Distinguish between SaaS and local customers
    // Additional business info
    companyRegistrationNo: v.optional(v.string()),
    taxId: v.optional(v.string()),
    // Contact person
    contactPersonName: v.optional(v.string()),
    contactPersonEmail: v.optional(v.string()),
    contactPersonPhone: v.optional(v.string()),
    // Business details
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Metadata
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
    lastEditedBy: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_name", ["customerName"])
    .index("by_email", ["customerEmail"])
    .index("by_type", ["customerType"])
    .index("by_active", ["isActive"]),

  // ============================================
  // CHATBOT SYSTEM: AI Chatbot with n8n Integration
  // ============================================
  
  // Knowledge base for chatbot responses
  knowledge_base: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    tags: v.array(v.string()),
    keywords: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_type", ["type", "status"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // Chatbot configuration with visual designer settings
  chatbot_config: defineTable({
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    isActive: v.boolean(),
    n8nWebhookUrl: v.string(),
    
    // Widget Designer Settings
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("auto")),
    position: v.union(v.literal("left"), v.literal("right")),
    roundness: v.number(),
    
    // Branding
    companyName: v.string(),
    companyLogoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.string()),
    
    // Colors
    primaryColor: v.string(),
    secondaryColor: v.string(),
    backgroundColor: v.string(),
    textColor: v.string(),
    userMessageBgColor: v.string(),
    aiMessageBgColor: v.string(),
    userMessageTextColor: v.string(),
    aiMessageTextColor: v.string(),
    aiBorderColor: v.string(),
    aiTextColor: v.string(),
    
    // Dark Theme Colors
    darkPrimaryColor: v.optional(v.string()),
    darkSecondaryColor: v.optional(v.string()),
    darkBackgroundColor: v.optional(v.string()),
    darkTextColor: v.optional(v.string()),
    darkUserMessageTextColor: v.optional(v.string()),
    darkAiMessageBgColor: v.optional(v.string()),
    darkAiBorderColor: v.optional(v.string()),
    darkAiTextColor: v.optional(v.string()),
    
    // Messages
    welcomeMessage: v.string(),
    responseTimeText: v.string(),
    firstBotMessage: v.string(),
    placeholderText: v.string(),
    
    // Features
    showThemeToggle: v.boolean(),
    showCompanyLogo: v.boolean(),
    showResponseTime: v.boolean(),
    enableSoundNotifications: v.boolean(),
    enableTypingIndicator: v.boolean(),
    
    // Mobile Settings
    mobileFullScreen: v.boolean(),
    mobilePosition: v.union(v.literal("bottom"), v.literal("top")),
    
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_type", ["type"]),

  // Chatbot conversations with admin takeover support
  chatbot_conversations: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.id("users")),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("admin")),
      content: v.string(),
      timestamp: v.number(),
      senderId: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      imageStorageId: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      fileStorageId: v.optional(v.string()),
      fileName: v.optional(v.string()),
      fileType: v.optional(v.string()),
      fileSize: v.optional(v.number()),
      messageType: v.optional(v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("file"),
        v.literal("system"),
        v.literal("intervention_request"),
        v.literal("quick_reply")
      )),
      quickReplies: v.optional(v.array(v.object({
        label: v.string(),
        value: v.string(),
      }))),
    })),
    status: v.union(
      v.literal("active"),
      v.literal("waiting_for_agent"),
      v.literal("admin_takeover"),
      v.literal("resolved"),
      v.literal("escalated")
    ),
    takenOverBy: v.optional(v.id("users")),
    takenOverAt: v.optional(v.number()),
    resolved: v.boolean(),
    escalatedToSupport: v.boolean(),
    interventionRequested: v.boolean(),
    interventionRequestedAt: v.optional(v.number()),
    // Lead capture fields
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    userPhone: v.optional(v.string()),
    userCompany: v.optional(v.string()),
    leadCaptured: v.boolean(),
    leadCapturedAt: v.optional(v.number()),
    customAttributes: v.optional(v.any()),
    rating: v.optional(v.number()),
    ratingComment: v.optional(v.string()),
    ratedAt: v.optional(v.number()),
    label: v.optional(v.union(
      v.literal("urgent"),
      v.literal("follow-up"),
      v.literal("resolved")
    )),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_type", ["type"])
    .index("by_type_status", ["type", "status"])
    .index("by_admin", ["takenOverBy"])
    .index("by_lead_captured", ["leadCaptured"]),

  // Lead capture form configuration
  lead_capture_config: defineTable({
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    isEnabled: v.boolean(),
    triggerAfterMessages: v.number(),
    requiredFields: v.array(v.string()),
    customFields: v.array(v.object({
      fieldName: v.string(),
      fieldLabel: v.string(),
      fieldType: v.union(v.literal("text"), v.literal("email"), v.literal("phone"), v.literal("select"), v.literal("textarea")),
      isRequired: v.boolean(),
      options: v.optional(v.array(v.string())),
      placeholder: v.optional(v.string()),
    })),
    formTitle: v.string(),
    formDescription: v.string(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  // Appointment bookings from chat
  chat_appointments: defineTable({
    conversationId: v.id("chatbot_conversations"),
    sessionId: v.string(),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    appointmentDate: v.number(),
    appointmentTime: v.string(),
    duration: v.number(),
    timezone: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    purpose: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    assignedTo: v.optional(v.id("users")),
    meetingLink: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_status", ["status"])
    .index("by_date", ["appointmentDate"]),

  // User attributes for lead enrichment
  user_attributes: defineTable({
    sessionId: v.string(),
    conversationId: v.id("chatbot_conversations"),
    attributes: v.any(),
    source: v.union(v.literal("form"), v.literal("chat"), v.literal("admin")),
    collectedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_conversation", ["conversationId"]),

  // Chatbot analytics
  chatbot_analytics: defineTable({
    sessionId: v.string(),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    totalMessages: v.number(),
    resolvedByBot: v.boolean(),
    resolvedByAdmin: v.boolean(),
    adminTakeoverTime: v.optional(v.number()),
    resolutionTime: v.optional(v.number()),
    satisfactionRating: v.optional(v.number()),
    commonQuestions: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_type", ["type"]),

  // Admin live chat queue
  admin_chat_queue: defineTable({
    conversationId: v.id("chatbot_conversations"),
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("waiting"), v.literal("assigned"), v.literal("resolved")),
    assignedTo: v.optional(v.id("users")),
    assignedAt: v.optional(v.number()),
    waitTime: v.number(),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"]),

  // ============================================
  // REPORT LOGOS: Uploaded logos for reports
  // ============================================
  report_logos: defineTable({
    companyId: v.string(),
    storageId: v.string(), // Reference to Convex storage
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // BOOKING SYSTEM: Calendly-like Appointment Scheduling
  // ============================================
  
  // Appointments - Main booking records
  appointments: defineTable({
    // Client Information
    contactId: v.id("contacts"),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    
    // Event Type Link
    eventTypeId: v.optional(v.id("event_types")), // Link to event type
    
    // Appointment Details
    date: v.string(), // "2026-01-26"
    startTime: v.string(), // "14:00"
    endTime: v.string(), // "15:00"
    duration: v.number(), // minutes (60)
    
    // Status & Metadata
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("no_show")
    ),
    
    // Purpose & Notes
    appointmentType: v.string(), // "consultation", "demo", "support" (legacy, use eventTypeId)
    notes: v.optional(v.string()),
    internalNotes: v.optional(v.string()), // Admin-only notes
    
    // Location (from event type or custom)
    location: v.optional(v.string()), // Meeting link or location details
    
    // Custom answers to event type questions
    customAnswers: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
    }))),
    
    // Google Calendar Integration
    googleEventId: v.optional(v.string()),
    googleCalendarSynced: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
    
    // Tracking
    bookedBy: v.union(
      v.literal("chatbot"),
      v.literal("admin"),
      v.literal("api")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")), // Admin user ID
  })
    .index("by_date", ["date"])
    .index("by_contact", ["contactId"])
    .index("by_status", ["status"])
    .index("by_email", ["contactEmail"])
    .index("by_googleEventId", ["googleEventId"])
    .index("by_date_status", ["date", "status"]),

  // Clients - Customer records for bookings
  clients: defineTable({
    // Basic Information
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    
    // Additional Details
    timezone: v.optional(v.string()), // "America/New_York"
    preferredContactMethod: v.optional(v.string()), // "email", "phone", "sms"
    
    // Metadata
    tags: v.array(v.string()), // ["vip", "enterprise", "trial"]
    notes: v.optional(v.string()),
    
    // Statistics
    totalAppointments: v.number(),
    completedAppointments: v.number(),
    cancelledAppointments: v.number(),
    noShowCount: v.number(),
    
    // Tracking
    firstBookedAt: v.number(),
    lastBookedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_company", ["company"]),

  // Availability - Weekly schedule configuration
  availability: defineTable({
    // Day Configuration
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    
    // Time Slots
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    slotDuration: v.number(), // 30 or 60 minutes
    
    // Buffer Times (Calendly-style)
    bufferBefore: v.optional(v.number()), // Minutes before event (e.g., 30)
    bufferAfter: v.optional(v.number()), // Minutes after event (e.g., 10)
    bufferBetweenSlots: v.number(), // 15 minutes (deprecated, use bufferAfter)
    
    // Max Meetings Limits
    maxMeetingsPerDay: v.optional(v.number()), // e.g., 2 meetings per day
    maxMeetingsPerWeek: v.optional(v.number()), // e.g., 6 meetings per week
    
    // Break Times
    breakTimes: v.optional(v.array(v.object({
      start: v.string(),
      end: v.string(),
    }))),
    
    // Status
    isActive: v.boolean(),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_day", ["dayOfWeek"])
    .index("by_active", ["isActive"]),

  // Event Types - Different appointment types (Calendly-style)
  event_types: defineTable({
    // Basic Info
    name: v.string(), // "30 Minute Meeting", "Consultation"
    slug: v.string(), // "30-min-meeting" for URL
    description: v.optional(v.string()),
    
    // Duration & Scheduling
    duration: v.number(), // Minutes (15, 30, 45, 60, 120)
    
    // Location
    locationType: v.union(
      v.literal("google_meet"),
      v.literal("zoom"),
      v.literal("phone"),
      v.literal("in_person"),
      v.literal("custom")
    ),
    locationDetails: v.optional(v.string()), // Custom location or instructions
    
    // Color for calendar display
    color: v.string(), // Hex color "#4F46E5"
    
    // Availability specific to this event type
    customAvailability: v.optional(v.boolean()), // Use custom hours for this event
    
    // Buffer times specific to this event type
    bufferBefore: v.optional(v.number()),
    bufferAfter: v.optional(v.number()),
    
    // Limits
    maxBookingsPerDay: v.optional(v.number()),
    maxBookingsPerWeek: v.optional(v.number()),
    
    // Booking window
    minNoticeHours: v.optional(v.number()), // Minimum hours before booking (e.g., 24)
    maxDaysInFuture: v.optional(v.number()), // How far in advance can book (e.g., 60 days)
    
    // Questions to ask during booking
    customQuestions: v.optional(v.array(v.object({
      question: v.string(),
      required: v.boolean(),
      type: v.union(v.literal("text"), v.literal("textarea"), v.literal("select")),
      options: v.optional(v.array(v.string())),
    }))),
    
    // Status
    isActive: v.boolean(),
    isPublic: v.boolean(), // Show on public booking page
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .index("by_public", ["isPublic"]),

  // Availability Overrides - Date-specific exceptions
  availability_overrides: defineTable({
    // Date-specific overrides
    date: v.string(), // "2026-01-26"
    
    // Override Type
    type: v.union(
      v.literal("blocked"), // Day off, holiday
      v.literal("custom")   // Custom hours for this day
    ),
    
    // Custom Hours (if type = "custom")
    customStartTime: v.optional(v.string()),
    customEndTime: v.optional(v.string()),
    
    // Metadata
    reason: v.optional(v.string()), // "Holiday", "Conference"
    isHoliday: v.optional(v.boolean()), // Mark as holiday for special handling
    holidayName: v.optional(v.string()), // "Christmas", "New Year"
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_type", ["type"])
    .index("by_holiday", ["isHoliday"]),

  // Google Calendar Sync - OAuth and sync configuration
  google_calendar_sync: defineTable({
    // Sync Configuration
    calendarId: v.string(), // Google Calendar ID
    isEnabled: v.boolean(),
    syncDirection: v.union(
      v.literal("one_way_to_google"),
      v.literal("two_way")
    ),
    
    // OAuth Credentials (encrypted)
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    
    // Sync Status
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(v.string()),
    syncErrors: v.optional(v.array(v.object({
      timestamp: v.number(),
      error: v.string(),
    }))),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_calendarId", ["calendarId"]),

  // Leads - CRM for potential customers (before they become clients)
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    source: v.string(), // "chatbot", "website", "referral", "manual"
    message: v.optional(v.string()),
    status: v.string(), // "new", "contacted", "converted", "lost"
    convertedToClientId: v.optional(v.id("clients")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // Booking Conversations - Track chatbot booking sessions
  booking_conversations: defineTable({
    sessionId: v.string(),
    clientId: v.optional(v.id("clients")),
    
    // Status
    status: v.union(
      v.literal("active"),
      v.literal("booking_in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    
    // Context
    currentIntent: v.optional(v.string()), // "booking", "rescheduling", "cancellation"
    collectedData: v.optional(v.any()), // Temporary data during booking flow
    
    // Tracking
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_status", ["status"]),

  // Unified Inbox - All communication channels in one place
  inbox_messages: defineTable({
    // Contact & Thread
    contactId: v.optional(v.id("contacts")),
    threadId: v.string(),
    
    // Channel & Direction
    channel: v.union(
      v.literal("email"),
      v.literal("chatbot"),
      v.literal("ticket"),
      v.literal("sms")
    ),
    direction: v.union(
      v.literal("inbound"),
      v.literal("outbound")
    ),
    
    // Content
    subject: v.optional(v.string()),
    body: v.string(),
    
    // Status & Priority
    status: v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("replied"),
      v.literal("archived")
    ),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high")
    )),
    
    // Assignment & Organization
    assignedTo: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
    starred: v.optional(v.boolean()),
    workflowStatus: v.optional(v.union(
      v.literal("urgent"),
      v.literal("follow-up"),
      v.literal("resolved"),
      v.literal("pending")
    )),
    
    // Timestamps
    sentAt: v.number(),
    readAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
    
    // Metadata
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channel"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"])
    .index("by_contact", ["contactId"])
    .index("by_thread", ["threadId"])
    .index("by_sentAt", ["sentAt"])
    .index("by_starred", ["starred"])
    .index("by_workflow_status", ["workflowStatus"]),
});
