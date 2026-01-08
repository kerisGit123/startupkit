# Stripe Setup Guide

## Complete Stripe Integration Setup

This guide will help you set up Stripe products, prices, and webhooks for your SaaS application.

## Step 1: Create Stripe Products & Prices

### Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Click **+ Add Product**

### Create Products

#### Product 1: Starter Plan

1. Click **+ Add Product**
2. Fill in details:
   - **Name**: `Starter Plan`
   - **Description**: `50 scans per month with organization support`
3. Add **Monthly Price**:
   - Click **Add another price**
   - **Price**: `9.90` MYR
   - **Billing period**: `Monthly`
   - **Recurring**: Yes
4. Add **Yearly Price**:
   - Click **Add another price**
   - **Price**: `99.00` MYR
   - **Billing period**: `Yearly`
   - **Recurring**: Yes
5. Click **Save product**
6. **Copy both Price IDs** (format: `price_xxxxxxxxxxxxx`)

#### Product 2: Pro Plan

1. Click **+ Add Product**
2. Fill in details:
   - **Name**: `Pro Plan`
   - **Description**: `200 scans per month with AI summary and organization`
3. Add **Monthly Price**:
   - Click **Add another price**
   - **Price**: `29.00` MYR
   - **Billing period**: `Monthly`
   - **Recurring**: Yes
4. Add **Yearly Price**:
   - Click **Add another price**
   - **Price**: `299.00` MYR
   - **Billing period**: `Yearly`
   - **Recurring**: Yes
5. Click **Save product**
6. **Copy both Price IDs**

## Step 2: Add Price IDs to Environment Variables

1. Open your `.env.local` file in the project root
2. Add the Price IDs you copied:

```env
# Stripe Price IDs from Dashboard
STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STARTER_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

3. Replace `price_xxxxxxxxxxxxx` with your actual Price IDs

## Step 3: Configure Stripe Webhook (Important!)

Webhooks are required for subscription updates and credit purchases to work.

### Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Production (Stripe Dashboard)

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **+ Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add to production environment variables

## Step 4: Restart Your Dev Server

```bash
pnpm run dev
```

## How It Works

1. User clicks "Subscribe" button on pricing page
2. Frontend calls `/api/stripe/create-checkout` with plan ID
3. Backend looks up the Stripe Price ID from environment variables
4. Creates Stripe Checkout session
5. Redirects user to Stripe payment page
6. After payment, Stripe webhook updates subscription in Convex
7. User gets access to plan features

## Testing

Use Stripe test mode with test card:
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

## Current Status

✅ Pricing page displays plans correctly
✅ Subscribe buttons call API correctly
❌ **Missing**: Stripe Price IDs in environment variables
❌ **Missing**: Stripe products created in dashboard

Once you add the Price IDs, subscriptions will work!
