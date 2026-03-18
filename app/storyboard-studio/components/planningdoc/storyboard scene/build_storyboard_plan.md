# 🎬 Storyboard Build Plan with n8n Integration

## 🎯 Objective
Integrate n8n workflow "storyboard - Script Extractor" into the existing storyboard build system to replace manual script processing with AI-powered extraction.

---

## 🏗️ Current System Overview

### Scene Auto-Generation:
- **Script Input**: User writes script in script editor (pic3)
- **Algorithm Processing**: System automatically generates scenes when script is saved
- **Scene Selection**: User can view/select generated scenes (pic2)

### Build Dialog Options (pic1):
- **Build Type**: Normal Build, Enhanced Build
- **Rebuild Strategy**: Add/Update Scenes, Replace All
- **Element Strategy**: Preserve Elements, Regenerate Elements

### Build Types:
- **Normal Build**: Generate frames without AI extraction
- **Enhanced Build**: Generate frames + AI extraction

### Rebuild Strategies:
- **Add/Update Scenes**: Keep existing content, add/update specific scenes
- **Replace All**: Remove and replace all content

### Element Strategies:
- **Preserve Elements**: Keep existing elements
- **Regenerate Elements**: Re-extract all elements

---

## 🔧 New Integration Architecture (Real-Time n8n → Convex)

### 📋 Complete Build Flow (Non-Blocking + Real-Time Updates)

```
User Selects Script Type (Dropdown) → Clicks Build Button
    ↓
1. Set Convex Task Status: taskStatus="processing", taskType="script", taskMessage="Building storyboard..."
    ↓
2. Strategy Processing (replace/add_update scenes) → Clear data if needed
    ↓
3. Send to n8n: https://n8n.srv1010007.hstgr.cloud/workflow/nvWSNw6bq3X81w8WPeeep
    ↓
4. n8n Processes: Extracts elements + scenes from script
    ↓
5. n8n Directly Updates Convex: elements table + storyboardItems table
    ↓
6. n8n Updates Task Status: taskStatus="ready", taskMessage="Build completed"
    ↓
7. Storyboard Page Auto-Updates: Shows task status on storyboard card (real-time)
```

### 🎯 Key Architecture Benefits

#### ✅ **Non-Blocking System**
- **User clicks build** → Immediate UI feedback (no waiting)
- **n8n processes in background** → System remains responsive
- **Real-time updates** → UI updates automatically when complete

#### ✅ **Direct n8n → Convex Integration**
- **No intermediate server** → n8n talks directly to Convex
- **Faster processing** → Less network hops, direct data updates
- **Simpler architecture** → Fewer moving parts, cleaner code

#### ✅ **Perfect User Experience**
- **Immediate feedback** → User sees "processing" right away
- **Real-time updates** → Card updates automatically when done
- **Clear status** → User knows exactly what's happening

---

## 🔧 Required Convex Mutations for n8n Integration

### Elements Batch Create Mutation (n8n calls this directly)
```javascript
// convex/mutations/elements.ts
export const createBatch = mutation({
  args: {
    elements: v.array(v.object({
      type: v.string(), // "character" | "environment" | "prop"
      name: v.string(),
      description: v.string(),
      confidence: v.number(),
      type: v.string(), // element type from n8n
      appearsInScenes: v.array(v.number())
    })),
    storyboardId: v.id("storyboards")
  },
  handler: async (ctx, args) => {
    for (const element of args.elements) {
      await ctx.db.insert("elements", {
        ...element,
        storyboardId: args.storyboardId
      });
    }
    return { success: true, count: args.elements.length };
  }
});
```

### StoryboardItems Batch Create Mutation (n8n calls this directly)
```javascript
// convex/mutations/storyboardItems.ts
export const createBatch = mutation({
  args: {
    scenes: v.array(v.object({
      sceneNumber: v.number(),
      title: v.string(),
      duration: v.string(),
      description: v.string(),
      visualPrompt: v.string(),
      elements: v.object({
        characters: v.array(v.string()),
        environments: v.array(v.string()),
        props: v.array(v.string())
      })
    })),
    storyboardId: v.id("storyboards")
  },
  handler: async (ctx, args) => {
    for (const scene of args.scenes) {
      await ctx.db.insert("storyboardItems", {
        ...scene,
        storyboardId: args.storyboardId
      });
    }
    return { success: true, count: args.scenes.length };
  }
});
```

