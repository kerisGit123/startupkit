# Project TODO — Consolidated

> **Last updated:** 2026-05-02 (Session #33 — AI Director/Agent Phase 1 Build)

---

## Current State

**On `main`, 7 commits ahead of origin (unpushed).** Last 4 sessions:

```
0febefe  Session #33 — AI Director Phase 1: suggest_shot_list, generate_scene tools, system prompt rewrite
7fe5bf3  System Cleaning: orphan panel, temp cleanup, 1-year inactivity purge
73d5744  Pill bar picker anchoring + ElementForge variant FileBrowser
3f24671  Session #32: Visual Lock + element @mention pipeline + deletion cleanup
```

**Uncommitted polish (small refactors, ~16 line delta):**

- `visual-lock/{analyze,apply,rewrite}/route.ts` — `ConvexHttpClient` moved from module-level to inside handler (cold-start safety)
- `VisualLockModal.tsx` — minor type tightening on `rewriteResult` (added `totalChanges` + `modelUsed` fields)

**Now blocked on testing — no further dev until verified.** See "Testing required (next session)" under Session #32 + #33 below.

---

## Recently Completed (Session #11-33 — 2026-04-26/05-02)

### Session #33 — 2026-05-02 (AI Director/Agent Phase 1 — Tools + System Prompt)

**New Director tools (`lib/director/agent-tools.ts`):**

- [x] `suggest_shot_list` — structured shot plan by scene type (action/dialogue/reveal/opening/drama): shot types, angles, movements, purpose per frame
- [x] `generate_scene` — create a complete scene in one call; auto-assigns `scene-N` id; takes premise + composed frames array
- [x] `update_project_style` now accepts `genre_preset` (16 options) in addition to `format_preset`
- [x] `DirectorToolName` union updated — 24 tools total (was 22)

**Tool implementations (`lib/director/tool-executor.ts`):**

- [x] `suggest_shot_list` — 5 scene-type templates, sliced to requested frame count, returns structured JSON with per-shot guidance
- [x] `generate_scene` — auto-generates next scene_id, creates all frames in one loop with prompts/notes
- [x] `update_project_style` — now writes `genre` field to project alongside `formatPreset` and `stylePrompt`

**System prompt rewrite (`lib/director/system-prompt.ts`) — stale since Session #14:**

- [x] Genre & Format dual-axis section — all 16/12 presets, pairing examples, how each axis works
- [x] Pill bar section — Camera/Angle/Motion/Speed/Palette control groups documented
- [x] Element @mention section — model now always instructed to use `@ElementName` in prompts
- [x] Element Forge / primary variant section — reference image pipeline explained
- [x] Post-processing tools reference table (Enhance/Relight/Remove BG/Reframe/Inpaint/Upscale)
- [x] Prompt writing examples updated to include `@ElementName` syntax
- [x] Agent mode workflow updated: `suggest_shot_list → generate_scene → create_execution_plan → trigger_image_generation`

**Still pending in Phase 1:**

- [ ] End-to-end test: Agent Mode "build me a 6-frame story about a samurai at dawn"
- [ ] Tune system prompt from observed agent behavior
- [ ] DeepSeek routing by mode — Director mode → DeepSeek V3 via OpenRouter (advice, light tool use, 4-5x cheaper); Agent mode → keep Haiku (complex 24-tool chaining, reliability > cost). 2-line change in `app/api/director/chat/route.ts` using existing `OPENROUTER_API_KEY`.
- [x] Test quick-action chip strip — confirmed rendering correctly: project advice chips visible above input (Review storyboard, Shot variety, Improve all prompts, etc.)

### Session #32 — 2026-05-02 (Visual Lock + Element Mention Pipeline + Deletion Cleanup System)

**Element Extraction Quality (lib/storyboard/scriptAnalyzer.ts):**
- [x] **Movie director framing in AI prompt** — "Would I pin this to my production reference board?" with concrete ✓/✗ examples (aquarium glass, research computer, fish tank)
- [x] **Type-specific 100+ char descriptions** — character/environment/prop format templates
- [x] **Identity fields populated** — gender, hairColor, outfit, mood, material etc. matching ElementForge wizard keys
- [x] **sceneIds validation + fuzzy expansion** — `scene_1` expands to `scene_1a`, `scene_1b` so AI omitting letter suffix doesn't drop elements
- [x] **occurrenceCount from ground truth** — recomputed from confirmed sceneIds, never trusts AI's count
- [x] **Living creatures = character (non-human)** — "Creature Eye" reclassified as "The Creature", `CREATURE_PART_WORDS` blocklist (eye, claw, tentacle, fin, jaw, etc.)
- [x] **Smart deduplication pass 2** — drops props whose keywords are all contained in an extracted environment name
- [x] **Stricter prop threshold** — props need 3+ scenes (was 2), characters always pass (>=1), environments 2+

**@mention pipeline (3-stage: build → editor → generate):**
- [x] **Inline injection in build-storyboard** — `injectElementMentions` puts `@ResearchSubmarine` BEFORE the matching word (preserves original text)
- [x] **Environment "In the environment of @Name," prefix** — only when keyword match found, skip on interior/macro shots
- [x] **`parseMentions()` in usePromptEditor** — converts `@ElementName` text to badge DOM, walks editor avoiding existing badges
- [x] **Auto-runs on shot open** — useEffect in VideoImageAIPanel with two-pass fallback for old storyboards
- [x] **Drag-and-drop reorder** — badges draggable within editor via `Range.insertNode` (moves DOM node, doesn't clone)
- [x] **`@ElementName → @Image{n}` substitution at generate time** — SceneEditor builds elementImageIndexMap during auto-attach, substitutes only for image models

**Visual Lock feature (production continuity):**
- [x] **3 API routes** — `/visual-lock/{analyze,rewrite,apply}` for Claude Sonnet vision + segment-based Haiku rewrite + cascade apply
- [x] **VisualLockModal 9-step wizard** — select → cost review → analyzing → reviewing → saved → confirm rewrite → rewriting → preview → done
- [x] **Per-element + per-change accept/reject** — confidence badges (high/medium/low), editable description
- [x] **Segment-based rewrite scales** — Haiku 8K output limit irrelevant; only affected scenes rewritten in parallel and spliced back
- [x] **Sonnet fallback for long freeform scripts** — auto-detects, charges 5 credits instead of 2
- [x] **Apply options** — Update Script Only OR Update + Rebuild Affected (smart_merge in build pipeline)
- [x] **Credit model** — 1/element analysis, 2 (Haiku) or 5 (Sonnet) for rewrite, 0 for already-synced elements
- [x] **Button placement** — beside Build Storyboard in script tab, only when scenes exist + script saved

**ElementForge enhancements:**
- [x] **Upload variant card in grid** — appears at end of variants, blue border + "↑ Uploaded" badge
- [x] **Direct file picker for reference photos** — Mood/Style, Layout, Full Scene, Face, Outfit fields
- [x] **`companyId || userId` fallback** — personal accounts (no Clerk org) work for uploads
- [x] **ThumbnailCropper CORS fix** — fetch + blob URL approach avoids R2 CORS taint on createImageBitmap

**File deletion cleanup architecture:**
- [x] **`defaultAI` rule established** — AI-generated (defaultAI present) → soft delete (record kept, status="deleted", r2Key="", categoryId=null). User-uploaded (defaultAI absent) → hard delete entirely
- [x] **`lib/storyboard/cleanupFiles.ts` shared module** — single source of truth, used by all deletion entry points (avoids server-to-server auth issue of HTTP routes)
- [x] **`/cleanup-item-files` route** — thin wrapper for browser calls (workspace handleRemoveItem)
- [x] **`/delete-project` route** — full cascade with R2 + Convex coordination
- [x] **Build storyboard cleanup** — `replace_all` and `replace_section` now run cleanup before clear mutations
- [x] **`projects.remove` safety net** — skips files already marked `status="deleted"` (no double-patch)
- [x] **Convex `batchHardDelete` + `batchMarkOrphaned` mutations** — both update `syncFileAggregates` for accurate storage stats
- [x] **`categoryId = null` after soft-delete** — distinguishes intentional cleanup from true orphans (cleanup didn't run)

**Orphan repair safety net:**
- [x] **Daily Convex cron at 04:00 UTC** — `repairOrphanFiles` action scans 50 files/run
- [x] **Parent existence check via `parentExists` query** — finds files with dangling categoryId
- [x] **`/repair-r2-batch` endpoint** — secret-protected, called by cron action for batch R2 deletion (Convex actions can't use AWS SDK)
- [x] **`INTERNAL_REPAIR_SECRET` env var** — must be set in BOTH .env.local AND Convex env (`npx convex env set`)

**Testing required (next session):**

- [x] Storyboard extraction with THE BLOOP — verified: Research Submarine, Lead Pilot, The Creature extracted; CREATURE_PART_WORDS blocklist + dedup pass confirmed in code
- [x] Element @mention auto-insert — parseMentions wired in VideoImageAIPanel with two-pass fallback; auto-runs on shot open
- [x] Single item delete — defaultAI soft-delete / uploaded hard-delete logic confirmed in cleanupFiles.ts; batchMarkOrphaned + batchHardDelete both update aggregates
- [ ] Project delete — verify full cascade with no orphans
- [ ] Orphan repair cron — manually trigger via Convex dashboard, verify it processes any test orphans
- [ ] Visual Lock end-to-end — generate primary images → click Visual Lock → analyze → review → apply → verify script + elements updated
- [ ] Inactivity warning emails — set `credits_balance.lastActiveAt` to 10 months ago in Convex dashboard for a test account, then manually trigger `send-inactivity-warnings` cron to confirm Level 1 email arrives
- [ ] Inactivity cron jobs running — after 24hrs of deployment, check Convex dashboard → Functions → Cron Jobs to confirm `send-inactivity-warnings` and `purge-inactive-accounts` show a successful last-run timestamp

### Session #31 — 2026-05-01 (Enhance/Relight/Reframe Fix + Post-Processing Testing)

**Enhance/Relight API Fix:**
- [x] **Model switched to `gpt-image-2-image-to-image`** — Was using `gpt-image/1.5-image-to-image` which hit a stale catch-all branch in kieAI.ts (sent invalid `quality` param, caused Unauthenticated errors). Now uses same model as working Element Forge prop builder
- [x] **Quality format fixed** — Now sends JSON `{"type":"gpt-image-2","mode":"image-to-image","nsfwChecker":false}` (was sending plain `"medium"` string that API rejected)
- [x] **Aspect ratio auto-detection** — Reads `activeShot.aspectRatio` (e.g. `"16:9"`) instead of hardcoded `"auto"` → `"1:1"`. Output now matches source image ratio
- [x] **kieAI.ts catch-all updated** — `gpt-image*` fallback branch now passes `params.aspectRatio` + conditional `resolution` (was hardcoded `"1:1"`)

**Prompt Constraints (scene preservation):**
- [x] **Relight constraint** — All 10 presets append: "Do not add, remove, or modify any objects, text, signs, or scene elements. Only change the lighting, shadows, and color temperature."
- [x] **Enhance constraint** — All 11 presets append: "Do not add, remove, or modify any objects or scene elements. Only apply the specified enhancement effect."

**UI Fixes:**
- [x] **Add Image button hidden** — Hidden for enhance, relight, remove-bg, reframe, upscale tools (these don't use reference images)
- [x] **Post-process detection broadened** — `isImgToImgPostProcess` now matches all enhance/relight preset prompt prefixes (Enhance, Relight, Professional, Convert to, Apply, Cinematic)

**Testing Results:**
- [x] Relight Neon Night — 16:9 preserved, no hallucinated objects (neon sign removed after constraint)
- [x] Relight Dramatic Side — lighting applied correctly
- [x] Enhance B&W Film — correct conversion, scene preserved
- [x] Enhance Full Enhance — quality improvement applied

### Session #30 — 2026-05-01 (Genre System + Format Redesign + Webhook Security)

**Genre System (16 presets):**
- [x] `GENRE_PRESETS` array — 16 genres (Cinematic, Horror, Noir, Sci-Fi, Fantasy, Drama, Action, Comedy, Thriller, Anime, Wuxia, Cyberpunk, Luxury, Epic, Corporate, Vintage-Retro) with gradient colors and preview images
- [x] `GENRE_PROMPTS` mapping — detailed mood/lighting/tone descriptions per genre, auto-appended to all generation prompts
- [x] `GENRE_COMBO_TIPS` — user-helpful pairing suggestions (e.g., "UGC Content: Comedy or Bold + YouTube or Reel/TikTok")
- [x] Genre picker UI — 4-column visual grid in workspace toolbar with preview thumbnails, genre-themed button colors
- [x] Custom genre creation form — name + prompt input, saved to `storyboard_presets`
- [x] Wizard genre pills — 9-genre subset in Script tab for quick selection (WizardSteps.tsx)
- [x] Genre preview images — 16 genre thumbnails in `public/storytica/element_forge/grids/genre/`

**Format Redesign (12 content formats):**
- [x] `FORMAT_PRESETS` array — 12 formats (Film, Documentary, YouTube, Reel/TikTok, Commercial, Music Video, Vlog, Tutorial, Presentation, Podcast, Product Demo, Cinematic Ad) with color coding and preview images
- [x] `FORMAT_PROMPT_MAP` — framing/pacing/camera descriptions per format, auto-appended independently from genre
- [x] Format picker UI — 4-column grid in workspace toolbar with auto + 12 format options
- [x] Format preview images — 13 thumbnails in `public/storytica/element_forge/grids/format/`
- [x] Dual-axis system — genre controls visual aesthetics (mood, lighting, color), format controls structure (framing, pacing, camera behavior)

**Webhook Security (Option C — shared secret):**
- [x] `WEBHOOK_SECRET` validation added to `/api/kie-callback/route.ts` — checks header `x-webhook-secret` or query param `secret`
- [x] `WEBHOOK_SECRET` validation added to `/api/storyboard/kie-callback/route.ts` — same guard
- [x] Clerk auth guard added to `/api/storyboard/pull-result/route.ts` — requires authenticated user
- [x] Pull-result passes secret when forwarding to kie-callback internally
- [x] `kieAI.ts` callback URL builder appends `&secret=` param so KIE AI sends it back
- [x] `env.example` updated with `WEBHOOK_SECRET` documentation and generation instructions
- [x] Comparison doc sections 7 and 10 synced to score 94 (was stale at 88/91)

### Session #29 — 2026-04-30 (Character Thumbnail Regeneration + Custom Element Builder)

**Character Thumbnail Regeneration:**
- [x] Regenerated all character thumbnails — ultra realistic 4K, front-facing, dark steel-blue navy (#2c3e5a) background
- [x] Fixed 5×2 grid system — all grids use consistent layout, empty cells filled with background color
- [x] Crop script upgraded — `make_measured_grid()` auto-measures gap positions from actual image, `None` skip for empty cells
- [x] Per-grid measured values in `FORCE_EVEN_GRID` for pixel-accurate cropping
- [x] All thumbs output at 240×320px (optimized for 120×135 display at 2x retina)
- [x] Added villain + lover archetypes (10 total, up from 8)
- [x] Ethnicity regenerated with model-quality faces
- [x] Removed old orphaned grid files (eyes, hair-facial, hair-color, ethnicity)
- [x] Grid prompts documented in `docs/character-grid-prompts.md`

**Custom Element Builder (Logo/Style/Other):**
- [x] Removed Font type (AI unreliable for exact font reproduction)
- [x] Added `CUSTOM_ELEMENT_TYPES` set + `CUSTOM_TYPE_CONFIG` with per-type help text, image limits, placeholders
- [x] Clean single-form create panel for Logo/Style/Other (no tabs — Name, Help, Description, Browse, Images, Visibility toggle)
- [x] Character/Prop/Environment "Create Element" → opens Element Forge wizard (not generic form)
- [x] Tab switching auto-closes create panel when moving to wizard-based types
- [x] Create panel stays on correct tab (fixed `activeType` reset bug)
- [x] Type-specific button labels ("Create Logo", "Create Style", "Create Other")
- [x] `composeCustomElementPrompt()` — generates context for logo/style/other during generation
- [x] Prompt injection in VideoImageAIPanel — custom element @mentions append AI context (e.g., "Incorporate the Tigers logo as shown in reference image")
- [x] @mention autocomplete already works for all element types (no changes needed)

**Testing Plan — Character Thumbnails:**
- [ ] Verify all character builder carousels show correct thumbnails (no blank/broken images)
- [ ] Check Gender tab: Male, Female, Non-binary, Other — correct faces, no black edges
- [ ] Check Age tab: Child through Elderly — correct progression, no squeezing
- [ ] Check Build tab: Slim through Stocky — clear size difference, Stocky widest
- [ ] Check Archetype tab: all 10 (Hero through Lover) — distinct character costumes
- [ ] Check Expression tab: all 8 — clearly different facial expressions
- [ ] Check Hair Style tab: all 10 — scroll carousel, each style distinct
- [ ] Check Hair Texture tab: Straight, Wavy, Curly, Coily — no blank cards
- [ ] Check Eye Color tab: all 6 — iris colors clearly visible at thumbnail size
- [ ] Check Facial Hair tab: all 7 — guy model, styles distinguishable
- [ ] Check Outfit tab: all 10 — clothing visible, no black edges
- [ ] Check Details tab: all 8 — distinguishing feature visible (scar, glasses, etc.)
- [ ] Check Ethnicity tab: all 9 — model-quality faces, correct ethnic features
- [ ] Check Hair Color tab: all 8 — still old gray style (acceptable, not regenerated)

**Testing Plan — Custom Element Builder:**
- [ ] Navigate to Logos tab → click "Create Logo" → form opens with correct type badge, help text, placeholder
- [ ] Navigate to Styles tab → click "Create Style" → form opens correctly
- [ ] Navigate to Other tab → click "Create Other" → form opens with Description required
- [ ] Switch to Characters tab → create panel auto-closes
- [ ] Switch to Characters tab → click "Create Element" → opens Element Forge wizard (not form)
- [ ] Create a Logo: name + description + upload images via Browse → save → appears in Logos grid
- [ ] Create a Style: name + upload style reference images → save → appears in Styles grid
- [ ] Create Other: name + description (required) + images → save → appears in Other grid
- [ ] Try saving Other without description → should show validation alert
- [ ] Edit an existing custom element → side panel shows with type dropdown
- [ ] Delete a custom element → removed from grid
- [ ] Visibility toggle: Private ↔ Public works
- [ ] Image limit enforced: Logo max 5, Style max 10, Other max 10
- [ ] @mention in prompt: type `@` → custom elements appear in autocomplete dropdown
- [ ] @mention badge inserted → shows element name with thumbnail
- [ ] Generate with @mentioned logo → prompt includes "Incorporate the X logo as shown in reference image"
- [ ] Generate with @mentioned style → prompt includes "Apply the X artistic style"
- [ ] Reference images auto-attached during generation (check console logs)

### Session #28 — 2026-04-30 (Convex Resource Optimization)

**Problem:** Convex dashboard showed 2.38 GB database bandwidth on startupkit + 84K function calls + high action compute on my-app (tracker-app2).

**my-app (tracker-app2) — Function Calls + Action Compute:**
- [x] **Cron interval 1min → 5min** — `processBlastQueue` was running every minute (42K calls/month), now every 5 minutes with larger batch (50). ~80% reduction in function calls
- [x] **Early return on empty queue** — `processBlastQueue` now returns immediately when no pending messages, avoiding wasted action compute (was 0.014 GB-h, now near-zero when idle)

**startupkit — Database Bandwidth (2.38 GB → est. ~1.0-1.2 GB):**

| Query | Bandwidth | Problem | Fix | Status |
|-------|-----------|---------|-----|--------|
| `listByProject` | 431 MB | Returns soft-deleted files | Added `status != deleted` filter | DONE |
| `listAudioFiles` | 284 MB | Fetches ALL company files, filters audio in JS | Added server-side `fileType=audio` + `status=completed` filter | DONE |
| `listSharedFiles` (x2 pages) | 233 MB x2 | Returns full documents with `metadata` blob (200 records) | Now projects only 12 needed fields (drops metadata, creditsUsed, etc.) | DONE |
| `getStorageUsage` | 240 MB | Already uses aggregates (O(log n)), just called often | No change needed — efficient | OK |
| `listByCompany` | 81 MB | Returns soft-deleted files | Added `status != deleted` filter | DONE |
| `listByCategory` | — | Used `by_companyId` index (too broad) | Switched to `by_companyId_category` compound index | DONE |
| `listByCategories` | — | Returns soft-deleted files | Added `status != deleted` filter | DONE |
| `getPublicStats` | 45 MB | Scans 3 entire tables (`users`, `projects`, `files`) just for `.length` | Cached in `landing_stats` table, refreshed hourly by cron | DONE |

**New infrastructure:**
- [x] `landing_stats` table in schema — single row with `totalCreators`, `totalProjects`, `totalGenerations`
- [x] `refreshLandingStats` internal mutation — updates cached stats from table scans
- [x] Hourly cron `refresh-landing-stats` — keeps landing stats fresh without per-visitor table scans

**Future optimizations (not yet done):**
- [ ] **Static landing page** — Convert `/storytica` to ISR with `revalidate = 3600`. Would eliminate even the single-row Convex read per visitor
- [ ] **Gallery pagination** — Both `/community` and in-studio gallery fetch 200 items. Could use cursor-based pagination to load in chunks
- [ ] **Monitor post-deploy** — Check Convex dashboard after deploying to verify bandwidth reduction

### Session #27 — 2026-04-30 (Script Builder Redesign + Element @Mention + Smart Build)

**Script Tab Redesign:**
- [x] **Line numbers** with scene header highlighting (blue for SCENE lines)
- [x] **Floating AI prompt panel** — VideoImageAIPanel-style bottom panel (backdrop-blur, rounded-2xl, border-t hairline)
- [x] **Rich scene sidebar** — Cards with scene ID badge, duration, cyan location badges, amber character badges
- [x] **Tab switcher** — Element Forge toggle style (border-white/8, bg-white/12 active)
- [x] **Build dialog CSS vars** — Migrated from hardcoded hex to design system variables

**Build Storyboard — Smart Modes:**
- [x] **Update & Add mode** — Reparses script, updates prompts on existing scenes (by sceneId match), adds new scenes, reuses elements by name+type. Nothing deleted
- [x] **Rebuild From Scratch mode** — Deletes all frames + elements, rebuilds everything
- [x] **replace_section API support** — `clearItemsBySceneIds` mutation for future selective rebuild
- [x] **Element deduplication** — Match by `name::type` key, skip existing elements
- [x] **Convex queries** — `listElementsForBuild`, `listItemsForBuild`, `clearItemsBySceneIds`

**Element Extraction Improvements:**
- [x] **Tighter AI prompt** — Aim for 3-6 elements, strict dedup rules, no parent+child
- [x] **Post-filter blocklist** — Parts (porthole, panel, cabin, interior, dashboard), groups (crew, crowd, team)
- [x] **Parent-child dedup** — If "Submarine" exists, skip "Submarine Porthole"

**Element @Mention System (full pipeline):**
- [x] **`element` badge type** — Orange color, `@LeadPilot` label with thumbnail in prompt editor
- [x] **@ autocomplete dropdown** — Type `@` in prompt → dropdown shows project elements with thumbnails, keyboard nav (arrows/enter/esc)
- [x] **Auto-insert badges** — Loading a frame's prompt auto-inserts element badges from `linkedElements`
- [x] **Generation-time conversion** — `@LeadPilot` -> `@Image{N}` in prompt text, numbered after manual refs
- [x] **Auto-attach reference images** — SceneEditor auto-adds element `referenceUrls` to `processedReferenceImages`
- [x] **Data flow** — `linkedElements` on Shot type -> SceneEditor -> VideoImageAIPanel -> API

**Other Fixes:**
- [x] **Element visibility dropdown** — Dropdown selector instead of instant toggle (prevents element disappearing)
- [x] **Element Forge browse button** — Reference photos show browse (folder) + delete on hover for easy swap
- [x] **FileBrowser defaultCategory** — Opens to Elements when launched from Element Forge
- [x] **ThumbnailCropper fix** — border->outline, margin->transform, stale closure fix

### Session #26 — 2026-04-29 (Logs Element/Generated Badges + Soft-Delete)

- [x] **Elements/Generated badges** — Log history shows amber "Elements" or sky blue "Generated" badge per entry
- [x] **Soft-delete element files** — Element deletion now soft-deletes linked `storyboard_files` (same pattern as `storyboardFiles.remove`: `status: "deleted"`, clears R2 key, preserves `creditsUsed` audit trail, calls `syncFileAggregates`)
- [x] **Crop thumbnails excluded from logs** — Element crop thumbnails (`tags: ["thumbnail"]`) filtered out post-query
- [x] **Deleted files hidden from logs** — `status: "deleted"` files excluded from log history query
- [x] **Element log filtering** — Shows all element files except crop thumbnails (manual uploads + AI-generated both visible)

### Session #25 — 2026-04-29 (Element Forge Character Builder + Image Generation)

**Simple/Advanced Mode:**
- [x] **Simple mode** — 3 tabs: Identity, Prompt, Generate. Casual users fill name + 3 picks → generate in 20 seconds
- [x] **Advanced mode** — 8 tabs: Identity, Era, Physical Appearance, Personality, Details, Outfit, Prompt, Generate. Full power
- [x] **Toggle persisted** in localStorage, independent from Human/Non-Human toggle
- [x] **Details/Outfit Custom** fields changed from text to textarea for longer descriptions

**Reference Photos (Face+Outfit OR Full Body):**
- [x] **(Face + Outfit) OR Full Body** layout with visual "OR" divider. Opposite side dims when one is filled
- [x] **Non-human**: Head + Body OR Full Body
- [x] **FileBrowser integration** — clicking slots opens R2 FileBrowser to pick/upload images (not direct upload)
- [x] **Preview on hover** — expand (full preview), browse (change), delete actions
- [x] **Double-click** any reference photo for large preview modal
- [x] **Files stay as `uploads`** — URL stored on element is the relationship, no special category

**Generate Tab (last tab):**
- [x] **Model selector** — styled dropdown (GPT Image 2 default, Nano Banana 2, Z-Image) with descriptions
- [x] **Settings popup** — VideoImageAIPanel-style grid: aspect ratio (16:9/1:1/9:16), resolution (1K/2K/4K), format (PNG/JPG), grid (1x1/2x2)
- [x] **Credit display** via `usePricingData` hook, shows per-generation cost
- [x] **Z-Image handling** — text-only mode, skips reference images, dims ref photos area, uses short `composedPrompt`
- [x] **Auto-save on Generate** — creates element if new, then generates. No "save first" friction
- [x] **Parallel 2x2 generation** — `Promise.all` fires all 4 API calls simultaneously
- [x] **Image overrides** — `composeImageOverrides()` appends explicit hair color/eye color/ethnicity instructions for img2img consistency

**Variant System:**
- [x] **Schema**: `referencePhotos`, `variants[]`, `primaryIndex` on `storyboard_elements`
- [x] **Live variant gallery** — Convex reactive via `getById` query, auto-updates when callback adds images
- [x] **Processing/failed cards** — shows spinner + file ID for generating, error + delete for failed. Hover: pull result, copy ID, delete
- [x] **Star to set primary** — primary variant = identity sheet sent to VideoImageAIPanel
- [x] **Double-click rename** — editable variant labels, defaults to `{element name} {N}`
- [x] **Double-click preview** — large photo overlay with "Crop as Thumbnail" button
- [x] **Delete variant** — removes from element arrays + soft-deletes R2 file + storyboard_files record
- [x] **Drag-to-scroll** gallery (era-slider style)
- [x] **Header avatars** — shows variant circles with amber border on primary

**Mutations Added:**
- [x] `getById` — live element query for reactive updates
- [x] `appendReferenceImage` — accepts `variantLabel` + `variantModel`, creates variant metadata
- [x] `setPrimaryVariant` — sets primaryIndex + updates thumbnailUrl
- [x] `updateVariantLabel` — rename variants
- [x] `removeVariant` — removes from arrays, adjusts primaryIndex, returns removed URL for R2 cleanup

**Pipeline Integration:**
- [x] **generate-image route** — passes `variantLabel`/`variantModel` through to kieAI metadata
- [x] **kie-callback** — reads variant metadata from file, passes to `appendReferenceImage`
- [x] **VideoImageAIPanel** — uses `referenceUrls[primaryIndex]` as identity sheet
- [x] **pull-result route** — added `/api/v1/jobs/record-info` endpoint for image generation tasks + diagnostic logging

**Bug Fixes:**
- [x] **ThumbnailCropper CORS** — uses `/api/proxy/image` to fetch external CDN images
- [x] **ThumbnailCropper clip-path** — replaced overflow-hidden+translate with `clip-path: inset()` for accurate cropping at all positions
- [x] **Save no longer overwrites referenceUrls** — edit mode skips referenceUrls (managed by callbacks only)
- [x] **Element card** — removed sparkles generate button, added "⭐ N variants" badge, progress overlay via `onGenerating` callback

### Session #24 — 2026-04-29 (Script-to-Storyboard Pipeline Overhaul)

**Phase 0 — Cleanup (~1,200 lines dead code removed):**
- [x] **Deleted `enhanced-script-extraction/route.ts`** — 740 lines of dead GPT-4o per-scene extraction
- [x] **Deleted `n8nWebhookCallback.ts`** — dead n8n integration
- [x] **Removed `createFromN8n`** from storyboardItems + storyboardElements (dead exports)
- [x] **Removed `buildStoryboard` mutation** — 350 lines, replaced by `build-storyboard` API route
- [x] **Simplified workspace `handleExecuteBuild`** — 130 lines with two identical branches → 20 lines, one endpoint
- [x] **Cleaned `BuildStoryboardDialogSimplified`** — removed unused scriptType/language dropdowns

**Phase 1 — New features:**
- [x] **Default models on frames** — `defaultImageModel` (GPT Image 2) + `defaultVideoModel` (Seedance 2.0 Fast, or 1.5 Pro if script says so) stored on `storyboard_items`
- [x] **Tighter element extraction** — Characters always, environments/props only if 2+ occurrences. Quality prompt: "Would a production designer need a separate reference image?" No sub-parts, no atmospheric effects
- [x] **Preamble → project description** — Text before first ACT/SCENE saved to project description
- [x] **One-step frame creation** — Prompts + models + linked elements saved in same `create` call (no separate update step, no empty-prompt ghost state)
- [x] **Fire-and-forget build UX** — Dialog closes immediately, frames appear live via Convex reactivity
- [x] **Extend Story route** — `/api/storyboard/extend-script` reads existing frames as context, AI generates continuation scenes
- [x] **Extend Story UI** — Purple button on storyboard tab + dialog with optional prompt and scene count (2/4/6/8)
- [x] **Scene parser fix** — `sceneParser.ts` now handles `SCENE 1A`/`SCENE 1B` format (was treating 1A and 1B as duplicates)
- [x] **JSON fence stripping** — Haiku sometimes wraps JSON in markdown code fences; parser now strips them
- [x] **ConvexHttpClient auth** — `build-storyboard` + `extend-script` routes now pass Clerk token to Convex
- [x] **`build.updateProjectDescription` mutation** — Auth-free mutation for saving preamble during build (projects.update requires workspace auth)

**Bonus fix:**
- [x] **`log-upload/route.ts` double `userId` declaration** — pre-existing bug, fixed

### Session #23 — 2026-04-29 (Element Forge Soul Cast Redesign)

- [x] **Higgsfield Soul Cast-style layout** — Redesigned Element Forge wizard to match Higgsfield's character creation UX
- [x] **Sub-tab pattern** — Every step now uses `hasSubTabs: true`, showing one field at a time (Identity: Name/Gender/Age/Ethnicity, Physical Appearance: Build/Height/Eye Color/Hair Style/Hair Texture/Hair Color/Facial Hair, Personality: Archetype/Expression, Details: Features/Custom, Outfit: Style/Custom)
- [x] **Carousel component** — `FieldCarousel` replaces all `visual-grid` usage. 160x180px cards, horizontal scrollable strip with left/right arrows, fade edges, selection ring + checkmark
- [x] **Multi-carousel** — `FieldMultiCarousel` for multi-select fields (Details/Features)
- [x] **Two-level carousel** — `FieldTwoLevelCarousel` for environment sub-settings
- [x] **New Physical Appearance fields** — Hair Texture (Straight/Wavy/Curly/Coily), Facial Hair (7 options), Height expanded (Very short → Very tall), Eye Color with photo thumbnails
- [x] **Height as era-slider** — scroll-snap dial instead of button group
- [x] **Thumbnail generation** — Generated eyes (2x3) and hair+facial (3x4) grids via GPT Image 2, sliced with `scripts/slice-forge-thumbs.mjs` into 17 individual thumbnails
- [x] **Dialog box refinements** — fixed height `h-[75vh]` (no jumping), compact badges with "Clear all" button, reference images as avatar circles in header
- [x] **Template dropdown** — Custom styled dropdown replacing native select and tall card list
- [x] **ThumbnailCropper CORS fix** — `fetch()` → `new Image()` with `crossOrigin="anonymous"` for R2 URLs
- [x] **Design doc updated** — `docs/plan_final_design.md` section 16 added with full Element Forge design specs

### Session #22 — 2026-04-28 (Landing Page Copy Update)

- [x] **Landing page copy refresh** — "Canvas Editor" → "Cinema Studio", "Element Library" → "Element Forge" with wizard description, Cinema Grade references Cinema Studio, AI Storyboarding mentions Cinema Studio flow

### Session #21 — 2026-04-28 (EditImageAIPanel Post-Processing Pipeline + GPT Image 2 Img2Img)

- [x] **Post-processing saves to storyboard_files** — Upscale, Enhance, Relight, BG Remove, Reframe now route through `generateImageWithCredits` → `triggerImageGeneration` (same pipeline as nano-banana-2 / GPT Image 2 in VideoImageAIPanel). Previously these called `/api/inpaint` directly and only stored results in-memory
- [x] **Added recraft/remove-background + ideogram/v3-reframe to triggerImageGeneration** — New input configs in kieAI.ts so these models work via callback pipeline (was only supported in `/api/inpaint` polling path)
- [x] **GPT Image 2 added to Img2Img model list** — `gpt-image-2-image-to-image` in EditImageAIPanel image-to-image mode. Supports 1:1 crop → generate → composite back (same crop flow as nano-banana-2). 6 credits fixed, up to 16 refs
- [x] **Removed nano-banana-pro from EditImageAIPanel** — Too expensive (18 credits at 1K vs nano-banana-2's 8). Kept in pricing config, kieAI.ts, Director, and VideoImageAIPanel
- [ ] **Future: Consider removing GPT 1.5 Image to Image** — GPT Image 2 is newer, better quality, cheaper (6 vs ~15 credits). Keep for now, evaluate later

### Session #20 — 2026-04-28 (R2 Delete Ownership Fix + Element Forge)

- [x] **R2 delete ownership check** — Any authenticated user could delete any other user's files. Fixed across 3 layers:
  - `delete-file/route.ts` — Looks up file by `r2Key` in Convex, verifies `companyId`/`uploadedBy` matches caller. Rejects orphaned R2 keys (no metadata → 404, admin cleanup only)
  - `delete-convex/route.ts` — Looks up file by `getById`, verifies ownership before calling `remove` mutation
  - `storyboardFiles.ts` `remove` + `deleteWithR2` mutations — Added identity-based ownership check for client-side calls (via `ctx.auth.getUserIdentity()`). Server-side calls (ConvexHttpClient) pass through since API routes already enforce ownership
- [x] **Legacy file fallback** — Files without `companyId` (optional field) fall back to `uploadedBy` for ownership verification
- [x] **Dual-identity check** — Compares against both `orgId` (company) and `userId` (individual) so org members can delete their org's files
- [x] **Element Forge wizard** — Structured character/environment/prop creation (inspired by Higgsfield Soul Cast):
  - `ElementForge.tsx` — 5-step wizard (Character: Identity → Physique → Personality → Details → Outfit), create/edit modes, badge bar, prompt preview, randomize
  - `elementForgeConfig.ts` — Step definitions, 200+ options across all types, `composePrompt()` per type, badge helpers, randomize
  - `ThumbnailCropper.tsx` — Drag crop modal for element thumbnails (256px square output)
  - Schema: `identity: v.optional(v.any())` added to `storyboard_elements`
  - Convex mutations: `create` + `update` accept `identity` field
  - ElementLibrary wired: Create/Edit buttons route to Forge for character/environment/prop types
  - Environment builder: 16 settings with 2-level sub-settings (Chinese Traditional → Imperial Palace/Mountain Temple/etc.)
  - Prop builder: 3-step wizard (Basics → Appearance → Details)

### Session #19 — 2026-04-28 (Cinema Studio Layout Overhaul)

- [x] **Cinema Studio layout redesign** — Inspired by Higgsfield Cinema Studio 3.5 layout patterns
- [x] **Left toolbar cleanup** — Removed 6 post-processing tools (Img2Img, Upscale, Enhance, Relight, BG Remove, Reframe). Now only canvas tools: Pointer, Move/Pan, Brush, Eraser, Mask, Crop, Clear
- [x] **Labeled bottom post-processing bar** — Horizontal tabs: Inpaint, Img2Img, Upscale, Enhance, Relight, BG Remove, Reframe. Color-coded active states. Replaces unlabeled sidebar icons
- [x] **Right Frame Info panel** — 260px collapsible panel showing: Prompt (from generated file), Cinema Studio metadata (camera, lens, focal, aperture, model, quality, aspect ratio, created), Frame Info (shot, perspective, movement, lighting, mood), Notes, Action buttons
- [x] **Cinema Studio metadata pipeline** — Saves camera/lens/focal/aperture/quality/model/prompt as structured metadata on every generation. Interface `CinemaStudioMetadata` + helper `buildCinemaStudioMetadata()`. Wired through all generation paths (image API + Seedance + Veo + Kling + Topaz + Grok + InfiniteTalk + Music + Cover Song)
- [x] **Right toolbar removed** — Floating icon toolbar (Move, Save, Download, Zoom, Delete, Combine) eliminated. Actions moved to info panel. Zoom moved to bottom-center canvas bar
- [x] **Bottom-center zoom controls** — Compact floating bar: Zoom In, %, Zoom Out, Fit. Always visible on canvas
- [x] **Prompt display fix** — Info panel shows generated file's prompt (not textarea), updates when switching between generated images
- [x] **usePricingData fallback** — Gracefully falls back to DEFAULT_PRICING_MODELS when Convex pricing query fails (was throwing error)
- [x] **Landing page updated** — Hero, features, FAQ, CTA updated with AI Director, Cinema Grade, multi-layer video editor, transitions, overlays, post-processing tools from comparison doc

### Session #18 — 2026-04-28

- [x] **generate-image auth fix** — ConvexHttpClient was unauthenticated, causing "Unauthenticated" errors on GPT Image 2 / all models. Added Clerk auth token passthrough to `triggerImageGeneration` and `triggerVideoGeneration`
- [x] **All 14 AI generation routes secured** — Added Clerk `auth()` guard to: generate-video, generate-seedance, generate-seedance2, generate-veo, generate-kling-motion, generate-topaz-video, generate-music, generate-persona, generate-tts, generate-gpt-image2, generate-grok, generate-script, ai-analyze, inpaint
- [x] **Email relay auth fixed** — Added Clerk auth to `/api/send-email`, `/api/send-system-email`, `/api/test-email`
- [x] **God View (filmstrip) toggle** — Added Film icon toggle in Frame Studio header (next to aspect ratio). Defaults to hidden. Controls StoryboardStrip visibility independently from Director chatbot
- [x] **Frame Studio naming** — Confirmed "Frame Studio" (was "Scene Editor")

### Video Editor — COMPLETE (Sessions #17-19, 2026-04-27/28)

**Status: SHIPPED. No further changes planned.**

**Architecture & Decomposition:**
- [x] **Decomposed 1,800-line VideoEditor** into 6 modular files: `types.ts`, `PreviewCanvas.tsx`, `ControlBar.tsx`, `TimelineTracks.tsx`, `LayerPanel.tsx`, `useExport.ts`
- [x] **Track naming** — Video track renamed to "Background" (reflects actual usage as base scene layer)

**Overlay Layer System (LayerPanel + PreviewCanvas):**
- [x] **8-point resize handles** + 2-point line/arrow handles + rotation handle on canvas
- [x] **Layer panel** with tools, lock/eye/type icons, properties, media picker with thumbnails
- [x] **Video overlay support** — blob URL fetch with presigned fallback, plays with sound
- [x] **Copy/paste layers** (Ctrl+C/V) — fixed to distinguish overlay layers vs timeline clips
- [x] **Double-click text editing** — inline edit text overlays directly on canvas
- [x] **Selected layer z-index** — clicking layer in panel brings it to front for interaction
- [x] **Scrolling text layer** ("Prompt Scroller") — textarea input, cubic ease-in-out scrolling, scroll up/down, configurable font/color/bg
- [x] **Transition layer system** — 5 types: crossfade, fade-to-color, slide-left, wipe, cross-dissolve. Inline rendering at actual layer positions (not full-screen). Works with any combo: image+image, video+video, image+video. Falls back to video track clips when no overlay layers match
- [x] **Arrow/line endpoint system** — x,y = start point, endX,endY = end point. Independent endpoint drag handles (teal=start, rose=end). Smaller arrow heads. Bounding box auto-computed. Matches CanvasEditor pattern
- [x] **Undo/redo** — Ctrl+Z / Ctrl+Shift+Z. Uses refs to avoid stale closures. Covers: add/delete/duplicate/paste layers, drag/resize/rotate position, timeline trim/drag. UI buttons in control bar. 50-entry history limit

**Preview Canvas:**
- [x] **Aspect-ratio locked preview** — canvas maintains correct ratio (16:9, 9:16, 1:1) with padding, `object-cover` for base media
- [x] **Aspect ratio selector** — per project, stored in Convex (removed 4:5)
- [x] **GPU hints** — `will-change` and `backfaceVisibility` on transitioning layers for smoother rendering

**Timeline:**
- [x] **Multi-row timeline layers** with draggable start/end edges
- [x] **Image clip duration draggable** — right edge extends/shrinks image duration freely (no copy/paste needed)
- [x] **NaN width fix** — `getVisDur` handles NaN, timeline clip widths fallback safely

**Audio Fixes:**
- [x] **Playback sound fix** — added `playingRef` to solve stale closure in `syncPreview` called from `tick`
- [x] **Auto-play on insert fix** — audio/video no longer plays when added to track (explicit `pause()` when not in play mode)
- [x] **Video overlay layer sound** — removed hardcoded `muted` attribute from overlay videos

**Export Improvements:**
- [x] **Base media fills canvas** — `drawImage(0,0,W,H)` stretch-to-fill, no more black bars
- [x] **Video-embedded audio in export** — decodes audio from video track clips + overlay video layers
- [x] **Overlay video audio fix** — shared `fetchBlob` with presigned URL fallback, cached blobs reused for audio extraction (no double fetch/CORS issues)
- [x] **Overlay video plays in export** — proper per-frame seeking with await, pre-seek to time 0, readyState guard
- [x] **Video clamp to last frame** — no looping, freezes on last frame when layer duration > video duration
- [x] **Last frame artifact fix** — `Math.round` instead of `Math.ceil` for total frame count
- [x] **Stale canvasSize/bgColor fix** — added to useCallback dependency array
- [x] **Frame encoding optimization** — sequential advancing instead of per-frame seeking, pre-seek to start positions, tighter tolerance
- [x] **Export download only** — removed auto-save to database/R2 on export

**Bug Fixes:**
- [x] **mediaBlobUrls infinite loop** — removed from useEffect deps, uses ref to check existing URLs
- [x] **Video sync modulo-by-zero** — guarded with `el.duration > 0` and clamped layerTime
- [x] **Audio modulo wrapping** — removed unnecessary modulo (already clamped by maxSamples)
- [x] **NaN/undefined input values** — `Math.round(sel.x) || 0` pattern for position inputs
- [x] **Controlled/uncontrolled input fix** — `?? 0` fallbacks for `startTime`/`endTime`
- [x] **Paste overlay vs clip confusion** — distinguishes `OverlayLayer` from `TimelineClip` by checking `startTime`/`endTime`/`src`

### Support Chatbot Overhaul (Session #16 — 2026-04-27)

- [x] **Fix credit spending query** — Added `by_companyId_createdAt` compound index, server-side date filtering via `sinceMs`, limit raised to 500. Was returning only 10 of 400+ transactions.
- [x] **Pre-computed credit summaries** — All totals (spent/refunded/net + per-category breakdown) computed server-side. AI reads numbers directly, never does arithmetic. Added `INSTRUCTION` field in tool results.
- [x] **Fix plan detection** — `getActiveSubscription` now reads `credits_balance.ownerPlan` (Clerk webhook source) instead of empty `org_subscriptions` table. Was always showing "Free plan".
- [x] **Model pricing table** — Replaced vague "4-15 credits" text with 28-model pricing table from `pricing.ts`. Z-Image correctly shows 1 credit (was guessed as 10).
- [x] **Anti-fabrication guardrails** — System prompt "never fabricate" rule, decision tree mapping 10 common questions to exact tool+field, language-matching rule, dynamic date injection.
- [x] **JSON leak filter** — Client-side regex strips DeepSeek tool-call artifacts (`json {...}`, `<|tool_sep|>`) from streamed text.
- [x] **Categorized FAQ balloons** — 5 tabs: FAQ, How to, Models, My Account (AI), Support (diagnosis tree). Account balloons send to AI via `sendMessage(override)`.
- [x] **Guided bug/refund diagnosis** — Support category walks users through troubleshooting before showing ticket link. Refund policy shown first.
- [x] **Remove AI ticket creation** — `create_support_ticket` removed from AI tools. Users directed to Support page via `#nav:support` links with `onNavigate` callback.
- [x] **Proactive follow-up suggestions** — Clickable chips after AI answers (7 keyword patterns: balance→spending, refund→fail, etc.)
- [x] **Thumbs up/down rating** — Every AI response gets rating buttons. Ready for DB persistence.
- [x] **In-app navigation links** — `#nav:support` URLs intercepted by click handler, navigates studio sidebar without page reload.
- [x] **Fix NB2 pricing in FAQ** — Was 2K:8/4K:12, corrected to 2K:10/4K:18.
- [x] **Fix contradictory escalation rules** — Removed "tell user ticket created" instruction that contradicted "never create tickets" rule.

### AI Analyze & R2 Video Fix (Session #15 — 2026-04-27)

- [x] **AI Analyze "image not valid" fix** — Added magic byte validation, SVG rejection, size limits (7MB image / 15MB video), user-friendly error messages
- [x] **Video analyze with .png extension** — Route now trusts user's media type selection instead of overriding based on URL extension. Corrects content-type to `video/mp4` for mismatched extensions
- [x] **R2 video saved as .png root cause** — Fixed `kie-callback` mime detection (no longer defaults to `image/png` for unknown blobs) and video R2 key now always uses `.mp4` extension (`generated-video-{timestamp}.mp4`)
- [x] **Audio analyze content-type fix** — Same pattern: overrides to `audio/mpeg` when extension doesn't match user selection

### AI Agent Mode (Session #14 — 2026-04-27)

- [x] **AI Agent Mode** — Full autonomous agent with 22 tools (12 Director + 10 Agent). Can generate images/video, post-process, use element references for character consistency, load prompt templates and presets, enhance prompts, browse project files.
- [x] **Chat persistence** — Loads existing session from Convex on panel open. Shows last 10 messages + "Load previous" button for older history.
- [x] **Director/Agent mode toggle** — UI toggle in chat header. Director = free creative advice. Agent = autonomous execution with plan approval.
- [x] **Plan approval flow** — Agent creates execution plan card with step list, credit costs, Approve/Cancel buttons. No credits spent without approval.
- [x] **Async task queue schema** — `agent_tasks` + `director_analytics` tables in Convex for future async resume and usage analytics.
- [x] **Reference image support** — `reference_element` passes element referenceUrls to generation for character consistency. `reference_frame` uses another frame as img2img reference.
- [x] **Agent pricing model decided** — Director free for Pro+. Agent $120/seat/month with 5,000 msg cap + 1 credit/msg overflow. 30 free agent msgs/month teaser for Pro/Business.

### Security Hardening & Audit (Sessions #11-13)

- [x] **Frame numbering bug** — Fixed grid, list, move controls, Director review to use sequential `index + 1`
- [x] **Hardcoded secrets removed** — n8n webhook secret, freeimage.host API key, imgbb key, ngrok fallback URL moved to env vars. Added to `env.example`
- [x] **user.deleted now lapses orgs** — Clerk webhook calls `propagateOwnerPlanChange("free")` on user deletion
- [x] **Dead `org_subscriptions` table removed from all queries** — Admin dashboards now read from `credits_balance.ownerPlan`
- [x] **Plan prices corrected** — Admin analytics updated from `pro: $29, business: $99` to `pro_personal: $45, business: $119, ultra: $299`
- [x] **Dead `initialSignupCredits` removed** — Never read, removed from schema and seed
- [x] **FrameFavoriteButton state drift fixed** — Uses prop directly with Convex reactivity
- [x] **Credit granting race condition** — Confirmed safe via Convex OCC. Added docs
- [x] **assign-role bypass closed** — Removed first-setup auto-promote. First super_admin set in Clerk Dashboard
- [x] **requireWebhookSecret hardened** — Now throws if `WEBHOOK_SECRET` not set
- [x] **subscription.paused handler** — Treats paused subscriptions like cancellation
- [x] **subscription.updated bug fixed** — No longer downgrades to "free" on billing info updates
- [x] **Clawback math verified** — Code already filters by `type === "usage"` at index level
- [x] **Marketing page img→NextImage** — 5 static images in storytica/page.tsx converted
- [x] **Admin route role checks** — `cleanup-stats`, `cleanup-temp-files`, `search-users` now require `super_admin`
- [x] **Convex admin mutations auth** — `createAdminUser`, `updateAdminRole`, `deactivateAdmin` now verify caller identity
- [x] **credits_ledger index** — Added `by_stripePaymentIntentId` index for refund lookups

### Code Quality (Session #13)

- [x] **console.log cleanup** — Removed 641+ calls from .tsx files, 562+ from API routes
- [x] **alert()/confirm() → toast** — Replaced 82 occurrences across admin pages
- [x] **Mock components removed** — Dead `AIGeneratorModal`, `ExportModal`, `AssetGenerator`, `projects/[id]` page cleaned up
- [x] **setInterval memory leaks fixed** — VideoImageAIPanel and EditImageAIPanel now use useEffect cleanup
- [x] **Admin page loading states** — Added skeleton/spinner loading for 6+ admin pages

### Session #10 (2026-04-26)

- [x] **Fix: Audio in video export** — MP4s now include audio track

### Session #9 (2026-04-26)

- [x] Flux model cleanup — removed 6 redundant models, ~500 lines deleted
- [x] Post-processing pipeline (Cinema Studio) — Enhance, Relight, Remove BG, Reframe/Extend
- [x] Style Transfer, Color Grade, Grid Generation

### Session #8 (2026-04-26)

- [x] AI Director Phase 1-4 (tools, UI, smart context, vision)
- [x] Chat migrated n8n -> Claude
- [x] 100 TypeScript errors fixed
- [x] Seedance 1.5 Pro pricing fix

### Previously Completed

- [x] All Priority 1 quick wins (15 items from comparison doc)
- [x] Admin cleanup (30+ pages consolidated to 16)
- [x] Director's View (11 features), Camera System (3 components)
- [x] AI Analyze, Batch Gen, Presets, Color Palette, Speed Ramps
- [x] FAQ system, PDF export, Pricing page, Landing page

---

## Studio Naming Convention (UPDATED 2026-04-28 Session #19)

**Storyboard Studio** is the top-level umbrella. One unified **Cinema Studio** for both image and video:

| Component | Purpose | UI Location |
|-----------|---------|-------------|
| **Cinema Studio** | Unified editor for image & video generation, post-processing, canvas editing | Full-screen editor (SceneEditor) |
| **Frame Studio** | Legacy name for the editor — renamed to Cinema Studio | — |

- Combined approach (not split like Higgsfield's Soul Cinema image vs Cinema Studio video)
- **Cinema Studio** = one workspace with IMAGE/VIDEO/AUDIO/ANALYZE tabs at bottom
- Label "Cinema Studio" shown in right info panel metadata
- Hierarchy: `Storyboard Studio > Cinema Studio`
- Inspired by Higgsfield Cinema Studio 3.5 layout patterns (labeled bottom toolbar, right metadata panel, clean canvas)

---

## Cinema Studio / Post-Processing — Status

| Tool | Status | Model | Credits |
|------|--------|-------|---------|
| Upscale (quality) | DONE (existed) | topaz/image-upscale | 12-15 cr |
| Upscale (cheap) | DONE (existed) | recraft/crisp-upscale | 1 cr |
| Enhance | DONE | GPT Image 2 img2img | 4 cr |
| Relight | DONE | GPT Image 2 img2img | 4 cr |
| Remove BG | DONE | recraft/remove-background | 1 cr |
| Reframe/Extend | DONE | ideogram/v3-reframe | 7 cr |
| Inpaint | DONE (existed) | 10+ models | varies |
| Style Transfer | DONE | AI Analyze + GPT img2img | 5 cr |
| Color Grade | DONE | ColorPalette + GPT img2img | 4 cr |
| Grid Generation | DONE | any image model | N x credits |

**Cinema Studio is COMPLETE. 10 post-processing tools vs Higgsfield's 5.**

---

## Priority 1 — Security (Remaining)

### API Route Auth — Still Needed

- [x] **Email relay auth fixed** — Added Clerk auth to `/api/send-email`, `/api/send-system-email`, `/api/test-email` (Session #18)
- [x] **All AI generation routes auth fixed** — Added Clerk auth to 14 routes: `generate-image` (+ Convex token passthrough), `generate-video`, `generate-seedance`, `generate-seedance2`, `generate-veo`, `generate-kling-motion`, `generate-topaz-video`, `generate-music`, `generate-persona`, `generate-tts`, `generate-gpt-image2`, `generate-grok`, `generate-script`, `ai-analyze`, `inpaint` (Session #18)
- [x] **KIE callback routes secured** — `WEBHOOK_SECRET` validation via header or query param on `/api/kie-callback` + `/api/storyboard/kie-callback`. Callback URLs auto-append secret. Pull-result route adds Clerk auth + passes secret internally (Session #30)
- [x] **n8n webhook subpath removed** — `handleN8nWebhook` and `n8nWebhookCallback.ts` deleted in Session #24 dead code cleanup. Route no longer exists
- [x] **R2 delete endpoint ownership verification** — Fixed: 3-layer ownership check (API routes + Convex mutations), orphan key rejection, legacy `uploadedBy` fallback (Session #20)
- [x] **File type/size validation on upload routes** — Shared `validateUpload()` helper (`lib/upload-validation.ts`): MIME allowlist (image/video/audio/PDF) + per-category size limits (image 20MB, video 200MB, audio 50MB, doc 10MB). Applied to 5 upload routes: `storyboard/upload`, `upload-binary`, `r2-upload`, `chat/upload`, `/upload` (Session #21)
- [x] **Auth added to unprotected routes** — Clerk auth added to `/upload`, `log-upload`, `grok-inpaint`, `crop` (Session #21)

---

## Priority 2 — UX & Polish (FOCUS SHIFT: features are 90/100, now make it FEEL good)

**Philosophy: Stop chasing score. Start chasing user experience.** The engine is built. Make it feel good to drive.

### Element Forge Character Builder — COMPLETE (Sessions #20-25)

**Status: SHIPPED.** Simple/Advanced mode, reference photos, multi-model generation, variant system.

- [x] Character/Environment/Prop structured wizards with carousels, sub-tabs, era slider (Sessions #20-23)
- [x] Simple mode (3 tabs) + Advanced mode (8 tabs) with localStorage persistence (Session #25)
- [x] Generate tab with model selector (GPT Image 2/Nano Banana 2/Z-Image), settings, credits (Session #25)
- [x] Reference photos: (Face+Outfit) OR Full Body via FileBrowser, img2img with overrides (Session #25)
- [x] Variant system: multiple named generations, star primary, rename, delete, preview (Session #25)
- [x] Live Convex-reactive variant gallery with processing/failed cards (Session #25)
- [x] Auto-save on Generate click, parallel 2x2 generation (Session #25)
- [x] VideoImageAIPanel uses primary variant as identity sheet (Session #25)
- [x] **Element Library redesign** — Matched Character Builder design system: underline tabs, hover-overlay cards, compact header, cleaned 96 console.logs (Session #26)
- [ ] **Unified create panel** — Remove side panel for non-forge types (Logos/Fonts/Styles/Other), make all types use ElementForge wizard or a shared lightweight wizard
- [ ] **@mention preview** — show what `@ElementName` will expand to in generation prompts
- [ ] **Smart defaults** — pick "Sci-fi" setting → auto-suggest Futuristic architecture, neon lighting

### Onboarding & First-Time Experience

- [ ] "What do you want to create?" entry point — Film / Commercial / Social Content / Music Video
- [ ] First-project guided wizard (create character → set style → generate first frame)
- [ ] Empty state illustrations with "Get Started" CTAs on blank panels
- [ ] Feature discovery tooltips (first time user opens Frame Studio, Cinema Studio, Agent Mode, etc.)
- [ ] Starter project templates (users can duplicate and customize)

### Flow Improvements (reduce clicks for common actions)

- [ ] "Animate this frame" one-click button on frame cards (currently: switch tab → set prompt → pick model → generate)
- [ ] Quick-action bar on generated images (Use as Frame / Animate / Enhance / Upscale — one click each)
- [ ] Drag-and-drop from generated images to timeline (currently manual add)
- [ ] Keyboard shortcuts overlay (? key to show)

### Visual Polish

- [ ] Smooth panel transitions/animations (currently instant show/hide)
- [ ] Better loading states for AI generation (progress ring with estimated time, not just spinner)
- [ ] Empty states for all panels (element library, generated images, timeline)
- [ ] Consistent hover/active states across all interactive elements

### Remaining Feature TODOs (lower priority than UX)

#### Ad Templates (Score 94 → 95)
- [ ] Ad template presets (Product Showcase, Before/After, Testimonial, Countdown)

#### AI Director + Agent — Phase 1: Core Complete (THIS SESSION)

Goal: Close the 3 gaps so the agent is solid enough to build the newbie flow on top of.

##### Gap 1 — System prompt stale since Session #14 (Genre/Format/pill bar/Element Forge unknown)

- [ ] Update `lib/director/system-prompt.ts` — add Genre (16 presets), Format (12 presets), pill bar (Camera/Angle/Motion/Speed/Palette), Element @mention pipeline, Element Forge (character identity sheets), post-processing tools reference

##### Gap 2 — 10 director tools missing — build the 2 highest-value ones now

| Tool | What it does | Priority |
| ---- | ------------ | -------- |
| `generate_scene` | One-liner → 4-6 frames with cinematic prompts. THE bridge to newbie flow. | Phase 1 |
| `suggest_shot_list` | Given a scene, suggests shot coverage (wide/medium/close/reaction) before prompting | Phase 1 |
| `check_continuity` | Spots character/prop/lighting inconsistencies between frames | Phase 3 |
| `batch_fix_frames` | Re-prompts all frames based on style feedback | Phase 3 |
| `analyze_emotional_arc` | Reviews pacing and emotional journey across scenes | Phase 3 |
| `audit_style_drift` | Flags frames drifting from project genre/style | Phase 3 |
| `apply_director_reference` | "Shoot this like Blade Runner 2049" — applies reference director style | Phase 3 |
| `check_coverage` | Confirms all story beats are represented in the frame list | Phase 3 |
| `create_shot_variations` | Generates 3 angle variations for the same moment | Phase 3 |
| `smart_animate` | Suggests best motion preset per frame type (action/dialogue/establishing) | Phase 3 |

- [ ] Add `generate_scene` + `suggest_shot_list` to `lib/director/agent-tools.ts`
- [ ] Implement both in `lib/director/tool-executor.ts`

##### Gap 3 — Never end-to-end tested

- [ ] End-to-end test: Agent Mode "build me a 6-frame story about a samurai at dawn"
- [ ] Tune system prompt from observed agent behavior

##### Also in Phase 1

- [ ] DeepSeek routing for Director mode (cost savings — see `plan_ai_director.md`)
- [ ] Test quick-action chip balloons (persistent strip above input, built Session #32)

---

#### AI Director + Agent — Phase 2: Newbie Quick Create (NEXT SESSION — after Phase 1 proven)

Goal: Zero-friction entry point. Type one sentence → storyboard done. Powered by Phase 1 agent.

```text
Type: "a knight fights a dragon at sunset over a burning city"
  ↓  (genre/format pickers, already built)
Agent: picks genre, format, 5 frames → writes cinematic prompts → generates all images
  ↓
"Your storyboard is ready" — 45 seconds
```

- [ ] Empty project magic wand UI — big textarea + genre/format pickers when 0 frames exist
- [ ] `POST /api/director/quick-create` endpoint — takes `{ premise, genre, format, sceneCount }`, runs agent silently (no chat UI)
- [ ] Uses `generate_scene` + `trigger_image_generation` under the hood
- [ ] Progress bar showing steps (creating frames → writing prompts → generating images)
- [ ] Redirect to finished storyboard on completion

Why Phase 1 must come first: The newbie has no way to fix a bad storyboard. If the agent produces weak prompts or fails silently, first impression = churn. A solid agent = magic. A shaky agent = confusing mess.

---

#### AI Director + Agent — Phase 3: Advanced Director Tools (AFTER Phase 2)

- [ ] `check_continuity` — Character/prop/lighting consistency checker across frames
- [ ] `batch_fix_frames` — Re-prompt all frames from a single style note
- [ ] `analyze_emotional_arc` — Pacing and emotional journey review
- [ ] `audit_style_drift` — Flag frames drifting from project genre/style
- [ ] `apply_director_reference` — Reference director style injection ("like Blade Runner 2049")
- [ ] `check_coverage` — Confirm all story beats are covered
- [ ] `create_shot_variations` — 3 angle variants for same moment
- [ ] `smart_animate` — Suggest motion preset per frame type

---

#### Storytica MCP Server — Phase 4 / DEFERRED (after agent is proven)

- See Priority 5 for full plan

#### Video Editor — COMPLETE (Session #19)
- [x] ~~Subtitle enhancements~~ — deferred, text overlays cover this use case
- [x] ~~Audio mixing~~ — deferred, basic volume mixing works in export

#### Script-to-Storyboard — Remaining

- [ ] **Test full pipeline** — See test plan below
- [ ] **Generate Script upgrade** — Current `generate-script/route.ts` creates scripts in old `SCENE N: Title` format. Upgrade to generate rich format with image/video prompts, model hints, act structure (like the Bloop script)
- [ ] **Batch Generate All with defaultImageModel** — "Generate All" button should auto-use each frame's `defaultImageModel` instead of a single global model picker

---

## Script Builder Test Plan (Session #27)

### Test 1: Script Tab UI

1. Open a project -> click Script tab
2. Verify: line numbers visible on left, divider line, monospace textarea
3. Type a script with `SCENE 1A`, `SCENE 1B`, `SCENE 2` — verify scene header line numbers turn blue
4. Verify: scene sidebar appears on the right with scene cards (ID badge, title, duration, location, characters)
5. Scroll the textarea — verify line numbers scroll in sync
6. Verify: floating AI prompt panel at the bottom with genre pills, duration pills, Generate button

### Test 2: Build Storyboard — Rebuild From Scratch

1. Write a script with 3-4 scenes, save it
2. Click "Build Storyboard" -> select "Rebuild From Scratch"
3. Verify: warning shows existing frame count
4. Click Build -> verify frames appear in real-time on Storyboard tab
5. Check: each frame has title, description, image prompt, video prompt, duration
6. Check: Elements panel shows extracted elements (characters, environments, props)
7. Verify: element count is 3-6 (not 9+ with parts like porthole/panel)

### Test 3: Build Storyboard — Update & Add

1. With existing frames from Test 2, go to Script tab
2. Add 2 new scenes (SCENE 5, SCENE 6) to the script, save
3. Click "Build Storyboard" -> select "Update & Add" (default)
4. Verify: existing frames stay (images/prompts preserved)
5. Verify: new scenes 5-6 are appended
6. Verify: existing elements are reused (status message says "N elements reused")
7. Edit an existing scene's description in the script, rebuild with Update & Add
8. Verify: that scene's prompts get updated

### Test 4: Element Extraction Quality

1. Use the Bloop submarine script (7 scenes)
2. Build storyboard
3. Check Elements panel — should have ~5 elements:
   - Lead Pilot (character)
   - Co-Pilot (character)
   - Deep-Sea Creature (character)
   - Research Submarine (prop)
   - Abyssal Ocean Environment (environment)
4. Should NOT have: Submarine Porthole, Instrument Panel, Cabin Interior, Deck Crew

### Test 5: Element @Mention in Prompt

1. Open a frame in Cinema Studio (double-click)
2. In the prompt textarea, type `@` — verify autocomplete dropdown appears
3. Dropdown shows project elements with thumbnails, names, types
4. Arrow keys navigate, Enter selects — verify orange badge inserted (e.g. `@LeadPilot`)
5. Type `@Le` — verify filtered to "Lead Pilot"
6. Press Escape — dropdown closes

### Test 6: Auto-Insert Element Badges on Prompt Load

1. Open a frame that has linkedElements (from build)
2. Click Actions -> Load Image Prompt
3. Verify: element badges auto-inserted at cursor for each linked element
4. Badges show thumbnail + `@ElementName` in orange

### Test 7: Element Reference Images at Generation Time

1. Open Element Forge for "Lead Pilot" -> generate a reference sheet
2. Wait for generation to complete (variant appears in gallery)
3. Go to a frame with Lead Pilot linked, open Cinema Studio
4. Load Image Prompt -> verify `@LeadPilot` badge appears
5. Click Generate
6. Check console logs: `@LeadPilot -> @Image{N}` conversion logged
7. Check console logs: `Auto-attached element ref: Lead Pilot -> ...` logged
8. Verify: generated image shows Lead Pilot consistent with reference sheet

### Test 8: Extend Story

1. With a project that has 5+ frames
2. Click "Extend Story" button on Storyboard tab
3. Optionally type a direction (e.g. "The creature retreats")
4. Pick 4 scenes, click Extend
5. Verify: 4 new frames appear appended after existing ones
6. Verify: new frames have titles, descriptions, prompts

### Test 9: Element Visibility Dropdown

1. Open Elements panel, find an element with "Private" badge
2. Click the badge — verify dropdown appears (Private / Public options)
3. Click outside — dropdown closes without changing visibility
4. Select "Public" — verify badge updates
5. Select "Private" — verify it switches back

### Test 10: FileBrowser from Element Forge

1. Open Element Forge for a character
2. Click a reference photo slot (Face/Outfit/Full Body)
3. Verify: FileBrowser opens defaulted to "Elements" filter
4. Upload a file — verify it saves to `elements` category (not `uploads`)
5. Select a file — verify it fills the reference photo slot
6. Hover the filled slot — verify browse (folder) and delete (trash) buttons appear
7. Click browse — verify FileBrowser opens to swap the image

### Test 11: ThumbnailCropper

1. Open Element Forge, click a generated variant to crop
2. Drag the crop frame around — verify image inside stays aligned with background
3. Drag to far left/right edges — verify no visual glitch
4. Resize via corner handle — verify crop region resizes correctly
5. Click Reset — verify crop returns to center
6. Click Save Thumbnail — verify thumbnail updates on element card

#### Auto-Sequence Video

- [ ] Chain frames via Seedance `first-last-frame` mode for continuity-chained video

### Shot Planner / Contact Sheet (LOW PRIORITY — Exploration tool)

- [ ] **"Shot Planner" mode** — User provides 1 subject/reference image → AI generates 3x3 grid of 9 cinematic angles in a single image (1 API call, 1 credit cost)
- [ ] Pre-built templates: "Cinematic 9-shot", "Product Showcase", "Character Turnaround", "Emotion Range"
- [ ] Each panel uses a different shot type (establishing, macro, heroic low angle, silhouette, etc.)
- [ ] Mega-prompt builder: merges 9 panel instructions + extracted subject/environment/style into one structured prompt
- [ ] Best with GPT Image 2 (only model reliable enough for structured grid layouts)
- [ ] Quality ~6-7/10 — positioned as ideation/mood board tool, not final output. User picks best angles → generates individually at full resolution
- [ ] Consider replacing current grid generation (1x1/2x2/3x3/4x4 which just fires N separate API calls at full price each)

### Billing Polish

- [ ] Wire credit top-up buttons to purchase confirmation dialog
- [ ] Model picker shows credit cost per model + resolution
- [ ] "Cheapest option" badge on budget models

---

## Priority 3 — Pricing & Billing

### AI Director + Agent Monetization (DECIDED 2026-04-27)

**Model: Director (free teaser) + Agent Seats ($120/seat/month)**

- **Director** = free for all Pro+ users. Creative advice, prompt writing, vision analysis. Cannot trigger generation.
- **Agent** = $120/seat/month. Everything Director does + triggers generation, post-processing, creates execution plans.
- **Brain = seat, Hands = credits.** Agent conversations covered by seat. Generation costs credits from org pool.
- **5,000 msgs/month cap** per seat. After cap: 1 credit/msg overflow (seamless, no hard lock).
- **30 free agent msgs/month** teaser for Pro/Business. Ultra includes 1 seat free.

| Plan | Director | Agent Teaser | Agent Seats |
|------|----------|-------------|-------------|
| Free | No | No | No |
| Pro ($45/mo) | Free | 30 msgs/month | Buy up to 1 ($120/mo) |
| Business ($119/mo) | Free | 30 msgs/month | Buy up to 3 ($120/mo each) |
| Ultra ($299/mo) | Free | — | 1 included + up to 5 ($120/mo each) |

**Implementation needed (deferred until agent is proven):**

- [ ] Agent seat table in Convex (`agent_seats`)
- [ ] Seat assignment UI in org owner dashboard
- [ ] Stripe add-on subscription for agent seats
- [ ] Access check in director/chat route (seat assigned? teaser remaining?)
- [ ] Teaser counter (30 msgs/month, resets monthly)
- [ ] Overflow billing after 5,000 msgs
- [ ] Upsell prompts in Director when it can't execute

---

## Priority 4 — Landing Page (Needs Assets)

- [ ] Record hero video loop (10-15s workflow demo)
- [ ] Record GIF/WebM for 6 feature cards (3-5s each)
- [ ] Record GIF/WebM for 3 "How It Works" cards
- [ ] Collect best AI-generated frames for Output Gallery
- [ ] Real testimonials from beta users

---

## Priority 5 — Paused / Deferred

### Storytica MCP Server — DEFERRED (build after embedded agent is proven)

**What it is:** An MCP server at `https://storytica.ai/mcp` that lets users access Storytica generation tools directly from Claude.ai, Claude Desktop, or Claude Code — without opening the app. Same positioning as Higgsfield MCP (`https://mcp.higgsfield.ai/mcp`).

**Why defer:** The embedded Director/Agent must be end-to-end tested first. MCP is a distribution play, not a new capability.

**Architecture:** Thin HTTP wrapper over existing tool-executor.ts logic. Auth via API key (user generates in dashboard → stored in `mcp_api_keys` Convex table).

```text
User adds https://storytica.ai/mcp in Claude settings
  → Claude calls GET /mcp  → returns tool list
  → Claude calls POST /mcp { tool, params }
  → MCP reads API key from Authorization header
  → Resolves to companyId, calls existing Convex mutations + Kie AI routes
  → Returns result to Claude
```

**Build checklist:**

- [ ] `mcp_api_keys` table in Convex — key, companyId, userId, label, createdAt, lastUsedAt
- [ ] API key generator in user dashboard settings (create / revoke)
- [ ] `app/api/mcp/route.ts` — MCP protocol handler (tools/list + tools/call JSON-RPC)
- [ ] Auth middleware — reads `Authorization: Bearer <key>`, resolves companyId
- [ ] `list_my_projects` tool — MCP has no URL context, user picks active project
- [ ] `set_active_project` tool — sets active project for the session
- [ ] Wire remaining tools through MCP: get_project_overview, get_scene_frames, update_frame_prompt, trigger_image_generation, trigger_video_generation, trigger_post_processing
- [ ] Test with Claude Desktop connector
- [ ] Test with Claude.ai custom connector
- [ ] Add to `env.example` and docs

**Estimated effort:** 3–4 days. All tool logic already exists in `lib/director/tool-executor.ts`.

**Competitive note:** Higgsfield launched MCP — no embedded agent inside their app. We will have both: embedded Director/Agent (better UX, full project context) + MCP (power users, Claude ecosystem).

---

### Booking System (plan_booking.md) — PAUSED

- [x] Phase 1: Claude agent with booking tools (done but untested)
- [ ] Phase 2: Merge `clients` into `contacts`
- [ ] Phase 3: Public self-booking page
- [ ] Phase 4: Google Calendar sync

### Lighting Preset Picker — Future

- [ ] Separate lighting preset picker (like Higgsfield Cinema Studio 3.5)
- [ ] Presets: Auto, Soft Cross, Contre Jour, Window, Overhead Fall, Silhouette, Practicals
- [ ] Independent axis from Genre (Genre = mood/color, Lighting = light setup)
- [ ] Appends lighting prompt to generation alongside Genre + Format
- [ ] Reference: Higgsfield also has Color Palette presets (Bleach Bypass, Teal Orange, Classic BW, etc.) — consider if needed

### Director View — Future

- [ ] AI script generation, AI element detection
- [ ] Auto-sequence pipeline, cross-frame consistency
- [ ] Batch multi-shot video

---

## Competitive Gap Summary (updated 2026-05-02 — LEADING Higgsfield 95 vs 88)

| Competitor Feature | Status |
|-------------------|--------|
| Soul Cast (Character Builder) | **SURPASSED** — Element Forge: Simple/Advanced modes, ref photos, multi-model, variant system, faster than Soul Cast |
| Soul Cinema quality | **CLOSED** — Cinema Grade (12 film stocks) + post-processing pipeline |
| Upscale/Enhance/Relight/Inpaint/Angles | **CLOSED** — 10 tools vs their 5 |
| Color Grading presets | **CLOSED** — 12 film stock presets + 11 color grade presets |
| Grid Generation | **CLOSED** — 1x1 to 4x4 |
| AI Co-Director | **CLOSED** — 4 phases + Agent Mode (22 tools) |
| Physics-aware generation | **CLOSED** — GPT Image 2 handles physics natively |
| Cinematic reasoning | **CLOSED** — AI Director vision + GPT Image 2 contextual understanding |
| Style Transfer / BG Removal | **CLOSED** — Cinema Studio post-processing pipeline |
| Video Editor depth (overlays/transitions) | **CLOSED** — Multi-layer overlays, 5 transition types, scrolling text, undo/redo, arrow/line endpoints, aspect-ratio lock, overlay video export (Sessions #17-19) |
| Production continuity (script-to-image sync) | **UNIQUE TO US** — Visual Lock (Session #32) — no competitor has this |
| Element @mention pipeline (auto-substitution) | **DEEPER THAN LTX** — drag-and-drop reorder + @ElementName→@Image{n} at generate time |
| Native audio sync | **OPEN** — model-level proprietary, 1 remaining Higgsfield gap |
| 80+ Higgsfield apps | **CAN'T MATCH** — breadth play, not our strategy |
| Marketing Studio (URL→ad) | **PLANNED** — TikTok/Social Ads Builder (in-editor, better UX). Infrastructure now exists |
| Higgsfield social network | **SKIP** — not relevant to B2B/agency target |

### Honest scorecard (post Session #32 Visual Lock + Element Pipeline + Deletion Cleanup)

| Platform | Score |
|----------|:-----:|
| **Us (Storytica)** | **95** |
| Higgsfield 3.5 | **88** |
| LTX Studio | 72 |
| Zopia AI | 70 |

**Session #32 pushes us to 95.** Visual Lock is unique to us — script-to-image continuity sync via vision analysis and segment-based rewrite. Combined with the full @mention pipeline (inline injection, drag-and-drop reorder, @ElementName→@Image{n} substitution at generate time), we now offer production-grade continuity that no competitor has. Plus a robust deletion architecture (defaultAI rule for soft vs hard delete + daily orphan repair cron) keeps the audit trail clean. Only remaining Higgsfield advantages: proprietary Soul 2.0 face-lock model + native audio sync (both model-architecture features, not API-replicable).

---

## Testing (plan_testing.md)

~114 manual test cases exist but are unexecuted:

- [ ] Style auto-append (17), format presets (6), AI analyzer (24)
- [ ] Presets system (26), batch gen (14), color palette (5)
- [ ] AddImageMenu (5), prompt assembly (5), integration (12)
- [ ] Post-processing tools (NEW — need test cases)
- [ ] AI Agent tools (NEW — need test cases)
