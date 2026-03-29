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
    model: "kie-image-pro-v2",
    promptSuffix: "professional photography, cinematic lighting, high detail, 4K",
  },
  cartoon: {
    label: "Cartoon",
    model: "kie-image-v2",
    promptSuffix: "colorful cartoon style, bold outlines, vibrant colors",
  },
  anime: {
    label: "Anime",
    model: "kie-image-v2",
    promptSuffix: "anime style, clean lines, expressive eyes, vibrant palette",
  },
  cinematic: {
    label: "Cinematic",
    model: "kie-image-pro-v2",
    promptSuffix: "cinematic film still, dramatic lighting, shallow depth of field, moody atmosphere",
  },
} as const;

export type ImageStyle = keyof typeof STYLE_PRESETS;
export type ImageQuality = "standard" | "high";

export const IMAGE_CREDITS: Record<ImageQuality, number> = {
  standard: 5,
  high: 10,
};

export async function triggerImageGeneration(params: {
  prompt: string;
  style: ImageStyle;
  aspectRatio: string;
  quality: ImageQuality;
  callbackUrl?: string;
  companyId?: string;
  userId?: string;
  projectId?: string;
  categoryId?: string;
  creditsUsed?: number; // Add actual credit amount from AI panel
  model?: string; // Add actual model from EditImageAIPanel
  imageUrl?: string; // Add current canvas image URL for character-edit models
  referenceImageUrls?: string[]; // Add reference images for character-edit models
  maskUrl?: string; // Add mask URL for character-edit inpainting
  existingFileId?: string; // Add existing file ID to update instead of creating new
}) {
  // Use the provided model or fall back to STYLE_PRESETS
  const actualModel = params.model || STYLE_PRESETS[params.style]?.model;
  const { promptSuffix } = STYLE_PRESETS[params.style];
  const fullPrompt = `${params.prompt}, ${promptSuffix}`;
  
  console.log('[triggerImageGeneration] Using model:', actualModel, 'instead of STYLE_PRESETS');
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
  
  // First create the file record
  const createdFileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
    companyId: params.companyId,
    userId: params.userId,
    projectId: params.projectId, // Project ID is correct for generated files
    categoryId: params.categoryId, // This links to the storyboard shot
    creditsUsed: params.creditsUsed || IMAGE_CREDITS[params.quality],
    // sourceUrl omitted - will be set when KIE AI returns the actual file
    // r2Key omitted - will be set when actual file is downloaded (not for generated category)
    category: "generated",
    status: "processing",
    // taskId omitted temporarily due to schema mismatch - will be set via updateFromCallback
    // Add required fields for logUpload
    filename: `ai-generated-${Date.now()}.png`,
    fileType: "image",
    mimeType: "image/png",
    size: 0, // Will be updated when actual file is downloaded
    tags: [],
    uploadedBy: params.userId
    // uploadedAt, createdAt and isFavorite are handled automatically by the logUpload function
  });
  
  // Step 2: Check if company has sufficient credits before proceeding
  if (params.companyId && params.creditsUsed) {
    console.log('[triggerImageGeneration] Checking credit balance:', {
      companyId: params.companyId,
      creditsUsed: params.creditsUsed
    });
    
    // Get current company credit balance
    const currentBalance = await convex.query(api.credits.getBalance, {
      companyId: params.companyId
    });
    
    console.log('[triggerImageGeneration] Current balance:', currentBalance, 'Credits needed:', params.creditsUsed);
    
    if (currentBalance < params.creditsUsed) {
      console.warn('[triggerImageGeneration] Insufficient credits:', {
        currentBalance,
        creditsNeeded: params.creditsUsed,
        shortfall: params.creditsUsed - currentBalance
      });
      
      throw new Error(`Insufficient credits. You have ${currentBalance} credits but need ${params.creditsUsed} credits. Please purchase more credits to continue.`);
    }
    
    console.log('[triggerImageGeneration] Sufficient credits available, proceeding with generation');
  } else {
    console.warn('[triggerImageGeneration] Missing companyId or creditsUsed, cannot check balance');
  }
  
  // Step 3: Deduct credits from COMPANY credit balance
  if (params.companyId && params.creditsUsed) {
    console.log('[triggerImageGeneration] Deducting credits:', {
      companyId: params.companyId,
      creditsUsed: params.creditsUsed,
      reason: `AI Image Generation - ${params.categoryId || 'General'}`
    });
    
    await convex.mutation(api.credits.deductCredits, {
      companyId: params.companyId,
      tokens: params.creditsUsed,
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
  
  const res = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: actualModel, // Use the actual model
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
      } : {
        prompt: fullPrompt,
        aspect_ratio: params.aspectRatio,
        quality: params.quality,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create KIE AI task: ${res.statusText}`);
  }

  const data = await res.json();
  const taskId = data.data?.taskId || data.data?.recordId;
  
  if (!taskId) {
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
