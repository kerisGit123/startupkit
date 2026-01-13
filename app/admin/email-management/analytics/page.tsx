"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Eye, MousePointer, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EmailAnalyticsPage() {
  const stats = useQuery(api.emails.analytics.getOverallStats);
  const topCampaigns = useQuery(api.emails.analytics.getTopCampaigns);
  const performanceData = useQuery(api.emails.analytics.getPerformanceOverTime);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track email campaign performance and engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSent || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.openRate ? `${stats.openRate.toFixed(1)}%` : "0%"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.clickRate ? `${stats.clickRate.toFixed(1)}%` : "0%"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCampaigns || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {performanceData && performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                <Line type="monotone" dataKey="opened" stroke="#82ca9d" name="Opened" />
                <Line type="monotone" dataKey="clicked" stroke="#ffc658" name="Clicked" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No performance data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {topCampaigns && topCampaigns.length > 0 ? (
            <div className="space-y-4">
              {topCampaigns.map((campaign) => (
                <div key={campaign._id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.sentCount} sent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{campaign.openRate.toFixed(1)}% open</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.clickRate.toFixed(1)}% click
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No campaigns sent yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
