"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useMemo } from "react";

export function useCompany() {
  const { organization } = useOrganization();
  const { user } = useUser();
  
  const companyId = useMemo(
    () => organization?.id || user?.id || "", 
    [organization?.id, user?.id]
  );
  
  const subjectType = useMemo(
    () => (companyId?.startsWith("org_") ? "organization" : companyId ? "user" : undefined), 
    [companyId]
  );
  
  return { companyId, subjectType } as const;
}
