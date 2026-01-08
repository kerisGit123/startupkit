"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function UsagePage() {
  const { user } = useUser();
  const { companyId } = useCompany();

  const creditsBalance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip"
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-900">Please sign in to access usage</p>
      </div>
    );
  }

  const usageStats = [
    { label: "Scans This Month", value: "0", change: "+0%", trend: "up" },
    { label: "Storage Used", value: "0 MB", change: "0%", trend: "neutral" },
    { label: "API Calls", value: "0", change: "+0%", trend: "up" },
    { label: "Credits Used", value: "0", change: "0", trend: "neutral" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Usage & Analytics</h1>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {usageStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{stat.label}</p>
                {stat.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                {stat.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.change} from last month</p>
            </div>
          ))}
        </div>

        {/* Usage Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Usage Over Time</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Usage chart will appear here</p>
              <p className="text-sm text-gray-400">Integrate with your analytics service</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">No activity yet</p>
                <p className="text-sm text-gray-500">Your recent scans and API calls will appear here</p>
              </div>
              <span className="text-sm text-gray-400">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
