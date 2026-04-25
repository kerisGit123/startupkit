# Pricing Page Redesign Plan

> **Date:** 2026-04-25
> **Status:** IMPLEMENTED (2026-04-25)
> **Goal:** Make our pricing page as compelling as Higgsfield's while highlighting our unique advantages

---

## 1. Current Problems

Our pricing page is a plain spec list:
- Just shows: storage, projects, credits, seats
- No generation count estimates (user has to do math)
- No feature differentiation between tiers
- No savings badges or urgency
- No target audience taglines
- Doesn't communicate value — looks like a settings page, not a sales page

---

## 2. Higgsfield Pricing Page — What They Do Well

| Element | How they do it |
|---|---|
| **Generation estimates** | "= 500 Nano Banana Pro Generations, ~114 Kling 3.0 videos" — user instantly knows what they get |
| **Credit slider** | Ultra plan has a slider (3,000 → 9,000 credits) — user picks their volume |
| **Savings badges** | "20% OFF", "30% OFF", "Save $120 compared to monthly" — creates urgency |
| **Tier targeting** | "For first-time AI content creators" / "For creators building AI projects" / "For agencies and small teams" |
| **Feature checkmarks (✓/✗)** | Clear visual: what's locked on Basic vs unlocked on Plus/Ultra |
| **Unlimited perks** | "7-DAY UNLIMITED" section with model-specific unlimited badges |
| **365-day unlimited** | Dedicated section showing which models are unlimited for a year |
| **Parallel generation limits** | "up to 6 Videos, 8 Images" — power users care about this |
| **Annual billing toggle** | Shows both monthly and annual pricing with savings |
| **Model names in estimates** | Users see familiar model names, not abstract "credits" |

---

## 3. Our Redesigned Pricing Page — Layout

### 3.1 Header

```
Choose Your Plan
The all-in-one AI storyboard studio — script to export in one app

[Monthly]  [Annual — Save 20%]    ← billing toggle
```

### 3.2 Three-Column Card Layout

