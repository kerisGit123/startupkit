# FrameCard Status Management & Enhancements (Simplified)

## Overview
Enhance framecard/storyboard items with simple status management and frame-specific elements, following the existing patterns used in the ElementLibrary. This provides essential functionality without overcomplicating the implementation.

## Current State
- Framecards have basic display and interaction capabilities
- Status is only available at the project level
- Limited visual feedback for frame states
- No frame-specific elements (characters, props, logos) assignment
- No notes or annotations for individual frames

## Target State
- Simple frame status management (Draft, In Progress, Completed)
- Frame-specific elements assignment (reuse existing ElementLibrary pattern)
- Frame notes for annotations and comments
- Enhanced visual feedback without complex features
- Better organization with simple filtering

---

## Features

### 1. Simple Frame Status Management
- **Basic Status**: Each frame can have simple status (Draft, In Progress, Completed)
- **Quick Status Change**: Simple dropdown or badge click to change status
- **Visual Indicators**: Color-coded status badges on framecards
- **Status Filtering**: Filter frames by status in existing filter system

### 2. Frame-Specific Elements (LTX-Style Reference System)
- **Element Creation**: Create character/prop/logo reference images (like LTX Elements)
- **@Mention System**: Type "@" in dialogue/description to add elements as references
- **Direct Tag Integration**: Elements can be tagged directly in generation prompts
- **Visual Reference Display**: Selected elements show as photo references during AI generation
- **Consistent Generation**: Elements ensure consistent characters/props across frames
- **Element Filtering**: Filter frames by assigned elements

### 3. Frame Notes & Annotations
- **Simple Notes**: Add notes/comments to individual frames
- **Notes Indicator**: Visual indicator when frame has notes
- **Quick Access**: Click to view/edit notes
- **Searchable**: Notes included in search functionality

### 4. Enhanced Visual Feedback & Display Options
- **Status Badges**: Simple color-coded status indicators
- **Element Icons**: Show assigned elements with small icons
- **Notes Indicator**: Small icon when notes exist
- **Display Filters**: Toggle visibility of tags, subtitles, script, notes (like LTX)
- **Clean Design**: Maintain existing framecard aesthetic

---

## Implementation Details

### 1. Simplified Data Structure

#### Enhanced Frame Interface
```typescript
interface Frame {
  _id: Id<"storyboard_items">;
  projectId: Id<"storyboard_projects">;
  title: string;
  description?: string;
  dialogue?: string;
  
  // Simple status management
  status: 'draft' | 'in-progress' | 'completed';
  
  // Frame-specific elements
  assignedElements: Array<{
    elementId: Id<"storyboard_elements">;
    elementType: 'character' | 'object' | 'logo';
    elementName: string;
    thumbnailUrl: string;
  }>;
  
  // Frame notes
  notes?: string;
  
  // Existing properties
  tags: Array<{ id: string; name: string; color: string }>;
  imageUrl?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFavorite: boolean;
  createdAt: Date;
  modifiedAt: Date;
  generatedBy: string;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  generationProgress?: number;
  generationError?: string;
}
```

#### Simple Status Configuration
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

### 2. Enhanced FrameCard Component

