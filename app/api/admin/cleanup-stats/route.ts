import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "storyboardbucket";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const tempsFiles = await convex.query(api.storyboard.storyboardFiles.listTempFiles);

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    // Cleanable = temp files older than 7 days — exactly what "Clean Temporary Files" deletes
    const cleanable = tempsFiles.filter(f => (f.createdAt ?? f.uploadedAt) < now - sevenDaysMs);

    // Total size of temp files only (listAll replaced with listTempFiles for security)
    const totalBytes = tempsFiles.reduce((acc, f) => acc + (f.size ?? 0), 0);

    const stats = {
      totalFiles: tempsFiles.length,
      tempsFiles: tempsFiles.length,   // updated below if R2 has more
      oldFiles: cleanable.length,      // "cleanable temps" — renamed in UI
      totalSize: formatBytes(totalBytes),
    };

    // Cross-check tempsFiles against actual R2 temps/ prefix count
    try {
      const listResp = await r2.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: "temps/",
        MaxKeys: 1000,
      }));
      const r2Count = listResp.Contents?.length ?? 0;
      // Take the higher count so we never under-report
      stats.tempsFiles = Math.max(stats.tempsFiles, r2Count);
    } catch (r2Error) {
      console.error("[cleanup-stats] R2 list failed:", r2Error);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[cleanup-stats] Error:", error);
    return NextResponse.json({ error: "Failed to get cleanup statistics" }, { status: 500 });
  }
}
