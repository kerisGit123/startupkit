# Storyboard Studio - Design System

Reference: LTX Dark Theme — defined in `app/storyboard-studio/globals.css`.
All components use CSS variables so the theme is centralized and consistent across the entire storyboard-studio.

---

## 1. Color Palette (CSS Variables)

Defined in `app/storyboard-studio/globals.css` `:root`. Use CSS variable syntax in Tailwind: `bg-(--bg-primary)`.

### Core Colors

| CSS Variable | Hex | Tailwind | Usage |
|-------------|-----|----------|-------|
| `--bg-primary` | `#1A1A1A` | `bg-(--bg-primary)` | App background, canvas, SceneEditor, sidebar |
| `--bg-secondary` | `#2C2C2C` | `bg-(--bg-secondary)` | Cards, panels, dropdowns, dialogs, toolbars |
| `--bg-tertiary` | `#3D3D3D` | `bg-(--bg-tertiary)` | Hover states, elevated surfaces, controls |
| `--text-primary` | `#FFFFFF` | `text-(--text-primary)` | Headings, model names, selected items, active tabs |
| `--text-secondary` | `#A0A0A0` | `text-(--text-secondary)` | Icons, labels, inactive tabs, placeholders |
| `--text-tertiary` | `#6E6E6E` | `text-(--text-tertiary)` | Disabled text, subtle placeholders |
| `--border-primary` | `#3D3D3D` | `border-(--border-primary)` | All borders — panels, cards, dropdowns |
| `--border-secondary` | `#4A4A4A` | `border-(--border-secondary)` | Subtle/secondary borders |
| `--accent-blue` | `#4A90E2` | `bg-(--accent-blue)` | Generate button, focus rings, active accents |
| `--accent-blue-hover` | `#357ABD` | `hover:bg-(--accent-blue-hover)` | Generate button hover |
| `--accent-teal` | `#4A9E8E` | `bg-(--accent-teal)` | Secondary highlights |
| `--color-success` | `#52C41A` | — | Success states |
| `--color-warning` | `#FAAD14` | — | Warning states |
| `--color-error` | `#FF4D4F` | — | Error states |

### Status Badge Colors (Tailwind utilities, not CSS variables)

| Badge | Color | Usage |
|-------|-------|-------|
| AI | `bg-emerald-500` | AI-generated content |
| VIDEO | `bg-red-500` | Video content |
| MUSIC | `bg-purple-500` | Music content |
| AUDIO | `bg-blue-500` | Audio content |
| PERSONA | `bg-amber-500` | Persona badge |
| Credits icon | `text-amber-400` | Coins icon (gold) |

### Why CSS Variables?

- **Single source of truth**: change `globals.css` once, everything updates
- **Consistency**: storyboard cards, SceneEditor, VideoImageAIPanel, EditImageAIPanel, GeneratedImagesPanel all inherit the same theme
- **Future theming**: can add light mode or custom themes by overriding variables
- **No hardcoded hex**: components use `bg-(--bg-secondary)` not `bg-[#2C2C2C]`

## 2. Typography

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Heading | 14px | 600 (semibold) | 20px | Panel headers |
| Body Medium | 13px | 500 (medium) | 18px | Model names, dropdown items, controls |
| Body Regular | 13px | 400 (normal) | 18px | Dropdown subtitles, descriptions |
| Caption | 12px | 500 (medium) | 16px | Tab labels, toolbar controls, credits |
| Micro | 11px | 400 | 16px | Metadata, timestamps, dropdown subtitles |
| Badge | 9-10px | 600 (semibold) | — | Status badges (AI, VIDEO, MUSIC, etc.) |
| Uppercase Label | 10px | 600 | — | Dropdown section headers, `tracking-wider uppercase` |

Font: Inter, ui-sans-serif (inherited from project).

## 3. Icons (Lucide)

- **Size**: `w-4 h-4` (16px) default
- **Stroke**: `strokeWidth={1.75}` — thinner than Lucide default (2)
- **Color**: `text-(--text-secondary)` default, `text-(--text-primary)` when active
- **Rounded corners**: Lucide default

