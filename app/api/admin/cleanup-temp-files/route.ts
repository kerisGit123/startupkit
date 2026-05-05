import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you might want to implement proper admin role checking)
    // For now, we'll allow any authenticated user
    console.log("[cleanup-temp-files] Admin cleanup requested by:", userId);

    const body = await req.json();
    const { daysOlderThan = 7 } = body; // Default to 7 days

    if (typeof daysOlderThan !== 'number' || daysOlderThan < 1) {
      return NextResponse.json({ error: "Invalid daysOlderThan parameter" }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const now = Date.now();
    const cutoffTime = now - (daysOlderThan * 24 * 60 * 60 * 1000);
    
    console.log(`[cleanup-temp-files] Cleaning files older than ${daysOlderThan} days (before ${new Date(cutoffTime)})`);

    // Step 1: Get old files from Convex
    const tempsFiles = await convex.query(api.storyboard.storyboardFiles.listTempFiles);
    console.log(`[cleanup-temp-files] Total temps files in storyboard_files: ${tempsFiles.length}`);

    if (tempsFiles.length > 0) {
      console.log(`[cleanup-temp-files] Temps files details:`);
      tempsFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ID: ${file._id}, r2Key: ${file.r2Key}, createdAt: ${new Date(file.createdAt).toISOString()}, Category: ${file.category}`);
      });
    }

    const oldFiles = tempsFiles.filter(f => {
      const fileTime = f.createdAt ?? f.uploadedAt;
      return fileTime < cutoffTime;
    });
    
    console.log(`[cleanup-temp-files] Cutoff time: ${new Date(cutoffTime).toISOString()}`);
    console.log(`[cleanup-temp-files] Found ${oldFiles.length} old files to delete from Convex`);
    
    if (oldFiles.length > 0) {
      console.log(`[cleanup-temp-files] Old files to delete:`);
      oldFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ID: ${file._id}, r2Key: ${file.r2Key}, createdAt: ${new Date(file.createdAt).toISOString()}, Category: ${file.category}`);
      });
    }

    // Step 2: Delete files from R2 using r2Key from Convex records
    let deletedR2Files = 0;
    const errors: string[] = [];

    for (const file of oldFiles) {
      if (file.r2Key) {
        try {
          await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file.r2Key }));
          deletedR2Files++;
        } catch (r2Error) {
          errors.push(`R2 delete failed for ${file.r2Key}: ${r2Error instanceof Error ? r2Error.message : 'Unknown'}`);
        }
      }
    }

    // Step 3: Delete records from Convex
    let deletedConvexRecords = 0;
    for (const file of oldFiles) {
      try {
        await convex.mutation(api.storyboard.storyboardFiles.remove, { id: file._id });
        deletedConvexRecords++;
      } catch (convexError) {
        errors.push(`Convex delete failed for ${file._id}: ${convexError instanceof Error ? convexError.message : 'Unknown'}`);
      }
    }

    // Step 4: Delete raw R2 temps/ objects (no Convex record — partial uploads, staging files)
    // These are the files counted by cleanup-stats but never deleted by the Convex-only pass above.
    try {
      const cutoffDate = new Date(cutoffTime);
      let continuationToken: string | undefined;
      const staleKeys: string[] = [];

      do {
        const listResp = await r2.send(new ListObjectsV2Command({
          Bucket: BUCKET,
          Prefix: "temps/",
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        }));

        for (const obj of listResp.Contents ?? []) {
          if (obj.Key && obj.LastModified && obj.LastModified < cutoffDate) {
            staleKeys.push(obj.Key);
          }
        }

        continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
      } while (continuationToken);

      // Batch delete in chunks of 1000 (R2 limit)
      for (let i = 0; i < staleKeys.length; i += 1000) {
        const chunk = staleKeys.slice(i, i + 1000);
        await r2.send(new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: { Objects: chunk.map(Key => ({ Key })), Quiet: true },
        }));
        deletedR2Files += chunk.length;
      }

      if (staleKeys.length > 0) {
        console.log(`[cleanup-temp-files] Deleted ${staleKeys.length} raw R2 temps/ objects`);
      }
    } catch (r2ListError) {
      console.error("[cleanup-temp-files] Error cleaning raw R2 temps/:", r2ListError);
      errors.push(`R2 temps/ scan failed: ${r2ListError instanceof Error ? r2ListError.message : 'Unknown'}`);
    }

    const result = {
      deletedFiles: deletedR2Files,
      deletedRecords: deletedConvexRecords,
      freedSpace: deletedR2Files > 0 ? `~${deletedR2Files} objects removed` : "0 Bytes",
      errors,
    };

    console.log(`[cleanup-temp-files] Cleanup completed:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[cleanup-temp-files] Error:", error);
    return NextResponse.json(
      { error: "Failed to perform cleanup" },
      { status: 500 }
    );
  }
}
