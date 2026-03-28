// Use actual plan names from existing codebase: free, starter, pro
export const PLAN_LIMITS = {
  free:    { canCreateOrg: false, maxOrgs: 0, maxMembersPerOrg: 1  },
  starter: { canCreateOrg: true,  maxOrgs: 1, maxMembersPerOrg: 5  },
  pro:     { canCreateOrg: true,  maxOrgs: 3, maxMembersPerOrg: 15 },
} as const;
