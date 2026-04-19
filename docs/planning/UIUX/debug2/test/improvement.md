# Storyboard Studio — Improvement Analysis

> Analyzed from current screenshots (storyboard, storyboardItem, sceneEditor) and competitor comparison (LTX Studio, OpenArt, Higgsfield).

---

## 1. Projects Dashboard (storyboard.png)

### What's Good
- Clean dark theme, credit balance visible in sidebar
- Project cards show key info (status, aspect ratio, tags, members)
- Search bar and filters are accessible

### Improvements Needed

| Priority | Item | Detail |
|----------|------|--------|
| High | **Project thumbnail** | Only "finance" project has an image. Projects without images show a broken image icon — should show a styled placeholder (e.g. first letter of project name, gradient background) |
| High | **"Add storyboard" card** | The `+` card is too subtle. Make it a dashed-border card with clearer CTA text and matching height to other cards |
| Medium | **Project card hover** | No visible hover state. Add subtle border glow or scale on hover for better interactivity feedback |
| Medium | **Status badge styling** | "draft" badge is hard to read (dark text on dark bg). Use consistent colored badges like "On Hold" which is more visible |
| Medium | **Empty state** | When no projects exist, show onboarding prompt — "Create your first storyboard" with illustration |
| Low | **Sidebar "logout" label** | Lowercase "logout" and "Setting" — should be "Log Out" and "Settings" for consistency |
| Low | **Credit Balance widget** | "Credits Used: 0" is always 0 — if not tracking session usage, remove it or show period-based usage |

---

## 2. Storyboard Items / Workspace (storyboardItem.png)

### What's Good
- Grid layout with frame images and metadata
- Script generation banner at top
- Status badges (Completed, In Progress) per frame
- Tags visible on frames

### Improvements Needed

