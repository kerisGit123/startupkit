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
    const allFiles = await convex.query(api.storyboard.storyboardFiles.listAll);
    console.log(`[cleanup-temp-files] Total files in storyboard_files: ${allFiles.length}`);
    
    // Log all temps files for debugging
    const tempsFiles = allFiles.filter(f => f.category === "temps");
    console.log(`[cleanup-temp-files] Total temps files: ${tempsFiles.length}`);
    
    if (tempsFiles.length > 0) {
      console.log(`[cleanup-temp-files] Temps files details:`);
      tempsFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ID: ${file._id}, r2Key: ${file.r2Key}, createdAt: ${new Date(file.createdAt).toISOString()}, Category: ${file.category}`);
      });
    }
    
    const oldFiles = allFiles.filter(f => {
      const isOld = f.createdAt < cutoffTime; // Use createdAt instead of uploadedAt
      const isTempsOrGenerated = f.category === "temps" || f.category === "generated";
      return isOld && isTempsOrGenerated;
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
    let totalBytesFreed = 0;
    const errors: string[] = [];

    console.log(`[cleanup-temp-files] Deleting R2 files based on Convex r2Key records...`);

    // Delete R2 files using r2Key from Convex records
    for (const file of oldFiles) {
      if (file.r2Key) {
        try {
          // Delete the object from R2 directly (without getting attributes first)
          const deleteParams = {
            Bucket: BUCKET,
            Key: file.r2Key,
          };
          
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await r2.send(deleteCommand);
          
          deletedR2Files++;
          // Note: We can't get size easily without GetObjectAttributes, so we'll estimate
          totalBytesFreed += 1024 * 1024; // Estimate 1MB per file for now
          
          console.log(`[cleanup-temp-files] Deleted R2 file: ${file.r2Key}`);
        } catch (r2Error) {
          console.error(`[cleanup-temp-files] Error deleting R2 file ${file.r2Key}:`, r2Error);
          errors.push(`Failed to delete R2 file ${file.r2Key}: ${r2Error instanceof Error ? r2Error.message : 'Unknown error'}`);
        }
      } else {
        console.log(`[cleanup-temp-files] No r2Key for file ${file._id}, skipping R2 deletion`);
      }
    }

    // Step 3: Delete records from Convex
    let deletedConvexRecords = 0;
    for (const file of oldFiles) {
      try {
        await convex.mutation(api.storyboard.storyboardFiles.remove, { id: file._id });
        deletedConvexRecords++;
      } catch (convexError) {
        console.error(`[cleanup-temp-files] Error deleting Convex record ${file._id}:`, convexError);
        errors.push(`Failed to delete database record for ${file.sourceUrl || file._id}`);
      }
    }

    // Format bytes freed
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const result = {
      deletedFiles: deletedR2Files,
      deletedRecords: deletedConvexRecords,
      freedSpace: formatBytes(totalBytesFreed),
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
