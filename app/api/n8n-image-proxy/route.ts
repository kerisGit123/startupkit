import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
// Increase body size limit to 50MB for large image uploads

// ── Centralized Model Configuration ─────────────────────────────────────────────────────

type ModelCapability = 'text-to-image' | 'image-to-image' | 'multi-reference' | 'single-reference' | 'text-only';
type ModelFamily = 'seedream' | 'flux' | 'nano-banana' | 'gpt-image' | 'qwen' | 'grok' | 'ideogram' | 'topaz';

interface KieModelConfig {
  frontendModel: string;
  kieApiModel: string;
  displayName: string;
  family: ModelFamily;
  capabilities: ModelCapability[];
  refMode: 'multi' | 'single' | 'text';
  supportsImages: boolean;
  supportsMultipleReferences: boolean;
  supportsTextOnly: boolean;
  defaultAspectRatio?: string;
  defaultQuality?: string;
  requestTemplate: {
    required: string[];
    optional: string[];
    excluded: string[];
  };
  fallbackModel?: string;
}

const MODEL_CONFIGS: Record<string, KieModelConfig> = {
  // Seedream 5 Lite Family
  'seedream-5.0-lite-text': {
    frontendModel: 'seedream-5.0-lite-text',
    kieApiModel: 'seedream/5-lite-text-to-image',
    displayName: 'Seedream 5 Lite',
    family: 'seedream',
    capabilities: ['text-to-image', 'text-only'],
    refMode: 'text',
    supportsImages: false,
    supportsMultipleReferences: false,
    supportsTextOnly: true,
    defaultAspectRatio: '1:1',
    defaultQuality: 'basic',
    requestTemplate: {
      required: ['prompt', 'aspect_ratio', 'quality'],
      optional: [],
      excluded: ['image_urls', 'input_urls', 'image_size', 'image_resolution', 'max_images', 'num_outputs', 'guidance_scale']
    }
  },
  
  'seedream-5.0-lite-image': {
    frontendModel: 'seedream-5.0-lite-image',
    kieApiModel: 'seedream/5-lite-image-to-image',
    displayName: 'Seedream 5 Lite',
    family: 'seedream',
    capabilities: ['image-to-image', 'multi-reference', 'single-reference'],
    refMode: 'multi',
    supportsImages: true,
    supportsMultipleReferences: true,
    supportsTextOnly: false,
    defaultQuality: 'basic',
    requestTemplate: {
      required: ['prompt', 'image_urls'],
      optional: ['aspect_ratio', 'quality'],
      excluded: ['input_urls', 'image_size', 'image_resolution', 'max_images', 'num_outputs', 'guidance_scale']
    },
    fallbackModel: 'seedream/4.5-text-to-image'
  },
  
  // Nano Banana Family
  'nano-banana-2': {
    frontendModel: 'nano-banana-2',
    kieApiModel: 'nano-banana-2',
    displayName: 'Nano Banana 2',
    family: 'nano-banana',
    capabilities: ['image-to-image', 'multi-reference'],
    refMode: 'multi',
    supportsImages: true,
    supportsMultipleReferences: true,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'nano-banana-edit': {
    frontendModel: 'nano-banana-edit',
    kieApiModel: 'google/nano-banana-edit',
    displayName: 'Nano Banana Edit',
    family: 'nano-banana',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio', 'callBackUrl', 'output_format'],
      excluded: []
    }
  },
  
  // GPT Image Family
  'gpt-image': {
    frontendModel: 'gpt-image',
    kieApiModel: 'gpt-image',
    displayName: 'GPT Image 1.5',
    family: 'gpt-image',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['aspect_ratio'],
      excluded: []
    }
  },
  
  'gpt-image-1-1': {
    frontendModel: 'gpt-image-1-1',
    kieApiModel: 'gpt-image',
    displayName: 'GPT Image 1.5',
    family: 'gpt-image',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    defaultAspectRatio: '1:1',
    requestTemplate: {
      required: ['prompt'],
      optional: ['aspect_ratio'],
      excluded: []
    }
  },
  
  // Flux Family
  'flux-2-flex-text-to-image': {
    frontendModel: 'flux-2-flex-text-to-image',
    kieApiModel: 'flux-2/flex-text-to-image',
    displayName: 'Flux 2 Flex',
    family: 'flux',
    capabilities: ['text-to-image', 'text-only'],
    refMode: 'text',
    supportsImages: false,
    supportsMultipleReferences: false,
    supportsTextOnly: true,
    requestTemplate: {
      required: ['prompt'],
      optional: ['aspect_ratio'],
      excluded: ['image_urls']
    }
  },
  
  'flux-2-flex-image-to-image': {
    frontendModel: 'flux-2-flex-image-to-image',
    kieApiModel: 'flux-2/flex-image-to-image',
    displayName: 'Flux 2 Flex',
    family: 'flux',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'flux-kontext-pro': {
    frontendModel: 'flux-kontext-pro',
    kieApiModel: 'flux-kontext-pro',
    displayName: 'Flux Kontext',
    family: 'flux',
    capabilities: ['image-to-image', 'multi-reference'],
    refMode: 'multi',
    supportsImages: true,
    supportsMultipleReferences: true,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  // Qwen Family
  'qwen-z-image': {
    frontendModel: 'qwen-z-image',
    kieApiModel: 'qwen/image-edit',
    displayName: 'Qwen Image Edit',
    family: 'qwen',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'qwen': {
    frontendModel: 'qwen',
    kieApiModel: 'qwen/image-to-image',
    displayName: 'Qwen',
    family: 'qwen',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'qwen-text': {
    frontendModel: 'qwen-text',
    kieApiModel: 'qwen/text-to-image',
    displayName: 'Qwen',
    family: 'qwen',
    capabilities: ['text-to-image', 'text-only'],
    refMode: 'text',
    supportsImages: false,
    supportsMultipleReferences: false,
    supportsTextOnly: true,
    requestTemplate: {
      required: ['prompt'],
      optional: ['aspect_ratio'],
      excluded: ['image_urls']
    }
  },
  
  // Legacy models (for backward compatibility)
  'seedream-4.5': {
    frontendModel: 'seedream-4.5',
    kieApiModel: 'seedream/4.5-text-to-image',
    displayName: 'Seedream 4.5',
    family: 'seedream',
    capabilities: ['image-to-image', 'multi-reference'],
    refMode: 'multi',
    supportsImages: true,
    supportsMultipleReferences: true,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'seedream-v4': {
    frontendModel: 'seedream-v4',
    kieApiModel: 'bytedance/seedream-v4',
    displayName: 'Seedream V4',
    family: 'seedream',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_url', 'image_size', 'image_resolution'],
      excluded: []
    }
  },
  
  // Other models
  'flux-fill': {
    frontendModel: 'flux-fill',
    kieApiModel: 'black-forest-labs/flux-1.1-fill',
    displayName: 'Flux Fill',
    family: 'flux',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'character-edit': {
    frontendModel: 'character-edit',
    kieApiModel: 'ideogram/character-edit',
    displayName: 'Character Edit',
    family: 'ideogram',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'character-remix': {
    frontendModel: 'character-remix',
    kieApiModel: 'ideogram/character-remix',
    displayName: 'Character Remix',
    family: 'ideogram',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt', 'image_url'],
      optional: ['reference_image_urls', 'rendering_speed', 'style', 'expand_prompt', 'image_size', 'num_images', 'strength'],
      excluded: ['image_urls', 'aspect_ratio', 'quality']
    }
  },
  
  'flux-2-pro-image-to-image': {
    frontendModel: 'flux-2-pro-image-to-image',
    kieApiModel: 'flux-2/pro-image-to-image',
    displayName: 'Flux 2 Pro Image-to-Image',
    family: 'flux',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'gpt-image-1-5-text-to-image': {
    frontendModel: 'gpt-image-1-5-text-to-image',
    kieApiModel: 'gpt-image/1.5-text-to-image',
    displayName: 'GPT Image 1.5 Text-to-Image',
    family: 'gpt-image',
    capabilities: ['text-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'grok': {
    frontendModel: 'grok',
    kieApiModel: 'grok-imagine/image-to-image',
    displayName: 'Grok',
    family: 'grok',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  
  'topaz-upscale': {
    frontendModel: 'topaz-upscale',
    kieApiModel: 'topaz/image-upscale',
    displayName: 'Topaz Upscale',
    family: 'topaz',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['image_url'],
      optional: ['upscale_factor'],
      excluded: ['prompt', 'image_urls', 'aspect_ratio', 'quality']
    }
  },
  
  'ideogram-reframe': {
    frontendModel: 'ideogram-reframe',
    kieApiModel: 'ideogram/v3-reframe',
    displayName: 'Ideogram Reframe',
    family: 'ideogram',
    capabilities: ['image-to-image', 'single-reference'],
    refMode: 'single',
    supportsImages: true,
    supportsMultipleReferences: false,
    supportsTextOnly: false,
    requestTemplate: {
      required: ['image_url'],
      optional: ['image_size', 'rendering_speed', 'style', 'num_images', 'seed'],
      excluded: ['prompt', 'image_urls', 'aspect_ratio', 'quality', 'reference_image_urls']
    }
  }
};

// Helper functions
function getModelConfig(frontendModel: string): KieModelConfig | undefined {
  return MODEL_CONFIGS[frontendModel];
}

function validateModelUsage(frontendModel: string, context: {
  hasImages: boolean;
  hasMultipleReferences: boolean;
  refMode: string;
}): void {
  const config = getModelConfig(frontendModel);
  
  if (!config) {
    throw new Error(`Unknown model: ${frontendModel}`);
  }
  
  // Check ref mode compatibility
  if (config.refMode !== context.refMode) {
    throw new Error(`Model ${config.displayName} requires ${config.refMode} reference mode, but got ${context.refMode}`);
  }
  
  // Check image support
  if (context.hasImages && !config.supportsImages) {
    throw new Error(`Model ${config.displayName} doesn't support images`);
  }
  
  if (!context.hasImages && !config.supportsTextOnly) {
    throw new Error(`Model ${config.displayName} requires images`);
  }
  
  // Check multiple reference support
  if (context.hasMultipleReferences && !config.supportsMultipleReferences) {
    throw new Error(`Model ${config.displayName} doesn't support multiple references`);
  }
}

async function detectImageAspectRatio(imageUrl: string): Promise<string> {
  try {
    // Fetch image headers to get dimensions
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) {
      console.warn('Failed to fetch image headers, using default aspect ratio');
      return 'square_hd';
    }

    // For now, default to square_hd
    // TODO: Implement actual image dimension detection
    // This would require downloading the image or using a service to get dimensions
    return 'square_hd';
  } catch (error) {
    console.warn('Error detecting image aspect ratio:', error);
    return 'square_hd';
  }
}

async function buildRequestFromConfig(config: KieModelConfig, params: {
  prompt: string;
  imageUrl?: string | null;
  refUrls: string[];
  aspectRatio?: string;
}): Promise<Record<string, unknown>> {
  const request: Record<string, unknown> = {};
  
  // Add required fields
  config.requestTemplate.required.forEach(field => {
    switch (field) {
      case 'prompt':
        request.prompt = params.prompt;
        break;
      case 'image_urls':
        if (config.supportsImages) {
          const allUrls = params.imageUrl ? [params.imageUrl, ...params.refUrls] : params.refUrls;
          if (allUrls.length > 0) {
            request.image_urls = allUrls;
          }
        }
        break;
      case 'image_url':
        if (config.supportsImages) {
          const primaryUrl = params.imageUrl || params.refUrls[0];
          if (primaryUrl) {
            request.image_url = primaryUrl;
          }
        }
        break;
      case 'reference_image_urls':
        if (config.supportsImages && params.refUrls.length > 0) {
          request.reference_image_urls = params.refUrls;
        }
        break;
      case 'rendering_speed':
        request.rendering_speed = 'BALANCED';
        break;
      case 'style':
        request.style = 'AUTO';
        break;
      case 'expand_prompt':
        request.expand_prompt = true;
        break;
      case 'image_size':
        request.image_size = 'square_hd';
        break;
      case 'num_images':
        request.num_images = '1';
        break;
      case 'strength':
        request.strength = 0.8;
        break;
      case 'upscale_factor':
        request.upscale_factor = '2';
        break;
      case 'seed':
        request.seed = 0;
        break;
      case 'aspect_ratio':
        request.aspect_ratio = params.aspectRatio || config.defaultAspectRatio || '1:1';
        break;
      case 'quality':
        request.quality = config.defaultQuality || 'basic';
        break;
      default:
        console.warn(`Unknown required field: ${field}`);
    }
  });
  
  // Add optional fields if available
  for (const field of config.requestTemplate.optional) {
    switch (field) {
      case 'callBackUrl':
        request.callBackUrl = 'https://your-domain.com/api/callback';
        break;
      case 'output_format':
        request.output_format = 'png';
        break;
      case 'aspect_ratio':
        if (params.aspectRatio && !request.aspect_ratio) {
          request.aspect_ratio = params.aspectRatio;
        }
        break;
      case 'image_size':
        if (!request.image_size) {
          // For character-remix, detect aspect ratio from the first image
          if (config.kieApiModel === 'ideogram/character-remix' && params.imageUrl) {
            request.image_size = await detectImageAspectRatio(params.imageUrl);
          } else if (params.aspectRatio) {
            // Fallback to aspect ratio mapping for other models
            const aspectRatioMap: Record<string, string> = {
              '1:1': 'square',
              '4:3': 'landscape_4_3', 
              '16:9': 'landscape_16_9',
              '3:4': 'portrait_4_3',
              '9:16': 'portrait_16_9'
            };
            request.image_size = aspectRatioMap[params.aspectRatio] || 'square_hd';
          } else {
            request.image_size = 'square_hd';
          }
        }
        break;
      case 'quality':
        if (!request.quality) {
          request.quality = config.defaultQuality || 'basic';
        }
        break;
      case 'image_urls':
        if (config.supportsImages && !request.image_urls) {
          const allUrls = params.imageUrl ? [params.imageUrl, ...params.refUrls] : params.refUrls;
          if (allUrls.length > 0) {
            request.image_urls = allUrls;
          }
        }
        break;
      case 'image_size':
        request.image_size = 'landscape_16_9';
        break;
      case 'image_resolution':
        request.image_resolution = '1K';
        break;
      default:
        // Add other optional fields if they exist in params
        if ((params as Record<string, unknown>)[field]) {
          request[field] = (params as Record<string, unknown>)[field];
        }
        break;
    }
  }
  
  // Always include output_format for PNG
  request.output_format = 'png';
  
  return request;
}

// Generate backward-compatible MODEL_MAP
const MODEL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MODEL_CONFIGS).map(([key, config]) => [key, config.kieApiModel])
);
console.log('[img-proxy] MODEL_MAP regenerated at:', new Date().toISOString());
console.log('[img-proxy] MODEL_MAP generated:', MODEL_MAP);
console.log('[img-proxy] Available models:', Object.keys(MODEL_MAP));
console.log('[img-proxy] nano-banana-edit mapping:', MODEL_MAP['nano-banana-edit']); // Debug specific model
export const preferredRegion = 'auto';

const KIE_API_KEY      = process.env.KIE_AI_API_KEY;
console.log('[img-proxy] API Key status:', !!KIE_API_KEY ? 'Present' : 'Missing');
console.log('[img-proxy] API Key length:', KIE_API_KEY?.length || 0);
console.log('[img-proxy] API Key format:', KIE_API_KEY?.startsWith('eyJ') ? 'JWT format' : 'Other format');

// Validate JWT token (without exposing sensitive data)
if (KIE_API_KEY && KIE_API_KEY.startsWith('eyJ')) {
  try {
    const parts = KIE_API_KEY.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('[img-proxy] JWT payload:', {
        sub: payload.sub,
        iss: payload.iss,
        aud: payload.aud,
        iat: new Date(payload.iat * 1000).toISOString(),
        exp: new Date(payload.exp * 1000).toISOString(),
        isExpired: payload.exp * 1000 < Date.now()
      });
    }
  } catch (err) {
    console.log('[img-proxy] JWT parsing error:', err instanceof Error ? err.message : 'Unknown error');
  }
}
const KIE_CREATE_URL   = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_POLL_URL     = "https://api.kie.ai/api/v1/jobs/recordInfo";
const KIE_FLUX_URL     = "https://api.kie.ai/api/v1/flux/kontext/generate";
const KIE_FLUX_POLL    = "https://api.kie.ai/api/v1/flux/kontext/record-info";
const KIE_GPT4O_URL    = "https://api.kie.ai/api/v1/gpt4o-image/generate";
const KIE_GPT4O_POLL   = "https://api.kie.ai/api/v1/gpt4o-image/record-info";
const KIE_CHARACTER_URL = "https://api.kie.ai/api/v1/ideogram-character/createTask";
const KIE_CHARACTER_POLL = "https://api.kie.ai/api/v1/ideogram-character/recordInfo";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Upload base64 to freeimage.host → public URL
async function uploadToTemp(base64DataUrl: string): Promise<string> {
  if (!base64DataUrl.startsWith("data:")) {
    console.log("[img-proxy] Input is not base64 data, returning as-is:", base64DataUrl.substring(0, 50));
    return base64DataUrl; // already a URL or not base64
  }
  
  const base64 = base64DataUrl.split(",")[1];
  return await uploadBase64ToFreeImage(base64);
}

// Separate function for uploading base64 to freeimage.host
async function uploadBase64ToFreeImage(base64: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const formData = new FormData();
      formData.append("key", "6d207e02198a847aa98d0a2a901485a5");
      formData.append("action", "upload");
      formData.append("source", base64);
      formData.append("format", "json");
      const res = await fetch("https://freeimage.host/api/1/upload", {
        method: "POST", body: formData, signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Upload HTTP ${res.status}`);
      const data = await res.json();
      const url = data?.image?.url;
      if (!url) throw new Error(`No URL: ${JSON.stringify(data)}`);
      console.log("[img-proxy] Uploaded:", url.substring(0, 80));
      return url;
    } catch (err) {
      console.warn(`[img-proxy] Upload attempt ${attempt} failed:`, err);
      if (attempt === 3) throw new Error(`Image upload failed: ${err}`);
      await sleep(2000 * attempt);
    }
  }
  throw new Error("Upload failed");
}

// Upload base64 to imgbb.com → public URL (alternative host for mask images)
async function uploadToImgbb(base64DataUrl: string): Promise<string> {
  if (!base64DataUrl.startsWith("data:")) return base64DataUrl; // already a URL
  const base64 = base64DataUrl.split(",")[1];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const params = new URLSearchParams();
      params.append("key", "2e49e8d80ccca60c62adb5ba8f2f0b37");
      params.append("image", base64);
      const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ImgBB upload HTTP ${res.status}: ${errText.substring(0, 200)}`);
      }
      const data = await res.json();
      const url = data?.data?.url;
      if (!url) throw new Error(`ImgBB no URL: ${JSON.stringify(data)}`);
      console.log("[img-proxy] ImgBB Uploaded:", url.substring(0, 80));
      return url;
    } catch (err) {
      console.warn(`[img-proxy] ImgBB upload attempt ${attempt} failed:`, err);
      if (attempt === 3) {
        // Fall back to freeimage.host
        console.log("[img-proxy] ImgBB failed, falling back to freeimage.host...");
        return uploadToTemp(base64DataUrl);
      }
      await sleep(2000 * attempt);
    }
  }
  throw new Error("ImgBB upload failed");
}