### Category Icons
| Category | Icon | Active Color |
|----------|------|-------------|
| Image | `Image` | `text-(--text-primary)` |
| Video | `Film` | `text-(--text-primary)` |
| Music | `Music` | `text-(--text-primary)` |
| Audio | `Mic` | `text-(--text-primary)` |

### Control Icons
| Control | Icon |
|---------|------|
| Aspect Ratio | `RectangleHorizontal` |
| Resolution | `Monitor` |
| Duration | `Clock` |
| Audio On | `Volume2` |
| Audio Off | `VolumeX` |
| Format | `FileText` |
| Quality | `Zap` |
| Credits | `Coins` |
| Settings | `Settings` |
| Generate | `Sparkles` |

## 4. Borders & Radius

| Scale | Value | Usage |
|-------|-------|-------|
| xs | 4px / `rounded` | — |
| sm | 6px / `rounded-md` | Buttons, tabs, toolbar controls, badges |
| md | 8px / `rounded-lg` | Dropdowns, cards, inputs |
| lg | 12px / `rounded-xl` | Dropdown popups, model dropdown |
| xl | 16px / `rounded-2xl` | Main panel container |

Border: `1px solid var(--border-primary)` — used on dropdowns, cards, inputs.
Border width: Always 1px.

## 5. Spacing (8pt Grid)

Values used: 4, 8, 16, 20, 24, 32, 40, 48.

| Element | Padding |
|---------|---------|
| Main panel | `rounded-2xl` with `/95` opacity |
| Toolbar row | `px-3 py-2` |
| Prompt area | `px-3 pt-3 pb-2` |
| Dropdown popup | `p-2` or `py-1.5` |
| Dropdown items | `px-3 py-2` |
| Tab buttons | `px-2.5 py-1` |
| Control buttons | `px-1.5 py-1` |
| Badges | `px-1.5 py-0.5` |
| Card gap | `space-y-2` |

## 6. Components

### Toolbar Bar
```
Container: border-t border-white/5 (hairline separator from prompt)
           relative z-50 (for dropdown z-index)
           No background — inherits from panel
Layout:    flex items-center gap-1
```

### Category Tabs (IMAGE / VIDEO / MUSIC / AUDIO)
```
Active:   bg-white/10 text-(--text-primary)
Inactive: text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5
Style:    text-[12px] font-medium uppercase tracking-wide
          flex items-center gap-1.5
          Icon: w-4 h-4 strokeWidth={1.75}
          rounded-md
```

### Model Selector (Toolbar Trigger)
```
Style:    text-[13px] font-medium text-(--text-primary)
          flex items-center gap-1.5
          Icon: w-4 h-4 text-(--text-secondary)
          hover:bg-white/5 rounded-md
```

### Model Dropdown (Popup)
```
Container: bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl
           w-[260px], max-h-[360px] overflow-y-auto
Backdrop:  fixed inset-0 z-40 (click to close)
           Dropdown itself: z-50

Section Header: px-3 pt-2.5 pb-1
                text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)
                e.g. "IMAGE MODEL", "VIDEO MODEL"

Item:      w-full px-3 py-2 text-left
           Selected: bg-white/8
           Hover: hover:bg-white/5
           Icon: w-4 h-4 text-(--text-secondary) (category Lucide icon)
           Name: text-[13px] font-medium text-(--text-primary)
           Sub: text-[11px] text-(--text-secondary) mt-0.5
           Badge: text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide
                  Image: bg-cyan-500/15 text-cyan-400
                  Video: bg-green-500/15 text-green-400
                  Music: bg-purple-500/15 text-purple-400
                  Audio: bg-blue-500/15 text-blue-400
```

### Settings Grid (Aspect Ratio + Resolution + Format)
```
Container: bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl p-2
           Columns side by side (flex gap-1)

Cell:      px-3 py-1.5 rounded-md text-[13px] text-center min-w-[52px]
           Selected: bg-white/10 text-white
           Inactive: text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)
```

