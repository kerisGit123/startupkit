# UI Components — Style, Tags & Text Input

> **Owns**: LTX design system, tag display patterns, ContentEditable badge system
> **Status**: Implemented

---

# LTX Style Guide

> **Purpose**: A modern, simple, and efficient design system for the LTX platform.
> **Scope**: To ensure a consistent and high-quality user experience across all product features.
> **Inspiration**: Based on the LTX application's existing UI patterns.

---

## 🎯 **Design Philosophy**

### **🎨 **Core Principles**
- **Modern & Sleek**: A dark-themed, professional UI that feels contemporary and focused.
- **Simple & Intuitive**: Minimal complexity, clear information hierarchy, and predictable interactions.
- **Efficient & Focused**: Workflows are optimized to reduce cognitive load and help users complete tasks quickly.
- **Consistent**: A unified visual and interactive language across the entire platform.

---

## 🎨 **Color Palette (Dark Theme)**

### **⚫ **Primary & Neutral Colors**
```css
/* Backgrounds */
--bg-primary: #1A1A1A;      /* Main app background */
--bg-secondary: #2C2C2C;    /* Cards, panels, and secondary surfaces */
--bg-tertiary: #3D3D3D;     /* UI controls, borders, hover states */

/* Text */
--text-primary: #FFFFFF;       /* Primary text, headings */
--text-secondary: #A0A0A0;     /* Secondary text, labels, descriptions */
--text-tertiary: #6E6E6E;      /* Tertiary text, placeholders, disabled states */

/* Borders */
--border-primary: #3D3D3D;     /* Default border color */
--border-secondary: #4A4A4A;   /* Subtle borders */
```

### **🔵 **Accent Colors**
```css
/* Primary Accent (Blue) */
--accent-blue: #4A90E2;         /* Primary buttons, links, focus rings, selected states */
--accent-blue-hover: #357ABD;   /* Hover state for primary blue elements */

/* Secondary Accent (Teal) */
--accent-teal: #4A9E8E;         /* Secondary buttons or highlights */
--accent-teal-hover: #378B7C;   /* Hover state for teal elements */

/* Semantic Colors */
--color-success: #52C41A;       /* Success messages, confirmation */
--color-warning: #FAAD14;       /* Warnings, alerts */
--color-error: #FF4D4F;         /* Error messages, destructive actions */
```

---

## ✒️ **Typography**

### **📝 **Font Family**
```css
/* A clean, modern sans-serif font is used throughout the UI. */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
```

### **📏 **Font Scale**
- **Headings**: Bold weight (`700`), ranging from `1.5rem` to `2.25rem`.
- **Body**: Normal weight (`400`) at `1rem` (16px).
- **Labels/Subtext**: Medium weight (`500`) at `0.875rem` (14px).
- **Captions**: Normal weight (`400`) at `0.75rem` (12px).

---

## 🎨 **Component Design (LTX Style)**

### **🔘 **Buttons**
- **Primary Action**:
  - **Background**: `var(--accent-blue)`
  - **Text**: `var(--text-primary)`
  - **Hover**: `var(--accent-blue-hover)`
  - **Border Radius**: `0.5rem` (8px)
- **Secondary Action**:
  - **Background**: `var(--bg-tertiary)`
  - **Text**: `var(--text-secondary)`
  - **Hover**: `var(--border-primary)`
  - **Border Radius**: `0.5rem` (8px)
- **Text/Icon Buttons**:
  - **Background**: `transparent`
  - **Text/Icon Color**: `var(--text-secondary)`
  - **Hover**: Background `var(--bg-tertiary)`

### **📋 **Cards & Panels**
- **Background**: `var(--bg-secondary)`
- **Border**: `1px solid var(--border-primary)`
- **Border Radius**: `0.75rem` (12px)
- **Shadow**: Subtle shadow to create depth, especially on hover.

