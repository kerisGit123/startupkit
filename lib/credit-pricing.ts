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
 * Pricing: flat $0.0099/credit across all packs.
 * No bulk discount — simpler pricing, better margins.
 * Kie wholesale cost: $0.005/credit → ~50% gross margin on top-ups.
 */
export function getCreditPackages(): CreditPackage[] {
  // Default values — flat rate $0.0099/credit, no bulk discount
  // Margin is already thin at 19% ($0.0099 revenue vs $0.008 Kie cost per user credit)
  const defaults = {
    small:  { credits: 1000,  amountInCents: 990 },    // $9.90   → $0.0099/credit
    medium: { credits: 5000,  amountInCents: 4950 },   // $49.50  → $0.0099/credit
    large:  { credits: 25000, amountInCents: 24750 },  // $247.50 → $0.0099/credit
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
      highlighted: false,
    },
    {
      id: "large",
      credits: largeCredits,
      price: `USD ${(largePrice / 100).toFixed(2)}`,
      amountInCents: largePrice,
      highlighted: false,
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
    price: "USD 49.50",
    amountInCents: 4950,
    highlighted: false,
  },
  {
    id: "large",
    credits: 25000,
    price: "USD 247.50",
    amountInCents: 24750,
    highlighted: false,
  },
];