| Priority | Item | Detail |
|----------|------|--------|
| High | **Frame card consistency** | Some frames have images, some are empty with just a placeholder icon. Empty frames should show a "Generate Image" button or a styled placeholder with frame number |
| High | **Frame numbering** | Frames show descriptions but no clear sequence numbers. Add visible "Frame 01", "Frame 02" labels for quick reference (like LTX Studio's shot numbering) |
| High | **Drag-to-reorder indicator** | No visual cue that frames can be reordered. Add a drag handle icon on hover |
| Medium | **Frame description truncation** | Long descriptions overflow. Truncate with "..." and show full text on hover/expand |
| Medium | **Bulk actions** | No way to select multiple frames for batch delete/move/tag. Add checkbox selection mode |
| Medium | **Timeline/sequence view** | Only grid view visible. A horizontal timeline strip (like LTX Studio) would help visualize shot flow and duration |
| Low | **"Build storyboard" banner** | The green banner at top takes up space after initial build. Make it collapsible or move to a menu action |
| Low | **Frame duration** | No duration displayed per frame. Show ERT (estimated runtime) on each card for video planning |

---

## 3. Scene Editor (sceneEditor.png)

### What's Good
- Clean canvas with left/right toolbars
- AI panel with prompt input at bottom
- Model selector with credit display
- Aspect ratio control in top bar
- Hide/Show toggle, Generated, and AI panel switcher buttons are now consistent

### Improvements Needed

| Priority | Item | Detail |
|----------|------|--------|
| High | **Undo/Redo** | Buttons exist but are not functional (TODO in code). This is essential for any editor — implement canvas history stack |
| High | **Keyboard shortcuts** | No visible keyboard shortcut support. Add: Ctrl+Z (undo), Ctrl+S (save), Space (pan), +/- (zoom), Delete (delete selected) |
| Medium | **Canvas tools feedback** | Active tool on left toolbar is highlighted, but no cursor change on canvas (e.g. crosshair for brush, grab for pan) |
| Medium | **Generation progress** | When AI generates, no progress indicator on canvas. Show a loading overlay or progress bar on the frame being generated |
| Medium | **Before/After comparison** | No way to compare original vs generated image. Add a slider or toggle to flip between original and generated result |
| Medium | **Layer panel** | Canvas supports annotations/shapes/text but no layer management panel. Users can't select/reorder/hide individual annotations |
| Low | **Right toolbar grouping** | The `>` chevron between toolbar groups (visible in screenshot) has no clear purpose. Either make it functional (collapse groups) or remove it |
| Low | **Zoom level** | "100%" text at bottom of right toolbar is not interactive. Make it a clickable dropdown with preset zoom levels (25%, 50%, 100%, 150%, 200%, Fit) |

---

## 4. Cross-cutting Improvements

### Missing Features (compared to LTX Studio / OpenArt / Higgsfield)

| Priority | Feature | Detail |
|----------|---------|--------|
| High | **Character consistency** | No character identity lock across frames. LTX Studio's key differentiator — same character in every shot. Consider: save character as element, auto-inject into prompts |
| High | **Style locking** | No global style preset per project. Users re-describe style each prompt. Add project-level style (e.g. "cinematic, dark moody, 35mm film") that auto-appends to all generation prompts |
| Medium | **Animatic/preview playback** | No way to play frames in sequence as a slideshow/video preview. Add a simple "Play" button that shows frames in order with timing |
| Medium | **Version history per frame** | Generation results are in "Generated" panel, but no version comparison. Show generation history per frame with ability to revert |
| Medium | **Export improvements** | PDF export exists but no video animatic export (frames + audio + timing = rough video) |
| Low | **Prompt templates per project** | Prompt library exists globally, but no project-scoped templates. Useful for maintaining consistent prompts within a project |

### UX Polish

| Priority | Item | Detail |
|----------|------|--------|
| High | **Loading states** | Some panels show raw "Loading..." text. Use skeleton loaders for better perceived performance |
| Medium | **Onboarding** | No first-time user guide. Add tooltips or a quick tour for new users explaining the workflow: Script > Breakdown > Generate > Edit |
| Medium | **Error messages** | `alert()` used for errors in generation flow. Replace with toast notifications (non-blocking, auto-dismiss) |
| Low | **Dark theme refinement** | Some select dropdowns (aspect ratio, model selector) don't match dark theme on certain browsers. Test cross-browser |

### Code Quality

| Priority | Item | Detail |
|----------|------|--------|
| Medium | **SceneEditor.tsx size** | 5000+ lines in single file. Consider splitting: canvas logic, AI panel orchestration, shot navigation, and toolbar rendering into separate files |
| Medium | **Console logs** | Heavy `console.log` throughout generation flow. Add log-level control or remove debug logs for production |
| Low | **TypeScript errors** | 153 pre-existing TS errors (build ignores them). Gradually fix to improve maintainability |

---

## 5. Quick Wins (can implement fast, high impact)

1. **Project card placeholder** — replace broken image icon with styled letter avatar
2. **Frame numbering** — add "Frame 01" labels to storyboard item cards
3. **Keyboard shortcuts** — Ctrl+Z, Ctrl+S, Delete at minimum
4. **Toast notifications** — replace `alert()` calls with non-blocking toasts
5. **Style lock per project** — project-level style string that auto-appends to prompts
6. **Animatic playback** — simple slideshow of frames with configurable timing

---

*Last updated: 2026-04-09*








Your Key Observations Are Correct
Quick wins (6 items) are solid and high-impact. Your additional notes are smart:

Character consistency — Yes, this can be done in SceneEditor via prompt templates. If there's already a style prompt system, you can extend it to include character descriptions that auto-inject into every generation prompt. This is the #1 differentiator vs competitors like LTX Studio.

Video playback in Generated panel — Since the Generated panel already shows generated videos/images, adding a simple playback/slideshow of frames there is a natural fit. No need for a separate animatic view — just add a "Play All" button in that panel.

Style locking — If prompt templates already exist with style prompts, this is mostly a UI/data change: save a project-level style string and auto-append it to every generation prompt. Low effort, high value.

Recommended Implementation Order
Order	Item	Why
1	Keyboard shortcuts (Ctrl+Z, Ctrl+S, Delete)	    Unblocks editor usability
2	Toast notifications (replace alert())	        Quick polish, better UX
3	Style lock per project	                        Leverages existing prompt template system
4	Character consistency	                        Extension of style lock — add character descriptions to templates
5	Project card placeholders	                    Visual fix, easy
6	Frame numbering	                                Small UI addition
7	Animatic playback	                            Use existing Generated panel for playback


Biggest Gaps vs Competitors
Your analysis is spot-on. The character consistency + style locking combo is the most impactful missing feature. If prompt templates already exist, you're 70% there — the remaining work is:

A UI to define/save characters per project
Auto-injection of character + style into prompts
A preview of which characters/style are active
Want me to start implementing any of these?

just asking , i have element library . which can act as consistency character and style . does it answer your question
Yes, that answers it perfectly.

Element Library = Character Consistency + Style Locking, already built.

So the flow would be:

User saves a character/style as an element in the library
When generating, the element's description/prompt gets auto-injected into the generation prompt
Same character/style across all frames — consistency solved
That means:

Character consistency — not a new feature, just needs better UX surfacing (e.g. "pin" an element to a project so it auto-applies to every generation)
Style locking — same thing, save a style element and pin it project-wide
The real question becomes: Is there already a way to auto-apply selected elements to every prompt in a project? Or does the user have to manually select elements each time they generate?

If it's manual each time, the quick win is adding a "project-level pinned elements" feature — so selected elements auto-attach to every generation without re-selecting.

Want me to check how the element library currently integrates with prompt generation?
