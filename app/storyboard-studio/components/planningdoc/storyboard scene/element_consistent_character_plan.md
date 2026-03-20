# Consistent Character/Prop/Environment AI Image Maker

> **Purpose**: Advanced AI image generation system for consistent characters, props, and environments with template management
> **Scope**: Element system integration with n8n workflow, real-time job tracking, and custom prompt generation
> **Phase**: Design and Implementation - **0% COMPLETE**

> **🎯 ASSESSMENT: HIGHLY WORKABLE**
> - ✅ **Simplicity**: Clean, focused architecture with minimal complexity
> - ✅ **Efficiency**: Async processing + Convex real-time updates = optimal performance
> - ✅ **Structure**: Well-organized with clear separation of concerns
> - ✅ **Workability**: Proven patterns, realistic scope, achievable timeline

---

## 🎯 **System Overview**

### **🎨 **Core Concept**
Create a simple AI image generation system that produces consistent characters, props, and environments by:
- Using reference images for identity consistency
- Using prompt templates for professional consistency
- Integrating with n8n workflow for image generation
- Managing generation jobs with status tracking
- Storing results in R2 storage

### **🔗 **Integration Points**
- **Element System**: Extend existing element library with AI generation capabilities
- **n8n Workflow**: Leverage existing consistent character workflow
- **Storyboard System**: Extract art styles from storyboard generation dialog
- **R2 Storage**: Store generated images with proper organization
- **Credit System**: Track AI generation usage

---

## 🏗️ **System Architecture**

