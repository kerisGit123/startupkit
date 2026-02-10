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
  const soConfig = useQuery(api.soConfig.getSOConfig);
  const updateConfig = useMutation(api.soConfig.updateSOConfig);
  const resetCounter = useMutation(api.soConfig.resetSOCounter);

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
      await updateConfig({
        soPrefix: localSettings.soPrefix,
        soNumberFormat: localSettings.soNumberFormat,
        soLeadingZeros: localSettings.soLeadingZeros,
        soCurrentCounter: localSettings.soCurrentCounter,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save SO settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const generatePreview = () => {
    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2); // Last 2 digits (e.g., 26 for 2026)
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const paddedCounter = localSettings.soCurrentCounter.toString().padStart(localSettings.soLeadingZeros, "0");

    switch (localSettings.soNumberFormat) {
      case "Year + Running":
        return `${localSettings.soPrefix}${yearShort}${paddedCounter}`;
      case "Running Only":
        return `${localSettings.soPrefix}${paddedCounter}`;
      case "Month + Running":
        return `${localSettings.soPrefix}${yearShort}${month}${paddedCounter}`;
      default:
        return `${localSettings.soPrefix}${yearShort}${paddedCounter}`;
    }
  };

  if (soConfig === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sales Order Settings</h2>
        <p className="text-muted-foreground">
          Configure sales order numbering for all transactions (subscriptions, payments, credits)
        </p>
      </div>

      {saveStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            SO settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save SO settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>SO Configuration</CardTitle>
          <CardDescription>
            Manage how sales order numbers are generated for your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poPrefix">SO Prefix</Label>
            <Input
              id="soPrefix"
              placeholder="SO-"
              value={localSettings.soPrefix}
              onChange={(e) => setLocalSettings({ ...localSettings, soPrefix: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Prefix for all sales order numbers (e.g., SO-, SALE-, BILL-)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poNumberFormat">SO Number Format</Label>
            <Select
              value={localSettings.soNumberFormat}
              onValueChange={(value) => setLocalSettings({ ...localSettings, soNumberFormat: value })}
            >
              <SelectTrigger id="soNumberFormat">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Year + Running">Year + Running (e.g., SO-250001) 🔥 Recommended</SelectItem>
                <SelectItem value="Running Only">Running Only (e.g., SO-0001)</SelectItem>
                <SelectItem value="Month + Running">Month + Running (e.g., SO-25010001)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Format determines when sales order numbers reset (yearly, monthly, or never)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poLeadingZeros">Leading Zeros</Label>
            <Input
              id="poLeadingZeros"
              type="number"
              min="1"
              max="10"
              value={localSettings.soLeadingZeros}
              onChange={(e) => setLocalSettings({ ...localSettings, soLeadingZeros: parseInt(e.target.value) || 4 })}
            />
            <p className="text-sm text-muted-foreground">
              Number of digits for running number (1-10)
            </p>
          </div>

          <div className="bg-linear-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-lg font-semibold">Next SO Number</Label>
              <RefreshCw className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {generatePreview()}
            </div>
            <p className="text-sm text-muted-foreground">
              This is what your next sales order number will look like
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="poCurrentCounter">Current Counter</Label>
            <Input
              id="poCurrentCounter"
              type="number"
              min="1"
              value={localSettings.soCurrentCounter}
              onChange={(e) => setLocalSettings({ ...localSettings, soCurrentCounter: parseInt(e.target.value) || 1 })}
            />
            <p className="text-sm text-muted-foreground">
              Current running number (auto-increments with each sales order)
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
                "Save SO Configuration"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocalSettings({ ...localSettings, soCurrentCounter: 1 })}
              disabled={saveStatus === "saving"}
            >
              Reset to 1
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Manually changing the counter may create duplicate sales order numbers
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
