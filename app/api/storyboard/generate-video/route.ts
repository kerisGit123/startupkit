import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  generateKlingVideo,
  generateVeoVideo,
  calcVideoCredits,
  type VideoModel,
  type VideoQuality,
} from "@/lib/storyboard/videoAI";

const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/callback/video`;

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { model, quality, duration, aspectRatio, prompt, imageUrl, itemId, companyId, userId } = await req.json();

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

    // Check and deduct credits if companyId is provided
    if (companyId) {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

      const currentBalance = await convex.query(api.credits.getBalance, { companyId });
      if (currentBalance < credits) {
        return NextResponse.json(
          { error: `Insufficient credits. You have ${currentBalance} but need ${credits}.` },
          { status: 402 }
        );
      }

      await convex.mutation(api.credits.deductCredits, {
        companyId,
        tokens: credits,
        reason: `AI Video Generation - ${m} (${q})`,
      });
    }

    let result: { taskId?: string };

    try {
      if (m === "veo-3-1") {
        result = await generateVeoVideo({
          quality: q as "fast" | "quality",
          imageUrl,
          prompt,
          aspectRatio: aspectRatio ?? "9:16",
          duration: dur,
          callbackUrl: CALLBACK_URL,
          companyId,
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
          companyId,
        });
      }
    } catch (apiError) {
      // Refund credits on API failure
      if (companyId) {
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        await convex.mutation(api.credits.refundCredits, {
          companyId,
          tokens: credits,
          reason: `Refund: Video generation API failed - ${m}`,
        });
      }
      throw apiError;
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
