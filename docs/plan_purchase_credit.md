# Purchase Credits — How It Works

This document covers the credit top-up purchase system: what it is, how the purchase
flows, what the credits cost per AI operation, and all the rules around refunds and
transfers. For subscription monthly credits, see [plan_subscription.md](plan_subscription.md).

---

## 1. Two Separate Credit Sources

Credits in your balance come from two completely independent sources:

| Source                     | How often           | Expires?     | Refundable?  | Billing platform   |
|----------------------------|---------------------|--------------|--------------|--------------------|
| **Subscription grant**     | Monthly (auto)      | End of cycle | On clawback  | Clerk Billing      |
| **Top-up pack (purchase)** | One-time, on demand | Never        | No           | Stripe Checkout    |

Both sit in the same credit balance and spend the same way. The difference only matters
when a plan changes — subscription credits can be clawed back, purchased credits never are.

---

## 2. The Three Packs

| Pack   | Price | Credits | Per credit | Good for                                 |
|--------|-------|---------|------------|------------------------------------------|
| Small  | $10   | 1,000   | $0.010     | ~200 basic images, or ~4 short videos    |
| Medium | $50   | 5,000   | $0.010     | ~1,000 basic images, or ~20 short videos |
| Large  | $249  | 25,000  | $0.00996   | Bulk production work                     |

Flat rate across all packs — no bulk discount. Prices are set in `lib/credit-pricing.ts`
and can be overridden per-deployment via `NEXT_PUBLIC_CREDIT_*` environment variables.

---

## 3. How a Purchase Works (Step by Step)

```text
User clicks "Buy Now"
       │
       ▼
Stripe Checkout (hosted page — payment processed by Stripe, not us)
       │
       ▼
Stripe sends checkout.session.completed webhook → /api/stripe/webhook
       │
       ▼
Backend validates webhook signature (STRIPE_WEBHOOK_SECRET)
       │
       ▼
createPaymentTransaction mutation writes a purchase row to credits_ledger
       │
       ▼
credits_balance.balance incremented immediately
       │
       ▼
User sees updated balance when they return to the app
```

**Idempotency:** The webhook handler de-duplicates by Payment Intent ID. If Stripe
retries a webhook (network hiccup), the second delivery is silently ignored — no
double-credit, no double-charge.

---

## 4. Where Credits Land

Top-up credits always land in the **buyer's personal workspace balance**, regardless of
which workspace they were viewing when they clicked "Buy".

This is intentional:

- Only the account owner can make purchases — there is no "buy on behalf of a team" flow.
- It keeps the audit trail clean — one purchase → one personal balance entry.
- The owner then decides how to distribute credits to their teams.

**To move credits into a team org:** Use the **Transfer Credits** dialog (found in
Billing & Subscription). The owner can transfer any amount from their personal balance
into any org they own. Team members can spend from the org pool but cannot transfer
credits in or out themselves.

---

## 5. What Operations Cost

Credits are deducted per AI generation call. Costs vary by model and settings.
User-facing costs are derived from Kie AI's wholesale prices multiplied by a margin factor:

- **Factor 0.625** — competitive/hot models (NB2, GPT Image 2, Seedance family):
  19–30% margin. Priced to attract customers.
- **Factor 1.2** — premium models (Kling, Veo, Topaz, Music AI, TTS):
  55–75% margin. Profit center.

### Image generation (representative costs)

| Model         | Cost         | Notes                                      |
|---------------|--------------|---------------------------------------------|
| Z-Image (NB2) | 1 credit     | Fastest, cheapest                           |
| GPT Image 2   | 4-10 credits | 4 cr at 1K res, 7 cr at 2K, 10 cr at 4K   |
| NB Pro        | 5 credits    | Higher quality than NB2                     |

### Video generation (representative costs)

| Model             | Cost range      | Notes                                                               |
|-------------------|-----------------|---------------------------------------------------------------------|
| Seedance 1.5 Pro  | 11-269 credits  | Depends on resolution (480p-1080p), duration (4-12s), audio on/off  |
| Seedance 2.0      | 69-246+ credits | Per-second billing; more expensive without video input              |
| Seedance 2.0 Fast | ~45-200 credits | Cheaper per second than 2.0                                         |
| Kling 3.0         | 120-162 credits | 720p 5s = ~120 cr, 1080p 5s = ~162 cr                              |
| Veo 3.1           | Premium tier    | Highest quality, factor 1.2                                         |

