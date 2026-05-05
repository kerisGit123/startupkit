"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save, RefreshCw, Coins } from "lucide-react";

interface InvoiceEditDialogProps {
  invoiceId: Id<"invoices"> | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function InvoiceEditDialog({ invoiceId, isOpen, onClose, onSuccess }: InvoiceEditDialogProps) {
  const invoice = useQuery(
    api.invoices.getInvoiceById.getInvoiceById,
    invoiceId ? { invoiceId } : "skip"
  );
  const updateInvoice = useMutation(api.invoices.invoiceSystem.updateInvoice);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const searchResults = useQuery(
    api.saasCustomers.queries.searchCustomers,
    customerSearchTerm.length >= 2 ? { searchTerm: customerSearchTerm } : "skip"
  );

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCompanyName, setCustomerCompanyName] = useState("");
  const [customerCompanyLicense, setCustomerCompanyLicense] = useState("");
  const [customerTinNumber, setCustomerTinNumber] = useState("");
  const [customerCountry, setCustomerCountry] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [planTier, setPlanTier] = useState("");
  const [creditsToGrant, setCreditsToGrant] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load billing profile for sync-from-profile
  const billingProfile = useQuery(
    api.adminUserManagement.getUserBillingProfile,
    invoice?.companyId ? { clerkUserId: invoice.companyId } : "skip"
  );

  // Load invoice data when dialog opens
  useEffect(() => {
    if (invoice && isOpen) {
      setCustomerName(invoice.billingDetails?.name || "");
      setCustomerEmail(invoice.billingDetails?.email || "");
      setCustomerAddress(invoice.billingDetails?.address || "");
      setCustomerPhone((invoice.billingDetails as any)?.phone || "");
      setCustomerCompanyName((invoice.billingDetails as any)?.companyName || "");
      setCustomerCompanyLicense((invoice.billingDetails as any)?.companyLicense || "");
      setCustomerTinNumber((invoice.billingDetails as any)?.tinNumber || "");
      setCustomerCountry(invoice.billingDetails?.country || "");
      setItems(
        invoice.items?.map((item) => ({
          ...item,
          unitPrice: item.unitPrice / 100,
          total: item.total / 100,
        })) || []
      );
      setDiscount((invoice.discount || 0) / 100);
      setTaxRate(invoice.taxRate || (invoicePOConfig?.serviceTax || 0));
      setNotes(invoice.notes || "");
      setPlanTier((invoice as any).planTier || "");
      setCreditsToGrant((invoice as any).creditsToGrant || 0);
      setCustomerSearchTerm("");
      setShowCustomerDropdown(false);
    }
  }, [invoice, isOpen, invoicePOConfig]);
  
