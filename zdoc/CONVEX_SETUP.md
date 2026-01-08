# Convex Setup Instructions

## Current Status

Your Convex project **"startupkit"** is already initialized and running, but it needs environment variables configured.

## Required Environment Variables

### 1. Set Clerk JWT Issuer Domain

Convex needs this to verify Clerk authentication tokens.

**How to find it:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Look for **JWT Issuer Domain** (usually looks like: `https://your-app.clerk.accounts.dev`)

**Set it in Convex:**

Option A - Via Convex Dashboard:
```
1. Go to: https://dashboard.convex.dev/d/watchful-ferret-363/settings/environment-variables
2. Add variable: CLERK_JWT_ISSUER_DOMAIN
3. Value: https://your-app.clerk.accounts.dev (replace with your actual domain)
```

Option B - Via CLI:
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
```

### 2. Optional: Storage Limits

Set these in Convex dashboard if you want to override defaults:

```bash
npx convex env set FREE_STORAGE_MB 10
npx convex env set STARTER_STORAGE_MB 100
npx convex env set PRO_STORAGE_MB 300
```

## Verify Setup

After setting the environment variable, check the Convex dev terminal. You should see:

```
✔ Convex functions ready!
```

## Current Project Info

- **Project Name**: startupkit
- **Team**: kerisgit123
- **Dashboard**: https://dashboard.convex.dev/d/watchful-ferret-363
- **Deployment**: Development (watchful-ferret-363)

## Schema Deployed

The following tables are configured with multi-tenant isolation:

- ✅ `users` - User management
- ✅ `org_settings` - Tenant configuration
- ✅ `org_subscriptions` - Subscription data
- ✅ `subscription_transactions` - Audit log
- ✅ `credits_ledger` - Credits transactions
- ✅ `credits_balance` - Current credit balance

All tables have `companyId` index for tenant isolation.

## Next Steps

1. **Set CLERK_JWT_ISSUER_DOMAIN** (see above)
2. **Verify Convex is running**: Check terminal for "Convex functions ready!"
3. **Test authentication**: Sign up at http://localhost:3000
4. **Check data**: Visit Convex dashboard to see user data synced

## Troubleshooting

### "Schema file missing default export"
- ✅ Already fixed - `convex/schema.ts` has proper default export

### "Environment variable CLERK_JWT_ISSUER_DOMAIN is used but not set"
- ⚠️ **Action needed**: Set this variable (see instructions above)

### TypeScript errors in IDE
- These will resolve automatically once Convex generates types
- Make sure `npx convex dev` is running

### No data appearing
- Check that Clerk webhook is configured and pointing to your app
- Verify webhook secret matches in `.env.local`
- Check Convex dashboard logs for errors
