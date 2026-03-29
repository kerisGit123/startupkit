"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";

interface CreditBalanceDisplayProps {
  className?: string;
}

export default function CreditBalanceDisplay({ className = "" }: CreditBalanceDisplayProps) {
  // Get current user's company ID
  const { user } = useUser();
  const { organization } = useOrganization();
  const companyId = organization?.id ?? user?.id ?? "personal";

  // Get credit usage summary (like dashboard)
  const summary = useQuery(api.storyboard.creditUsage.getOrgSummary, { 
    orgId: companyId 
  });

  // Get current balance from credits table
  const balance = useQuery(api.credits.getBalance, {
    companyId: companyId
  });

  // Calculate remaining credits (total - used)
  const remainingCredits = balance !== undefined && summary !== undefined 
    ? balance - summary.total 
    : balance || 0;

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
