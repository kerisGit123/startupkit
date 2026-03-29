import { NextRequest, NextResponse } from "next/server";
import {
  triggerImageGeneration,
  enhancePromptForImage,
  IMAGE_CREDITS,
  type ImageStyle,
  type ImageQuality,
} from "@/lib/storyboard/kieAI";

export async function POST(req: NextRequest) {
  try {
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
      existingFileId  // NEW - existing file ID to update instead of creating new
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "sceneContent required" }, { status: 400 });
    }

    // Optionally enhance prompt with GPT
    const basePrompt = enhance !== false
      ? await enhancePromptForImage(prompt, null, style ?? "realistic")
      : prompt;
    const finalPrompt = null
      ? `${null}. ${basePrompt}`
      : basePrompt;

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
      imageUrl,
      maskUrl,
      referenceImageUrls,
      existingFileId
    });

    const result = await triggerImageGeneration({
      prompt: finalPrompt,
      style: (style ?? "realistic") as ImageStyle,
      aspectRatio: aspectRatio ?? "9:16",
      quality: (quality ?? "standard") as ImageQuality,
      companyId,    // NEW
      userId,       // NEW
      projectId,    // NEW
      categoryId: itemId, // NEW - link to storyboard item
      creditsUsed,  // NEW - actual credit amount from AI panel
      model, // NEW - pass the actual model from EditImageAIPanel
      imageUrl, // NEW - pass canvas image URL for character-edit models
      referenceImageUrls, // NEW - pass reference images for character-edit models
      maskUrl, // NEW - pass mask URL for character-edit models
      existingFileId // NEW - pass existing file ID to update instead of creating new
    });

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
