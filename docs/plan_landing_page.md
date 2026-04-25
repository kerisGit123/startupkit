# Landing Page Redesign Plan

> **Date:** 2026-04-25
> **Status:** Phase 1 + Phase 2 complete, Phase 3 pending (needs screen recordings)

---

## 1. Competitor Analysis Summary

### Landing Page Comparison Matrix

| Element | Storytica (us) | Boords | Higgsfield | StudioBinder | OpenArt | Filmora | Artlist |
|---|---|---|---|---|---|---|---|
| **Hero type** | Static screenshot | Problem-first + interactive demo | Multi-announcement carousel | Outcome headline + product tour | Aspirational + animated outputs | Video hero + "100M users" | Full-screen cinematic reel |
| **Hero visual** | PNG screenshot | Animated workflow video | Auto-playing video cards | Interactive tabbed demo | Animated GIFs of AI outputs | Auto-playing video | Auto-playing cinematic reel |
| **Social proof** | Live DB metrics (creators, projects, generations) | Studio logos + "1M+ storyboards, 12M+ comments" | Community galleries, 50+ apps | Disney/Netflix/NBC logos, "1M+ creatives" | Samsung/EA logos, Discord community | "100M+ users", awards, media | "50M+ creators", brand logos |
| **Feature demos** | Static screenshots | Interactive demo with real comments | Auto-playing video in every card | Tabbed interactive product tour | Animated GIFs showing AI results | Video clips per feature | Rich visual previews |
| **Headline style** | Outcome ("Professional Storyboards in Minutes, Not Days") | Pain they solve ("Stop expensive reshoots") | Outcomes ("Cinema-grade video") | Outcome ("Plan your entire production") | Aspirational ("Where Ideas Become Visual Stories") | Capability ("Easy video editor") | Visual-first (no headline, just reel) |
| **CTA** | "Start Free" + "No credit card required" | "Try Boords Free" (3x) | "Try Model" per feature | "Start Free" | "Start creating now - It's free!" | "Download Free" | "Start Free Trial" |
| **Pricing on landing** | Compact PricingShowcase + link to full pricing | Separate page link | Separate page link | Separate page link | Mentioned in FAQ | Separate page | Separate page |

### What Each Competitor Does Best

| Competitor | Strongest Element | Why It Works |
|---|---|---|
| **Boords** | Problem-first narrative + Before/After visual + founder story | Emotional resonance, immediate "that's me" moment |
| **Higgsfield** | Auto-playing video demos in every card + community gallery | Shows product alive, social proof through user creations |
| **StudioBinder** | Enterprise logos (Disney, Netflix) + interactive product tour | Instant credibility, "if Netflix uses it, it's good" |
| **OpenArt** | "Try this prompt" interactive cards + enterprise logos | Low-friction engagement, credibility |
| **Filmora** | "100M+ users" count + video hero + award badges | Massive social proof, shows product in motion |
| **Artlist** | Full-screen cinematic auto-playing reel | Premium feel, emotional impact, "this is what you'll create" |
| **Krock.io** | Integration logos (Adobe, DaVinci, FCP) + pain-point headline | Partnership credibility, immediate problem recognition |
| **Lovart AI** | AI output gallery as hero + "try this" interactions | Shows capability immediately, interactive engagement |
| **Storyboarder** | Simplicity-first messaging + open-source credibility | "Fast as you can draw stick figures" = zero intimidation |

---

## 2. Our Landing Page — Current Strengths

| Element | Assessment |
|---|---|
| Dark theme | Good — matches creative professional aesthetic |
| AI Models scroller (25 models) | Unique — no competitor does this; now includes all models across 5 categories |
| Feature coverage | Good — 6 main + 4 compact cards |
| WhyStorytica differentiator grid | Strong competitive messaging, placed above testimonials |
| PricingShowcase with gen estimates | Better than most competitors |
| FAQ section | Good, with link to full FAQ page, model list up to date |
| Scroll-reveal animations | Good subtle polish |
| Support chat widget | Good — live help available |
| Problem-first headline | "Professional Storyboards in Minutes, Not Days" |
| No credit card required text | Below CTA button |
| Social proof bar | Live metrics from Convex (creators, projects, AI generations) |
| Metrics badge in hero | 25+ AI models / Image, video, music, audio & utility / Credits never expire |

---

## 3. Our Landing Page — Remaining Gaps

### Gap 1: Static screenshot hero (CRITICAL)