### **🪟 **Modals & Overlays**
- **Background**: `var(--bg-secondary)`
- **Border**: `1px solid var(--border-primary)`
- **Border Radius**: `1rem` (16px) for top-level modals
- **Shadow**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)` for dramatic depth
- **Overlay**: `rgba(0, 0, 0, 0.8)` with backdrop blur for modern glass effect
- **Header**: Clean header with rounded top corners, no border conflicts
- **Content**: Subtle divider between header and content (`h-px bg-(--border-primary)`)

### **🖼️ **Media Preview Popups**

Full-screen preview dialogs for video, audio, and image files. Used in Generated Images panel and VideoImageAIPanel reference inputs.

**Structure:**
```
┌─────────────────────────────────────────────────┐
│  [Title]                              [X Close] │  ← Header
├─────────────────────────────────────────────────┤
│                                                 │
│        [Video / Image / Audio Player]           │  ← Content
│                                                 │
├─────────────────────────────────────────────────┤
│  Model: bytedance/seedance-2-fast               │  ← Footer
│  [Download]                [Use as Background]  │
└─────────────────────────────────────────────────┘
```

**Overlay:**
- `position: fixed; inset: 0` — full viewport coverage
- `background: rgba(0, 0, 0, 0.8)` — matches `--overlay` convention
- `z-index: 99999` — above all panels, toolbars, and context menus
- Click outside to close (overlay `onClick` → dismiss)

**Container:**
- `background: var(--bg-primary)` → `#1A1A1A`
- `border-radius: 0.75rem` (12px) → `rounded-xl`
- `max-width: 56rem` (896px) → `max-w-4xl`
- `max-height: 90vh` → prevents overflow on small screens
- `overflow: hidden` — clean edges

**Header:**
- `padding: 1rem` → `p-4`
- `border-bottom: 1px solid var(--border-primary)` → `border-b border-[#3D3D3D]`
- Title: `text-white font-medium`
- Close button: `text-gray-400 hover:text-white`

**Content:**
- `padding: 1rem` → `p-4`
- Video: `width: 100%; max-height: 70vh; border-radius: 0.5rem` + native `controls` + `autoPlay`
- Image: `max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 0.5rem`
- Audio: centered icon (`Volume2`, purple) + native `<audio controls>` below

**Footer:**
- `padding: 1rem` → `p-4`
- `border-top: 1px solid var(--border-primary)` → `border-t border-[#3D3D3D]`
- Model/prompt info: `text-sm text-gray-400`
- Action buttons: "Download" (secondary) + "Use as Background" (emerald primary)

**Rendering:** Uses `createPortal(jsx, document.body)` to escape panel overflow/stacking context constraints. Essential when popup is triggered from inside a scrollable panel like Generated Images.

**Hover-to-Preview (Video/Audio ref cards in VideoImageAIPanel):**
- No auto-play on hover
- Hover shows play icon overlay (white circle + triangle, centered, `bg-black/30` overlay)
- Click opens the full-screen preview popup
- Delete button uses `stopPropagation` to avoid triggering preview

---

### **🔔 **Toast Notifications (Sonner)**

Non-blocking notifications using the Sonner library, styled to match LTX dark theme.

**Configuration:**
```tsx
<Toaster position="bottom-right" theme="dark" toastOptions={{
  style: { background: '#2C2C2C', border: '1px solid #3D3D3D', color: '#FFFFFF' }
}} />
```

**Types:**
- `toast.success(msg)` — green accent, used for: credit deduction, file upload, generation started
- `toast.error(msg)` — red accent, used for: insufficient credits, upload failed, API errors
- `toast.warning(msg)` — yellow accent, used for: approaching limits, validation warnings

**Usage:** Replaces all `alert()` calls in storyboard studio. Import `toast` from `"sonner"`.

---

### **⚠️ **Confirm Dialog (ConfirmDialog)**

Reusable modal confirmation dialog for destructive or important actions.

**File:** `app/storyboard-studio/components/shared/ConfirmDialog.tsx`

**Props:**
```tsx
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;   // default: "Confirm"
  cancelText?: string;    // default: "Cancel"
  variant?: 'danger' | 'warning' | 'info';  // button color
}
```

**Styling:**
- Overlay: `bg-black/70 backdrop-blur-sm`
- Container: `bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl max-w-md`
- Danger confirm button: `bg-red-600 hover:bg-red-500`
- Warning confirm button: `bg-amber-600 hover:bg-amber-500`
- Info confirm button: `bg-blue-600 hover:bg-blue-500`
- Cancel button: `bg-white/10 hover:bg-white/20`

**Used by:** FileBrowser (delete file), GeneratedImageCard (delete failed), prompt length validation.

---

### **📝 **Input Fields**
- **Background**: `var(--bg-primary)` or `var(--bg-secondary)`
- **Border**: `1px solid var(--border-primary)`
- **Border Radius**: `0.5rem` (8px)
- **Text Color**: `var(--text-primary)`
- **Placeholder Color**: `var(--text-tertiary)`
- **Focus State**: A blue ring or border using `var(--accent-blue)`.

