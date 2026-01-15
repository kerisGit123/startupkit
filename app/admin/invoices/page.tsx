"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye, TrendingUp, Search, Copy, Check, Settings2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";

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
  
  // PO Creation Modal State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPOForm] = useState({
    vendorName: "",
    vendorEmail: "",
    vendorAddress: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    notes: "",
    paymentTerms: "",
  });
  
  const getNextPONumber = useMutation(api.poConfig.getNextPONumber);
  const createPO = useMutation(api.purchaseOrders.mutations.createPurchaseOrder);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  
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
  
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreatePO = async () => {
    try {
      // Get next PO number
      const { poNumber } = await getNextPONumber({});
      
      const subtotal = poForm.quantity * poForm.unitPrice;
      const total = subtotal;
      
      await createPO({
        poNo: poNumber,
        vendorName: poForm.vendorName,
        vendorEmail: poForm.vendorEmail || undefined,
        vendorAddress: poForm.vendorAddress || undefined,
        items: [{
          description: poForm.description,
          quantity: poForm.quantity,
          unitPrice: poForm.unitPrice,
          total: poForm.quantity * poForm.unitPrice,
        }],
        subtotal,
        total,
        notes: poForm.notes || undefined,
        paymentTerms: poForm.paymentTerms || undefined,
        currency: "MYR",
        companyId,
      });
      
      toast.success(`Purchase Order ${poNumber} created successfully!`);
      setShowPOModal(false);
      setPOForm({
        vendorName: "",
        vendorEmail: "",
        vendorAddress: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        notes: "",
        paymentTerms: "",
      });
    } catch (error) {
      console.error("Failed to create PO:", error);
      toast.error("Failed to create purchase order");
    }
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all invoices for subscriptions and payments
          </p>
        </div>
        <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order for vendor transactions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    placeholder="Acme Corporation"
                    value={poForm.vendorName}
                    onChange={(e) => setPOForm({ ...poForm, vendorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendorEmail">Vendor Email</Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    placeholder="vendor@example.com"
                    value={poForm.vendorEmail}
                    onChange={(e) => setPOForm({ ...poForm, vendorEmail: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vendorAddress">Vendor Address</Label>
                <Textarea
                  id="vendorAddress"
                  placeholder="123 Main St, City, Country"
                  value={poForm.vendorAddress}
                  onChange={(e) => setPOForm({ ...poForm, vendorAddress: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Item Details</h4>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="Product or service description"
                    value={poForm.description}
                    onChange={(e) => setPOForm({ ...poForm, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={poForm.quantity}
                      onChange={(e) => setPOForm({ ...poForm, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (MYR) *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={poForm.unitPrice}
                      onChange={(e) => setPOForm({ ...poForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-md mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">MYR {(poForm.quantity * poForm.unitPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-1">
                    <span>Total:</span>
                    <span>MYR {(poForm.quantity * poForm.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  placeholder="Net 30"
                  value={poForm.paymentTerms}
                  onChange={(e) => setPOForm({ ...poForm, paymentTerms: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or instructions"
                  value={poForm.notes}
                  onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPOModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePO}
                disabled={!poForm.vendorName || !poForm.description || poForm.unitPrice <= 0}
              >
                Create Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
