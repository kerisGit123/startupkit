# Storyboard Studio — Front Page Design & Feature Reference

---

## Part 1: Competitor Landing Page Analysis

### 1. LTX Studio — ltx.studio
- **Hero:** "The AI platform for video production" / "A creative suite for filmmakers, advertisers, & creative teams." CTA: "Start for free"
- **Visual:** Dark theme with purple-to-blue animated gradient accents. Cinematic, premium feel
- **Features:** Gen Space (text-to-image/video), camera/keyframe controls, style presets, timeline editor, sound design. Multiple entry points: from script, concept, image, or video
- **Social proof:** Client logos (ElevenLabs, McCann), Taika Waititi testimonial, G2 4.4 stars, 135K+ users, Google Partner
- **Pricing:** Freemium tiers, enterprise "Book a Demo"

### 2. Higgsfield AI — higgsfield.ai
- **Hero:** "An ultimate infrastructure for AI Video and Image Generation" with 30+ models (Sora 2, Kling 3.0, Veo 3.1). CTA: "Get Exclusive Unlimited Offer" (30% off)
- **Visual:** Dark theme, high contrast, marketplace feel with trending galleries
- **Features:** Create Image/Video, Motion Control, Soul 2.0 fashion visuals, Nano Banana Pro (4K), 40+ artistic presets
- **Social proof:** Community-driven galleries, creator submissions, original AI series
- **Pricing:** Discount-led (30% off unlimited), free credits, Pro features

### 3. Filmora AI Storyboard Generator — filmora.wondershare.net
- **Hero:** "AI Storyboard Generator: Turn Text into Visual Stories Instantly." CTA: "Try It Free"
- **Visual:** Light, modern white theme with teal/cyan accents. Clean and approachable
- **Features:** Text-to-storyboard, character consistency across scenes, multiple styles (Realistic, Anime, Comic, Cyberpunk), 1.5M stock assets, storyboard-to-video export
- **Social proof:** 4 named user testimonials (indie filmmaker, student, content creator, YouTuber)
- **Pricing:** Free trial, AI credits in paid plans

### 4. Boords — boords.com/ai-storyboard-generator
- **Hero:** "The AI Storyboard Generator for Creative Professionals." CTA: "Create storyboard"
- **Visual:** Light, professional SaaS layout with product screenshots
- **Features:** Consistent AI characters, 3-step workflow (import script > generate > share), PDF/MP4/shot list exports, real-time collaboration with frame-level comments
- **Social proof:** 4.8/5 on G2, 25+ testimonials, 9 studio logos, "1,000,000+ creative professionals"
- **Pricing:** Freemium clearly stated. Free tier includes AI images + unlimited frames

### 5. Storyboarder.ai — storyboarder.ai
- **Hero:** "From Idea To Storyboard Animatic Screenplay Shot List In Minutes." CTA: "JOIN NOW"
- **Visual:** Dark theme, professional and tech-forward with feature tiles
- **Features:** Screenplay upload, shot list generation, instant storyboards, character consistency, image-to-video, animatics with audio
- **Social proof:** 250K+ users, 6.2M+ images generated, 200K+ concepts, 55K+ scripts. Product Hunt badge
- **Pricing:** 3 subscription tiers + enterprise

