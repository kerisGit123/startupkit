# Project TODO — Consolidated

> **Last updated:** 2026-04-28 (Session #21 — EditImageAIPanel post-processing → storyboard_files + GPT Image 2 Img2Img)

---

## Recently Completed (Session #11-21 — 2026-04-26/28)

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
- [ ] **KIE callback routes lack signature verification** — public, no HMAC check
- [ ] **n8n webhook subpath no auth** — `handleN8nWebhook` path has no secret check
- [x] **R2 delete endpoint ownership verification** — Fixed: 3-layer ownership check (API routes + Convex mutations), orphan key rejection, legacy `uploadedBy` fallback (Session #20)
- [x] **File type/size validation on upload routes** — Shared `validateUpload()` helper (`lib/upload-validation.ts`): MIME allowlist (image/video/audio/PDF) + per-category size limits (image 20MB, video 200MB, audio 50MB, doc 10MB). Applied to 5 upload routes: `storyboard/upload`, `upload-binary`, `r2-upload`, `chat/upload`, `/upload` (Session #21)
- [x] **Auth added to unprotected routes** — Clerk auth added to `/upload`, `log-upload`, `grok-inpaint`, `crop` (Session #21)

---

## Priority 2 — UX & Polish (FOCUS SHIFT: features are 90/100, now make it FEEL good)

**Philosophy: Stop chasing score. Start chasing user experience.** The engine is built. Make it feel good to drive.

### Element Builder Upgrade — Soul Cast-style (HIGH PRIORITY — UX)

**Why:** Current element creation is a blank text field. Users type free-text descriptions and manually upload references. Higgsfield's Soul Cast gives structured dropdowns — easier, faster, more consistent results. This doesn't increase score but dramatically improves the creative experience.

**Current state:** `CreateElement.tsx` — name field, type dropdown (7 types), that's it. No structured fields, no guided creation, no auto-generation.

**Upgrade plan — structured element builders per type:**

**Build order:** Character first (most used, 4-angle sheet is unique) → Environment → Prop

#### Character Builder

| Field | UI | Maps to prompt |
|-------|-----|---------------|
| Gender | Dropdown: Male, Female, Non-binary, Other | "a [gender]" |
| Age range | Dropdown: Child, Teen, Young Adult, Adult, Middle-aged, Elderly | "[age] year old" |
| Ethnicity/Skin tone | Dropdown or color picker | "[ethnicity]" |
| Build | Dropdown: Slim, Athletic, Average, Muscular, Heavy | "[build] build" |
| Hair | Color picker + style dropdown (Short, Long, Curly, Straight, Bald, Braids) | "[color] [style] hair" |
| Clothing | Text field + style hint dropdown (Casual, Formal, Streetwear, Fantasy, Sci-fi, Historical) | "wearing [clothing]" |
| Expression | Dropdown: Neutral, Happy, Serious, Angry, Sad, Confident | "[expression] expression" |
| Distinguishing features | Text field (optional) | "[features]" |

- [x] Character builder with structured fields → auto-compose prompt description (Session #20 — ElementForge.tsx)
- [ ] "Generate Reference Sheet" button — 1 click → generates 4 angles (front/side/back/3-quarter) using composed prompt, saves as referenceUrls. **Unique feature — nobody has this, not even Higgsfield's Soul Cast (generates 1 image only)**
- [x] Live prompt preview showing what will be sent to AI (Session #20)

#### Environment/Location Builder

| Field | UI | Maps to prompt |
|-------|-----|---------------|
| Setting type | Dropdown: Interior, Exterior, Urban, Rural, Fantasy, Sci-fi, Underwater, Space | "[setting]" |
| Time of day | Dropdown: Dawn, Morning, Noon, Afternoon, Golden Hour, Sunset, Dusk, Night, Midnight | "[time] lighting" |
| Weather/Atmosphere | Dropdown: Clear, Cloudy, Rainy, Foggy, Snowy, Stormy, Dusty, Misty | "[weather]" |
| Architecture style | Dropdown: Modern, Victorian, Brutalist, Japanese, Gothic, Futuristic, Rustic, Industrial | "[style] architecture" |
| Key features | Text field (e.g., "large windows, wooden floor, fireplace") | "with [features]" |
| Mood | Dropdown: Cozy, Eerie, Grand, Intimate, Vast, Claustrophobic, Serene, Chaotic | "[mood] atmosphere" |

- [x] Environment builder with structured fields → auto-compose prompt (Session #20 — 16 settings with 2-level sub-settings)
- [ ] "Generate Reference" button — 1 click → generates environment image
- [ ] Time-of-day slider with visual preview (dawn→night gradient)

#### Prop Builder

| Field | UI | Maps to prompt |
|-------|-----|---------------|
| Category | Dropdown: Vehicle, Weapon, Tool, Furniture, Food, Technology, Clothing, Natural, Misc | "[category]" |
| Material | Dropdown: Metal, Wood, Plastic, Glass, Leather, Stone, Fabric, Crystal | "[material]" |
| Era/Style | Dropdown: Modern, Vintage, Futuristic, Medieval, Steampunk, Minimalist | "[era]" |
| Size | Dropdown: Tiny, Small, Medium, Large, Massive | "[size]" |
| Condition | Dropdown: New, Worn, Damaged, Ancient, Pristine, Weathered | "[condition]" |
| Details | Text field | "[details]" |

- [x] Prop builder with structured fields → auto-compose prompt (Session #20 — 3-step wizard)
- [ ] "Generate Reference" button — 1 click → generates prop reference image

#### Shared Features (all element types)

- [x] **Auto-compose prompt** — structured fields → readable prompt description (live preview) (Session #20)
- [ ] **One-click reference generation** — "Generate" button creates reference image(s) from composed prompt
- [ ] **Character: 4-angle reference sheet** — front/side/back/3-quarter in one generation (unique feature — beats Higgsfield's Soul Cast which only generates 1 image)
- [ ] **@mention preview** — show what `@ElementName` will expand to in generation prompts
- [ ] **Smart defaults** — pick "Sci-fi" setting → auto-suggest Futuristic architecture, neon lighting
- [x] **Still allow free-text** — advanced users can type directly, structured fields are optional helpers (Session #20 — custom text fields + old CreateElement still works for logo/font/style/other)

#### Why this beats Higgsfield's Soul Cast

| | Higgsfield Soul Cast | Our Element Builder |
|---|---|---|
| Character fields | Genre, era, physique, personality, 14 genre templates | Gender, age, ethnicity, build, hair, clothing, expression, features |
| Environment builder | No | **YES** — setting, time-of-day, weather, architecture, mood |
| Prop builder | No | **YES** — category, material, era, size, condition |
| Reference generation | 1 image | **4-angle sheet** (front/side/back/3-quarter) — 4x more reference data |
| Prompt preview | No | Live preview of composed prompt |
| Free-text fallback | No | Advanced users can type directly |
| @mention expansion | No | Shows what @mention will add to generation prompts |

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

#### Ad Templates (Score 90 → 91)
- [ ] Ad template presets (Product Showcase, Before/After, Testimonial, Countdown)

#### AI Agent — Test & Polish
- [ ] End-to-end test: Agent Mode "build me a 6-frame story"
- [ ] Tune system prompt based on real agent behavior

#### Video Editor — COMPLETE (Session #19)
- [x] ~~Subtitle enhancements~~ — deferred, text overlays cover this use case
- [x] ~~Audio mixing~~ — deferred, basic volume mixing works in export

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

### Booking System (plan_booking.md) — PAUSED

- [x] Phase 1: Claude agent with booking tools (done but untested)
- [ ] Phase 2: Merge `clients` into `contacts`
- [ ] Phase 3: Public self-booking page
- [ ] Phase 4: Google Calendar sync

### Director View — Future

- [ ] AI script generation, AI element detection
- [ ] Auto-sequence pipeline, cross-frame consistency
- [ ] Batch multi-shot video

---

## Competitive Gap Summary (updated 2026-04-28 — LEADING Higgsfield 90 vs 88)

| Competitor Feature | Status |
|-------------------|--------|
| Soul Cinema quality | **CLOSED** — Cinema Grade (12 film stocks) + post-processing pipeline |
| Upscale/Enhance/Relight/Inpaint/Angles | **CLOSED** — 10 tools vs their 5 |
| Color Grading presets | **CLOSED** — 12 film stock presets + 11 color grade presets |
| Grid Generation | **CLOSED** — 1x1 to 4x4 |
| AI Co-Director | **CLOSED** — 4 phases + Agent Mode (22 tools) |
| Physics-aware generation | **CLOSED** — GPT Image 2 handles physics natively |
| Cinematic reasoning | **CLOSED** — AI Director vision + GPT Image 2 contextual understanding |
| Style Transfer / BG Removal | **CLOSED** — Cinema Studio post-processing pipeline |
| Video Editor depth (overlays/transitions) | **CLOSED** — Multi-layer overlays, 5 transition types, scrolling text, undo/redo, arrow/line endpoints, aspect-ratio lock, overlay video export (Sessions #17-19) |
| Native audio sync | **OPEN** — model-level proprietary, 1 remaining Higgsfield gap |
| 80+ Higgsfield apps | **CAN'T MATCH** — breadth play, not our strategy |
| Marketing Studio (URL→ad) | **PLANNED** — TikTok/Social Ads Builder (in-editor, better UX). Infrastructure now exists |
| Higgsfield social network | **SKIP** — not relevant to B2B/agency target |

### Honest scorecard (post Session #19 Video Editor complete + Ads reassessment)

| Platform | Score | After Ad Templates |
|----------|:-----:|:-----------------:|
| **Us (Storytica)** | **90** | **91-92** |
| Higgsfield 3.5 | **88** | 88 |
| LTX Studio | 72 | 72 |
| Zopia AI | 70 | 70 |

**We now lead Higgsfield 90 vs 88.** Video editor already functions as ads builder (text overlays+BG=CTA, image overlays=logos, aspect ratios=formats, transitions+music=polish). Ad templates (preset layer arrangements) push to 91-92.

---

## Testing (plan_testing.md)

~114 manual test cases exist but are unexecuted:

- [ ] Style auto-append (17), format presets (6), AI analyzer (24)
- [ ] Presets system (26), batch gen (14), color palette (5)
- [ ] AddImageMenu (5), prompt assembly (5), integration (12)
- [ ] Post-processing tools (NEW — need test cases)
- [ ] AI Agent tools (NEW — need test cases)
