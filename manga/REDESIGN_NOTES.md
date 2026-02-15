# Manga Studio Ultimate - Major Redesign Notes

## User Feedback Summary (from images)

### 1. Universe Manager Consolidation
**Current:** Universe Manager has 3 tabs (Rules, Locations, Character Database)
**Needed:** Add 3 more tabs:
- **Story Structure** (pic2) - Move from main navigation
- **Scenes** - Asset management for scenes
- **Props & Tools** - Asset management for props/tools

**Character Creator** should open when clicking "Add Character" in Character Database tab

### 2. Fix Broken Modals
- **Manage Arc Tags** button exists but modal doesn't show (pic4)
- **Manage Sections** button exists but modal doesn't show (pic4)

### 3. Main Navigation Simplification
**Current:** 4 items (Manga Editor, Episodes, Story Structure, Universe Manager)
**New:** 3 items only
- Manga Editor
- Episodes  
- Universe Manager (contains Story Structure now)

### 4. Manga Editor Redesign (MAJOR CHANGE)
**Current:** Popup modals for everything
**Needed:** Show Episode→Page→Panel hierarchy directly in editor (like pic6)
- Left panel: Episode/Page selector
- Center: Canvas with panels
- Right panel: Panel properties
- User can add/edit/delete episodes, pages, panels directly without popups

### 5. Settings Modal Enhancement
**Current:** Empty settings modal
**Needed:** (pic7, pic8)
- AI Model Settings (Model dropdown, Style Preset, Quality)
- Consistency toggles (Character, Asset, Style Transfer)
- Batch Generation (panels count, time estimate, credits)
- Export options (PDF, PNG, CBZ)
- Credits display

### 6. Panel Generator Enhancement
**Current:** Has asset sidebar
**Needed:** "Add Character" button should open Character Creator modal to add new characters to system

## Implementation Priority
1. ✅ Add Story Structure, Scenes, Props tabs to Universe Manager
2. ✅ Remove Story Structure from main navigation
3. ⏳ Add Manage Arc Tags modal HTML
4. ⏳ Add Manage Sections modal HTML  
5. ⏳ Redesign Settings modal with all features
6. ⏳ (Optional) Redesign Manga Editor layout

## Notes
- Keep all existing features
- Maintain glassmorphism design
- Ensure beginner-friendly workflow
