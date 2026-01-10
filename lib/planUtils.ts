import { PLANS, PlanId } from "./plans";

export function getPlanPrice(planId: string, interval?: string): string {
  const plan = PLANS[planId as PlanId];
  if (!plan) return "N/A";
  
  if (interval === "year" && plan.yearlyPrice) {
    return `MYR ${plan.yearlyPrice.toFixed(2)}/year`;
  }
  
  if (plan.monthlyPrice !== undefined) {
    return `MYR ${plan.monthlyPrice.toFixed(2)}/month`;
  }
  
  return plan.prices.monthly?.label || "Contact Us";
}

export function getPlanInterval(interval?: string): string {
  if (interval === "year") return "Yearly";
  if (interval === "month") return "Monthly";
  return "Monthly";
}
