# Fix Clerk Authentication Error

## The Error
```
Failed to authenticate: "No auth provider found matching the given token. 
Check that your JWT's issuer and audience match one of your configured providers: 
[OIDC(domain=https://your-app.clerk.accounts.dev, app_id=convex)]"
```

## The Problem
The placeholder domain `https://your-app.clerk.accounts.dev` needs to be replaced with YOUR ACTUAL Clerk domain.

## How to Fix

### Step 1: Find Your Clerk JWT Issuer Domain

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Find **JWT Issuer Domain** - it looks like:
   - `https://[your-app-name].clerk.accounts.dev` OR
   - `https://clerk.[your-domain].com` (if using custom domain)

### Step 2: Set It in Convex

Run this command with YOUR actual domain:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://[YOUR-ACTUAL-DOMAIN].clerk.accounts.dev"
```

Example:
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://startupkit-abc123.clerk.accounts.dev"
```

### Step 3: Also Add to .env.local

Add this line to your `.env.local` file:
```
CLERK_JWT_ISSUER_DOMAIN=https://[YOUR-ACTUAL-DOMAIN].clerk.accounts.dev
```

### Step 4: Restart Convex Dev

After setting the variable, restart the Convex dev server:
```bash
# Stop the current process (Ctrl+C)
npx convex dev
```

## Verification

Once fixed, you should see:
```
✔ Convex functions ready!
```

And authentication will work when you sign in.
