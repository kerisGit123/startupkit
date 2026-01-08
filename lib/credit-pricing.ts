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
 */
export function getCreditPackages(): CreditPackage[] {
  // Default values
  const defaults = {
    small: { credits: 100, amountInCents: 1000 },
    medium: { credits: 500, amountInCents: 4000 },
    large: { credits: 1000, amountInCents: 7000 },
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
      price: `MYR ${(smallPrice / 100).toFixed(2)}`,
      amountInCents: smallPrice,
      highlighted: false,
    },
    {
      id: "medium",
      credits: mediumCredits,
      price: `MYR ${(mediumPrice / 100).toFixed(2)}`,
      amountInCents: mediumPrice,
      highlighted: true,
      badge: "Best Value",
    },
    {
      id: "large",
      credits: largeCredits,
      price: `MYR ${(largePrice / 100).toFixed(2)}`,
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
