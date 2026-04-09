"use client";

import { useUser } from "@clerk/nextjs";
import AdminPage from "@/app/storyboard-studio/components/account/AdminPage";

export default function AdminDashboardPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage system cleanup and administrative tasks
          </p>
        </div>

        {/* Admin Content */}
        <div className="bg-white rounded-xl border border-gray-100">
          <AdminPage />
        </div>
      </div>
    </div>
  );
}
