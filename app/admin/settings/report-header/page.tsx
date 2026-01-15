"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function ReportHeaderPage() {
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  const reportLogoUrl = useQuery(api.reportLogo.getReportLogoUrl, { companyId: "default" });
  const updateConfig = useMutation(api.invoicePOConfig.updateInvoicePOConfig);
  const generateUploadUrl = useMutation(api.reportLogo.generateUploadUrl);
  const saveReportLogo = useMutation(api.reportLogo.saveReportLogo);
  const deleteReportLogo = useMutation(api.reportLogo.deleteReportLogo);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [logoPreview, setLogoPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localSettings, setLocalSettings] = useState({
    reportCompanyName: "",
    reportCompanyAddress: "",
    reportCompanyPhone: "",
    reportCompanyEmail: "",
    showReportLogo: true,
    reportFooter: "",
    generateFooterDate: true,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (invoicePOConfig && !isInitialized) {
      setLocalSettings({
        reportCompanyName: invoicePOConfig.reportCompanyName ?? "",
        reportCompanyAddress: invoicePOConfig.reportCompanyAddress ?? "",
        reportCompanyPhone: invoicePOConfig.reportCompanyPhone ?? "",
        reportCompanyEmail: invoicePOConfig.reportCompanyEmail ?? "",
        showReportLogo: invoicePOConfig.showReportLogo ?? true,
        reportFooter: invoicePOConfig.documentFooter ?? "",
        generateFooterDate: invoicePOConfig.generateFooterDate ?? true,
      });
      setIsInitialized(true);
    }
  }, [invoicePOConfig, isInitialized]);

  useEffect(() => {
    if (reportLogoUrl) {
      setLogoPreview(reportLogoUrl);
    }
  }, [reportLogoUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await result.json();
      await saveReportLogo({ storageId, companyId: "default" });

      toast.success('Logo uploaded successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await deleteReportLogo({ companyId: "default" });
      setLogoPreview("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Logo deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete logo');
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateConfig({
        reportCompanyName: localSettings.reportCompanyName,
        reportCompanyAddress: localSettings.reportCompanyAddress,
        reportCompanyPhone: localSettings.reportCompanyPhone,
        reportCompanyEmail: localSettings.reportCompanyEmail,
        showReportLogo: localSettings.showReportLogo,
        documentFooter: localSettings.reportFooter,
        generateFooterDate: localSettings.generateFooterDate,
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
        <h2 className="text-2xl font-bold tracking-tight">Report Header Settings</h2>
        <p className="text-muted-foreground">
          Customize the company information displayed on PO and Invoice reports. Leave blank to use default company settings.
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Report header settings saved successfully!
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
          <CardTitle>Report Logo</CardTitle>
          <CardDescription>
            Upload a logo file to display on your reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Preview with Delete Button */}
          {logoPreview && (
            <div className="relative inline-block">
              <div className="flex items-center justify-center w-20 h-20 border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  className="max-w-full max-h-full object-contain"
                  onError={() => setLogoPreview("")}
                />
              </div>
              <button
                onClick={handleDeleteLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* File Upload Input */}
          <div className="space-y-2">
            <Label htmlFor="logoFile">Choose File</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Button
                  onClick={handleUploadLogo}
                  disabled={isUploading}
                  type="button"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedFile ? `Selected: ${selectedFile.name}` : 'logo.png'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showReportLogo"
              checked={localSettings.showReportLogo}
              onChange={(e) => setLocalSettings({ ...localSettings, showReportLogo: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="showReportLogo" className="font-normal">Show Logo on Reports</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Company Information</CardTitle>
          <CardDescription>
            Override default company details for reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportCompanyName">Report Company Name</Label>
            <Input
              id="reportCompanyName"
              placeholder="MY OWN TESTING COMPANY2"
              value={localSettings.reportCompanyName}
              onChange={(e) => setLocalSettings({ ...localSettings, reportCompanyName: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Company name shown on printed reports (defaults to main company name if empty)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportCompanyAddress">Report Company Address</Label>
            <Textarea
              id="reportCompanyAddress"
              placeholder="8-6 skyvue, kabusak"
              rows={3}
              value={localSettings.reportCompanyAddress}
              onChange={(e) => setLocalSettings({ ...localSettings, reportCompanyAddress: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Address displayed on reports
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportCompanyPhone">Report Phone Number</Label>
              <Input
                id="reportCompanyPhone"
                type="tel"
                placeholder="+60122614679"
                value={localSettings.reportCompanyPhone}
                onChange={(e) => setLocalSettings({ ...localSettings, reportCompanyPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportCompanyEmail">Report Email</Label>
              <Input
                id="reportCompanyEmail"
                type="email"
                placeholder="shangwey@yahoo.com"
                value={localSettings.reportCompanyEmail}
                onChange={(e) => setLocalSettings({ ...localSettings, reportCompanyEmail: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Footer</CardTitle>
          <CardDescription>
            Customize footer text and generation date display
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportFooter">Footer Text</Label>
            <Textarea
              id="reportFooter"
              placeholder="This is a computer-generated document. No signature is required.2"
              rows={3}
              value={localSettings.reportFooter}
              onChange={(e) => setLocalSettings({ ...localSettings, reportFooter: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Footer text displayed at the bottom of PO and Invoice reports
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generateFooterDate"
              checked={localSettings.generateFooterDate}
              onChange={(e) => setLocalSettings({ ...localSettings, generateFooterDate: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="generateFooterDate" className="font-normal">Show Generation Date in Footer</Label>
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
              "Save Report Header Settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
