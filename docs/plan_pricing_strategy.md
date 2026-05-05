# Pricing Strategy — Storytica

> **Last updated:** 2026-05-03
> All user credit pricing targets ~20% margin minimum.
> Formula: user_credits = ceil(kie_credits x 0.625) for 20% margin at base Kie rate.

## Kie AI Supplier Rates

| Package | Price | Kie Credits | Cost/Credit |
|---------|-------|-------------|-------------|
| Base | $5 | 1,000 | $0.005 |
| Mid | $50 | 10,000 | $0.005 |
| High (5% bonus) | $500 | 105,000 | $0.00476 |
| Top (10% bonus) | $1,250 | 275,000 | $0.00455 |

**Our user credit rate: $10 = 1,000 user credits ($0.01/credit)**

---

## Image Model Pricing

### GPT Image 2 (OpenAI) — cheapest image model

| Resolution | Kie Credits | Kie Cost | User Credits | User Pays | Margin |
|------------|-------------|----------|-------------|-----------|--------|
| 1K | 6 | $0.03 | **4** | $0.04 | 25% |
| 2K | 10 | $0.05 | **7** | $0.07 | 29% |
| 4K | 16 | $0.08 | **10** | $0.10 | 20% |

### Nano Banana 2 (Gemini 3.1 Flash) — fast drafts

| Resolution | Kie Credits | Kie Cost | User Credits | User Pays | Margin |
|------------|-------------|----------|-------------|-----------|--------|
| All | 8 | $0.04 | **5** | $0.05 | 20% |

### Nano Banana Pro (Google DeepMind) — quality finals

| Resolution | Kie Credits | Kie Cost | User Credits | User Pays | Margin |
|------------|-------------|----------|-------------|-----------|--------|
| 1K/2K | 18 | $0.09 | **12** | $0.12 | 25% |
| 4K | 24 | $0.12 | **15** | $0.15 | 20% |

### Image Model Summary

| Model | 1K | 2K | 4K | Best For |
|-------|-----|-----|-----|----------|
| **GPT Image 2** | 4 cr ($0.04) | 7 cr ($0.07) | 10 cr ($0.10) | Photorealism, text rendering, product shots |
| **Nano Banana 2** | 5 cr ($0.05) | 5 cr ($0.05) | 5 cr ($0.05) | Fast drafts, iteration, bulk |
| **Nano Banana Pro** | 12 cr ($0.12) | 12 cr ($0.12) | 15 cr ($0.15) | Final quality, character consistency |

GPT Image 2 at 1K is our **cheapest image generation** at just 4 credits ($0.04).

---

## Video Model Pricing

### Seedance 2.0 Fast (ByteDance) — fast video

Pricing is per second. "With video" = image-to-video (has reference). "No video" = text-to-video.

| Resolution | Mode | Kie/sec | Kie Cost (5s) | User Credits (5s) | User Pays | Margin |
|------------|------|---------|---------------|-------------------|-----------|--------|
| 480P | img2vid | 9 | $0.225 | **29** | $0.29 | 22% |
| 480P | txt2vid | 15.5 | $0.3875 | **49** | $0.49 | 21% |
| 720P | img2vid | 20 | $0.50 | **63** | $0.63 | 21% |
| 720P | txt2vid | 33 | $0.825 | **104** | $1.04 | 21% |

| Resolution | Mode | Kie/sec | Kie Cost (10s) | User Credits (10s) | User Pays | Margin |
|------------|------|---------|----------------|--------------------|-----------|----|
| 480P | img2vid | 9 | $0.45 | **57** | $0.57 | 21% |
| 480P | txt2vid | 15.5 | $0.775 | **97** | $0.97 | 20% |
| 720P | img2vid | 20 | $1.00 | **125** | $1.25 | 20% |
| 720P | txt2vid | 33 | $1.65 | **207** | $2.07 | 20% |

### Seedance 1.5 Pro (ByteDance) — cinema quality + audio

