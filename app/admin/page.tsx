"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, CreditCard, Ticket, DollarSign, ShoppingCart, Calendar, Download, Bell, Mail, UserPlus, CalendarPlus, TrendingUp, TrendingDown, Activity, Star, ArrowUpRight, BarChart3, Repeat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
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

  const totalRevenue = analytics?.monthlyData?.reduce((sum: number, d: { revenue: number }) => sum + d.revenue, 0) || 0;
  const totalPurchases = analytics?.purchaseMonthlyData?.reduce((sum: number, d: { count: number }) => sum + d.count, 0) || 0;
  const totalPurchaseRevenue = analytics?.purchaseMonthlyData?.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0) || 0;
  const totalSubRevenue = analytics?.subscriptionMonthlyData?.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0) || 0;
  const totalSubs = analytics?.subscriptionMonthlyData?.reduce((sum: number, d: { count: number }) => sum + d.count, 0) || 0;

  if (!stats) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded-md mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-36 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-36 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Detailed information about your store
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 h-9 text-sm"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 h-9 text-sm"
          />
          <Button onClick={handleDownloadReport} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Top Hero Cards - Revenue, Customers, Bookings */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Revenue Card */}
        <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium opacity-80">Total Revenue</p>
              <div className="p-2 bg-white/15 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">MYR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs opacity-70">MRR: MYR {stats?.mrr || "0"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers Card */}
        <Card className="bg-primary/90 text-primary-foreground border-0 shadow-lg">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium opacity-80">Total Customers</p>
              <div className="p-2 bg-white/15 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs opacity-70">+{stats?.newUsersThisMonth || 0} this month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions Card */}
        <Card className="bg-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium opacity-80">Active Subscriptions</p>
              <div className="p-2 bg-white/15 rounded-lg">
                <Repeat className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats?.activeSubscriptions || 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              <span className="text-xs opacity-70">+{stats?.newSubscriptionsThisMonth || 0} new subs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Compact */}
      <div className="grid gap-2 md:grid-cols-4">
        <Button 
          onClick={() => router.push('/admin/booking')}
          variant="outline"
          className="h-10 gap-2"
        >
          <CalendarPlus className="w-4 h-4" />
          <span className="text-sm">New Booking</span>
        </Button>
        <Button 
          onClick={() => router.push('/admin/inbox?tab=ticket')}
          variant="outline"
          className="h-10 gap-2"
        >
          <Ticket className="w-4 h-4" />
          <span className="text-sm">Create Ticket</span>
        </Button>
        <Button 
          onClick={() => router.push('/admin/customers')}
          variant="outline"
          className="h-10 gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm">Add Customer</span>
        </Button>
        <Button 
          onClick={() => router.push('/admin/email-management')}
          variant="outline"
          className="h-10 gap-2"
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm">Send Email</span>
        </Button>
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
        <TabsContent value="overview" className="space-y-5">

          {/* Secondary Metric Cards */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/booking')}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Today&apos;s Bookings</p>
                    <p className="text-2xl font-bold mt-1">{stats?.todaysBookings || 0}</p>
                  </div>
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Click to view calendar</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/inbox?tab=ticket')}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Open Tickets</p>
                    <p className="text-2xl font-bold mt-1">{stats?.openTickets || 0}</p>
                  </div>
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                </div>
                {(stats?.openTickets || 0) > 0 ? (
                  <p className="text-xs text-amber-600 font-medium mt-2">Needs attention</p>
                ) : (
                  <p className="text-xs text-green-600 mt-2">All clear</p>
                )}
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Churn Rate</p>
                    <p className="text-2xl font-bold mt-1">{stats?.churnRate || "0"}%</p>
                  </div>
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <TrendingDown className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stats?.canceledSubscriptions || 0} canceled</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Customer CLV</p>
                    <p className="text-2xl font-bold mt-1">MYR {stats?.clv || "0"}</p>
                  </div>
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Lifetime value</p>
              </CardContent>
            </Card>
          </div>

          {/* SaaS Health Row */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4 pb-3 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Net Revenue Retention</p>
                  <p className="text-xl font-bold">{stats?.nrr || "100"}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">ARR</p>
                  <p className="text-xl font-bold">MYR {stats?.arr || "0"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avg Sub Length</p>
                  <p className="text-xl font-bold">{stats?.avgSubLengthMonths || "0"} mo</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart + Recent Sales */}
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={analytics?.monthlyData.map(d => ({ 
                      month: d.month, 
                      revenue: d.revenue
                    })) || []}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <CardDescription>{recentActivity?.length || 0} transactions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => router.push('/admin/revenue')}>
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!recentActivity ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 6).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                            {activity.type === "subscription" 
                              ? <CreditCard className="w-4 h-4 text-primary" />
                              : <ShoppingCart className="w-4 h-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.type === "subscription" 
                                ? `${activity.plan} plan`
                                : `${activity.tokens} credits`}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                              {activity.userEmail}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          +MYR {activity.type === "subscription" 
                            ? (activity.plan === "pro" ? "29.00" : activity.plan === "business" ? "99.00" : "19.90")
                            : ((activity.amount || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Overview</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={analytics?.monthlyData.map(d => ({ month: d.month, revenue: d.revenue })) || []}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value: number | string) => `MYR ${typeof value === 'number' ? value.toLocaleString() : value}`} />} />
                    <Bar dataKey="revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Purchases</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={purchaseChartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={analytics?.purchaseMonthlyData || []} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="count" fill="var(--chart-2)" fillOpacity={0.3} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="amount" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Subscriptions</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ChartContainer config={subscriptionChartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={analytics?.subscriptionMonthlyData || []} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="count" fill="var(--chart-3)" fillOpacity={0.3} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="amount" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Purchases Report</CardTitle>
                <CardDescription>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                    : "All time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Purchases</p>
                      <p className="text-2xl font-bold mt-1">{totalPurchases}</p>
                    </div>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Purchase Revenue</p>
                      <p className="text-2xl font-bold mt-1">MYR {totalPurchaseRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Subscriptions Report</CardTitle>
                <CardDescription>
                  {startDate && endDate 
                    ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                    : "All time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total Subscriptions</p>
                      <p className="text-2xl font-bold mt-1">{totalSubs}</p>
                    </div>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Subscription Revenue</p>
                      <p className="text-2xl font-bold mt-1">MYR {totalSubRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab - Grouped by category */}
        <TabsContent value="notifications" className="space-y-5">
          {!recentActivity ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : recentActivity.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Bell className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-muted-foreground">No recent notifications</p></CardContent></Card>
          ) : (
            (() => {
              const subs = recentActivity.filter(a => a.type === "subscription");
              const credits = recentActivity.filter(a => a.type === "credit_purchase" || a.type === "purchase");
              const groups = [
                { key: "subs", label: "New Subscriptions", items: subs, icon: <Star className="w-4 h-4" />, color: "bg-primary", bgColor: "bg-primary/5", textColor: "text-primary" },
                { key: "credits", label: "Credit Purchases", items: credits, icon: <CreditCard className="w-4 h-4" />, color: "bg-primary/80", bgColor: "bg-primary/5", textColor: "text-primary" },
              ];
              return groups.map(g => {
                if (g.items.length === 0) return null;
                return (
                  <Card key={g.key}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg text-white ${g.color}`}>{g.icon}</div>
                        <CardTitle className="text-base">{g.label}</CardTitle>
                        <Badge variant="secondary" className="ml-auto">{g.items.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {g.items.map((activity, index) => (
                          <div key={index} className={`flex items-start gap-3 p-3 rounded-xl ${g.bgColor}`}>
                            <div className={`p-2 rounded-lg text-white ${g.color}`}>
                              {g.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {activity.type === "subscription" 
                                  ? `New subscription: ${activity.plan} plan`
                                  : `Credit purchase: ${activity.tokens} tokens`}
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(activity.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-primary whitespace-nowrap">
                              +MYR {activity.type === "subscription" 
                                ? (activity.plan === "pro" ? "29.00" : activity.plan === "business" ? "99.00" : "19.90")
                                : ((activity.amount || 0) / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