### Control Buttons (Duration, Audio, Quality, etc.)
```
Style:    flex items-center gap-1.5
          px-1.5 py-1 rounded-lg text-[13px]
          text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5
          Icon: w-3.5 h-3.5 strokeWidth={1.75}
          cursor-pointer
```

### Toggle Controls (Model-specific: Kling, Topaz, Grok, etc.)
```
Inactive: text-[#9A9AA0] (slightly lighter than #9CA3AF for visibility)
Active:   Semantic color (text-purple-400, text-amber-400, etc.)
Style:    px-2 py-1 rounded-lg text-[12px] hover:bg-white/5
```

### Mini Toggle Switch (Seedance Web Search, Audio, Clean Output)
```
Track Off:  bg-[#3A3A45]
Track On:   Semantic color (bg-cyan-500, bg-purple-500, bg-emerald-500)
Thumb:      w-2.5 h-2.5 rounded-full bg-white
Label:      text-[11px] font-medium
Container:  flex items-center gap-1.5 px-2 py-1 rounded-lg
```

### Generate Button
```
Style:    bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white
          px-4 py-1.5 rounded-md
          text-[13px] font-medium
          disabled:opacity-50
          Icon: Sparkles w-4 h-4
```

### Credits Display
```
Style:    text-[12px] text-(--text-secondary)
          flex items-center gap-1
          Icon: Coins w-4 h-4 text-amber-400 strokeWidth={1.75}
```

### Prompt Actions (Shared Component)
```
File:     app/storyboard-studio/components/shared/PromptActionsDropdown.tsx
Used by:  VideoImageAIPanel, EditImageAIPanel

Trigger:  text-[12px] font-medium text-(--text-secondary)
          hover:text-(--text-primary) hover:bg-white/5
          Icon: Settings w-4 h-4 strokeWidth={1.75}
          + "Actions" label + ChevronDown

Dropdown: bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl
          w-[200px] py-1.5
          Backdrop: fixed inset-0 z-40

Section Headers:
  "PROMPT ACTIONS" — Clear, Save, Test
  "LOAD" — Description, Image Prompt, Video Prompt, Style (optional), Library

Items:    px-3 py-2 text-[13px] text-(--text-primary)
          hover:bg-white/5
          Icon: w-4 h-4 text-(--text-secondary) strokeWidth={1.75}
          gap-2.5
          disabled:opacity-30

Divider:  h-px bg-[#32363E] mx-2 my-1

Props:
  - editorRef, editorIsEmpty, setEditorIsEmpty, setCurrentPrompt
  - onUserPromptChange, extractPlainText, extractTextWithBadges
  - onSavePrompt — callback to open save dialog
  - activeShotDescription, activeShotImagePrompt, activeShotVideoPrompt
  - projectStylePrompt, projectStyleName — optional, shows Style item when provided
  - onOpenLibrary — callback to open prompt library
  - onEditorInput — optional, called after loading text (EditImageAIPanel uses this)
```

### Prompt Textarea
```
Container: bg-transparent (inherits panel bg)
           px-3 py-2.5
           text-[14px] text-(--text-primary)
           focus:outline-none
           leading-5
           No border, no background

Placeholder: text-[14px] text-(--text-secondary)
```

### Separator (Between Control Groups)

```
Style: w-px h-4 bg-[#32363E] mx-1
```

### Left & Right Toolbars (EditImageAIPanel)

```
Container: bg-(--bg-secondary)/95 backdrop-blur-md rounded-lg p-1 border border-(--border-primary)
           flex flex-col gap-0.5
           shadow-lg

ToolBtn:
  Size:     w-8 h-8 rounded-md
  Active:   bg-white/10 text-(--text-primary)
  Inactive: text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)
  Danger:   text-red-400 hover:bg-red-500/10 hover:text-red-300

Separator: w-full h-px bg-[#32363E] my-0.5

Brush Size Dot: bg-[#E5E7EB] rounded-full (size scales with brush)

Zoom Label: text-[10px] text-(--text-secondary) text-center
```

## 7. Cards (GeneratedImagesPanel)

