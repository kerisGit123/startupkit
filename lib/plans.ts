export type PlanId = "free" | "starter" | "pro" | "business";

export type PlanInfo = {
  id: PlanId;
  title: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  prices: {
    monthly?: { label: string };
    yearly?: { label: string };
  };
  features: string[];
  entitlements: {
    scansPerMonth: number;
    storageMB: number;
  };
};

export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: "free",
    title: "Free",
    monthlyPrice: 0,
    prices: {
      monthly: { label: "MYR 0.00/month" },
    },
    features: ["5 Scans per month"],
    entitlements: { scansPerMonth: 5, storageMB: 10 },
  },
  starter: {
    id: "starter",
    title: "Starter",
    monthlyPrice: 9.90,
    yearlyPrice: 99.00,
    prices: {
      monthly: { label: "MYR 9.90/month" },
      yearly: { label: "MYR 99.00/year" },
    },
    features: ["50 Scans per month", "Organization"],
    entitlements: { scansPerMonth: 50, storageMB: 100 },
  },
  pro: {
    id: "pro",
    title: "Pro",
    monthlyPrice: 29.00,
    yearlyPrice: 299.00,
    prices: {
      monthly: { label: "MYR 29.00/month" },
      yearly: { label: "MYR 299.00/year" },
    },
    features: ["200 Scans per month", "AI Summary", "Organization"],
    entitlements: { scansPerMonth: 200, storageMB: 300 },
  },
  business: {
    id: "business",
    title: "Business",
    prices: {
      monthly: { label: "Contact Us" },
    },
    features: ["Unlimited Scans", "Custom AI", "Priority Support", "Organization"],
    entitlements: { scansPerMonth: -1, storageMB: -1 },
  },
};
