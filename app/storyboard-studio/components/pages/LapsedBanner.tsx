"use client";

import { useOrganization } from "@clerk/nextjs";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * LapsedBanner — renders a persistent top banner when the current
 * workspace is an org whose subscription has lapsed (ownerPlan === "free").
 *
 * Shows different messaging based on the viewer's role:
 *   - Admin (the org creator) → "Your subscription has lapsed. Resubscribe to restore features."
 *   - Member → "This organization's subscription has lapsed. Ask the admin to resubscribe."
 *
 * Members cannot resubscribe (they're not the billing owner in our model),
 * so the banner for them is informational. Admins get a "Resubscribe"
 * button that links to the Billing page.
 */
export function LapsedBanner() {
  const { isLapsed, isLoading } = useSubscription();
  const { organization, membership } = useOrganization();

  if (isLoading || !isLapsed || !organization) return null;

  const isAdmin =
    membership?.role === "org:admin" || membership?.role === "admin";

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="font-semibold text-yellow-200">
            Subscription lapsed
          </div>
          <div className="text-yellow-300/80 mt-0.5">
            {isAdmin ? (
              <>
                <strong>{organization.name}</strong>&apos;s subscription has
                lapsed. Resubscribe to restore team features and unblock project
                creation and AI generation. Existing content remains viewable
                and exportable.
              </>
            ) : (
              <>
                <strong>{organization.name}</strong>&apos;s subscription has
                lapsed. The admin must resubscribe to unblock project creation
                and AI generation. You can still view and export existing
                content.
              </>
            )}
          </div>
        </div>
        {isAdmin && (
          <a
            href="/storyboard-studio#billing"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold transition-colors shrink-0"
          >
            Resubscribe
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
