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
    const { sceneContent, technical, style, quality, aspectRatio, itemId, enhance, characterContext } =
      await req.json();

    if (!sceneContent) {
      return NextResponse.json({ error: "sceneContent required" }, { status: 400 });
    }

    // Optionally enhance prompt with GPT
    const basePrompt = enhance !== false
      ? await enhancePromptForImage(sceneContent, technical, style ?? "realistic")
      : sceneContent;
    const finalPrompt = characterContext
      ? `${characterContext}. ${basePrompt}`
      : basePrompt;

    const result = await triggerImageGeneration({
      prompt: finalPrompt,
      style: (style ?? "realistic") as ImageStyle,
      aspectRatio: aspectRatio ?? "9:16",
      quality: (quality ?? "standard") as ImageQuality,
    });

    return NextResponse.json({
      taskId: result.taskId,
      prompt: finalPrompt,
      creditsUsed: IMAGE_CREDITS[(quality ?? "standard") as ImageQuality],
      itemId,
    });
  } catch (err) {
    console.error("[generate-image]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
