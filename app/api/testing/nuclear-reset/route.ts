import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

/**
 * Testing endpoint: full nuclear reset for the current user.
 *
 * Orchestrates:
 *   1. Query all R2 keys from storyboard_files for the user's workspaces
 *   2. Delete every R2 object from Cloudflare
 *   3. Call Convex nuclearResetForTesting which deletes rows from 6 tables:
 *      credits_balance, credits_ledger, storyboard_projects,
 *      storyboard_items, storyboard_files, storyboard_elements
 *   4. Return full result with counts
 *
 * After this, the user's data is completely gone from Convex + R2.
 * Clerk (user account, orgs, subscriptions) is NOT touched — delete
 * those manually from Clerk Dashboard.
 *
 * Authorization: requires authenticated user. Only deletes the caller's
 * own data (the Convex mutation enforces this via identity.subject).
 */

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

    console.log("[NUCLEAR RESET] Starting for user:", userId);

    const result = {
      userId,
      r2DeletedCount: 0,
      r2FailedCount: 0,
      convexDeleted: {} as Record<string, number>,
      companyIds: [] as string[],
      errors: [] as string[],
    };

    // ─── Step 1: Get all R2 keys before deleting metadata ─────────
    // The Convex mutation will delete storyboard_files rows, so we
    // need to fetch the R2 keys first via a query.
    let r2Keys: string[] = [];
    try {
      const keysResult = await convex.query(api.credits.listAllR2KeysForUser, {
        userId,
      });
      r2Keys = keysResult.r2Keys;
      result.companyIds = keysResult.companyIds;
      console.log(
        `[NUCLEAR RESET] Found ${r2Keys.length} R2 keys across ${keysResult.companyIds.length} workspaces`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Failed to list R2 keys: ${msg}`);
      console.error("[NUCLEAR RESET] Failed to list R2 keys", err);
    }

    // ─── Step 2: Delete R2 objects ────────────────────────────────
    for (const key of r2Keys) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        result.r2DeletedCount++;
      } catch (err) {
        result.r2FailedCount++;
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`R2 delete failed: ${key}: ${msg}`);
      }
    }
    console.log(
      `[NUCLEAR RESET] R2: deleted ${result.r2DeletedCount}, failed ${result.r2FailedCount}`,
    );

    // ─── Step 3: Delete all Convex data ───────────────────────────
    try {
      const convexResult = await convex.mutation(
        api.credits.nuclearResetForTesting,
        { userId },
      );
      result.convexDeleted = convexResult.deleted;
      result.companyIds = convexResult.companyIds;
      console.log("[NUCLEAR RESET] Convex deleted:", convexResult.deleted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Convex nuclear reset failed: ${msg}`);
      console.error("[NUCLEAR RESET] Convex failed", err);
    }

    console.log("[NUCLEAR RESET] Complete:", result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[NUCLEAR RESET] Handler error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
