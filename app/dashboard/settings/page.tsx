"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
// Card components removed - using custom div styling for consistency
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Building2 } from "lucide-react";

export default function SettingsPage() {
  const companySettings = useQuery(api.companySettings.getCompanySettings);
  const updateSettings = useMutation(api.companySettings.updateCompanySettings);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [localSettings, setLocalSettings] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyCountry: "",
    companyTin: "",
    companyLicense: "",
  });

  useEffect(() => {
    if (companySettings) {
      setLocalSettings({
        companyName: companySettings.companyName ?? "",
        companyEmail: companySettings.companyEmail ?? "",
        companyPhone: companySettings.companyPhone ?? "",
        companyAddress: companySettings.companyAddress ?? "",
        companyCountry: companySettings.companyCountry ?? "",
        companyTin: companySettings.companyTin ?? "",
        companyLicense: companySettings.companyLicense ?? "",
      });
    }
  }, [companySettings]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateSettings({
        companyName: localSettings.companyName,
        companyEmail: localSettings.companyEmail,
        companyPhone: localSettings.companyPhone,
        companyAddress: localSettings.companyAddress,
        companyCountry: localSettings.companyCountry,
        companyTin: localSettings.companyTin,
        companyLicense: localSettings.companyLicense,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save company settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  if (companySettings === undefined) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage your company information and business details
          </p>
        </div>

        {saveStatus === "success" && (
          <Alert className="bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              Company settings saved successfully!
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

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              <p className="text-xs text-gray-400">Used in email templates and communications</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
                  value={localSettings.companyName}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail" className="text-sm font-medium text-gray-700">Company Email *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  placeholder="contact@company.com"
                  value={localSettings.companyEmail}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyEmail: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="companyPhone" className="text-sm font-medium text-gray-700">Company Phone</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={localSettings.companyPhone}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyPhone: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyCountry" className="text-sm font-medium text-gray-700">Company Country</Label>
                <Input
                  id="companyCountry"
                  placeholder="United States"
                  value={localSettings.companyCountry}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyCountry: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress" className="text-sm font-medium text-gray-700">Company Address</Label>
              <Textarea
                id="companyAddress"
                placeholder="123 Business Street, Suite 100"
                rows={3}
                value={localSettings.companyAddress}
                onChange={(e) => setLocalSettings({ ...localSettings, companyAddress: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="companyTin" className="text-sm font-medium text-gray-700">Tax ID (TIN)</Label>
                <Input
                  id="companyTin"
                  placeholder="XX-XXXXXXX"
                  value={localSettings.companyTin}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyTin: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLicense" className="text-sm font-medium text-gray-700">Business License</Label>
                <Input
                  id="companyLicense"
                  placeholder="License number"
                  value={localSettings.companyLicense}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyLicense: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saveStatus === "saving"}
              className="w-full rounded-xl bg-gray-900 hover:bg-gray-800"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Company Settings"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
