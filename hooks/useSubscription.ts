"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "./useCompany";

export function useSubscription() {
  const { companyId } = useCompany();
  
  const subscription = useQuery(
    api.subscriptions.getSubscription,
    companyId ? { companyId } : "skip"
  );
  
  const entitlements = useQuery(
    api.subscriptions.getEntitlements,
    companyId ? { companyId } : "skip"
  );
  
  return {
    subscription,
    entitlements,
    plan: subscription?.plan || "free",
    isLoading: subscription === undefined || entitlements === undefined,
  };
}
