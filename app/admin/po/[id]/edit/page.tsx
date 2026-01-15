"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EditPOPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const poId = params.id as Id<"purchase_orders">;

  const po = useQuery(api.purchaseOrders.queries.getPurchaseOrderById, { poId });
  const updatePO = useMutation(api.purchaseOrders.updatePurchaseOrder.updatePurchaseOrder);

  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load PO data
  useEffect(() => {
    if (po) {
      setVendorName(po.vendorName);
      setVendorEmail(po.vendorEmail || "");
      setVendorAddress(po.vendorAddress || "");
      setItems(po.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice / 100, // Convert cents to dollars for display
        total: item.total / 100,
      })));
      setTaxRate(po.taxRate || 0);
      setDiscount((po.discount || 0) / 100); // Convert cents to dollars
      setNotes(po.notes || "");
      setPaymentTerms(po.paymentTerms || "");
    }
  }, [po]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax - discount;

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updatePO({
        poId,
        updates: {
          vendorName,
          vendorEmail,
          vendorAddress,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice * 100), // Convert dollars to cents
            total: Math.round(item.total * 100),
          })),
          subtotal: Math.round(subtotal * 100),
          tax: Math.round(tax * 100),
          taxRate,
          discount: Math.round(discount * 100),
          total: Math.round(total * 100),
          notes,
          paymentTerms,
        },
        clerkUserId: user.id,
      });
      
      toast.success("Purchase order updated successfully");
      router.push(`/admin/po/${poId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update purchase order";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!po) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (po.convertedToInvoiceId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              This purchase order has been converted to an invoice and cannot be edited.
            </p>
            <div className="flex justify-center mt-4">
              <Link href={`/admin/po/${poId}`}>
                <Button>View Purchase Order</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/po/${poId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Edit Purchase Order: {po.poNo}</h1>
          <p className="text-sm text-muted-foreground">
            Created by: {po.createdBy} | Last edited: {po.lastEditedAt ? new Date(po.lastEditedAt).toLocaleDateString() : "Never"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Vendor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="vendorName">Vendor Name *</Label>
            <Input
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Enter vendor name"
            />
          </div>
          <div>
            <Label htmlFor="vendorEmail">Vendor Email</Label>
            <Input
              id="vendorEmail"
              type="email"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
              placeholder="vendor@example.com"
            />
          </div>
          <div>
            <Label htmlFor="vendorAddress">Vendor Address</Label>
            <Textarea
              id="vendorAddress"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
              placeholder="Enter vendor address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button onClick={handleAddItem} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  placeholder="Item description"
                />
              </div>
              <div className="w-24">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="w-32">
                <Label>Unit Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="w-32">
                <Label>Total ($)</Label>
                <Input
                  type="number"
                  value={item.total.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <Button
                onClick={() => handleRemoveItem(index)}
                size="icon"
                variant="ghost"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="taxRate" className="flex-1">Tax Rate (%):</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-32"
              min="0"
            />
            <span className="w-32 text-right font-semibold">${tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="discount" className="flex-1">Discount ($):</Label>
            <Input
              id="discount"
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-32"
              min="0"
            />
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g., Net 30"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Link href={`/admin/po/${poId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
