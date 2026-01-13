"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye, TrendingUp, Search, Copy, Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AdminInvoicesPage() {
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
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    invoiceNo: true,
    date: true,
    user: true,
    description: true,
    credits: true,
    type: true,
    status: true,
    stripeId: false,
    subscriptionId: false,
    amount: true,
  });
  
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const invoices = useQuery(
    api.invoices.queries.getCompanyInvoices,
    companyId ? { companyId, limit: 100 } : "skip"
  );

  const stats = useQuery(
    api.invoices.queries.getInvoiceStats,
    companyId ? { companyId } : "skip"
  );
  
  // Filter invoices based on search and date
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.billingDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const invoiceDate = new Date(invoice.createdAt);
      const matchesStartDate = !startDate || invoiceDate >= new Date(startDate);
      const matchesEndDate = !endDate || invoiceDate <= new Date(endDate + "T23:59:59");
      
      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [invoices, searchTerm, startDate, endDate]);
  
  // Paginate filtered invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage]);
  
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  
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
  
  const getDescription = (invoice: any) => {
    if (invoice.invoiceType === "subscription") {
      const plan = invoice.transaction?.plan || invoice.items?.[0]?.description?.split(" - ")?.[0] || "Subscription";
      return plan;
    } else if (invoice.invoiceType === "payment") {
      const credits = invoice.transaction?.tokens || invoice.items?.[0]?.quantity || 0;
      return `${credits} Credits`;
    }
    return "-";
  };
  
  const getUserDisplay = (invoice: any) => {
    return invoice.userEmail || invoice.userName || invoice.billingDetails?.email || invoice.billingDetails?.name || "N/A";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      issued: { variant: "secondary", label: "Issued" },
      draft: { variant: "outline", label: "Draft" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      overdue: { variant: "destructive", label: "Overdue" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary"> = {
      subscription: "default",
      payment: "secondary",
    };
    return (
      <Badge variant={variants[type] || "outline"}>
        {type === "subscription" ? "Subscription" : "Payment"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all invoices for subscriptions and payments
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.subscription}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.payment}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.totalAmount / 100).toLocaleString()}
              </div>
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
            placeholder="Search by invoice #, email, or Stripe ID..."
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Complete list of all generated invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
              <TabsTrigger value="payment">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {!paginatedInvoices || paginatedInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                  <p className="text-sm mt-2">{searchTerm || startDate || endDate ? "Try adjusting your filters" : "Invoices will appear here after transactions are created"}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.invoiceNo && <TableHead>Invoice #</TableHead>}
                        {visibleColumns.date && <TableHead>Date</TableHead>}
                        {visibleColumns.user && <TableHead>User</TableHead>}
                        {visibleColumns.description && <TableHead>Description</TableHead>}
                        {visibleColumns.credits && <TableHead>Credits</TableHead>}
                        {visibleColumns.type && <TableHead>Type</TableHead>}
                        {visibleColumns.status && <TableHead>Status</TableHead>}
                        {visibleColumns.stripeId && <TableHead>Stripe ID</TableHead>}
                        {visibleColumns.subscriptionId && <TableHead>Subscription ID</TableHead>}
                        {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice._id}>
                          {visibleColumns.invoiceNo && (
                            <TableCell className="font-mono font-medium">
                              {invoice.invoiceNo}
                            </TableCell>
                          )}
                          {visibleColumns.date && (
                            <TableCell>
                              {formatDate(invoice.createdAt)}
                            </TableCell>
                          )}
                          {visibleColumns.user && (
                            <TableCell>
                              <div className="text-sm font-medium">{getUserDisplay(invoice)}</div>
                            </TableCell>
                          )}
                          {visibleColumns.description && (
                            <TableCell>
                              <div className="text-sm">{getDescription(invoice)}</div>
                            </TableCell>
                          )}
                          {visibleColumns.credits && (
                            <TableCell>
                              {invoice.invoiceType === "payment" ? (
                                <Badge variant="secondary">{invoice.transaction?.tokens || invoice.items?.[0]?.quantity || 0}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.type && (
                            <TableCell>
                              {invoice.invoiceType && getTypeBadge(invoice.invoiceType)}
                            </TableCell>
                          )}
                          {visibleColumns.status && (
                            <TableCell>
                              {getStatusBadge(invoice.status)}
                            </TableCell>
                          )}
                          {visibleColumns.stripeId && (
                            <TableCell>
                              {invoice.stripePaymentIntentId || invoice.transaction?.stripePaymentIntentId ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`https://dashboard.stripe.com/payments/${invoice.stripePaymentIntentId || invoice.transaction?.stripePaymentIntentId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-muted px-1 py-0.5 rounded hover:bg-muted/80 hover:underline"
                                  >
                                    {(invoice.stripePaymentIntentId || invoice.transaction?.stripePaymentIntentId)?.substring(0, 12)}...
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(invoice.stripePaymentIntentId || invoice.transaction?.stripePaymentIntentId!, invoice._id)}
                                  >
                                    {copiedId === invoice._id ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.subscriptionId && (
                            <TableCell>
                              {invoice.transaction?.stripeSubscriptionId ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`https://dashboard.stripe.com/subscriptions/${invoice.transaction.stripeSubscriptionId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-muted px-1 py-0.5 rounded hover:bg-muted/80 hover:underline"
                                  >
                                    {invoice.transaction.stripeSubscriptionId.substring(0, 12)}...
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => invoice.transaction?.stripeSubscriptionId && copyToClipboard(invoice.transaction.stripeSubscriptionId, invoice._id + "_sub")}
                                  >
                                    {copiedId === invoice._id + "_sub" ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.amount && (
                            <TableCell className="text-right font-medium">
                              {formatAmount(invoice.amount, invoice.currency)}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" title="View Invoice">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Download PDF">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination Controls */}
              {filteredInvoices.length > 0 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
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

            <TabsContent value="paid" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.invoiceNo && <TableHead>Invoice #</TableHead>}
                      {visibleColumns.date && <TableHead>Date</TableHead>}
                      {visibleColumns.user && <TableHead>User</TableHead>}
                      {visibleColumns.description && <TableHead>Description</TableHead>}
                      {visibleColumns.type && <TableHead>Type</TableHead>}
                      {visibleColumns.stripeId && <TableHead>Stripe ID</TableHead>}
                      {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.filter(inv => inv.status === "paid").map((invoice) => (
                      <TableRow key={invoice._id}>
                        {visibleColumns.invoiceNo && (
                          <TableCell className="font-mono font-medium">
                            {invoice.invoiceNo}
                          </TableCell>
                        )}
                        {visibleColumns.date && (
                          <TableCell>
                            {formatDate(invoice.createdAt)}
                          </TableCell>
                        )}
                        {visibleColumns.user && (
                          <TableCell>
                            <div className="text-sm font-medium">{getUserDisplay(invoice)}</div>
                          </TableCell>
                        )}
                        {visibleColumns.description && (
                          <TableCell>
                            <div className="text-sm">{getDescription(invoice)}</div>
                          </TableCell>
                        )}
                        {visibleColumns.type && (
                          <TableCell>
                            {invoice.invoiceType && getTypeBadge(invoice.invoiceType)}
                          </TableCell>
                        )}
                        {visibleColumns.stripeId && (
                          <TableCell>
                            {invoice.stripePaymentIntentId ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {invoice.stripePaymentIntentId.substring(0, 12)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(invoice.stripePaymentIntentId!, invoice._id)}
                                >
                                  {copiedId === invoice._id ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.amount && (
                          <TableCell className="text-right font-medium">
                            {formatAmount(invoice.amount, invoice.currency)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" title="View Invoice">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.invoiceNo && <TableHead>Invoice #</TableHead>}
                      {visibleColumns.date && <TableHead>Date</TableHead>}
                      {visibleColumns.user && <TableHead>User</TableHead>}
                      {visibleColumns.description && <TableHead>Plan</TableHead>}
                      {visibleColumns.status && <TableHead>Status</TableHead>}
                      {visibleColumns.stripeId && <TableHead>Stripe ID</TableHead>}
                      {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.filter(inv => inv.invoiceType === "subscription").map((invoice) => (
                      <TableRow key={invoice._id}>
                        {visibleColumns.invoiceNo && (
                          <TableCell className="font-mono font-medium">
                            {invoice.invoiceNo}
                          </TableCell>
                        )}
                        {visibleColumns.date && (
                          <TableCell>
                            {formatDate(invoice.createdAt)}
                          </TableCell>
                        )}
                        {visibleColumns.user && (
                          <TableCell>
                            <div className="text-sm font-medium">{getUserDisplay(invoice)}</div>
                          </TableCell>
                        )}
                        {visibleColumns.description && (
                          <TableCell>
                            <Badge variant="default">{getDescription(invoice)}</Badge>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                        )}
                        {visibleColumns.stripeId && (
                          <TableCell>
                            {invoice.stripePaymentIntentId ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {invoice.stripePaymentIntentId.substring(0, 12)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(invoice.stripePaymentIntentId!, invoice._id)}
                                >
                                  {copiedId === invoice._id ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.amount && (
                          <TableCell className="text-right font-medium">
                            {formatAmount(invoice.amount, invoice.currency)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" title="View Invoice">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
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
                      {visibleColumns.invoiceNo && <TableHead>Invoice #</TableHead>}
                      {visibleColumns.date && <TableHead>Date</TableHead>}
                      {visibleColumns.user && <TableHead>User</TableHead>}
                      {visibleColumns.credits && <TableHead>Credits Purchased</TableHead>}
                      {visibleColumns.status && <TableHead>Status</TableHead>}
                      {visibleColumns.stripeId && <TableHead>Stripe ID</TableHead>}
                      {visibleColumns.amount && <TableHead className="text-right">Amount</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.filter(inv => inv.invoiceType === "payment").map((invoice) => (
                      <TableRow key={invoice._id}>
                        {visibleColumns.invoiceNo && (
                          <TableCell className="font-mono font-medium">
                            {invoice.invoiceNo}
                          </TableCell>
                        )}
                        {visibleColumns.date && (
                          <TableCell>
                            {formatDate(invoice.createdAt)}
                          </TableCell>
                        )}
                        {visibleColumns.user && (
                          <TableCell>
                            <div className="text-sm font-medium">{getUserDisplay(invoice)}</div>
                          </TableCell>
                        )}
                        {visibleColumns.credits && (
                          <TableCell>
                            <Badge variant="secondary">{invoice.transaction?.tokens || invoice.items?.[0]?.quantity || 0} Credits</Badge>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                        )}
                        {visibleColumns.stripeId && (
                          <TableCell>
                            {invoice.stripePaymentIntentId ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {invoice.stripePaymentIntentId.substring(0, 12)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(invoice.stripePaymentIntentId!, invoice._id)}
                                >
                                  {copiedId === invoice._id ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.amount && (
                          <TableCell className="text-right font-medium">
                            {formatAmount(invoice.amount, invoice.currency)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" title="View Invoice">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