### 🏆 **Final Architecture:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Prompt    │ +  │   Template      │ →  │  Final Prompt    │
│   "Young hero"   │    │ "Consistency"   │    │  Combined Text   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Create Job     │ →  │   Send to n8n   │ →  │  n8n calls AI   │
│  (Convex DB)     │    │   (Workflow)    │    │  (Kling AI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  n8n Returns    │ →  │  Update Job     │ →  │  User Sees       │
│  result URLs    │    │  (Convex DB)    │    │  Results         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Correct Flow:**
1. **User writes prompt** + **selects template** (optional)
2. **System combines** user prompt + template prompt = final prompt
3. **Create job** in Convex with "pending" status
4. **Send to n8n workflow** with final prompt
5. **n8n calls Kling AI** (or other AI service)
6. **AI generates images** → returns URLs to n8n
7. **n8n returns result URLs** to our system
8. **Update job** status to "completed" with result URLs
9. **User sees results** and can download

### **🎯 **Key Features**

#### **1. Reference Image Processing**
- Upload reference images for characters/props/environments
- Extract key features and characteristics
- Generate multi-angle identity sheets (like your example prompt)
- Maintain consistency across generated images

#### **2. Simple Template Management**
- **Frontend Template Library**: User-selectable prompt templates
- **Template Categories**: Character, Environment, Prop, Style, Composition, Lighting
- **Company-based Templates**: Private and public template sharing
- **Simple Integration**: Template + User prompt combined on generate

#### **3. AI Image Generation**
- Integration with n8n consistent character workflow
- Multiple generation modes (character, prop, environment)
- Batch generation with consistent identity
- Quality and resolution options

#### **4. R2 Storage Architecture**
- **Generated images stored in R2** at `{companyId}/generated/` folder
- **Dual download options**: Desktop download OR File Library save
- **File Library integration**: Saved images appear in user's file browser
- **Direct CDN access**: All images served via R2 CDN for fast loading
- **Organized structure**: Clear folder hierarchy per company
- **Automatic cleanup**: Optional cleanup policy for old generated images

---

## 📱 **UI/UX Design**

### **🎨 **Design Reference**
Inspired by **Kling AI** layout + **ltx.studio** dark aesthetic + `plan_style.md` system.

**Design DNA:**
- Dark background: `#0A0A0A` / `#111111` (ltx.studio feel)
- Surface cards: `#1A1A1A` with `rgba(255,255,255,0.06)` borders
- Accent: Emerald `#10B981` (brand primary from plan_style.md)
- Typography: Inter, clean, minimal weight hierarchy
- Rounded corners: `8px` cards, `12px` panels, `9999px` pills

---

### **🔄 **User Flow (Simple 3 Steps)**

```
Step 1: Upload Reference (optional)
  └─ Drag image → appears as @Image1 chip in thumbnail row

Step 2: Write Prompt + Select Template
  └─ "A young warrior @Image1 in battle stance, bold armor"
  └─ Select "Natural Character Pose" template (optional)
  └─ @mention references inline (like Kling)

Step 3: Generate & Handle Results
  └─ Emerald [🔥 20 Generate] button
  └─ Creates job, n8n processes, results appear when done
  └─ Click [Download] on best result → TWO OPTIONS:
    ├─ 💾 Download to Desktop (local file)
    └─ 📁 Save to File Library (R2 storage)
```

---

### **🎨 **Key UI Patterns (Kling-inspired)**

#### **Reference Thumbnail Row**
```typescript
// Horizontal scroll, circular thumbnails
// Like Kling's character selector at top
<div className="flex gap-3 overflow-x-auto pb-2">
  <AddReferenceButton />  {/* + circle */}
  {references.map(ref => (
    <ReferenceThumbnail
      key={ref.id}
      image={ref.url}
      label={`@Image${ref.index}`}
      onClick={() => insertMention(ref)}  // inserts into prompt
    />
  ))}
</div>
```

#### **@Mention Prompt System**
```typescript
// Type @ in prompt → shows reference picker dropdown
// Matches Kling's @Image1, @Image2 inline reference
<PromptTextarea
  onMention={(trigger) => showReferencePicker(trigger)}
  mentions={references}  // renders as green chips in text
  placeholder="Describe your element... type @ to reference an image"
/>
```

#### **Generate Button with Credits**
```typescript
// Bottom of left panel, full width, emerald green
<button className="w-full bg-emerald-500 hover:bg-emerald-600 
  text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
  <FlameIcon className="w-4 h-4" />
  <span>{creditCost}</span>
  <span>Generate</span>
</button>
```

#### **Image Result Card**
```typescript
// Hover reveals dual download options + Zoom actions
// Selected card shows emerald ring
<div className="group relative aspect-square rounded-lg overflow-hidden bg-surface">
  <img src={result.url} className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
    transition-opacity flex items-end p-2 gap-2">
    <button 
      onClick={() => downloadToDesktop(result)}
      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
      title="Download to Desktop">
      💾 Desktop
    </button>
    <button 
      onClick={() => saveToFileLibrary(result)}
      className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600 transition-colors"
      title="Save to File Library">
      📁 Library
    </button>
    <button 
      onClick={() => zoom(result)}
      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
      title="View Full Size">
      🔍 View
    </button>
  </div>
</div>
```

#### **Download Functions**
```typescript
// Download to user's desktop/local machine
const downloadToDesktop = async (result) => {
  try {
    // Fetch the image blob from R2
    const response = await fetch(result.url);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

// Save to user's file library in R2
const saveToFileLibrary = async (result) => {
  try {
    // Copy from generated/ to file library folder
    await callMutation(api.files.saveToLibrary, {
      sourceUrl: result.url,
      companyId: user.companyId,
      fileName: `generated-image-${Date.now()}.png`,
      folder: 'generated/' // Already in generated/ folder
    });
    
    // Show success message
    toast.success('Image saved to your file library!');
  } catch (error) {
    console.error('Save to library failed:', error);
    toast.error('Failed to save to file library');
  }
};
```

---

### **🎨 **Visual Style Tokens (ltx.studio + plan_style.md)**

```css
/* Image Generator specific tokens */
--ig-bg:            #0A0A0A;    /* Page background */
--ig-surface:       #141414;    /* Panel background */
--ig-surface-2:     #1A1A1A;    /* Card background */
--ig-border:        rgba(255,255,255,0.08);  /* Subtle borders */
--ig-border-hover:  rgba(255,255,255,0.15);  /* Hover borders */
--ig-text-primary:  #F9FAFB;    /* Main text */
--ig-text-muted:    #6B7280;    /* Label / secondary text */
--ig-accent:        #10B981;    /* Emerald - buttons, selections */
--ig-accent-hover:  #059669;    /* Hover state */
--ig-mention:       rgba(16,185,129,0.2);  /* @mention chip bg */
--ig-mention-text:  #34D399;    /* @mention text color */
```

---

## � **Mobile-Friendly Design**

### **🎯 **Responsive Layout Strategy**
```typescript
// Mobile-first responsive breakpoints
const BREAKPOINTS = {
  mobile: '640px',    // Phones
  tablet: '768px',   // Tablets  
  desktop: '1024px', // Small desktops
  large: '1280px'    // Large desktops
};

// Responsive layout changes:
// Mobile: Single column, stacked panels
// Tablet: Side-by-side with reduced width
// Desktop: Full two-panel layout
```

### **📱 **Mobile Layout (640px and below)**
```
┌─────────────────────────────────────┐
│  ← BACK        IMAGE GENERATOR    │  ← Mobile header
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  + Add Reference            │   │  ← Full-width upload
│  │  Drag image here...         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  @Image1 @Image2            │   │  ← Horizontal scroll refs
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Describe your character... │   │  ← Full-width prompt
│  │  [Type: Character ▼]        │   │  ← Compact type selector
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Optional template...       │   │  ← Full-width template
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     🔥 20  Generate         │   │  ← Full-width button
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      GENERATING...           │   │  ← Loading state
│  │      ⏳ Please wait...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────┐  ┌─────────┐          │  ← 2-col grid
│  │  img 1  │  │  img 2  │          │    Mobile optimized
│  │ 💾📁🔍  │  │ 💾📁🔍  │          │    Compact actions
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  img 3  │  │  img 4  │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  [Download Best] [Regenerate]      │  ← Stacked buttons
└─────────────────────────────────────┘
```

### **📱 **Tablet Layout (768px - 1023px)**
```
┌─────────────────────────────────────────────────────────┐
│  ← BACK        IMAGE GENERATOR        ⚙️ Templates    │
├─────────────────┬───────────────────────────────────────┤
│  INPUT PANEL    │           RESULTS PANEL                │
│  (320px fixed)   │           (flex-1)                      │
├─────────────────┼───────────────────────────────────────┤
│  + Add Ref       │  ┌─────┐ ┌─────┐ ┌─────┐               │
│  @Image1 @Image2 │  │img1 │ │img2 │ │img3 │  ← 3-col grid     │
│  Prompt...       │  └─────┘ └─────┘ └─────┘               │
│  Type: Char ▼    │  ┌─────┐ ┌─────┐                         │
│  Template...     │  │img4 │ │img5 │                         │
│  🔥 20 Generate  │  └─────┘ └─────┘                         │
│                 │  [Download Best] [Regenerate]           │
└─────────────────┴───────────────────────────────────────┘
```

### **🎨 **Mobile-First CSS Patterns**
```css
/* Mobile-first responsive design */
.image-generator {
  /* Mobile: Single column */
  @media (max-width: 640px) {
    flex-direction: column;
    padding: 1rem;
  }
  
  /* Tablet: Side-by-side */
  @media (min-width: 768px) {
    flex-direction: row;
    padding: 1.5rem;
  }
  
  /* Desktop: Full layout */
  @media (min-width: 1024px) {
    padding: 2rem;
  }
}

.left-panel {
  /* Mobile: Full width */
  @media (max-width: 640px) {
    width: 100%;
    max-width: none;
  }
  
  /* Tablet/Desktop: Fixed width */
  @media (min-width: 768px) {
    width: 380px;
    flex-shrink: 0;
  }
}

.right-panel {
  /* Mobile: Full width */
  @media (max-width: 640px) {
    padding: 1rem;
  }
  
  /* Tablet/Desktop: More padding */
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}

/* Responsive grid for results */
.results-grid {
  /* Mobile: 2 columns */
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  /* Tablet/Desktop: 3 columns */
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}

/* Mobile-optimized buttons */
.generate-button {
  @media (max-width: 640px) {
    padding: 1rem;
    font-size: 1rem;
  }
}

.result-actions {
  /* Mobile: Stack vertically */
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* Mobile: Compact buttons */
  .action-btn {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
}
```

### **📱 **Mobile Touch Interactions**
```typescript
// Mobile-optimized touch handlers
const MobileResultCard = ({ result, index }) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div 
      className="relative aspect-square rounded-lg overflow-hidden"
      onTouchStart={() => setShowActions(true)}
      onTouchEnd={() => setTimeout(() => setShowActions(false), 3000)}
    >
      <img src={result.url} className="w-full h-full object-cover" />
      
      {/* Mobile: Always show actions on touch */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent 
        transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
          <button className="flex-1 py-1 bg-blue-500 text-white text-xs rounded">
            💾
          </button>
          <button className="flex-1 py-1 bg-emerald-500 text-white text-xs rounded">
            📁
          </button>
          <button className="flex-1 py-1 bg-gray-600 text-white text-xs rounded">
            🔍
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile template selector
const MobileTemplateSelector = ({ value, onChange }) => {
  return (
    <div className="px-4 pb-4">
      <label className="block text-xs font-medium text-gray-400 mb-2">
        Type
      </label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'character', label: 'Character', icon: '👤' },
          { id: 'environment', label: 'Environment', icon: '🌍' },
          { id: 'prop', label: 'Prop', icon: '📦' }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`py-3 px-2 rounded-lg text-xs font-medium transition-colors ${
              value === type.id 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            <div className="text-lg mb-1">{type.icon}</div>
            <div>{type.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### **📱 **Mobile Performance Optimizations**
```typescript
// Mobile image loading optimization
const MobileImageCard = ({ result, index }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
      {isInView && (
        <img
          src={result.url}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
    </div>
  );
};

// Mobile gesture handling
const MobileGestureHandler = ({ children }) => {
  const [scale, setScale] = useState(1);
  
  const handlePinchZoom = (e) => {
    e.preventDefault();
    // Implement pinch-to-zoom for mobile
    const distance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    setScale(Math.min(Math.max(distance / 100, 0.5), 3));
  };
  
  return (
    <div
      onTouchMove={handlePinchZoom}
      style={{ transform: `scale(${scale})`, transition: 'transform 0.2s' }}
    >
      {children}
    </div>
  );
};
```

### **📱 **Mobile Navigation & Header**
```typescript
const MobileHeader = ({ onBack, onManageTemplates }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
      <button 
        onClick={onBack}
        className="p-2 text-gray-300 hover:text-white transition-colors"
      >
        ← Back
      </button>
      
      <h1 className="text-lg font-semibold text-white">
        Image Generator
      </h1>
      
      <button 
        onClick={onManageTemplates}
        className="p-2 text-gray-300 hover:text-white transition-colors"
      >
        ⚙️
      </button>
    </div>
  );
};

// Mobile template manager modal
const MobileTemplateManager = ({ isOpen, onClose, templates }) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Templates</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {templates.map(template => (
            <div key={template.id} className="bg-gray-800 rounded-lg p-3">
              <h3 className="font-medium text-white">{template.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{template.type}</p>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                {template.prompt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### **📱 **Mobile Accessibility Features**
```typescript
// Mobile accessibility optimizations
const MobileAccessibility = () => {
  return (
    <>
      {/* Skip to main content for screen readers */}
      <button className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-emerald-500 text-white px-4 py-2 rounded">
        Skip to main content
      </button>
      
      {/* Large touch targets (minimum 44px) */}
      <style jsx>{`
        @media (max-width: 640px) {
          button, a, input, textarea, select {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Prevent zoom on input focus */
        @media (max-width: 640px) {
          input, textarea, select {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
};
```

---

## �🔧 **Technical Implementation**

### **Database Schema Extensions**

#### **New Tables**
```typescript
// Prompt Templates Table (simplified)
promptTemplates: defineTable({
  name: v.string(),
  type: v.union(
    v.literal("character"),
    v.literal("environment"), 
    v.literal("prop")
  ),
  prompt: v.string(),
  companyId: v.string(),
  isPublic: v.boolean(),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
}).index("by_company", ["companyId"])
  .index("by_type", ["type"])
  .index("public_templates", ["isPublic", "type"]),

// AI Generation Jobs Table
ai_generation_jobs: defineTable({
  companyId: v.string(),
  projectId: v.optional(v.id("storyboard_projects")),
  status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
  
  // Generation inputs
  userPrompt: v.string(),
  templateType: v.union(v.literal("character"), v.literal("environment"), v.literal("prop")),
  customTemplate: v.optional(v.string()),
  referenceImageUrl: v.optional(v.string()),
  
  // Job tracking
  retryCount: v.number(),
  errorDetails: v.optional(v.string()),
  priority: v.number(),
  estimatedCompletionTime: v.optional(v.number()),
  progress: v.optional(v.number()),
  
  // Results
  resultUrls: v.array(v.string()),
  creditsUsed: v.number(),
  
  // Timestamps
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
}).index("by_company", ["companyId", "status"])
  .index("by_status", ["status"])
  .index("by_id", ["id"]), // For Convex real-time queries
```

#### **Existing Table Updates**
```typescript
// Update storyboard_elements table
storyboard_elements: defineTable({
  // ... existing fields
  aiGenerated: v.boolean(), // New: Track AI-generated elements
  generationJobId: v.optional(v.id("ai_generation_jobs")), // New: Link to generation job
  referenceImageUrl: v.optional(v.string()), // New: Original reference image
  identityLocked: v.boolean(), // New: Identity consistency flag
  artStyleId: v.optional(v.id("art_styles")), // New: Applied art style
})
### **API Routes**

#### **Image Generation Routes**
```typescript
// /api/ai/generate-image
export async function POST(request: Request) {
  const { userPrompt, templateType, customTemplate, referenceImage } = await request.json();
  
  // 1. Build final prompt
  let finalPrompt = userPrompt;
  if (customTemplate) {
    finalPrompt += '\n\n' + customTemplate;
  } else if (templateType) {
    // Use default template for type (character/environment/prop)
    const defaultTemplate = getDefaultTemplate(templateType);
    finalPrompt += '\n\n' + defaultTemplate;
  }
  
  // 2. Create generation job in Convex (status: processing)
  const job = await createGenerationJob({
    userPrompt,
    templateType,
    customTemplate,
    referenceImageUrl: referenceImage,
    companyId: user.companyId,
    status: "processing",
    creditsUsed: 20 // Fixed cost per generation
  });
  
  // 3. Send to n8n workflow (async - don't wait for result)
  try {
    await callN8nWorkflow({
      webhookUrl: process.env.N8N_IMAGE_ELEMENT_GENERATOR_WEBHOOK_PATH,
      data: {
        jobId: job.id,
        prompt: finalPrompt,
        referenceImage: referenceImage,
        companyId: user.companyId
      }
    });
  } catch (error) {
    // If n8n call fails, update job to failed
    await updateGenerationJob(job.id, {
      status: "failed",
      errorDetails: "Failed to send to n8n: " + error.message
    });
  }
  
  // 4. Return job ID immediately (don't wait for results)
  return Response.json({ 
    success: true, 
    jobId: job.id,
    status: "processing"
  });
}

// /api/ai/job-status
export async function GET(request: Request) {
  const { jobId } = new URL(request.url).searchParams;
  
  const job = await getGenerationJob(jobId);
  return Response.json({ 
    success: true, 
    job: {
      id: job.id,
      status: job.status,
      resultUrls: job.resultUrls,
      error: job.errorDetails,
      creditsUsed: job.creditsUsed
    }
  });
}

// n8n webhook to update job status
// /api/ai/n8n-webhook
export async function POST(request: Request) {
  const { jobId, status, resultUrls, error } = await request.json();
  
  await updateGenerationJob(jobId, {
    status,
    resultUrls: resultUrls || [],
    errorDetails: error,
    completedAt: status === "completed" ? Date.now() : undefined
  });
  
  return Response.json({ success: true });
}
```

#### **ImageGenerator (Convex Real-time Updates)**
```typescript
export function ImageGenerator({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState('');
  const [templateType, setTemplateType] = useState('character'); // character | environment | prop
  const [customTemplate, setCustomTemplate] = useState(''); // User-defined template
  const [references, setReferences] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [results, setResults] = useState([]);
  const [creditCost] = useState(20); // Fixed cost
  
  // Convex will automatically update when job status changes
  const job = useQuery(api.aiGenerationJobs.get, currentJob);
  
  // Update results when job completes (Convex reactive)
  useEffect(() => {
    if (job?.status === 'completed') {
      setResults(job.resultUrls);
      setIsGenerating(false);
      setCurrentJob(null);
    } else if (job?.status === 'failed') {
      console.error('Job failed:', job.errorDetails);
      setIsGenerating(false);
      setCurrentJob(null);
    }
  }, [job]);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setResults([]);
    
    try {
      // Create generation job (async)
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: prompt,
          templateType,
          customTemplate: customTemplate.trim() || undefined,
          referenceImage: references[0]?.url
        })
      });
      
      const { jobId } = await response.json();
      setCurrentJob(jobId); // Convex will automatically track this job
      
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex h-full">
      <LeftPanel
        prompt={prompt}
        onPromptChange={setPrompt}
        templateType={templateType}
        onTemplateTypeChange={setTemplateType}
        customTemplate={customTemplate}
        onCustomTemplateChange={setCustomTemplate}
        references={references}
        onReferencesChange={setReferences}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        creditCost={creditCost}
        projectId={projectId}
      />
      <RightPanel 
        results={results} 
        isGenerating={isGenerating}
        currentJob={currentJob}
        job={job}
      />
    </div>
  );
}
```

#### **LeftPanel (Fixed - With Template Management)**
```typescript
// components/storyboard/ImageGenerator/LeftPanel.tsx
export function LeftPanel({ 
  prompt, onPromptChange,
  templateType, onTemplateTypeChange,
  customTemplate, onCustomTemplateChange,
  references, onReferencesChange,
  onGenerate, isGenerating, creditCost,
  projectId 
}) {
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col h-full border-r overflow-y-auto"
      style={{ background: 'var(--ig-surface)', borderColor: 'var(--ig-border)' }}>

      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--ig-text-muted)' }}>Image Generator</p>
      </div>

      {/* Horizontal reference thumbnails (Kling-style) */}
      <ReferenceRow references={references} onAdd={onReferencesChange}
        onInsertMention={(ref) => onPromptChange(prompt + ` @${ref.label}`)} />

      {/* Template Type Selection */}
      <TemplateTypeSelector value={templateType} onChange={onTemplateTypeChange} />

      {/* @mention prompt */}
      <PromptTextarea value={prompt} onChange={onPromptChange}
        references={references} maxLength={500} />

      {/* Custom Template (text field) */}
      <CustomTemplateInput 
        value={customTemplate} 
        onChange={onCustomTemplateChange}
        placeholder="Optional: Add custom prompt template..."
      />

      {/* Template Management Button */}
      <div className="px-5 pb-4">
        <button
          onClick={() => setShowTemplateManager(true)}
          className="w-full py-2 px-3 rounded-lg text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors"
        >
          ⚙️ Manage Templates
        </button>
      </div>

      {/* Generate CTA pinned to bottom */}
      <div className="mt-auto p-5">
        <GenerateButton onClick={onGenerate} isGenerating={isGenerating}
          creditCost={creditCost} disabled={!prompt.trim()} />
      </div>
      
      {/* Template Manager Modal */}
      {showTemplateManager && (
        <TemplateManager
          projectId={projectId}
          onClose={() => setShowTemplateManager(false)}
          onSuccess={() => {
            // Refresh templates or show success message
            setShowTemplateManager(false);
          }}
        />
      )}
    </div>
  );
}

// Template Manager Modal Component
function TemplateManager({ projectId, onClose, onSuccess }) {
  const [templates, setTemplates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Load templates using Convex
  const allTemplates = useQuery(api.promptTemplates.getByCompany, { companyId: projectId });
  
  useEffect(() => {
    if (allTemplates) {
      setTemplates(allTemplates);
    }
  }, [allTemplates]);
  
  const handleAddTemplate = () => {
    setEditingTemplate({
      name: '',
      type: 'character',
      prompt: '',
      tags: [],
      isPublic: false
    });
    setIsEditing(true);
  };
  
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsEditing(true);
  };
  
  const handleDeleteTemplate = async (templateId) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await callMutation(api.promptTemplates.delete, { id: templateId });
        // Templates will automatically update via Convex
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };
  
  const handleSaveTemplate = async (templateData) => {
    try {
      if (editingTemplate.id) {
        await callMutation(api.promptTemplates.update, { 
          id: editingTemplate.id, 
          ...templateData 
        });
      } else {
        await callMutation(api.promptTemplates.create, {
          ...templateData,
          companyId: projectId,
          createdAt: Date.now()
        });
      }
      setIsEditing(false);
      setEditingTemplate(null);
      onSuccess();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--ig-surface)', borderColor: 'var(--ig-border)' }}>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Manage Templates</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        {isEditing ? (
          <TemplateEditor
            template={editingTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setIsEditing(false);
              setEditingTemplate(null);
            }}
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-300">
                {templates.length} Templates
              </h3>
              <button
                onClick={handleAddTemplate}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                + Add Template
              </button>
            </div>
            
            <div className="space-y-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => handleEditTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({ template, onEdit, onDelete }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-white">{template.name}</h4>
          <span className="text-xs text-gray-400">{template.type}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-300 line-clamp-3">
        {template.prompt}
      </p>
      {template.tags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {template.tags.map((tag, index) => (
            <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Template Editor Component
function TemplateEditor({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: template.name || '',
    type: template.type || 'character',
    prompt: template.prompt || '',
    tags: template.tags?.join(', ') || '',
    isPublic: template.isPublic || false
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Template Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Type
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="character">Character</option>
          <option value="environment">Environment</option>
          <option value="prop">Prop</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Prompt Template
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => setFormData({...formData, prompt: e.target.value})}
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
          placeholder="Enter your prompt template..."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          placeholder="character, fantasy, realistic"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
          className="mr-2"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-300">
          Make this template public (available to all users)
        </label>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Save Template
        </button>
      </div>
    </form>
  );
}

// Helper Components
function TemplateTypeSelector({ value, onChange }) {
  const types = [
    { id: 'character', label: 'Character', icon: '👤' },
    { id: 'environment', label: 'Environment', icon: '🌍' },
    { id: 'prop', label: 'Prop', icon: '📦' }
  ];
  
  return (
    <div className="px-5 pb-4">
      <label className="block text-xs font-medium uppercase tracking-widest mb-2"
        style={{ color: 'var(--ig-text-muted)' }}>Type</label>
      <div className="flex gap-2">
        {types.map(type => (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              value === type.id 
                ? 'bg-emerald-500 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomTemplateInput({ value, onChange, placeholder }) {
  return (
    <div className="px-5 pb-4">
      <label className="block text-xs font-medium uppercase tracking-widest mb-2"
        style={{ color: 'var(--ig-text-muted)' }}>Template (Optional)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-20 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
        maxLength={1000}
      />
      <div className="text-xs text-gray-500 mt-1">
        {value.length}/1000 chars
      </div>
    </div>
  );
}

// ...

#### **🖼️ **RightPanel (Fixed - Convex Real-time)**
```typescript
// components/storyboard/ImageGenerator/RightPanel.tsx
export function RightPanel({ results, isGenerating, currentJob, job }) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <p className="text-xs font-medium uppercase tracking-widest mb-4"
        style={{ color: 'var(--ig-text-muted)' }}>Generated Variations</p>

      {results.length === 0 ? (
        <EmptyState isLoading={isGenerating} currentJob={currentJob} job={job} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {results.map((result, index) => (
              <ImageResultCard key={index} result={result} index={index} />
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => downloadBest(results)}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--ig-accent)', color: 'white' }}>
              Download Best
            </button>
            <button className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--ig-border)', color: 'var(--ig-text-primary)' }}>
              Regenerate
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ isLoading, currentJob, job }) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating images...</p>
          <p className="text-xs text-gray-500 mt-2">
            Status: {job?.status || 'Processing...'}
          </p>
          {currentJob && (
            <p className="text-xs text-gray-500 mt-1">Job ID: {currentJob}</p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No images generated yet</h3>
        <p className="text-gray-500">Write a prompt and click Generate to get started</p>
      </div>
    </div>
  );
}
```

...

### **🎯 **Phase 1: Foundation (Weeks 1-3) - HIGH PRIORITY**
- [ ] **Convex schema** for ai_generation_jobs table
- [ ] **Basic ImageGenerator UI** with two-panel layout
- [ ] **Template type selector** (character/environment/prop)
- [ ] **Custom template text field** implementation
- [ ] **Reference image upload** functionality

### **🎯 **Phase 2: n8n Integration (Weeks 4-5) - HIGH PRIORITY**
- [ ] **Async API routes** (generate-image, n8n-webhook)
- [ ] **n8n workflow** creation and testing
- [ ] **Convex real-time queries** for job status (no polling needed)
- [ ] **Error handling** and retry logic
- [ ] **Credit system** integration (20 credits per generation)
- [ ] **Template management** UI with CRUD operations

### **🎯 **Phase 3: Polish & Testing (Weeks 6-8) - MEDIUM PRIORITY**
- [ ] **Results gallery** with download functionality
- [ ] **Performance optimization** and loading states
- [ ] **User testing** and feedback collection
- [ ] **Bug fixes** and refinements
- [ ] **Documentation** and deployment

### **🎯 **Phase 4: Launch (Weeks 9-10) - LOW PRIORITY**
- [ ] **Production deployment** and monitoring
- [ ] **User training** materials
- [ ] **Future enhancements** planning

---

## 🎯 **Success Criteria**

### **✅ **Technical Success**
- [ ] Successfully generate consistent characters from reference images
- [ ] Generate props and environments with consistency
- [ ] Integrate seamlessly with existing element library
- [ ] Async n8n workflow with webhook updates
- [ ] Job status polling works correctly

### **✅ **User Experience Success**
- [ ] Intuitive reference image upload and processing
- [ ] Simple template type selection (character/environment/prop)
- [ ] Custom template text field works
- [ ] Fast generation with clear progress indicators
- [ ] Mobile-responsive interface

### **✅ **Business Success**
- [ ] Increased element library usage
- [ ] Improved character consistency across storyboards
- [ ] Reduced manual element creation time
- [ ] Enhanced creative capabilities for users
- [ ] Positive user feedback and adoption

---

## 🔧 **Technical Requirements**

### **🔐 **Security & Access Control**
- CompanyId-based access control for all generated content
- Reference image privacy and security
- Art style sharing permissions within organizations
- Credit usage validation and tracking

### **📊 **Performance Requirements**
- Image generation: < 2 minutes per batch
- Reference processing: < 30 seconds
- Art style extraction: < 15 seconds
- UI response time: < 200ms
- Concurrent generation support: 10+ users

### **💾 **Storage Requirements**
- Reference images: R2 storage with automatic cleanup
- Generated images: R2 storage with CDN delivery
- Art style thumbnails: Optimized webp format
- Generation history: 30-day retention

---

## 🚀 **Future Enhancements**

### **🎯 **Advanced Features**
- **3D Model Generation**: Convert 2D references to 3D models
- **Video Generation**: Animated consistent characters
- **Style Transfer**: Apply art styles to existing elements
- **AI Pose Control**: Specify poses and expressions
- **Batch Consistency**: Maintain identity across large batches

### **🔗 **Integrations**
- **External AI Services**: Midjourney, DALL-E, Stable Diffusion
- **3D Software**: Blender, Cinema 4D integration
- **Animation Tools**: After Effects, Character Animator
- **Asset Marketplaces**: Unity Asset Store, Unreal Marketplace

---

## 📞 **Implementation Notes**

### **🎨 **Art Style Categories**

#### **🔧 **Hardcoded System Styles (6 Core Styles)**
Based on your requirements, these styles are hardcoded in the system:

**Realistic Styles:**
1. **Photorealistic**: Real-world photography, documentary style
2. **Cinematic**: Movie-style lighting and dramatic composition

**Stylized Animation:**
3. **Cartoon**: Animated and stylized character art
4. **Anime**: Japanese animation style with expressive features

**Artistic Traditional:**
5. **Watercolor**: Traditional watercolor painting style
6. **Oil Painting**: Classical oil painting technique

**Note**: Gaming styles (Comic Book, Roblox, Minecraft) are available as **custom styles** that users can create, providing more flexibility and reducing system complexity.

#### **🎯 **Two-Part Style Structure**
Each art style has two distinct purposes:

**1. Image Generation Part:**
- Controls visual appearance, lighting, composition
- Defines artistic style and mood
- Applies to single image generation
- Used for storyboard scenes and standalone images

**2. Consistent Element Part:**
- Maintains character/prop/environment identity
- Ensures consistency across multiple generations
- Applies to element library assets
- Used for reusable elements with consistent appearance

**Example:** A "Photorealistic" style can generate:
- **Image Generation**: A single photorealistic scene with specific lighting
- **Consistent Element**: A character that looks photorealistic in any context

#### **💾 **Storage Strategy**
- **System Styles**: Hardcoded, no database storage needed
- **Custom Styles**: Saved to user settings and database
- **Extracted Styles**: Saved from storyboard dialog
- **User Preferences**: Default styles and UI settings stored per user

#### **🎯 **Custom Style Creation**
Users can create unlimited custom styles with:
- Full parameter control (lighting, composition, colors, etc.)
- Custom prompt templates
- Personal style library
- Team sharing capabilities

### **👥 **User Roles**
- **Creators**: Upload references and generate elements
- **Art Directors**: Create and manage art styles
- **Administrators**: Manage credits and system settings

### **🔄 **Workflow Integration**
- Seamless integration with existing storyboard creation
- Automatic art style suggestion during storyboard generation
- One-click element generation from storyboard scenes
- Consistency checking across storyboards

---

## 📋 **Quick Start Guide**

### **🎯 **Week 1: Immediate Actions**

#### **📋 **Day 1-2: Setup Foundation**
```bash
# 1. Create database schema extensions
# Add art_styles table and ai_generation_jobs table
# Update storyboard_elements table with AI generation fields

# 2. Implement hardcoded system styles
# Create SYSTEM_ART_STYLES constant with 6 styles
# Test style loading and preview generation

# 3. Build basic Art Style Selector UI
# Create tabbed interface (System | Custom | Favorites)
# Add style preview and selection functionality
```

#### **📋 **Day 3-5: Style System**
```typescript
// 4. Implement style selection logic
const selectedStyle = SYSTEM_ART_STYLES[styleKey];
const prompt = buildPromptFromStyle(selectedStyle, elementType);

// 5. Create settings storage API
// POST /api/art-styles/settings
// GET /api/art-styles/settings

// 6. Test system styles with sample generations
// Verify each of the 6 styles produces expected results
```

#### **📋 **Day 6-7: Integration Testing**
```typescript
// 7. Test with existing element library
// Verify AI-generated elements can be saved
// Test companyId-based access control

// 8. Prepare for custom style builder
// Design custom style parameter interface
// Plan prompt template system
```

### **🎨 **Technical Quick Start**

#### **🔧 **Core Files to Create**
```typescript
// lib/art-styles.ts - System styles and utilities
// components/storyboard/ArtStyleSelector.tsx - UI component
// components/storyboard/CustomStyleBuilder.tsx - Custom style creator
// app/api/art-styles/settings/route.ts - Settings API
// convex/mutations/artStyles.ts - Database operations
```

#### **📊 **Database Schema Priority**
```sql
-- High Priority (Week 1)
CREATE TABLE art_styles (
  companyId TEXT,
  name TEXT,
  type TEXT, -- 'extracted' | 'custom' | 'preset'
  parameters JSONB,
  thumbnailUrl TEXT,
  isActive BOOLEAN,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Medium Priority (Week 3)
CREATE TABLE ai_generation_jobs (
  companyId TEXT,
  projectId TEXT,
  elementType TEXT, -- 'character' | 'prop' | 'environment'
  status TEXT, -- 'pending' | 'processing' | 'completed' | 'failed'
  artStyleId TEXT,
  prompt TEXT,
  resultUrls JSONB,
  creditsUsed INTEGER,
  createdAt INTEGER,
  completedAt INTEGER
);
```

---

## 📋 **Technical Specifications**

### **🎯 **System Requirements**

#### **🔧 **Development Environment**
```json
{
  "node": ">=18.0.0",
  "next": ">=14.0.0",
  "convex": "^1.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0"
}
```

#### **🌐 **Environment Variables**
```bash
# Existing (already configured)
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-app.convex.site
NEXT_PUBLIC_APP_URL=https://your-domain.com
KIE_AI_API_KEY=your_kie_api_key
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyboardbucket
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev

# New (for AI generation)
N8N_WEBHOOK_URL=https://n8n.srv1010007.hstgr.cloud

N8N_IMAGE_ELEMENT_GENERATOR_WEBHOOK_PATH=https://n8n.srv1010007.hstgr.cloud/webhook-test/17db7375-08b3-461c-9701-58f47b32db99
N8N_API_KEY=your_n8n_api_key
AI_GENERATION_TIMEOUT=120000
MAX_CONCURRENT_GENERATIONS=10
```

### **🎨 **UI Component Specifications**

#### **📱 **Art Style Selector Props**
```typescript
interface ArtStyleSelectorProps {
  projectId: string;
  elementType: 'character' | 'prop' | 'environment';
  selectedStyle?: ArtStyle | null;
  onStyleSelected: (style: ArtStyle) => void;
  showCustomBuilder?: boolean;
  allowSystemStyles?: boolean;
  allowCustomStyles?: boolean;
}
```

#### **🖼️ **Custom Style Builder Props**
```typescript
interface CustomStyleBuilderProps {
  initialStyle?: CustomArtStyle | null;
  onSave: (style: CustomArtStyle) => Promise<void>;
  onClose: () => void;
  mode: 'create' | 'edit';
  elementType?: 'character' | 'prop' | 'environment';
}
```

### **🔄 **API Specifications**

#### **📡 **Art Style Settings API**
```typescript
// GET /api/art-styles/settings
interface GetSettingsResponse {
  success: boolean;
  settings: {
    customStyles: ArtStyle[];
    favoriteStyles: string[];
    defaultCharacterStyle?: string;
    defaultPropStyle?: string;
    defaultEnvironmentStyle?: string;
    uiPreferences: UIPreferences;
  };
}

// POST /api/art-styles/settings
interface UpdateSettingsRequest {
  settings: Partial<UserArtStyleSettings>;
}

// POST /api/art-styles/custom
interface CreateCustomStyleRequest {
  customStyle: Omit<CustomArtStyle, 'id' | 'createdAt' | 'updatedAt'>;
}
```

#### **🤖 **AI Generation API**
```typescript
// POST /api/ai/generate-consistent-character
interface GenerationRequest {
  referenceImage: string; // base64 or URL
  artStyle: ArtStyle;
  elementType: 'character' | 'prop' | 'environment';
  parameters: {
    quantity: number;
    angles?: string[];
    quality: 'draft' | 'standard' | 'high';
    resolution: string;
  };
}

interface GenerationResponse {
  success: boolean;
  results: GeneratedImage[];
  jobId: string;
  creditsUsed: number;
}
```

### **📊 **Performance Specifications**

#### **⚡ **Response Time Targets**
```typescript
const PERFORMANCE_TARGETS = {
  artStyleLoading: 50, // ms
  customStyleCreation: 200, // ms
  referenceImageProcessing: 30000, // ms
  aiGenerationStart: 1000, // ms
  batchGeneration: 120000, // ms (2 minutes)
  uiResponse: 200, // ms
  concurrentUsers: 10
};
```

#### **💾 **Storage Specifications**
```typescript
const STORAGE_LIMITS = {
  referenceImages: {
    maxSize: '10MB',
    retention: '30 days',
    cleanup: 'automatic'
  },
  generatedImages: {
    maxSize: '5MB',
    retention: 'permanent',
    compression: 'webp'
  },
  customStyles: {
    maxPerUser: 50,
    maxNameLength: 100,
    maxDescriptionLength: 500
  }
};
```

---

## 🎯 **Success Metrics & KPIs**

### **📊 **Technical Metrics**
- **Style Loading Time**: < 50ms for system styles
- **Custom Style Creation**: < 200ms average
- **Generation Success Rate**: > 95%
- **API Response Time**: < 200ms average
- **Concurrent Users**: Support 10+ simultaneous

### **👥 **User Engagement Metrics**
- **Style Creation Rate**: Number of custom styles per user
- **Style Usage Distribution**: System vs custom style usage
- **Generation Frequency**: Average generations per user per week
- **Feature Adoption**: % users using custom styles
- **User Retention**: Return usage after 7 days

### **💼 **Business Metrics**
- **Element Library Growth**: % increase in AI-generated elements
- **Time Savings**: Reduction in manual element creation time
- **User Satisfaction**: NPS score for style system
- **Team Collaboration**: % of styles shared within teams
- **Credit Usage**: AI generation credit consumption patterns

---

---

## 🗺️ **Implementation Roadmap**

### **📅 **12-Week Timeline Overview**

#### **🎯 **Phase 1: Foundation (Weeks 1-2)**
```
Week 1: Database & System Styles
├── Monday: Database schema extensions
├── Tuesday: 6 hardcoded styles implementation
├── Wednesday: Basic Art Style Selector UI
├── Thursday: Style preview system
├── Friday: Settings storage API
└── Weekend: Testing and refinement

Week 2: Style System Integration
├── Monday: Tabbed interface (System | Custom | Favorites)
├── Tuesday: Style selection logic
├── Wednesday: User preferences system
├── Thursday: Integration with existing UI
├── Friday: End-to-end testing
└── Weekend: Documentation
```

#### **🎨 **Phase 2: Custom Styles (Weeks 3-4)**
```
Week 3: Custom Style Builder
├── Monday: Parameter control interface
├── Tuesday: Prompt template system
├── Wednesday: Real-time style preview
├── Thursday: Style validation and saving
├── Friday: Custom style gallery
└── Weekend: User testing

Week 4: Advanced Features
├── Monday: Style sharing and collaboration
├── Tuesday: Style mixing capabilities
├── Wednesday: Team permission system
├── Thursday: Style export/import
├── Friday: Performance optimization
└── Weekend: Bug fixes
```

#### **🤖 **Phase 3: AI Generation (Weeks 5-6)**
```
Week 5: Core Generation
├── Monday: Reference image processing
├── Tuesday: n8n workflow integration
├── Wednesday: Basic character generation
├── Thursday: Element library integration
├── Friday: Credit system integration
└── Weekend: Generation testing

Week 6: Advanced Generation
├── Monday: Art style extraction from storyboard
├── Tuesday: Prop and environment generation
├── Wednesday: Batch generation with consistency
├── Thursday: Multi-angle identity sheets
├── Friday: Error handling and retry logic
└── Weekend: Performance tuning
```

#### **🎯 **Phase 4: UI Polish (Weeks 7-8)**
```
Week 7: Advanced UI
├── Monday: Advanced ElementGenerator interface
├── Tuesday: Drag-and-drop functionality
├── Wednesday: Results gallery with editing
├── Thursday: Batch operations
├── Friday: Mobile responsiveness
└── Weekend: UI testing

Week 8: Integration & Polish
├── Monday: Workflow integration testing
├── Tuesday: Cross-platform compatibility
├── Wednesday: Accessibility improvements
├── Thursday: Performance optimization
├── Friday: Security audit
└── Weekend: Final polish
```

#### **🚀 **Phase 5: Testing & Launch (Weeks 9-12)**
```
Week 9-10: Comprehensive Testing
├── User acceptance testing
├── Performance testing
├── Security testing
├── Integration testing
├── Load testing
└── Bug fixing

Week 11-12: Launch & Monitoring
├── Production deployment
├── Monitoring setup
├── User training materials
├── Documentation completion
├── Success metrics tracking
└── Future enhancement planning
```

---

## 📋 **Final Implementation Checklist**

### **✅ **Pre-Implementation Requirements**
- [ ] **Environment Setup**: All required environment variables configured
- [ ] **Database Access**: Convex database access and permissions
- [ ] **n8n Integration**: Workflow URL and API keys configured
- [ ] **R2 Storage**: Bucket access and CDN setup
- [ ] **Credit System**: Integration with existing credit tracking

### **✅ **Technical Implementation**
- [ ] **Database Schema**: art_styles and ai_generation_jobs tables
- [ ] **System Styles**: 6 hardcoded styles with prompts
- [ ] **API Routes**: Settings and generation endpoints
- [ ] **Frontend Components**: ArtStyleSelector and CustomStyleBuilder
- [ ] **Integration**: Element library and storyboard connection

### **✅ **Testing & Quality Assurance**
- [ ] **Unit Tests**: All API routes and database operations
- [ ] **Integration Tests**: End-to-end workflow testing
- [ ] **Performance Tests**: Load testing with concurrent users
- [ ] **User Testing**: Feedback from actual users
- [ ] **Security Tests**: Access control and data privacy

### **✅ **Documentation & Training**
- [ ] **Technical Documentation**: API docs and database schema
- [ ] **User Guide**: Step-by-step usage instructions
- [ ] **Admin Guide**: System management and troubleshooting
- [ ] **Training Materials**: Video tutorials and walkthroughs
- [ ] **FAQ**: Common questions and solutions
- [ ] **Release Notes**: Version history and change log
- [ ] **Glossary**: Definitions of key terms and concepts

---

## 🚀 **Next Steps & Recommendations**

### **🎯 **Immediate Actions (This Week)**
1. **Environment Setup**: Configure all required environment variables
2. **Database Schema**: Create art_styles and ai_generation_jobs tables
3. **System Styles**: Implement the 6 hardcoded styles
4. **Basic UI**: Create initial Art Style Selector component
5. **API Routes**: Set up settings storage endpoints

### **📈 **Medium-term Goals (Next Month)**
1. **Custom Style Builder**: Complete parameter controls and validation
2. **n8n Integration**: Full workflow integration with enhanced parameters
3. **Element Library**: Seamless integration with existing system
4. **User Testing**: Gather feedback from early adopters
5. **Performance**: Optimize for concurrent usage

### **🔮 **Long-term Vision (Next Quarter)**
1. **Advanced Features**: 3D generation, video animation, style transfer
2. **External Integrations**: Midjourney, DALL-E, Stable Diffusion
3. **Mobile App**: Native mobile experience
4. **Enterprise Features**: Advanced team collaboration, analytics
5. **Marketplace**: Community style sharing and templates

---

**This comprehensive plan creates a powerful AI image generation system that extends your existing element library with consistent character, prop, and environment generation capabilities while integrating seamlessly with your n8n workflow and storyboard system. The plan includes detailed technical specifications, implementation roadmap, success metrics, and support resources to ensure successful implementation and long-term success.**