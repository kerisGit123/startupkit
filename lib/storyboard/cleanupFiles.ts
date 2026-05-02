// Shared file cleanup module — used by build-storyboard, delete-project, and
// the cleanup-item-files API route. Extracting to a module avoids the
// server-to-server auth problem of calling the HTTP route internally.
//
// Responsibilities:
//   1. Delete actual R2 bytes for every file linked to the given item/element IDs
//   2. For AI-generated files (defaultAI present): soft-delete the Convex record
//      (r2Key="", sourceUrl="", status="deleted", categoryId=null — kept for logs)
//   3. For user-uploaded files (defaultAI absent): hard-delete the Convex record
//
// Callers must pass an authenticated ConvexHttpClient.

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ConvexHttpClient } from "convex/browser";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "storyboardbucket";

export interface CleanupResult {
  r2Deleted: number;
  softDeleted: number;
  hardDeleted: number;
  errors: number;
}

async function deleteR2Key(key: string): Promise<boolean> {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    // R2 DeleteObject on a missing key is a no-op — only log real errors
    console.warn(`[cleanupFiles] R2 delete failed for key "${key}":`, err);
    return false;
  }
}

function extractR2Key(url: string): string | null {
  if (!url) return null;
  if (!url.startsWith("http")) return url; // already a raw key
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, "") || null;
  } catch {
    return null;
  }
}

export async function cleanupItemFiles(
  convex: ConvexHttpClient,
  itemIds: string[],
  elementIds: string[] = []
): Promise<CleanupResult> {
  const result: CleanupResult = { r2Deleted: 0, softDeleted: 0, hardDeleted: 0, errors: 0 };
  const softDeleteIds: Id<"storyboard_files">[] = [];
  const hardDeleteIds: Id<"storyboard_files">[] = [];

  // ── Process storyboard items ──────────────────────────────────────────────
  for (const itemId of itemIds) {
    try {
      const files = await convex.query(api.storyboard.storyboardFiles.listByCategoryId, {
        categoryId: itemId as Id<"storyboard_items">,
      });
      for (const file of files) {
        if (file.r2Key) {
          const ok = await deleteR2Key(file.r2Key);
          if (ok) result.r2Deleted++;
        }
        if (file.defaultAI) {
          softDeleteIds.push(file._id as Id<"storyboard_files">);
        } else {
          hardDeleteIds.push(file._id as Id<"storyboard_files">);
        }
      }
    } catch (err) {
      console.error(`[cleanupFiles] Error processing item ${itemId}:`, err);
      result.errors++;
    }
  }

  // ── Process storyboard elements ───────────────────────────────────────────
  for (const elementId of elementIds) {
    try {
      // 1. Files tracked in storyboard_files
      const files = await convex.query(api.storyboard.storyboardFiles.listByCategoryId, {
        categoryId: elementId as Id<"storyboard_elements">,
      });
      for (const file of files) {
        if (file.r2Key) {
          const ok = await deleteR2Key(file.r2Key);
          if (ok) result.r2Deleted++;
        }
        if (file.defaultAI) {
          softDeleteIds.push(file._id as Id<"storyboard_files">);
        } else {
          hardDeleteIds.push(file._id as Id<"storyboard_files">);
        }
      }

      // 2. Raw R2 URLs stored directly on the element (uploaded variants)
      const element = await convex.query(api.storyboard.storyboardElements.getById, {
        id: elementId as Id<"storyboard_elements">,
      });
      if (element) {
        const rawUrls = [
          element.thumbnailUrl,
          ...(element.referenceUrls || []),
        ].filter(Boolean) as string[];

        const uniqueKeys = [...new Set(rawUrls.map(extractR2Key).filter(Boolean) as string[])];
        for (const key of uniqueKeys) {
          const ok = await deleteR2Key(key);
          if (ok) result.r2Deleted++;
        }
      }
    } catch (err) {
      console.error(`[cleanupFiles] Error processing element ${elementId}:`, err);
      result.errors++;
    }
  }

  // ── Apply Convex record changes in one batch each ─────────────────────────
  if (softDeleteIds.length > 0) {
    try {
      const res = await convex.mutation(api.storyboard.storyboardFiles.batchMarkOrphaned, {
        fileIds: softDeleteIds,
      });
      result.softDeleted = res.softDeleted;
    } catch (err) {
      console.error("[cleanupFiles] batchMarkOrphaned failed:", err);
      result.errors++;
    }
  }

  if (hardDeleteIds.length > 0) {
    try {
      await convex.mutation(api.storyboard.storyboardFiles.batchHardDelete, {
        fileIds: hardDeleteIds,
      });
      result.hardDeleted = hardDeleteIds.length;
    } catch (err) {
      console.error("[cleanupFiles] batchHardDelete failed:", err);
      result.errors++;
    }
  }

  console.log(`[cleanupFiles] Done — R2:${result.r2Deleted} soft:${result.softDeleted} hard:${result.hardDeleted} errors:${result.errors}`);
  return result;
}