### **🧭 **Navigation & Tabs**
- **Active Tab**: A solid background (`var(--bg-tertiary)`) or a colored line indicator (`var(--accent-blue)`).
- **Inactive Tab**: `var(--text-secondary)` color, transparent background.
- **Icons**: Minimalist, line-art style, colored `var(--text-secondary)`.

### **▶️ **Video Player & Timeline**
- **Timeline**: A dark track (`var(--bg-primary)`) with a red playhead indicator.
- **Thumbnails**: Rounded corners, with subtle overlays for text or icons.
- **Controls**: Minimalist icons with clear, intuitive functions.

### **📱 **Mobile Responsiveness**
- **Breakpoints**: Mobile (<768px), Tablet (768px-1024px), Desktop (>1024px)
- **Modal Adaptation**: Full viewport on mobile with reduced padding and rounded corners
- **Header Layout**: Stack controls vertically on mobile, wrap to multiple lines
- **File Grid**: Single column on mobile, 2-3 columns on tablet, responsive on desktop
- **Touch Targets**: Minimum 44px touch targets for mobile interactions
- **Typography**: Scale down appropriately on smaller screens
- **Gestures**: Support swipe gestures for mobile interactions

### **📁 **File Browser (LTX Pattern)**
- **Modal Layout**: Full-screen modal with rounded corners and dramatic shadow
- **Header**: Clean toolbar with organized controls (Filter, Search, Zoom, Upload, Close)
- **Filter System**: Consolidated dropdown with file type and source filters
- **File Grid**: Responsive grid with adjustable zoom (80px - 200px)
- **File Cards**: Rounded corners (`rounded-2xl`), hover effects, and clean overlays
- **Image Display**: Rounded corners on all images with `object-cover` scaling
- **Action Buttons**: Favorite star, download, and delete controls on hover
- **File Info**: Gradient overlay with filename and project/global badges
- **Empty States**: Clear messaging with appropriate icons and styling

#### **📱 Mobile File Browser Adaptations**
- **Modal**: Full viewport with minimal padding, `rounded-t-2xl` only on top
- **Header**: Stack search and controls vertically, prioritize essential actions
- **Search**: Full-width search bar with prominent positioning
- **Filter**: Bottom sheet or slide-up panel for better mobile access
- **Grid**: Single column layout with larger touch targets (minimum 80px height)
- **File Cards**: Increased spacing for touch interaction, persistent action buttons
- **Zoom**: Slider replaced with preset size options (Small, Medium, Large)
- **Upload**: Prominent upload button with drag-and-drop support
- **Gestures**: Swipe to delete, long-press for context menu

---

## ✨ **Interactive States**

- **Hover**: Elements should provide clear feedback, such as a change in background color, border, or shadow.
- **Focus**: Interactive elements must have a visible focus state, typically a blue ring (`var(--accent-blue)`), for accessibility.
- **Selected**: Selected items in lists or grids should be clearly indicated, often with a border or background color change (`var(--accent-blue)`).

---

---

# Tags System

## Overview
This document outlines the current tag implementation across the storyboard studio components and provides guidelines for consistent tag display and management.

## Tag Data Structure

### Convex Backend Storage Schema

#### 1. Storyboard Projects Table
```typescript
storyboard_projects: defineTable({
  // ... other fields
  tags: v.array(v.string()), // Simple string array storage
})
```
- **Format**: Array of strings (`string[]`)
- **Purpose**: Simple, efficient storage for project-level tags
- **Example**: `["action", "dialogue", "custom-tag"]`

#### 2. Storyboard Items Table (Individual Frames)
```typescript
storyboard_items: defineTable({
  // ... other fields  
  tags: v.optional(v.array(v.object({
    id: v.string(),
    name: v.string(), 
    color: v.string(),
  }))),
})
```
- **Format**: Array of tag objects with full metadata
- **Purpose**: Rich tag data for individual storyboard items
- **Example**: `[{id: "action", name: "Action", color: "#ef4444"}]`

#### 3. Other Tables (Elements, Assets, etc.)
- **storyboard_elements**: `tags: v.array(v.string())`
- **storyboard_assets**: `tags: v.array(v.string())`
- **users**: `userTags: v.optional(v.array(v.string()))`

### Frontend Display (UI Components)
- **Format**: Tag objects with full metadata
- **Interface**: `Tag { id: string; name: string; color: string; }`
- **Purpose**: Rich visual display with colors and names