Fixed duration pricing. With audio = synced SFX/dialogue/music.

**480P:**

| Duration | Audio | Kie Credits | Kie Cost | User Credits | User Pays | Margin |
|----------|-------|-------------|----------|-------------|-----------|--------|
| 4s | No | 7 | $0.035 | **5** | $0.05 | 30% |
| 4s | Yes | 14 | $0.07 | **9** | $0.09 | 22% |
| 8s | No | 14 | $0.07 | **9** | $0.09 | 22% |
| 8s | Yes | 28 | $0.14 | **18** | $0.18 | 22% |
| 12s | No | 19 | $0.095 | **12** | $0.12 | 21% |
| 12s | Yes | 38 | $0.19 | **24** | $0.24 | 21% |

**720P:**

| Duration | Audio | Kie Credits | Kie Cost | User Credits | User Pays | Margin |
|----------|-------|-------------|----------|-------------|-----------|--------|
| 4s | No | 14 | $0.07 | **9** | $0.09 | 22% |
| 4s | Yes | 28 | $0.14 | **18** | $0.18 | 22% |
| 8s | No | 28 | $0.14 | **18** | $0.18 | 22% |
| 8s | Yes | 56 | $0.28 | **35** | $0.35 | 20% |
| 12s | No | 42 | $0.21 | **27** | $0.27 | 22% |
| 12s | Yes | 84 | $0.42 | **53** | $0.53 | 21% |

**1080P:**

| Duration | Audio | Kie Credits | Kie Cost | User Credits | User Pays | Margin |
|----------|-------|-------------|----------|-------------|-----------|--------|
| 4s | No | 30 | $0.15 | **19** | $0.19 | 21% |
| 4s | Yes | 60 | $0.30 | **38** | $0.38 | 21% |
| 8s | No | 60 | $0.30 | **38** | $0.38 | 21% |
| 8s | Yes | 120 | $0.60 | **75** | $0.75 | 20% |
| 12s | No | 90 | $0.45 | **57** | $0.57 | 21% |
| 12s | Yes | 180 | $0.90 | **113** | $1.13 | 20% |

### Video Model Summary — Common Use Cases (5s, 720P)

| Model | User Credits | User Pays | Speed | Best For |
|-------|-------------|-----------|-------|----------|
| **Seedance 2 Fast** (img2vid) | 63 | $0.63 | ~4 min | Fast iteration, storyboard previews |
| **Seedance 2 Fast** (txt2vid) | 104 | $1.04 | ~4 min | Text-to-video, no reference needed |
| **Seedance 1.5 Pro** (no audio) | 18 | $0.18 | ~5 min | Cheaper short clips |
| **Seedance 1.5 Pro** (with audio) | 35 | $0.35 | ~5 min | Cinema quality with synced audio |

Wait — Seedance 1.5 Pro at 720P 4s no audio is only **9 credits ($0.09)** vs Seedance 2 Fast 480P 5s at **29 credits ($0.29)**. Seedance 1.5 Pro is dramatically cheaper for short clips.

---

## Our Subscription Plans

| Plan | Monthly | Annual/mo | Credits/mo | Cost/Credit | Extras |
|------|---------|-----------|-----------|-------------|--------|
| Free | $0 | $0 | 50 × 3 months only | free | 300 MB, 3 projects (20 frames each) |
| Pro | $45 | $39.90 | 3,500 | $0.0129 (mo) / $0.0114 (yr) | 10 GB, unlimited projects & frames, 5 seats, 1 org |
| Business | $119 | $89.90 | 8,000 | $0.0149 (mo) / $0.0112 (yr) | 20 GB, unlimited projects & frames, 15 seats, 3 orgs |

**Annual savings:** Pro saves $61/yr, Business saves $349/yr (25% off).

