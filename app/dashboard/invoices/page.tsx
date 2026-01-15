"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Loader2,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type InvoiceType = "all" | "subscription" | "payment";
type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled" | "overdue" | undefined;

export default function InvoicesPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("all");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>(undefined);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<Id<"invoices"> | null>(null);

  const invoices = useQuery(
    api.invoices.userQueries.getUserInvoicesWithFilters,
    user?.id ? {
      companyId: user.id,
      invoiceType: invoiceType,
      status: statusFilter,
      searchQuery: searchQuery || undefined,
      limit: 100,
    } : "skip"
  );

  const stats = useQuery(
    api.invoices.userQueries.getUserInvoiceStats,
    user?.id ? { companyId: user.id } : "skip"
  );

  const selectedInvoice = useQuery(
    api.invoices.userQueries.getUserInvoiceDetail,
    selectedInvoiceId && user?.id ? {
      invoiceId: selectedInvoiceId,
      companyId: user.id,
    } : "skip"
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      paid: { variant: "default", label: "Paid" },
      issued: { variant: "secondary", label: "Issued" },
      overdue: { variant: "destructive", label: "Overdue" },
      cancelled: { variant: "outline", label: "Cancelled" },
      draft: { variant: "outline", label: "Draft" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === "subscription" ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <CreditCard className="w-3 h-3 mr-1" />
        Subscription
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <Receipt className="w-3 h-3 mr-1" />
        Payment
      </Badge>
    );
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          </div>
          <p className="text-gray-600">
            View and manage your invoices, subscriptions, and payments.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(stats.totalPending)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by invoice number, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={invoiceType} onValueChange={(value) => setInvoiceType(value as InvoiceType)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value as InvoiceStatus)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              {invoices ? `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} found` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!invoices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No invoices found</p>
                <p className="text-sm text-gray-500">
                  {searchQuery || invoiceType !== "all" || statusFilter
                    ? "Try adjusting your filters"
                    : "Your invoices will appear here once you make a purchase"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {invoice.invoiceNo}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(invoice.issuedAt || invoice.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          {getTypeBadge(invoice.invoiceType)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 truncate">
                              {invoice.items[0]?.description || "N/A"}
                            </p>
                            {invoice.items.length > 1 && (
                              <p className="text-xs text-gray-500">
                                +{invoice.items.length - 1} more item{invoice.items.length - 1 !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoiceId(invoice._id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement download
                                alert("Download functionality coming soon!");
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Detail Modal */}
        <Dialog open={!!selectedInvoiceId} onOpenChange={() => setSelectedInvoiceId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                {selectedInvoice && `Invoice ${selectedInvoice.invoiceNo}`}
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedInvoice.invoiceNo}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Issued: {formatDate(selectedInvoice.issuedAt || selectedInvoice.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedInvoice.status)}
                    <div className="mt-2">
                      {getTypeBadge(selectedInvoice.invoiceType)}
                    </div>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Billing Information</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selectedInvoice.billingDetails.name}</p>
                    <p>{selectedInvoice.billingDetails.email}</p>
                    {selectedInvoice.billingDetails.address && (
                      <>
                        <p className="mt-2">{selectedInvoice.billingDetails.address}</p>
                        <p>
                          {[
                            selectedInvoice.billingDetails.city,
                            selectedInvoice.billingDetails.state,
                            selectedInvoice.billingDetails.postalCode,
                          ].filter(Boolean).join(", ")}
                        </p>
                        {selectedInvoice.billingDetails.country && (
                          <p>{selectedInvoice.billingDetails.country}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-semibold text-gray-700">Description</th>
                        <th className="text-center py-2 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-700">Unit Price</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="py-3 text-sm text-gray-600 text-right">
                            {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                          </td>
                          <td className="py-3 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(item.total, selectedInvoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                      </span>
                    </div>
                    {selectedInvoice.tax && selectedInvoice.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Tax {selectedInvoice.taxRate ? `(${selectedInvoice.taxRate}%)` : ''}:
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}
                        </span>
                      </div>
                    )}
                    {selectedInvoice.discount && selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(selectedInvoice.discount, selectedInvoice.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedInvoiceId(null)}>
                    Close
                  </Button>
                  <Button onClick={() => alert("Download functionality coming soon!")}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
