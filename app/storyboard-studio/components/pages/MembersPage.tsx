"use client";

import { OrganizationProfile, useOrganization } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { Users, Coins, AlertCircle } from "lucide-react";

/**
 * Members page — powered by Clerk's `<OrganizationProfile />`.
 *
 * Clerk handles all member management natively:
 *   - Member list + roles (admin / basic_member)
 *   - Invite by email (Clerk sends the email automatically)
 *   - Change member roles
 *   - Remove members
 *   - Pending invitations view
 *   - Leave organization
 *   - Organization settings (name, logo, slug)
 *
 * We augment Clerk's UI with a storyboard-specific panel below:
 *   - Per-member credit usage from our credits_ledger
 *
 * When the user is in their personal workspace (no active organization),
 * we show an empty state explaining that members only exist inside orgs.
 */
export function MembersPage() {
  const { organization, isLoaded } = useOrganization();
  const companyId = useCurrentCompanyId() || "";

  // Per-member usage breakdown (only meaningful when in an org context)
  const usage = useQuery(
    api.credits.getOrgUsageSummary,
    organization?.id ? { companyId: organization.id } : "skip",
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-(--bg-primary)">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--text-primary)">
              Members
            </h1>
            <p className="text-xs text-(--text-tertiary)">
              Manage your organization members, roles, and invitations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OrgSwitcher />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-64 text-(--text-tertiary)">
            Loading…
          </div>
        ) : !organization ? (
          // Personal workspace — no members possible
          <div className="max-w-xl mx-auto mt-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-(--bg-secondary) border border-(--border-primary) flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-(--text-tertiary)" />
            </div>
            <h2 className="text-xl font-bold text-(--text-primary) mb-2">
              No organization selected
            </h2>
            <p className="text-sm text-(--text-secondary) mb-6">
              Members only exist inside organizations. Create an organization
              or switch to one via the dropdown in the top-right to manage
              members, invitations, and roles.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Clerk's built-in OrganizationProfile — full member
                management, invitations, and settings */}
            <OrganizationProfile
              routing="hash"
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
                elements: {
                  rootBox: "w-full",
                  card: "bg-(--bg-secondary) border border-(--border-primary)",
                },
              }}
            />

            {/* Storyboard-specific: credit usage by member */}
            {usage && Object.keys(usage.byUser).length > 0 && (
              <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-(--text-primary)">
                    Credit Usage by Member
                  </h2>
                </div>
                <p className="text-xs text-(--text-tertiary) mb-4">
                  Credits spent on AI generation in this organization.
                </p>
                <div className="space-y-2">
                  {Object.entries(usage.byUser)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([userId, credits]) => (
                      <div
                        key={userId}
                        className="flex items-center justify-between py-2 border-b border-(--border-primary) last:border-0"
                      >
                        <span className="text-sm text-(--text-secondary) font-mono">
                          {userId.slice(0, 12)}…
                        </span>
                        <span className="text-sm text-(--text-primary) font-semibold">
                          {(credits as number).toLocaleString()} credits
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
