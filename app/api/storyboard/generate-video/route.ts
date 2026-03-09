import { NextRequest, NextResponse } from "next/server";
import {
  generateKlingVideo,
  generateVeoVideo,
  calcVideoCredits,
  type VideoModel,
  type VideoQuality,
} from "@/lib/storyboard/videoAI";

const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/callback/video`;

export async function POST(req: NextRequest) {
  try {
    const { model, quality, duration, aspectRatio, prompt, imageUrl, itemId } = await req.json();

    if (!prompt || !model) {
      return NextResponse.json({ error: "prompt and model required" }, { status: 400 });
    }
    if (!process.env.KIE_AI_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not configured" }, { status: 500 });
    }

    const m = (model ?? "kling-3.0") as VideoModel;
    const q = (quality ?? (m === "veo-3-1" ? "fast" : "std")) as VideoQuality;
    const dur = Number(duration ?? 5);
    const credits = calcVideoCredits(m, q, dur);

    let result: { taskId?: string };

    if (m === "veo-3-1") {
      result = await generateVeoVideo({
        quality: q as "fast" | "quality",
        imageUrl,
        prompt,
        aspectRatio: aspectRatio ?? "9:16",
        duration: dur,
        callbackUrl: CALLBACK_URL,
      });
    } else {
      result = await generateKlingVideo({
        tier: q as "std" | "pro",
        startFrameUrl: imageUrl,
        audioEnabled: false,
        duration: dur,
        aspectRatio: aspectRatio ?? "9:16",
        prompt,
        callbackUrl: CALLBACK_URL,
      });
    }

    return NextResponse.json({
      taskId: result.taskId,
      model: m,
      quality: q,
      duration: dur,
      creditsUsed: credits,
      itemId,
    });
  } catch (err) {
    console.error("[generate-video]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
