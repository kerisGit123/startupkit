"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, RotateCcw } from "lucide-react";
import { WidgetCustomizer } from "@/components/widget-designer/WidgetCustomizer";
import { WidgetPreview } from "@/components/widget-designer/WidgetPreview";
import { MobilePreview } from "@/components/widget-designer/MobilePreview";

export default function ChatbotDesignerPage() {
  const [selectedType, setSelectedType] = useState<"frontend" | "user_panel">("frontend");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  
  const config = useQuery(api.chatbot.getConfig, { type: selectedType });
  const updateConfig = useMutation(api.chatbot.updateConfig);
  
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);
  
  const handleConfigChange = (updates: any) => {
    setLocalConfig({ ...localConfig, ...updates });
  };
  
  const handleReset = () => {
    setLocalConfig(config);
  };

  const handleSave = async () => {
    if (!localConfig) return;
    
    setIsSaving(true);
    try {
      // Exclude system fields that shouldn't be sent to the mutation
      const { _id, _creationTime, updatedAt, updatedBy, logoStorageId, ...configToSave } = localConfig;
      
      await updateConfig({
        ...configToSave,
        type: selectedType,
      });
      alert("Widget design saved successfully!");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save widget design");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chat Widget Designer</h1>
          <p className="text-sm text-gray-500">Customize your widget in real-time</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedType === "frontend" ? "default" : "outline"}
            onClick={() => setSelectedType("frontend")}
            size="sm"
          >
            Frontend
          </Button>
          <Button
            variant={selectedType === "user_panel" ? "default" : "outline"}
            onClick={() => setSelectedType("user_panel")}
            size="sm"
          >
            User Panel
          </Button>
          <Button variant="outline" onClick={handleReset} size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? "Saving..." : "Save Design"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-white border-r overflow-y-auto">
          <WidgetCustomizer
            config={localConfig}
            onChange={handleConfigChange}
          />
        </div>

        <div className="flex-1 bg-gray-100 overflow-y-auto">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <div className="flex gap-2">
                <Button
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  Mobile
                </Button>
              </div>
            </div>
            
            {previewMode === "desktop" ? (
              <WidgetPreview config={localConfig} />
            ) : (
              <MobilePreview config={localConfig} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

