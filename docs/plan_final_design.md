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

### Prompt Context Menu (built into PromptTextarea)
```
File:     app/storyboard-studio/components/shared/PromptTextarea.tsx
Trigger:  Right-click on contentEditable prompt textarea

Menu:     bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl
          w-[200px] py-1.5
          Portal to document.body, z-[9999]
          Opens UPWARD from click point (textarea is at bottom of screen)

Section Headers: text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)
                 "Edit" section, "Camera" section (video mode only)

Items:    px-3 py-2 text-[13px] text-(--text-primary) hover:bg-white/5
          Icon: w-4 h-4 text-(--text-secondary) strokeWidth={1.75}
          Shortcut: ml-auto text-[11px] text-(--text-tertiary)
          gap-2.5

Divider:  h-px bg-[#32363E] mx-2 my-1

Submenu:  Camera Motion — opens to the RIGHT of main menu
          w-[180px], same bg/border/rounded-xl
          Section header: "MOTION PRESET"
          Items: px-3 py-2 text-[13px]

Backdrop: fixed inset-0 z-[9998]

Behavior: Saves cursor Range on right-click, restores on insert
          Copy: clipboard API, Paste: insert at saved cursor
          Camera Motion: inserts text with <br> at saved cursor position
```

### Camera Motion Presets
```
Location: Prompt actions area (next to Actions dropdown)
Trigger:  Button with Film icon + selected label + ChevronDown
          Active: text-(--accent-blue) border-(--accent-blue)/30 bg-(--accent-blue)/8
          Inactive: text-(--text-secondary) border-white/8

Dropdown: absolute bottom-full right-0 mb-2
          w-[170px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl
          max-h-[280px] overflow-y-auto py-1.5

Items:    15 presets: Static, Dolly In/Out, Crane Up/Down, Pan L/R,
          Tilt Up/Down, Orbit, Tracking, Handheld, Zoom In/Out
          px-3 py-2 text-[13px]
          Selected: bg-white/8

Behavior: Inserts motion description at cursor position (uses savedSelectionRef from usePromptEditor)
          Video mode only
```

