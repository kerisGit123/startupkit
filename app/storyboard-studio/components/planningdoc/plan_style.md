# Storyboard Studio UI/UX Style Guide

> **Purpose**: Modern, simple, and efficient design system for Storyboard Studio
> **Scope**: Consistent UI/UX across all storyboard components and features
> **Phase**: Design System Implementation - **0% COMPLETE**

---

## 🎯 **Design Philosophy**

### **🎨 **Core Principles**
- **Modern**: Clean, contemporary design with current UI trends
- **Simple**: Minimal complexity, intuitive interactions
- **Efficient**: Fast performance, optimized workflows
- **Consistent**: Unified experience across all components
- **Accessible**: WCAG compliant, keyboard navigation support

### **🔧 **Design System Goals**
- **Visual Hierarchy**: Clear information architecture
- **User Flow**: Seamless navigation and task completion
- **Brand Consistency**: Unified visual language
- **Responsive**: Mobile-first approach
- **Performance**: Fast loading and interactions

---

## 🎨 **Color Palette**

### **🌈 **Primary Colors**
```css
/* Brand Colors */
--brand-primary: #10B981;        /* Emerald Green */
--brand-primary-light: #34D399;  /* Light Emerald */
--brand-primary-dark: #059669;   /* Dark Emerald */
--brand-primary-50: #F0FDF4;   /* Very Light Emerald */
--brand-primary-100: #D1FAE5;  /* Light Emerald */
--brand-primary-500: #10B981;  /* Emerald */
--brand-primary-600: #059669;  /* Dark Emerald */
--brand-primary-700: #047857;  /* Very Dark Emerald */

/* Secondary Colors */
--secondary-blue: #3B82F6;      /* Blue */
--secondary-purple: #8B5CF6;     /* Purple */
--secondary-pink: #EC4899;       /* Pink */
--secondary-orange: #F97316;     /* Orange */
```

### **⚪ **Neutral Colors**
```css
/* Gray Scale */
--gray-50: #F9FAFB;           /* Lightest Gray */
--gray-100: #F3F4F6;          /* Very Light Gray */
--gray-200: #E5E7EB;          /* Light Gray */
--gray-300: #D1D5DB;          /* Medium Light Gray */
--gray-400: #9CA3AF;          /* Medium Gray */
--gray-500: #6B7280;          /* Dark Gray */
--gray-600: #4B5563;          /* Medium Dark Gray */
--gray-700: #374151;          /* Dark Gray */
--gray-800: #1F2937;          /* Very Dark Gray */
--gray-900: #111827;          /* Darkest Gray */

/* Semantic Colors */
--white: #FFFFFF;
--black: #000000;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

---

## 🎨 **Typography**

### **📝 **Font Family**
```css
/* Primary Font Stack */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
--font-heading: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### **📏 **Font Sizes**
```css
/* Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### **📖 **Text Hierarchy**
```css
/* Headings */
.text-h1 { font-size: var(--text-4xl); font-weight: var(--font-bold); line-height: 1.2; }
.text-h2 { font-size: var(--text-3xl); font-weight: var(--font-semibold); line-height: 1.3; }
.text-h3 { font-size: var(--text-2xl); font-weight: var(--font-semibold); line-height: 1.4; }
.text-h4 { font-size: var(--text-xl); font-weight: var(--font-medium); line-height: 1.5; }
.text-h5 { font-size: var(--text-lg); font-weight: var(--font-medium); line-height: 1.6; }
.text-h6 { font-size: var(--text-base); font-weight: var(--font-medium); line-height: 1.6; }

