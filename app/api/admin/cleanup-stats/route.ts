import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { S3Client, ListObjectsV2Command, GetObjectAttributesCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "storyboardbucket";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you might want to implement proper admin role checking)
    // For now, we'll allow any authenticated user
    console.log("[cleanup-stats] Admin stats requested by:", userId);

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Get stats from Convex
    const allFiles = await convex.query(api.storyboard.storyboardFiles.listAll);
    
    // Calculate stats
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    const stats = {
      totalFiles: allFiles.length,
      tempsFiles: allFiles.filter(f => f.category === "temps").length,
      oldFiles: allFiles.filter(f => {
        const fileAge = now - f.uploadedAt;
        return fileAge > (7 * oneDayMs); // Default to 7 days
      }).length,
      totalSize: "0 MB", // We'll calculate this from R2
    };

    // Get R2 stats for temps folder
    try {
      const listParams = {
        Bucket: BUCKET,
        Prefix: "temps/",
        MaxKeys: 1000,
      };

      const listCommand = new ListObjectsV2Command(listParams);
      const listResponse = await r2.send(listCommand);

      let totalBytes = 0;
      let tempsFileCount = 0;

      if (listResponse.Contents) {
        for (const object of listResponse.Contents) {
          if (object.Key?.startsWith("temps/")) {
            tempsFileCount++;
            totalBytes += object.Size || 0;
          }
        }
      }

      // Format total size
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      stats.totalSize = formatBytes(totalBytes);
      stats.tempsFiles = Math.max(stats.tempsFiles, tempsFileCount); // Use the higher count
    } catch (r2Error) {
      console.error("[cleanup-stats] Error getting R2 stats:", r2Error);
      // Keep the Convex stats if R2 fails
    }

    console.log("[cleanup-stats] Stats calculated:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[cleanup-stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to get cleanup statistics" },
      { status: 500 }
    );
  }
}
