# LTX UI/UX Style Guide

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

### **� **Mobile Responsiveness**
- **Breakpoints**: Mobile (<768px), Tablet (768px-1024px), Desktop (>1024px)
- **Modal Adaptation**: Full viewport on mobile with reduced padding and rounded corners
- **Header Layout**: Stack controls vertically on mobile, wrap to multiple lines
- **File Grid**: Single column on mobile, 2-3 columns on tablet, responsive on desktop
- **Touch Targets**: Minimum 44px touch targets for mobile interactions
- **Typography**: Scale down appropriately on smaller screens
- **Gestures**: Support swipe gestures for mobile interactions

### ** **File Browser (LTX Pattern)**
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