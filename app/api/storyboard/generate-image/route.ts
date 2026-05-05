import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  triggerImageGeneration,
  triggerVideoGeneration,
  enhancePromptForImage,
  IMAGE_CREDITS,
  type ImageStyle,
  type ImageQuality,
} from "@/lib/storyboard/kieAI";

export async function POST(req: NextRequest) {
  try {
    // Internal server-side calls (e.g. Director agent tool-executor) bypass Clerk cookie auth
    // by passing X-Internal-Director: <WEBHOOK_SECRET> — all Convex ops in this path don't need auth.
    const internalSecret = req.headers.get("X-Internal-Director");
    const isInternalCall = !!(internalSecret && process.env.WEBHOOK_SECRET && internalSecret === process.env.WEBHOOK_SECRET);

    let convexToken: string | null = null;
    if (!isInternalCall) {
      const authResult = await auth();
      if (!authResult.userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
      if (!convexToken) {
        try { convexToken = await authResult.getToken(); } catch {}
      }
    }

    const {
      sceneContent: prompt,
      technical, 
      style, 
      quality, 
      aspectRatio, 
      itemId, 
      enhance, 
      characterContext,
      companyId,    // NEW
      userId,       // NEW
      projectId,    // NEW
      creditsUsed,  // NEW - actual credit amount from AI panel
      model,        // NEW - actual model from EditImageAIPanel
      imageUrl,     // NEW - canvas image URL for character-edit models
      referenceImageUrls, // NEW - reference images for character-edit models
      maskUrl,       // NEW - mask URL for character-edit models
      existingFileId,  // NEW - existing file ID to update instead of creating new
      cropX,          // NEW - crop X coordinate
      cropY,          // NEW - crop Y coordinate
      cropWidth,      // NEW - crop width
      cropHeight,     // NEW - crop height
      originalImageUrl, // NEW - original image URL for compositing
      outputFormat,   // NEW - output format from VideoImageAIPanel
      duration,       // NEW - video duration for Seedance 1.5 Pro
      audioEnabled,   // NEW - audio enabled for Seedance 1.5 Pro
      cinemaMetadata, // Cinema Studio metadata (camera, lens, focal, aperture, etc.)
      elementId,      // Element ID — when present, file is categorized as "elements"
      variantLabel,   // Element variant label (for character variants)
      variantModel,   // Element variant model used
      resolution,     // Image resolution: 1K, 2K, 4K
      category: categoryOverride,   // Optional category override (e.g. "worldview")
      categoryId: categoryIdOverride, // Optional categoryId override
    } = await req.json();

    console.log('[generate-image] API route received parameters:', {
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      originalImageUrl,
      imageUrl,
      referenceImageUrls,
      maskUrl,
      existingFileId
    });

    if (!prompt) {
      return NextResponse.json({ error: "sceneContent required" }, { status: 400 });
    }

    // Optionally enhance prompt with GPT
    const basePrompt = enhance !== false
      ? await enhancePromptForImage(prompt, undefined, style ?? "realistic")
      : prompt;
    const finalPrompt = basePrompt;

    // Check if this is a video generation model (Seedance 1.5 Pro)
    const isVideoModel = model === "bytedance/seedance-1.5-pro";
    
    console.log('[generate-image] API route called with:', {
      finalPrompt,
      style,
      aspectRatio,
      quality,
      companyId,
      userId,
      projectId,
      itemId,
      creditsUsed,
      model,
      isVideoModel,
      imageUrl,
      maskUrl,
      referenceImageUrls,
      existingFileId,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      originalImageUrl,
      duration,
      audioEnabled
    });

    let result;
    
    if (isVideoModel) {
      // Use video generation for Seedance 1.5 Pro
      result = await triggerVideoGeneration({
        prompt: finalPrompt,
        model: model,
        fileId: existingFileId || '', // Will be created by triggerVideoGeneration
        callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/kie-callback`, // Will be updated in the function
        companyId,
        userId,
        projectId,
        referenceImages: referenceImageUrls || [],
        aspectRatio: aspectRatio === "auto" ? "1:1" : aspectRatio, // Fix "auto" to valid value
        resolution: quality === "standard" ? "720p" : quality === "high" ? "1080p" : "480p", // Map quality to resolution
        duration: duration || "8s",
        audio: audioEnabled || false,
        convexToken: convexToken ?? undefined,
      });
    } else {
      // Use image generation for other models
      result = await triggerImageGeneration({
        prompt: finalPrompt,
        style: (style ?? "realistic") as ImageStyle,
        aspectRatio: aspectRatio ?? "9:16",
        quality: (quality ?? "standard") as ImageQuality,
        companyId,
        userId,
        projectId,
        categoryId: categoryIdOverride || elementId || itemId,
        category: categoryOverride || (elementId ? "elements" : "generated"),
        creditsUsed,  // NEW - actual credit amount from AI panel
        model, // NEW - pass the actual model from EditImageAIPanel
        imageUrl, // NEW - pass canvas image URL for character-edit models
        referenceImageUrls, // NEW - pass reference images for character-edit models
        maskUrl, // NEW - pass mask URL for character-edit models
        existingFileId, // NEW - pass existing file ID to update instead of creating new
        cropX,          // NEW - pass crop X coordinate
        cropY,          // NEW - pass crop Y coordinate
        cropWidth,      // NEW - pass crop width
        cropHeight,     // NEW - pass crop height
        originalImageUrl, // NEW - pass original image URL for compositing
        outputFormat,    // NEW - pass output format from VideoImageAIPanel
        convexToken: convexToken ?? undefined,
        cinemaMetadata, // Cinema Studio metadata
        variantLabel,
        variantModel,
        resolution,
      });
    }

    console.log('[generate-image] triggerImageGeneration result:', result);

    const response = {
      taskId: result.taskId,
      fileId: result.fileId, // NEW - return placeholder ID
      prompt: finalPrompt,
      creditsUsed: creditsUsed || IMAGE_CREDITS[(quality ?? "standard") as ImageQuality], // Use actual credits or fallback
      itemId,
    };

    console.log('[generate-image] API response:', response);

    return NextResponse.json(response);
  } catch (err) {
    console.error("[generate-image]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
