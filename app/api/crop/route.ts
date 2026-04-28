import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { image, aspectRatioString } = body;

    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    console.log(`[crop] Direct crop operation - aspect ratio: ${aspectRatioString || 'none'}`);
    
    // For direct cropping, we just return the cropped image as-is
    // The frontend has already done the cropping, so we just return the image
    // This endpoint exists for consistency with the API structure
    
    // In a real implementation, you might want to:
    // 1. Validate the image is properly cropped
    // 2. Apply any post-processing (like aspect ratio enforcement)
    // 3. Store the result somewhere
    
    // For now, just return the image as the result
    const result = {
      url: image, // The cropped image data URL
      aspectRatio: aspectRatioString || "original",
      operation: "direct_crop"
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[crop] Error:", error);
    return NextResponse.json(
      { error: "Crop operation failed" },
      { status: 500 }
    );
  }
}
