"use client";

import { useUser, useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminRole } from "@/hooks/useAdminRole";
import { ArrowUpRight, Users, Zap, BarChart3, Wallet, Settings, Shield, Copy, Check, Gift, FileText, Sparkles, Crown, ArrowRight, Ticket, TrendingUp } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const stats = [
    {
      name: "Total Scans",
      value: "0",
      change: "+0%",
      changeType: "neutral" as const,
      subtitle: "Compared to last month",
      icon: Zap,
    },
    {
      name: "Credits Balance",
      value: creditsBalance?.toString() || "0",
      change: "Available",
      changeType: "positive" as const,
      subtitle: "Current balance",
      icon: Sparkles,
    },
    {
      name: "Team Members",
      value: organization?.membersCount?.toString() || "1",
      change: "Active",
      changeType: "positive" as const,
      subtitle: "In your organization",
      icon: Users,
    },
    {
      name: "Current Plan",
      value: plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free",
      change: plan === "free" ? "Upgrade" : "Active",
      changeType: plan === "free" ? "neutral" as const : "positive" as const,
      subtitle: "Subscription tier",
      icon: Crown,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <ReferralTracker />
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Alert Banner */}
        <AlertBanner />

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Overview</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Welcome back, {user.firstName || user.fullName || "User"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
            {isAdmin && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Crown className="w-3 h-3 mr-1" />
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid — Consist Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] font-medium text-gray-500">{stat.name}</p>
                  <Icon className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1.5">{stat.value}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    stat.changeType === "positive" ? "bg-emerald-50 text-emerald-600" :
                    stat.changeType === "negative" ? "bg-red-50 text-red-600" :
                    "bg-gray-50 text-gray-500"
                  }`}>
                    {stat.changeType === "positive" && <TrendingUp className="w-3 h-3" />}
                    {stat.change}
                  </span>
                  <span className="text-[11px] text-gray-400">{stat.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscription & Credits Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Subscription Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Subscription</h2>
              <Link href="/dashboard/billing" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5 transition-colors">
                Manage <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2 mb-4">
                  <p className="text-2xl font-bold capitalize text-gray-900">{plan}</p>
                  <span className="text-xs text-gray-400">plan</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-gray-400 mb-0.5">Scans/Month</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {entitlements?.scansPerMonth === -1 ? "Unlimited" : entitlements?.scansPerMonth || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-gray-400 mb-0.5">Storage</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {entitlements?.storageMB === -1 ? "Unlimited" : `${entitlements?.storageMB || 0}MB`}
                    </p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
                >
                  Upgrade Plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Credits Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Credits</h2>
              <Link href="/dashboard/billing" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5 transition-colors">
                History <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="mb-5">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{creditsBalance ?? 0}</p>
                <span className="text-xs text-gray-400">available</span>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-all text-[13px]"
              >
                Buy Credits
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/usage"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-all text-[13px]"
              >
                View Usage
              </Link>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        {referralSettings?.enabled && referralLink && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Gift className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Refer Friends & Earn Credits</h2>
                  <p className="text-[11px] text-gray-400">
                    Earn {referralSettings.rewardCredits || 50} credits per referral
                    {referralSettings.bonusCredits && referralSettings.bonusCredits > 0 
                      ? ` — they get ${referralSettings.bonusCredits} too!` 
                      : '!'}
                  </p>
                </div>
              </div>
              <Link href="/dashboard/referrals" className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5 transition-colors">
                Details <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 font-mono text-[12px]"
              />
              <button
                onClick={handleCopyReferralLink}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 text-[13px] ${
                  copied 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            
            {referralCode && referralCode.totalReferrals > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{referralCode.totalReferrals}</p>
                  <p className="text-[11px] text-gray-400 font-medium">Total Referrals</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{referralCode.totalCreditsEarned}</p>
                  <p className="text-[11px] text-gray-400 font-medium">Credits Earned</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: "/dashboard/usage", icon: BarChart3, label: "Usage" },
              { href: "/dashboard/billing", icon: Wallet, label: "Billing" },
              { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
              { href: "/dashboard/team", icon: Users, label: "Team" },
              { href: "/support", icon: Ticket, label: "Support" },
              { href: "/dashboard/settings", icon: Settings, label: "Settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col items-center gap-2 p-3.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-center"
              >
                <link.icon className="w-4.5 h-4.5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                <p className="text-[12px] font-medium text-gray-500 group-hover:text-emerald-700">{link.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
