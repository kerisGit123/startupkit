# Testing Plan — Session 2026-04-24

> Features built: Style/Format auto-append, AI Analyzer, Presets system, Batch generation

---

## 1. Style Auto-Append

### 1.1 Style badge in workspace toolbar
- [ ] Click style badge → dropdown opens with all 22 built-in styles
- [ ] Select "Cinematic" → badge shows "Cinematic", project.style updates
- [ ] Select "No Style" (first card with X icon) → badge shows "No Style", project.style clears
- [ ] Close dropdown by clicking X or outside

### 1.2 Custom style create (workspace)
- [ ] Click "+ Custom" → form appears with name + prompt fields
- [ ] Enter name + prompt → click "Create & Apply" → saves to `storyboard_presets` (category="style")
- [ ] Custom style card appears in dropdown with purple gradient
- [ ] Custom style has edit (pencil) and delete (X) buttons on hover
- [ ] Click pencil → form loads with existing name + prompt → edit → "Update" saves
- [ ] Click X → deletes preset → card disappears

### 1.3 Custom style create (new storyboard wizard)
- [ ] Create new storyboard → Art Style step shows built-in + custom presets
- [ ] Click "+ Custom" → create form → "Create" saves to presets
- [ ] Custom style cards have edit/delete buttons on hover (same as workspace)
- [ ] Select custom style → proceed to next step → project gets correct stylePrompt

### 1.4 Custom style create (dashboard inline)
- [ ] Dashboard "Create new" dialog → Art Style section shows presets
- [ ] Custom styles load from `storyboard_presets` (not promptTemplates)
- [ ] Create/edit/delete all work through presets

### 1.5 Style auto-append to generation
- [ ] Set project style to "Cinematic" in workspace
- [ ] Open SceneEditor → type a prompt → click Generate
- [ ] Check console: `finalPrompt` should start with cinematic style text + user prompt
- [ ] Set style to "No Style" → generate again → no style prefix in prompt

---

## 2. Format Presets

### 2.1 Format badge in workspace toolbar
- [ ] Format badge shows next to style badge
- [ ] Click → dropdown opens with 12 format presets (Film, Documentary, YouTube, etc.)
- [ ] Each format shows colored dot + name
- [ ] Select "YouTube" → badge shows "YouTube" in amber
- [ ] Select "No Format" → badge shows "No Format", clears formatPreset

### 2.2 Format auto-append to generation
- [ ] Set format to "YouTube" → generate image → prompt includes YouTube framing text
- [ ] Set format to "No Format" → generate → no format text in prompt
- [ ] Both style + format can be active simultaneously → both prepend

---

## 3. AI Analyzer

### 3.1 ANALYZE tab visibility
- [ ] Bottom toolbar shows: IMAGE | VIDEO | MUSIC | AUDIO | ANALYZE
- [ ] Click ANALYZE → tab highlights in amber
- [ ] Model selector, settings, generate button hide
- [ ] Analyze type selector appears in toolbar: Image | Video | Audio

### 3.2 Image analysis
- [ ] Select "Image" type in toolbar
- [ ] Click "Add Image" (+) → AddImageMenu opens with Upload, R2, Elements, Capture, Generated
- [ ] Upload image from computer → preview shows in 16x16 thumbnail
- [ ] Or paste URL in URL input field → preview updates
- [ ] Click "Analyze" button → loading spinner → result appears
- [ ] Result text shows with "Use as Prompt" and "Copy" buttons
- [ ] Click "Use as Prompt" → switches to IMAGE tab, result loads into prompt textarea
- [ ] Credit deduction: 1 credit deducted, shows in balance
- [ ] storyboard_files record created with fileType="analysis", model="ImageAnalyzer"

### 3.3 Video analysis
- [ ] Select "Video" type → "Add Video" shows with Upload + Browse (R2)
- [ ] Upload video → preview shows with green border, play overlay on hover
- [ ] Click preview → mediaPreview popup plays video
- [ ] Click "Analyze" → result shows shot-by-shot with timestamps
- [ ] Credit deduction: 3 credits

### 3.4 Audio analysis
- [ ] Select "Audio" type → "Add Audio" shows with Upload + Browse
- [ ] Upload audio → preview shows with purple border, Volume2 icon, play overlay
- [ ] Click preview → mediaPreview popup plays audio
- [ ] Click "Analyze" → result shows transcript/lyrics/description
- [ ] Credit deduction: 1 credit
- [ ] Song: lyrics with [Verse/Chorus] markers + style description
- [ ] Speech: full transcription + speaker description
- [ ] Dialogue: multi-speaker transcript with labels

