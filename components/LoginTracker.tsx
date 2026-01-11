"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function LoginTracker() {
  const { user, isLoaded } = useUser();
  const trackLogin = useMutation(api.userActivity.trackLogin);
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackUserLogin = async () => {
      console.log("LoginTracker: useEffect triggered", { isLoaded, hasUser: !!user, hasTracked: hasTracked.current });
      
      if (!isLoaded) {
        console.log("LoginTracker: User not loaded yet");
        return;
      }
      
      if (!user) {
        console.log("LoginTracker: No user found");
        return;
      }
      
      if (hasTracked.current) {
        console.log("LoginTracker: Already tracked this session");
        return;
      }

      try {
        console.log("LoginTracker: Starting to track login for user:", user.id);
        
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

        hasTracked.current = true;
        console.log("✅ Login tracked successfully!", syncResult);
      } catch (error) {
        console.error("❌ Failed to track login:", error);
      }
    };

    trackUserLogin();
  }, [isLoaded, user, trackLogin]);

  return null; // This component doesn't render anything
}
