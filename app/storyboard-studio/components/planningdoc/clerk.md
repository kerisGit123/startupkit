# Clerk Multi-Tenant Organization Plan

## 🎯 Objective
Move organization features to Storyboard Studio - users consume credits for AI image/video generation instead of traditional SaaS features.

## 📊 Current State Analysis

### ✅ What Works (Keep)
- `companyId` pattern for tenant isolation
- Credit system (balance, ledger, deduction)
- Stripe integration for purchases
- Organization switching UI

### 🔄 What to Transform
- Traditional SaaS features → AI generation features
- Individual-focused → Team-focused organization management
- Feature limits → Generation quotas + team limits

## 🏗️ Implementation Plan

### Phase 1: Subscription-Based Organization Management
**Goal**: Users subscribe to create and manage organizations

```typescript
// Revised subscription model for organizations
export const ORG_SUBSCRIPTION_COSTS = {
  starter: { 
    monthly: 29, 
    creditsIncluded: 500, 
    maxOrgs: 1, 
    maxMembers: 5,
    orgCreation: "free" 
  },
  pro: { 
    monthly: 99, 
    creditsIncluded: 2000, 
    maxOrgs: 3, 
    maxMembers: 15,
    orgCreation: "free" 
  },
  enterprise: { 
    monthly: 299, 
    creditsIncluded: 5000, 
    maxOrgs: 10, 
    maxMembers: 50,
    orgCreation: "free" 
  }
};

// Additional credit packs for heavy users
export const ADDITIONAL_CREDITS = {
  1000: { price: 10 },   // $10 for 1000 credits
  5000: { price: 40 },   // $40 for 5000 credits  
  10000: { price: 70 },   // $70 for 10000 credits
};
```

### Phase 2: AI Generation Quotas per Organization
**Goal**: Organizations get monthly AI generation quotas based on subscription

```typescript
// Per-org generation quotas (included in subscription)
export const ORG_GENERATION_LIMITS = {
  starter: { images: 50, videos: 10, scripts: 20 },
  pro: { images: 200, videos: 50, scripts: 100 },
  enterprise: { images: 1000, videos: 200, scripts: 500 }
};
```

### Phase 3: Team Credit Pool Management
**Goal**: Organizations can buy and pool additional credits

```typescript
// Org credit pool for additional purchases
export interface OrgCreditPool {
  orgId: string;
  totalCredits: number;  // Additional credits beyond subscription
  usedCredits: {
    images: number;
    videos: number;
    scripts: number;
  };
  lastReset: timestamp;
  subscriptionCreditsUsed: number; // Track subscription credits usage
}
```

## 📁 Files to Create

### Core Logic
- `lib/org-subscription.ts` - Org subscription management
- `lib/org-quotas.ts` - Per-org generation limits
- `lib/credit-pool.ts` - Organization credit management

### API Routes
- `api/orgs/create-org` - Create org (requires subscription)
- `api/orgs/buy-credits` - Bulk credit purchase for org
- `api/orgs/usage-stats` - Track generation usage

### UI Components
- `components/OrgCreationModal.tsx` - Subscribe-to-create org flow
- `components/OrgCreditPool.tsx` - Show org credit balance
- `components/GenerationQuotas.tsx` - Display usage limits

## 🔄 Files to Modify

### Existing Components
- `components/OrganizationSwitcherWithLimits.tsx` → Subscription-based creation
- `app/dashboard/billing/page.tsx` → Add org subscription UI
- `workspace/[projectId]/page.tsx` → Check org quotas before generation

### Convex Functions
- `convex/credits.ts` → Add org credit pool functions
- `convex/storyboard/creditUsage.ts` → Track per-org usage

## 🎛️ UI Flow Changes

### Organization Creation
1. User clicks "Create Organization"
2. Shows modal: "Subscribe to manage team (from $29/mo)"
3. Choose plan → Subscribe → Create org
4. Success: "Organization created! Start managing your team"

### Generation Process
1. User in org context wants to generate image/video
2. Check org's monthly quota (included in subscription)
3. If quota available → Generate from subscription credits
4. If quota exceeded → "Upgrade plan or buy more credits"

### Credit Management
1. Org admin sees credit pool balance
2. "Buy 5000 credits for team" → Stripe checkout
3. Credits added to org pool
4. All members can use pooled credits

## 📋 Business Rules

1. **Subscription required** - Must subscribe to create/manage organizations
2. **Free org creation** - No additional cost for subscribers
3. **Credits included** - Based on subscription tier
4. **Additional credits** - Available for purchase as needed
5. **Team limits enforced** - Max members by subscription level
6. **Usage tracking** - Per-member and per-org statistics

## 🧪 Testing Checklist

- [ ] User can create org with active subscription
- [ ] Free users cannot create organizations
- [ ] Org creation fails without subscription
- [ ] Monthly quotas reset correctly
- [ ] Credit pool sharing works for all members
- [ ] Admin can buy credits for org
- [ ] Generation respects org quotas
- [ ] Member limits enforced by subscription
- [ ] Usage stats track correctly

## 📈 Success Metrics

- **Subscription revenue** - Track MRR from org subscriptions
- **Credit consumption** - AI generation usage
- **Quota utilization** - % of monthly limits used
- **Pool purchases** - Credit buy-ins by orgs
- **Team adoption** - Organizations created and member growth

---

## 🔄 Status: Planning Phase
⏳ **Next**: Implement Phase 1 (Subscription-Based Organization Management)