### 3.5 Analysis in FileBrowser
- [ ] Analysis files appear in Generated category in FileBrowser
- [ ] Scan icon (amber) with model name and text preview
- [ ] Click → copies analysis text to clipboard
- [ ] Right-click → context menu shows "Copy Result" (not "Download")
- [ ] Delete works normally

### 3.6 Error handling
- [ ] Analyze with no media selected → toast "No image/video/audio to analyze"
- [ ] Insufficient credits → toast error with credit count
- [ ] API failure → toast error + credit refund
- [ ] Remove media (X button) → clears preview and result

---

## 4. Presets System

### 4.1 Preset Manager
- [ ] Workspace toolbar → "Presets" button → opens PresetManager dialog
- [ ] Tabs: All | Notes | Camera | Angles | Styles
- [ ] Each tab filters presets by category
- [ ] "All" shows all presets across categories
- [ ] Empty state shows "No presets saved yet"
- [ ] Preset row shows: icon (colored by category) + name + prompt preview + category badge
- [ ] Hover → edit (pencil) and delete (trash) buttons appear
- [ ] Click edit → inline form with name + prompt textarea (no description for style/note/camera/angle)
- [ ] Edit → Save → updates preset
- [ ] Delete → removes preset, toast confirms
- [ ] Footer shows total count

### 4.2 Camera Studio presets
- [ ] Open Camera Studio panel (click "Camera" button in toolbar)
- [ ] Header shows: Load | Save | Reset | X
- [ ] "Save" is dimmed when all settings are default
- [ ] Change camera to "ARRI Alexa" → Save becomes active
- [ ] Click Save → name input appears → type name → Enter or Save button
- [ ] Preset saved → toast confirms
- [ ] Click Load → dropdown shows saved presets (or "No saved presets")
- [ ] Select a preset → camera/lens/focal/aperture restore to saved values → toast confirms
- [ ] Reset → all settings back to default

### 4.3 Camera Angle presets
- [ ] Open Angle Picker (click "Angle" button in toolbar)
- [ ] Header shows: Load | Save | Reset | X
- [ ] Save dimmed when rotation=0, tilt=0, zoom=0
- [ ] Drag globe or adjust sliders → Save becomes active
- [ ] Save → name input → save → toast
- [ ] Load → dropdown → select preset → rotation/tilt/zoom restore
- [ ] Built-in angles labeled "SAMPLES" (not "PRESETS")
- [ ] Samples section is collapsible (hidden by default)

### 4.4 Note presets (PromptActions)
- [ ] Type text in prompt textarea
- [ ] Click Actions → "Save Note" → name dialog appears
- [ ] Enter name → Save → saved to storyboard_presets (category="note")
- [ ] Click Actions → "Saved Notes" (shows count badge) → dialog opens
- [ ] Dialog shows notes with name + text preview
- [ ] Hover → "Load" button + delete (trash) icon appear
- [ ] Click Load → text loads into prompt textarea → dialog closes
- [ ] Click delete → note removed → toast confirms
- [ ] Dialog uses portal (centered on screen, not stuck to bottom)

### 4.5 Prompt save (PromptActions → Prompt Library)
- [ ] Click Actions → "Save Prompt" → uses existing Prompt Library save flow (promptTemplates)
- [ ] NOT saved to storyboard_presets
- [ ] Click Actions → "Library" → opens Prompt Library for browsing

### 4.6 Cross-project presets
- [ ] Save a camera preset in Project A
- [ ] Open Project B (same workspace/companyId)
- [ ] Open Camera Studio → Load → preset from Project A is visible
- [ ] Presets are workspace-scoped, not project-scoped

---

## 5. Batch Frame Generation

### 5.1 Dialog
- [ ] Workspace toolbar → "Generate All" button → BatchGenerateDialog opens
- [ ] Model dropdown shows: Nano Banana 2, Nano Banana Pro, GPT Image 2
- [ ] Toggle "Use linked elements as reference" OFF → Z-Image also appears in model list
- [ ] Resolution buttons: 1K | 2K | 4K (for Nano Banana models)
- [ ] Project settings shown as badges: aspect ratio, style, format, color palette
- [ ] "Skip frames with existing images" checkbox (default: checked)
- [ ] Frame count: "6 / 8" (skipping 2 that already have images)
- [ ] Credits per frame × frame count = total credits
- [ ] Balance shown below total
- [ ] Insufficient credits → red warning, generate button disabled