### Task Status Update Mutation (n8n calls this directly)
```javascript
// convex/mutations/storyboards.ts
export const updateTaskStatus = mutation({
  args: {
    storyboardId: v.id("storyboards"),
    taskStatus: v.string(),
    taskMessage: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, {
      taskStatus: args.taskStatus,
      taskMessage: args.taskMessage
    });
    return { success: true };
  }
});
```

---

## 🎯 Detailed Implementation Plan

### Phase 1: n8n Workflow Integration

#### 1.1 API Integration Setup (Direct n8n → Convex)
```javascript
// Build Storyboard Function - Non-Blocking with Real-Time Updates
export const buildStoryboard = mutation({
  args: {
    storyboardId: v.id("storyboards"),
    buildType: v.string(),        // "normal" | "enhanced"
    rebuildStrategy: v.string(),   // "add_update" | "replace_all"
    scriptType: v.string(),        // "ANIMATED_STORIES" | etc.
    language: v.string()           // "en" | "zh"
  },
  handler: async (ctx, args) => {
    // 1. Set task status immediately (non-blocking)
    await ctx.db.patch(args.storyboardId, { 
      taskStatus: "processing",
      taskType: "script",
      taskMessage: "Building storyboard..."
    });

    // 2. Strategy processing - clear data if needed
    if (args.rebuildStrategy === "replace_all") {
      await clearExistingElements(ctx, args.storyboardId);
      await clearExistingScenes(ctx, args.storyboardId);
    }

    // 3. Send to n8n workflow (fire and forget)
    try {
      const response = await fetch('https://n8n.srv1010007.hstgr.cloud/workflow/nvWSNw6bq3X81w8WPeeep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboard_id: args.storyboardId,
          script_type: args.scriptType,
          language: args.language,
          script: await getScriptContent(ctx, args.storyboardId),
          build_strategy: args.rebuildStrategy
        })
      });
      
      if (!response.ok) {
        throw new Error(`n8n workflow error: ${response.status}`);
      }
      
      // 4. Return immediately - n8n will handle the rest
      return { success: true, message: "Build started successfully" };
      
    } catch (error) {
      // 5. Handle errors - update task status
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "error",
        taskMessage: "Failed to start build process"
      });
      throw error;
    }
  }
});

// Helper function to get script content
async function getScriptContent(ctx, storyboardId) {
  const storyboard = await ctx.db.get(storyboardId);
  return storyboard?.script || "";
}

// Helper functions for clearing data
async function clearExistingElements(ctx, storyboardId) {
  const existingElements = await ctx.db.query("elements")
    .filter(q => q.eq(q.field("storyboardId"), storyboardId))
    .collect();
  
  for (const element of existingElements) {
    await ctx.db.delete(element._id);
  }
}

async function clearExistingScenes(ctx, storyboardId) {
  const existingScenes = await ctx.db.query("storyboardItems")
    .filter(q => q.eq(q.field("storyboardId"), storyboardId))
    .collect();
  
  for (const scene of existingScenes) {
    await ctx.db.delete(scene._id);
  }
}
```

#### 1.2 Script Type Mapping
```javascript
// Map build dialog selections to n8n script types
const SCRIPT_TYPE_MAPPING = {
  'animated_stories': 'ANIMATED_STORIES',
  'kids_animated_stories': 'KIDS_ANIMATED_STORIES',
  'educational_animations': 'EDUCATIONAL_ANIMATIONS',
  'tutorial_animations': 'TUTORIAL_ANIMATIONS',
  'documentary_shorts': 'DOCUMENTARY_SHORTS',
  'educational_science_history': 'EDUCATIONAL_SCIENCE_HISTORY',
  'finance_education': 'FINANCE_EDUCATION',
  'ai_music_song_video': 'AI_MUSIC_SONG_VIDEO',
  'health_education': 'HEALTH_EDUCATION',
  'advertising': 'ADVERTISING',
  'tutorial_step_by_step': 'TUTORIAL_STEP_BY_STEP'
};
```

---

### Phase 2: Enhanced Build Dialog Design

#### 2.1 Updated Build Dialog Options
```javascript
// Enhanced Build Dialog should include:
const buildOptions = {
  buildType: 'normal | enhanced',
  rebuildStrategy: 'add_update | replace_all',
  elementStrategy: 'preserve | regenerate',
  scriptType: 'ANIMATED_STORIES | KIDS_ANIMATED_STORIES | ... (11 options)',
  language: 'en | zh',
  projectId: 'storyboard_id'
};
```