/* Body Text */
.text-body-large { font-size: var(--text-lg); font-weight: var(--font-normal); line-height: 1.6; }
.text-body { font-size: var(--text-base); font-weight: var(--font-normal); line-height: 1.6; }
.text-body-small { font-size: var(--text-sm); font-weight: var(--font-normal); line-height: 1.5; }
.text-caption { font-size: var(--text-xs); font-weight: var(--font-medium); line-height: 1.4; }
```

---

## 🎨 **Spacing System**

### **📏 **Spacing Scale**
```css
/* Base Unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
```

### **📐 **Component Spacing**
```css
/* Common Spacing */
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-5 { padding: var(--space-5); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-5 { margin: var(--space-5); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-5 { gap: var(--space-5); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }
```

---

## 🎨 **Layout System**

### **📐 **Container Sizes**
```css
/* Container Max Widths */
.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
.container-2xl { max-width: 1536px; }
.container-full { max-width: 100%; }

/* Default Container */
.container { 
  max-width: var(--container-xl); 
  margin: 0 auto; 
  padding: 0 var(--space-6); 
}
```

### **📱 **Grid System**
```css
/* Grid Columns */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

/* Grid Gaps */
.grid-gap-1 { gap: var(--space-1); }
.grid-gap-2 { gap: var(--space-2); }
.grid-gap-3 { gap: var(--space-3); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-5 { gap: var(--space-5); }
.grid-gap-6 { gap: var(--space-6); }
.grid-gap-8 { gap: var(--space-8); }
```

---

## 🎨 **Component Design**

### **🔘 **Buttons**
```css
/* Button Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
}

/* Button Variants */
.btn-primary {
  background-color: var(--brand-primary);
  color: white;
  border-color: var(--brand-primary);
}

.btn-primary:hover {
  background-color: var(--brand-primary-dark);
  border-color: var(--brand-primary-dark);
}

.btn-secondary {
  background-color: var(--gray-100);
  color: var(--gray-700);
  border-color: var(--gray-300);
}

.btn-secondary:hover {
  background-color: var(--gray-200);
  color: var(--gray-800);
  border-color: var(--gray-400);
}

.btn-outline {
  background-color: transparent;
  color: var(--brand-primary);
  border-color: var(--brand-primary);
}

.btn-outline:hover {
  background-color: var(--brand-primary);
  color: white;
}

.btn-ghost {
  background-color: transparent;
  color: var(--gray-600);
  border-color: transparent;
}

.btn-ghost:hover {
  background-color: var(--gray-100);
  color: var(--gray-800);
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}
```

### **📋 **Cards**
```css
/* Card Base */
.card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--gray-200);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Card Variants */
.card-elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-compact {
  padding: var(--space-4);
}

.card-padding {
  padding: var(--space-6);
}

/* Card Sections */
.card-header {
  padding: var(--space-6) var(--space-6) 0;
  border-bottom: 1px solid var(--gray-100);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: 0 var(--space-6) var(--space-6);
  border-top: 1px solid var(--gray-100);
}
```

### **📝 **Form Elements**
```css
/* Input Base */
.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: var(--text-sm);
  transition: all 0.2s ease;
  background: white;
}

.input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Input States */
.input-error {
  border-color: var(--error);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-success {
  border-color: var(--success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

/* Textarea */
.textarea {
  min-height: 80px;
  resize: vertical;
}

/* Select */
.select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3epath d='M6 9l6 6 6-6'/%3e/svg%3e");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  padding-right: var(--space-10);
}
```

---

## 🎨 **Interactive States**

### **🖱️ **Hover States**
```css
/* Hover Transitions */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}

/* Link Hover */
.link-hover {
  color: var(--brand-primary);
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.2s ease;
}

.link-hover:hover {
  text-decoration-color: var(--brand-primary);
}
```

### **🎯 **Focus States**
```css
/* Focus Outline */
.focus-ring:focus {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
  border-radius: 0.5rem;
}

.focus-ring-offset {
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.2s ease;
}

.focus-ring-offset:focus {
  outline-color: var(--brand-primary);
}
```

### **🚫 **Disabled States**
```css
/* Disabled Elements */
.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.disabled:hover {
  transform: none;
  box-shadow: none;
}
```

---

## 🎨 **Animation System**

### **⚡ **Transitions**
```css
/* Standard Transitions */
.transition-all {
  transition: all 0.2s ease;
}

.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.transition-transform {
  transition: transform 0.2s ease;
}

.transition-opacity {
  transition: opacity 0.2s ease;
}
```

### **🎬 **Animations**
```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Slide In */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: break-word;
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

/* Pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s infinite;
}
```

---

## 🎨 **Dark Mode Support**

### **🌙 **Dark Mode Colors**
```css
/* Dark Mode Palette */
:root {
  /* Dark Mode Colors */
  --dm-bg-primary: #111827;
  --dm-bg-secondary: #1F2937;
  --dm-bg-tertiary: #374151;
  --dm-border: #4B5563;
  --dm-text-primary: #F9FAFB;
  --dm-text-secondary: #D1D5DB;
  --dm-text-tertiary: #9CA3AF;
}

/* Dark Mode Implementation */
.dark {
  --bg-primary: var(--dm-bg-primary);
  --bg-secondary: var(--dm-bg-secondary);
  --bg-tertiary: var(--dm-bg-tertiary);
  --border: var(--dm-border);
  --text-primary: var(--dm-text-primary);
  --text-secondary: var(--dm-text-secondary);
  --text-tertiary: var(--dm-text-tertiary);
}
```

---

## 🎨 **Responsive Design**

### **📱 **Breakpoints**
```css
/* Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;

/* Media Queries */
@media (max-width: 640px) {
  /* Mobile Styles */
  .container { padding: 0 var(--space-4); }
  .text-h1 { font-size: var(--text-3xl); }
  .text-h2 { font-size: var(--text-2xl); }
}

@media (max-width: 768px) {
  /* Tablet Styles */
  .container { padding: 0 var(--space-5); }
}

@media (max-width: 1024px) {
  /* Small Desktop Styles */
  .container { padding: 0 var(--space-6); }
}
```

### **📱 **Mobile Optimizations**
```css
/* Mobile First */
.mobile-hidden {
  display: none;
}

.mobile-visible {
  display: block;
}

@media (max-width: 640px) {
  .mobile-hidden {
    display: none;
  }
  
  .mobile-visible {
    display: block;
  }
  
  .stack {
    flex-direction: column;
  }
  
  .text-center-mobile {
    text-align: center;
  }
}
```

---

## 🎨 **Utility Classes**

### **🎯 **Layout Utilities**
```css
/* Display */
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }

/* Flexbox */
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-initial { flex: 0 1 auto; }

/* Position */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Z-Index */
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-30 { z-index: 30; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }
```

### **🎨 **Color Utilities**
```css
/* Background Colors */
.bg-white { background-color: var(--white); }
.bg-gray-50 { background-color: var(--gray-50); }
.bg-gray-100 { background-color: var(--gray-100); }
.bg-brand-primary { background-color: var(--brand-primary); }
.bg-brand-primary-light { background-color: var(--brand-primary-light); }

/* Text Colors */
.text-white { color: var(--white); }
.text-gray-500 { color: var(--gray-500); }
.text-gray-700 { color: var(--gray-700); }
.text-brand-primary { color: var(--brand-primary); }
.text-brand-primary-dark { color: var(--brand-primary-dark); }
```

### **📏 **Typography Utilities**
```css
/* Font Weights */
.font-light { font-weight: var(--font-light); }
.font-normal { font-weight: var(--font-normal); }
.font-medium { font-weight: var(--font-medium); }
.font-semibold { font-weight: var(--font-semibold); }
.font-bold { font-weight: var(--font-bold); }

/* Text Alignment */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Text Transform */
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }
```

---

## 🎨 **Component Examples**

### **📋 **Button Examples**
```typescript
// Primary Button
<button className="btn btn-primary btn-lg">
  Generate Scene
