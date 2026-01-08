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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Pricing Plans</h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your needs
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition font-semibold ${
                billingCycle === "monthly"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md transition font-semibold ${
                billingCycle === "yearly"
                  ? "bg-yellow-400 text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {Object.values(PLANS).filter(p => p.id !== "business").map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const price = billingCycle === "monthly" 
              ? plan.prices.monthly 
              : plan.prices.yearly;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-sm border p-8 ${
                  isCurrentPlan ? "border-yellow-400 border-2" : "border-gray-200"
                }`}
              >
                {isCurrentPlan && (
                  <div className="bg-yellow-400 text-black text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Current Plan
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.title}</h3>
                <div className="text-4xl font-bold mb-6 text-gray-900">
                  {price?.label || "N/A"}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
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
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
{isCurrentPlan ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard/billing"
                      className="w-full py-3 px-6 rounded-lg font-semibold transition shadow-sm bg-gray-200 text-gray-700 hover:bg-gray-300 block text-center"
                    >
                      Manage Subscription
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="w-full py-2 px-6 rounded-lg font-medium transition text-red-600 hover:text-red-700 block text-center text-sm"
                    >
                      Cancel Plan
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={plan.id === "free"}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition shadow-sm ${
                      plan.id === "free"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-yellow-400 text-black hover:bg-yellow-500"
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
        <div id="credits" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Buy Credits</h2>
          <p className="text-gray-600 mb-8">
            One-time credit purchases for additional scans
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
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
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {pkg.credits} Credits
                </h3>
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
        </div>
      </div>
    </div>
  );
}
