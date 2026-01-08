# StartupKit Setup Guide

Complete setup guide for deploying a new SaaS application using this starter kit.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Schema](#database-schema)
3. [One-Command Setup](#one-command-setup)
4. [Manual Setup Steps](#manual-setup-steps)
5. [Environment Variables](#environment-variables)
6. [Verification](#verification)

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- npm or pnpm package manager
- Git installed
- Accounts created for:
  - [Clerk](https://clerk.com) - Authentication
  - [Convex](https://convex.dev) - Database
  - [Stripe](https://stripe.com) - Payments

---

## Database Schema

### Convex Database Structure

The system uses **6 core tables** for multi-tenant SaaS operations:

#### 1. **users** - User Management
```typescript
{
  clerkUserId: string (optional)      // Clerk user ID
  email: string (optional)            // User email
  firstName: string (optional)        // First name
  lastName: string (optional)         // Last name
  fullName: string (optional)         // Full name
  imageUrl: string (optional)         // Profile image URL
  username: string (optional)         // Username
  createdAt: number (optional)        // Creation timestamp
  updatedAt: number (optional)        // Last update timestamp
  deletionTime: number (optional)     // Soft delete timestamp
}

Indexes:
  - by_clerkUserId: [clerkUserId]
  - by_email: [email]
```

#### 2. **org_settings** - Organization/Tenant Configuration
```typescript
{
  companyId: string                   // Organization ID (from Clerk)
  subjectType: "organization" | "user" // Tenant type
  companyName: string (optional)      // Company name
  email: string (optional)            // Company email
  contactNumber: string (optional)    // Contact phone
  address: string (optional)          // Company address
  companyLogoId: Id<"_storage"> (optional) // Logo file ID
  aiEnabled: boolean (optional)       // AI features enabled
  createdAt: number (optional)        // Creation timestamp
  updatedAt: number                   // Last update timestamp
  updatedBy: string                   // User who updated
}

Indexes:
  - by_companyId: [companyId]
```

#### 3. **org_subscriptions** - Subscription Management
```typescript
{
  companyId: string                   // Organization ID
  plan: string                        // Plan: "free", "starter", "pro", "business"
  stripeCustomerId: string (optional) // Stripe customer ID
  stripeSubscriptionId: string (optional) // Stripe subscription ID
  currentPeriodEnd: number (optional) // Unix timestamp (seconds)
  cancelAtPeriodEnd: boolean (optional) // Cancellation flag
  status: string (optional)           // Stripe status: "active", "canceled", etc.
  createdAt: number                   // Creation timestamp
  updatedAt: number                   // Last update timestamp
}

Indexes:
  - by_companyId: [companyId]
  - by_subscription: [stripeSubscriptionId]
```

#### 4. **subscription_transactions** - Subscription Audit Log
```typescript
{
  companyId: string                   // Organization ID
  action: string                      // Action: "created", "updated", "canceled", "deleted"
  plan: string (optional)             // Plan name
  status: string (optional)           // Subscription status
  stripeCustomerId: string (optional) // Stripe customer ID
  stripeSubscriptionId: string (optional) // Stripe subscription ID
  source: string (optional)           // Source: "webhook", "user_action"
  eventType: string (optional)        // Stripe event type
  currentPeriodEnd: number (optional) // Period end timestamp
  createdAt: number                   // Event timestamp
}

Indexes:
  - by_companyId: [companyId]
```

#### 5. **credits_ledger** - Credit Purchase History
```typescript
{
  companyId: string                   // Organization ID
  tokens: number                      // Credits purchased (positive) or used (negative)
  stripePaymentIntentId: string (optional) // Stripe payment ID
  stripeCheckoutSessionId: string (optional) // Stripe checkout session ID
  amountPaid: number (optional)       // Amount in cents
  currency: string (optional)         // Currency code (e.g., "myr", "usd")
  reason: string (optional)           // Reason for credit change
  createdAt: number                   // Transaction timestamp
}

Indexes:
  - by_companyId: [companyId]
```

#### 6. **credits_balance** - Current Credit Balance
```typescript
{
  companyId: string                   // Organization ID
  balance: number                     // Current credit balance
  updatedAt: number                   // Last update timestamp
}

Indexes:
  - by_companyId: [companyId]
```

---

## One-Command Setup

### Quick Start (Automated)

Run the setup script to configure everything automatically:

```bash
npm run setup
```

This script will:
1. ✅ Install all dependencies
2. ✅ Initialize Convex database
3. ✅ Deploy Convex schema
4. ✅ Create `.env.local` template
5. ✅ Guide you through API key setup

---

## Manual Setup Steps

If you prefer manual setup or the automated script fails:

### Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 2: Setup Convex

```bash
# Login to Convex
npx convex login

# Initialize Convex project
npx convex dev
```

This will:
- Create a new Convex project
- Deploy the database schema from `convex/schema.ts`
- Generate `convex/_generated` folder
- Create `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`

### Step 3: Setup Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Enable **Organizations** feature
4. Copy API keys to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

5. Configure Clerk webhook:
   - Webhook URL: `https://your-domain.com/api/clerk/webhook`
   - Events: `user.created`, `user.updated`, `organization.created`
   - Copy signing secret to `.env.local`:

```bash
CLERK_WEBHOOK_SECRET=whsec_...
```

### Step 4: Setup Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys (use Test mode for development)
3. Copy to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Create Products and Prices:

**Starter Plan:**
```bash
# Create product
stripe products create --name="Starter Plan" --description="50 Scans per month"

# Create monthly price (MYR 9.90)
stripe prices create --product=prod_xxx --unit-amount=990 --currency=myr --recurring[interval]=month

# Create yearly price (MYR 99.00)
stripe prices create --product=prod_xxx --unit-amount=9900 --currency=myr --recurring[interval]=year
```

**Pro Plan:**
```bash
# Create product
stripe products create --name="Pro Plan" --description="200 Scans per month with AI"

# Create monthly price (MYR 29.00)
stripe prices create --product=prod_xxx --unit-amount=2900 --currency=myr --recurring[interval]=month

# Create yearly price (MYR 299.00)
stripe prices create --product=prod_xxx --unit-amount=29900 --currency=myr --recurring[interval]=year
```

**Credit Packages:**
```bash
# 100 Credits - MYR 10.00
stripe prices create --product=prod_xxx --unit-amount=1000 --currency=myr

# 500 Credits - MYR 40.00
stripe prices create --product=prod_xxx --unit-amount=4000 --currency=myr

# 1000 Credits - MYR 70.00
stripe prices create --product=prod_xxx --unit-amount=7000 --currency=myr
```

5. Add Price IDs to `.env.local`:

```bash
STARTER_MONTHLY_PRICE_ID=price_xxx
STARTER_YEARLY_PRICE_ID=price_xxx
PRO_MONTHLY_PRICE_ID=price_xxx
PRO_YEARLY_PRICE_ID=price_xxx
```

6. Configure Stripe webhook:
   - Webhook URL: `https://your-domain.com/api/stripe/webhook`
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`

### Step 5: Configure Credit Pricing (Optional)

Add to `.env.local` to customize credit pricing:

```bash
# Small Package
NEXT_PUBLIC_CREDIT_SMALL_AMOUNT=100
NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS=1000

# Medium Package
NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT=500
NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS=4000

# Large Package
NEXT_PUBLIC_CREDIT_LARGE_AMOUNT=1000
NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS=7000
```

### Step 6: Configure Support Email (Optional)

```bash
EMAIL_SUPPORT=support@yourdomain.com
N8N_SUPPORT_WEBHOOK_PATH=https://your-n8n-instance.com/webhook/support
```

---

## Environment Variables

Complete `.env.local` template:

```bash
# Convex (Auto-generated)
CONVEX_DEPLOYMENT=dev:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STARTER_MONTHLY_PRICE_ID=price_xxx
STARTER_YEARLY_PRICE_ID=price_xxx
PRO_MONTHLY_PRICE_ID=price_xxx
PRO_YEARLY_PRICE_ID=price_xxx

# Credit Pricing (Optional - defaults provided)
NEXT_PUBLIC_CREDIT_SMALL_AMOUNT=100
NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS=1000
NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT=500
NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS=4000
NEXT_PUBLIC_CREDIT_LARGE_AMOUNT=1000
NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS=7000

# Support Configuration (Optional)
EMAIL_SUPPORT=support@yourdomain.com
N8N_SUPPORT_WEBHOOK_PATH=https://your-n8n.com/webhook/support

# Storage Limits (Optional - defaults provided)
FREE_STORAGE_MB=10
STARTER_STORAGE_MB=100
PRO_STORAGE_MB=300
```

---

## Verification

### 1. Test Database Connection

```bash
npx convex dev
```

Should show: ✓ Convex functions ready

### 2. Test Authentication

1. Run dev server: `npm run dev`
2. Visit: `http://localhost:3000`
3. Click "Sign Up"
4. Create account
5. Check Convex dashboard - should see user in `users` table

### 3. Test Subscriptions

1. Login to your app
2. Go to `/pricing`
3. Click "Subscribe" on Starter plan
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Check Convex dashboard:
   - `org_subscriptions` - should have active subscription
   - `subscription_transactions` - should have "created" event

### 4. Test Credits

1. Go to `/pricing`
2. Click "Buy Now" on any credit package
3. Complete Stripe checkout
4. Check Convex dashboard:
   - `credits_ledger` - should have purchase record
   - `credits_balance` - should show balance

### 5. Test Webhooks

**Clerk Webhook:**
```bash
curl -X POST http://localhost:3000/api/clerk/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"user_xxx"}}'
```

**Stripe Webhook:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Update all environment variables to production values
- [ ] Switch Stripe to Live mode
- [ ] Configure production Clerk instance
- [ ] Deploy Convex to production: `npx convex deploy`
- [ ] Set up production webhooks with actual domain
- [ ] Test complete user flow in production
- [ ] Enable Stripe webhook signing verification
- [ ] Set up monitoring and error tracking

---

## Troubleshooting

### Database Schema Not Deployed

```bash
npx convex dev --once
```

### Webhook Signature Verification Failed

1. Check webhook secret matches `.env.local`
2. Ensure raw body is passed to verification
3. Test with Stripe CLI: `stripe listen`

### Credits Not Updating

1. Check `credits_ledger` for transaction
2. Verify Stripe webhook received `payment_intent.succeeded`
3. Check Convex logs for errors

### Subscription Not Activating

1. Verify Stripe webhook received `checkout.session.completed`
2. Check `subscription_transactions` for events
3. Ensure `companyId` is in Stripe metadata

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Home   │  │ Pricing  │  │Dashboard │  │ Billing  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Authentication (Clerk)                    │
│              Organizations • Users • Webhooks                │
└─────────────────────────────────────────────────────────────┘
           │                                         │
           ▼                                         ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│   Database (Convex)      │         │    Payments (Stripe)     │
│  • users                 │         │  • Subscriptions         │
│  • org_settings          │◄────────┤  • One-time Payments     │
│  • org_subscriptions     │         │  • Webhooks              │
│  • subscription_trans... │         └──────────────────────────┘
│  • credits_ledger        │
│  • credits_balance       │
└──────────────────────────┘
```

---

## Next Steps

After setup is complete:

1. **Customize Plans** - Edit `lib/plans.ts` to match your offering
2. **Add Features** - Implement your core SaaS features
3. **Configure Limits** - Set up usage tracking and limits
4. **Branding** - Update colors, logo, and copy
5. **Testing** - Write tests for critical flows
6. **Deploy** - Deploy to Vercel, Netlify, or your platform

---

## Support

- **Documentation**: Check `zdoc/` folder for detailed guides
- **Issues**: Create GitHub issue
- **Community**: Join our Discord

---

**Built with ❤️ for developers**




##Quick Start for New Projects
Option 1: Automated Setup (Recommended)


git clone <your-repo>
cd startupkit
npm run setup

##Quick Start for New Projects
Option 2: Manual Setup

git clone <your-repo>
cd startupkit
npm install
npx convex dev
# Follow STARTUPKIT_SETUP.md

----------------------------------------------------

I'll help you create a step-by-step guide for cloning your startupkit from GitHub, renaming it, and running the automated setup.

Let me first check the current setup documentation to understand the automated setup process better.

# Step-by-Step Guide: Clone StartupKit and Set Up Your New Project

Based on your screenshots, here's the complete workflow:

## **Step 1: Clone Repository with GitHub Desktop**

1. **Open GitHub Desktop** (as shown in your pic2)
2. **Click "Clone a repository"**
3. **Select your repository:**
   - Find `kerisGit123/startupkit` in the list
4. **Set Local Path:**
   - Change the local path to your desired location
   - Example: `D:\gemini\your-new-project-name` (replace `your-new-project-name` with your actual project name)
   - Click "Choose..." button to browse and select the folder
5. **Click "Clone"** button

## **Step 2: Rename the Project**

After cloning, you'll need to rename references in your project:

1. **Navigate to the cloned folder** in File Explorer
2. **Open the project in Windsurf:**
   - Right-click the folder → "Open with Windsurf"
   - OR open Windsurf → File → Open Folder → select your cloned folder

3. **Update `package.json`:**
   - Change the `"name"` field to your project name
   - Example: `"name": "my-awesome-saas"`

4. **Update `README.md`** (optional but recommended):
   - Replace "StartupKit" with your project name
   - Update description

## **Step 3: Run Automated Setup**

1. **Open Terminal in Windsurf:**
   - Press `` Ctrl + ` `` (backtick) or View → Terminal

2. **Run the setup command:**
   ```bash
   npm run setup
   ```

3. **The automated setup will:**
   - ✅ Install all dependencies (npm packages)
   - ✅ Initialize Convex database
   - ✅ Deploy database schema
   - ✅ Create `.env.local` template file
   - ✅ Guide you through API key setup

4. **Follow the prompts** to enter your API keys for:
   - Clerk (authentication)
   - Convex (database)
   - Stripe (payments)

## **Step 4: Start Development**

After setup completes:

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

---

## **Quick Reference Commands**

```bash
# Clone (via GitHub Desktop UI - no command needed)

# Navigate to project
cd D:\gemini\your-project-name

# Automated setup
npm run setup

# Start development server
npm run dev

# Deploy Convex (when ready)
npx convex deploy
```

---

## **Important Notes**

- **Local Path**: Choose a meaningful folder name when cloning (this becomes your project folder)
- **GitHub Connection**: The cloned repo stays connected to `kerisGit123/startupkit` - you may want to change the remote URL later if creating a new project
- **API Keys**: Have your Clerk, Convex, and Stripe accounts ready before running `npm run setup`
- **Environment File**: Never commit `.env.local` to GitHub (it's already in `.gitignore`)

Would you like me to create a quick reference document with these steps saved in your project folder?