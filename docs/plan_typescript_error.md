# TypeScript Error Resolution Plan

**Current state (2026-04-25):** 100 errors across 19 files
**Build impact:** None — `ignoreBuildErrors: true` in next.config.ts
**Goal:** Get to 0 errors, then remove `ignoreBuildErrors` to catch regressions

---

## Error Summary

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2339 | 42 | Property does not exist on type (missing fields / wrong type shape) |
| TS2322 | 23 | Type not assignable (mismatched types) |
| TS2345 | 16 | Argument type not assignable (wrong param types) |
| TS18046 | 6 | Variable is of type 'unknown' (untyped catch / unsafe access) |
| TS2739 | 4 | Missing properties in type (incomplete objects) |
| TS2353 | 4 | Object literal has unknown properties |
| TS2349 | 2 | Cannot invoke expression (calling non-callable) |
| TS2488 | 1 | Must have Symbol.iterator (iteration issue) |
| TS2367 | 1 | No overlap between types (impossible comparison) |
| TS2304 | 1 | Cannot find name (missing import/declaration) |

## Files Ranked by Error Count

| File | Errors | Area |
|------|--------|------|
| components/booking/CalendarView.tsx | 16 | Booking UI |
| app/api/n8n-webhook/route.ts | 15 | n8n integration |
| convex/inbox.ts | 14 | Inbox/messaging |
| convex/bookingTools.ts | 10 | Booking backend |
| app/api/n8n-image-proxy/route.ts | 9 | n8n integration |
| app/api/kie-callback/route.ts | 8 | AI callback |
| app/api/storyboard/upload/route.ts | 6 | File upload |
| convex/companySettings.ts | 4 | Company settings |
| convex/storyboard/n8nWebhookCallback.ts | 3 | n8n callback |
| convex/migrations/addCompanyIdToTables.ts | 3 | Migration |
| app/api/storyboard/kie-task-status/route.ts | 3 | AI status |
| app/api/storyboard/delete-convex/route.ts | 2 | Storyboard API |
| 7 other files | 1 each | Various |

---

## Approach: Fix in 4 Phases

### Phase 1 — Quick Wins (~20 errors)
**Files:** Single-error files + companySettings + migrations
**Typical fixes:** Add missing imports, type-narrow `unknown` catches, cast Convex IDs
**Files:**
- components/OrganizationSwitcherWithLimits.tsx (1)
- app/api/storyboard/r2-upload/route.ts (1)
- app/api/storyboard/generate-script/route.ts (1)
- app/api/storyboard/generate-image/route.ts (1)
- app/api/storyboard/enhanced-script-extraction/route.ts (1)
- app/api/storyboard/update-file-category/route.ts (1)
- convex/migrations/populateCompanyId.ts (1)
- convex/migrations/addCompanyIdToTables.ts (3)
- convex/companySettings.ts (4)
- app/api/storyboard/delete-convex/route.ts (2)
- app/api/storyboard/kie-task-status/route.ts (3)

### Phase 2 — Convex Backend (~24 errors)
**Files:** convex/inbox.ts, convex/bookingTools.ts, convex/storyboard/n8nWebhookCallback.ts
**Typical fixes:** Align mutation/query args with schema.ts, fix Convex ID casts, narrow unknown types
**Why second:** Backend-only — no UI risk, easy to test with Convex dashboard

### Phase 3 — API Routes (~38 errors)
**Files:** n8n-webhook, n8n-image-proxy, kie-callback, storyboard/upload
**Typical fixes:** Type external API responses, add proper request body interfaces, fix property access on untyped objects
**Why third:** Highest error count, but isolated to API route handlers — no shared component risk

### Phase 4 — UI Components (~16 errors)
**Files:** components/booking/CalendarView.tsx
**Typical fixes:** Fix prop types, event handler signatures, date/time type mismatches
**Why last:** UI changes need visual verification

---

## Rules for Fixing

1. **Never change runtime behavior** — only add types, casts, and narrowing guards
2. **Run `npx tsc --noEmit` after each file** to confirm error count drops
3. **Don't introduce `any`** — use proper types or `unknown` with narrowing
4. **If a fix requires changing Convex schema** — flag it, don't auto-change (schema changes redeploy the backend)
5. **Commit per phase** so regressions are easy to bisect

## Final Step

Once at 0 errors:
- Remove `ignoreBuildErrors: true` from next.config.ts
- Add `npx tsc --noEmit` to CI/pre-commit hook to prevent regressions