// Poll /jobs/recordInfo — Market API models
async function pollMarket(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    try {
      const res = await fetch(`${KIE_POLL_URL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.warn(`[img-proxy] poll ${i+1} non-ok ${res.status}`); continue; }
      const pd = await res.json();
      const flag = pd?.data?.successFlag;
      const state = pd?.data?.state;
      console.log(`[img-proxy] poll ${i+1}: flag=${flag} state=${state}`);
      if (flag === 1 || state === "success") {
        let parsed: Record<string, unknown> = {};
        if (typeof pd?.data?.resultJson === "string") {
          try { parsed = JSON.parse(pd.data.resultJson); } catch { /* ok */ }
        }
        const url =
          (parsed?.resultUrls as string[])?.[0] ??
          (parsed?.resultImageUrl as string) ??
          pd?.data?.response?.resultImageUrl ??
          pd?.data?.resultImageUrl ??
          pd?.data?.response?.url ??
          pd?.data?.url ??
          pd?.data?.resultUrls?.[0] ??
          pd?.data?.response?.resultUrls?.[0];
        if (!url) throw new Error(`No result URL in: ${JSON.stringify(pd?.data)}`);
        return url;
      }
      if (flag === 2 || flag === 3 || state === "fail") {
        throw new Error(`KIE task failed: ${pd?.data?.failMsg ?? pd?.data?.errorMessage ?? "unknown"}`);
      }
    } catch (err) {
      console.warn(`[img-proxy] poll ${i+1} error:`, err);
      // re-throw on task-level errors
      if (err instanceof Error && (err.message.startsWith("KIE task") || err.message.startsWith("No result"))) throw err;
    }
  }
  throw new Error("KIE timed out after 5 minutes");
}

// Poll /flux/kontext/record-info — Flux Kontext models
async function pollFlux(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    try {
      const res = await fetch(`${KIE_FLUX_POLL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.warn(`[img-proxy/flux] poll ${i+1} non-ok ${res.status}`); continue; }
      const pd = await res.json();
      const flag = pd?.data?.successFlag;
      console.log(`[img-proxy/flux] poll ${i+1}: flag=${flag}`);
      if (flag === 1) {
        const url = pd?.data?.response?.resultImageUrl ?? pd?.data?.resultImageUrl;
        if (!url) throw new Error(`No resultImageUrl in flux response: ${JSON.stringify(pd?.data)}`);
        return url;
      }
      if (flag === 2 || flag === 3) throw new Error(`Flux task failed: ${pd?.data?.errorMessage ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Flux task")) throw err;
      console.warn(`[img-proxy/flux] poll ${i+1} error:`, err);
    }
  }
  throw new Error("Flux KIE timed out after 5 minutes");
}

// Poll /gpt4o-image/record-info — GPT-4o image models
async function pollGpt4o(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    try {
      const res = await fetch(`${KIE_GPT4O_POLL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) { console.warn(`[img-proxy/gpt4o] poll ${i+1} non-ok ${res.status}`); continue; }
      const data = await res.json();
      const { successFlag, response } = data?.data ?? {};
      console.log(`[img-proxy/gpt4o] poll ${i+1}: flag=${successFlag}`);
      if (successFlag === 1) {
        const url = response?.resultUrls?.[0] ?? response?.resultImageUrl;
        if (!url) throw new Error(`No URL in gpt4o response: ${JSON.stringify(data?.data)}`);
        return url;
      }
      if (successFlag === 2) throw new Error(`GPT-4o failed: ${data?.data?.errorMessage ?? "unknown"}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("GPT-4o")) throw err;
      console.warn(`[img-proxy/gpt4o] poll ${i+1} error:`, err);
    }
  }
  throw new Error("GPT-4o KIE timed out");
}

// ── Model handlers ─────────────────────────────────────────────────────────────

// Build model-specific input object for Market API using configuration
async function buildMarketInput(
  kieModel: string,
  frontendModel: string,
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<Record<string, unknown>> {
  // Get model configuration
  const config = getModelConfig(frontendModel);
  
  if (!config) {
    console.warn(`[img-proxy] Unknown model: ${frontendModel}, using fallback`);
    // Fallback to basic structure
    const base: Record<string, unknown> = { prompt, output_format: "png" };
    const allUrls = [...(imageUrl ? [imageUrl] : []), ...refUrls];
    if (allUrls.length > 0) base.image_urls = allUrls;
    if (aspectRatio) base.aspect_ratio = aspectRatio;
    return base;
  }

  // Validate model usage
  try {
    validateModelUsage(frontendModel, {
      hasImages: !!(imageUrl || refUrls.length > 0),
      hasMultipleReferences: refUrls.length > 1,
      refMode: refUrls.length > 1 ? 'multi' : refUrls.length > 0 ? 'single' : 'text'
    });
  } catch (error) {
    console.warn(`[img-proxy] Model validation failed: ${error}`);
    // Continue with request anyway for backward compatibility
  }

  // Build request using configuration
  const request = await buildRequestFromConfig(config, {
    prompt,
    imageUrl,
    refUrls,
    aspectRatio
  });

  console.log(`[img-proxy] Built request for ${config.displayName} (${config.kieApiModel})`);
  return request;
}

// Market API — routes each model family to correct input structure
async function callMarketModel(
  kieModel: string,
  frontendModel: string,
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<string> {
  const input = await buildMarketInput(kieModel, frontendModel, prompt, imageUrl, refUrls, aspectRatio);
  const requestBody = { model: kieModel, input };
  console.log("[img-proxy] Market API request:", JSON.stringify({ model: kieModel, imageCount: (imageUrl ? 1 : 0) + refUrls.length }));
  console.log("[img-proxy] Request body:", JSON.stringify(requestBody, null, 2));

  const res = await fetch(KIE_CREATE_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[img-proxy] Market API create response:", JSON.stringify(data));

  if (data?.code !== 200) {
    throw new Error(`KIE ${kieModel} error: ${data?.msg ?? JSON.stringify(data)}`);
  }
  const taskId = data?.data?.taskId ?? data?.data?.recordId;
  return pollMarket(taskId);
}

// Poll /api/v1/ideogram-character/record-info — Character Edit models
async function pollCharacter(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    let pollRes: Response;
    try {
      pollRes = await fetch(`${KIE_CHARACTER_POLL}?taskId=${taskId}`, {
        headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
    } catch { console.warn(`[img-proxy/character] poll ${i+1} fetch error`); continue; }

    if (!pollRes.ok) { console.warn(`[img-proxy/character] poll ${i+1} non-ok ${pollRes.status}`); continue; }

    const pd = await pollRes.json();
    // Market API uses successFlag: 0=running, 1=success, 2/3=fail
    const flag = pd?.data?.successFlag;
    const state = pd?.data?.state; // some models use "state" instead
    console.log(`[img-proxy/character] poll ${i+1}: flag=${flag} state=${state}`);

    if (flag === 1 || state === "success") {
      // resultJson is a stringified JSON: {"resultUrls":["https://..."]}
      let parsedResult: Record<string, unknown> = {};
      if (typeof pd?.data?.resultJson === "string") {
        try { parsedResult = JSON.parse(pd.data.resultJson); } catch { /* ignore */ }
      }
      const url =
        (parsedResult?.resultUrls as string[])?.[0] ??
        (parsedResult?.resultImageUrl as string) ??
        pd?.data?.response?.resultImageUrl ??
        pd?.data?.resultImageUrl ??
        pd?.data?.response?.url ??
        pd?.data?.url ??
        pd?.data?.resultUrls?.[0] ??
        pd?.data?.response?.resultUrls?.[0];
      if (!url) throw new Error(`No result URL in: ${JSON.stringify(pd?.data)}`);
      return url;
    }
    if (flag === 2 || flag === 3 || state === "fail") {
      const reason = pd?.data?.failMsg ?? pd?.data?.errorMessage ?? pd?.data?.failReason ?? pd?.data?.reason ?? "unknown";
      console.error("[img-proxy/character] Kie.ai task failed. Full response:", JSON.stringify(pd?.data, null, 2));
      throw new Error(`Kie.ai task failed: ${reason}`);
    }
  }
  throw new Error("Kie.ai timed out after 300s");
}

// Flux Kontext Pro — dedicated endpoint
async function callFluxKontextPro(
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<string> {
  // Flux Kontext: canvas = inputImage (the scene to edit).
  // Reference image URL is injected into the prompt so the model knows what to apply.
  const sceneUrl = imageUrl ?? null;

  let finalPrompt = prompt;
  if (refUrls.length > 0) {
    // Tell Flux Kontext exactly what the reference looks like by including its URL in the prompt
    finalPrompt = `${prompt}. Use the style/item from this reference image: ${refUrls[0]}`;
  }

  const requestBody: Record<string, unknown> = {
    model: "flux-kontext-pro",
    prompt: finalPrompt,
    outputFormat: "png",
  };
  if (sceneUrl) requestBody.inputImage = sceneUrl;
  if (aspectRatio) requestBody.aspectRatio = aspectRatio;

  console.log("[img-proxy] Flux Kontext Pro request, inputImage (scene):", sceneUrl?.substring(0, 60), "refInjected:", refUrls.length > 0);

  const res = await fetch(KIE_FLUX_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[img-proxy] Flux Kontext Pro response:", JSON.stringify(data));

  if (data?.code !== 200) throw new Error(`Flux Kontext Pro: ${data?.msg ?? JSON.stringify(data)}`);
  return pollFlux(data.data.taskId);
}

// GPT-4o API only supports size: "1:1" (based on inpaint route working implementation)
function gpt4oSize(aspectRatio?: string): string {
  console.log("[img-proxy] GPT-4o aspectRatio input:", JSON.stringify(aspectRatio), "-> forcing to 1:1");
  return "1:1";
}


// GPT-4o image
async function callGpt4o(
  prompt: string,
  imageUrl: string | null,
  refUrls: string[],
  aspectRatio?: string
): Promise<string> {
  const allUrls = [...(imageUrl ? [imageUrl] : []), ...refUrls];
  const requestBody = {
    filesUrl: allUrls.length > 0 ? allUrls : undefined,
    prompt,
    size: gpt4oSize(aspectRatio),
    nVariants: 1,
    isEnhance: false,
  };
  console.log("[img-proxy] GPT-4o request, images:", allUrls.length);
  console.log("[img-proxy] GPT-4o PROMPT:", `"${prompt}"`);
  console.log("[img-proxy] GPT-4o REQUEST BODY:", JSON.stringify(requestBody, null, 2));

  const res = await fetch(KIE_GPT4O_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  console.log("[img-proxy] GPT-4o response:", JSON.stringify(data));

  if (data?.code !== 200) throw new Error(`GPT-4o: ${data?.msg ?? JSON.stringify(data)}`);
  return pollGpt4o(data.data.taskId);
}

// ── KIE model name mapping (frontend key → KIE model ID) ──────────────────────
// MODEL_MAP is now generated automatically from MODEL_CONFIGS above

export async function POST(req: NextRequest) {
  try {
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { prompt, model: frontendModel, image, referenceImages, aspectRatio } = body;

    console.log("[img-proxy] Incoming request:", {
      model: frontendModel,
      hasPrompt: !!prompt,
      hasImage: !!image,
      hasReferenceImages: !!referenceImages,
      referenceImagesCount: referenceImages?.length || 0,
      promptLength: prompt?.length || 0,
      prompt: prompt ? `"${prompt}"` : "null" // Show actual prompt content
    });

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Resolve frontend model key → KIE model ID
    let kieModel = MODEL_MAP[frontendModel] ?? frontendModel;
    console.log(`[img-proxy] model: ${frontendModel} → ${kieModel}`);
    console.log(`[img-proxy] Available models:`, Object.keys(MODEL_MAP));
    console.log(`[img-proxy] MODEL_MAP contents:`, MODEL_MAP);
    
    // Debug: Check if character-edit exists in MODEL_MAP
    if (frontendModel === 'character-edit') {
      console.log('[img-proxy] Character edit model detected in MODEL_MAP:', !!MODEL_MAP['character-edit']);
      console.log('[img-proxy] MODEL_MAP keys:', Object.keys(MODEL_MAP));
    }
    
    // Fallback for character-edit if not in MODEL_MAP
    if (frontendModel === 'character-edit' && (!MODEL_MAP['character-edit'] || MODEL_MAP['character-edit'] !== 'ideogram/character-edit')) {
      console.log('[img-proxy] Character edit not found in MODEL_MAP, using direct mapping');
      kieModel = 'ideogram/character-edit';
      console.log(`[img-proxy] Using fallback mapping: ${frontendModel} → ${kieModel}`);
    }

    // Upload any base64 images to public URLs
    let imageUrl: string | null = null;
    if (image) {
      console.log("[img-proxy] Uploading base image...");
      imageUrl = await uploadToTemp(image);
    }

    let refUrls: string[] = [];
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      console.log(`[img-proxy] Uploading ${referenceImages.length} reference images...`);
      console.log("[img-proxy] Reference images before upload:", referenceImages.map((img, i) => `ref${i}: ${img.substring(0, 50)}...`));
      refUrls = await Promise.all(referenceImages.map((img: string) => uploadToTemp(img)));
      console.log("[img-proxy] Reference images after upload:", refUrls.map((url, i) => `ref${i}: ${url}`));
    }

    // Route to the correct KIE endpoint based on model
    let resultUrl: string;

    if (kieModel === "flux-kontext-pro") {
      resultUrl = await callFluxKontextPro(prompt, imageUrl, refUrls, aspectRatio);
    } else if (kieModel === "gpt-image" || kieModel === "gpt-image/1.5-image-to-image" || frontendModel === "gpt-image-1-1" || 
               kieModel === "qwen/image-edit") {
      console.log("[img-proxy] Routing to GPT-4o for rectangle mask models");
      console.log("[img-proxy] kieModel:", kieModel);
      console.log("[img-proxy] frontendModel:", frontendModel);
      // Handle rectangle inpaint requests for all rectangle mask models
      if (body.image && body.prompt && body.model) {
        const { image, prompt, model, mask, isSquareMode, isRectangleMask, rectangle, canvasDisplaySize } = body;
        console.log("[img-proxy] Rectangle inpaint request, model:", model, "mask:", !!mask, "squareMode:", isSquareMode, "rectangleMask:", isRectangleMask);
        
        try {
          let result: string;
          
          if (isSquareMode && model === "gpt-image") {
            // Square mode: frontend should handle cropping and compositing
            // Backend just receives the cropped square image directly
            console.log("[img-proxy] Square mode: processing cropped square image");
            
            if (!rectangle) {
              throw new Error("Rectangle coordinates required for square mode");
            }
            
            // For square mode, upload the cropped image and use URL like regular generation
            const squareImageUrl = await uploadToTemp(image);
            console.log("[img-proxy] Square mode: uploaded cropped square:", squareImageUrl);
            result = await callGpt4o(prompt, squareImageUrl, [], "1:1"); // No reference images for square mode
            console.log("[img-proxy] GPT-1.5 generated square");
          } else if (isRectangleMask) {
            // Rectangle mask mode: crop rectangle and send to model with reference images
            console.log("[img-proxy] Rectangle mask mode: processing cropped rectangle with reference images");
            
            if (!rectangle) {
              throw new Error("Rectangle coordinates required for rectangle mask mode");
            }
            
            // For rectangle mask mode, upload the cropped image and use URL like regular generation
            const rectangleImageUrl = await uploadToTemp(image);
            console.log("[img-proxy] Rectangle mask mode: uploaded cropped rectangle:", rectangleImageUrl);
            
            // Route character-remix to GPT-4o for rectangle mask to avoid KIE API issues
            if (kieModel === "ideogram/character-remix") {
              console.log("[img-proxy] Routing character-remix to GPT-4o for rectangle mask");
              result = await callGpt4o(prompt, rectangleImageUrl, refUrls, "16:9");
            } else {
              result = await callGpt4o(prompt, rectangleImageUrl, refUrls, "16:9");
            }
            console.log("[img-proxy] Model generated rectangle with reference images");
          } else {
            // Normal mode: send directly to model
            const forcedAspectRatio = frontendModel === "gpt-image-1-1" ? "1:1" : aspectRatio;
            result = await callGpt4o(prompt, imageUrl, refUrls, forcedAspectRatio);
          }
          
          return NextResponse.json({ image: result });
        } catch (error) {
          console.error("[img-proxy] Rectangle inpaint error:", error);
          return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process rectangle inpaint" }, { status: 500 });
        }
      } else {
        // Force 1:1 aspect ratio for gpt-image-1-1
        const forcedAspectRatio = frontendModel === "gpt-image-1-1" ? "1:1" : aspectRatio;
        resultUrl = await callGpt4o(prompt, imageUrl, refUrls, forcedAspectRatio);
      }
    } else if (kieModel === "ideogram/character-remix") {
      // Ideogram Character Remix uses image_url and reference_image_urls structure
      console.log("[img-proxy] Ideogram Character Remix model detected");
      console.log("[img-proxy] Ideogram Remix imageUrl:", imageUrl?.substring(0, 60) + "...");
      console.log("[img-proxy] Ideogram Remix refUrls:", refUrls);
      
      const requestBody = {
        model: "ideogram/character-remix",
        input: {
          prompt,
          image_url: imageUrl,
          reference_image_urls: refUrls,
          rendering_speed: "BALANCED",
          style: "AUTO",
          expand_prompt: true,
          image_size: "square_hd",
          num_images: "1",
          strength: 0.8
        }
      };
      
      console.log("[img-proxy] Ideogram Remix request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log("[img-proxy] Ideogram Remix response:", result);
      
      // Check if we got a task ID that needs polling
      if (result.data?.taskId || result.data?.recordId) {
        const taskId = result.data?.taskId ?? result.data?.recordId;
        console.log("[img-proxy] Ideogram Remix got task ID:", taskId, "polling...");
        
        try {
          resultUrl = await pollMarket(taskId);
          console.log("[img-proxy] Ideogram Remix polling successful, URL:", resultUrl);
        } catch (pollError) {
          console.error("[img-proxy] Ideogram Remix polling failed:", pollError);
          throw new Error(`Ideogram Remix polling failed: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
        }
      } else {
        // Direct URL response (unlikely but handle it)
        console.log("[img-proxy] Ideogram Remix checking for direct URL response...");
        resultUrl = result.data?.outputImageUrl || result.data?.image_url || '';
        console.log("[img-proxy] Ideogram Remix direct URL:", resultUrl);
      }
      
      if (!resultUrl) {
        console.error("[img-proxy] Ideogram Remix: No result URL obtained");
        console.error("[img-proxy] Full response:", JSON.stringify(result, null, 2));
        throw new Error("Ideogram Remix: No result URL obtained from API");
      }
      
      console.log("[img-proxy] Ideogram Remix final result URL:", resultUrl);
    } else if (kieModel === "recraft/crisp-upscale") {
      // Recraft Crisp Upscale uses simple image input structure
      console.log("[img-proxy] Recraft Crisp Upscale model detected");
      console.log("[img-proxy] Recraft Crisp imageUrl:", imageUrl?.substring(0, 60) + "...");
      
      const requestBody = {
        model: "recraft/crisp-upscale",
        input: {
          image: imageUrl
        }
      };
      
      console.log("[img-proxy] Recraft Crisp request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log("[img-proxy] Recraft Crisp response:", result);
      
      // Check if we got a task ID that needs polling
      if (result.data?.taskId || result.data?.recordId) {
        const taskId = result.data?.taskId ?? result.data?.recordId;
        console.log("[img-proxy] Recraft Crisp got task ID:", taskId, "polling...");
        
        try {
          resultUrl = await pollMarket(taskId);
          console.log("[img-proxy] Recraft Crisp polling successful, URL:", resultUrl);
        } catch (pollError) {
          console.error("[img-proxy] Recraft Crisp polling failed:", pollError);
          throw new Error(`Recraft Crisp polling failed: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
        }
      } else {
        // Direct URL response (unlikely but handle it)
        console.log("[img-proxy] Recraft Crisp checking for direct URL response...");
        resultUrl = result.data?.outputImageUrl || result.data?.image_url || '';
        console.log("[img-proxy] Recraft Crisp direct URL:", resultUrl);
      }
      
      if (!resultUrl) {
        console.error("[img-proxy] Recraft Crisp: No result URL obtained");
        console.error("[img-proxy] Full response:", JSON.stringify(result, null, 2));
        throw new Error("Recraft Crisp: No result URL obtained from API");
      }
      
      console.log("[img-proxy] Recraft Crisp final result URL:", resultUrl);
    } else if (kieModel === "flux-2/pro-image-to-image") {
      // Flux 2 Pro uses input_urls array format
      console.log("[img-proxy] Flux 2 Pro model detected");
      console.log("[img-proxy] Flux 2 Pro imageUrl:", imageUrl?.substring(0, 60) + "...");
      console.log("[img-proxy] Flux 2 Pro refUrls:", refUrls);
      
      // Combine background image and reference images into input_urls array
      const inputUrls = [imageUrl, ...refUrls];
      
      const requestBody = {
        model: "flux-2/pro-image-to-image",
        input: {
          input_urls: inputUrls,
          prompt,
          aspect_ratio: "1:1",
          resolution: "1K"
        }
      };
      
      console.log("[img-proxy] Flux 2 Pro request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log("[img-proxy] Flux 2 Pro response:", result);
      
      // Check if we got a task ID that needs polling
      if (result.data?.taskId || result.data?.recordId) {
        const taskId = result.data?.taskId ?? result.data?.recordId;
        console.log("[img-proxy] Flux 2 Pro got task ID:", taskId, "polling...");
        
        try {
          resultUrl = await pollMarket(taskId);
          console.log("[img-proxy] Flux 2 Pro polling successful, URL:", resultUrl);
        } catch (pollError) {
          console.error("[img-proxy] Flux 2 Pro polling failed:", pollError);
          throw new Error(`Flux 2 Pro polling failed: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
        }
      } else {
        // Direct URL response (unlikely but handle it)
        console.log("[img-proxy] Flux 2 Pro checking for direct URL response...");
        resultUrl = result.data?.outputImageUrl || result.data?.image_url || '';
        console.log("[img-proxy] Flux 2 Pro direct URL:", resultUrl);
      }
      
      if (!resultUrl) {
        console.error("[img-proxy] Flux 2 Pro: No result URL obtained");
        console.error("[img-proxy] Full response:", JSON.stringify(result, null, 2));
        throw new Error("Flux 2 Pro: No result URL obtained from API");
      }
      
      console.log("[img-proxy] Flux 2 Pro final result URL:", resultUrl);
    } else if (kieModel === "flux-2/flex-image-to-image") {
      // Flux 2 Flex uses input_urls array format
      console.log("[img-proxy] Flux 2 Flex model detected");
      console.log("[img-proxy] Flux 2 Flex imageUrl:", imageUrl?.substring(0, 60) + "...");
      console.log("[img-proxy] Flux 2 Flex refUrls:", refUrls);
      
      // Combine background image and reference images into input_urls array
      const inputUrls = [imageUrl, ...refUrls];
      
      const requestBody = {
        model: "flux-2/flex-image-to-image",
        input: {
          input_urls: inputUrls,
          prompt,
          aspect_ratio: "1:1",
          resolution: "1K"
        }
      };
      
      console.log("[img-proxy] Flux 2 Flex request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log("[img-proxy] Flux 2 Flex response:", result);
      
      // Check if we got a task ID that needs polling
      if (result.data?.taskId || result.data?.recordId) {
        const taskId = result.data?.taskId ?? result.data?.recordId;
        console.log("[img-proxy] Flux 2 Flex got task ID:", taskId, "polling...");
        
        try {
          resultUrl = await pollMarket(taskId);
          console.log("[img-proxy] Flux 2 Flex polling successful, URL:", resultUrl);
        } catch (pollError) {
          console.error("[img-proxy] Flux 2 Flex polling failed:", pollError);
          throw new Error(`Flux 2 Flex polling failed: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
        }
      } else {
        // Direct URL response (unlikely but handle it)
        console.log("[img-proxy] Flux 2 Flex checking for direct URL response...");
        resultUrl = result.data?.outputImageUrl || result.data?.image_url || '';
        console.log("[img-proxy] Flux 2 Flex direct URL:", resultUrl);
      }
      
      if (!resultUrl) {
        console.error("[img-proxy] Flux 2 Flex: No result URL obtained");
        console.error("[img-proxy] Full response:", JSON.stringify(result, null, 2));
        throw new Error("Flux 2 Flex: No result URL obtained from API");
      }
      
      console.log("[img-proxy] Flux 2 Flex final result URL:", resultUrl);
    } else if (kieModel === "nano-banana-2") {
      // Nano Banana 2 uses special image_input array format
      console.log("[img-proxy] Nano Banana 2 model detected");
      console.log("[img-proxy] Nano Banana 2 imageUrl:", imageUrl?.substring(0, 60) + "...");
      console.log("[img-proxy] Nano Banana 2 refUrls:", refUrls);
      
      // Combine background image and reference images into image_input array
      const imageInput = [imageUrl, ...refUrls];
      
      const requestBody = {
        model: "nano-banana-2",
        input: {
          prompt,
          image_input: imageInput,
          aspect_ratio: "1:1",
          google_search: false,
          resolution: "1K",
          output_format: "jpg"
        }
      };
      
      console.log("[img-proxy] Nano Banana 2 request body:", JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log("[img-proxy] Nano Banana 2 response:", result);
      
      // Check if we got a task ID that needs polling
      if (result.data?.taskId || result.data?.recordId) {
        const taskId = result.data?.taskId ?? result.data?.recordId;
        console.log("[img-proxy] Nano Banana 2 got task ID:", taskId, "polling...");
        
        try {
          resultUrl = await pollMarket(taskId);
          console.log("[img-proxy] Nano Banana 2 polling successful, URL:", resultUrl);
        } catch (pollError) {
          console.error("[img-proxy] Nano Banana 2 polling failed:", pollError);
          throw new Error(`Nano Banana 2 polling failed: ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
        }
      } else {
        // Direct URL response (unlikely but handle it)
        console.log("[img-proxy] Nano Banana 2 checking for direct URL response...");
        resultUrl = result.data?.outputImageUrl || result.data?.image_url || '';
        console.log("[img-proxy] Nano Banana 2 direct URL:", resultUrl);
      }
      
      if (!resultUrl) {
        console.error("[img-proxy] Nano Banana 2: No result URL obtained");
        console.error("[img-proxy] Full response:", JSON.stringify(result, null, 2));
        throw new Error("Nano Banana 2: No result URL obtained from API");
      }
      
      console.log("[img-proxy] Nano Banana 2 final result URL:", resultUrl);
    } else if (kieModel === "ideogram/character-edit" || kieModel === "ideogram/character-remix") {
      // Character Edit models use Market API with special handling for mask
      console.log("[img-proxy] Character Edit model detected:", kieModel);
      console.log("[img-proxy] Character Edit imageUrl:", imageUrl?.substring(0, 60) + "...");
      console.log("[img-proxy] Character Edit refUrls:", refUrls);
      
      // Extract mask from request body (for brush inpaint)
      const maskData = body.mask;
      let maskUrl: string | null = null;
      
      if (maskData) {
        console.log("[img-proxy] Character Edit: Uploading mask to temp URL...");
        maskUrl = await uploadToTemp(maskData);
        console.log("[img-proxy] Character Edit: Mask uploaded:", maskUrl?.substring(0, 60) + "...");
      }
      
      // Character Edit/Remix uses exact structure from cURL example
      // For character-remix, only include required and supported optional fields
      const requestBody = {
        model: kieModel,
        input: {
          prompt: prompt,
          image_url: imageUrl,
          reference_image_urls: refUrls,
          // Only include fields that are supported by the specific model
          ...(kieModel === "ideogram/character-edit" && {
            rendering_speed: "BALANCED",
            style: "AUTO",
            expand_prompt: true,
            num_images: "1"
          }),
          ...(kieModel === "ideogram/character-remix" && {
            // Character Remix - remove mask_url since we're doing rectangle mask, not brush inpaint
            rendering_speed: "BALANCED",
            style: "AUTO",
            expand_prompt: true,
            num_images: "1"
          })
        }
      };
      
      console.log("[img-proxy] Character Edit: Using flat JSON structure");
      
      // Debug: Log all fields to identify what's missing
      console.log("[img-proxy] Character Edit request body:", JSON.stringify(requestBody, null, 2));
      console.log("[img-proxy] Character Edit fields:", Object.keys(requestBody));
      console.log("[img-proxy] Character Edit has mask:", !!maskUrl);
      
      const response = await fetch(KIE_CREATE_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${KIE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });
      
      const data = await response.json();
      console.log("[img-proxy] Character Edit response:", JSON.stringify(data, null, 2));
      
      if (data?.code !== 200) {
        // Log the full response for debugging
        console.error("[img-proxy] Character Edit API error details:", {
          code: data?.code,
          msg: data?.msg,
          data: data?.data,
          fullResponse: JSON.stringify(data, null, 2)
        });
        throw new Error(`KIE ${kieModel} error: ${data?.msg ?? JSON.stringify(data)}`);
      }
      
      resultUrl = await pollMarket(data?.data?.taskId ?? data?.data?.recordId);
    } else {
      // All other models use the generic Market API
      console.log(`[img-proxy] MODEL_MAP lookup for ${frontendModel}:`, MODEL_MAP[frontendModel]);
      resultUrl = await callMarketModel(kieModel, frontendModel, prompt, imageUrl, refUrls, aspectRatio);
    }

    console.log("[img-proxy] Done:", resultUrl);
    return NextResponse.json({ image: resultUrl });
  } catch (error) {
    console.error("[img-proxy] Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
