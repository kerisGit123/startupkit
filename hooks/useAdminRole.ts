"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

export type AdminRole = "super_admin" | "billing_admin" | "support_admin" | "user";

export function useAdminRole() {
  const { user } = useUser();

  const role = useMemo(() => {
    if (!user) return null;
    return (user.publicMetadata.role as AdminRole) || "user";
  }, [user]);

  const isSuperAdmin = role === "super_admin";
  const isBillingAdmin = role === "billing_admin";
  const isSupportAdmin = role === "support_admin";
  const isAdmin = role !== null && role !== "user";

  return {
    role,
    isSuperAdmin,
    isBillingAdmin,
    isSupportAdmin,
    isAdmin,
  };
}

export function useIsAdmin() {
  const { isAdmin } = useAdminRole();
  return isAdmin;
}

export function useIsSuperAdmin() {
  const { isSuperAdmin } = useAdminRole();
  return isSuperAdmin;
}

export function useIsBillingAdmin() {
  const { isBillingAdmin } = useAdminRole();
  return isBillingAdmin;
}

export function useIsSupportAdmin() {
  const { isSupportAdmin } = useAdminRole();
  return isSupportAdmin;
}
