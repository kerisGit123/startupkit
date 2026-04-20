# StartupKit Billing Policy

> **Audience:** end users, support staff, and developers integrating new billing flows.
> **Last updated:** 2026-04-20.
> This document is the single source of truth for how subscriptions, credit purchases, refunds, plan changes, and cancellations work. **Reference this when handling billing disputes.**

---

## 1. Two billing products

StartupKit has exactly two paid products. They are independent — buying one does not affect the other.

| Product | Billing platform | Recurring? | Refundable? | Cancellable? |
|---|---|---|---|---|
| **Subscription plan** (Free / Pro / Business) | Clerk Billing (Stripe under the hood) | Yes (monthly or annual) | Subject to Clerk's pro-rated refund on cancellation | **Yes — anytime, immediate** |
| **Credit top-up** (one-time pack purchase) | Stripe Checkout (direct) | No (one-time payment) | **No — final sale** | **No — cannot be cancelled or refunded** |

---

## 2. Subscription plans

### 2.1 The three plans

| Plan | Price | Monthly credits | Storage | Orgs | Members per org |
|---|---|---|---|---|---|
| Free | $0 | 100 | 300 MB | 0 | 1 |
| Pro | $39.90/mo or $32/mo annual | 2,500 | 10 GB | 1 | 5 |
| Business | $69.90/mo or $63/mo annual | 6,900 | 20 GB | 3 | 15 |

Annual billing applies a discount and is charged in one upfront payment.

### 2.2 What you get

- A monthly **credit grant** at the start of every billing cycle (see §4 for accounting rules).
- Storage and project limits per the table above.
- Ability to create organizations and invite members (Pro and Business only).
- Members **inherit** the org owner's plan benefits (see §6).

### 2.3 Cancellation

You can cancel your subscription at any time from the **Billing & Subscription → Plans** tab.

- Cancellation takes effect **immediately** when processed by Clerk Billing.
- Your plan is downgraded to **Free** for billing purposes.
- **Unused credits from your previous paid plan are clawed back** at cancellation (see §4 — downgrade rule). The Free plan's 100-credit grant is then issued.
- Top-up credits you have purchased are **not affected** — they remain in your balance.
- Any organizations you created are marked **lapsed** (see §5).

If Clerk Billing pro-rates a refund for the unused portion of your billing cycle, that refund is processed by Stripe and lands on your original payment method per Stripe's standard timeline (usually 5–10 business days).

### 2.4 Plan changes (upgrade / downgrade) mid-cycle

- **Upgrade** (Free → Pro, Pro → Business, Free → Business):
  - You receive the **full new monthly credit allowance** immediately.
  - **Existing unused credits are preserved** — the upgrade is purely additive.
  - Example: Free user with 90 unused credits upgrades to Pro → balance becomes 90 + 2,500 = 2,590.
- **Downgrade** (Business → Pro, Pro → Free, Business → Free):
  - The unused portion of the previous plan's monthly grant is **clawed back**.
  - The new plan's monthly grant is then applied.
  - Example: Pro user with 1,000 unused subscription credits downgrades to Free → 1,000 clawed back, then 100 Free grant added → balance change of −900.
  - Top-up purchase credits are **never** clawed back.
- **Same plan, mid-cycle**: no change.

The asymmetric rule (preserve on upgrade, claw back on downgrade) prevents users from accumulating extra credits by repeatedly switching plans.

---

## 3. Credit top-up purchases

### 3.1 The packs

| Pack | Price | Credits | Per-credit cost |
|---|---|---|---|
| Starter | $9.90 | 1,000 | $0.0099 |
| Standard | $44.90 | 5,000 | $0.00898 (Save 9%) |
| Pro | $199.00 | 25,000 | $0.00796 (Save 20%) |

### 3.2 How it works

1. From **Billing & Subscription → Credits** tab, click **Buy Now** on a pack.
2. You're redirected to Stripe Checkout (hosted by Stripe).
3. Enter your payment details and complete checkout.
4. Stripe sends a `checkout.session.completed` webhook to our backend.
5. Our backend writes a `purchase` row to your credit ledger and increments your balance.
6. You see the new balance immediately when you return to the app.

Webhook handling is **idempotent** — if Stripe retries (e.g. due to network errors), we de-duplicate by Payment Intent ID, so you cannot be double-charged or double-credited.

### 3.3 Where the credits land

Top-up purchases always go into your **personal workspace credit balance**, regardless of whether you bought them while viewing an org. To move them into an org you own, use the **Transfer Credits** dialog.

### 3.4 No refunds, no cancellation

**Credit top-up purchases are final.** Once a purchase completes:

- The credits are immediately added to your balance.
- The purchase **cannot be cancelled** or refunded under any circumstance.
- Credits **never expire** — they remain in your balance until you spend them.
- Credits **cannot be converted back to cash, transferred between users, or sold**.