### Predefined Tags
```typescript
export const SIMPLE_TAGS = [
  { id: "action", name: "Action", color: "#ef4444" },
  { id: "dialogue", name: "Dialogue", color: "#f97316" },
  { id: "dramatic", name: "Dramatic", color: "#eab308" },
  { id: "close-up", name: "Close Up", color: "#22c55e" },
  { id: "wide", name: "Wide", color: "#3b82f6" },
  { id: "interior", name: "Interior", color: "#8b5cf6" },
  { id: "exterior", name: "Exterior", color: "#ec4899" },
  { id: "day", name: "Day", color: "#06b6d4" },
  { id: "night", name: "Night", color: "#ef4444" },
  { id: "montage", name: "Montage", color: "#f97316" },
];

export const TAG_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
```

## Tag Display Patterns

### 1. Storyboard Item Tags (Primary Pattern)
**Used in**: TimelineView, ProjectsDashboard (updated)
**Characteristics**:
- Purple theme with opacity
- Rounded corners (not full)
- Hash icon for visual identification
- Consistent spacing

```typescript
<span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs flex items-center gap-1">
  <Hash className="w-3 h-3" />
  {tagString}
</span>
```

**Visual Style**:
- Background: `bg-purple-500/10` (10% opacity purple)
- Text: `text-purple-400` (light purple)
- Border: `rounded` (slightly rounded corners)
- Typography: `text-xs` (extra small)
- Layout: `flex items-center gap-1`
- Icon: `Hash` (w-3 h-3)

### 2. Scene Editor Tags (Shot-level)
**Used in**: SceneEditor component
**Characteristics**:
- Dynamic colored backgrounds
- White text for contrast
- Smaller text size
- No icons

```typescript
<span className="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: t.color + "cc" }}>
  {t.name}
</span>
```

**Visual Style**:
- Background: Dynamic color with 80% opacity (`color + "cc"`)
- Text: `text-white` (white)
- Border: `rounded`
- Typography: `text-[10px] font-semibold` (10px, bold)
- Layout: No flex, text only

### 3. Element Library Tags
**Used in**: ElementLibrary component
**Characteristics**:
- Purple theme with higher opacity
- Backdrop blur effect
- Compact size
- No icons

```typescript
<span className="text-xs bg-purple-500/80 text-white rounded px-1.5 py-0.5 backdrop-blur-sm">
  {tag}
</span>
```

**Visual Style**:
- Background: `bg-purple-500/80` (80% opacity purple)
- Text: `text-white` (white)
- Border: `rounded`
- Typography: `text-xs`
- Layout: `px-1.5 py-0.5`
- Effect: `backdrop-blur-sm`

### 4. TagEditor Tags (Interactive)
**Used in**: TagEditor component
**Characteristics**:
- Dynamic colored backgrounds
- Rounded-full (pill shape)
- Hover effects and transitions
- Remove button (X icon)

```typescript
<span
  key={`${tag.id}-${index}`}
  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
  style={{ 
    backgroundColor: tag.color + '25', 
    color: tag.color,
    border: `1px solid ${tag.color}30`
  }}
>
  {tag.name}
  <button onClick={() => removeTag(tag.id)} className="ml-1 hover:opacity-70 transition">
    <X className="w-3 h-3" />
  </button>
</span>
```

**Visual Style**:
- Background: Dynamic color with 15% opacity (`color + '25'`)
- Text: Dynamic color (`color`)
- Border: `rounded-full` (pill shape)
- Typography: `text-xs font-medium`
- Layout: `inline-flex items-center gap-1`
- Effects: `transition-all duration-200 hover:scale-105`
- Border: `1px solid ${color}30`

## Data Conversion Functions

### Convex Integration Patterns

#### 1. Projects Tags (String Storage)
```typescript
// Storage: storyboard_projects.tags = ["action", "dialogue", "custom"]

// Frontend Display Conversion
const toProjectTagOption = (tag: string, index: number): ProjectTagOption => {
  const predefinedTag = SIMPLE_TAGS.find((t) => t.id === tag);
  if (predefinedTag) {
    return predefinedTag;
  }

  // Create a tag option from string tag
  const color = TAG_COLORS[index % TAG_COLORS.length];
  return {
    id: tag,
    name: tag,
    color: color
  };
};

// Backend Storage Conversion
const handleProjectTagsChange = (newTags: ProjectTagOption[]) => {
  // Convert tag objects back to strings and deduplicate
  const tagStrings = [...new Set(newTags.map(tag => tag.id))];
  // Save to Convex as string array
};
```

