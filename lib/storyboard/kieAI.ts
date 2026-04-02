import { ConvexHttpClient } from "convex/browser";

const KIE_AI_BASE = "https://api.kie.ai";

// Placeholder record creation function
async function createPlaceholderRecord(params: {
  companyId: string;
  userId: string;
  projectId?: string;
  categoryId?: string;
  creditsUsed: number;
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
  
  console.log('[createPlaceholderRecord] Convex result:', result);
  console.log('[createPlaceholderRecord] FileId:', result.fileId);
  
  return result.fileId;
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
}

export async function triggerVideoGeneration(params: TriggerVideoGenerationParams) {
  console.log('[triggerVideoGeneration] Called with params:', {
    model: params.model,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    duration: params.duration,
    audio: params.audio,
    referenceImagesCount: params.referenceImages?.length || 0,
  });

  // Prepare the request body for Seedance 1.5 Pro API
  const requestBody = {
    model: params.model,
    callBackUrl: params.callBackUrl,
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

  console.log('[triggerVideoGeneration] Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KIE AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[triggerVideoGeneration] KIE AI response:', result);

    return result;
  } catch (error) {
    console.error('[triggerVideoGeneration] Error calling KIE AI:', error);
    throw error;
  }
}

export async function triggerImageGeneration(params: TriggerImageGenerationParams) {
  console.log('[triggerImageGeneration] Called with params:', {
    ...params,
    cropX: params.cropX,
    cropY: params.cropY,
    cropWidth: params.cropWidth,
    cropHeight: params.cropHeight,
    originalImageUrl: params.originalImageUrl,
    shouldComposite: !!params.originalImageUrl && 
                    params.cropX !== undefined && 
                    params.cropY !== undefined && 
                    params.cropWidth !== undefined && 
                    params.cropHeight !== undefined
  });

  // Use the provided model or fall back to STYLE_PRESETS
  const actualModel = params.model || STYLE_PRESETS[params.style]?.model;
  const { promptSuffix } = STYLE_PRESETS[params.style];
  const fullPrompt = `${params.prompt}, ${promptSuffix}`;
  
  // Convert pricing model ID to KIE AI model name
  let kieModel = actualModel;
  if (actualModel === 'gpt-image') {
    kieModel = 'gpt-image/1.5-image-to-image';
  }
  
  console.log('[triggerImageGeneration] Model details:', {
    providedModel: params.model,
    style: params.style,
    actualModel,
    kieModel,
    fullPrompt: fullPrompt.substring(0, 100) + '...'
  });
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
  
  console.log('[triggerImageGeneration] Model details:', {
    providedModel: params.model,
    style: params.style,
    actualModel,
    fullPrompt: fullPrompt.substring(0, 100) + '...'
  });
  console.log('[triggerImageGeneration] Image URLs:', { 
    imageUrl: params.imageUrl?.substring(0, 50) + '...', 
    maskUrl: params.maskUrl?.substring(0, 50) + '...',
    referenceImageUrls: params.referenceImageUrls?.length 
  });

  // Note: We'll create the file record after getting the taskId from KIE AI
  // This ensures the file record is created with the actual taskId and proper credit tracking

  // Step 2: Enhanced KIE AI call with fileId in callback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  console.log('[triggerImageGeneration] Environment check:', { 
    NEXT_PUBLIC_APP_URL: baseUrl,
    hasEnvVar: !!baseUrl,
    envVarLength: baseUrl?.length 
  });
  
  // Initialize Convex client for server-side operations
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const { api } = await import("../../convex/_generated/api");
  const requiredCredits = params.creditsUsed || IMAGE_CREDITS[params.quality] || IMAGE_CREDITS.standard || 5;

  // Step 1: Check if company has sufficient credits before proceeding
  if (params.companyId && requiredCredits) {
    console.log('[triggerImageGeneration] Checking credit balance:', {
      companyId: params.companyId,
      creditsUsed: requiredCredits
    });
    
    // Get current company credit balance
    const currentBalance = await convex.query(api.credits.getBalance, {
      companyId: params.companyId
    });
    
    console.log('[triggerImageGeneration] Current balance:', currentBalance, 'Credits needed:', requiredCredits);
    
    if (currentBalance < requiredCredits) {
      console.warn('[triggerImageGeneration] Insufficient credits:', {
        currentBalance,
        creditsNeeded: requiredCredits,
        shortfall: requiredCredits - currentBalance
      });
      
      throw new Error(`Insufficient credits. You have ${currentBalance} credits but need ${requiredCredits} credits. Please purchase more credits to continue.`);
    }
    
    console.log('[triggerImageGeneration] Sufficient credits available, proceeding with generation');
  } else {
    console.warn('[triggerImageGeneration] Missing companyId or creditsUsed, cannot check balance');
  }

  // Step 2: Create placeholder record
  const createdFileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
    companyId: params.companyId,
    userId: params.userId,
    projectId: params.projectId,
    categoryId: params.categoryId,
    creditsUsed: requiredCredits,
    category: "generated",
    status: "generating",
    filename: `ai-generated-${Date.now()}.${params.outputFormat || 'png'}`,
    fileType: "image",
    mimeType: `image/${params.outputFormat || 'png'}`,
    size: 0,
    tags: [],
    uploadedBy: params.userId,
    metadata: {
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
    console.log('[triggerImageGeneration] Deducting credits:', {
      companyId: params.companyId,
      creditsUsed: requiredCredits,
      reason: `AI Image Generation - ${params.categoryId || 'General'}`
    });
    
    await convex.mutation(api.credits.deductCredits, {
      companyId: params.companyId,
      tokens: requiredCredits,
      reason: `AI Image Generation - ${params.categoryId || 'General'}`,
    });
    
    console.log('[triggerImageGeneration] Credits deducted successfully');
  } else {
    console.warn('[triggerImageGeneration] Missing companyId or creditsUsed, skipping deduction');
  }
  
  // Update the record with status (taskId will be set by callback when KIE AI responds)
  await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
    fileId: createdFileId,
    status: 'processing',
  });
  
  console.log('[triggerImageGeneration] Created file record:', { fileId: createdFileId });
  
  // Now create the KIE AI task with the callback URL
  const callbackUrl = params.callbackUrl ?? `${baseUrl}/api/kie-callback?fileId=${createdFileId}`;
  console.log('[triggerImageGeneration] Using callback URL:', callbackUrl);
  
  // Debug: Log the exact request being sent to KIE AI
  const requestBody = {
    model: kieModel,
    callBackUrl: callbackUrl,
    input: actualModel === 'ideogram/character-edit' ? {
      prompt: fullPrompt,
      image_url: params.imageUrl,
      mask_url: params.maskUrl,
      reference_image_urls: params.referenceImageUrls || [],
      rendering_speed: "BALANCED",
      style: "AUTO",
      expand_prompt: true,
      num_images: "1"
    } : actualModel === 'nano-banana-2' ? {
      prompt: fullPrompt,
      image_input: [params.imageUrl, ...(params.referenceImageUrls || [])].filter(Boolean),
      aspect_ratio: params.aspectRatio || 'auto',
      google_search: false,
      resolution,
      output_format: 'jpg'
    } : actualModel === 'nano-banana-pro' ? {
      prompt: fullPrompt,
      image_input: [params.imageUrl, ...(params.referenceImageUrls || [])].filter(Boolean),
      aspect_ratio: params.aspectRatio || '1:1',
      resolution,
      output_format: 'png'
    } : actualModel === 'google/nano-banana-edit' ? {
      prompt: fullPrompt,
      image_urls: [params.imageUrl, ...(params.referenceImageUrls || [])].filter(Boolean),
      output_format: 'png',
      image_size: '1:1'
    } : actualModel === 'topaz/image-upscale' ? {
      prompt: fullPrompt,
      image_url: params.originalImageUrl || params.imageUrl,
      upscale_factor: params.quality || "1"
    } : actualModel === 'recraft/crisp-upscale' ? {
      prompt: fullPrompt,
      image: params.originalImageUrl || params.imageUrl
    } : actualModel === 'gpt-image' ? {
      prompt: fullPrompt,
      input_urls: [params.imageUrl, ...(params.referenceImageUrls || [])].filter(Boolean),
      aspect_ratio: "1:1",
      quality: params.quality || "high"
    } : actualModel?.startsWith('gpt-image') ? {
      prompt: fullPrompt,
      input_urls: [params.imageUrl, ...(params.referenceImageUrls || [])].filter(Boolean),
      aspect_ratio: "1:1",
      quality: params.quality || "high"
    } : isImageToImageModel ? {
      prompt: fullPrompt,
      image_input: [params.imageUrl, ...(params.referenceImageUrls || [])].filter(Boolean),
      aspect_ratio: params.aspectRatio,
      resolution,
    } : {
      prompt: fullPrompt,
      aspect_ratio: params.aspectRatio,
      quality: defaultQuality,
      image_url: params.imageUrl,
      reference_image_urls: params.referenceImageUrls || [],
    },
  };
  
  console.log('[triggerImageGeneration] Sending to KIE AI:', JSON.stringify(requestBody, null, 2));

  let res: Response;

  try {
    res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
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
  console.log('[triggerImageGeneration] Raw KIE AI response:', JSON.stringify(data, null, 2));
  
  // Check if there's an error in the response
  if (data.code && data.code !== 200) {
    console.error('[triggerImageGeneration] KIE AI returned error:', { code: data.code, msg: data.msg });
    throw new Error(`KIE AI Error (${data.code}): ${data.msg}`);
  }
  
  // Extract taskId from various possible locations
  const taskId = data.data?.taskId || data.data?.recordId || data.taskId || data.recordId || data.data?.id;
  
  console.log('[triggerImageGeneration] Extracted taskId:', taskId);
  console.log('[triggerImageGeneration] data field contents:', JSON.stringify(data.data, null, 2));
  
  if (!taskId) {
    console.error('[triggerImageGeneration] No taskId found in response. Available fields:', Object.keys(data));
    console.error('[triggerImageGeneration] Full data structure:', JSON.stringify(data, null, 2));
    throw new Error("No taskId received from KIE AI");
  }

  // Return the result with the fileId we already created
  const result = { 
    taskId, 
    fileId: createdFileId, // Return the created file ID
    raw: data 
  };
  
  console.log('[triggerImageGeneration] Returning result:', result);
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
