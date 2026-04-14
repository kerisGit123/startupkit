"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { useEffect, type ComponentProps } from "react";

/**
 * Thin wrapper around Clerk's `<UserButton />` that applies the LTX
 * dark theme to the popover (Account / Profile / Security / Billing
 * modal). Without this, the popover renders with Clerk's default light
 * theme, which looks broken against the storyboard-studio dark UI.
 *
 * Dark theme is applied in two layers:
 *   1. `baseTheme: dark` via appearance — handles the main card
 *   2. Global CSS injection — forces the left navigation panel + a few
 *      stubborn elements to use the dark palette. Clerk's appearance
 *      API doesn't always reach the navbar in UserProfile.
 *
 * Usage — drop-in replacement:
 *
 *   import { AppUserButton } from "@/components/AppUserButton";
 *   <AppUserButton afterSignOutUrl="/" />
 */

const DARK_STYLE_ID = "app-user-button-dark-theme";
const DARK_POPOVER_CSS = `
  /* UserProfile modal card */
  .cl-userProfile-root,
  .cl-modal,
  .cl-modalContent,
  .cl-card {
    background-color: #1a1a1a !important;
    color: #ffffff !important;
  }

  /* Left navigation panel in UserProfile */
  .cl-navbar,
  .cl-navbar__root,
  .cl-navbarContainer {
    background-color: #2c2c2c !important;
    color: #ffffff !important;
    border-color: #3d3d3d !important;
  }

  /* Navbar buttons — default and active state */
  .cl-navbarButton,
  .cl-navbarButtonText,
  .cl-navbarButtonIcon {
    color: #a0a0a0 !important;
  }
  .cl-navbarButton:hover,
  .cl-navbarButton[data-active],
  .cl-navbarButton--active {
    background-color: #3d3d3d !important;
    color: #ffffff !important;
  }
  .cl-navbarButton:hover .cl-navbarButtonText,
  .cl-navbarButton[data-active] .cl-navbarButtonText,
  .cl-navbarButton--active .cl-navbarButtonText {
    color: #ffffff !important;
  }

  /* Page titles inside the popover */
  .cl-headerTitle,
  .cl-pageScrollBox h1,
  .cl-pageScrollBox h2,
  .cl-pageScrollBox h3 {
    color: #ffffff !important;
  }

  /* Profile section headings */
  .cl-profileSectionTitleText,
  .cl-profileSectionPrimaryButton,
  .cl-profileSectionContent {
    color: #a0a0a0 !important;
  }

  /* "Manage your account info" subtitle */
  .cl-headerSubtitle,
  .cl-profileSectionSubtitleText {
    color: #6e6e6e !important;
  }

  /* Dividers inside the modal */
  .cl-dividerLine,
  .cl-dividerRow {
    background-color: #3d3d3d !important;
  }
`;

export function AppUserButton(props: ComponentProps<typeof UserButton>) {
  const { appearance, ...rest } = props;

  // Inject the dark-theme CSS once at mount. Safe to run multiple
  // times — checks for an existing <style id> before appending.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(DARK_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = DARK_STYLE_ID;
    style.textContent = DARK_POPOVER_CSS;
    document.head.appendChild(style);
    // Intentionally don't remove on unmount — other AppUserButton
    // instances might still be mounted, and the rule is idempotent.
  }, []);

  return (
    <UserButton
      {...rest}
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
          ...appearance?.variables,
        },
        elements: {
          ...appearance?.elements,
        },
      }}
    />
  );
}
