"use client";

import { useState, useEffect } from "react";

export interface PricingModel {
  _id: string;
  modelId: string;
  modelName: string;
  modelType: "image" | "video";
  isActive: boolean;
  pricingType: "fixed" | "formula";
  creditCost?: number;
  factor?: number;
  formulaJson?: string;
  assignedFunction?: "getTopazUpscale" | "getSeedance15" | "getNanoBananaPrice";
  createdAt: number;
  updatedAt: number;
}

interface Analytics {
  totalRevenue: number;
  totalUsage: number;
  avgCost: number;
  activeModels: number;
  usageByModel: Record<string, number>;
}

export function usePricingData() {
  const [models, setModels] = useState<PricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/storyboard/pricing/models");
      if (!res.ok) throw new Error("Failed to fetch pricing models");
      const data = await res.json();
      setModels(data);
      return data as PricingModel[];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pricing data");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      const res = await fetch("/api/storyboard/pricing/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetDefaults" }),
      });
      if (!res.ok) throw new Error("Failed to reset pricing models");
      await fetchModels(); // Refresh list
      return true;
    } catch (err) {
      console.error("Failed to reset to defaults:", err);
      return false;
    }
  };

  // Placeholder functions for other operations (still use Convex directly)
  const saveModel = async (data: Partial<PricingModel>, options?: { isEdit?: boolean }) => {
    try {
      const response = await fetch("/api/storyboard/pricing/models", {
        method: options?.isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(async () => ({ details: await response.text() }));
        throw new Error(errorBody.details || errorBody.error || `Failed to save pricing model: ${response.status}`);
      }

      const refreshedModels = await fetchModels();
      return { success: true, models: refreshedModels };
    } catch (err) {
      console.error("Failed to save model:", err);
      return { success: false, models: null };
    }
  };

  const toggleModelActive = async (modelId: string) => {
    try {
      console.log("Toggling model active status for modelId:", modelId);
      
      // Find the current model to get its current status
      const currentModel = models.find(m => m.modelId === modelId);
      if (!currentModel) {
        throw new Error("Model not found");
      }
      
      // Toggle the isActive status
      const updatedData = {
        modelId: modelId,
        isActive: !currentModel.isActive
      };
      
      console.log("Sending update with data:", updatedData);
      
      // Update local state immediately for instant UI feedback
      setModels(prevModels => 
        prevModels.map(model => 
          model.modelId === modelId 
            ? { ...model, isActive: !model.isActive }
            : model
        )
      );
      
      const response = await fetch("/api/storyboard/pricing/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      
      console.log("Toggle API response status:", response.status);
      console.log("Toggle API response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Toggle API error response:", errorText);
        
        // Revert local state on error
        setModels(prevModels => 
          prevModels.map(model => 
            model.modelId === modelId 
              ? { ...model, isActive: model.isActive }
              : model
          )
        );
        
        throw new Error(`Failed to toggle model active status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Toggle API response result:", result);
      
      // No need to fetchModels() since Convex handles real-time updates
      return true;
    } catch (err) {
      console.error("Failed to toggle model active status:", err);
      return false;
    }
  };

  const deleteModel = async (id: string) => {
  try {
    console.log("Deleting pricing model by _id:", id);
    
    // Find the model to delete for local state update
    const modelToDelete = models.find(m => m._id === id);
    if (!modelToDelete) {
      throw new Error("Model not found");
    }
    
    // Remove from local state immediately for instant UI feedback
    setModels(prevModels => prevModels.filter(model => model._id !== id));
    
    const response = await fetch(`/api/storyboard/pricing/models`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }), // Send _id in request body
    });
    
    console.log("Delete API response status:", response.status);
    console.log("Delete API response ok:", response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delete API error response:", errorText);
      
      // Revert local state on error
      setModels(prevModels => [...prevModels, modelToDelete]);
      
      throw new Error(`Failed to delete pricing model: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Delete API response result:", result);
    
    // No need to fetchModels() since Convex handles real-time updates
    return true;
  } catch (err) {
    console.error("Failed to delete model:", err);
    return false;
  }
};

  const analytics: Analytics | null = models
    ? {
        totalRevenue: 0,
        totalUsage: 0,
        avgCost: models.length
          ? models.reduce((s, m) => s + (m.creditCost ?? 0), 0) / models.length
          : 0,
        activeModels: models.filter((m) => m.isActive).length,
        usageByModel: {},
      }
    : null;

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    analytics,
    loading,
    error,
    refetch: fetchModels,
    saveModel,
    toggleModelActive,
    deleteModel,
    resetToDefaults,
  };
}
