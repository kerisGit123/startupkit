"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { 
  Search,
  Filter,
  Download,
  ArrowLeft,
  Calendar,
  DollarSign
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
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const allTransactions = useQuery(api.financialLedger.getAllLedgerEntries, {});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  // Filter transactions
  const filteredTransactions = allTransactions?.filter((transaction) => {
    const matchesSearch = searchQuery === "" || 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.ledgerId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesSource = sourceFilter === "all" || transaction.revenueSource === sourceFilter;

    return matchesSearch && matchesType && matchesSource;
  }) || [];

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
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.location.href = '/admin/revenue'}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">All Transactions</h1>
            <p className="text-muted-foreground mt-1">
              Complete financial ledger with {allTransactions.length} transactions
            </p>
          </div>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredTransactions.filter(t => t.amount > 0).length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalRefunds)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredTransactions.filter(t => t.amount < 0).length} refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {filteredTransactions.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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

          {(searchQuery || typeFilter !== "all" || sourceFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">
                {filteredTransactions.length} results
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setSourceFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {allTransactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ledger ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                      <TableRow key={transaction._id} className="hover:bg-muted/50">
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
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-bold text-lg",
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
