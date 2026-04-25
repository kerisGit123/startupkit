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
  modelType: "image" | "video" | "audio" | "music";
  isActive: boolean;
  visibility?: "public" | "temp_down"; // public = visible to users, temp_down = admin only (dev in progress)
  isHot?: boolean; // true = strategy pricing model (0.625 multiplier, hot badge)
  pricingType: "fixed" | "formula";
  creditCost?: number;
  factor?: number;
  formulaJson?: string;
  assignedFunction?:
    | "getTopazUpscale"
    | "getTopazVideoUpscale"
    | "getSeedance15"
    | "getSeedance20"
    | "getSeedance20Fast"
    | "getKlingMotionControl"
    | "getNanoBananaPrice"
    | "getGptImagePrice"
    | "getVeo31"
    | "getGrokImageToVideo"
    | "getInfinitalkFromAudio"
    | "getElevenLabsTTS";
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
 * Examples (base=8, multiplier=1.2):
 *   1K → 10 credits, 2K → 15 credits, 4K → 22 credits
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
 * Examples (base=10, multiplier=1.2):
 *   1x → 12 credits, 2x → 24 credits, 4x → 48 credits
 */
export function getTopazUpscale(
  base: number,
  multiplier: number,
  quality: string
): number {
  return getFormulaQualityPrice(undefined, multiplier, quality, base);
}

/**
 * Topaz Video Upscale pricing.
 * Per-second pricing based on upscale factor.
 *
 * 1x/2x: 8 credits/s, 4x: 14 credits/s
 *
 * Examples (multiplier=1.2):
 *   2x, 10s → 8 * 10 * 1.2 = 96 credits
 *   4x, 10s → 14 * 10 * 1.2 = 168 credits
 */