#### Simple Status & Elements Integration
```typescript
interface FrameCardProps {
  item: Frame;
  index: number;
  frameRatio: string;
  selected: boolean;
  projectId: string;
  onSelect: () => void;
  onDelete: () => void;
  onImageUploaded: (id: string, url: string) => void;
  onDoubleClick: () => void;
  onDuplicate: () => void;
  onTagsChange: (tags: Array<{ id: string; name: string; color: string }>) => void;
  onFavoriteToggle: () => void;
  // New simple props
  onStatusChange: (status: 'draft' | 'in-progress' | 'completed') => void;
  onElementsChange: (elements: Array<{ elementId: Id<"storyboard_elements">; elementType: string; elementName: string; thumbnailUrl: string }>) => void;
  onNotesChange: (notes: string) => void;
}

function FrameCard({ item, onStatusChange, onElementsChange, onNotesChange, ...props }: FrameCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showElementPicker, setShowElementPicker] = useState(false);
  
  const statusConfig = FRAME_STATUS_CONFIG[item.status];
  
  return (
    <div className="relative group">
      {/* Frame Content */}
      <div className="relative aspect-[{frameRatio}] bg-[#0a0a0f] rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all">
        {/* Status Badge */}
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color} hover:opacity-80 transition`}
          >
            {statusConfig.label}
          </button>
        </div>
        
        {/* Assigned Elements */}
        {item.assignedElements && item.assignedElements.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            {item.assignedElements.slice(0, 3).map((element, idx) => (
              <div
                key={element.elementId}
                className="w-6 h-6 rounded-full overflow-hidden border-2 transition ${
                  item.assignedElements.includes(element) 
                    ? 'border-purple-500 bg-purple-500/20' 
                    : 'border-white/8 hover:border-white/20 bg-[#12121a]'
                }"
              >
                <img src={element.thumbnailUrl} alt={element.elementName} className="w-full h-full object-cover" />
              </div>
            ))}
            {item.assignedElements.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-[8px] text-white font-medium truncate">{item.assignedElements.length - 3}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Progress Ring for Generating Frames */}
        {item.generationStatus === 'generating' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="relative w-12 h-12">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-white/20"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - (item.generationProgress || 0) / 100)}`}
                  className="text-blue-400 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-white">
                  {Math.round(item.generationProgress || 0)}%
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {item.generationStatus === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-300">Generation Failed</p>
              <p className="text-xs text-red-400 mt-1">{item.generationError}</p>
            </div>
          </div>
        )}
        
        {/* Frame Image/Content */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Notes Indicator */}
        {item.notes && (
          <div className="absolute bottom-2 left-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Frame Actions */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Frame Title */}
          <h3 className="text-sm font-medium text-white truncate">
            {item.title}
          </h3>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => setShowElementPicker(true)}
            className="p-1 rounded hover:bg-white/10 transition"
            title="Assign Elements"
          >
            <Users className="w-3 h-3 text-gray-400" />
          </button>
          <button
            onClick={() => setShowNotesModal(true)}
            className="p-1 rounded hover:bg-white/10 transition"
            title="Add Notes"
          >
            <MessageSquare className="w-3 h-3 text-gray-400" />
          </button>
          <FrameFavoriteButton
            itemId={item._id}
            isFavorite={item.isFavorite}
            onToggle={props.onFavoriteToggle}
          />
        </div>
      </div>
      
      {/* Simple Status Dropdown */}
      {showStatusMenu && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-[#1c1c26] border border-white/10 rounded-lg shadow-xl z-50">
          <div className="p-1">
            {Object.entries(FRAME_STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(status as 'draft' | 'in-progress' | 'completed');
                  setShowStatusMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${
                  item.status === status
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span>{config.label}</span>
                {item.status === status && (
                  <Check className="w-3 h-3 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Element Picker Modal */}
      {showElementPicker && (
        <FrameElementPicker
          projectId={props.projectId}
          currentElements={item.assignedElements || []}
          onElementsChange={(elements) => {
            onElementsChange(elements);
            setShowElementPicker(false);
          }}
          onClose={() => setShowElementPicker(false)}
        />
      )}
      
      {/* Notes Modal */}
      {showNotesModal && (
        <NotesModal
          notes={item.notes || ''}
          onSave={(notes) => {
            onNotesChange(notes);
            setShowNotesModal(false);
          }}
          onClose={() => setShowNotesModal(false)}
        />
      )}
    </div>
  );
}
```

### 3. Frame Element Picker Component

#### Simple Element Assignment
```typescript
interface FrameElementPickerProps {
  projectId: Id<"storyboard_projects">;
  currentElements: Array<{ elementId: Id<"storyboard_elements">; elementType: string; elementName: string; thumbnailUrl: string }>;
  onElementsChange: (elements: Array<{ elementId: Id<"storyboard_elements">; elementType: string; elementName: string; thumbnailUrl: string }>) => void;
  onClose: () => void;
}

function FrameElementPicker({ projectId, currentElements, onElementsChange, onClose }: FrameElementPickerProps) {
  const [activeType, setActiveType] = useState("character");
  
  // Use existing ElementLibrary queries
  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    type: activeType,
  });
  
  const handleToggleElement = (element: any) => {
    const isAssigned = currentElements.some(el => el.elementId === element._id);
    
    if (isAssigned) {
      // Remove element
      onElementsChange(currentElements.filter(el => el.elementId !== element._id));
    } else {
      // Add element
      onElementsChange([...currentElements, {
        elementId: element._id,
        elementType: element.type,
        elementName: element.name,
        thumbnailUrl: element.thumbnailUrl
      }]);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8 shrink-0">
          <h2 className="text-sm font-bold text-white">Assign Elements</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/8 rounded-lg transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Type tabs */}
        <div className="flex gap-1 p-3 border-b border-white/6 shrink-0">
          {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
            <button key={key}
              onClick={() => setActiveType(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                activeType === key ? "bg-white/12 text-white" : "text-gray-400 hover:text-white hover:bg-white/6"
              }`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
            </button>
          ))}
        </div>
        
        {/* Elements grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!elements ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : elements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <User className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No {activeType}s available</p>
              <p className="text-xs text-gray-600 mt-0.5">Create elements in the Element Library first</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {elements.map((el) => {
                const isAssigned = currentElements.some(assigned => assigned.elementId === el._id);
                return (
                  <button
                    key={el._id}
                    onClick={() => handleToggleElement(el)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                      isAssigned 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/8 hover:border-white/20 bg-[#12121a]'
                    }`}
                  >
                    <img src={el.thumbnailUrl} alt={el.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-1">
                      <p className="text-[9px] text-white font-medium truncate">{el.name}</p>
                    </div>
                    {isAssigned && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/8 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {currentElements.length} element{currentElements.length !== 1 ? 's' : ''} assigned
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs text-white rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. Simple Notes Modal

```typescript
interface NotesModalProps {
  notes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

function NotesModal({ notes, onSave, onClose }: NotesModalProps) {
  const [currentNotes, setCurrentNotes] = useState(notes);
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md">
        <div className="p-4 border-b border-white/8">
          <h3 className="text-sm font-bold text-white">Frame Notes</h3>
        </div>
        
        <div className="p-4">
          <textarea
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            placeholder="Add notes about this frame..."
            className="w-full h-32 bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60 resize-none"
          />
        </div>
        
        <div className="p-4 border-t border-white/8 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/8 hover:bg-white/12 text-xs text-gray-300 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(currentNotes)}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs text-white rounded-lg transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. @Mention System & Display Filters

#### @Mention System for Elements
```typescript
// Component for handling @mentions in dialogue/description
function MentionableTextarea({ value, onChange, availableElements }: {
  value: string;
  onChange: (value: string) => void;
  availableElements: Array<{ id: string; name: string; type: string }>;
}) {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      e.preventDefault();
      const textBeforeCursor = value.substring(0, cursorPosition);
      const textAfterCursor = value.substring(cursorPosition);
      
      // Insert @ and show mention menu
      const newValue = textBeforeCursor + '@' + textAfterCursor;
      onChange(newValue);
      setCursorPosition(cursorPosition + 1);
      setShowMentionMenu(true);
      setMentionQuery('');
    }
  };
  
  const handleMentionSelect = (element: any) => {
    const textBeforeAt = value.substring(0, cursorPosition - 1);
    const textAfterCursor = value.substring(cursorPosition);
    const mention = `@${element.name}`;
    
    const newValue = textBeforeAt + mention + textAfterCursor;
    onChange(newValue);
    setCursorPosition(textBeforeAt.length + mention.length);
    setShowMentionMenu(false);
  };
  
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursorPosition(e.target.selectionStart)}
        placeholder="Type @ to add elements as references..."
        className="w-full h-24 bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60 resize-none"
      />
      
      {/* Mention Dropdown */}
      {showMentionMenu && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[#1c1c26] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          <div className="p-2">
            {availableElements
              .filter(el => el.name.toLowerCase().includes(mentionQuery.toLowerCase()))
              .map((element) => (
                <button
                  key={element.id}
                  onClick={() => handleMentionSelect(element)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition hover:bg-white/5 text-gray-300 hover:text-white"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                    <img src={element.thumbnailUrl} alt={element.name} className="w-full h-full object-cover" />
                  </div>
                  <span>{element.name}</span>
                  <span className="text-xs text-gray-500 ml-auto capitalize">{element.type}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Display Filter Component
```typescript
// Component for toggling display options (like LTX)
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

### 6. Enhanced Filtering

#### Updated Filter State
```typescript
const [filters, setFilters] = useState({
  status: [] as string[],
  favorite: false,
  frameStatus: [] as ('draft' | 'in-progress' | 'completed')[], // New: frame status
  hasElements: false, // New: filter frames with assigned elements
  hasNotes: false, // New: filter frames with notes
});

// Enhanced filter logic
const filteredItems = useMemo(() => {
  let filtered = items || [];

  // Existing filters...
  
  // New frame status filter
  if (filters.frameStatus.length > 0) {
    filtered = filtered.filter(item => 
      filters.frameStatus.includes(item.status)
    );
  }

  // New elements filter
  if (filters.hasElements) {
    filtered = filtered.filter(item => 
      item.assignedElements && item.assignedElements.length > 0
    );
  }

  // New notes filter
  if (filters.hasNotes) {
    filtered = filtered.filter(item => item.notes && item.notes.trim().length > 0);
  }

  return filtered;
}, [items, searchQuery, filters]);
```

### 6. Backend Updates

#### Simplified Convex Schema Updates
```typescript
// convex/schema.ts
export default defineSchema({
  // ... existing schema
  
  storyboard_items: defineTable({
    projectId: v.id("storyboard_projects"),
    title: v.string(),
    description: v.optional(v.string()),
    dialogue: v.optional(v.string()),
    
    // Simple status management
    status: v.string(), // 'draft' | 'in-progress' | 'completed'
    
    // Frame notes
    notes: v.optional(v.string()),
    
    // Existing fields
    tags: v.optional(v.array(v.object({ id: v.string(), name: v.string(), color: v.string() }))),
    imageUrl?: string;
    videoUrl?: string;
    duration: number;
    order: number;
    isFavorite: boolean;
    createdAt: Date;
    modifiedAt: Date;
    generatedBy: string;
    generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
    generationProgress?: number;
    generationError?: string;
  })
    .index("projectId")
    .index("status"),
});

// New table for frame-element relationships
frameElements: defineTable({
  frameId: v.id("storyboard_items"),
  elementId: v.id("storyboard_elements"),
  assignedAt: v.number(),
  assignedBy: v.string(),
})
  .index("frameId")
  .index("elementId"),
});
```

#### Simple Convex Functions
```typescript
// convex/storyboard/storyboardItems.ts

export const updateStatus = mutation({
  args: {
    id: v.id("storyboard_items"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, status } = args;
    
    // Validate status
    const validStatuses = ['draft', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    await ctx.db.patch(id, {
      status,
      modifiedAt: Date.now(),
    });
    
    return id;
  },
});

export const updateNotes = mutation({
  args: {
    id: v.id("storyboard_items"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, notes } = args;
    
    await ctx.db.patch(id, {
      notes,
      modifiedAt: Date.now(),
    });
    
    return id;
  },
});

// Frame element relationships
export const assignElement = mutation({
  args: {
    frameId: v.id("storyboard_items"),
    elementId: v.id("storyboard_elements"),
  },
  handler: async (ctx, args) => {
    const { frameId, elementId } = args;
    
    await ctx.db.insert("frameElements", {
      frameId,
      elementId,
      assignedAt: Date.now(),
      assignedBy: ctx.auth.userId || 'unknown',
    });
    
    return { frameId, elementId };
  },
});

export const removeElement = mutation({
  args: {
    frameId: v.id("storyboard_items"),
    elementId: v.id("storyboard_elements"),
  },
  handler: async (ctx, args) => {
    const { frameId, elementId } = args;
    
    const existing = await ctx.db
      .query("frameElements")
      .withIndex("frameId")
      .eq("frameId", frameId)
      .eq("elementId", elementId)
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    
    return { frameId, elementId };
  },
});
```

---

## User Experience Flow

### 1. Simple Status Management
- User clicks status badge on framecard
- Simple dropdown with 3 status options
- Frame updates immediately
- Visual feedback with color change

### 2. Element Assignment (LTX-Style)
- User clicks elements icon on framecard
- Element picker modal opens (similar to LTX Elements)
- User selects/deselects elements from existing library
- Selected elements show as small icons on framecard
- **@Mention System**: Type "@" in dialogue/description to add elements as references
- **Visual References**: Selected elements appear as photo references during AI generation
- **Consistent Generation**: Elements ensure consistent characters/props across frames

### 3. Frame Notes
- User clicks notes icon on framecard
- Simple modal with textarea opens
- User adds/edits notes
- Notes indicator appears on framecard

### 4. Display Filters (LTX-Style)
- User can toggle visibility of different frame elements
- Options: Tags, Subtitles, Script, Notes
- "Reset" button restores default display settings
- Clean, simple interface like LTX display options

### 5. Enhanced Filtering
- User opens filter panel
- New filters: Frame Status, Has Elements, Has Notes
- Results update in real-time
- Clean, simple interface

---

## Technical Considerations

### 1. Simplicity First
- **No Complex Features**: Avoid bulk operations, complex workflows
- **Reuse Existing**: Leverage ElementLibrary patterns
- **Clean Interface**: Maintain current framecard aesthetic
- **Essential Only**: Focus on core functionality

### 2. Performance
- **Lightweight**: Minimal additional data per frame
- **Efficient Queries**: Simple Convex queries
- **Lazy Loading**: Load element details on demand
- **Optimistic Updates**: Update UI immediately

### 3. Data Migration
- **Simple Schema**: Minimal new fields required
- **Default Values**: Set sensible defaults for existing frames
- **Backward Compatibility**: Handle frames without new fields

---

## Implementation Phases

### Phase 1: Core Status & Notes (Week 1)
- Frame status data structure and backend
- Simple status badge on framecards
- Status dropdown menu
- Notes modal and functionality

### Phase 2: Element Assignment (Week 2)
- Frame-element relationship table
- Element picker component
- Visual indicators on framecards
- Element filtering

### Phase 3: Enhanced Filtering (Week 3)
- Update filter state and logic
- New filter options in TopNavFilters
- Integration with existing search
- Filter performance optimization

---

## Success Metrics

### 1. Usage Analytics
- Status change frequency
- Element assignment usage
- Notes usage statistics
- Filter usage patterns

### 2. Performance Metrics
- Frame rendering performance
- Filter response time
- Element picker performance
- Notes modal performance

### 3. User Satisfaction
- Improved organization capabilities
- Better frame management
- Simplified workflow
- User feedback on new features

---

## Conclusion

This simplified enhancement provides essential framecard functionality without overcomplicating the implementation. By focusing on core features (status, elements, notes) and reusing existing patterns (ElementLibrary), we can significantly improve the user experience while maintaining code simplicity and performance.

The approach prioritizes simplicity and usability over complex features, ensuring the enhancement is maintainable and aligns with the existing design system.