```
┌─────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  FREE            │  │  PRO          POPULAR │  │  BUSINESS            │
│  For hobbyists   │  │  For creators         │  │  For teams & studios │
│                  │  │                       │  │                      │
│  $0              │  │  $45 $39.90/mo        │  │  $119 $89.90/mo      │
│  Always free     │  │  Billed annually      │  │  Billed annually     │
│                  │  │  Save $61/yr          │  │  Save $349/yr        │
│                  │  │                       │  │                      │
│  ┌────────────┐  │  │  ┌─────────────────┐  │  │  ┌────────────────┐ │
│  │ 50 cr/mo   │  │  │  │ 3,500 cr/mo     │  │  │  │ 8,000 cr/mo    │ │
│  │ ~12 images │  │  │  │ ~875 images     │  │  │  │ ~2000 images   │ │
│  │ ~1 video   │  │  │  │ ~120 S2F videos │  │  │  │ ~275 S2F vids  │ │
│  └────────────┘  │  │  └─────────────────┘  │  │  └────────────────┘ │
│                  │  │                       │  │                      │
│  [Start Free]    │  │  [Get Pro]            │  │  [Get Business]      │
│                  │  │                       │  │                      │
│  ── Features ──  │  │  ── Everything in ──  │  │  ── Everything in ── │
│                  │  │  ── Free, plus: ──    │  │  ── Pro, plus: ──    │
│                  │  │                       │  │                      │
│  ✓ 3 projects    │  │  ✓ Unlimited projects │  │  ✓ 15 seats (no fee)  │
│    (20 frames)   │  │    & frames           │  │  ✓ 20 GB storage     │
│  ✓ 300 MB        │  │  ✓ 10 GB storage     │  │  ✓ 3 organizations   │
│  ✓ All 25+ AI    │  │  ✓ 5 seats, 1 org    │  │  ✓ Shared credit pool│
│  ✓ Canvas + edit │  │  ✓ Camera Studio     │  │  ✓ Priority support  │
│  ✓ AI Analyze    │  │  ✓ 3D Angle + Speed  │  │  ✓ Team analytics    │
│  ✓ Face swap     │  │  ✓ Video editor      │  │                      │
│  ✓ Inpaint       │  │  ✓ Music AI          │  │                      │
│  ✗ Camera Studio │  │  ✓ Director's View   │  │                      │
│  ✗ Video editor  │  │  ✓ Batch Generation  │  │                      │
│  ✗ Music AI      │  │  ✓ Presets system    │  │                      │
│  ✗ Director View │  │  ✓ Video export MP4  │  │                      │
│  ✗ Batch gen     │  │                       │  │                      │
└─────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### 3.3 Generation Estimate Box (inside each card)

Show familiar model names with generation counts:

```
┌─────────────────────────────────┐
│  3,500 credits/month            │
│                                 │
│  = ~437 Nano Banana 2 images    │
│  = ~291 Nano Banana 2 (2K)      │
│  = ~116 Seedance 1.5 Pro videos │
│  = ~70 Kling 3.0 videos         │
│                                 │
│  Credits never expire           │
└─────────────────────────────────┘
```

### 3.4 Credit Top-Up Section (below plans)

```
┌──────────────────────────────────────────────────────┐
│  Need more credits? Buy anytime — no subscription    │
│                                                      │
│  [1,000 cr — $9.90]  [5,000 cr — $49.50]            │
│  [25,000 cr — $247.50]                               │
│  Flat rate $0.0099/credit. Credits never expire.     │
└──────────────────────────────────────────────────────┘
```

### 3.5 "Why Storytica" Section (below pricing)

Highlight what competitors DON'T have:

```
┌──────────────────────────────────────────────────────────────────┐
│  Why creators choose Storytica over single-purpose AI tools      │
│                                                                  │
│  🎬 All-in-one pipeline      │  🎨 Canvas + AI editing          │
│  Script → storyboard →       │  Draw, annotate, inpaint —       │
│  generate → edit → export    │  not just generate and download   │
│                              │                                   │
│  🎵 Music AI built in        │  🔄 Real-time collaboration      │
│  Generate, extend, cover —   │  No save button. Changes sync    │
│  no separate subscription    │  instantly across your team       │
│                              │                                   │
│  📹 Video editor + timeline  │  💾 Credits never expire          │
│  Multi-track, subtitles,     │  Buy once, use anytime.          │
│  blend modes, WebCodecs      │  No monthly resets.              │
│                              │                                   │
│  🎥 Director's View          │  📦 Credit top-ups               │
│  Filmstrip, comparison,      │  No subscription needed.         │
│  animatic playback, notes    │  Pay as you go from $5.          │
└──────────────────────────────────────────────────────────────────┘
```

### 3.6 Feature Comparison Table (collapsible, bottom of page)

Full feature grid — every feature, every plan, ✓ or ✗:

| Feature | Free | Pro | Business |
|---|:---:|:---:|:---:|
| **AI Generation (all plans)** | | | |
| AI image generation (25+ models) | ✓ | ✓ | ✓ |
| AI video generation | ✓ | ✓ | ✓ |
| Face swap | ✓ | ✓ | ✓ |
| AI Analyze (image/video/audio) | ✓ | ✓ | ✓ |
| Prompt Enhance | ✓ | ✓ | ✓ |
| Text-to-speech (ElevenLabs) | ✓ | ✓ | ✓ |
| **Canvas & Editing (all plans)** | | | |
| Drawing canvas + shapes | ✓ | ✓ | ✓ |
| Bubble text + annotations | ✓ | ✓ | ✓ |
| AI inpaint (edit sections) | ✓ | ✓ | ✓ |
| Edit image (AI-powered) | ✓ | ✓ | ✓ |
| Element manager + library | ✓ | ✓ | ✓ |
| Script-to-storyboard | ✓ | ✓ | ✓ |
| PDF export | ✓ | ✓ | ✓ |
| **Camera & Motion (Pro+)** | | | |
| Camera Studio (virtual lenses) | ✗ | ✓ | ✓ |
| 3D Camera Angle Picker | ✗ | ✓ | ✓ |
| Motion camera presets (15+) | ✗ | ✓ | ✓ |
| Speed Ramp Editor | ✗ | ✓ | ✓ |
| Color Palette Picker | ✗ | ✓ | ✓ |
| **Production Tools (Pro+)** | | | |
| Director's View filmstrip | ✗ | ✓ | ✓ |
| Compare frames side-by-side | ✗ | ✓ | ✓ |
| Batch frame generation | ✗ | ✓ | ✓ |
| Presets system (save & reuse) | ✗ | ✓ | ✓ |
| Music AI + Cover Song + Personas | ✗ | ✓ | ✓ |
| **Video Editor & Export (Pro+)** | | | |
| Video editor (multi-track) | ✗ | ✓ | ✓ |
| Subtitle track + blend modes | ✗ | ✓ | ✓ |
| Video export (MP4) | ✗ | ✓ | ✓ |
| **Limits & Team** | | | |
| Projects | 3 | Unlimited | Unlimited |
| Frames per project | 20 | Unlimited | Unlimited |
| Storage | 300 MB | 10 GB | 20 GB |
| Credits/month | 50 | 3,500 | 8,000 |
| Seats (no per-seat charge) | 1 | 5 | 15 |
| Organizations (one plan) | — | 1 | 3 |
| Shared credit pool | — | — | ✓ |
| Priority support | — | — | ✓ |

---

## 4. Design Notes

### Colors & Style
- Follow existing dark theme (CSS variables from design system)
- Pro card should be highlighted (border glow, "POPULAR" badge)
- Use the accent colors: blue for Pro, green/teal for Business
- Savings badges: bright yellow/green like Higgsfield's "20% OFF"
- Annual/monthly toggle with smooth animation

### Key Differences from Higgsfield
- We show **generation estimates** (like them) but also emphasize **pipeline features** (unlike them)
- We highlight **credits never expire** — Higgsfield doesn't have this
- We show **credit top-ups** — Higgsfield forces subscription
- We show **seats included** — Higgsfield charges per seat separately ($62/seat)
- We DON'T do unlimited models — our edge is value, not volume

### Mobile
- Stack cards vertically on mobile
- Feature comparison table becomes horizontal-scrollable
- Billing toggle stays fixed at top

---

## 5. Competitive Messaging (subtle, don't name competitors)

**In generation estimate box:**
> "Credits never expire — unlike subscription models that reset monthly"

**In top-up section:**
> "No subscription required. Buy credits when you need them."

**In why-us section:**
> "Most AI tools just generate and stop. Storytica takes you from script to final export — all in one app."
> "5 seats included at Pro — no per-seat pricing surprises."

---

## 6. Implementation — DONE (2026-04-25)

### Files

| File | What |
|------|------|
| `app/storyboard-studio/components/account/PricingShowcase.tsx` | New reusable pricing showcase component |
| `app/storyboard-studio/components/account/BillingSubscriptionPage.tsx` | Plans tab now uses PricingShowcase; Clerk PricingTable shown on CTA click for checkout |
| `app/pricing/page.tsx` | Public pricing page rewritten to use PricingShowcase |

### What was built

| Element | Implementation |
|---------|---------------|
| **3-column card layout** | Free (dark) / Pro (teal gradient, MOST POPULAR badge) / Business (purple gradient, BEST VALUE badge) |
| **Generation estimates** | Each card shows GPT Image 2 images + Seedance 2.0 Fast videos + Seedance 1.5 Pro videos |
| **Billing toggle** | Monthly / Annual with "Save 20%" pill on annual button |
| **Price strikethrough** | Annual shows original monthly crossed out + yellow "Save $X/yr" badge |
| **Feature check/cross** | Free card: AI gen + canvas included (✓), production tools locked (✗: Camera Studio, Video editor, Music AI, Director's View, Batch gen) |
| **Tier taglines** | "For hobbyists & first-time creators" / "For serious creators & small teams" / "For agencies & production studios" |
| **Credit top-up section** | 1,000 / 5,000 / 25,000 credits with per-credit price + "Save 9%/20%" badges |
| **Why Storytica** | 9-card grid: Storyboard-first, No per-seat charges, One plan multiple orgs, Credits never expire, 25+ models, Pro creative tools, Canvas+annotations, Real-time collaboration, Transparent pricing |
| **Feature comparison table** | Collapsible, 7 categories (AI Generation, Canvas & Editing, Camera & Motion, Production Tools, Video Editor & Export, Limits & Team), 35+ features |
| **Active plan indicator** | Green "Active" badge + ring glow on current plan |
| **Clerk checkout** | PricingTable appears below only after clicking a plan CTA button |

### Design choices

- **Accent colors:** Pro = teal/emerald, Business = purple/pink (intentionally different from Higgsfield's uniform green)
- **Generation estimates show 3 models** — GPT Image 2, Seedance 2.0 Fast, Seedance 1.5 Pro
- **"Top-up credits never expire"** shown inside every card's estimate box — our strongest competitive differentiator
- **Free users get all AI gen + canvas** — upgrade incentive is production tools, not generation access
- **Mobile:** Cards stack vertically, comparison table is horizontally scrollable via `overflow-x-auto`

### Competitive advantages surfaced in the UI

1. **"Images from $0.04 / Videos from $0.05"** — header pill badge
2. **Generation counts** with 3 model names — users see concrete value
3. **Production tools locked on Free** — Camera Studio, Video editor, Music AI, Director's View, Batch gen
4. **Credits never expire** — repeated in estimate box + What makes Storytica different section
5. **No per-seat charges** — emphasized: Pro includes 5 seats, Business includes 15
6. **One plan, multiple orgs** — Business supports 3 orgs from one subscription
7. **Real-time collaboration** — powered by Convex, no save button
8. **Yellow savings badges** — urgency via "Save $61/yr", "Save $349/yr"
9. **"No subscription required"** on top-ups — anti-Higgsfield positioning

---

## 7. Feature Gating — IMPLEMENTED (2026-04-25)

**Strategy: Free users get all AI generation + canvas editing. Production workflow tools are Pro+.**

### Free users get (all plans):
- All 25+ AI models (image, video, face swap, analyze, prompt enhance, TTS)
- Full canvas editing (drawing, bubble text, annotations, stickers, AI inpaint, edit image)
- Element manager, script-to-storyboard, PDF export

### Locked on Free (Pro+ only):
- Camera Studio + 3D Angle + Motion presets
- Speed Ramp + Color Palette
- Video editor (multi-track timeline) + subtitle track + blend modes + MP4 export
- Director's View + Compare frames
- Batch generation + Presets system
- Music AI + Cover Song + Personas

### Limits on Free:
- 3 projects, 20 frames per project, 300 MB storage, 50 credits/month

### Implementation:
- `useFeatures()` hook returns `hasProFeatures`, `maxFramesPerProject`
- `plan-config.ts` has `proFeatures: boolean` and `maxFramesPerProject` per plan
- Locked UI: buttons show lock icon + toast "Upgrade to Pro" on click
- Server-side: `convex/storyboard/storyboardItems.ts` enforces frame limit via `FRAME_LIMITS`
- Org members inherit owner's plan — free users in a Pro org get full access

---

## 8. FAQ & Support Chat Cost Optimization — IMPLEMENTED (2026-04-25)

### Problem

The support chatbot sends every conversation to Claude Haiku, including common questions (pricing, models, free plan) that have fixed answers. This costs money on every message.

### Solution: FAQ Decision Tree in Chat Widget

Added a hardcoded FAQ decision tree to the chat widget (`components/support-chat/SupportChatWidget.tsx`). Users can click FAQ balloons to get instant answers — zero API calls to Haiku.

| Feature | Details |
|---------|---------|
| FAQ balloons | Persistent above input area, always visible |
| Decision tree | Click a question → answer appears + follow-up questions load |
| Search | Type to filter across all FAQ nodes (word-start + tag matching) |
| Navigation | Home button (reset to root) + Back button |
| Model-specific FAQs | Nano Banana 2, GPT Image 2, Seedance 2.0, Seedance 2.0 Fast, Seedance 1.5 Pro, Z-Image — each with credit costs and per-plan generation estimates |
| "View all FAQ" | Links to dedicated `/faq` page |

### Dedicated FAQ Page

Created `/faq` page (`app/(marketing)/faq/page.tsx`) with 31 questions across 6 categories (Getting Started, AI Models, Credits & Pricing, Features & Tools, Team & Collaboration, Privacy & Security). Bubble/card style, dark theme matching landing page.

### System Prompt Optimization

Removed the 15-line hardcoded credit cost table from `lib/support/systemPrompt.ts` (saved ~400 tokens per Haiku call). Replaced with instruction to use `get_ai_model_pricing` tool for current pricing — prevents stale answers and reduces cost.

### PDF Export

Added landscape A4 PDF export to workspace export modal (`WorkspaceExportModal.tsx`). Uses jsPDF directly — title page + 2x2 frame grid per page with images, badges, titles, descriptions.

---

## 9. Pricing Calculation Bug Fixes — FIXED (2026-04-25)

Three bugs found in `app/api/storyboard/pricing/calculate-price/route.ts`:

| Bug | Model | Impact | Fix |
|-----|-------|--------|-----|
| Costs swapped | Seedance 2.0 | img2vid overcharged 67% (60 instead of 36 cr at 480p 5s) | Swapped withInput/noInput labels |
| Missing case | Seedance 2.0 Fast | Charged 6 credits instead of 29-104 — revenue loss every generation | Added full per-second calculation |
| Wrong multipliers | Seedance 1.5 Pro | Audio at 1.5x instead of 2x, 12s duration wrong | Replaced with Kie credit lookup table |

Also fixed `lib/storyboard/pricing.ts` `getSeedance15()` function and model config `formulaJson` to use lookup table matching Kie API docs.

All models now verified: 20-30% margin at every price point.

---

## 10. Remaining TODO

- [ ] Wire credit top-up buttons in PricingShowcase to purchase confirmation dialog
- [ ] Add credit slider for Business plan (like Higgsfield's Ultra slider)
- [x] ~~Feature gating in studio UI~~ — implemented with `useFeatures()` hook
- [x] ~~Model-specific generation breakdown~~ — now shows GPT Image 2 + Seedance 2.0 Fast + Seedance 1.5 Pro
- [x] ~~FAQ cost optimization~~ — hardcoded FAQ balloons in chat widget, dedicated /faq page, system prompt trimmed
- [x] ~~Pricing calculation bugs~~ — Seedance 2.0 swap, 2.0 Fast missing, 1.5 Pro wrong multipliers