### 5.2 Generation flow
- [ ] Click "Generate 6 Frames → 60 cr" → progress bar appears
- [ ] Progress: "Generating 1/6..." → "Generating 2/6..." etc.
- [ ] Each frame calls /api/storyboard/generate-image with:
  - imagePrompt (with style + format auto-prepended)
  - Selected model + resolution
  - Project aspect ratio
  - Linked element reference images (if enabled)
  - categoryId = storyboard_items._id
- [ ] 1 second delay between each call
- [ ] On complete → toast "All 6 frames queued for generation!"
- [ ] Dialog closes
- [ ] Storyboard cards update in real-time (Convex) as callbacks arrive

### 5.3 Error handling
- [ ] If a frame fails → count incremented, continues with next
- [ ] On complete with failures → toast warning with count
- [ ] Failed frames → user clicks into SceneEditor to retry manually

### 5.4 Element references
- [ ] Frame has linkedElements (e.g., character "Maria")
- [ ] Element has thumbnailUrl + referenceUrls
- [ ] Batch generation passes these as referenceImageUrls to API
- [ ] Only models supporting references shown when "Use linked elements" is ON

---

## 6. Color Palette

### 6.1 Schema
- [ ] `storyboard_projects.colorPalette` field exists (optional)
- [ ] Format: `{ referenceUrl?: string, colors: string[] }`
- [ ] Update mutation accepts colorPalette

### 6.2 Auto-append (when palette is set on project)
- [ ] If project has colorPalette with colors → generation prompt includes "Color graded with dominant palette: #HEX1, #HEX2..."
- [ ] If no colorPalette → nothing appended

### 6.3 Display in batch dialog
- [ ] If project has colorPalette → color dots shown in project settings badges

---

## 7. AddImageMenu mediaType

### 7.1 Image mode (default)
- [ ] Green emerald border, Plus icon, "Add Image" label
- [ ] Menu: Upload, R2, Elements, Capture, Generated

### 7.2 Video mode
- [ ] Green border, Film icon, "Add Video" label
- [ ] Menu: Upload, R2 (no Elements/Capture/Generated)

### 7.3 Audio mode
- [ ] Purple border, Volume2 icon, "Add Audio" label
- [ ] Menu: Upload, R2 (no Elements/Capture/Generated)

---

## 8. Prompt Assembly Order

Verify the final prompt is assembled in this order:
```
[stylePrompt] [formatPrompt] [colorPalette] [user prompt] [UGC/Showcase badges] [camera style] [camera angle] [clean output] [remove stray @Audio]
```

- [ ] Style only → style text + user prompt
- [ ] Format only → format text + user prompt
- [ ] Both → style + format + user prompt
- [ ] All three + camera → style + format + colors + user prompt + camera + angle
- [ ] No Style + No Format → raw user prompt only

---

## 9. Integration Tests

### 9.1 Full workflow: Style + Format + Analyze + Generate
1. [ ] Set project style to "Anime"
2. [ ] Set project format to "YouTube"
3. [ ] Open ANALYZE tab → upload reference image → Analyze
4. [ ] Click "Use as Prompt" → switches to IMAGE tab with analyzed prompt
5. [ ] Click Generate → prompt includes: anime style + YouTube format + analyzed scene description
6. [ ] Image generates successfully

### 9.2 Full workflow: Presets + Batch
1. [ ] Set up Camera Studio preset (ARRI + anamorphic)
2. [ ] Set style to custom "Dark Moody"
3. [ ] Create 5 frames with imagePrompts
4. [ ] Click "Generate All" → select Nano Banana 2, 1K
5. [ ] All frames generate with style + format auto-appended
6. [ ] Cards update in real-time

### 9.3 Cross-feature: Preset Manager
1. [ ] Save camera preset, angle preset, note, and custom style
2. [ ] Open Preset Manager → "All" tab shows 4 presets
3. [ ] Filter by each tab → shows correct presets
4. [ ] Edit name/prompt → saves correctly
5. [ ] Delete → removes from list and from tool dropdowns
