"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, CreditCard, Ticket, DollarSign, TrendingUp, ShoppingCart, Calendar, Download, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const stats = useQuery(api.adminDashboard.getDashboardStats);
  const recentActivity = useQuery(api.adminDashboard.getRecentActivity);
  const analytics = useQuery(api.adminAnalytics.getAnalytics);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const handleDownloadReport = () => {
    // Generate CSV report
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', stats?.totalUsers || 0],
      ['Active Subscriptions', stats?.activeSubscriptions || 0],
      ['MRR', stats?.mrr || 0],
      ['Open Tickets', stats?.openTickets || 0],
      ['Total Revenue', analytics?.totalRevenue || 0],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const revenueChartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const purchaseChartConfig = {
    count: {
      label: "Count",
      color: "var(--primary)",
    },
    amount: {
      label: "Amount (MYR)",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const subscriptionChartConfig = {
    count: {
      label: "Count",
      color: "var(--primary)",
    },
    amount: {
      label: "Amount (MYR)",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your SaaS platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
            placeholder="Start date"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
            placeholder="End date"
          />
          <Button onClick={handleDownloadReport} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+{stats?.newUsersThisMonth || 0} this month</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+{stats?.newSubscriptionsThisMonth || 0} this month</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MYR {stats?.mrr || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/tickets'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
        
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats?.newUsersThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">+20% from last hour</p>
              </CardContent>
            </Card>
          </div>

          {/* Overview Chart */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
                <CardDescription>Revenue trends - Last 6 months</CardDescription>
              </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={analytics?.monthlyData.map(d => ({ 
                  month: d.month, 
                  revenue: d.revenue
                })) || []}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value: number | string) => `MYR ${typeof value === 'number' ? value.toLocaleString() : value}`}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month</CardDescription>
              </CardHeader>
              <CardContent>
                {!recentActivity ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent sales</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.type === "subscription" 
                                ? `${activity.plan} plan`
                                : `${activity.tokens} credits`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {activity.userEmail}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">+MYR {activity.type === "subscription" ? "99.00" : "39.00"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Overview</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={analytics?.monthlyData.map(d => ({ 
                      month: d.month, 
                      revenue: d.revenue
                    })) || []}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          formatter={(value: number | string) => `MYR ${typeof value === 'number' ? value.toLocaleString() : value}`}
                        />
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchases</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={purchaseChartConfig} className="h-[250px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={analytics?.purchaseMonthlyData || []}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      fillOpacity={0.4}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscriptions</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={subscriptionChartConfig} className="h-[250px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={analytics?.subscriptionMonthlyData || []}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      fillOpacity={0.4}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="var(--color-amount)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Purchases Report */}
            <Card>
              <CardHeader>
                <CardTitle>Purchases Report</CardTitle>
                <CardDescription>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                    : "All time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Purchases</p>
                      <p className="text-2xl font-bold">{analytics?.purchaseMonthlyData?.reduce((sum, d) => sum + d.count, 0) || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total count</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Purchase Revenue</p>
                      <p className="text-2xl font-bold">MYR {analytics?.purchaseMonthlyData?.reduce((sum, d) => sum + d.amount, 0).toFixed(2) || "0.00"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total amount</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions Report */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions Report</CardTitle>
                <CardDescription>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                    : "All time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                      <p className="text-2xl font-bold">{analytics?.subscriptionMonthlyData?.reduce((sum, d) => sum + d.count, 0) || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total count</p>
                    </div>
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Subscription Revenue</p>
                      <p className="text-2xl font-bold">MYR {analytics?.subscriptionMonthlyData?.reduce((sum, d) => sum + d.amount, 0).toFixed(2) || "0.00"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total amount</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>System alerts and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!recentActivity ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.type === "subscription" 
                            ? `New subscription: ${activity.plan} plan`
                            : `Credit purchase: ${activity.tokens} tokens`}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