### Generated Image/Video/Music Card
```
Container: bg-(--bg-secondary) rounded-xl overflow-hidden
           border border-(--border-secondary) (subtle, separates from bg)
           hover:border-(--border-primary) hover:bg-[#1A1D22]

Image Area: h-[120px] bg-(--bg-primary) rounded-lg overflow-hidden

Badges:    Position: absolute top-2.5 left-2.5
           AI: bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold
           VIDEO: bg-red-500
           MUSIC: bg-purple-500
           AUDIO: bg-blue-500
           PERSONA: bg-amber-500
           COMBINE: bg-purple-500

Music Card: bg-linear-to-br from-purple-950/60 via-purple-900/20 to-[#0B0D10]
            Center icon: w-12 h-12 rounded-full bg-purple-500/20
            Title: absolute bottom-0, text-[13px] text-white font-medium

Hover Actions: bg-(--bg-primary)/60 backdrop-blur-[2px]
               Buttons: p-2 bg-white/10 rounded-md hover:bg-white/20
               Play: p-2.5 bg-white rounded-full (prominent)
               Delete: p-2 bg-red-500/20 rounded-md hover:bg-red-500/40

Processing: bg-(--bg-primary)/70 backdrop-blur-sm
            Spinner: w-5 h-5 text-[#3B82F6] animate-spin
            Progress: bg-(--accent-blue) on bg-white/10

Error:     bg-(--bg-primary)/80 backdrop-blur-sm
           AlertCircle: w-5 h-5 text-red-400
           Retry: bg-red-500 text-white rounded-md

Metadata:  px-3 py-2.5
           Status badge: text-[11px] rounded-md
           Text: text-[11px] text-(--text-secondary)
           Icon: w-3 h-3 strokeWidth={1.75}
```

### Filter Controls
```
Container: px-4 py-3 border-b border-(--border-secondary)

Active:    Completed: bg-green-500/15 text-green-400
           Processing: bg-blue-500/15 text-blue-400
           Error: bg-red-500/15 text-red-400

Inactive:  bg-(--bg-secondary) text-(--text-secondary) border border-(--border-primary)
           hover:bg-(--bg-tertiary)

Style:     px-3 py-1.5 rounded-md text-[12px] font-medium
```

## 8. Panel Containers

### VideoImageAIPanel (Main Bottom Panel)
```
Outer:     absolute bottom-0, mx-4 mb-4, flex flex-col gap-2
Panel:     bg-(--bg-tertiary)/95 backdrop-blur-md rounded-2xl
           No border (blends naturally)
Toolbar:   border-t border-white/5 (hairline separator)
```

### EditImageAIPanel (Edit Mode Bottom Panel)
```
Same as VideoImageAIPanel:
Panel:     bg-(--bg-tertiary)/95 backdrop-blur-md rounded-2xl
Toolbar:   border-t border-white/5
```

### GeneratedImagesPanel (Left Sidebar)
```
Container: bg-(--bg-primary) border-r border-(--border-secondary)
           w-80, absolute top-0 left-0 h-full
Header:    px-4 py-3.5 border-b border-(--border-secondary)
           text-[14px] font-semibold text-(--text-primary)
Close:     w-7 h-7 rounded-md text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5
```

## 9. States

