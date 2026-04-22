import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "../_generated/api";
import type { DataModel, Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internalMutation } from "../_generated/server";

type FileDoc = Doc<"storyboard_files">;

// ── Eligibility ─────────────────────────────────────────────────────────
// Matches the exact filter used by getStorageUsage pre-aggregate. Shared
// files are excluded because they're gallery-hosted and shouldn't count
// against the creator's storage quota.
export function isStorageEligible(f: FileDoc): boolean {
  if (!f.companyId) return false;
  if (f.deletedAt || f.status === "deleted") return false;
  if ((f.size ?? 0) <= 0) return false;
  if (f.isShared === true) return false;
  return true;
}

// ── Aggregate instances ─────────────────────────────────────────────────

// Total size/count per company. No sortKey — one entry per eligible file
// rolled up to a single namespace sum.
export const storageByCompany = new TableAggregate<{
  Namespace: string;
  Key: null;
  DataModel: DataModel;
  TableName: "storyboard_files";
}>(components.storageByCompany, {
  namespace: (doc) => doc.companyId ?? "",
  sortKey: () => null,
  sumValue: (doc) => doc.size ?? 0,
});

// Grouped by category within a company. Enables prefix-bounded sum/count
// per category without a full scan.
export const storageByCategory = new TableAggregate<{
  Namespace: string;
  Key: [string];
  DataModel: DataModel;
  TableName: "storyboard_files";
}>(components.storageByCategory, {
  namespace: (doc) => doc.companyId ?? "",
  sortKey: (doc) => [doc.category],
  sumValue: (doc) => doc.size ?? 0,
});

// Grouped by fileType within a company.
export const storageByFileType = new TableAggregate<{
  Namespace: string;
  Key: [string];
  DataModel: DataModel;
  TableName: "storyboard_files";
}>(components.storageByFileType, {
  namespace: (doc) => doc.companyId ?? "",
  sortKey: (doc) => [doc.fileType],
  sumValue: (doc) => doc.size ?? 0,
});

const ALL_STORAGE_AGGS = [storageByCompany, storageByCategory, storageByFileType] as const;

// ── Generation daily rollup ─────────────────────────────────────────────
// Denormalized (companyId, date, model) rows for the analytics dashboard.
// Maintained alongside the storage aggregates via syncFileAggregates.

function isGenerationEligible(f: FileDoc): boolean {
  return !!f.companyId && f.category === "generated";
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().split("T")[0];
}

function isSuccessStatus(status?: string): boolean {
  return status === "ready" || status === "completed";
}

function isFailedStatus(status?: string): boolean {
  return status === "failed" || status === "error";
}

async function addToDaily(
  ctx: MutationCtx,
  f: FileDoc,
  sign: 1 | -1
): Promise<void> {
  const companyId = f.companyId!;
  const date = dayKey(f.createdAt);
  const model = f.model ?? "unknown";

  const row = await ctx.db
    .query("storyboard_generation_daily")
    .withIndex("by_companyId_date_model", (q) =>
      q.eq("companyId", companyId).eq("date", date).eq("model", model)
    )
    .first();

  const delta = {
    count: sign,
    credits: sign * (f.creditsUsed ?? 0),
    storage: sign * (f.size ?? 0),
    success: sign * (isSuccessStatus(f.status) ? 1 : 0),
    failed: sign * (isFailedStatus(f.status) ? 1 : 0),
  };

  const now = Date.now();

  if (row) {
    const newCount = row.count + delta.count;
    if (newCount <= 0) {
      await ctx.db.delete(row._id);
    } else {
      await ctx.db.patch(row._id, {
        count: newCount,
        credits: Math.max(0, row.credits + delta.credits),
        storage: Math.max(0, row.storage + delta.storage),
        success: Math.max(0, row.success + delta.success),
        failed: Math.max(0, row.failed + delta.failed),
        updatedAt: now,
      });
    }
  } else if (sign > 0) {
    await ctx.db.insert("storyboard_generation_daily", {
      companyId,
      date,
      model,
      count: 1,
      credits: f.creditsUsed ?? 0,
      storage: f.size ?? 0,
      success: isSuccessStatus(f.status) ? 1 : 0,
      failed: isFailedStatus(f.status) ? 1 : 0,
      updatedAt: now,
    });
  }
}

