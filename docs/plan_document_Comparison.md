# Competitive Analysis — Storyboard Studio

> **Last updated:** 2026-04-23
> Analysis of 6 direct competitors against our platform.
>
> **Recent session (2026-04-23):** Built 16 features across Director's View, VideoEditor, and UI polish.
> See `plan_director_view.md` for implementation details and `plan_final_design.md` for design specs.

---

## 1. Competitor Profiles

### Artlist (artlist.io)

**What they are:** Stock asset marketplace + AI video production studio. $300M ARR (2026), one of the largest in the space.

**Key features:**
- Massive stock library (music, SFX, video clips, templates)
- AI video generator with Sora 2 model
- AI image generator
- AI music and voiceover generators
- Artlist Studio — AI video production platform (casting, locations, camera angles)
- Silence removal, auto zoom editing tools
- Mobile app (iOS/Android)

**Pricing:** Subscription-based ($10-30/mo), unlimited downloads on paid plans.

**Target:** Video marketers, content creators, social media teams.

**Their moat:** Enormous stock library + $300M revenue + brand trust. They're adding AI on top of an existing content empire.

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

**What they are:** AI video generation platform with Cinema Studio for filmmaking. 4.5M video generations/day, 30+ AI models.

**Key features:**
- **Cinema Studio 3.5** — professional filmmaking environment with per-shot camera/style control
- **Mr. Higgs AI co-director** — breaks scenes into shots, adjusts settings, populates prompts in real-time
- Virtual camera system (camera bodies, lens types, Anamorphic glass, focal length, depth of field)
- 30+ AI models (Sora 2, Kling 3.0, Veo 3.1, Seedance 2.0, GPT Image 2, Soul 2.0, Nano Banana Pro)
- **Soul ID** — persistent character identity across generations
- **Photodump** — one-click multi-scene generation with character consistency
- Lipsync Studio, face swap, character swap
- Marketing Studio (multi-format from one product)
- Video editing with shot-by-shot control
- Inpainting, upscaling, background removal
- Community gallery, team collaboration
- 40+ creative AI applications
- Mobile accessible

**Pricing:** Credit-based. Starter $15/mo (200 credits), Plus $39/mo (1000 credits), Ultra $99/mo (3000 credits).

**Target:** Content creators, marketers, filmmakers, production studios, enterprises.

**Their moat:** Cinema Studio with AI co-director + virtual camera physics simulation + Soul ID character persistence. Most feature-rich AI video platform. Direct competitor to our storyboard + AI pipeline.

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
| 3D camera angle picker (sphere UI → prompt) | Planned | - | - | **YES** (3D scene) | - | - | - | - | **YES** (keyframes) |
| Camera motion presets (dolly/crane/pan/orbit/etc) | Planned (have capability, need UI buttons) | - | - | YES | - | - | - | YES | **YES** |
| Virtual camera physics (lens/DOF) | - | - | - | - | - | - | - | **YES** | - |
| AI co-director (auto shot breakdown) | - | - | - | - | - | - | - | **YES** | - |
| Shot list generation | - | - | - | YES | - | - | - | YES | - |
| Pitch deck creation | - | - | - | YES | - | - | - | - | YES |
| Retake (re-shoot specific moments) | - | - | - | - | - | - | - | - | **YES** |

### AI Generation

| Feature | Us | Artlist | Lovart | Storyboarder | Krock | ImagineArt | OpenArt | Higgsfield | LTX Studio |
|---------|:--:|:------:|:------:|:------------:|:-----:|:----------:|:------:|:----------:|:----------:|
| Multi-model image AI | **YES** (5+) | YES | YES | YES | - | **YES** (5+) | YES (20+) | **YES** (30+) | YES |
| Multi-model video AI | **YES** (5+) | Sora 2 | - | Basic | - | **YES** (5+) | Basic | **YES** (30+) | YES |
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
| Background removal | - | - | - | - | - | YES | YES | YES | - |
| Style transfer | - | - | - | YES | - | - | YES | - | YES |
| Face swap / character swap | - | - | - | - | - | - | - | **YES** | - |
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

