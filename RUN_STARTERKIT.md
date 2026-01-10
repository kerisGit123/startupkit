# 🚀 StartupKit - Complete Setup Guide

Welcome to **StartupKit**! This comprehensive guide will walk you through setting up your new SaaS application from scratch using this starter kit.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Setup](#environment-setup)
4. [Convex Database Setup](#convex-database-setup)
5. [Clerk Authentication Setup](#clerk-authentication-setup)
6. [Stripe Payment Integration](#stripe-payment-integration)
7. [Database Schema Overview](#database-schema-overview)
8. [Running the Application](#running-the-application)
9. [Admin Panel Setup](#admin-panel-setup)
10. [Customization Guide](#customization-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** or **pnpm** or **bun**
- **Git** - [Download](https://git-scm.com/)
- A **Convex** account - [Sign up](https://convex.dev/)
- A **Clerk** account - [Sign up](https://clerk.com/)
- A **Stripe** account - [Sign up](https://stripe.com/)

---

## Quick Start

### 🎯 One-Command Setup (Recommended)

Run this single command to set up everything automatically:

```bash
npm run setup
```

This will:
- ✅ Install all dependencies
- ✅ Initialize Convex database
- ✅ Create `.env.local` template with all required variables
- ✅ Display next steps for Clerk and Stripe configuration

### 📝 Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Clone or download this starter kit
git clone <your-repo-url>
cd startupkit

# 2. Install dependencies
npm install

# 3. Initialize Convex
npx convex dev

# 4. Create .env.local and add your API keys
# (See Environment Setup section below)

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application!

---

## 🚀 Automated Setup Script

The starter kit includes an automated setup script that handles most of the configuration for you.

### What the Setup Script Does:

1. **Installs Dependencies** - Runs `npm install`
2. **Initializes Convex** - Sets up your database with all 13 tables
3. **Creates Environment Template** - Generates `.env.local` with all required variables
4. **Provides Next Steps** - Shows you exactly what to configure in Clerk and Stripe

### How to Use:

```bash
npm run setup
```

Follow the prompts and the script will guide you through the setup process!

---

## Environment Setup

### 1. Create `.env.local` file

Create a `.env.local` file in the root directory with the following variables:

```env
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Convex Database Setup

### Step 1: Initialize Convex

```bash
npx convex dev
```

This command will:
- Create a new Convex project (if you don't have one)
- Generate a `CONVEX_DEPLOYMENT` value
- Start the Convex development server

### Step 2: Configure Convex Environment Variables

After running `npx convex dev`, copy the generated values to your `.env.local`:

```env
CONVEX_DEPLOYMENT=<your-deployment-name>
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
```

### Step 3: Deploy Convex Functions

The Convex functions will automatically deploy when you run `npx convex dev`. The schema includes:

- **Users** - User profiles and metadata
- **Subscriptions** - Subscription management
- **Purchases** - Credit purchases and transactions
- **Tickets** - Support ticket system
- **Notifications** - Admin notification system

---

## Clerk Authentication Setup

### Step 1: Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Click **"Add application"**
3. Name your application
4. Choose your authentication methods (Email, Google, GitHub, etc.)

### Step 2: Get API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy the **Publishable Key** and **Secret Key**
3. Add them to your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 3: Configure Clerk Webhook (Optional)

For syncing user data with Convex:

1. In Clerk Dashboard, go to **Webhooks**
2. Click **"Add Endpoint"**
3. Set the endpoint URL: `https://your-domain.com/api/clerk-webhook`
4. Select events: `user.created`, `user.updated`, `user.deleted`
5. Copy the **Signing Secret** and add to `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

### Step 4: Set Up Admin Roles

To assign admin roles:

1. Go to Clerk Dashboard → **Users**
2. Select a user
3. Click **"Metadata"** → **"Public metadata"**
4. Add the following JSON:

```json
{
  "role": "super_admin"
}
```

Available roles:
- `super_admin` - Full system access
- `billing_admin` - Manage subscriptions and payments
- `support_admin` - Manage support tickets

---

## Stripe Payment Integration

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** → **API keys**
3. Copy **Publishable key** and **Secret key**
4. Add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Step 2: Create Products and Prices

#### Subscription Plans

Create the following products in Stripe:

1. **Starter Plan**
   - Price: $9.99/month
   - Product ID: Save for later use

2. **Pro Plan**
   - Price: $29.99/month
   - Product ID: Save for later use

3. **Business Plan**
   - Price: $99.99/month
   - Product ID: Save for later use

#### Credit Packages

Create one-time payment products:

1. **100 Credits** - $39
2. **200 Credits** - $69
3. **300 Credits** - $99
4. **500 Credits** - $149

### Step 3: Configure Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-domain.com/api/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Database Schema Overview

The starter kit uses **Convex** as the database. Below are all the tables that will be automatically created when you run `npx convex dev`:

### Core Tables

#### 1. **users**
```typescript
{
  clerkUserId: string,
  email: string,
  firstName: string,
  lastName: string,
  fullName: string,
  imageUrl: string,
  username: string,
  createdAt: number,
  updatedAt: number,
  deletionTime: number
}
```

#### 2. **org_settings** (Organization/Tenant Configuration)
```typescript
{
  companyId: string,
  subjectType: "organization" | "user",
  companyName: string,
  email: string,
  contactNumber: string,
  address: string,
  companyLogoId: Id<"_storage">,
  aiEnabled: boolean,
  createdAt: number,
  updatedAt: number,
  updatedBy: string
}
```

#### 3. **org_subscriptions** (Subscription Management)
```typescript
{
  companyId: string,
  plan: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  currentPeriodEnd: number,
  cancelAtPeriodEnd: boolean,
  status: string,
  createdAt: number,
  updatedAt: number
}
```

#### 4. **subscription_transactions** (Subscription Audit Log)
```typescript
{
  companyId: string,
  action: string,
  plan: string,
  status: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  source: string,
  eventType: string,
  currentPeriodEnd: number,
  createdAt: number
}
```

#### 5. **credits_ledger** (Credit Purchases)
```typescript
{
  companyId: string,
  tokens: number,
  stripePaymentIntentId: string,
  stripeCheckoutSessionId: string,
  amountPaid: number,
  currency: string,
  reason: string,
  createdAt: number
}
```

#### 6. **credits_balance** (Current Credit Balance)
```typescript
{
  companyId: string,
  balance: number,
  updatedAt: number
}
```

### Admin Tables

#### 7. **admin_users**
```typescript
{
  clerkUserId: string,
  email: string,
  role: "super_admin" | "billing_admin" | "support_admin",
  isActive: boolean,
  createdAt: number,
  createdBy: string,
  lastLoginAt: number
}
```

#### 8. **admin_activity_logs**
```typescript
{
  adminUserId: string,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details: any,
  ipAddress: string,
  createdAt: number
}
```

#### 9. **admin_notifications**
```typescript
{
  type: "new_ticket" | "dispute" | "payment_failed" | "customer_at_risk" | "sla_breach",
  title: string,
  message: string,
  targetRole: "super_admin" | "billing_admin" | "support_admin" | "all",
  relatedId: string,
  isRead: boolean,
  createdAt: number,
  readAt: number
}
```

#### 10. **notifications_read** (Notification Read Tracking)
```typescript
{
  notificationId: string,
  type: string,
  userId: string,
  readAt: number
}
```

### Support System Tables

#### 11. **support_tickets**
```typescript
{
  ticketNumber: string,
  companyId: string,
  userId: string,
  userEmail: string,
  subject: string,
  description: string,
  category: "billing" | "technical" | "dispute" | "general",
  priority: "low" | "medium" | "high" | "urgent",
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed",
  assignedTo: string,
  stripeDisputeId: string,
  relatedSubscriptionId: string,
  relatedPaymentId: string,
  firstResponseAt: number,
  slaBreached: boolean,
  createdAt: number,
  updatedAt: number,
  resolvedAt: number
}
```

#### 12. **ticket_messages**
```typescript
{
  ticketId: Id<"support_tickets">,
  senderId: string,
  senderType: "customer" | "admin",
  senderName: string,
  message: string,
  isInternal: boolean,
  createdAt: number
}
```

### Analytics Table

#### 13. **customer_health_scores**
```typescript
{
  companyId: string,
  userId: string,
  score: number,
  status: "healthy" | "at_risk" | "critical",
  factors: {
    lastLoginDays: number,
    ticketCount: number,
    paymentFailures: number,
    usageScore: number,
    subscriptionAge: number
  },
  calculatedAt: number,
  updatedAt: number
}
```

**Total Tables: 13**

All these tables will be automatically created by Convex when you run the setup. No manual database configuration needed!

---

## Running the Application

### Development Mode

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Next.js
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Convex Dashboard**: https://dashboard.convex.dev

### Build for Production

```bash
npm run build
npm start
```

---

## Admin Panel Setup

### Access the Admin Panel

1. Navigate to `/admin`
2. Sign in with an account that has admin role
3. If you don't have admin access, add the role in Clerk (see [Clerk Setup](#step-4-set-up-admin-roles))

### Admin Features

- **Dashboard**: Overview of users, subscriptions, revenue
- **Users**: Manage users, view subscriptions, ban users
- **Subscriptions**: View and manage all subscriptions
- **Purchases**: Track credit purchases
- **Tickets**: Manage support tickets
- **Notifications**: Real-time notifications for new events
- **Settings**: Assign admin roles

---

## Customization Guide

### 1. Update Branding

**Logo and App Name:**
- Replace logo in `/public/logo.png`
- Update app name in `/app/layout.tsx`

**Colors and Theme:**
- Edit theme colors in `/app/globals.css`
- Customize theme switcher in `/components/theme-switcher.tsx`

### 2. Modify Subscription Plans

Update pricing in:
- `/app/pricing/page.tsx`
- Create corresponding products in Stripe
- Update plan logic in `/convex/subscriptions.ts`

### 3. Customize Email Templates

Edit email templates in:
- `/lib/email-templates/` (if using email service)
- Or configure in Clerk Dashboard for auth emails

### 4. Add New Features

The starter kit is modular. To add new features:

1. Create Convex schema in `/convex/schema.ts`
2. Add queries/mutations in `/convex/`
3. Create UI components in `/components/`
4. Add pages in `/app/`

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Deploy Convex to Production

```bash
npx convex deploy
```

Update your production environment variables with the new Convex URL.

### Post-Deployment Checklist

- [ ] Update Clerk redirect URLs to production domain
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Test payment flow in Stripe test mode
- [ ] Switch to Stripe live mode when ready
- [ ] Set up monitoring and error tracking
- [ ] Configure custom domain
- [ ] Enable SSL certificate

---

## Troubleshooting

### Common Issues

**Issue: Convex functions not deploying**
```bash
# Solution: Clear Convex cache and redeploy
rm -rf .convex
npx convex dev
```

**Issue: Clerk authentication not working**
- Verify API keys in `.env.local`
- Check redirect URLs in Clerk dashboard
- Ensure middleware is configured in `middleware.ts`

**Issue: Stripe webhook failing**
- Verify webhook secret in `.env.local`
- Check webhook endpoint is accessible
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

**Issue: Admin panel not accessible**
- Verify user has admin role in Clerk metadata
- Check middleware allows admin routes
- Clear browser cache and cookies

### Getting Help

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: Report bugs or request features
- **Community**: Join our Discord/Slack (if available)

---

## Next Steps

Now that your starter kit is set up, you can:

1. ✅ Customize the branding and colors
2. ✅ Add your own features and pages
3. ✅ Configure email notifications
4. ✅ Set up analytics (Google Analytics, Mixpanel, etc.)
5. ✅ Add more payment options
6. ✅ Implement your core business logic
7. ✅ Test thoroughly before launch
8. ✅ Deploy to production

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## License

This starter kit is provided as-is for your use. Modify and build upon it as needed for your project.

---

**Happy Building! 🚀**

If you have questions or need help, please refer to the documentation or reach out to the community.
