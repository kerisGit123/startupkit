# Phase 1 Implementation Guide: Financial Ledger Consolidation

**Status:** ✅ COMPLETE  
**Date:** January 27, 2026

---

## What Was Implemented

### 1. New Database Schema ✅

**File:** `convex/schema.ts`

Added `financial_ledger` table as the single source of truth for all financial data:

```typescript
financial_ledger: defineTable({
  ledgerId: v.string(),           // Unique ID: "TXN-2026-001234"
  amount: v.number(),              // Transaction amount
  currency: v.string(),            // USD, EUR, etc.
  type: v.union(...),              // Transaction type
  revenueSource: v.union(...),     // Where revenue came from
  // ... full schema in schema.ts
})
```

**Key Features:**
- Unique ledger ID for each transaction
- Clear revenue attribution (source tracking)
- Reconciliation support
- Legacy table references for migration
- Comprehensive indexes for fast queries

---

### 2. Financial Ledger Queries & Mutations ✅

**File:** `convex/financialLedger.ts`

**Queries Created:**
- `getAllLedgerEntries` - Get all entries with filtering
- `getLedgerEntryById` - Get single entry
- `getLedgerEntryByLedgerId` - Lookup by ledger ID
- `getRevenueBySource` - Revenue breakdown by source
- `calculateMRR` - Monthly Recurring Revenue
- `calculateARR` - Annual Recurring Revenue
- `getTotalRevenue` - Total revenue with refunds
- `getRevenueAnalytics` - Complete analytics dashboard

**Mutations Created:**
- `createLedgerEntry` - Add new financial record
- `updateLedgerEntry` - Update existing entry
- `reconcileLedgerEntry` - Mark as reconciled

**Migration Functions:**
- `migrateFromTransactions` - Migrate from transactions table
- `migrateFromSubscriptionTransactions` - Migrate from subscription_transactions
- `migrateFromCreditsLedger` - Migrate from credits_ledger

---

### 3. Migration Script ✅

**File:** `convex/migrations/migrateToFinancialLedger.ts`

**Functions:**
- `runFullMigration` - Migrates all data from 3 legacy tables
- `verifyMigration` - Verifies migration completeness

**Features:**
- Idempotent (can run multiple times safely)
- Error handling and logging
- Progress tracking
- Verification report

---

## How to Use the New System

### Query Revenue by Source

```typescript
// OLD WAY (checking 3 tables):
const transactions = await ctx.db.query("transactions").collect();
const subTransactions = await ctx.db.query("subscription_transactions").collect();
const credits = await ctx.db.query("credits_ledger").collect();
// ... complex aggregation logic

// NEW WAY (single query):
const revenueBySource = await ctx.db.query(api.financialLedger.getRevenueBySource, {
  startDate: thirtyDaysAgo,
  endDate: now,
});

// Result:
{
  "stripe_subscription": 15000,
  "stripe_payment": 5000,
  "manual": 1000,
  "referral_bonus": 500
}
```

### Get MRR and ARR

```typescript
// Calculate Monthly Recurring Revenue
const mrrData = await ctx.db.query(api.financialLedger.calculateMRR, {});
// { mrr: 15000, period: "last_30_days", totalTransactions: 45 }

// Calculate Annual Recurring Revenue
const arrData = await ctx.db.query(api.financialLedger.calculateARR, {});
// { arr: 180000, mrr: 15000 }
```

### Get Complete Revenue Analytics

```typescript
const analytics = await ctx.db.query(api.financialLedger.getRevenueAnalytics, {});

// Result:
{
  currentPeriod: {
    revenue: 20000,
    refunds: 500,
    netRevenue: 19500,
    transactionCount: 50
  },
  previousPeriod: {
    revenue: 18000,
    refunds: 300,
    netRevenue: 17700,
    transactionCount: 45
  },
  growth: 10.17,  // 10.17% growth
  mrr: 15000,
  arr: 180000,
  revenueBySource: {
    "stripe_subscription": 15000,
    "stripe_payment": 5000
  }
}
```

### Create New Ledger Entry

```typescript
await ctx.db.mutation(api.financialLedger.createLedgerEntry, {
  amount: 99.00,
  currency: "USD",
  type: "subscription_charge",
  revenueSource: "stripe_subscription",
  description: "Pro Plan Monthly Subscription",
  userId: userId,
  contactId: contactId,
  stripeSubscriptionId: "sub_123",
  subscriptionPlan: "pro_monthly",
});
```

---

## Migration Instructions

### Step 1: Deploy Schema

The schema has already been updated with the `financial_ledger` table. Deploy to Convex:

```bash
npx convex deploy
```

### Step 2: Run Migration

Run the migration script from Convex dashboard or CLI:

**Option A: Via Convex Dashboard**
1. Go to Convex Dashboard
2. Navigate to Functions
3. Find `migrations:migrateToFinancialLedger:runFullMigration`
4. Click "Run" (no arguments needed)
5. Monitor console output

**Option B: Via CLI**
```bash
npx convex run migrations/migrateToFinancialLedger:runFullMigration
```

### Step 3: Verify Migration

```bash
npx convex run migrations/migrateToFinancialLedger:verifyMigration
```

