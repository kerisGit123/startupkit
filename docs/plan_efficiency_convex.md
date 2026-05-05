# Convex Efficiency — Bandwidth Optimizations

## Why This Matters

Convex database bandwidth is consumed by **reactive real-time sync** — every DB change
pushes the full query result to every subscribed client. A single generation callback
(status: `generating → completed`) can trigger multiple subscriptions to re-fire and
re-send hundreds of kilobytes to the browser.

The free tier is **1 GB/month**. Without optimization, a single active dev session
was consuming 862 MB.

---

## System Efficiency Impact (assessed 2026-05-03)

### Bandwidth (Convex free tier = 1 GB/month)

Dev baseline: 862 MB/session → ~170 MB/session (~80% reduction)

Session 1 did the heavy lifting. Session 2 adds incremental gains that compound at
scale — many users with workspace tabs open simultaneously means the `getByCompanyAndType`
fix saves more in production than the MB numbers suggest in dev.

`listByProject` (~94 MB) is the only remaining meaningful item.

### Query Re-fire Frequency

This is where Session 2 matters more than raw MB:

- **PromptLibrary conditional mount** — zero subscription time during ~90% of studio
  sessions. Previously always-on regardless of whether the modal was open.
- **`getByCompanyAndType` in workspace** — re-fires only on style template changes, not
  on any template change. A user creating a character prompt no longer wakes up every
  open workspace subscription across the platform.

### Security

Session 1 closed a real hole: `listAll` had no auth and exposed every company's
filenames, prompts, and source URLs to anyone with the Convex deployment URL. Deleted
and replaced with the scoped `listTempFiles`.

### Production Readiness

The system is safe for production launch from a bandwidth perspective. The 1 GB/month
free tier is comfortably achievable even with real concurrent users. The remaining open
items (`listByProject`, admin full table scans) are either deferred by design or
admin-only — they do not affect end-user experience.

### What's Still Open

| Item | Affects | When to Fix |
| ---- | ------- | ----------- |
| `listByProject` (~94 MB dev) | End-users, high frequency | After 2–3 weeks of production data |
| Admin dashboard 5× `.collect()` | Super admin only | When admin panel gets heavy use |
| Admin inbox 6× full scans | Super admin only | Same |
| `financialLedger.getAllLedgerEntries` | Super admin only | When ledger table grows large |

---

## What Was Fixed (Session 1 — 2026-05-03)

### Before

| Query | Bandwidth | Root Cause |
| ----- | --------- | ---------- |
| `listAudioFiles` | 362 MB | `by_companyId` index — scanned ALL company files to find audio ones |
| `listByCompany` | 206 MB | `ElementLibrary` subscribed in real-time, fetched full docs just for `r2Key→_id` map |
| `listByProject` | 94 MB | Real-time subscriptions in VideoEditor + SceneEditor, full docs on every generation update |
| `refreshLandingStats` | 72 MB | Full `storyboard_files` table scan just to count "generated" files |
| `listAll` | 15 MB | No auth, no scope — exposed every file from every company |
| **Total** | **862 MB** | |

### Fix 1 — `listAudioFiles` (362 MB → near zero)

Added `by_companyId_fileType: ["companyId", "fileType"]` compound index. Query now scans only audio files instead of all company files.

**Files:** `convex/schema.ts`, `convex/storyboard/storyboardFiles.ts`

### Fix 2 — `listByCompany` / ElementLibrary (206 MB → zero)

Removed live `useQuery` subscription. Replaced with on-demand `convex.query()` only when user clicks delete.

**Files:** `app/storyboard-studio/components/ai/ElementLibrary.tsx`

### Fix 3 — `refreshLandingStats` (72 MB → near zero)

Replaced full `storyboard_files` table scan with `storyboard_generation_daily.collect()` — a tiny aggregate table (one row per company/date/model).

**Files:** `convex/landingStats.ts`

### Fix 4 — `listAll` security + bandwidth (15 MB → zero)

Deleted `listAll` (no auth, no scope, cross-company exposure). Replaced with `listTempFiles` — temps only, 6 safe fields, no `prompt` or `metadata`.

