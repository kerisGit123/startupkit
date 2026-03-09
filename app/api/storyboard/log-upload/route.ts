import { NextRequest, NextResponse } from "next/server";
import { convex, api } from "@/lib/convex-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orgId,
      userId,
      projectId,
      r2Key,
      filename,
      fileType,
      mimeType,
      size,
      category,
      tags,
      status,
      uploadedBy,
    } = body;

    // Log the upload in Convex with new schema
    const result = await convex.mutation(api.storyboard.storyboardFiles.logUpload, {
      orgId,
      userId,
      projectId,
      r2Key,
      filename,
      fileType,
      mimeType,
      size,
      category,
      tags: tags || [],
      uploadedBy: uploadedBy || "unknown",
      status: status || "ready",
    });

    console.log(`[log-upload] Logged file: ${filename} for org: ${orgId}, user: ${userId}`);
    
    return NextResponse.json({ success: true, fileId: result });
  } catch (error) {
    console.error("[log-upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to log upload" },
      { status: 500 }
    );
  }
}