### 6. Krock.io — krock.io/storyboard-ai
- **Hero:** "Storyboard AI" / "Add text, choose style, export as PDF in a few clicks." CTA: "Try for free"
- **Visual:** Dark theme (#1A181D) with bright blue accent (#1F5EFF), iMac mockups
- **Features:** Text-to-storyboard, multiple visual styles, PDF/CSV export, privacy-first (no AI training on uploads)
- **Social proof:** Competitor comparison pages (vs Frame.io, Vimeo, Boords)
- **Pricing:** Free trial, dedicated pricing page

### Cross-cutting Patterns
- 4 of 6 use **dark themes** (LTX, Higgsfield, Storyboarder, Krock)
- All offer **free trial or freemium**
- **Character consistency** is a universal selling point
- Strong pages lead with a **clear one-line value prop** + **single CTA**
- Product screenshots or video demos are essential
- Social proof varies: metrics (250K+ users) vs testimonials vs client logos

---

## Part 2: Storyboard Studio Feature List

### Project Management
- Create, edit, delete, duplicate projects
- Project metadata: name, status (Draft/In Progress/Completed/On Hold), aspect ratio, tags
- Favorite projects, search & filter
- Grid and list view modes
- Team member assignment per project

### AI Image Generation (6 Models)
| Model | Type | Quality Options |
|-------|------|-----------------|
| Nano Banana 2 | General purpose | 1K, 2K, 4K |
| Nano Banana Pro | Higher quality | 1K, 2K, 4K |
| GPT 1.5 Image to Image | Image-to-image | Medium, High |
| Nano Banana Edit | Image editing | Fixed |
| Character Edit (Ideogram) | Face/character editing | Fixed |
| Flux 2 Pro | Text-to-image | Fixed |

### AI Image Editing Tools
- Text-to-image and image-to-image generation
- Inpainting with brush/eraser tools (adjustable size, opacity)
- Rectangular mask for targeted editing
- Upscaling: Topaz (1x, 2x, 4x) and Recraft Crisp Upscale
- Reference images support (up to 13 per model)
- Output formats: PNG, JPG

### AI Video Generation (5 Models)
| Model | Resolution | Duration | Special |
|-------|-----------|----------|---------|
| Seedance 1.5 Pro | 480p-4K | 4s, 8s, 12s | Audio toggle |
| Seedance 2.0 | 480p, 720p | 4-15s | Video input mode |
| Kling 3.0 Motion Control | 720p, 1080p | Per-second | Motion-focused |
| Veo 3.1 (Google) | Auto | Auto | Text/Reference/First+Last frame modes |
| Grok Imagine | 480p, 720p | 6-30s | Image-to-video |

### Canvas & Editor
- Drawing tools: brush, pen, eraser with adjustable sizes
- Shape tools: arrow, line, rectangle, circle, speech bubbles
- Text annotations with styling
- Color picker
- Zoom, pan, fit-to-screen
- Aspect ratio control (16:9, 9:16, 1:1)
- Mask overlay with opacity control
- Element drag-and-drop onto canvas

### Element Library
- Save reusable elements: characters, props, environments, logos
- Element descriptions with reference images
- Search and filter by name/tags
- Public, private, shared visibility
- Drag elements into canvas or as reference images

### File Management
- R2 (Cloudflare) cloud storage
- File categories: uploads, generated, elements, storyboard, videos, temps
- File browser with search, filter by type
- Download, delete, favorite files
- Accepted types: JPEG, PNG, WebP, GIF, MP4, WebM, MP3, WAV

### Collaboration
- Invite team members via email
- Roles: Administrator, Member, Viewer
- Organization switcher (Clerk)
- Member tagging and search

### Export
- PDF storyboard with visuals and script
- Individual frame export (PNG/JPG)
- Video export
- Print-ready 3-column grid layout
- Script-only text export

### Billing & Subscription
- Credit-based AI generation pricing
- 3 plans: Free (5 gen/mo), Starter (50 gen/mo), Pro (200 gen/mo)
- Monthly and yearly billing
- Real-time credit balance display
- Invoice history with filtering
- Stripe integration for payments

### Support
- Ticket system with 9 categories (billing, plans, usage, credit, invoice, technical, service, general, other)
- 4 priority levels (low, medium, high, urgent)
- Customer-agent message threading
- Filter by category, status, date range

### Pricing Management (Admin)
- Configure pricing per AI model
- Fixed or formula-based pricing
- Factor/multiplier adjustment
- Test calculator for price verification
- 8 pricing functions implemented

### Usage Analytics & Logs
- Storage usage by category and file type (donut charts)
- Generation analytics by time period (area chart)
- Credits used, generations count, success/failure rates
- Log history table with model, status, credits, task ID, result link
- Period selector: This Month, Last 3 Months, Last 6 Months, This Year

### Prompt Management
- Prompt library with save/reuse
- Categories: character, environment, prop, style, camera, action
- Public/private prompt sharing
- Usage frequency tracking

---

## Part 3: Front Page Design Recommendation

### Design Direction
- **Theme:** Dark mode (matches the app and 4/6 competitors)
- **Accent colors:** Purple (#8b5cf6) as primary accent (already the app's accent), emerald for CTAs
- **Typography:** Bold, large hero headline. Clean sans-serif
- **Feel:** Premium, cinematic, professional — not playful

### Recommended Page Structure

#### Section 1: Hero
- **Headline:** "AI-Powered Storyboard Studio" or "From Script to Screen, Powered by AI"
- **Subtext:** "Create professional storyboards with 11+ AI models. Generate images, videos, and visual stories — all in one workspace."
- **CTA:** "Start Free" (primary, emerald) + "Watch Demo" (secondary, outline)
- **Visual:** Animated product screenshot or short video loop showing the editor in action
- **Below hero:** Trust badges — "11+ AI Models", "Image & Video Generation", "Real-time Collaboration"

#### Section 2: How It Works (3 Steps)
Keep it simple like Boords:
1. **Write your script** — paste or type your story, AI breaks it into scenes
2. **Generate visuals** — choose from 11+ AI models to create images and videos per frame
3. **Edit & Export** — refine with canvas tools, collaborate with your team, export as PDF or video

Each step gets an icon + screenshot + short description.

#### Section 3: Key Features (4-6 Feature Cards)
Pick the strongest differentiators:

| Feature | Headline | Description |
|---------|----------|-------------|
| Multi-Model AI | "11+ AI Models, One Workspace" | Nano Banana, GPT Image, Seedance, Kling, Veo, Grok — image and video generation from a single editor |
| Canvas Editor | "Professional Editing Tools" | Brush, inpaint, shapes, text, upscale — edit directly on your storyboard frames |
| Element Library | "Consistent Characters & Styles" | Save characters, props, and styles as reusable elements. Maintain consistency across every frame |
| Video Generation | "From Frame to Film" | Generate videos from your storyboard frames. 5 video models with resolution and duration control |
| Team Collaboration | "Work Together, Seamlessly" | Invite team members, assign roles, share projects. Organization-level workspace |
| Credit System | "Pay for What You Use" | Transparent credit-based pricing. No hidden costs. Start free |

#### Section 4: Product Screenshots
Full-width screenshots or a scrollable carousel:
1. Projects dashboard (grid view with cards)
2. Storyboard items view (frames with images and metadata)
3. Scene editor (canvas with AI panel open)
4. Element library
5. Logs/analytics

#### Section 5: Pricing
3-column layout matching the in-app billing page:
- **Free:** 5 generations/mo, 1 project
- **Starter:** 50 generations/mo, 10 projects, org support — MYR 19.90/mo
- **Pro:** 200 generations/mo, unlimited projects, priority support — MYR 29.00/mo

CTA under each: "Start Free" / "Subscribe" / "Subscribe"

#### Section 6: Social Proof (build over time)
- User count when available
- Testimonials from early users
- "Built with" tech badges (Next.js, Convex, Clerk, Stripe)

#### Section 7: Footer CTA
- "Ready to bring your stories to life?"
- Large "Start Free" button
- Links: Pricing, Support, Privacy, Terms

### What NOT to Do
- Don't list every model name on the hero — say "11+ AI models" and show details in features section
- Don't use generic stock photos — use actual product screenshots
- Don't make the page too long — 5-7 sections max
- Don't hide the free tier — lead with it

---

## Reference Links

1. LTX Studio — https://ltx.studio/
2. Higgsfield AI — https://higgsfield.ai/
3. Filmora AI Storyboard — https://filmora.wondershare.net/ai-storyboard-generator.html
4. Boords — https://boords.com/ai-storyboard-generator
5. Storyboarder.ai — https://storyboarder.ai/
6. Krock.io — https://krock.io/storyboard-ai/

---

*Last updated: 2026-04-10*
