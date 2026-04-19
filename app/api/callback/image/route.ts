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

    if (status === "completed" && result?.image_url) {
      // 1. Download image from Kie AI and upload to R2
      const imageResponse = await fetch(result.image_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Get the storyboard item to find its companyId
      const item = await convex.query(api.storyboard.storyboardItems.getByTaskId, { taskId });
      if (!item) {
        return NextResponse.json({ error: "Item not found for taskId" }, { status: 404 });
      }
      
      // Use the item's companyId for folder structure
      const companyId = item.companyId || "default-org";
      
      // Get upload URL from R2
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/storyboard/r2-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `generated-${taskId}.jpg`,
          contentType: "image/jpeg",
          category: "generated",
        }),
      });
      
      const { uploadUrl, key, publicUrl } = await uploadRes.json();
      
      // Upload to R2
      await fetch(uploadUrl, {
        method: "PUT",
        body: imageBuffer,
        headers: { "Content-Type": "image/jpeg" },
      });

      // 2. Update storyboard item with R2 URL
      await convex.mutation(api.storyboard.storyboardItems.updateByTaskId, {
        taskId,
        imageUrl: publicUrl,
        generationStatus: "completed",
      });

    } else if (status === "failed") {
      await convex.mutation(api.storyboard.storyboardItems.updateByTaskId, {
        taskId,
        generationStatus: "failed",
      });
      
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[callback/image]", err);
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}
