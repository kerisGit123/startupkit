import { ConvexHttpClient } from "convex/browser";
import { Id } from "@/convex/_generated/dataModel";

const KIE_AI_BASE = "https://api.kie.ai";

/**
 * Resolve the KIE AI API key for a company.
 * 1. Look up org_settings.defaultAI by companyId
 * 2. Fetch the storyboard_kie_ai record to get the apiKey
 * 3. Fall back to process.env.KIE_AI_API_KEY if anything fails
 *
 * Returns { apiKey, kieAiId } where kieAiId is the storyboard_kie_ai record ID (for storing in storyboard_files)
 */
export async function resolveKieApiKey(companyId?: string): Promise<{ apiKey: string; kieAiId?: string }> {
  const fallbackKey = process.env.KIE_AI_API_KEY || "";

  if (!companyId) return { apiKey: fallbackKey };

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const { api } = await import("../../convex/_generated/api");

    // Step 1: Get defaultAI from org_settings (public query, no auth needed)
    const settings = await convex.query(api.settings.getDefaultAI, { companyId });

    if (settings?.defaultAI) {
      // Step 2: Fetch the KIE AI key record
      const kieRecord = await convex.query(api.storyboard.kieAiConfig.getKeyById, { id: settings.defaultAI });
      if (kieRecord?.apiKey && kieRecord.isActive) {
        return { apiKey: kieRecord.apiKey, kieAiId: kieRecord._id };
      }
    }

    // Step 2b: No defaultAI in org_settings — try the system default key
    const defaultKey = await convex.query(api.storyboard.kieAiConfig.getDefaultKey);
    if (defaultKey?.apiKey && defaultKey.isActive) {
      return { apiKey: defaultKey.apiKey, kieAiId: defaultKey._id };
    }
  } catch (e) {
    console.warn("[resolveKieApiKey] Failed to resolve from database, using env fallback:", e);
  }

  return { apiKey: fallbackKey };
}

// Placeholder record creation function
async function createPlaceholderRecord(params: {
  companyId: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  creditsUsed: number;
  sourceUrl?: string;
}) {
  const { ConvexHttpClient } = await import("convex/browser");
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  // Import the API reference
  const { api } = await import("../../convex/_generated/api");
  
  const uploadData: any = {
    companyId: params.companyId,
    orgId: params.companyId, // Use companyId as orgId for AI files
    userId: params.userId,
    projectId: params.projectId,
    // r2Key omitted for AI files (optional field)
    category: "generated",
    filename: `ai-generated-${Date.now()}`,
    fileType: "image",
    mimeType: "image/png",
    size: 0,
    status: "generating",
    creditsUsed: params.creditsUsed,
    categoryId: params.categoryId,
    uploadedBy: params.userId, // Use userId as uploadedBy for AI files
    tags: [], // Empty tags for AI files
    // taskId omitted initially, will be set when we get the taskId from KIE AI
  };
  
  // Only include sourceUrl if it's not null (will be set by callback)
  if (params.sourceUrl !== null && params.sourceUrl !== undefined) {
    uploadData.sourceUrl = params.sourceUrl;
  }
  
  const result = await convex.mutation(api.storyboard.storyboardFiles.logUpload, uploadData);
  
  return result;
}

export const STYLE_PRESETS = {
  realistic: {
    label: "Photorealistic",
    model: "gpt-image/1.5-image-to-image",
    promptSuffix: "professional photography, cinematic lighting, high detail",
  },
  cartoon: {
    label: "Cartoon",
    model: "gpt-image/1.5-image-to-image",
    promptSuffix: "colorful cartoon style, bold outlines, vibrant colors",
  },
  anime: {
    label: "Anime",
    model: "gpt-image/1.5-image-to-image",
    promptSuffix: "anime style, clean lines, expressive eyes, vibrant palette",
  },
  cinematic: {
    label: "Cinematic",
    model: "gpt-image/1.5-image-to-image",
    promptSuffix: "cinematic film still, dramatic lighting, shallow depth of field, moody atmosphere",
  },
} as const;

export type ImageStyle = keyof typeof STYLE_PRESETS;
export type ImageQuality = "standard" | "high" | "medium" | "1K" | "2K" | "4K";

export const IMAGE_CREDITS: Partial<Record<ImageQuality, number>> = {
  standard: 5,
  high: 10,
  medium: 8,
  "1K": 5,
  "2K": 10,
  "4K": 15,
};

