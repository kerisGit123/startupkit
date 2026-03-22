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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pricing data");
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    try {
      const res = await fetch("/api/storyboard/pricing/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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
  const saveModel = async (data: Partial<PricingModel>) => {
    try {
      console.log("Saving pricing model with data:", data);
      
      const response = await fetch("/api/storyboard/pricing/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      console.log("API response status:", response.status);
      console.log("API response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to save pricing model: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("API response result:", result);
      
      await fetchModels(); // Refresh the list
      return true;
    } catch (err) {
      console.error("Failed to save model:", err);
      return false;
    }
  };

  const toggleModelActive = async (modelId: string) => {
    console.log("Toggle model active (placeholder):", modelId);
    return true;
  };

  const deleteModel = async (id: string) => {
  try {
    console.log("Deleting pricing model by _id:", id);
    
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
      throw new Error(`Failed to delete pricing model: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Delete API response result:", result);
    
    await fetchModels(); // Refresh the list
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