12. **Multi-shot video (Seedance 2.0)** — UGC mode (product + influencer, 6 images), Showcase mode (subject + presenter + scene, 9 images). Generates multi-angle/multi-cut videos from reference images.

---

## 4. Our Disadvantages

### Things competitors do better

| # | Gap | Who does it better | Impact | Suggested action |
|---|-----|-------------------|--------|-----------------|
| 1 | **No stock asset library** | Artlist (millions of clips, music, SFX) | Medium — our AI generates content instead of browsing stock. But templates help onboarding | Add 10-20 starter templates (commercial, short film, explainer) |
| 2 | **No 3D camera control** | Storyboarder.ai (3D scene), LTX Studio (keyframes), Higgsfield (virtual camera physics) | Medium — useful for precise shot composition | **Planned: 3D sphere angle picker** — draggable camera on sphere, maps to prompt text. Small effort (~200 lines), no 3D reconstruction needed. AI model handles the rendering |
| 3 | **No custom model training** | OpenArt (train on your own images, share community models) | High for brand consistency — artists want to train on their style | Large effort. Explore Kie AI LoRA support if available |
| 4 | **No mobile app** | ImagineArt (100M+ downloads), Artlist | Medium — web-first is fine for pro users | Build lightweight mobile review companion (view storyboard, approve frames, add notes). Uses existing Convex real-time |
| 5 | **No script format import** | Storyboarder.ai (PDF, FDX, Fountain, Word) | Low-medium — filmmakers use Final Draft format | Small effort: add file upload → text extraction to existing script parser |
| 6 | **No review/approval workflow** | Krock.io (frame-accurate comments, version comparison, approval chains) | High for agency/team workflows | Medium effort: add reviewer role, per-frame approve/reject, comment threads |
| 7 | **No workflow/pipeline builder** | ImagineArt (visual pipeline: chain AI steps) | Medium — power users want automation | Medium-large effort. Interesting for "generate image → upscale → generate video → add music" automation |
| 8 | **No community/marketplace** | OpenArt (community models), ImagineArt (apps marketplace) | Low-medium — more relevant for consumer market | You have gallery sharing already. Consider "remix" (fork shared project as template) |
| 9 | **No NLE integrations** | Krock.io (Adobe CC, DaVinci, FCP) | Low — our editor replaces NLEs for most use cases | Future: export to Premiere XML / DaVinci EDL format |
| 10 | **Scale gap** | Artlist ($300M ARR), ImagineArt (30M users), Storyboarder (250K) | Early stage disadvantage | Focus on unique all-in-one value prop. Storyboarder's 250K users are natural upgrade candidates |

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

- **LTX Studio** is closest — has Elements + script-to-video + timeline. But no multi-model AI (own models only), no music AI, no canvas draw+AI, no real-time sync, no credit pricing
- **Higgsfield** has 30+ AI models + Cinema Studio + Soul ID. But no storyboard planning pipeline, no multi-track timeline with subtitles, no canvas editing, no music AI
- **Storyboarder.ai** is high on planning but limited on AI models (their own models only)
- **ImagineArt/OpenArt** are high on AI but have zero planning/project structure
- **Artlist** is high on stock assets but planning is basic
- **Krock.io** is high on review/collaboration but has no generation
- **Lovart** is design-focused, not filmmaking-focused

### Our natural competitors by threat level

