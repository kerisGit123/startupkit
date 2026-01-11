"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, TrendingUp, Settings, DollarSign, Copy, Bell, X } from "lucide-react";
import { useState } from "react";

export default function AdminReferralsPage() {
  const [rewardCredits, setRewardCredits] = useState("");
  const [bonusCredits, setBonusCredits] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ userId: string; userName: string; userEmail: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState("");

  const settings = useQuery(api.referrals.getReferralSettings);
  const leaderboard = useQuery(api.referrals.getReferralLeaderboard, { limit: 50 });
  const updateSettings = useMutation(api.referrals.updateReferralSettings);
  const createAlert = useMutation(api.alerts.createAlert);

  const handleUpdateSettings = async () => {
    try {
      await updateSettings({
        enabled,
        rewardCredits: rewardCredits !== "" ? parseInt(rewardCredits) : undefined,
        bonusCredits: bonusCredits !== "" ? parseInt(bonusCredits) : undefined,
      });
      alert("Referral settings updated successfully!");
      setRewardCredits("");
      setBonusCredits("");
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert("Failed to update settings");
    }
  };

  const setDefaultPreset = () => {
    setRewardCredits("50");
    setBonusCredits("100");
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const openAlertDialog = (userId: string, userName: string, userEmail: string) => {
    setAlertDialog({ userId, userName, userEmail });
    setAlertMessage("");
  };

  const sendAlertToReferrer = async () => {
    if (!alertDialog || !alertMessage.trim()) {
      alert("Please enter a message");
      return;
    }
    
    setSendingAlert(alertDialog.userId);
    try {
      console.log("Creating alert for user:", {
        userId: alertDialog.userId,
        userName: alertDialog.userName,
        userEmail: alertDialog.userEmail,
      });
      
      // Create alert in database that will appear in alerts page
      const result = await createAlert({
        title: `Message from Admin`,
        message: alertMessage,
        type: "info",
        targetType: "specific_user",
        targetValue: alertDialog.userId,
        priority: 5,
        isDismissible: true,
        createdBy: "admin",
      });
      
      console.log("Alert created successfully:", result);
      alert(`Alert sent to ${alertDialog.userName}!\n\nThe message will appear in their alerts page.\n\nUser ID: ${alertDialog.userId}`);
      setAlertDialog(null);
      setAlertMessage("");
    } catch (error) {
      console.error("Failed to send alert:", error);
      alert("Failed to send alert");
    } finally {
      setSendingAlert(null);
    }
  };

  // Calculate total stats
  const totalReferrals = leaderboard?.reduce((sum, user) => sum + user.totalReferrals, 0) || 0;
  const totalCreditsDistributed = leaderboard?.reduce((sum, user) => sum + user.totalCreditsEarned, 0) || 0;
  const activeReferrers = leaderboard?.filter(user => user.totalReferrals > 0).length || 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Referral Program Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure rewards and monitor referral activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              All-time referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReferrers}</div>
            <p className="text-xs text-muted-foreground">
              Users with referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Distributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsDistributed}</div>
            <p className="text-xs text-muted-foreground">
              Total credits awarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Program Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings?.enabled ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Current status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Referral Rewards Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Current Settings:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Referrer Reward: <strong>{settings?.rewardCredits ?? 50} credits</strong></li>
              <li>• New User Bonus: <strong>{settings?.bonusCredits ?? 10} credits</strong></li>
              <li>• Program Status: <strong>{settings?.enabled ? "Enabled" : "Disabled"}</strong></li>
            </ul>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                Enable Program
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">Referrer Reward (Credits)</label>
              <Input
                type="number"
                placeholder={`Current: ${settings?.rewardCredits || 50}`}
                value={rewardCredits}
                onChange={(e) => setRewardCredits(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Credits awarded to referrer
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">New User Bonus (Credits)</label>
              <Input
                type="number"
                placeholder={`Current: ${settings?.bonusCredits ?? 10}`}
                value={bonusCredits}
                onChange={(e) => setBonusCredits(e.target.value)}
                min="0"
                step="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Bonus for referred user (set to 0 to disable)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={setDefaultPreset} variant="outline" className="flex-1">
              Set Default (50/100)
            </Button>
            <Button onClick={handleUpdateSettings} className="flex-1">
              Update Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!leaderboard || leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No referrals yet
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        #{user.rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{user.userName}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                          <button
                            onClick={() => user.userEmail && copyEmail(user.userEmail)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            title="Copy email"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedEmail === user.userEmail ? "Copied!" : ""}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{user.totalReferrals} referrals</p>
                        <p className="text-xs text-muted-foreground">
                          {user.totalCreditsEarned} credits earned
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAlertDialog(user.userId, user.userName || "Unknown", user.userEmail || "")}
                        disabled={sendingAlert === user.userId}
                        className="flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        {sendingAlert === user.userId ? "Sending..." : "Alert"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      {alertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Send Alert to {alertDialog.userName}</h3>
              <button
                onClick={() => setAlertDialog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Recipient: {alertDialog.userEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Message</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full border rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setAlertDialog(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={sendAlertToReferrer}
                disabled={!alertMessage.trim() || !!sendingAlert}
                className="flex-1"
              >
                {sendingAlert ? "Sending..." : "Send Alert"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
