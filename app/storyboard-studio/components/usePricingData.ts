import { useState, useEffect, useCallback } from 'react';

// Define the pricing model interface
export interface PricingModel {
  _id?: string;
  modelId: string;
  modelName: string;
  modelType: 'image' | 'video';
  isActive: boolean;
  pricingType: 'fixed' | 'formula';
  creditCost?: number;
  factor?: number;
  formulaJson?: string;
  assignedFunction?: 'getTopazUpscale' | 'getSeedance15' | 'getNanoBananaPrice' | 'getGptImagePrice' | 'getVeo31';
  createdAt?: number;
  updatedAt?: number;
}

interface Analytics {
  totalRevenue: number;
  totalUsage: number;
  avgCost: number;
  activeModels: number;
  usageByModel: Record<string, number>;
}

// Default pricing models with assignedFunction for formula-based models
const DEFAULT_PRICING_MODELS: PricingModel[] = [
  {
    modelId: "nano-banana-2",
    modelName: "Nano Banana 2",
    modelType: "image",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getNanoBananaPrice",
    creditCost: 8,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 8,
        qualities: [
          { name: "1K", cost: 8 },
          { name: "2K", cost: 12 },
          { name: "4K", cost: 18 },
        ],
      },
    }),
  },
  {
    modelId: "nano-banana-pro",
    modelName: "Nano Banana Pro",
    modelType: "image",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getNanoBananaPrice",
    creditCost: 18,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 18,
        qualities: [
          { name: "1K", cost: 18 },
          { name: "2K", cost: 18 },
          { name: "4K", cost: 24 },
        ],
      },
    }),
  },
  {
    modelId: "bytedance/seedance-1.5-pro",
    modelName: "Seedance 1.5 Pro",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getSeedance15",
    creditCost: 7,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 7,
        resolution_multipliers: { "480P": 1, "720P": 2, "1080P": 4 },
        audio_multiplier: 2,
        duration_multipliers: { "4s": 1, "8s": 2, "12s": 4 },
      },
    }),
  },
  {
     modelId: "google/veo-3.1",
  modelName: "Veo 3.1",
  modelType: "video",
  isActive: true,
  pricingType: "formula",
    assignedFunction: "getVeo31",
    creditCost: 60,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 60,
      qualities: [
        { name: "fast", cost: 60 },
        { name: "quality", cost: 250 }
      ],
      },
    }),
  },
  {
    modelId: "topaz/image-upscale",
    modelName: "Topaz Upscale",
    modelType: "image",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getTopazUpscale",
    creditCost: 10,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 10,
        qualities: [
          { name: "1", cost: 10 },
          { name: "2", cost: 20 },
          { name: "4", cost: 40 },
        ],
      },
    }),
  },
  {
    modelId: "gpt-image/1.5-image-to-image",
    modelName: "GPT 1.5 Image to Image",
    modelType: "image",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getGptImagePrice",
    creditCost: 4,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 4,
        qualities: [
          { name: "medium", cost: 4 },
          { name: "high", cost: 22 }
        ]
      }
    }),
  },
  {
    modelId: "google/nano-banana-edit",
    modelName: "Nano Banana Edit",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 4,
    factor: 1.3,
  },
  {
    modelId: "ideogram/character-edit",
    modelName: "Character Edit",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 5,
    factor: 1.3,
  },
  {
    modelId: "flux-2/pro-text-to-image",
    modelName: "Flux 2 Pro",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 10,
    factor: 1.3,
  },
  {
    modelId: "topaz/image-upscale",
    modelName: "Topaz Upscale",
    modelType: "image",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getTopazUpscale",
    creditCost: 10,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 10,
        qualities: [
          { name: "1", cost: 10 },
          { name: "2", cost: 18 },
          { name: "4", cost: 30 },
        ],
      },
    }),
  },
  {
    modelId: "recraft/crisp-upscale",
    modelName: "Crisp Upscale",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 8,
    factor: 1.3,
  },
];

// Export DEFAULT_PRICING_MODELS for use in reset function
export { DEFAULT_PRICING_MODELS };

