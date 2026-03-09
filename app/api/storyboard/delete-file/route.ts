import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
    const { r2Key } = await req.json();
    
    if (!r2Key) {
      return NextResponse.json({ error: "R2 key is required" }, { status: 400 });
    }

    console.log("[r2-delete] Deleting file:", r2Key);

    // Delete from R2 bucket
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
    });

    await r2.send(command);

    console.log("[r2-delete] Successfully deleted:", r2Key);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[r2-delete] Failed to delete file:", err);
    return NextResponse.json(
      { error: "Failed to delete file from storage" },
      { status: 500 }
    );
  }
}