async function patchDailyFields(
  ctx: MutationCtx,
  before: FileDoc,
  after: FileDoc
): Promise<void> {
  // Same bucket (companyId, date, model) — just apply field deltas
  const companyId = after.companyId!;
  const date = dayKey(after.createdAt);
  const model = after.model ?? "unknown";

  const row = await ctx.db
    .query("storyboard_generation_daily")
    .withIndex("by_companyId_date_model", (q) =>
      q.eq("companyId", companyId).eq("date", date).eq("model", model)
    )
    .first();

  if (!row) {
    // Bucket missing — treat as a fresh insert. Keeps rollup self-healing
    // if a prior mutation missed the hook.
    await addToDaily(ctx, after, 1);
    return;
  }

  const creditDelta = (after.creditsUsed ?? 0) - (before.creditsUsed ?? 0);
  const storageDelta = (after.size ?? 0) - (before.size ?? 0);
  const successDelta =
    (isSuccessStatus(after.status) ? 1 : 0) - (isSuccessStatus(before.status) ? 1 : 0);
  const failedDelta =
    (isFailedStatus(after.status) ? 1 : 0) - (isFailedStatus(before.status) ? 1 : 0);

  if (creditDelta === 0 && storageDelta === 0 && successDelta === 0 && failedDelta === 0) {
    return; // nothing relevant changed
  }

  await ctx.db.patch(row._id, {
    credits: Math.max(0, row.credits + creditDelta),
    storage: Math.max(0, row.storage + storageDelta),
    success: Math.max(0, row.success + successDelta),
    failed: Math.max(0, row.failed + failedDelta),
    updatedAt: Date.now(),
  });
}

async function syncGenerationDaily(
  ctx: MutationCtx,
  before: FileDoc | null,
  after: FileDoc | null
): Promise<void> {
  const wasGen = before ? isGenerationEligible(before) : false;
  const isGen = after ? isGenerationEligible(after) : false;

  if (!wasGen && isGen) {
    await addToDaily(ctx, after!, 1);
  } else if (wasGen && !isGen) {
    await addToDaily(ctx, before!, -1);
  } else if (wasGen && isGen) {
    const sameBucket =
      before!.companyId === after!.companyId &&
      dayKey(before!.createdAt) === dayKey(after!.createdAt) &&
      (before!.model ?? "unknown") === (after!.model ?? "unknown");

    if (sameBucket) {
      await patchDailyFields(ctx, before!, after!);
    } else {
      // Moved buckets (rare — companyId or model change)
      await addToDaily(ctx, before!, -1);
      await addToDaily(ctx, after!, 1);
    }
  }
}

// ── Sync helper ─────────────────────────────────────────────────────────
// Call from every mutation that inserts/patches/deletes a storyboard_files
// row. Handles eligibility transitions so aggregates stay in sync.
export async function syncFileAggregates(
  ctx: MutationCtx,
  before: FileDoc | null,
  after: FileDoc | null
): Promise<void> {
  const wasEligible = before ? isStorageEligible(before) : false;
  const isEligible = after ? isStorageEligible(after) : false;

  for (const agg of ALL_STORAGE_AGGS) {
    if (!wasEligible && isEligible) {
      await agg.insertIfDoesNotExist(ctx, after!);
    } else if (wasEligible && !isEligible) {
      await agg.deleteIfExists(ctx, before!);
    } else if (wasEligible && isEligible) {
      // Both eligible — replace so sumValue/sortKey updates propagate
      await agg.replace(ctx, before!, after!);
    }
    // neither eligible: no-op
  }

  // Creator stats: maintain denormalized sharedCount per company
  const wasShared = before?.isShared === true;
  const nowShared = after?.isShared === true;
  if (wasShared !== nowShared) {
    const companyId = after?.companyId ?? before?.companyId;
    if (companyId) {
      await adjustCreatorShared(ctx, companyId, nowShared ? 1 : -1);
    }
    // Keep the shared-model catalog in sync
    const model = (nowShared ? after?.model : before?.model) ?? null;
    if (model) {
      await adjustSharedModel(ctx, model, nowShared ? 1 : -1);
    }
  }

  // Generation analytics: maintain daily rollup
  await syncGenerationDaily(ctx, before, after);
}

async function adjustSharedModel(
  ctx: MutationCtx,
  model: string,
  delta: number
): Promise<void> {
  const row = await ctx.db
    .query("storyboard_shared_models")
    .withIndex("by_model", (q) => q.eq("model", model))
    .first();

  const now = Date.now();
  if (row) {
    const newCount = row.count + delta;
    if (newCount <= 0) {
      await ctx.db.delete(row._id);
    } else {
      await ctx.db.patch(row._id, { count: newCount, updatedAt: now });
    }
  } else if (delta > 0) {
    await ctx.db.insert("storyboard_shared_models", {
      model,
      count: delta,
      updatedAt: now,
    });
  }
}

