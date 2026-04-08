# Planning Docs — File Index

Quick reference for what each planning doc covers and when to use it.

---

## File Descriptions

### `clerk.md`
Hybrid billing model combining Stripe credits (pay-as-you-go) with Clerk subscriptions for organizations. Covers free vs paid plan structure, credit packages, subscription tiers (Starter/Pro), organization access control, and user journey flows.

### `image_modelAI.md`
Kie AI API reference guide. Model catalog with all supported image models (Flux, Ideogram, Nano Banana, GPT Image, Topaz, Recraft, Qwen), request payload shapes, parameter options (aspect ratios, resolutions, output formats), callback handling, and implementation examples.

### `plan_ai_panels.md`
Both AI panel components in one doc. **Image Generation Panel** covers prompting UX, style/model selection, batch generation, prompt enhancement with GPT, and character consistency. **Edit Image Panel** covers mask/crop workflows, area-edit vs annotate modes, toolbar architecture, reference image management, and model-specific editing controls (9+ models).

### `plan_files_and_media.md`
Everything about file storage and generated media. **File Management** covers Convex metadata + Cloudflare R2 binary storage, upload/delete flows, file categories, and R2 key patterns. **File Browser** covers filtering, search, preview behavior, and AI metadata display. **Generated Media Lifecycle** covers the placeholder-first callback workflow, KIE AI integration, credit deduction/refund, and finalization to R2.

### `plan_price_management.md`
Source of truth for all pricing. Pricing functions (`getNanoBananaPrice`, `getSeedance15`, `getTopazUpscale`), the global `getModelCredits` function, admin CRUD for pricing models, formula vs fixed pricing, quality-based calculations, and default seed model configurations. All other docs reference this for credit calculations.

### `plan_scene_editor.md`
SceneEditor orchestration and canvas system. **Scene Editor** covers cross-panel integration (switching between edit/video/element AI modes), canvas state sharing, reference image management, mobile responsiveness, and R2 storage integration. **Canvas System** covers geometry, sizing algorithms, mask coordinate calculations, tool state, zoom handling, and brush positioning.

### `plan_storyboard.md`
Core storyboard system and item/element integration. **Storyboard Core** covers project CRUD, AI script generation, scene parsing, frame management, export, and companyId security patterns. **Item & Element Integration** covers frame card behavior, element badge system, element linking, build flows with n8n, rebuild/element strategies, reference selection from File Browser and Element Library, and provenance metadata.

### `plan_ui_components.md`
UI component specifications. **LTX Style Guide** covers the dark theme color palette, typography, component patterns (buttons, cards, modals, inputs, navigation), and interactive states. **Tags System** covers 4 display patterns, data conversion (string vs object), predefined tags, color assignment, and component mapping. **ContentEditable Badge System** covers drag-and-drop reference images, inline mention badges, plain-text extraction, and auto-growing editor.

---

## Engine Files (`lib/`)

Canonical source files that all components and API routes should import from. Never reimplement this logic locally.

