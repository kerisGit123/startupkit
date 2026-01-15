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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

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
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load invoice data when dialog opens
  useEffect(() => {
    if (invoice && isOpen) {
      setCustomerName(invoice.billingDetails?.name || "");
      setCustomerEmail(invoice.billingDetails?.email || "");
      setCustomerAddress(invoice.billingDetails?.address || "");
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
          address: customerAddress,
        },
        subtotal: Math.round(subtotal * 100),
        discount: Math.round(discount * 100),
        tax: Math.round(serviceTax * 100),
        taxRate: serviceTaxEnabled ? taxRate : undefined,
        total: Math.round(total * 100),
        notes,
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

  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Edit Invoice</DialogTitle>
            <DialogDescription>
              This invoice has been {invoice.status} and cannot be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice: {invoice.invoiceNo}</DialogTitle>
          <DialogDescription>
            Update invoice details. All monetary values in MYR.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Information</h3>
            
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
