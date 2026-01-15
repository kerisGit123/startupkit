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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface ConversionPreviewModalProps {
  poId: Id<"purchase_orders">;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversionPreviewModal({
  poId,
  isOpen,
  onClose,
}: ConversionPreviewModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const po = useQuery(api.purchaseOrders.queries.getPurchaseOrderById, { poId });
  const convertPO = useMutation(api.purchaseOrders.convertPOToInvoice.convertPOToInvoice);

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [taxOverride, setTaxOverride] = useState<string>("");
  const [taxRateOverride, setTaxRateOverride] = useState<string>("");
  const [discountOverride, setDiscountOverride] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  // Initialize selected items when PO loads
  useEffect(() => {
    if (po && selectedItems.length === 0) {
      setSelectedItems(po.items.map((_, index) => index));
      setTaxOverride(((po.tax || 0) / 100).toFixed(2));
      setTaxRateOverride((po.taxRate || 0).toString());
      setDiscountOverride(((po.discount || 0) / 100).toFixed(2));
    }
  }, [po]);

  if (!po) return null;

  // Calculate preview totals
  const selectedItemsData = selectedItems.map((index: number) => po.items[index]).filter(Boolean);
  const subtotal = selectedItemsData.reduce((sum, item) => sum + item.total, 0) / 100;
  const taxAmount = taxOverride ? parseFloat(taxOverride) : (subtotal * (parseFloat(taxRateOverride) || 0)) / 100;
  const discountAmount = discountOverride ? parseFloat(discountOverride) : 0;
  const total = subtotal + taxAmount - discountAmount;

  const handleToggleItem = (index: number) => {
    setSelectedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleConvert = async () => {
    if (!user) {
      toast.error("You must be logged in to convert a purchase order");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to convert");
      return;
    }

    setIsConverting(true);
    try {
      const result = await convertPO({
        poId,
        selectedItemIndexes: selectedItems,
        overrides: {
          tax: taxOverride ? Math.round(parseFloat(taxOverride) * 100) : undefined,
          taxRate: taxRateOverride ? parseFloat(taxRateOverride) : undefined,
          discount: discountOverride ? Math.round(parseFloat(discountOverride) * 100) : undefined,
          notes: additionalNotes || undefined,
        },
        clerkUserId: user.id,
      });

      toast.success(`Successfully converted to Invoice ${result.invoiceNo}`);
      onClose();
      router.push(`/admin/invoice/${result.invoiceId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to convert purchase order";
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert PO-{po.poNo} to Invoice</DialogTitle>
          <DialogDescription>
            Select items to convert and adjust values as needed. The invoice will be created in draft status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Items to Convert</Label>
            <div className="space-y-2 border rounded-lg p-4">
              {po.items.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-2 hover:bg-muted rounded">
                  <Checkbox
                    checked={selectedItems.includes(index)}
                    onCheckedChange={() => handleToggleItem(index)}
                    id={`item-${index}`}
                  />
                  <label
                    htmlFor={`item-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ${(item.unitPrice / 100).toFixed(2)} = ${(item.total / 100).toFixed(2)}
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {selectedItems.length === 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>At least one item must be selected</span>
              </div>
            )}
          </div>

          {/* Tax Override */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRateOverride}
                onChange={(e) => {
                  setTaxRateOverride(e.target.value);
                  setTaxOverride(""); // Clear manual tax override
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="taxAmount">Tax Amount ($)</Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                value={taxOverride}
                onChange={(e) => setTaxOverride(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Calculated: ${taxAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Discount Override */}
          <div>
            <Label htmlFor="discount">Discount ($)</Label>
            <Input
              id="discount"
              type="number"
              step="0.01"
              value={discountOverride}
              onChange={(e) => setDiscountOverride(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes for Invoice</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any additional notes for the invoice..."
              rows={3}
            />
          </div>

          {/* Preview Totals */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3">Invoice Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({selectedItems.length} items):</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConverting}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isConverting || selectedItems.length === 0}
          >
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isConverting ? "Converting..." : "Convert to Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
