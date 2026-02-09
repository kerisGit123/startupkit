"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useCompany } from "@/hooks/useCompany";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS } from "@/lib/plans";
import { getCreditPackages } from "@/lib/credit-pricing";
import Link from "next/link";

export default function PricingPage() {
  const { user } = useUser();
  const { companyId } = useCompany();
  const { plan: currentPlan } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const creditPackages = getCreditPackages();

  const handleSubscribe = async (planId: string) => {
    if (!user || !companyId) {
      alert("Please sign in to subscribe");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle,
          companyId,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleBuyCredits = async (tokens: number, amount: number) => {
    if (!user || !companyId) {
      alert("Please sign in to buy credits");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          tokens,
          amount,
          companyId,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Pricing Plans</h1>
          <p className="text-[13px] text-gray-500 mb-8">
            Choose the perfect plan for your needs
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-white rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg transition-all font-medium text-sm ${
                billingCycle === "monthly"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg transition-all font-medium text-sm ${
                billingCycle === "yearly"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.values(PLANS).filter(p => p.id !== "business").map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const price = billingCycle === "monthly" 
              ? plan.prices.monthly 
              : plan.prices.yearly;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow relative ${
                  isCurrentPlan ? "border-emerald-400 border-2" : "border-gray-100"
                }`}
              >
                {isCurrentPlan && (
                  <span className="absolute -top-2.5 left-5 bg-emerald-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    Current Plan
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1 text-gray-900">{plan.title}</h3>
                <div className="text-3xl font-bold mb-5 text-gray-900">
                  {price?.label || "N/A"}
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard/billing"
                      className="w-full py-2.5 px-6 rounded-xl font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 block text-center text-sm"
                    >
                      Manage Subscription
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="w-full py-2 px-6 rounded-xl font-medium transition-colors text-red-500 hover:text-red-600 block text-center text-xs"
                    >
                      Cancel Plan
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={plan.id === "free"}
                    className={`w-full py-2.5 px-6 rounded-xl font-medium transition-all text-sm ${
                      plan.id === "free"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {plan.id === "free" ? "Free Forever" : "Subscribe"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Credits Section */}
        <div id="credits" className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-xl font-bold mb-1 text-gray-900">Buy Credits</h2>
          <p className="text-[13px] text-gray-500 mb-5">
            One-time credit purchases for additional scans
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-xl p-5 hover:shadow-md transition-shadow relative ${
                  pkg.highlighted
                    ? "border-2 border-emerald-400 bg-emerald-50/50"
                    : "border border-gray-100 bg-white"
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-2.5 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    {pkg.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold mb-0.5 text-gray-900">
                  {pkg.credits} Credits
                </h3>
                <p className="text-2xl font-bold mb-4 text-gray-900">{pkg.price}</p>
                <button
                  onClick={() => handleBuyCredits(pkg.credits, pkg.amountInCents)}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${
                    pkg.highlighted
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
