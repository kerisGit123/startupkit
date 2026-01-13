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
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function CompanySettingsPage() {
  const companySettings = useQuery(api.platformConfig.getByCategory, { category: "company" });
  const batchSet = useMutation(api.platformConfig.batchSet);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [localSettings, setLocalSettings] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyCountry: "",
    passwordResetLink: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (companySettings && !isInitialized) {
      setLocalSettings({
        companyName: (companySettings.companyName as string) ?? "",
        companyEmail: (companySettings.companyEmail as string) ?? "",
        companyPhone: (companySettings.companyPhone as string) ?? "",
        companyAddress: (companySettings.companyAddress as string) ?? "",
        companyCountry: (companySettings.companyCountry as string) ?? "",
        passwordResetLink: (companySettings.passwordResetLink as string) ?? "",
      });
      setIsInitialized(true);
    }
  }, [companySettings, isInitialized]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await batchSet({
        settings: [
          {
            key: "companyName",
            value: localSettings.companyName,
            category: "company",
            description: "Platform company name",
          },
          {
            key: "companyEmail",
            value: localSettings.companyEmail,
            category: "company",
            description: "Main contact email for your company",
          },
          {
            key: "companyPhone",
            value: localSettings.companyPhone,
            category: "company",
            description: "Contact phone number",
          },
          {
            key: "companyAddress",
            value: localSettings.companyAddress,
            category: "company",
            description: "Full company address",
          },
          {
            key: "companyCountry",
            value: localSettings.companyCountry,
            category: "company",
            description: "Country where company is registered",
          },
          {
            key: "passwordResetLink",
            value: localSettings.passwordResetLink,
            category: "company",
            description: "Clerk password reset URL",
          },
        ],
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Company Information</h2>
        <p className="text-muted-foreground">
          Configure your company details used in email templates and system communications.
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Company settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save company settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>
            Update your company information for email templates and communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="my own testing company2"
              value={localSettings.companyName}
              onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Used in email templates as {"{company_name}"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail">Company Email</Label>
            <Input
              id="companyEmail"
              type="email"
              placeholder="shangwey@yahoo.com"
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
              placeholder="+60122614679"
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
              placeholder="8-6 skyvue, kabusak"
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
              placeholder="Malaysia"
              value={localSettings.companyCountry}
              onChange={(e) => setLocalSettings({ ...localSettings, companyCountry: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Country where company is registered
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordResetLink">Password Reset Link (Clerk)</Label>
            <Input
              id="passwordResetLink"
              type="url"
              placeholder="https://your-app.clerk.accounts.dev/sign-in#/reset-password"
              value={localSettings.passwordResetLink}
              onChange={(e) => setLocalSettings({ ...localSettings, passwordResetLink: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Get this from your Clerk dashboard → User & Authentication → Email & SMS. Used in password reset email templates as {"{link}"}
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
  );
}
