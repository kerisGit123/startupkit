# Clerk Integration Documentation

## Overview

This document outlines the complete Clerk integration for the Storyboard Studio application, including authentication, themes, organizations, payments, subscriptions, and credit purchasing.

## **🔐 Security: Server-side CompanyId Creation**

**CRITICAL**: All companyId creation and update operations MUST be handled server-side for security and data isolation.

### ✅ Server-side Pattern (Required)

```typescript
// Convex mutations - ALWAYS calculate companyId from auth context
export const create = mutation({
  args: {
    // ... other fields (NO companyId parameter)
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Calculate companyId from auth context (NEVER trust client)
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const companyId = (userOrganizationId || userId) as string;
    
    return await ctx.db.insert("table_name", {
      ...args,
      companyId, // ✅ Server-calculated
      // ... other fields
    });
  },
});
```

### ❌ Client-side Pattern (Forbidden)

```typescript
// NEVER do this - security risk
await createItem({
  name: "item",
  companyId: getCurrentCompanyId(user), // ❌ Client can manipulate
  // ... other fields
});
```

### ✅ Correct Client-side Pattern

```typescript
// Client-side calls - NO companyId parameter
await createItem({
  name: "item",
  // ✅ Server will calculate companyId from auth context
  // ... other fields
});
```

## Authentication Setup

### Clerk Configuration

```typescript
// app/providers.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
```

### Authentication Flow

```typescript
// lib/auth-utils.ts
export function getCurrentCompanyId(user: ExtendedUserOrNull): string {
  if (!user) return "";

  // CompanyId logic: Organization ID if selected, otherwise User ID
  if (user.organizationMemberships && user.organizationMemberships.length > 0) {
    const orgMembership = user.organizationMemberships[0];
    if (orgMembership.organization) {
      // User is in an organization
      return orgMembership.organization.id;
    } else {
      // Edge case: membership but no organization
      return user.id;
    }
  } else {
    return user.id;
  }
  
  // No user authenticated
  console.warn("[AuthUtils] No user authenticated");
  return "";
}

// Components using Clerk auth
import { useUser, useAuth, useOrganization } from '@clerk/nextjs'

function MyComponent() {
  const { user } = useUser();
  const { userId } = useAuth();
  const companyId = useCurrentCompanyId(); // ✅ Uses active organization or personal ID

  if (!userId) {
    // Redirect to main page if not authenticated
    return <div>Please sign in to continue</div>;
  }

  return <div>Welcome! Your companyId: {companyId}</div>;
}
```

### Server-side Authentication

```typescript
// API routes and server-side code
import { auth } from '@clerk/nextjs/server';
import { getServerCurrentCompanyId } from '@/lib/auth-utils-server';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = getServerCurrentCompanyId({ userId });
  // Use companyId for data access
}
```

## Theme Customization

### Basic Theme Setup

```typescript
// app/providers.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { dark, shadesOfPurple } from '@clerk/themes'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e293b',
          colorInputText: '#f1f5f9',
        },
        elements: {
          formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
          card: 'bg-slate-800 border-slate-700',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
```

### Available Themes

- **Default** - Clean, minimal design
- **Dark** - Dark mode theme
- **shadcn** - Matches shadcn/ui components
- **Shades of Purple** - Purple accent colors
- **Neobrutalism** - Bold, brutalist design

### Custom Theme Variables

```typescript
appearance={{
  variables: {
    // Colors
    colorPrimary: '#6366f1',
    colorBackground: '#ffffff',
    colorInputBackground: '#f3f4f6',
    
    // Typography
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '16px',
    
    // Spacing
    spacing: '16px',
    
    // Border radius
    borderRadius: '8px',
  },
  elements: {
    // Custom component styles
    rootBox: 'shadow-lg',
    card: 'border border-gray-200',
    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}}
```

## Organization Management

### Organization Limits by Plan

| Plan | Organization Limit | Price |
|------|-------------------|-------|
| Free | 0 (Single User Only) | $0/month |
| Enterprise | 3 Organizations | Custom pricing |
| Premium | 10 Organizations | $29/month |

### Organization Setup

```typescript
// Enable organizations in Clerk Dashboard
// Settings → Organizations → Enable

// Frontend organization management
import { useOrganization } from '@clerk/nextjs'

function OrganizationSwitcher() {
  const { organization } = useOrganization();
  const { isLoaded } = useOrganizationList();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <OrganizationSwitcher
      appearance={{
        elements: {
          organizationSwitcherTrigger: 'bg-white border border-gray-300',
        },
      }}
    />
  );
}
```

### Organization-based Data Access

```typescript
// Data filtering by organization
export async function getProjectsByOrganization(organizationId: string) {
  const projects = await convex.query.api.storyboard.projects.listByOrganization({
    organizationId,
  });
  return projects;
}

// R2 file storage with organization prefix
const key = `${organizationId}/elements/${filename}`;
```

## Payment & Subscription Integration

### Clerk Billing Setup

```typescript
// Enable billing in Clerk Dashboard
// Settings → Billing → Enable

// Subscription plans configuration
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Single user', 'Basic features'],
    organizationLimit: 0,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99, // Custom pricing
    features: ['3 organizations', 'Advanced features', 'Priority support'],
    organizationLimit: 3,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29,
    features: ['10 organizations', 'All features', 'Standard support'],
    organizationLimit: 10,
  },
];
```

