# Storyboard Studio — Hybrid Billing Model

## Strategy: Free + Credits (Stripe) vs Paid Org Plans (Clerk)

### User Journey
```
Free Plan → Buy Credits as Needed → Need Team? → Subscribe → Create Organizations
```

## Already Built

| Feature | File | Status |
|---|---|---|
| Clerk dark theme | app/layout.tsx, app/storyboard-studio/layout.tsx | Done |
| AI model credit pricing (per-gen cost) | convex/storyboard/pricing.ts + PricingManagementPage.tsx | Done |
| Billing & Subscription UI | components/admin/BillingSubscriptionPage.tsx | Done |
| Credit balance / ledger | convex/credits.ts | Done |
| Stripe credit purchases | app/api/stripe/create-checkout + webhook | Done |
| Sidebar nav item | SidebarNav.tsx — "Billing & Subscription" below Price Management | Done |

## Hybrid Model Architecture

### Free Plan (Stripe Credits Only)
- **Cost**: MYR 0 (no subscription)
- **AI Generation**: Buy credits as needed (Stripe)
- **Organizations**: ❌ Cannot create orgs
- **Target**: Individual users, occasional use

### Paid Plans (Clerk Subscriptions)
- **Cost**: Starter (MYR 19.90), Pro (MYR 29.00)
- **AI Generation**: Monthly credits + option to buy more
- **Organizations**: ✅ Create orgs (1 for Starter, 3 for Pro)
- **Target**: Teams, businesses, power users

## Plan Structure

| Plan | Price | Credits/Month | Organizations | Payment System |
|---|---|---|---|---|
| **Free** | MYR 0 | 0 (buy as needed) | 0 | Stripe (credits only) |
| **Starter** | MYR 19.90 | 50 | 1 | Clerk (subscription) |
| **Pro** | MYR 29.00 | 200 | 3 | Clerk (subscription) |

## Payment Systems Split

### Stripe (Credit Purchases) 
```typescript
// Credit packages - keep existing implementation
const creditPackages = getCreditPackages(); // 100/500/1000 credits

const handleBuyCredits = async (tokens, amount) => {
  // Calls /api/stripe/create-checkout (already working)
  // Webhook credits balance (already implemented)
};

// Webhook: /api/stripe/webhook/route.ts 
```

### Clerk (Organization Subscriptions) 
```typescript
// Subscription plans - new Clerk setup
const subscriptionPlans = {
  starter: { orgs: 1, monthlyCredits: 50 },
  pro: { orgs: 3, monthlyCredits: 200 }
};

const handleSubscribe = async (plan) => {
  // Redirect to Clerk subscription portal
  window.location.href = `https://your-clerk-instance.com/subscribe?plan=${plan}`;
};

// Check subscription status
const { user } = useUser();
const userPlan = user?.publicMetadata?.subscriptionPlan;
```

## Organization Access Control

### User-Based Subscription Logic
```typescript
// lib/storyboard/subscription-check.ts
export function getOrgLimits(subscriptionPlan: string) {
  const limits = {
    free: { maxOrgs: 0, maxMembers: 0 },
    starter: { maxOrgs: 1, maxMembers: 5 },
    pro: { maxOrgs: 3, maxMembers: 15 },
  };
  return limits[subscriptionPlan] || { maxOrgs: 0, maxMembers: 0 };
}

// Organization creation gate
const plan = user?.publicMetadata?.subscriptionPlan ?? "free";
const maxOrgs = getOrgLimits(plan).maxOrgs;
const currentOrgs = await getUserOrganizationCount(user.id);
if (currentOrgs >= maxOrgs) showUpgradeModal();
```

### Multi-Org Benefits
- **User subscribes once** → Access across all organizations
- **Consistent experience** when switching orgs
- **Simple limits** based on user's plan, not org-specific

## Why This Hybrid Model Works

### For Free Users
- ✅ No upfront cost, low barrier to entry
- ✅ Pay-as-you-go credits for occasional use
- ✅ Full AI generation access
- ✅ Clear upgrade path when teams needed

### For Paid Users  
- ✅ Predictable monthly cost
- ✅ Included monthly credits
- ✅ Organization creation and management
- ✅ Team collaboration features

### For Business
- ✅ Multiple revenue streams (one-time + recurring)
- ✅ Easy user acquisition (free tier)
- ✅ Clear monetization path
- ✅ Simple pricing model

## Implementation Checklist

### Phase 1: Keep Current System 
- [x] Stripe credit purchases working
- [x] Stripe webhook for credit balance
- [x] BillingSubscriptionPage UI
- [x] Credit packages (100/500/1000 at MYR 10/40/70)

### Phase 2: Add Clerk Subscriptions
- [ ] Clerk Dashboard → Connect Stripe account
- [ ] Create subscription plans (Starter: MYR 19.90, Pro: MYR 29.00)
- [ ] Create lib/storyboard/subscription-check.ts helper
- [ ] Update BillingSubscriptionPage subscribe buttons → Clerk URLs

### Phase 3: Organization Integration
- [ ] Add org creation gate in MembersPage
- [ ] Check user.publicMetadata.subscriptionPlan for limits
- [ ] Update plan descriptions to focus on organization benefits
- [ ] Test both flows (free+credits vs paid+orgs)

### Phase 4: User Experience Polish
- [ ] Read user.publicMetadata.subscriptionPlan for live plan display
- [ ] Replace mock invoices with real data (Stripe credits + Clerk subs)
- [ ] Add upgrade prompts when free users try to create orgs

## User Flow Examples

### Free User Journey
1. Sign up → Free plan (MYR 0)
2. Generate AI content → Need credits
3. Click "Buy Credits" → Stripe checkout
4. Purchase 500 credits (MYR 40)
5. Use credits for AI generation
6. Need team features → Click "Subscribe" → Clerk checkout

### Paid User Journey  
1. Sign up → Subscribe to Starter (MYR 19.90)
2. Get 50 monthly credits + 1 organization
3. Create organization → Invite team members
4. Need more credits → Buy via Stripe (pay-as-you-go)
5. Upgrade to Pro → 3 organizations, 200 monthly credits

## Result

**Best of Both Worlds:**
- ✅ **Stripe Credits**: Proven, flexible pay-as-you-go system
- ✅ **Clerk Subscriptions**: Elegant organization management
- ✅ **User-Friendly**: Clear free vs paid distinction
- ✅ **Business-Friendly**: Multiple revenue streams
- ✅ **Scalable**: Easy to add more plans/features

This hybrid model gives users flexibility while providing clear monetization paths for the business! 