#### 2.2 Build Dialog UI Components
```javascript
// Script Type Selection
<select id="scriptType">
  <option value="ANIMATED_STORIES">Animated Stories</option>
  <option value="KIDS_ANIMATED_STORIES">Kids Animated Stories</option>
  <option value="EDUCATIONAL_ANIMATIONS">Educational Animations</option>
  <option value="TUTORIAL_ANIMATIONS">Tutorial Animations</option>
  <option value="DOCUMENTARY_SHORTS">Documentary Shorts</option>
  <option value="EDUCATIONAL_SCIENCE_HISTORY">Educational Science History</option>
  <option value="FINANCE_EDUCATION">Finance Education</option>
  <option value="AI_MUSIC_SONG_VIDEO">AI Music Song Video</option>
  <option value="HEALTH_EDUCATION">Health Education</option>
  <option value="ADVERTISING">Advertising</option>
  <option value="TUTORIAL_STEP_BY_STEP">Tutorial Step by Step</option>
</select>

// Language Selection
<select id="language">
  <option value="en">English</option>
  <option value="zh">中文 (Chinese)</option>
  <option value="fr">Français (French)</option>
  <option value="es">Español (Spanish)</option>
  <option value="de">Deutsch (German)</option>
  <option value="it">Italiano (Italian)</option>
  <option value="pt">Português (Portuguese)</option>
  <option value="ru">Русский (Russian)</option>
  <option value="ar">العربية (Arabic)</option>
  <option value="ja">日本語 (Japanese)</option>
  <option value="ko">한국어 (Korean)</option>
</select>
```

#### 2.3 Build Storyboard Action Redesign

#### 2.1 Remove Old Code
```javascript
// DELETE: All existing manual script processing code
// DELETE: Manual element extraction logic
// DELETE: Manual scene parsing code
// DELETE: Hardcoded element rules
```

#### 2.2 New Build Storyboard Function
```javascript
async function buildStoryboard(options) {
  const {
    buildType,
    rebuildStrategy,
    elementStrategy,
    scriptContent,
    scriptType,
    language,
    projectId
  } = options;

  // Only Enhanced Build calls n8n
  if (buildType === 'enhanced' && elementStrategy === 'regenerate') {
    return await enhancedBuildWithN8N(options);
  } else {
    return await normalBuild(options);
  }
}
```

#### 2.3 Enhanced Build with n8n
```javascript
async function enhancedBuildWithN8N(options) {
  try {
    // Step 1: Call n8n workflow
    const extractedData = await callN8nWorkflow(options);
    
    // Step 2: Process elements
    const processedElements = await processElements(extractedData.elements);
    
    // Step 3: Save elements to Elements Card
    await saveElementsToCard(processedElements, options.projectId);
    
    // Step 4: Process scenes
    const processedScenes = await processScenes(extractedData.scenes);
    
    // Step 5: Save scenes to StoryboardItem Card
    await saveScenesToCard(processedScenes, options.projectId);
    
    // Step 6: Generate frames
    await generateFrames(processedScenes, processedElements);
    
    return { success: true, elements: processedElements, scenes: processedScenes };
    
  } catch (error) {
    console.error('Enhanced build failed:', error);
    throw error;
  }
}
```

---

### Phase 3: Element Processing

#### 3.1 Process Extracted Elements
```javascript
async function processElements(elements) {
  const processedElements = {
    characters: [],
    environments: [],
    props: []
  };

  // Process Characters
  if (elements.characters) {
    processedElements.characters = elements.characters.map(char => ({
      id: generateId(),
      name: char.name,
      description: char.description,
      confidence: char.confidence,
      type: char.type,
      appearsInScenes: char.appearsInScenes,
      role: char.role || 'supporting',
      visualStyle: determineVisualStyle(char),
      tags: extractTags(char.description)
    }));
  }

  // Process Environments
  if (elements.environments) {
    processedElements.environments = elements.environments.map(env => ({
      id: generateId(),
      name: env.name,
      description: env.description,
      confidence: env.confidence,
      type: env.type,
      appearsInScenes: env.appearsInScenes,
      function: env.function || 'primary',
      visualStyle: determineVisualStyle(env),
      tags: extractTags(env.description)
    }));
  }

  // Process Props
  if (elements.props) {
    processedElements.props = elements.props.map(prop => ({
      id: generateId(),
      name: prop.name,
      description: prop.description,
      confidence: prop.confidence,
      type: prop.type,
      appearsInScenes: prop.appearsInScenes,
      purpose: prop.purpose || 'plot',
      visualStyle: determineVisualStyle(prop),
      tags: extractTags(prop.description)
    }));
  }

  return processedElements;
}
```

