"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  CreditCard,
  RefreshCw,
  Sparkles,
  Undo2,
  Wrench,
  ChevronDown,
  Filter,
} from "lucide-react";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  subscription: {
    label: "Monthly Grant",
    icon: RefreshCw,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  purchase: {
    label: "Top-up Purchase",
    icon: CreditCard,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  usage: {
    label: "AI Generation",
    icon: Sparkles,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
  transfer_out: {
    label: "Transferred Out",
    icon: ArrowUpRight,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  transfer_in: {
    label: "Received",
    icon: ArrowDownLeft,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  refund: {
    label: "Refund",
    icon: Undo2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  admin_adjustment: {
    label: "Adjustment",
    icon: Wrench,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  org_created: {
    label: "Org Created",
    icon: Coins,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG);

interface CreditTransactionHistoryProps {
  className?: string;
}

export function CreditTransactionHistory({
  className = "",
}: CreditTransactionHistoryProps) {
  const companyId = useCurrentCompanyId() || "";
  const ledger = useQuery(
    api.credits.getLedger,
    companyId ? { companyId, limit: 50 } : "skip",
  );

  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  if (!ledger) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8 text-(--text-tertiary) text-sm">
          Loading transaction history…
        </div>
      </div>
    );
  }

  const filtered = filterType
    ? ledger.filter((r) => r.type === filterType)
    : ledger;

  // Don't show org_created entries (they're 0-token markers, not real transactions)
  const visible = filtered.filter((r) => r.type !== "org_created");

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-(--text-primary)">
          Transaction History
        </h3>

        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              filterType
                ? "border-teal-500/50 bg-teal-500/10 text-teal-300"
                : "border-(--border-primary) bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary)"
            }`}
          >
            <Filter className="w-3 h-3" />
            {filterType
              ? TYPE_CONFIG[filterType]?.label ?? filterType
              : "All types"}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showFilterDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFilterDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-xl py-1">
                <button
                  onClick={() => {
                    setFilterType(null);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-(--bg-tertiary) ${
                    !filterType
                      ? "text-teal-400 font-semibold"
                      : "text-(--text-secondary)"
                  }`}
                >
                  All types
                </button>
                {ALL_TYPES
                  .filter((t) => t !== "org_created")
                  .map((type) => {
                    const config = TYPE_CONFIG[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setFilterType(type);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-(--bg-tertiary) flex items-center gap-2 ${
                          filterType === type
                            ? "text-teal-400 font-semibold"
                            : "text-(--text-secondary)"
                        }`}
                      >
                        <Icon className={`w-3 h-3 ${config.color}`} />
                        {config.label}
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transaction list */}
      {visible.length === 0 ? (
        <div className="text-center py-8 text-(--text-tertiary) text-sm border border-dashed border-(--border-primary) rounded-xl">
          {filterType
            ? `No ${TYPE_CONFIG[filterType]?.label?.toLowerCase() ?? filterType} transactions yet.`
            : "No transactions yet."}
        </div>
      ) : (
        <div className="space-y-1">
          {visible.map((entry) => {
            const type = entry.type ?? "admin_adjustment";
            const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.admin_adjustment;
            const Icon = config.icon;
            const isPositive = entry.tokens > 0;
            const isZero = entry.tokens === 0;

            // Build description
            let description = entry.reason ?? "";
            if (type === "usage" && entry.model) {
              description = entry.model;
              if (entry.action) {
                const actionLabel =
                  entry.action === "image_generation"
                    ? "Image"
                    : entry.action === "video_generation"
                      ? "Video"
                      : entry.action === "script_generation"
                        ? "Script"
                        : entry.action;
                description = `${actionLabel} — ${entry.model}`;
              }
            } else if (type === "transfer_out" && entry.counterpartCompanyId) {
              description = `→ ${entry.counterpartCompanyId.startsWith("org_") ? "Organization" : "Personal"}`;
            } else if (type === "transfer_in" && entry.counterpartCompanyId) {
              description = `← ${entry.counterpartCompanyId.startsWith("user_") ? "Personal Workspace" : "Organization"}`;
            } else if (type === "subscription") {
              description = entry.reason?.replace("Monthly grant: ", "Plan: ") ?? "Monthly credit grant";
            } else if (type === "purchase") {
              description = "Credit pack purchase";
            }

            const date = new Date(entry.createdAt);
            const timeStr = date.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={entry._id}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-(--bg-tertiary)/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-(--text-primary) font-medium">
                      {config.label}
                    </span>
                    <span className="text-[10px] text-(--text-tertiary) uppercase tracking-wider">
                      {type}
                    </span>
                  </div>
                  <div className="text-xs text-(--text-tertiary) truncate">
                    {description}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-bold ${
                      isZero
                        ? "text-(--text-tertiary)"
                        : isPositive
                          ? "text-emerald-400"
                          : "text-red-400"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {entry.tokens.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-(--text-tertiary)">
                    {timeStr}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