**Files:** `convex/storyboard/storyboardFiles.ts`, `app/api/admin/cleanup-temp-files/route.ts`, `app/api/admin/cleanup-stats/route.ts`

---

## What Was Fixed (Session 2 — 2026-05-03)

### Fix 5 — PromptLibrary always-on subscriptions → conditional mount

**Problem:** `<PromptLibrary>` was always mounted in VideoImageAIPanel and EditImageAIPanel.
Two live subscriptions (`getByCompany` + `getPublicTemplates`) ran the entire studio session
even when the modal was closed — approximately 90% of studio time.

**Fix:** Wrapped with `{isPromptLibraryOpen && <PromptLibrary />}` in both parents.
Subscriptions now only exist while the modal is open.

**Files:** `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx`, `app/storyboard-studio/components/editor/EditImageAIPanel.tsx`

### Fix 6 — `getPublicTemplates` unbounded collect → capped

**Problem:** `getPublicTemplates` used `.collect()` with no limit — would grow unbounded as system prompts accumulate.

**Fix:** Added `.take(200)` cap.

**Files:** `convex/promptTemplates.ts`

### Fix 7 — workspace page `getByCompany` → `getByCompanyAndType`

**Problem:** `workspace/[projectId]/page.tsx` subscribed to all 200 company prompt templates
just to filter for `type === "style"` client-side. Every template change of any type
re-fired this subscription for every user with a workspace open.

**Fix:** Added `by_company_type: ["companyId", "type"]` compound index to schema.
Added `getByCompanyAndType` query that hits the index directly. Workspace now subscribes
only to style templates (~5–15 docs instead of 200), and only re-fires when a style
template changes.

```ts
// Before — 200 docs, re-fires on any template change
const customStyles = useQuery(api.promptTemplates.getByCompany, { companyId });
const customStyleTemplates = customStyles?.filter(t => t.type === "style") ?? [];

// After — 5–15 docs, re-fires only on style template changes
const customStyleTemplates = useQuery(api.promptTemplates.getByCompanyAndType,
  { companyId, type: "style" }) ?? [];
```

**Files:** `convex/schema.ts`, `convex/promptTemplates.ts`, `app/storyboard-studio/workspace/[projectId]/page.tsx`

---

## Overall Bandwidth Reduction Estimate

| Session | Saved | Cumulative |
| ------- | ----- | ---------- |
| Session 1 (4 fixes) | ~655 MB | ~76% of 862 MB baseline |
| Session 2 (3 fixes) | small — not in original top offenders | ~80–81% |
| **Remaining** | `listByProject` ~94 MB (11%) | **~89% ceiling without that fix** |

Session 2 savings are real but not dramatic in absolute MB — the prompt template queries
were not top offenders in dev. The impact compounds at production scale where many users
have workspace tabs open simultaneously.

---

---

## New Issues Found (Session 3 — 2026-05-04)

These were not in the original dev profiling run but surfaced from a code audit.
All three are server-side Convex reads (not live subscriptions), so they don't show
up in the Convex dashboard subscription bandwidth — but they still consume DB reads
on demand.

### Issue A — `files-by-element` route: full-table dump on element delete

**File:** `app/api/storyboard/files-by-element/route.ts:30`

Fetches every file for the company via `listByCompany` on each element deletion, then
returns them all for client-side filtering by `elementId`. The route comment says it
explicitly: *"Query ALL storyboard_files for a company and return them for
client-side filtering."* For a company with 5 000 files this reads 5 000 full documents
to find a handful tagged to one element.

**Fix:** Replace `listByCompany` with a targeted query using the existing `by_categoryId`
index (elementId maps to categoryId in the element pipeline):

```ts
// Before — full table dump
const allFiles = await convex.query(api.storyboard.storyboardFiles.listByCompany, { companyId });

// After — targeted lookup
const files = await convex.query(api.storyboard.storyboardFiles.listByCategoryId, { categoryId: elementId });
```

**Files to change:**

- `app/api/storyboard/files-by-element/route.ts`

---

### Issue B — `files-by-category` orphan path: full-table dump

**File:** `app/api/storyboard/files-by-category/route.ts:32`

When `categoryId === null` (cleanup for orphaned files), the route reads every company
file via `listByCompany` and JS-filters for `!file.categoryId`. Same pattern as Issue A —
reads the entire table to find a small subset.

