# Subscription System — How It Works

This document explains how subscriptions, upgrades, downgrades, cancellations, and credit
refills work in StartupKit. Written for non-technical partners and collaborators.

---

## 1. The Three Plans

| Plan         | Price                         | Credits / month            | Storage | Orgs | Members per org |
|--------------|-------------------------------|----------------------------|---------|------|-----------------|
| **Free**     | $0                            | 50 × first 3 months only   | 300 MB  | 0    | 1 (yourself)    |
| **Pro**      | $45/mo or $39.90/mo (annual)  | 3,500                      | 10 GB   | 1    | 5               |
| **Business** | $119/mo or $89.90/mo (annual) | 8,000                      | 20 GB   | 3    | 15 per org      |

**Credits** are the in-app currency used to generate images, videos, and audio with AI.
Each plan includes a monthly credit allowance that resets every billing cycle.

> **Free plan note:** The 50 credits/month grant fires once per calendar month, up to 3 times total (150 credits over 3 months). After the 3rd grant the monthly refill stops. Top-up packs and subscription upgrades work normally at any time.

**Orgs (organizations)** are team workspaces. Pro allows 1 team; Business allows 3 teams.
The subscription is owned by the person who paid — team members inherit the plan's features
but do not each need their own subscription.

---

## 2. Subscribing (New Sign-Up)

1. User creates a free account.
2. User visits the **Pricing** page and clicks **Upgrade to Pro** or **Upgrade to Business**.
3. They are taken to Clerk Billing (our payment processor) to enter payment details.
4. Once payment is confirmed, the plan is activated immediately.
5. The full monthly credit allowance is granted to their personal workspace right away
   (e.g. Pro → 3,500 credits deposited).

No waiting, no proration on the first payment — full credit grant on day one.

---

## 3. Upgrading (Moving to a Higher Plan)

Example: **Pro → Business**, or **Free → Pro**.

**What happens:**

- The new plan is activated immediately.
- The user receives the **full new monthly credit allowance** on top of whatever they
  already have. Existing credits are never touched.
- Org and seat limits are increased to the new plan's limits immediately.
- Any previously frozen (over-quota) orgs are automatically unfrozen.

**Credit example:**

> A Pro user has 1,200 credits remaining. They upgrade to Business mid-month.
> They immediately receive 8,000 new credits.
> New balance: **1,200 + 8,000 = 9,200 credits**.

Upgrades are purely additive — users never lose credits when going up.

---

## 4. Downgrading (Moving to a Lower Plan)

Example: **Business → Pro**, or **Pro → Free**.

### 4a. Credit Clawback

When downgrading, the **unused portion of the current plan's monthly grant** is taken back.
Then the new plan's grant is applied fresh.

**Why?** To prevent gaming — without clawback, a user could buy Business ($119), get 8,000
credits, immediately downgrade to Free, keep the 8,000 credits, and repeat.

**What is NOT clawed back:**

- Credits bought as top-up packs (those are permanent purchases).
- Credits earned through referrals or admin adjustments.

**Credit example:**

> A Business user received 8,000 credits this month. They used 3,000.
> They downgrade to Pro mid-month.
> System claws back unused grant: 8,000 − 3,000 = **5,000 clawed back**.
> Pro grant applied: **3,500 new credits**.
> New balance (plus any top-up credits they own): **3,500**.

### 4b. Org Slot Enforcement (Business → Pro)

Business allows 3 orgs. Pro allows 1.

When a Business user downgrades to Pro:

- Their **oldest org is kept active** (assumed to be their main workspace).
- Their **2 newest orgs are frozen** — generation is blocked, but all files and projects
  remain visible and safe.
- Frozen orgs show a "Workspace over your plan limit" notice.
- The user must either **delete the frozen orgs** or **upgrade back** to unfreeze them.

No data is deleted on downgrade. Freezing only blocks new AI generation.

### 4c. Downgrade to Free

When a paid user cancels and drops to Free:

- **All orgs they created are lapsed** (frozen). They drop to the Free plan's 0-org limit.
- The personal workspace stays active on the Free plan (50 credits/month for up to 3 months).
- Top-up credits in the personal workspace are unaffected.
- A 90-day grace period begins for all lapsed orgs (see Section 6 on data retention).

---

## 5. Cancelling a Subscription

Cancellation can be done anytime from **Billing & Subscription → Plans**.

- Takes effect **immediately** (not end of billing period).
- Plan drops to **Free** right away.
- Unused subscription credits from the cancelled plan are clawed back (same as downgrade).
- The Free plan's 50-credit monthly grant is then issued (if the user has not yet exhausted their 3 free months).
- All orgs created by the user are marked lapsed.
- Top-up credit purchases are NOT affected — they stay in the balance and never expire.

