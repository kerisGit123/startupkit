"use client";

import { UserProfile } from "@clerk/nextjs";

export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">User Management</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-6">
            Manage your account settings, security, and connected accounts using Clerk.
          </p>
          
          {/* Clerk User Profile Component */}
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
