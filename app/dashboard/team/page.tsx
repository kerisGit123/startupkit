"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import { UserPlus, Mail, Shield, MoreVertical } from "lucide-react";

export default function TeamPage() {
  const { user } = useUser();
  const { organization, memberships } = useOrganization({
    memberships: {
      pageSize: 20,
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-900">Please sign in to access team management</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-2">
              {organization ? `Manage members of ${organization.name}` : "Manage your team"}
            </p>
          </div>
          {organization && (
            <button 
              onClick={() => {
                // Open Clerk's organization invite modal
                if (typeof window !== 'undefined') {
                  window.open(`https://dashboard.clerk.com/apps/${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split('_')[1]}/instances/${organization.id}/members`, '_blank');
                }
              }}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
          )}
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">
              {organization?.membersCount || 1}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Admins</p>
            <p className="text-3xl font-bold text-gray-900">1</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Pending Invites</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Members</h2>

          <div className="space-y-4">
            {/* Current User */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold">
                  {user.firstName?.[0] || user.fullName?.[0] || "U"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.fullName || "You"}</p>
                  <p className="text-sm text-gray-500">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                  Owner
                </span>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Organization Members */}
            {memberships?.data && memberships.data.length > 0 ? (
              memberships.data.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      {membership.publicUserData?.firstName?.[0] || "M"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {membership.publicUserData?.firstName} {membership.publicUserData?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{membership.publicUserData?.identifier}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full capitalize">
                      {membership.role}
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No other team members yet</p>
                <p className="text-sm text-gray-400">Invite team members to collaborate</p>
              </div>
            )}
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Roles & Permissions</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Owner</p>
                <p className="text-sm text-gray-600">Full access to all features and settings</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Admin</p>
                <p className="text-sm text-gray-600">Can manage team members and billing</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Member</p>
                <p className="text-sm text-gray-600">Can use features based on plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