#### 3.2 Save Elements to Card
```javascript
async function saveElementsToCard(elements, projectId) {
  // Clear existing elements if Replace All strategy
  if (rebuildStrategy === 'replace_all') {
    await clearExistingElements(projectId);
  }

  // Save each element type
  for (const character of elements.characters) {
    await saveCharacterToCard(character, projectId);
  }

  for (const environment of elements.environments) {
    await saveEnvironmentToCard(environment, projectId);
  }

  for (const prop of elements.props) {
    await savePropToCard(prop, projectId);
  }
}
```

---

### Phase 4: Scene Processing

#### 4.1 Process Extracted Scenes
```javascript
async function processScenes(scenes) {
  return scenes.map(scene => ({
    id: generateId(),
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    duration: scene.duration,
    description: scene.description,
    visualPrompt: scene.visualPrompt,
    elements: {
      characters: scene.elements.characters || [],
      environments: scene.elements.environments || [],
      props: scene.elements.props || []
    },
    timing: calculateSceneTiming(scene),
    transitions: determineTransitions(scene),
    cameraMovements: extractCameraMovements(scene.visualPrompt)
  }));
}
```

#### 4.2 Save Scenes to StoryboardItem Card
```javascript
async function saveScenesToCard(scenes, projectId) {
  // Clear existing scenes if Replace All strategy
  if (rebuildStrategy === 'replace_all') {
    await clearExistingScenes(projectId);
  }

  // Save each scene
  for (const scene of scenes) {
    await saveSceneToCard(scene, projectId);
  }
}
```

---

### Phase 5: Frame Generation

#### 5.1 Generate Frames from Processed Data
```javascript
async function generateFrames(scenes, elements) {
  const frames = [];

  for (const scene of scenes) {
    const frameData = {
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      duration: scene.duration,
      visualPrompt: scene.visualPrompt,
      elements: scene.elements,
      elementDetails: getElementDetails(scene.elements, elements),
      cameraWork: scene.cameraMovements,
      transitions: scene.transitions
    };

    // Generate frame using existing frame generation logic
    const frame = await generateSingleFrame(frameData);
    frames.push(frame);
  }

  return frames;
}
```

---

## 🎯 Build Strategy Logic

### Normal Build (No AI)
```javascript
if (buildType === 'normal') {
  // Use existing frame generation logic
  // No n8n call
  // No element extraction
  return await generateFramesFromExistingData();
}
```

### Enhanced Build + Preserve Elements
```javascript
if (buildType === 'enhanced' && elementStrategy === 'preserve') {
  // Extract scenes only
  // Keep existing elements
  // n8n call for scene processing only
  return await enhancedBuildPreserveElements();
}
```

### Enhanced Build + Regenerate Elements (Full AI)
```javascript
if (buildType === 'enhanced' && elementStrategy === 'regenerate') {
  // Full n8n integration
  // Extract both elements and scenes
  // Replace all content
  return await enhancedBuildWithN8N();
}
```

---

## 📊 Performance Considerations

### Caching Strategy
```javascript
// Cache n8n results for identical scripts
const scriptCache = new Map();
```

---

## 📊 Comprehensive Flow Analysis

### 🎯 Overall Assessment: EXCELLENT with Convex Enhancements

---

### ✅ STRONG POINTS (Current Design)

#### 1. Hybrid Architecture (9/10)
```javascript
// PERFECT: Local + AI combination
Scene Generation (Local/Fast) + Element Extraction (AI/Smart)
```
- **Speed**: Immediate scene feedback
- **Intelligence**: AI-powered extraction
- **Reliability**: Fallback to normal build

#### 2. Error Handling (8/10)
```javascript
// GOOD: Comprehensive error coverage
try {
  const result = await callN8nWorkflow(options);
} catch (error) {
  // Handles 500, 400, network errors
  // Fallback to normal build
  // User-friendly messages
}
```

#### 3. Build Strategy Flexibility (9/10)
- **3 Build Types**: Normal, Enhanced, AI-only
- **2 Rebuild Strategies**: Add/Update, Replace All
- **2 Element Strategies**: Preserve, Regenerate
- **11 Script Types**: Comprehensive coverage

