# Billing & Subscription Approach

## Current Implementation: Custom Stripe Integration

Your SaaS kit uses a **custom Stripe integration** rather than Clerk's billing system. Here's why and how it works:

## Why Custom Stripe Integration?

### Advantages:
1. **Full Control**: Complete control over pricing, plans, and billing logic
2. **Flexibility**: Can implement any pricing model (usage-based, tiered, hybrid)
3. **Credits System**: Built-in credits system for pay-as-you-go features
4. **Multi-tenant**: Proper organization-level billing with Convex
5. **Custom Features**: Can add custom billing features not available in Clerk
6. **No Vendor Lock-in**: Not tied to Clerk's billing limitations

### Clerk Billing Limitations:
- Limited customization options
- Additional costs on top of Clerk subscription
- Less flexibility for complex pricing models
- Harder to implement credits/usage-based billing

## How It Works

### 1. Subscription Plans (Recurring)
- **Free Plan**: MYR 0.00/month - 5 scans
- **Starter Plan**: MYR 9.90/month - 50 scans + Organization
- **Pro Plan**: MYR 29.00/month - 200 scans + AI Summary + Organization

**Flow**:
1. User clicks "Subscribe" on pricing page
2. Creates Stripe Checkout session via `/api/stripe/create-checkout`
3. Stripe processes payment
4. Webhook updates Convex `org_subscriptions` table
5. User gets access to plan features

### 2. Credits System (One-time)
- **100 Credits**: MYR 10.00
- **500 Credits**: MYR 40.00 (Best Value)
- **1000 Credits**: MYR 70.00

**Flow**:
1. User clicks "Buy Now" on billing page
2. Creates Stripe Checkout session for one-time payment
3. Stripe processes payment
4. Webhook adds credits to `credits_ledger` and `credits_balance`
5. Credits available immediately

### 3. Purchase History Tracking
- All credit purchases stored in `credits_ledger`
- Includes: amount, timestamp, transaction ID, metadata
- Displayed on billing page with full transaction details

## Database Schema

### Subscriptions (`org_subscriptions`)
```typescript
{
  companyId: string,
  plan: "free" | "starter" | "pro",
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: "active" | "canceled" | "past_due",
  currentPeriodEnd: number,
}
```

### Credits Ledger (`credits_ledger`)
```typescript
{
  companyId: string,
  amount: number,
  type: "credit" | "debit",
  reason: "purchase" | "usage" | "refund",
  metadata: {
    transactionId?: string,
    // other metadata
  },
  timestamp: number,
}
```

### Credits Balance (`credits_balance`)
```typescript
{
  companyId: string,
  balance: number,
  lastUpdated: number,
}
```

## API Routes

### `/api/stripe/create-checkout`
Creates Stripe Checkout sessions for:
- Subscription plans (recurring)
- Credit purchases (one-time)

### `/api/stripe/webhook`
Handles Stripe events:
- `checkout.session.completed` - Process successful payments
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Handle cancellations
- `invoice.payment_succeeded` - Record successful payments
- `invoice.payment_failed` - Handle failed payments

## Pricing Page vs Billing Page

### Pricing Page (`/pricing`)
- **Purpose**: Marketing and plan selection
- **Shows**: All available plans and credit packages
- **Actions**: Subscribe to plans, buy credits
- **Audience**: Both logged-in and public users

### Billing Page (`/dashboard/billing`)
- **Purpose**: Account management
- **Shows**: Current subscription, credits balance, purchase history
- **Actions**: Change plan, buy more credits, view invoices
- **Audience**: Logged-in users only

## Why They Look Different

Your pricing page shows **3 plans** (Free, Starter, Pro) because that's your actual pricing structure.

Clerk's billing would show their own pricing tiers, which don't match your custom plans. By using custom Stripe integration, you have:
- ✅ Your own pricing (MYR 9.90, MYR 29.00)
- ✅ Your own features (scans, organization, AI)
- ✅ Credits system
- ✅ Full control

## Recommendations

### Keep Custom Stripe Integration If:
- ✅ You need credits/usage-based billing
- ✅ You want full control over pricing
- ✅ You need complex billing logic
- ✅ You want to avoid additional Clerk costs

### Consider Clerk Billing Only If:
- ❌ You want simple subscription-only billing
- ❌ You don't need credits system
- ❌ You're okay with limited customization
- ❌ You want to pay extra for convenience

## Next Steps

1. **Test Stripe Integration**:
   - Set up Stripe test mode
   - Test subscription checkout
   - Test credit purchases
   - Verify webhooks working

2. **Add Payment Methods**:
   - Integrate Stripe Payment Element
   - Allow users to save cards
   - Enable auto-billing

3. **Enhance Purchase History**:
   - Add invoice generation
   - Email receipts
   - Export to PDF

4. **Usage Tracking**:
   - Track scan usage
   - Deduct credits automatically
   - Send usage alerts

## Conclusion

Your current setup with **custom Stripe integration** is the right approach for a flexible, feature-rich SaaS. It gives you complete control over billing, supports both subscriptions and credits, and isn't limited by Clerk's billing constraints.

The pricing page shows your custom plans, which is exactly what you want. Don't worry about matching Clerk's billing - you're using Clerk only for authentication, not billing.