export interface TriggerImageGenerationParams {
  prompt: string;
  style?: ImageStyle;
  aspectRatio?: string;
  quality?: ImageQuality;
  companyId?: string;
  userId?: string;
  projectId?: string;
  categoryId?: string;
  category?: string; // "generated" (default) | "elements" | etc.
  creditsUsed?: number;
  model?: string;
  imageUrl?: string;
  referenceImageUrls?: string[];
  maskUrl?: string;
  existingFileId?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  originalImageUrl?: string;
  outputFormat?: string;
  callbackUrl?: string;
  convexToken?: string;
  cinemaMetadata?: Record<string, any>;
}

// Video generation interface for Seedance 1.5 Pro
export interface TriggerVideoGenerationParams {
  prompt: string;
  model: string;
  fileId: string;
  callBackUrl: string;
  companyId?: string;
  userId?: string;
  projectId?: string;
  referenceImages?: string[];
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  audio?: boolean;
  convexToken?: string;
}

export async function triggerVideoGeneration(params: TriggerVideoGenerationParams) {
  // Initialize Convex client for credit operations
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (params.convexToken) convex.setAuth(params.convexToken);
  const { api } = await import("../../convex/_generated/api");

  // Default credit cost for video generation
  const requiredCredits = 25; // Base video generation cost

  // Step 1: Check credit balance before proceeding
  if (params.companyId && requiredCredits) {
    const currentBalance = await convex.query(api.credits.getBalance, {
      companyId: params.companyId,
    });

    if (currentBalance < requiredCredits) {
      throw new Error(
        `Insufficient credits. You have ${currentBalance} credits but need ${requiredCredits} credits. Please purchase more credits to continue.`
      );
    }
  }

  // Resolve API key
  const { apiKey: resolvedKey, kieAiId } = await resolveKieApiKey(params.companyId);

  // Step 2: Create placeholder record
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const createdFileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
    companyId: params.companyId,
    userId: params.userId,
    projectId: params.projectId as Id<"storyboard_projects"> | undefined,
    category: "generated",
    filename: `ai-video-${Date.now()}.mp4`,
    fileType: "video",
    mimeType: "video/mp4",
    size: 0,
    status: "generating",
    creditsUsed: requiredCredits,
    defaultAI: kieAiId as Id<"storyboard_kie_ai"> | undefined,
    model: params.model,
    prompt: params.prompt,
    tags: [],
    uploadedBy: params.userId,
  });

  // Step 3: Deduct credits
  if (params.companyId && requiredCredits) {
    await convex.mutation(api.credits.deductCredits, {
      companyId: params.companyId,
      tokens: requiredCredits,
      reason: `AI Video Generation - ${params.model}`,
    });
  }

  // Update file status to processing
  await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
    fileId: createdFileId,
    status: 'processing',
  });

  // Build callback URL with fileId
  const callbackUrl = params.callBackUrl.includes('fileId=')
    ? params.callBackUrl
    : `${baseUrl}/api/kie-callback?fileId=${createdFileId}`;

  // Prepare the request body for Seedance 1.5 Pro API
  const requestBody = {
    model: params.model,
    callBackUrl: callbackUrl,
    input: {
      prompt: params.prompt,
      input_urls: params.referenceImages || [],
      aspect_ratio: params.aspectRatio || "1:1",
      resolution: params.resolution || "720p",
      duration: parseInt(params.duration?.replace('s', '') || "8"),
      fixed_lens: false,
      generate_audio: params.audio || false,
      nsfw_checker: false,
    },
  };

  let response: Response;

  try {
    response = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resolvedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    // Refund credits on network failure
    if (params.companyId && requiredCredits) {
      await convex.mutation(api.credits.refundCredits, {
        companyId: params.companyId,
        tokens: requiredCredits,
        reason: `AI Video Generation Request Failed - ${params.model}`,
      });
    }
    await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
      fileId: createdFileId,
      status: 'failed',
    });
    throw error;
  }

  if (!response.ok) {
    // Refund credits on API error
    if (params.companyId && requiredCredits) {
      await convex.mutation(api.credits.refundCredits, {
        companyId: params.companyId,
        tokens: requiredCredits,
        reason: `AI Video Generation Failed to Start - ${params.model}`,
      });
    }
    await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
      fileId: createdFileId,
      status: 'failed',
    });
    const errorText = await response.text();
    throw new Error(`KIE AI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Use centralized response handler
  const { handleKieResponse } = await import("./kieResponse");
  const { responseCode, responseMessage, taskId, isSuccess } = await handleKieResponse({
    fileId: createdFileId,
    responseData: result,
    companyId: params.companyId,
    creditsUsed: requiredCredits,
    modelName: params.model,
  });

  return {
    taskId,
    fileId: createdFileId,
    raw: result,
    responseCode,
    responseMessage,
  };
}

export async function triggerImageGeneration(params: TriggerImageGenerationParams) {
  // Use the provided model or fall back to STYLE_PRESETS
  const actualModel = params.model || (params.style ? STYLE_PRESETS[params.style]?.model : undefined);
  // Skip style suffix for models that work better with clean prompts
  const skipSuffix = actualModel === 'ideogram/character-edit' || actualModel === 'topaz/image-upscale' || actualModel === 'recraft/crisp-upscale' || actualModel === 'recraft/remove-background' || actualModel === 'ideogram/v3-reframe' || actualModel === 'z-image';
  const promptSuffix = skipSuffix ? '' : (params.style ? STYLE_PRESETS[params.style]?.promptSuffix || '' : '');
  // Clean up extra whitespace in prompt (e.g. from badge extraction leaving empty spaces)
  const rawPrompt = promptSuffix ? `${params.prompt}, ${promptSuffix}` : params.prompt;
  const fullPrompt = rawPrompt.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim();
  
  // Convert pricing model ID to KIE AI model name
  let kieModel = actualModel;
  if (actualModel === 'gpt-image') {
    kieModel = 'gpt-image/1.5-image-to-image';
  } else if (actualModel === 'gpt-image-2-image-to-image') {
    // Parse mode from quality param JSON: { type: 'gpt-image-2', mode: 'image-to-image' | 'text-to-image', nsfwChecker: boolean }
    let gpt2Mode = 'image-to-image';
    let gpt2Nsfw = false;
    try {
      const gpt2Params = JSON.parse(params.quality || '{}');
      if (gpt2Params.type === 'gpt-image-2') {
        gpt2Mode = gpt2Params.mode || 'image-to-image';
        gpt2Nsfw = gpt2Params.nsfwChecker ?? false;
      }
    } catch {}
    kieModel = gpt2Mode === 'text-to-image' ? 'gpt-image-2-text-to-image' : 'gpt-image-2-image-to-image';
  }
  
  const resolution = actualModel === 'nano-banana-2'
    ? (params.quality === "1K" || params.quality === "2K" || params.quality === "4K"
        ? params.quality
        : "1K") // Default to 1K for nano-banana-2
    : (params.quality === "1K" || params.quality === "2K" || params.quality === "4K"
        ? params.quality
        : params.quality === "high"
          ? "2K"
          : "1K");
  const defaultQuality = params.quality === "high" ? "high" : "standard";
  const isImageToImageModel = !!params.imageUrl;
  
  // Note: We'll create the file record after getting the taskId from KIE AI
  // This ensures the file record is created with the actual taskId and proper credit tracking

  // Step 2: Enhanced KIE AI call with fileId in callback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  // Initialize Convex client for server-side operations
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (params.convexToken) convex.setAuth(params.convexToken);
  const { api } = await import("../../convex/_generated/api");
  const requiredCredits = params.creditsUsed || (params.quality ? IMAGE_CREDITS[params.quality] : undefined) || IMAGE_CREDITS.standard || 5;

  // Step 1: Check if company has sufficient credits before proceeding
  if (params.companyId && requiredCredits) {
    // Get current company credit balance
    const currentBalance = await convex.query(api.credits.getBalance, {
      companyId: params.companyId
    });
    
    if (currentBalance < requiredCredits) {
      console.warn('[triggerImageGeneration] Insufficient credits:', {
        currentBalance,
        creditsNeeded: requiredCredits,
        shortfall: requiredCredits - currentBalance
      });
      
      throw new Error(`Insufficient credits. You have ${currentBalance} credits but need ${requiredCredits} credits. Please purchase more credits to continue.`);
    }
    
  } else {
    console.warn('[triggerImageGeneration] Missing companyId or creditsUsed, cannot check balance');
  }

  // Resolve API key early: need kieAiId for placeholder record
  const { apiKey: resolvedImageKey, kieAiId } = await resolveKieApiKey(params.companyId);
  // Step 2: Create placeholder record
  const createdFileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
    companyId: params.companyId,
    userId: params.userId,
    projectId: params.projectId as Id<"storyboard_projects"> | undefined,
    categoryId: params.categoryId as Id<"storyboard_elements"> | Id<"storyboard_items"> | Id<"storyboard_projects"> | null | undefined,
    creditsUsed: requiredCredits,
    defaultAI: kieAiId as Id<"storyboard_kie_ai"> | undefined, // Store which KIE AI key was used
    model: kieModel,   // Store the AI model used for generation
    prompt: fullPrompt, // Store the prompt for traceability
    category: params.category || "generated",
    status: "generating",
    filename: `ai-generated-${Date.now()}.${params.outputFormat || 'png'}`,
    fileType: "image",
    mimeType: `image/${params.outputFormat || 'png'}`,
    size: 0,
    tags: [],
    uploadedBy: params.userId,
    metadata: {
      ...params.cinemaMetadata,
      model: actualModel,
      style: params.style,
      quality: params.quality,
      aspectRatio: params.aspectRatio,
      originalImageUrl: params.originalImageUrl,
      maskUrl: params.maskUrl,
      referenceImageUrls: params.referenceImageUrls || [],
      outputFormat: params.outputFormat,
      // Store crop info for server-side compositing in kie-callback
      cropX: params.cropX,
      cropY: params.cropY,
      cropWidth: params.cropWidth,
      cropHeight: params.cropHeight,
    },
  });
  
  // Step 3: Deduct credits from COMPANY credit balance
  if (params.companyId && requiredCredits) {
    await convex.mutation(api.credits.deductCredits, {
      companyId: params.companyId,
      tokens: requiredCredits,
      reason: `AI Image Generation - ${params.categoryId || 'General'}`,
    });
    
  } else {
    console.warn('[triggerImageGeneration] Missing companyId or creditsUsed, skipping deduction');
  }
  
  // Update the record with status (taskId will be set by callback when KIE AI responds)
  await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
    fileId: createdFileId,
    status: 'processing',
  });
  
  // Now create the KIE AI task with the callback URL
  const callbackUrl = params.callbackUrl ?? `${baseUrl}/api/kie-callback?fileId=${createdFileId}`;
  
  // Encode URLs to handle filenames with spaces/special characters
  const encodeUrl = (url?: string) => url ? encodeURI(url).replace(/%25/g, '%') : url;
  const encodedImageUrl = encodeUrl(params.imageUrl);
  const encodedMaskUrl = encodeUrl(params.maskUrl);
  const encodedOriginalImageUrl = encodeUrl(params.originalImageUrl);
  const encodedReferenceUrls = (params.referenceImageUrls || []).map(u => encodeUrl(u)!);

  const requestBody = {
    model: kieModel,
    callBackUrl: callbackUrl,
    input: actualModel === 'ideogram/character-edit' ? {
      prompt: fullPrompt,
      image_url: encodedImageUrl,
      mask_url: encodedMaskUrl,
      reference_image_urls: encodedReferenceUrls,
      rendering_speed: "BALANCED",
      style: "AUTO",
      expand_prompt: true,
      num_images: "1"
    } : actualModel === 'z-image' ? {
      prompt: fullPrompt,
      aspect_ratio: params.aspectRatio || '16:9',
      nsfw_checker: true,
    } : actualModel === 'nano-banana-2' ? {
      prompt: fullPrompt,
      image_input: [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean),
      aspect_ratio: params.aspectRatio || 'auto',
      google_search: false,
      resolution,
      output_format: 'jpg'
    } : actualModel === 'nano-banana-pro' ? {
      prompt: fullPrompt,
      image_input: [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean),
      aspect_ratio: params.aspectRatio || '1:1',
      resolution,
      output_format: 'png'
    } : actualModel === 'google/nano-banana-edit' ? {
      prompt: fullPrompt,
      image_urls: [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean),
      output_format: 'png',
      image_size: '1:1'
    } : actualModel === 'topaz/image-upscale' ? {
      prompt: fullPrompt,
      image_url: encodedOriginalImageUrl || encodedImageUrl,
      upscale_factor: params.quality || "1"
    } : actualModel === 'recraft/crisp-upscale' ? {
      prompt: fullPrompt,
      image: encodedOriginalImageUrl || encodedImageUrl
    } : actualModel === 'recraft/remove-background' ? {
      image: encodedOriginalImageUrl || encodedImageUrl,
    } : actualModel === 'ideogram/v3-reframe' ? {
      image_url: encodedOriginalImageUrl || encodedImageUrl,
      image_size: "landscape_16_9",
      rendering_speed: "BALANCED",
      style: "AUTO",
      num_images: "1",
    } : actualModel === 'gpt-image' ? {
      prompt: fullPrompt,
      input_urls: [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean),
      aspect_ratio: "1:1",
      quality: params.quality || "high"
    } : actualModel === 'gpt-image-2-image-to-image' ? (() => {
      let gpt2Nsfw = false;
      try { const p = JSON.parse(params.quality || '{}'); gpt2Nsfw = p.nsfwChecker ?? false; } catch {}
      const inputUrls = [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean);
      return {
        prompt: fullPrompt,
        ...(inputUrls.length > 0 && { input_urls: inputUrls }),
        aspect_ratio: params.aspectRatio || "auto",
        nsfw_checker: gpt2Nsfw,
      };
    })() : actualModel?.startsWith('gpt-image') ? {
      prompt: fullPrompt,
      input_urls: [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean),
      aspect_ratio: "1:1",
      quality: params.quality || "high"
    } : isImageToImageModel ? {
      prompt: fullPrompt,
      image_input: [encodedImageUrl, ...encodedReferenceUrls].filter(Boolean),
      aspect_ratio: params.aspectRatio,
      resolution,
    } : {
      prompt: fullPrompt,
      aspect_ratio: params.aspectRatio,
      quality: defaultQuality,
      image_url: encodedImageUrl,
      reference_image_urls: encodedReferenceUrls,
    },
  };
  
  let res: Response;

  try {
    res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolvedImageKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    if (params.companyId && requiredCredits) {
      await convex.mutation(api.credits.refundCredits, {
        companyId: params.companyId,
        tokens: requiredCredits,
        reason: `AI Image Generation Request Failed - ${params.categoryId || 'General'}`,
      });
    }

    await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
      fileId: createdFileId,
      status: 'failed',
    });

    throw error;
  }

  if (!res.ok) {
    if (params.companyId && requiredCredits) {
      await convex.mutation(api.credits.refundCredits, {
        companyId: params.companyId,
        tokens: requiredCredits,
        reason: `AI Image Generation Failed to Start - ${params.categoryId || 'General'}`,
      });
    }

    await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
      fileId: createdFileId,
      status: 'failed',
    });

    throw new Error(`Failed to create KIE AI task: ${res.statusText}`);
  }

  const data = await res.json();

  // Use centralized response handler
  const { handleKieResponse } = await import("./kieResponse");
  const { responseCode, responseMessage, taskId, isSuccess } = await handleKieResponse({
    fileId: createdFileId,
    responseData: data,
    companyId: params.companyId,
    creditsUsed: params.creditsUsed,
    modelName: kieModel,
  });

  if (!isSuccess) {
    console.error('[triggerImageGeneration] KIE AI returned error:', { code: responseCode, msg: responseMessage });
    throw new Error(`KIE AI Error (${responseCode}): ${responseMessage}`);
  }

  if (!taskId) {
    console.error('[triggerImageGeneration] No taskId found in response:', JSON.stringify(data, null, 2));
    throw new Error("No taskId received from KIE AI");
  }

  const result = {
    taskId,
    fileId: createdFileId,
    raw: data,
    responseCode,
    responseMessage,
  };

  return result;
}

export async function enhancePromptForImage(
  sceneContent: string,
  technical: { camera?: string[]; lighting?: string[]; perspective?: string[]; action?: string[] } | undefined,
  style: string
): Promise<string> {
  const systemPrompt = `You are a professional storyboard artist creating frames for TikTok/YouTube short stories.
Given a scene description, output a detailed image generation prompt.
Style: ${style}. Include camera angle, lighting, mood, character poses, background.
Keep it under 150 words. Output ONLY the prompt, no explanation.`;

  const userInput = technical
    ? `Scene: ${sceneContent}\nCamera: ${technical.camera?.join(", ")}\nLighting: ${technical.lighting?.join(", ")}\nAction: ${technical.action?.join(", ")}`
    : sceneContent;

  const res = await fetch("https://api.kie.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  if (!res.ok) return sceneContent;
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? sceneContent;
}
