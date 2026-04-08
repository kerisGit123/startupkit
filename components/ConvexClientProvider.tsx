"use client";

import { ReactNode, useEffect } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const SettingsInitializer = ({ children }: { children: React.ReactNode }) => { 
  const { user } = useUser();
  const ensureSettings = useMutation(api.settings.ensureOrgSettings);
  const companyId = useCurrentCompanyId();

  useEffect(() => {
    if (!companyId || !user?.id) return;
    ensureSettings({
      companyId,
      subjectType: companyId.startsWith("org_") ? "organization" : "user",
      aiEnabled: true,
      updatedBy: user.id,
    }).catch(() => {});
  }, [companyId, user?.id, ensureSettings]);

  return children;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <SettingsInitializer>
        {children}
      </SettingsInitializer>
    </ConvexProviderWithClerk>
  );
}
