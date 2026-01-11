"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  // Store referral code in localStorage when page loads
  useEffect(() => {
    if (refCode) {
      localStorage.setItem("pendingReferralCode", refCode);
      console.log("Stored referral code:", refCode);
    }
  }, [refCode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {refCode && (
          <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
            <p className="text-sm text-purple-800">
              🎉 You were referred! You&apos;ll receive bonus credits after verifying your email.
            </p>
          </div>
        )}
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          afterSignUpUrl="/dashboard?referral=pending"
          redirectUrl="/dashboard?referral=pending"
        />
      </div>
    </div>
  );
}