#### 2. Items Tags (Object Storage)
```typescript
// Storage: storyboard_items.tags = [{id: "action", name: "Action", color: "#ef4444"}]

// Direct usage - no conversion needed for items
const itemTags = item.metadata.tags; // Already objects with color/name

// Backend Storage - save full objects
await updateStoryboardItem({
  id: itemId,
  tags: shotTags // Array of {id, name, color} objects
});
```

### String to Object Conversion
```typescript
const toProjectTagOption = (tag: string, index: number): ProjectTagOption => {
  const predefinedTag = SIMPLE_TAGS.find((t) => t.id === tag);
  if (predefinedTag) {
    return predefinedTag;
  }

  // Create a tag option from string tag
  const color = TAG_COLORS[index % TAG_COLORS.length];
  return {
    id: tag,
    name: tag,
    color: color
  };
};
```

### Object to String Conversion
```typescript
const handleProjectTagsChange = (newTags: ProjectTagOption[]) => {
  // Convert tag objects back to strings and deduplicate
  const tagStrings = [...new Set(newTags.map(tag => tag.id))];
  // Save to backend...
};
```

## Implementation Guidelines

### 1. Consistency Rules
- **Storyboard Items**: Use purple theme with Hash icon (Pattern 1)
- **Scene Elements**: Use dynamic colors with white text (Pattern 2)
- **Interactive Tags**: Use TagEditor pattern with hover effects (Pattern 4)
- **Card Overlays**: Use ElementLibrary pattern with backdrop blur (Pattern 3)

### 2. Color Usage
- **Purple Theme**: For primary tag display (timeline, project cards)
- **Dynamic Colors**: For scene-specific tags (shot types, locations)
- **High Contrast**: Ensure readability on various backgrounds

### 3. Icon Usage
- **Hash Icon**: For general tag identification
- **Tag Icon**: For metadata tags in timeline
- **X Icon**: For removable tags in editors

### 4. Responsive Design
- **Desktop**: Full tag display with all metadata
- **Mobile**: Truncated tags with "+N" overflow indicator
- **Table View**: Limited to 2 tags per row
- **Grid View**: Limited to 3 tags per card

## Component Mapping

| Component | Pattern | Use Case | Icon |
|-----------|---------|----------|------|
| TimelineView | Pattern 1 | Timeline items | Hash |
| ProjectsDashboard | Pattern 1 | Project cards | Hash |
| SceneEditor | Pattern 2 | Shot tags | None |
| ElementLibrary | Pattern 3 | Element overlays | None |
| TagEditor | Pattern 4 | Interactive editing | X |

## Future Considerations

### 1. Tag Categories
- Consider implementing tag categories (scene types, emotions, technical)
- Category-specific color schemes
- Filter by category functionality

### 2. Tag Management
- Bulk tag operations
- Tag renaming across all projects
- Tag merging and deletion

### 3. Performance Optimization
- Tag caching for frequently used combinations
- Lazy loading for large tag sets
- Virtual scrolling for tag lists

### 4. Accessibility
- Keyboard navigation for tag selection
- Screen reader support for tag content
- High contrast mode support

## Migration Notes

### Recent Changes
1. **ProjectsDashboard Updated**: Changed from dynamic colored tags to purple theme (Pattern 1)
2. **Consistent Implementation**: All storyboard items now use the same visual pattern
3. **Icon Standardization**: Hash icon adopted for primary tag display

### Breaking Changes
- Custom tag colors in project cards now use standardized purple theme
- Dynamic colors preserved in SceneEditor for shot-specific context

## Testing Checklist

- [ ] Tag display consistency across all components
- [ ] Tag creation and deletion functionality
- [ ] Tag deduplication in storage
- [ ] Responsive behavior on different screen sizes
- [ ] Keyboard navigation and accessibility
- [ ] Performance with large tag sets
- [ ] Data persistence and synchronization

---

# Prompt Library (April 2026 Update)

## Category Expansion
Categories expanded from the original set (character/environment/prop/style/custom) to include:
- **camera** — camera angle and movement prompts
- **action** — character action and motion prompts
- **other** — miscellaneous prompts that don't fit other categories

## Category Filter Tabs
- Tab bar with category filter buttons, each showing a count of prompts in that category
- "All" tab shows all prompts across categories
- Selecting a category tab filters the prompt list in real time

## Notes Field
- Create and edit modals now include a `notes` text field
- Provides a place for usage tips, context, or reminders about each prompt
- Displayed as secondary text on prompt cards

## New Default Prompts
The following default prompts are now seeded:
- **General Character** — baseline character description prompt
- **Monster** — creature/monster generation prompt
- **General Environment** — baseline environment/scene prompt
- **Prompt Edit Image** — prompt template for image editing workflows

