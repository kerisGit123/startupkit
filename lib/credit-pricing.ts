/**
 * Credit Pricing Configuration
 * 
 * This file centralizes all credit package pricing.
 * Prices can be overridden via environment variables for easy deployment configuration.
 */

export interface CreditPackage {
  id: string;
  credits: number;
  price: string;
  amountInCents: number;
  highlighted?: boolean;
  badge?: string;
}

/**
 * Get credit packages with pricing from environment variables or defaults
 *
 * Pricing targets ~55-62% net margin after Stripe fees, assuming Kie wholesale
 * cost of $0.005/credit and the 1.2x burn multiplier in storyboard_model_credit.
 * Top-up per-credit rates are intentionally higher than the Pro subscription
 * rate (~$0.00995/credit) to preserve the subscription incentive.
 */
export function getCreditPackages(): CreditPackage[] {
  // Default values
  const defaults = {
    small:  { credits: 1000,  amountInCents: 990 },    // $9.90   → $0.00990/credit
    medium: { credits: 5000,  amountInCents: 4490 },   // $44.90  → $0.00898/credit (Save 9%)
    large:  { credits: 25000, amountInCents: 19900 },  // $199.00 → $0.00796/credit (Save 20%)
  };

  // Override from environment if available
  const smallCredits = parseInt(process.env.NEXT_PUBLIC_CREDIT_SMALL_AMOUNT || String(defaults.small.credits));
  const smallPrice = parseInt(process.env.NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS || String(defaults.small.amountInCents));

  const mediumCredits = parseInt(process.env.NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT || String(defaults.medium.credits));
  const mediumPrice = parseInt(process.env.NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS || String(defaults.medium.amountInCents));

  const largeCredits = parseInt(process.env.NEXT_PUBLIC_CREDIT_LARGE_AMOUNT || String(defaults.large.credits));
  const largePrice = parseInt(process.env.NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS || String(defaults.large.amountInCents));

  return [
    {
      id: "small",
      credits: smallCredits,
      price: `USD ${(smallPrice / 100).toFixed(2)}`,
      amountInCents: smallPrice,
      highlighted: false,
    },
    {
      id: "medium",
      credits: mediumCredits,
      price: `USD ${(mediumPrice / 100).toFixed(2)}`,
      amountInCents: mediumPrice,
      highlighted: true,
      badge: "Save 9%",
    },
    {
      id: "large",
      credits: largeCredits,
      price: `USD ${(largePrice / 100).toFixed(2)}`,
      amountInCents: largePrice,
      highlighted: false,
      badge: "Save 20%",
    },
  ];
}

/**
 * Default credit packages (for reference)
 */
export const DEFAULT_CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "small",
    credits: 1000,
    price: "USD 9.90",
    amountInCents: 990,
    highlighted: false,
  },
  {
    id: "medium",
    credits: 5000,
    price: "USD 44.90",
    amountInCents: 4490,
    highlighted: true,
    badge: "Save 9%",
  },
  {
    id: "large",
    credits: 25000,
    price: "USD 199.00",
    amountInCents: 19900,
    highlighted: false,
    badge: "Save 20%",
  },
];
