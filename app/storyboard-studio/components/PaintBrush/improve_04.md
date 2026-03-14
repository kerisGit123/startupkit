# FrameCard Status Management & Notes (Safe Implementation)

## Overview
Enhance framecard/storyboard items with simple status management and frame notes functionality. This provides essential organizational features without breaking existing code or requiring complex schema changes.

## Current State
- Framecards have basic display and interaction capabilities
- Status is only available at the project level  
- Limited visual feedback for frame states
- No notes or annotations for individual frames
- No frame-specific filtering options

## Target State
- Simple frame status management (Draft, In Progress, Completed)
- Frame notes for annotations and comments
- Enhanced visual feedback with minimal UI changes
- Better organization with simple filtering
- Zero breaking changes to existing functionality

---

## Features

### 1. Simple Frame Status Management
- **Basic Status**: Each frame can have simple status (Draft, In Progress, Completed)
- **Quick Status Change**: Simple dropdown or badge click to change status
- **Visual Indicators**: Color-coded status badges on framecards
- **Status Filtering**: Filter frames by status in existing filter system

### 2. Frame Notes & Annotations
- **Simple Notes**: Add notes/comments to individual frames
- **Notes Indicator**: Visual indicator when frame has notes
- **Quick Access**: Click to view/edit notes
- **Searchable**: Notes included in search functionality

### 3. Enhanced Visual Feedback
- **Status Badges**: Simple color-coded status indicators
- **Notes Indicator**: Small icon when notes exist
- **Clean Design**: Maintain existing framecard aesthetic

### 4. Display Filters (LTX-Style)
- **Toggle Visibility**: Show/hide tags, subtitles, script, notes
- **Reset Button**: Restore default display settings
- **Clean Interface**: Simple checkbox-based controls

---

## Implementation Details

### 1. Safe Schema Changes (Additive Only)

#### Enhanced Frame Interface
```typescript
interface Frame {
  _id: Id<"storyboard_items">;
  // ... ALL EXISTING FIELDS (don't modify)
  
  // NEW FIELDS ONLY (additive)
  frameStatus?: 'draft' | 'in-progress' | 'completed'; // Optional, won't break existing
  notes?: string; // Optional, won't break existing
}
```

#### Safe Convex Schema Updates
```typescript
// convex/schema.ts - ADDITIVE CHANGES ONLY
storyboard_items: defineTable({
  // ... ALL EXISTING FIELDS (don't modify)
  
  // NEW FIELDS ONLY
  frameStatus: v.optional(v.string()), // Add this field only
  notes: v.optional(v.string()),       // Add this field only
})
```

### 2. Simple Status Configuration
```typescript
const FRAME_STATUS_CONFIG = {
  'draft': {
    label: 'Draft',
    color: 'bg-gray-500',
    description: 'Initial frame'
  },
  'in-progress': {
    label: 'In Progress', 
    color: 'bg-blue-500',
    description: 'Working on it'
  },
  'completed': {
    label: 'Completed',
    color: 'bg-green-500', 
    description: 'Frame is done'
  }
};
```

### 3. Enhanced FrameCard Component

#### Safe Props Extension
```typescript
interface FrameCardProps {
  // ... ALL EXISTING PROPS (don't modify)
  
  // NEW PROPS ONLY (optional)
  onStatusChange?: (status: 'draft' | 'in-progress' | 'completed') => void;
  onNotesChange?: (notes: string) => void;
}
```