---

### ⚠️ AREAS FOR IMPROVEMENT (Convex Integration)

#### 1. Real-Time Status (6/10 → 9/10 with Convex)
```javascript
// BEFORE: Silent processing
await buildStoryboard(options);

// AFTER: Real-time updates
await ctx.db.patch(storyboardId, {
  buildStatus: "processing",
  buildProgress: 30,
  buildMessage: "Calling n8n workflow..."
});
```

#### 2. Notification System (5/10 → 9/10 with Convex)
```javascript
// BEFORE: User must check manually
// AFTER: Automatic notifications
<BuildStatus storyboardId={storyboardId} />
// Shows: Processing (30%) → Ready → Error
```

#### 3. Concurrent Build Management (4/10 → 8/10 with Convex)
```javascript
// BEFORE: No build queue
// AFTER: Build job tracking
const buildJobs = await ctx.db.query("buildJobs")
  .filter(q => q.eq(q.field("status"), "processing"))
  .collect();
```

---

### 🚀 CONVEX-SPECIFIC BENEFITS

#### 1. Real-Time Reactivity
```javascript
// Automatic UI updates
const status = useQuery(api.storyboards.getBuildStatus, storyboardId);
// UI updates instantly when Convex data changes
```

#### 2. Scalable Build Management
```javascript
// Multiple users, concurrent builds
export const getActiveBuilds = query({
  handler: async (ctx) => {
    return await ctx.db.query("buildJobs")
      .filter(q => q.eq(q.field("status"), "processing"))
      .collect();
  }
});
```

#### 3. Persistent Build History
```javascript
// Track all builds over time
export const getBuildHistory = query({
  args: { storyboardId: v.id("storyboards") },
  handler: async (ctx, args) => {
    return await ctx.db.query("buildJobs")
      .filter(q => q.eq(q.field("storyboardId"), args.storyboardId))
      .order("desc")
      .take(10);
  }
});
```

---

### 📈 PERFORMANCE ANALYSIS

#### Current Performance (Good)
- **Scene Generation**: ~100ms (local)
- **n8n Call**: ~5-30 seconds (AI processing)
- **Frame Generation**: ~2-10 seconds
- **Total**: ~7-40 seconds

#### With Convex Enhancements (Better)
- **Real-time Feedback**: Immediate status updates
- **Background Processing**: User can navigate away
- **Build Queue**: Handle multiple concurrent builds
- **Error Recovery**: Automatic retry mechanisms

---

### 🎯 RECOMMENDATIONS

#### 1. IMPLEMENT CONVEX STATUS TRACKING (HIGH PRIORITY)
```javascript
// Add to schema immediately
buildStatus: v.string(), // "idle" | "processing" | "ready" | "error"
buildProgress: v.number(), // 0-100
buildMessage: v.string(), // Current operation
```

#### 2. ADD BUILD NOTIFICATION COMPONENT (HIGH PRIORITY)
```javascript
// Show in storyboard UI
<BuildStatus storyboardId={storyboardId} />
// Displays: 🔄 Processing (45%) → ✅ Ready → ❌ Error
```

#### 3. IMPLEMENT BUILD QUEUE (MEDIUM PRIORITY)
```javascript
// Handle concurrent builds
const buildQueue = new BuildQueue({
  maxConcurrent: 3,
  retryAttempts: 2
});
```

#### 4. ADD BUILD HISTORY (LOW PRIORITY)
```javascript
// Track build performance
const buildMetrics = {
  averageBuildTime: "12.5 seconds",
  successRate: "94%",
  totalBuilds: 156
};
```

---

### 🏆 FINAL VERDICT

#### Current Design: 8/10
- **Architecture**: Excellent hybrid approach
- **Error Handling**: Comprehensive
- **User Experience**: Good (missing status updates)

#### With Convex Integration: 9.5/10
- **Real-Time Status**: Perfect user feedback
- **Scalability**: Handles multiple users
- **Reliability**: Persistent build tracking
- **Performance**: Background processing

---

## 🚀 Simplified Convex Integration (Minimalist Approach)

### Convex Schema Update (Generic Status Field)
```javascript
// convex/schema.ts - Just add ONE field to existing storyboard table
export default defineSchema({
  storyboards: defineTable({
    // ... your existing fields stay the same
    title: v.string(),
    script: v.string(),
    scenes: v.array(v.any()),
    elements: v.array(v.any()),
    
    // JUST ONE NEW FIELD - Generic status for all processes
    status: v.string(), // "idle" | "processing" | "ready" | "error"
    
    // ... rest of your existing fields
  })
  // NO additional tables needed!
});
```

