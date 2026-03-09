import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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

export async function POST(req: NextRequest) {
  try {
    const { r2Key, filename } = await req.json();
    
    if (!r2Key) {
      return NextResponse.json({ error: "R2 key is required" }, { status: 400 });
    }

    console.log("[r2-download] Generating download URL for:", r2Key);

    // Generate signed URL for download
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 300 }); // 5 minutes

    console.log("[r2-download] Successfully generated download URL");
    return NextResponse.json({ downloadUrl });
  } catch (err) {
    console.error("[r2-download] Failed to generate download URL:", err);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
