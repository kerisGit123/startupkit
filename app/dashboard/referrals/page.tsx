"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
// Card components removed - using custom div styling for consistency
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Users, TrendingUp, Award, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useMemo } from "react";

export default function ReferralsPage() {
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

  // Generate referral code if user doesn't have one
  useEffect(() => {
    if (user?.id && referralCode === null) {
      generateCode({ userId: user.id });
    }
  }, [user?.id, referralCode, generateCode]);

  // Build referral link using useMemo
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Invite friends and earn credits together</p>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-violet-100 rounded-xl">
              <Gift className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Your Referral Link</h2>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Share this link with your friends</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink || "Generating..."}
                readOnly
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-mono text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant={copied ? "default" : "outline"}
                className="flex items-center gap-2 rounded-xl"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-violet-100/60 border border-violet-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-violet-800 mb-2">Referral Rewards</p>
            <ul className="text-xs text-violet-700 space-y-1">
              <li>- You get <strong>{rewardCredits} credits</strong> when your friend signs up and verifies their email</li>
              <li>- Your friend gets <strong>{bonusCredits} credits</strong> as a welcome bonus</li>
              <li>- No limit on how many friends you can refer!</li>
            </ul>
          </div>

          {referralCode?.code && (
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">Your referral code</p>
              <p className="text-xl font-bold text-violet-600 tracking-wider">{referralCode.code}</p>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-900">{referralStats?.totalReferrals || 0}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Credits Earned</p>
            <p className="text-2xl font-bold text-gray-900">{referralStats?.totalCreditsEarned || 0}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-100">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{referralStats?.pendingReferrals || 0}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-violet-100">
                <Award className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Your Rank</p>
            <p className="text-2xl font-bold text-gray-900">
              {userRank?.rank ? `#${userRank.rank}` : "N/A"}
            </p>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Your Referrals</h2>
          </div>
          {!referralStats?.referrals || referralStats.referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-gray-100 rounded-xl inline-block mb-3">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No referrals yet</p>
              <p className="text-xs text-gray-400 mt-1">Share your referral link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralStats.referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">Referral #{index + 1}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(referral.referredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        referral.status === "rewarded"
                          ? "default"
                          : referral.status === "pending"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {referral.status}
                    </Badge>
                    {referral.status === "rewarded" && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        +{referral.rewardAmount} credits
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Gift className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">How It Works</h2>
          </div>
          <ol className="space-y-3 text-sm">
            {[
              "Share your unique referral link with friends",
              "Your friend signs up using your link",
              "They verify their email address",
              `You both get credits automatically! You get ${rewardCredits} credits, they get ${bonusCredits} credits`,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-violet-100 text-violet-600 font-bold text-xs shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-600 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
