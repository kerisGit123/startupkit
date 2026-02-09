"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { Zap, HardDrive, Globe, Sparkles, BarChart3, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UsagePage() {
  const { user } = useUser();
  const { companyId } = useCompany();

  const creditsBalance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip"
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const usageStats = [
    { label: "Scans This Month", value: "0", subtitle: "of plan limit", icon: Zap, iconBg: "bg-amber-100", iconColor: "text-amber-600", progress: 0 },
    { label: "Storage Used", value: "0 MB", subtitle: "of allocated", icon: HardDrive, iconBg: "bg-blue-100", iconColor: "text-blue-600", progress: 0 },
    { label: "API Calls", value: "0", subtitle: "this month", icon: Globe, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", progress: 0 },
    { label: "Credits Used", value: "0", subtitle: `${creditsBalance ?? 0} remaining`, icon: Sparkles, iconBg: "bg-violet-100", iconColor: "text-violet-600", progress: 0 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usage & Analytics</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Monitor your resource consumption and activity</p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
          >
            Upgrade Plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {usageStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] font-medium text-gray-500">{stat.label}</p>
                  <Icon className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.max(stat.progress, 2)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">{stat.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Usage Chart Placeholder */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Usage Over Time</h2>
            <span className="text-[11px] text-gray-400">Track your consumption trends</span>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-gray-400">Usage chart will appear here</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Data will populate as you use the platform</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-[11px] text-gray-400">Your latest actions and events</span>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-[13px] font-medium text-gray-400">No activity yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Your recent scans and API calls will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