| Threat | Competitor | Why |
|--------|-----------|-----|
| **Highest** | LTX Studio | Same pipeline vision (script → storyboard → video), Elements consistency system, camera presets, timeline editor, team collaboration. Most directly overlapping feature set. Our defense: multi-model AI (they use own models only), music AI, canvas draw+AI, real-time Convex sync, credit-based pricing |
| **Highest** | Higgsfield | 30+ AI models (same as ours), Cinema Studio with AI co-director, Soul ID character persistence, 4.5M generations/day. Our defense: storyboard planning pipeline, canvas editing, multi-track timeline with subtitles, music AI, element @mentions |
| **High** | ImagineArt | Same AI models, 30M users, adding workflow builder. If they add storyboard + timeline, they become dangerous. Our defense: project structure pipeline |
| **High** | Storyboarder.ai | Same target audience (filmmakers), 250K users, script import, 3D camera. But no multi-model AI, no timeline, no music. Their users are our upgrade path |
| **Medium** | Artlist | $300M, launching AI Studio. But stock-first DNA, subscription model, no storyboard planning. Different market segment |
| **Low** | OpenArt | Image-focused, no video editing, no storyboard. Different use case |
| **Low** | Krock.io | Review-only tool. Complementary, not competitive. Could be an integration partner |
| **Low** | Lovart | Design agent, not filmmaking. Different market entirely |

---

## 6. Action Plan — What To Build Next

### Priority 1: Quick wins (1-2 days each)

| # | Action | Competitive impact |
|---|--------|-------------------|
| 1 | **3D Camera Angle Picker** — interactive sphere with draggable camera dot. Maps azimuth/elevation/roll to prompt text ("bird's eye view", "low angle, looking up", "dutch tilt 30°"). Pure JS/CSS, ~200 lines. Appends to generation prompt automatically. Achieves 80% of Storyboarder.ai's 3D camera with 5% of the effort | Closes gap with Storyboarder.ai + LTX Studio camera control. Visual, intuitive, no typing needed |
| 2 | **Script format import** — upload .fdx/.fountain/.pdf → extract text → feed to existing script parser | Closes gap with Storyboarder.ai's #1 onboarding feature |
| 3 | **Batch frame generation** — "Generate all images" button that queues AI generation for every scene | Every competitor with AI offers this. Table-stakes feature |
| 4 | **Style metadata auto-append** — project `visualStyle` + `genre` automatically prepended to all generation prompts | Ensures consistency without manual copy-paste. Matches Storyboarder.ai + Lovart |

### Priority 2: Medium effort (1-2 weeks each)

| # | Action | Competitive impact |
|---|--------|-------------------|
| 5 | **Review/approval workflow** — reviewer role, per-frame approve/reject, comment threads | Opens agency/team market. Competes with Krock.io's core feature |
| 6 | **Starter templates** — 10-20 pre-built projects (commercial, short film, explainer, product demo) with sample scripts + styles | Reduces blank-canvas intimidation. Every SaaS tool needs templates |
| 7 | **Auto-sequence video** — chain frames via Seedance `first-last-frame` mode to generate connected video sequence | Unique feature — nobody has automated continuity-chained video. Your snapshot-to-next is 80% of this |

### Priority 3: Larger bets (future)

| # | Action | Competitive impact |
|---|--------|-------------------|
| 8 | **Workflow/pipeline builder** — visual canvas to chain AI steps | Matches ImagineArt's differentiator. Power-user feature |
| 9 | **Mobile review companion** — lightweight app for reviewing storyboards, approving frames, adding notes | Leverages existing Convex real-time. Expands reach beyond desktop |
| 10 | **Gallery remix** — fork a shared project as your own template | Expands existing gallery into a marketplace. Low effort for high community value |
| 11 | **NLE export** — export timeline as Premiere XML / DaVinci EDL | Lets users finish in professional NLEs. Bridge feature for high-end users |

---

## 7. Feature Count Scorecard

Total unique features counted across all comparison tables:

| Platform | Features | Strongest area |
|----------|:--------:|---------------|
| **Us** | **55** | All-in-one (planning + AI + editing + continuity) |
| Higgsfield | 24 | AI models (30+) + Cinema Studio + character persistence |
| LTX Studio | 23 | Script-to-video + Elements consistency + camera control |
| ImagineArt | 16 | AI generation breadth + workflow builder |
| Storyboarder.ai | 14 | Pre-production planning + 3D camera |
| Artlist | 11 | Stock assets + video editing |
| OpenArt | 10 | Custom model training + community |
| Krock.io | 7 | Review/approval workflows + NLE integrations |
| Lovart | 5 | Design agent UX |

