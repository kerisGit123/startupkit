"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const trackReferral = useMutation(api.referrals.trackReferral);
  const completeReferral = useMutation(api.referrals.completeReferral);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || hasTracked.current) {
      return;
    }

    const handleReferral = async () => {
      // Check if user just signed up with referral
      const referralPending = searchParams.get("referral");
      const storedReferralCode = localStorage.getItem("pendingReferralCode");

      if (referralPending === "pending" && storedReferralCode) {
        try {
          console.log("Tracking referral with code:", storedReferralCode);
          
          // Step 1: Track the referral
          const trackResult = await trackReferral({
            referralCode: storedReferralCode,
            newUserId: user.id,
          });

          if (trackResult.success) {
            console.log("✅ Referral tracked successfully!");
            
            // Step 2: Immediately complete referral and award credits
            try {
              console.log("💰 Awarding credits to both users...");
              const completeResult = await completeReferral({
                referredUserId: user.id,
              });
              
              if (completeResult.success) {
                console.log("✅ Credits awarded!", {
                  referrerGot: completeResult.rewardAmount,
                  youGot: completeResult.bonusAmount,
                });
              }
            } catch (completeError) {
              console.error("❌ Failed to award credits:", completeError);
            }
            
            localStorage.removeItem("pendingReferralCode");
            hasTracked.current = true;
          } else {
            // Handle "already referred" case gracefully
            if (trackResult.error === "User already referred") {
              console.log("ℹ️ User already has a referral tracked");
              localStorage.removeItem("pendingReferralCode");
              hasTracked.current = true;
            } else {
              console.error("❌ Failed to track referral:", trackResult.error);
              // Clean up localStorage even on other errors to prevent retry loops
              localStorage.removeItem("pendingReferralCode");
            }
          }
        } catch (error) {
          console.error("❌ Error tracking referral:", error);
          // Clean up localStorage to prevent infinite retries
          localStorage.removeItem("pendingReferralCode");
        }
      }
    };

    handleReferral();
  }, [isLoaded, user, searchParams, trackReferral, completeReferral]);

  return null;
}
