# Storyboard Studio — Improvement Plan

## Brief Description
Current Storyboard Studio provides project management, AI script generation, image/video generation, and frame-level editing. Based on UI analysis and reference platforms (Higgsfield AI, 即梦AI), several gaps and opportunities exist for a more competitive, creator-focused workflow.

---

## Current State Analysis

### What's Already Implemented (95% Complete)
- Project dashboard with card/table views
- AI script generation (GPT-5.2) with scene parsing
- Frame-level storyboard items with CRUD
- Image generation (Kie AI) with batch processing
- Video generation (Kling 3.0 / Veo 3.1) with callbacks
- Tag system for projects and items
- Favourite and duplicate actions
- R2 file storage and browser
- Element library with character/prop management
- Export functionality (PDF + JSON)
- CompanyId-based security system
- Credit logging for all AI operations
- Multi-media support (images + videos + elements)

### Remaining Gaps (Future Enhancements)
- No visual scene continuity between frames
- Script-to-frame mapping is manual (no auto-breakdown)
- Limited camera/shot controls
- No character consistency tools
- No AI-powered shot suggestions
- No storyboard-to-video pipeline
- Limited collaboration features
- No AI moodboard/reference tools

---

## Features to Add

### 1. AI-Powered Scene Continuity
- **Description**: Automatically maintain visual continuity across storyboard frames using AI character/scene consistency.
- **Inspiration**: Higgsfield “Soul ID Character” and “Soul Cinema”.
- **Implementation**:
  - Add `characterId` to storyboard_items schema
  - Integrate character consistency API during image/video generation
  - UI: Character selector in FrameCard sidebar

### 2. Smart Script-to-Shot Mapping
- **Description**: AI parses script and auto-generates storyboard shots with suggested camera angles, pacing, and scene breaks.
- **Inspiration**: 即梦AI “从首帧到尾帧，精准掌控”.
- **Implementation**:
  - Extend `generate-script` route to return shot breakdown
  - Auto-create storyboard_items with sceneId, camera angles, duration
  - UI: “Auto-breakdown” button in script editor

### 3. Camera & Shot Controls
- **Description**: Rich camera controls (pan, zoom, dolly) and shot types (close-up, wide, tracking) directly in storyboard editor.
- **Inspiration**: Higgsfield “AI-powered camera control”.
- **Implementation**:
  - Add `cameraMotion` and `shotType` to storyboard_items
  - Visual timeline with keyframes
  - UI: Camera panel below frame preview

### 4. AI Moodboard & References
- **Description**: AI generates reference images/moodboards from script keywords to guide visual style.
- **Inspiration**: 即梦AI “智能画布” and Higgsfield “Photodump Studio”.
- **Implementation**:
  - Add `moodboardImages` array to projects
  - AI image generation based on script keywords
  - UI: Collapsible moodboard sidebar in workspace

### 5. One-Click Storyboard-to-Video
- **Description**: Convert entire storyboard to video with AI transitions, pacing, and audio sync.
- **Inspiration**: 即梦AI “即梦成片”.
- **Implementation**:
  - New API route `/api/storyboard/render-video`
  - Batch video generation with transitions
  - UI: “Render Video” button in workspace toolbar

### 6. Collaborative Review & Comments
- **Description**: Team members can leave time-stamped comments on frames and approve/reject changes.
- **Inspiration**: Industry storyboard review workflows.
- **Implementation**:
  - Add `reviews` table with frame-level comments
  - Real-time comment overlay on frames
  - UI: Comment badge on FrameCard, modal for review

### 7. Template Library
- **Description**: Pre-built storyboard templates for common formats (ads, scenes, social media).
- **Inspiration**: 即梦AI community templates.
- **Implementation**:
  - Add `templates` table with project structure
  - “Use Template” in create modal
  - UI: Template gallery in dashboard

---

## Implementation Priority

### Phase 1 (Core Workflow)
1. Smart Script-to-Shot Mapping
2. Camera & Shot Controls
3. One-Click Storyboard-to-Video

### Phase 2 (AI Enhancements)
4. AI-Powered Scene Continuity
5. AI Moodboard & References

### Phase 3 (Collaboration)
6. Collaborative Review & Comments
7. Template Library

---

## Technical Notes

### Schema Additions
```ts
// storyboard_projects
moodboardImages: v.array(v.string()),
templateId: v.optional(v.id("templates")),

// storyboard_items
characterId: v.optional(v.string()),
cameraMotion: v.optional(v.object({
  type: v.string(), // pan/zoom/dolly
  start: v.number(),
  end: v.number(),
})),
shotType: v.optional(v.string()), // close-up/wide/tracking

// templates (new table)
name: v.string(),
description: v.string(),
structure: v.any(), // JSON project template
category: v.string(),
```

### New API Routes
- `/api/storyboard/auto-breakdown` – script to shots
- `/api/storyboard/render-video` – full storyboard to video
- `/api/storyboard/moodboard` – generate reference images
- `/api/templates/list` – fetch templates
- `/api/templates/apply` – create project from template

### UI Components to Add
- `CameraControlsPanel.tsx`
- `MoodboardSidebar.tsx`
- `ReviewComments.tsx`
- `TemplateGallery.tsx`
- `VideoPreviewModal.tsx`

---

## External Integrations

### Higgsfield AI APIs
- Character consistency (“Soul ID”)
- Camera motion control
- Advanced video models (Kling 3.0, Veo 3.1)

### 即梦AI Inspiration
- Chinese language optimization
- Community-driven templates
- Smart canvas for multi-image fusion

---

## Success Metrics
- Time from script to storyboard: < 5 minutes
- Visual consistency across frames: > 90%
- Video render time: < 2 minutes per 10 frames
- User collaboration actions: +300% engagement
- Template usage: 40% of new projects

---

## Next Steps
1. Validate AI providers for character consistency
2. Prototype script-to-shot mapping
3. Design camera control UI
4. Plan video rendering pipeline
5. Set up collaboration schema