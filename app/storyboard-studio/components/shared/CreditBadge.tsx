"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { Coins } from "lucide-react";

interface CreditBadgeProps {
  className?: string;
}

export function CreditBadge({ className = "" }: CreditBadgeProps) {
  const companyId = useCurrentCompanyId() || "personal";
  const creditBalance = useQuery(api.credits.getBalance, { companyId });

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${className}`}>
      <Coins className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-white font-medium">
        {typeof creditBalance === "number" ? creditBalance.toLocaleString() : "..."}
      </span>
    </div>
  );
}
