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
  assignedFunction?: 'getTopazUpscale' | 'getSeedance15' | 'getNanoBananaPrice';
  createdAt?: number;
  updatedAt?: number;
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
        resolution_multipliers: { "480P": 1, "720P": 1.5, "1080P": 2.5, "4K": 5 },
        audio_multiplier: 1.5,
        duration_multiplier: 5,
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
          { name: "1K", cost: 10 },
          { name: "2K", cost: 18 },
          { name: "4K", cost: 30 },
        ],
      },
    }),
  },
  {
    modelId: "gpt-image/1.5-text-to-image",
    modelName: "GPT Image 1.5",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 4,
    factor: 1.3,
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
    modelId: "qwen/image-to-image",
    modelName: "Qwen Image Edit",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 4,
    factor: 1.6,
  },
  {
    modelId: "gpt-image",
    modelName: "GPT Image",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 35,
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
    modelId: "recraft/crisp-upscale",
    modelName: "Recraft Crisp",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 0.5,
    factor: 1.3,
  },
];

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
    
    // Direct test for Nano Banana 2 and Topaz Upscale
    if (modelId === "nano-banana-2") {
      if (model.formulaJson) {
        try {
          const formula = JSON.parse(model.formulaJson);
          const quality = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
          if (quality) {
            const factor = model.factor || 1;
            const result = Math.ceil(quality.cost * factor);
            console.log("[usePricingData] Nano Banana from formula:", { selectedQuality, cost: quality.cost, factor, result });
            return result;
          }
        } catch (e) {
          console.error("[usePricingData] Error parsing Nano Banana formula:", e);
        }
      }
      // Fallback to direct calculation
      const base = 8;
      const factor = 1.3;
      const qualityMultipliers = { '1K': 1, '2K': 1.5, '4K': 2.25 };
      const qualityMultiplier = qualityMultipliers[selectedQuality as keyof typeof qualityMultipliers] || 1;
      const result = Math.ceil(base * factor * qualityMultiplier);
      console.log("[usePricingData] Nano Banana fallback calculation:", { base, factor, qualityMultiplier, selectedQuality, result });
      return result;
    }
    
    if (modelId === "topaz/image-upscale") {
      if (model.formulaJson) {
        try {
          const formula = JSON.parse(model.formulaJson);
          const quality = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
          if (quality) {
            const factor = model.factor || 1;
            const result = Math.ceil(quality.cost * factor);
            console.log("[usePricingData] Topaz Upscale from formula:", { selectedQuality, cost: quality.cost, factor, result });
            return result;
          }
        } catch (e) {
          console.error("[usePricingData] Error parsing Topaz formula:", e);
        }
      }
      // Fallback to direct calculation
      const base = 10;
      const factor = 1.3;
      const upscaleMultipliers = { '1x': 1, '2x': 2, '3x': 3, '4x': 4 };
      const qualityToUpscale = { '1K': '1x', '2K': '2x', '4K': '4x' };
      const upscaleKey = qualityToUpscale[selectedQuality as keyof typeof qualityToUpscale] || '2x';
      const upscaleMultiplier = upscaleMultipliers[upscaleKey as keyof typeof upscaleMultipliers] || 1;
      const result = Math.ceil(base * factor * upscaleMultiplier);
      console.log("[usePricingData] Topaz fallback calculation:", { base, factor, upscaleKey, upscaleMultiplier, selectedQuality, result });
      return result;
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
          const qualityMultipliers = { '1K': 1, '2K': 1.5, '4K': 2.25 };
          const qualityMultiplier = qualityMultipliers[selectedQuality as keyof typeof qualityMultipliers] || 1;
          const nanoResult = Math.ceil(base * factor * qualityMultiplier);
          console.log("[usePricingData] Nano Banana pricing:", { 
            modelId, 
            base, 
            factor, 
            qualityMultiplier, 
            selectedQuality, 
            calculation: `${base} * ${factor} * ${qualityMultiplier} = ${base * factor * qualityMultiplier}`,
            result: nanoResult 
          });
          return nanoResult;
        case 'getSeedance15':
          const resolutionMultipliers = { '480p': 1, '720p': 1.5, '1080p': 2.5, '4K': 5 };
          const resolutionMultiplier = resolutionMultipliers['720p'] || 1;
          const audioMultiplier = 1;
          const durationMultiplier = 1;
          return Math.ceil(base * factor * resolutionMultiplier * audioMultiplier * durationMultiplier);
        case 'getTopazUpscale':
          const upscaleMultipliers = { '1x': 1, '2x': 2, '3x': 3, '4x': 4 };
          // Map quality to upscale multiplier
          const qualityToUpscale = { '1K': '1x', '2K': '2x', '4K': '4x' };
          const upscaleKey = qualityToUpscale[selectedQuality as keyof typeof qualityToUpscale] || '2x';
          const upscaleMultiplier = upscaleMultipliers[upscaleKey as keyof typeof upscaleMultipliers] || 1;
          const topazResult = Math.ceil(base * factor * upscaleMultiplier);
          console.log("[usePricingData] Topaz Upscale pricing:", { 
            modelId, 
            base, 
            factor, 
            upscaleKey, 
            upscaleMultiplier, 
            selectedQuality, 
            calculation: `${base} * ${factor} * ${upscaleMultiplier} = ${base * factor * upscaleMultiplier}`,
            result: topazResult 
          });
          return topazResult;
        default:
          console.log("[usePricingData] Unknown assigned function, using fallback");
          return Math.ceil((model.creditCost || 0) * (model.factor || 1));
      }
    } else {
      console.log("[usePricingData] No assigned function, using simple calculation");
      return Math.ceil((model.creditCost || 0) * (model.factor || 1));
    }
  }, [models]);

  return {
    models,
    loading,
    error,
    getModelCredits,
  };
};
