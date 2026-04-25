"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { useEffect, type ComponentProps } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_LIMITS } from "@/lib/plan-config";

/**
 * Thin wrapper around Clerk's `<OrganizationSwitcher />` that:
 *
 *   1. Applies the LTX dark theme to the switcher + popover.
 *   2. Hides the "Create organization" action button for users whose
 *      plan does not allow creating orgs (Free, Pro). A global CSS
 *      rule with !important is injected into document.head for users
 *      who can't create — this beats Clerk's defaults and reaches the
 *      popover rendered in a React portal.
 *   3. Routes the button to `/pricing` via `createOrganizationMode=
 *      "navigation"` as a belt-and-suspenders fallback — even if the
 *      CSS hide fails, clicking it lands on the upgrade page.
 *
 * Usage — drop-in replacement for `<OrganizationSwitcher />`:
 *
 *   import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
 *   <OrgSwitcher />
 *
 * Note: this only hides the UI button. A determined user could call
 * Clerk's createOrganization API directly. The Clerk instance cap
 * (3 orgs per user) is the hard backend limit.
 */

const HIDE_CREATE_ORG_STYLE_ID = "org-switcher-hide-create";
const HIDE_CREATE_ORG_CSS = `
  .cl-organizationSwitcherPopoverActionButton__createOrganization {
    display: none !important;
  }
`;

export function OrgSwitcher(
  props: ComponentProps<typeof OrganizationSwitcher>,
) {
  const { userPlan, isLoading } = useSubscription();
  const canCreateOrg = !isLoading && PLAN_LIMITS[userPlan].canCreateOrg;

  // Inject / remove the global hide rule when the user's plan changes.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const existing = document.getElementById(HIDE_CREATE_ORG_STYLE_ID);

    if (!canCreateOrg) {
      if (!existing) {
        const style = document.createElement("style");
        style.id = HIDE_CREATE_ORG_STYLE_ID;
        style.textContent = HIDE_CREATE_ORG_CSS;
        document.head.appendChild(style);
      }
    } else if (existing) {
      existing.remove();
    }

    // Note: we intentionally don't remove on unmount because multiple
    // OrgSwitcher instances mount/unmount but the rule should persist
    // while any of them is on screen. The effect re-runs when plan
    // changes and handles cleanup correctly for the plan transition.
  }, [canCreateOrg]);

  const { appearance, ...rest } = props;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <OrganizationSwitcher
      {...(rest as any)}
      createOrganizationMode={canCreateOrg ? undefined : "navigation"}
      createOrganizationUrl={canCreateOrg ? undefined : "/pricing"}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#14b8a6",
          colorBackground: "#1a1a1a",
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

// Backward-compat: keep the old export name so existing imports still work
export const OrganizationSwitcherWithLimits = OrgSwitcher;