**We still lead with 55 features — 2.3x more than our nearest competitor (Higgsfield at 24).** The gap is narrower against LTX Studio and Higgsfield than the others, but our unique Director's View (11 features nobody else has) and music AI remain unmatched.

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
| **Keyframe Animation** | Set keyframes for camera crane, orbit, tracking per frame | **No** | We don't have per-keyframe control. Our prompt-based approach is simpler but less precise |
| **Audio-to-video** | Generate video driven by audio input | **No** | Could be added via Seedance 2.0 multimodal mode (accepts audio refs) |
| **Video-to-video** | Transform existing video with AI | **No** | Not implemented yet |

**Summary: LTX has 2 features we truly lack (Retake, Keyframe). We have 6 features they lack (music AI, canvas+AI, blend modes, subtitles, real-time sync, Director's View).**

### Higgsfield — Feature-by-Feature vs Us

| Their Feature | How it works | Do we have it? | Our equivalent / gap |
|---|---|---|---|
| **Cinema Studio 3.5** | Professional filmmaking workspace with per-shot camera/style control | **Partial** | Our SceneEditor with Director's View filmstrip. They have per-shot camera presets, we have per-shot prompts |
| **Mr. Higgs AI Co-Director** | AI understands your project, auto-breaks scene into shots, sets camera/style, writes prompts | **No** | Our n8n pipeline does scene breakdown but not AI-driven per-shot camera/style planning. **Could build with AI prompt generation** |
| **Virtual Camera Physics** | Simulate real camera hardware — body (ARRI), lens (Anamorphic), focal length, depth of field | **No** | Achievable via prompt engineering ("shot on ARRI Alexa, 35mm anamorphic, shallow DOF"). **Planned: Camera Style dropdown** |
| **Soul ID** | Persistent character identity across all generations | **YES** | Our `storyboard_elements` with character type + prompt @mentions |
| **Photodump** | One-click multi-scene generation with character consistency | **No** | No batch multi-scene yet. **Planned: batch frame generation** |
| **30+ AI Models** | Sora 2, Kling 3.0, Veo 3.1, Seedance 2.0, GPT Image 2, Soul 2.0, Nano Banana Pro, etc. | **YES** | We have 15+ models — fewer but same key ones. They have more niche models |
| **Lipsync Studio** | Character image + audio → talking head video | **YES** | Seedance 2.0 lipsync mode |
| **Face Swap / Character Swap** | Replace faces or full characters in video | **No** | Not implemented |
| **Marketing Studio** | Generate multiple ad formats from one product | **No** | Not our focus, but Seedance UGC/Showcase modes overlap |

**Summary: Higgsfield has 3 features we truly lack (AI co-director, virtual camera physics, face swap). We have 7 features they lack (storyboard pipeline, multi-track timeline, subtitles, blend modes, canvas+AI, music AI, Director's View).**

### Storyboarder.ai — Feature-by-Feature vs Us

| Their Feature | How it works | Do we have it? | Our equivalent / gap |
|---|---|---|---|
| **3D Camera Control** | From one image, orbit/pan/tilt/zoom camera in 3D space — bird's eye, low angle, dutch tilt, OTS | **No** | Uses 3D scene reconstruction. **Planned: 3D sphere angle picker** — simpler approach, drag camera on sphere → prompt text. 80% of the value, 5% of the effort |
| **Script Format Import** | Accept PDF, FDX (Final Draft), Fountain, Word, plain text | **Partial** | We have plain text parser. **Missing: .fdx/.fountain file upload + extraction** |
| **Visual Consistency** | Character appearance maintained across scenes | **YES** | Element library + prompt @mentions |
| **Sketch-to-image** | Rough sketch → refined AI image | **Partial** | Our canvas draw → AI inpaint is similar but different workflow |
| **Unlimited Generation** | No credit system, generate as much as you want | **No** | We use credits. Different business model — not a bug |
| **Pitch Deck Creation** | Export storyboard as professional pitch deck with templates | **No** | We export as PDF/images but no pitch deck templates |

**Summary: Storyboarder has 1 feature we truly lack (3D camera). We have 10+ features they lack (multi-model AI, video editor, music, canvas+AI, Director's View, blend modes, subtitles, etc.).**

### What we should build to close ALL major gaps

| Gap | Competitor | Our approach | Effort |
|---|---|---|---|
| **3D Camera Angle Picker** | Storyboarder, LTX | Interactive sphere, drag camera dot → prompt text auto-generated. Pure JS, ~200 lines | **Small** |
| **Camera Motion Presets** | LTX, Higgsfield | Dropdown in VideoImageAIPanel toolbar: Static, Dolly In, Dolly Out, Crane Up, Crane Down, Pan Left, Pan Right, Orbit, Tracking, Handheld. Click → appends motion text to video prompt (e.g. "smooth dolly in toward subject"). Seedance 2.0 + Kling already understand these — just need the UI buttons | **Small** |
| **Camera Style Presets** | Higgsfield | Dropdown: "ARRI Alexa 35mm Anamorphic", "Handheld DV", "Drone 4K" → append to prompt | **Small** |
| **Script Format Import** | Storyboarder, LTX | Upload .fdx/.fountain → extract text → feed to existing parser | **Small** |
| **Batch Frame Generation** | Higgsfield (Photodump) | "Generate all images" button → queue one generation per scene | **Small** |
| **Retake (re-render segment)** | LTX | Select video segment → regenerate. Needs API support | **Large** |
| **AI Co-Director (Claude Agent)** | Higgsfield (Mr. Higgs) | Chatbot with project context + tool use. User describes scene → Claude generates script, breaks into shots, sets camera/style, writes prompts, calls `buildStoryboard` mutation. See detailed plan below | **Medium** |
| **Face/Character Swap** | Higgsfield | Needs specialized model or API | **Large** |

The top 5 are all **small effort** and would close the gap with every competitor except for Retake and Face Swap (which are large and depend on API support).

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

## 10. Key Takeaway

**Our unique moat is the all-in-one pipeline.** Every competitor excels at one or two slices:

- LTX Studio = script-to-video + elements consistency
- Higgsfield = AI models (30+) + Cinema Studio + character persistence
- Storyboarder.ai = planning + 3D camera
- ImagineArt = generation + workflow builder
- Artlist = stock + editing
- Krock.io = review + NLE integrations
- OpenArt = custom training + community
- Lovart = design agent

We are the **only tool where a filmmaker can write a script, auto-build a storyboard, generate images with 15+ AI models, edit on canvas with AI inpainting, assemble in a multi-track timeline with subtitles and blend modes, generate music with custom personas, use the Director's View filmstrip for continuity, and export — all without leaving one web app.**

### Key threats (updated with Higgsfield + LTX)

- **LTX Studio** is our most direct competitor — same script-to-storyboard-to-video pipeline, Elements system like ours, timeline editor. But they use their own models only (we have 15+), no music AI, no canvas draw+AI, no real-time sync, no credit pricing. If they add multi-model support, the gap narrows fast.
- **Higgsfield** has the most AI models (30+) and Cinema Studio with AI co-director. But no storyboard planning pipeline, no multi-track timeline with subtitles/blend modes, no canvas editing, no music AI. They're generation-first, not pipeline-first.
- The defense remains: **deepen the pipeline integration**. Features like snapshot-to-next-frame, element @mentions, Director's View with comparison mode, and auto-sequence video create switching costs that are hard to replicate by bolting features onto a generation-only tool.
