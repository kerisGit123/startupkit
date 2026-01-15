"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";

export default function POSettingsPage() {
  const poConfig = useQuery(api.poConfig.getPOConfig);
  const updateConfig = useMutation(api.poConfig.updatePOConfig);
  const resetCounter = useMutation(api.poConfig.resetPOCounter);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [localSettings, setLocalSettings] = useState({
    poPrefix: "PO-",
    poNumberFormat: "Year + Running",
    poLeadingZeros: 4,
    poCurrentCounter: 1,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (poConfig && !isInitialized) {
      setLocalSettings({
        poPrefix: poConfig.poPrefix || "PO-",
        poNumberFormat: poConfig.poNumberFormat || "Year + Running",
        poLeadingZeros: poConfig.poLeadingZeros || 4,
        poCurrentCounter: poConfig.poCurrentCounter || 1,
      });
      setIsInitialized(true);
    }
  }, [poConfig, isInitialized]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateConfig({
        poPrefix: localSettings.poPrefix,
        poNumberFormat: localSettings.poNumberFormat,
        poLeadingZeros: localSettings.poLeadingZeros,
        poCurrentCounter: localSettings.poCurrentCounter,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save PO settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const generatePreview = () => {
    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2); // Last 2 digits (e.g., 26 for 2026)
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const paddedCounter = localSettings.poCurrentCounter.toString().padStart(localSettings.poLeadingZeros, "0");

    switch (localSettings.poNumberFormat) {
      case "Year + Running":
        return `${localSettings.poPrefix}${yearShort}${paddedCounter}`;
      case "Running Only":
        return `${localSettings.poPrefix}${paddedCounter}`;
      case "Month + Running":
        return `${localSettings.poPrefix}${yearShort}${month}${paddedCounter}`;
      default:
        return `${localSettings.poPrefix}${yearShort}${paddedCounter}`;
    }
  };

  if (poConfig === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Purchase Order Settings</h2>
        <p className="text-muted-foreground">
          Configure purchase order numbering for all transactions (subscriptions, payments, credits)
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            PO settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save PO settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>PO Configuration</CardTitle>
          <CardDescription>
            Manage how purchase order numbers are generated for your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poPrefix">PO Prefix</Label>
            <Input
              id="poPrefix"
              placeholder="PO-"
              value={localSettings.poPrefix}
              onChange={(e) => setLocalSettings({ ...localSettings, poPrefix: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Prefix for all purchase order numbers (e.g., PO-, SALE-, BILL-)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poNumberFormat">PO Number Format</Label>
            <Select
              value={localSettings.poNumberFormat}
              onValueChange={(value) => setLocalSettings({ ...localSettings, poNumberFormat: value })}
            >
              <SelectTrigger id="poNumberFormat">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Year + Running">Year + Running (e.g., PO-250001) 🔥 Recommended</SelectItem>
                <SelectItem value="Running Only">Running Only (e.g., PO-0001)</SelectItem>
                <SelectItem value="Month + Running">Month + Running (e.g., PO-202501001)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Format determines when purchase order numbers reset (yearly, monthly, or never)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poLeadingZeros">Leading Zeros</Label>
            <Input
              id="poLeadingZeros"
              type="number"
              min="1"
              max="10"
              value={localSettings.poLeadingZeros}
              onChange={(e) => setLocalSettings({ ...localSettings, poLeadingZeros: parseInt(e.target.value) || 4 })}
            />
            <p className="text-sm text-muted-foreground">
              Number of digits for running number (1-10)
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-lg font-semibold">Next PO Number</Label>
              <RefreshCw className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {generatePreview()}
            </div>
            <p className="text-sm text-muted-foreground">
              This is what your next purchase order number will look like
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poCurrentCounter">Current Counter</Label>
            <Input
              id="poCurrentCounter"
              type="number"
              min="1"
              value={localSettings.poCurrentCounter}
              onChange={(e) => setLocalSettings({ ...localSettings, poCurrentCounter: parseInt(e.target.value) || 1 })}
            />
            <p className="text-sm text-muted-foreground">
              Current running number (auto-increments with each purchase order)
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saveStatus === "saving"}
              className="flex-1"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save PO Configuration"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocalSettings({ ...localSettings, poCurrentCounter: 1 })}
              disabled={saveStatus === "saving"}
            >
              Reset to 1
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Manually changing the counter may create duplicate purchase order numbers
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
