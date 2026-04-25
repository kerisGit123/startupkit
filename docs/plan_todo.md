# Project TODO — Consolidated

> **Last updated:** 2026-04-26

---

## Recently Completed (this session)

- [x] **Seedance 1.5 Pro pricing fix** — formula format mismatch in usePricingData, NaN guard on displayedCredits
- [x] **100 TypeScript errors fixed** — down to 0 in new code (pre-existing errors remain in PricingShowcase, SceneEditor, fraud-check, etc.)
- [x] **Chat migrated n8n -> Claude** — `/api/chat` now uses Claude Haiku 4.5 with booking tools, n8n fully removed
- [x] **Booking plan written + paused** — focus on core product instead
- [x] **AI Director Phase 1** — 11 tools, executor, filmmaking system prompt, SSE streaming API, Convex session storage
- [x] **AI Director Phase 2** — DirectorChatPanel UI in workspace + SceneEditor, toggle buttons, SSE streaming, tool indicators
- [x] **AI Director auth fix** — Clerk JWT token passed to ConvexHttpClient via `auth().getToken({ template: "convex" })`

### Previously Completed

- [x] Admin cleanup (30+ pages consolidated to 16)
- [x] TypeScript errors (129 errors fixed in prior session)
- [x] Removed `ignoreBuildErrors: true` from next.config.ts

---

## Priority 1 — Core Product (Code)

### AI Director — Remaining Phases (plan_ai_director.md)
- [x] Phase 1: Core agent (tools, executor, system prompt, API, Convex)
- [x] Phase 2: Studio UI (DirectorChatPanel, workspace + SceneEditor toggle)
- [ ] Phase 3: Smart context — auto-detect selected frame, "Review this frame" quick action per frame card
- [ ] Phase 4: Vision integration — send generated images to Claude for visual QA feedback
- [ ] Tune system prompt based on real usage

### Pre-existing TypeScript Errors (~80+ remaining)
- [ ] PricingShowcase.tsx (~20 errors — undefined vars like `pendingTopUp`, `agreedToTerms`)
- [ ] SceneEditor.tsx (~11 errors — string vs Id type casts)
- [ ] app/storyboard-studio/page.tsx (~30 errors — stale Shot interface fields)
- [ ] fraud-check, invoice, booking components, kieAI.ts, fileMetadataUtils.ts
- [ ] These are all pre-existing, not from this session

### Video Editor Enhancements (plan_videoEditor.md)
- [ ] **Fix: Audio in video export** (critical — MP4s currently have no sound)
- [ ] Subtitle enhancements (outline/shadow, multi-line, font selector, SRT import)
- [ ] Audio mixing (volume per clip, fade in/out, waveform)
- [ ] Resolution/framerate selector (currently fixed 1920x1080 @ 30fps)
- [ ] Timeline UX (snap to grid, zoom to fit, keyboard shortcuts)

### Post-Processing Tools (plan_post_processing.md)
- [ ] Upscale 2x/4x with model choice (Topaz + Crisp) — code exists, needs UI
- [ ] Enhance with 5 presets
- [ ] Relight with 10 lighting presets
- [ ] Background remove (`recraft/remove-background` — API ready)
- [ ] Extend / outpaint (Ideogram V3 Reframe)
- [ ] Style transfer, color grade

---

## Priority 2 — Pricing & Billing

- [ ] Wire credit top-up buttons to purchase confirmation dialog
- [ ] Model picker shows credit cost per model + resolution
- [ ] "Cheapest option" badge on budget models
- [ ] Credit slider for Business plan

---

## Priority 3 — Landing Page (Needs Assets)

- [ ] Record hero video loop (10-15s workflow demo)
- [ ] Record GIF/WebM for 6 feature cards (3-5s each)
- [ ] Record GIF/WebM for 3 "How It Works" cards
- [ ] Collect best AI-generated frames for Output Gallery
- [ ] Add Output Gallery section
- [ ] Real testimonials from beta users
- [ ] Interactive "try a prompt" demo (long-term)

---

## Priority 4 — Paused / Deferred

### Booking System (plan_booking.md) — PAUSED
- [x] Phase 1: Claude agent with booking tools (done but untested)
- [ ] Phase 2: Merge `clients` into `contacts`, remove dead code
- [ ] Phase 3: Public self-booking page
- [ ] Phase 4: Google Calendar sync
- [ ] Phase 5: Email notifications

### Director View — Future
- [ ] AI script generation, AI element detection
- [ ] Auto-sequence pipeline, cross-frame consistency
- [ ] Batch multi-shot video

### Video Editor — Low Priority
- [ ] Multi-layer video (overlay, PiP, transitions) — overkill for storyboard tool

---

## Testing (plan_testing.md)

~114 manual test cases exist but are unexecuted:
- [ ] Style auto-append (17), format presets (6), AI analyzer (24)
- [ ] Presets system (26), batch gen (14), color palette (5)
- [ ] AddImageMenu (5), prompt assembly (5), integration (12)
