# Storyboard Studio — Missing Functions Plan

## Brief Description
Based on UI review of project/dashboard (pic1) and storyboard item view (pic2), several core functions are incomplete or missing: top navigation (search, filter, settings), left sidebar organization (usage, favorites, recent, tags, status), and per-item actions (favorite, context menu). This plan outlines what’s missing and how to implement.

---

## Missing Functions

### 1. Top Navigation Bar
#### Search
- **Description**: Global search across projects, frames, and scripts.
- **Features**:
  - Real-time search as you type
  - Search by project name, tags, status, script content
  - Highlight matches in results
  - Search shortcuts (Ctrl+K)
- **Implementation**:
  - Add `searchQuery` state in dashboard
  - Filter projects locally + optional Convex search index
  - UI: Search input with icon and clear button
  - Route: `/api/search/projects` (optional for large datasets)

#### Filter
- **Description**: Filter projects by status, tags, date range, favorite.
- **Features**:
  - Multi-select filters (status, tags)
  - Date range picker (created/updated)
  - Favorite toggle
  - Clear all filters
- **Implementation**:
  - `filters` state object with keys: status[], tags[], dateRange, favorite
  - Apply filters to `projects` array before rendering
  - UI: Dropdown/popover with checkboxes and date inputs
  - Persist filters in URL query params

#### Settings
- **Description**: User preferences and workspace settings.
- **Features**:
  - Theme (light/dark)
  - Default view (grid/table)
  - Export settings
  - Account/profile
- **Implementation**:
  - `settings` table in Convex (userId, theme, defaultView, etc.)
  - Settings modal from top nav cog icon
  - UI: Toggle switches, selects, save/cancel

---

### 2. Left Sidebar Organization
#### Usage Section
- **Description**: Quick access to frequent actions and stats.
- **Features**:
  - Recent projects (last 5)
  - Quick actions: New Project, Import, Templates
  - Storage usage bar
  - Usage stats (projects, frames, generations)
- **Implementation**:
  - Fetch recent projects via Convex query with `limit: 5, order: "desc"`
  - Storage query: sum of R2 file sizes
  - UI: Collapsible section with cards/stats

#### Favorites
- **Description**: Filter to only favorited projects.
- **Features**:
  - Toggle favorite filter
  - Show only favorited projects
  - Count badge
- **Implementation**:
  - Add `showFavorites` boolean state
  - Filter projects: `p => p.favourite === true`
  - UI: Star icon with active state, badge count

#### Recent
- **Description**: Projects sorted by recently updated/created.
- **Features**:
  - Sort by last updated or created
  - Time-based grouping (Today, This Week, Older)
  - Auto-refresh on changes
- **Implementation**:
  - `recentSort` state: "updated" | "created"
  - Sort projects locally
  - UI: List with timestamps, group headers

#### Tags
- **Description**: Browse and filter by project tags.
- **Features**:
  - List of all used tags with counts
  - Click to filter by tag
  - Multi-select tags
  - Tag management (add/remove)
- **Implementation**:
  - Aggregate tags from all projects
  - `selectedTags` state array
  - Filter projects where tags include all selected
  - UI: Tag cloud/pills with counts

#### Status
- **Description**: Filter projects by status (Draft, In Progress, Completed, On Hold).
- **Features**:
  - Status list with counts
  - Click to filter
  - Multi-select
  - Color-coded badges
- **Implementation**:
  - `selectedStatuses` state array
  - Filter projects by status
  - UI: List with colored icons and counts

---

### 3. Storyboard Item View (pic2)
#### Favorite Button
- **Description**: Mark individual storyboard frames as favorites.
- **Features**:
  - Star icon on each frame
  - Toggle favorite state
  - Filter by favorites
  - Persist to Convex
- **Implementation**:
  - Add `isFavorite` to `storyboard_items` schema
  - Mutation: `storyboard.items.updateFavorite`
  - UI: Star button in FrameCard overlay
  - Filter: `showOnlyFavorites` toggle

#### Left Sidebar (Item Level)
- **Description**: Per-project navigation and organization.
- **Features**:
  - Scene list/outline
  - Tag filter for frames
  - Status filter for frames
  - Frame thumbnails
  - Jump to scene/frame
- **Implementation**:
  - Query frames for current project
  - Group by scene if `sceneId` exists
  - `selectedTags`/`selectedStatuses` for frames
  - UI: Collapsible tree/list

---

## Simplified & Safe Implementation Plan

### Critical Path (Minimal Viable)
1. **Top Nav Search** – Local filtering only (no new API)
2. **Top Nav Filters** – Status + Favorites (skip date range for now)
3. **Left Sidebar Favorites** – Simple boolean filter
4. **Frame Favorite Button** – Add to existing schema (no new table)

### Optional/Later
- Settings modal (store in localStorage first)
- Usage stats (compute client-side)
- Recent projects (sort locally)
- Tags/Status sidebars (reuse existing tag system)
- Date range picker
- Search index table

---

## Safe Schema Additions

```ts
// storyboard_items ONLY
isFavorite: v.optional(v.boolean()), // per-frame favorite

// EXISTING users table - ADD ONLY these fields (don't recreate)
// Add to existing users table:
settings: v.optional(v.object({
  theme: v.string(),
  defaultView: v.string(),
  exportFormat: v.string(),
  favoriteFilters: v.array(v.string()),
  recentSearches: v.array(v.string()),
})),
```

---

## New API Routes

```ts
// /api/search/projects
// Full-text search with ranking

// /api/usage/stats
// Storage, project count, generation count

// /api/settings
// GET/PUT user settings
```

---

## Reduced Component List (Critical Only)

- `TopNavSearch.tsx` – search input
- `TopNavFilters.tsx` – status + favorite filter
- `SidebarFavorites.tsx` – favorite filter
- `FrameFavoriteButton.tsx` – per-frame star

// SKIP for now: SettingsModal, SidebarUsage, SidebarRecent, SidebarTags, SidebarStatus, ProjectSidebar, UsageStats, DateRangePicker

---

## Implementation Order

### Phase 1 (Core Navigation)
1. Top Nav Search
2. Top Nav Filters
3. Left Sidebar Favorites
4. Left Sidebar Recent

### Phase 2 (Organization)
5. Left Sidebar Tags
6. Left Sidebar Status
7. Settings Modal
8. Usage Stats

### Phase 3 (Item Level)
9. Frame Favorite Button
10. Project Sidebar (scene/frame navigation)

---

## Technical Notes

- Use URL query params for filter persistence (`?status=draft&favorite=true`)
- Debounce search input (300ms)
- Cache tag/status counts to avoid recompute
- Use React Query for server state (settings, usage)
- Implement keyboard shortcuts (Ctrl+K for search)
- Add loading skeletons for async filters

---

## Success Metrics
- Search latency: < 200ms
- Filter application: < 100ms
- Settings persistence: immediate
- Favorite toggle: < 50ms
- Sidebar navigation: smooth expand/collapse

---

## Next Steps
1. Wire up search input with local filtering
2. Implement filter popover with checkboxes
3. Add favorite toggle to frames (schema + UI)
4. Create sidebar sections one by one
5. Add URL persistence for filters
6. Build settings modal and API