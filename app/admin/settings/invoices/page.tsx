"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Save, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceSettingsPage() {
  const config = useQuery(api.invoiceConfig.getInvoiceConfig);
  const updateConfig = useMutation(api.invoiceConfig.updateInvoiceConfig);
  const resetCounter = useMutation(api.invoiceConfig.resetInvoiceCounter);
  
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState("Year + Running");
  const [invoiceLeadingZeros, setInvoiceLeadingZeros] = useState(4);
  const [invoiceCurrentCounter, setInvoiceCurrentCounter] = useState(1);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newCounterValue, setNewCounterValue] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (config) {
      setInvoicePrefix(config.invoicePrefix || "INV-");
      setInvoiceNumberFormat(config.invoiceNumberFormat || "Year + Running");
      setInvoiceLeadingZeros(config.invoiceLeadingZeros || 4);
      setInvoiceCurrentCounter(config.invoiceCurrentCounter || 1);
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({
        invoicePrefix,
        invoiceNumberFormat,
        invoiceLeadingZeros,
        invoiceCurrentCounter,
      });
      toast.success("Invoice configuration updated successfully");
    } catch (error) {
      toast.error("Failed to update invoice configuration");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const refreshPreview = () => {
    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const paddedCounter = invoiceCurrentCounter.toString().padStart(invoiceLeadingZeros, "0");

    let preview = "";
    switch (invoiceNumberFormat) {
      case "Year + Running":
        preview = `${invoicePrefix}${yearShort}${paddedCounter}`;
        break;
      case "Running Only":
        preview = `${invoicePrefix}${paddedCounter}`;
        break;
      case "Month + Running":
        preview = `${invoicePrefix}${yearShort}${month}${paddedCounter}`;
        break;
      default:
        preview = `${invoicePrefix}${yearShort}${paddedCounter}`;
    }
    setPreviewInvoiceNo(preview);
  };

  useEffect(() => {
    refreshPreview();
  }, [invoicePrefix, invoiceNumberFormat, invoiceLeadingZeros, invoiceCurrentCounter]);

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Invoice Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure invoice numbering for all transactions (subscriptions, payments, credits)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Configuration</CardTitle>
          <CardDescription>
            Manage how invoice numbers are generated for your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Prefix */}
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
            <Input
              id="invoicePrefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV-"
              maxLength={10}
            />
            <p className="text-sm text-muted-foreground">
              Prefix for all invoice numbers (e.g., INV-, SALE-, BILL-)
            </p>
          </div>

          {/* Invoice Number Format */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumberFormat">Invoice Number Format</Label>
            <Select value={invoiceNumberFormat} onValueChange={setInvoiceNumberFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Year + Running">
                  Year + Running (e.g., INV-250001) ⭐ Recommended
                </SelectItem>
                <SelectItem value="Running Only">
                  Running Only (e.g., INV-0001)
                </SelectItem>
                <SelectItem value="Month + Running">
                  Month + Running (e.g., INV-25010001)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Format determines when invoice numbers reset (yearly, monthly, or never)
            </p>
          </div>

          {/* Leading Zeros */}
          <div className="space-y-2">
            <Label htmlFor="invoiceLeadingZeros">Leading Zeros</Label>
            <Input
              id="invoiceLeadingZeros"
              type="number"
              min={1}
              max={10}
              value={invoiceLeadingZeros}
              onChange={(e) => setInvoiceLeadingZeros(parseInt(e.target.value) || 4)}
            />
            <p className="text-sm text-muted-foreground">
              Number of digits for running number (1-10)
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Next Invoice Number</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {previewInvoiceNo || "INV-250001"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshPreview}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Preview
              </Button>
            </div>
          </div>

          {/* Current Counter */}
          <div className="space-y-2">
            <Label>Current Counter</Label>
            <div className="flex items-center gap-2">
              <Input
                value={invoiceCurrentCounter}
                disabled
                className="bg-muted flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current running number (auto-increments with each invoice)
            </p>
          </div>

          {/* Set Counter Manually */}
          <div className="space-y-2">
            <Label htmlFor="newCounter">Set Counter Manually</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newCounter"
                type="number"
                min={1}
                value={newCounterValue}
                onChange={(e) => setNewCounterValue(e.target.value)}
                placeholder="Enter new counter value"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={async () => {
                  const value = parseInt(newCounterValue);
                  if (isNaN(value) || value < 1) {
                    toast.error("Please enter a valid number (minimum 1)");
                    return;
                  }
                  setIsResetting(true);
                  try {
                    await updateConfig({
                      invoicePrefix,
                      invoiceNumberFormat,
                      invoiceLeadingZeros,
                      invoiceCurrentCounter: value,
                    });
                    setInvoiceCurrentCounter(value);
                    toast.success(`Counter set to ${value}`);
                    setNewCounterValue("");
                  } catch (error) {
                    toast.error("Failed to set counter");
                  } finally {
                    setIsResetting(false);
                  }
                }}
                disabled={isResetting || !newCounterValue}
              >
                Set Counter
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!confirm("Are you sure you want to reset the counter to 1? This may create duplicate invoice numbers.")) {
                    return;
                  }
                  setIsResetting(true);
                  try {
                    await resetCounter({ newCounter: 1 });
                    setInvoiceCurrentCounter(1);
                    toast.success("Counter reset to 1");
                    setNewCounterValue("");
                  } catch (error) {
                    toast.error("Failed to reset counter");
                  } finally {
                    setIsResetting(false);
                  }
                }}
                disabled={isResetting}
              >
                Reset to 1
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Warning: Manually changing the counter may create duplicate invoice numbers
            </p>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Invoice Configuration"}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How Invoice Numbering Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">Unified System</p>
            <p className="text-muted-foreground">
              All transactions (subscriptions, credit purchases, manual credits) share the same invoice number sequence.
            </p>
          </div>
          <div>
            <p className="font-semibold">Number Format</p>
            <p className="text-muted-foreground">
              Choose between Year + Running (recommended), Running Only, or Month + Running formats.
            </p>
          </div>
          <div>
            <p className="font-semibold">Email Integration</p>
            <p className="text-muted-foreground">
              Invoice numbers are automatically included in payment and subscription emails using the {"{invoiceNo}"} variable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
