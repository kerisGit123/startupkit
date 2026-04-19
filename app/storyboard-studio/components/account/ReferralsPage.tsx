"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PanelLeftClose, PanelLeftOpen, ChevronDown,
  Gift, Copy, Users, TrendingUp, Award, CheckCircle,
} from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ReferralsPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  rewarded: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  expired: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

export default function ReferralsPage({ sidebarOpen, onToggleSidebar }: ReferralsPageProps) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  const referralCode = useQuery(
    api.referrals.getReferralCode,
    user?.id ? { userId: user.id } : "skip"
  );
  const referralStats = useQuery(
    api.referrals.getReferralStats,
    user?.id ? { userId: user.id } : "skip"
  );
  const userRank = useQuery(
    api.referrals.getUserReferralRank,
    user?.id ? { userId: user.id } : "skip"
  );
  const settings = useQuery(api.referrals.getReferralSettings);
  const generateCode = useMutation(api.referrals.generateReferralCode);

  useEffect(() => {
    if (user?.id && referralCode === null) {
      generateCode({ userId: user.id });
    }
  }, [user?.id, referralCode, generateCode]);

  const referralLink = useMemo(() => {
    if (referralCode?.code) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
      return `${baseUrl}/sign-up?ref=${referralCode.code}`;
    }
    return "";
  }, [referralCode?.code]);

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rewardCredits = settings?.rewardCredits || 50;
  const bonusCredits = settings?.bonusCredits || 10;

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="text-(--text-secondary) transition hover:text-(--text-primary) md:hidden">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Referral Program</h1>
            <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrgSwitcher />
          <UserButton />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        <p className="text-sm text-(--text-tertiary)">Invite friends and earn credits together</p>

        {/* Referral Link Card */}
        <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Gift className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-(--text-primary)">Your Referral Link</h2>
          </div>

          <div className="bg-(--bg-tertiary) rounded-lg p-4 mb-4">
            <label className="block text-[10px] font-medium text-(--text-tertiary) mb-2 uppercase tracking-wider">Share this link with your friends</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink || "Generating..."}
                readOnly
                className="flex-1 px-3 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-sm text-(--text-primary) font-mono"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  copied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-(--accent-purple) text-white hover:bg-(--accent-purple-hover)"
                }`}
              >
                {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-violet-400 mb-2">Referral Rewards</p>
            <ul className="text-xs text-violet-300/80 space-y-1">
              <li>- You get <strong className="text-violet-300">{rewardCredits} credits</strong> when your friend signs up and verifies their email</li>
              <li>- Your friend gets <strong className="text-violet-300">{bonusCredits} credits</strong> as a welcome bonus</li>
              <li>- No limit on how many friends you can refer!</li>
            </ul>
          </div>

          {referralCode?.code && (
            <div className="text-center mt-4">
              <p className="text-xs text-(--text-tertiary)">Your referral code</p>
              <p className="text-xl font-bold text-violet-400 tracking-wider">{referralCode.code}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Referrals", value: referralStats?.totalReferrals || 0, icon: Users, color: "blue" },
            { label: "Credits Earned", value: referralStats?.totalCreditsEarned || 0, icon: TrendingUp, color: "emerald" },
            { label: "Pending", value: referralStats?.pendingReferrals || 0, icon: Users, color: "amber" },
            { label: "Your Rank", value: userRank?.rank ? `#${userRank.rank}` : "N/A", icon: Award, color: "violet" },
          ].map((s) => (
            <div key={s.label} className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-4">
              <div className={`p-2 rounded-lg bg-${s.color}-500/10 w-fit mb-2`}>
                <s.icon className={`w-4 h-4 text-${s.color}-400`} />
              </div>
              <p className="text-xs text-(--text-tertiary) mb-0.5">{s.label}</p>
              <p className="text-xl font-bold text-(--text-primary)">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Referral History */}
        <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-semibold text-(--text-primary)">Your Referrals</h2>
          </div>

          {!referralStats?.referrals || referralStats.referrals.length === 0 ? (
            <div className="text-center py-10">
              <div className="p-3 rounded-xl bg-(--bg-tertiary) inline-block mb-3">
                <Gift className="w-7 h-7 text-(--text-tertiary)" />
              </div>
              <p className="text-sm text-(--text-secondary)">No referrals yet</p>
              <p className="text-xs text-(--text-tertiary) mt-1">Share your referral link to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referralStats.referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-(--bg-tertiary) rounded-lg hover:bg-(--bg-primary) transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-(--text-primary)">Referral #{index + 1}</p>
                    <p className="text-xs text-(--text-tertiary)">{new Date(referral.referredAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[referral.status] || ""}`}>
                      {referral.status}
                    </span>
                    {referral.status === "rewarded" && (
                      <p className="text-xs text-emerald-400 mt-1 font-medium">+{referral.rewardAmount} credits</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Gift className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-(--text-primary)">How It Works</h2>
          </div>
          <ol className="space-y-2.5 text-sm">
            {[
              "Share your unique referral link with friends",
              "Your friend signs up using your link",
              "They verify their email address",
              `You both get credits automatically! You get ${rewardCredits} credits, they get ${bonusCredits} credits`,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-500/10 text-violet-400 font-bold text-xs shrink-0">
                  {i + 1}
                </span>
                <span className="text-(--text-secondary)">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
