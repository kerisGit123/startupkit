"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function ResendSettingsPage() {
  const resendConfig = useQuery(api.resendConfig.getResendConfig);
  const updateConfig = useMutation(api.resendConfig.updateResendConfig);
  const hasDefaults = useQuery(api.defaultSettings.hasDefaults);
  const generateDefaults = useMutation(api.defaultSettings.generateDefaults);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatingDefaults, setGeneratingDefaults] = useState(false);
  const [resendActive, setResendActive] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    resendApiKey: "",
    resendFromEmail: "",
    resendFromName: "",
    resendReplyTo: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (resendConfig && !isInitialized) {
      setResendActive(resendConfig.resendActive || false);
      setLocalSettings({
        resendApiKey: resendConfig.resendApiKey || "",
        resendFromEmail: resendConfig.resendFromEmail || "",
        resendFromName: resendConfig.resendFromName || "",
        resendReplyTo: resendConfig.resendReplyTo || "",
      });
      setIsInitialized(true);
    }
  }, [resendConfig, isInitialized]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateConfig({
        resendActive: resendActive ? "true" : "false",
        resendApiKey: localSettings.resendApiKey,
        resendFromEmail: localSettings.resendFromEmail,
        resendFromName: localSettings.resendFromName,
        resendReplyTo: localSettings.resendReplyTo,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save Resend settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleGenerateDefaults = async () => {
    if (!confirm("This will create default settings for Invoice, Sales Order, Company, and Email configuration. Existing settings will NOT be overwritten. Continue?")) return;
    setGeneratingDefaults(true);
    try {
      const result = await generateDefaults();
      toast.success(`Default settings generated! Created: ${result.created}, Skipped (already exist): ${result.skipped}`);
    } catch (error) {
      console.error("Failed to generate defaults:", error);
      toast.error("Failed to generate default settings");
    } finally {
      setGeneratingDefaults(false);
    }
  };

  if (resendConfig === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email & System Setup</h2>
        <p className="text-muted-foreground">
          Configure Resend email service and generate default system settings
        </p>
      </div>

      {/* Generate Default Settings Card */}
      <Card className="border-dashed border-2 border-blue-300 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            System Initialization
          </CardTitle>
          <CardDescription>
            Generate default settings for a new system. This creates pre-set values for Invoice, Sales Order, Company, and Email configuration. Existing settings are preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleGenerateDefaults}
              disabled={generatingDefaults}
              variant={hasDefaults ? "outline" : "default"}
              className="gap-2"
            >
              {generatingDefaults ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate Default Settings
                </>
              )}
            </Button>
            {hasDefaults && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Defaults already initialized
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Resend settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save Resend settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Resend Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resend Email Configuration</CardTitle>
              <CardDescription>
                Configure your Resend (resend.com) email service. These settings are stored securely in the database — no need to set them in .env.local.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${resendActive ? "text-green-600" : "text-muted-foreground"}`}>
                {resendActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={resendActive}
                onCheckedChange={async (checked) => {
                  setResendActive(checked);
                  try {
                    await updateConfig({ resendActive: checked ? "true" : "false" });
                    toast.success(checked ? "Resend email service activated" : "Resend email service deactivated");
                  } catch {
                    setResendActive(!checked);
                    toast.error("Failed to update Resend status");
                  }
                }}
              />
            </div>
          </div>
          {!resendActive && (
            <Alert className="mt-3 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Resend is inactive. Campaigns and newsletters will be logged to the database only (not actually sent).
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resendApiKey">API Key</Label>
            <div className="relative">
              <Input
                id="resendApiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={localSettings.resendApiKey}
                onChange={(e) => setLocalSettings({ ...localSettings, resendApiKey: e.target.value })}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Resend API key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 underline">resend.com/api-keys</a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resendFromEmail">From Email</Label>
            <Input
              id="resendFromEmail"
              type="email"
              placeholder="noreply@yourdomain.com"
              value={localSettings.resendFromEmail}
              onChange={(e) => setLocalSettings({ ...localSettings, resendFromEmail: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              The email address emails will be sent from. Must be a verified domain in Resend.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resendFromName">From Name</Label>
            <Input
              id="resendFromName"
              placeholder="My Company"
              value={localSettings.resendFromName}
              onChange={(e) => setLocalSettings({ ...localSettings, resendFromName: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Display name shown in the &quot;From&quot; field of outgoing emails
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resendReplyTo">Reply-To Email (Optional)</Label>
            <Input
              id="resendReplyTo"
              type="email"
              placeholder="support@yourdomain.com"
              value={localSettings.resendReplyTo}
              onChange={(e) => setLocalSettings({ ...localSettings, resendReplyTo: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Where replies to your emails will be directed. Leave empty to use From Email.
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
              "Save Resend Configuration"
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> The system will use these settings instead of .env.local for sending emails via Resend. Make sure your domain is verified at resend.com.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
