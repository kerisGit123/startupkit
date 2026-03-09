import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { taskId, status, result } = data;

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    if (status === "completed" && result?.video_url) {
      await convex.mutation(api.storyboard.storyboardItems.updateByVideoTaskId, {
        taskId,
        videoUrl: result.video_url,
        generationStatus: "completed",
      });
    } else if (status === "failed") {
      await convex.mutation(api.storyboard.storyboardItems.updateByVideoTaskId, {
        taskId,
        generationStatus: "failed",
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[callback/video]", err);
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}
