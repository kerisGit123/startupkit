/**
 * Storyboard Pricing — Centralized pricing functions and model definitions
 *
 * This is the single source of truth for:
 * - Pricing model interface and defaults
 * - All pricing calculation functions (getNanoBananaPrice, getSeedance15, etc.)
 *
 * All components and API routes should import from here instead of
 * reimplementing pricing logic locally.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingModel {
  _id?: string;
  modelId: string;
  modelName: string;
  modelType: "image" | "video";
  isActive: boolean;
  pricingType: "fixed" | "formula";
  creditCost?: number;
  factor?: number;
  formulaJson?: string;
  assignedFunction?:
    | "getTopazUpscale"
    | "getSeedance15"
    | "getSeedance20"
    | "getKlingMotionControl"
    | "getNanoBananaPrice"
    | "getGptImagePrice"
    | "getVeo31";
  createdAt?: number;
  updatedAt?: number;
}

// ─── Pricing Functions ───────────────────────────────────────────────────────

/**
 * Parse formulaJson and extract cost for a given quality tier.
 * Falls back to base * multiplier if formula is missing or invalid.
 */
export function getFormulaQualityPrice(
  formulaJson: string | undefined,
  multiplier: number,
  quality: string,
  fallbackBase: number
): number {
  if (!formulaJson) {
    return Math.ceil(fallbackBase * multiplier);
  }

  try {
    const formula = JSON.parse(formulaJson);
    const qualityData = formula.pricing?.qualities?.find(
      (q: { name: string; cost: number }) => q.name === quality
    );
    if (qualityData) {
      return Math.ceil(qualityData.cost * multiplier);
    }
  } catch (error) {
    console.error("Failed to parse formulaJson for pricing:", error);
  }

  return Math.ceil(fallbackBase * multiplier);
}

/**
 * Nano Banana image generation pricing.
 * Examples (base=8, multiplier=1.3):
 *   1K → 11 credits, 2K → 16 credits, 4K → 24 credits
 */
export function getNanoBananaPrice(
  base: number,
  multiplier: number,
  quality: string
): number {
  return getFormulaQualityPrice(undefined, multiplier, quality, base);
}

/**
 * Topaz AI upscaling pricing.
 * Examples (base=10, multiplier=1.3):
 *   1x → 13 credits, 2x → 26 credits, 4x → 52 credits
 */
export function getTopazUpscale(
  base: number,
  multiplier: number,
  quality: string
): number {
  return getFormulaQualityPrice(undefined, multiplier, quality, base);
}

/**
 * GPT Image pricing with quality tiers.
 * Examples (base=4, multiplier=1.3):
 *   medium → 6 credits, high → 29 credits
 */
export function getGptImagePrice(
  base: number,
  multiplier: number,
  quality: string
): number {
  const qualityCosts: Record<string, number> = {
    medium: base,
    high: 22,
  };

  const qualityCost = qualityCosts[quality] || base;
  return Math.ceil(qualityCost * multiplier);
}

/**
 * Seedance 1.5 Pro video generation pricing.
 *
 * Resolution multipliers: 480p=1, 720p=2, 1080p=4, 4K=5
 * Audio multiplier: 2 (when enabled)
 * Duration multipliers: 4s=1, 8s=2, 12s=4 (4-second intervals)
 *
 * Examples (base=7, multiplier=1.3):
 *   720p, audio, 8s → 37 credits
 *   1080p, audio, 12s → 73 credits
 */
export function getSeedance15(
  base: number,
  multiplier: number,
  resolution: string,
  audio: boolean,
  duration: number
): number {
  const resolutionMultipliers: Record<string, number> = {
    "480p": 1,
    "720p": 2,
    "1080p": 4,
    "4K": 5,
  };

  let durationMultiplier = 1;
  if (duration <= 4) {
    durationMultiplier = 1;
  } else if (duration <= 8) {
    durationMultiplier = 2;
  } else if (duration <= 12) {
    durationMultiplier = 4;
  } else {
    const additionalBlocks = Math.ceil((duration - 12) / 4);
    durationMultiplier = 4 + additionalBlocks;
  }

  const audioMultiplier = audio ? 2 : 1;
  const resolutionMultiplier = resolutionMultipliers[resolution] || 1;

  return Math.ceil(
    base * multiplier * resolutionMultiplier * audioMultiplier * durationMultiplier
  );
}

/**
 * Kling 3.0 Motion Control pricing.
 * Per-second pricing based on resolution quality.
 *
 * Examples (multiplier=1.3):
 *   720P, 5s → 20 * 5 * 1.3 = 130 credits
 *   1080P, 5s → 27 * 5 * 1.3 = 176 credits
 */
export function getKlingMotionControl(
  base: number,
  multiplier: number,
  resolution: string,
  duration: number
): number {
  const resolutionCosts: Record<string, number> = {
    "720p": 20, "720P": 20,
    "1080p": 27, "1080P": 27,
  };

  const costPerSecond = resolutionCosts[resolution] || base;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * Seedance 2.0 video generation pricing.
 * Per-second pricing based on resolution and whether video input is provided.
 *
 * 480P: 11.5 credits/s (with video input) / 19 credits/s (no video input)
 * 720P: 25 credits/s (with video input) / 41 credits/s (no video input)
 * Total duration = input_duration + output_duration
 *
 * Examples (multiplier=1.3):
 *   480P, video input, 5s → 11.5 * 5 * 1.3 = 75 credits
 *   720P, no video, 5s → 41 * 5 * 1.3 = 267 credits
 */
export function getSeedance20(
  base: number,
  multiplier: number,
  resolution: string,
  hasVideoInput: boolean,
  duration: number
): number {
  // no_video = cheaper (text-to-video), video_input = more expensive (image/video-to-video)
  const resolutionCosts: Record<string, { no_video: number; video_input: number }> = {
    "480p": { no_video: 11.5, video_input: 19 }, "480P": { no_video: 11.5, video_input: 19 },
    "720p": { no_video: 25, video_input: 41 }, "720P": { no_video: 25, video_input: 41 },
  };

  const resCost = resolutionCosts[resolution] || resolutionCosts["480p"];
  const costPerSecond = hasVideoInput ? resCost.video_input : resCost.no_video;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * Simple fixed pricing: base * factor, rounded up.
 */
export function getFixedPrice(base: number, factor: number): number {
  return Math.ceil(base * factor);
}

// ─── Default Pricing Models ──────────────────────────────────────────────────

export const DEFAULT_PRICING_MODELS: PricingModel[] = [
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
          { name: "quality", cost: 250 },
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
          { name: "2", cost: 12 },
          { name: "4", cost: 15 },
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
          { name: "high", cost: 22 },
        ],
      },
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
    modelId: "recraft/crisp-upscale",
    modelName: "Crisp Upscale",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 0.5,
    factor: 1.3,
  },
  {
    modelId: "kling-3.0/motion-control",
    modelName: "Kling 3.0 Motion Control",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getKlingMotionControl",
    creditCost: 20,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 20,
        qualities: [
          { name: "720p", cost: 20 },
          { name: "1080p", cost: 27 },
        ],
      },
    }),
  },
  {
    modelId: "bytedance/seedance-2",
    modelName: "Seedance 2.0",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getSeedance20",
    creditCost: 11.5,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 11.5,
        "resolutions": {
        "480p": {
          "no_video": 11.5,
          "video_input": 19
          
        },
        "720p": {
          "no_video": 25,
          "video_input": 41
          
        }
      },
        duration_rule: "total_duration = input_duration + output_duration",
      },
    }),
  },
];