export const usePricingData = () => {
  const [models, setModels] = useState<PricingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingModels = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/storyboard/pricing/models');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pricing models');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.warn("[usePricingData] Invalid response format, using defaults");
          setModels(DEFAULT_PRICING_MODELS);
          return;
        }

        // If database is empty, seed it once
        if (data.length === 0) {
          console.log("[usePricingData] Database is empty, seeding pricing models...");
          const seedResponse = await fetch('/api/storyboard/pricing/seed-pricing-models', {
            method: 'POST',
          });
          if (!seedResponse.ok) {
            console.warn("[usePricingData] Failed to seed pricing models, using defaults");
            setModels(DEFAULT_PRICING_MODELS);
          } else {
            // Refetch after seeding
            const refetchResponse = await fetch('/api/storyboard/pricing/models');
            if (refetchResponse.ok) {
              const refetchedData = await refetchResponse.json();
              setModels(refetchedData);
              console.log("[usePricingData] Seeded and loaded", refetchedData.length, "models");
            } else {
              setModels(DEFAULT_PRICING_MODELS);
            }
          }
        } else {
          console.log("[usePricingData] Using default models to ensure assignedFunction is present");
          const defaultsWithAssignedFunction = DEFAULT_PRICING_MODELS.map(model => {
            if (model.modelId === "nano-banana-2" || model.modelId === "topaz/image-upscale") {
              console.log(`[usePricingData] Default model ${model.modelId}:`, {
                pricingType: model.pricingType,
                assignedFunction: model.assignedFunction,
                creditCost: model.creditCost,
                factor: model.factor
              });
            }
            return model;
          });
          setModels(defaultsWithAssignedFunction);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching pricing models:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing models');
        // Use default models as fallback
        setModels(DEFAULT_PRICING_MODELS);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingModels();
  }, []);

  const getModelCredits = useCallback((modelId: string, selectedQuality: string = "2K"): number => {
    const model = models.find(m => m.modelId === modelId);
    if (!model) {
      console.log("[usePricingData] Model not found:", modelId);
      return 0;
    }
    
    if (model.pricingType === 'fixed') {
      const result = Math.ceil((model.creditCost || 0) * (model.factor || 1));
      console.log("[usePricingData] Fixed pricing result:", result);
      return result;
    }
    
    // Formula-based pricing (use selected quality for multipliers)
    if (model.assignedFunction) {
      const base = model.creditCost || 0;
      const factor = model.factor || 1;
      
      switch (model.assignedFunction) {
        case 'getNanoBananaPrice':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (qualityData) {
                const nanoResult = Math.ceil(qualityData.cost * factor);
                console.log("[usePricingData] Nano Banana pricing from formula:", {
                  modelId,
                  selectedQuality,
                  cost: qualityData.cost,
                  factor,
                  result: nanoResult,
                });
                return nanoResult;
              }
            } catch (e) {
              console.error("[usePricingData] Error parsing Nano Banana formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getSeedance15':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const pricing = formula.pricing;
              
              // Get resolution multiplier (case-insensitive lookup, default to 1 if not found)
              // Extract resolution from the beginning of selectedQuality (e.g., "1080P" from "1080P_4s_audio")
              const resolutionMatch = selectedQuality.match(/^([A-Za-z0-9]+)/);
              const resolutionValue = resolutionMatch ? resolutionMatch[1] : selectedQuality;
              const resolutionKey = Object.keys(pricing.resolution_multipliers || {}).find(
                key => key.toLowerCase() === resolutionValue.toLowerCase()
              );
              const resolutionMultiplier = resolutionKey ? pricing.resolution_multipliers[resolutionKey] : 1;
              
              // For video, we need to parse duration and audio from selectedQuality
              // Format: "720p_8s_audio" or "720p_8s" (no audio)
              let durationMultiplier = 1;
              let audioMultiplier = 1;
              
              // Extract duration from selectedQuality if available
              const durationMatch = selectedQuality.match(/(\d+s)/);
              if (durationMatch && pricing.duration_multipliers) {
                durationMultiplier = pricing.duration_multipliers[durationMatch[1]] || 1;
              }
              
              // Check if audio is included (only apply multiplier for "audio", not "noaudio")
              if (selectedQuality.includes('_audio') && !selectedQuality.includes('_noaudio') && pricing.audio_multiplier) {
                audioMultiplier = pricing.audio_multiplier;
              }
              
              const result = Math.ceil(
                pricing.base_cost * 
                resolutionMultiplier * 
                durationMultiplier * 
                audioMultiplier * 
                factor
              );
              
              console.log("[usePricingData] Seedance pricing calculation:", {
                modelId,
                selectedQuality,
                baseCost: pricing.base_cost,
                resolutionMultiplier,
                durationMultiplier,
                audioMultiplier,
                factor,
                result
              });
              
              return result;
            } catch (e) {
              console.error("[usePricingData] Error parsing Seedance formula:", e);
            }
          }
          
          // Fallback to basic calculation
          return Math.ceil(base * factor);
        case 'getTopazUpscale':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (qualityData) {
                const topazResult = Math.ceil(qualityData.cost * factor);
                console.log("[usePricingData] Topaz pricing from formula:", {
                  modelId,
                  selectedQuality,
                  cost: qualityData.cost,
                  factor,
                  result: topazResult,
                });
                return topazResult;
              }
            } catch (e) {
              console.error("[usePricingData] Error parsing Topaz formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getVeo31':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (qualityData) {
                const veoResult = Math.ceil(qualityData.cost * factor);
                console.log("[usePricingData] Veo 3.1 pricing from formula:", {
                  modelId,
                  selectedQuality,
                  cost: qualityData.cost,
                  factor,
                  result: veoResult,
                });
                return veoResult;
              }
            } catch (e) {
              console.error("[usePricingData] Error parsing Veo 3.1 formula:", e);
            }
          }
          return Math.ceil(base * factor);
        default:
          console.log("[usePricingData] Unknown assigned function, using fallback");
          return Math.ceil((model.creditCost || 0) * (model.factor || 1));
      }
    } else {
      console.log("[usePricingData] No assigned function, using simple calculation");
      return Math.ceil((model.creditCost || 0) * (model.factor || 1));
    }
  }, [models]);

  // Additional management functions from hooks version
  const resetToDefaults = async () => {
    try {
      console.log("🔄 Starting reset using Convex resetToDefaults function...");
      
      // Use the Convex resetToDefaults function directly
      const res = await fetch("/api/storyboard/pricing/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetDefaults" }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Reset failed:", errorData);
        throw new Error(`Failed to reset pricing models: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const result = await res.json();
      console.log("✅ Reset successful:", result);
      
      // Refresh models
      await fetchPricingModels();
      console.log("🎉 Reset completed successfully!");
      return true;
    } catch (err) {
      console.error("❌ Error resetting defaults:", err);
      return false;
    }
  };

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

      // Refresh models after save
      await fetchPricingModels();
      return { success: true };
    } catch (err) {
      console.error("Failed to save model:", err);
      return { success: false };
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
        
        throw new Error(errorText || `Failed to toggle model: ${response.status}`);
      }
      
      console.log("✅ Model toggle successful");
      return true;
    } catch (err) {
      console.error("Failed to toggle model:", err);
      throw err;
    }
  };

  const deleteModel = async (modelId: string) => {
    try {
      const response = await fetch("/api/storyboard/pricing/models", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to delete model: ${response.status}`);
      }

      // Refresh models after deletion
      await fetchPricingModels();
      return true;
    } catch (err) {
      console.error("Failed to delete model:", err);
      throw err;
    }
  };

  const getAnalytics = async (): Promise<Analytics> => {
    try {
      const response = await fetch("/api/storyboard/pricing/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      throw err;
    }
  };

  // Helper function to fetch models (extracted from useEffect)
  const fetchPricingModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/storyboard/pricing/models');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing models');
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn("[usePricingData] Invalid response format, using defaults");
        setModels(DEFAULT_PRICING_MODELS);
        return;
      }

      // If database is empty, seed it once
      if (data.length === 0) {
        console.log("[usePricingData] Database is empty, seeding pricing models...");
        const seedResponse = await fetch('/api/storyboard/pricing/seed-pricing-models', {
          method: 'POST',
        });
        if (!seedResponse.ok) {
          console.warn("[usePricingData] Failed to seed pricing models, using defaults");
          setModels(DEFAULT_PRICING_MODELS);
        } else {
          // Refetch after seeding
          const refetchResponse = await fetch('/api/storyboard/pricing/models');
          if (refetchResponse.ok) {
            const refetchedData = await refetchResponse.json();
            setModels(refetchedData);
            console.log("[usePricingData] Seeded and loaded", refetchedData.length, "models");
          } else {
            setModels(DEFAULT_PRICING_MODELS);
          }
        }
      } else {
        console.log("[usePricingData] Using default models to ensure assignedFunction is present");
        const defaultsWithAssignedFunction = DEFAULT_PRICING_MODELS.map(model => {
          if (model.modelId === "nano-banana-2" || model.modelId === "topaz/image-upscale") {
            console.log(`[usePricingData] Default model ${model.modelId}:`, {
              pricingType: model.pricingType,
              assignedFunction: model.assignedFunction,
              creditCost: model.creditCost,
              factor: model.factor
            });
          }
          return model;
        });
        setModels(defaultsWithAssignedFunction);
      }
      
      setError(null);
    } catch (err) {
      console.error("[usePricingData] Error fetching pricing models:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pricing data");
      setModels(DEFAULT_PRICING_MODELS);
    } finally {
      setLoading(false);
    }
  };

  return {
    models,
    loading,
    error,
    getModelCredits,
    resetToDefaults,
    saveModel,
    toggleModelActive,
    deleteModel,
    getAnalytics,
    fetchPricingModels,
  };
};
