"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail, Eye, MousePointer, Send, AlertTriangle,
  UserMinus, BarChart3, Loader2, ArrowDownRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function EmailAnalyticsPage() {
  const stats = useQuery(api.emails.analytics.getOverallStats);
  const campaignBreakdown = useQuery(api.emails.analytics.getCampaignBreakdown);
  const performanceData = useQuery(api.emails.analytics.getPerformanceOverTime);

  if (stats === undefined) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const funnelData = [
    { name: "Sent", value: stats.totalSent, pct: "100%" },
    { name: "Delivered", value: stats.totalDelivered, pct: stats.totalSent > 0 ? `${stats.deliveryRate.toFixed(1)}%` : "0%" },
    { name: "Opened", value: stats.totalOpened, pct: stats.totalSent > 0 ? `${stats.openRate.toFixed(1)}%` : "0%" },
    { name: "Clicked", value: stats.totalClicked, pct: stats.totalSent > 0 ? `${stats.clickRate.toFixed(1)}%` : "0%" },
  ];

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track campaign performance, delivery, and engagement
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left - Main KPIs (inspired by pic12, pic13, pic14) */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Sent</p>
                  <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Bounce Rate</p>
                  <p className="text-2xl font-bold">{stats.bounceRate.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">{stats.totalFailed} bounced</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Open Rate</p>
                  <p className="text-2xl font-bold">{stats.openRate.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">{stats.totalOpened} opens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <MousePointer className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Click Rate</p>
                  <p className="text-2xl font-bold">{stats.clickRate.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">{stats.totalClicked} clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <UserMinus className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium">Unsubscribed</p>
                  <p className="text-2xl font-bold">{stats.unsubscribeCount}</p>
                  <p className="text-xs text-muted-foreground">{stats.unsubscribeRate.toFixed(2)}% rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Charts */}
        <div className="col-span-9 space-y-6">
          {/* Funnel (inspired by pic13) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Email Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {funnelData.map((step, i) => (
                  <div
                    key={step.name}
                    className="rounded-lg p-4 text-center"
                    style={{
                      backgroundColor: [
                        "rgb(219 234 254)", "rgb(209 250 229)",
                        "rgb(237 233 254)", "rgb(254 249 195)",
                      ][i],
                    }}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase">{step.name}</p>
                    <p className="text-xl font-bold mt-1">{step.value.toLocaleString()}</p>
                    <p className="text-xs font-medium">{step.pct}</p>
                    {i < funnelData.length - 1 && (
                      <div className="flex justify-center mt-1">
                        <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Over Time (inspired by pic10, pic11, pic12) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Email Marketing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData && performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} name="Sent" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="opened" stroke="#22c55e" strokeWidth={2} name="Opened" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="clicked" stroke="#a855f7" strokeWidth={2} name="Clicked" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No performance data yet</p>
                    <p className="text-xs mt-1">Send campaigns to see trends here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Breakdown Table (inspired by pic11, pic12) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Campaign Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignBreakdown && campaignBreakdown.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-2.5 font-medium text-muted-foreground">Name</th>
                        <th className="text-center p-2.5 font-medium text-muted-foreground">Recipients</th>
                        <th className="text-center p-2.5 font-medium text-muted-foreground">Open Rate</th>
                        <th className="text-center p-2.5 font-medium text-muted-foreground">Click Rate</th>
                        <th className="text-center p-2.5 font-medium text-muted-foreground">Bounce Rate</th>
                        <th className="text-center p-2.5 font-medium text-muted-foreground">Delivered</th>
                        <th className="text-center p-2.5 font-medium text-muted-foreground">Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignBreakdown.filter(c => c.status === "sent").map((c) => (
                        <tr key={c._id} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="p-2.5">
                            <span className="font-medium">{c.name}</span>
                          </td>
                          <td className="p-2.5 text-center">{c.recipients.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-medium">{c.openRate.toFixed(2)}%</td>
                          <td className="p-2.5 text-center font-medium">{c.clickRate.toFixed(2)}%</td>
                          <td className="p-2.5 text-center">
                            <span className={c.bounceRate > 5 ? "text-red-600 font-medium" : ""}>
                              {c.bounceRate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-2.5 text-center">{c.deliveredCount.toLocaleString()}</td>
                          <td className="p-2.5 text-center text-muted-foreground">
                            {c.sentAt ? formatDate(c.sentAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No campaigns sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