**Key selling points for Business:**
- 3 organizations from one subscription (no per-org billing)
- 15 seats included (no per-seat charges — HF charges $62/seat)
- Shared credit pool across org members
- Still 67% cheaper than Higgsfield Ultra ($270/mo)

**Credit top-up packages (flat rate, no bulk discount):**

| Package | Price | Per Credit | Kie Cost/Credit | Margin |
|---------|-------|-----------|-----------------|--------|
| 1,000 credits | $9.90 | $0.0099 | ~$0.008 | 19% |
| 5,000 credits | $49.50 | $0.0099 | ~$0.008 | 19% |
| 25,000 credits | $247.50 | $0.0099 | ~$0.008 | 19% |

Note: Kie cost per user credit = $0.005 / 0.625 = $0.008 (average).
Actual margin varies by model: 19% (floor, NB2) to 30% (Seedance 1.5 Pro 480P 4s).
No bulk discount — margin is already thin at 19% minimum.

### What Users Get Per Plan (Image Gens)

| Model | Free (50 cr/mo × 3mo = 150 total) | Pro (3,500 cr) | Business (8,000 cr) |
|-------|--------------|----------------|---------------------|
| GPT Image 2 1K (4 cr) | 12/mo (37 total) | 875 | 2,000 |
| Nano Banana 2 (5 cr) | 10/mo (30 total) | 700 | 1,600 |
| Nano Banana Pro 1K (12 cr) | 4/mo (12 total) | 291 | 666 |

### What Users Get Per Plan (Video Gens)

| Model | Free (50 cr/mo × 3mo = 150 total) | Pro (3,500 cr) | Business (8,000 cr) |
|-------|--------------|----------------|---------------------|
| Seedance 2.0 Fast 480P 5s img2vid (29 cr) | 1/mo (5 total) | 120 | 275 |
| Seedance 1.5 Pro 480P 4s (5 cr) | 10/mo (30 total) | 700 | 1,600 |
| Seedance 1.5 Pro 720P 4s (9 cr) | 5/mo (16 total) | 388 | 888 |

---

## Credit Expiry Policy

### How Our System Works

| Credit Type | Expires? | Details |
|-------------|----------|---------|
| Subscription credits (monthly grant) | **Yes, monthly** | Clawed back at month end via `grantMonthlyCreditsIfDue()`. Standard industry practice |
| Purchased top-up credits | **Never** | No `expiresAt` field. Stays in balance permanently |
| Transferred credits (to org) | **Never** | Once in org `credits_balance`, no clawback touches it |
| Future promo credits | **1 year (planned)** | Will add `expiresAt` + `promoBalance` when needed. Clean bolt-on to existing ledger |

### Transfer Loophole (Acceptable)

Users can transfer subscription credits to an org before month-end clawback. Those credits become permanent in the org. This is acceptable — they paid for that month's subscription. Max exposure: one month's worth of credits per transfer.

### vs Competitors

| Platform | Sub Credits | Top-up Credits |
|----------|-----------|---------------|
| **Us** | Monthly reset | **Never expire** |
| Higgsfield | Monthly reset | 90-day expiry |
| ImagineArt | Monthly reset | -- |
| OpenArt | Monthly reset | Add-ons roll over |
| Lovart | Monthly reset | Top-ups never expire |
| Artlist | Monthly reset | -- |
| LTX Studio | Monthly reset | -- |

**We are the only platform where BOTH top-up and transferred credits never expire.**

---

## Higgsfield Comparison (Primary Competitor)

### Their Pricing (Annual)

| Plan | Price/mo | Credits/mo | NB Pro/gen | Gens/mo | Cost/Gen |
|------|----------|-----------|------------|---------|----------|
| Basic | $5 | 70 | 2 credits | 35 | $0.143 |
| Plus | $39 | 1,000 | 2 credits | 500 | $0.078 |
| Ultra | $99 | 3,000 | 2 credits | 1,500 | $0.066 |

### Head-to-Head at $39/mo (After Our Pricing Fix)

