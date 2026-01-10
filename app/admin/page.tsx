"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, CreditCard, Ticket, DollarSign, TrendingUp, ShoppingCart, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const stats = useQuery(api.adminDashboard.getDashboardStats);
  const recentActivity = useQuery(api.adminDashboard.getRecentActivity);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your SaaS platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={`+${stats?.newUsersThisMonth || 0} this month`}
          trendUp={true}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon={CreditCard}
          trend={`+${stats?.newSubscriptionsThisMonth || 0} this month`}
          trendUp={true}
        />
        <StatCard
          title="MRR"
          value={`MYR ${stats?.mrr || "0.00"}`}
          icon={DollarSign}
          trend="Monthly Recurring Revenue"
          trendUp={true}
        />
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          icon={Ticket}
          trend="Needs attention"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {!recentActivity ? (
            <p className="text-gray-500 text-sm">Loading activity...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  {activity.type === "subscription" ? (
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === "subscription" 
                        ? `${activity.action} - ${activity.plan} plan`
                        : `Purchased ${activity.tokens} credits`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{activity.userEmail}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">MYR {stats?.totalRevenue || "0.00"}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">MYR {stats?.monthlyPurchaseRevenue || "0.00"}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPurchases || 0}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <p
        className={`text-sm ${
          trendUp ? "text-green-600" : "text-gray-600"
        }`}
      >
        {trend}
      </p>
    </div>
  );
}