### Camera Studio (Virtual Camera Style)
```
File:     app/storyboard-studio/components/ai/VirtualCameraStyle.tsx

Trigger:  Button with Camera icon + summary text
          Same style as Camera Motion trigger button
          Active: text-(--accent-blue) border-(--accent-blue)/30 bg-(--accent-blue)/8

Panel:    Floating, portal to document.body
          bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl
          w-[420px], positioned above trigger button
          z-[9991]
          Backdrop: bg-black/30 z-[9990]

Header:   px-4 pt-3 pb-2
          Camera icon + "Camera Studio" text-[14px] font-semibold
          Reset button + X close button

Cards:    4 selector cards in flex row, gap-2
          Each card: rounded-xl, border border-(--border-primary), bg-(--bg-tertiary)/60
          Active: border-(--accent-blue)/30 bg-(--accent-blue)/5
          Section title: text-[9px] font-semibold tracking-wider uppercase text-(--text-tertiary)
          Image area: h-[52px], max-h-[44px] object-contain
          Focal Length: text-[28px] font-light tabular-nums (number display, no image)
          Sublabel: text-[8px] uppercase tracking-wider text-(--text-tertiary)
          Name: text-[10px] font-medium

Dropdown: Opens upward (bottom-full), w-[200px]
          Aperture section: right-0 aligned (right edge)
          Other sections: left-0 aligned
          bg-(--bg-secondary) border border-(--border-primary) rounded-xl
          Items: px-3 py-2, image 28px + label + sublabel
          Selected indicator: 6px blue dot

Data:     Camera: 9 options (Default + ARRI, Hasselblad, iPhone, GoPro, DJI Drone, Film 35mm, Polaroid, VHS)
          Lens: 7 options (Default + Spherical, Anamorphic, Vintage, Macro, Tilt-Shift, Fisheye)
          Focal Length: 8 options (Default + 14/24/35/50/85/135/200mm)
          Aperture: 7 options (Default + f/1.4, f/2.0, f/2.8, f/4.0, f/8.0, f/16)

Images:   /storytica/cameras/ (ARRI.png, HASSELBLAD.png, IPHONE.png, GOPRO.png,
          DJI_DRONE.png, 35MM_FILM.png, POLAROID.png, VHS_CAMCORDER.png, LENS.png, APERTURE.png)

Behavior: Appends combined camera description to finalPrompt at generation time
          Works for both image and video modes
          buildCameraPromptText() combines all selections into natural language
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

## 16. Element Forge — Soul Cast-style Wizard (Session #23)

### Layout
- **Dialog box** — `w-[94vw] max-w-[1100px] h-[75vh]`, fixed height, no jumping between tabs
- **Header row** — Human/Non-Human toggle (left), Randomize button, reference avatars as small circles (center), close X (right)
- **Tab bar** — centered, underline active style: Identity, Era, Physical Appearance, Personality, Details, Outfit, Prompt
- **Sub-tab bar** — sits directly below main tabs when step has `hasSubTabs: true`
- **Content area** — `flex-1 overflow-y-auto`, single field per sub-tab, vertically centered for carousels
- **Bottom bar** — badges row (compact, with "Clear all"), action bar (nav arrows, References, Thumbnail, Cancel, Save)

### Sub-Tab Pattern (hasSubTabs)
Every step uses sub-tabs — each field gets its own sub-tab, one at a time:

| Step | Sub-tabs |
|---|---|
| Identity | Name, Gender, Age, Ethnicity |
| Era | _(single field, no sub-tabs)_ |
| Physical Appearance | Build, Height, Eye Color, Hair Style, Hair Texture, Hair Color, Facial Hair |
| Personality | Archetype, Expression |
| Details | Features (multi-select), Custom |
| Outfit | Style, Custom |

Active sub-tab: white text + underline. Filled sub-tabs: blue dot indicator.

### Carousel Component (FieldCarousel)
Replaces all `visual-grid` usage. Horizontal scrollable strip:
- **Card size** — 160px wide x 180px tall, rounded-2xl
- **Card types** — photo thumbnail (icon), color swatch (color), letter fallback
- **Selection** — blue ring-2, check badge top-right (w-6 h-6)
- **Arrows** — left/right circular buttons (w-11 h-11, bg-black/70), appear when scrollable
- **Fade edges** — gradient fade on overflowing sides (w-20)
- **Gap** — 20px between cards, centered with `justify-center`
- **Scroll** — 350px per arrow click, smooth

Variants:
- `FieldCarousel` — single select, click toggles
- `FieldMultiCarousel` — multi select (for Details/Features)
- `FieldTwoLevelCarousel` — sub-settings shown as carousel after parent selected

### Era Slider (FieldEraSlider)
Scroll-snap dial with tick marks and centered label:
- Draggable horizontal scroll, snaps to nearest item
- Center indicator line (blue), ITEM_W = 100px
- Label scales: center = 28px bold, neighbors fade in size and opacity
- Used for: Era (24 options), Height (5 options: Very short -> Very tall)

### Template Dropdown (TemplateDropdown)
Custom styled dropdown for prompt templates (replaces native select):
- **Trigger** — shows name + prompt snippet preview, ChevronDown rotates on open
- **Panel** — bg-(--bg-secondary), rounded-xl, max-h-[240px] overflow-y-auto
- **Items** — name + truncated prompt preview, selected item highlighted with accent blue

### Badges
- Compact row: `text-[10px]`, `bg-white/6`, X to remove individual
- **Clear all** button at end — resets identity to name only

### Thumbnail Assets
Path: `/storytica/element_forge/thumbs/` — generated via grid prompts + `scripts/slice-forge-thumbs.mjs`

Categories: Gender (4), Age (6), Build (5), Hair Style (10), Hair Texture (4), Facial Hair (7), Eye Color (6), Archetype (8), Expression (8), Detail (8), Outfit (10). Hair Color uses color swatches.

### Files
- `app/storyboard-studio/components/ai/ElementForge.tsx` — wizard UI, all field renderers
- `app/storyboard-studio/components/ai/elementForgeConfig.ts` — step definitions, options, prompt composition
- `app/storyboard-studio/components/ai/ThumbnailCropper.tsx` — crop modal
- `scripts/slice-forge-thumbs.mjs` — grid image slicer

## 17. Files Modified (Complete List)

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

---

## 18. Workspace Redesign — Element Library / Character Builder Design Language

### Design Philosophy

The current workspace is **feature-dense and overlay-heavy** — every frame card has gradient vignettes, 6+ hover-activated circular action buttons, status dropdowns, tag editors, element badges, and duration badges all stacked on top of each other. The toolbar crams 8 buttons into a single row.

The Element Library and Character Builder (Element Forge) follow a different philosophy:
- **One thing at a time** — sub-tabs isolate fields, carousels show one row of options
- **Clean separation** — content area vs. edit panel, never overlapping
- **Underline navigation** — lightweight tabs, not pill-button clusters
- **Cards are cards** — image + label + subtle metadata, not dashboards
- **Actions live in context** — right panel or bottom bar, not floating over content

Apply that philosophy to the workspace.

---

### 18.1 Layout — Three-Zone Split

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                         │
│  [<] Project Name  ·  Draft · 16:9    ___Script___Storyboard___Table___Video___    [Search] [Filters] [Zoom] [Credits] [Org] [Avatar] │
├─────────────────────────────────────────────────────────────────────┤
│                              │                                      │
│     FRAME GRID               │     DETAIL PANEL (conditional)       │
│     (flex-1, scrollable)     │     (w-[380px], right side)          │
│                              │                                      │
│     ┌────┐ ┌────┐ ┌────┐    │     Shows when a frame is selected   │
│     │ 01 │ │ 02 │ │ 03 │    │     - Tabbed editor (like Forge)     │
│     └────┘ └────┘ └────┘    │     - Info / Prompts / Elements      │
│     ┌────┐ ┌────┐ ┌────┐    │     - Notes / Tags                   │
│     │ 04 │ │ 05 │ │ 06 │    │     - Actions at bottom              │
│     └────┘ └────┘ └────┘    │                                      │
│     ┌────┐ ┌──────────┐     │                                      │
│     │ 07 │ │  + Add   │     │                                      │
│     └────┘ └──────────┘     │                                      │
│                              │                                      │
├──────────────────────────────┴──────────────────────────────────────┤
│  ACTION BAR (bottom, always visible)                                │
│  [Style ▾] [Format ▾]  ···spacer···  [Files] [Elements] [Director] [Generate All] [Export] │
└─────────────────────────────────────────────────────────────────────┘
```

