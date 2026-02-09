"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import { UserPlus, Users, Shield, Crown, Mail } from "lucide-react";

export default function TeamPage() {
  const { user } = useUser();
  const { organization, memberships } = useOrganization({
    memberships: {
      pageSize: 20,
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {organization ? `Manage members of ${organization.name}` : "Manage your team"}
            </p>
          </div>
          {organization && (
            <button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open(`https://dashboard.clerk.com/apps/${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split('_')[1]}/instances/${organization.id}/members`, '_blank');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">{organization?.membersCount || 1}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-100">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Admins</p>
            <p className="text-3xl font-bold text-gray-900">1</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-violet-100">
                <Mail className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Pending Invites</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          </div>

          <div className="space-y-3">
            {/* Current User */}
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {user.firstName?.[0] || user.fullName?.[0] || "U"}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{user.fullName || "You"}</p>
                  <p className="text-xs text-gray-400">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                Owner
              </span>
            </div>

            {/* Organization Members */}
            {memberships?.data && memberships.data.length > 0 ? (
              memberships.data.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 font-bold text-sm">
                      {membership.publicUserData?.firstName?.[0] || "M"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {membership.publicUserData?.firstName} {membership.publicUserData?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{membership.publicUserData?.identifier}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full capitalize">
                    {membership.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-3 bg-gray-100 rounded-xl inline-block mb-3">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No other team members yet</p>
                <p className="text-xs text-gray-400 mt-1">Invite team members to collaborate</p>
              </div>
            )}
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="p-1.5 bg-amber-100 rounded-lg mt-0.5">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Owner</p>
                <p className="text-xs text-gray-500">Full access to all features and settings</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="p-1.5 bg-blue-100 rounded-lg mt-0.5">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Admin</p>
                <p className="text-xs text-gray-500">Can manage team members and billing</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-1.5 bg-gray-100 rounded-lg mt-0.5">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Member</p>
                <p className="text-xs text-gray-500">Can use features based on plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