**Fix:** Add a `listOrphaned` Convex query that uses the `by_companyId` index and filters
for missing `categoryId` at the DB layer:

```ts
// Before — full table, JS filter
const allFiles = await convex.query(api.storyboard.storyboardFiles.listByCompany, { companyId });
files = allFiles.filter(file => !file.categoryId);

// After — server-side filter
files = await convex.query(api.storyboard.storyboardFiles.listOrphaned, { companyId });
// listOrphaned: by_companyId index + .filter(q => q.eq(q.field("categoryId"), undefined))
```

**Files to change:**

- `convex/storyboard/storyboardFiles.ts` — add `listOrphaned` query
- `app/api/storyboard/files-by-category/route.ts`

---

### Issue C — Gallery `listSharedFiles` 5× over-fetch

**File:** `app/storyboard-studio/components/gallery/GalleryPage.tsx:31`

`GalleryPage` calls `listSharedFiles` with `limit: 200`. The query default is 40.
This is a **live subscription** — every share/unshare on the platform re-fires it and
pushes 200 projected file documents to every open gallery viewer.

**Fix:** Remove the explicit `limit` arg and use the query default (40):

```ts
// Before
const files = useQuery(api.storyboard.gallery.listSharedFiles, { limit: 200, sortBy: "recent" });

// After
const files = useQuery(api.storyboard.gallery.listSharedFiles, { sortBy: "recent" });
```

**Files to change:**

- `app/storyboard-studio/components/gallery/GalleryPage.tsx`

---

### Session 3 Status

| Fix | Status |
| --- | ------ |
| A — `files-by-element` targeted query | Done |
| B — `files-by-category` `listOrphaned` | Done |
| C — Gallery limit 200 → 40 (default) | Done |

---

---

## What Was Fixed (Session 4 — 2026-05-05)

### Fix 8 — System prompt templates removed from Convex entirely

**Problem:** All 40+ `DEFAULT_PROMPT_TEMPLATES` were seeded into Convex per-company on
first use (`resetDefaults` mutation). Every `getByCompany` subscription transferred
~300 KB of static prompt text over the wire — even though the data never changes per-user
and was already hardcoded in the client bundle.

**Fix:**

1. Extracted `DEFAULT_PROMPT_TEMPLATES` from `PromptLibrary.tsx` to
   `lib/storyboard/defaultPromptTemplates.ts` — plain TypeScript module, no DB.
2. `PromptLibrary.tsx` now merges static file templates (zero bandwidth) with
   Convex user-created templates (DB only has user-created rows after cleanup).
3. `ElementForge.tsx` same pattern — system templates from file, user templates from
   Convex, FALLBACK_TEMPLATES only if both are empty.
4. Removed auto-seeding `useEffect` and `resetDefaultTemplates` mutation usage from
   `PromptLibrary.tsx`. "Reset Prompt" button removed.
5. `handleSelectPrompt` skips `incrementUsage` for static system templates
   (detected by `sys:` ID prefix).
6. System templates show a "System" badge; Edit/Delete buttons hidden for them.
7. Added `purgeSystemTemplates` mutation in `convex/promptTemplates.ts` for one-time
   cleanup of legacy `isSystem` DB records. Run once via Convex dashboard.

**Files changed:**

- `lib/storyboard/defaultPromptTemplates.ts` — NEW (4991 lines, exported array)
- `app/storyboard-studio/components/ai/PromptLibrary.tsx` — stripped from 5500+ lines
  to ~500 lines; templates removed, seeding removed, merge logic added
- `app/storyboard-studio/components/ai/ElementForge.tsx` — import + merge system templates
- `convex/promptTemplates.ts` — `purgeSystemTemplates` mutation added

**Bandwidth impact:** `getByCompany` now transfers only user-created templates (typically
0–20 rows vs 40+ system templates). The subscription re-fires only on user template
CRUD — not on every page load. System templates never touch the wire.

**One-time action needed:** Run `purgeSystemTemplates({})` in Convex dashboard once to
delete legacy `isSystem` records from all companies.

---

## What Was Fixed (Session 5 — 2026-05-05)

