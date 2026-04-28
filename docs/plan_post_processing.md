# Post-Processing Pipeline — Cinema Studio

> **Status:** SHIPPED (Session #9 tools + Session #19 layout overhaul)
> **Last updated:** 2026-04-28 (Session #19)
> **Architecture decision:** Labeled horizontal bottom toolbar in Cinema Studio (was: left toolbar icons). Post-processing tools moved from unlabeled sidebar to labeled bottom bar: Inpaint | Img2Img | Upscale | Enhance | Relight | BG Remove | Reframe.
> **Layout overhaul (Session #19):** Adopted Higgsfield Cinema Studio 3.5 layout patterns — labeled bottom toolbar, right metadata/info panel (260px), canvas-only left toolbar, bottom-center zoom controls. Right floating toolbar removed entirely. Actions moved to info panel.
> **Goal:** Match and exceed Higgsfield's Soul Cinema post-processing pipeline (Upscale, Enhancer, Relight, Inpaint, Angles) using our existing models + new integrations.
> **Previous assessment:** "Soul Cinema quality — can't build" was WRONG. The quality comes from a post-processing pipeline, not just one model.
> **Current status:** 10 tools DONE vs Higgsfield's 5. Leading 90 vs 88 overall.

---

## 1. What Higgsfield Actually Does

Soul Cinema is NOT just a model. It's a **model + 5-tool post-processing pipeline** that can be stacked:

```
Generate (Soul Cinema model)
    → Upscale 4x (AI super-resolution + face enhancement)
    → Enhance (skin retouching, clarity, color correction)
    → Relight (3D depth + generative relighting)
    → Inpaint (brush mask + prompt editing)
    → Angles (novel view synthesis, 360 rotation)
    = "Soul Cinema quality"
```

Any user can stack these tools on any generated image. The cinematic look comes from the PIPELINE, not just the base model. We can build the same pipeline on top of GPT Image 2, Nano Banana Pro, or any model.

### Higgsfield's 6 Tools — Deep Breakdown

| Tool | What it does | AI or Filter? | UI |
|------|-------------|---------------|-----|
| **Overview** | Info panel — prompt, model, seed, resolution | UI only | Metadata display |
| **Upscale** | AI super-resolution: 2x/4x/8x/16x. Face enhancement toggle with adjustable strength. Reconstructs textures, edges, fine detail | AI model (deep learning SR + face restoration) | Factor dropdown + face toggle + strength slider |
| **Enhancer** | Skin/facial retouching at SAME resolution. Smoothing, clarity, color correction. Semantic facial reconstruction — understands facial structure | AI model (semantic reconstruction) | One-click with auto-detect |
| **Relight** | 3D depth reconstruction from 2D image + generative relighting. Reconstructs scene geometry, recalculates light interaction with surfaces | AI model (depth estimation + generative) | Draggable 3D light cone pad. Soft/Hard toggle. Angle + intensity + color temperature controls |
| **Inpaint** | Brush mask area + text prompt → AI regenerates region with seamless blending. Built on Nano Banana Pro reasoning core | AI model (diffusion inpainting) | Brush tool + prompt field |
| **Angles** | Novel view synthesis — generates new camera perspectives from single image. Full 360-degree: front, side, back, overhead, any angle | AI model (multi-view diffusion) | 3D rotation drag + manual sliders |

---

## 2. What We Already Have (Audit)

### Already built and working

| Tool | Our Implementation | Models | Status |
|------|-------------------|--------|--------|
| **Overview** | Frame Info Dialog — cinema-grade readouts, NLE tab bar | N/A | **DONE** |
| **Inpaint** | Canvas draw + brush mask + rectangle selection + text prompt. 10+ models (GPT 4o, NB, NB Pro, Flux Fill, Flux Kontext, Seedream, Grok, Ideogram, Z-Image, Qwen Edit) | Multiple | **DONE** — we have MORE inpaint models than Higgsfield |
| **Upscale (image)** | Topaz Upscale (`topaz/image-upscale`) — 1x/2x/4x. Crisp Upscale (`recraft/crisp-upscale`) | 2 models | **Code exists** — pricing in `pricing.ts`, generation in `kieAI.ts`. NOT wired to storyboard UI |
| **Upscale (video)** | Topaz Video Upscale (`topaz/video-upscale`) — 1x/2x/4x, per-second pricing | 1 model | **Code exists** — in `videoAI.ts`, partially in VideoImageAIPanel |

### Not built but buildable with existing models

| Tool | Approach | Models Available | Effort |
|------|---------|-----------------|--------|
| **Enhance (face/skin)** | Image-to-image with enhance prompt template via GPT Image 2 or Nano Banana Edit | `gpt-image-2-img2img`, `nano-banana-edit`, `character-edit` | Small — prompt template + UI |
| **Enhance (general)** | Image-to-image with detail/clarity prompt | Same models | Small |

### Not built, needs new model integration

| Tool | Approach | Model Source | Effort |
|------|---------|-------------|--------|
| **Relight** | Generative relighting with depth understanding | IC-Light (Replicate), or Kie AI if they add it | Medium |
| **Post-gen Angles** | Novel view synthesis from single image | Zero123++ / SV3D (Replicate), or prompt-based via GPT Image 2 | Medium |

---

## 3. How We Get to 100% — And Beyond

### The Pipeline Stack

Our version of the post-processing pipeline:

```
Generated image (any model)
    │
    ├── [Upscale]  → Topaz 2x/4x (existing) or Crisp Upscale (existing)
    ├── [Enhance]  → GPT Image 2 img2img or NB Edit (existing models, new UI)
    ├── [Relight]  → IC-Light via Replicate (new integration)
    ├── [Inpaint]  → 10+ models (existing, fully built)
    ├── [Angles]   → Zero123++ via Replicate or GPT Image 2 prompt (new)
    │
    └── BONUS tools Higgsfield DOESN'T have:
        ├── [Style Transfer]  → Copy Style from reference image (AI Analyze exists)
        ├── [Background Remove] → Removebg or Kie AI model
        ├── [Color Grade]  → Color Palette Picker auto-apply (existing)
        └── [Extend]  → Outpaint / extend canvas beyond borders (Flux Fill)
```

### Our Advantage: Multi-Model Choice

Higgsfield uses ONE model per tool. We can offer **model choice** per tool:

| Tool | Higgsfield | Us (model options) |
|------|-----------|-------------------|
| Upscale | 1 model | **Topaz** (best quality) or **Crisp** (cheapest, 1 credit) |
| Enhance | 1 model | **GPT Image 2** (best) or **NB Edit** (cheapest) or **Character Edit** (face-specific) |
| Inpaint | NB Pro Inpaint | **10+ models** — user picks per use case |
| Relight | 1 model | **IC-Light** (best) or **prompt-based GPT** (cheapest) |
| Angles | 1 model | **Zero123++** (best) or **prompt-based GPT** (cheapest) |

**This is a genuine advantage.** User can pick cheap/fast for drafts, expensive/quality for finals. Higgsfield locks you into one option.

### Our Advantage: Bonus Tools

4 tools Higgsfield doesn't offer in their post-processing bar:

| Bonus Tool | What it does | We have? | Model |
|-----------|-------------|----------|-------|
| **Style Transfer** | Apply visual style from reference image to generated output | Partially — AI Analyze "Copy Style" extracts style prompt. Need img2img apply step | GPT Image 2 img2img |
| **Background Remove** | Remove background, isolate subject | No | Kie AI (if available) or Replicate (rembg/SAM) |
| **Color Grade** | Apply color palette to existing image | Partially — ColorPalettePicker extracts colors. Need post-gen apply | GPT Image 2 img2img with palette prompt |
| **Extend / Outpaint** | Extend image beyond its borders (uncrop) | No | Flux Fill (already integrated for inpaint, supports outpaint) |

---

## 4. Implementation Plan

### Phase 1: Wire Existing Models to UI (Small — 1 session)

Everything here uses models ALREADY in our codebase. Zero new API integrations.

#### 1a. Upscale Button on Generated Images

**What:** Add "Upscale" action to generated image cards in Generated Panel and Gallery.

**Models:**
- Topaz Upscale (`topaz/image-upscale`) — 2x (12cr), 4x (15cr). Best quality.
- Crisp Upscale (`recraft/crisp-upscale`) — ~1cr. Fast/cheap, good enough for most cases.

**UI:** Click upscale → small popover:
```
┌─────────────────────────┐
│  Upscale                │
│                         │
│  ○ Crisp 2x    (1 cr)  │
│  ○ Topaz 2x   (12 cr)  │
│  ○ Topaz 4x   (15 cr)  │
│                         │
│  [Upscale]              │
└─────────────────────────┘
```

**Flow:** Select factor → deduct credits → call Kie API → poll result → save to `storyboard_files` as new generated output → appears in Generated Panel.

**Files to modify:**
- `GeneratedImageCard.tsx` — add Upscale button/action
- `VideoImageAIPanel.tsx` — possibly add upscale to context menu
- Reuse existing `kieAI.ts` + `pull-result` polling pattern

#### 1b. Enhance Button (Prompt-Based)

**What:** One-click enhance using existing image-to-image models with curated prompt templates.

**Models:**
- GPT Image 2 img2img (`gpt-image-2-img2img`) — best quality
- Nano Banana Edit (`nano-banana-edit`) — cheaper option
- Character Edit (`character-edit-ideogram`) — face-specific

**Enhance presets (prompt templates):**

| Preset | Prompt Template |
|--------|----------------|
| **Face & Skin** | "Enhance facial details, natural skin retouching, restore clarity, improve skin texture while maintaining realism, professional portrait retouching" |
| **Sharpen & Detail** | "Enhance fine details, sharpen textures and edges, increase clarity, improve micro-contrast while preserving natural look" |
| **Color & Tone** | "Professional color correction, enhance color vibrancy, improve tonal range, cinematic color grading, balanced highlights and shadows" |
| **Cinematic** | "Cinematic film grade enhancement, add subtle film grain, anamorphic lens quality, professional color grading, shallow depth of field feel" |
| **Full Enhance** | "Professional image enhancement: sharpen details, improve skin texture, enhance colors, cinematic color grading, increase clarity, natural retouching" |

**UI:** Click enhance → preset selector:
```
┌───────────────────────────────────┐
│  Enhance                          │
│                                   │
│  [Face & Skin]  [Sharpen]         │
│  [Color & Tone] [Cinematic]       │
│  [Full Enhance]                   │
│                                   │
│  Model: GPT Image 2 ▾  (4 cr)    │
│                                   │
│  [Enhance]                        │
└───────────────────────────────────┘
```

**Flow:** Select preset + model → deduct credits → send image + enhance prompt to img2img API → poll → save result.

**Files to modify:**
- `GeneratedImageCard.tsx` — add Enhance button
- Reuse existing inpaint API pattern (image + prompt → img2img, no mask)

#### 1c. Video Upscale Button

**What:** Wire existing Topaz Video Upscale to generated video cards.

**Model:** `topaz/video-upscale` — 2x (8cr/sec), 4x (14cr/sec)

**UI:** Same pattern as image upscale but on video cards.

**Already partially exists in VideoImageAIPanel.** Needs clean UI button on video outputs.

---

### Phase 2: Relight (Medium — 1 session)

The most impactful new feature. This is what makes "cinematic quality" — lighting IS cinematography.

#### Option A: IC-Light via Replicate (Recommended)

**IC-Light** is an open-source relighting model by Tencent (released 2024, widely available on Replicate).

**What it does:** Takes an image + lighting description → generates re-lit version. Understands 3D depth and surface normals from 2D image.

**Integration:**
- New API route: `app/api/storyboard/relight/route.ts`
- Replicate API: `POST https://api.replicate.com/v1/predictions`
- Model: `lllyasviel/ic-light` or similar
- Input: `{ image, prompt (lighting description), strength }`
- Output: Re-lit image URL
- Cost: ~$0.03-0.05 per run → 5-8 credits

**Lighting presets:**

| Preset | Prompt | Icon |
|--------|--------|------|
| **Dramatic Side** | "Strong directional side light from the left, deep shadows on right, high contrast, dramatic mood" | Half-lit face |
| **Soft Front** | "Soft diffused front lighting, even illumination, beauty lighting, soft shadows" | Sun icon |
| **Backlit / Rim** | "Strong backlight creating rim light and silhouette edge glow, lens flare, contre-jour" | Halo |
| **Golden Hour** | "Warm golden hour sunlight, long shadows, amber tones, magic hour cinematography" | Sunset |
| **Blue Hour** | "Cool blue twilight lighting, soft ambient, pre-dawn or post-sunset atmosphere" | Moon |
| **Neon Night** | "Neon colored lighting, cyberpunk city glow, mixed colored light sources, urban night" | Neon sign |
| **Moonlight** | "Cold moonlight from above, blue-silver tones, night scene, low ambient light" | Crescent |
| **Studio Rembrandt** | "Classic Rembrandt lighting, triangle of light on cheek, one key light at 45 degrees" | Triangle |
| **Overhead** | "Harsh overhead lighting, strong top-down shadows, noon sun directly above" | Down arrow |
| **Underlight** | "Dramatic underlighting from below, horror/thriller mood, eerie upward shadows" | Up arrow |

**UI — Two options:**

**Option 2a: Preset Grid (Simple, ship fast)**
```
┌───────────────────────────────────────┐
│  Relight                              │
│                                       │
│  [Dramatic] [Soft]  [Backlit]         │
│  [Golden]   [Blue]  [Neon]            │
│  [Moon]     [Studio] [Over] [Under]   │
│                                       │
│  Strength: ───●─── 0.75              │
│                                       │
│  Model: IC-Light ▾  (6 cr)            │
│  [Relight]                            │
└───────────────────────────────────────┘
```

**Option 2b: Draggable Light Pad (Match Higgsfield)**
```
┌───────────────────────────────────────┐
│  Relight                              │
│                                       │
│       ┌─────────────┐                 │
│       │      ●      │  ← drag light  │
│       │    / | \    │     position    │
│       │   /  |  \   │                 │
│       │  Subject    │                 │
│       └─────────────┘                 │
│                                       │
│  Mode: ○ Soft  ● Hard                │
│  Intensity: ───●─── 0.8              │
│  Color: ○ Warm  ○ Neutral  ○ Cool    │
│                                       │
│  [Relight]  (6 cr)                    │
└───────────────────────────────────────┘
```

Light pad position → converted to prompt: "Strong directional light from upper-left at 45 degrees, hard shadows..."

**Recommendation:** Ship Option 2a (presets) first. Add 2b (light pad) as enhancement later. Presets cover 90% of use cases and ship faster.

#### Option B: Prompt-Based via GPT Image 2 (Cheaper, no new API)

Skip Replicate entirely. Use GPT Image 2 image-to-image with lighting prompts.

**Pros:** No new API integration, uses existing model, cheaper (4 credits).
**Cons:** Less precise control, GPT may change more than just lighting.

**Could ship as v1, then upgrade to IC-Light for v2.**

---

### Phase 3: Post-Gen Angles (Medium — 1 session)

#### Option A: Zero123++ via Replicate

**Zero123++** generates multiple views from a single image. Good for product shots and character turnarounds.

- Input: single image
- Output: 6-12 views at different angles
- Cost: ~$0.05-0.10 per run → 8-12 credits

**UI:** Reuse our existing CameraAnglePicker but in "post-gen" mode:
- User selects a generated image
- Opens CameraAnglePicker
- Picks desired angle
- Runs Zero123++ → generates new view
- Saves as new output in Generated Panel

#### Option B: Prompt-Based via GPT Image 2 (Simpler)

Use GPT Image 2 img2img with angle change prompt:
- "Same scene from a low angle looking up"
- "Same scene from bird's eye view overhead"
- "Same scene from behind the subject"

**Pros:** No new API, cheaper (4cr), works now.
**Cons:** Less consistent — GPT may alter scene details, not just angle.

**Recommendation:** Start with Option B (prompt-based). If quality insufficient, upgrade to Zero123++ later.

---

### Phase 4: Bonus Tools — Beat Higgsfield (Medium — 1-2 sessions)

These are tools Higgsfield DOESN'T have. Adding them puts us ahead, not just at parity.

#### 4a. Background Remove (CONFIRMED — Kie AI model available)

**What:** One-click subject isolation. Transparent background output.

**Model:** `recraft/remove-background` via Kie AI (CONFIRMED)
- **Kie cost:** 1 credit ($0.005)
- **Our price:** 1 credit ($0.01) — 50% margin
- **API:** Same `createTask` pattern as all other Kie models
- **Input:** Image URL (PNG/JPG/WEBP, max 5MB, max 16MP, max 4096px, min 256px)
- **Output:** Transparent PNG
- **Endpoint:** `POST https://api.kie.ai/api/v1/jobs/createTask`
- **Model ID:** `recraft/remove-background`
- **Reference:** https://kie.ai/recraft-remove-background

```json
{
    "model": "recraft/remove-background",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
        "image": "https://example.com/image.webp"
    }
}
```

**UI:** One-click button in EditImageAIPanel left toolbar. No prompt needed, no mask needed. Just image in → transparent PNG out.

**Use cases:** Product shots, compositing, social media content, element isolation.

**Credits:** 1 credit (cheapest operation in the system).

#### 4b. Extend / Outpaint / Reframe (CONFIRMED — Kie AI model available)

**What:** Extend image beyond its borders — uncrop, reframe to different aspect ratio, add more scene.

**Models:**

**Option 1: Ideogram V3 Reframe** (`ideogram/v3-reframe`) — CONFIRMED on Kie AI
- Purpose-built for outpainting/reframing. Preserves visual consistency.
- **Rendering speeds:** TURBO (3.5 Kie cr / $0.0175), BALANCED (7 cr / $0.035), QUALITY (10 cr / $0.05)
- **Target aspect ratios:** square, square_hd, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9
- **Styles:** AUTO, GENERAL, REALISTIC, DESIGN
- **Multi-output:** 1-4 images per request
- **Max input:** 10MB
- **Reference:** https://docs.kie.ai/market/ideogram/v3-reframe

```json
{
    "model": "ideogram/v3-reframe",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
        "image_url": "https://example.com/image.webp",
        "image_size": "landscape_16_9",
        "rendering_speed": "BALANCED",
        "style": "AUTO",
        "num_images": "1",
        "seed": 0
    }
}
```

**Option 2: Flux Fill** (already integrated for inpaint) — mask-based outpaint, more manual

**Recommendation:** Ideogram V3 Reframe for one-click reframing (pick target aspect ratio, done). Flux Fill for custom directional extend (mask a border, fill).

**UI:**
```
┌──────────────────────────────────┐
│  Reframe / Extend                │
│                                  │
│  Target:                         │
│  [16:9] [4:3] [1:1] [9:16]      │
│                                  │
│  Speed: ○ Turbo  ● Balanced     │
│  Style: AUTO ▾                   │
│                                  │
│  [Reframe]  (7 cr)               │
└──────────────────────────────────┘
```

**Credits:** Turbo 4cr, Balanced 8cr, Quality 12cr (with our markup).

#### 4c. Style Transfer (Post-Gen)

**What:** Apply the visual style of a reference image to a generated output.

**How:** Two-step:
1. AI Analyze "Copy Style" extracts style description from reference (already built, 1cr)
2. GPT Image 2 img2img applies that style to target image (4cr)

**Already 80% built.** Just needs the "apply" step wired together.

**UI:** Drag reference image onto generated image → "Apply Style" button.

#### 4d. Color Grade (Post-Gen)

**What:** Apply color palette to existing generated image.

**How:** ColorPalettePicker extracts hex colors (already built). GPT Image 2 img2img applies them:
- "Color grade this image with dominant palette: #2C1810, #8B4513, #D2691E, #FFD700, #1C1C2E, #4A0E4E — warm amber shadows, golden highlights"

**Already 80% built.** Just needs the "apply" step.

---

## 5. The Post-Processing Toolbar

### Where it lives

The toolbar appears on generated images in two places:

**A. Generated Panel (in SceneEditor)**
When user clicks a generated image, toolbar appears below it:
```
┌──────────────────────────────────────────────┐
│  [generated image preview - large]           │
│                                              │
│  ─────────────────────────────────────────── │
│  [Upscale] [Enhance] [Relight] [Inpaint]    │
│  [Angles]  [Remove BG] [Extend] [Style]     │
│  ─────────────────────────────────────────── │
└──────────────────────────────────────────────┘
```

**B. Context Menu (right-click on any generated image)**
```
┌─────────────────────────┐
│ Set as Frame Image      │
│ Set as Next Frame       │
│ ────────────────────    │
│ Upscale            ►    │
│ Enhance            ►    │
│ Relight            ►    │
│ Inpaint (Edit)          │
│ Change Angle       ►    │
│ Remove Background       │
│ Extend             ►    │
│ ────────────────────    │
│ Download                │
│ Delete                  │
└─────────────────────────┘
```

### Design System

Match existing storyboard studio dark theme:
- Container: `bg-(--bg-secondary)/95 backdrop-blur-md border border-(--border-primary) rounded-xl`
- Buttons: `bg-(--bg-primary) hover:bg-(--bg-tertiary) text-(--text-secondary) rounded-lg`
- Active tool: `border-(--accent-blue) text-(--accent-blue)`
- Credits badge: `text-[10px] text-(--text-tertiary)` showing cost per action

---

## 6. Scorecard — Us vs Higgsfield Post-Processing

### At parity (after Phase 1-3)

| Tool | Higgsfield | Us | Winner |
|------|-----------|-----|--------|
| Overview | Info panel | Frame Info Dialog (more detailed) | **Us** |
| Upscale | 1 model (2x-16x) | **2 models** (Topaz + Crisp), user picks quality vs cost | **Us** |
| Enhance | 1 model (face-specific) | **3 models** (GPT, NB Edit, Character Edit) + 5 presets | **Us** |
| Relight | 3D light pad + soft/hard | 10 lighting presets + strength + model choice | **Tie** (theirs has cooler UI, ours has more presets) |
| Inpaint | NB Pro (1 model) | **10+ models** with brush + rectangle + prompt | **Us** |
| Angles | Novel view synthesis 360 | Prompt-based (v1) or Zero123++ (v2) | **Higgsfield** (until we add Zero123++) |

### Beyond parity (after Phase 4)

| Bonus Tool | Higgsfield | Us |
|-----------|-----------|-----|
| Background Remove | No | **YES** |
| Extend / Outpaint | No | **YES** |
| Style Transfer | No | **YES** |
| Color Grade | No | **YES** |

**Result: 6 tools at parity + 4 bonus tools they don't have = we WIN on post-processing.**

---

## 7. Pricing

### Image Post-Processing Credits

| Tool | Cheap Option | Quality Option |
|------|-------------|---------------|
| Upscale 2x | Crisp — 1 cr ($0.01) | Topaz — 12 cr ($0.12) |
| Upscale 4x | — | Topaz — 15 cr ($0.15) |
| Enhance | NB Edit — 5 cr ($0.05) | GPT Image 2 — 4 cr ($0.04) |
| Relight (presets) | GPT prompt — 4 cr ($0.04) | IC-Light — 6 cr ($0.06) |
| Inpaint | Z-Image — 1 cr ($0.01) | GPT 4o — 8 cr ($0.08) |
| Angles | GPT prompt — 4 cr ($0.04) | Zero123++ — 10 cr ($0.10) |
| Background Remove | Recraft — 1 cr ($0.01) CONFIRMED | — |
| Extend | Flux Fill — 5 cr ($0.05) | — |
| Style Transfer | Analyze 1cr + GPT 4cr = 5 cr | — |
| Color Grade | GPT prompt — 4 cr ($0.04) | — |

### Video Post-Processing Credits

| Tool | Cost |
|------|------|
| Video Upscale 2x | 8 cr/sec |
| Video Upscale 4x | 14 cr/sec |

**Cheapest full pipeline:** Generate (4cr) + Crisp Upscale (1cr) + Enhance (4cr) = **9 credits total** for a high-quality enhanced image. That's $0.09.

**Quality full pipeline:** Generate (5cr) + Topaz 4x (15cr) + Enhance GPT (4cr) + Relight (6cr) = **30 credits total**. That's $0.30.

---

## 8. Build Priority & Effort

| Phase | What | Effort | Impact | Dependencies |
|-------|------|--------|--------|-------------|
| **1a** | Upscale button (Topaz + Crisp) | Small | High — most requested post-processing feature | None — models exist |
| **1b** | Enhance button (prompt-based) | Small | High — instant quality improvement | None — models exist |
| **1c** | Video Upscale button | Small | Medium | None — model exists |
| **2** | Relight (presets first, light pad later) | Medium | Very High — this IS cinematic quality | New: Replicate API or prompt-based |
| **3** | Post-gen Angles (prompt-based v1) | Small | Medium | None — GPT img2img exists |
| **4a** | Background Remove | Small | Medium | New: rembg or Replicate |
| **4b** | Extend / Outpaint | Medium | Medium | Flux Fill exists, needs UI |
| **4c** | Style Transfer (wire existing) | Small | Medium | AI Analyze exists, needs apply step |
| **4d** | Color Grade (wire existing) | Small | Low | ColorPalette exists, needs apply step |
| **5** | Post-processing toolbar UI | Medium | High — unifies all tools | After Phase 1-2 |

### Recommended order

```
Session 1: Phase 1a + 1b (Upscale + Enhance buttons)
Session 2: Phase 2 (Relight with presets)
Session 3: Phase 3 + 4a (Angles + Background Remove)
Session 4: Phase 4b + 4c + 4d (Extend + Style + Color Grade)
Session 5: Phase 5 (Unified toolbar UI)
```

---

## 9. Technical Architecture

### API Pattern (same for all post-processing tools)

```
User clicks tool on generated image
    │
    ├── Deduct credits (Convex mutation)
    │
    ├── POST /api/storyboard/post-process
    │   {
    │     action: "upscale" | "enhance" | "relight" | "angles" | "remove-bg" | "extend",
    │     imageUrl: string,
    │     model: string,
    │     options: {
    │       // action-specific:
    │       factor?: "2x" | "4x",           // upscale
    │       preset?: string,                  // enhance, relight
    │       prompt?: string,                  // enhance, relight, angles
    │       strength?: number,                // relight
    │       direction?: string,               // extend
    │       angle?: { rotation, tilt, zoom }, // angles
    │     }
    │   }
    │
    ├── Route to correct model/API:
    │   ├── Kie AI (Topaz, Crisp, GPT, NB, Flux)
    │   ├── Replicate (IC-Light, Zero123++, rembg)
    │   └── OpenRouter (analysis step for style transfer)
    │
    ├── Poll for result (existing pull-result pattern)
    │
    └── Save to storyboard_files as new generated output
        └── Appears in Generated Panel immediately (Convex real-time)
```

### Single API Route vs Multiple

**Recommendation: Single route** — `app/api/storyboard/post-process/route.ts`

Handles all post-processing actions. Switches internally by `action` parameter. Same auth, credit deduction, polling, and result storage pattern for all tools.

**Why single route:**
- Less file bloat (1 route vs 6+)
- Shared auth/credit logic
- Same polling pattern
- Same result storage
- Easy to add new tools

### Replicate Integration (new)

For tools that need models not in Kie AI (IC-Light, Zero123++, rembg):

```typescript
// lib/replicate.ts
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function runReplicateModel(model: string, input: Record<string, any>) {
  const prediction = await replicate.run(model, { input });
  return prediction; // Returns output URL
}
```

**New env var:** `REPLICATE_API_TOKEN`

**Fallback strategy:** If Replicate is down or too slow, fall back to prompt-based GPT Image 2 approach for relight and angles. Degrade gracefully, never fail.

---

## 10. Key Decision: Replicate vs Prompt-Only

| Approach | Pros | Cons |
|----------|------|------|
| **Replicate (IC-Light, Zero123++)** | Purpose-built models, best quality, precise control | New API dependency, new env var, per-run cost |
| **Prompt-only (GPT Image 2 img2img)** | No new dependency, uses existing models, cheaper | Less precise, may alter scene content beyond intended change |
| **Hybrid (recommended)** | Best of both — Replicate for quality, GPT for cheap/fallback | Two code paths |

**Recommendation: Hybrid.** Ship prompt-based v1 immediately (zero new dependencies). Add Replicate models as quality upgrade when ready. User chooses via model selector.

---

## 11. Success Criteria

### 100% parity with Higgsfield

- [ ] Upscale 2x/4x with model choice (Topaz + Crisp)
- [ ] Enhance with 5 presets and model choice
- [ ] Relight with 10 lighting presets and strength control
- [ ] Inpaint (already done — 10+ models)
- [ ] Post-gen angle change (prompt-based minimum)

### Beyond Higgsfield (110%)

- [ ] Background remove (they don't have this)
- [ ] Extend / outpaint (they don't have this)
- [ ] Style transfer from reference (they don't have this)
- [ ] Color grade from palette (they don't have this)
- [ ] Multi-model choice per tool (they offer 1 model, we offer 2-3)
- [ ] Cheap + quality tiers (they have one price, we have cheap drafts + quality finals)

### Updated comparison doc claim

**Before:** "Soul Cinema image quality — Can't build (proprietary model)"

**After:** "Soul Cinema quality — **MATCHED via post-processing pipeline** (Upscale + Enhance + Relight). We offer MORE post-processing tools (10 vs 6) with model choice per tool. Their only remaining advantage is the Soul Cinema base model aesthetic, which is offset by our GPT Image 2 + Nano Banana Pro quality + post-processing stack."

---

## 12. What This Means for the Competition

### Updated gap table (after implementation)

| Competitor Feature | Previous Status | New Status |
|-------------------|----------------|------------|
| Soul Cinema image quality | "Can't build" | **CLOSED** — post-processing pipeline matches output quality |
| Upscale | "Code exists, not wired" | **DONE** — with model choice |
| Enhancer | "Not in Kie AI" | **DONE** — prompt-based via existing models |
| Relight | "Not in Kie AI" | **DONE** — presets + optional Replicate |
| Post-gen Angles | "Pre-gen only" | **DONE** — prompt-based + optional Zero123++ |

### Higgsfield remaining advantages (honest)

After building this pipeline, Higgsfield's ONLY remaining advantages are:

1. **AI Co-Director (Mr. Higgs)** — buildable, planned
2. **Native Audio Sync** — model-level, can't replicate
3. **Physics-Aware Generation** — model-level, can't replicate
4. **Cinematic Reasoning** — model-level, can't replicate

**Soul Cinema quality is no longer on this list.**