</button>

// Secondary Button
<button className="btn btn-secondary">
  Cancel
</button>

// Outline Button
<button className="btn btn-outline">
  Edit Style
</button>

// Ghost Button
<button className="btn btn-ghost">
  Delete
</button>
```

### **🎨 **Card Examples**
```typescript
// Standard Card
<div className="card card-padding">
  <div className="card-header">
    <h3 className="text-h3">Scene Title</h3>
  </div>
  <div className="card-body">
    <p className="text-body">Scene description...</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary btn-sm">Save</button>
    <button className="btn btn-secondary btn-sm">Cancel</button>
  </div>
</div>

// Compact Card
<div className="card card-compact">
  <h4 className="text-h4">Quick Action</h4>
  <p className="text-body-small">Description...</p>
</div>
```

### **📝 **Form Examples**
```typescript
// Input Field
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Scene Title
  </label>
  <input
    type="text"
    className="input"
    placeholder="Enter scene title..."
  />
</div>

// Textarea
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Scene Description
  </label>
  <textarea
    className="input textarea"
    rows={4}
    placeholder="Describe your scene..."
  />
</div>
```

---

## 🎯 **Implementation Strategy**

### **📋 **Phase 1: Foundation (Week 1)**
1. **CSS Variables**: Define all design tokens
2. **Base Styles**: Typography, spacing, colors
3. **Component Base Classes**: Button, card, input foundations
4. **Layout System**: Container, grid, flexbox utilities

### **📋 **Phase 2: Components (Week 2)**
1. **Button System**: All button variants and sizes
2. **Card System**: Different card styles and layouts
3. **Form Elements**: Input, textarea, select styling
4. **Navigation**: Header, sidebar, menu components

### **📋 **Phase 3: Advanced (Week 3)**
1. **Interactive States**: Hover, focus, disabled states
2. **Animations**: Transitions and keyframe animations
3. **Dark Mode**: Complete dark mode support
4. **Responsive**: Mobile-first responsive design

### **📋 **Phase 4: Integration (Week 4)**
1. **Component Migration**: Update existing storyboard components
2. **Testing**: Cross-browser compatibility testing
3. **Optimization**: Performance and accessibility
4. **Documentation**: Component usage guide

---

## 🔧 **Implementation Notes**

### **🎨 **CSS Architecture**
```css
/* CSS Custom Properties */
:root {
  /* Design Tokens */
  --brand-primary: #10B981;
  --text-base: 1rem;
  --space-4: 1rem;
  /* ... */
}