### Fix 9 — Crop thumbnail `noLog: true` — R2-only upload, no Convex record

#### The Problem

When a user cropped a thumbnail in ElementForge (`ThumbnailCropper`), the upload pipeline
did **two** things:

1. Uploaded the JPEG to R2 (`{companyId}/elements/{timestamp}-thumb.jpg`)
2. Called `storyboard_files.logUpload` → created a DB record with `category: "elements"` + `tags: ["thumbnail"]`

The DB record served no purpose:

- It was immediately **filtered out** of all file gallery queries (`storyboardFiles.ts` line 853–856)
- It was never linked to the element via `categoryId` so `listByCategoryId` wouldn't find it
- It couldn't be cleaned up by normal file-deletion flows
- Every `logUpload` call fired Convex write bandwidth and triggered re-renders in
  any subscription watching `storyboard_files`

#### The Fix

Added `noLog?: boolean` to `UploadOptions` in `lib/uploadToR2.ts`. When `true`,
the FormData field `noLog=1` is sent to `/api/storyboard/upload`.

The upload route checks for this flag before calling `logUpload`:

```ts
// app/api/storyboard/upload/route.ts
const noLog = formData.get('noLog') === '1';

// ... upload to R2 as normal ...

if (noLog) {
  // Return the publicUrl immediately — no Convex write, no DB record
  return NextResponse.json({ success: true, r2Key, publicUrl, ... });
}

// Only reach logUpload for normal uploads
await convex.mutation(api.storyboard.storyboardFiles.logUpload, logData);
```

ElementForge's `handleThumbnailCropped` now passes `noLog: true`:

```ts
const result = await uploadToR2({
  file,
  category: "elements",
  projectId, userId, companyId,
  tags: ["thumbnail"],
  noLog: true,          // ← skip DB record
});
// result.publicUrl → stored in element.thumbnailUrl only
await updateElement({ id: element._id, thumbnailUrl: result.publicUrl });
```

#### Full Data Flow After Fix

```text
User drags crop region → clicks Save Thumbnail
  ↓
blob (JPEG, 256×256) created in browser
  ↓
uploadToR2({ noLog: true })
  ↓
POST /api/storyboard/upload  [FormData: file + noLog=1]
  ↓
R2 upload → file stored at {companyId}/elements/{ts}-thumb-{ts}.jpg
  ↓  (no logUpload call — no Convex write)
Returns { publicUrl: "https://r2.../..." }
  ↓
updateElement({ id, thumbnailUrl: publicUrl })   ← single Convex write
  ↓
Element card display: thumbnailUrl || referenceUrls[primaryIndex]
```

#### Cleanup — How Old Crop Files Are Deleted

Because there is no `storyboard_files` record, cleanup is handled directly in
`handleThumbnailCropped` before the new crop is saved:

```ts
// If current thumbnailUrl is NOT one of the generated variants,
// it must be a standalone crop → delete its R2 file
if (thumbnailUrl && !liveReferenceUrls.includes(thumbnailUrl)) {
  const oldR2Key = thumbnailUrl.slice(r2Base.length + 1);
  await fetch("/api/storyboard/delete-file", { body: { r2Key: oldR2Key } });
}
```

And when the element itself is deleted, `removeElement` returns `urlsToClean`
which includes `thumbnailUrl` — that R2 file is deleted as part of element deletion.
No orphans.

#### Why `thumbnailUrl` Never Gets Out of Sync

Previously, `appendReferenceImage` (called when a generated image completes) and
`setPrimaryVariant` (called when user stars a variant) both blindly overwrote `thumbnailUrl`
— wiping any custom crop the user had made, without warning.

Fix: both mutations now check `hasCustomCrop` before touching `thumbnailUrl`:

```ts
// A custom crop = thumbnailUrl is set AND its URL is NOT in referenceUrls
const hasCustomCrop = !!(el.thumbnailUrl && !refs.includes(el.thumbnailUrl));

// appendReferenceImage:
if (isFirst || !el.thumbnailUrl || setPrimary) {
  patch.primaryIndex = newIndex;
  if (!hasCustomCrop) patch.thumbnailUrl = imageUrl; // ← only if no custom crop
}

// setPrimaryVariant:
await ctx.db.patch(id, {
  primaryIndex: index,
  ...(!hasCustomCrop && { thumbnailUrl: refs[index] }), // ← only if no custom crop
});
```

