"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const DARK_STYLE_ID = "clerk-signup-dark";
const DARK_CSS = `
  /* Card and main container */
  .cl-card,
  .cl-signUp-root .cl-card {
    background-color: #1a1a1a !important;
    border: 1px solid #3d3d3d !important;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6) !important;
  }

  /* Footer area (bottom of card) */
  .cl-footer,
  .cl-footerAction,
  .cl-footerPages,
  .cl-footerPagesLink,
  .cl-signUp-root footer,
  .cl-card > div:last-child {
    background-color: #1a1a1a !important;
    background: #1a1a1a !important;
    color: #a0a0a0 !important;
    border-color: #3d3d3d !important;
  }

  /* "Already have an account?" text */
  .cl-footerActionText,
  .cl-footer span,
  .cl-footer p {
    color: #6e6e6e !important;
  }

  /* "Sign in" link */
  .cl-footerActionLink,
  .cl-footer a {
    color: #14b8a6 !important;
  }
  .cl-footer a:hover {
    color: #2dd4bf !important;
  }

  /* "Secured by Clerk" and "Development mode" */
  .cl-footerPages,
  .cl-footerPagesLink {
    color: #6e6e6e !important;
  }

  /* Development mode badge */
  .cl-badge,
  [class*="badge"] {
    background-color: transparent !important;
    background: transparent !important;
    color: #ff6b35 !important;
  }

  /* Input fields */
  .cl-formFieldInput,
  .cl-input {
    background-color: #2c2c2c !important;
    border-color: #3d3d3d !important;
    color: #ffffff !important;
  }
  .cl-formFieldInput::placeholder {
    color: #6e6e6e !important;
  }
  .cl-formFieldInput:focus {
    border-color: #14b8a6 !important;
    box-shadow: 0 0 0 1px #14b8a6 !important;
  }

  /* Labels */
  .cl-formFieldLabel {
    color: #a0a0a0 !important;
  }

  /* Social button */
  .cl-socialButtonsBlockButton,
  .cl-socialButtonsIconButton {
    background-color: #2c2c2c !important;
    border-color: #3d3d3d !important;
    color: #ffffff !important;
  }
  .cl-socialButtonsBlockButton:hover {
    background-color: #3d3d3d !important;
  }

  /* Divider */
  .cl-dividerLine {
    background-color: #3d3d3d !important;
  }
  .cl-dividerText {
    color: #6e6e6e !important;
  }

  /* Header */
  .cl-headerTitle { color: #ffffff !important; }
  .cl-headerSubtitle { color: #a0a0a0 !important; }

  /* Primary button */
  .cl-formButtonPrimary {
    background-color: #14b8a6 !important;
    color: #ffffff !important;
    font-weight: 600 !important;
  }
  .cl-formButtonPrimary:hover {
    background-color: #0d9488 !important;
  }
`;

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      localStorage.setItem("pendingReferralCode", refCode);
      console.log("Stored referral code:", refCode);
    }
  }, [refCode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(DARK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = DARK_STYLE_ID;
    style.textContent = DARK_CSS;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
      <div className="w-full max-w-md">
        {refCode && (
          <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-center">
            <p className="text-sm text-teal-300">
              🎉 You were referred! You&apos;ll receive bonus credits after
              verifying your email.
            </p>
          </div>
        )}
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#14b8a6",
              colorBackground: "#1a1a1a",
              colorText: "#ffffff",
              colorTextSecondary: "#a0a0a0",
              colorInputBackground: "#2c2c2c",
              colorInputText: "#ffffff",
              fontFamily: "'Inter', sans-serif",
              borderRadius: "0.75rem",
            },
          }}
          afterSignUpUrl="/storyboard-studio?referral=pending"
          redirectUrl="/storyboard-studio?referral=pending"
        />
      </div>
    </div>
  );
}
