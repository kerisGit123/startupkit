"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function InvoiceSettingsPage() {
  const config = useQuery(api.invoices.invoiceSystem.getInvoiceConfig);
  const initializeConfig = useMutation(api.invoices.invoiceSystem.initializeInvoiceConfig);
  const updateConfig = useMutation(api.invoices.invoiceSystem.updateInvoiceConfig);
  const setCounter = useMutation(api.invoices.invoiceSystem.setInvoiceCounter);
  const resetCounter = useMutation(api.invoices.invoiceSystem.resetInvoiceCounter);
  
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [invoiceNoType, setInvoiceNoType] = useState<"year_running" | "year_month_running" | "year_month_en_running" | "full_year_running" | "custom" | "year_dash_running" | "year_month_en_dash_running">("year_running");
  const [invoiceLeadingZeros, setInvoiceLeadingZeros] = useState(4);
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCounterValue, setNewCounterValue] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (config) {
      setInvoicePrefix(config.invoicePrefix);
      setInvoiceNoType(config.invoiceNoType as any);
      setInvoiceLeadingZeros(config.invoiceLeadingZeros);
      setPreviewInvoiceNo(config.invoiceCurrentNo);
    }
  }, [config]);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initializeConfig({
        invoicePrefix,
        invoiceNoType,
        invoiceLeadingZeros,
      });
      toast.success("Invoice configuration initialized successfully");
    } catch (error) {
      toast.error("Failed to initialize invoice configuration");
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({
        invoicePrefix,
        invoiceNoType,
        invoiceLeadingZeros,
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
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const fullYear = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const monthCode = ["JA", "FE", "MR", "AP", "MY", "JN", "JL", "AU", "SE", "OC", "NO", "DE"][now.getMonth()];
    const runningNo = "1".padStart(invoiceLeadingZeros, "0");

    let preview = invoicePrefix;
    switch (invoiceNoType) {
      case "year_running":
        preview += `${year}${runningNo}`;
        break;
      case "year_month_running":
        preview += `${year}${month}${runningNo}`;
        break;
      case "year_month_en_running":
        preview += `${year}${monthCode}${runningNo}`;
        break;
      case "full_year_running":
        preview += `${fullYear}${runningNo}`;
        break;
      case "year_dash_running":
        preview += `${year}-${runningNo}`;
        break;
      case "year_month_en_dash_running":
        preview += `${year}${monthCode}-${runningNo}`;
        break;
      case "custom":
        preview += runningNo;
        break;
    }
    setPreviewInvoiceNo(preview);
  };

  useEffect(() => {
    refreshPreview();
  }, [invoicePrefix, invoiceNoType, invoiceLeadingZeros]);

  if (!config) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Configuration</CardTitle>
            <CardDescription>
              Initialize invoice numbering system for your transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Invoice System Not Initialized</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You need to initialize the invoice configuration before you can generate invoices for transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNoType">Invoice Number Format</Label>
                <Select value={invoiceNoType} onValueChange={(val: any) => setInvoiceNoType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year_running">Year + Running (e.g., 250001)</SelectItem>
                    <SelectItem value="year_month_running">Year + Month + Running (e.g., 25010001)</SelectItem>
                    <SelectItem value="year_month_en_running">Year + Month Code + Running (e.g., 25JA0001)</SelectItem>
                    <SelectItem value="full_year_running">Full Year + Running (e.g., 20250001)</SelectItem>
                    <SelectItem value="custom">Custom/Sequential (e.g., 0001)</SelectItem>
                    <SelectItem value="year_dash_running">Year-Running (e.g., 25-0001)</SelectItem>
                    <SelectItem value="year_month_en_dash_running">Year+Month-Running (e.g., 25JA-0001)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Preview</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {previewInvoiceNo}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={refreshPreview}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleInitialize} 
                className="w-full"
                disabled={isInitializing}
              >
                {isInitializing ? "Initializing..." : "Initialize Invoice System"}
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <Label htmlFor="invoiceNoType">Invoice Number Format</Label>
            <Select value={invoiceNoType} onValueChange={(val: any) => setInvoiceNoType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year_running">
                  Year + Running (e.g., INV-250001) ⭐ Recommended
                </SelectItem>
                <SelectItem value="year_month_running">
                  Year + Month + Running (e.g., INV-25010001)
                </SelectItem>
                <SelectItem value="year_month_en_running">
                  Year + Month Code + Running (e.g., INV-25JA0001)
                </SelectItem>
                <SelectItem value="full_year_running">
                  Full Year + Running (e.g., INV-20250001)
                </SelectItem>
                <SelectItem value="custom">
                  Custom/Sequential (e.g., INV-0001)
                </SelectItem>
                <SelectItem value="year_dash_running">
                  Year-Running (e.g., INV-25-0001)
                </SelectItem>
                <SelectItem value="year_month_en_dash_running">
                  Year+Month-Running (e.g., INV-25JA-0001)
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
                value={config.invoiceRunningNo}
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
                    await setCounter({ counterValue: value });
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
                    await resetCounter({});
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
            <p className="font-semibold">Auto-Reset</p>
            <p className="text-muted-foreground">
              Depending on your format, numbers reset yearly (year_running), monthly (year_month_running), or never (custom).
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
