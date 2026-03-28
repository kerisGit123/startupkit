"use client";

import { useOrganizationList, useUser } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/useSubscription";
import { canCreateOrg } from "@/lib/org-limits";
import { PLAN_LIMITS } from "@/lib/plan-config";
import { useMemo } from "react";

interface OrganizationSwitcherWithLimitsProps {
  className?: string;
}

export function OrganizationSwitcherWithLimits({ className }: OrganizationSwitcherWithLimitsProps) {
  const { isLoaded, setActive, userMemberships, createOrganization } = useOrganizationList();
  const { user } = useUser();
  const { plan, isLoading: subLoading } = useSubscription();

  const canCreate = useMemo(() => {
    if (!plan || subLoading) return false;
    const currentOrgCount = userMemberships?.length || 0;
    return canCreateOrg(plan, currentOrgCount);
  }, [plan, subLoading, userMemberships]);

  const planLimits = useMemo(() => {
    if (!plan) return null;
    return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  }, [plan]);

  const handleCreateOrg = async () => {
    if (!canCreate) {
      // Redirect to pricing page
      window.location.href = "/pricing";
      return;
    }

    try {
      const org = await createOrganization({ name: "New Organization" });
      await setActive({ organization: org.id });
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  if (!isLoaded || subLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Personal Account */}
      <button
        onClick={() => setActive({ organization: null })}
        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        Personal Account
      </button>

      {/* Organization List */}
      {userMemberships?.map((membership) => (
        <button
          key={membership.organization.id}
          onClick={() => setActive({ organization: membership.organization.id })}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {membership.organization.name} ({membership.role})
        </button>
      ))}

      {/* Create Organization Button */}
      {canCreate && (
        <button
          onClick={handleCreateOrg}
          className="w-full text-left px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Create Organization
        </button>
      )}

      {/* Upgrade Prompt for Free Users */}
      {!canCreate && planLimits && (
        <div className="px-3 py-2 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-2">
            {planLimits.maxOrgs === 0 
              ? "Upgrade to create organizations"
              : `You've reached your limit of ${planLimits.maxOrgs} organization${planLimits.maxOrgs > 1 ? 's' : ''}`
            }
          </p>
          <button
            onClick={() => window.location.href = "/pricing"}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Upgrade Plan →
          </button>
        </div>
      )}

      {/* Plan Info */}
      <div className="px-3 py-2 text-xs text-gray-500">
        Current Plan: {plan?.charAt(0).toUpperCase() + plan?.slice(1)}
        {planLimits && (
          <span className="ml-2">
            ({userMemberships?.length || 0}/{planLimits.maxOrgs} orgs)
          </span>
        )}
      </div>
    </div>
  );
}