/* Component Classes */
.btn {
  /* Button styles */
}

/* Utility Classes */
.flex {
  display: flex;
}

/* Component Variants */
.btn-primary {
  /* Primary button styles */
}
```

### **📱 **Tailwind CSS Integration**
```css
/* Tailwind CSS Configuration */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDF4',
          500: '#10B981',
          600: '#059669',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    }
  }
}
```

### **🎯 **Component Library**
```typescript
// Button Component Example
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const disabledClasses = disabled ? 'disabled' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## 🚀 **Success Criteria**

### **✅ **Design System Success**
- [ ] All design tokens defined and documented
- [ ] Component library created and tested
- [ ] Responsive design implemented
- [ ] Dark mode support added
- [ ] Accessibility standards met

### **✅ **Implementation Success**
- [ ] All storyboard components updated
- [ ] Consistent UI across application
- [ ] Performance optimized
- [ ] Cross-browser compatible
- [ ] Mobile responsive

### **✅ **User Experience Success**
- [ ] Intuitive and easy to use
- **Fast and efficient interactions**
- **Visual hierarchy is clear**
- **Consistent branding**
- **Accessible to all users**

---

**This style guide provides a comprehensive design system for Storyboard Studio, focusing on modern, simple, and efficient UI/UX principles. The system includes all necessary design tokens, component styles, and implementation guidance to ensure consistency across the entire application.**

---

## 🎨 **Dark Theme (LTX Studio Style)**

### **🌑 **Core Principles**
- **Sleek & Modern**: Dark-themed UI with a focus on typography and spacing.
- **Efficient**: Minimalist design to reduce cognitive load and improve focus.
- **Professional**: High-contrast, clean aesthetic suitable for creative professionals.

### **🎨 **Dark Theme Color Palette**
```css
/* Backgrounds */
--bg-dark-primary: #1A1A1A;      /* Main background */
--bg-dark-secondary: #2C2C2C;    /* Card and panel backgrounds */
--bg-dark-tertiary: #3D3D3D;     /* Hover states, borders */

/* Text */
--text-dark-primary: #FFFFFF;       /* Primary text */
--text-dark-secondary: #A0A0A0;     /* Secondary text, labels */
--text-dark-tertiary: #6E6E6E;      /* Tertiary text, placeholders */

/* Accents */
--accent-blue: #4A90E2;         /* Primary buttons, highlights */
--accent-blue-dark: #357ABD;      /* Button hover states */

/* Borders */
--border-dark: #3D3D3D;
```

### **🔘 **Component Styles (Dark Theme)**

#### **Modals & Panels**
- **Background**: `var(--bg-dark-secondary)`
- **Border Radius**: `0.75rem` (12px)
- **Border**: `1px solid var(--border-dark)`
- **Header**: Bold white text, separated by a subtle border.

#### **Buttons**
- **Primary**: 
  - Background: `var(--accent-blue)`
  - Text: `var(--text-dark-primary)`
  - Hover: `var(--accent-blue-dark)`
- **Secondary/Cancel**: 
  - Background: `transparent` or `var(--bg-dark-tertiary)`
  - Text: `var(--text-dark-secondary)`
  - Border: `1px solid var(--border-dark)`

#### **Input Fields**
- **Background**: `var(--bg-dark-primary)`
- **Border**: `1px solid var(--border-dark)`
- **Text**: `var(--text-dark-primary)`
- **Placeholder**: `var(--text-dark-tertiary)`
- **Focus**: Blue ring or border (`var(--accent-blue)`) 

#### **Dropdowns & Popovers**
- **Background**: `var(--bg-dark-secondary)`
- **Separators**: `1px solid var(--border-dark)`
- **Selected Item**: Blue background or text color (`var(--accent-blue)`)