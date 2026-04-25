/**
 * Plan limits + Clerk Billing slug mapping.
 *
 * 3-plan ladder (all Clerk User Plans):
 *   free           Personal only, no orgs, strict project cap, 50 credits.
 *   pro_personal   Serious creator + small team. 1 org, 5 seats, 3500 credits.
 *                  (Merged from old "Pro" + "Starter Team" plans.)
 *   business       Multi-client agency. 3 orgs, 15 seats/org, 8000 credits.
 *
 * Clerk Billing plan slugs (what Clerk stores) → internal keys:
 *   free_user  → free
 *   pro        → pro_personal
 *   business   → business
 */

export type InternalPlanKey = "free" | "pro_personal" | "business";

export const PLAN_LIMITS = {
  // Free — solo, no orgs, strict project cap
  free: {
    canCreateOrg: false,
    maxOrgs: 0,
    maxMembersPerOrg: 1,
    maxProjects: 3,
    maxFramesPerProject: 20,
    monthlyCredits: 50,
    storageMB: 300,
    proFeatures: false,
  },
  // Pro — solo power user + small team (merged old Pro + Starter Team)
  // Admin subscribes, creates 1 org, invites up to 5 members.
  // Members inherit team features via the ownerPlan snapshot.
  pro_personal: {
    canCreateOrg: true,
    maxOrgs: 1,
    maxMembersPerOrg: 5,
    maxProjects: Infinity,
    maxFramesPerProject: Infinity,
    monthlyCredits: 3500,
    storageMB: 10 * 1024, // 10 GB
    proFeatures: true,
  },
  // Business — multi-org agency tier
  // Admin subscribes, creates up to 3 orgs, 15 members per org.
  business: {
    canCreateOrg: true,
    maxOrgs: 3, // Clerk instance limit — raise to 10 after Clerk support ticket
    maxMembersPerOrg: 15,
    maxProjects: Infinity,
    maxFramesPerProject: Infinity,
    monthlyCredits: 8000,
    storageMB: 20 * 1024, // 20 GB
    proFeatures: true,
  },
} as const satisfies Record<
  InternalPlanKey,
  {
    canCreateOrg: boolean;
    maxOrgs: number;
    maxMembersPerOrg: number;
    maxProjects: number;
    maxFramesPerProject: number;
    monthlyCredits: number;
    storageMB: number;
    proFeatures: boolean;
  }
>;

/**
 * Maps internal plan keys → Clerk Billing plan slugs.
 * Read from NEXT_PUBLIC_CLERK_PLAN_* env vars so you can rename plans
 * in Clerk Dashboard without touching code.
 */
export const CLERK_PLAN_SLUGS: Record<InternalPlanKey, string> = {
  free: process.env.NEXT_PUBLIC_CLERK_PLAN_FREE || "free_user",
  pro_personal: process.env.NEXT_PUBLIC_CLERK_PLAN_PRO_PERSONAL || "pro",
  business: process.env.NEXT_PUBLIC_CLERK_PLAN_BUSINESS || "business",
};

/**
 * Reverse lookup: Clerk slug → internal key.
 * Built from CLERK_PLAN_SLUGS so it always stays in sync.
 */
export const INTERNAL_KEY_FROM_CLERK_SLUG: Record<string, InternalPlanKey> =
  Object.fromEntries(
    (Object.entries(CLERK_PLAN_SLUGS) as [InternalPlanKey, string][]).map(
      ([internal, slug]) => [slug, internal],
    ),
  );
