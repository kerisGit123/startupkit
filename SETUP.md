# StartupKit SaaS Setup Guide

## Quick Start (Steps 1-5)

### Step 1: Install Dependencies ✅

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Step 2: Configure Environment Variables

Create or update your `.env.local` file with the following required variables:

```bash
# ============================================
# Clerk Authentication (REQUIRED)
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# ============================================
# Convex Database (REQUIRED)
# ============================================
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=xxx  # For CI/CD only

# ============================================
# Stripe Payments (REQUIRED)
# ============================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs (create in Stripe Dashboard)
STARTER_MONTHLY_PRICE_ID=price_xxx
PRO_MONTHLY_PRICE_ID=price_xxx
STARTER_YEARLY_PRICE_ID=price_xxx
PRO_YEARLY_PRICE_ID=price_xxx

# ============================================
# N8N Automation (OPTIONAL)
# ============================================
N8N_BASE_URL=https://your-n8n-instance.com
N8N_SCAN_WEBHOOK_PATH=/webhook/scan
N8N_CALLBACK_SHARED_SECRET=your-strong-secret-min-16-chars
N8N_CALLBACK_URL=https://your-app.com/api/n8n/callback

# ============================================
# Feature Limits (OPTIONAL)
# ============================================
FREE_STORAGE_MB=10
STARTER_STORAGE_MB=100
PRO_STORAGE_MB=300
```

### Step 3: Initialize Convex

Run Convex development server to deploy the schema:

```bash
npx convex dev
```

This will:
- Create your Convex project (if not exists)
- Deploy the multi-tenant schema
- Set up authentication with Clerk
- Generate TypeScript types

**Note:** Keep this running in a separate terminal.

### Step 4: Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing
3. Copy API keys to `.env.local`
4. Configure webhooks:
   - Go to **Webhooks** → **Add Endpoint**
   - URL: `https://your-app.com/api/clerk/webhook`
   - Subscribe to events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
     - `organizationMembership.created`
     - `organizationMembership.updated`
   - Copy webhook secret to `CLERK_WEBHOOK_SECRET`

5. Enable Organizations:
   - Go to **Organizations** → Enable
   - Configure organization settings as needed

### Step 5: Set Up Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy API keys to `.env.local`
3. Create Products:
   - **Starter Plan**: MYR 9.90/month
   - **Pro Plan**: MYR 29.00/month
   - Copy Price IDs to `.env.local`

4. Configure webhooks:
   - Go to **Developers** → **Webhooks** → **Add Endpoint**
   - URL: `https://your-app.com/api/stripe/webhook`
   - Subscribe to events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture Overview

### Multi-Tenant Model
- **Tenant ID**: `companyId` (either Clerk `org_xxx` or `user_xxx`)
- **Isolation**: Row-level via `companyId` field in all tables
- **Context Resolution**: `useCompany()` hook derives tenant from Clerk

### Key Files Created

#### Convex Backend
- `convex/schema.ts` - Multi-tenant database schema
- `convex/auth.config.ts` - Clerk authentication config
- `convex/users.ts` - User management mutations
- `convex/settings.ts` - Organization settings
- `convex/subscriptions.ts` - Subscription management
- `convex/credits.ts` - Credits system

#### API Routes
- `app/api/clerk/webhook/route.ts` - Clerk webhook handler
- `app/api/stripe/webhook/route.ts` - Stripe webhook handler
- `app/api/n8n/callback/route.ts` - N8N callback handler

#### React Hooks
- `hooks/useCompany.ts` - Tenant context hook
- `hooks/useSubscription.ts` - Subscription data hook
- `hooks/useFeatures.ts` - Feature gating hook

#### Components
- `components/ConvexClientProvider.tsx` - Convex + Clerk provider
- `components/guards/FeatureGuard.tsx` - Feature access guard

#### Utilities
- `lib/ConvexClient.ts` - Server-side Convex client
- `lib/stripe.ts` - Stripe client
- `lib/env.ts` - Environment validation
- `lib/plans.ts` - Plan configuration
- `lib/utils.ts` - Utility functions

## Usage Examples

### Check User's Subscription

```tsx
import { useSubscription } from "@/hooks/useSubscription";

export function MyComponent() {
  const { plan, entitlements, isLoading } = useSubscription();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Current Plan: {plan}</p>
      <p>Scans Available: {entitlements?.scansPerMonth}</p>
    </div>
  );
}
```

### Feature Gating

```tsx
import { FeatureGuard } from "@/components/guards/FeatureGuard";

export function PremiumFeature() {
  return (
    <FeatureGuard plan="pro">
      <div>This is only visible to Pro users</div>
    </FeatureGuard>
  );
}
```

### Get Current Tenant

```tsx
import { useCompany } from "@/hooks/useCompany";

export function TenantInfo() {
  const { companyId, subjectType } = useCompany();
  
  return (
    <div>
      <p>Tenant ID: {companyId}</p>
      <p>Type: {subjectType}</p>
    </div>
  );
}
```

## Testing Webhooks Locally

Use [ngrok](https://ngrok.com) or [Clerk's webhook testing](https://clerk.com/docs/integrations/webhooks/overview):

```bash
ngrok http 3000
```

Update webhook URLs in Clerk and Stripe dashboards to use the ngrok URL.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform.

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing Convex types:
1. Make sure `npx convex dev` is running
2. Wait for Convex to regenerate types
3. Restart your IDE/editor

### Webhook Verification Failed

- Check that webhook secrets match in `.env.local`
- Verify webhook URLs are correct
- Check webhook logs in Clerk/Stripe dashboard

### Authentication Issues

- Verify Clerk keys are correct
- Check that `CLERK_JWT_ISSUER_DOMAIN` matches your Clerk instance
- Ensure middleware is configured correctly

## Next Steps

1. Customize the schema in `convex/schema.ts` for your business logic
2. Update plan features in `lib/plans.ts`
3. Create your app pages and components
4. Set up N8N workflows (optional)
5. Deploy to production

## Support

- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
