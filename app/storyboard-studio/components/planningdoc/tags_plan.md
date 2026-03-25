# Storyboard Tags Implementation Plan

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