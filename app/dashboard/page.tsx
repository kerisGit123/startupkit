"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminRole } from "@/hooks/useAdminRole";
import { ArrowUpRight, TrendingUp, Users, Zap, BarChart3, Wallet, Settings, Shield, Copy, Check, Gift } from "lucide-react";
import Link from "next/link";
import { AlertBanner } from "@/components/AlertBanner";
import { ReferralTracker } from "@/components/ReferralTracker";
import { useState, useMemo, useEffect } from "react";

export default function DashboardPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { companyId } = useCompany();
  const { plan, entitlements, isLoading } = useSubscription();
  const { isAdmin } = useAdminRole();
  const [copied, setCopied] = useState(false);

  const creditsBalance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip"
  );

  const referralCode = useQuery(
    api.referrals.getReferralCode,
    user?.id ? { userId: user.id } : "skip"
  );

  const referralSettings = useQuery(api.referrals.getReferralSettings);

  const generateReferralCode = useMutation(api.referrals.generateReferralCode);

  useEffect(() => {
    if (user?.id && referralCode === null) {
      generateReferralCode({ userId: user.id });
    }
  }, [user?.id, referralCode, generateReferralCode]);

  const referralLink = useMemo(() => {
    if (referralCode) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
      return `${baseUrl}/sign-up?ref=${referralCode.code}`;
    }
    return "";
  }, [referralCode]);

  const handleCopyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-900">Please sign in to access the dashboard</p>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Scans",
      value: "0",
      change: "+0%",
      icon: Zap,
      trend: "up"
    },
    {
      name: "Credits Balance",
      value: creditsBalance?.toString() || "0",
      change: "Available",
      icon: TrendingUp,
      trend: "neutral"
    },
    {
      name: "Team Members",
      value: organization?.membersCount?.toString() || "1",
      change: "Active",
      icon: Users,
      trend: "neutral"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <ReferralTracker />
      <div className="max-w-7xl mx-auto">
        {/* Alert Banner */}
        <div className="mb-6">
          <AlertBanner />
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user.firstName || user.fullName || "User"}! 👋
                {isAdmin && (
                  <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                    <Shield className="w-4 h-4 mr-1" />
                    Super Admin
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                Here&apos;s what&apos;s happening with your account today.
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition shadow-md whitespace-nowrap"
              >
                <Shield className="w-5 h-5" />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Icon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-500">{stat.change}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.name}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Subscription Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              <Link href="/dashboard/billing" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
                Manage <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                  <p className="text-2xl font-bold capitalize text-gray-900">{plan}</p>
                </div>
                <div className="flex gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Scans/Month</p>
                    <p className="font-semibold text-gray-900">
                      {entitlements?.scansPerMonth === -1 ? "∞" : entitlements?.scansPerMonth || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Storage</p>
                    <p className="font-semibold text-gray-900">
                      {entitlements?.storageMB === -1 ? "∞" : `${entitlements?.storageMB || 0}MB`}
                    </p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="block w-full text-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition"
                >
                  Upgrade Plan
                </Link>
              </div>
            )}
          </div>

          {/* Credits Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Credits</h2>
              <Link href="/dashboard/billing" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
                View History <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Available Credits</p>
              <p className="text-4xl font-bold text-gray-900">{creditsBalance ?? 0}</p>
            </div>
            <div className="space-y-2">
              <Link
                href="/pricing"
                className="block w-full text-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition"
              >
                Buy Credits
              </Link>
              <Link
                href="/dashboard/usage"
                className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition"
              >
                View Usage
              </Link>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        {referralSettings?.enabled && referralLink && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Refer Friends & Earn Credits</h2>
                <p className="text-sm text-gray-600">
                  Share your referral link and earn {referralSettings.rewardCredits || 50} credits for each friend who signs up
                  {referralSettings.bonusCredits && referralSettings.bonusCredits > 0 
                    ? `, and they get ${referralSettings.bonusCredits} credits too!` 
                    : '!'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                />
                <button
                  onClick={handleCopyReferralLink}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition flex items-center gap-2 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
              
              {referralCode && referralCode.totalReferrals > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{referralCode.totalReferrals}</p>
                      <p className="text-xs text-gray-600">Total Referrals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{referralCode.totalCreditsEarned}</p>
                      <p className="text-xs text-gray-600">Credits Earned</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/referrals"
              className="mt-4 block text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View detailed referral stats →
            </Link>
          </div>
        )}

        {/* Recent Activity / Quick Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/usage" className="p-4 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Usage</p>
            </Link>
            <Link href="/dashboard/billing" className="p-4 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-center">
              <Wallet className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Billing</p>
            </Link>
            <Link href="/dashboard/team" className="p-4 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Team</p>
            </Link>
            <Link href="/settings" className="p-4 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-center">
              <Settings className="w-6 h-6 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-900">Settings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
