# Troubleshooting Subscription Cancellation

## Issue: After Canceling Subscription, Plan Still Shows as "Starter"

### Why This Happens

When you cancel a subscription in Stripe, the behavior is:

1. **Immediate**: Stripe sets `cancel_at_period_end = true`
2. **User Keeps Access**: User continues to have paid plan access until billing period ends
3. **At Period End**: Stripe sends `customer.subscription.deleted` webhook
4. **Then Downgrade**: System changes plan to "free"

**This is by design** - you keep access to your paid features until the billing period you already paid for ends.

### Expected Behavior

#### Right After Canceling:
- ✅ Plan: Still shows "Starter" (or whatever you paid for)
- ✅ Status: "Subscription Canceling" warning appears
- ✅ Access: You still have full Starter features
- ✅ Next Billing: Shows when subscription ends

#### After Billing Period Ends:
- ✅ Plan: Automatically changes to "Free"
- ✅ Access: Downgraded to Free plan features
- ✅ Status: No longer shows cancellation warning

### How to Check If Cancellation Worked

1. **Check Billing Page** - Should show:
   - ⚠️ Yellow warning box: "Subscription Canceling"
   - Next billing date (when it will end)
   - "Cancel Subscription" button should be hidden

2. **Check Stripe Dashboard**:
   - Go to Stripe Dashboard → Customers
   - Find your customer
   - Check subscription - should show "Cancels on [date]"

3. **Check Convex Database**:
   - Table: `org_subscriptions`
   - Field: `cancelAtPeriodEnd` should be `true`
   - Field: `plan` still shows "starter" (until period ends)

### Common Issues

#### Issue 1: Webhook Not Received

**Symptom**: Clicked cancel, but no warning appears on billing page

**Cause**: Stripe webhook `customer.subscription.updated` not received

**Fix**:
1. Check Stripe webhook endpoint is configured: `https://yourdomain.com/api/stripe/webhook`
2. Check webhook secret is correct in `.env.local`
3. Check Stripe Dashboard → Developers → Webhooks → Recent events
4. Look for `customer.subscription.updated` event
5. If failed, check error message

**Manual Fix**:
```bash
# Trigger webhook manually from Stripe CLI
stripe trigger customer.subscription.updated
```

#### Issue 2: cancelAtPeriodEnd Not Syncing

**Symptom**: Subscription canceled in Stripe, but database not updated

**Cause**: Webhook handler not updating `cancelAtPeriodEnd` field

**Check**: File `app/api/stripe/webhook/route.ts` line 119:
```typescript
cancelAtPeriodEnd: sub.cancel_at_period_end || false,
```

This line should exist in the `customer.subscription.updated` case.

#### Issue 3: Plan Not Changing to Free After Period Ends

**Symptom**: Billing period ended, but still shows "Starter"

**Cause**: `customer.subscription.deleted` webhook not handled

**Check**: File `app/api/stripe/webhook/route.ts` line 138-163:
```typescript
case "customer.subscription.deleted": {
  const sub = event.data.object as any;
  const companyId = sub.metadata?.companyId;
  
  await convex.mutation(api.subscriptions.upsertSubscription, {
    companyId: companyId || "",
    plan: "free",  // This should set plan to free
    // ...
  });
}
```

### Testing Cancellation Flow

#### Test 1: Cancel Subscription
1. Go to Billing page
2. Click "Cancel Subscription"
3. Confirm cancellation
4. **Expected**: Yellow warning box appears
5. **Expected**: "Cancel Subscription" button disappears

#### Test 2: Check Database
```javascript
// In Convex dashboard, run query:
db.query("org_subscriptions")
  .filter(q => q.eq(q.field("companyId"), "YOUR_COMPANY_ID"))
  .first()

// Should return:
{
  plan: "starter",  // Still starter until period ends
  cancelAtPeriodEnd: true,  // This should be true
  currentPeriodEnd: 1234567890,  // Unix timestamp
  status: "active"  // Still active until period ends
}
```

#### Test 3: Simulate Period End
Use Stripe CLI to trigger subscription deletion:

```bash
stripe trigger customer.subscription.deleted
```

Then check database - plan should now be "free".

### Force Immediate Cancellation

If you want to cancel immediately (not at period end), modify the cancel API:

**File**: `app/api/stripe/cancel-subscription/route.ts`

Change from:
```typescript
const subscription = await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: true,  // Cancel at period end
});
```

To:
```typescript
const subscription = await stripe.subscriptions.cancel(subscriptionId);  // Cancel immediately
```

**Warning**: This will immediately revoke access, even if user already paid for the month.

### Webhook Events to Monitor

1. **customer.subscription.updated** - When cancel_at_period_end is set
   - Updates `cancelAtPeriodEnd` field
   - Plan stays the same
   
2. **customer.subscription.deleted** - When subscription actually ends
   - Changes plan to "free"
   - Removes subscription access

### Debug Checklist

- [ ] Stripe webhook endpoint configured
- [ ] Webhook secret in `.env.local` is correct
- [ ] Webhook handler includes `cancelAtPeriodEnd` field
- [ ] Database schema has `cancelAtPeriodEnd` field
- [ ] Billing page checks `subscription?.cancelAtPeriodEnd`
- [ ] Warning box appears when `cancelAtPeriodEnd` is true
- [ ] `customer.subscription.deleted` case sets plan to "free"

### Viewing Webhook Logs

**Stripe Dashboard**:
1. Go to Developers → Webhooks
2. Click on your webhook endpoint
3. View "Recent events"
4. Check for `customer.subscription.updated` and `customer.subscription.deleted`

**Convex Logs**:
1. Go to Convex Dashboard
2. Click "Logs" tab
3. Filter by "webhook" or "subscription"
4. Check for mutation calls to `subscriptions.upsertSubscription`

### Still Not Working?

If cancellation still doesn't work after checking all above:

1. **Check Stripe Subscription Status**:
   - Go to Stripe Dashboard
   - Find your customer
   - Check if subscription shows "Cancels on [date]"

2. **Manually Update Database**:
   ```javascript
   // In Convex dashboard
   const sub = await db.query("org_subscriptions")
     .filter(q => q.eq(q.field("companyId"), "YOUR_COMPANY_ID"))
     .first();
   
   await db.patch(sub._id, {
     cancelAtPeriodEnd: true
   });
   ```

3. **Check Webhook Delivery**:
   - Stripe Dashboard → Webhooks → Recent events
   - Look for failed deliveries
   - Check error messages

4. **Test Webhook Locally**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger customer.subscription.updated
   ```