This policy exists because credits are spent in real time on third-party AI services (KIE AI, OpenAI, Anthropic, etc.) — the underlying compute cost is incurred at the moment of generation and cannot be reversed.

If you experience a technical issue causing failed AI generations, the system **automatically refunds the credits to your balance** as part of normal error handling (see §4.4) — no manual support ticket needed.

---

## 4. Credit accounting

### 4.1 Ledger types

Every credit movement is logged in `credits_ledger` with one of these types:

| Type | Direction | Source |
|---|---|---|
| `subscription` | + | Monthly subscription grant |
| `purchase` | + | Stripe top-up purchase |
| `usage` | − | AI generation (image, video, audio, etc.) |
| `refund` | + | Failed generation refund |
| `transfer_in` / `transfer_out` | ± | Owner-initiated transfer between owned workspaces |
| `admin_adjustment` | ± | Manual support tweaks; clawbacks at cycle rollover |
| `org_created` | 0 | Marker only — used for ownership derivation |

### 4.2 Monthly grants don't roll over

Subscription credits are **per-cycle entitlements**, not bank balances. At the end of every calendar month, any unused portion of the prior month's subscription grant is clawed back, and a fresh grant is issued.

**Top-up purchases are exempt** — they sit alongside the monthly grant and don't expire.

### 4.3 Plan-change rules (recap from §2.4)

- **Upgrade**: skip clawback, add new grant.
- **Downgrade**: claw back leftover, add new grant.
- **Same plan, new month**: claw back leftover, add new grant.

### 4.4 Refunds on failed generation

If an AI generation fails (NSFW filter rejected the prompt, the underlying provider returned an error, the callback reports failure, etc.), the credits are **automatically refunded** to your balance via a `refund` ledger row. You'll see the refund within a few seconds of the failure.

If a generation succeeds but the output is unusable (e.g. you don't like the image), credits are **not** refunded — the underlying compute was performed and paid for.

---

## 5. Lapsed subscriptions and data retention

### 5.1 What "lapsed" means

When your paid subscription ends (cancellation or expiration without renewal), affected workspaces are marked **lapsed**:

- Personal workspace: marked lapsed (UI shows a banner). Credit balance and history remain accessible.
- Organizations you created: marked lapsed (org members see a banner, new project creation is blocked).

### 5.2 Lapse → purge timeline

| Time after lapse | What happens |
|---|---|
| Day 0 | Subscription ends, workspaces marked lapsed. New generation blocked. Existing files remain accessible. |
| Days 1 – 90 | Grace period. You can resubscribe at any time to immediately unlapse. Files remain in storage. |
| Day 90+ | Eligible for **R2 file purge** by an administrator. The actual purge runs at admin discretion. |

### 5.3 What gets purged vs preserved

When a lapsed workspace is purged:

- **Purged**: media files in object storage (R2) — generated images, videos, audio.
- **Preserved**: the entire financial audit trail — credit ledger, balance, transactions, invoices, project metadata. This is required for compliance and tax reconciliation.

**You cannot opt out of audit-trail retention.** Even if you request account deletion, financial records are retained for the period required by applicable tax law.

### 5.4 Resubscribing after a lapse

If you resubscribe **before** the purge runs, your files are intact and accessible immediately. If you resubscribe **after** the purge, your account history is intact but generated media files are gone — you'd need to regenerate them.

---

## 6. Multi-user organizations

### 6.1 Plan inheritance

When you (the org owner) create an org while on a paid plan, the org records a **snapshot** of your plan. Org members inherit that plan's features (storage limit, generation models, etc.) without needing their own subscription.

If you change plans, the snapshot is updated automatically across all your owned orgs.

If you cancel your subscription, your orgs become lapsed (see §5).

### 6.2 Where org credits come from

Organizations do **not** receive automatic monthly credit grants. The monthly grant lands in your personal workspace, and you transfer credits to your orgs via the **Transfer Credits** dialog. This prevents accidentally double-granting (personal: 2,500 + org: 2,500 = 5,000 from one $39.90 subscription).

Org members can spend from the org's transferred credit pool but cannot transfer credits in or out.

---

## 7. Disputes and chargebacks

If you disagree with a charge, please contact support **before** initiating a chargeback with your bank. We can usually resolve issues directly (refund a misfired subscription, investigate a webhook failure, etc.) faster than a chargeback dispute resolves.

A chargeback initiated against a credit top-up purchase will not result in credits being removed from your balance after the credits have been spent — meaning the chargeback effectively makes those credits free, which we treat as fraud and may result in account suspension and reporting to fraud-prevention services.

---

## 8. Contact

For billing questions, contact: **support@yourdomain.com**

Include in your message:
- Your account email
- The transaction date and amount
- A description of the issue

We aim to respond within one business day.
