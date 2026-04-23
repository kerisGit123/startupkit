# Competitive Analysis: Director's View Tools

## How We Compare

### Our Current State
- Single-frame editing (isolated, no context)
- GeneratedImagesPanel (vertical sidebar, per-frame outputs)
- VideoEditor (multi-track timeline, separate from storyboard)
- Navigation via prev/next buttons in header
- No filmstrip, no sequence overview, no visual continuity tools

### Market Leaders and What They Do

---

## 1. LTX Studio — Best Storyboard-to-Video Pipeline

**Key innovation: Scene-based horizontal strips + Elements system**

- Scenes as rows, shots as panels within each scene
- "Elements" — persistent characters/objects extracted from script, reused across all shots
- "Retake" — AI re-direct specific moments without regenerating everything
- Camera keyframes (crane, orbit, tracking)
- Script auto-divides into scenes/shots

**What we should adopt:**
- Scene grouping (we have `sceneId` on items but don't visualize it)
- Elements tracking is similar to our `linkedElements` and `elementNames`
- The horizontal strip layout per scene

---

## 2. Kling 3.0 — Best AI Director Mode

**Key innovation: Multi-shot sequence generation + character locking**

- "Smart Storyboard" — generates 5-6 shots from ONE prompt
- AI automatically plans camera angles, shot composition, transitions
- Character locking — latent representation persists across shots
- Handles shot-reverse-shot dialogue automatically
- Up to 6 camera cuts per generation

**What we should adopt:**
- Multi-shot generation concept (generate a sequence, not just one frame)
- Character consistency across shots (we have elements but could do more)
- The idea of "AI as cinematographer" — sequence-level prompting

---

## 3. DaVinci Resolve — Best Dual Timeline (God View)

**Key innovation: Cut Page dual timeline**

- Upper timeline: ALWAYS shows full sequence as thumbnails (macro view)
- Lower timeline: shows detail of current edit position (micro view)
- Both visible simultaneously — you never lose context
- Color flags for clip status
- Filmstrip view with adjustable frame density

**What we should adopt:**
- **Dual view is the most relevant pattern for our god view**
- The strip (macro) + canvas (micro) simultaneously
- Color-coded status flags on thumbnails

---

## 4. Storyboarder — Best Filmstrip Navigator

**Key innovation: Always-visible bottom filmstrip while drawing**

- Bottom strip shows all frames
- Main canvas shows current frame for drawing
- Timeline mode adds audio waveform sync
- Draw, navigate, draw — the filmstrip is always there
- Free and open source

**What we should adopt:**
- The bottom filmstrip pattern (between header and canvas, always visible)
- Click-to-navigate in the strip
- Current frame highlighted with border

---

## 5. Boords — Best Pure Storyboard

**Key innovation: Drag-to-reorder + versioning + animatic**

- All frames visible as a grid/strip
- Drag-and-drop reordering with auto-renumbering
- Multiple versions per frame with commenting
- Auto-generate animatics from storyboard
- Export to Premiere/Avid
- Real-time collaboration

**What we should adopt:**
- Drag-to-reorder frames
- Frame versioning concept (we show generated outputs but not as "versions")
- Animatic preview (play through all frames in sequence)

---

## 6. Premiere Pro — Best Freeform Planning

**Key innovation: Freeform View**

- Free-arrangement canvas for clip thumbnails
- Resize thumbnails to indicate importance
- Stack clips into groups
- Save multiple named layouts
- Skim/preview with hover

**Nice to have but complex — skip for now.**

---

## 7. Runway ML — Best In-Editor AI Generation

**Key innovation: Generate AI video inside the timeline editor**

- AI generation happens in the editing context, not a separate step
- "Load current previewed frame as input for next generation"
- Keyframe-based motion control (start/mid/end frames)
- Custom multi-step AI pipelines (Workflows)

**What we should adopt:**
- "Load current frame as input" — our snapshot-to-next-frame feature
- The concept of staying in the editor while generating (we already do this)

---

## 8. Pika — Best Keyframe-as-Storyboard

**Key innovation: Pikaframes**

- Up to 5 keyframes visible as a mini-storyboard within each shot
- Each keyframe is a "beat" in the shot
- Character memory across scenes

**Interesting concept but different from our frame-level approach.**

---

## Feature Priority Matrix

| Feature | Who Does It Best | Our Status | Priority |
|---------|-----------------|------------|----------|
| Horizontal filmstrip (see sequence) | Storyboarder, Boords | NOT YET | P0 - Core |
| Previous/next frame context | DaVinci (dual timeline) | Header nav only | P0 - Core |
| Frame status indicators | DaVinci (flags), Boords | Have `frameStatus` field, not shown | P0 - Core |
| Snapshot to current/next frame | Runway, VideoEditor | VideoEditor only | P0 - Core |
| Click-to-navigate from strip | All tools | NOT YET | P0 - Core |
| Video hover preview in strip | YouTube-style | NOT YET | P1 - High |
| Drag-to-reorder frames | Boords, all NLEs | NOT YET | P1 - High |
| Scene grouping in strip | LTX Studio | Have `sceneId`, not visualized | P2 - Medium |
| Animatic preview (play sequence) | Boords, Storyboarder | NOT YET | P2 - Medium |
| Multi-shot AI generation | Kling 3.0 | NOT YET | P3 - Future |
| Character consistency tracking | Kling, LTX Elements | Have `linkedElements` | P3 - Future |
| Freeform canvas arrangement | Premiere Pro | NOT YET | P4 - Nice |

---

## What Makes Us Unique (Our Advantages)

1. **Multi-model AI generation** — we support 15+ AI models (Nano Banana, Seedance, Kling, Veo, Grok, GPT Image, etc.). No competitor offers this breadth.

2. **Integrated music/audio AI** — AI Music, Cover Song, TTS, InfiniteTalk. LTX and Runway don't have this.

3. **Real-time database** (Convex) — instant sync, no save button. Better than Boords' manual save.

4. **Canvas editing + AI** — draw/annotate on frames + AI inpainting. Storyboarder has drawing but no AI. Runway has AI but no drawing.

5. **Credit-based pricing** with per-model costs — more flexible than subscription-locked generation.

---

## Recommended Implementation Order

### Phase 1: Storyboard Strip (this sprint)
Build the horizontal filmstrip between header and canvas.
- Thumbnails for all frames (image > video > placeholder)
- Status dots (draft/in-progress/completed)
- Click to navigate
- Active frame highlighted
- Snapshot to current/next frame
- Auto-scroll to active frame

### Phase 2: Enhanced Strip
- Video hover preview (auto-play muted on hover)
- Drag-to-reorder frames
- Duration display per frame
- Media type indicator (image/video badge)

### Phase 3: Animatic + Sequence
- Play through all frames as animatic (timed slideshow)
- Scene grouping (collapsible scene headers in strip)
- Sequence-level prompting ("generate shots 3-7 with consistent style")

### Phase 4: AI Director Mode
- Multi-shot generation (Kling-style: one prompt → multiple shots)
- Character consistency enforcement across shots
- AI-suggested camera angles and transitions