| Metric | Us (Pro $39.90) | Higgsfield (Plus $39) |
|--------|-----------------|----------------------|
| Credits/mo | 3,500 | 1,000 |
| Cheapest image gen | GPT Image 2 1K: **4 cr ($0.04)** | NB Pro: $0.078 |
| GPT Image 2 gens | 875 gens (4 cr each) | -- |
| NB2 draft gens | 700 gens (5 cr each) | Not offered |
| NB Pro quality gens | 291 gens (12 cr each) | 500 gens |
| Video: Seedance 2.0 Fast | 120 gens (480P 5s) | -- |
| Video: Seedance 1.5 Pro | 700 gens (480P 4s) | ~114 Kling 3.0 |
| Free tier | 50 cr/mo × 3 months (150 total) | None — starts at $5/mo |
| Credits expire | Top-ups **never expire** | Top-ups expire 90 days |
| Model choice | 25+ models (image/video/music/audio) | Forced onto NB Pro |
| Seats included | 5 (no per-seat charge) | 1 (Business $62/seat) |
| Organizations | 1 (Business: 3 from one plan) | Per-org billing |
| Pipeline features | Full storyboard studio | Image/video gen only |
| Real-time collaboration | Yes (Convex) | No |

**Key insight: We give 3.5x more credits at the same price point. GPT Image 2 at 4cr is 48% cheaper than HF. And we include the full production pipeline — they just generate images.**

### Higgsfield Trust Issues (Documented)

