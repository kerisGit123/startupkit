import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { convex, api } from "@/lib/convex-server";

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
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { r2Key } = await req.json();

    if (!r2Key) {
      return NextResponse.json({ error: "R2 key is required" }, { status: 400 });
    }

    // Ownership check: verify the file belongs to the user's company
    const companyId = orgId || userId;
    const file = await convex.query(api.storyboard.storyboardFiles.getByR2Key, { r2Key });
    if (!file) {
      // No metadata record — only admin cleanup should handle orphaned R2 keys
      console.error("[r2-delete] No metadata found for r2Key — rejecting:", { r2Key, callerCompanyId: companyId });
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    // Check companyId first; fall back to uploadedBy for legacy files without companyId
    const fileOwner = file.companyId || file.uploadedBy;
    if (fileOwner && fileOwner !== companyId && fileOwner !== userId) {
      console.error("[r2-delete] Ownership mismatch:", { r2Key, fileOwner, callerCompanyId: companyId, callerUserId: userId });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
