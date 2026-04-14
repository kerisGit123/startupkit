"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import {
  CLERK_PLAN_SLUGS,
  INTERNAL_KEY_FROM_CLERK_SLUG,
  PLAN_LIMITS,
  type InternalPlanKey,
} from "@/lib/plan-config";

/**
 * Subscription hook — User Plan + Owner Inheritance model.
 *
 * With all plans now being Clerk User Plans (free_user, starter_for_pro,
 * starter_team, business), Clerk's `has({ plan })` only tells us about
 * the CURRENT viewer's plan. That's not enough for the team-plan use case:
 *
 *   Alice subscribes to Starter Team → creates "Acme Agency" → invites
 *   Bob (Free). Bob opens the org. We want Bob to see Starter Team
 *   features (team seats, shared credit pool, etc.) because Alice paid.
 *
 * To make this work, we snapshot the owner's plan on credits_balance.
 * When Bob reads `useSubscription` inside the org, we return the
 * snapshot's ownerPlan, not Bob's own plan.
 *
 * Returns:
 *   plan            — the effective plan for the current workspace
 *                     (the owner's plan when in an org, the user's own
 *                     plan when in personal workspace)
 *   userPlan        — the current USER's own plan, regardless of context
 *                     (useful for "can I even create orgs?" checks)
 *   orgPlan         — the owner plan of the active org (null if personal)
 *   entitlements    — PLAN_LIMITS[plan]
 *   isLoading       — true while Clerk or Convex queries are loading
 */
export function useSubscription() {
  const { has, isLoaded, orgId, userId } = useAuth();

  // ─── The current USER's own plan ────────────────────────────────
  // Always read directly from Clerk has() — this tells us what plan
  // the current viewer has personally subscribed to.
  const userPlan = useMemo<InternalPlanKey>(() => {
    if (!isLoaded || !has) return "free";
    // Check in descending order of privilege — highest wins
    if (has({ plan: CLERK_PLAN_SLUGS.business })) return "business";
    if (has({ plan: CLERK_PLAN_SLUGS.pro_personal })) return "pro_personal";
    return "free";
  }, [has, isLoaded]);

  // ─── The active org's ownerPlan snapshot ────────────────────────
  // When inside an org, we look up the snapshot that was written
  // during org creation (and updated on subscription changes).
  const snapshot = useQuery(
    api.credits.getOwnerPlan,
    orgId ? { companyId: orgId } : "skip",
  );

  const orgPlan = useMemo<InternalPlanKey | null>(() => {
    if (!orgId) return null;
    if (!snapshot) return null; // loading
    if (!snapshot.ownerPlan) return null; // no snapshot yet — fallback
    // The ownerPlan field stores an internal key already ("free"|"pro_personal"|"starter"|"business")
    const key = snapshot.ownerPlan as InternalPlanKey;
    if (PLAN_LIMITS[key] !== undefined) return key;
    // If for some reason the stored value is a Clerk slug, translate it
    return INTERNAL_KEY_FROM_CLERK_SLUG[snapshot.ownerPlan] ?? null;
  }, [orgId, snapshot]);

  // ─── Effective plan for the current workspace ───────────────────
  // Inside an org → use the ownerPlan snapshot (admin's plan flows to members)
  // In personal workspace → use the user's own plan
  // Fallback: if we're in an org but snapshot is missing, use viewer's own plan
  const plan: InternalPlanKey = orgId ? (orgPlan ?? userPlan) : userPlan;

  const entitlements = useMemo(() => PLAN_LIMITS[plan], [plan]);

  // ─── Lapsed detection (org-only) ────────────────────────────────
  // An org is "lapsed" when its ownerPlan snapshot is "free" — this
  // means the creator either cancelled their subscription or never
  // subscribed in the first place. Personal workspaces never lapse.
  //
  // Lapsed orgs show a banner and block new-content creation; existing
  // content remains viewable and exportable.
  const isLapsed = useMemo(
    () => orgId !== null && orgId !== undefined && orgPlan === "free",
    [orgId, orgPlan],
  );

  const isLoading =
    !isLoaded || (orgId !== null && orgId !== undefined && snapshot === undefined);

  return {
    plan,            // effective plan for current workspace
    userPlan,        // viewer's own Clerk plan
    orgPlan,         // active org's ownerPlan (null if personal)
    entitlements,    // PLAN_LIMITS[plan]
    isLapsed,        // true when in an org with ownerPlan === "free"
    isLoading,
    // Backward-compat with older callers
    subscription: { plan },
  };
}