**Key changes from current:**
- **Detail Panel** replaces all the in-card dialogs (edit, prompts, notes, tags). Click a frame → panel slides in. Like Element Library's right create/edit panel.
- **Action Bar** moves toolbar buttons from above the grid to a persistent bottom bar. Matches the Element Forge action bar pattern.
- **Grid gets simpler** — cards are just image + number + minimal indicators. All editing happens in the Detail Panel.

---

### 18.2 Header Bar (Simplified)

```
Container: flex items-center justify-between px-4 py-3 border-b border-(--border-primary) bg-(--bg-primary)

LEFT:
  Back arrow → project name (text-sm font-bold) → status pill (text-[11px])

CENTER:
  Tab switcher — UNDERLINE style (not pill/bordered box)
  ┌─────────────────────────────────────────────┐
  │  Script    Storyboard    Table    Video      │
  │             ─────────                        │  ← 2px white underline on active
  └─────────────────────────────────────────────┘

  Tab button:
    Active:   text-(--text-primary) border-b-2 border-white -mb-px
    Inactive: text-(--text-tertiary) hover:text-(--text-secondary) border-transparent
    Style:    px-4 py-3 text-[12px] font-medium flex items-center gap-1.5
    Icon:     w-3.5 h-3.5 strokeWidth={1.75}

RIGHT:
  Search icon (expandable) + Filters + Zoom + CreditBadge + OrgSwitcher + UserButton
  (same as current but without Extend Story / Build Storyboard buttons — those move to Action Bar)
```

**Why underline tabs?** Element Library and Forge both use underline-active tabs. It's lighter, takes less vertical space, and creates a clear visual hierarchy without enclosing boxes.

---

### 18.3 Frame Cards (Minimal)

**Current problem:** Each card is a mini-dashboard with 15+ interactive elements layered on top of the image. Gradient overlays obscure the artwork.

**New card:** Image-forward. Metadata below. Clean.

