// Deletes a single orphan storyboard_file: removes R2 bytes then soft/hard-deletes
// the Convex record following the defaultAI rule:
//   defaultAI present → soft-delete (keep record for credit audit)
//   defaultAI absent  → hard-delete (no audit need)
//
// Only the file owner (matching companyId) may call this.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
  try { if (!convexToken) convexToken = await authResult.getToken(); } catch {}
  if (convexToken) convex.setAuth(convexToken);

  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const file = await convex.query(api.storyboard.storyboardFiles.getById, {
    id: fileId as Id<"storyboard_files">,
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Ownership check: companyId on the file must match the caller's org or user ID
  const sessionClaims = authResult.sessionClaims as any;
  const callerCompanyId = sessionClaims?.org_id ?? authResult.userId;
  if (file.companyId && file.companyId !== callerCompanyId && file.companyId !== authResult.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete R2 bytes if key is present
  if (file.r2Key) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: file.r2Key }));
    } catch (err) {
      console.warn(`[delete-orphan-file] R2 delete failed for "${file.r2Key}":`, err);
    }
  }

  // Convex record: soft-delete (AI) or hard-delete (uploaded)
  if (file.defaultAI) {
    await convex.mutation(api.storyboard.storyboardFiles.batchMarkOrphaned, {
      fileIds: [fileId as Id<"storyboard_files">],
    });
  } else {
    await convex.mutation(api.storyboard.storyboardFiles.batchHardDelete, {
      fileIds: [fileId as Id<"storyboard_files">],
    });
  }

  return NextResponse.json({ success: true });
}
