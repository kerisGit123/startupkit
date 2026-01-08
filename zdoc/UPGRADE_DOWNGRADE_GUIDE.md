# Upgrade & Downgrade Guide

## Can Users Upgrade or Downgrade Plans?

**YES** - Users can upgrade or downgrade between plans at any time.

## How It Works

### Upgrading (e.g., Starter → Pro)

1. User goes to `/pricing` page
2. Clicks "Subscribe" button on Pro plan
3. Redirected to Stripe checkout
4. After payment:
   - Stripe creates new subscription
   - Webhook updates plan to "pro"
   - Old subscription is replaced
   - User immediately gets Pro features

### Downgrading (e.g., Pro → Starter)

1. User goes to `/pricing` page
2. Clicks "Subscribe" button on Starter plan
3. Redirected to Stripe checkout
4. After payment:
   - Stripe creates new subscription
   - Webhook updates plan to "starter"
   - Old subscription is replaced
   - User immediately gets Starter features

### Canceling (Any Plan → Free)

1. User goes to `/dashboard/billing`
2. Clicks "Cancel Subscription"
3. Subscription set to cancel at period end
4. User keeps access until billing period ends
5. At period end:
   - Stripe sends `customer.subscription.deleted`
   - Webhook updates plan to "free"
   - User gets Free plan features

## Current Implementation

### Pricing Page Behavior

**When user has NO subscription (Free plan)**:
- Free: Shows "Free Forever" (disabled)
- Starter: Shows "Subscribe" button
- Pro: Shows "Subscribe" button

**When user has Starter subscription**:
- Free: Shows "Free Forever" (disabled)
- Starter: Shows "Current Plan" badge + "Manage Subscription" + "Cancel Plan"
- Pro: Shows "Subscribe" button (allows upgrade)

**When user has Pro subscription**:
- Free: Shows "Free Forever" (disabled)
- Starter: Shows "Subscribe" button (allows downgrade)
- Pro: Shows "Current Plan" badge + "Manage Subscription" + "Cancel Plan"

**When user has CANCELED subscription (still active until period end)**:
- Shows "Current Plan" on the plan they're still using
- Shows "Manage Subscription" and "Cancel Plan" buttons
- This is CORRECT - they still have access until period ends

### What Happens When Upgrading/Downgrading

**Stripe Behavior**:
- Creates new subscription
- Cancels old subscription
- Prorates charges (user pays difference)
- Updates immediately

**Your System**:
- Webhook receives `checkout.session.completed`
- Updates `org_subscriptions` table with new plan
- Records transaction in `subscription_transactions`
- User gets new entitlements immediately

## Subscription History Tracking

### Current Status

**What's Tracked**:
- ✅ Subscription created (`checkout_completed`)
- ✅ Subscription updated (`customer.subscription.updated`)
- ✅ Subscription deleted (`customer.subscription.deleted`)
- ✅ **NEW**: Subscription canceled (`subscription.canceled`) - user action

**What's Displayed**:
- Current subscription status
- Renewal/cancellation date
- Link to Stripe dashboard

### What Should Be Tracked

**Recommended Events**:
1. **Subscription Created** - User subscribes to a plan
2. **Subscription Upgraded** - User moves to higher plan
3. **Subscription Downgraded** - User moves to lower plan
4. **Subscription Canceled** - User cancels (but keeps access)
5. **Subscription Deleted** - Subscription actually ends
6. **Subscription Reactivated** - User resubscribes after canceling

## Is Current Behavior Correct?

### ✅ YES - Cancellation Not Showing in History is INTENTIONAL

**Why**:
- The current "Subscription History" section shows the **current subscription**
- It's not a full audit log of all events
- It shows status: "Active" and "Cancels on: [date]"

**This is correct because**:
- User can see cancellation status in yellow warning box
- User can see "Cancels on" date in subscription history
- Full audit log is in `subscription_transactions` table (backend)

### ❌ NO - Should Show Full History

**If you want to show full history**:
- Display all events from `subscription_transactions` table
- Show: Created, Upgraded, Downgraded, Canceled, Deleted
- Show timestamps for each event
- Show plan changes over time

## Recommendation

### Option 1: Keep Current Behavior (Simple)
- Shows current subscription only
- Cancellation visible via warning box + "Cancels on" date
- Clean, simple UI
- **Good for most users**

### Option 2: Add Full History (Detailed)
- Create new query to fetch `subscription_transactions`
- Display timeline of all subscription events
- Show plan changes, cancellations, upgrades
- **Good for power users who want full audit trail**

## Implementation for Full History

### Step 1: Create Query

**File**: `convex/subscriptions.ts`

```typescript
export const getSubscriptionHistory = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const transactions = await ctx.db
      .query("subscription_transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .order("desc")
      .take(50);
    return transactions;
  },
});
```

### Step 2: Display on Billing Page

**File**: `app/dashboard/billing/page.tsx`

```typescript
const subscriptionHistory = useQuery(
  api.subscriptions.getSubscriptionHistory,
  companyId ? { companyId } : "skip"
);

// Then display:
{subscriptionHistory?.map((event) => (
  <div key={event._id}>
    <p>{event.action}</p>
    <p>{event.plan}</p>
    <p>{new Date(event.createdAt).toLocaleDateString()}</p>
  </div>
))}
```

## Summary

**Current Behavior**:
- ✅ Users CAN upgrade/downgrade
- ✅ Cancellation works correctly
- ✅ Current subscription shows in history
- ❌ Full event history not displayed (but tracked in database)

**Recommendation**:
- Keep current simple UI for most users
- Optionally add "View Full History" link that expands to show all events
- This gives flexibility without cluttering the UI

**Your Choice**:
1. **Keep as is** - Simple, clean, works well
2. **Add full history** - More detailed, better audit trail
