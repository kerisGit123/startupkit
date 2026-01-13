"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CreditCard, Repeat, TrendingUp, Search, Copy, Check, Settings2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TransactionsPage() {
  const { user } = useUser();
  const companyId = (user?.publicMetadata?.companyId as string) || user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  const prevFiltersRef = useMemo(() => ({ searchTerm, startDate, endDate }), [searchTerm, startDate, endDate]);

  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    type: true,
    transactionType: true,
    user: true,
    description: true,
    stripeCustomerId: false,
    stripePaymentIntentId: false,
    stripeSubscriptionId: false,
    invoice: true,
    amount: true,
    credits: true,
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const transactions = useQuery(
    api.transactions.queries.getCompanyTransactions,
    companyId ? { companyId, limit: 1000 } : "skip"
  );

  const stats = useQuery(
    api.transactions.queries.getTransactionStats,
    companyId ? { companyId } : "skip"
  );

  const subscriptionHistory = useQuery(
    api.subscriptions.getSubscriptionHistory,
    companyId ? { companyId } : "skip"
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(tx => {
      const matchesSearch = !searchTerm || 
        tx.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.stripeCustomerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.stripeSubscriptionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const txDate = new Date(tx.createdAt);
      const matchesStartDate = !startDate || txDate >= new Date(startDate);
      const matchesEndDate = !endDate || txDate <= new Date(endDate + "T23:59:59");
      
      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [transactions, searchTerm, startDate, endDate]);

  // Paginate filtered transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);
  
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  
  // Reset to page 1 when filters change
  if (prevFiltersRef.searchTerm !== searchTerm || prevFiltersRef.startDate !== startDate || prevFiltersRef.endDate !== endDate) {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserDisplay = (tx: any) => {
    return tx.userEmail || tx.userName || tx.companyId?.substring(0, 20) || "N/A";
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return <Repeat className="h-4 w-4" />;
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "credit":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      subscription: "default",
      payment: "secondary",
      credit: "outline",
    };
    return (
      <Badge variant={variants[type] || "outline"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground mt-2">
          View all transactions including subscriptions, payments, and credits
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.subscription}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.payment}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by invoice #, Stripe ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          placeholder="Start date"
          className="w-40"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          placeholder="End date"
          className="w-40"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Columns
          </Button>
          {showColumnSettings && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border p-4 z-50">
              <h3 className="font-semibold mb-3 text-sm">Show/Hide Columns</h3>
              <div className="space-y-2">
                {Object.entries(visibleColumns).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Complete history of all financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
              <TabsTrigger value="payment">Payments</TabsTrigger>
              <TabsTrigger value="credit">Credits</TabsTrigger>
              <TabsTrigger value="subscription_history">Subscription History</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {!paginatedTransactions || paginatedTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.date && <TableHead>Date</TableHead>}
                        {visibleColumns.type && <TableHead>Type</TableHead>}
                        {visibleColumns.transactionType && <TableHead>Transaction Type</TableHead>}
                        {visibleColumns.user && <TableHead>User/Company</TableHead>}
                        {visibleColumns.description && <TableHead>Description</TableHead>}
                        {visibleColumns.stripeCustomerId && <TableHead>Stripe Customer</TableHead>}
                        {visibleColumns.stripePaymentIntentId && <TableHead>Payment Intent</TableHead>}
                        {visibleColumns.stripeSubscriptionId && <TableHead>Subscription ID</TableHead>}
                        {visibleColumns.invoice && <TableHead>Invoice</TableHead>}
                        {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                        {visibleColumns.credits && <TableHead className="text-right">Credits</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((tx) => (
                        <TableRow key={tx._id}>
                          {visibleColumns.date && (
                            <TableCell className="font-medium">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                          )}
                          {visibleColumns.type && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(tx.type)}
                                {getTypeBadge(tx.type)}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.transactionType && (
                            <TableCell>
                              <Badge variant="outline">{tx.transactionType}</Badge>
                            </TableCell>
                          )}
                          {visibleColumns.user && (
                            <TableCell>
                              <div className="text-sm">{getUserDisplay(tx)}</div>
                            </TableCell>
                          )}
                          {visibleColumns.description && (
                            <TableCell>
                              {tx.type === "subscription" && tx.plan && (
                                <span>{tx.plan.charAt(0).toUpperCase() + tx.plan.slice(1)} - {tx.action}</span>
                              )}
                              {tx.type === "payment" && tx.tokens && (
                                <span>{tx.tokens} Credits Purchase</span>
                              )}
                              {tx.type === "credit" && (
                                <span>Manual Credit Adjustment</span>
                              )}
                              {tx.type === "referral" && (
                                <span>Referral Reward</span>
                              )}
                              {tx.type === "bonus" && (
                                <span>Bonus Credits</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.stripeCustomerId && (
                            <TableCell>
                              {tx.stripeCustomerId ? (
                                <div className="flex items-center gap-1">
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {tx.stripeCustomerId.substring(0, 12)}...
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(tx.stripeCustomerId!, tx._id + "_cus")}
                                  >
                                    {copiedId === tx._id + "_cus" ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.stripePaymentIntentId && (
                            <TableCell>
                              {tx.stripePaymentIntentId ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`https://dashboard.stripe.com/payments/${tx.stripePaymentIntentId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-muted px-1 py-0.5 rounded hover:bg-muted/80 hover:underline"
                                  >
                                    {tx.stripePaymentIntentId.substring(0, 12)}...
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(tx.stripePaymentIntentId!, tx._id + "_pi")}
                                  >
                                    {copiedId === tx._id + "_pi" ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.stripeSubscriptionId && (
                            <TableCell>
                              {tx.stripeSubscriptionId ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`https://dashboard.stripe.com/subscriptions/${tx.stripeSubscriptionId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-muted px-1 py-0.5 rounded hover:bg-muted/80 hover:underline"
                                  >
                                    {tx.stripeSubscriptionId.substring(0, 12)}...
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(tx.stripeSubscriptionId!, tx._id + "_sub")}
                                  >
                                    {copiedId === tx._id + "_sub" ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.invoice && (
                            <TableCell>
                              {tx.invoiceNo ? (
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {tx.invoiceNo}
                                </code>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.amount && (
                            <TableCell className="text-right font-medium">
                              {formatAmount(tx.amount, tx.currency)}
                            </TableCell>
                          )}
                          {visibleColumns.credits && (
                            <TableCell className="text-right">
                              {tx.tokens ? (
                                <span className="text-green-600 font-medium">
                                  +{tx.tokens.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredTransactions.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="subscription" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.filter(tx => tx.type === "subscription").map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {tx.plan?.charAt(0).toUpperCase()}{tx.plan?.slice(1)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {tx.invoiceNo}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(tx.amount, tx.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.filter(tx => tx.type === "payment").map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {tx.tokens} Credits Purchase
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {tx.invoiceNo}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(tx.amount, tx.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600 font-medium">
                            +{tx.tokens?.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="credit" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.filter(tx => tx.type === "credit").map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {tx.reason || "Manual adjustment"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600 font-medium">
                            +{tx.tokens?.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="subscription_history" className="mt-4">
              {!subscriptionHistory || subscriptionHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No subscription history found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Current Period End</TableHead>
                        <TableHead>Stripe Customer</TableHead>
                        <TableHead>Stripe Subscription</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionHistory.map((event) => (
                        <TableRow key={event._id}>
                          <TableCell className="font-medium">
                            {formatDate(event.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={event.action === "cancel" || event.action === "cancelled" ? "destructive" : "outline"}
                            >
                              {event.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {event.userEmail || event.userName || event.companyId?.substring(0, 20) || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {event.plan ? (
                              <span className="font-medium">
                                {event.plan.charAt(0).toUpperCase() + event.plan.slice(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.status ? (
                              <Badge variant={event.status === "active" ? "default" : "secondary"}>
                                {event.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.currentPeriodEnd ? (
                              <span className="text-sm">
                                {new Date(event.currentPeriodEnd).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.stripeCustomerId ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`https://dashboard.stripe.com/customers/${event.stripeCustomerId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-muted px-1 py-0.5 rounded hover:bg-muted/80 hover:underline"
                                >
                                  {event.stripeCustomerId.substring(0, 12)}...
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(event.stripeCustomerId!, event._id + "_cus")}
                                >
                                  {copiedId === event._id + "_cus" ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.stripeSubscriptionId ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`https://dashboard.stripe.com/subscriptions/${event.stripeSubscriptionId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-muted px-1 py-0.5 rounded hover:bg-muted/80 hover:underline"
                                >
                                  {event.stripeSubscriptionId.substring(0, 12)}...
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(event.stripeSubscriptionId!, event._id + "_sub")}
                                >
                                  {copiedId === event._id + "_sub" ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