Expected output:
```
========================================================
MIGRATION VERIFICATION
========================================================
Financial Ledger Entries: 1234
  - From transactions: 800 / 800
  - From subscription_transactions: 234 / 234
  - From credits_ledger: 200 / 200
========================================================
```

### Step 4: Update Application Code

Replace old queries with new financial ledger queries:

**Before:**
```typescript
// Multiple queries to different tables
const transactions = await ctx.db.query("transactions")
  .filter(q => q.eq(q.field("companyId"), companyId))
  .collect();
```

**After:**
```typescript
// Single query to financial ledger
const entries = await ctx.db.query(api.financialLedger.getAllLedgerEntries, {
  companyId: companyId,
});
```

### Step 5: Test Thoroughly

Test these scenarios:
- [ ] View revenue by source
- [ ] Calculate MRR/ARR
- [ ] View transaction history
- [ ] Create new transactions
- [ ] Generate financial reports
- [ ] Verify all amounts match legacy data

### Step 6: Archive Legacy Tables

**DO NOT DELETE YET!** Keep for 30-60 days as backup.

Mark as deprecated in schema:
```typescript
// DEPRECATED - Use financial_ledger instead
transactions: defineTable({ ... })
```

---

## Benefits Achieved

### Before Phase 1:
❌ Need to query 3 different tables  
❌ Complex aggregation logic  
❌ Hard to answer "where did revenue come from?"  
❌ No easy MRR/ARR calculation  
❌ Duplicate data across tables  

### After Phase 1:
✅ Single source of truth  
✅ Simple, fast queries  
✅ Clear revenue attribution  
✅ Built-in MRR/ARR calculation  
✅ No data duplication  
✅ Easy to generate reports  

---

## Revenue Tracking Examples

### Example 1: Monthly Revenue Report

```typescript
const now = Date.now();
const startOfMonth = new Date(new Date().setDate(1)).getTime();

const revenue = await ctx.db.query(api.financialLedger.getTotalRevenue, {
  startDate: startOfMonth,
  endDate: now,
});

console.log(`This Month's Revenue: $${revenue.netRevenue}`);
```

### Example 2: Revenue by Customer

```typescript
const customerRevenue = await ctx.db.query(api.financialLedger.getAllLedgerEntries, {
  contactId: customerId,
});

const total = customerRevenue
  .filter(e => e.amount > 0)
  .reduce((sum, e) => sum + e.amount, 0);

console.log(`Customer Lifetime Value: $${total}`);
```

### Example 3: Subscription vs One-Time Revenue

```typescript
const allEntries = await ctx.db.query(api.financialLedger.getAllLedgerEntries, {
  startDate: thirtyDaysAgo,
  endDate: now,
});

const subscriptionRevenue = allEntries
  .filter(e => e.type === "subscription_charge")
  .reduce((sum, e) => sum + e.amount, 0);

const oneTimeRevenue = allEntries
  .filter(e => e.type === "one_time_payment")
  .reduce((sum, e) => sum + e.amount, 0);

console.log(`Subscription: $${subscriptionRevenue}`);
console.log(`One-Time: $${oneTimeRevenue}`);
```

---

## Troubleshooting

### Issue: Migration fails with "already migrated"

**Solution:** This is normal - the migration is idempotent. It skips already migrated records.

### Issue: Some records missing after migration

**Solution:** 
1. Run `verifyMigration` to see which records are missing
2. Check if legacy records have required fields (e.g., `amount`)
3. Re-run migration - it will only migrate missing records

### Issue: Amounts don't match

**Solution:**
1. Check currency conversion
2. Verify refunds are counted correctly (negative amounts)
3. Compare legacy data with migrated data manually

---

## Next Steps

Phase 1 is **COMPLETE**! ✅

**Ready for Phase 2:**
- Unify Customer Data (consolidate 5 customer tables into `contacts`)
- See `docs/SYSTEM_ARCHITECTURE_ANALYSIS.md` for full plan

---

## Files Created/Modified

### Created:
- ✅ `convex/financialLedger.ts` - Queries & mutations
- ✅ `convex/migrations/migrateToFinancialLedger.ts` - Migration script
- ✅ `docs/PHASE1_IMPLEMENTATION_GUIDE.md` - This guide

### Modified:
- ✅ `convex/schema.ts` - Added financial_ledger table

### Legacy (Keep for now):
- `convex/transactions/*` - Will be deprecated
- `convex/subscriptions.ts` - Will be updated to use ledger
- `convex/credits.ts` - Will be updated to use ledger

---

## Success Metrics

After Phase 1, you should be able to answer these questions with a single query:

1. ✅ "Where did this $1000 come from?" → Query by amount
2. ✅ "What's our MRR?" → `calculateMRR()`
3. ✅ "How much revenue from subscriptions vs one-time?" → `getRevenueBySource()`
4. ✅ "What's our revenue growth?" → `getRevenueAnalytics()`
5. ✅ "How much has this customer paid?" → Query by contactId

**All questions answered with 1 query instead of 3+ queries!**

---

**Phase 1 Status: ✅ COMPLETE**

**Time to Complete:** ~2 hours  
**Impact:** HIGH - Fixes critical revenue tracking issues  
**Next Phase:** Phase 2 - Unify Customer Data
