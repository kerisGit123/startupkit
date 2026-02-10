"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
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
import { Plus, Trash2, Save, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applyMalaysianRounding } from "@/lib/malaysianRounding";

interface POEditDialogProps {
  poId: Id<"purchase_orders"> | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface POItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function POEditDialog({ poId, isOpen, onClose, onSuccess }: POEditDialogProps) {
  const { user } = useUser();
  const po = useQuery(
    api.purchaseOrders.queries.getPurchaseOrderById,
    poId ? { poId } : "skip"
  );
  const updatePO = useMutation(api.purchaseOrders.updatePurchaseOrder.updatePurchaseOrder);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const searchResults = useQuery(
    api.saasCustomers.queries.searchCustomers,
    customerSearchTerm.length >= 2 ? { searchTerm: customerSearchTerm } : "skip"
  );

  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [items, setItems] = useState<POItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("CASH");
  const [dueDate, setDueDate] = useState<number | null>(null);
  const [status, setStatus] = useState("draft");
  const [isSaving, setIsSaving] = useState(false);

  // Load PO data when dialog opens
  useEffect(() => {
    if (po && isOpen) {
      setVendorName(po.vendorName);
      setVendorEmail(po.vendorEmail || "");
      setVendorAddress(po.vendorAddress || "");
      setCustomerSearchTerm("");
      setShowCustomerDropdown(false);
      setItems(
        po.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice / 100,
          total: item.total / 100,
        }))
      );
      setTaxRate(po.taxRate || 0);
      setDiscount((po.discount || 0) / 100);
      setNotes(po.notes || "");
      setPaymentTerms(po.paymentTerms || "CASH");
      setDueDate(po.dueDate || null);
      setStatus(po.status || "draft");
    }
  }, [po, isOpen]);
  
  // Handle customer selection from search
  const handleSelectCustomer = (customer: any) => {
    setVendorName(customer.customerName);
    setVendorEmail(customer.customerEmail || "");
    setVendorAddress(customer.customerAddress || "");
    setCustomerSearchTerm("");
    setShowCustomerDropdown(false);
  };

  // Calculate due date based on payment terms
  const calculateDueDate = (terms: string, baseDate: number = Date.now()) => {
    const date = new Date(baseDate);
    switch (terms) {
      case "CASH":
      case "COD":
        return baseDate; // Due immediately
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
        return baseDate;
    }
  };

  // Update due date when payment terms change
  useEffect(() => {
    setDueDate(calculateDueDate(paymentTerms));
  }, [paymentTerms]);

  // Calculate totals with Malaysian rounding
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    // Tax should be calculated on (subtotal - discount), not on subtotal
    const netAmount = subtotal - discount;
    const tax = (netAmount * taxRate) / 100;
    let total = netAmount + tax;
    let roundingAdjustment = 0;

    // Apply Malaysian rounding if enabled
    if (invoicePOConfig?.roundingEnable) {
      const roundingResult = applyMalaysianRounding(total);
      roundingAdjustment = roundingResult.adjustment;
      total = roundingResult.roundedAmount;
    }

    return { subtotal, tax, discount, roundingAdjustment, total };
  };

  const totals = calculateTotals();

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const handleSave = async () => {
    if (!user || !poId) return;

    setIsSaving(true);
    try {
      await updatePO({
        poId,
        updates: {
          vendorName,
          vendorEmail,
          vendorAddress,
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice * 100),
            total: Math.round(item.total * 100),
          })),
          subtotal: Math.round(totals.subtotal * 100),
          tax: Math.round(totals.tax * 100),
          taxRate,
          discount: Math.round(discount * 100),
          total: Math.round(totals.total * 100),
          notes,
          paymentTerms,
          dueDate: dueDate ?? undefined,
          status,
        },
        clerkUserId: user.id,
      });

      toast.success("Sales order updated successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update sales order";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!po) return null;

  if (po.convertedToInvoiceId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Edit Sales Order</DialogTitle>
            <DialogDescription>
              This sales order has been converted to an invoice and cannot be edited.
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
          <DialogTitle>Edit Sales Order: {po.poNo}</DialogTitle>
          <DialogDescription>
            Update sales order details. All monetary values in MYR.
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
                <Label htmlFor="vendorName">Customer Name *</Label>
                <Input
                  id="vendorName"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="vendorEmail">Customer Email</Label>
                <Input
                  id="vendorEmail"
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vendorAddress">Customer Address</Label>
              <Textarea
                id="vendorAddress"
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
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
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end border p-2 rounded">
                  <div className="flex-[2]">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="Item description"
                      className="h-8"
                    />
                  </div>
                  <div className="w-20">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                      min="0"
                      className="h-8"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      min="0"
                      className="h-8"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Total</Label>
                    <Input value={item.total.toFixed(2)} readOnly className="h-8 bg-muted" />
                  </div>
                  <Button
                    onClick={() => handleRemoveItem(index)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">MYR {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="discount" className="flex-1 text-sm">Discount:</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 h-8"
                min="0"
              />
              <span className="w-28 text-right font-semibold text-sm text-green-600">- MYR {discount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="taxRate" className="flex-1 text-sm">Tax Rate (%):</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-20 h-8"
                min="0"
              />
              <span className="w-28 text-right font-semibold text-sm">MYR {totals.tax.toFixed(2)}</span>
            </div>
            {invoicePOConfig?.roundingEnable && Math.abs(totals.roundingAdjustment) > 0.001 && (
              <div className="flex justify-between text-sm">
                <span>Rounding Adj:</span>
                <span className="font-semibold">MYR {totals.roundingAdjustment.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total:</span>
              <span>MYR {totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
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
              {dueDate && (
                <p className="text-sm text-muted-foreground">
                  Due Date: {(() => {
                    const date = new Date(dueDate);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                  })()}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
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
