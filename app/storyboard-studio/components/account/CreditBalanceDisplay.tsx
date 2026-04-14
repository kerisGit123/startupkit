"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useSubscription } from "@/hooks/useSubscription";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";

interface CreditBalanceDisplayProps {
  className?: string;
}

export default function CreditBalanceDisplay({ className = "" }: CreditBalanceDisplayProps) {
  // Get current user's company ID. DO NOT fall back to a literal
  // "personal" string — that creates orphan rows in credits_balance
  // unrelated to any real user. Skip queries until companyId is ready.
  const companyId = useCurrentCompanyId() || "";
  const { plan: currentPlan, isLoading: planLoading } = useSubscription();

  // Get credit usage summary (for the "Credits Used" subtitle)
  const summary = useQuery(
    api.credits.getOrgUsageSummary,
    companyId ? { companyId } : "skip",
  );

  // Get current balance from credits_balance table.
  // Balance is already net of every deductCredits call — DO NOT subtract
  // usage again (that would double-deduct).
  const balance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip",
  );

  // ─ Auto-grant monthly credits on mount ────────────────────────────
  // If the user's current billing cycle hasn't been granted yet,
  // trigger the grant now. Idempotent — the mutation itself checks
  // and no-ops if already granted this cycle.
  //
  // This handles the "returning user" case: someone who hasn't logged
  // in for months will see their monthly credits appear in the balance
  // the moment they open the app, not only when they click Generate.
  const ensureMonthlyGrant = useMutation(api.credits.ensureMonthlyGrant);
  const grantAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (planLoading || !companyId || !currentPlan) return;
    // Model B: only auto-grant for PERSONAL workspaces.
    // Orgs receive credits via Transfer Credits dialog only.
    if (companyId.startsWith("org_")) return;
    // Only attempt once per (companyId, plan) per component lifetime
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

  // Calculate trend based on usage (if usage increased recently, trend is down)
  const trend = summary && summary.total > 0 ? "down" : "neutral";

  if (isLoading) {
    return (
      <div className={`bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between">
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
      </div>
    );
  }

  return (
    <div className={`bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            remainingCredits && remainingCredits > 100 
              ? 'bg-(--accent-green)/20' 
              : remainingCredits && remainingCredits > 10 
              ? 'bg-(--accent-yellow)/20' 
              : 'bg-(--accent-red)/20'
          }`}>
            <Coins className={`w-5 h-5 ${
              remainingCredits && remainingCredits > 100 
                ? 'text-(--accent-green)' 
                : remainingCredits && remainingCredits > 10 
                ? 'text-(--accent-yellow)' 
                : 'text-(--accent-red)'
            }`} />
          </div>
          <div>
            <p className="text-(--text-tertiary) text-xs">Credit Balance</p>
            <p className="text-xl font-bold text-(--text-primary)">
              {remainingCredits.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
              trend === 'up' 
                ? 'bg-(--accent-green)/10 text-(--accent-green)' 
                : trend === 'down' 
                ? 'bg-(--accent-red)/10 text-(--accent-red)' 
                : 'bg-(--bg-tertiary) text-(--text-tertiary)'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'up' && <span>+250</span>}
              {trend === 'down' && <span>-{summary?.total || 0}</span>}
              {trend === 'neutral' && <span>0</span>}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Stats */}
      {summary !== null && (
        <div className="mt-3 pt-3 border-t border-(--border-primary)">
          <div className="flex items-center justify-between text-xs">
            <span className="text-(--text-tertiary)">Credits Used</span>
            <span className="text-(--text-secondary)">
              {summary.total.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
