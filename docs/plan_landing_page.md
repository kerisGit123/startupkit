# Landing Page Redesign Plan

> **Date:** 2026-04-25
> **Status:** Analysis complete, implementation pending

---

## 1. Competitor Analysis Summary

### Landing Page Comparison Matrix

| Element | Storytica (us) | Boords | Higgsfield | StudioBinder | OpenArt | Filmora | Artlist |
|---|---|---|---|---|---|---|---|
| **Hero type** | Static screenshot | Problem-first + interactive demo | Multi-announcement carousel | Outcome headline + product tour | Aspirational + animated outputs | Video hero + "100M users" | Full-screen cinematic reel |
| **Hero visual** | PNG screenshot | Animated workflow video | Auto-playing video cards | Interactive tabbed demo | Animated GIFs of AI outputs | Auto-playing video | Auto-playing cinematic reel |
| **Social proof** | 4 avatar placeholders | Studio logos + "1M+ storyboards, 12M+ comments" | Community galleries, 50+ apps | Disney/Netflix/NBC logos, "1M+ creatives" | Samsung/EA logos, Discord community | "100M+ users", awards, media | "50M+ creators", brand logos |
| **Feature demos** | Static screenshots | Interactive demo with real comments | Auto-playing video in every card | Tabbed interactive product tour | Animated GIFs showing AI results | Video clips per feature | Rich visual previews |
| **Headline style** | What it is ("AI Storyboard Studio") | Pain they solve ("Stop expensive reshoots") | Outcomes ("Cinema-grade video") | Outcome ("Plan your entire production") | Aspirational ("Where Ideas Become Visual Stories") | Capability ("Easy video editor") | Visual-first (no headline, just reel) |
| **CTA** | "Create Storyboard" | "Try Boords Free" (3x) | "Try Model" per feature | "Start Free" | "Start creating now - It's free!" | "Download Free" | "Start Free Trial" |
| **Pricing on landing** | Full PricingShowcase | Separate page link | Separate page link | Separate page link | Mentioned in FAQ | Separate page | Separate page |

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
| AI Models scroller | Unique — no competitor does this |
| Feature coverage | Good — 6 main + 4 compact cards |
| WhyStorytica differentiator grid | Strong competitive messaging |
| PricingShowcase with gen estimates | Better than most competitors |
| FAQ section | Good, with link to full FAQ page |
| Scroll-reveal animations | Good subtle polish |
| Support chat widget | Good — live help available |

---

## 3. Our Landing Page — Top 5 Gaps

### Gap 1: Static screenshot hero (CRITICAL)
**Problem:** Every strong competitor uses video/animation in the hero. Our hero is a static PNG.
**Fix:** Record a 10-15s loop showing: type prompt -> frames generate -> drag element -> canvas edit. Export as WebM/MP4 with autoplay.
**Impact:** Massive — first impression determines bounce rate.

### Gap 2: No real social proof (CRITICAL)
**Problem:** We have 4 placeholder avatar circles + "Trusted by creators". Competitors have:
- Boords: "1M+ storyboards shared, 12M+ comments"
- Filmora: "100M+ users"
- StudioBinder: Disney, Netflix, NBC logos
- OpenArt: Samsung, EA logos
**Fix (short-term):** Add real metrics: "X storyboards created", "Y frames generated", "Z users signed up". Even small real numbers ("500+ creators") beat fake-feeling placeholders.
**Fix (long-term):** Collect beta tester logos, case studies.
**Impact:** High — trust is the #1 conversion factor.

### Gap 3: Hero headline is "what it is", not "what it solves" (HIGH)
**Problem:** "AI Storyboard Studio for Film Directors & Creators" tells them what the product IS.
**Fix:** Lead with outcome or pain:
- "From script to screen — without the expensive reshoots"
- "Stop redrawing storyboards by hand"
- "Professional storyboards in minutes, not days"
- "Turn any script into a visual story — automatically"
**Impact:** High — emotional hook in first 2 seconds.

### Gap 4: Feature sections use static screenshots (HIGH)
**Problem:** All 6 feature cards show static PNGs. Competitors show features alive.
**Fix:** Replace PNGs with:
- Short GIF/WebM loops (3-5s) showing each feature in action
- Canvas editing loop, video editor timeline, AI generation, etc.
**Impact:** High — "show don't tell" drives understanding.

### Gap 5: No output gallery / "see what's possible" (MEDIUM)
**Problem:** Visitors can't see quality of AI outputs without signing up.
**Fix:** Add a gallery section showing:
- AI-generated storyboard frames (different styles)
- Before/after (script text -> visual storyboard)
- Video clips generated with different models
**Impact:** Medium-high — proves quality, inspires confidence.

---

## 4. Recommended New Landing Page Structure

```
NAV (sticky, current is fine)
    |
HERO
    - Problem-first headline: "Professional storyboards in minutes, not days"
    - Subheadline: "25+ AI models. Script to storyboard to final cut. One app."
    - 3 bullet points (current ones are good)
    - CTA: "Start Free — No credit card"
    - AUTO-PLAYING VIDEO LOOP (not static screenshot)
    |
SOCIAL PROOF BAR
    - "X,000+ storyboards created" + "Y creators" + star rating
    - Logo bar (when available): "Used by teams at..."
    |
AI MODELS SCROLLER (keep — this is unique to us)
    |
HOW IT WORKS (keep current 3-step cards, but replace PNGs with GIFs)
    |
FEATURES (keep current 6 cards, but replace PNGs with video loops)
    |
OUTPUT GALLERY (NEW)
    - "See what creators are building"
    - Grid of AI-generated storyboard frames in different styles
    - Link to /community gallery
    |
TESTIMONIALS (keep, but add more + add role/company specifics)
    |
PRICING (compact PricingShowcase — current approach is good)
    |
WHY STORYTICA (keep — already on landing page)
    |
VIEW FULL PRICING LINK (keep)
    |
FAQ (keep current)
    |
FINAL CTA (keep current)
    |
FOOTER (keep current)
```

---

## 5. Quick Wins (can do now, no new assets needed)

- [ ] Change hero headline to problem/outcome-first
- [ ] Add "No credit card required" next to CTA button
- [ ] Replace placeholder avatars with real metric: query Convex for actual storyboard/frame count
- [ ] Add "X storyboards created" + "Y AI generations" counter from real DB data
- [ ] Move WhyStorytica ABOVE testimonials (differentiators before social proof)

## 6. Medium Effort (need screen recordings)

- [ ] Record hero video loop (10-15s workflow demo)
- [ ] Record GIF for each feature card (6 GIFs)
- [ ] Screenshot gallery of best AI-generated storyboard frames

## 7. Long-term (need user growth)

- [ ] Collect real testimonials from beta users
- [ ] Get permission to use company/studio logos
- [ ] Build interactive "try a prompt" demo on landing page
- [ ] Add case studies section