---

## FileBrowser Updates (April 2026)

### Pagination
- Switched from `useQuery` to `usePaginatedQuery` with a new `listFiltered` query
- Server-side filtering by `category` and `fileType`
- "Load More" button at the bottom of the file grid for incremental loading

### File Type Badges
- File cards display type badges: VIDEO, AUDIO, DOC
- File extension shown on cards for quick identification

### Video Lazy Loading
- Video elements use `preload="none"` to avoid loading video data until playback is requested
- Reduces initial page load time for projects with many video files

---

# ContentEditable Badge System

## Overview

Implementation of drag-and-drop functionality for reference images into a rich-text editor area with native inline badge representation and dynamic pricing integration. Uses a `contentEditable` div so the browser handles cursor positioning natively — eliminating the caret drift that affected the previous textarea+overlay approach.

## Why ContentEditable (not textarea+overlay)

The textarea+overlay approach had a fundamental flaw: hidden placeholder characters in the textarea had a different rendered width than the visual badge in the overlay. This gap grew with each badge on the same line and worsened when a scrollbar appeared. No amount of character-counting or width measurement could fix this reliably.

With `contentEditable`:
- Badge spans are actual DOM elements (`contentEditable={false}`)
- The browser places the cursor natively, so alignment is always pixel-perfect
- No overlay, no hidden markers, no width-matching math needed
- **Dynamic Pricing Integration**: Real-time credit calculation and display for AI models

---

## 🎯 **Dynamic Pricing Integration (April 2026)**

### **AI Model Credit Display**
The textarea system now integrates with the dynamic pricing system to show real-time credit costs for AI models:

```typescript
// EditImageAIPanel.tsx - Enhanced textarea with pricing integration
const [currentPrompt, setCurrentPrompt] = useState(userPrompt ?? "");
const [editorIsEmpty, setEditorIsEmpty] = useState(!userPrompt);
const [selectedModel, setSelectedModel] = useState(model);
const [creditsNeeded, setCreditsNeeded] = useState(getModelCredits(model));

// Real-time credit updates when model changes
useEffect(() => {
  if (selectedModel) {
    const credits = getModelCredits(selectedModel);
    setCreditsNeeded(credits);
  }
}, [selectedModel, getModelCredits]);
```

### **Credit-Aware Placeholder Text**
```typescript
// Dynamic placeholder based on selected model and credits
const getPlaceholderText = () => {
  if (editorIsEmpty && selectedModel) {
    const modelName = models.find(m => m.modelId === selectedModel)?.modelName || selectedModel;
    return `Describe what you want to generate with ${modelName} (${creditsNeeded} credits)...`;
  }
  return "Describe what you want to generate...";
};
```

---

## Key Features

### 1. Drag & Drop Functionality
- Reference images are draggable with `cursor-move` styling
- Editor accepts drops; drop position is calculated using `document.caretRangeFromPoint()`
- The browser sets the exact caret position at the drop coordinates
- **Credit Integration**: Shows credit cost when dropping reference images

### 2. Visual Badge System
- **Small image thumbnail** (16x16px) showing the actual reference image
- **"Image X" label** with cyan styling
- **Inline display** that flows with text content
- **`contentEditable={false}`** on each badge span — treated as a single atomic unit
- **× remove button** on the right side of each badge; clicking removes the badge and updates the plain-text state
- **Credit Badge**: Shows credits needed for current model selection

### 3. Auto-Growing Editor
- CSS `min-height` / `max-height` handles grow automatically — no JS needed
- Scrollbar appears only after content exceeds `200px`
- **Dynamic Height**: Adjusts based on content and credit display

### 4. Real-Time Credit Calculation
```typescript
// Credit calculation integration
const calculateCredits = useCallback(() => {
  if (selectedModel) {
    const credits = getModelCredits(selectedModel);
    setCreditsNeeded(credits);
    
    // Update placeholder with credit info
    if (editorIsEmpty) {
      const modelName = models.find(m => m.modelId === selectedModel)?.modelName;
      setPlaceholderText(`Generate with ${modelName} (${credits} credits)...`);
    }
  }
}, [selectedModel, getModelCredits, editorIsEmpty, models]);
```

---

## Implementation Details

