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

export default crons;
