"use client";

import { useSubscription } from "./useSubscription";

export function useFeatures() {
  const { plan, entitlements, isLoading } = useSubscription();
  
  const hasFeature = (feature: string) => {
    if (isLoading) return false;
    return entitlements?.features?.includes(feature) || false;
  };
  
  const canUseFeature = (requiredPlan: string) => {
    if (isLoading) return false;
    const planHierarchy = ["free", "starter", "pro", "business"];
    const currentIndex = planHierarchy.indexOf(plan);
    const requiredIndex = planHierarchy.indexOf(requiredPlan);
    return currentIndex >= requiredIndex;
  };
  
  return {
    hasFeature,
    canUseFeature,
    plan,
    entitlements,
    isLoading,
  };
}