### State Management
```typescript
// Constants for mention system
const TEXTAREA_MIN_HEIGHT = 60;
const TEXTAREA_MAX_HEIGHT = 200;

// Refs
const editorRef = useRef<HTMLDivElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const uploadInputRef = useRef<HTMLInputElement>(null);
const isComposingRef = useRef(false);
const savedSelectionRef = useRef<{ container: Node; offset: number } | null>(null);

// State
const [currentPrompt, setCurrentPrompt] = useState(userPrompt ?? "");
const [editorIsEmpty, setEditorIsEmpty] = useState(!userPrompt);
const [selectedModel, setSelectedModel] = useState(model);
const [creditsNeeded, setCreditsNeeded] = useState(getModelCredits(model));
const [placeholderText, setPlaceholderText] = useState(getPlaceholderText());
];

// Aspect ratio options
const aspectRatioOptions = [
  { value: "1:1", label: "1:1", sub: "Square" },
  { value: "6:19", label: "6:19", sub: "Portrait" },
  { value: "19:6", label: "19:6", sub: "Landscape" },
];

// Resolution options
const resolutionOptions = [
  { value: "1K", label: "1K", sub: "1024×1024" },
  { value: "2K", label: "2K", sub: "2048×2048" },
];

// Output format options
const outputFormatOptions = [
  { value: "png", label: "PNG", sub: "Lossless" },
  { value: "jpg", label: "JPG", sub: "Compressed" },
];

// State for new dropdowns
const [aspectRatio, setAspectRatio] = useState("1:1");
const [resolution, setResolution] = useState("1K");
const [outputFormat, setOutputFormat] = useState("png");

// Dropdown visibility states
const [showModelDropdown, setShowModelDropdown] = useState(false);
const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
const [showOutputFormatDropdown, setShowOutputFormatDropdown] = useState(false);
```

### Plain Text Extraction
```typescript
const extractPlainText = (): string => {
  const el = editorRef.current;
  if (!el) return "";
  const collect = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    const htmlEl = node as HTMLElement;
    if (htmlEl.nodeName === "BR") return "\n";
    if (htmlEl.dataset?.type === "mention") return "";
    let result = "";
    node.childNodes.forEach((child) => { result += collect(child); });
    if (htmlEl.tagName === "DIV" && node !== el) result += "\n";
    return result;
  };
  return collect(el).replace(/\n$/, "");
};
```

### Badge DOM Creation
```typescript
const createBadgeElement = (entry: { id: string; imageUrl: string; imageNumber: number }): HTMLSpanElement => {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.type = "mention";
  span.dataset.mentionId = entry.id;
  span.setAttribute(
    "class",
    "inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/40 rounded px-1.5 py-0.5 align-middle mx-0.5 select-none"
  );
  span.style.cursor = "default";
  span.style.fontSize = "inherit";

  const img = document.createElement("img");
  img.src = entry.imageUrl;
  img.alt = `Image ${entry.imageNumber}`;
  img.setAttribute("class", "w-4 h-4 object-cover rounded");

  const label = document.createElement("span");
  label.setAttribute("class", "text-cyan-300 text-sm font-medium whitespace-nowrap");
  label.textContent = `Image ${entry.imageNumber}`;

  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("type", "button");
  closeBtn.setAttribute("title", "Remove");
  closeBtn.setAttribute(
    "class",
    "ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-cyan-400/70 hover:text-white hover:bg-cyan-400/30 transition-colors"
  );
  closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const editor = editorRef.current;
    span.remove();
    if (editor) {
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  span.appendChild(img);
  span.appendChild(label);
  span.appendChild(closeBtn);
  return span;
};
```

### Insert Badge at Caret
```typescript
const insertBadgeAtCaret = (entry: { id: string; imageUrl: string; imageNumber: number }) => {
  const el = editorRef.current;
  if (!el) return;
  el.focus();
  const selection = window.getSelection();
  if (!selection) return;
  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    range.deleteContents();
  } else if (savedSelectionRef.current) {
    try {
      range = document.createRange();
      range.setStart(savedSelectionRef.current.container, savedSelectionRef.current.offset);
      range.collapse(true);
      selection.addRange(range);
    } catch {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.addRange(range);
    }
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.addRange(range);
    range = selection.getRangeAt(0);
  }
  const badge = createBadgeElement(entry);
  range.insertNode(badge);
  const newRange = document.createRange();
  newRange.setStartAfter(badge);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
  setEditorIsEmpty(false);
  setTimeout(() => {
    const plainText = extractPlainText();
    setCurrentPrompt(plainText);
    onUserPromptChange?.(plainText);
  }, 0);
};
```

