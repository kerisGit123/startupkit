"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useSubscription } from "@/hooks/useSubscription";
import { AlertTriangle, Coins } from "lucide-react";

interface CreditBalanceDisplayProps {
  className?: string;
}

type UsageView = "month" | "today" | "total";

const VIEW_LABELS: Record<UsageView, string> = {
  month: "This Month",
  today: "Today",
  total: "All Time",
};

export default function CreditBalanceDisplay({ className = "" }: CreditBalanceDisplayProps) {
  const companyId = useCurrentCompanyId() || "";
  const { plan: currentPlan, isLoading: planLoading } = useSubscription();
  const [usageView, setUsageView] = useState<UsageView>("month");

  const summary = useQuery(
    api.credits.getOrgUsageSummary,
    companyId ? { companyId } : "skip",
  );

  const balance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip",
  );

  // Get recent usage for time-filtered views
  const recentUsage = useQuery(
    api.credits.listOrgUsage,
    companyId ? { companyId } : "skip",
  );

  const cyclingBlock = useQuery(
    api.credits.getCyclingBlock,
    companyId && !companyId.startsWith("org_") ? { companyId } : "skip",
  );

  const ensureMonthlyGrant = useMutation(api.credits.ensureMonthlyGrant);
  const grantAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (planLoading || !companyId || !currentPlan) return;
    if (companyId.startsWith("org_")) return;
    const key = `${companyId}:${currentPlan}`;
    if (grantAttemptedRef.current === key) return;
    grantAttemptedRef.current = key;

    ensureMonthlyGrant({ companyId, plan: currentPlan })
      .then((result) => {
        console.log("[CreditBalanceDisplay] ensureMonthlyGrant result", result);
      })
      .catch((err) => {
        console.error("[CreditBalanceDisplay] ensureMonthlyGrant failed", err);
      });
  }, [planLoading, companyId, currentPlan, ensureMonthlyGrant]);

  const remainingCredits = balance ?? 0;
  const isLoading = balance === undefined || summary === undefined;

  // Calculate usage for different time periods
  const usageAmount = (() => {
    if (usageView === "total") return summary?.total ?? 0;
    if (!recentUsage) return 0;

    const now = new Date();
    let cutoff: number;

    if (usageView === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cutoff = startOfDay.getTime();
    } else {
      // "month" — start of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      cutoff = startOfMonth.getTime();
    }

    return recentUsage
      .filter((r: any) => r._creationTime >= cutoff)
      .reduce((sum: number, r: any) => sum + Math.abs(r.tokens), 0);
  })();

  const cycleUsageView = () => {
    const views: UsageView[] = ["month", "today", "total"];
    const idx = views.indexOf(usageView);
    setUsageView(views[(idx + 1) % views.length]);
  };

  if (isLoading) {
    return (
      <div className={`bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-(--bg-tertiary) rounded-full flex items-center justify-center">
            <Coins className="w-5 h-5 text-(--text-tertiary)" />
          </div>
          <div>
            <p className="text-(--text-tertiary) text-xs">Credit Balance</p>
            <div className="w-16 h-4 bg-(--bg-tertiary) rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500/20">
          <Coins className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-(--text-tertiary) text-xs">Credit Balance</p>
          <p className="text-xl font-bold text-(--text-primary)">
            {remainingCredits.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Usage Stats — click badge to cycle period */}
      {summary !== null && (
        <div className="mt-3 pt-3 border-t border-(--border-primary) space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-(--text-tertiary)">Credits Used</span>
            <span className="text-(--text-secondary) font-medium">
              {usageAmount.toLocaleString()}
            </span>
          </div>
          <button
            onClick={cycleUsageView}
            className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[10px] font-medium hover:bg-yellow-500/25 transition-colors cursor-pointer"
            title="Click to switch: This Month → Today → All Time"
          >
            {VIEW_LABELS[usageView]}
          </button>
        </div>
      )}

      {/* Cycling block warning — shown when monthly credit refill is paused */}
      {cyclingBlock?.cyclingBlockedUntil && cyclingBlock.cyclingBlockedUntil > Date.now() && (
        <div className="mt-3 pt-3 border-t border-(--border-primary)">
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-snug text-amber-300">
              <span className="font-medium">Monthly credit refill paused</span>
              <span className="text-amber-400/80"> until {new Date(cyclingBlock.cyclingBlockedUntil).toLocaleDateString(undefined, { month: "short", day: "numeric" })} — your plan changed too frequently.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
