# Project TODO — Consolidated

> **Last updated:** 2026-04-27 (Session #16)

---

## Recently Completed (Session #11-16 — 2026-04-26/27)

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

## Studio Naming Convention (DECIDED 2026-04-27)

**Storyboard Studio** is the top-level umbrella. Two sub-studios:

| Sub-Studio | Purpose | Controls |
|------------|---------|----------|
| **Frame Studio** | Image/frame generation & composition | Lighting, style, composition, single frames |
| **Cinema Studio** | Video generation & post-processing | Motion, camera movement, video output, post-processing pipeline |

- Inspired by Higgsfield's Soul Cinema (image) vs Cinema Studio (video) split
- **Frame Studio** = crafting the visual look per frame
- **Cinema Studio** = bringing frames to life as video + post-processing tools
- Hierarchy: `Storyboard Studio > Frame Studio | Cinema Studio`

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

- [ ] **Open email relays** — `/api/send-email`, `/api/send-system-email`, `/api/test-email` have zero auth
- [ ] **Unprotected AI generation routes** — `generate-image`, `generate-video`, `generate-script`, `generate-tts`, `ai-analyze`, `inpaint` have no auth
- [ ] **KIE callback routes lack signature verification** — public, no HMAC check
- [ ] **n8n webhook subpath no auth** — `handleN8nWebhook` path has no secret check
- [ ] **R2 delete endpoint ownership verification** — any authenticated user can delete any R2 object
- [ ] **File type/size validation on upload routes**

---

## Priority 2 — Features / Polish

### TikTok/Social Ads Builder (NEW — highest ROI, overtakes Higgsfield 3.5)

**Score impact: 86 → 89, overtakes Higgsfield's 88. Cheapest path to #1.**

Leverages existing infrastructure — mostly templates + presets on top of existing tools.

| Feature | Effort | Existing infrastructure |
|---------|--------|----------------------|
| Social format presets (9:16 TikTok, 1:1 IG, 16:9 YT) | Small | Aspect ratio system exists |
| Text overlay with CTA templates ("Shop Now", "Learn More", "Swipe Up") | Medium | Subtitle track exists, extend with styled text |
| Logo/watermark placement (upload, pin to corner) | Small | Canvas overlay system exists |
| Music bed from AI library | Small | Music AI + timeline audio exists |
| Ad templates (Product Showcase, Before/After, Testimonial, Countdown, UGC-style) | Medium | Preset system exists |
| Platform-specific export ("Export as TikTok Ad 9:16 15s") | Small | WebCodecs export exists |

- [ ] Social format presets (9:16, 1:1, 16:9) in video editor
- [ ] CTA text overlay templates (styled text on subtitle track)
- [ ] Logo/watermark upload + corner placement
- [ ] Ad template presets (Product Showcase, Before/After, Testimonial, Countdown, UGC-style)
- [ ] Platform-specific export with format/duration constraints
- [ ] "Create Ad" quick-start flow from storyboard

### AI Agent — Test & Polish

- [ ] End-to-end test: run dev server, use Agent Mode, "build me a 6-frame story"
- [ ] Tune system prompt based on real agent behavior
- [ ] Test reference image generation (element referenceUrls for character consistency)
- [ ] Test post-processing pipeline through agent (enhance, relight)
- [ ] Test prompt templates and presets loading through agent

### Video Editor (plan_videoEditor.md)

- [x] ~~Fix: Audio in video export~~ — **DONE** (Session #10)
- [ ] Subtitle enhancements (outline/shadow, multi-line, font selector)
- [ ] Audio mixing (volume per clip, fade in/out)
- [ ] Resolution/framerate selector

### Auto-Sequence Video (from comparison doc)

- [ ] Chain frames via Seedance `first-last-frame` mode for continuity-chained video
- [ ] Snapshot-to-next is 80% of this — just need the automation

### Billing Polish

- [ ] Wire credit top-up buttons to purchase confirmation dialog
- [ ] Model picker shows credit cost per model + resolution
- [ ] "Cheapest option" badge on budget models
- [ ] Personal workspace lapsed banner (billing policy says show, `useSubscription` skips personal)

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

### Video Editor — Low Priority

- [ ] Multi-layer video (overlay, PiP, transitions)

---

## Competitive Gap Summary (updated 2026-04-27 — Higgsfield 3.5 reassessment)

| Competitor Feature | Status |
|-------------------|--------|
| Soul Cinema quality | **CLOSED** — Cinema Grade (12 film stocks) + post-processing pipeline |
| Upscale/Enhance/Relight/Inpaint/Angles | **CLOSED** — 10 tools vs their 5 |
| Color Grading presets | **CLOSED** — 12 film stock presets + 11 color grade presets |
| Grid Generation | **CLOSED** — 1x1 to 4x4 |
| AI Co-Director | **CLOSED** — 4 phases + Agent Mode (22 tools) |
| Physics-aware generation | **CLOSED** — GPT Image 2 handles physics natively |
| Cinematic reasoning | **CLOSED** — AI Director vision + GPT Image 2 contextual understanding |
| Native audio sync | **OPEN** — model-level proprietary, 1 remaining Higgsfield gap |
| 80+ Higgsfield apps | **CAN'T MATCH** — breadth play, not our strategy |
| Marketing Studio (URL→ad) | **PLANNED** — TikTok/Social Ads Builder (in-editor, better UX) |
| Higgsfield social network | **SKIP** — not relevant to B2B/agency target |

### Honest scorecard (post Higgsfield 3.5)

| Platform | Score | After Ads Builder |
|----------|:-----:|:-----------------:|
| Higgsfield 3.5 | **88** | 88 |
| **Us (Storytica)** | **86** | **89** |
| LTX Studio | 72 | 72 |
| Zopia AI | 70 | 70 |

**TikTok Ads Builder is the #1 priority to overtake Higgsfield. Score 86 → 89.**

---

## Testing (plan_testing.md)

~114 manual test cases exist but are unexecuted:

- [ ] Style auto-append (17), format presets (6), AI analyzer (24)
- [ ] Presets system (26), batch gen (14), color palette (5)
- [ ] AddImageMenu (5), prompt assembly (5), integration (12)
- [ ] Post-processing tools (NEW — need test cases)
- [ ] AI Agent tools (NEW — need test cases)
