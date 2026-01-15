"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your company information and business details.
          </p>
        </div>

        {saveStatus === "success" && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Company settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === "error" && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Failed to save settings. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details. These will be used in email templates and communications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                value={localSettings.companyName}
                onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Used in email templates as {"{company_name}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email *</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="contact@company.com"
                value={localSettings.companyEmail}
                onChange={(e) => setLocalSettings({ ...localSettings, companyEmail: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Main contact email for your company
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={localSettings.companyPhone}
                onChange={(e) => setLocalSettings({ ...localSettings, companyPhone: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Contact phone number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                placeholder="123 Business Street, Suite 100"
                rows={3}
                value={localSettings.companyAddress}
                onChange={(e) => setLocalSettings({ ...localSettings, companyAddress: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Full company address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyCountry">Company Country</Label>
              <Input
                id="companyCountry"
                placeholder="United States"
                value={localSettings.companyCountry}
                onChange={(e) => setLocalSettings({ ...localSettings, companyCountry: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Country where company is registered
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyTin">Tax Identification Number (TIN)</Label>
              <Input
                id="companyTin"
                placeholder="XX-XXXXXXX"
                value={localSettings.companyTin}
                onChange={(e) => setLocalSettings({ ...localSettings, companyTin: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Tax Identification Number for your company
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLicense">Business License Number</Label>
              <Input
                id="companyLicense"
                placeholder="License number"
                value={localSettings.companyLicense}
                onChange={(e) => setLocalSettings({ ...localSettings, companyLicense: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Business license or registration number
              </p>
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
                "Save Company Settings"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
