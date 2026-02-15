# Manga Studio Ultimate - Complete Specification

## Design Philosophy
- **Professional & Simple**: Clean, intuitive interface for manga creators
- **Gray Canvas**: Easier on the eyes (like webtoon-studio.html)
- **Wide Layout**: 3-column layout (like webtoon-studio-pro.html) for better visibility
- **Complete Workflow**: Story → Episode → Page → Panel → Layer
- **Flexible Tagging**: Arc tags applied to episodes for easy organization

## Core Workflow

### Hierarchy Structure
```
Story (Multiple)
  └─ Episodes (Multiple) [Tagged with Arcs]
      └─ Pages (Multiple)
          └─ Panels (Multiple)
              └─ Layers (Multiple)
                  └─ Asset References
                      ├─ Characters
                      ├─ Scenes/Backgrounds
                      ├─ Props
                      ├─ Tools
                      ├─ Outfits
                      └─ Transport
```

### Key Concepts
- **Story**: Top-level project (e.g., "Basketball Dreams")
- **Episode**: Individual chapters or story beats (tagged with arcs)
- **Page**: Single manga page with multiple panels
- **Panel**: Individual frame/box in the manga page
- **Layer**: Composition layers within a panel (background, characters, effects, dialogue)
- **Scene**: An asset type (backgrounds/environments), NOT a workflow level
- **Arc**: Tags applied to episodes (e.g., "Training Arc", "Tournament Arc")

## Main Navigation Menu

1. **Manga Editor** - Main canvas with panel-based page creation
2. **Episodes** - Episode management with arc tags and page thumbnails
3. **Storyboard** - Shot list with properties panel (like pic3, pic8)
4. **Story Structure** - Hierarchical view with arc organization (like pic4)
5. **Universe Manager** - World-building hub (Rules, Locations, Character Database)
6. **Asset Library** - Comprehensive asset management (6 categories)
7. **Layout Templates** - Panel layout templates (like pic5)
8. **Settings** - Project settings (like pic6)

## UI Layout

### 3-Column Layout (Wide like webtoon-studio-pro)
```
┌─────────────┬──────────────────────┬─────────────┐
│   Left      │    Main Canvas       │   Right     │
│   Menu      │    (Gray BG)         │  Properties │
│   (150px)   │    (Flexible)        │   (280px)   │
└─────────────┴──────────────────────┴─────────────┘
```

## Universe Manager (World-Building Hub)

Centralized reference area for all world-building elements.

### 1. Rules System
**Purpose**: Define the laws and systems of your manga world

**Key Components**:
- **Power Systems**: Magic systems, abilities, special powers
- **Technologies**: Tech level, inventions, gadgets
- **Laws of Nature**: Physics rules, supernatural elements
- **Social Systems**: Governments, organizations, hierarchies

**UI Features**:
- Searchable rule database
- Category tags (Magic, Tech, Social, Physical)
- Reference linking to characters/locations
- Version history for rule changes

### 2. Locations Database
**Purpose**: Catalog all places in your manga world

**Key Components**:
- **Cities/Towns**: Major population centers
- **Landmarks**: Important locations (schools, arenas, hideouts)
- **Regions**: Countries, territories, zones
- **Special Places**: Dungeons, secret bases, mystical locations

**UI Features**:
- Location cards with images
- Map view (optional)
- Connected locations (relationships)
- Character associations (who lives/visits here)
- Tags (Urban, Rural, Mystical, Dangerous)

### 3. Character Database
**Purpose**: Centralized character information and tracking

**Key Components**:
- **Appearance**: Design sheets, color palettes, outfit variations
- **Traits**: Personality, strengths, weaknesses, quirks
- **Relationships**: Connections to other characters (friend, rival, family)
- **Growth Tracker**: Character development across episodes/arcs
- **Stats**: Age, height, abilities, power level
- **History**: Backstory, key moments, character arc notes

**UI Features**:
- Character cards with avatar
- Relationship graph/tree
- Growth timeline (shows character evolution)
- Quick reference panel
- Tags (Main, Support, Villain, Mentor, etc.)
- Episode appearance tracker

---

## Arc Tagging System

**Philosophy**: Arcs are tags applied to episodes, not separate production units. This keeps the workflow simple while maintaining narrative organization.