```
┌──────────────────────────┐
│                          │
│        IMAGE AREA        │   ← No gradient overlay, no vignette
│     (aspect-ratio)       │   ← Clean rounded-2xl corners
│                          │
│  [01]              [5s]  │   ← Frame # (bottom-left), duration (bottom-right)
│                          │   ← Small pills, only on hover OR always-on subtle
├──────────────────────────┤
│  Frame Title             │   ← text-[13px] font-medium, single line truncate
│  Short description...    │   ← text-[11px] text-(--text-secondary), 1-line
│  [character] [env]       │   ← Element badges inline (compact pills)
└──────────────────────────┘
```

**Card component spec:**

```
Container:
  rounded-2xl border border-(--border-primary) overflow-hidden
  bg-(--bg-secondary) cursor-pointer transition-all duration-200
  hover:border-(--accent-blue)/40 hover:shadow-lg hover:shadow-(--accent-blue)/5

  Selected state:
    border-(--accent-blue) ring-2 ring-(--accent-blue)/20

Image Area:
  bg-(--bg-primary) overflow-hidden
  aspect-ratio: inherited from project settings (16/9, 9/16, 1/1)

  No media state:
    flex items-center justify-center
    Icon: ImageIcon w-8 h-8 text-(--text-tertiary)
    (no "Browse Files" button — that's in Detail Panel)

Frame Number Badge:
  absolute bottom-2 left-2
  bg-black/50 backdrop-blur-sm rounded-md px-2 py-0.5
  text-[10px] font-semibold text-white tabular-nums
  Always visible (not hover-dependent)

Duration Badge:
  absolute bottom-2 right-2
  bg-black/50 backdrop-blur-sm rounded-md px-2 py-0.5
  text-[10px] text-white/80 tabular-nums flex items-center gap-1
  Clock icon w-2.5 h-2.5
  Only shown if duration > 0

Status Dot (replaces full status badge):
  absolute top-2 right-2
  w-2.5 h-2.5 rounded-full
  draft: bg-(--border-primary)
  in-progress: bg-(--color-warning)
  completed: bg-(--color-success)
  No label, no dropdown — status editing happens in Detail Panel

Info Section:
  px-3 py-2.5
  Title: text-[13px] font-medium text-(--text-primary) truncate
  Description: text-[11px] text-(--text-secondary) line-clamp-1 mt-0.5

  Element Badges Row (if elements assigned):
    flex items-center gap-1 mt-1.5 flex-wrap
    Badge: px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide
    Character: bg-purple-500/15 text-purple-400
    Environment: bg-emerald-500/15 text-emerald-400
    Prop: bg-blue-500/15 text-blue-400

  Bottom indicators (inline):
    flex items-center gap-2 mt-1.5
    Image prompt dot: w-1.5 h-1.5 rounded-full bg-(--accent-blue) (if imagePrompt exists)
    Video prompt dot: w-1.5 h-1.5 rounded-full bg-emerald-400 (if videoPrompt exists)
    Favorite star: Star w-3 h-3 text-amber-400 fill-amber-400 (if isFavorite)
    Notes icon: MessageSquare w-3 h-3 text-amber-400/60 (if notes exist)
```

