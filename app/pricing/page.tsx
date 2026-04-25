"use client";

import { useUser } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/useSubscription";
import PricingShowcase from "@/components/pricing/PricingShowcase";
import Link from "next/link";

export default function PricingPage() {
  const { user } = useUser();
  const { plan: currentPlan } = useSubscription();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      window.location.href = "/sign-up";
      return;
    }
    window.location.href = "/storyboard-studio?tab=plans";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            &larr; Back to home
          </Link>
          {!user && (
            <Link
              href="/sign-up"
              className="px-5 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-400 transition-colors"
            >
              Sign Up Free
            </Link>
          )}
        </div>

        <PricingShowcase
          currentPlan={currentPlan ?? undefined}
          onSelectPlan={handleSelectPlan}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
