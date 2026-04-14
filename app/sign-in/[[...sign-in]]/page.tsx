"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { useEffect } from "react";

const DARK_STYLE_ID = "clerk-signin-dark";
const DARK_CSS = `
  /* Card and main container */
  .cl-card,
  .cl-signIn-root .cl-card {
    background-color: #1a1a1a !important;
    border: 1px solid #3d3d3d !important;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6) !important;
  }

  /* Footer area (bottom of card) */
  .cl-footer,
  .cl-footerAction,
  .cl-footerPages,
  .cl-footerPagesLink,
  .cl-internal-b7kdfs,
  .cl-signIn-root footer,
  .cl-card > div:last-child {
    background-color: #1a1a1a !important;
    background: #1a1a1a !important;
    color: #a0a0a0 !important;
    border-color: #3d3d3d !important;
  }

  /* "Don't have an account?" text */
  .cl-footerActionText,
  .cl-footer span,
  .cl-footer p {
    color: #6e6e6e !important;
  }

  /* "Sign up" link */
  .cl-footerActionLink,
  .cl-footer a {
    color: #14b8a6 !important;
  }
  .cl-footer a:hover {
    color: #2dd4bf !important;
  }

  /* "Secured by Clerk" and "Development mode" */
  .cl-footerPages,
  .cl-footerPagesLink,
  [data-localization-key="footerPageLink__help"],
  [data-localization-key="footerPageLink__privacy"],
  [data-localization-key="footerPageLink__terms"] {
    color: #6e6e6e !important;
  }

  /* Development mode badge */
  .cl-internal-1dauvt6,
  .cl-badge,
  [class*="badge"],
  .cl-footerPages + div,
  .cl-card [style*="background"] {
    background-color: transparent !important;
    background: transparent !important;
    color: #ff6b35 !important;
  }

  /* Input fields */
  .cl-formFieldInput,
  .cl-formFieldInput__emailAddress,
  .cl-formFieldInput__password,
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

  /* Social button (Continue with Google) */
  .cl-socialButtonsBlockButton,
  .cl-socialButtonsIconButton {
    background-color: #2c2c2c !important;
    border-color: #3d3d3d !important;
    color: #ffffff !important;
  }
  .cl-socialButtonsBlockButton:hover {
    background-color: #3d3d3d !important;
  }

  /* Divider ("or") */
  .cl-dividerLine {
    background-color: #3d3d3d !important;
  }
  .cl-dividerText {
    color: #6e6e6e !important;
  }

  /* Header */
  .cl-headerTitle {
    color: #ffffff !important;
  }
  .cl-headerSubtitle {
    color: #a0a0a0 !important;
  }

  /* Primary button */
  .cl-formButtonPrimary {
    background-color: #14b8a6 !important;
    color: #ffffff !important;
    font-weight: 600 !important;
  }
  .cl-formButtonPrimary:hover {
    background-color: #0d9488 !important;
  }

  /* Override any remaining light backgrounds in the card */
  .cl-signIn-root *,
  .cl-signUp-root * {
    --clerk-bg: #1a1a1a;
  }
`;

export default function SignInPage() {
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
      <SignIn
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
        afterSignInUrl="/storyboard-studio"
        redirectUrl="/storyboard-studio"
      />
    </div>
  );
}
