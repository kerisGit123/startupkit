# Storyboard Studio — Authentication & Billing

> **Status**: IMPLEMENTED (April 2026)
> **Role**: Authentication, subscription tiers, organization access, credit system, and billing

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Authentication | Clerk | User auth, org management, role-based access |
| Subscriptions | Clerk Billing | Plan tiers (Free/Pro/Business), subscription lifecycle |
| Credit Purchases | Stripe | One-time credit top-ups via checkout |
| Database | Convex | `credits_balance`, `credits_ledger`, `org_settings` |
| Frontend | React hooks | `useSubscription()`, `useFeatures()`, `useCurrentCompanyId()` |

---

## Plan Tiers

| Plan | Internal Key | Clerk Slug | Monthly Price | Monthly Credits | Storage | Target |
|------|-------------|------------|--------------|----------------|---------|--------|
| **Free** | `free` | `free_user` | $0 | 100 | 300 MB | Individual users, casual use |
| **Pro** | `pro_personal` | `pro` | Subscription | 2,500 | 10 GB | Serious creators, small teams |
| **Business** | `business` | `business` | Subscription | 6,900 | 20 GB | Multi-client agencies |

### Plan Limits (`lib/plan-config.ts`)

```typescript
PLAN_LIMITS = {
  free: {
    canCreateOrg: false,
    maxOrgs: 0,
    maxMembersPerOrg: 1,
    maxProjects: 3,
    monthlyCredits: 100,
    storageMB: 300,
  },
  pro_personal: {
    canCreateOrg: true,
    maxOrgs: 1,
    maxMembersPerOrg: 5,
    maxProjects: Infinity,
    monthlyCredits: 2500,
    storageMB: 10240,  // 10 GB
  },
  business: {
    canCreateOrg: true,
    maxOrgs: 3,
    maxMembersPerOrg: 15,
    maxProjects: Infinity,
    monthlyCredits: 6900,
    storageMB: 20480,  // 20 GB
  },
}
```

---

## How Plans Are Determined

### `useSubscription()` Hook (`hooks/useSubscription.ts`)

The hook resolves the effective plan through a multi-step process:

**Step 1 — Check user's own Clerk subscription:**
```typescript
if (has({ plan: CLERK_PLAN_SLUGS.business })) return "business";
if (has({ plan: CLERK_PLAN_SLUGS.pro_personal })) return "pro_personal";
return "free";
```

**Step 2 — Check org owner's plan (for org members):**
```typescript
const snapshot = useQuery(api.credits.getOwnerPlan, { companyId: orgId });
// If in org, use owner's plan; if personal, use own plan
const plan = orgId ? (orgPlan ?? userPlan) : userPlan;
```

**Step 3 — Owner Inheritance:**
When a Free user (Bob) joins an org created by a Pro user (Alice), Bob inherits Alice's plan features within that org via the `ownerPlan` snapshot stored in `credits_balance`.

### Plan Hierarchy

```typescript
const planHierarchy = ["free", "pro_personal", "business"];
// free < pro_personal < business
```

---

## Credit System

### Tables

**`credits_balance`** — Current balance snapshot per `companyId`:
- `balance` — Current credit count
- `ownerPlan` — Plan snapshot (set by Clerk webhook, read by `useSubscription`)
- `creatorUserId` — Who created this workspace
- `lapsedAt` — Timestamp when subscription lapsed (if applicable)

**`credits_ledger`** — Append-only transaction log:
- `purchase` — User bought a top-up pack (Stripe)
- `subscription` — Monthly credit refill (auto-granted)
- `usage` — AI generation deducted credits
- `refund` — Credits returned on generation failure
- `transfer_out` / `transfer_in` — Org-to-org credit transfers (paired)
- `admin_adjustment` — Manual support tweaks
- `org_created` — Marker from Clerk webhook on org creation

### Monthly Credit Allocation

Auto-granted by `ensureMonthlyGrant` mutation (idempotent):

1. Triggered on dashboard load if current cycle hasn't been granted
2. Called lazily by `deductCredits` before checking balance
3. **Personal workspaces only** — orgs get credits via transfer dialog
4. Credits do NOT roll over (clawed back before new grant)

```
Algorithm:
1. Check if "subscription" ledger entry exists for current calendar month
2. If not, add PLAN_LIMITS[plan].monthlyCredits to balance
3. Write "subscription" type ledger entry
```

### Credit Top-Up Packages (`lib/credit-pricing.ts`)

| Package | Credits | Price | Per Credit |
|---------|---------|-------|-----------|
| Small | 1,000 | $9.90 | $0.00990 |
| Medium | 5,000 | $44.90 | $0.00898 (Save 9%) |
| Large | 25,000 | $199.00 | $0.00796 (Save 20%) |

Subscription credit rates are lower (~$0.00995/credit for Pro) to incentivize subscriptions over top-ups.

### Credit Deduction Flow

All AI generation follows this pattern:
1. **Check balance** — `deductCredits` calls `ensureMonthlyGrant` first
2. **Deduct** — Subtract `creditsUsed` from `credits_balance.balance`
3. **Log** — Insert `type: "usage"` entry into `credits_ledger`
4. **On failure** — Refund via `type: "refund"` entry, restore balance

---

## Organization Access Control

### Org Creation Gate

```
Free users:     Cannot create orgs (button hidden)
Pro users:      Can create 1 org (max 5 members)
Business users: Can create 3 orgs (max 15 members each)
```