### Direct Convex API Implementation
```javascript
// convex/functions/build.ts
export const buildStoryboard = mutation({
  args: {
    storyboardId: v.id("storyboards"),
    buildType: v.string(),
    scriptType: v.string(),
    language: v.string()
  },
  handler: async (ctx, args) => {
    // 1. Set status to processing
    await ctx.db.patch(args.storyboardId, { 
      status: "processing"
    });

    try {
      // 2. Call n8n workflow
      const response = await fetch('https://n8n.srv1010007.hstgr.cloud/webhook/script-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_type: args.scriptType,
          language: args.language,
          project_id: args.storyboardId,
          script: await getScriptContent(ctx, args.storyboardId)
        })
      });
      
      const n8nResult = await response.json();
      
      // 3. Clear existing data (if replace all)
      await clearExistingElements(ctx, args.storyboardId);
      await clearExistingScenes(ctx, args.storyboardId);
      
      // 4. Save new elements directly
      await saveElementsDirectly(ctx, args.storyboardId, n8nResult.elements);
      
      // 5. Save new scenes directly
      await saveScenesDirectly(ctx, args.storyboardId, n8nResult.scenes);
      
      // 6. Mark as ready
      await ctx.db.patch(args.storyboardId, { 
        status: "ready"
      });
      
      return { success: true };
      
    } catch (error) {
      // 7. Handle errors
      await ctx.db.patch(args.storyboardId, { 
        status: "error"
      });
      throw error;
    }
  }
});

async function saveElementsDirectly(ctx, storyboardId, elements) {
  // Save characters
  if (elements.characters) {
    for (const char of elements.characters) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: "character",
        name: char.name,
        description: char.description,
        confidence: char.confidence
      });
    }
  }
  
  // Save environments
  if (elements.environments) {
    for (const env of elements.environments) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: "environment",
        name: env.name,
        description: env.description,
        confidence: env.confidence
      });
    }
  }
  
  // Save props
  if (elements.props) {
    for (const prop of elements.props) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: "prop",
        name: prop.name,
        description: prop.description,
        confidence: prop.confidence
      });
    }
  }
}

async function saveScenesDirectly(ctx, storyboardId, scenes) {
  for (const scene of scenes) {
    await ctx.db.insert("scenes", {
      storyboardId,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      elements: scene.elements
    });
  }
}
```

### Universal Status for All Processes
```javascript
// Image Generation - Uses same status field
export const generateImages = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { status: "processing" });
    
    try {
      const imageResults = await callKieAI(args);
      await saveImages(ctx, args.storyboardId, imageResults);
      await ctx.db.patch(args.storyboardId, { status: "ready" });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { status: "error" });
    }
  }
});

// Video Generation - Uses same status field
export const generateVideo = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { status: "processing" });
    
    try {
      const videoResult = await callVideoService(args);
      await saveVideo(ctx, args.storyboardId, videoResult);
      await ctx.db.patch(args.storyboardId, { status: "ready" });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { status: "error" });
    }
  }
});
```