### Arc Tags
**Examples**:
- Training Arc
- Conflict Arc
- Tournament Arc
- Climax Arc
- Resolution Arc
- Character Development Arc
- Mystery Arc

**Features**:
- Multiple arcs can be applied to one episode
- Color-coded arc badges
- Arc timeline view (shows which episodes belong to which arcs)
- Arc progress tracker
- Arc summary/goals

### Arc Timeline View
**Purpose**: Visualize how arcs unfold across episodes

**Features**:
- Horizontal timeline showing episodes
- Arc bands showing which episodes belong to each arc
- Key moments markers
- Character growth indicators
- Filter episodes by arc

---

## Key Features

### 1. Story Manager Modal (pic2, pic4)
- Multi-story cards with stats (Episodes, Pages, Characters)
- Status badges (Active, Draft, Planning)
- Genre tags
- Create new story button

### 2. Episode Management
**Core Unit**: Each episode is a chapter or major story beat

**Episode Card Contains**:
- **Title**: Episode/chapter name
- **Arc Tags**: Visual badges showing which arcs this episode belongs to
- **Summary**: Brief plot description
- **Stats**: Page count, Panel count, Character count
- **Status**: Draft, In Progress, Complete, Published
- **Key Moments**: Major plot beats in this episode
- **Characters**: List of characters appearing
- **Page Thumbnails**: Visual preview grid

**Features**:
- Filter episodes by arc tag
- Sort by status, date, arc
- Bulk arc tagging
- Episode timeline view

### 3. Storyboard View (pic3, pic8)
**Left Panel**: Shot List
- Shot cards with thumbnails
- Duration display
- Split shot button

**Center**: Storyboard Frame
- Large preview area
- Camera angle selector
- Duration input

**Right Panel**: Shot Properties
- Camera Movement dropdown
- Composition dropdown
- Lighting dropdown

### 4. Story Structure Modal (pic4)
**Hierarchical View**: Story → Episodes (grouped by arcs) → Pages → Panels

**Features**:
- **Arc Groups**: Episodes grouped by arc tags (expandable/collapsible)
- **Episode Cards**: Nested under arc groups
- **Stats Display**: Page count, Panel count per episode
- **Color-Coded**: Each arc has a unique color
- **Quick Actions**: Add Episode, Edit Arc, View Timeline
- **Drag & Drop**: Reorder episodes within arcs

**Example Structure**:
```
📖 Basketball Dreams
  🏷️ Training Arc (Episodes 1-3)
    📄 Episode 1: First Day (12 pages, 48 panels)
    📄 Episode 2: The Challenge (10 pages, 40 panels)
    📄 Episode 3: Breaking Limits (15 pages, 60 panels)
  🏷️ Tournament Arc (Episodes 4-8)
    📄 Episode 4: Qualifiers Begin (14 pages, 56 panels)
    ...
```

### 5. Layout Templates Modal (pic5)
- Template preview cards
- Standard Vertical (3-panel)
- Hero Panel (large + small)
- Full Screen (single panel)
- Custom layouts

### 6. Project Settings Modal (pic6)
**Canvas Settings**
- Canvas Width (default: 800)
- Panel Height (default: 400)

**AI Generation**
- Model selection dropdown
- Default Style dropdown

**Export Settings**
- Export Format dropdown
- Mobile Optimization toggle

### 7. Asset Library
**Categories**:
- Characters
- Scenes/Backgrounds
- Props
- Tools
- Outfits
- Transport

**Features**:
- Tag system (Main, Support, Villain, etc.)
- Favorites (star icon)
- Filters (by tag, favorites, recent)
- Search functionality

### 8. Add Character Modal (pic7)
**Three Options**:
1. **From Library** - Select existing character
2. **AI Generate** - Opens AI generation form
3. **Manual Create** - Opens character creation form

### 9. AI Generation System
**For Each Asset Type**:
- Text prompt input (large textarea)
- Reference image upload
- Style selection
- Quality settings
- Generate button

**Asset Types**:
- Character
- Scene/Background
- Panel
- Page
- Props
- Tools
- Outfits
- Transport

### 10. Panel-Based Page Editor
**Correct Workflow**: Page → Panel → Layer

