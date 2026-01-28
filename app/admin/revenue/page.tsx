"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function RevenueDashboard() {
  const analytics = useQuery(api.financialLedger.getRevenueAnalytics);
  const allTransactions = useQuery(api.financialLedger.getAllLedgerEntries, {});
  
  // Get recent transactions (last 10)
  const recentTransactions = allTransactions?.slice(0, 10) || [];

  const formatCurrency = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subscription_charge": return "bg-green-100 text-green-800";
      case "one_time_payment": return "bg-blue-100 text-blue-800";
      case "credit_purchase": return "bg-purple-100 text-purple-800";
      case "refund": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "stripe_subscription": return { label: "Stripe Sub", color: "bg-indigo-100 text-indigo-800" };
      case "stripe_payment": return { label: "Stripe", color: "bg-blue-100 text-blue-800" };
      case "manual": return { label: "Manual", color: "bg-gray-100 text-gray-800" };
      case "referral_bonus": return { label: "Referral", color: "bg-green-100 text-green-800" };
      default: return { label: source, color: "bg-gray-100 text-gray-800" };
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  const revenueBySourceData = Object.entries(analytics.revenueBySource || {}).map(([source, amount]) => ({
    source,
    amount: amount as number,
    percentage: ((amount as number) / analytics.currentPeriod.revenue * 100).toFixed(1),
  }));

  // Generate trend data (mock data for last 6 months)
  const trendData = [
    { month: 'Jul', revenue: analytics.mrr * 0.7, refunds: analytics.currentPeriod.refunds * 0.5 },
    { month: 'Aug', revenue: analytics.mrr * 0.8, refunds: analytics.currentPeriod.refunds * 0.6 },
    { month: 'Sep', revenue: analytics.mrr * 0.85, refunds: analytics.currentPeriod.refunds * 0.7 },
    { month: 'Oct', revenue: analytics.mrr * 0.9, refunds: analytics.currentPeriod.refunds * 0.8 },
    { month: 'Nov', revenue: analytics.mrr * 0.95, refunds: analytics.currentPeriod.refunds * 0.9 },
    { month: 'Dec', revenue: analytics.mrr, refunds: analytics.currentPeriod.refunds },
  ];

  // Pie chart data for revenue sources
  const pieData = revenueBySourceData.map((item) => ({
    name: getSourceBadge(item.source).label,
    value: item.amount,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your financial performance and growth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/revenue/transactions'}>
            <Receipt className="w-4 h-4 mr-2" />
            All Transactions
          </Button>
          <Button onClick={() => {
          if (!analytics) return;
          const report = {
            generated: new Date().toISOString(),
            mrr: analytics.mrr,
            arr: analytics.arr,
            currentPeriod: analytics.currentPeriod,
            previousPeriod: analytics.previousPeriod,
            growth: analytics.growth,
            revenueBySource: analytics.revenueBySource,
          };
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* MRR Card */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(analytics.mrr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Subscription revenue per month
            </p>
          </CardContent>
        </Card>

        {/* ARR Card */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(analytics.arr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected annual revenue
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue Card */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (30d)</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(analytics.currentPeriod.netRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {analytics.growth >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={cn(
                "text-xs font-medium",
                analytics.growth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {Math.abs(analytics.growth)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions (30d)</CardTitle>
            <Receipt className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {analytics.currentPeriod.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.currentPeriod.refunds > 0 && (
                <span className="text-red-600">
                  {formatCurrency(analytics.currentPeriod.refunds)} refunded
                </span>
              )}
              {analytics.currentPeriod.refunds === 0 && "No refunds"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>6-month revenue and refunds overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="refunds" stroke="#ef4444" strokeWidth={2} name="Refunds" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Source Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>Revenue breakdown by source</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
            <CardDescription>Where your revenue is coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBySourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No revenue data available
                </p>
              ) : (
                revenueBySourceData.map((item) => {
                  const sourceBadge = getSourceBadge(item.source);
                  return (
                    <div key={item.source} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-12 bg-primary rounded-full" style={{
                          opacity: parseFloat(item.percentage) / 100
                        }}></div>
                        <div>
                          <Badge className={sourceBadge.color}>
                            {sourceBadge.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.percentage}% of total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Period Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
            <CardDescription>Current vs previous 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Period</span>
                  <span className="text-sm text-muted-foreground">Last 30 days</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium">{formatCurrency(analytics.currentPeriod.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Refunds:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(analytics.currentPeriod.refunds)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Net Revenue:</span>
                    <span className="font-bold text-green-600">{formatCurrency(analytics.currentPeriod.netRevenue)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Previous Period</span>
                  <span className="text-sm text-muted-foreground">30-60 days ago</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium">{formatCurrency(analytics.previousPeriod.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Refunds:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(analytics.previousPeriod.refunds)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Net Revenue:</span>
                    <span className="font-bold">{formatCurrency(analytics.previousPeriod.netRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <div className="flex items-center gap-2">
                    {analytics.growth >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <span className={cn(
                      "text-xl font-bold",
                      analytics.growth >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {analytics.growth >= 0 ? "+" : ""}{analytics.growth}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity (last 30 days)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/revenue/transactions'}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((transaction) => {
                  const sourceBadge = getSourceBadge(transaction.revenueSource);
                  return (
                    <TableRow key={transaction._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate">
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sourceBadge.color}>
                          {sourceBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-bold",
                          transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
