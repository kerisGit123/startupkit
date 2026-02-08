"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  TrendingUp, 
  TrendingDown,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Zap,
  BarChart3,
  Users,
  RefreshCw
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RevenueDashboard() {
  const analytics = useQuery(api.financialLedger.getRevenueAnalytics);
  const allTransactions = useQuery(api.financialLedger.getAllLedgerEntries, {});
  const monthlyTrend = useQuery(api.financialLedger.getMonthlyRevenueTrend, { months: 6 });
  const financialSummary = useQuery(api.financialLedger.getFinancialSummary);
  
  const recentTransactions = allTransactions?.slice(0, 8) || [];

  const formatCurrency = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000000) return `RM${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `RM${(amount / 1000).toFixed(1)}K`;
    return `RM${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subscription_charge": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "one_time_payment": return "bg-blue-100 text-blue-700 border-blue-200";
      case "credit_purchase": return "bg-violet-100 text-violet-700 border-violet-200";
      case "refund": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "stripe_subscription": return "Subscriptions";
      case "stripe_payment": return "Payments";
      case "manual": return "Manual";
      case "referral_bonus": return "Referrals";
      case "credit_adjustment": return "Adjustments";
      default: return source;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "stripe_subscription": return "#8b5cf6";
      case "stripe_payment": return "#3b82f6";
      case "manual": return "#6b7280";
      case "referral_bonus": return "#10b981";
      case "credit_adjustment": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  const revenueBySourceData = Object.entries(analytics.revenueBySource || {}).map(([source, amount]) => ({
    source,
    label: getSourceLabel(source),
    amount: amount as number,
    percentage: analytics.currentPeriod.revenue > 0 ? ((amount as number) / analytics.currentPeriod.revenue * 100) : 0,
    color: getSourceColor(source),
  })).sort((a, b) => b.amount - a.amount);

  const trendData = (monthlyTrend || []).map((m: { month: string; revenue: number; subscriptions: number; oneTime: number }) => ({
    month: m.month,
    Revenue: m.revenue,
    Subscriptions: m.subscriptions,
    "One-time": m.oneTime,
  }));

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Financial overview and growth metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/revenue/transactions'}>
            <Receipt className="w-4 h-4 mr-1.5" />
            Transactions
          </Button>
          <Button size="sm" onClick={() => {
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
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Baremetrics-style Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* MRR */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">MRR</p>
              <RefreshCw className="h-4 w-4 text-emerald-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(analytics.mrr)}</p>
            <p className="text-emerald-200 text-xs mt-2">Monthly Recurring Revenue</p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <RefreshCw className="h-24 w-24" />
          </div>
        </Card>

        {/* ARR */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">ARR</p>
              <TrendingUp className="h-4 w-4 text-blue-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(analytics.arr)}</p>
            <p className="text-blue-200 text-xs mt-2">Annual Recurring Revenue</p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp className="h-24 w-24" />
          </div>
        </Card>

        {/* Net Revenue */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-violet-100 text-xs font-semibold uppercase tracking-wider">Net Revenue</p>
              <Zap className="h-4 w-4 text-violet-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(analytics.currentPeriod.netRevenue)}</p>
            <div className="flex items-center gap-1 mt-2">
              {analytics.growth >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-300" />
              )}
              <span className={cn(
                "text-xs font-semibold",
                analytics.growth >= 0 ? "text-emerald-300" : "text-red-300"
              )}>
                {Math.abs(analytics.growth)}% vs last 30d
              </span>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Zap className="h-24 w-24" />
          </div>
        </Card>

        {/* Transactions */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Transactions</p>
              <BarChart3 className="h-4 w-4 text-amber-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{analytics.currentPeriod.transactionCount}</p>
            <p className="text-amber-200 text-xs mt-2">
              {analytics.currentPeriod.refunds > 0 
                ? `${formatCurrency(analytics.currentPeriod.refunds)} refunded`
                : "Last 30 days"
              }
            </p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <BarChart3 className="h-24 w-24" />
          </div>
        </Card>
      </div>

      {/* SaaS Health Metrics - Inspired by Baremetrics/ChartMogul dashboards */}
      {analytics.saas && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Active Subs</p>
                <Users className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold">{analytics.saas.activeSubscriptions}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{analytics.saas.canceledSubscriptions} canceled</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Churn Rate</p>
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              </div>
              <p className="text-2xl font-extrabold">{analytics.saas.churnRate}%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Customer CLV</p>
                <Zap className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <p className="text-2xl font-extrabold">{formatCurrency(analytics.saas.clv)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Avg {analytics.saas.avgSubMonths} mo</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Signups</p>
                <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="text-2xl font-extrabold">{analytics.saas.newSignups}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Last mo: {analytics.saas.lastMonthSignups}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Payments</p>
                <Receipt className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-2xl font-extrabold">{analytics.saas.paymentsCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{analytics.saas.refundsCount} refunds</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Today</p>
                <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold">{formatCurrency(analytics.saas.todayRevenue)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{analytics.saas.totalCustomers} customers</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Trend Area Chart - Full Width Baremetrics Style */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <CardDescription>6-month revenue breakdown</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOneTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px'
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="Subscriptions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSubs)" />
              <Area type="monotone" dataKey="One-time" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOneTime)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown + Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Revenue by Source - Horizontal bars */}
        <Card className="md:col-span-3 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by Source</CardTitle>
            <CardDescription>Last 30 days breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBySourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet</p>
              ) : (
                revenueBySourceData.map((item) => (
                  <div key={item.source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">{item.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.percentage, 2)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Sidebar */}
        <div className="md:col-span-2 space-y-4">
          {/* Period Comparison */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Period Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This period</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(analytics.currentPeriod.netRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last period</span>
                  <span className="text-sm font-medium">{formatCurrency(analytics.previousPeriod.netRevenue)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium">Growth</span>
                  <div className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                    analytics.growth >= 0 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-red-100 text-red-700"
                  )}>
                    {analytics.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {analytics.growth >= 0 ? "+" : ""}{analytics.growth}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All-Time Stats */}
          {financialSummary && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lifetime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-sm font-bold">{formatCurrency(financialSummary.allTime.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Refunds</span>
                    <span className="text-sm font-medium text-red-600">-{formatCurrency(financialSummary.allTime.refunds)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Transaction</span>
                    <span className="text-sm font-medium">{formatCurrency(financialSummary.avgTransactionValue)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium">Net Revenue</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(financialSummary.allTime.net)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Top Customers */}
      {financialSummary && financialSummary.topCustomers.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Top Customers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {financialSummary.topCustomers.map((customer: { customer: string; total: number; count: number }, idx: number) => (
                <div key={customer.customer} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                      idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-100 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.customer.length > 25 ? customer.customer.substring(0, 25) + "..." : customer.customer}</p>
                      <p className="text-xs text-muted-foreground">{customer.count} transactions</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">{formatCurrency(customer.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = '/admin/revenue/transactions'}>
              View All →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction._id} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-xs">{transaction.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getTypeColor(transaction.type))}>
                          {transaction.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-bold text-sm",
                          transaction.amount >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
