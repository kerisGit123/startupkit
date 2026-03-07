# Video AI Panel - Restructured Design

## 🎯 **Analysis of Current Structure**

Based on your existing VideoAIPanel and inspiration from LTX Studio and JianYing, here's the restructured design focusing on simplicity and effectiveness.

---

## 🏗️ **Optimized Model Strategy**

### **Primary Models (2 Main Options)**

#### **1. Veo-3-1** - Google DeepMind Premium Video Generation
- **Best for**: High-quality text-to-video, image-to-video, reference-to-video
- **Original Cost Pricing**: 
  - **Fast Mode**: 60 credits/video ($0.30) - Quick generation
  - **Quality Mode**: 250 credits/video ($1.25) - Premium quality
- **Customer Price (with 30% profit)**: 
  - **Fast Mode**: 80 credits/video ($0.39)
  - **Quality Mode**: 325 credits/video ($1.63)
- **Duration Limits**: 
  - **Fast Mode**: 8 seconds maximum
  - **Quality Mode**: 8 seconds maximum
- **Reliability**: ⭐⭐⭐⭐⭐ (Google's latest model)
- **Features**: 
  - Text-to-video, image-to-video, reference-to-video
  - Multi-image reference control
  - Synchronized audio output
  - Native 1080p resolution
  - Realistic motion generation
  - Superior motion consistency and quality
  - **Fixed pricing** (not per-second)

#### **2. Kling 3.0 Video** - Kling AI Video Generation
- **Best for**: Multi-shot storytelling with cinematic control
- **Original Cost Pricing**: 
  - **Standard**: 20 credits/s ($0.10) - no audio
  - **Standard**: 30 credits/s ($0.15) - with audio
  - **Pro**: 27 credits/s ($0.135) - no audio
  - **Pro**: 40 credits/s ($0.20) - with audio
- **Customer Price (with 30% profit)**: 
  - **Standard**: 25-40 credits/s ($0.13-0.20)
  - **Pro**: 35-50 credits/s ($0.18-0.26)
- **Reliability**: ⭐⭐⭐⭐ (Established model)
- **Features**: 
  - Text-to-video and image-to-video generation
  - **Multi-shot storytelling support** (multiple scenes in one video)
  - Native audio production
  - Cinematic control options
  - **Max Duration**: 15 seconds per generation
  - Start frame and end frame support
  - Audio integration options
  - Standard and Pro quality tiers
  - **Scene transitions** and **camera movement** control

### **Why These 2 Models?**
1. **Veo-3-1** offers premium quality with fixed pricing
2. **Kling 3.0** provides flexible per-second pricing for cost control
3. **Clear use cases** for each model reduce user confusion
4. **Multiple price points** for different budgets and needs
5. **Simplified complexity** for better user experience

---

## 🎨 **UI Layout Structure (LTX Studio Inspired)**

### **Top Section: Mode Selection**
```
┌─────────────────────────────────────────────────────────────┐
│  [Image to Video]  [Lip Sync]  [Text to Video]             │
└─────────────────────────────────────────────────────────────┘
```

### **Middle Section: Input Area**
```
┌─────────────────────────────────────────────────────────────┐
│  Start Frame (Required)    End Frame (Optional)           │
│  ┌─────────┐                ┌─────────┐                   │
│  │ [Upload]│                │ [Upload] │                   │
│  └─────────┘                └─────────┘                   │
│                                                             │
│  Audio File (for Lip Sync)                                 │
│  ┌─────────┐                                               │
│  │ [Upload] │                                               │
│  └─────────┘                                               │
│                                                             │
│  Prompt Input                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Describe your video...                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### **Bottom Section: Settings & Generate**
```
┌─────────────────────────────────────────────────────────────┐
│ Duration │ Quality │ Resolution │ Aspect Ratio │ Audio │ Model │ [Generate] │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **Component Organization**

### **1. Mode Selection Component**
```typescript
const VIDEO_MODES = [
  { 
    id: "image-to-video", 
    label: "Image to Video", 
    icon: "🎬",
    description: "Convert images to video",
    model: "veo-3-1"
  },
  { 
    id: "text-to-video", 
    label: "Text to Video", 
    icon: "✨",
    description: "Text to video generation",
    model: "veo-3-1"
  },
  { 
    id: "image-to-video-kling", 
    label: "Image to Video (Kling)", 
    icon: "🎥",
    description: "Kling 3.0 video generation",
    model: "kling-3.0/video"
  },
  { 
    id: "text-to-video-kling", 
    label: "Text to Video (Kling)", 
    icon: "📝",
    description: "Kling 3.0 text to video",
    model: "kling-3.0/video"
  },
  { 
    id: "multi-shot-kling", 
    label: "Multi-Shot (Kling)", 
    icon: "🎬",
    description: "Kling 3.0 multi-shot storytelling",
    model: "kling-3.0/video"
  }
];
```

### **2. Input Components**

#### **Start Frame Upload (Required)**
- Always visible for all modes
- Large upload area with preview
- Drag & drop support
- Image validation

#### **End Frame Upload (Optional)**
- Only shown for image-to-video
- Smaller upload area
- Clear "optional" labeling
- Same validation as start frame

#### **Audio Upload (Lip Sync Mode)**
- Only shown in lip sync mode
- Audio file validation
- Waveform preview
- Duration display

#### **Prompt Input**
- Expandable textarea
- Character limit
- Smart suggestions
- Multi-language support

### **3. Settings Controls**

#### **Duration Selector**
```typescript
const DURATION_OPTIONS = [
  { value: 5, label: "5s", credits: 100 },
  { value: 10, label: "10s", credits: 200 },
  { value: 15, label: "15s", credits: 300 }
];
```

#### **Resolution Selector**
```typescript
const RESOLUTION_OPTIONS = [
  { value: "720p", label: "HD 720p", multiplier: 1 },
  { value: "1080p", label: "Full HD 1080p", multiplier: 1.5 },
  { value: "4k", label: "4K Ultra", multiplier: 2 }
];
```

#### **Aspect Ratio Selector**
```typescript
const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "Landscape", icon: "▭" },
  { value: "9:16", label: "Portrait", icon: "▯" },
  { value: "1:1", label: "Square", icon: "◻" }
];
```

#### **Quality Mode Selector (Veo-3-1 only)**
```typescript
const QUALITY_OPTIONS = [
  { value: "fast", label: "Fast", credits: 60, description: "Quick generation" },
  { value: "quality", label: "Quality", credits: 250, description: "Premium quality" }
];
```

#### **Audio Toggle**
- Simple on/off switch
- Shows credit impact
- Updates pricing in real-time

#### **Model Display**
- Auto-selected based on mode
- Shows current model info
- Manual override option for advanced users

---

## 💰 **Pricing Integration**

```typescript
const calculateCredits = (duration, resolution, hasAudio, model, qualityMode = "fast", klingTier = "standard") => {
  let baseCredits = 0;
  
  // Your profit margin factor (1.3 = 30% profit)
  const PROFIT_FACTOR = 1.3;
  
  // Veo-3-1 pricing (fixed per video, not per second)
  if (model === "veo-3-1") {
    baseCredits = qualityMode === "quality" ? 250 : 60; // Your cost: $1.25 or $0.30 per video
    // Both Fast and Quality modes have 8-second duration limit
    duration = Math.min(duration, 8);
  } else if (model === "kling-3.0/video") {
    // Kling 3.0 pricing (per second) - UPDATED with correct original pricing
    if (klingTier === "standard") {
      baseCredits = duration * (hasAudio ? 30 : 20); // Your cost: $0.15 or $0.10 per second
    } else if (klingTier === "pro") {
      baseCredits = duration * (hasAudio ? 40 : 27); // Your cost: $0.20 or $0.135 per second
    }
    // Max 15 seconds for Kling 3.0
    duration = Math.min(duration, 15);
  }
  
  // Apply profit margin
  let finalCredits = baseCredits * PROFIT_FACTOR;
  
  // Apply multiplier first, THEN round to nearest 5
  let resolutionMultiplier = 1;
  if (model === "veo-3-1" && resolution === "4k") {
    resolutionMultiplier = 2; // 4K costs 2x credits for Veo-3-1
  }
  finalCredits = baseCredits * PROFIT_FACTOR * resolutionMultiplier;
  
  // Round to nearest 0 or 5 (e.g., 14 → 15, 17 → 20, 12 → 10)
  finalCredits = Math.round(finalCredits / 5) * 5;
  
  return finalCredits;
};
```

### **Real-time Price Display**
- Shows credits needed
- Shows USD equivalent
## 🔧 **API Implementation Guide**

### **Kling 3.0 API Call Example:**
```typescript
const generateKlingVideo = async (params) => {
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      callBackUrl: params.callBackUrl || 'https://your-domain.com/api/callback',
      input: {
        mode: params.klingTier === "pro" ? "pro" : "std",
        image_urls: [params.startFrame, params.endFrame].filter(Boolean),
        sound: params.audioEnabled,
        duration: params.duration.toString(),
        aspect_ratio: params.aspectRatio,
        multi_shots: params.mode === "multi-shot-kling",
        prompt: params.prompt,
        kling_elements: params.elements || []
      }
    })
  });
  return response.json();
};
```

### **Kling 3.0 Multi-Shot API Example:**
```typescript
const generateKlingMultiShot = async (params) => {
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      callBackUrl: params.callBackUrl || 'https://your-domain.com/api/callback',
      input: {
        mode: params.klingTier === "pro" ? "pro" : "std",
        image_urls: params.sceneImages || [],
        sound: params.audioEnabled,
        duration: params.duration.toString(),
        aspect_ratio: params.aspectRatio,
        multi_shots: true, // Enable multi-shot mode
        multi_prompt: params.multiPrompts || [], // Array of prompts for each scene
        kling_elements: params.elements || []
      }
    })
  });
  return response.json();
};
```

### **Kling Elements Structure:**
```typescript
// Example element definitions
const klingElements = [
  {
    name: "element_dog",
    description: "A friendly golden retriever",
    element_input_urls: [
      "https://example.com/dog1.jpg",
      "https://example.com/dog2.jpg",
      "https://example.com/dog3.jpg"
    ]
  },
  {
    name: "element_scene",
    description: "Mountain landscape background",
    element_input_urls: [
      "https://example.com/mountain1.jpg",
      "https://example.com/mountain2.jpg"
    ]
  },
  {
    name: "element_character_video",
    description: "Walking character animation",
    element_input_video_urls: [
      "https://example.com/character_walk.mp4"
    ]
  }
];

// Usage in prompt
const prompt = "In a bright rehearsal room, sunlight streams through the window @element_dog runs across the floor while @element_scene provides the background";
```

### **Veo-3.1 API Call Example:**
```typescript
const generateVeoVideo = async (params) => {
  const API_KEY = process.env.KIE_AI_API_KEY;

  const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: params.prompt,
      imageUrls: [params.startFrame, params.endFrame].filter(Boolean),
      model: params.qualityMode === "quality" ? "veo3_quality" : "veo3_fast",
      watermark: params.watermark || "MyBrand",
      callBackUrl: params.callBackUrl || 'https://your-domain.com/api/callback',
      aspect_ratio: params.aspectRatio,
      seeds: params.seed || 12345,
      enableFallback: params.enableFallback || false,
      enableTranslation: params.enableTranslation !== false,
      generationType: params.startFrame ? "REFERENCE_2_VIDEO" : "TEXT_TO_VIDEO"
    })
  });

  const result = await response.json();
  console.log('Veo-3.1 task created:', result);
  return result;
};
```

### **Veo-3.1 API Parameters:**
```typescript
// Complete Veo-3.1 API structure
{
  prompt: "A dog playing in a park",                    // Required: Text description
  imageUrls: [                                         // Optional: Reference images
    "http://example.com/image1.jpg",
    "http://example.com/image2.jpg"
  ],
  model: "veo3_fast" | "veo3_quality",                // Required: Model selection
  watermark: "MyBrand",                               // Optional: Watermark text
  callBackUrl: "http://your-callback-url.com/complete", // Optional: Webhook URL
  aspect_ratio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4", // Optional: Video aspect ratio
  seeds: 12345,                                        // Optional: Random seed for reproducibility
  enableFallback: false,                               // Optional: Use fallback model if needed
  enableTranslation: true,                            // Optional: Auto-translate prompt
  generationType: "TEXT_TO_VIDEO" | "IMAGE_TO_VIDEO" | "REFERENCE_2_VIDEO" // Required: Generation type
}
```

### **Key API Differences:**

| Feature | Kling 3.0 | Veo-3.1 |
|---------|-----------|-----------|
| **Duration** | Per-second (max 15s) | Fixed (max 8s) |
| **Pricing** | Credits per second | Fixed per video |
| **Audio** | Native audio included | Synchronized audio |
| **Start/End Frames** | imageUrls array | imageUrls array |
| **Aspect Ratio** | Optional (auto from images) | Required parameter |
| **Quality Control** | generation_mode | model parameter |

---

## 🎯 **Component Structure**

### **Main VideoAIPanel Component**
```typescript
export function VideoAIPanel() {
  const [mode, setMode] = useState("image-to-video");
  const [startFrame, setStartFrame] = useState(null);
  const [endFrame, setEndFrame] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [qualityMode, setQualityMode] = useState("fast"); // Fast or Quality mode
  
  const currentModel = VIDEO_MODES.find(m => m.id === mode)?.model;
  const requiredCredits = calculateCredits(duration, resolution, audioEnabled, currentModel, qualityMode);
  
  return (
    <div className="video-ai-panel">
      <ModeSelector mode={mode} onModeChange={setMode} />
      <InputArea 
        mode={mode}
        startFrame={startFrame}
        endFrame={endFrame}
        audioFile={audioFile}
        prompt={prompt}
        onStartFrameChange={setStartFrame}
        onEndFrameChange={setEndFrame}
        onAudioFileChange={setAudioFile}
        onPromptChange={setPrompt}
      />
      <SettingsBar
        duration={duration}
        resolution={resolution}
        aspectRatio={aspectRatio}
        audioEnabled={audioEnabled}
        qualityMode={qualityMode}
        onDurationChange={setDuration}
        onResolutionChange={setResolution}
        onAspectRatioChange={setAspectRatio}
        onAudioToggle={setAudioEnabled}
        onQualityChange={setQualityMode}
        mode={mode}
      />
      <GenerateButton 
        credits={requiredCredits}
        disabled={!startFrame || !prompt}
        onGenerate={() => handleGenerate()}
      />
    </div>
  );
}
```

### **InputArea Component**
```typescript
function InputArea({ mode, startFrame, endFrame, audioFile, prompt, ...handlers }) {
  return (
    <div className="input-area">
      <div className="frame-uploads">
        <FrameUpload 
          label="Start Frame"
          required={true}
          value={startFrame}
          onChange={handlers.onStartFrameChange}
        />
        {mode === "image-to-video" && (
          <FrameUpload 
            label="End Frame"
            required={false}
            value={endFrame}
            onChange={handlers.onEndFrameChange}
          />
        )}
      </div>
      
      {mode === "lip-sync" && (
        <AudioUpload 
          value={audioFile}
          onChange={handlers.onAudioFileChange}
        />
      )}
      
      <PromptInput 
        value={prompt}
        onChange={handlers.onPromptChange}
        placeholder={getPromptPlaceholder(mode)}
      />
    </div>
  );
}
```

---

## 🎨 **Styling Guidelines (LTX Studio Inspired)**

### **Color Scheme**
- **Primary**: Purple gradient (#6B46C1 to #EC4899)
- **Background**: Dark with glassmorphism
- **Text**: White/Gray variants
- **Borders**: Subtle white/10% with blur

### **Component Style**
- **Rounded corners**: 12px-16px
- **Spacing**: 16px-24px gaps
- **Typography**: Clean, minimal
- **Animations**: Smooth transitions
- **Hover states**: Subtle glow effects

### **Layout Principles**
- **Left-to-right flow**: Natural reading order
- **Visual hierarchy**: Clear importance levels
- **Responsive design**: Mobile-friendly
- **Accessibility**: High contrast, clear labels

---

## 🔄 **User Flow**

### **Image to Video Mode**
1. Upload start frame (required)
2. Optionally upload end frame
3. Enter prompt
4. Adjust settings
5. Generate

### **Lip Sync Mode**
1. Upload character image
2. Upload audio file
3. Adjust settings
4. Generate

### **Text to Video Mode**
1. Enter detailed prompt
2. Adjust settings
3. Generate

---

## 🚀 **Implementation Benefits**

### **Simplified User Experience**
- Only 2 models to choose from
- Clear mode-based workflows
- Intuitive input organization
- Real-time pricing feedback

### **Technical Advantages**
- Reduced API complexity
- Easier maintenance
- Better performance
- Cleaner codebase

### **Business Benefits**
- Clearer pricing structure
- Higher conversion rates
- Better user retention
- Reduced support requests

---

## 📊 **Success Metrics**

### **User Experience**
- Reduced time to generate (target: <2 minutes)
- Higher completion rates (target: >85%)
- Better user satisfaction (target: >4.5/5)

### **Business Metrics**
- Increased credit usage
- Lower support tickets
- Higher user retention
- Better conversion rates

---

## **Kie AI API Implementation Guide**

### **API Access Setup**

1. **Get API Key:**
   - Sign up at [Kie AI](https://kie.ai)
   - Navigate to API settings
   - Generate your API key
   - Store securely in environment variables

2. **Environment Configuration:**
```typescript
// .env.local
KIE_AI_API_KEY=your_api_key_here
KIE_AI_CALLBACK_URL=https://your-domain.com/api/callback
```

### **Complete API Implementation**

#### **1. Basic Kling 3.0 Video Generation**
```typescript
const generateKlingVideo = async (params) => {
  const API_KEY = process.env.KIE_AI_API_KEY;
  const CALLBACK_URL = process.env.KIE_AI_CALLBACK_URL;

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      callBackUrl: CALLBACK_URL,
      input: {
        mode: params.klingTier === "pro" ? "pro" : "std",
        image_urls: [params.startFrame, params.endFrame].filter(Boolean),
        sound: params.audioEnabled,
        duration: params.duration.toString(),
        aspect_ratio: params.aspectRatio,
        multi_shots: false,
        prompt: params.prompt,
        kling_elements: params.elements || []
      }
    })
  });

  const result = await response.json();
  console.log('Kling 3.0 task created:', result);
  return result;
};
```

#### **2. Multi-Shot Video Generation**
```typescript
const generateKlingMultiShot = async (params) => {
  const API_KEY = process.env.KIE_AI_API_KEY;
  const CALLBACK_URL = process.env.KIE_AI_CALLBACK_URL;

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      callBackUrl: CALLBACK_URL,
      input: {
        mode: params.klingTier === "pro" ? "pro" : "std",
        image_urls: params.sceneImages || [],
        sound: params.audioEnabled,
        duration: params.duration.toString(),
        aspect_ratio: params.aspectRatio,
        multi_shots: true,
        multi_prompt: params.multiPrompts || [
          "Scene 1: @element_character enters the room",
          "Scene 2: @element_character looks out the window",
          "Scene 3: @element_character sits down at the table"
        ],
        kling_elements: params.elements || []
      }
    })
  });

  const result = await response.json();
  console.log('Kling 3.0 multi-shot task created:', result);
  return result;
};
```

#### **3. Callback Handler**
```typescript
// /api/callback/route.ts
export async function POST(request: Request) {
  const data = await request.json();
  
  console.log('Kling AI callback:', data);
  
  // Handle completion
  if (data.status === 'completed') {
    // Save video URL to database
    // Notify user via WebSocket/email
    // Update UI state
  }
  
  return Response.json({ received: true });
}
```

#### **4. Check Job Status**
```typescript
const checkJobStatus = async (taskId: string) => {
  const API_KEY = process.env.KIE_AI_API_KEY;
  
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  
  const result = await response.json();
  return result;
};
```

### **Usage Examples**

#### **Single Shot with Elements:**
```typescript
const result = await generateKlingVideo({
  klingTier: "pro",
  startFrame: "https://example.com/room.jpg",
  audioEnabled: true,
  duration: 8,
  aspectRatio: "16:9",
  prompt: "In a bright rehearsal room, sunlight streams through the window @element_dog runs across the floor",
  elements: [
    {
      name: "element_dog",
      description: "A friendly golden retriever",
      element_input_urls: [
        "https://example.com/dog1.jpg",
        "https://example.com/dog2.jpg"
      ]
    }
  ]
});
```

#### **Multi-Shot Storytelling:**
```typescript
const result = await generateKlingMultiShot({
  klingTier: "pro",
  audioEnabled: true,
  duration: 15,
  aspectRatio: "16:9",
  multiPrompts: [
    "Scene 1: @element_hero stands at the mountain peak @element_landscape",
    "Scene 2: @element_hero begins the descent through the forest",
    "Scene 3: @element_hero reaches the cabin at sunset"
  ],
  elements: [
    {
      name: "element_hero",
      description: "Main character",
      element_input_urls: [
        "https://example.com/hero1.jpg",
        "https://example.com/hero2.jpg",
        "https://example.com/hero3.jpg"
      ]
    },
    {
      name: "element_landscape",
      description: "Mountain landscape",
      element_input_urls: [
        "https://example.com/mountain1.jpg",
        "https://example.com/mountain2.jpg"
      ]
    }
  ]
});
```

### **Response Format**
```typescript
// Task creation response
{
  "code": 200,
  "msg": "success", 
  "data": {
    "taskId": "kling_task_abcdef123456"
  }
}

// Status check response
{
  "code": 200,
  "data": {
    "taskId": "kling_task_abcdef123456",
    "status": "completed", // pending, processing, completed, failed
    "result": {
      "video_url": "https://cdn.kie.ai/videos/abc123.mp4",
      "thumbnail_url": "https://cdn.kie.ai/thumbnails/abc123.jpg"
    }
  }
}
```

### **Important Notes**

1. **Duration Format:** Must be string (`"5"`, not `5`)
2. **Image Requirements:** Min 300x300px, max 10MB each
3. **Video Elements:** Max 50MB, MP4/MOV format
4. **Element Limits:** 2-4 images per element, 1 video per element
5. **Callback URL:** Must be publicly accessible
6. **Job Polling:** Check status every 30 seconds if not using callbacks

### **Interface Insights (Based on Kie AI Dashboard)**

#### **Multi-Shot Mode Features:**
- **Timeline Editor**: Visual scene sequencing
- **Multiple Prompt Inputs**: Separate prompts for each scene
- **Scene Transitions**: Automatic transitions between scenes
- **Element Persistence**: Elements maintain consistency across scenes

#### **Element Creation Features:**
- **Video Elements**: Upload 1 video file (MP4/MOV, max 50MB)
- **Image Elements**: Upload 2-4 reference images (300x300px min, 10MB max each)
- **Element Naming**: Use @element_name syntax in prompts
- **Element Descriptions**: Help AI understand element context

#### **Single vs Multi-Shot:**
- **Single Mode**: `multi_shots: false` + `prompt: "single description"`
- **Multi-Shot Mode**: `multi_shots: true` + `multi_prompt: ["scene1", "scene2", "scene3"]`

---

This restructured design follows LTX Studio's clean, focused approach while maintaining the powerful features your users need. The simplified model selection and intuitive layout will significantly improve the user experience.