**Each Panel Card Contains**:
- **Panel Number**: Position in page sequence
- **Description**: What happens in this panel
- **Layer Management**: Background, Characters, Props, Effects, Dialogue
- **Asset References**:
  - Character selector (multi-select from Character Database)
  - Scene/Background selector (from Asset Library)
  - Props selector (multi-select)
  - Tools selector (multi-select)
  - Outfits selector (multi-select)
  - Transport selector (multi-select)
- **Visual Style**: Notes on composition, camera angle, mood
- **Dialogue/SFX**: Text content for this panel
- **AI Generate Button**: Uses all references + prompt to generate panel

**Layer System**:
1. **Background Layer**: Scene/environment asset
2. **Character Layers**: One or more characters with outfits
3. **Prop Layers**: Objects, tools, transport
4. **Effect Layers**: Speed lines, impact effects, lighting
5. **Dialogue Layer**: Speech bubbles, narration, SFX

**Features**:
- Layer visibility toggle
- Layer reordering (drag & drop)
- Layer locking
- Quick asset swap
- Reference image upload per layer

## Color Scheme
- Background: `#0f0f14` (dark)
- Canvas: `#374151` (gray - easier on eyes)
- Accent: Purple/Pink gradient
- Glass effects with backdrop blur

## Typography
- Font: Inter
- Headers: Bold, 18-24px
- Body: Regular, 14px
- Labels: Medium, 12px

## Modals
All modals should be functional with proper forms:
1. Story Manager
2. Story Structure
3. Asset Library
4. Add Character (with form)
5. New Episode
6. Layout Templates
7. Project Settings
8. AI Generate (with prompt + reference upload)
9. Storyboard

## Complete Workflow Example

### Creating a Manga Page

1. **Select Story**: "Basketball Dreams"
2. **Select Episode**: "Episode 1: First Day" (Tagged: Training Arc)
3. **Create Page**: Page 1
4. **Add Panels**: 6 panels for this page
5. **For Each Panel**:
   - Write description: "Wide shot of basketball court"
   - Add layers:
     - Background: Select "Basketball Court" scene from Asset Library
     - Character: Add "Kaito" from Character Database
     - Props: Add "Basketball" from Asset Library
     - Effects: Add "Sunlight rays" effect
     - Dialogue: Add speech bubble "This is where it begins..."
   - Set visual style: "Wide shot, low angle, dramatic lighting"
   - Click AI Generate (uses all references + prompt)
6. **Review & Export**: Check page layout, export to PNG

---

## Implementation Notes
- **Correct Hierarchy**: Story → Episode → Page → Panel → Layer (NOT Scene)
- **Scene = Asset**: Scenes are backgrounds/environments in Asset Library
- **Arc Tags**: Applied to episodes for flexible organization
- **Universe Manager**: Separate section for world-building (Rules, Locations, Character Database)
- Gray canvas background (#374151) instead of white
- Wider 3-column layout for better workspace
- All modals fully functional with forms
- Asset library with 6 categories (Characters, Scenes, Props, Tools, Outfits, Transport)
- Panel-based workflow with layer system
- AI generation with prompts AND reference images
- Character Database with growth tracking and relationships
- Professional, clean, simple to use

---

## Technical Requirements

### Data Structure
```javascript
Story {
  id, title, description, genre, status,
  episodes: [Episode]
}

Episode {
  id, title, summary, arcTags: [string],
  status, keyMoments: [string],
  pages: [Page],
  characters: [Character]
}

Page {
  id, pageNumber, summary,
  panels: [Panel]
}

Panel {
  id, panelNumber, description,
  visualStyle, dialogue, sfx,
  layers: [Layer]
}

Layer {
  id, type, order, visible, locked,
  assetReference: Asset
}

Asset {
  id, name, type, category, tags,
  imageUrl, metadata
}

Character (extends Asset) {
  appearance, traits, relationships,
  growthTracker, stats, history
}

Rule {
  id, title, description, category,
  relatedCharacters, relatedLocations
}

Location {
  id, name, description, type, tags,
  imageUrl, connectedLocations,
  characters: [Character]
}

Arc {
  id, name, color, description,
  timeline, goals, episodes: [Episode]
}
```
