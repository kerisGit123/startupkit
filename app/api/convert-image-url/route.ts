import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    console.log("[convert-image-url] Converting image URL to data URL:", imageUrl?.substring(0, 50));

    // Fetch the image from the URL (server-side, no CORS issues)
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Get content type from response or default to image/png
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Create data URL
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log("[convert-image-url] Successfully converted to data URL");

    return NextResponse.json({ 
      success: true, 
      dataUrl,
      contentType 
    });

  } catch (error) {
    console.error("[convert-image-url] Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to convert image" 
    }, { status: 500 });
  }
}
