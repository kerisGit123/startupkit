import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "storyboardbucket";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[r2-upload] Request body:", body);
    
    const { projectId, filename, mimeType, contentType, category } = body;

    // Support both mimeType and contentType for compatibility
    const actualMimeType = mimeType || contentType;

    if (!filename || !actualMimeType) {
      console.log("[r2-upload] Missing required fields:", { filename, mimeType, contentType });
      return NextResponse.json({ error: "Missing filename or mimeType" }, { status: 400 });
    }

    // Debug environment variables (remove in production)
    console.log("[r2-upload] Environment check:", {
      hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL,
    });

    let key: string;
    
    // If projectId is provided, use project-based folder structure
    if (projectId) {
      const ext = filename.split(".").pop() ?? "";
      key = `project-${projectId}/${category ?? "uploads"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    } else {
      // For direct uploads without projectId (like element references)
      key = filename;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: actualMimeType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : null;

    return NextResponse.json({ uploadUrl, key, publicUrl });
  } catch (err) {
    console.error("[r2-upload]", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
