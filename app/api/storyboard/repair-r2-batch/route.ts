// Internal endpoint called only by the orphan repair cron (Convex action).
// Convex actions can't use the AWS SDK directly (V8 isolates lack Node fs/crypto),
// so the action sends a list of r2Keys here for batch deletion.
//
// Auth: shared secret via x-internal-secret header. NOT for browser use.

import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 60;

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
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_REPAIR_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { r2Keys = [] } = await req.json() as { r2Keys: string[] };

  let deleted = 0;
  for (const key of r2Keys) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      deleted++;
    } catch (err) {
      console.warn(`[repair-r2-batch] R2 delete failed for "${key}":`, err);
    }
  }

  return NextResponse.json({ deleted, total: r2Keys.length });
}
