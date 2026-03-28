import { PLAN_LIMITS } from "./plan-config";

/**
 * Check if user can create organization based on their subscription plan
 * @param plan - User's current subscription plan ("free" | "starter" | "pro")
 * @param currentOrgCount - Number of organizations user currently has
 * @returns boolean - Whether user can create another organization
 */
export function canCreateOrg(plan: string, currentOrgCount: number): boolean {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  if (!limits?.canCreateOrg) return false;
  return currentOrgCount < limits.maxOrgs;
}

/**
 * Get organization creation limits for a plan
 * @param plan - Subscription plan
 * @returns Object with canCreateOrg and maxOrgs
 */
export function getOrgLimits(plan: string) {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || {
    canCreateOrg: false,
    maxOrgs: 0,
    maxMembersPerOrg: 1
  };
}

/**
 * Check if user can invite more members to their organization
 * @param plan - User's subscription plan
 * @param currentMemberCount - Current number of members in the organization
 * @returns boolean - Whether user can invite more members
 */
export function canInviteMember(plan: string, currentMemberCount: number): boolean {
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  return currentMemberCount < limits.maxMembersPerOrg;
}
