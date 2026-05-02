import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://storytica.ai";
const SECRET = process.env.INTERNAL_REPAIR_SECRET ?? "";

async function callInternal(path: string, body: object) {
  const res = await fetch(`${APP_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": SECRET,
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// ─── Daily at 06:00 UTC ───────────────────────────────────────────────────────
// Sends warning emails to accounts approaching the 1-year inactivity window.
//   Level 1 (10 months inactive): "60 days left"
//   Level 2 (11 months inactive): "30 days left — final notice"

export const sendInactivityWarnings = internalAction({
  args: {},
  handler: async (ctx) => {
    // Warning 1: ~10 months inactive, no warning sent yet
    const warn1 = await ctx.runQuery(internal.credits.listInactiveForWarning1, { limit: 50 });
    let sent1 = 0;
    for (const account of warn1) {
      if (!account.ownerEmail) continue;
      const ok = await callInternal("/api/admin/inactivity-email", {
        to: account.ownerEmail,
        level: 1,
      });
      if (ok) {
        await ctx.runMutation(internal.credits.markInactivityWarning1, { id: account._id });
        sent1++;
      }
    }

    // Warning 2: ~11 months inactive, warning 1 already sent
    const warn2 = await ctx.runQuery(internal.credits.listInactiveForWarning2, { limit: 50 });
    let sent2 = 0;
    for (const account of warn2) {
      if (!account.ownerEmail) continue;
      const ok = await callInternal("/api/admin/inactivity-email", {
        to: account.ownerEmail,
        level: 2,
      });
      if (ok) {
        await ctx.runMutation(internal.credits.markInactivityWarning2, { id: account._id });
        sent2++;
      }
    }

    console.log(`[inactivity-warnings] Sent ${sent1} first warnings, ${sent2} final warnings`);
  },
});

// ─── Daily at 06:30 UTC ───────────────────────────────────────────────────────
// Purges R2 files for accounts inactive for 12+ months.
// Processes 20 accounts per run — re-runs daily until queue is empty.

export const purgeInactiveAccounts = internalAction({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.runQuery(internal.credits.listInactiveForPurge, { limit: 20 });

    let purged = 0;
    let failed = 0;
    for (const account of accounts) {
      const ok = await callInternal("/api/admin/purge-inactive-user", {
        companyId: account.companyId,
      });
      if (ok) {
        purged++;
      } else {
        failed++;
        console.error(`[purge-inactive] Failed to purge ${account.companyId}`);
      }
    }

    console.log(`[purge-inactive] Purged ${purged}, failed ${failed} out of ${accounts.length}`);
  },
});
