"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

function GeneralConfigTab() {
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  const updateConfig = useMutation(api.invoicePOConfig.updateInvoicePOConfig);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [localSettings, setLocalSettings] = useState({
    SSTRegNo: "",
    regNo: "",
    defaultTerm: "",
    websiteURL: "",
    bankName: "",
    bankAccount: "",
    paymentNote: "",
    serviceTaxCode: "",
    serviceTax: 0,
    serviceTaxEnable: false,
    roundingEnable: false,
    currency: "RM",
    serviceTaxInvoiceEnable: true,
    discountInvoice: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (invoicePOConfig && !isInitialized) {
      setLocalSettings({
        SSTRegNo: invoicePOConfig.SSTRegNo ?? "",
        regNo: invoicePOConfig.regNo ?? "",
        defaultTerm: invoicePOConfig.defaultTerm ?? "",
        websiteURL: invoicePOConfig.websiteURL ?? "",
        bankName: invoicePOConfig.bankName ?? "",
        bankAccount: invoicePOConfig.bankAccount ?? "",
        paymentNote: invoicePOConfig.paymentNote ?? "",
        serviceTaxCode: invoicePOConfig.serviceTaxCode ?? "",
        serviceTax: invoicePOConfig.serviceTax ?? 0,
        serviceTaxEnable: invoicePOConfig.serviceTaxEnable ?? false,
        roundingEnable: invoicePOConfig.roundingEnable ?? false,
        currency: invoicePOConfig.currency ?? "RM",
        serviceTaxInvoiceEnable: invoicePOConfig.serviceTaxInvoiceEnable ?? true,
        discountInvoice: invoicePOConfig.discountInvoice ?? false,
      });
      setIsInitialized(true);
    }
  }, [invoicePOConfig, isInitialized]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateConfig(localSettings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000);
    }
  };

  if (invoicePOConfig === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Settings saved successfully!</AlertDescription>
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">Failed to save settings. Please try again.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company Registration</CardTitle>
          <CardDescription>Registration numbers and tax information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regNo">Registration Number</Label>
              <Input id="regNo" placeholder="reg-123456" value={localSettings.regNo} onChange={(e) => setLocalSettings({ ...localSettings, regNo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="SSTRegNo">SST Registration Number</Label>
              <Input id="SSTRegNo" placeholder="SST-123" value={localSettings.SSTRegNo} onChange={(e) => setLocalSettings({ ...localSettings, SSTRegNo: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Terms</CardTitle>
          <CardDescription>Default payment terms and banking information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTerm">Default Payment Term</Label>
              <Input id="defaultTerm" placeholder="NET 30" value={localSettings.defaultTerm} onChange={(e) => setLocalSettings({ ...localSettings, defaultTerm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" placeholder="RM" value={localSettings.currency} onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" placeholder="rhb" value={localSettings.bankName} onChange={(e) => setLocalSettings({ ...localSettings, bankName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Input id="bankAccount" placeholder="123 312 123" value={localSettings.bankAccount} onChange={(e) => setLocalSettings({ ...localSettings, bankAccount: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentNote">Payment Note</Label>
            <Textarea id="paymentNote" placeholder="pay by cash" rows={3} value={localSettings.paymentNote} onChange={(e) => setLocalSettings({ ...localSettings, paymentNote: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteURL">Website URL</Label>
            <Input id="websiteURL" type="url" placeholder="www.yahoo.com" value={localSettings.websiteURL} onChange={(e) => setLocalSettings({ ...localSettings, websiteURL: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>Service tax settings and calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceTaxCode">Service Tax Code</Label>
              <Input id="serviceTaxCode" placeholder="B" value={localSettings.serviceTaxCode} onChange={(e) => setLocalSettings({ ...localSettings, serviceTaxCode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceTax">Service Tax (%)</Label>
              <Input id="serviceTax" type="number" step="0.01" placeholder="6" value={localSettings.serviceTax} onChange={(e) => setLocalSettings({ ...localSettings, serviceTax: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { id: "serviceTaxEnable", label: "Enable Service Tax", key: "serviceTaxEnable" as const },
              { id: "roundingEnable", label: "Enable Malaysian Rounding", key: "roundingEnable" as const },
              { id: "serviceTaxInvoiceEnable", label: "Enable Service Tax for Invoices", key: "serviceTaxInvoiceEnable" as const },
              { id: "discountInvoice", label: "Enable Discount for Invoices", key: "discountInvoice" as const },
            ].map(({ id, label, key }) => (
              <div key={id} className="flex items-center space-x-2">
                <input type="checkbox" id={id} checked={localSettings[key]} onChange={(e) => setLocalSettings({ ...localSettings, [key]: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <Label htmlFor={id} className="font-normal">{label}</Label>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saveStatus === "saving"} className="w-full">
            {saveStatus === "saving" ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceNumberingTab() {
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

  useEffect(() => {
    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const paddedCounter = invoiceCurrentCounter.toString().padStart(invoiceLeadingZeros, "0");
    switch (invoiceNumberFormat) {
      case "Year + Running": setPreviewInvoiceNo(`${invoicePrefix}${yearShort}${paddedCounter}`); break;
      case "Running Only": setPreviewInvoiceNo(`${invoicePrefix}${paddedCounter}`); break;
      case "Month + Running": setPreviewInvoiceNo(`${invoicePrefix}${yearShort}${month}${paddedCounter}`); break;
      default: setPreviewInvoiceNo(`${invoicePrefix}${yearShort}${paddedCounter}`);
    }
  }, [invoicePrefix, invoiceNumberFormat, invoiceLeadingZeros, invoiceCurrentCounter]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({ invoicePrefix, invoiceNumberFormat, invoiceLeadingZeros, invoiceCurrentCounter });
      toast.success("Invoice configuration updated");
    } catch { toast.error("Failed to update invoice configuration"); }
    finally { setIsSaving(false); }
  };

  if (!config) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Numbering</CardTitle>
          <CardDescription>Configure how invoice numbers are generated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
            <Input id="invoicePrefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV-" maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceNumberFormat">Number Format</Label>
            <Select value={invoiceNumberFormat} onValueChange={setInvoiceNumberFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Year + Running">Year + Running (e.g., INV-250001)</SelectItem>
                <SelectItem value="Running Only">Running Only (e.g., INV-0001)</SelectItem>
                <SelectItem value="Month + Running">Month + Running (e.g., INV-25010001)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceLeadingZeros">Leading Zeros</Label>
            <Input id="invoiceLeadingZeros" type="number" min={1} max={10} value={invoiceLeadingZeros} onChange={(e) => setInvoiceLeadingZeros(parseInt(e.target.value) || 4)} />
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Next Invoice Number</p>
            <p className="text-2xl font-bold text-primary mt-1">{previewInvoiceNo || "INV-250001"}</p>
          </div>
          <div className="space-y-2">
            <Label>Current Counter: {invoiceCurrentCounter}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} value={newCounterValue} onChange={(e) => setNewCounterValue(e.target.value)} placeholder="Set counter manually" className="flex-1" />
              <Button variant="outline" onClick={async () => {
                const value = parseInt(newCounterValue);
                if (isNaN(value) || value < 1) { toast.error("Enter a valid number (min 1)"); return; }
                setIsResetting(true);
                try { await updateConfig({ invoicePrefix, invoiceNumberFormat, invoiceLeadingZeros, invoiceCurrentCounter: value }); setInvoiceCurrentCounter(value); toast.success(`Counter set to ${value}`); setNewCounterValue(""); }
                catch { toast.error("Failed to set counter"); }
                finally { setIsResetting(false); }
              }} disabled={isResetting || !newCounterValue}>Set</Button>
              <Button variant="destructive" onClick={async () => {
                if (!confirm("Reset counter to 1? This may create duplicate invoice numbers.")) return;
                setIsResetting(true);
                try { await resetCounter({ newCounter: 1 }); setInvoiceCurrentCounter(1); toast.success("Counter reset to 1"); }
                catch { toast.error("Failed to reset counter"); }
                finally { setIsResetting(false); }
              }} disabled={isResetting}>Reset</Button>
            </div>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />{isSaving ? "Saving..." : "Save Invoice Config"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SONumberingTab() {
  const soConfig = useQuery(api.soConfig.getSOConfig);
  const updateConfig = useMutation(api.soConfig.updateSOConfig);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [localSettings, setLocalSettings] = useState({
    soPrefix: "SO-",
    soNumberFormat: "Year + Running",
    soLeadingZeros: 4,
    soCurrentCounter: 1,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (soConfig && !isInitialized) {
      setLocalSettings({
        soPrefix: soConfig.soPrefix || "SO-",
        soNumberFormat: soConfig.soNumberFormat || "Year + Running",
        soLeadingZeros: soConfig.soLeadingZeros || 4,
        soCurrentCounter: soConfig.soCurrentCounter || 1,
      });
      setIsInitialized(true);
    }
  }, [soConfig, isInitialized]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateConfig(localSettings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const generatePreview = () => {
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const paddedCounter = localSettings.soCurrentCounter.toString().padStart(localSettings.soLeadingZeros, "0");
    switch (localSettings.soNumberFormat) {
      case "Year + Running": return `${localSettings.soPrefix}${yearShort}${paddedCounter}`;
      case "Running Only": return `${localSettings.soPrefix}${paddedCounter}`;
      case "Month + Running": return `${localSettings.soPrefix}${yearShort}${month}${paddedCounter}`;
      default: return `${localSettings.soPrefix}${yearShort}${paddedCounter}`;
    }
  };

  if (soConfig === undefined) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">SO settings saved!</AlertDescription>
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">Failed to save. Please try again.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sales Order Numbering</CardTitle>
          <CardDescription>Configure how sales order numbers are generated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="soPrefix">SO Prefix</Label>
            <Input id="soPrefix" placeholder="SO-" value={localSettings.soPrefix} onChange={(e) => setLocalSettings({ ...localSettings, soPrefix: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="soNumberFormat">Number Format</Label>
            <Select value={localSettings.soNumberFormat} onValueChange={(value) => setLocalSettings({ ...localSettings, soNumberFormat: value })}>
              <SelectTrigger id="soNumberFormat"><SelectValue placeholder="Select format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Year + Running">Year + Running (e.g., SO-250001)</SelectItem>
                <SelectItem value="Running Only">Running Only (e.g., SO-0001)</SelectItem>
                <SelectItem value="Month + Running">Month + Running (e.g., SO-25010001)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="soLeadingZeros">Leading Zeros</Label>
            <Input id="soLeadingZeros" type="number" min={1} max={10} value={localSettings.soLeadingZeros} onChange={(e) => setLocalSettings({ ...localSettings, soLeadingZeros: parseInt(e.target.value) || 4 })} />
          </div>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Next SO Number</p>
            <p className="text-2xl font-bold text-primary mt-1">{generatePreview()}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="soCurrentCounter">Current Counter</Label>
            <Input id="soCurrentCounter" type="number" min={1} value={localSettings.soCurrentCounter} onChange={(e) => setLocalSettings({ ...localSettings, soCurrentCounter: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saveStatus === "saving"} className="flex-1">
              {saveStatus === "saving" ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save SO Configuration"}
            </Button>
            <Button variant="outline" onClick={() => setLocalSettings({ ...localSettings, soCurrentCounter: 1 })} disabled={saveStatus === "saving"}>Reset to 1</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvoicePOConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Invoice & Sales Order Settings</h2>
        <p className="text-muted-foreground">
          Configure invoicing, sales orders, tax rates, and numbering.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="invoice-numbering">Invoice Numbering</TabsTrigger>
          <TabsTrigger value="so-numbering">SO Numbering</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><GeneralConfigTab /></TabsContent>
        <TabsContent value="invoice-numbering"><InvoiceNumberingTab /></TabsContent>
        <TabsContent value="so-numbering"><SONumberingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
