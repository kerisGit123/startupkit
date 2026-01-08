"use client";

import { useFeatures } from "@/hooks/useFeatures";
import { ReactNode } from "react";

interface FeatureGuardProps {
  plan?: "free" | "starter" | "pro" | "business";
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({ 
  plan, 
  feature, 
  children, 
  fallback 
}: FeatureGuardProps) {
  const { canUseFeature, hasFeature, isLoading } = useFeatures();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  const hasAccess = plan 
    ? canUseFeature(plan) 
    : feature 
    ? hasFeature(feature) 
    : true;
  
  if (!hasAccess) {
    return fallback || (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          Upgrade to access this feature
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
}
