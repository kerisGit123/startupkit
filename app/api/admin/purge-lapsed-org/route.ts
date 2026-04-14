import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * Super-admin endpoint: soft-purge a lapsed organization.
 *
 * Orchestrates 3 external cleanups + 1 bookkeeping step, in order:
 *   1. Fetch R2 keys from Convex (these list which objects to delete)
 *   2. Delete R2 objects from Cloudflare (real deletion, irreversible)
 *   3. Call Clerk API to delete the organization (releases MAO billing)
 *   4. Call Convex `completeCompanyPurge` to:
 *        - clear r2Key on every storyboard_files row for this companyId
 *        - set purgedAt on the credits_balance row
 *
 * IMPORTANT — by design, this does NOT delete Convex rows:
 *   - credits_balance, credits_ledger, storyboard_files, and all
 *     related tables stay intact as the financial audit trail
 *   - Tax reporting, billing reconciliation, and user data-export
 *     requests depend on this history
 *   - Only R2 objects (the actual media files) and the Clerk org
 *     identity are released, since those carry real infra cost
 *
 * Body: { companyId: string, confirmText: string }
 *   confirmText must equal the companyId for safety (prevents accidents)
 *
 * Authorization: only users with `role: "super_admin"` in Clerk metadata.
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
    // Super-admin gate — any other role or unauthenticated gets rejected
    const adminUser = await requireAdmin();
    if (adminUser.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden — super_admin role required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { companyId, confirmText } = body;

    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json(
        { error: "Missing companyId" },
        { status: 400 },
      );
    }

    // Safety: require the caller to type the companyId as confirmation
    // to prevent accidental purges.
    if (confirmText !== companyId) {
      return NextResponse.json(
        { error: "confirmText must equal companyId for safety" },
        { status: 400 },
      );
    }

    if (!companyId.startsWith("org_")) {
      return NextResponse.json(
        { error: "Only organization workspaces can be purged (companyId must start with 'org_')" },
        { status: 400 },
      );
    }

    console.log("[PURGE] Starting purge", {
      companyId,
      adminUserId: adminUser.userId,
      adminEmail: adminUser.email,
    });

    const result = {
      companyId,
      r2DeletedCount: 0,
      r2FailedCount: 0,
      clerkDeleted: false,
      convexFilesCleared: 0,
      convexBalanceMarkedPurged: false,
      errors: [] as string[],
    };

    // ─── Step 1: Fetch R2 keys from Convex ────────────────────────
    // Must happen BEFORE we clear r2Key in Convex, otherwise the keys
    // are lost.
    const r2Keys = await convex.query(api.credits.listCompanyR2Keys, {
      companyId,
    });
    console.log(`[PURGE] Found ${r2Keys.length} R2 objects to delete`);

    // ─── Step 2: Delete R2 objects from Cloudflare ────────────────
    for (const key of r2Keys) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        result.r2DeletedCount++;
      } catch (err) {
        result.r2FailedCount++;
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`R2 delete failed for ${key}: ${msg}`);
        console.error(`[PURGE] R2 delete failed for ${key}`, err);
      }
    }

    // ─── Step 3: Delete the Clerk organization ───────────────────
    // Releases the org from Clerk's billing (MAO count). Convex rows
    // still reference this companyId but that's fine — they're audit
    // trail and don't require the org to exist in Clerk.
    try {
      const client = await clerkClient();
      await client.organizations.deleteOrganization(companyId);
      result.clerkDeleted = true;
      console.log("[PURGE] Clerk org deleted", companyId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Clerk returns 404 if org doesn't exist — treat as success
      if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        result.clerkDeleted = true;
        console.log("[PURGE] Clerk org already deleted", companyId);
      } else {
        result.errors.push(`Clerk delete failed: ${msg}`);
        console.error("[PURGE] Clerk delete failed", err);
      }
    }

    // ─── Step 4: Convex bookkeeping (soft-delete) ─────────────────
    // Clears r2Key on storyboard_files rows and stamps purgedAt on
    // credits_balance. All financial audit data (credits_ledger,
    // projects, items, elements) is preserved.
    try {
      const convexResult = await convex.mutation(
        api.credits.completeCompanyPurge,
        { companyId },
      );
      result.convexFilesCleared = convexResult.filesCleared;
      result.convexBalanceMarkedPurged = convexResult.balanceMarkedPurged;
      console.log("[PURGE] Convex soft-delete complete", convexResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Convex soft-purge failed: ${msg}`);
      console.error("[PURGE] Convex soft-purge failed", err);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[PURGE] Handler error:", error);
    const message = error?.message ?? "Internal server error";
    const status = message.includes("Unauthorized")
      ? 401
      : message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
