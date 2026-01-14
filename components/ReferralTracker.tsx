"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const trackReferral = useMutation(api.referrals.trackReferral);
  const completeReferral = useMutation(api.referrals.completeReferral);
  const settings = useQuery(api.referrals.getReferralSettings);
  const hasTracked = useRef(false);

  // Effect 1: Handle new referral signup
  useEffect(() => {
    if (!isLoaded || !user || !settings || hasTracked.current) {
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
            
            // Step 2: Check if email verification is required (admin setting)
            const requireEmailVerification = settings.requireEmailVerification ?? true;
            const emailVerified = user.emailAddresses?.[0]?.verification?.status === "verified";
            
            // Award credits if: email verification not required OR email is verified
            if (!requireEmailVerification || emailVerified) {
              // Award credits (either verification not required or email is verified)
              try {
                const reason = !requireEmailVerification 
                  ? "Email verification not required by admin" 
                  : "Email verified";
                console.log(`💰 ${reason}! Awarding credits to both users...`);
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
              // Email verification required but not verified yet - keep referral pending
              console.log("⏳ Referral tracked but email not verified yet. Credits will be awarded after email verification.");
              console.log("📧 Please check your email and verify your account to receive credits.");
              console.log("ℹ️ Admin setting: Email verification is REQUIRED for referral credits.");
              // Keep pendingReferralCode in localStorage for next check
              hasTracked.current = true;
            }
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
  }, [isLoaded, user, settings, searchParams, trackReferral, completeReferral]);

  // Effect 2: Check if user verified email after initial signup
  useEffect(() => {
    if (!isLoaded || !user || !settings) {
      return;
    }

    const checkEmailVerification = async () => {
      const storedReferralCode = localStorage.getItem("pendingReferralCode");
      
      // If there's still a pending referral code, check if email is now verified
      if (storedReferralCode) {
        const requireEmailVerification = settings.requireEmailVerification ?? true;
        const emailVerified = user.emailAddresses?.[0]?.verification?.status === "verified";
        
        // Complete referral if: email verification not required OR email is verified
        if (!requireEmailVerification || emailVerified) {
          try {
            const reason = !requireEmailVerification 
              ? "Email verification not required by admin" 
              : "Email verified";
            console.log(`📧 ${reason}! Completing pending referral...`);
            const completeResult = await completeReferral({
              referredUserId: user.id,
            });
            
            if (completeResult.success) {
              console.log("✅ Credits awarded after email verification!", {
                referrerGot: completeResult.rewardAmount,
                youGot: completeResult.bonusAmount,
              });
              localStorage.removeItem("pendingReferralCode");
            }
          } catch {
            // Referral might not exist or already completed
            console.log("ℹ️ No pending referral to complete");
            localStorage.removeItem("pendingReferralCode");
          }
        }
      }
    };

    checkEmailVerification();
  }, [isLoaded, user, settings, completeReferral]);

  return null;
}