### Minimal UI Implementation
```javascript
// components/StoryboardCard.tsx
export function StoryboardCard({ storyboard }) {
  const getStatusIcon = () => {
    switch (storyboard.status) {
      case "processing":
        return <Spinner className="w-4 h-4 text-blue-500" />;
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (storyboard.status) {
      case "processing": return "bg-blue-100 text-blue-800";
      case "ready": return "bg-green-100 text-green-800";
      case "error": return "bg-red-100 text-red-800";
    });

    try {
      // 2. Call n8n workflow
      const response = await fetch('https://n8n.srv1010007.hstgr.cloud/webhook/script-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_type: args.scriptType,
          language: args.language,
          project_id: args.storyboardId,
          script: await getScriptContent(ctx, args.storyboardId)
        })
      });
      
      const n8nResult = await response.json();
      
      // 3. Clear existing data (if replace all strategy)
      if (args.buildType === "replace_all") {
        await clearExistingElements(ctx, args.storyboardId);
        await clearExistingScenes(ctx, args.storyboardId);
      }
      
      // 4. Save new elements using simplified approach
      await saveElementsDirectly(ctx, args.storyboardId, n8nResult.elements);
      
      // 5. Save new scenes directly
      await saveScenesDirectly(ctx, args.storyboardId, n8nResult.scenes);
      
      // 6. Mark as ready with specific message
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "ready",
        taskMessage: "Build completed"
      });
      
      return { success: true };
      
    } catch (error) {
      // 7. Handle errors with specific message
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "error",
        taskMessage: "Build failed"
      });
      throw error;
    }
  }
});

// HELPER FUNCTIONS

// Get script content from storyboard table
async function getScriptContent(ctx, storyboardId) {
  const storyboard = await ctx.db.get(storyboardId);
  return storyboard?.script || "";
}

// Clear existing elements for "replace all" strategy
async function clearExistingElements(ctx, storyboardId) {
  const existingElements = await ctx.db.query("elements")
    .filter(q => q.eq(q.field("storyboardId"), storyboardId))
    .collect();
  
  for (const element of existingElements) {
    await ctx.db.delete(element._id);
  }
}

// Clear existing scenes for "replace all" strategy
async function clearExistingScenes(ctx, storyboardId) {
  const existingScenes = await ctx.db.query("scenes")
    .filter(q => q.eq(q.field("storyboardId"), storyboardId))
    .collect();
  
  for (const scene of existingScenes) {
    await ctx.db.delete(scene._id);
  }
}

// SIMPLIFIED: One loop for all element types
async function saveElementsDirectly(ctx, storyboardId, elements) {
  const elementTypes = [
    { type: "character", data: elements.characters || [] },
    { type: "environment", data: elements.environments || [] },
    { type: "prop", data: elements.props || [] }
  ];
  
  for (const { type, data } of elementTypes) {
    for (const element of data) {
      await ctx.db.insert("elements", {
        storyboardId,
        type: type,                    // element.type (from loop)
        name: element.name,            // element.name
        description: element.description, // element.description
        confidence: element.confidence   // element.confidence
      });
    }
  }
}

async function saveScenesDirectly(ctx, storyboardId, scenes) {
  for (const scene of scenes) {
    await ctx.db.insert("scenes", {
      storyboardId,
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      visualPrompt: scene.visualPrompt,
      elements: scene.elements
    });
  }
}
```

### Universal Task Status for All Processes
```javascript
// Image Generation - Uses same task fields with specific messages
export const generateImages = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { 
      taskStatus: "processing",
      taskMessage: "Generating images...",
      taskType: "image"
    });
    
    try {
      const imageResults = await callKieAI(args);
      await saveImages(ctx, args.storyboardId, imageResults);
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "ready",
        taskMessage: "Images generated"
      });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "error",
        taskMessage: "Image generation failed"
      });
    }
  }
});

// Video Generation - Uses same task fields with specific messages
export const generateVideo = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyboardId, { 
      taskStatus: "processing",
      taskMessage: "Generating video...",
      taskType: "video"
    });
    
    try {
      const videoResult = await callVideoService(args);
      await saveVideo(ctx, args.storyboardId, videoResult);
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "ready",
        taskMessage: "Video generated"
      });
    } catch (error) {
      await ctx.db.patch(args.storyboardId, { 
        taskStatus: "error",
        taskMessage: "Video generation failed"
      });
    }
  }
});
```

### Simplified UI Implementation (Task-Based Status)
```javascript
// components/StoryboardCard.tsx
// SIMPLIFIED: One configuration object for all task status states
const TASK_STATUS_CONFIG = {
  processing: { 
    icon: Spinner, 
    color: "bg-blue-100 text-blue-800",
    textColor: "text-blue-500"
  },
  ready: { 
    icon: CheckCircle, 
    color: "bg-green-100 text-green-800",
    textColor: "text-green-500"
  },
  error: { 
    icon: AlertCircle, 
    color: "bg-red-100 text-red-800",
    textColor: "text-red-500"
  }
};

// SIMPLIFIED: One function gets all task status information
const getTaskStatusInfo = (taskStatus) => TASK_STATUS_CONFIG[taskStatus] || {};

export function StoryboardCard({ storyboard }) {
  const taskStatusInfo = getTaskStatusInfo(storyboard.taskStatus);
  const Icon = taskStatusInfo.icon;
  
  return (
    <div className="relative storyboard-card border rounded-lg p-4">
      {/* Small loading indicator - top-left corner */}
      {storyboard.taskStatus === "processing" && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-white rounded-full p-1 shadow-md">
            <Icon className={`w-4 h-4 ${taskStatusInfo.textColor}`} />
          </div>
        </div>
      )}
      
      {/* Status badge - top-right corner with specific message */}
      {storyboard.taskStatus !== "idle" && (
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded ${taskStatusInfo.color}`}>
            {storyboard.taskMessage || storyboard.taskStatus}
          </span>
        </div>
      )}
      
      {/* Your existing card content */}
      <h3 className="font-semibold text-lg">{storyboard.title}</h3>
      <p className="text-gray-600 text-sm mt-1">{storyboard.description}</p>
    </div>
  );
}
```
    // n8n workflow error
    showUserMessage('AI extraction service unavailable. Using normal build.');
    return await normalBuild(options);
  } else if (error.response?.status === 400) {
    // Invalid input
    showUserMessage('Invalid script format. Please check your script.');
    throw error;
  } else {
    // Network error
    showUserMessage('Connection error. Please try again.');
    throw error;
  }
}
```