### `lib/auth-utils.ts` — CompanyId (client)
Client-side companyId resolution. Exports `useCurrentCompanyId()` hook (uses Clerk's `useOrganization()` for active org, falls back to user ID) and `getCurrentCompanyId(user)` function. Every React component that needs companyId should import from here.

### `lib/auth-utils-server.ts` — CompanyId (server)
Server-side companyId resolution for API routes. Exports `getServerCurrentCompanyId(auth)` which takes a Clerk auth object and returns the companyId. Use in `app/api/` route handlers.

### `lib/r2.ts` — R2 Storage (server, low-level)
Direct Cloudflare R2 operations using AWS S3Client. Exports `uploadToR2(file, key)` for binary uploads and `getR2PublicUrl(key)` for URL generation. Server-side only — used by API routes and callback handlers.

### `lib/uploadToR2.ts` — R2 Storage (client, high-level)
Client-facing R2 wrapper that calls `/api/storyboard/upload` and `/api/storyboard/delete-file` routes. Exports `uploadToR2(options)` with progress/callbacks, `deleteFromR2()`, `uploadMultipleToR2()`, `batchDeleteFromR2()`, and `uploadToR2WithRetry()`. Used by React components (FileBrowser, ElementLibrary, SceneEditor).

### `lib/storyboard/pricing.ts` — Pricing Formulas + Model Defaults
Single source of truth for all pricing calculations. Exports `PricingModel` interface, `DEFAULT_PRICING_MODELS` array, and all pricing functions: `getNanoBananaPrice()`, `getTopazUpscale()`, `getSeedance15()`, `getGptImagePrice()`, `getFormulaQualityPrice()`, `getFixedPrice()`, `getKlingMotionControl()`, `getSeedance20()`. The `usePricingData` hook wraps these with database state.

### `lib/storyboard/kieAI.ts` — Image AI Generation
Image generation via Kie AI API. Exports `triggerImageGeneration()`, `enhancePromptForImage()` (GPT prompt enhancement), `STYLE_PRESETS`, `IMAGE_CREDITS`, `resolveKieApiKey()`, and placeholder record creation. Handles credit deduction, callback URL construction, and file record lifecycle. `resolveKieApiKey()` resolves API key via fallback chain: org_settings.defaultAI record → system default in `storyboard_kie_ai` → `KIE_AI_API_KEY` env var.

### `lib/storyboard/videoAI.ts` — Video AI Generation
Video generation via Kie AI API. Exports `generateKlingVideo()` (Kling 3.0), `generateVeoVideo()` (Veo 3.1), `checkVideoJobStatus()`, `calcVideoCredits()`, `VIDEO_MODELS` config, and `VIDEO_CREDITS` rates.

### `convex/schema.ts` — `storyboard_kie_ai` Table
Stores KIE AI API keys with fields: `name`, `key`, `isDefault`, `isActive`. Managed via the KIE AI tab in the Pricing Management page. Used by `resolveKieApiKey()` to resolve API keys from the database before falling back to env vars. The `org_settings.defaultAI` field references a record in this table for per-org key assignment.

---

## Cross-Reference Table

| Topic | Find It In |
|-------|-----------|
| Pricing, credit formulas, `getModelCredits` | `plan_price_management.md` |
| CompanyId security, server-side auth patterns | `plan_storyboard.md` |
| R2 file storage, upload/delete mechanics | `plan_files_and_media.md` |
| Generated media callbacks, placeholder workflow | `plan_files_and_media.md` |
| Image generation UI, prompting, styles | `plan_ai_panels.md` |
| Image editing, masks, crop, area-edit | `plan_ai_panels.md` |
| Canvas geometry, zoom, brush coordinates | `plan_scene_editor.md` |
| SceneEditor panel switching, state sharing | `plan_scene_editor.md` |
| Project/script/scene CRUD | `plan_storyboard.md` |
| Item/element linking, build flows, n8n | `plan_storyboard.md` |
| Billing, subscriptions, Stripe/Clerk | `clerk.md` |
| Kie AI models, API payloads | `image_modelAI.md` |
| LTX dark theme, colors, components | `plan_ui_components.md` |
| Tag patterns, data conversion | `plan_ui_components.md` |
| ContentEditable, drag-drop mentions | `plan_ui_components.md` |
| KIE AI key management, API key CRUD | `plan_price_management.md` |
| `resolveKieApiKey()`, defaultAI fallback | `plan_price_management.md` |
| Kling 3.0 Motion Control, Seedance 2.0 | `image_modelAI.md` |
| VideoImageAIPanel models/refs/toggles | `plan_ai_panels.md` |
| Storyboard item prompts, prompt edit | `plan_storyboard.md` |
| Prompt Library categories, notes | `plan_ui_components.md` |
| FileBrowser pagination, lazy loading | `plan_files_and_media.md` |
| Upload Override, SceneEditor file picker | `plan_scene_editor.md` |