Result: generating a new reference image or changing the primary variant only updates
`primaryIndex`. The custom crop stays in `thumbnailUrl` untouched.

#### Display Priority

```text
element.thumbnailUrl              → custom crop (if user cropped)
  || referenceUrls[primaryIndex]  → primary generated variant (if no custom crop)
  || referenceUrls[0]             → first variant (fallback)
```

For legacy elements where `thumbnailUrl = referenceUrls[primaryIndex]` (the old coupled
state), `thumbnailUrl || primaryReferenceUrl` resolves correctly — both URLs are the same,
so the primary variant is shown as before.

#### Bandwidth Impact

| Before | After |
| ------ | ----- |
| 1 Convex write (`logUpload`) + 1 write (`updateElement`) per crop | 1 Convex write (`updateElement`) per crop |
| DB record created that is immediately filtered and never used | No DB record |
| Subscription re-fire in anything watching `storyboard_files` | No re-fire |

**Files changed:**

- `lib/uploadToR2.ts` — `noLog?: boolean` added to `UploadOptions`; passed in FormData
- `app/api/storyboard/upload/route.ts` — early return when `noLog=1`, skips `logUpload`
- `app/storyboard-studio/components/ai/ElementForge.tsx` — `noLog: true` in `handleThumbnailCropped`
- `convex/storyboard/storyboardElements.ts` — `hasCustomCrop` guard in `appendReferenceImage` + `setPrimaryVariant`

---

## `listByProject` (94 MB) — Still Deferred

VideoEditor and SceneEditor both subscribe to `listByProject`. Every generation update
re-fires both subscriptions and pushes full file documents (~2–5 KB each).

**Why deferred:** 94 MB is a dev number from hammering 1–2 projects. In production, users
spread across hundreds of projects — per-user impact is much lower. High-effort fix
(schema migration + backfill + all callers updated).

**Lightweight alternative if production shows it's still a problem:**

```ts
// Trim return fields in listByProject — no schema migration needed
return files.map(f => ({
  _id: f._id, status: f.status, sourceUrl: f.sourceUrl,
  r2Key: f.r2Key, fileType: f.fileType, filename: f.filename,
  category: f.category, aspectRatio: f.aspectRatio, createdAt: f.createdAt,
  // drop prompt, metadata, tags — heavy fields not needed in editor view
}))
```

Cuts per-update payload ~90% without touching the schema or any component. Risk: VideoEditor
and SceneEditor are actively developed — trimmed fields could silently break new code.

**When to revisit:** Check Convex production dashboard after 2–3 weeks of real users.

---

## Admin Area — Full Table Scans (Not Yet Fixed)

The admin panel was audited in Session 2. These are **admin-only pages** — they affect
admin bandwidth, not end-user bandwidth. Low urgency unless the admin panel is used heavily.

### Confirmed Full Table Scans

| Query | Tables Scanned | Pattern | Severity |
| ----- | -------------- | ------- | -------- |
| `adminDashboard.getDashboardStats` | `users`, `org_subscriptions`, `credits_ledger`, `support_tickets`, `chat_appointments` | 5 `.collect()` calls on every render | High |
| `adminAnalytics.getAnalytics` | `users`, `credits_ledger`, `org_subscriptions` | 3 `.collect()` calls | High |
| `adminSubscriptions.getAllSubscriptions` | `org_subscriptions` + nested user queries | Full scan + N+1 user lookups | High |
| `adminSubscriptions.getSubscriptionStats` | `org_subscriptions` | Full scan for aggregates | Medium |
| `financialLedger.getAllLedgerEntries` | `financial_ledger` | Full scan, then client-side filter by type/date/user | High |
| `adminUsers.getAllUsers` | `users`, `org_subscriptions` | Full scan for user management | Medium |

### Admin Inbox — Always-Mounted Full Scans

`app/admin/inbox/page.tsx` has 6 always-mounted queries with no args (full table scope):

