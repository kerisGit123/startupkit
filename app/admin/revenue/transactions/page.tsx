"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search,
  Filter,
  Download,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const allTransactions = useQuery(api.financialLedger.getAllLedgerEntries, {});

  const formatCurrency = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subscription_charge": return "bg-green-100 text-green-800 border-green-200";
      case "one_time_payment": return "bg-blue-100 text-blue-800 border-blue-200";
      case "credit_purchase": return "bg-purple-100 text-purple-800 border-purple-200";
      case "refund": return "bg-red-100 text-red-800 border-red-200";
      case "subscription_refund": return "bg-orange-100 text-orange-800 border-orange-200";
      case "chargeback": return "bg-red-200 text-red-900 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "stripe_subscription": return { label: "Stripe Subscription", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "stripe_payment": return { label: "Stripe Payment", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "manual": return { label: "Manual", color: "bg-gray-50 text-gray-700 border-gray-200" };
      case "referral_bonus": return { label: "Referral", color: "bg-green-50 text-green-700 border-green-200" };
      case "credit_adjustment": return { label: "Adjustment", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      default: return { label: source, color: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  // Filter transactions with date range support
  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];
    const now = new Date().getTime();

    return allTransactions.filter((transaction) => {
      const matchesSearch = searchQuery === "" || 
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.ledgerId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesSource = sourceFilter === "all" || transaction.revenueSource === sourceFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange === "custom") {
        const txDate = new Date(transaction.transactionDate);
        if (customStartDate && txDate < new Date(customStartDate)) matchesDate = false;
        if (customEndDate && txDate > new Date(customEndDate + "T23:59:59")) matchesDate = false;
      } else if (dateRange !== "all") {
        const ranges: Record<string, number> = {
          "1w": 7 * 86400000,
          "2w": 14 * 86400000,
          "1m": 30 * 86400000,
          "2m": 60 * 86400000,
        };
        const range = ranges[dateRange];
        if (range) matchesDate = (now - transaction.transactionDate) <= range;
      }

      return matchesSearch && matchesType && matchesSource && matchesDate;
    });
  }, [allTransactions, searchQuery, typeFilter, sourceFilter, dateRange, customStartDate, customEndDate]);

  // Calculate totals
  const totalRevenue = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalRefunds = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netRevenue = totalRevenue - totalRefunds;

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Ledger ID', 'Date', 'Description', 'Type', 'Source', 'Status', 'Amount', 'Notes'];
    const csvData = filteredTransactions.map(t => [
      t.ledgerId,
      new Date(t.transactionDate).toISOString(),
      t.description,
      t.type,
      t.revenueSource,
      t.isReconciled ? 'Reconciled' : 'Pending',
      t.amount.toString(),
      t.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!allTransactions) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-6 border rounded-lg">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-3 p-6 border rounded-lg">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push('/admin/revenue')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {allTransactions.length} total entries in the financial ledger
            </p>
          </div>
        </div>
        <Button size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Baremetrics-style Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Revenue</p>
              <TrendingUp className="h-4 w-4 text-emerald-200" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight">{formatCurrency(totalRevenue, 'MYR')}</p>
            <p className="text-emerald-200 text-xs mt-1.5">
              {filteredTransactions.filter(t => t.amount > 0).length} transactions
            </p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <TrendingUp className="h-20 w-20" />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-100 text-xs font-semibold uppercase tracking-wider">Refunds</p>
              <TrendingDown className="h-4 w-4 text-red-200" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight">{formatCurrency(totalRefunds, 'MYR')}</p>
            <p className="text-red-200 text-xs mt-1.5">
              {filteredTransactions.filter(t => t.amount < 0).length} refunds
            </p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <TrendingDown className="h-20 w-20" />
          </div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-violet-100 text-xs font-semibold uppercase tracking-wider">Net Revenue</p>
              <BarChart3 className="h-4 w-4 text-violet-200" />
            </div>
            <p className="text-2xl font-extrabold tracking-tight">{formatCurrency(netRevenue, 'MYR')}</p>
            <p className="text-violet-200 text-xs mt-1.5">
              {filteredTransactions.length} total entries
            </p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <BarChart3 className="h-20 w-20" />
          </div>
        </Card>
      </div>

      {/* Inline Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-5 pb-4 space-y-3">
          {/* Date Range Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground mr-1">Period:</span>
            {[
              { value: "all", label: "All Time" },
              { value: "1w", label: "1 Week" },
              { value: "2w", label: "2 Weeks" },
              { value: "1m", label: "1 Month" },
              { value: "2m", label: "2 Months" },
              { value: "custom", label: "Custom" },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={dateRange === opt.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setDateRange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            {dateRange === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-7 text-xs w-36"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-7 text-xs w-36"
                />
              </div>
            )}
          </div>

          {/* Search + Type/Source Filters */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription_charge">Subscription Charge</SelectItem>
                <SelectItem value="one_time_payment">One-Time Payment</SelectItem>
                <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="subscription_refund">Subscription Refund</SelectItem>
                <SelectItem value="chargeback">Chargeback</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="stripe_subscription">Stripe Subscription</SelectItem>
                <SelectItem value="stripe_payment">Stripe Payment</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="referral_bonus">Referral</SelectItem>
                <SelectItem value="credit_adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || typeFilter !== "all" || sourceFilter !== "all" || dateRange !== "all") && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredTransactions.length} results
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setSourceFilter("all");
                  setDateRange("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transaction History</CardTitle>
            <span className="text-xs text-muted-foreground">
              {filteredTransactions.length} of {allTransactions.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Ledger ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Source</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={Filter}
                        title="No transactions found"
                        description="Try adjusting your search filters or date range to find transactions."
                        action={{
                          label: "Clear Filters",
                          onClick: () => {
                            setSearchQuery("");
                            setTypeFilter("all");
                            setSourceFilter("all");
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const sourceBadge = getSourceBadge(transaction.revenueSource);
                    return (
                      <TableRow key={transaction._id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">
                          {transaction.ledgerId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(transaction.transactionDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium truncate">{transaction.description}</p>
                            {transaction.notes && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(transaction.type)}>
                            {transaction.type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sourceBadge.color}>
                            {sourceBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.isReconciled ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Reconciled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Recorded
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-bold text-sm",
                            transaction.amount >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