### Subscription Management

```typescript
// Check user subscription
import { useUser } from '@clerk/nextjs'

function SubscriptionCheck() {
  const { user } = useUser();
  
  const subscription = user?.publicMetadata?.subscription;
  const organizationCount = user?.organizationMemberships?.length || 0;
  
  const canCreateOrganization = () => {
    if (!subscription) return false; // Free plan
    if (subscription === 'enterprise') return organizationCount < 3;
    if (subscription === 'premium') return organizationCount < 10;
    return false;
  };

  return (
    <div>
      <p>Current Plan: {subscription || 'Free'}</p>
      <p>Organizations: {organizationCount}</p>
      {!canCreateOrganization() && (
        <p>Upgrade your plan to create more organizations</p>
      )}
    </div>
  );
}
```

### Payment Processing

```typescript
// Create checkout session
import { useClerk } from '@clerk/nextjs'

function UpgradeButton({ planId }: { planId: string }) {
  const { openUserResource } = useClerk();

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return <button onClick={handleUpgrade}>Upgrade to {planId}</button>;
}
```

## Credit Purchasing System

### Credit Packages

| Package | Credits | Price (RM) | Bonus |
|---------|---------|------------|-------|
| Basic | 1000 | RM 30 | - |
| Standard | 3100 | RM 100 | 100 bonus credits |
| Premium | 10000 | RM 300 | 1000 bonus credits |

### Credit Purchase Implementation

```typescript
// Credit purchase API
// app/api/purchase-credits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const creditPackages = {
  basic: { credits: 1000, price: 30, currency: 'myr' },
  standard: { credits: 3100, price: 100, currency: 'myr' },
  premium: { credits: 10000, price: 300, currency: 'myr' },
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const { packageId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packageData = creditPackages[packageId];
  if (!packageData) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: packageData.currency,
          product_data: {
            name: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Credit Package`,
            description: `${packageData.credits} credits`,
          },
          unit_amount: packageData.price * 100, // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/cancel`,
      metadata: {
        userId,
        packageId,
        credits: packageData.credits.toString(),
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
```

### Credit Management

```typescript
// Credit tracking in Convex
// convex/credits.ts
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const addCredits = mutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    packageId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('creditBalances')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: existing.balance + args.credits,
        totalPurchased: existing.totalPurchased + args.credits,
        lastPurchaseAt: Date.now(),
      });
    } else {
      await ctx.db.insert('creditBalances', {
        userId: args.userId,
        balance: args.credits,
        totalPurchased: args.credits,
        lastPurchaseAt: Date.now(),
      });
    }

    // Log purchase
    await ctx.db.insert('creditPurchases', {
      userId: args.userId,
      credits: args.credits,
      packageId: args.packageId,
      amount: getCreditsPrice(args.packageId),
      createdAt: Date.now(),
    });
  },
});

export const getBalance = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query('creditBalances')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    return balance?.balance || 0;
  },
});
```

### Credit Usage Tracking

```typescript
// Credit deduction for AI operations
export const useCredits = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    operation: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query('creditBalances')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!balance || balance.balance < args.amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits
    await ctx.db.patch(balance._id, {
      balance: balance.balance - args.amount,
    });

    // Log usage
    await ctx.db.insert('creditUsage', {
      userId: args.userId,
      amount: args.amount,
      operation: args.operation,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});
```

## CompanyId Implementation

### Central CompanyId Logic

The `companyId` is the central identifier for all data access:

```typescript
// For personal accounts (Free plan)
companyId = userId;

// For organization accounts (Enterprise/Premium plans)
companyId = organizationId;
```

### Usage Examples

```typescript
// R2 file storage
const fileKey = `${companyId}/elements/${filename}`;

// Database queries
const projects = await convex.query.api.storyboard.projects.listByCompany({
  companyId,
});

// Credit balance
const credits = await convex.query.api.credits.getBalance({ companyId });
```

## Environment Variables

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Organization Settings
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe for Credit Purchases
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Considerations

1. **Authentication Required**: All API endpoints must verify authentication
2. **Company-based Access**: All data access must be filtered by companyId
3. **Credit Validation**: Always check credit balance before operations
4. **Organization Limits**: Enforce organization limits based on subscription
5. **Rate Limiting**: Implement rate limiting for credit usage

## Testing Checklist

- [ ] User can sign up/sign in
- [ ] Personal account works (Free plan)
- [ ] Organization creation works (Enterprise/Premium plans)
- [ ] CompanyId logic works correctly
- [ ] Credit purchase flow works
- [ ] Credit deduction works
- [ ] Theme customization applies
- [ ] Subscription limits enforced
- [ ] Payment processing works
- [ ] Webhook handling for payments

## Troubleshooting

### Common Issues

1. **CompanyId not found**: Check Clerk authentication and organization setup
2. **Credit purchase fails**: Verify Stripe configuration and webhooks
3. **Theme not applying**: Check ClerkProvider configuration
4. **Organization limits not enforced**: Check subscription metadata

### Debug Logging

```typescript
// Enable debug logging
console.log('[Auth] CompanyId:', companyId);
console.log('[Auth] User Type:', isOrganizationUser(user) ? 'organization' : 'personal');
console.log('[Credits] Balance:', credits);
console.log('[Org] Count:', organizationCount);
```