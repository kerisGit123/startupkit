import { useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { type PricingModel, DEFAULT_PRICING_MODELS } from '@/lib/storyboard/pricing';

// Re-export for consumers that import from this file
export type { PricingModel };

interface Analytics {
  totalRevenue: number;
  totalUsage: number;
  avgCost: number;
  activeModels: number;
  usageByModel: Record<string, number>;
}

export const usePricingData = () => {
  // Single reactive query — Convex deduplicates across all components
  const dbModels = useQuery(api.storyboard.pricing.getAllPricingModels);

  const loading = dbModels === undefined;

  // Merge DB models with defaults (fill assignedFunction, add missing defaults)
  const models = useMemo<PricingModel[]>(() => {
    if (!dbModels) return [];
    if (dbModels.length === 0) return DEFAULT_PRICING_MODELS;

    const dbModelIds = new Set(dbModels.map((m: any) => m.modelId));
    const merged: PricingModel[] = dbModels.map((dbModel: any) => {
      const defaultModel = DEFAULT_PRICING_MODELS.find(d => d.modelId === dbModel.modelId);
      if (defaultModel && !dbModel.assignedFunction && defaultModel.assignedFunction) {
        return { ...dbModel, assignedFunction: defaultModel.assignedFunction };
      }
      return dbModel;
    });
    for (const def of DEFAULT_PRICING_MODELS) {
      if (!dbModelIds.has(def.modelId)) {
        merged.push(def);
      }
    }
    return merged;
  }, [dbModels]);

  const getModelCredits = useCallback((modelId: string, selectedQuality: string = "2K"): number => {
    const model = models.find(m => m.modelId === modelId)
      || DEFAULT_PRICING_MODELS.find(m => m.modelId === modelId);
    if (!model) return 0;

    if (model.pricingType === 'fixed') {
      return Math.ceil((model.creditCost || 0) * (model.factor || 1));
    }

    // Formula-based pricing
    if (model.assignedFunction) {
      const base = model.creditCost || 0;
      const factor = model.factor || 1;

      switch (model.assignedFunction) {
        case 'getNanoBananaPrice':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (qualityData) return Math.ceil(qualityData.cost * factor);
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

              const resolutionMatch = selectedQuality.match(/^([A-Za-z0-9]+)/);
              const resolutionValue = resolutionMatch ? resolutionMatch[1] : "480P";
              const durationMatch = selectedQuality.match(/(\d+s)/);
              const durationKey = durationMatch ? durationMatch[1] : "4s";
              const hasAudio = selectedQuality.includes('_audio') && !selectedQuality.includes('_noaudio');

              // New format: resolutions[resolution][duration] = base kie credits
              if (pricing.resolutions) {
                const resKey = Object.keys(pricing.resolutions).find(
                  k => k.toLowerCase() === resolutionValue.toLowerCase()
                ) || resolutionValue;
                const resDurations = pricing.resolutions[resKey];
                const baseCost = resDurations?.[durationKey] ?? base;
                const audioMultiplier = hasAudio && pricing.audio_multiplier ? pricing.audio_multiplier : 1;
                return Math.ceil(baseCost * audioMultiplier * factor);
              }

              // Legacy format fallback
              const legacyResKey = Object.keys(pricing.resolution_multipliers || {}).find(
                key => key.toLowerCase() === resolutionValue.toLowerCase()
              );
              const resolutionMultiplier = legacyResKey ? pricing.resolution_multipliers[legacyResKey] : 1;
              let durationMultiplier = 1;
              if (durationMatch && pricing.duration_multipliers) {
                durationMultiplier = pricing.duration_multipliers[durationMatch[1]] || 1;
              }
              const audioMult = hasAudio && pricing.audio_multiplier ? pricing.audio_multiplier : 1;
              return Math.ceil(
                (pricing.base_cost || base) * resolutionMultiplier * durationMultiplier * audioMult * factor
              );
            } catch (e) {
              console.error("[usePricingData] Error parsing Seedance formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getTopazUpscale':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (qualityData) return Math.ceil(qualityData.cost * factor);
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
              if (qualityData) return Math.ceil(qualityData.cost * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing Veo 3.1 formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getKlingMotionControl':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualities = formula.pricing?.qualities || [];
              const klingResMatch = selectedQuality.match(/^(\d+[pP])/i);
              const klingDurMatch = selectedQuality.match(/(\d+)s/);
              const klingRes = klingResMatch ? klingResMatch[1] : "720p";
              const klingDuration = klingDurMatch ? parseInt(klingDurMatch[1]) : 4;
              const klingQuality = qualities.find((q: any) => q.name.toLowerCase() === klingRes.toLowerCase());
              const costPerSec = klingQuality ? klingQuality.cost : base;
              return Math.ceil(costPerSec * klingDuration * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing Kling Motion Control formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getGrokImageToVideo':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualities = formula.pricing?.qualities || [];
              const grokResMatch = selectedQuality.match(/^(\d+[pP])/i);
              const grokDurMatch = selectedQuality.match(/(\d+)s/);
              const grokRes = grokResMatch ? grokResMatch[1] : "480p";
              const grokDuration = grokDurMatch ? parseInt(grokDurMatch[1]) : 6;
              const grokQuality = qualities.find((q: any) => q.name.toLowerCase() === grokRes.toLowerCase());
              const costPerSec = grokQuality ? grokQuality.cost : base;
              return Math.ceil(costPerSec * grokDuration * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing Grok Imagine formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getTopazVideoUpscale':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualities = formula.pricing?.qualities || [];
              const topazFactorMatch = selectedQuality.match(/^(\d+)/);
              const topazDurMatch = selectedQuality.match(/(\d+)s/);
              const topazFactor = topazFactorMatch ? topazFactorMatch[1] : "2";
              const topazDuration = topazDurMatch ? parseInt(topazDurMatch[1]) : 0;
              const topazQuality = qualities.find((q: any) => q.name === topazFactor);
              const costPerSec = topazQuality ? topazQuality.cost : base;
              return Math.ceil(costPerSec * topazDuration * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing Topaz Video Upscale formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getSeedance20':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const resolutions = formula.pricing?.resolutions;
              const resMatch = selectedQuality.match(/^(\d+[pP])/i);
              const durMatch = selectedQuality.match(/(\d+)s/);
              const hasVideo = !selectedQuality.includes('novideo');
              const rawRes = resMatch ? resMatch[1] : "480p";
              const duration = durMatch ? parseInt(durMatch[1]) : 5;
              const resKey = Object.keys(resolutions || {}).find(
                k => k.toLowerCase() === rawRes.toLowerCase()
              ) || rawRes;
              const resCost = resolutions?.[resKey];
              const costPerSec = resCost ? (hasVideo ? resCost.video_input : resCost.no_video) : base;
              return Math.ceil(costPerSec * duration * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing Seedance 2.0 formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getSeedance20Fast':
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const resolutions = formula.pricing?.resolutions;
              const resMatch = selectedQuality.match(/^(\d+[pP])/i);
              const durMatch = selectedQuality.match(/(\d+)s/);
              const hasVideo = !selectedQuality.includes('novideo');
              const rawRes = resMatch ? resMatch[1] : "480p";
              const duration = durMatch ? parseInt(durMatch[1]) : 5;
              const resKey = Object.keys(resolutions || {}).find(
                k => k.toLowerCase() === rawRes.toLowerCase()
              ) || rawRes;
              const resCost = resolutions?.[resKey];
              const costPerSec = resCost ? (hasVideo ? resCost.video_input : resCost.no_video) : base;
              return Math.ceil(costPerSec * duration * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing Seedance 2.0 Fast formula:", e);
            }
          }
          return Math.ceil(base * factor);
        case 'getInfinitalkFromAudio': {
          const itResMatch = selectedQuality.match(/^(\d+[pP])/i);
          const itDurMatch = selectedQuality.match(/(\d+)s/);
          const itRes = itResMatch ? itResMatch[1].toLowerCase() : "480p";
          const itDuration = itDurMatch ? parseInt(itDurMatch[1]) : 5;
          const itCosts: Record<string, number> = { "480p": 3, "720p": 12 };
          const itCostPerSec = itCosts[itRes] || base;
          return Math.ceil(itCostPerSec * itDuration * factor);
        }
        case 'getElevenLabsTTS': {
          const charMatch = selectedQuality.match(/(\d+)/);
          const charCount = charMatch ? parseInt(charMatch[1]) : 0;
          if (charCount <= 0) return 0;
          const blocks = Math.ceil(charCount / 1000);
          return Math.ceil(blocks * base * factor);
        }
        case 'getGptImagePrice':
        case 'getGptImage2Price': {
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (qualityData) return Math.ceil(qualityData.cost * factor);
            } catch (e) {
              console.error("[usePricingData] Error parsing GPT Image formula:", e);
            }
          }
          return Math.ceil(base * factor);
        }
        default:
          return Math.ceil((model.creditCost || 0) * (model.factor || 1));
      }
    } else {
      return Math.ceil((model.creditCost || 0) * (model.factor || 1));
    }
  }, [models]);

  // Admin operations — still use fetch to API routes (low frequency, admin-only)
  const resetToDefaults = async () => {
    try {
      const res = await fetch("/api/storyboard/pricing/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetDefaults" }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to reset pricing models: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      return true;
    } catch (err) {
      console.error("Error resetting defaults:", err);
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
      return { success: true };
    } catch (err) {
      console.error("Failed to save model:", err);
      return { success: false };
    }
  };

  const toggleModelActive = async (modelId: string) => {
    try {
      const currentModel = models.find(m => m.modelId === modelId);
      if (!currentModel) throw new Error("Model not found");

      const response = await fetch("/api/storyboard/pricing/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, isActive: !currentModel.isActive }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to toggle model: ${response.status}`);
      }
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
      return true;
    } catch (err) {
      console.error("Failed to delete model:", err);
      throw err;
    }
  };

  const getAnalytics = async (): Promise<Analytics> => {
    try {
      const response = await fetch("/api/storyboard/pricing/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      throw err;
    }
  };

  // fetchPricingModels is no longer needed — Convex useQuery auto-updates
  const fetchPricingModels = async () => {};

  return {
    models,
    loading,
    error: null as string | null,
    getModelCredits,
    resetToDefaults,
    saveModel,
    toggleModelActive,
    deleteModel,
    getAnalytics,
    fetchPricingModels,
  };
};
