"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground mt-2">
          Invite friends and earn credits together!
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900 mb-2">
              Share this link with your friends:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink || "Generating..."}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant={copied ? "default" : "outline"}
                className="flex items-center gap-2"
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

          <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-900 mb-2">
              🎁 Referral Rewards:
            </p>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• You get <strong>{rewardCredits} credits</strong> when your friend signs up and verifies their email</li>
              <li>• Your friend gets <strong>{bonusCredits} credits</strong> as a welcome bonus</li>
              <li>• No limit on how many friends you can refer!</li>
            </ul>
          </div>

          {referralCode?.code && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Your referral code:</p>
              <p className="text-2xl font-bold text-purple-600 tracking-wider">
                {referralCode.code}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Friends referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.totalCreditsEarned || 0}</div>
            <p className="text-xs text-muted-foreground">
              From referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats?.pendingReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRank?.rank ? `#${userRank.rank}` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {userRank?.totalUsers || 0} users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {!referralStats?.referrals || referralStats.referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your referral link to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {referralStats.referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">Referral #{index + 1}</p>
                    <p className="text-xs text-muted-foreground">
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
                      <p className="text-xs text-green-600 mt-1">
                        +{referral.rewardAmount} credits
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex-shrink-0">
                1
              </span>
              <span>Share your unique referral link with friends</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex-shrink-0">
                2
              </span>
              <span>Your friend signs up using your link</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex-shrink-0">
                3
              </span>
              <span>They verify their email address</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex-shrink-0">
                4
              </span>
              <span>
                You both get credits automatically! You get {rewardCredits} credits, they get {bonusCredits} credits
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
