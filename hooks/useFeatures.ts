"use client";

import { useSubscription } from "./useSubscription";

/**
 * Feature gating hook.
 *
 * Returns helpers to check whether the current workspace (personal or org)
 * has access to pro-level features, and the plan-based limits.
 *
 * Free users on a personal workspace are gated. Free users inside an org
 * inherit the org owner's plan — if the owner is Pro/Business, features
 * unlock automatically.
 */
export function useFeatures() {
  const { plan, entitlements, isLoading, isLapsed } = useSubscription();

  /** True when the effective plan includes pro features (Pro or Business). */
  const hasProFeatures = !isLoading && !isLapsed && (entitlements?.proFeatures ?? false);

  /** Max frames allowed per project for the current plan. */
  const maxFramesPerProject = entitlements?.maxFramesPerProject ?? 20;

  /** Max projects allowed for the current plan. */
  const maxProjects = entitlements?.maxProjects ?? 3;

  return {
    plan,
    isLoading,
    isLapsed,
    hasProFeatures,
    maxFramesPerProject,
    maxProjects,
    entitlements,
  };
}
