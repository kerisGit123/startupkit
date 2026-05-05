# Competitive Analysis — Storyboard Studio

> **Last updated:** 2026-05-03 (session #38)
> Analysis of 9 direct competitors against our platform.
>
> **Session 2026-05-03 #38 (updated):** Full 4-way head-to-head added (Section 2b) — Us vs InVideo AI vs Higgsfield vs Artlist across all aspects. Corrected model counts: 16 image models, 6 video models, 12 inpaint models, 4 audio/music models (~29 total). Soul Cinema clarified: it is a video generation model, not a studio — our Cinema Studio workflow (genre/format/3D camera/style system) achieves equivalent cinematic output through the production layer. Face swap via inpaint (OpenAI 4o + mask) confirmed. Gaps updated: Sora 2 missing, voice cloning missing, video relight missing. Section 3/4/5 updated with accurate data.
> **Session 2026-05-03 #38:** Added InVideo AI (50M users, autonomous agent, Sora 2+Veo 3.1 bundled). Updated Higgsfield to $1.3B/$200M ARR/15M users, Mr. Higgs executes not just advises, Cinema Studio 3.5 pricing corrected (Starter $15/mo). Updated Artlist to $300M ARR, AI Studio launched April 2026 (control-focused, agent still roadmap). Updated threat table: InVideo added as Highest threat (volume/speed segment), Higgsfield updated with real valuation/ARR.
> **Session 2026-05-02 #32:** Visual Lock feature (production continuity — vision-analyze element images, rewrite script to match, segment-based Haiku/Sonnet auto-select, 9-step modal). @mention pipeline upgraded (inline injection, parseMentions in editor, drag-and-drop reorder, @ElementName→@Image{n} substitution at generate time). Element extraction quality bar (movie director framing, type-specific 100+ char descriptions, identity field population, sceneIds fuzzy expansion, occurrenceCount from ground truth, living creatures always characters). File deletion cleanup architecture (defaultAI rule for soft vs hard delete, shared cleanupFiles module, orphan repair daily cron, INTERNAL_REPAIR_SECRET env var).
> **Session 2026-04-30 #29:** Character thumbnail regeneration (76+ thumbs, ultra-realistic 4K, steel-blue bg, measured grid cropping). Custom Element Builder for Logo/Style/Other (single-form UI, prompt injection, @mention support).
> **Session 2026-04-30 #28:** Convex resource optimization — cron intervals, early returns, server-side filters, landing_stats cache. 2.38GB→~1.0GB bandwidth.
> **Session 2026-04-30 #27:** Script Builder redesign (line numbers, floating AI panel, rich scene sidebar). Smart Build modes (Update & Add, Rebuild From Scratch). Element @mention system (autocomplete, badges, generation-time @Image{N} resolution). Element Forge browse button, FileBrowser defaults.
> **Session 2026-04-29 #26:** Logs Element/Generated badges, soft-delete element files, crop thumbnails excluded.
> **Session 2026-04-29 #25:** Element Forge character builder — Simple/Advanced mode, reference photos (Face+Outfit OR Full Body), generate tab with grid+variant system, prompt composition from identity JSON.
> **Session 2026-04-29 #24:** Element Forge thumbnail system — carousel UI (120×135 cards, drag-to-slide), 280+ thumbnails for character/environment/prop options, tab layout with stacked/sub-tab fields.
> **Session 2026-04-28 #23:** Toolbar redesign (Create mode dropdown, settings popover, inline controls). Camera angle picker (3D wireframe box, tilt-following view).
> **Session 2026-04-28 #22:** GPT Image 2 pipeline (text-to-image + image-to-image), resolution selector, formula-based pricing.
> **Session 2026-04-28 #21:** Element Forge identity JSON, prompt composition, environment 2-level settings, prop wizard.
> **Session 2026-04-28 #20:** Element Forge initial architecture — wizard steps, config-driven options, randomize button.
> **Session 2026-04-28 #19:** Gallery redesign, pricing model updates, feature gating (useFeatures hook).
> **Session 2026-04-28 #18:** Subscription cycling abuse guard, credit system architecture, Clerk session token fixes.
> **Session 2026-04-28 #17:** Video Editor major overhaul — overlay layer system, 5 transition types, scrolling text, aspect-ratio lock, multi-row timeline.
> **Session 2026-04-27 #14-16:** AI Agent Mode (22 tools), support chatbot, AI Analyze, security hardening, code quality.
> **Session 2026-04-25 #1-7:** Camera system, pricing, FAQ, PDF export, color palette, landing page, style presets.
> See `plan_director_view.md` for implementation details, `plan_final_design.md` for design specs, `plan_pricing_strategy.md` for pricing strategy, `plan_booking.md` for booking migration plan.

---

## 1. Competitor Profiles

### InVideo AI (invideo.io) — NEW THREAT (added Session #38, 2026-05-03)

**What they are:** Fully autonomous AI video agent. 50M+ users, $50M+ ARR. Mass-market consumer video production from a single sentence.

**Key features:**

- **Full autonomous agent**: one text prompt → script + voiceover + stock/AI clips + music → published video in 3-5 minutes for a 10-minute video
- Makes 500+ creative decisions per video autonomously (pacing, transitions, BPM, cuts)
- **Semantic editing**: "make the intro more exciting" → agent increases cut pace, adds transitions, raises music tempo automatically
- Learns user aesthetic preferences over time
- Multi-agent architecture: OpenAI o3 orchestrates, specialist agents handle script/visuals/voiceover/music
- Video models: Sora 2, Veo 3.1, Kling 3.0, Pixverse, Hailuo (bundled under subscription — only platform with both Sora 2 and Veo 3.1)
- Image models: Nano Banana Pro, Ideogram, Flux Kontext
- Audio: ElevenLabs, Minimax; voice cloning from 30-second sample; 5 voice clones on Max plan
- Uses stock footage library + AI generation (not pure frame-by-frame AI control)
- Up to 30 minutes of video per generation

**Pricing:**

- Free: 10 AI videos/week
- Plus: $28/month (50 min/month generation)
- Max: $50-60/month (200 min/month)
- Annual discounts ~20%. Credits do NOT roll over monthly.

**Target:** YouTubers, social media teams, content creators who want volume and speed over frame-level control.

**Their moat:** Sheer scale (50M users) + fastest time-to-published-video on market + Sora 2 + Veo 3.1 bundled + semantic intent understanding. Agent executes the entire production pipeline with zero manual steps.

**Limitation:** Zero frame-level control. You can't specify individual shots, camera angles, or character consistency across scenes. It's a content machine, not a production studio.

---

### Artlist (artlist.io)

**What they are:** Stock asset marketplace + AI video production studio. $300M ARR (April 2026, up from $260M end 2025). 600% new user growth Q1 2026. One of the largest in the space.

**Key features:**
- Massive stock library (music, SFX, video clips, templates)
- **Artlist Studio** (launched April 20, 2026): AI video production with casting, locations, camera angles, continuity control — "control over every single element"
- AI video generation: Google Veo 3, Kling 2.5 (understands cinematic terms: "dolly zoom", smooth motion)
- AI image generation: Google Nano Banana (consistency, relight, re-angle, reimagine)
- Voice cloning: upload audio sample → instant AI voice + localization
- AI music + SFX via integrated library
- Silence removal, auto-zoom editing tools
- Mobile app (iOS/Android)
- **AI Agent: NOT YET LAUNCHED** — positioned as upcoming "intelligent assistance" (roadmap, no launch date)
- Smart Canvas: also upcoming (roadmap)

**Pricing:**
- AI Starter: $13.99-15.99/month (7,500 credits/month)
- AI Professional: $99.99-149.99/month (up to 1M credits/month)
- Annual billing saves 30%; credits up to 62% cheaper on higher tiers

**Target:** Video marketers, content creators, social media teams, agencies.

**Their moat:** $300M stock library brand trust + Artlist Studio production control focus + Veo 3 + Kling 2.5. Note: their AI agent is still roadmap — they're building toward autonomous production but don't have it yet.

---

### Lovart AI (lovart.ai)

**What they are:** AI design agent — conversational design platform for brand assets.

**Key features:**
- Conversational AI interface (chat → design)
- Logo, packaging, social media graphic generation
- Product photography and e-commerce shots
- Touch Edit (modify specific elements while preserving others)
- Text Edit (editable typography layers)
- Style consistency across design iterations
- Real-time web search for design references
- Video content creation (limited)

**Pricing:** Free tier + credit-based usage.

**Target:** Small businesses, marketing teams, e-commerce brands without dedicated designers.

**Their moat:** Design-agent UX — conversational workflow feels like working with a designer, not a tool.

---

### Storyboarder.ai (storyboarder.ai)

**What they are:** AI-powered pre-production platform for filmmakers. 250,000+ users.

**Key features:**
- Script import (PDF, FDX, Fountain, Word, plain text)
- Auto-generated shot lists from screenplay uploads
- Instant storyboards from text
- **3D camera control** (bird's eye, low angle, dutch tilt, over-the-shoulder, orbital pan/tilt/zoom)
- Visual consistency (character appearance maintained across scenes)
- Sketch-to-image refinement
- Custom art style via reference images
- Unlimited image generation (no credit system)
- Image-to-video animatics with AI motion + audio
- PDF export (shot lists, storyboards)
- MP4 animatic generation
- Pitch deck creation with templates
- Watermark-free exports on paid plans

**Pricing:** Free plan (limited projects), 3 paid tiers with unlimited generation. No per-generation credits.

**Target:** Film directors, advertising agencies, production companies.

**Their moat:** Purpose-built for filmmakers — 3D camera control, script format support, visual consistency, 250K users. Pure pre-production focus.

---

### Krock.io (krock.io)

**What they are:** Video review and collaboration platform for creative teams.

**Key features:**
- Frame-accurate commenting on video
- Version comparison tools
- Centralized approval workflows
- Unlimited reviewers
- Audio annotation
- AI-powered storyboarding (basic)
- Animatic production
- Adobe Creative Cloud integration
- DaVinci Resolve integration
- Apple Final Cut Pro integration

**Pricing:** Freemium, paid tiers for teams.

**Target:** Creative agencies, post-production teams, marketing departments.

**Their moat:** Review/approval workflow + deep NLE integrations. They're the collaboration layer, not the creation tool.

---

### ImagineArt (imagine.art)

**What they are:** All-in-one AI generation suite. 30M+ users, 100M+ downloads.

**Key features:**
- **Image models:** GPT Image 2 (4K), Nano Banana 2, Flux 2, Recraft V4
- **Video models:** Seedance 2.0, Kling 3.0 Pro, Runway 4.5, Google Veo 3.1
- Image-to-video, video extension
- Inpainting, upscaling, background removal, relight
- **Workflow builder** for custom creative pipelines
- Motion control and transfer
- Lipsync studio
- Cinematic camera angles
- Apps marketplace (one-click solutions)
- Chatly AI suite (docs, chat, slides, research)
- Mobile app (iOS/Android)
- API available
- Team collaboration

**Pricing:** Subscription with unlimited generation options + enterprise tier.

**Target:** Creators, marketers, developers (via API), enterprise teams.

**Their moat:** Scale (30M users) + same models we use + workflow builder + mobile. Closest to us in AI capabilities but missing project structure.

---

### OpenArt (openart.ai)

**What they are:** AI art platform with custom model training and community.

**Key features:**
- Text-to-image, image-to-image
- Photo-to-video conversion
- Consistent character generation
- **Custom model training** (train on your own data)
- 20+ public models + community models
- Inpainting, hand/face correction, expression adjustment
- Upscaling, background removal, style transfer
- Sketch-to-image, pose reference guidance
- Bulk creation (multiple images at once)
- QR code generation with AI
- Active Discord community
- Prompt Book + Model Training Book guides

**Pricing:** Free (4 parallel, 512px) → Starter (5K credits) → Hobbyist (15K) → Pro (unlimited).

**Target:** Digital artists, illustrators, graphic designers.

**Their moat:** Custom model training + community ecosystem. Artists can train models on their own style and share them.

---

### Higgsfield AI (higgsfield.ai)

**What they are:** AI video generation platform with Cinema Studio for filmmaking. **15M+ users, $200M ARR, $1.3B valuation (Jan 2026).** Founded by ex-Snap head of GenAI. 4.5M video generations/day, 30+ AI models.

**Key features:**

- **Cinema Studio 3.5** — professional filmmaking environment with per-shot camera/style control
- **Mr. Higgs AI co-director** — EXECUTES (not just advises): breaks scenes into shots, adjusts camera/lighting settings, populates prompts automatically in real-time. Responds to: "pick the camera", "light the scene", "write the prompt", "break this script into shots"
- Reusable elements system: characters, locations, props persist and are shareable across team shots
- Virtual camera system: precise optical physics, lens types, focal lengths, depth of field
- 30+ AI models (Kling 3.0, Seedance 2.0, Soul V2, Cinema models, Flux 2.0 Pro, GPT Image, Seedream 5.0 Lite)
- **Soul ID** — persistent character identity across generations (proprietary)
- **Soul Cast** — full character builder: genre, era, physique, personality traits
- **Photodump** — one-click multi-scene generation with character consistency
- Native AI sound generation synchronized to video (SFX + speech + music — Cinema Studio 3.0+)
- Real-time team collaboration: multiple users generate simultaneously on same project
- Lipsync Studio, face swap, character swap, brush inpainting
- Marketing Studio (URL → ad video in multiple formats)
- Higgsfield Audio (TTS, voice swap, video translation)
- Higgsfield Chat social network (shared projects, karma system)
- 80+ creative AI applications
- Topaz upscale, color grading, background removal
- Full 4K resolution (Cinema Studio 2.0+)
- Mobile accessible

**Pricing (annual billing):**

| Plan | Monthly | Annual | Credits/mo | Gens/mo | Cost/gen |
| --- | --- | --- | --- | --- | --- |
| Starter | $15 | $15 | 200 | 100 | $0.15 |
| Plus | $49 | $39 (20% off) | 1,000 | 500 | $0.078 |
| Ultra | $129 | $99 (23% off) | 3,000-9,000 | 1,500+ | $0.066 |
| Business | $89/seat | $62/seat (30% off) | 1,500/seat | 750+ | $0.083 |

Cinema Studio included in all plans (not a separate product).

**Target:** Content creators, marketers, filmmakers, production studios, enterprises.

**Their moat:** Cinema Studio 3.5 with AI co-director that actually executes + 80+ apps + Soul ID proprietary consistency + native audio sync + real-time team collaboration + social network + $1.3B valuation + 15M users. Fastest-growing direct competitor — $200M ARR puts them well-funded for continued R&D. 4.5M generations/day. Direct competitor to our storyboard + AI pipeline.

---

### LTX Studio (ltx.studio)

**What they are:** AI video production platform for filmmakers and creative teams. Web-based, no download required.

**Key features:**
- **Script-to-video** — upload scripts, auto-generate scenes and storyboards
- **Elements system** — lock visual parameters (characters, environments, objects, brand assets) for consistency across all generations
- **Camera Motion Presets** — crane, orbit, tracking shots, dolly with speed/distance control
- **Keyframe animation** — frame-by-frame motion control
- **Dynamic Storyboard Generator** — concepts → visual narratives
- **Timeline editor** — sequence clips, test shot-to-shot continuity, evaluate pacing
- **Retake** — re-shoot specific moments without full regeneration
- Text-to-video, image-to-video, video-to-video
- Visual references and preset styles (cinematic, sketch, branded)
- Team collaboration (share projects, manage assets, feedback)
- AI Storyboard Generator, Music Video Maker, AI Movie Maker
- AI Ad Generator, Pitch Deck Generator
- Audio-to-video

**Pricing:** Free plan + paid subscription tiers (monthly/annual). Premium unlocks faster generation + more compute.

**Target:** Filmmakers, directors, TV networks, advertising agencies, in-house creative studios, content creators.

**Their moat:** Elements consistency system + camera motion presets + script-to-video pipeline. Purpose-built for professional filmmaking workflows. Our closest competitor in the planning-to-production pipeline.

---

### Zopia AI (zopia.ai)

**What they are:** AI Film Agent — the world's first end-to-end AI short-drama production agent. Multi-agent system that handles script → storyboard → video → editing autonomously. Currently in closed beta.

**Key features:**
- **Director Agent** — multi-agent pipeline: scriptwriting, asset extraction, storyboarding, video generation, self-review, timeline editing — all autonomous
- Natural language control ("add a beat where she notices him")
- 100% character & scene consistency across 30+ shots (proprietary multi-agent coordination)
- Automated scriptwriting from loglines to full screenplays
- Continuous storyboard generation with character/environment reference inheritance
- Automated self-review (flags visual inconsistencies for approval)
- Built-in timeline editor (clip duration, shot reorder)
- Multiple visual styles: live-action, dark fantasy/wuxia, Korean drama, 3D CG, animated
- Video models: Kling 3.0, Vidu Q3, Seedance 2.0 (coming), CogVideo, HunyuanVideo
- Image models: GPT-4o, Flux, Minimax
- Team collaboration with credit allocation and role-based access
- Desktop app (Windows/macOS) + web Studio

**Pricing:** Currently free beta — 2,000 daily credits (enough for 4-5 short-drama sequences/day). Planned paid tiers: Starter, Basic, Pro (Seedance 2.0 Pro), Ultimate (all models, 1080P, team management, commercial rights). Exact prices not yet public.

**Target:** Solo creators, short-drama channels, content entrepreneurs, small production teams.

**Their moat:** End-to-end autonomous agent that produces finished short dramas from a single prompt. Multi-agent coordination for character consistency. Purpose-built for short-form serialized content. Free beta capturing early market.

**Limitations:** No audio in timeline editor (must export to CapCut/etc for music/SFX/dialogue). Optimized for short-form only. No canvas editing. No post-processing pipeline. No music AI. Closed beta with waitlist.

---

## 1b. Pricing Comparison — Us vs Higgsfield (Primary Competitor)

> **Date:** 2026-04-25
> Detailed pricing analysis. See also `plan_pricing_strategy.md` for full strategy document.

### Our Cost Structure (Kie AI Supplier)

| Kie Package | Price | Kie Credits | Cost/Credit |
|-------------|-------|-------------|-------------|
| Base | $5 | 1,000 | $0.005 |
| Mid | $50 | 10,000 | $0.005 |
| High (5% bonus) | $500 | 105,000 | $0.00476 |
| Top (10% bonus) | $1,250 | 275,000 | $0.00455 |

**Nano Banana 2 costs us 8 Kie credits = $0.04/gen (or $0.036 with 10% bonus top-up).**

### Our Plans vs Higgsfield Plans

| Metric | Our Free | Our Pro $39.90 | Our Business $79.90 | HF Basic $5 | HF Plus $39 | HF Ultra $99 |
|--------|----------|---------------|--------------------|----|----|----|
| Credits/mo | 100 | 3,500 | 8,000 | 70 | 1,000 | 3,000 |
| Credits/gen | 10 | 10 | 10 | 2 | 2 | 2 |
| Gens/mo | 10 | 250 | 690 | 35 | 500 | 1,500 |
| Cost/gen | free | $0.16 | $0.10 | $0.143 | $0.078 | $0.066 |
| Storage | 300 MB | 10 GB | 20 GB | - | - | - |
| Seats | 1 | 5 | 15 | 1 | 1 | 1 |
| Projects | 3 | Unlimited | Unlimited | - | - | - |
| Orgs | - | 1 | 3 | - | - | - |

### Head-to-Head at $39/mo

| | Us (Pro $39.90) | Higgsfield (Plus $39) |
|--|-----------------|----------------------|
| Credits/mo | 3,500 | 1,000 |
| Credits per gen | 10 | 2 |
| **Gens/mo** | **250** | **500** |
| Cost per gen | $0.16 | $0.078 |
| Our cost per gen | $0.04 | -- |
| Our margin per gen | $0.12 (75%) | -- |

**Problem: Higgsfield delivers 2x more generations at the same $39 price point.**

### Our Non-Price Advantages

- Free tier (Higgsfield cheapest is $5/mo)
- Credit top-ups with no subscription ($10 = 1,000 credits, one-time)
- Credits never expire (Higgsfield credits expire monthly)
- Full storyboard studio platform (not just image/video gen)
- Storage, multi-seat collaboration, organizations
- Multi-model AI (image + video + music + TTS + analysis) under one credit system

### Recommended Fix

**Option A (recommended): Drop Nano Banana 2 from 10 to 5 credits/gen**
- Pro: 2,500 / 5 = 500 gens/mo (matches Higgsfield Plus)
- Business: 6,900 / 5 = 1,380 gens/mo (close to Higgsfield Ultra's 1,500)
- Our cost: $0.04, user pays $0.05 = 20-28% margin (sustainable)

**Option B: Increase credits in plans (keep 10 credits/gen)**
- Pro: bump from 2,500 to 5,000 credits
- Business: bump from 6,900 to 15,000 credits
- Maintains current margin structure but increases subscription value

See `plan_pricing_strategy.md` for full analysis with margin tables.

---

## 2. Feature Comparison Matrix

### Pre-Production & Planning

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Script editor | YES | - | - | YES | - | - | - | - | YES |
| Script format import (FDX/PDF) | - | - | - | **YES** | - | - | - | - | YES |
| Script → storyboard auto-build | YES | - | - | YES | - | - | - | - | **YES** |
| Scene parser | YES | - | - | YES | - | - | - | - | YES |
| Storyboard grid view | YES | - | - | YES | YES | - | - | - | YES |
| Director's filmstrip | **YES** | - | - | Basic | - | - | - | Per-shot | YES |
| Animatic playback (image+video) | **YES** | - | - | YES | YES | - | - | - | YES |
| 3D camera angle picker (sphere UI → prompt) | **YES** (wireframe globe, rotation/tilt/zoom, 12 presets) | - | - | **YES** (3D scene) | - | - | - | **YES** (Angles 2.0) | **YES** (keyframes) |
| Camera motion presets (dolly/crane/pan/orbit/etc) | **YES** (15 presets + context menu) | - | - | YES | - | - | - | YES | **YES** |
| Virtual camera physics (lens/DOF) | **YES** (Camera Studio: 9 cameras, 6 lenses, 8 focal lengths, 6 apertures) | - | - | - | - | - | - | **YES** | - |
| AI co-director (auto shot breakdown) | **YES** (Director + Agent, 22 tools) | - | - | - | - | - | - | **YES** | - |
| Shot list generation | - | - | - | YES | - | - | - | YES | - |
| Pitch deck creation | - | - | - | YES | - | - | - | - | YES |
| Retake (re-shoot specific moments) | - | - | - | - | - | - | - | - | **YES** |

### AI Generation

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Multi-model image AI | **YES** (16 models) | YES | YES | YES | - | **YES** (5+) | YES (20+) | **YES** (~10) | YES |
| Multi-model video AI | **YES** (6 models) | Sora 2 | - | Basic | - | **YES** (5+) | Basic | **YES** (20+) | YES |
| AI music generation | **YES** | Stock | - | - | - | - | - | - | - |
| AI TTS (text-to-speech) | **YES** | YES | - | - | - | - | - | - | - |
| Lipsync | **YES** | - | - | - | - | YES | - | **YES** | - |
| Multi-shot video (UGC/Showcase) | **YES** | - | - | - | - | YES | - | YES | - |
| Character persistence (Soul ID/Elements) | YES | - | - | YES | - | - | YES | **YES** | **YES** |
| Multi-scene one-click (Photodump) | - | - | - | - | - | - | - | **YES** | - |
| Custom model training | - | - | - | - | - | - | **YES** | - | - |
| Unlimited generation | - | YES | - | YES | - | YES | YES | - | - |
| Credit-based pricing | **YES** | - | YES | - | - | - | YES | **YES** | - |
| Audio-to-video | - | - | - | - | - | - | - | - | **YES** |
| Video-to-video transform | - | - | - | - | - | - | - | - | **YES** |

### Editing & Canvas

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Canvas draw + annotate | **YES** | - | - | Sketch | - | - | - | - | - |
| AI inpaint/area edit | **YES** | - | YES | - | - | YES | YES | YES | - |
| Image upscaling | YES | - | - | - | - | YES | YES | YES | - |
| Background removal | **YES** | - | - | - | - | YES | YES | YES | - |
| Style transfer / Copy Style | **YES** (AI Analyze + GPT img2img) | - | YES | YES | - | - | YES | - | YES |
| Face swap / character swap | YES (inpaint: OpenAI 4o + mask, Ideogram Character Remix) | - | - | - | - | - | - | **YES** (dedicated button) | - |
| Keyframe animation | - | - | - | - | - | - | - | - | **YES** |

### Video Editor / Timeline

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Multi-track timeline | **YES** | YES | - | - | - | - | - | - | YES |
| Video + audio + subtitle tracks | **YES** | YES | - | - | - | - | - | - | - |
| Trim, split, range cut | **YES** | YES | - | - | - | - | - | - | YES |
| Blend modes + opacity | **YES** | YES | - | - | - | - | - | - | - |
| Snapshot frame capture | **YES** | - | - | - | - | - | - | - | - |
| Video export (WebCodecs) | **YES** | YES | - | MP4 | - | - | - | - | YES |
| Multi-layer overlays (PiP, text, video, shapes) | **YES** | YES | - | - | - | - | - | - | - |
| Transitions (crossfade, wipe, slide, dissolve) | **YES** (5 types as overlay layers) | YES | - | - | - | - | - | - | YES |
| Scrolling text / teleprompter overlay | **YES** | - | - | - | - | - | - | - | - |
| Aspect ratio selector (per-project) | **YES** (16:9, 9:16, 1:1) | YES | - | - | - | YES | - | YES | YES |
| Filmstrip thumbnails on timeline | **YES** | YES | - | - | - | - | - | - | YES |
| Per-shot camera/style control | - | - | - | - | - | - | - | **YES** | **YES** |

### Collaboration & Workflow

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Real-time sync (no save button) | **YES** | - | - | - | - | - | - | - | - |
| Multi-user organizations | **YES** | - | - | - | YES | YES | - | YES | YES |
| Frame-accurate review/comments | - | - | - | - | **YES** | - | - | - | - |
| Approval workflows | - | - | - | - | **YES** | - | - | - | - |
| NLE integrations (Adobe/DaVinci) | - | - | - | - | **YES** | - | - | - | - |
| Workflow/pipeline builder | - | - | - | - | - | **YES** | - | - | - |
| Community/marketplace | - | - | - | - | - | YES | **YES** | YES | - |
| Mobile app | - | YES | - | - | - | **YES** | - | YES | - |
| API access | - | - | - | - | - | YES | - | - | - |
| Team collaboration | YES | - | - | - | YES | YES | - | YES | **YES** |

### Director's View & Continuity

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Director's filmstrip (god view) | **YES** | - | - | Basic | - | - | - | Per-shot | YES |
| Snapshot to next frame (continuity bridge) | **YES** | - | - | - | - | - | - | - | - |
| Video hover preview on filmstrip | **YES** | - | - | - | - | - | - | - | - |
| Animatic playback (image + video) | **YES** | - | - | YES | YES | - | - | - | YES |
| Comparison mode (prev/current/next) | **YES** | - | - | - | - | - | - | - | - |
| Generated outputs row | **YES** | - | - | - | - | - | - | - | - |
| Drag reorder in filmstrip | **YES** | - | - | - | - | - | - | - | YES |
| Director's notes per frame | **YES** | - | - | - | - | - | - | - | - |
| Right-click context menu (status/notes/delete) | **YES** | - | - | - | - | - | - | - | - |
| Scene grouping with dividers | **YES** | - | - | - | - | - | - | - | - |
| Video snapshot from Generated Panel | **YES** | - | - | - | - | - | - | - | - |

### Project Structure & Consistency

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Element library (characters/environments/props) | **YES** | - | - | - | - | - | - | YES | **YES** |
| Element Forge (structured character/env/prop wizard) | **YES** (10 archetypes, identity JSON, prompt composition) | - | - | - | - | - | - | - | - |
| Custom elements (logos/styles/other references) | **YES** (upload refs, @mention, prompt injection) | - | YES | - | - | - | - | - | **YES** |
| Element consistency via prompt @mentions | **YES** | - | - | - | - | - | - | - | - |
| Visual consistency across scenes | YES | - | YES | YES | - | - | YES | **YES** | **YES** |
| Project-level style system | **YES** | - | YES | YES | - | - | - | YES | YES |

### UI & Design System

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| CSS variable design system | **YES** | - | - | - | - | - | - | - | - |
| Cinema-grade Frame Info dialog | **YES** | - | - | - | - | - | - | - | - |
| Shared VideoPreviewDialog (reusable) | **YES** | - | - | - | - | - | - | - | - |
| Aspect ratio grid popup (NLE-style) | **YES** | YES | - | - | - | YES | - | YES | YES |
| Consistent dark theme across all panels | **YES** | YES | - | - | - | YES | - | YES | YES |

---

## 2b. Head-to-Head: Us vs InVideo AI vs Higgsfield vs Artlist

> Full 4-way comparison across all aspects. Added session #38, 2026-05-03.

### Business Reality

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
| --- | --- | --- | --- | --- |
| Stage | Pre-launch | Growth | Scale | Mature |
| ARR | $0 | $50M | $200M | $300M |
| Valuation | Bootstrapped | Funded | $1.3B | Acquired |
| Users | Building | 50M | 15M | Large |
| Founded | 2024 | 2019 | 2023 | 2014 |
| Target | Filmmakers, agencies | YouTubers, content farms | Creators + filmmakers | Video marketers, agencies |

### Core Philosophy

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
| --- | --- | --- | --- | --- |
| Core model | Director controls every frame | One prompt → finished video | AI co-director executes shots | Stock + AI production control |
| User intent | "I want to direct" | "I want a video, fast" | "I want a co-director" | "I want professional assets I control" |
| Autonomous? | Partial (Agent mode) | Fully (500 decisions/video) | Mr. Higgs executes in real-time | Not yet (roadmap) |
| Control level | Maximum (per-frame) | Zero | High (per-shot) | High |
| Speed | Slower, deliberate | 3-5 min to finished video | Moderate | Moderate |

### Image Models — Crown Jewels

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| GPT Image 2 | **YES** | NO | YES | NO |
| Nano Banana 2 | **YES** | YES (Nano Banana Pro) | YES | **YES** |
| Ideogram v3 (Edit + Remix + Reframe) | **YES** | YES | NO | NO |
| Flux Pro | NO | YES (Flux Kontext) | **YES** (Flux 2.0 Pro) | NO |
| Seedream 5.0 (4 variants) | **YES** | NO | YES (Lite) | NO |
| Qwen Image Edit (3 variants) | **YES** | NO | NO | NO |
| Grok Image | **YES** | NO | NO | NO |
| Recraft (Remove BG + Crisp Upscale) | **YES** | NO | NO | NO |
| Topaz Image Upscale | **YES** | NO | YES | NO |
| **Total image models** | **~16** | ~4 | ~10 | 2 |

**Verdict: We win on image model breadth. GPT Image 2 matched with Higgsfield.**

### Video Models — Crown Jewels

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| Sora 2 | **NO** | **YES (bundled)** | YES | NO |
| Veo 3.1 | **YES** | **YES (bundled)** | Unclear | YES (Veo 3) |
| Seedance 2.0 | **YES** | NO | YES | NO |
| Kling 3.0 | YES (motion) | YES | **YES** | YES (Kling 2.5) |
| Soul Cinema | NO | NO | **YES (proprietary)** | NO |
| Pixverse / Hailuo | NO | YES | YES | NO |
| Topaz Video Enhance | **YES** | NO | YES | NO |
| **Total video models** | **6** | 6 | 20+ | 2 |

**Note on Soul Cinema:** Soul Cinema is a proprietary video model trained on cinematic footage — not a studio environment. Our workflow layer (genre system, format presets, 3D camera, virtual camera physics, style system) achieves equivalent cinematic output through prompt engineering and tooling rather than model fine-tuning. Different approach, comparable result for controlled productions.

**Verdict: Missing Sora 2 — the only crown jewel gap. Everything else matched or close. Higgsfield's 20+ video model library is their real depth advantage.**

### Audio / Voice / Music

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| AI music generation | **YES** | Stock library only | NO | Stock library only |
| Extend music | **YES** | NO | NO | NO |
| TTS (text-to-speech) | **YES** | YES (ElevenLabs) | YES | YES |
| Custom voice persona | **YES** | NO | YES | NO |
| Voice cloning | **NO** | YES (30-sec sample) | YES | YES |
| Native audio sync to video | NO | Auto | **YES** | NO |
| Lipsync | YES | NO | **YES** | NO |

**Verdict: We win on music gen — nobody else has AI music in the same tool. Missing: voice cloning (addable via ElevenLabs).**

### Image Editing / Inpainting

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| Canvas draw + annotate | **YES** | NO | NO | NO |
| Inpaint model count | **12 models** | NO | 1 (brush only) | NO |
| Mask-based face replacement | **YES** (OpenAI 4o + mask) | NO | YES (dedicated button) | NO |
| Character remix / restyle | **YES** (Ideogram Character Remix) | NO | YES (character swap) | NO |
| Background removal | **YES** (Recraft) | NO | YES | NO |
| Image upscale | **YES** (Topaz + Recraft) | NO | YES (Topaz) | NO |
| Reframe / expand canvas | **YES** (Ideogram V3 Reframe) | NO | NO | NO |
| Video relight | **NO** | NO | **YES** | NO |
| Video enhance | YES (Topaz) | NO | **YES** | NO |

**Verdict: We win on inpainting depth — 12 models vs Higgsfield's 1 brush. Canvas draw is unique to us. Missing: video relight.**

### Timeline Editor — 4-way

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| Multi-track timeline | **YES** | NO | **NO** | YES |
| Video + audio + subtitle tracks | **YES** | NO | NO | YES |
| Trim, split, range cut | **YES** | NO | NO | YES |
| Blend modes + opacity | **YES** | NO | NO | YES |
| Transitions (5 types) | **YES** | Auto only | NO | YES |
| Scrolling text / teleprompter | **YES** | NO | NO | NO |
| Multi-layer overlays (PiP, text, shapes) | **YES** | NO | NO | YES |
| Semantic editing ("make it faster") | NO | **YES** | NO | NO |
| Video export (WebCodecs) | **YES** | YES | NO | YES |

**Verdict: We and Artlist win on editing depth. Higgsfield has NO timeline editor — major gap for them. Higgsfield generates shots but can't edit sequences.**

### Pre-Production / Planning Pipeline

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| Script → storyboard pipeline | **YES** | Auto (no control) | Partial (Mr. Higgs) | NO |
| Script parser + auto-frame creation | **YES** | YES (fully auto) | NO | NO |
| Director's filmstrip (god view) | **YES** | NO | Per-shot only | NO |
| Comparison mode (prev/cur/next) | **YES** | NO | NO | NO |
| Snapshot continuity bridge | **YES** | NO | NO | NO |
| Director notes per frame | **YES** | NO | NO | NO |
| Scene grouping with dividers | **YES** | NO | NO | NO |
| Animatic playback | **YES** | NO | NO | NO |
| Drag reorder in filmstrip | **YES** | NO | NO | YES |

**Verdict: We win this category entirely. This is our deepest moat — nobody else has this level of pre-production control.**

### Camera System

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| 3D camera angle picker | **YES** | NO | YES | YES |
| Virtual camera physics (lens, DOF) | **YES** | NO | **YES** | NO |
| Camera motion presets | **YES** | Auto | **YES** | YES |
| Per-shot camera control | **YES** | NO | **YES** | YES |
| Genre system (16 presets) | **YES** | NO | NO | NO |
| Format presets (12 types) | **YES** | NO | NO | NO |

**Verdict: Matched with Higgsfield on per-shot camera. We win on genre + format preset system — their cinematic output comes from Soul Cinema model; ours comes from the workflow.**

### Character / Element Consistency

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| Element library (characters/props/environments) | **YES** | NO | YES | NO |
| Element Forge wizard (10 archetypes) | **YES** | NO | NO | NO |
| @mention injection into prompts | **YES** | NO | NO | NO |
| Visual Lock (vision → rewrite script) | **YES** | NO | NO | NO |
| Soul ID (visual persistence) | NO | NO | **YES (proprietary)** | NO |
| Soul Cast (character builder) | NO | NO | **YES** | NO |
| Photodump (multi-scene one-click) | NO | NO | **YES** | NO |

**Note:** Higgsfield uses model-level identity (Soul ID — baked into generation). We use prompt-level identity (@mentions + Element Forge). Soul ID is more automatic for novice users. Our approach gives more explicit control for professional users.

### AI Director / Agent

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
| --- | --- | --- | --- | --- |
| AI director / agent exists | YES (22 tools) | YES (fully autonomous) | YES (Mr. Higgs) | NO (roadmap) |
| Executes without asking | Partial (E2E pipeline in progress) | **Full (500 decisions/video)** | **Yes (real-time in studio)** | NO |
| Frame-level control during directing | **YES** | NO | YES | N/A |
| Semantic editing | NO | **YES** | NO | NO |
| Script → full video one-shot | In progress | **YES** | YES | NO |

### Collaboration / Platform

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
|---|:---:|:---:|:---:|:---:|
| Real-time sync (Convex, no save button) | **YES** | NO | NO | NO |
| Multi-user organizations | **YES** | NO | YES | NO |
| Real-time team generation | NO | NO | **YES** | NO |
| Mobile app | NO | YES | YES | YES |
| Social network | NO | NO | **YES** (Higgsfield Chat) | NO |
| Stock footage library | NO | YES (bundled) | NO | **YES (massive)** |

### Pricing Model

| | **Us** | **InVideo AI** | **Higgsfield** | **Artlist** |
| --- | --- | --- | --- | --- |
| Model | Credit per generation | Minutes of video/month | Credits per generation | Credits per month |
| Transparency | Per-model pricing | Opaque (minutes-based) | Per-credit | Per-credit tiers |
| Free tier | YES (100 credits) | YES (10 videos/week) | NO | NO |
| Entry paid | ~$10 top-up | $28/month | $15/month | $14/month |
| Credits roll over | **YES** | **NO** | NO | YES |

### Summary Scorecard

| Aspect | Winner | Notes |
| --- | --- | --- |
| Image model quality | Tied (us + Higgsfield) | Both have GPT Image 2 |
| Image model breadth | **Us (16 models)** | vs Higgsfield ~10, InVideo ~4 |
| Video model quality | InVideo + Higgsfield | Missing Sora 2 only |
| Video model breadth | **Higgsfield (20+)** | Their real depth advantage |
| Inpainting / canvas | **Us (12 models)** | Higgsfield has 1 brush only |
| Video timeline editor | **Us + Artlist** | Higgsfield has NO editor |
| Pre-production pipeline | **Us** | Nobody comes close |
| Camera system | **Us + Higgsfield** | Tied on per-shot; we win on genre/format |
| AI music in same tool | **Us** | Nobody else combines music + storyboard |
| Autonomous speed | **InVideo** | Different market segment |
| Character consistency | Higgsfield (Soul ID) vs Us (@mentions) | Different approaches |
| Real-time sync | **Us** | Unique — Convex backend |
| Voice cloning | InVideo + Higgsfield + Artlist | Gap — addable via ElevenLabs |
| Stock library | **Artlist + InVideo** | Different strategy — we generate instead |
| Video relight | **Higgsfield** | Missing — niche but worth watching |
| Scale / users | InVideo + Artlist | Business gap, not product gap |

---

## 3. Our Advantages

### Things nobody else has

1. **All-in-one pipeline** — Pre-production (script/storyboard) → AI generation (image/video/music) → editing (canvas/timeline) → export. Every competitor does 1-2 of these. We do all of them in one web app.

2. **Real-time database (Convex)** — Instant sync, no save button. Changes are live immediately. No competitor uses a real-time backend for creative tools.

3. **Element library with prompt @mentions** — Characters, environments, and props stored as reusable elements. Reference them in prompts with `@CharacterName`. Nobody else has this level of structured consistency.

4. **Canvas draw + AI inpaint** — Draw/annotate directly on the canvas, then AI-edit specific areas. Combines manual creativity with AI power. Only ImagineArt has inpainting, but without the canvas drawing layer.

5. **Director's View filmstrip** — Continuity strip with comparison mode, animatic playback (image + video), snapshot-to-next-frame, drag reorder, generated outputs row, director's notes. Storyboarder.ai has a basic filmstrip but none of these advanced features.

6. **AI Music + Personas** — Full music generation (create, extend, cover), custom voice personas, integrated in the same project. No competitor combines music AI with storyboarding.

7. **Credit-based per-model pricing** — Users pay per generation, per model. Not locked behind subscription tiers. Fair and transparent.

8. **Multi-track video editor with subtitles** — Video + audio + subtitle tracks, blend modes, opacity, trim, split, range cut, frame snapshot, WebCodecs export. In a storyboard tool. Only Artlist has comparable editing, but without storyboard integration.

### Things we do significantly better than most

9. **Multi-model AI** — 15+ models across image, video, music, audio, TTS. Most competitors offer 1-3 models.

10. **Script-to-storyboard pipeline** — Script parser → n8n build → auto-create frames + elements → AI generation. Storyboarder.ai has script import but no multi-model generation after.

11. **Snapshot continuity bridge** — Capture last frame of video → set as next frame's reference. Ensures visual continuity between shots. Nobody else has this.

- **Frame-level creative control vs autonomous agents** — InVideo, Zopia, and Higgsfield Photodump produce a video for you. We produce a production you control. Every frame is individually accessible, regeneratable, and editable. Users who care about quality — not just volume — need this. No autonomous agent can match director intent at the frame level.

12. **Multi-shot video (Seedance 2.0)** — UGC mode (product + influencer, 6 images), Showcase mode (subject + presenter + scene, 9 images). Generates multi-angle/multi-cut videos from reference images.

---

## 4. Our Disadvantages

### Things competitors do better

| # | Gap | Who does it better | Impact | Status / Decision |
|---|-----|-------------------|--------|-----------------|
| 1 | ~~No stock asset library~~ | ~~Artlist~~ | ~~Medium~~ | **Not a gap** — Gallery sharing covers this. AI generates content instead of browsing stock |
| 2 | ~~No 3D camera control~~ | ~~Storyboarder.ai, LTX, Higgsfield~~ | ~~Medium~~ | **DONE** — 3D Camera Angle Picker (wireframe globe, rotation/tilt/zoom, 12 presets, prompt auto-append) |
| 3 | ~~No custom model training~~ | ~~OpenArt~~ | ~~High~~ | **Not needed** — Prompt-based consistency via Element @mentions achieves same result. B2B product doesn't need community model training |
| 4 | ~~No mobile app~~ | ~~ImagineArt, Artlist~~ | ~~Medium~~ | **Not needed** — B2B product, not B2C. Web-first is correct for professional users |
| 5 | ~~No script format import~~ | ~~Storyboarder.ai~~ | ~~Low~~ | **Low priority** — Most users paste text directly. `.fdx` (Final Draft) and `.fountain` (plain-text screenplay markup) are niche formats |
| 6 | ~~No review/approval workflow~~ | ~~Krock.io~~ | ~~High~~ | **Low priority** — Keep it simple. Existing collaboration via Clerk orgs is sufficient for now |
| 7 | ~~No workflow/pipeline builder~~ | ~~ImagineArt~~ | ~~Medium~~ | **Planned post-launch** — Need to get to market first. Will revisit after initial traction |
| 8 | ~~No community/marketplace~~ | ~~OpenArt, ImagineArt~~ | ~~Low~~ | **Not needed** — Discord community works. Gallery sharing + remix covers the use case |
| 9 | ~~No NLE integrations~~ | ~~Krock.io~~ | ~~Low~~ | **Low priority** — Our video editor replaces NLEs (Premiere, DaVinci, FCP) for most use cases. Export to XML/EDL is future nice-to-have |
| 10 | **Scale gap** | Artlist ($300M ARR), ImagineArt (30M users), Storyboarder (250K) | Early stage | Focus on unique all-in-one value prop. Storyboarder's 250K users are natural upgrade candidates |

**Result: 9 of 10 original gaps are either closed, not needed, or deprioritized. Only scale gap remains (natural for a pre-launch product).**

---

## 5. Strategic Positioning

### Where we sit in the market

```
                    AI Generation Power →
                    Low                          High
                ┌────────────────────────────────────┐
   Planning  H  │  Storyboarder.ai  LTX ★ US        │
   & Pre-    i  │  Krock.io              Higgsfield  │
   Production g │                                    │
              h │                                    │
                │                                    │
              L │  Lovart              ImagineArt    │
              o │                      OpenArt       │
              w │  Artlist (stock)                   │
                └────────────────────────────────────┘

★ = Our position (high planning + high AI generation + editing)
```

We occupy a unique position: **high pre-production planning + high AI generation power + full editing suite**. LTX Studio and Higgsfield are now in the same quadrant but each lacks pieces we have.

- **InVideo AI** is high volume/speed but zero control — content factory for YouTubers, not a production tool. Their 50M users are a different audience entirely.
- **LTX Studio** is closest — has Elements + script-to-video + timeline. But no multi-model AI (own models only), no music AI, no canvas draw+AI, no real-time sync, no credit pricing
- **Higgsfield** has 30+ AI models + Cinema Studio + Mr. Higgs executes autonomously + Soul ID + $1.3B funding. Our defense: storyboard planning pipeline, canvas editing, multi-track timeline with subtitles, music AI, element @mentions
- **Storyboarder.ai** is high on planning but limited on AI models (their own models only)
- **ImagineArt/OpenArt** are high on AI but have zero planning/project structure
- **Artlist** is high on stock assets, launched AI Studio April 2026 but agent not yet live
- **Krock.io** is high on review/collaboration but has no generation
- **Lovart** is design-focused, not filmmaking-focused

### Our natural competitors by threat level

| Threat | Competitor | Why |
|--------|------------|-----|
| **Highest** | InVideo AI | **NEW THREAT (added #38).** 50M users, $50M ARR, autonomous agent (500+ decisions/video), Sora 2 + Veo 3.1 bundled, 3-5 min to finished video. Dominates the "I want a video fast" segment. Our defense: they have zero frame-level control, no storyboard planning, no character consistency system, no music AI — we're for professionals who want to direct, not just generate |
| **Highest** | Higgsfield | $1.3B valuation, $200M ARR, 15M users. Cinema Studio 3.5 with Mr. Higgs that EXECUTES (not just advises), Soul ID, 80+ apps, native audio sync, real-time team collab. Our defense: storyboard planning pipeline, canvas editing, multi-track timeline with subtitles, music AI, element @mentions, credit transparency |
| **Highest** | Zopia AI | End-to-end autonomous Director Agent: script → storyboard → video → edit in one prompt. Multi-agent character consistency across 30+ shots. Free beta capturing early market. Our defense: 11 post-processing tools (they have 0), canvas editing, music AI, camera system, manual creative control |
| **Highest** | LTX Studio | Same pipeline vision (script → storyboard → video), Elements consistency system, camera presets, timeline editor, team collaboration. Our defense: multi-model AI (they use own models only), music AI, canvas draw+AI, real-time Convex sync, credit-based pricing, AI Director + Agent |
| **High** | ImagineArt | Same AI models, 30M users, adding workflow builder. If they add storyboard + timeline, they become dangerous. Our defense: project structure pipeline |
| **High** | Storyboarder.ai | Same target audience (filmmakers), 250K users, script import, 3D camera. But no multi-model AI, no timeline, no music. Their users are our upgrade path |
| **Medium** | Artlist | $300M ARR, AI Studio launched April 2026 (control-focused, not autonomous). Agent still roadmap. Stock-first DNA. Different market segment but watching |
| **Low** | OpenArt | Image-focused, no video editing, no storyboard. Different use case |
| **Low** | Krock.io | Review-only tool. Complementary, not competitive. Could be an integration partner |
| **Low** | Lovart | Design agent, not filmmaking. Different market entirely |

---

## 6. Action Plan — What To Build Next

### Priority 1: Quick wins — before launch

| # | Action | Status |
|---|--------|--------|
| 1 | ~~**3D Camera Angle Picker**~~ | **DONE** |
| 2 | ~~**Camera Motion Presets**~~ | **DONE** |
| 3 | ~~**Camera Studio (virtual camera physics)**~~ | **DONE** |
| 4 | ~~**Batch frame generation**~~ — "Generate All" button + dialog with model picker, resolution, skip-existing, elements toggle, credit summary | **DONE** |
| 5 | ~~**Style metadata auto-append**~~ — project `stylePrompt` + `formatPreset` + `colorPalette` automatically prepended to all generation prompts | **DONE** |
| 6 | ~~**AI Analyze — Image, Video & Audio Intelligence**~~ (via OpenRouter → Gemini) — ANALYZE tab in VideoImageAIPanel, image/video/audio analysis, credit-based | **DONE** |
| 7 | ~~**Content Format Presets**~~ — 12 format types (Film, YouTube, Reel, Commercial, etc.) with auto-append to prompts | **DONE** |
| 8 | ~~**Presets System**~~ — `storyboard_presets` table for saving/loading camera studio, angle, style, note settings across projects | **DONE** |

### Priority 1b: AI Analyze Feature (Image & Video Intelligence)

**Backend:** Single OpenRouter integration (`openrouter.ai/api`) — one API key, access to all models. Passthrough pricing (same as direct APIs). Can swap models by changing a string.

**Why OpenRouter over direct APIs:**
- One integration covers GPT-4o + Gemini Pro + Claude (no separate API keys/accounts)
- Auto-fallback if a model is down
- Model switching without code changes — just change the model ID
- Same pricing as direct APIs

**Image analysis features (using Gemini Flash Lite — $0.25/1M input, cheapest):**

| Feature | What it does | Credit cost | API cost |
|---|---|---|---|
| **Copy Style** | Analyzes lighting, color grading, mood, camera look, era/aesthetic → generates style prompt → saves as project `stylePrompt` → auto-appends to all future generations | 1 credit | ~$0.0003 |
| **Describe Scene** | Extracts scene content (who, what, where, actions, props) → auto-fills image/video prompt in textarea | 1 credit | ~$0.0003 |
| **Copy Camera** | Extracts camera angle, lens, framing, DOF → auto-sets Camera Studio + Angle Picker settings | 1 credit | ~$0.0003 |

**Video analysis features (using Gemini 3.1 Pro — $2/1M input, best video understanding):**

| Feature | What it does | Credit cost | API cost |
|---|---|---|---|
| **Copy Style from Video** | Analyzes color grading, lighting, mood across multiple frames → more accurate than single image | 2 credits | ~$0.005 |
| **Describe Video** | Scene breakdown, actions, transitions, pacing → reverse storyboard (auto-generate frames from reference video) | 2 credits | ~$0.005 |
| **Copy Camera Movement** | Detects dolly, pan, tilt, tracking, handheld, static → auto-sets Camera Motion preset | 2 credits | ~$0.005 |

**Why Gemini Pro for video (not GPT-4o):**
- GPT-4o has no native video input — must extract frames as images (loses motion/timing info)
- Gemini 3.1 Pro has native video upload with temporal understanding — sees actual movement, pacing, transitions
- Gemini scores 78.2% on Video-MME benchmark vs GPT-4o at ~71%
- Gemini's 2M token context window can process long videos without chunking

**UI:** Right-click context menu on any image or video:
```
On images:  📋 Copy Style (1cr)  ·  📝 Describe Scene (1cr)  ·  🎥 Copy Camera (1cr)
On videos:  📋 Copy Style (2cr)  ·  📝 Describe Video (2cr)  ·  🎥 Copy Camera Move (2cr)
```

**Implementation:**
1. Add OpenRouter API route (`app/api/ai-analyze/route.ts`) — single endpoint, accepts `{ type, model, imageUrl/videoUrl }`
2. Add context menu items on GalleryCard, FileBrowser, and Generated Panel images/videos
3. Deduct credits before API call (existing credit system)
4. Route to correct model: image tasks → `google/gemini-flash-lite`, video tasks → `google/gemini-3.1-pro`
5. Parse response and apply: style → `stylePrompt`, scene → prompt textarea, camera → Camera Studio/Angle Picker/Motion settings

**Infrastructure already exists:**
- OpenAI 4o Vision endpoint (`api/closer-look/route.ts`) — can reference for pattern
- Project `stylePrompt` field + `STYLE_PROMPTS` constants + style UI
- Credit deduction system
- Camera Studio + Angle Picker + Motion Presets (targets for auto-set)
- Right-click context menus on images/videos

### Priority 1c: Go-to-Market Features (DONE)

| # | Action | Status |
|---|--------|--------|
| 9 | ~~**FAQ System**~~ — Chat widget decision tree (50+ paths, zero API calls) + dedicated /faq page (50+ questions, 8 categories) | **DONE** |
| 10 | ~~**PDF Export**~~ — Landscape A4 storyboard download via jsPDF (title page + 2x2 frame grid) | **DONE** |
| 11 | ~~**Pricing Page Redesign**~~ — PricingShowcase component, Clerk CheckoutButton, gen estimates, billing toggle | **DONE** |
| 12 | ~~**Landing Page Quick Wins**~~ — Outcome headline, no-CC badge, real value props, section reorder | **DONE** |
| 13 | ~~**Prompt Enhance API**~~ — AI-powered prompt improvement endpoint | **DONE** |
| 14 | ~~**ElevenLabs TTS**~~ — Speaker icon + SPEECH badge for text-to-speech generation | **DONE** |
| 15 | ~~**Speed Ramp Editor**~~ — 8 presets with visual curve editor, prompt auto-append | **DONE** |

### Priority 2: Post-launch

| # | Action | Competitive impact |
|---|--------|-------------------|
| 7 | **AI Co-Director (Claude Agent)** — chatbot with project context + tool use. 80% infrastructure exists | Our biggest differentiator if built. Beats Higgsfield's Mr. Higgs because it feeds into our full pipeline |
| 8 | **Auto-sequence video** — chain frames via Seedance `first-last-frame` mode to generate connected video sequence | Unique — nobody has automated continuity-chained video. Snapshot-to-next is 80% of this |
| 9 | **Workflow/pipeline builder** — visual canvas to chain AI steps | Post-market. Power-user feature |

### Deprioritized / Not needed

| # | Action | Decision |
|---|--------|----------|
| — | Script format import (.fdx/.fountain) | Low priority — most users paste text. Niche formats |
| — | Review/approval workflow | Keep simple — existing Clerk orgs collaboration is sufficient |
| — | Mobile app | B2B product — web-first is correct |
| — | Community/marketplace | Discord community works. Gallery sharing covers the use case |
| — | NLE export (Premiere XML / DaVinci EDL) | Future nice-to-have, not needed for launch |
| — | Retake (re-render video segment) | Blocked on Kie AI API support |

---

## 7. Feature Count Scorecard (updated 2026-05-02, session #32 — Visual Lock + Element Pipeline + Deletion Cleanup)

### Competitive Score (out of 100) — honest

| Platform | Score | Rationale |
|----------|:-----:|-----------|
| **Us** | **95** | Deepest all-in-one pipeline. Genre System (16 presets) + Format Redesign (12 content formats) + Element Forge (structured wizard, identity JSON) + custom elements with @mention prompt injection. **Visual Lock** (production continuity — vision-analyze element images, rewrite script to match, segment-based Haiku/Sonnet) is unique to us. **Full @mention pipeline** (inline injection, drag-and-drop badge reorder, @ElementName→@Image{n} substitution at generate time) gives character consistency LTX-style but deeper. 11 post-processing tools, Cinema Grade, AI Agent 22 tools, canvas+AI, music AI, camera system, multi-layer timeline with transitions/overlays/PiP/subtitles/audio export, style transfer, BG removal. Video editor doubles as ads builder. Robust file deletion with audit trail (defaultAI rule, soft vs hard delete) + daily orphan repair cron. Loses points: fewer models (15 vs 30+), no dedicated marketing studio automation, no social network, no 80+ apps breadth |
| Higgsfield | **88** | Cinema Studio 3.5 + 80+ apps + 30+ models + Marketing Studio + social network + native audio + SOUL 2.0. Most features overall. Loses points: no storyboard pipeline, weak timeline, no music generation, no script-to-image continuity sync |
| LTX Studio | 72 | Good pipeline vision, but own models only, no music/canvas AI, no post-processing depth |
| Zopia AI | 70 | Strongest autonomous agent, but zero post-processing, no canvas, no music, no camera control, beta only |
| ImagineArt | 58 | Broad AI + scale (30M users), zero project structure |
| Storyboarder.ai | 48 | Good planning, limited AI models |
| Artlist | 45 | Stock empire ($300M ARR), basic AI/planning |
| OpenArt | 40 | Custom training + community, no video/planning |
| Krock.io | 32 | Review/approval niche, no generation |
| Lovart | 25 | Design agent, different market |

**We now lead Higgsfield 95 vs 88.** Session #32 adds Visual Lock (production continuity — no competitor has this) and the full @mention pipeline with @Image{n} substitution at generate time. Genre + Format dual-axis system + Element Forge + AI Agent + style transfer + BG removal + video editor ads — we win 9 of 13 categories. Visual Lock is the first script-to-image continuity sync feature in this category, putting us ahead on production workflow depth.

### Category Breakdown (score out of 10) — honest

| Category | Us | Higgsfield 3.5 | Zopia | LTX | ImagineArt | Storyboarder |
|----------|:---:|:----------:|:-----:|:---:|:----------:|:------------:|
| Pre-Production & Planning | **10** | 6 | 7 | 8 | 1 | 8 |
| AI Generation (models) | 8 | **10** | 8 | 6 | 8 | 4 |
| Camera System | **10** | **10** | 2 | 8 | 2 | 7 |
| Editing & Canvas | **10** | 6 | 1 | 2 | 4 | 2 |
| Video Editor / Timeline | **10** | 4 | 4 | 6 | 0 | 0 |
| Post-Processing | **10** | 6 | 0 | 2 | 5 | 0 |
| Director's View & Continuity | **10** | 4 | 3 | 5 | 0 | 2 |
| AI Agent / Co-Director | **10** | 8 | **10** | 2 | 2 | 0 |
| Apps / Ecosystem Breadth | 3 | **10** | 2 | 3 | 7 | 2 |
| Marketing / Ads Tools | **5** | **9** | 0 | 0 | 3 | 0 |
| Music & Audio | **9** | 7 | 0 | 0 | 0 | 0 |
| Collaboration & Social | 7 | **9** | 5 | 7 | 6 | 1 |
| Pricing Competitiveness | **9** | 5 | 8 | 5 | 7 | 8 |

**Where we WIN (9 categories):** Pre-Production, Camera System, Editing & Canvas, Video Editor, Post-Processing, Director's View, AI Agent (tied with Zopia), Music & Audio, Pricing.
**Where Higgsfield WINS (3 categories):** AI Generation breadth, Apps ecosystem, Collaboration/Social.
**Where we're close (1 category):** Marketing/Ads (us 5, them 9 — capability exists + genre/format presets, they have dedicated automation).
**Where Zopia WINS (1 category):** AI Agent autonomy (tied with us on score).

### Head-to-Head — HONEST (updated session #32)

| vs Competitor | They have, we don't | We have, they don't | Net | Who wins what |
|---|:---:|:---:|:---:|---|
| vs Higgsfield 3.5 | 3 (native audio sync, 80+ apps, social network) | 14 (storyboard pipeline, multi-layer timeline + transitions + overlays + PiP + audio export, canvas draw, music AI, Cinema Grade 12 stocks, Director's View, Agent Mode 22 tools, element @mentions with drag-and-drop reorder + @Image{n} substitution, **Visual Lock production continuity**, style transfer, scrolling text, genre+format dual-axis system, robust deletion architecture with audit trail) | **Us +11** | We win depth, they win breadth. Visual Lock is unique to us — no competitor has script-to-image continuity sync |
| vs Zopia | 2 (full autonomy, auto self-review) | 21+ (post-processing, canvas, camera, music, Cinema Grade, multi-layer timeline + transitions, style transfer, BG removal, overlays, genre system, format presets, Visual Lock, @mention pipeline) | **Us +19** | We win everything except autonomy |
| vs LTX Studio | 1 (Retake) | 14+ | **Us +13** | We win convincingly. LTX has element tagging but no Visual Lock continuity sync |
| vs Storyboarder | 0 | 19+ | **Us +19** | Total dominance |
| vs ImagineArt | 0 | Pipeline structure | **Us +9** | Different league |

### What's Holding Us Back — honest gaps to close

| Gap | Impact | Fix | Effort |
|-----|:------:|-----|--------|
| No dedicated Marketing Studio automation | -1 | Ad templates (preset layer arrangements for Product Showcase, Before/After, Testimonial, Countdown). Score 94 → **95** | Small |
| No 80+ apps ecosystem | -2 | Not buildable short-term. Focus on core pipeline depth instead | Long-term |
| Fewer models (15 vs 30+) | -1 | Add models via Kie AI as they become available. Kling O3, Wan 2.6, Sora 2 etc | Small per model |
| No social network/community | -1 | Not needed for B2B. Discord community + gallery sharing covers this | Not building |
| No native audio sync | -1 | Model-architecture feature, can't replicate | Can't fix |

### With Ad Templates (planned — tiny effort)

If we add pre-built ad template presets, scores shift:

| Category | Current | After Templates | Higgsfield |
|----------|:-------:|:---------:|:----------:|
| Marketing / Ads Tools | 5 | **6-7** | 9 |
| **Overall Score** | **95** | **96** | 88 |

Core ads capability already exists (text overlays with BG = CTA, image overlays = logos, aspect ratios = platform formats, transitions + music = ad polish, genre presets for ad mood, format presets for ad pacing). Templates are just preset layer arrangements — "Product Showcase" pre-populates a product clip + text CTA + logo overlay.

### What's Holding Us Back from 100/100

| Missing | Impact | Buildable? | Status |
|---------|:------:|:----------:|--------|
| ~~Soul Cinema proprietary model~~ | ~~-2~~ | ~~No~~ | **CLOSED** — Cinema Grade: 12 film stock presets |
| Native audio sync | -1 | No | Model-architecture feature, no API equivalent |
| ~~Physics-aware generation~~ | ~~-1~~ | ~~No~~ | **CLOSED** — GPT Image 2 + Seedance/Kling handle physics natively |
| ~~Cinematic reasoning~~ | ~~-1~~ | ~~No~~ | **CLOSED** — AI Director vision + GPT Image 2 contextual understanding |
| ~~AI Co-Director~~ | ~~-2~~ | ~~Yes~~ | **CLOSED** — Director + Agent Mode (22 tools, plan approval, vision) |
| ~~Style Transfer / BG Removal~~ | ~~-1~~ | ~~Yes~~ | **CLOSED** — Style Transfer + Remove BG in Cinema Studio |
| ~~Marketing / Ads tools~~ | ~~-3~~ | ~~Yes~~ | **PARTIALLY CLOSED** — Video editor already does ads (text overlays+BG=CTA, image overlays=logos, aspect ratios=formats, transitions+music). Score 0→4. Only missing: dedicated automation + templates |
| Full autonomous production (Zopia-style) | -1 | **Yes** | Agent Mode exists but requires plan approval. Could add "auto mode" toggle |
| Agent Mode billing (Stripe seats) | -1 | **Yes** | Planned — $120/seat/month |
| Auto-sequence video | -1 | **Yes** | 80% done (snapshot-to-next exists) |

**Pricing gap RESOLVED** — hot model multiplier (0.625) makes GPT Image 2 at $0.04/gen 48% cheaper than Higgsfield's $0.078/gen. See `plan_pricing_strategy.md`.

**Session history:**
- **2026-05-01 #30:** Genre System (16 presets with mood/lighting/tone prompts, custom genres) + Format Redesign (12 content formats with framing/pacing/camera). Dual-axis system: genre controls aesthetics, format controls structure. Score 91 → **94**.
- **2026-04-30 #29:** Character thumbnail regeneration (76+ ultra-realistic 4K). Custom Element Builder (logo/style/other, @mention prompt injection). Score 90 → **91**.
- **2026-04-30 #27-28:** Script Builder redesign, Smart Build modes, Element @mention system, Convex bandwidth optimization (2.38GB→~1.0GB).
- **2026-04-29 #25-26:** Element Forge character builder (Simple/Advanced, reference photos, generate tab, variant system). Logs badges, soft-delete.
- **2026-04-28 #18-24:** Element Forge architecture, thumbnail system (280+ thumbs), toolbar redesign, GPT Image 2 pipeline, gallery, pricing, feature gating, subscription cycling guard.
- **2026-04-28 #17:** Video Editor major overhaul — overlay layer system, 5 transition types, scrolling text, aspect-ratio lock. Score 86 → **90**.
- **2026-04-27 #14-16:** AI Agent Mode (22 tools), support chatbot, AI Analyze, security hardening, code quality.
- **2026-04-26 #8-12:** Cinema Studio, AI Director, audio export, Zopia analysis, Cinema Grade.
- **2026-04-25 #1-7:** Camera system, pricing, FAQ, PDF export, color palette, landing page, style presets.
- **2026-04-24:** Director's View (11 features), blend modes, subtitles, comparison doc created.

---

## 8. What Was Built (2026-04-23 Session)

16 features implemented in one session:

| # | Feature | Category |
|---|---------|----------|
| 1 | StoryboardStrip filmstrip (82px, thumbnails, badges, status dots) | Director's View |
| 2 | Scene grouping with dividers (S1, S2 labels) | Director's View |
| 3 | Snapshot to self/next frame (continuity bridge) | Director's View |
| 4 | Video hover preview (500ms delay, muted autoplay) | Director's View |
| 5 | Video Preview snapshot from Generated Panel | Director's View |
| 6 | Right-click context menu (status/notes/duplicate/delete) | Director's View |
| 7 | Drag reorder frames in filmstrip | Director's View |
| 8 | Animatic playback (image + video, loop, auto-advance) | Director's View |
| 9 | Generated Outputs Row (48x36 thumbs, video elements) | Director's View |
| 10 | Comparison Mode (prev/current/next side-by-side) | Director's View |
| 11 | Director's Notes (sticky note indicator, context menu edit) | Director's View |
| 12 | Blend Modes in VideoEditor (8 modes + opacity, preview + export) | VideoEditor |
| 13 | Subtitle Track (timeline + preview overlay + export) | VideoEditor |
| 14 | Shared VideoPreviewDialog (reusable, snapshot buttons) | Shared Components |
| 15 | Aspect ratio grid popup (NLE-style, matches toolbar) | UI Polish |
| 16 | Frame Info Dialog redesign (cinema-grade readouts, bold typography) | UI Polish |

**Also fixed:**
- DarkModal updated to CSS variables
- VideoImageAIPanel tab fonts bumped to font-semibold for readability
- Canvas `backgroundImage` reset on shot navigation (comparison click fix)
- Video output thumbnails use `<video>` element instead of broken `<img>`
- snapshotUtils.ts shared utility (captureVideoFrame, captureImageFrame)

---

## 9. Competitor Key Features Deep Dive

Detailed analysis of what competitors have and how we compare.

### LTX Studio — Feature-by-Feature vs Us

| Their Feature | How it works | Do we have it? | Our equivalent / gap |
|---|---|---|---|
| **Elements** | Characters, Objects, Locations, Other — tag with `@Name` in prompts for consistency | **YES** | `storyboard_elements` + `linkedElements` + prompt @mentions — same concept |
| **Script-to-video** | Upload script → auto-generate scenes + storyboard → generate video | **YES** | `parseScriptScenes()` + `buildStoryboard` mutation + Seedance 2.0 fast |
| **Camera Motion Presets** | One-click dolly, crane, pan, tilt, handheld, static — no typing needed | **Partial** (capability YES, UI NO) | Seedance 2.0 + Kling already understand motion descriptions in prompts. Just need a dropdown in toolbar: Static, Dolly In/Out, Crane Up/Down, Pan L/R, Orbit, Tracking, Handheld → appends text to prompt. **Small effort — add buttons only** |
| **Retake** | Select 2-16s segment of video → regenerate just that part, model matches surrounding frames | **No** | No way to re-render a middle segment. Would need API support from Kie AI |
| **Storyboard Generator** | Script → auto-divide into scenes/shots, extract characters as Elements, choose image model + aspect ratio | **YES** | Our `buildStoryboard` + n8n pipeline does the same |
| **Timeline Editor** | Sequence clips, test continuity, evaluate pacing | **YES** | Our VideoEditor with multi-track timeline, trim, blend modes, subtitles — more capable |
| **Keyframe Animation** | Set keyframes for camera crane, orbit, tracking per frame | **Not needed** | Per-keyframe camera control only matters for real 3D rendering. AI video models (Seedance, Kling, etc.) handle camera motion through prompt text. Our Camera Motion Presets + 3D Angle Picker achieve the same result |
| **Audio-to-video** | Generate video driven by audio input | **No** | Could be added via Seedance 2.0 multimodal mode (accepts audio refs) |
| **Video-to-video** | Transform existing video with AI | **No** | Not implemented yet |

**Summary: LTX has 1 feature we truly lack (Retake — re-render video segment, depends on API support). Keyframe animation is not needed for AI video models. We have 6 features they lack (music AI, canvas+AI, blend modes, subtitles, real-time sync, Director's View).**

### Higgsfield — Feature-by-Feature vs Us (Honest Reassessment 2026-04-24)

Higgsfield is our most formidable competitor. Cinema Studio 3.5 is a deeply integrated filmmaking platform with proprietary model-level intelligence. After thorough research, here is the honest gap analysis:

#### What we MATCH or BEAT

| Their Feature | How it works | Our equivalent |
|---|---|---|
| **Virtual Camera Physics** | Camera body, lens, focal length, DOF simulation | **YES** — Camera Studio (9 cameras, 6 lenses, 8 focal lengths, 6 apertures) |
| **Angles 2.0** | 3D wireframe globe camera angle picker | **YES** — CameraAnglePicker (same UX, wireframe globe, rotation/tilt/zoom) |
| **Camera Movements** | Dolly, pan, tilt, crane + stack up to 3 simultaneously | **YES** — 15 motion presets. Seedance supports 3 simultaneous movements via prompt text |
| **Soul ID** | Persistent character identity across generations | **YES** — Element library with character type + prompt @mentions |
| **30+ AI Models** | Sora 2, Kling 3.0, Veo 3.1, Seedance 2.0, GPT Image 2, etc. | **YES** — 15+ models, same key ones |
| **Lipsync Studio** | Character image + audio → talking head video | **YES** — Seedance 2.0 lipsync mode |
| **Face Swap** | Replace faces or characters in video | **Partial** — Canvas inpaint covers this (draw over face → AI replaces) |
| **Multi-shot generation** | Feed reference images → multi-angle/multi-cut video | **YES** — Seedance UGC (6 images) + Showcase (9 images) modes |

#### What they have that we DON'T

| Their Feature | What it does | Can we build it? | Effort |
|---|---|---|---|
| **Mr. Higgs AI Co-Director** | AI understands project context, auto-breaks scenes into shots, sets camera/style/prompts in real-time | **Yes** — Claude Agent with tool use. 80% infrastructure exists | Medium |
| **Genre Presets** (Action, Horror, Comedy, Noir, Drama, Epic, Suspense) | Genre changes pacing, motion energy, lighting behavior, and camera logic — not just a style filter, it changes how the entire scene is constructed and moves | **Yes** — genre-specific prompt templates that describe pacing/energy/lighting behavior. Append to generation prompt like style presets | Small |
| **Speed Ramp Presets** (8 types: Linear, Flash In, Flash Out, Slow-mo, Bullet Time, Impact, Ramp Up, Auto) | Per-shot timing and pacing control within the video | **Partial** — can describe in prompt ("slow motion cinematic", "bullet time freeze") but no precise frame-level control. AI models interpret timing from text | Small |
| **Soul Cast** (Character Builder) | Full character creator — genre, era, physique, backstory, personality, 14 genre templates. Deeper than simple reference images | **Yes** — extend our Element system with more fields (backstory, personality, era, physique). UI + schema change | Medium |
| ~~**Soul HEX** (Color Control)~~ | ~~Precise hex color values applied across all generations for consistent color grading~~ | **DONE** — ColorPalettePicker: eyedropper from reference image, 6 color slots, save/load presets, auto-append to prompts | **DONE** |
| **Soul Cinema** (Proprietary Image Model) | Cinematic image model with natural grain, film textures, compositions like real film stills. Highest quality output | **No** — proprietary model. We use third-party models. Their visual quality may be superior for cinematic output | Can't replicate |
| **Native Audio Sync** | Generates SFX, speech, and music synchronized to video content during generation — collapses entire post-production audio pipeline | **No** — we have separate music AI + TTS but not synced to video at generation time. This is model-level capability | Can't replicate |
| **Physics-Aware Generation** | Objects interact realistically — gravity, fabric movement, collisions, environmental interactions | **No** — model-level intelligence. Seedance/Kling have some physics but not at Higgsfield's claimed level | Can't replicate |
| **Cinematic Reasoning** | Model understands story intent from reference images alone — knows what kind of scene you want from visual context | **No** — model-level intelligence. We rely on explicit prompt text | Can't replicate |
| **Soul Photodump** | One-click 15-26 photos of same character in different settings/outfits/moods. Viral social media format | **Partial** — could build as batch generation with character Element + varied scene prompts | Medium |
| **Marketing Studio** | Generate multiple ad formats (social, display, video) from one product in one click | **No** — not our core focus, but Seedance UGC/Showcase overlaps partially | Low priority |

#### Honest categorization

**Things we can match through prompt engineering + UI (buildable):**
- Genre presets, speed ramps, camera stacking, ~~Soul HEX color control~~ (DONE), character builder depth, photodump batch

**Things we CANNOT replicate (model-level proprietary):**
- Soul Cinema image quality, native audio sync, physics-aware generation, cinematic reasoning

**Summary (updated session #17): Higgsfield has 4 remaining features we don't have — all are either model-level proprietary (native audio sync) or breadth plays (80+ apps, Marketing Studio, social network). AI co-director is CLOSED (Director + Agent Mode, 22 tools). Speed ramps CLOSED (SpeedRampEditor). Soul HEX CLOSED (ColorPalettePicker). Physics/cinematic reasoning CLOSED (GPT Image 2 handles natively). We now have 10+ features they lack (storyboard pipeline, multi-layer timeline with transitions + overlays + subtitles + audio export, canvas draw, music AI, Cinema Grade, Director's View, Agent Mode 22 tools, element @mentions, style transfer, scrolling text). Score: TIED 88-88.**

### Storyboarder.ai — Feature-by-Feature vs Us

| Their Feature | How it works | Do we have it? | Our equivalent / gap |
|---|---|---|---|
| **3D Camera Control** | From one image, orbit/pan/tilt/zoom camera in 3D space — bird's eye, low angle, dutch tilt, OTS | **YES** | **DONE** — CameraAnglePicker: wireframe globe with 3D perspective, rotation/tilt/zoom sliders, 12 presets, prompt auto-append. Different approach (prompt-based vs 3D reconstruction) but same UX result |
| **Script Format Import** | Accept PDF, FDX (Final Draft), Fountain, Word, plain text | **Partial** | We have plain text parser. **Missing: .fdx/.fountain file upload + extraction** |
| **Visual Consistency** | Character appearance maintained across scenes | **YES** | Element library + prompt @mentions |
| **Sketch-to-image** | Rough sketch → refined AI image | **Partial** | Our canvas draw → AI inpaint is similar but different workflow |
| **Unlimited Generation** | No credit system, generate as much as you want | **No** | We use credits. Different business model — not a bug |
| **Pitch Deck Creation** | Export storyboard as professional pitch deck with templates | **No** | We export as PDF/images but no pitch deck templates |

**Summary: Storyboarder has 0 features we truly lack (3D camera gap now closed). We have 10+ features they lack (multi-model AI, video editor, music, canvas+AI, Director's View, blend modes, subtitles, etc.).**

### What we should build to close ALL major gaps

| Gap | Competitor | Our approach | Status |
|---|---|---|---|
| **3D Camera Angle Picker** | Storyboarder, LTX, Higgsfield | Wireframe globe, rotation/tilt/zoom, 12 presets, prompt auto-append | **DONE** |
| **Camera Motion Presets** | LTX, Higgsfield | 15 presets + Seedance 3-movement stacking via prompt | **DONE** |
| **Camera Style Presets (Camera Studio)** | Higgsfield | 9 cameras, 6 lenses, 8 focal lengths, 6 apertures, prompt auto-append | **DONE** |
| **Face/Character Swap** | Higgsfield | Covered by canvas inpaint — draw over face, describe new face, AI replaces | **Covered** |
| **Keyframe Animation** | LTX | Not needed — AI models handle motion via prompt text, not keyframes | **Not needed** |
| **Script Format Import** | Storyboarder, LTX | Low priority — most users paste text directly. `.fdx`/`.fountain` are niche | **Low priority** |
| **Batch Frame Generation / Photodump** | Higgsfield | "Generate All" button + dialog with model picker, resolution, elements toggle, credit summary. Sequential with 1s delay | **DONE** |
| **Retake (re-render segment)** | LTX | Select video segment → regenerate. Depends on Kie AI API support | **Blocked on API** |
| ~~**AI Co-Director (Claude Agent)**~~ | ~~Higgsfield (Mr. Higgs)~~ | Director + Agent Mode: 22 tools, plan approval, chat persistence, reference images, vision | **DONE** (Session #14) |
| **Content Format Presets** | — | 12 format types (Film, Documentary, YouTube, Reel, Commercial, Music Video, Vlog, Tutorial, Presentation, Podcast, Product Demo, Cinematic Ad) with auto-append | **DONE** (replaces Genre Presets — formats control framing/pacing, not visual aesthetics) |
| ~~**Speed Ramp Presets**~~ | ~~Higgsfield~~ | SpeedRampEditor: 8 presets (Linear, Flash In, Flash Out, Slow-mo, Bullet Time, Impact, Ramp Up, Auto) with visual curve editor, prompt auto-append | **DONE** |
| ~~**Soul HEX Color Control**~~ | ~~Higgsfield~~ | ColorPalettePicker: eyedropper from reference image canvas (6 hex colors), save/load presets (`storyboard_presets` category="color-palette"), auto-append to generation prompts. Image proxy API for CORS bypass. AddImageMenu (R2/Capture/Generated) | **DONE** |
| ~~**Soul Cast Character Builder**~~ | ~~Higgsfield~~ | **Not needed** — our Element system already covers this. Elements have name, description, thumbnailUrl, referenceUrls, @mentions in prompts, linked per frame, batch generation with refs. Soul Cast's backstory/personality/era fields don't affect image generation (models only see prompt + reference images). Face consistency is model-level, not solvable by adding form fields | **Not needed** |
| **AI Analyze (Image/Video/Audio)** | Lovart, Storyboarder | ANALYZE tab in VideoImageAIPanel. OpenRouter → Gemini Flash (images, 1cr) + Gemini Pro (video 3cr, audio 1cr). Shot-by-shot video timestamps, lyrics extraction, speech transcription | **DONE** |
| **Presets System** | — | `storyboard_presets` table for saving/loading camera studio, angle, style, note settings. Preset Manager dialog. Cross-project, workspace-scoped | **DONE** |
| **Soul Cinema quality** | Higgsfield | Proprietary model — cannot replicate | **Can't build** |
| **Native Audio Sync** | Higgsfield | Model-level synced SFX/speech/music during generation | **Can't build** |
| **Physics-Aware Generation** | Higgsfield | Model-level realistic object interactions | **Can't build** |
| **Cinematic Reasoning** | Higgsfield | Model-level story intent understanding from images | **Can't build** |

**Status: 15 DONE/covered/not-needed. 0 buildable TODOs remaining. 1 blocked on API (retake). 1 model-level proprietary (native audio sync). 1 deprioritized (script import).**

### Zopia AI — Feature-by-Feature vs Us (Added 2026-04-27)

**Zopia is a NEW highest-threat competitor.** They're building an autonomous Director Agent that produces finished short dramas from a single prompt. Different philosophy from us: they're automation-first (fire-and-forget), we're control-first (creative tools with AI assist).

#### What Zopia has that we DON'T

| Their Feature | What it does | Can we match? | Impact |
|---|---|---|---|
| **End-to-end autonomous production** | Single prompt → finished short drama (script, storyboard, video, editing, export) with zero manual steps | **Partially** — our Agent Mode does multi-step execution with plan approval, but not fully "unmanned 24h production" | High |
| **Automated self-review** | Agent flags visual inconsistencies (costume shifts, prop changes) automatically before export | **Yes** — AI Director vision (Phase 4) can do this. Need to add as explicit tool | Small |
| **Multi-agent coordination** | Specialized agents (scriptwriter, director, storyboard artist, editor, reviewer) work in sequence | **Partially** — our Agent is one Claude instance with 22 tools. Not multi-agent but functionally equivalent | Medium |
| **Native audio-visual sync in edit** | Auto-syncs transitions, music, dubbing in timeline during autonomous production | **No** — our timeline is manual. We have music AI + TTS but user composes manually | Medium |
| **Desktop app** | Windows + macOS native app alongside web | **No** — web-only (correct for B2B, but Zopia captures desktop preference) | Low |

#### What WE have that Zopia DOESN'T

| Our Feature | Impact | Why it matters |
|---|---|---|
| **11 post-processing tools** (Enhance, Relight, Cinema Grade, Remove BG, Reframe, Style Transfer, Color Grade, Upscale x2, Grid Gen, Inpaint) | **Critical** — Zopia has ZERO post-processing. Generate and done | Professional quality requires refinement |
| **Canvas draw + AI inpaint** (brush, shapes, text, area edit, 10+ models) | **Critical** — Zopia has no manual editing at all | Creative control over AI output |
| **Cinema Grade (12 film stocks)** | **High** — Zopia has no color science tools | Professional cinematic look |
| **Camera system** (3D angle picker, Camera Studio 9 bodies/6 lenses, 15 motion presets, speed ramps) | **High** — Zopia uses AI-decided camera only | Cinematographers want control |
| **Music AI + TTS + Personas** | **High** — Zopia has no audio generation at all (their biggest weakness) | Complete production requires audio |
| **Multi-track video editor** (subtitles, blend modes, audio tracks, AAC export) | **High** — Zopia has basic clip reorder only | Post-production editing |
| **Color Palette Picker** (eyedropper, 6 slots, presets) | **Medium** — Zopia has no color tools | Visual consistency control |
| **Element library with @mentions** | **Medium** — Zopia has character refs but no structured library | Reusable across projects |
| **Director's View** (filmstrip, comparison, animatic, notes) | **Medium** — Zopia has basic storyboard view | Professional pre-production oversight |
| **Presets system** (save/load camera, style, notes across projects) | **Medium** — Zopia has no presets | Workflow efficiency |
| **Real-time Convex sync** (no save button) | **Medium** — Zopia unknown | Collaboration UX |
| **Credit-based transparent pricing** | **Medium** — Zopia is free beta now but pricing TBD | Business sustainability |
| **Batch generation with model choice** | **Low** — Zopia auto-picks models | Power user flexibility |

#### Honest assessment

**Zopia's advantage: Speed to finished output.** One prompt → finished short drama. Our Agent Mode requires plan approval and step-by-step oversight. Zopia is "hire a production team" while we're "work with a production team."

**Our advantage: Creative control + quality.** Zopia produces draft-quality output with no refinement tools. We have 11 post-processing tools, canvas editing, camera control, music AI, and professional timeline. Our output is higher quality because users can refine.

**Different markets:** Zopia targets solo creators who want finished content fast (short-drama YouTube channels, social media). We target filmmakers, agencies, and studios who want creative control over professional output.

**Key risk:** If Zopia adds post-processing tools + music AI, they become very dangerous. Watch closely.

**Key opportunity:** Zopia users who outgrow "one-click" quality will upgrade to us for creative control. Position as the "graduate" platform.

---

### AI Co-Director — Implementation Plan

Our version of Higgsfield's "Mr. Higgs". A **Claude-powered chatbot with project context and tool use** that acts as an AI director.

**How it works:**
```
User: "I want a 30-second car commercial for a red VW Arteon,
       cinematic, rainy night, sexy model presenter"

AI Co-Director (Claude):
  → Reads project context (existing elements, style, frames)
  → Generates structured script with 6 shots:
    Shot 1: Wide establishing — rainy city street, neon reflections (3s)
    Shot 2: Low angle — car headlights cutting through rain (4s)
    Shot 3: Macro close-up — front grille, water droplets (3s)
    Shot 4: Tracking — model walks toward car, umbrella, red dress (5s)
    Shot 5: Interior — model sitting, dashboard glow (5s)
    Shot 6: Drone pull-back — car drives away, city lights (5s)
  → Sets camera motion per shot (dolly, low angle, macro, tracking, etc.)
  → Writes image/video generation prompts per shot
  → Calls buildStoryboard mutation → frames appear in UI
  → Optionally triggers batch image generation
```

**What already exists (80% built):**

| Piece | Status | File |
|---|---|---|
| Chatbot infrastructure | **EXISTS** | `convex/schema.ts` — `support_chat_sessions` + `support_chat_messages` |
| Claude API integration | **EXISTS** | Already used for support chat (Haiku) |
| Script parser | **EXISTS** | `lib/storyboard/sceneParser.ts` — `parseScriptScenes()` |
| Storyboard builder | **EXISTS** | `convex/storyboard/storyboardItems.ts` — `buildStoryboard` mutation |
| Element creation | **EXISTS** | Characters/environments auto-created from script |
| Project context | **EXISTS** | Project metadata, scenes, elements all queryable from Convex |
| n8n build pipeline | **EXISTS** | `app/api/n8n-webhook/route.ts` — full build orchestration |
| Batch generation | **Planned** | Queue AI generation for all frames |

**What needs to be built (the 20%):**

| Component | Description | Effort |
|---|---|---|
| Director Chat UI | Chat panel in SceneEditor or workspace — input box + message history | Small |
| Claude system prompt | Project-aware prompt: inject current elements, style, existing shots as context | Small |
| Tool definitions | Claude tool_use functions mapping to Convex mutations: `create_shots`, `set_camera`, `write_prompts`, `generate_images` | Medium |
| Action execution | When Claude returns tool calls, execute them against Convex mutations | Medium |

**Architecture:**
```
Director Chat UI (React)
    ↓ user message
Claude API (tool_use mode)
    ↓ reads project context (elements, style, shots)
    ↓ generates structured response + tool calls
Tool Executor
    ├─ create_shots → buildStoryboard mutation
    ├─ set_camera → update shot prompts with camera motion
    ├─ write_prompts → update imagePrompt/videoPrompt per shot
    ├─ generate_all → trigger batch image generation
    └─ create_elements → create characters/environments
    ↓
Convex (real-time)
    ↓ instant UI update
StoryboardStrip + Canvas show new frames immediately
```

**Why Claude (Anthropic) is the right choice:**
- Tool use / function calling built-in — Claude can call your mutations directly
- Large context window — can hold entire project (script + elements + shots) in context
- Already integrated in your codebase for support chat
- Can use Claude Haiku for speed (chat responses) or Sonnet for quality (script generation)

**Why our AI Co-Director beats Higgsfield's Mr. Higgs:**

| Advantage | Mr. Higgs (Higgsfield) | Our AI Co-Director (Claude) |
|---|---|---|
| **AI models** | Only Higgsfield's own models | **15+ models** — Claude picks best model per shot (Seedance 2, Kling 3, GPT Image, Nano Banana, Veo 3, etc.) |
| **Pipeline scope** | Generates video and stops | Feeds into **entire chain**: storyboard → canvas editing → AI inpaint → multi-track timeline → subtitles → blend modes → music → export. Director's output is the START, not the end |
| **Real-time sync** | No real-time database | **Convex** — when Claude generates 6 shots, they appear in the filmstrip instantly. No refresh, no loading |
| **Element references** | Soul ID for characters only | **Element @mentions** — co-director says "Shot 4: @ModelGirl walks toward @RedArteon" and generation uses correct reference images from structured element library |
| **Music AI** | No music generation | Co-director can also generate soundtrack: "create moody electronic, 30s, rainy city vibe" via integrated music AI |
| **Post-generation editing** | Generate and done — no editing layer | **Canvas draw + AI inpaint** after generation. Draw on frames, area-edit, refine. Mr. Higgs can't do this |
| **Continuity checking** | Per-shot control, no continuity strip | **Director's View** — comparison mode, animatic playback, snapshot-to-next-frame. Check continuity immediately after generation |

**In short:** Mr. Higgs is an AI director for **generation only**. Ours is an AI director for the **entire production pipeline** — from script to export.

---

## 10. Key Takeaway (updated 2026-05-02, session #32 — LEADING Higgsfield 95 vs 88)

**Our unique moat is the all-in-one pipeline + professional creative control.** Every competitor excels at one or two slices:

- Zopia AI = autonomous Director Agent + character consistency (but zero post-processing, no audio, no canvas)
- LTX Studio = script-to-video + elements consistency
- Higgsfield = AI models (30+) + Cinema Studio + character persistence
- Storyboarder.ai = planning + 3D camera
- ImagineArt = generation + workflow builder
- Artlist = stock + editing
- Krock.io = review + NLE integrations
- OpenArt = custom training + community
- Lovart = design agent

We are the **only tool where a filmmaker can set genre mood (16 presets) + content format (12 presets) as independent axes, chat with an AI Director (22 tools, vision-enabled), have an Agent autonomously build multi-frame stories, post-process with Cinema Grade (12 film stocks) and 11 Cinema Studio tools, edit on canvas with AI inpainting (10+ models), control camera angles with a 3D sphere picker + virtual camera studio + 15 motion presets, assemble in a multi-layer timeline with transitions (5 types) + overlays + subtitles + blend modes + scrolling text + audio export, generate music with custom personas, use the Director's View filmstrip for continuity — all without leaving one web app.**

### Competitor gap summary (updated 2026-05-02 session #32 — LEADING Higgsfield 95 vs 88)

| Competitor | They have, we don't | We have, they don't | Net | Reality check |
|---|---|---|---|---|
| **Higgsfield 3.5** | 3 (native audio sync, 80+ apps, social network) | 14 (storyboard pipeline, multi-layer timeline + transitions + overlays + audio export, canvas draw, music AI generation, Cinema Grade 12 stocks, Director's View 11 features, Agent Mode 22 tools, **Visual Lock production continuity**, element @mention pipeline w/ drag-and-drop reorder + @Image{n} substitution, style transfer, scrolling text, genre+format dual-axis, robust deletion w/ audit trail) | **Us +11** | They win breadth, we win depth. Visual Lock is unique to us — no competitor has script-to-image continuity sync. **Score: Us 95, Higgsfield 88** |
| **Zopia AI** | 2 (full unmanned autonomy, auto self-review) | 21+ (11 post-processing tools, canvas, music AI, camera system, Cinema Grade, multi-layer timeline + transitions, style transfer, BG removal, overlays, color palette, presets, genre+format system, Visual Lock, @mention pipeline) | **Us +19** | We crush them on everything except fire-and-forget |
| **LTX Studio** | 1 (Retake — blocked on API) | 14+ (AI Director/Agent, music AI, canvas+AI, Cinema Studio, Cinema Grade, real-time sync, AI Analyzer, presets, transitions, overlays, genre+format, Visual Lock, deeper element @mention pipeline) | **Us +13** | Clear win. LTX has element tagging but no Visual Lock continuity sync |
| **Storyboarder.ai** | 0 | 19+ | **Us +19** | Total dominance |
| **ImagineArt** | 0 | Pipeline structure | **Us +9** | Different league |

### Key threats (honest — post session #32)

- **We now LEAD Higgsfield 95 vs 88.** Session #32 added Visual Lock (production continuity — script-to-image alignment via vision analysis + targeted rewrite) and the full @mention pipeline (inline injection, drag-and-drop reorder, @ElementName→@Image{n} substitution at generate time). No competitor has Visual Lock. We win 9 of 13 categories. The combined moat: Cinema Studio depth + Director/Agent automation + production-pipeline continuity (Visual Lock + smart deletion architecture w/ audit trail).
- **Zopia AI** is the wildcard. Free autonomous agent capturing early market. Zero post-processing or audio is their fatal weakness. **Key risk:** if they add tools. **Key opportunity:** their users graduate to us.
- **Higgsfield pricing:** RESOLVED. GPT Image 2 at $0.04/gen is 48% cheaper than their $0.078/gen.
- **LTX Studio** is closest pipeline competitor but lacks AI Director/Agent, music AI, canvas+AI, Cinema Studio, Cinema Grade, transitions, overlays, genre+format system.
- **Our pricing advantages:** Free tier (Higgsfield $5), credit top-ups ($10 one-time), credits never expire, multi-seat included, transparent per-generation cost.

### Path to #1: Ad Templates (PLANNED — small effort)

**Ad templates push Marketing/Ads from 5 → 6-7. Overall 95 → 96.** Most infrastructure already exists:

| Feature | Effort | Existing infrastructure |
|---------|--------|----------------------|
| Social format presets (9:16 TikTok, 1:1 IG, 16:9 YT) | **DONE** | Aspect ratio selector + Format Presets (Reel/TikTok, YouTube, Commercial, Cinematic Ad) |
| Text overlay with CTA templates ("Shop Now", "Learn More") | **Small** | Overlay layer system + text layers already exist (Session #17) |
| ~~Logo/watermark placement (upload, pin to corner)~~ | **DONE** | Image overlay layer — add image, resize, drag to corner (Session #17) |
| Music bed from AI library | Small | Music AI + timeline audio exists |
| Ad templates (Product Showcase, Before/After, Testimonial, Countdown, UGC-style) | Medium | Preset system + genre/format presets exist |
| Platform-specific export ("Export as TikTok Ad 9:16 15s") | Small | WebCodecs export exists |

**Why this works better than Higgsfield's approach:** They built Marketing Studio as a separate product. Our ads builder lives inside the same video editor users already know — no context switch, no separate workflow. Create a storyboard, pick Commercial genre + Cinematic Ad format, generate with AI, Cinema Grade it, add CTA text + logo, export as TikTok ad. One pipeline.

### Why $120/seat Agent is justified

| | Zopia (free) | Higgsfield ($39-129/mo) | Our Agent ($120/seat/month) |
|---|---|---|---|
| **Agent autonomy** | Full fire-and-forget | Mr. Higgs advisory | 22 tools, plan approval, autonomous execution |
| **Post-processing** | 0 tools | ~5 tools | **11 tools + Cinema Grade** |
| **Music & audio** | None | TTS only | **Music AI + TTS + Personas** |
| **Ads creation** | None | Marketing Studio (URL→ad) | **PLANNED** — integrated in video editor |
| **Timeline** | Basic clip reorder | Per-shot control | **Multi-layer + transitions + overlays + PiP + subtitles + blend + scrolling text + audio export** |
| **Target** | Solo creators | Creators + marketers | **Agencies + studios with paying clients** |
| **Business model** | Free (VC burn) | Subscription + credits | Seat ($120) + credits (19%+ margin) |

**The $120 justification:** Our users bill clients $1,000-10,000+ per project. $120/seat for an AI production team member that generates, post-processes with Cinema Grade, creates TikTok ads, and exports client-ready video is a **no-brainer ROI**. Zopia gives a rough draft. Higgsfield gives generation breadth. We give the **complete professional production pipeline**.

**Positioning:** "Higgsfield for breadth. Zopia for speed. **Storytica for professional production.**"

---

## 12a. Platform Valuation Assessment (2026-04-28)

### Technical Asset Summary

| Asset | Scope | Estimated rebuild cost (USD) |
|-------|-------|:----------------------------:|
| SaaS infrastructure (auth, billing, multi-tenant, admin, email, support) | Clerk + Stripe + Convex + 30+ tables | $50,000-100,000 |
| Storyboard Studio (frame/cinema/director's view, canvas, elements) | Core product — 20+ components | $80,000-150,000 |
| AI integration layer (15+ models, credit system, callbacks, pricing) | Kie AI + OpenRouter + generation pipeline | $30,000-60,000 |
| Video Editor (multi-layer timeline, transitions, overlays, PiP, audio export) | WebCodecs + canvas rendering | $40,000-80,000 |
| AI Director + Agent Mode (22 tools, chat, plan approval, vision) | Claude API + tool dispatch + persistence | $20,000-40,000 |
| Cinema Studio (11 post-processing tools, Cinema Grade) | GPT Image 2 + Recraft + Ideogram pipelines | $20,000-40,000 |
| Camera system (3D angle picker, virtual camera, 15 motion presets) | 3 specialized components | $15,000-25,000 |
| Support chatbot (DeepSeek, tools, FAQ, guardrails) | Full conversational AI support | $10,000-20,000 |
| **Total rebuild cost** | **3,000-5,000+ dev hours** | **$265,000-515,000** |

### Valuation Context

| Metric | Value | Notes |
|--------|-------|-------|
| Current round | 2,000,000 MYR (~$430K USD) | Friends & family, 3% sold at 20K MYR/1% |
| Cost-to-rebuild | $265K-515K USD | Just labor — excludes architecture decisions, AI expertise, market research |
| Competitive score | 88/100 (tied #1) | Against funded competitors (Artlist $300M ARR, Higgsfield VC-backed) |
| Market | AI video production tools | Multi-billion dollar TAM, explosive growth |

### Valuation by stage

| Stage | Expected valuation | Multiplier |
|-------|:------------------:|:----------:|
| Pre-revenue (current) | $300K-1M USD | 1-2x rebuild cost |
| 100+ paying users | $1-3M USD | Early traction premium |
| $10K+ MRR | $2-5M USD | 10-20x ARR (SaaS standard) |
| $50K+ MRR | $10-20M USD | Growth-stage SaaS multiples |
| Product-market fit + Series A | $5-50M USD | Market-dependent |

**Assessment:** 2,000,000 MYR is a fair friends-and-family valuation for a pre-revenue product with this level of technical depth. The technology alone justifies the price. Upside comes from user traction and revenue — standard early-stage dynamics.

---

## 12b. Pricing Strategy — Implementation Complete (2026-04-25)

### What Was Done

Changed multiplier from 1.2 to 0.625 on 7 hot model IDs (5 distinct models). Added `isHot` field to DB schema for future strategy model management. Added Strategy tab, Pricing Breakdown panel, and Hot badge to Pricing Management UI.

### 7 Hot Models (0.625 multiplier, ~20% margin)

| Model | Kie Cost | User Credits | User Pays | Margin | Use Case |
|-------|---------|-------------|-----------|--------|----------|
| GPT Image 2 1K | $0.03 | 4 | $0.04 | 25% | Cheapest image gen |
| Nano Banana 2 1K | $0.04 | 5 | $0.05 | 20% | Fast drafts |
| Nano Banana Pro 1K/2K | $0.09 | 12 | $0.12 | 25% | Quality finals |
| Seedance 2 Fast 480P 5s | $0.225 | 29 | $0.29 | 22% | Fast video |
| Seedance 2.0 480P 5s | $0.2875 | 36 | $0.36 | 20% | Standard video |
| Seedance 1.5 Pro 480P 4s | $0.035 | 5 | $0.05 | 30% | Cheapest video |
| Z-Image | $0.0045 | 1 | $0.01 | 55% | Ultra-cheap image |

### Gens Per Plan (at cheapest model per type)

| Plan | Credits/mo | GPT Image 2 1K (4cr) | NB2 1K (5cr) | Z-Image (1cr) | Seedance 1.5 Pro 480P 4s (5cr) |
|------|-----------|---------------------|-------------|---------------|-------------------------------|
| Free | 100 | 25 gens | 20 gens | 100 gens | 20 gens |
| Pro $39.90 | 2,500 | **625 gens** | 500 gens | 2,500 gens | 500 gens |
| Business $69.90 | 6,900 | **1,725 gens** | 1,380 gens | 6,900 gens | 1,380 gens |

### Landing Page Data (use near pricing section)

Suggested copy for the landing page pricing area:

**Headline:** "Generate images from $0.04. Videos from $0.05. Credits never expire."

**Feature bullets for plans:**
- Free: "100 credits/month = up to 100 image generations"
- Pro: "3,500 credits/month = up to 875 image generations or 700 video clips"
- Business: "8,000 credits/month = up to 2,000 image generations or 1,600 video clips"

**Trust badges:**
- "Credits never expire" (unique vs all competitors)
- "No subscription required — buy $10 credit packs anytime"
- "Choose your model — cheap drafts or quality finals"
- "Transparent pricing — see cost before you generate"

**vs Competitor callout (optional):**
- "48% cheaper than Higgsfield per image generation"
- "Free tier included — competitors start at $5/mo"

---

## 13. Claude Agent Skills — Future AI Architecture

> **Reference:** [Claude Agent Skills Guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide)
> **Status:** Planning — post-launch priority
> **Last updated:** 2026-04-24

### What Are Agent Skills?

Agent Skills are organized folders of instructions, scripts, and resources that extend Claude's capabilities through the API. Instead of cramming everything into one system prompt, you package domain-specific intelligence into reusable, composable skill modules that Claude can invoke.

### Why Agent Skills Matter for Us

Our current Anthropic integration is **already 80% of the way there**:

| Layer | Current State | With Agent Skills |
|---|---|---|
| **Support Chatbot** | Working — Claude Haiku 4.5, SSE streaming, 11 tools, knowledge base search, ticket creation, rate limiting, session persistence | Same infrastructure, but skills replace monolithic system prompt |
| **System Prompt** | Single `buildSystemPrompt()` — one big prompt for everything | **Modular skills** — `support-agent/`, `director-agent/`, `brand-analyst/` etc. |
| **Tools** | `AUTHED_TOOLS` (11 tools) + `ANON_TOOLS` (1 tool) in one file | **Per-skill tool sets** — each skill brings its own tools |
| **Context** | Generic — knows about Storytica features | **Project-aware** — skills can inject project state (scenes, elements, style) |

### Existing Infrastructure (What We Already Have)

```
lib/support/anthropic.ts        → Anthropic SDK client (claude-haiku-4-5)
lib/support/tools.ts            → 11 tool definitions + dispatchTool()
lib/support/systemPrompt.ts     → buildSystemPrompt() (landing/studio variants)
app/api/support/chat/route.ts   → SSE streaming endpoint with tool loop (8 iterations)
convex/supportChat.ts           → Session persistence + rate limiting
convex/supportTools.ts          → Convex queries/mutations for tool dispatch
convex/knowledgeBase.ts         → Knowledge base search (searchArticlesUnified)
```

### Planned Agent Skills

#### Skill 1: `support-agent` (Refactor of existing chatbot)

**What:** Refactor current support chatbot into a proper Agent Skill structure.

**Current tools (keep as-is):**
- `get_my_profile`, `get_my_subscription`, `get_my_credit_balance`
- `list_my_credit_transactions`, `get_ai_model_pricing`
- `list_my_recent_generations`, `get_generation_details`
- `list_my_invoices`, `list_my_support_tickets`, `create_support_ticket`
- `search_knowledge_base`

**Skill structure:**
```
skills/
  support-agent/
    instructions.md       → System prompt (refactored from buildSystemPrompt)
    tools.json            → Tool definitions (from AUTHED_TOOLS / ANON_TOOLS)
    knowledge/            → Static knowledge files (pricing, FAQ, policies)
```

**Effort:** Small — restructuring, no new functionality.

---

#### Skill 2: `director-agent` (AI Co-Director — replaces Section 9 plan)

**What:** Claude-powered AI director that understands project context and can create/modify storyboards, set camera angles, write prompts, and trigger generation.

**New tools (project-aware):**
| Tool | Description | Convex Target |
|---|---|---|
| `get_project_context` | Read project metadata, style, genre, elements | `storyboard/projects` queries |
| `list_scenes` | Get all scenes/frames with prompts and status | `storyboard/storyboardItems` queries |
| `create_shots` | Create multiple storyboard frames from shot breakdown | `storyboardItems.buildStoryboard` mutation |
| `update_shot_prompt` | Set image/video prompt for a specific frame | `storyboardItems.update` mutation |
| `set_camera_settings` | Apply camera body, lens, focal length, aperture, angle, motion to a frame | Update prompt metadata |
| `create_element` | Create a character/environment/prop element | `storyboard/elements` mutation |
| `set_project_style` | Update project visual style, genre, color grading | `storyboard/projects.update` mutation |
| `trigger_batch_generate` | Queue image generation for selected or all frames | Batch generation endpoint |
| `generate_music` | Create background music for the project | Music generation endpoint |

**System prompt context injection:**
```
When user opens Director Chat, inject:
- Project name, genre, visual style, aspect ratio
- All elements (characters with descriptions, environments, props)
- All scenes (frame number, prompt, status, camera settings)
- Current style prompt / color grading
→ Claude sees the entire project state and can make informed decisions
```

**Skill structure:**
```
skills/
  director-agent/
    instructions.md       → Director persona, filmmaking knowledge
    tools.json            → 9 project-aware tool definitions
    examples/             → Example conversations (car commercial, music video, etc.)
    genres/               → Genre-specific prompt templates (Action, Horror, Noir, etc.)
```

**Model:** Claude Sonnet 4.6 (better reasoning for creative direction) or Haiku 4.5 (faster for simple commands).

**Effort:** Medium — new tools + new endpoint + chat UI. But 80% infrastructure exists.

---

#### Skill 3: `brand-analyst` (Brand Guidelines Analyzer)

**What:** Analyzes uploaded brand assets (logos, color palettes, typography, mood boards) and generates structured brand guidelines that feed into project style settings.

**New tools:**
| Tool | Description |
|---|---|
| `analyze_brand_image` | Vision analysis of uploaded brand asset → extract colors, typography, mood |
| `generate_brand_guidelines` | Compile analysis into structured brand document |
| `apply_brand_to_project` | Set project style, color grading, element descriptions from brand |
| `create_brand_elements` | Auto-create elements (logo, brand colors, fonts) from analysis |

**Integration with existing:**
- Uses OpenRouter (Gemini Vision) for image analysis — already built in `app/api/ai-analyze/route.ts`
- Feeds into project `stylePrompt` and element library
- Works with `brand-guidelines/page.tsx` (already exists as a page)

**Skill structure:**
```
skills/
  brand-analyst/
    instructions.md       → Brand analysis persona, design system knowledge
    tools.json            → 4 brand-specific tools
    templates/            → Brand guideline templates (corporate, creative, minimal)
```

**Effort:** Medium — new analysis logic + UI for brand page.

---

#### Skill 4: `script-analyst` (Script Intelligence)

**What:** Analyzes scripts for pacing, structure, shot suggestions, and auto-generates optimized prompts per scene.

**New tools:**
| Tool | Description |
|---|---|
| `analyze_script_structure` | Parse script → identify act structure, beats, pacing issues |
| `suggest_shots` | For each scene, suggest camera angles, framing, motion |
| `optimize_prompts` | Rewrite image/video prompts for better AI generation results |
| `estimate_duration` | Calculate estimated video duration per scene and total |

**Effort:** Small — mostly prompt engineering + existing script parser.

---

### Architecture: How Skills Plug Into Existing System

```
┌─────────────────────────────────────────────────┐
│  Frontend (React)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Support  │ │ Director │ │ Brand Guidelines │ │
│  │ Chat     │ │ Chat     │ │ Analyzer         │ │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
└───────┼────────────┼────────────────┼────────────┘
        │            │                │
        ▼            ▼                ▼
┌─────────────────────────────────────────────────┐
│  API Routes (Next.js)                            │
│  /api/support/chat   → support-agent skill       │
│  /api/director/chat  → director-agent skill      │
│  /api/brand/analyze  → brand-analyst skill       │
└───────┬────────────┬────────────────┬────────────┘
        │            │                │
        ▼            ▼                ▼
┌─────────────────────────────────────────────────┐
│  Anthropic SDK (shared client)                   │
│  lib/support/anthropic.ts                        │
│  ┌──────────────────────────────────────────┐    │
│  │  Claude API with tool_use                │    │
│  │  - Model selection per skill             │    │
│  │  - SSE streaming (existing pattern)      │    │
│  │  - Tool loop (existing, up to 8 iter)    │    │
│  │  - Prompt caching (existing)             │    │
│  └──────────────────────────────────────────┘    │
└───────┬────────────┬────────────────┬────────────┘
        │            │                │
        ▼            ▼                ▼
┌─────────────────────────────────────────────────┐
│  Tool Dispatch (per-skill tool sets)             │
│  lib/support/tools.ts      → support tools       │
│  lib/director/tools.ts     → director tools      │
│  lib/brand/tools.ts        → brand tools         │
└───────┬────────────┬────────────────┬────────────┘
        │            │                │
        ▼            ▼                ▼
┌─────────────────────────────────────────────────┐
│  Convex (real-time database)                     │
│  - supportTools.ts     (existing)                │
│  - storyboardItems.ts  (existing)                │
│  - projects.ts         (existing)                │
│  - elements            (existing)                │
│  - knowledgeBase.ts    (existing)                │
└─────────────────────────────────────────────────┘
```

### Implementation Priority

| # | Skill | Why | Effort | When |
|---|---|---|---|---|
| 1 | `support-agent` refactor | Clean up existing code, establish skill pattern | Small | Pre-launch |
| 2 | `director-agent` | Biggest differentiator — beats Higgsfield's Mr. Higgs | Medium | Post-launch P1 |
| 3 | `brand-analyst` | Brand guidelines page already exists, natural fit | Medium | Post-launch P2 |
| 4 | `script-analyst` | Enhances existing script parser | Small | Post-launch P3 |

### Cost Estimates

| Skill | Model | Avg tokens/call | Est. cost/call | Monthly (1K users) |
|---|---|---|---|---|
| `support-agent` | Haiku 4.5 | ~2K in + 500 out | ~$0.002 | ~$60 |
| `director-agent` | Sonnet 4.6 | ~8K in + 2K out | ~$0.04 | ~$400 |
| `brand-analyst` | Sonnet 4.6 + Gemini Vision | ~5K in + 1K out | ~$0.03 | ~$150 |
| `script-analyst` | Haiku 4.5 | ~4K in + 1K out | ~$0.005 | ~$50 |

### Key Decisions

1. **Skill loading:** Skills loaded server-side per endpoint — no client-side skill selection. Each API route knows which skill it serves.
2. **Model per skill:** Support uses Haiku (fast, cheap). Director/Brand use Sonnet (better reasoning). Can upgrade to Opus for premium users.
3. **Tool isolation:** Each skill has its own tool set. Director can't create support tickets. Support can't modify storyboards. Clean separation of concerns.
4. **Session management:** Extend existing `support_chat_sessions` schema or create `director_chat_sessions` table. Same pattern — Convex persistence + rate limiting.
5. **Credit cost:** Director and Brand skills consume user credits (they trigger AI generation). Support is free (no generation).

---

### Before launch: ALL quick wins DONE

1. ~~**Batch frame generation**~~ — **DONE**
2. ~~**Style metadata auto-append**~~ — **DONE**
3. ~~**AI Analyze (Copy Style / Video)**~~ — **DONE**
4. ~~**Genre presets (Content Format Presets)**~~ — **DONE**
5. ~~**Speed ramp presets**~~ — **DONE**
6. ~~**Soul HEX color control**~~ — **DONE**
7. ~~**FAQ system**~~ — **DONE**
8. ~~**PDF export**~~ — **DONE**
9. ~~**Pricing page redesign**~~ — **DONE**
10. ~~**Landing page improvements**~~ — **DONE**

### Post-launch priorities

1. **AI Co-Director** — medium effort, biggest differentiator potential. Only remaining buildable gap vs Higgsfield
2. **Booking system migration** — replace n8n with Claude agent tool-use. See `plan_booking.md`
3. **Public self-booking page** — Calendly-style `app/book/[slug]` page
4. **Auto-sequence video** — chain frames via Seedance `first-last-frame` mode

---

## 11. What Was Built (2026-04-24 Session)

4 features implemented:

| # | Feature | Category |
|---|---------|----------|
| 1 | **Camera Motion Presets** — 15 presets (Static, Dolly In/Out, Crane Up/Down, Pan L/R, Tilt Up/Down, Orbit, Tracking, Handheld, Zoom In/Out). Toolbar dropdown button + right-click context menu submenu. Inserts motion text at cursor position in prompt textarea | Camera Control |
| 2 | **Camera Studio** — Floating panel with 4 selector cards (Camera, Lens, Focal Length, Aperture). 9 camera bodies with product images (ARRI, Hasselblad, iPhone, GoPro, DJI Drone, Film 35mm, Polaroid, VHS). 6 lens types, 8 focal lengths, 6 aperture stops. Appends combined camera description to prompt at generation time. Works for both image and video models | Camera Control |
| 3 | **Prompt Context Menu** — Right-click context menu on PromptTextarea shared component. Copy (Ctrl+C), Paste (Ctrl+V), Camera Motion submenu (video mode only). Opens upward, submenu to the right. Uses design system CSS variables. Portal to body for z-index | Prompt UX |
| 4 | **Add Frame to Director's View** — Plus (+) button at end of filmstrip to create new frames. Creates frame via `storyboardItems.create` mutation, auto-navigates to new frame | Director's View |

**Also fixed:**
- Ctrl+C/Ctrl+V in prompt textarea — CanvasEditor's global keydown handler was intercepting clipboard shortcuts for contentEditable elements. Added `isContentEditable` guard
- Camera motion dropdown right-aligned to button edge to prevent right-side overflow
- Context menu cursor position preservation — saves selection range on right-click, restores on insert

**Files created:**
- `app/storyboard-studio/components/ai/VirtualCameraStyle.tsx` — Camera Studio floating panel component
- `public/storytica/cameras/` — 10 camera/lens/aperture product images (ARRI, Hasselblad, iPhone, GoPro, DJI Drone, 35mm Film, Polaroid, VHS, Lens, Aperture)

**Files modified:**
- `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` — Camera motion state/options, Camera Studio integration, prompt assembly
- `app/storyboard-studio/components/shared/PromptTextarea.tsx` — Built-in context menu with Copy/Paste/Camera Motion
- `app/storyboard-studio/components/editor/StoryboardStrip.tsx` — Add frame (+) button, `onAddFrame` prop
- `app/storyboard-studio/components/editor/SceneEditor.tsx` — `createItem` mutation, `handleAddFrame` handler
- `app/storyboard-studio/shared/CanvasEditor.tsx` — Fixed Ctrl+C/V interception for contentEditable elements

---

## 12. What Was Built (2026-04-24 Session #2)

1 major feature implemented:

| # | Feature | Category |
|---|---------|----------|
| 1 | **3D Camera Angle Picker** — Higgsfield-style wireframe globe with 3D perspective projection (25° view-from-above). Draggable camera dot on sphere surface with depth-based opacity (front lines brighter, back lines dimmer). Rotation (0-360°), Tilt (-90 to 90°), Zoom (-100 to 100) sliders. Zoom visually moves dot in/out with dashed orbit ring indicator. 12 presets (Front, 3/4 View, Profile, Back, Bird's Eye, Low Angle, Worm's Eye, Over Shoulder, Close-Up, Wide, High 3/4, Dutch Low). Collapsible preset panel (hidden by default). Apply button to confirm. Live prompt preview showing "Will append to prompt". Left/right arrows to cycle presets. Optional subject thumbnail inside globe. Prompt text auto-appended on generate (same pattern as Camera Studio) | Camera Control |

**Gaps closed:**
- **3D Camera Control** — was our #2 gap vs Storyboarder.ai, LTX Studio, Higgsfield. Now fully closed
- **Virtual Camera Physics** — combined with Camera Studio (built in session #1), we now match Higgsfield's full virtual camera system

**Camera control system now complete (3 components):**
1. **Camera Studio** — camera body, lens, focal length, aperture (hardware simulation)
2. **Camera Motion Presets** — 15 motion types (dolly, crane, pan, orbit, tracking, etc.)
3. **3D Camera Angle Picker** — rotation, tilt, zoom (spatial positioning)

**Files created:**
- `app/storyboard-studio/components/ai/CameraAnglePicker.tsx` — 3D wireframe globe component with WireframeGlobe canvas, AngleSlider, presets, prompt builder

**Files modified:**
- `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` — CameraAnglePicker state, import, render (next to Camera Studio), prompt assembly

---

## 14. What Was Built (2026-04-24 Session #3)

8 features implemented:

| # | Feature | Category |
|---|---------|----------|
| 1 | **Style Auto-Append** — project `stylePrompt` automatically prepends to all generation prompts. "No Style" clear card in style dropdown | Style System |
| 2 | **Content Format Presets** — 12 format types (Film, Documentary, YouTube, Reel/TikTok, Commercial, Music Video, Vlog, Tutorial, Presentation, Podcast, Product Demo, Cinematic Ad). Format badge dropdown in workspace toolbar. Auto-appends framing/pacing/camera behavior to prompts | Format System |
| 3 | **AI Analyzer** — ANALYZE tab in VideoImageAIPanel. Image analysis (camera, lighting, style, scene → prompt, 1cr). Video analysis (shot-by-shot with timestamps, 3cr). Audio analysis (speech transcription, lyrics extraction, sound description, 1cr). OpenRouter → Gemini Flash/Pro. AddImageMenu with mediaType prop for video/audio. FileBrowser handles fileType="analysis". storyboard_files records | AI Analyzer |
| 4 | **Batch Frame Generation** — "Generate All" button in workspace toolbar. BatchGenerateDialog with model picker (Nano Banana 2/Pro, GPT Image 2, Z-Image), resolution, skip-existing toggle, use-elements toggle, credit summary, progress bar. Sequential with 1s delay. Same API as SceneEditor | Batch Generation |
| 5 | **Color Palette** — `colorPalette` field on `storyboard_projects` (referenceUrl + 5 hex colors). Auto-appends to generation prompts. Ready for client-side palette extraction UI | Color System |
| 6 | **Presets System** — `storyboard_presets` table with CRUD mutations. Categories: style, note, camera-studio, camera-angle, bundle. Camera Studio save/load in panel header. Camera Angle Picker save/load in panel header. PromptActions save note + saved notes dialog. Preset Manager dialog in workspace toolbar (filter by category, edit, delete). Cross-project, workspace-scoped | Presets |
| 7 | **Custom Style Migration** — Custom styles now save to `storyboard_presets` (category="style") instead of `promptTemplates`. All three style selectors (workspace, wizard, dashboard) load from presets. Edit/delete via pencil/X buttons on hover | Style System |
| 8 | **Pricing Models** — 3 new pricing entries in `DEFAULT_PRICING_MODELS`: ai-analyze/image (1cr), ai-analyze/video (3cr), ai-analyze/audio (1cr) | Pricing |

**Also fixed:**
- Camera Angle built-in presets renamed from "Presets" to "Samples" (avoid naming conflict with user presets)
- AddImageMenu accepts `mediaType` prop — video (green/Film icon), audio (purple/Volume2 icon)
- FileBrowser analysis cards: Scan icon, amber color, text preview, "Copy Result" in context menu
- PresetManager hides unused categories (format, camera-motion, color-palette)
- PresetManager hides description for style/note/camera/angle presets (only name + prompt)
- Saved Notes dialog uses portal to document.body for correct centering

**Files created:**
- `app/api/ai-analyze/route.ts` — OpenRouter API route (image/video/audio analysis)
- `app/storyboard-studio/components/storyboard/BatchGenerateDialog.tsx` — Batch generation dialog
- `app/storyboard-studio/components/storyboard/PresetManager.tsx` — Preset management dialog
- `convex/storyboard/presets.ts` — CRUD mutations for presets

**Files modified:**
- `convex/schema.ts` — formatPreset, colorPalette on projects + storyboard_presets table
- `convex/storyboard/projects.ts` — formatPreset, colorPalette in update mutation
- `app/storyboard-studio/constants.ts` — FORMAT_PRESETS (12) + FORMAT_PROMPT_MAP
- `app/storyboard-studio/workspace/[projectId]/page.tsx` — Format badge, No Style card, Generate All button, Presets button, BatchGenerateDialog, PresetManager, style presets loading
- `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` — ANALYZE tab, auto-append (style+format+colors), handleAnalyze, credit flow, companyId/userId props to tools
- `app/storyboard-studio/components/ai/FileBrowser.tsx` — fileType="analysis" handling
- `app/storyboard-studio/components/ai/VirtualCameraStyle.tsx` — Save/Load presets
- `app/storyboard-studio/components/ai/CameraAnglePicker.tsx` — Save/Load presets, "Samples" rename
- `app/storyboard-studio/components/shared/AddImageMenu.tsx` — mediaType prop
- `app/storyboard-studio/components/shared/PromptActionsDropdown.tsx` — Save Note, Saved Notes dialog
- `app/storyboard-studio/components/dashboard/ProjectsDashboard.tsx` — Style presets from storyboard_presets
- `app/storyboard-studio/components/dashboard/WizardSteps.tsx` — Style presets from storyboard_presets
- `lib/storyboard/pricing.ts` — 3 analyzer pricing models

---

## 15. What Was Built (2026-04-25 Session #4)

1 feature implemented:

| # | Feature | Category |
|---|---------|----------|
| 1 | **Color Palette Picker** — Higgsfield Soul HEX equivalent. Floating panel (portal, same pattern as Camera Studio/Angle Picker). Reference image via AddImageMenu (R2/Capture/Generated — Upload and Elements hidden via `hideUpload` prop). Image renders on `<canvas>`, crosshair cursor eyedropper picks pixel color on click. 6 color slots with hex labels. Click filled slot → native `<input type="color">` to fine-tune. Hover preview (hex badge overlay). Save to `storyboard_presets` (category="color-palette", stores 6 hex colors + reference image URL + name). Load via dropup menu (thumbnail + name + 6 color dots + delete). Auto-appends `"Color graded with dominant palette: #hex1, #hex2, ..."` to generation prompt. Rose/pink accent color. Trigger button shows 6 mini color dots when active | Color System |

**Also built:**
- `app/api/image-proxy/route.ts` — Server-side image proxy for CORS bypass. External R2/CDN images fetched server-side → returned as raw bytes → browser creates blob URL (same-origin) → canvas `getImageData()` works for pixel reading. Domain whitelist (r2.dev, cloudflarestorage.com). Cached 24h
- `hideUpload` prop on `AddImageMenu` — conditionally hides Upload button. Used by ColorPalettePicker to show only R2/Capture/Generated (3 options instead of 5)

**Files created:**
- `app/storyboard-studio/components/ai/ColorPalettePicker.tsx` — Color palette picker component
- `app/api/image-proxy/route.ts` — Image proxy API route for CORS bypass

**Files modified:**
- `app/storyboard-studio/components/ai/VideoImageAIPanel.tsx` — ColorPalettePicker import, state, render (next to Camera Studio + Angle Picker), prompt assembly (colorPaletteColors priority over project-level colorPalette), palette FileBrowser instance
- `app/storyboard-studio/components/shared/AddImageMenu.tsx` — `hideUpload` prop

**Gaps closed:** Soul HEX Color Control (was "Schema DONE, UI TODO" → now fully **DONE**). Higgsfield buildable gap narrowed from 3 to 2 (AI co-director + speed ramps remain).