**What's removed from cards:**
- Gradient overlays / vignettes
- Status dropdown (moved to Detail Panel)
- Tag editor dropdown (moved to Detail Panel)
- 6 hover action buttons (Edit, Prompts, Elements, Duplicate, Delete, Director Review)
- Move up/down arrows (drag-and-drop is sufficient)
- "Browse Files" button in empty state
- Set as Storyboard URL button
- Generation status overlay stays (it's important feedback)

**What's kept:**
- Frame number, duration (subtle)
- Status dot (glanceable, not interactive)
- Element badges (read-only, compact)
- Favorite/notes/prompt indicators (dots, not buttons)
- Drag-and-drop
- Double-click to open SceneEditor
- Single-click to select → opens Detail Panel

---

### 18.4 Detail Panel (Right Side — Element Library Pattern)

When a frame is selected, a right panel slides in — exactly like Element Library's create/edit panel.

```
Container:
  w-[380px] border-l border-(--border-primary) bg-(--bg-secondary)
  flex flex-col overflow-hidden shrink-0
  transition: slide-in from right (translate-x animation)

Header:
  px-5 py-3.5 border-b border-(--border-primary)
  flex items-center justify-between

  Left: Frame badge + title
    Frame badge: px-2.5 py-1 rounded-md bg-white/4
      text-[13px] font-semibold tabular-nums text-(--accent-blue)
      "#04"
    Title: text-[13px] font-semibold text-(--text-primary) ml-2 truncate

  Right: Action icons
    Prev/Next frame arrows: w-7 h-7 rounded-md hover:bg-white/5
    Close X: w-7 h-7 rounded-md text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5

Tab Bar (Underline style — matches Element Forge):
  px-5 border-b border-(--border-primary)
  flex items-center gap-0

  Tabs: Info | Prompts | Elements | Notes

  Tab button:
    px-3 py-3 text-[12px] font-medium border-b-2 -mb-px transition-colors
    Active: text-(--text-primary) border-white
    Inactive: text-(--text-tertiary) hover:text-(--text-secondary) border-transparent
    Icon: w-3.5 h-3.5 strokeWidth={1.75} mr-1.5

Content Area:
  flex-1 overflow-y-auto px-5 py-4 space-y-4
```

#### Tab: Info
```
Fields (stacked, full-width):

Title Input:
  Label: text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-1.5
  Input: w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3
         text-[13px] text-(--text-primary) outline-none
         placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40

Description Textarea:
  Same label style
  Textarea: same input style, resize-y, min-h-[80px] leading-relaxed

Status Selector:
  Label: "STATUS"
  Button group (3 options, flex row):
    Each: px-4 py-2 rounded-xl text-[12px] font-medium border transition
    Active:   bg-(--accent-blue)/12 text-(--text-primary) border-(--accent-blue)/40
    Inactive: text-(--text-secondary) border-transparent hover:bg-white/5

    Options: Draft | In Progress | Completed
    Each with colored dot: w-2 h-2 rounded-full mr-1.5

Duration:
  Label: "DURATION"
  Inline number input or button-group: 3s / 5s / 10s / Custom

Tags:
  Label: "TAGS"
  Tag input (combobox style) + selected tag pills
  Same pattern as Element Forge badges row

Favorite Toggle:
  Inline row: Star icon + "Mark as favorite" text
  Toggle switch (mini toggle from design system)

Media:
  Label: "MEDIA"
  If has image: thumbnail preview (rounded-xl, aspect-video, max-h-[160px])
    Below: [Upload New] [Browse Files] [Remove] buttons
  If no image: upload drop zone
    border-2 border-dashed border-(--border-primary) hover:border-(--accent-blue)/40
    rounded-xl h-[120px] flex items-center justify-center
    "Drop image or click to upload" text
```

#### Tab: Prompts
```
Sub-tabs (underline, secondary level):
  Image Prompt | Video Prompt

Textarea:
  Same input style as Element Forge
  w-full rounded-xl border border-(--border-primary) bg-(--bg-primary)
  px-4 py-3 text-[13px] min-h-[160px] resize-y leading-relaxed

Quick Actions Row (below textarea):
  flex items-center gap-2
  [Load from Description] [Clear] [Copy]
  Button style: px-3 py-1.5 rounded-lg text-[11px] font-medium
    text-(--text-secondary) hover:text-(--text-primary) bg-white/5 hover:bg-white/8

Prompt Templates Dropdown (TemplateDropdown pattern from Forge):
  Trigger: shows selected template name + preview snippet
  Panel: bg-(--bg-secondary) rounded-xl max-h-[240px] overflow-y-auto
```

#### Tab: Elements
```
Assigned Elements:
  List of element cards (compact):
    flex items-center gap-3 px-3 py-2.5 rounded-xl bg-(--bg-primary) border border-(--border-primary)
    Thumbnail: w-10 h-10 rounded-lg object-cover
    Name: text-[13px] font-medium
    Type badge: text-[9px] uppercase tracking-wide
    Remove X: w-6 h-6 rounded-md hover:bg-red-500/10 text-(--text-tertiary) hover:text-red-400

  If no elements: empty state with dashed border

[+ Add Element] button:
  w-full py-2.5 rounded-xl border border-dashed border-(--border-primary)
  hover:border-(--accent-blue)/40 hover:bg-(--accent-blue)/5
  text-[12px] text-(--text-secondary) hover:text-(--accent-blue)
  Opens ElementLibrary in picker mode
```

#### Tab: Notes
```
Textarea:
  Full-width, same input style
  min-h-[200px]
  placeholder: "Add production notes, director feedback, revision history..."
```

#### Panel Bottom Bar
```
Container:
  px-5 py-3 border-t border-(--border-primary)
  flex items-center gap-2

Left:
  [Duplicate] [Delete] — secondary actions
  Button: px-3 py-2 rounded-xl text-[12px] font-medium
  Duplicate: text-(--text-secondary) hover:bg-white/5
  Delete: text-red-400 hover:bg-red-500/10

Right (ml-auto):
  [Open in Editor] — primary CTA
  Button: px-4 py-2 rounded-xl text-[12px] font-medium
  bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white
  Sparkles icon + "Open Editor"
```

---

### 18.5 Action Bar (Bottom — Element Forge Pattern)

Replaces the current secondary toolbar above the grid. Persistent at the bottom of the workspace, always visible.

```
Container:
  px-5 py-3 border-t border-(--border-primary) bg-(--bg-secondary)/95 backdrop-blur-md
  flex items-center gap-3 shrink-0

Left Group:
  Frame count: text-[12px] font-medium text-(--text-secondary) tabular-nums
    "24 frames"

  Style Selector (compact):
    Trigger: flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-medium
      border border-(--border-primary) hover:border-(--border-secondary)
      Palette icon w-3.5 h-3.5
      Active: text-purple-400 border-purple-500/30 bg-purple-500/8
      Inactive: text-(--text-secondary)

  Format Selector (compact):
    Same trigger style as Style
    Layers icon

  Separator: w-px h-5 bg-(--border-primary) mx-1

  Duplicate warning (conditional):
    AlertTriangle icon + count
    text-[11px] text-(--color-warning)

Spacer: flex-1

Right Group:
  Secondary buttons:
    [Files] [Elements] [Director] [Presets]
    Style: px-3 py-1.5 rounded-xl text-[12px] font-medium
      text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5
      Icon: w-3.5 h-3.5 mr-1.5

  Director (active state):
    text-amber-400 bg-amber-500/10 border border-amber-500/20

  Separator: w-px h-5 bg-(--border-primary) mx-1

  Primary buttons:
    [Generate All]:
      px-4 py-1.5 rounded-xl text-[12px] font-medium
      bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white
      Sparkles icon w-3.5 h-3.5

    [Export]:
      px-4 py-1.5 rounded-xl text-[12px] font-medium
      bg-(--accent-teal) hover:bg-(--accent-teal)/80 text-white

  Remove Duplicates — ONLY shown when duplicateCount > 0, not always.
    text-red-400 hover:bg-red-500/10 rounded-xl px-3 py-1.5
```

---

### 18.6 Empty State (No Frames)

Matches Element Library empty state pattern:

```
Container:
  flex-1 flex flex-col items-center justify-center text-center

Icon:
  w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center mb-5
  Grid3x3 icon w-8 h-8 text-(--text-tertiary)

Title: text-[15px] font-medium text-(--text-primary) mb-1
  "No frames yet"

Subtitle: text-[13px] text-(--text-secondary) mb-6 max-w-sm
  "Write a script and build your storyboard, or create frames manually."

Buttons (flex items-center gap-3):
  Primary: [Go to Script] — same blue CTA style
  Secondary: [Create Frame] — border border-(--border-primary) hover style
```

---

### 18.7 Grid Responsive Columns

```
Standard (16:9 frames):
  grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5

Portrait (9:16 frames):
  grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7

Square (1:1 frames):
  grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6

When Detail Panel is open (grid shrinks):
  Standard: grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  (subtract ~1 column since panel takes 380px)

Gap: gap-4
Padding: p-6
```

---

### 18.8 Keyboard Shortcuts

```
Ctrl+- / Ctrl+=     Zoom out / in
Ctrl+0              Reset zoom to 100%
Escape              Deselect frame / close Detail Panel
Arrow Left/Right    Navigate between frames
Arrow Up/Down       Navigate grid rows
Delete / Backspace  Delete selected frame (with confirmation)
Enter               Open selected frame in SceneEditor
D                   Duplicate selected frame
F                   Toggle favorite
N                   Open notes tab in Detail Panel
P                   Open prompts tab in Detail Panel
```

---

### 18.9 Drag & Drop (Simplified)

```
Drag handle: NOT shown. Entire card is draggable.
  cursor-grab on hover, cursor-grabbing while dragging

Dragging state:
  opacity-40 on source card
  ring-2 ring-(--accent-blue)/40 on drop target
  Blue insertion line indicator between cards

Drop feedback:
  Smooth reorder animation (200ms ease)
```

---

### 18.10 Context Menu (Right-Click)

Instead of hover action buttons on each card, use a right-click context menu (matches StoryboardStrip pattern from Section 11):

```
Container:
  bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl
  py-1.5 w-[200px] z-[9999]
  Portal to document.body

Items:
  px-3 py-2 text-[13px] text-(--text-primary) hover:bg-white/5
  Icon: w-4 h-4 text-(--text-secondary) strokeWidth={1.75}
  gap-2.5

Menu structure:
  Edit Title & Description     (Pencil icon)
  Edit Prompts                 (Sparkles icon)
  ─────────────
  Open in Editor               (Maximize icon)
  Review with Director         (Sparkles amber icon)
  ─────────────
  Add Element                  (Plus icon)
  Upload Image                 (Upload icon)
  Browse Files                 (FolderOpen icon)
  Set as Cover                 (Image icon)
  ─────────────
  Duplicate                    (Copy icon)
  Move to...                   (ArrowRight icon) → submenu with position
  ─────────────
  Delete                       (Trash2 icon, text-red-400 hover:bg-red-500/10)

Divider: h-px bg-(--border-primary) mx-2 my-1
```

---

### 18.11 Summary of Changes

| Area | Before | After |
|------|--------|-------|
| **Tab navigation** | Pill-style bordered box | Underline tabs (matches Forge) |
| **Frame card** | 15+ overlays, gradients, hover buttons | Image + number + title + element badges |
| **Editing** | In-card dropdowns & dialogs | Right Detail Panel (like Element Library) |
| **Toolbar** | 8 buttons crammed above grid | Bottom Action Bar (like Forge) |
| **Status editing** | Dropdown on card | Button group in Detail Panel |
| **Tag editing** | Dropdown on card | Input field in Detail Panel |
| **Notes** | Modal dialog | Tab in Detail Panel |
| **Prompts** | Modal dialog | Tab in Detail Panel |
| **Frame actions** | 6 hover circles on image | Right-click context menu |
| **Style/Format** | Above grid dropdowns | Bottom Action Bar selectors |
| **Move up/down** | Hover arrows on card | Drag-and-drop only |
| **Remove Duplicates** | Always-visible orange button | Conditional, bottom bar |
| **Empty card** | "No media" + Browse Files | Simple icon placeholder |
| **Extend Story** | Button in header | Move to Action Bar or Script tab |

### 18.12 Files to Modify

| File | Changes |
|------|---------|
| `workspace/[projectId]/page.tsx` | Header underline tabs, grid simplification, Detail Panel, Action Bar, remove secondary toolbar |
| `workspace/[projectId]/page.tsx` (FrameCard) | Strip to minimal card — image + number + title + badges |
| `workspace/[projectId]/page.tsx` (FrameCard) | Extract to own file: `components/workspace/FrameCard.tsx` |
| **NEW** `components/workspace/DetailPanel.tsx` | Right-side edit panel with tabbed interface |
| **NEW** `components/workspace/ActionBar.tsx` | Bottom persistent toolbar |
| **NEW** `components/workspace/FrameContextMenu.tsx` | Right-click menu component |

---

## 19. Frame Info Panel Improvements (Right Panel in SceneEditor)

### Overview
The right info panel (`w-[260px]`) in SceneEditor displays metadata for the current canvas content. Improved to be media-type-aware: Cinema Studio shows image metadata only, with dedicated sections for video and audio files.

### Quality Field Formatting
```
Raw JSON like:
  {"type":"gpt-image-2","mode":"text-to-image","nsfwChecker":false,"resolution":"1K"}
Now displays as:
  "1K, image to image"

formatQuality() parses JSON, extracts resolution + mode, falls back to plain string.
```

### Cinema Studio — Image Files Only
```
Previously: matched ANY latest file (video/audio metadata would show while canvas displayed an image)
Now: splits shotFiles into imageFiles / videoFiles / audioFiles
     Cinema Studio metadata only matches image files
     Prompt also sourced from image files first
```

### Videos Section (grid, 3 per row)
```
Section:   "VIDEOS (N)" — only shown when videoFiles exist
Layout:    grid grid-cols-3 gap-1.5 (wrapping, no scrollbar)

Thumbnail:
  aspect-video rounded-md overflow-hidden
  border border-(--border-primary) hover:border-(--border-secondary)
  bg-(--bg-primary)

  <video> element, seeks to 0.5s on load
  Play icon overlay on hover: bg-black/30 → Play w-3.5 fill white
  Model label at bottom: bg-black/60 text-[7px] text-white/80

Click: opens VideoPreviewDialog
```

### Audio Section (accent pill dropdown)
```
Section:   "AUDIO (N)" — only shown when audioFiles exist

Trigger Pill (rounded-full, accent-bordered, like "Commercial" badge):
  Music files: border-purple-500/40 bg-purple-500/10 shadow-[0_0_8px_rgba(168,85,247,0.15)]
  Audio files: border-blue-500/40 bg-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.15)]

  Layout: w-full flex items-center gap-2 rounded-full px-3 py-1.5
  Icon:   Mic w-3.5 h-3.5 (purple-400 or blue-400)
  Label:  text-[12px] font-medium (purple-200 or blue-200) truncate
  Chevron: w-3 h-3, rotates 180° when open

Below pill:
  Left:  model name text-[10px] text-(--text-tertiary)
  Right: Play button — rounded-full px-2 py-1 text-[10px] font-medium
         accent bg (purple-500/15 or blue-500/15)
         Play icon w-3 h-3 fill + "Play" label

Dropdown Panel:
  absolute top-[calc(100%-20px)] mt-1 z-50
  bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl
  py-1.5 max-h-[220px] overflow-y-auto

  Item: w-full flex items-center gap-2.5 px-3 py-2
    Icon circle: w-6 h-6 rounded-full bg-purple-500/20 or bg-blue-500/20
      Mic w-3 h-3 inside
    Title: text-[12px] text-(--text-primary) font-medium truncate
    Subtitle: text-[10px] text-(--text-tertiary) (model name)
    Selected: bg-white/8 + accent dot (w-1.5 h-1.5 rounded-full)
    Hover: hover:bg-white/5

  Backdrop: fixed inset-0 z-40 (click to close)

State: audioDropdownOpen, selectedAudioId
Click item → updates selectedAudioId, closes dropdown
Click play → opens AudioPreviewDialog with selected audio
```

### Action Buttons (unified grid)
```
All 6 actions in a single grid grid-cols-2:
  Save to Frame, Retrieve, Combine, Delete, Download, Save to Cloud

"Upload to R2" renamed → "Save to Cloud" (user-friendly)
"Full Frame Details" button below the grid (full-width)
```

### GeneratedImagesPanel Alignment
```
Filter Controls:
  Changed from pill buttons to underline tabs (matches Storyboard tabs)
  Active: text-(--text-primary) border-b-2 border-white (completed)
          text-blue-400 border-blue-400 (processing)
          text-red-400 border-red-400 (error)
  Inactive: text-(--text-tertiary) border-transparent

Panel Background:
  Changed from bg-(--bg-primary) to bg-(--bg-secondary)/95 backdrop-blur-md
  Now matches the right info panel background

Card hover: bg-(--bg-tertiary)/40 (was hardcoded #1A1D22)
Image preview popup: rounded-2xl, backdrop-blur-sm, design system typography
Video preview dialog: rounded-2xl, backdrop-blur-sm, CSS var colors
```

### Files Modified

| File | Changes |
|------|---------|
| `editor/SceneEditor.tsx` | Info panel: image-only Cinema Studio, Videos grid, Audio pill dropdown, action grid, formatQuality(), AudioPreviewDialog import |
| `GeneratedImagesPanel/FilterControls.tsx` | Pill buttons → underline tabs |
| `GeneratedImagesPanel/index.tsx` | Panel bg match, border consistency, share dialog buttons |
| `GeneratedImagesPanel/GeneratedImageCard.tsx` | Card hover, image preview popup redesign |
| `shared/VideoPreviewDialog.tsx` | rounded-2xl, backdrop-blur-sm, CSS var colors, design system close button |