async function adjustCreatorShared(
  ctx: MutationCtx,
  companyId: string,
  delta: number
): Promise<void> {
  const row = await ctx.db
    .query("storyboard_creator_stats")
    .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
    .first();

  const now = Date.now();
  if (row) {
    const newCount = Math.max(0, (row.sharedCount ?? 0) + delta);
    await ctx.db.patch(row._id, { sharedCount: newCount, updatedAt: now });
  } else if (delta > 0) {
    await ctx.db.insert("storyboard_creator_stats", {
      companyId,
      sharedCount: delta,
      updatedAt: now,
    });
  }
}

// ── Backfill ────────────────────────────────────────────────────────────
// Run once after deploying the aggregate setup to populate from existing
// storyboard_files rows. Idempotent via insertIfDoesNotExist.
export const backfillAggregates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("storyboard_files").collect();

    let storageAdded = 0;
    const sharedByCompany: Record<string, number> = {};
    const sharedModelCounts: Record<string, number> = {};
    const dailyBuckets: Record<
      string,
      { companyId: string; date: string; model: string; count: number; credits: number; storage: number; success: number; failed: number }
    > = {};

    for (const f of files) {
      if (isStorageEligible(f)) {
        for (const agg of ALL_STORAGE_AGGS) {
          await agg.insertIfDoesNotExist(ctx, f);
        }
        storageAdded++;
      }

      if (f.isShared === true && f.companyId) {
        sharedByCompany[f.companyId] = (sharedByCompany[f.companyId] ?? 0) + 1;
        if (f.model) {
          sharedModelCounts[f.model] = (sharedModelCounts[f.model] ?? 0) + 1;
        }
      }

      if (isGenerationEligible(f)) {
        const companyId = f.companyId!;
        const date = dayKey(f.createdAt);
        const model = f.model ?? "unknown";
        const key = `${companyId}|${date}|${model}`;
        if (!dailyBuckets[key]) {
          dailyBuckets[key] = {
            companyId, date, model,
            count: 0, credits: 0, storage: 0, success: 0, failed: 0,
          };
        }
        const b = dailyBuckets[key];
        b.count += 1;
        b.credits += f.creditsUsed ?? 0;
        b.storage += f.size ?? 0;
        if (isSuccessStatus(f.status)) b.success += 1;
        if (isFailedStatus(f.status)) b.failed += 1;
      }
    }

    // Reset creator_stats and repopulate
    const existingCreators = await ctx.db.query("storyboard_creator_stats").collect();
    for (const row of existingCreators) await ctx.db.delete(row._id);

    const now = Date.now();
    let creatorsAdded = 0;
    for (const [companyId, count] of Object.entries(sharedByCompany)) {
      await ctx.db.insert("storyboard_creator_stats", {
        companyId,
        sharedCount: count,
        updatedAt: now,
      });
      creatorsAdded++;
    }

    // Reset shared-model catalog and repopulate
    const existingModels = await ctx.db.query("storyboard_shared_models").collect();
    for (const row of existingModels) await ctx.db.delete(row._id);

    let modelsAdded = 0;
    for (const [model, count] of Object.entries(sharedModelCounts)) {
      await ctx.db.insert("storyboard_shared_models", {
        model,
        count,
        updatedAt: now,
      });
      modelsAdded++;
    }

    // Reset generation_daily and repopulate
    const existingDaily = await ctx.db.query("storyboard_generation_daily").collect();
    for (const row of existingDaily) await ctx.db.delete(row._id);

    let dailyAdded = 0;
    for (const b of Object.values(dailyBuckets)) {
      await ctx.db.insert("storyboard_generation_daily", {
        companyId: b.companyId,
        date: b.date,
        model: b.model,
        count: b.count,
        credits: b.credits,
        storage: b.storage,
        success: b.success,
        failed: b.failed,
        updatedAt: now,
      });
      dailyAdded++;
    }

    return {
      totalFiles: files.length,
      storageAdded,
      creatorsAdded,
      modelsAdded,
      dailyAdded,
    };
  },
});

// Clear all aggregates — for development / disaster recovery.
// Use via `npx convex run storyboard/aggregates:clearAggregates`.
// Run this first, then `backfillAggregates`, to rebuild from scratch.
export const clearAggregates = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const agg of ALL_STORAGE_AGGS) {
      await agg.clearAll(ctx);
    }
    const existingCreators = await ctx.db.query("storyboard_creator_stats").collect();
    for (const row of existingCreators) await ctx.db.delete(row._id);
    const existingDaily = await ctx.db.query("storyboard_generation_daily").collect();
    for (const row of existingDaily) await ctx.db.delete(row._id);
    const existingModels = await ctx.db.query("storyboard_shared_models").collect();
    for (const row of existingModels) await ctx.db.delete(row._id);
    return { cleared: true };
  },
});