export function getTopazVideoUpscale(
  base: number,
  multiplier: number,
  upscaleFactor: string,
  duration: number
): number {
  const factorCosts: Record<string, number> = {
    "1": 8, "1x": 8,
    "2": 8, "2x": 8,
    "4": 14, "4x": 14,
  };

  const costPerSecond = factorCosts[upscaleFactor] || base;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * GPT Image pricing with quality tiers.
 * Examples (base=4, multiplier=1.2):
 *   medium → 5 credits, high → 27 credits
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
 * Examples (base=7, multiplier=1.2):
 *   720p, audio, 8s → 68 credits
 *   1080p, audio, 12s → 269 credits
 */
export function getSeedance15(
  _base: number,
  multiplier: number,
  resolution: string,
  audio: boolean,
  duration: number
): number {
  // Kie credit costs per resolution+duration from API docs (no-audio base).
  // Audio = 2x the no-audio Kie cost.
  // 480p: 4s=7, 8s=14, 12s=19 | 720p: 4s=14, 8s=28, 12s=42 | 1080p: 4s=30, 8s=60, 12s=90
  const kieCosts: Record<string, Record<string, number>> = {
    "480p": { "4": 7, "8": 14, "12": 19 },
    "480P": { "4": 7, "8": 14, "12": 19 },
    "720p": { "4": 14, "8": 28, "12": 42 },
    "720P": { "4": 14, "8": 28, "12": 42 },
    "1080p": { "4": 30, "8": 60, "12": 90 },
    "1080P": { "4": 30, "8": 60, "12": 90 },
  };

  const resCosts = kieCosts[resolution] || kieCosts["480p"];
  const durKey = duration <= 4 ? "4" : duration <= 8 ? "8" : "12";
  const kieBase = resCosts[durKey] || resCosts["4"];
  const audioMultiplier = audio ? 2 : 1;

  return Math.ceil(
    kieBase * audioMultiplier * multiplier
  );
}

/**
 * Kling 3.0 Motion Control pricing.
 * Per-second pricing based on resolution quality.
 *
 * Examples (multiplier=1.2):
 *   720P, 5s → 20 * 5 * 1.2 = 120 credits
 *   1080P, 5s → 27 * 5 * 1.2 = 162 credits
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
 * Examples (multiplier=1.2):
 *   480P, video input, 5s → 11.5 * 5 * 1.2 = 69 credits
 *   720P, no video, 5s → 41 * 5 * 1.2 = 246 credits
 */
/**
 * Seedance 2.0 pricing.
 *
 * KIE pricing (Seedance 2.0):
 *   480p: 19 credits/s (with input) | 11.5 credits/s (no input / text-to-video)
 *   720p: 41 credits/s (with input) | 25 credits/s (no input / text-to-video)
 *
 * With input: total_duration = input_video_duration + output_duration
 * No input: total_duration = output_duration only
 *
 * @param duration - Total duration (inputVideoDuration + outputDuration for video input, outputDuration for text-to-video)
 */
export function getSeedance20(
  base: number,
  multiplier: number,
  resolution: string,
  hasVideoInput: boolean,
  duration: number
): number {
  const resolutionCosts: Record<string, { with_input: number; no_input: number }> = {
    "480p": { with_input: 11.5, no_input: 19 }, "480P": { with_input: 11.5, no_input: 19 },
    "720p": { with_input: 25, no_input: 41 }, "720P": { with_input: 25, no_input: 41 },
  };

  const resCost = resolutionCosts[resolution] || resolutionCosts["480p"];
  const costPerSecond = hasVideoInput ? resCost.with_input : resCost.no_input;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * Seedance 2.0 Fast pricing.
 *
 * KIE pricing (Seedance 2.0 Fast):
 *   480p: 8 credits/s (with video input) | 15.5 credits/s (no video input / text-to-video)
 *   720p: 20 credits/s (with video input) | 33 credits/s (no video input / text-to-video)
 *
 * With video input: total_duration = input_video_duration + output_duration
 * No video input: total_duration = output_duration only
 *
 * Note: "with video input" = any mode with reference images/videos/frames (cheaper per second but
 * charges for input video duration too). "no video input" = text-to-video only (higher per second rate).
 *
 * @param duration - For display: output duration only. Actual KIE charge includes input video duration.
 */
export function getSeedance20Fast(
  base: number,
  multiplier: number,
  resolution: string,
  hasVideoInput: boolean,
  duration: number
): number {
  // with_input = cheaper per-second rate but total = (input_video_duration + output_duration) × rate
  // no_input = higher per-second rate but total = output_duration × rate only
  const resolutionCosts: Record<string, { with_input: number; no_input: number }> = {
    "480p": { with_input: 9, no_input: 15.5 }, "480P": { with_input: 9, no_input: 15.5 },
    "720p": { with_input: 20, no_input: 33 }, "720P": { with_input: 20, no_input: 33 },
  };

  const resCost = resolutionCosts[resolution] || resolutionCosts["480p"];
  // duration param should already include input video duration when hasVideoInput is true
  const costPerSecond = hasVideoInput ? resCost.with_input : resCost.no_input;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * Grok Imagine Image-to-Video pricing.
 * Per-second pricing based on resolution quality.
 *
 * Formula: quality_cost × duration_seconds × factor
 *
 * Examples (factor=1.2):
 *   480p, 6s → 1.6 × 6 × 1.2 = 12 credits
 *   720p, 6s → 3 × 6 × 1.2 = 22 credits
 *   720p, 30s → 3 × 30 × 1.2 = 108 credits
 */
export function getGrokImageToVideo(
  base: number,
  multiplier: number,
  resolution: string,
  duration: number
): number {
  const resolutionCosts: Record<string, number> = {
    "480p": 1.6, "480P": 1.6,
    "720p": 3, "720P": 3,
  };

  const costPerSecond = resolutionCosts[resolution] || base;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * InfiniteTalk From-Audio lip sync pricing.
 * Per-second pricing based on resolution.
 *
 * Formula: resolution_cost × duration_seconds × factor
 *
 * Pricing: 3 credits/s for 480p, 12 credits/s for 720p
 * Examples (factor=1.2):
 *   480p, 10s → 3 × 10 × 1.2 = 36 credits
 *   720p, 10s → 12 × 10 × 1.2 = 144 credits
 */
export function getInfinitalkFromAudio(
  base: number,
  multiplier: number,
  resolution: string,
  duration: number
): number {
  const resolutionCosts: Record<string, number> = {
    "480p": 3, "480P": 3,
    "720p": 12, "720P": 12,
  };

  const costPerSecond = resolutionCosts[resolution] || base;
  return Math.ceil(costPerSecond * duration * multiplier);
}

/**
 * Simple fixed pricing: base * factor, rounded up.
 */
export function getFixedPrice(base: number, factor: number): number {
  return Math.ceil(base * factor);
}

/**
 * ElevenLabs TTS block-based pricing.
 * 12 credits per 1,000-character block (rounded up).
 *
 * Examples (base=12, factor=1):
 *   176 chars → 1 block × 12 = 12 credits
 *   1200 chars → 2 blocks × 12 = 24 credits
 *   2200 chars → 3 blocks × 12 = 36 credits
 *   5000 chars → 5 blocks × 12 = 60 credits
 */
export function getElevenLabsTTS(
  base: number,
  multiplier: number,
  characterCount: number
): number {
  if (characterCount <= 0) return 0;
  const blocks = Math.ceil(characterCount / 1000);
  return Math.ceil(blocks * base * multiplier);
}

// ─── Default Pricing Models ──────────────────────────────────────────────────

export const DEFAULT_PRICING_MODELS: PricingModel[] = [
  {
    modelId: "nano-banana-2",
    modelName: "Nano Banana 2",
    modelType: "image",
    isActive: true,
    isHot: true,
    pricingType: "formula",
    assignedFunction: "getNanoBananaPrice",
    creditCost: 8,
    factor: 0.625,
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
    isHot: true,
    pricingType: "formula",
    assignedFunction: "getNanoBananaPrice",
    creditCost: 18,
    factor: 0.625,
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
    modelId: "z-image",
    modelName: "Z-Image",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 0.9,
    factor: 1,
  },
  {
    modelId: "bytedance/seedance-1.5-pro",
    modelName: "Seedance 1.5 Pro",
    modelType: "video",
    isActive: true,
    isHot: true,
    pricingType: "formula",
    assignedFunction: "getSeedance15",
    creditCost: 7,
    factor: 0.625,
    formulaJson: JSON.stringify({
      pricing: {
        note: "Fixed Kie credits per resolution+duration. Audio = 2x. User = ceil(kie * factor).",
        audio_multiplier: 2,
        resolutions: {
          "480P": { "4s": 7, "8s": 14, "12s": 19 },
          "720P": { "4s": 14, "8s": 28, "12s": 42 },
          "1080P": { "4s": 30, "8s": 60, "12s": 90 },
        },
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
    factor: 1.2,
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
    factor: 1.2,
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
    modelId: "topaz/video-upscale",
    modelName: "Topaz Video Upscale",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getTopazVideoUpscale",
    creditCost: 8,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 8,
        qualities: [
          { name: "1", cost: 8 },
          { name: "2", cost: 8 },
          { name: "4", cost: 14 },
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
    factor: 1.2,
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
    modelId: "gpt-image-2-text-to-image",
    modelName: "GPT Image 2 Text to Image",
    modelType: "image",
    isActive: true,
    isHot: true,
    pricingType: "fixed",
    creditCost: 6,
    factor: 0.625,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_image",
        base_cost: 6,
        note: "Kie cost: 6 credits. User charged: 4 credits (ceil(6 × 0.625)). ~25% margin.",
      },
    }),
  },
  {
    modelId: "gpt-image-2-image-to-image",
    modelName: "GPT Image 2 Image to Image",
    modelType: "image",
    isActive: true,
    isHot: true,
    pricingType: "fixed",
    creditCost: 6,
    factor: 0.625,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_image",
        base_cost: 6,
        max_input_images: 16,
        note: "Kie cost: 6 credits. User charged: 4 credits (ceil(6 × 0.625)). ~25% margin.",
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
    factor: 1.2,
  },
  {
    modelId: "ideogram/character-edit",
    modelName: "Character Edit",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 5,
    factor: 1.2,
  },
  {
    modelId: "flux-2/pro-text-to-image",
    modelName: "Flux 2 Pro",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 10,
    factor: 1.2,
  },
  {
    modelId: "recraft/crisp-upscale",
    modelName: "Crisp Upscale",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 0.5,
    factor: 1.2,
  },
  {
    modelId: "kling-3.0/motion-control",
    modelName: "Kling 3.0 Motion Control",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getKlingMotionControl",
    creditCost: 20,
    factor: 1.2,
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
  modelId: "grok-imagine/image-to-video",
  modelName: "Grok Imagine Image to Video",
  modelType: "video",
  isActive: true,
  pricingType: "formula",
  assignedFunction: "getGrokImageToVideo",
  creditCost: 1.6,
  factor: 1.2,
  formulaJson: JSON.stringify({
    pricing: {
      base_cost: 1.6,
      qualities: [
        { name: "480p", cost: 1.6 },
        { name: "720p", cost: 3 }
      ]
    }
  })
},
  {
    modelId: "bytedance/seedance-2",
    modelName: "Seedance 2.0",
    modelType: "video",
    isActive: true,
    isHot: true,
    pricingType: "formula",
    assignedFunction: "getSeedance20",
    creditCost: 11.5,
    factor: 0.625,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 19,
        "resolutions": {
        "480p": {
          "video_input": 11.5,
          "no_video": 19
        },
        "720p": {
          "video_input": 25,
          "no_video": 41
        }
      },
        duration_rule: "total_duration = input_duration + output_duration",
      },
    }),
  },
  {
    modelId: "bytedance/seedance-2-fast",
    modelName: "Seedance 2.0 Fast",
    modelType: "video",
    isActive: true,
    isHot: true,
    pricingType: "formula",
    assignedFunction: "getSeedance20Fast",
    creditCost: 9,
    factor: 0.625,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 15.5,
        resolutions: {
          "480p": { video_input: 9, no_video: 15.5 },
          "720p": { video_input: 20, no_video: 33 },
        },
        duration_rule: "total_duration = input_duration + output_duration",
      },
    }),
  },
  {
    modelId: "infinitalk/from-audio",
    modelName: "InfiniteTalk From Audio",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getInfinitalkFromAudio",
    creditCost: 3,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 3,
        resolutions: {
          "480p": 3,
          "720p": 12,
        },
        max_duration: 15,
      },
    }),
  },
  {
    modelId: "elevenlabs/text-to-speech-multilingual-v2",
    modelName: "ElevenLabs Text-to-Speech",
    modelType: "audio",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getElevenLabsTTS",
    creditCost: 12,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_1000_character_block",
        base_cost: 12,
        max_characters: 5000,
        blocks: [
          { range: "1-1000", credits: 12 },
          { range: "1001-2000", credits: 24 },
          { range: "2001-3000", credits: 36 },
          { range: "3001-4000", credits: 48 },
          { range: "4001-5000", credits: 60 },
        ],
        note: "12 credits per 1,000-character block (rounded up). Max 5,000 characters.",
      },
    }),
  },
  {
    modelId: "ai-music-api/generate",
    modelName: "AI Music Generator",
    modelType: "music",
    isActive: true,
    pricingType: "fixed",
    creditCost: 12,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 12,
        factor: 1.2,
        charged: 15,
        note: "Generates up to 4 minutes of music (2 variations) per request. KIE AI cost: 12 credits.",
      },
    }),
  },
  {
    modelId: "ai-music-api/upload-cover",
    modelName: "Cover Song",
    modelType: "music",
    isActive: true,
    pricingType: "fixed",
    creditCost: 12,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 12,
        factor: 1.2,
        charged: 15,
        note: "Re-creates uploaded audio with new style/persona. KIE AI cost: 12 credits.",
      },
    }),
  },
  {
    modelId: "ai-music-api/extend",
    modelName: "Extend Music",
    modelType: "music",
    isActive: true,
    pricingType: "fixed",
    creditCost: 12,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 12,
        factor: 1.2,
        charged: 15,
        note: "Extends existing song from a specified timestamp. KIE AI cost: 12 credits.",
      },
    }),
  },
  {
    modelId: "ai-music-api/generate-persona",
    modelName: "Create Persona",
    modelType: "music",
    isActive: true,
    pricingType: "fixed",
    creditCost: 0,
    factor: 1,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 0,
        factor: 1,
        charged: 0,
        note: "Extracts a reusable voice profile from an existing song. Free.",
      },
    }),
  },
  // ── AI Analyze (OpenRouter → Gemini) ──────────────────────────────────────
  {
    modelId: "ai-analyze/image",
    modelName: "AI Analyze Image",
    modelType: "image",
    isActive: true,
    pricingType: "fixed",
    creditCost: 1,
    factor: 1,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 1,
        factor: 1,
        charged: 1,
        note: "Analyzes image to generate a detailed AI prompt. Uses Gemini Flash 1.5 via OpenRouter. Cost: ~$0.0001/request.",
      },
    }),
  },
  {
    modelId: "ai-analyze/video",
    modelName: "AI Analyze Video",
    modelType: "video",
    isActive: true,
    pricingType: "fixed",
    creditCost: 3,
    factor: 1,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 3,
        factor: 1,
        charged: 3,
        note: "Analyzes video to generate a detailed AI prompt. Uses Gemini Pro 1.5 via OpenRouter. Covers up to 60s video. Cost: ~$0.02/request.",
      },
    }),
  },
  {
    modelId: "ai-analyze/audio",
    modelName: "AI Analyze Audio",
    modelType: "audio",
    isActive: true,
    pricingType: "fixed",
    creditCost: 1,
    factor: 1,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "per_request",
        base_cost: 1,
        factor: 1,
        charged: 1,
        note: "Transcribes speech or extracts lyrics from audio. Uses Gemini Pro 1.5 via OpenRouter. Cost: ~$0.005/request.",
      },
    }),
  },
  // ── Prompt Enhance (Anthropic Haiku) ──────────────────────────────────────
  {
    modelId: "prompt-enhance",
    modelName: "Prompt Enhance",
    modelType: "text",
    isActive: true,
    ...Object.fromEntries(Object.entries({
      base: { credits: 1, unit: "per enhancement" },
      note: "Enhances prompts with cinematic detail using Claude Haiku 4.5. Cost: ~$0.001/request.",
    }).map(([k, v]) => [k, v])),
  },
];