### Post-processing

| Operation             | Cost            | Notes                                        |
|-----------------------|-----------------|----------------------------------------------|
| Prompt Enhancement    | 1 credit        |                                              |
| Topaz Image Upscale   | 12–48 credits   | Depends on upscale factor (1x / 2x / 4x)    |
| Topaz Video Upscale   | ~96–168 credits | 10s video: 96 cr at 2x, 168 cr at 4x        |
| Remove Background     | 1 credit        |                                              |
| Music AI (up to 4 min) | 12 credits     |                                              |

Full pricing is defined in `lib/storyboard/pricing.ts` and calculated at generation
time via the `/api/storyboard/calculate-price` route.

---

## 6. Automatic Refunds on Failed Generation

If a generation fails for a technical reason, credits are refunded automatically.

**Refunded automatically:**

- Provider returned an error (Kie AI, OpenAI, Anthropic outage)
- NSFW content filter rejected the prompt
- Callback reported failure status

**Not refunded:**

- Generation completed successfully but you dislike the output
- You cancelled the request after generation started

Refunds appear as a `refund` row in the credit ledger within seconds. No support ticket
is needed. Your balance is restored immediately on the next page load.

---

## 7. No Refunds on Purchases

**Credit top-up purchases are final and cannot be refunded.**

Once the Stripe charge completes:

- Credits are immediately added to your balance.
- The purchase cannot be cancelled, reversed, or exchanged for money.
- Credits cannot be transferred to another user account or converted to cash.

**Why this policy exists:** The moment you generate with AI, the underlying compute
cost is charged to us by Kie AI / OpenAI / Anthropic in real time. That cost is
irrecoverable. Allowing purchase refunds after credits have been spent would mean
absorbing the compute cost with no revenue to cover it.

Credits themselves never expire — any unused purchased credits stay in your balance
indefinitely, even if you downgrade or cancel your subscription.

---

## 8. Chargebacks

Initiating a chargeback (disputing the charge with your bank) against a top-up purchase
after the credits have been spent is treated as fraud. It will not result in credits
being removed from your balance retroactively. We report confirmed chargeback fraud to
fraud-prevention services and may suspend the account.

If there is a genuine issue (duplicate charge, unauthorized purchase), contact support
before filing a chargeback. We can investigate and resolve directly, which is faster
than the bank dispute process.

---

## 9. Ledger — What Gets Recorded

Every credit movement is logged in `credits_ledger` in Convex. Purchase-related entries:

| Ledger type        | When it is written                      | Direction |
|--------------------|-----------------------------------------|-----------|
| `purchase`         | Stripe webhook confirms checkout        | +         |
| `usage`            | AI generation deducts credits           | −         |
| `refund`           | Failed generation restores credits      | +         |
| `transfer_out`     | Owner transfers credits to an org       | −         |
| `transfer_in`      | Org receives transferred credits        | +         |
| `admin_adjustment` | Support manual correction               | ±         |

The ledger is append-only and permanent — even after account deletion, financial
records are retained for the period required by tax law (typically 5–7 years).

---

## 10. Technical Reference

| Item                        | Location                                       |
|-----------------------------|------------------------------------------------|
| Pack prices + configuration | `lib/credit-pricing.ts`                        |
| Price env vars              | `NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS` etc     |
| Stripe webhook handler      | `app/api/stripe/webhook/route.ts`              |
| Credit deduction mutation   | `convex/credits.ts` → `deductCredits`          |
| Purchase ledger write       | `convex/credits.ts` → `createPaymentTransaction` |
| Per-model pricing           | `lib/storyboard/pricing.ts`                    |
| Price calculator route      | `app/api/storyboard/calculate-price/route.ts`  |
| Transfer credits mutation   | `convex/credits.ts` → `transferCredits`        |

---

*Last updated: May 2026. Maintained alongside `lib/credit-pricing.ts` and
`lib/storyboard/pricing.ts`.*