- `api.inbox.getGroupedMessages` — full scan
- `api.inbox.getUnreadCount` — full scan
- `api.chatbot.getChatbotConversations` — full scan
- `api.chatbot.getChatbotAppointments` — full scan
- `api.emails.emailLogs.listEmailLogs` — full scan
- `api.adminNotifications.getNotifications` — full scan

### Why Not Fixed Yet

Admin pages are visited rarely and by one person (super admin). The bandwidth impact is
negligible compared to end-user studio usage. Fix when admin panel performance becomes
noticeable or if Convex dashboard shows admin queries in the top offenders.

### Right Fix When Needed

- `getDashboardStats` / `getAnalytics` — replace `.collect()` with a cached aggregate
  table refreshed by cron (same pattern as `landing_stats`). Admin dashboard reads the
  cache, not the raw tables.
- `getAllLedgerEntries` — add `by_companyId_date` compound index, filter server-side.
- `getAllSubscriptions` N+1 — denormalize user display name into the subscription row
  at write time, eliminate the nested per-user queries.
- Inbox queries — add `by_status`, `by_createdAt` indexes; paginate instead of full scan.

---

## Cron Jobs — Status

| Cron | Schedule | Approach | Status |
| ---- | -------- | -------- | ------ |
| `cleanup-expired-temps` | Daily 03:00 UTC | Index-filtered, per-company | Safe |
| `refresh-landing-stats` | Hourly | Aggregate table — fixed in Session 1 | Safe |
| `repair-orphan-files` | Daily 04:00 UTC | Batched 50/run | Safe |
| `send-inactivity-warnings` | Daily 06:00 UTC | Index-filtered by login activity | Safe |
| `purge-inactive-accounts` | Daily 06:30 UTC | Batched 20/run, R2 only | Safe |

All crons are safe. No full table scans in the cron paths.

---

## Community Gallery — Decision (Static, No DB Load)

The community/public gallery uses **static hardcoded images** — not loaded from the database.

- A curated gallery changes at most once a month
- Static images load instantly (no DB round-trip, no subscription, no re-fires)
- R2 folder: `gallery/` prefix, separate from `storyboard/` and `temps/`
- Cron only targets `temps/` — gallery files are never touched

---

## Root Causes (from Convex Docs)

| Cause | Description |
| ----- | ----------- |
| **Re-running queries** | Query reads a document that changes frequently → re-runs and pushes to all subscribed clients |
| **Large document reads** | Whole JSON documents instead of specific fields → more bandwidth per re-fire |
| **Always-mounted subscriptions** | Component mounted even when not visible → subscription active 100% of session |
| **Client-side filtering** | Fetching 200 docs to display 10 → wasted bandwidth on every fire |

---

## Patterns to Follow Going Forward

### DO

- Use compound indexes for filtered queries: `by_companyId_fileType`, `by_company_type`
- Use aggregates (`storyboard_generation_daily`, `landing_stats`) for counts/sums
- Conditionally mount modal components — subscriptions only run while modal is open
- Use `getByCompanyAndType` pattern — filter server-side, not client-side
- Use `convex.query()` (one-time) instead of `useQuery` (subscription) when data is only needed on user action
- Cache expensive admin counts in denormalized tables updated by cron
- Use `usePaginatedQuery` for any list that could grow unbounded
- Cap all `.collect()` calls with `.take(N)` as a defensive bound

### AVOID

- `.collect()` without a compound index on frequently queried tables
- Company-wide real-time subscriptions as `useQuery` when data only needed on action
- Always-mounted components with subscriptions (modals, panels, drawers)
- Fetching broad data then filtering client-side — filter server-side with indexes
- Public Convex queries with no auth and no scope (security + bandwidth risk)
- Full table scans inside cron mutations

---

## Key Principle

> "You can work around most contention problems by introducing selective staleness
> in a way that is eventually consistent. Levels of aggregation or periodic batch
> work done by a small number of actors are common strategies."

Applied here:

- `landing_stats` = selective staleness (refreshed hourly, not per-query)
- `storyboard_generation_daily` = aggregation (one row per day, not one per file)
- `by_companyId_fileType`, `by_company_type` = index filtering (calculator not abacus)
- Conditional mounts = subscriptions only exist when needed