| State | Style |
|-------|-------|
| Default | `text-(--text-secondary)` or `text-(--text-primary)` |
| Hover | `hover:bg-white/5 hover:text-(--text-primary)` |
| Active/Selected | `bg-white/10 text-(--text-primary)` or `bg-white/8` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` or `disabled:opacity-30` |
| Focus | `focus:outline-none focus:border-[#3B82F6]/40` (inputs only) |

## 10. Z-Index

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Toolbar | `z-50` (relative) | Toolbar bar — above reference images |
| Dropdown backdrop | `z-40` | Fixed overlay to close dropdown on click-outside |
| Dropdown popup | `z-50` | Inside toolbar's z-50 stacking context |
| Seedance mode backdrop | `z-40` | Fixed overlay |

## 11. Director's View Components (StoryboardStrip)

### StoryboardStrip (Filmstrip Bar)
```
File:      editor/StoryboardStrip.tsx
Location:  Between SceneEditorHeader and Canvas area

Container: bg-(--bg-secondary)/95 backdrop-blur-md border-b border-(--border-primary)
           h-[82px] px-2 py-[8px] select-none
           flex items-center

Frame Card:
  Size:     w-[80px]
  Thumbnail: h-[52px] bg-(--bg-primary) overflow-hidden
  Border:   border border-(--border-primary) rounded-lg
  Active:   border-(--accent-blue) ring-1 ring-(--accent-blue)/30 scale-105
  Hover:    hover:border-(--border-secondary)
  Badge:    text-[9px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide
            VIDEO: bg-red-500 text-white
            IMAGE: bg-emerald-500 text-white
  Info bar: text-[10px] text-(--text-secondary) font-medium
  Status:   w-1.5 h-1.5 rounded-full
            completed: bg-[var(--color-success)]
            in-progress: bg-[var(--color-warning)]
            draft: bg-(--border-primary)
  Notes:    StickyNote icon w-3 h-3 text-yellow-400/80 (bottom-right when notes exist)
  Drag:     GripVertical icon top-right, opacity-0 group-hover:opacity-70

Gap:       gap-[5px] between cards

Scroll arrows: w-6 h-6 rounded-md text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5
Frame counter: text-[11px] text-(--text-secondary) font-medium tabular-nums
Duration:      text-[10px] text-(--text-tertiary) tabular-nums
```

### Animatic + Comparison Buttons
```
Position:  Left of filmstrip, before scroll arrows
Size:      w-6 h-6 rounded-md
Active:    text-(--accent-blue) bg-(--accent-blue)/15
Inactive:  text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5
Icons:     Play/Pause (animatic), Columns3 (comparison)
```

### Generated Outputs Row
```
Position:  Below filmstrip, conditional (only when outputs exist)
Container: h-[46px] px-2 py-1 bg-(--bg-primary)/80 border-b border-(--border-primary)/40
Label:     text-[9px] text-(--text-tertiary) font-medium uppercase tracking-wide

Output Thumb:
  Size:    w-[48px] h-[36px] rounded-md
  Border:  border-(--border-primary) hover:border-(--border-secondary)
  Video:   <video> element with onLoadedMetadata seek to 0.5s
           Play icon overlay: w-4 h-4 rounded-full bg-black/60
           "V" badge: text-[6px] bg-red-500 top-left
  Model:   text-[6px] text-white/70 bg-black/50 bottom bar
```

### Comparison Mode
```
Layout:    flex items-center justify-center gap-3
Frame:     w-[140px] h-[56px] rounded-lg
           Active: ring-2 ring-(--accent-blue)
           Inactive: ring-1 ring-(--border-primary) hover:ring-(--border-secondary)
Labels:    text-[9px] text-(--text-tertiary) uppercase tracking-wide
           "PREVIOUS", "CURRENT", "NEXT"
Empty:     border-dashed border-(--border-primary), text-[9px] "No prev" / "No next"
```

### Context Menu (Right-click)
```
Container: bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl
           py-1.5 w-[180px] z-99999
Items:     px-3 py-2 text-[13px] text-(--text-primary) hover:bg-white/5
           Icon: w-4 h-4 text-(--text-secondary) strokeWidth={1.75}
           gap-2.5
Delete:    text-red-400 hover:bg-red-500/10
Divider:   h-px bg-(--border-primary) mx-2 my-1
Notes:     StickyNote icon text-yellow-400/70
```

### Scene Divider
```
Container: shrink-0 px-1 self-stretch
Line:      w-px bg-(--border-primary)/60
Label:     text-[8px] text-(--text-tertiary) font-medium "S1", "S2"
```

## 12. Aspect Ratio Selector (SceneEditorHeader)

```
File:      editor/SceneEditorHeader.tsx
Style:     Matches VideoImageAIPanel settings grid popup

Trigger:   flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[13px] font-medium
           Icon: RectangleHorizontal w-3.5 h-3.5 strokeWidth={1.75}
           Open: text-(--text-primary) bg-white/10
           Closed: text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5

Popup:     bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl p-2
           top-full left-0 mt-1 z-50
Backdrop:  fixed inset-0 z-40

Options:   px-3 py-1.5 rounded-md text-[13px] text-center min-w-[52px]
           Selected: bg-white/10 text-white
           Inactive: text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)
           Values: "16:9", "9:16", "1:1"
```

## 13. Frame Information Dialog

```
File:      editor/FrameInfoDialog.tsx
Wrapper:   DarkModal with bg-(--bg-secondary), max-w-4xl, overlayOpacity={85}

Header:    px-5 py-3.5 border-b border-white/4
           Frame badge: px-2.5 py-1 rounded-md bg-white/4
             Clapperboard icon text-(--accent-blue)
             "#04" text-[13px] font-semibold tabular-nums
           Title: text-[13px] font-semibold text-(--text-primary)
           Status pills: px-2 py-0.5 rounded bg-white/4 text-[11px] font-semibold text-[#8A8A8A] tabular-nums
             Clock icon + duration, RectangleHorizontal icon + ratio

Left Column (Readouts):
  Width:   w-[220px] border-r border-white/4
  Bg:      bg-(--bg-secondary)/50
  Card:    bg-linear-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-white/4 rounded-lg p-3
           Accent line: absolute top-0 h-px opacity-40 (color varies per card)
  Label:   text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]
           Icon: w-3 h-3 opacity-60
  Value:   text-(--text-primary) font-semibold text-[13px] (or text-[22px] for large)

Media Badge:
  Video:   bg-red-500/15 text-red-400 text-[10px] font-semibold uppercase
  Image:   bg-emerald-500/15 text-emerald-400
  None:    text-[11px] text-(--text-tertiary) "No media"

Right Column (Tabbed Editor):
  Tab bar: border-b border-white/4, px-4
           Active: text-(--text-primary) + 2px colored underline (accent per tab)
           Inactive: text-[#8A8A8A] hover:text-(--text-primary)
           Style: text-[13px] font-semibold uppercase tracking-wide
           Icon: w-3.5 h-3.5 strokeWidth={1.75}

  Section Header:
    Icon box: w-6 h-6 rounded-md bg-{accent}20
    Label: text-[13px] font-bold text-(--text-primary)
    Line: h-px bg-linear-to-r from-(--border-primary) to-transparent

  Textarea: bg-(--bg-secondary) border border-white/4 rounded-lg text-[13px] p-3.5
            placeholder:text-(--text-tertiary) leading-relaxed
            focus:border-white/10 focus:bg-(--bg-tertiary)

  Tags:    px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide
           border border-white/6, bg = tag.color + "33", color = tag.color

Font weight reference (matching VideoImageAIPanel):
  - Tab labels: font-semibold (600) — not font-medium
  - Readout labels: font-semibold (600)
  - Readout values: font-semibold (600)
  - Section headers: font-bold (700)
  - Header title: font-semibold (600)
  - Inactive text color: #8A8A8A — brighter than --text-tertiary (#6E6E6E)
```

## 14. Shared Components (New)

### VideoPreviewDialog
```
File:      shared/VideoPreviewDialog.tsx
Used by:   GeneratedImageCard, SceneEditor (outputs row, animatic)

Container: Portal to body, fixed inset-0 bg-black/80 z-99999
Modal:     bg-(--bg-secondary) rounded-xl max-w-4xl max-h-[90vh]

Header:    p-4 border-b border-(--border-primary)
           Title: "Video Preview" text-white font-medium
           Snapshot buttons:
             "This frame": Camera icon + label
             "Next frame": SkipForward icon + label
             Style: px-2.5 py-1.5 rounded-md text-[12px] font-medium
                    bg-(--bg-tertiary) text-(--text-secondary)
                    hover:text-(--text-primary) hover:bg-white/10
                    disabled:opacity-40

Video:     <video> controls autoPlay, w-full rounded-lg, max-h-[70vh]

Footer:    p-4 border-t border-(--border-primary)
           Model: text-sm text-gray-400
           Prompt: text-sm text-gray-400 line-clamp-2
```

### DarkModal
```
File:      shared/DarkModal.tsx
Container: bg-(--bg-primary) border border-(--border-primary) rounded-2xl
Close btn: text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/10
```

## 15. VideoEditor Extensions

### Blend Modes
```
File:      editor/VideoEditor.tsx

TimelineClip extended with:
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn"
  opacity?: number (0-100)

Controls:  Visible when video/image clip selected
  Dropdown: px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded
  Slider:   w-12 h-1 accent-teal-500

Preview:   style={{ mixBlendMode, opacity }} on <video> and <img>
Export:    ctx.globalCompositeOperation + ctx.globalAlpha

Timeline badge:
  Blend: text-[7px] font-bold px-1 py-0.5 rounded bg-orange-500/80 text-white
  Opacity: text-[7px] font-bold px-1 py-0.5 rounded bg-white/20 text-white
```

### Subtitle Track
```
File:      editor/VideoEditor.tsx

Track:     h-[60px] at top-[248px], yellow theme
Label:     Type icon + "Subs", text-yellow-400 bg-yellow-500/5
Timeline:  340px total height (was 280)

Clip:      Absolute positioned by startTime/endTime
           bg-linear-to-r from-yellow-900/40 to-yellow-800/20 rounded-lg
           Selected: ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/20
           Text: text-[9px] text-yellow-200/80

Controls:  "Add Sub" button: text-yellow-400 hover:bg-yellow-500/10
           Text input, position dropdown (top/center/bottom)
           Font weight dropdown, color picker, delete button

Preview:   Overlay on video preview area
           Position: top-4 / top-1/2 / bottom-4
           Style: fontSize, fontColor, backgroundColor, fontWeight from SubtitleClip

Export:    ctx.font, ctx.textAlign="center", background rect + text
```

## 16. Files Modified (Complete List)

| File | Changes |
|------|---------|
| `ai/VideoImageAIPanel.tsx` | Full toolbar redesign, category tabs, model dropdown, settings grid, all controls |
| `editor/EditImageAIPanel.tsx` | Toolbar, model dropdown, quality dropdown, generate button, toolbars |
| `editor/SceneEditor.tsx` | StoryboardStrip integration, snapshot handlers, video preview dialog, reorder/status/delete/notes handlers, animatic callbacks, output selection |
| `editor/SceneEditorHeader.tsx` | Aspect ratio selector redesigned as grid popup (matches VideoImageAIPanel) |
| `editor/StoryboardStrip.tsx` | **NEW** — Director's filmstrip with all Phase 1-2 features |
| `editor/FrameInfoDialog.tsx` | Redesigned as cinema-grade inspector (readout cards, NLE tab bar, section headers) |
| `editor/VideoEditor.tsx` | Blend modes + opacity on clips, subtitle track (timeline + preview + export) |
| `shared/DarkModal.tsx` | Updated to CSS variables (bg-primary, border-primary, text-tertiary) |
| `shared/VideoPreviewDialog.tsx` | **NEW** — shared video player dialog with snapshot buttons |
| `shared/PromptTextarea.tsx` | Borderless transparent bg, design system text colors |
| `shared/PromptActionsDropdown.tsx` | **NEW** — shared component extracted from both panels |
| `GeneratedImagesPanel/index.tsx` | Panel bg, header, share dialog, video snapshot callbacks, output row callbacks |
| `GeneratedImagesPanel/GeneratedImageCard.tsx` | Card container, badges, hover actions, VideoPreviewDialog integration |
| `GeneratedImagesPanel/FilterControls.tsx` | Filter pill styles |
| `GeneratedImagesPanel/EmptyState.tsx` | Colors updated |
| `GeneratedImagesPanel/ComparisonView.tsx` | Colors updated |
| `GeneratedImagesPanel/EditPersonaDialog.tsx` | Colors updated |
| `GeneratedImagesPanel/CreatePersonaDialog.tsx` | Colors updated |
| `lib/storyboard/snapshotUtils.ts` | **NEW** — shared captureVideoFrame/captureImageFrame utilities |
