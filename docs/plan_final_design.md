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

## 11. Files Modified

| File | Changes |
|------|---------|
| `ai/VideoImageAIPanel.tsx` | Full toolbar redesign, category tabs, model dropdown, settings grid, all controls, ToolBtn updated |
| `editor/EditImageAIPanel.tsx` | Toolbar, model dropdown, quality dropdown, generate button, left/right toolbar + ToolBtn redesign |
| `shared/PromptTextarea.tsx` | Borderless transparent bg, design system text colors |
| `shared/PromptActionsDropdown.tsx` | **NEW** — shared component extracted from both panels |
| `GeneratedImagesPanel/index.tsx` | Panel bg, header, section headings, share dialog |
| `GeneratedImagesPanel/GeneratedImageCard.tsx` | Card container, badges, music card, hover actions, error/processing states |
| `GeneratedImagesPanel/FilterControls.tsx` | Filter pill styles |
| `GeneratedImagesPanel/EmptyState.tsx` | Colors updated |
| `GeneratedImagesPanel/ComparisonView.tsx` | Colors updated |
| `GeneratedImagesPanel/EditPersonaDialog.tsx` | Colors updated |
| `GeneratedImagesPanel/CreatePersonaDialog.tsx` | Colors updated |