---

## 6. Lapsed Orgs and Data Retention

A workspace becomes "lapsed" when the owner's plan no longer covers it. This happens when:

- The owner cancels their subscription.
- The owner downgrades and the org exceeds the new plan's org slot limit.

**Lapsed workspace behaviour:**

| Time after lapse | What happens                                                                                 |
|------------------|----------------------------------------------------------------------------------------------|
| Day 0            | Generation blocked. Files remain visible and accessible.                                     |
| Days 1–90        | Grace period. Resubscribe to restore full access immediately. Files remain in storage.       |
| Day 90+          | Eligible for file purge. Generated images, videos, and audio deleted from cloud storage. Financial records (invoices, ledger) are kept permanently. |

Re-subscribing during the grace period restores the workspace instantly — files are intact.

---

## 7. Credit Top-Up Packs (One-Time Purchases)

Separate from the subscription. Users can buy extra credits at any time.

| Pack         | Price   | Credits | Per credit |
|--------------|---------|---------|------------|
| Starter      | $9.90   | 1,000   | ~$0.01     |
| Standard     | $49.50  | 5,000   | ~$0.01     |
| Pro Pack     | $247.50 | 25,000  | ~$0.01     |

**Rules:**

- Top-up credits always land in the **personal workspace balance**.
- Use the **Transfer Credits** feature to move them to a team org.
- Top-up credits **never expire** and are **never clawed back** on plan changes.
- **Top-up purchases are final** — no refunds, no cancellation.
  (Reason: AI generation cost is incurred instantly on third-party servers and cannot be reversed.)
- If a generation fails for a technical reason (provider error, content filter), credits are
  automatically refunded. No support ticket needed.

---

## 8. Abuse Prevention — Cycling Block

**The problem this solves:** A user could rapidly subscribe → cancel → subscribe to keep
harvesting fresh monthly credit grants (e.g. 3,500 credits each time they re-subscribe to Pro).

**How it works:**

- The system tracks every plan change.
- If a user makes **5 or more plan changes within 30 days**, their account is flagged.
- For the next 30 days, the **monthly credit grant is paused** — they can still use their plan
  features and spend existing credits, but the automatic monthly refill does not fire.
- After 30 days, the block expires and normal monthly grants resume.
- A warning banner is shown in their dashboard: *"Monthly credit refill paused until [date]"*.

This does **not** block the subscription itself — the user still has full access to all
Pro/Business features. Only the automatic credit refill is paused.

---

## 9. How Credits Flow — Summary

```text
Subscription active
  └─ Monthly grant deposited into personal workspace at start of each cycle
       └─ User distributes credits to org workspaces via Transfer Credits

Top-up purchase
  └─ Credits deposited directly into personal workspace
       └─ Never expire, never clawed back

Upgrade
  └─ Full new grant deposited immediately (additive, no clawback)

Downgrade / Cancel
  └─ Unused subscription grant clawed back
  └─ New plan grant deposited (smaller allowance or Free's 50 credits)
  └─ Top-up credits untouched
  └─ Over-quota orgs frozen (generation blocked, files safe)

Cycling block (5+ changes in 30 days)
  └─ Monthly grant paused for 30 days
  └─ Existing credits still usable
  └─ Dashboard warning shown
```

---

## 10. Technical System Overview (for Developers)

The subscription system is built on three layers:

**Clerk Billing** handles all payment processing, checkout flows, and plan state. Users never
interact with Stripe directly — Clerk wraps it.

**Clerk Webhooks** (`/api/clerk/webhook`) receive real-time events when a subscription changes:
`subscription.updated`, `subscriptionItem.updated`, `subscription.deleted`, etc.

**Convex mutation `propagateOwnerPlanChange`** is called by the webhook and runs as a single
atomic transaction that:

1. Updates `ownerPlan` on all workspaces owned by the user (personal + all orgs they created).
2. Sets `lapsedAt` on orgs that exceed the new plan's org slot limit.
3. Clears `lapsedAt` on orgs that were previously frozen and are now back within quota.
4. Logs a `subscription_change` audit entry in the credits ledger.
5. Detects cycling abuse (5+ changes in 30 days) and sets `cyclingBlockedUntil` if triggered.
6. Calls `grantMonthlyCreditsIfDue` to apply clawback and new grant immediately.

Everything in steps 1–6 happens in one database transaction — there is no window between
"plan updated" and "orgs frozen".

---

*Last updated: May 2026. Maintained alongside `convex/credits.ts` and `lib/plan-config.ts`.*