#### Simple Status Badge
```typescript
function FrameCard({ item, onStatusChange, onNotesChange, ...props }: FrameCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  const statusConfig = item.frameStatus ? FRAME_STATUS_CONFIG[item.frameStatus] : null;
  
  return (
    <div className="relative group">
      {/* Frame Content */}
      <div className="relative aspect-[{frameRatio}] bg-[#0a0a0f] rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all">
        {/* Status Badge - NEW */}
        {statusConfig && (
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color} hover:opacity-80 transition`}
            >
              {statusConfig.label}
            </button>
          </div>
        )}
        
        {/* Notes Indicator - NEW */}
        {item.notes && (
          <div className="absolute bottom-2 left-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </div>
        )}
        
        {/* Existing frame content */}
        {/* ... existing frame rendering code */}
      </div>
      
      {/* Status Dropdown - NEW */}
      {showStatusMenu && (
        <div className="absolute top-12 left-2 z-20 bg-[#1c1c26] border border-white/10 rounded-lg shadow-xl p-2 min-w-[120px]">
          {Object.entries(FRAME_STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onStatusChange?.(key as any);
                setShowStatusMenu(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition hover:bg-white/5 text-gray-300 hover:text-white ${
                item.frameStatus === key ? 'bg-white/10 text-white' : ''
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              {config.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Notes Modal - NEW */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/8">
              <h3 className="text-sm font-bold text-white">Frame Notes</h3>
              <button onClick={() => setShowNotesModal(false)} className="p-1 hover:bg-white/8 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={item.notes || ''}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add notes about this frame..."
                className="w-full h-32 bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60 resize-none"
              />
            </div>
            <div className="flex items-center justify-end p-4 border-t border-white/8">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs text-white rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Existing frame actions */}
      {/* ... existing frame action buttons */}
    </div>
  );
}
```

### 4. Display Filters Component

#### Simple Display Filters
```typescript
function DisplayFilters({ displayOptions, onChange }: {
  displayOptions: {
    showTags: boolean;
    showSubtitles: boolean;
    showScript: boolean;
    showNotes: boolean;
  };
  onChange: (options: typeof displayOptions) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/6 rounded-lg">
      <span className="text-xs text-gray-400 mr-2">Display:</span>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showTags}
          onChange={(e) => onChange({ ...displayOptions, showTags: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Tags</span>
      </label>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showSubtitles}
          onChange={(e) => onChange({ ...displayOptions, showSubtitles: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Subtitles</span>
      </label>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showScript}
          onChange={(e) => onChange({ ...displayOptions, showScript: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Script</span>
      </label>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showNotes}
          onChange={(e) => onChange({ ...displayOptions, showNotes: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Notes</span>
      </label>
      
      <button
        onClick={() => onChange({
          showTags: true,
          showSubtitles: true,
          showScript: true,
          showNotes: true
        })}
        className="text-xs text-purple-400 hover:text-purple-300 ml-2"
      >
        Reset
      </button>
    </div>
  );
}
```

---

## Backend Functions (Safe)

### 1. Simple Convex Mutations

#### Status Update
```typescript
// convex/storyboard/storyboardItems.ts

export const updateFrameStatus = mutation({
  args: {
    id: v.id("storyboard_items"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, status } = args;
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['draft', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
    }
    
    await ctx.db.patch(id, {
      frameStatus: status,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});
```

#### Notes Update
```typescript
export const updateFrameNotes = mutation({
  args: {
    id: v.id("storyboard_items"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, notes } = args;
    
    await ctx.db.patch(id, {
      notes,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});
```

---

## Enhanced Filtering (Safe)

### 1. Updated Filter State
```typescript
const [filters, setFilters] = useState({
  status: [] as string[],
  favorite: false,
  frameStatus: [] as ('draft' | 'in-progress' | 'completed')[], // NEW
  hasNotes: false, // NEW
});

// Enhanced filter logic
const filteredItems = useMemo(() => {
  let filtered = items || [];

  // Existing filters...
  
  // NEW frame status filter
  if (filters.frameStatus.length > 0) {
    filtered = filtered.filter(item => 
      item.frameStatus && filters.frameStatus.includes(item.frameStatus)
    );
  }

  // NEW notes filter
  if (filters.hasNotes) {
    filtered = filtered.filter(item => item.notes && item.notes.trim().length > 0);
  }

  return filtered;
}, [items, searchQuery, filters]);
```

---

## User Experience Flow

### 1. Simple Status Management
- User clicks status badge on framecard (if exists)
- Simple dropdown with 3 status options
- Frame updates immediately
- Visual feedback with color change

### 2. Frame Notes
- User clicks notes icon on framecard (if notes exist) or notes button
- Simple modal with textarea opens
- User adds/edits notes
- Notes indicator appears on framecard

### 3. Display Filters
- User can toggle visibility of different frame elements
- Options: Tags, Subtitles, Script, Notes
- "Reset" button restores default display settings

### 4. Enhanced Filtering
- User opens filter panel
- New filters: Frame Status, Has Notes
- Results update in real-time

---

## Implementation Phases

### Phase 1: Core Status & Notes (Week 1)
- Add optional schema fields
- Simple status badge on framecards
- Status dropdown menu
- Notes modal and functionality

### Phase 2: Enhanced Filtering (Week 2)
- Update filter state and logic
- New filter options in TopNavFilters
- Integration with existing search
- Display filters component

---

## Safety Analysis

### ✅ SAFE IMPLEMENTATION
- **Additive Schema Changes**: Only new optional fields
- **Optional Props**: All new props are optional
- **Backward Compatible**: Existing frames work without new fields
- **No Breaking Changes**: Existing functionality preserved

### ✅ MINIMAL RISK
- **Simple UI Changes**: Minor additions to existing components
- **Optional Features**: Status and notes are optional
- **Graceful Degradation**: Works without new features

### ✅ EASY ROLLBACK
- **Feature Flags**: Can be disabled if needed
- **Schema Migration**: Simple field additions
- **Component Isolation**: Changes are contained

---

## Success Metrics

### 1. Usage Analytics
- Status change frequency
- Notes usage statistics
- Filter usage patterns

### 2. Performance Metrics
- Frame rendering performance
- Filter response time
- Notes modal performance

### 3. User Satisfaction
- Improved organization capabilities
- Better frame management
- Simplified workflow

---

## Conclusion

This simplified enhancement provides essential framecard functionality with zero breaking changes. By focusing on additive changes only (optional fields, optional props), we can significantly improve the user experience while maintaining code safety and backward compatibility.

The approach prioritizes simplicity and safety over complex features, ensuring the enhancement is maintainable and won't disrupt existing functionality.