  // Handle customer selection from search
  const handleSelectCustomer = (customer: any) => {
    setCustomerName(customer.customerName);
    setCustomerEmail(customer.customerEmail || "");
    setCustomerAddress(customer.customerAddress || "");
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

  // Sync billing details from the user's saved profile
  const handleSyncFromProfile = () => {
    if (!billingProfile) return;
    setCustomerCompanyName(billingProfile.companyName ?? "");
    setCustomerAddress(billingProfile.billingAddress ?? "");
    setCustomerCountry(billingProfile.country ?? "");
    setCustomerPhone(billingProfile.phone ?? "");
    setCustomerCompanyLicense(billingProfile.companyLicense ?? "");
    setCustomerTinNumber(billingProfile.tinNumber ?? "");
    if (billingProfile.fullName) setCustomerName(billingProfile.fullName);
    if (billingProfile.email) setCustomerEmail(billingProfile.email);
    toast.success("Billing details synced from profile");
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const serviceTaxEnabled = invoicePOConfig?.serviceTaxInvoiceEnable && invoice?.invoiceType === "invoice";
  const subtotalAfterDiscount = subtotal - discount;
  const serviceTax = serviceTaxEnabled ? subtotalAfterDiscount * (taxRate / 100) : 0;
  const total = subtotalAfterDiscount + serviceTax;

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateInvoice({
        id: invoiceId!,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100),
          total: Math.round(item.total * 100),
        })),
        billingDetails: {
          name: customerName,
          email: customerEmail,
          address: customerAddress || undefined,
          country: customerCountry || undefined,
          phone: customerPhone || undefined,
          companyName: customerCompanyName || undefined,
          companyLicense: customerCompanyLicense || undefined,
          tinNumber: customerTinNumber || undefined,
        },
        subtotal: Math.round(subtotal * 100),
        discount: Math.round(discount * 100),
        tax: Math.round(serviceTax * 100),
        taxRate: serviceTaxEnabled ? taxRate : undefined,
        total: Math.round(total * 100),
        notes,
        planTier: planTier || undefined,
        creditsToGrant: creditsToGrant > 0 ? creditsToGrant : undefined,
      });

      toast.success("Invoice updated successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update invoice";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!invoice) return null;

  const isLocked = invoice.status === "paid" || invoice.status === "cancelled";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice: {invoice.invoiceNo}</DialogTitle>
          <DialogDescription>
            Update invoice details. All monetary values in MYR.
          </DialogDescription>
        </DialogHeader>

        {isLocked && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            This invoice is <strong>{invoice.status}</strong>. Editing will update the record but will not reverse any payment or plan changes.
          </div>
        )}

        <div className="space-y-6 py-4">
          {/* Fulfillment on Payment */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-sm">Fulfillment on Payment</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Plan Action</Label>
                <Select
                  value={planTier || "none"}
                  onValueChange={(v) => setPlanTier(v === "none" ? "" : v)}
                  disabled={isLocked}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="No plan change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No plan change</SelectItem>
                    <SelectItem value="pro_personal">→ Activate Pro</SelectItem>
                    <SelectItem value="business">→ Activate Business</SelectItem>
                    <SelectItem value="free">→ Cancel (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Credits to Grant</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={creditsToGrant || ""}
                  onChange={(e) => setCreditsToGrant(parseInt(e.target.value) || 0)}
                  disabled={isLocked}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            {(planTier || creditsToGrant > 0) && (
              <div className="rounded bg-amber-100 px-3 py-2 text-xs text-amber-800">
                <strong>On payment:</strong>{" "}
                {planTier === "free" ? "Cancel plan → Free"
                  : planTier === "pro_personal" ? "Activate Pro Plan"
                  : planTier === "business" ? "Activate Business Plan"
                  : ""}
                {planTier && creditsToGrant > 0 ? " + " : ""}
                {creditsToGrant > 0 ? `Grant ${creditsToGrant.toLocaleString()} credits` : ""}
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Customer Information</h3>
              {billingProfile && (
                <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={handleSyncFromProfile}>
                  <RefreshCw className="h-3 w-3" />
                  Sync from Profile
                </Button>
              )}
            </div>
            
            {/* Customer Search */}
            <div className="relative">
              <Label htmlFor="customerSearch">Search Customer</Label>
              <Input
                id="customerSearch"
                value={customerSearchTerm}
                onChange={(e) => {
                  setCustomerSearchTerm(e.target.value);
                  setShowCustomerDropdown(e.target.value.length >= 2);
                }}
                placeholder="Type to search customers..."
                className="mb-2"
              />
              {showCustomerDropdown && searchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <button
                      key={customer._id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">{customer.customerName}</div>
                      {customer.customerEmail && (
                        <div className="text-sm text-gray-600">{customer.customerEmail}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customerAddress">Customer Address</Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter customer address"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="customerCompanyName">Company Name</Label>
              <Input
                id="customerCompanyName"
                value={customerCompanyName}
                onChange={(e) => setCustomerCompanyName(e.target.value)}
                placeholder="e.g. Acme Sdn Bhd"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+60 12 345 6789"
                />
              </div>
              <div>
                <Label htmlFor="customerCountry">Country</Label>
                <Input
                  id="customerCountry"
                  value={customerCountry}
                  onChange={(e) => setCustomerCountry(e.target.value)}
                  placeholder="Malaysia"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerCompanyLicense">Company Reg No.</Label>
                <Input
                  id="customerCompanyLicense"
                  value={customerCompanyLicense}
                  onChange={(e) => setCustomerCompanyLicense(e.target.value)}
                  placeholder="1234567-X"
                />
              </div>
              <div>
                <Label htmlFor="customerTinNumber">TIN / Tax ID</Label>
                <Input
                  id="customerTinNumber"
                  value={customerTinNumber}
                  onChange={(e) => setCustomerTinNumber(e.target.value)}
                  placeholder="C12345678"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Line Items</h3>
              <Button onClick={handleAddItem} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start border-b pb-3">
                <div className="col-span-5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    placeholder="Item description"
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Total</Label>
                  <Input value={item.total.toFixed(2)} disabled className="text-sm" />
                </div>
                <div className="col-span-1 flex items-end">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">MYR {subtotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="text-right"
              />
            </div>
            {serviceTaxEnabled && (
              <>
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Service Tax {taxRate}%:</span>
                  <span className="font-medium">- MYR {serviceTax.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total:</span>
              <span>MYR {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes here..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
