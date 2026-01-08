# Pricing Features Configuration

## Where Pricing Features Come From

All pricing plan features are defined in **`lib/plans.ts`**

## Current Configuration

### File: `lib/plans.ts`

```typescript
export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: "free",
    title: "Free",
    prices: {
      monthly: { label: "MYR 0.00/month" },
    },
    features: ["5 Scans per month"],
    entitlements: { scansPerMonth: 5, storageMB: 10 },
  },
  starter: {
    id: "starter",
    title: "Starter",
    prices: {
      monthly: { label: "MYR 9.90/month" },
      yearly: { label: "MYR 99.00/year" },
    },
    features: ["50 Scans per month", "Organization"],
    entitlements: { scansPerMonth: 50, storageMB: 100 },
  },
  pro: {
    id: "pro",
    title: "Pro",
    prices: {
      monthly: { label: "MYR 29.00/month" },
      yearly: { label: "MYR 299.00/year" },
    },
    features: ["200 Scans per month", "AI Summary", "Organization"],
    entitlements: { scansPerMonth: 200, storageMB: 300 },
  },
  business: {
    id: "business",
    title: "Business",
    prices: {
      monthly: { label: "Contact Us" },
    },
    features: ["Unlimited Scans", "Custom AI", "Priority Support", "Organization"],
    entitlements: { scansPerMonth: -1, storageMB: -1 },
  },
};
```

## How to Modify Features

### 1. Edit Features List

Open `lib/plans.ts` and modify the `features` array for any plan:

```typescript
starter: {
  features: [
    "50 Scans per month",
    "Organization",
    "Email Support",  // Add new feature
  ],
}
```

### 2. Edit Entitlements

Entitlements control actual system limits:

```typescript
entitlements: { 
  scansPerMonth: 50,   // Number of scans allowed
  storageMB: 100       // Storage limit in MB
}
```

### 3. Edit Pricing

```typescript
prices: {
  monthly: { label: "MYR 9.90/month" },
  yearly: { label: "MYR 99.00/year" },
}
```

## Where Features Are Used

1. **Pricing Page** (`app/pricing/page.tsx`)
   - Displays all plans with features
   - Shows current plan badge
   - Subscribe buttons

2. **Billing Page** (`app/dashboard/billing/page.tsx`)
   - Shows current subscription details
   - Displays scans per month and storage limits

3. **Subscription System** (`convex/subscriptions.ts`)
   - `getEntitlements` query returns plan limits
   - Used for access control

## Plan Details Source

The system gets plan details (scans, organization, etc.) from:

1. **`lib/plans.ts`** - Feature descriptions for UI display
2. **`convex/subscriptions.ts`** - Actual entitlements/limits enforced by backend
3. **Environment variables** - Can override storage limits:
   - `FREE_STORAGE_MB`
   - `STARTER_STORAGE_MB`
   - `PRO_STORAGE_MB`

## Example: Adding a New Feature

To add "API Access" to Pro plan:

1. Edit `lib/plans.ts`:
```typescript
pro: {
  features: [
    "200 Scans per month",
    "AI Summary",
    "Organization",
    "API Access"  // New feature
  ],
}
```

2. If it requires backend enforcement, update `convex/subscriptions.ts`:
```typescript
pro: { 
  scansPerMonth: 200,
  storageMB: 300,
  apiAccess: true  // Add to entitlements
}
```

The changes will automatically appear on the pricing page!
