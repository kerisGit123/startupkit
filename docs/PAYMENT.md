# Payment & Invoice System Design

## Table of Contents
1. [Overview](#overview)
2. [Current System Analysis](#current-system-analysis)
3. [Invoice Numbering Strategy](#invoice-numbering-strategy)
4. [Invoice Number Format Combinations](#invoice-number-format-combinations)
5. [Implementation Approaches](#implementation-approaches)
6. [Recommended Solution](#recommended-solution)
7. [Database Schema Updates](#database-schema-updates)
8. [Settings UI Integration](#settings-ui-integration)
9. [API Implementation](#api-implementation)
10. [Use Cases & Examples](#use-cases--examples)

---

## Overview

This document analyzes the invoice numbering strategy for different transaction types in the StartupKit platform and provides recommendations for implementation.

### Key Questions Addressed

1. **Should invoice settings be in the Settings page?** → YES
2. **Should subscriptions and payments have separate invoice numbers?** → NO - UNIFIED SYSTEM
3. **Should we combine or separate invoice tables?** → UNIFIED TABLE
4. **What are the best invoice number format combinations?** → 7 PRACTICAL FORMATS

---

## Current System Analysis

### ❌ Problem: Separate Tables Create Complexity

Your current system has:
- `credits_ledger` - for credit purchases
- `subscription_transactions` - for subscription events
- Both tables have `invoiceId` and `invoiceNo` fields

**Issues:**
- Data duplication (invoice fields in multiple tables)
- Complex queries (need to join multiple tables)
- Harder to maintain and scale
- More code to write and test

### ✅ Solution: Unified Transactions Table

Instead of separate tables, use ONE table:

#### `transactions` (Unified Transaction Table)
```typescript
{
  _id: Id<"transactions">,
  companyId: string,
  userId?: Id<"users">,
  
  // Transaction Type
  type: "subscription" | "payment" | "credit",
  transactionType: "recurring" | "one_time",
  
  // Financial Details
  amount: number,
  currency: string,
  tokens?: number,  // For credit purchases
  
  // Stripe Integration
  stripePaymentIntentId?: string,
  stripeCheckoutSessionId?: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  
  // Subscription Details (if type = "subscription")
  plan?: string,
  status?: string,
  action?: string,  // "created", "renewed", "upgraded", "cancelled"
  source?: string,
  eventType?: string,
  currentPeriodEnd?: number,
  
  // Invoice Link
  invoiceId?: Id<"invoices">,
  invoiceNo?: string,
  
  // Metadata
  reason?: string,
  createdAt: number,
}
```

**Benefits:**
- ✅ Single source of truth
- ✅ Simpler queries
- ✅ Easy to add new transaction types
- ✅ Better performance (one table to query)
- ✅ Cleaner code

#### `invoices` (Invoice Table)
```typescript
{
  _id: Id<"invoices">,
  invoiceNo: string,
  userId?: Id<"users">,
  companyId?: string,
  amount: number,
  currency: string,
  status: "draft" | "issued" | "paid" | "cancelled" | "overdue",
  items: Array<{...}>,
  billingDetails: {...},
  subtotal: number,
  tax?: number,
  total: number,
  stripePaymentIntentId?: string,
  stripeInvoiceId?: string,
  issuedAt?: number,
  paidAt?: number,
  createdAt: number,
  updatedAt: number,
}
```

---

## Invoice Numbering Strategy

### Option A: Separate Invoice Number Sequences

**Concept:** Different prefixes and counters for different transaction types

```
Subscription Invoices: SUB-250001, SUB-250002, SUB-250003
Payment Invoices:      PAY-250001, PAY-250002, PAY-250003
Credit Invoices:       CRD-250001, CRD-250002, CRD-250003
```

#### Pros ✅
- Clear distinction between transaction types
- Easy to identify invoice type at a glance
- Separate counters prevent confusion
- Better for accounting departments that separate recurring vs one-time revenue

#### Cons ❌
- More complex configuration (3 separate configs)
- More database queries
- Harder to get total invoice count
- Customer confusion with multiple numbering systems

---

### Option B: Unified Invoice Number Sequence

**Concept:** Single counter for all transaction types, optional type indicator

```
All Invoices: INV-250001, INV-250002, INV-250003
With Type:    INV-S-250001, INV-P-250002, INV-C-250003
```

#### Pros ✅
- Simple configuration (1 config)
- Sequential numbering across all transactions
- Easier to track total business volume
- Simpler for customers to understand
- Standard practice for most businesses

#### Cons ❌
- Cannot distinguish invoice type from number alone (unless using type indicator)
- Mixed transaction types in same sequence

---

### Option C: Hybrid Approach (RECOMMENDED)

**Concept:** Unified invoice table with type field, single counter, optional prefix customization

```typescript
{
  invoiceNo: "INV-250001",
  invoiceType: "subscription" | "payment" | "credit" | "refund",
  transactionType: "recurring" | "one_time",
  // ... rest of fields
}
```

**Invoice Numbers:**
```
INV-250001 (Subscription - Pro Plan)
INV-250002 (Credit Purchase - 100 credits)
INV-250003 (Subscription - Renewal)
INV-250004 (Credit Purchase - 500 credits)
```

#### Pros ✅
- Single source of truth for all invoices
- Simple configuration
- Easy reporting and analytics
- Standard business practice
- Flexible querying by type
- Can still filter by `invoiceType` for accounting

#### Cons ❌
- Requires type field to distinguish
- All types share same counter

---

## Invoice Number Format Combinations

### Simplified 7 Formats (Practical for SaaS)

| # | Format Type | Example | Reset | Best For |
|---|-------------|---------|-------|----------|
| 1 | `year_running` | `INV-250001` | Yearly | **Most SaaS ⭐** |
| 2 | `year_month_running` | `INV-25010001` | Monthly | High volume |
| 3 | `year_month_en_running` | `INV-25JA0001` | Monthly | International |
| 4 | `full_year_running` | `INV-20250001` | Yearly | Long-term archival |
| 5 | `custom` | `INV-2501S0001` | Configurable | Maximum flexibility |
| 6 | `year_dash_running` | `INV-25-0001` | Yearly | Clean & readable |
| 7 | `year_month_en_dash_running` | `INV-25JA-0001` | Monthly | International + readable |

### Format Details

#### 1. Year + Running (Recommended) ⭐
```typescript
type: "year_running"
format: YY + NNNN
example: "INV-250001"
reset: Yearly (January 1st)
length: ~10 characters
best_for: "Most SaaS businesses"
```

#### 2. Year + Month + Running
```typescript
type: "year_month_running"
format: YY + MM + NNNN
example: "INV-25010001"
reset: Monthly (1st of each month)
length: ~13 characters
best_for: "High volume businesses"
```

#### 3. Year + Month (English) + Running
```typescript
type: "year_month_en_running"
format: YY + MMM + NNNN
example: "INV-25JA0001" (JA=January)
reset: Monthly
length: ~13 characters
best_for: "International businesses"
month_codes: ["JA", "FE", "MR", "AP", "MY", "JN", "JL", "AU", "SE", "OC", "NO", "DE"]
```

#### 4. Full Year + Running
```typescript
type: "full_year_running"
format: YYYY + NNNN
example: "INV-20250001"
reset: Yearly
length: ~13 characters
best_for: "Long-term archival, clarity"
```

#### 5. Custom Format
```typescript
type: "custom"
format: YY + MM + T + NNNN
example: "INV-2501S0001" (S=Subscription, P=Payment, C=Credit)
reset: Configurable
length: ~14 characters
best_for: "Maximum flexibility, separate accounting"
type_codes: { S: "Subscription", P: "Payment" }
```

#### 6. Year + Dash + Running
```typescript
type: "year_dash_running"
format: YY + "-" + NNNN
example: "INV-25-0001"
reset: Yearly
length: ~11 characters
best_for: "Clean, readable format"
```

#### 7. Year + Month (English) + Dash + Running
```typescript
type: "year_month_en_dash_running"
format: YY + MMM + "-" + NNNN
example: "INV-25JA-0001"
reset: Monthly
length: ~14 characters
best_for: "International + readable"
```

### Format Comparison

| Format | Length | Example | Reset | Use Case |
|--------|--------|---------|-------|----------|
| year_running | 10 | INV-250001 | Yearly | ⭐ Default choice |
| year_month_running | 13 | INV-25010001 | Monthly | 1000+ invoices/month |
| year_month_en_running | 13 | INV-25JA0001 | Monthly | Global customers |
| full_year_running | 13 | INV-20250001 | Yearly | Compliance/archival |
| custom | 14 | INV-2501S0001 | Variable | Separate accounting |
| year_dash_running | 11 | INV-25-0001 | Yearly | Readability |
| year_month_en_dash_running | 14 | INV-25JA-0001 | Monthly | Global + readable |

---

## Implementation Approaches

### Approach 1: Separate Tables & Sequences ❌ NOT RECOMMENDED

```typescript
// Three separate configs
invoice_config_subscription
invoice_config_payment
invoice_config_credit

// Three separate invoice tables
subscription_invoices
payment_invoices
credit_invoices
```

**Issues:**
- High complexity
- Data duplication
- Difficult reporting
- Poor scalability

---

### Approach 2: Unified Table, Separate Sequences ⚠️ MODERATE

```typescript
// Multiple configs in one table
invoice_config: {
  configType: "subscription" | "payment" | "credit",
  prefix: string,
  // ... rest of config
}

// Single invoice table with type
invoices: {
  invoiceNo: string,
  invoiceType: "subscription" | "payment" | "credit",
  // ... rest of fields
}
```

**Issues:**
- Still complex configuration
- Multiple queries for invoice generation
- Customer confusion with different prefixes

---

### Approach 3: Unified Transactions + Invoices ✅ RECOMMENDED

```typescript
// Single config
invoice_config: {
  invoicePrefix: "INV-",
  invoiceNoType: "year_running",
  invoiceLeadingZeros: 4,
  // ... rest of config
}

// Single transactions table
transactions: {
  type: "subscription" | "payment" | "credit",
  amount: number,
  currency: string,
  invoiceId?: Id<"invoices">,
  invoiceNo?: string,
  // ... all transaction fields in one place
}

// Single invoice table
invoices: {
  invoiceNo: "INV-250001",
  invoiceType: "subscription" | "payment",
  transactionId: Id<"transactions">,  // Link back to transaction
  // ... rest of fields
}
```

**Benefits:**
- ✅ Single transactions table (no separate credits_ledger/subscription_transactions)
- ✅ Simple configuration
- ✅ Single source of truth
- ✅ Easy reporting
- ✅ Standard business practice
- ✅ Customer-friendly
- ✅ Scalable
- ✅ Less code to maintain

---

## Recommended Solution

### Architecture: Unified System (Approach 3)

#### 1. Single Transactions Table (Replaces credits_ledger + subscription_transactions)

```typescript
transactions: defineTable({
  companyId: v.string(),
  userId: v.optional(v.id("users")),
  
  // Transaction Type
  type: v.union(
    v.literal("subscription"),  // Subscription events
    v.literal("payment"),       // Credit purchases
    v.literal("credit")         // Manual credits (admin)
  ),
  transactionType: v.union(
    v.literal("recurring"),
    v.literal("one_time")
  ),
  
  // Financial Details
  amount: v.number(),
  currency: v.string(),
  tokens: v.optional(v.number()),  // For credit purchases
  
  // Stripe Integration
  stripePaymentIntentId: v.optional(v.string()),
  stripeCheckoutSessionId: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  
  // Subscription Details (when type = "subscription")
  plan: v.optional(v.string()),
  status: v.optional(v.string()),
  action: v.optional(v.string()),  // "created", "renewed", "upgraded", "cancelled"
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
  .index("by_type", ["type"])
  .index("by_invoiceId", ["invoiceId"])
  .index("by_stripePaymentIntentId", ["stripePaymentIntentId"])
  .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
```

#### 2. Invoices Table

```typescript
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
  
  // Type classification
  invoiceType: v.union(
    v.literal("subscription"),  // Recurring subscription payments
    v.literal("payment")        // One-time credit purchases
  ),
  transactionType: v.union(
    v.literal("recurring"),
    v.literal("one_time")
  ),
  
  // Link to transaction
  transactionId: v.id("transactions"),
  
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
  .index("by_transactionId", ["transactionId"])
  .index("by_createdAt", ["createdAt"])
  .index("by_issuedAt", ["issuedAt"])
```

#### 3. Invoice Configuration

```typescript
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
})
```

---

## Implementation Guide: How to Modify Your Project

### Step 1: Schema Migration

#### A. Add New `transactions` Table

**File:** `convex/schema.ts`

```typescript
// ADD this new table
transactions: defineTable({
  companyId: v.string(),
  userId: v.optional(v.id("users")),
  
  // Transaction Type
  type: v.union(
    v.literal("subscription"),
    v.literal("payment"),
    v.literal("credit")
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
  
  // Subscription Details
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
  .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
```

#### B. Update `invoices` Table

```typescript
// UPDATE existing invoices table - add these fields
invoices: defineTable({
  // ... existing fields ...
  
  // ADD these new fields:
  invoiceType: v.union(
    v.literal("subscription"),
    v.literal("payment")
  ),
  transactionType: v.union(
    v.literal("recurring"),
    v.literal("one_time")
  ),
  transactionId: v.id("transactions"),
  
  // ... rest of existing fields ...
})
  // ADD these new indexes:
  .index("by_invoiceType", ["invoiceType"])
  .index("by_transactionId", ["transactionId"])
```

#### C. Migration Strategy for Existing Data

**Option 1: Keep Old Tables (Recommended for Production)**
- Keep `credits_ledger` and `subscription_transactions` as read-only
- New transactions go to `transactions` table
- Gradually migrate old data in background

**Option 2: Fresh Start (For Development)**
- Remove `credits_ledger` and `subscription_transactions`
- Start fresh with `transactions` table

---

### Step 2: Update Credit Purchase Flow

#### Current Flow (OLD)
```typescript
// convex/credits/purchaseCredits.ts or similar

// OLD: Insert into credits_ledger
const creditId = await ctx.db.insert("credits_ledger", {
  companyId: user.companyId,
  tokens: 100,
  amountPaid: 1000,
  currency: "USD",
  stripePaymentIntentId: paymentIntent.id,
  createdAt: Date.now(),
});
```

#### New Flow (UPDATED)
```typescript
// convex/transactions/createTransaction.ts

export const createPaymentTransaction = mutation({
  args: {
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    amount: v.number(),
    currency: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      companyId: args.companyId,
      userId: args.userId,
      type: "payment",
      transactionType: "one_time",
      amount: args.amount,
      currency: args.currency,
      tokens: args.tokens,
      stripePaymentIntentId: args.stripePaymentIntentId,
      createdAt: Date.now(),
    });
    
    // 2. Generate invoice
    const { invoiceNo, invoiceId } = await ctx.runMutation(
      internal.invoices.createInvoiceForTransaction,
      { transactionId }
    );
    
    // 3. Update transaction with invoice reference
    await ctx.db.patch(transactionId, {
      invoiceId,
      invoiceNo,
    });
    
    // 4. Update credits balance
    await ctx.runMutation(internal.credits.addCredits, {
      companyId: args.companyId,
      tokens: args.tokens,
    });
    
    return { transactionId, invoiceNo };
  },
});
```

---

### Step 3: Update Subscription Flow

#### Current Flow (OLD)
```typescript
// convex/subscriptions/webhookHandler.ts

// OLD: Insert into subscription_transactions
const txId = await ctx.db.insert("subscription_transactions", {
  companyId: user.companyId,
  action: "renewed",
  plan: "pro",
  status: "active",
  stripeSubscriptionId: subscription.id,
  eventType: "invoice.payment_succeeded",
  createdAt: Date.now(),
});
```

#### New Flow (UPDATED)
```typescript
// convex/transactions/createTransaction.ts

export const createSubscriptionTransaction = mutation({
  args: {
    companyId: v.string(),
    userId: v.optional(v.id("users")),
    amount: v.number(),
    currency: v.string(),
    plan: v.string(),
    status: v.string(),
    action: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    eventType: v.string(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      companyId: args.companyId,
      userId: args.userId,
      type: "subscription",
      transactionType: "recurring",
      amount: args.amount,
      currency: args.currency,
      plan: args.plan,
      status: args.status,
      action: args.action,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeCustomerId: args.stripeCustomerId,
      eventType: args.eventType,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: Date.now(),
    });
    
    // 2. Generate invoice (only for paid events)
    if (args.action === "renewed" || args.action === "created") {
      const { invoiceNo, invoiceId } = await ctx.runMutation(
        internal.invoices.createInvoiceForTransaction,
        { transactionId }
      );
      
      // 3. Update transaction with invoice reference
      await ctx.db.patch(transactionId, {
        invoiceId,
        invoiceNo,
      });
      
      return { transactionId, invoiceNo };
    }
    
    return { transactionId };
  },
});
```

---

### Step 4: Create Invoice Generation Function

**File:** `convex/invoices/createInvoiceForTransaction.ts`

```typescript
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const createInvoiceForTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, { transactionId }) => {
    // 1. Get transaction details
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) throw new Error("Transaction not found");
    
    // 2. Get user/company details for billing
    const user = transaction.userId 
      ? await ctx.db.get(transaction.userId)
      : null;
    
    // 3. Generate invoice number
    const { invoiceNo } = await ctx.runMutation(
      internal.invoices.generateInvoiceNumber,
      {}
    );
    
    // 4. Determine invoice type
    const invoiceType = transaction.type === "subscription" 
      ? "subscription" 
      : "payment";
    
    // 5. Build invoice items
    const items = [];
    if (transaction.type === "payment" && transaction.tokens) {
      items.push({
        description: `${transaction.tokens} Credits Purchase`,
        quantity: transaction.tokens,
        unitPrice: transaction.amount / transaction.tokens,
        total: transaction.amount,
      });
    } else if (transaction.type === "subscription") {
      items.push({
        description: `${transaction.plan} Plan - ${transaction.action}`,
        quantity: 1,
        unitPrice: transaction.amount,
        total: transaction.amount,
      });
    }
    
    // 6. Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNo,
      userId: transaction.userId,
      companyId: transaction.companyId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: "paid",
      invoiceType,
      transactionType: transaction.transactionType,
      transactionId,
      items,
      billingDetails: {
        name: user?.name || "Customer",
        email: user?.email || "",
      },
      subtotal: transaction.amount,
      total: transaction.amount,
      stripePaymentIntentId: transaction.stripePaymentIntentId,
      issuedAt: Date.now(),
      paidAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { invoiceId, invoiceNo };
  },
});
```

---

### Step 5: Update Stripe Webhook Handler

**File:** `convex/stripe/webhookHandler.ts`

```typescript
// BEFORE
case "invoice.payment_succeeded":
  await ctx.db.insert("subscription_transactions", {
    companyId: user.companyId,
    action: "renewed",
    // ...
  });
  break;

// AFTER
case "invoice.payment_succeeded":
  const { invoiceNo } = await ctx.runMutation(
    internal.transactions.createSubscriptionTransaction,
    {
      companyId: user.companyId,
      userId: user._id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      plan: subscription.items.data[0].price.lookup_key,
      status: "active",
      action: "renewed",
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customer.id,
      eventType: "invoice.payment_succeeded",
      currentPeriodEnd: subscription.current_period_end * 1000,
    }
  );
  
  // Send email with invoice number
  await ctx.runAction(internal.emails.sendSubscriptionEmail, {
    to: user.email,
    invoiceNo,
    planName: "Pro Plan",
    amount: invoice.amount_paid / 100,
  });
  break;
```

---

### Step 6: Update Email Templates

**Add `{invoiceNo}` variable to all payment/subscription email templates:**

```typescript
// Email template for credit purchase
subject: "Payment Received - Invoice {invoiceNo}"
body: `
  Thank you for your purchase!
  
  Invoice Number: {invoiceNo}
  Amount: {payment_amount}
  Credits: {credits_purchased}
  
  Download your invoice: {invoice_download_link}
`

// Email template for subscription
subject: "Subscription Payment - Invoice {invoiceNo}"
body: `
  Your subscription has been renewed.
  
  Invoice Number: {invoiceNo}
  Plan: {plan_name}
  Amount: {amount}
  
  View invoice: {invoice_link}
`
```

---

### Step 7: Query Functions

**File:** `convex/transactions/queries.ts`

```typescript
// Get all transactions for a company
export const getCompanyTransactions = query({
  args: {
    companyId: v.string(),
    type: v.optional(v.union(
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("credit")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId));
    
    const transactions = await q
      .order("desc")
      .take(args.limit || 100);
    
    // Filter by type if specified
    if (args.type) {
      return transactions.filter(t => t.type === args.type);
    }
    
    return transactions;
  },
});

// Get transaction with invoice
export const getTransactionWithInvoice = query({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const transaction = await ctx.db.get(transactionId);
    if (!transaction) return null;
    
    const invoice = transaction.invoiceId
      ? await ctx.db.get(transaction.invoiceId)
      : null;
    
    return { transaction, invoice };
  },
});
```

---

## Settings UI Integration

### Invoice Settings Section

Add to **Settings > Company** page:

```typescript
// Location: app/settings/page.tsx or app/admin/settings/page.tsx

<Card>
  <CardHeader>
    <CardTitle>Invoice Configuration</CardTitle>
    <CardDescription>
      Configure invoice numbering format for all transactions (subscriptions, payments, credits)
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Invoice Prefix */}
    <div className="space-y-2">
      <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
      <Input
        id="invoicePrefix"
        value={invoicePrefix}
        onChange={(e) => setInvoicePrefix(e.target.value)}
        placeholder="INV-"
        maxLength={10}
      />
      <p className="text-sm text-muted-foreground">
        Prefix for all invoice numbers (e.g., INV-, SALE-, BILL-)
      </p>
    </div>

    {/* Invoice Number Format */}
    <div className="space-y-2">
      <Label htmlFor="invoiceNoType">Invoice Number Format</Label>
      <Select value={invoiceNoType} onValueChange={setInvoiceNoType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="year_running">
            Year + Running (e.g., 250001)
          </SelectItem>
          <SelectItem value="year_month_running">
            Year + Month + Running (e.g., 25010001)
          </SelectItem>
          <SelectItem value="year_month_en_running">
            Year + Month Code + Running (e.g., 25JA0001)
          </SelectItem>
          <SelectItem value="full_year_running">
            Full Year + Running (e.g., 20250001)
          </SelectItem>
          <SelectItem value="year_quarter_running">
            Year + Quarter + Running (e.g., 25Q10001)
          </SelectItem>
          <SelectItem value="sequential">
            Sequential Only (e.g., 00000001)
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Format determines when invoice numbers reset
      </p>
    </div>

    {/* Leading Zeros */}
    <div className="space-y-2">
      <Label htmlFor="invoiceLeadingZeros">Leading Zeros</Label>
      <Input
        id="invoiceLeadingZeros"
        type="number"
        min={1}
        max={10}
        value={invoiceLeadingZeros}
        onChange={(e) => setInvoiceLeadingZeros(parseInt(e.target.value))}
      />
      <p className="text-sm text-muted-foreground">
        Number of digits for running number (1-10)
      </p>
    </div>

    {/* Preview */}
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Next Invoice Number</p>
          <p className="text-2xl font-bold text-primary">
            {previewInvoiceNo || "INV-250001"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshPreview}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Preview
        </Button>
      </div>
    </div>

    {/* Current Counter */}
    <div className="space-y-2">
      <Label>Current Counter</Label>
      <div className="flex items-center gap-2">
        <Input
          value={currentCounter}
          disabled
          className="bg-muted"
        />
        <Button
          variant="destructive"
          size="sm"
          onClick={handleResetCounter}
        >
          Reset to 1
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        ⚠️ Warning: Resetting the counter may create duplicate invoice numbers
      </p>
    </div>

    {/* Save Button */}
    <Button onClick={handleSaveInvoiceConfig} className="w-full">
      Save Invoice Configuration
    </Button>
  </CardContent>
</Card>
```

### Settings Page Location

**Recommended:** Add to existing Settings page under Company section

```
Settings
├── Company
│   ├── Company Details
│   ├── Email Settings
│   └── Invoice Configuration  ← NEW SECTION
├── Profile
└── Testing
```

---

## API Implementation

### New Functions to Add

#### 1. Create Invoice for Credit Purchase

```typescript
// convex/invoices/invoiceSystem.ts

export const createCreditInvoice = mutation({
  args: {
    creditLedgerId: v.id("credits_ledger"),
  },
  handler: async (ctx, { creditLedgerId }) => {
    const creditRecord = await ctx.db.get(creditLedgerId);
    if (!creditRecord) throw new Error("Credit record not found");

    // Generate invoice
    const { invoiceNo } = await generateInvoiceNumberInternal(ctx);

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNo,
      companyId: creditRecord.companyId,
      amount: creditRecord.amountPaid || 0,
      currency: creditRecord.currency || "USD",
      status: "paid",
      invoiceType: "credit",
      transactionType: "one_time",
      relatedTransactionId: creditLedgerId,
      relatedTransactionTable: "credits_ledger",
      items: [{
        description: `${creditRecord.tokens} Credits Purchase`,
        quantity: creditRecord.tokens,
        unitPrice: (creditRecord.amountPaid || 0) / creditRecord.tokens,
        total: creditRecord.amountPaid || 0,
      }],
      billingDetails: {
        name: "Customer Name", // Get from user
        email: "customer@email.com", // Get from user
      },
      subtotal: creditRecord.amountPaid || 0,
      total: creditRecord.amountPaid || 0,
      stripePaymentIntentId: creditRecord.stripePaymentIntentId,
      issuedAt: Date.now(),
      paidAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update credit record with invoice reference
    await ctx.db.patch(creditLedgerId, {
      invoiceId,
      invoiceNo,
    });

    return { invoiceId, invoiceNo };
  },
});
```

#### 2. Create Invoice for Subscription

```typescript
export const createSubscriptionInvoice = mutation({
  args: {
    subscriptionTransactionId: v.id("subscription_transactions"),
    amount: v.number(),
    planName: v.string(),
  },
  handler: async (ctx, args) => {
    const subTransaction = await ctx.db.get(args.subscriptionTransactionId);
    if (!subTransaction) throw new Error("Subscription transaction not found");

    const { invoiceNo } = await generateInvoiceNumberInternal(ctx);

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNo,
      companyId: subTransaction.companyId,
      amount: args.amount,
      currency: "USD",
      status: "paid",
      invoiceType: "subscription",
      transactionType: "recurring",
      relatedTransactionId: args.subscriptionTransactionId,
      relatedTransactionTable: "subscription_transactions",
      items: [{
        description: `${args.planName} Subscription`,
        quantity: 1,
        unitPrice: args.amount,
        total: args.amount,
      }],
      billingDetails: {
        name: "Customer Name",
        email: "customer@email.com",
      },
      subtotal: args.amount,
      total: args.amount,
      stripeSubscriptionId: subTransaction.stripeSubscriptionId,
      issuedAt: Date.now(),
      paidAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.subscriptionTransactionId, {
      invoiceId,
      invoiceNo,
      amount: args.amount,
      currency: "USD",
    });

    return { invoiceId, invoiceNo };
  },
});
```

#### 3. Get Invoices by Type

```typescript
export const getInvoicesByType = query({
  args: {
    invoiceType: v.union(
      v.literal("subscription"),
      v.literal("payment"),
      v.literal("credit"),
      v.literal("refund")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_invoiceType", (q) => q.eq("invoiceType", args.invoiceType))
      .order("desc")
      .take(args.limit || 100);
  },
});
```

---

## Use Cases & Examples

### Use Case 1: User Purchases Credits

**Flow:**
1. User buys 100 credits for $10
2. System creates `transactions` record with type="payment"
3. System automatically creates invoice linked to transaction
4. Email sent with invoice number
5. Invoice available for download

**Code:**
```typescript
// After Stripe payment success
const transactionId = await ctx.db.insert("transactions", {
  companyId: user.companyId,
  userId: user._id,
  type: "payment",
  transactionType: "one_time",
  amount: 1000, // cents
  currency: "USD",
  tokens: 100,
  stripePaymentIntentId: paymentIntent.id,
  createdAt: Date.now(),
});

// Generate invoice
const { invoiceNo, invoiceId } = await createInvoiceForTransaction(ctx, { 
  transactionId 
});

// Update transaction with invoice reference
await ctx.db.patch(transactionId, {
  invoiceId,
  invoiceNo,
});

// Send email with invoice number
await sendEmail({
  to: user.email,
  template: "payment_notification",
  variables: {
    invoiceNo,
    payment_amount: "$10.00",
    credits_purchased: "100",
  },
});
```

### Use Case 2: Subscription Renewal

**Flow:**
1. Stripe sends subscription renewal webhook
2. System creates `transactions` record with type="subscription"
3. System automatically creates invoice linked to transaction
4. Email sent with invoice number
5. Invoice available in customer portal

**Code:**
```typescript
// Stripe webhook handler
const transactionId = await ctx.db.insert("transactions", {
  companyId: user.companyId,
  userId: user._id,
  type: "subscription",
  transactionType: "recurring",
  amount: 2900, // cents
  currency: "USD",
  plan: "pro",
  status: "active",
  action: "renewed",
  stripeSubscriptionId: subscription.id,
  stripeCustomerId: customer.id,
  eventType: "invoice.payment_succeeded",
  currentPeriodEnd: subscription.current_period_end,
  createdAt: Date.now(),
});

// Generate invoice
const { invoiceNo, invoiceId } = await createInvoiceForTransaction(ctx, {
  transactionId
});

// Update transaction with invoice reference
await ctx.db.patch(transactionId, {
  invoiceId,
  invoiceNo,
});

// Send email
await sendEmail({
  to: user.email,
  template: "subscription_email",
  variables: {
    invoiceNo,
    plan_name: "Pro Plan",
    amount: "$29.00",
  },
});
```

### Use Case 3: Mixed Transactions

**Timeline:**
```
Jan 1:  User subscribes to Pro ($29)     → INV-250001 (subscription)
Jan 5:  User buys 100 credits ($10)      → INV-250002 (payment)
Feb 1:  Subscription renewal ($29)        → INV-250003 (subscription)
Feb 10: User buys 500 credits ($40)      → INV-250004 (payment)
Mar 1:  Subscription renewal ($29)        → INV-250005 (subscription)
```

All invoices follow same numbering sequence, but can be filtered by `invoiceType`.

---

## Migration Strategy

### Phase 1: Schema Update
1. Add new fields to `invoices` table
2. Add new fields to `credits_ledger` table
3. Add new fields to `subscription_transactions` table
4. Deploy schema changes

### Phase 2: Backfill Existing Data (Optional)
```typescript
// Generate invoices for existing credit purchases
const existingCredits = await ctx.db.query("credits_ledger").collect();
for (const credit of existingCredits) {
  if (!credit.invoiceId) {
    await createCreditInvoice(ctx, { creditLedgerId: credit._id });
  }
}
```

### Phase 3: Update Payment Flows
1. Update credit purchase flow to generate invoice
2. Update subscription webhook to generate invoice
3. Update email templates to include invoice number

### Phase 4: Settings UI
1. Add invoice configuration section to Settings page
2. Implement preview functionality
3. Add counter reset with confirmation

---

## Summary & Recommendation

### ✅ RECOMMENDED APPROACH: Unified Transactions + Invoices (Approach 3)

**Why This is Best:**

1. **Single Source of Truth:** One `transactions` table for all transaction types
2. **Industry Standard:** Most businesses use unified transaction ledgers
3. **Customer-Friendly:** Simple, sequential invoice numbers
4. **Accounting-Friendly:** Single ledger, easy reconciliation
5. **Flexible:** Can filter by `type` for reporting
6. **Scalable:** Easy to add new transaction types
7. **Simple Configuration:** One invoice config to manage
8. **Better Performance:** No joins needed, single table queries
9. **Less Code:** Eliminate duplicate logic for credits_ledger and subscription_transactions

---

## Implementation Checklist

### Phase 1: Schema Updates ✅
- [ ] Add `transactions` table to `convex/schema.ts`
- [ ] Update `invoices` table with `invoiceType`, `transactionType`, `transactionId`
- [ ] Add `invoice_config` table (if not exists)
- [ ] Add indexes for performance

### Phase 2: Core Functions ✅
- [ ] Create `createPaymentTransaction` mutation
- [ ] Create `createSubscriptionTransaction` mutation
- [ ] Create `createInvoiceForTransaction` internal mutation
- [ ] Update `generateInvoiceNumber` to support 7 formats

### Phase 3: Integration Updates ✅
- [ ] Update Stripe webhook handler for subscriptions
- [ ] Update credit purchase flow
- [ ] Update email templates with `{invoiceNo}` variable
- [ ] Add query functions for transactions

### Phase 4: UI & Settings ✅
- [ ] Add Invoice Settings to Settings page
- [ ] Add transaction history view
- [ ] Add invoice download functionality
- [ ] Test all flows end-to-end

### Phase 5: Migration (If Needed) ✅
- [ ] Create migration script for existing `credits_ledger` data
- [ ] Create migration script for existing `subscription_transactions` data
- [ ] Verify data integrity
- [ ] Remove old tables (optional)

---

## Files to Modify

### 1. Schema
- `convex/schema.ts` - Add `transactions` table, update `invoices` table

### 2. Mutations
- `convex/transactions/createTransaction.ts` - New file
- `convex/invoices/createInvoiceForTransaction.ts` - New file
- `convex/invoices/invoiceSystem.ts` - Update to support 7 formats

### 3. Queries
- `convex/transactions/queries.ts` - New file
- `convex/invoices/queries.ts` - Update for new schema

### 4. Webhooks
- `convex/stripe/webhookHandler.ts` - Update subscription events

### 5. Frontend
- `app/settings/page.tsx` - Add Invoice Settings section
- `app/transactions/page.tsx` - New transaction history page
- Email templates - Add `{invoiceNo}` variable

---

## Testing Checklist

### Credit Purchase Flow
- [ ] User purchases credits via Stripe
- [ ] Transaction record created with type="payment"
- [ ] Invoice generated with correct number
- [ ] Credits added to balance
- [ ] Email sent with invoice number
- [ ] Invoice downloadable

### Subscription Flow
- [ ] User subscribes to plan
- [ ] Transaction record created with type="subscription"
- [ ] Invoice generated
- [ ] Email sent with invoice number
- [ ] Renewal works correctly
- [ ] Invoice sequence continues correctly

### Invoice Numbering
- [ ] Test all 7 invoice formats
- [ ] Verify yearly reset works
- [ ] Verify monthly reset works (for applicable formats)
- [ ] Test counter increment
- [ ] Test leading zeros

### Reporting
- [ ] Filter transactions by type
- [ ] Filter invoices by type
- [ ] Export transaction history
- [ ] Verify invoice totals match transaction amounts

**Invoice Number Format Recommendation:**

For most SaaS businesses: **`year_running`** (e.g., `INV-250001`)
- Simple and clean
- Yearly reset keeps numbers manageable
- Easy to remember and communicate
- Professional appearance

For high-volume businesses: **`year_month_running`** (e.g., `INV-25010001`)
- Monthly reset for better organization
- Handles high transaction volumes
- Still readable and professional

---

## Next Steps

1. **Review this document** and confirm the unified approach
2. **Update schema** with new fields
3. **Implement invoice generation** for credits and subscriptions
4. **Add Settings UI** for invoice configuration
5. **Test thoroughly** with different scenarios
6. **Deploy** and monitor

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Author:** StartupKit Development Team
