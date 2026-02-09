"use client";

import { UserProfile } from "@clerk/nextjs";

export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage your account settings, security, and connected accounts
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
