# Credit Pricing Configuration

## Where Credit Prices Are Defined

Credit pricing is **hardcoded** in the pricing page component.

### File: `app/pricing/page.tsx`

Lines 195-227 contain the credit pricing:

```typescript
<div className="grid md:grid-cols-3 gap-6">
  {/* 100 Credits - MYR 10.00 */}
  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
    <h3 className="text-xl font-semibold mb-2 text-gray-900">100 Credits</h3>
    <p className="text-3xl font-bold mb-4 text-gray-900">MYR 10.00</p>
    <button
      onClick={() => handleBuyCredits(100, 1000)}
      className="w-full py-2.5 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition shadow-sm"
    >
      Buy Now
    </button>
  </div>

  {/* 500 Credits - MYR 40.00 */}
  <div className="border-2 border-yellow-400 rounded-lg p-6 bg-yellow-50">
    <div className="bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
      Best Value
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">500 Credits</h3>
    <p className="text-3xl font-bold mb-4 text-gray-900">MYR 40.00</p>
    <button
      onClick={() => handleBuyCredits(500, 4000)}
      className="w-full py-2.5 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition shadow-sm"
    >
      Buy Now
    </button>
  </div>

  {/* 1000 Credits - MYR 70.00 */}
  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
    <h3 className="text-xl font-semibold mb-2 text-gray-900">1000 Credits</h3>
    <p className="text-3xl font-bold mb-4 text-gray-900">MYR 70.00</p>
    <button
      onClick={() => handleBuyCredits(1000, 7000)}
      className="w-full py-2.5 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition shadow-sm"
    >
      Buy Now
    </button>
  </div>
</div>
```

## How Credit Pricing Works

### Display Price vs Stripe Amount

- **Display Price**: What users see (e.g., "MYR 10.00")
- **Stripe Amount**: Amount in cents passed to Stripe (e.g., 1000 = MYR 10.00)

### handleBuyCredits Function

```typescript
handleBuyCredits(credits: number, amountInCents: number)
```

**Examples:**
- `handleBuyCredits(100, 1000)` → 100 credits for MYR 10.00
- `handleBuyCredits(500, 4000)` → 500 credits for MYR 40.00
- `handleBuyCredits(1000, 7000)` → 1000 credits for MYR 70.00

## How to Change Credit Pricing

### Option 1: Edit Directly in Pricing Page

Open `app/pricing/page.tsx` and modify:

1. **Display Price**: Change the text in `<p className="text-3xl font-bold mb-4 text-gray-900">MYR XX.XX</p>`
2. **Credits Amount**: Change first parameter in `handleBuyCredits(XXX, ...)`
3. **Stripe Amount**: Change second parameter in `handleBuyCredits(..., XXXX)` (in cents)

**Example - Change 100 credits to MYR 15.00:**

```typescript
<h3 className="text-xl font-semibold mb-2 text-gray-900">100 Credits</h3>
<p className="text-3xl font-bold mb-4 text-gray-900">MYR 15.00</p>
<button
  onClick={() => handleBuyCredits(100, 1500)}  // Changed from 1000 to 1500
  className="w-full py-2.5 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition shadow-sm"
>
  Buy Now
</button>
```

### Option 2: Move to Configuration File (Recommended)

Create a centralized config file for better maintainability:

**Create `lib/credit-pricing.ts`:**

```typescript
export const CREDIT_PACKAGES = [
  {
    id: "small",
    credits: 100,
    price: "MYR 10.00",
    amountInCents: 1000,
    highlighted: false,
  },
  {
    id: "medium",
    credits: 500,
    price: "MYR 40.00",
    amountInCents: 4000,
    highlighted: true,
    badge: "Best Value",
  },
  {
    id: "large",
    credits: 1000,
    price: "MYR 70.00",
    amountInCents: 7000,
    highlighted: false,
  },
];
```

Then update `app/pricing/page.tsx` to use this config:

```typescript
import { CREDIT_PACKAGES } from "@/lib/credit-pricing";

// In the component:
<div className="grid md:grid-cols-3 gap-6">
  {CREDIT_PACKAGES.map((pkg) => (
    <div 
      key={pkg.id}
      className={`rounded-lg p-6 ${
        pkg.highlighted 
          ? "border-2 border-yellow-400 bg-yellow-50" 
          : "border border-gray-200 bg-gray-50"
      }`}
    >
      {pkg.badge && (
        <div className="bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
          {pkg.badge}
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{pkg.credits} Credits</h3>
      <p className="text-3xl font-bold mb-4 text-gray-900">{pkg.price}</p>
      <button
        onClick={() => handleBuyCredits(pkg.credits, pkg.amountInCents)}
        className="w-full py-2.5 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition shadow-sm"
      >
        Buy Now
      </button>
    </div>
  ))}
</div>
```

## Credit Purchase Flow

1. User clicks "Buy Now" on pricing page
2. `handleBuyCredits(credits, amountInCents)` is called
3. API creates Stripe checkout session with:
   - `amount`: amountInCents (e.g., 1000 = MYR 10.00)
   - `credits`: number of credits to add
4. User completes payment on Stripe
5. Stripe webhook receives `checkout.session.completed`
6. Credits are added to user's account
7. Purchase is recorded in `credit_purchases` table with:
   - `tokens`: number of credits
   - `amountPaid`: amount in cents
   - `currency`: "myr"

## Current Pricing Structure

| Credits | Display Price | Stripe Amount (cents) | Cost per Credit |
|---------|--------------|----------------------|-----------------|
| 100     | MYR 10.00    | 1000                 | MYR 0.10        |
| 500     | MYR 40.00    | 4000                 | MYR 0.08        |
| 1000    | MYR 70.00    | 7000                 | MYR 0.07        |

## Also Displayed On

Credit pricing is also shown on:
- **Billing Page** (`app/dashboard/billing/page.tsx`) - Same credit packages
- Both pages use the same hardcoded values

## Important Notes

1. **Currency**: Currently hardcoded to MYR (Malaysian Ringgit)
2. **Stripe Amount**: Always in cents (multiply by 100)
3. **No Stripe Products**: Credits don't use Stripe Products/Prices - they use one-time payments
4. **Purchase History**: Shows the amount paid from Stripe checkout session

## To Change Currency

If you want to change from MYR to another currency:

1. Update display prices in `app/pricing/page.tsx`
2. Update Stripe checkout API call in `app/api/stripe/create-checkout/route.ts`
3. Change currency parameter from "myr" to your desired currency code