### Drag & Drop
```typescript
const handleDragStart = (e: React.DragEvent, imageUrl: string, imageIndex: number) => {
  e.dataTransfer.setData("imageUrl", imageUrl);
  e.dataTransfer.setData("imageIndex", imageIndex.toString());
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  setTextareaScrollLeft(e.currentTarget.scrollLeft);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const imageUrl = e.dataTransfer.getData("imageUrl");
  const imageIndex = e.dataTransfer.getData("imageIndex");
  if (!imageUrl || imageIndex === "") return;
  const imageNumber = parseInt(imageIndex) + 1;
  let range: Range | null = null;
  const doc = document as any;
  if (typeof doc.caretRangeFromPoint === "function") {
    range = doc.caretRangeFromPoint(e.clientX, e.clientY);
  } else if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }
  if (range) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl, imageNumber });
};
```

### Editor JSX
```tsx
<div
  ref={editorRef}
  contentEditable={true}
  suppressContentEditableWarning={true}
  onInput={handleEditorInput}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onBlur={handleEditorBlur}
  onCompositionStart={handleCompositionStart}
  onCompositionEnd={handleCompositionEnd}
  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500/30 leading-6 text-sm selection:bg-white/20"
  style={{
    minHeight: `${TEXTAREA_MIN_HEIGHT}px`,
    maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }}
/>
{editorIsEmpty && (
  <div className="absolute top-2 left-3 right-3 text-gray-500 text-sm pointer-events-none select-none leading-6">
    Describe your element... drag &amp; drop reference images here
  </div>
)}

## Component Structure

### Reference Images Section
```tsx
<div className="flex gap-2 overflow-x-auto pb-2">
  {referenceImages.map((img, index) => (
    <div key={img.id} className="relative flex-shrink-0 group">
      <img
        src={img.url}
        alt={`Reference ${index + 1}`}
        className="w-20 h-20 object-cover rounded-lg border border-white/10 cursor-move relative z-10"
        draggable
        onDragStart={(e) => handleDragStart(e, img.url, index)}
      />
      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] px-1 rounded-full z-20">
        Image {index + 1}
      </div>
      <button
        onClick={() => insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl: img.url, imageNumber: index + 1 })}
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center z-0"
        title="Insert mention"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => onRemoveReferenceImage?.(img.id)}
        className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
      >
        <X className="w-2.5 h-2.5 text-white" />
      </button>
    </div>
  ))}
  
  {/* Add reference button */}
  <button
    onClick={() => fileInputRef.current?.click()}
    className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-white/30 transition-colors flex flex-col items-center justify-center gap-1 group"
  >
    <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
    <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">Add</span>
  </button>
</div>

### Dropdown Components (Model, Aspect Ratio, Resolution, Format)
```tsx
{/* Model Select Box */}
<div className="relative" style={{ width: "160px" }}>
  <button
    onClick={() => setShowModelDropdown(!showModelDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{inpaintModelOptions.find(m => m.value === model)?.label || "Select Model"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showModelDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {inpaintModelOptions.map((modelOption) => (
          <button
            key={modelOption.value}
            onClick={() => {
              onModelChange?.(modelOption.value);
              setShowModelDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              model === modelOption.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{modelOption.label}</div>
            <div className="text-[11px] text-gray-500">{modelOption.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Aspect Ratio Select Box */}
<div className="relative" style={{ width: "120px" }}>
  <button
    onClick={() => setShowAspectRatioDropdown(!showAspectRatioDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{aspectRatioOptions.find(o => o.value === aspectRatio)?.label || "Ratio"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showAspectRatioDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {aspectRatioOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setAspectRatio(option.value);
              setShowAspectRatioDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              aspectRatio === option.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px] text-gray-500">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Resolution Select Box */}
<div className="relative" style={{ width: "100px" }}>
  <button
    onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{resolutionOptions.find(o => o.value === resolution)?.label || "Res"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showResolutionDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {resolutionOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setResolution(option.value);
              setShowResolutionDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              resolution === option.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px] text-gray-500">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>

{/* Output Format Select Box */}
<div className="relative" style={{ width: "100px" }}>
  <button
    onClick={() => setShowOutputFormatDropdown(!showOutputFormatDropdown)}
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
  >
    <span>{outputFormatOptions.find(o => o.value === outputFormat)?.label || "Format"}</span>
    <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
  </button>
  
  {showOutputFormatDropdown && (
    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
      <div className="p-2">
        {outputFormatOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setOutputFormat(option.value);
              setShowOutputFormatDropdown(false);
            }}
            className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
              outputFormat === option.value
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-300 hover:bg-white/5"
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px] text-gray-500">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )}
</div>