**Problem:** Every strong competitor uses video/animation in the hero. Our hero is still a static PNG (`storyboard_home.png`).
**Fix:** Record a 10-15s loop showing: type prompt -> frames generate -> drag element -> canvas edit. Export as WebM/MP4 with autoplay.
**Impact:** Massive — first impression determines bounce rate.

### Gap 2: Feature sections use static screenshots (HIGH)

**Problem:** All 6 feature cards + 3 "How It Works" cards show static PNGs. Competitors show features alive.
**Fix:** Replace PNGs with short GIF/WebM loops (3-5s) showing each feature in action.
**Impact:** High — "show don't tell" drives understanding.

### Gap 3: No output gallery / "see what's possible" (MEDIUM)

**Problem:** Visitors can't see quality of AI outputs without signing up.
**Fix:** Add a gallery section showing AI-generated storyboard frames (different styles), before/after (script -> storyboard), video clips from different models.
**Impact:** Medium-high — proves quality, inspires confidence.

---

## 4. Recommended Landing Page Structure

```
NAV (sticky) [DONE]
    |
HERO [DONE except video]
    - Problem-first headline [DONE]
    - Subheadline with feature summary [DONE]
    - 3 bullet points [DONE]
    - CTA: "Start Free" + "No credit card required" [DONE]
    - AUTO-PLAYING VIDEO LOOP [TODO — needs recording]
    |
SOCIAL PROOF BAR [DONE]
    - Live metrics from Convex: creators, projects, AI generations
    - Logo bar (when available): "Used by teams at..."
    |
AI MODELS SCROLLER (25 models, 5 categories) [DONE]
    |
HOW IT WORKS (3 cards) [DONE — needs GIFs to replace PNGs]
    |
FEATURES (6 cards + 4 compact) [DONE — needs GIFs to replace PNGs]
    |
OUTPUT GALLERY [TODO — NEW, needs curated frames]
    |
WHY STORYTICA [DONE]
    |
TESTIMONIALS [DONE — needs real testimonials long-term]
    |
PRICING (compact PricingShowcase + full pricing link) [DONE]
    |
FAQ (model list up to date) [DONE]
    |
FINAL CTA [DONE]
    |
FOOTER [DONE]
```

---

## 5. Implementation Checklist

### Phase 1 — Quick Wins (COMPLETE)

- [x] Change hero headline to problem/outcome-first
- [x] Add "No credit card required" next to CTA button
- [x] Replace placeholder avatars with metrics badge
- [x] Move WhyStorytica ABOVE testimonials

### Phase 2 — Code Changes (COMPLETE)

- [x] Add live metrics from Convex via `landingStats.getPublicStats` as social proof bar below hero
- [x] Update AI Models scroller — 15 to 25 models (added Flux 2 Pro, Flux 2 Flex I2I, Character Edit, Nano Banana Edit, Crisp Upscale, Extend Music, Create Persona, AI Analyze, Prompt Enhance)
- [x] Add Utility category with amber color scheme to scroller
- [x] Update FAQ model list to include all current models (5 categories)
- [x] Fix `storyboard_model_credit` schema — added `"music"` and `"utility"` to `modelType` union

### Phase 3 — Screen Recordings (needs asset creation)

- [ ] Record hero video loop (10-15s workflow demo) — WebM/MP4 with autoplay, muted, loop
- [ ] Record GIF/WebM for each feature card (6 features x 3-5s each)
- [ ] Record GIF/WebM for each "How It Works" card (3 cards)
- [ ] Screenshot gallery of best AI-generated storyboard frames for Output Gallery section

### Phase 4 — New Sections (needs assets from Phase 3)

- [ ] Add Output Gallery section: grid of AI-generated frames in different art styles

### Phase 5 — Long-term (needs user growth)

- [ ] Collect real testimonials from beta users
- [ ] Get permission to use company/studio logos
- [ ] Build interactive "try a prompt" demo on landing page
- [ ] Add case studies section

---

## 6. New Model: Flux 2 Flex Image-to-Image

Recently added to the platform. Key details for landing page copy:

- **Model ID:** `flux-2/flex-image-to-image`
- **Capability:** Upload 1-8 reference images, describe edits in natural language
- **Use cases:** Replace objects between images, style transfer, character consistency across references
- **Resolution:** 1K (14 credits) or 2K (24 credits)
- **Unique selling point:** Multi-image reference editing — no competitor offers this in a storyboard tool
- **Landing page messaging:** Highlight in the AI Storyboarding feature card as "Edit with up to 8 reference images" or in the Element Library card as a way to maintain consistency
