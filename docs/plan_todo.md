# Project TODO — Consolidated

> **Last updated:** 2026-04-26 (Session #10)

---

## Recently Completed (Session #10 — 2026-04-26)

- [x] **Fix: Audio in video export** — MP4s now include audio track (AAC via WebCodecs AudioEncoder + mp4-muxer). Audio clips decoded via Web Audio API, mixed into stereo buffer at timeline positions, encoded as AAC 128kbps and muxed into MP4.

### Session #9 (2026-04-26)

- [x] Flux model cleanup — removed 6 redundant models, ~500 lines deleted
- [x] Post-processing pipeline (Cinema Studio) — Enhance, Relight, Remove BG, Reframe/Extend
- [x] Style Transfer, Color Grade, Grid Generation
- [x] Plan doc — plan_post_processing.md

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

## Priority 1 — Tomorrow / Next Session

### AI Director — Polish
- [ ] Tune system prompt based on real usage
- [ ] Test director tools end-to-end with real project

### Video Editor (plan_videoEditor.md)
- [x] ~~Fix: Audio in video export~~ — **DONE** (Session #10)
- [ ] Subtitle enhancements (outline/shadow, multi-line, font selector)
- [ ] Audio mixing (volume per clip, fade in/out)
- [ ] Resolution/framerate selector

### TypeScript Errors
- [x] All resolved (Session #8) — `npx tsc --noEmit` passes clean, `ignoreBuildErrors` removed from next.config.ts

### Auto-Sequence Video (from comparison doc)
- [ ] Chain frames via Seedance `first-last-frame` mode for continuity-chained video
- [ ] Snapshot-to-next is 80% of this — just need the automation

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
- [ ] Real testimonials from beta users

---

## Priority 4 — Paused / Deferred

### Booking System (plan_booking.md) — PAUSED
- [x] Phase 1: Claude agent with booking tools (done but untested)
- [ ] Phase 2: Merge `clients` into `contacts`
- [ ] Phase 3: Public self-booking page
- [ ] Phase 4: Google Calendar sync

### Director View — Future
- [ ] AI script generation, AI element detection
- [ ] Auto-sequence pipeline, cross-frame consistency
- [ ] Batch multi-shot video

### Video Editor — Low Priority
- [ ] Multi-layer video (overlay, PiP, transitions)

---

## Competitive Gap Summary (updated 2026-04-26)

| Competitor Feature | Status |
|-------------------|--------|
| Soul Cinema quality | **CLOSED** — post-processing pipeline |
| Upscale/Enhance/Relight/Inpaint/Angles | **CLOSED** — 10 tools vs their 5 |
| Color Grading presets | **CLOSED** — 11 presets |
| Grid Generation | **CLOSED** — 1x1 to 4x4 |
| AI Co-Director | **CLOSED** — 4 phases done |
| Remaining Higgsfield gaps | 4 model-level proprietary (Soul Cinema model, native audio sync, physics-aware gen, cinematic reasoning) — can't replicate |

**All buildable gaps are now CLOSED. Only model-level proprietary features remain.**

---

## Testing (plan_testing.md)

~114 manual test cases exist but are unexecuted:
- [ ] Style auto-append (17), format presets (6), AI analyzer (24)
- [ ] Presets system (26), batch gen (14), color palette (5)
- [ ] AddImageMenu (5), prompt assembly (5), integration (12)
- [ ] Post-processing tools (NEW — need test cases)
