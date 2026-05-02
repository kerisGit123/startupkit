// Internal endpoint: purges R2 files for a 1-year-inactive account.
// Called by the inactivity-cleanup cron via Convex action.
// Auth via x-internal-secret header (INTERNAL_REPAIR_SECRET). NOT for browser use.
//
// Steps:
//   1. Fetch R2 keys from Convex (must happen before clearing them)
//   2. Delete R2 objects from Cloudflare
//   3. If companyId starts with "org_": delete the Clerk organization
//   4. Convex bookkeeping: clear r2Keys, stamp purgedAt on credits_balance

import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

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

  const { companyId } = await req.json() as { companyId: string };
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  console.log("[purge-inactive-user] Starting purge for", companyId);

  const result = {
    companyId,
    r2DeletedCount: 0,
    r2FailedCount: 0,
    clerkDeleted: false,
    convexFilesCleared: 0,
    errors: [] as string[],
  };

  // Step 1: Fetch R2 keys from Convex before clearing them
  const r2Keys = await convex.query(api.credits.listCompanyR2Keys, { companyId });
  console.log(`[purge-inactive-user] ${r2Keys.length} R2 keys to delete for ${companyId}`);

  // Step 2: Delete R2 objects
  for (const key of r2Keys) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      result.r2DeletedCount++;
    } catch (err) {
      result.r2FailedCount++;
      result.errors.push(`R2 delete failed for ${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Step 3: Delete Clerk org (only for org workspaces)
  if (companyId.startsWith("org_")) {
    try {
      const clerk = await clerkClient();
      await clerk.organizations.deleteOrganization(companyId);
      result.clerkDeleted = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        result.clerkDeleted = true;
      } else {
        result.errors.push(`Clerk delete failed: ${msg}`);
      }
    }
  }

  // Step 4: Convex bookkeeping
  try {
    const convexResult = await convex.mutation(api.credits.completeCompanyPurge, { companyId });
    result.convexFilesCleared = convexResult.filesCleared;
  } catch (err) {
    result.errors.push(`Convex purge failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log("[purge-inactive-user] Done", result);
  return NextResponse.json(result);
}
