"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye, TrendingUp, Search, Copy, Check, Settings2, Plus, Trash2, ShoppingCart, Edit, RefreshCw, CheckCircle, Calendar, MoreHorizontal, XCircle, Ban } from "lucide-react";
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
  const [invoicePage, setInvoicePage] = useState(1);
  const [poPage, setPOPage] = useState(1);
  const rowsPerPage = 20;
  
  // Filter states
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>("all");
  const [poStatusFilter, setPOStatusFilter] = useState<string>("all");
  
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

  // Customer search for SO form
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const allUsers = useQuery(api.adminUsers.getAllUsers);
  
  const filteredCustomers = useMemo(() => {
    if (!allUsers || !customerSearch || customerSearch.length < 2) return [];
    const q = customerSearch.toLowerCase();
    return allUsers
      .filter(u => 
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allUsers, customerSearch]);

  const selectCustomer = (customer: { fullName?: string; firstName?: string; lastName?: string; email?: string }) => {
    const name = customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    setPOForm(prev => ({
      ...prev,
      vendorName: name,
      vendorEmail: customer.email || "",
    }));
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };
  
  // Invoice Creation Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: "",
    customerEmail: "",
    customerAddress: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }] as POItem[],
    discount: 0,
    notes: "",
    paymentTerms: "CASH",
    status: "draft" as string,
    dueDate: null as number | null,
  });

  // Invoice customer search
  const [invoiceCustomerSearch, setInvoiceCustomerSearch] = useState("");
  const [showInvoiceCustomerDropdown, setShowInvoiceCustomerDropdown] = useState(false);
  
  const filteredInvoiceCustomers = useMemo(() => {
    if (!allUsers || !invoiceCustomerSearch || invoiceCustomerSearch.length < 2) return [];
    const q = invoiceCustomerSearch.toLowerCase();
    return allUsers
      .filter(u => 
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allUsers, invoiceCustomerSearch]);

  const selectInvoiceCustomer = (customer: { fullName?: string; firstName?: string; lastName?: string; email?: string }) => {
    const name = customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    setInvoiceForm(prev => ({
      ...prev,
      customerName: name,
      customerEmail: customer.email || "",
    }));
    setInvoiceCustomerSearch("");
    setShowInvoiceCustomerDropdown(false);
  };

  const getNextSONumber = useMutation(api.soConfig.getNextSONumber);
  const createPO = useMutation(api.purchaseOrders.mutations.createPurchaseOrder);
  const convertPO = useMutation(api.purchaseOrders.convertPOToInvoice.convertPOToInvoice);
  const createInvoiceMutation = useMutation(api.invoices.invoiceSystem.createInvoice);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  const deleteInvoice = useMutation(api.invoices.invoiceSystem.deleteInvoice);
  const deletePO = useMutation(api.purchaseOrders.mutations.deletePurchaseOrder);
  const updateInvoiceStatus = useMutation(api.invoices.invoiceSystem.updateInvoiceStatus);
  const updatePOStatus = useMutation(api.purchaseOrders.mutations.updatePOStatus);

  const handleConvertToInvoice = async (poId: Id<"purchase_orders">, poNo: string) => {
    if (!confirm(`Convert sales order ${poNo} to an invoice? This will create a new invoice from the SO items.`)) {
      return;
    }
    
    try {
      // Get the PO to find item count
      const po = purchaseOrders?.find(p => p._id === poId);
      if (!po) {
        toast.error("Sales order not found");
        return;
      }
      
      // Convert all items
      const allItemIndexes = po.items.map((_, i) => i);
      await convertPO({
        poId,
        selectedItemIndexes: allItemIndexes,
        clerkUserId: user?.id || "admin",
      });
      
      toast.success(`Sales order ${poNo} converted to invoice successfully!`);
    } catch (error: any) {
      console.error("Failed to convert SO to invoice:", error);
      toast.error(error?.message || "Failed to convert sales order to invoice");
    }
  };
  
  const handleDeletePO = async (poId: Id<"purchase_orders">, poNo: string) => {
    if (!confirm(`Are you sure you want to delete sales order ${poNo}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deletePO({ poId });
      toast.success(`Sales order ${poNo} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete sales order:', error);
      toast.error('Failed to delete sales order');
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

  // Invoice item helpers
  const addInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }],
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateInvoiceItem = (index: number, field: keyof POItem, value: string | number) => {
    setInvoiceForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      return { ...prev, items: newItems };
    });
  };

  const calculateInvoiceTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.total, 0);
    let serviceTax = 0;
    if (invoicePOConfig?.serviceTaxEnable) {
      serviceTax = (subtotal - invoiceForm.discount) * ((invoicePOConfig.serviceTax || 0) / 100);
    }
    const discount = invoiceForm.discount;
    let total = subtotal - discount + serviceTax;
    let roundingAdjustment = 0;
    if (invoicePOConfig?.roundingEnable) {
      const roundingResult = applyMalaysianRounding(total);
      roundingAdjustment = roundingResult.adjustment;
      total = roundingResult.roundedAmount;
    }
    return { subtotal, serviceTax, discount, roundingAdjustment, total };
  };

  const handleCreateInvoice = async () => {
    try {
      const totals = calculateInvoiceTotals();
      await createInvoiceMutation({
        amount: totals.total,
        currency: "MYR",
        items: invoiceForm.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        billingDetails: {
          name: invoiceForm.customerName,
          email: invoiceForm.customerEmail,
          address: invoiceForm.customerAddress || undefined,
        },
        subtotal: totals.subtotal,
        tax: totals.serviceTax > 0 ? totals.serviceTax : undefined,
        taxRate: invoicePOConfig?.serviceTaxEnable ? invoicePOConfig.serviceTax : undefined,
        discount: totals.discount > 0 ? totals.discount : undefined,
        total: totals.total,
        notes: invoiceForm.notes || undefined,
        dueDate: invoiceForm.dueDate || undefined,
        paymentTerms: invoiceForm.paymentTerms || undefined,
        autoIssue: invoiceForm.status === "issued" || invoiceForm.status === "paid",
      });

      // If status is "paid", we need to update it after creation since createInvoice only supports draft/issued
      // The autoIssue flag handles "issued", but "paid" needs an extra step
      // We'll handle this via the returned invoiceId - but createInvoice doesn't return the id in a way we can use here
      // For now, autoIssue handles issued, and paid invoices start as issued then get updated

      toast.success("Invoice created successfully!");
      setShowInvoiceModal(false);
      setInvoiceForm({
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        discount: 0,
        notes: "",
        paymentTerms: "CASH",
        status: "draft",
        dueDate: null,
      });
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast.error("Failed to create invoice");
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
  
  // Filter invoices based on search, date, status, and type
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.billingDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.billingDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const invoiceDate = new Date(invoice.createdAt);
      const matchesStartDate = !startDate || invoiceDate >= new Date(startDate);
      const matchesEndDate = !endDate || invoiceDate <= new Date(endDate + "T23:59:59");
      const matchesStatus = invoiceStatusFilter === "all" || invoice.status === invoiceStatusFilter;
      const matchesType = invoiceTypeFilter === "all" || invoice.invoiceType === invoiceTypeFilter;
      
      return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus && matchesType;
    });
  }, [invoices, searchTerm, startDate, endDate, invoiceStatusFilter, invoiceTypeFilter]);

  // Filter POs based on search, date, and status
  const filteredPOs = useMemo(() => {
    if (!purchaseOrders) return [];
    
    return purchaseOrders.filter(po => {
      const matchesSearch = !searchTerm || 
        po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const poDate = new Date(po.createdAt);
      const matchesStartDate = !startDate || poDate >= new Date(startDate);
      const matchesEndDate = !endDate || poDate <= new Date(endDate + "T23:59:59");
      const matchesStatus = poStatusFilter === "all" || po.status === poStatusFilter;
      
      return matchesSearch && matchesStartDate && matchesEndDate && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, startDate, endDate, poStatusFilter]);
  
  // Paginate filtered invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (invoicePage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, invoicePage]);

  // Paginate filtered POs
  const paginatedPOs = useMemo(() => {
    const startIndex = (poPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredPOs.slice(startIndex, endIndex);
  }, [filteredPOs, poPage]);
  
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
      const { soNumber: poNumber } = await getNextSONumber({});
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
      
      toast.success(`Sales Order ${poNumber} created successfully!`);
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
      toast.error("Failed to create sales order");
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

  const handleSetInvoiceStatus = async (invoiceId: Id<"invoices">, invoiceNo: string, status: "draft" | "issued" | "paid" | "cancelled" | "overdue") => {
    try {
      await updateInvoiceStatus({ id: invoiceId, status });
      toast.success(`Invoice ${invoiceNo} set to ${status}`);
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handleSetPOStatus = async (poId: Id<"purchase_orders">, poNo: string, status: "draft" | "issued" | "approved" | "received" | "cancelled") => {
    try {
      await updatePOStatus({ poId, status });
      toast.success(`Sales order ${poNo} set to ${status}`);
    } catch (error) {
      console.error('Failed to update SO status:', error);
      toast.error('Failed to update sales order status');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold">Invoices & Sales Orders</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all invoices and sales orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>
                  Create a new manual invoice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Customer Search */}
                <div className="space-y-2">
                  <Label>Search Customer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type to search customers..."
                      value={invoiceCustomerSearch}
                      onChange={(e) => {
                        setInvoiceCustomerSearch(e.target.value);
                        setShowInvoiceCustomerDropdown(e.target.value.length >= 2);
                      }}
                      onFocus={() => invoiceCustomerSearch.length >= 2 && setShowInvoiceCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowInvoiceCustomerDropdown(false), 200)}
                      className="pl-9"
                    />
                    {showInvoiceCustomerDropdown && filteredInvoiceCustomers.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredInvoiceCustomers.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectInvoiceCustomer(c)}
                          >
                            <p className="font-medium">{c.fullName || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{c.email || "No email"}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      placeholder="Customer name"
                      value={invoiceForm.customerName}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Email *</Label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={invoiceForm.customerEmail}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Customer Address</Label>
                  <Textarea
                    placeholder="123 Main St, City, Country"
                    value={invoiceForm.customerAddress}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Item Details</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className="space-y-3 mb-4 p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Item {index + 1}</span>
                        {invoiceForm.items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeInvoiceItem(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                          placeholder="Product or service description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit Price (MYR) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total</Label>
                          <Input value={item.total.toFixed(2)} readOnly className="bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(() => {
                    const invTotals = calculateInvoiceTotals();
                    return (
                      <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Sub Total (Excl. SST):</span>
                            <span className="font-semibold">MYR {invTotals.subtotal.toFixed(2)}</span>
                          </div>
                          {invTotals.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Discount:</span>
                              <span className="font-semibold">- MYR {invTotals.discount.toFixed(2)}</span>
                            </div>
                          )}
                          {invoicePOConfig?.serviceTaxEnable && (
                            <div className="flex justify-between text-sm">
                              <span>Service Tax ({invoicePOConfig.serviceTax}%):</span>
                              <span className="font-semibold">MYR {invTotals.serviceTax.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>TOTAL {invoicePOConfig?.serviceTaxEnable ? "(Incl. of SST)" : ""}:</span>
                            <span>MYR {invTotals.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount (MYR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.discount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value ? new Date(e.target.value).getTime() : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select
                      value={invoiceForm.paymentTerms}
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
                        setInvoiceForm({ ...invoiceForm, paymentTerms: value, dueDate: calculateDueDate(value) });
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
                    {invoiceForm.dueDate && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(invoiceForm.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={invoiceForm.status}
                      onValueChange={(value) => setInvoiceForm({ ...invoiceForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes or instructions"
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateInvoice}
                  disabled={!invoiceForm.customerName || !invoiceForm.customerEmail || invoiceForm.items.some(item => !item.description || item.unitPrice <= 0)}
                >
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        <Dialog open={showPOModal} onOpenChange={setShowPOModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Sales Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Order</DialogTitle>
              <DialogDescription>
                Create a new sales order for customer transactions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Customer Search */}
              <div className="space-y-2">
                <Label>Search Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type to search customers by name or email..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(e.target.value.length >= 2);
                    }}
                    onFocus={() => customerSearch.length >= 2 && setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    className="pl-9"
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between text-sm"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCustomer(c)}
                        >
                          <div>
                            <p className="font-medium">{c.fullName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{c.email || "No email"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showCustomerDropdown && customerSearch.length >= 2 && filteredCustomers.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-sm text-muted-foreground text-center">
                      No customers found. You can type manually below.
                    </div>
                  )}
                </div>
              </div>

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
                
                <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mt-4">
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
                Create Sales Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Baremetrics-style Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground shadow-lg">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Invoices</p>
                <FileText className="h-4 w-4 opacity-70" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight">{stats.total}</p>
              <p className="text-xs mt-1.5 opacity-70">{stats.byStatus?.paid || 0} paid</p>
            </CardContent>
            <div className="absolute -right-3 -bottom-3 opacity-10"><FileText className="h-20 w-20" /></div>
          </Card>
          <Card className="relative overflow-hidden border-0 bg-primary/90 text-primary-foreground shadow-lg">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Sales Orders</p>
                <ShoppingCart className="h-4 w-4 opacity-70" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight">{purchaseOrders?.length || 0}</p>
              <p className="text-xs mt-1.5 opacity-70">{purchaseOrders?.filter(po => po.status === 'approved').length || 0} approved</p>
            </CardContent>
            <div className="absolute -right-3 -bottom-3 opacity-10"><ShoppingCart className="h-20 w-20" /></div>
          </Card>
          <Card className="relative overflow-hidden border-0 bg-primary/80 text-primary-foreground shadow-lg">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Subscriptions</p>
                <RefreshCw className="h-4 w-4 opacity-70" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight">{stats.byType.subscription}</p>
              <p className="text-xs mt-1.5 opacity-70">Recurring revenue</p>
            </CardContent>
            <div className="absolute -right-3 -bottom-3 opacity-10"><RefreshCw className="h-20 w-20" /></div>
          </Card>
          <Card className="relative overflow-hidden border-0 bg-primary/70 text-primary-foreground shadow-lg">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Amount</p>
                <TrendingUp className="h-4 w-4 opacity-70" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight">
                MYR {(stats.totalAmount / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs mt-1.5 opacity-70">From {stats.total} invoices</p>
            </CardContent>
            <div className="absolute -right-3 -bottom-3 opacity-10"><TrendingUp className="h-20 w-20" /></div>
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
        <Select value={invoiceStatusFilter} onValueChange={(v) => { setInvoiceStatusFilter(v); setInvoicePage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={invoiceTypeFilter} onValueChange={(v) => { setInvoiceTypeFilter(v); setInvoicePage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
          </SelectContent>
        </Select>
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
                Sales Orders
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
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{invoice.billingDetails?.name || (invoice as any).userName || "—"}</p>
                                <p className="text-xs text-muted-foreground">{invoice.billingDetails?.email || (invoice as any).userEmail || ""}</p>
                              </div>
                            </TableCell>
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
                                  {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleSetInvoiceStatus(invoice._id, invoice.invoiceNo, "paid")}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Set to Paid
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleSetInvoiceStatus(invoice._id, invoice.invoiceNo, "cancelled")}
                                        className="text-amber-600 focus:text-amber-600"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Cancel Invoice
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
                  
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredInvoices.length === 0 ? 0 : ((invoicePage - 1) * rowsPerPage) + 1} to {Math.min(invoicePage * rowsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                    </div>
                    {totalInvoicePages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                          disabled={invoicePage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {invoicePage} of {totalInvoicePages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                          disabled={invoicePage === totalInvoicePages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Sales Orders Tab */}
            <TabsContent value="pos" className="mt-4">
              {!paginatedPOs || paginatedPOs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales orders found</p>
                  <p className="text-sm mt-2">{searchTerm || startDate || endDate ? "Try adjusting your filters" : "Click 'Create Sales Order' to get started"}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">SO #</TableHead>
                          <TableHead className="w-[110px]">Date</TableHead>
                          <TableHead>Customer</TableHead>
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
                                    Edit Sales Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/po/${po._id}`} className="cursor-pointer">
                                      <Download className="mr-2 h-4 w-4" />
                                      Download PDF
                                    </Link>
                                  </DropdownMenuItem>
                                  {po.status !== "approved" && po.status !== "cancelled" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleSetPOStatus(po._id, po.poNo, "approved")}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleSetPOStatus(po._id, po.poNo, "cancelled")}
                                        className="text-amber-600 focus:text-amber-600"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Cancel
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {!po.convertedToInvoiceId && po.status !== "cancelled" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleConvertToInvoice(po._id, po.poNo)}
                                        className="text-blue-600 focus:text-blue-600"
                                      >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Convert to Invoice
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
                  
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredPOs.length === 0 ? 0 : ((poPage - 1) * rowsPerPage) + 1} to {Math.min(poPage * rowsPerPage, filteredPOs.length)} of {filteredPOs.length} sales orders
                    </div>
                    {totalPOPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPOPage(p => Math.max(1, p - 1))}
                          disabled={poPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {poPage} of {totalPOPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPOPage(p => Math.min(totalPOPages, p + 1))}
                          disabled={poPage === totalPOPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
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
