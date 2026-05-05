"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function LoginTracker() {
  const { user, isLoaded } = useUser();
  const trackLogin = useMutation(api.userActivity.trackLogin);
  const updateLastActive = useMutation(api.credits.updateLastActive);
  const checkOverdue = useMutation(api.adminManualBilling.checkAndDowngradeOverdue);
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackUserLogin = async () => {
      if (!isLoaded) {
        return;
      }

      if (!user) {
        return;
      }

      if (hasTracked.current) {
        return;
      }

      try {
        // Track login and sync user data from Clerk
        const syncResult = await trackLogin({
          clerkUserId: user.id,
          companyId: user.id,
          ipAddress: "client-side",
          userAgent: navigator.userAgent,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          fullName: user.fullName || undefined,
          imageUrl: user.imageUrl || undefined,
          username: user.username || undefined,
        });

        // Check if user is blocked (IP/Country blocking happens here, not in middleware)
        if (!syncResult.success && syncResult.blocked) {
          console.warn("⚠️ User is blocked:", syncResult.reason);
          // Redirect to blocked page
          window.location.href = '/blocked';
          return;
        }

        // Stamp lastActiveAt on credits_balance — used by 1-year inactivity purge
        await updateLastActive({
          email: user.primaryEmailAddress?.emailAddress,
        }).catch(() => {});

        // Check for overdue offline subscription invoices — downgrade if any found
        const overdueResult = await checkOverdue({ clerkUserId: user.id }).catch(() => null);
        if (overdueResult?.downgraded) {
          toast.warning("Your subscription has expired. Please renew to continue using Pro features.");
        }

        hasTracked.current = true;
      } catch (error) {
        console.error("❌ Failed to track login:", error);
      }
    };

    trackUserLogin();
  }, [isLoaded, user, trackLogin, updateLastActive, checkOverdue]);

  return null; // This component doesn't render anything
}
