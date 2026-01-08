# Why Yellow Warning Box Not Showing After Canceling Subscription

## The Problem

You clicked "Cancel Subscription" but the yellow warning box doesn't appear on the billing page.

## Root Cause

The warning box checks for `subscription?.cancelAtPeriodEnd` field, but this field is only updated when:

1. **Stripe sends webhook** `customer.subscription.updated` 
2. **Webhook handler** updates Convex database with `cancelAtPeriodEnd: true`

## What's Happening

When you cancel via the cancel button:
1. ✅ API calls Stripe to set `cancel_at_period_end = true`
2. ✅ Stripe updates the subscription
3. ❌ **Stripe webhook may not fire immediately** or may fail
4. ❌ Database not updated with `cancelAtPeriodEnd` flag
5. ❌ Warning box doesn't show

## How to Fix

### Step 1: Check Stripe Webhook Configuration

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Find your webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Check if it's **enabled**
4. Check **Recent events** for `customer.subscription.updated`

### Step 2: Verify Webhook Events

Make sure your webhook is listening for:
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `checkout.session.completed`

### Step 3: Test Webhook Locally

If testing locally, use Stripe CLI:

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger the event
stripe trigger customer.subscription.updated
```

### Step 4: Check Webhook Logs

**In Stripe Dashboard:**
1. Webhooks → Your endpoint → Recent events
2. Look for `customer.subscription.updated` after canceling
3. Check if it shows "Success" or "Failed"
4. If failed, check error message

### Step 5: Manual Database Update (Temporary Fix)

If webhook isn't working, manually update the database:

**In Convex Dashboard:**
1. Go to Data tab
2. Find `org_subscriptions` table
3. Find your subscription record
4. Click Edit
5. Set `cancelAtPeriodEnd` to `true`
6. Save
7. Refresh billing page - warning should appear

## Long-term Solution

### Option 1: Update Database Immediately (Recommended)

Modify the cancel API to update Convex directly instead of waiting for webhook:

**File**: `app/api/stripe/cancel-subscription/route.ts`

Add after Stripe call:

```typescript
// Cancel the subscription at period end
const subscription = await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true,
});

// IMMEDIATELY update Convex database
const companyId = subscription.metadata?.companyId;
if (companyId) {
  await convex.mutation(api.subscriptions.upsertSubscription, {
    companyId,
    plan: subscription.items.data[0].price.id === env.PRO_MONTHLY_PRICE_ID ? "pro" : "starter",
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: true,  // Set this immediately
    status: subscription.status,
  });
}
```

### Option 2: Force Webhook Trigger

After canceling, trigger webhook manually:

```typescript
// In cancel API, after updating subscription
await fetch(`${process.env.STRIPE_WEBHOOK_URL}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'customer.subscription.updated',
    data: { object: subscription }
  })
});
```

## How to Know When Plan Period Ends

### Current Behavior

The system shows when the plan ends in two places:

1. **Billing Page** - "Next billing date" field
2. **Yellow Warning Box** - "Your subscription will end on [date]"

### What Happens When Period Ends

**Automatic Process:**
1. Stripe sends `customer.subscription.deleted` webhook
2. Webhook handler sets plan to "free"
3. User loses access to paid features
4. Yellow warning disappears
5. Plan shows as "Free"

**No Notification:**
- Currently, there's NO email or notification when plan ends
- User must check billing page to see status

### Add Email Notification (Optional)

To notify users when plan ends, add to webhook handler:

**File**: `app/api/stripe/webhook/route.ts`

In `customer.subscription.deleted` case:

```typescript
case "customer.subscription.deleted": {
  const sub = event.data.object as any;
  const companyId = sub.metadata?.companyId;
  
  // Update to free plan
  await convex.mutation(api.subscriptions.upsertSubscription, {
    companyId: companyId || "",
    plan: "free",
    // ...
  });
  
  // Send notification email (add this)
  const userEmail = sub.metadata?.userEmail;
  if (userEmail) {
    await fetch(`${env.N8N_BASE_URL}${env.N8N_SUPPORT_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'subscription_ended',
        email: userEmail,
        plan: 'free',
        message: 'Your subscription has ended. You have been downgraded to the Free plan.',
      }),
    });
  }
  break;
}
```

## Quick Checklist

To see yellow warning box after canceling:

- [ ] Stripe webhook endpoint configured
- [ ] Webhook secret in `.env.local` is correct
- [ ] Webhook listening for `customer.subscription.updated`
- [ ] Webhook handler updates `cancelAtPeriodEnd` field
- [ ] Database has `cancelAtPeriodEnd` field in schema
- [ ] Billing page checks `subscription?.cancelAtPeriodEnd`
- [ ] Page refreshed after canceling

## Testing Steps

1. **Cancel subscription** on billing page
2. **Wait 5-10 seconds** for webhook
3. **Refresh page** (hard refresh: Ctrl+Shift+R)
4. **Check for yellow warning box**
5. If not showing, check Stripe webhook logs
6. If webhook failed, check error message
7. If webhook succeeded, check Convex database

## Current Implementation Status

✅ Schema has `cancelAtPeriodEnd` field
✅ Webhook handler includes `cancelAtPeriodEnd` 
✅ Billing page shows warning if `cancelAtPeriodEnd` is true
❌ Cancel API doesn't update database immediately (relies on webhook)

**Recommendation**: Implement Option 1 (update database immediately) for instant feedback.
