"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye, TrendingUp, Search, Copy, Check, Settings2, Plus, Trash2, ShoppingCart, Edit, RefreshCw, CheckCircle, Calendar, MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { applyMalaysianRounding } from "@/lib/malaysianRounding";
import { POEditDialog } from "@/components/POEditDialog";
import { InvoiceEditDialog } from "@/components/InvoiceEditDialog";

interface POItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function InvoicesAndPOsPage() {
  const { user } = useUser();
  const companyId = (user?.publicMetadata?.companyId as string) || user?.id;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  
  // PO Creation Modal State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPOForm] = useState({
    vendorName: "",
    vendorEmail: "",
    vendorAddress: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] as POItem[],
    discount: 0,
    notes: "",
    paymentTerms: "CASH",
    dueDate: null as number | null,
  });
  
  const getNextPONumber = useMutation(api.poConfig.getNextPONumber);
  const createPO = useMutation(api.purchaseOrders.mutations.createPurchaseOrder);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  const deleteInvoice = useMutation(api.invoices.invoiceSystem.deleteInvoice);
  const deletePO = useMutation(api.purchaseOrders.mutations.deletePurchaseOrder);
  
  const handleDeletePO = async (poId: Id<"purchase_orders">, poNo: string) => {
    if (!confirm(`Are you sure you want to delete purchase order ${poNo}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deletePO({ poId });
      toast.success(`Purchase order ${poNo} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete purchase order:', error);
      toast.error('Failed to delete purchase order');
    }
  };
  
  const handleDeleteInvoice = async (invoiceId: Id<"invoices">, invoiceNo: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNo}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteInvoice({ id: invoiceId });
      toast.success(`Invoice ${invoiceNo} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };
  
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

  const purchaseOrders = useQuery(
    api.purchaseOrders.queries.getAllPurchaseOrders,
    { limit: 100 }
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

  // Filter POs based on search and date
  const filteredPOs = useMemo(() => {
    if (!purchaseOrders) return [];
    
    return purchaseOrders.filter(po => {
      const matchesSearch = !searchTerm || 
        po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const poDate = new Date(po.createdAt);
      const matchesStartDate = !startDate || poDate >= new Date(startDate);
      const matchesEndDate = !endDate || poDate <= new Date(endDate + "T23:59:59");
      
      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [purchaseOrders, searchTerm, startDate, endDate]);
  
  // Paginate filtered invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage]);

  // Paginate filtered POs
  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPOs.slice(startIndex, endIndex);
  }, [filteredPOs, currentPage]);
  
  const totalInvoicePages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const totalPOPages = Math.ceil(filteredPOs.length / rowsPerPage);

  const addPOItem = () => {
    setPOForm({
      ...poForm,
      items: [...poForm.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removePOItem = (index: number) => {
    if (poForm.items.length > 1) {
      setPOForm({
        ...poForm,
        items: poForm.items.filter((_, i) => i !== index)
      });
    }
  };

  const updatePOItem = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...poForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setPOForm({ ...poForm, items: newItems });
  };

  const calculatePOTotals = () => {
    const subtotal = poForm.items.reduce((sum, item) => sum + item.total, 0);
    let serviceTax = 0;
    const discount = poForm.discount || 0;
    let total = subtotal - discount;

    if (invoicePOConfig?.serviceTaxEnable && invoicePOConfig?.serviceTax) {
      serviceTax = (subtotal - discount) * (invoicePOConfig.serviceTax / 100);
      total = subtotal - discount + serviceTax;
    }

    // Apply Malaysian rounding standard if enabled
    let roundingAdjustment = 0;
    if (invoicePOConfig?.roundingEnable) {
      const roundingResult = applyMalaysianRounding(total);
      roundingAdjustment = roundingResult.adjustment;
      total = roundingResult.roundedAmount;
    }

    return { subtotal, serviceTax, discount, roundingAdjustment, total };
  };

  const handleCreatePO = async () => {
    try {
      const { poNumber } = await getNextPONumber({});
      const totals = calculatePOTotals();
      
      await createPO({
        poNo: poNumber,
        vendorName: poForm.vendorName,
        vendorEmail: poForm.vendorEmail || undefined,
        vendorAddress: poForm.vendorAddress || undefined,
        items: poForm.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100),
          total: Math.round(item.total * 100),
        })),
        subtotal: Math.round(totals.subtotal * 100),
        tax: Math.round(totals.serviceTax * 100),
        taxRate: invoicePOConfig?.serviceTax,
        discount: Math.round(totals.discount * 100),
        total: Math.round(totals.total * 100),
        notes: poForm.notes || undefined,
        paymentTerms: poForm.paymentTerms || undefined,
        dueDate: poForm.dueDate || undefined,
        currency: "MYR",
        companyId,
      });
      
      toast.success(`Purchase Order ${poNumber} created successfully!`);
      setShowPOModal(false);
      setPOForm({
        vendorName: "",
        vendorEmail: "",
        vendorAddress: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        discount: 0,
        notes: "",
        paymentTerms: "CASH",
        dueDate: null,
      });
    } catch (error) {
      console.error("Failed to create PO:", error);
      toast.error("Failed to create purchase order");
    }
  };

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
      approved: { variant: "default", label: "Approved" },
      received: { variant: "default", label: "Received" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      subscription: "default",
      payment: "secondary",
      invoice: "outline",
    };
    
    const labels: Record<string, string> = {
      subscription: "Subscription",
      payment: "Payment",
      invoice: "Invoice",
    };
    
    return (
      <Badge variant={variants[type] || "outline"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const totals = calculatePOTotals();

  const [editingPOId, setEditingPOId] = useState<Id<"purchase_orders"> | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<Id<"invoices"> | null>(null);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold">Invoices & Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all invoices and purchase orders
          </p>
        </div>
        <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order for customer transactions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Customer Name *</Label>
                  <Input
                    id="vendorName"
                    placeholder="Acme Corporation"
                    value={poForm.vendorName}
                    onChange={(e) => setPOForm({ ...poForm, vendorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendorEmail">Customer Email</Label>
                  <Input
                    id="vendorEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={poForm.vendorEmail}
                    onChange={(e) => setPOForm({ ...poForm, vendorEmail: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vendorAddress">Customer Address</Label>
                <Textarea
                  id="vendorAddress"
                  placeholder="123 Main St, City, Country"
                  value={poForm.vendorAddress}
                  onChange={(e) => setPOForm({ ...poForm, vendorAddress: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Item Details</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addPOItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                
                {poForm.items.map((item, index) => (
                  <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {poForm.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePOItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Input
                        placeholder="Product or service description"
                        value={item.description}
                        onChange={(e) => updatePOItem(index, 'description', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePOItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price (MYR) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updatePOItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <Input
                          value={item.total.toFixed(2)}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sub Total (Excl. SST):</span>
                      <span className="font-semibold">MYR {totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span className="font-semibold">- MYR {totals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {invoicePOConfig?.serviceTaxEnable && (
                      <div className="flex justify-between text-sm">
                        <span>Service Tax ({invoicePOConfig.serviceTax}%):</span>
                        <span className="font-semibold">MYR {totals.serviceTax.toFixed(2)}</span>
                      </div>
                    )}
                    {invoicePOConfig?.roundingEnable && Math.abs(totals.roundingAdjustment) > 0.001 && (
                      <div className="flex justify-between text-sm">
                        <span>Rounding Adj.:</span>
                        <span className="font-semibold">MYR {totals.roundingAdjustment.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>TOTAL {invoicePOConfig?.serviceTaxEnable ? "(Incl. of SST)" : ""}:</span>
                      <span>MYR {totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (MYR)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={poForm.discount}
                    onChange={(e) => setPOForm({ ...poForm, discount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select 
                    value={poForm.paymentTerms} 
                    onValueChange={(value) => {
                      const calculateDueDate = (terms: string) => {
                        const date = new Date();
                        switch (terms) {
                          case "CASH":
                          case "COD":
                            return Date.now();
                          case "7 DAYS":
                            date.setDate(date.getDate() + 7);
                            return date.getTime();
                          case "2 WEEKS":
                            date.setDate(date.getDate() + 14);
                            return date.getTime();
                          case "1 MONTH":
                            date.setMonth(date.getMonth() + 1);
                            return date.getTime();
                          default:
                            return Date.now();
                        }
                      };
                      setPOForm({ ...poForm, paymentTerms: value, dueDate: calculateDueDate(value) });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">CASH</SelectItem>
                      <SelectItem value="COD">COD (Cash on Delivery)</SelectItem>
                      <SelectItem value="7 DAYS">7 DAYS</SelectItem>
                      <SelectItem value="2 WEEKS">2 WEEKS</SelectItem>
                      <SelectItem value="1 MONTH">1 MONTH</SelectItem>
                    </SelectContent>
                  </Select>
                  {poForm.dueDate && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {(() => {
                        const date = new Date(poForm.dueDate);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()}
                    </p>
                  )}
                </div>
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
                disabled={!poForm.vendorName || poForm.items.some(item => !item.description || item.unitPrice <= 0)}
              >
                Create Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.byStatus?.paid || 0} paid
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {purchaseOrders?.filter(po => po.status === 'approved').length || 0} approved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byType.subscription}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Recurring revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                MYR {(stats.totalAmount / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {stats.total} invoices
              </p>
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
            placeholder="Search by number, email, customer name..."
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
      </div>

      {/* Tabs for Invoices and POs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="invoices" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoices">
                <FileText className="h-4 w-4 mr-2" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="pos">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase Orders
              </TabsTrigger>
            </TabsList>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-4">
              {!paginatedInvoices || paginatedInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                  <p className="text-sm mt-2">{searchTerm || startDate || endDate ? "Try adjusting your filters" : "Invoices will appear here after transactions are created"}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Invoice #</TableHead>
                          <TableHead className="w-[110px]">Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="w-[120px]">Type</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="text-right w-[120px]">Amount</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedInvoices.map((invoice) => (
                          <TableRow key={invoice._id}>
                            <TableCell className="font-mono font-medium">{invoice.invoiceNo}</TableCell>
                            <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                            <TableCell>{invoice.billingDetails?.email || "N/A"}</TableCell>
                            <TableCell>{getTypeBadge(invoice.invoiceType)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {invoice.currency} {(invoice.total / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/invoice/${invoice._id}`} className="cursor-pointer">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingInvoiceId(invoice._id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/invoice/${invoice._id}`} className="cursor-pointer">
                                      <Download className="mr-2 h-4 w-4" />
                                      Download PDF
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteInvoice(invoice._id, invoice.invoiceNo)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredInvoices.length > rowsPerPage && (
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
                        <span className="text-sm">
                          Page {currentPage} of {totalInvoicePages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalInvoicePages, p + 1))}
                          disabled={currentPage === totalInvoicePages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Purchase Orders Tab */}
            <TabsContent value="pos" className="mt-4">
              {!paginatedPOs || paginatedPOs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No purchase orders found</p>
                  <p className="text-sm mt-2">{searchTerm || startDate || endDate ? "Try adjusting your filters" : "Click 'Create Purchase Order' to get started"}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">PO #</TableHead>
                          <TableHead className="w-[110px]">Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead className="w-[180px]">Status</TableHead>
                          <TableHead className="text-right w-[120px]">Amount</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPOs.map((po) => (
                          <TableRow key={po._id}>
                            <TableCell className="font-mono font-medium">{po.poNo}</TableCell>
                            <TableCell>{formatDate(po.createdAt)}</TableCell>
                            <TableCell>{po.vendorName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(po.status)}
                                {po.convertedToInvoiceId && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3" />
                                    Converted
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {po.currency} {(po.total / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/po/${po._id}`} className="cursor-pointer">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingPOId(po._id)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit PO
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/po/${po._id}`} className="cursor-pointer">
                                      <Download className="mr-2 h-4 w-4" />
                                      Download PDF
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeletePO(po._id, po.poNo)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredPOs.length > rowsPerPage && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredPOs.length)} of {filteredPOs.length} purchase orders
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
                        <span className="text-sm">
                          Page {currentPage} of {totalPOPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPOPages, p + 1))}
                          disabled={currentPage === totalPOPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* PO Edit Dialog */}
      <POEditDialog
        poId={editingPOId}
        isOpen={!!editingPOId}
        onClose={() => setEditingPOId(null)}
        onSuccess={() => {
          // Refresh will happen automatically via Convex reactivity
          setEditingPOId(null);
        }}
      />
      
      {/* Invoice Edit Dialog */}
      <InvoiceEditDialog
        invoiceId={editingInvoiceId}
        isOpen={!!editingInvoiceId}
        onClose={() => setEditingInvoiceId(null)}
        onSuccess={() => {
          // Refresh will happen automatically via Convex reactivity
          setEditingInvoiceId(null);
        }}
      />
    </div>
  );
}