| Issue | Source |
|-------|--------|
| 10,000+ credits removed from accounts before expiry | [Trustpilot](https://www.trustpilot.com/review/higgsfield.ai) |
| "Unlimited" plans hit battery paywall after 4 gens | [Trustpilot](https://www.trustpilot.com/review/higgsfield.ai), [YouTube](https://www.youtube.com/watch?v=7Zj10P0Sa1k) |
| Features removed and moved to higher tiers | [Trustpilot](https://www.trustpilot.com/review/higgsfield.ai) |
| Refund only if zero credits used (can't test service) | [BBB](https://www.bbb.org/us/ca/san-francisco/profile/artificial-intelligence/higgsfield-ai-1116-977987/complaints) |
| Creator payment program lost submissions | [Qazinform](https://qazinform.com/news/scam-claims-and-backlash-hit-kazakhstans-ai-unicorn-higgsfield-b311a7) |
| Promo videos were not AI-generated | [Qazinform](https://qazinform.com/news/scam-claims-and-backlash-hit-kazakhstans-ai-unicorn-higgsfield-b311a7) |
| X/Twitter account suspended | [Caimera](https://www.caimera.ai/blogs/higgsfield-ai-twitter-ban-case-study-how-platform-trust-collapses) |

---

## Competitor Free Tier Comparison

| Platform | Free Tier | Catch |
| -------- | --------- | ----- |
| **Storytica** | 50 cr/mo × 3 months (150 total) | Stops after 3 grants — upgrade or top-up after |
| **Higgsfield** | Trial generations on signup only | No ongoing free plan. Starts at $5/mo minimum |
| **Artlist** | None | Subscription-only. Music/stock licensing, AI tools fully paywalled |
| **InVideo** | Weekly limited AI "generations" | **Watermark on every export.** Most AI features locked. Unusable for real deliverables |
| **ImagineArt** | Limited daily free gens | Very low limit, forced to paid quickly |
| **OpenArt** | Small monthly free allowance | Quality models locked behind paid plans |
| **LTX Studio** | No meaningful free tier | Beta access only, invite-gated |

**Our position:** We are the only platform offering clean (no watermark), full-quality output on a free tier with access to all 29+ models. Competitors either charge from day one (Higgsfield, Artlist) or hobble the free plan so severely it cannot produce usable work (InVideo watermarks).

The 3-month cap converts casual browsers into paying users naturally — they get enough time to build real projects and see the value, then face a clear upgrade decision.

---

## Our Competitive Advantages

### Pricing

- **Cheapest image gen in the market**: GPT Image 2 1K at 4 credits ($0.04) — 48% cheaper than Higgsfield
- **25+ AI models**: image, video, music, audio, analyze — users pick per generation
- **Credits never expire** (purchased top-ups) — competitors expire monthly or 90 days
- **Free tier**: 50 credits/mo × 3 months (150 total) — Higgsfield starts at $5/mo (no free), Artlist is subscription-only (no free tier), InVideo is free but **watermarks every export** (unusable for real work)
- **No subscription required**: $9.90 top-up, use whenever
- **No per-seat charges**: Pro includes 5, Business includes 15 (HF charges $62/seat)
- **One plan, multiple orgs**: Business supports 3 orgs (competitors bill per org)

### Platform (storyboard-first, not just a generator)

- Full storyboard studio: script → storyboard → generate → edit → export
- 25+ AI models: image, video, face swap, music, cover song, TTS, analyze, prompt enhance
- Canvas editor: drawing, bubble text, annotations, stickers, AI inpaint, edit image sections
- Camera Studio + 3D Angle Picker + Motion presets (15+) + Speed Ramp + Color Palette
- Multi-track video editor with subtitles + blend modes + MP4 export
- Director's View filmstrip + compare frames side-by-side
- Batch generation + Presets system (save & reuse workflows)
- Element manager + shared library with @mentions
- Real-time collaboration via Convex (no save button, instant sync)

### Trust

- Transparent credit system — exact cost shown before every generation
- No "unlimited" bait-and-switch
- Honest per-generation pricing shown in model picker
- Fair refund policy

### Marketing Message

*"The all-in-one AI storyboard studio. 25+ models. Credits never expire. No per-seat charges. Script to final cut in one app."*

---

## Final Pricing Table — All Models

> **"User Pays" = subscription rate ($0.01/credit). Top-up rate is $0.0099/credit (slightly lower).**
> **Margin column shows subscription rate. Top-up margins are ~1% lower.**
> **Every model is profitable at every price point. Floor margin: 19% (NB2, top-up).**

### Image Models

| Model | Resolution | User Credits | User Pays | Our Cost | Margin |
|-------|-----------|-------------|-----------|----------|--------|
| GPT Image 2 | 1K | **4** | $0.04 | $0.03 | 25% |
| GPT Image 2 | 2K | **7** | $0.07 | $0.05 | 29% |
| GPT Image 2 | 4K | **10** | $0.10 | $0.08 | 20% |
| Nano Banana 2 | All | **5** | $0.05 | $0.04 | 20% |
| Nano Banana Pro | 1K/2K | **12** | $0.12 | $0.09 | 25% |
| Nano Banana Pro | 4K | **15** | $0.15 | $0.12 | 20% |

### Video Models — Seedance 2 Fast (per second pricing)

| Resolution | Mode | User Cr (5s) | Pays (5s) | User Cr (10s) | Pays (10s) | Margin |
|------------|------|-------------|-----------|---------------|------------|--------|
| 480P | img2vid | **29** | $0.29 | **57** | $0.57 | 21-22% |
| 480P | txt2vid | **49** | $0.49 | **97** | $0.97 | 20-21% |
| 720P | img2vid | **63** | $0.63 | **125** | $1.25 | 20-21% |
| 720P | txt2vid | **104** | $1.04 | **207** | $2.07 | 20-21% |

### Video Models — Seedance 1.5 Pro (fixed duration)

| Resolution | Duration | No Audio | With Audio |
|------------|----------|----------|------------|
| 480P | 4s | **5 cr** ($0.05) | **9 cr** ($0.09) |
| 480P | 8s | **9 cr** ($0.09) | **18 cr** ($0.18) |
| 480P | 12s | **12 cr** ($0.12) | **24 cr** ($0.24) |
| 720P | 4s | **9 cr** ($0.09) | **18 cr** ($0.18) |
| 720P | 8s | **18 cr** ($0.18) | **35 cr** ($0.35) |
| 720P | 12s | **27 cr** ($0.27) | **53 cr** ($0.53) |
| 1080P | 4s | **19 cr** ($0.19) | **38 cr** ($0.38) |
| 1080P | 8s | **38 cr** ($0.38) | **75 cr** ($0.75) |
| 1080P | 12s | **57 cr** ($0.57) | **113 cr** ($1.13) |

### Utility Models (fixed pricing, not via 0.625 multiplier)

| Model | User Credits | User Pays | Actual Cost | Margin | Notes |
|-------|-------------|-----------|-------------|--------|-------|
| AI Analyze Image | **1** | $0.01 | ~$0.0001 | **99%** | Gemini Flash 1.5, basically free |
| AI Analyze Video | **3** | $0.03 | ~$0.02 | **33%** | Gemini Pro 1.5, up to 60s |
| AI Analyze Audio | **1** | $0.01 | ~$0.005 | **50%** | Gemini Pro 1.5, transcription |
| Prompt Enhance | **1** | $0.01 | ~$0.001 | **90%** | Claude Haiku 4.5 |

These utility models are engagement drivers — cheap for users, high margin for us,
and they lead to more image/video generations (where the real volume is).

---

## Director AI — Script Generation (invoke_skill)

> **Last tested:** 2026-05-03. Real token usage measured via API `usage` field.

The Director agent calls the `video-prompt-builder` Claude skill to generate cinematic scripts.
The skill reads multiple reference files internally before generating — this creates high input token overhead that varies by story genre complexity.

### Real Token Usage (Empirical)

| Model | Story | Input Tokens | Output Tokens | API Cost |
| ----- | ----- | ------------ | ------------- | -------- |
| Haiku 4.5 | 4 scenes / ~60s / simple (koi+cat) | 31,109 | 2,646 | $0.0355 |
| Haiku 4.5 | 10 scenes / complex (dragon/VFX/action) | 84,870 | 7,467 | $0.0978 |
| Sonnet 4.6 | 10 scenes / complex (dragon/VFX/action) | 59,649 | 7,239 | $0.2875 |

**Key finding:** Input token cost is driven by story genre complexity, not scene count. Complex stories (action, VFX, fantasy, fighting) load more reference files — 84K vs 31K tokens. Sonnet at $3/1M input is unprofitable at any reasonable credit price. Haiku at $0.80/1M is the only viable model.

### Profitability by Configuration

| Config | Credits | Revenue | Worst Cost | Floor Margin |
| ------ | ------- | ------- | ---------- | ------------ |
| Haiku, simple story | 6 | $0.06 | $0.036 | 40% |
| Haiku, complex story | 6 | $0.06 | $0.098 | -62.9% LOSS |
| Haiku, complex story | 12 | $0.12 | $0.098 | 18.3% |
| Sonnet, complex story | 35 | $0.35 | $0.288 | 17.7% |

**Decision: Haiku only, tiered by genre.** Simple stories cheapest, complex stories priced to cover higher reference-file overhead.

### Max Scenes Per Haiku Call

Haiku 4.5 output limit is 8,192 tokens. At ~650–750 tokens/scene:

- 8 scenes per call = ~6,000 tokens — safe
- 10 scenes → ~7,500 tokens — tested at edge (7,467 tokens, succeeded)
- 12+ scenes → likely truncation

**Cap at 8 scenes per call (~2 min per act).** System automatically splits longer stories.

### Pricing — 6 or 8 Credits Per Minute

Simple (nature, romance, friendship, travel): **6 credits/min**
Complex (action, VFX, fantasy, fighting, sci-fi, war): **8 credits/min**
Minimum: 6 credits (covers any story under 1 min)

| Duration | Simple credits | Simple margin | Complex credits | Complex margin |
| -------- | -------------- | ------------- | --------------- | -------------- |
| 1 min | **6** | 40% | **8** | 18% |
| 2 min | **12** | 40% | **16** | 18% |
| 5 min | **30** | 40% | **40** | 18% |
| 10 min | **60** | 40% | **80** | 18% |
| 20 min | **120** | 40% | **160** | 18% |

Simple margin uses $0.036/call cost. Complex uses $0.098/call (worst case).

### What to Tell Users (Agent Confirmation Message)

> "A **5-minute action script** costs **40 credits** (8cr/min — action/VFX stories load more AI reference data). Storyboard build is **free**. Your balance: X credits. Ready to start?"

> "A **5-minute simple script** costs **30 credits** (6cr/min). Storyboard build is **free**. Your balance: X credits. Ready to start?"

### Build Storyboard — FREE

`build_storyboard` (element extraction + frame creation) is charged 0 credits. It's the conversion hook — users who see their storyboard built are far more likely to spend credits generating images and videos.

---

## Visual Lock — Pricing

Visual Lock surgically rewrites only the scenes where a locked element appears. It does NOT rewrite the full script, and uses direct Claude API (no skills reference-file overhead). Cost is flat and predictable.

### Credit Formula

```
Total = (elements analyzed × 1cr) + ceil(totalScenes / 10) × 3cr
```

| Step | Charge | Notes |
|------|--------|-------|
| Analyze each element | 1cr/element | Claude Sonnet vision — 1 API call per element |
| Script rewrite | ceil(scenes/10) × 3cr | Haiku, only rewrites affected scenes in parallel |

### Rewrite Pricing by Script Length

| Total scenes | Rewrite credits | Revenue | Haiku cost (50% affected) | Margin |
|---|---|---|---|---|
| 1–10 | **3cr** | $0.03 | $0.013 | 57% |
| 11–20 | **6cr** | $0.06 | $0.025 | 58% |
| 21–30 | **9cr** | $0.09 | $0.038 | 58% |
| 71–80 | **24cr** | $0.24 | $0.100 | 58% |

Consistent ~57–58% margin at every script length.

### Example — 20-scene story, 3 elements locked

> `(3 × 1cr analyze) + 6cr rewrite` = **9 credits total ($0.09)**

### Implementation Notes

- `totalScenes` counted server-side from SCENE markers in the script (no frontend param needed)
- UI shows dynamic credit cost: `ceil(scenes/10) × 3` before user confirms rewrite
- Modal uses `items?.length` from `listItemsForBuild` query to estimate cost before the API call

---

## Implementation — Multiplier Approach

### How It Works

The pricing system uses `factor` (multiplier) on each model's `creditCost` (Kie base cost):

```
User credits charged = ceil(Kie credits × factor)
```

**Old factor: 1.2** (20% markup on top of Kie cost = user pays MORE than Kie)
**New factor: 0.625** (user credits = 62.5% of Kie credits = ~20% margin)

Why 0.625: Our user credits cost $0.01 each, Kie credits cost $0.005 each (2:1 ratio). To achieve 20% margin: `user_credits = ceil(kie_credits × 0.005 / (0.01 × 0.8)) = ceil(kie_credits × 0.625)`.

### Changes Made (2026-04-25)

| Model | File | Old Factor | New Factor | Old creditCost | New creditCost |
|-------|------|-----------|-----------|---------------|---------------|
| Nano Banana 2 | `lib/storyboard/pricing.ts` | 1.2 | **0.625** | 8 | 8 (unchanged) |
| GPT Image 2 Text-to-Image | `lib/storyboard/pricing.ts` | 1.2 | **0.625** | 12 | **6** (fixed to actual Kie cost) |
| GPT Image 2 Image-to-Image | `lib/storyboard/pricing.ts` | 1.2 | **0.625** | 12 | **6** (fixed to actual Kie cost) |
| Seedance 2.0 Fast | `lib/storyboard/pricing.ts` | 1.2 | **0.625** | 9 | 9 (unchanged) |
| Seedance 1.5 Pro | `lib/storyboard/pricing.ts` | 1.2 | **0.625** | 7 | 7 (unchanged) |

Note: GPT Image 2 `creditCost` was 12 (incorrect — actual Kie cost is 6 at 1K). Fixed to 6.

### Bug Fixes (2026-04-25)

Three pricing calculation bugs were found and fixed in `app/api/storyboard/pricing/calculate-price/route.ts`:

**Bug 1: Seedance 2.0 — img2vid / txt2vid costs swapped**

The `getSeedance20` case had `noVideo: 11.5, videoInput: 19` — but video_input (img2vid) is the CHEAPER rate (11.5 Kie/sec) because the model has a reference frame to work from. Text-to-video (no reference) costs more (19 Kie/sec).

- **Impact:** img2vid users overcharged ~67% (60 credits instead of 36 at 480p 5s). txt2vid users undercharged.
- **Fix:** Swapped to `withInput: 11.5, noInput: 19` and `audio ? withInput : noInput`.

**Bug 2: Seedance 2.0 Fast — missing from calculate-price entirely**

No `getSeedance20Fast` case existed. Fell through to `default` which computed `ceil(9 * 0.625)` = **6 credits** regardless of resolution or duration.

- **Impact:** Users paying 6 credits instead of 29-104 credits. Massive revenue loss on every Seedance 2.0 Fast generation.
- **Fix:** Added full `getSeedance20Fast` case with per-second rates matching the Kie API: 480p (9/15.5), 720p (20/33).

**Bug 3: Seedance 1.5 Pro — wrong audio multiplier and duration formula**

The `getSeedance15` case used `audioMultiplier = 1.5` (should be 2) and `durationMultiplier = Math.ceil(duration / 5)` (12s → 3x, but actual Kie cost is not a clean multiplier).

- **Impact:** Audio gens undercharged (1.5x instead of 2x). 12s gens computed incorrectly.
- **Fix:** Replaced multiplier formula with Kie credit lookup table matching API docs: `480p: {4s: 7, 8s: 14, 12s: 19}`, `720p: {4s: 14, 8s: 28, 12s: 42}`, `1080p: {4s: 30, 8s: 60, 12s: 90}`. Audio = 2x.

Also fixed `lib/storyboard/pricing.ts` `getSeedance15()` function and `formulaJson` in model config to use the same lookup table approach.

### UI Added

Pricing Margin Overview table added to Testing Parameters panel in `PricingManagementDark.tsx`. Shows all hot models with Kie credits, Kie cost, ×0.625 calculation, user credits, user pays, and margin percentage.

### Remaining TODO

- [ ] Model picker in generation UI shows credit cost per model + resolution
- [ ] "Cheapest option" badge on GPT Image 2 1K
- [ ] Buy $1,250 Kie package when volume justifies (10% bonus = all margins improve ~3-5%)
- [ ] Add `expiresAt` to ledger when running promos (future, not now)
- [ ] Wire credit top-up buttons in PricingShowcase to purchase confirmation dialog
- [x] ~~Subscription plans~~ Updated to Free 50cr / Pro 3,500cr ($45/$39.90) / Business 8,000cr ($119/$89.90)
- [x] ~~Pricing page redesign~~ Implemented in `PricingShowcase.tsx` with 3 model estimates, 9 differentiator cards, 7-category comparison table
- [x] ~~Feature gating~~ Implemented via `useFeatures()` hook — free gets all AI gen + canvas, Pro+ gets production tools
- [x] ~~Feature gating server-side~~ Frame limit enforced in `convex/storyboard/storyboardItems.ts`
- [x] ~~Pricing bugs~~ Fixed Seedance 2.0 swap, Seedance 2.0 Fast missing case, Seedance 1.5 Pro wrong multipliers