**Enforcement:**
- **UI**: `OrganizationSwitcherWithLimits.tsx` hides the Clerk "Create Organization" button for Free users via CSS injection; shows upgrade navigation to `/pricing`
- **Backend**: Clerk instance configured with hard limits (3 orgs max per user)

### CompanyId Resolution

```typescript
// Client-side: lib/auth-utils.ts
useCurrentCompanyId()  // orgId ?? userId

// Server-side: lib/auth-utils-server.ts
getServerCurrentCompanyId(auth)  // auth.orgId ?? auth.userId
```

Every database query, file upload, and AI generation uses `companyId` for multi-tenant isolation.

---

## Feature Gating

### `useFeatures()` Hook (`hooks/useFeatures.ts`)

```typescript
const { canUseFeature } = useFeatures();

// Check if current plan meets minimum requirement
canUseFeature("pro_personal")  // true if Pro or Business
canUseFeature("business")      // true only if Business
```

### What's Gated

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| AI Generation | ✅ (buy credits) | ✅ (2,500/mo + buy) | ✅ (6,900/mo + buy) |
| Projects | 3 max | Unlimited | Unlimited |
| Organizations | ❌ | 1 org, 5 members | 3 orgs, 15 members |
| Storage | 300 MB | 10 GB | 20 GB |
| Monthly Credits | 100 | 2,500 | 6,900 |

---

## Lapsed Org Handling

When an org owner cancels their subscription:

1. **Clerk webhook** updates `credits_balance.ownerPlan` → `"free"`
2. **`useSubscription()`** detects `isLapsed = orgId !== null && orgPlan === "free"`
3. **UI** shows `LapsedBanner` component, blocks new content creation
4. **Existing content** remains viewable and exportable
5. **`lapsedAt` timestamp** set in `credits_balance` for audit
6. **Super-admin purge** targets orgs lapsed 90+ days for R2 cleanup (files only; transaction data preserved)

---

## Authentication Flow

### Middleware (`middleware.ts`)

Public routes (no auth required):
- `/`, `/pricing`, `/sign-in`, `/sign-up`
- Webhook endpoints (`/api/clerk/webhook`, `/api/stripe/webhook`, `/api/kie-callback`)
- Booking/chat APIs

Protected routes (auth required):
- `/storyboard-studio/**`
- `/admin/**`
- `/dashboard/**`

### Login Flow

```
1. User visits protected route
2. Clerk middleware redirects to /sign-in
3. User authenticates (email, OAuth, etc.)
4. LoginTracker.tsx checks IP/country blocking
5. Clerk sets session → user enters app
6. useSubscription() resolves plan tier
7. useFeatures() gates features based on plan
```

### Admin Access

Super admin role controlled via Clerk public metadata:
```typescript
user.publicMetadata.role === "super_admin"
```

---

## Payment Integration

### Stripe (Credit Top-Ups)

```
User clicks "Buy Credits" → /api/stripe/create-checkout → Stripe Checkout
→ Payment success → /api/stripe/webhook → credits.addCredits()
→ credits_balance updated + credits_ledger entry (type: "purchase")
```

### Clerk Billing (Subscriptions)

```
User clicks "Upgrade" → Clerk Billing Portal → Subscription checkout
→ Subscription active → Clerk webhook → ownerPlan updated
→ useSubscription() reads new plan → features unlocked
→ Monthly credits auto-granted on next dashboard load
```

---

## User Journey Examples

### Free User → Credit Purchase
1. Sign up → Free plan (100 monthly credits)
2. Generate AI content → Credits depleted
3. Click "Buy Credits" → Stripe checkout
4. Purchase 1,000 credits ($9.90)
5. Continue generating with purchased credits

### Free User → Pro Upgrade
1. Free user needs team features or more credits
2. Click "Upgrade to Pro" → Clerk Billing portal
3. Subscribe to Pro plan
4. Get 2,500 monthly credits + org creation
5. Create organization → Invite team members

### Org Member Experience
1. Alice (Pro) creates org, invites Bob (Free)
2. Bob opens Alice's org → inherits Pro features
3. Bob generates AI content using org's shared credit balance
4. Bob switches to personal → back to Free plan limits

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/plan-config.ts` | Plan definitions, limits, Clerk slugs |
| `hooks/useSubscription.ts` | Plan resolution (own + org owner inheritance) |
| `hooks/useFeatures.ts` | Feature gating by plan hierarchy |
| `lib/auth-utils.ts` | Client-side `useCurrentCompanyId()` |
| `lib/auth-utils-server.ts` | Server-side `getServerCurrentCompanyId()` |
| `lib/credit-pricing.ts` | Top-up package pricing |
| `convex/credits.ts` | Balance, ledger, monthly grants, deductions, refunds |
| `convex/companySettings.ts` | Per-company settings (defaultAI, company info) |
| `middleware.ts` | Auth routing (public vs protected) |
| `components/OrganizationSwitcherWithLimits.tsx` | Org creation gating |
| `app/storyboard-studio/components/LapsedBanner.tsx` | Lapsed subscription UI |
| `app/storyboard-studio/components/account/BillingSubscriptionPage.tsx` | Billing UI |
| `app/storyboard-studio/components/account/CreditBalanceDisplay.tsx` | Credit display + auto-grant |
| `app/storyboard-studio/components/account/CreditTransactionHistory.tsx` | Ledger history UI |
| `app/storyboard-studio/components/account/TransferCreditsDialog.tsx` | Org-to-org credit transfer |
