# Project TODO — Consolidated

> **Last updated:** 2026-04-25

---

## Priority 1 — Core Product (Code)

### TypeScript Errors (plan_typescript_error.md)
- [ ] Phase 1: Quick wins — ~20 errors across 11 files (OrganizationSwitcher, API routes, convex migrations)
- [ ] Phase 2: Convex backend — ~24 errors (inbox, bookingTools, n8nWebhookCallback)
- [ ] Phase 3: API routes — ~38 errors (n8n-webhook, n8n-image-proxy, kie-callback, upload)
- [ ] Phase 4: UI components — ~16 errors (CalendarView)
- [ ] Remove `ignoreBuildErrors: true` from next.config.ts after all phases

### Post-Processing Tools (plan_post_processing.md)
- [ ] Upscale 2x/4x with model choice (Topaz + Crisp) — code in kieAI.ts, needs UI
- [ ] Enhance with 5 presets and model choice
- [ ] Relight with 10 lighting presets and strength control
- [ ] Post-gen angle change (prompt-based)
- [ ] Background remove (Kie AI `recraft/remove-background`)
- [ ] Extend / outpaint (Ideogram V3 Reframe)
- [ ] Style transfer, color grade, multi-model choice per tool

### AI Director (plan_ai_director.md)
- [ ] Phase 1: Core agent — tools, executor, system prompt, API route, Convex chat
- [ ] Phase 2: Studio UI — DirectorChatPanel, workspace toggle
- [ ] Phase 3: Smart context — frame-aware suggestions, "Review this frame" action
- [ ] Phase 4: Vision integration — Claude vision for visual QA (future)

> Note: `components/director/` and backend files exist — some Phase 1/2 work may be started. Verify before building.

### Video Editor Enhancements (plan_videoEditor.md)
- [ ] P1: Subtitle enhancements (outline, wrapping, font selector, SRT import, auto-subtitles from TTS)
- [ ] P2: Audio mixing (volume per clip, fade in/out, waveform visualization)
- [ ] P3: Multi-layer video (overlay, PiP, transitions)
- [ ] P4: Timeline UX (snap to grid, clip thumbnails, keyboard shortcuts, zoom to fit)
- [ ] Fix: Audio in video export (currently video-only MP4), resolution selector, framerate options

---

## Priority 2 — Pricing & Billing (Code)

### Pricing (plan_pricing_strategy.md + plan_pricing_design.md)
- [ ] Wire credit top-up buttons in PricingShowcase to purchase confirmation dialog
- [ ] Model picker in generation UI shows credit cost per model + resolution
- [ ] "Cheapest option" badge on GPT Image 2 1K
- [ ] Add credit slider for Business plan
- [ ] Buy $1,250 Kie package when volume justifies

### Admin Cleanup (plan_admin_cleanup.md)
- [ ] Phase 6 (deferred): Dual-write to `financial_ledger`, migrate reads, deprecate legacy transactions table

---

## Priority 3 — Landing Page (Needs Assets)

### Screen Recordings (plan_landing_page.md)
- [ ] Record hero video loop (10-15s workflow demo) — WebM/MP4 autoplay
- [ ] Record GIF/WebM for 6 feature cards (3-5s each)
- [ ] Record GIF/WebM for 3 "How It Works" cards
- [ ] Collect best AI-generated frames for Output Gallery

### New Sections
- [ ] Add Output Gallery section (blocked on assets above)

### Long-term
- [ ] Real testimonials from beta users
- [ ] Company/studio logos
- [ ] Interactive "try a prompt" demo
- [ ] Case studies section

---

## Priority 4 — Deferred / Paused

### Booking System (plan_booking.md) — PAUSED
- [ ] Phase 2: Merge `clients` into `contacts`, remove dead booking code
- [ ] Phase 3: Public self-booking page (`/book/[slug]`)
- [ ] Phase 4: Google Calendar sync (schema ready, needs OAuth)
- [ ] Phase 5: Email notifications for booking events

### Director View — Future Phases (plan_director_view.md)
- [ ] Phase 4: AI script generation, AI element detection, batch frame generation, style metadata flow
- [ ] Phase 5: Auto-sequence pipeline, cross-frame consistency, batch multi-shot video

---

## Testing (plan_testing.md)

Full manual test suite exists but is unexecuted (~114 test cases):
- [ ] Style auto-append (17 cases)
- [ ] Format presets (6 cases)
- [ ] AI analyzer (24 cases)
- [ ] Presets system (26 cases)
- [ ] Batch frame generation (14 cases)
- [ ] Color palette (5 cases)
- [ ] AddImageMenu mediaType (5 cases)
- [ ] Prompt assembly order (5 cases)
- [ ] Integration tests (12 cases)