### Data Validation
```javascript
function validateExtractedData(data) {
  const required = ['projectId', 'scriptType', 'language', 'elements', 'scenes'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}
```

---

## 📊 Performance Considerations

### Caching Strategy
```javascript
// Cache n8n results for identical scripts
const scriptCache = new Map();

async function getCachedExtraction(scriptHash) {
  if (scriptCache.has(scriptHash)) {
    return scriptCache.get(scriptHash);
  }
  
  const result = await callN8nWorkflow(options);
  scriptCache.set(scriptHash, result);
  return result;
}
```

### Progress Tracking
```javascript
// Show progress to user during n8n processing
function showProgress(step, total) {
  updateProgressBar(step, total);
  updateStatusMessage(`Processing step ${step} of ${total}...`);
}

// Usage
showProgress(1, 4); // Calling n8n workflow
showProgress(2, 4); // Processing elements
showProgress(3, 4); // Processing scenes
showProgress(4, 4); // Generating frames
```

---

## 🎯 Success Metrics

### Expected Outcomes
- ✅ Faster script processing (AI vs manual)
- ✅ More consistent element extraction
- ✅ Better scene structure analysis
- ✅ Improved element tracking across scenes
- ✅ Enhanced visual prompt generation

### Quality Improvements
- ✅ Consistent character identification
- ✅ Proper environment classification
- ✅ Accurate prop categorization
- ✅ Logical scene sequencing
- ✅ Proper element-scene relationships

---

## 🚀 Implementation Timeline

### Week 1: Foundation
- Set up n8n API integration
- Create service layer
- Implement basic error handling

### Week 2: Core Logic
- Replace existing build function
- Implement element processing
- Add scene processing

### Week 3: Integration
- Connect to Elements Card
- Connect to StoryboardItem Card
- Implement frame generation

### Week 4: Testing & Optimization
- Test with all script types
- Performance optimization
- Error handling refinement
- User experience improvements

---

## 🎯 Final Architecture

```
User Writes Script (pic3) → Auto-Scene Generation → Scene Selection (pic2)
                                                    ↓
User Clicks "Build storyboard" → Build Dialog (pic1) → Build Options
                                                    ↓
Enhanced Build + Script Type + Language → n8n Workflow → Structured JSON
                                                    ↓
Elements Processing → Elements Card → Frame Generation
                                                    ↓
Scenes Processing → StoryboardItem Card → Complete Build
```

---

## 🔍 Scene Auto-Generation Algorithm Analysis

### Current Algorithm (Good Approach):
```javascript
// When user saves script, system automatically:
function generateScenesFromScript(scriptContent) {
  // 1. Parse script for scene markers (# Scene 1, ## Scene 2, etc.)
  // 2. Extract scene content (duration, visual prompt, characters)
  // 3. Create scene objects with metadata
  // 4. Store scenes for user selection (pic2)
  // 5. Allow user to review/edit generated scenes
}
```

### ✅ Benefits of Current Approach:
- **Immediate feedback** - Users see scenes right away
- **User control** - Can edit/adjust scenes before build
- **Efficiency** - No waiting for AI processing during scene creation
- **Flexibility** - Manual scene editing available

### ✅ Integration with n8n:
- **Scene generation** stays local (fast, immediate)
- **Element extraction** handled by n8n (AI-powered)
- **Final processing** combines both approaches
- **Best of both worlds** - speed + AI intelligence