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
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function InvoicePOConfigPage() {
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
      await updateConfig({
        SSTRegNo: localSettings.SSTRegNo,
        regNo: localSettings.regNo,
        defaultTerm: localSettings.defaultTerm,
        websiteURL: localSettings.websiteURL,
        bankName: localSettings.bankName,
        bankAccount: localSettings.bankAccount,
        paymentNote: localSettings.paymentNote,
        serviceTaxCode: localSettings.serviceTaxCode,
        serviceTax: localSettings.serviceTax,
        serviceTaxEnable: localSettings.serviceTaxEnable,
        roundingEnable: localSettings.roundingEnable,
        currency: localSettings.currency,
        serviceTaxInvoiceEnable: localSettings.serviceTaxInvoiceEnable,
        discountInvoice: localSettings.discountInvoice,
      });
      
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Invoice & SO Configuration</h2>
        <p className="text-muted-foreground">
          Configure invoice and sales order settings, tax rates, and payment information.
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company Registration</CardTitle>
          <CardDescription>
            Registration numbers and tax information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regNo">Registration Number</Label>
              <Input
                id="regNo"
                placeholder="reg-123456"
                value={localSettings.regNo}
                onChange={(e) => setLocalSettings({ ...localSettings, regNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="SSTRegNo">SST Registration Number</Label>
              <Input
                id="SSTRegNo"
                placeholder="SST-123"
                value={localSettings.SSTRegNo}
                onChange={(e) => setLocalSettings({ ...localSettings, SSTRegNo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Terms</CardTitle>
          <CardDescription>
            Default payment terms and banking information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTerm">Default Payment Term</Label>
              <Input
                id="defaultTerm"
                placeholder="NET 30"
                value={localSettings.defaultTerm}
                onChange={(e) => setLocalSettings({ ...localSettings, defaultTerm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="RM"
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="rhb"
                value={localSettings.bankName}
                onChange={(e) => setLocalSettings({ ...localSettings, bankName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Input
                id="bankAccount"
                placeholder="123 312 123"
                value={localSettings.bankAccount}
                onChange={(e) => setLocalSettings({ ...localSettings, bankAccount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNote">Payment Note</Label>
            <Textarea
              id="paymentNote"
              placeholder="pay by cash"
              rows={3}
              value={localSettings.paymentNote}
              onChange={(e) => setLocalSettings({ ...localSettings, paymentNote: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteURL">Website URL</Label>
            <Input
              id="websiteURL"
              type="url"
              placeholder="www.yahoo.com"
              value={localSettings.websiteURL}
              onChange={(e) => setLocalSettings({ ...localSettings, websiteURL: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>
            Service tax settings and calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceTaxCode">Service Tax Code</Label>
              <Input
                id="serviceTaxCode"
                placeholder="B"
                value={localSettings.serviceTaxCode}
                onChange={(e) => setLocalSettings({ ...localSettings, serviceTaxCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceTax">Service Tax (%)</Label>
              <Input
                id="serviceTax"
                type="number"
                step="0.01"
                placeholder="6"
                value={localSettings.serviceTax}
                onChange={(e) => setLocalSettings({ ...localSettings, serviceTax: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="serviceTaxEnable"
                checked={localSettings.serviceTaxEnable}
                onChange={(e) => setLocalSettings({ ...localSettings, serviceTaxEnable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="serviceTaxEnable" className="font-normal">Enable Service Tax</Label>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="roundingEnable"
                checked={localSettings.roundingEnable}
                onChange={(e) => setLocalSettings({ ...localSettings, roundingEnable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="roundingEnable" className="font-normal">Enable Malaysian Rounding</Label>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="serviceTaxInvoiceEnable"
                checked={localSettings.serviceTaxInvoiceEnable}
                onChange={(e) => setLocalSettings({ ...localSettings, serviceTaxInvoiceEnable: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="serviceTaxInvoiceEnable" className="font-normal">Enable Service Tax for Invoices</Label>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="discountInvoice"
                checked={localSettings.discountInvoice}
                onChange={(e) => setLocalSettings({ ...localSettings, discountInvoice: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="discountInvoice" className="font-normal">Enable Discount for Invoices</Label>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saveStatus === "saving"}
            className="w-full"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
