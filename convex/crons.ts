import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * 🗓️ DAILY TEMP FILE CLEANUP
 *
 * Runs every day at 03:00 UTC to remove storyboard_files metadata records
 * for expired "temps" category files (older than 30 days).
 *
 * To also remove the actual R2 objects, set a Cloudflare R2 lifecycle rule:
 *   Bucket → Settings → Object Lifecycle → Add rule
 *   Prefix: temps/   Expiration: 30 days
 */
crons.daily(
  "cleanup-expired-temps",
  { hourUTC: 3, minuteUTC: 0 },
  internal.storyboard.fileMetadataHandler.cleanupExpiredTemps
);

/**
 * 📊 LANDING PAGE STATS REFRESH
 *
 * Updates the cached landing_stats row every hour so getPublicStats
 * reads a single document instead of scanning 3 entire tables (~45 MB).
 */
crons.interval(
  "refresh-landing-stats",
  { hours: 1 },
  internal.landingStats.refreshLandingStats
);

/**
 * 🔧 ORPHAN FILE REPAIR
 *
 * Runs daily at 04:00 UTC. Scans for storyboard_files whose parent item/element
 * was deleted without the cleanup route running (crash, bug, or direct DB edit).
 * Soft-deletes AI-generated orphans (kept for logs), hard-deletes uploaded orphans.
 * Batches 50 files per run — re-runs the next day until all orphans are cleared.
 */
crons.daily(
  "repair-orphan-files",
  { hourUTC: 4, minuteUTC: 0 },
  internal.storyboard.fileMetadataHandler.repairOrphanFiles
);

export default crons;
