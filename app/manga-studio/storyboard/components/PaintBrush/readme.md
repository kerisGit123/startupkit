Let me analyze your current AI model integration and data flow. I'll examine your codebase to understand how the model AI system works.











Perfect! Now I understand your AI model integration architecture. Let me break down the complete data flow:

## 🔄 **AI Model Data Flow Architecture**

### **📊 **Current Architecture Overview:**

```
SceneEditor (Frontend) 
    ↓ [onGenerate trigger]
ImageAIPanel.tsx (UI Controls)
    ↓ [fetch POST]
/api/n8n-image-proxy/route.ts (Next.js API Route)
    ↓ [Model Configuration & Processing]
KIE AI API (External AI Service)
    ↓ [Generated Image]
SceneEditor (Display Result)
```

---

## 🏗️ **Code File Locations & Responsibilities**

### **1. Frontend Components:**
```
/app/manga-studio/storyboard/components/
├── SceneEditor.tsx              ← Main editor, contains onGenerate functions
├── ImageAIPanel.tsx             ← UI controls, model selection, tools
└── CanvasArea.tsx               ← Canvas editing interface
```

### **2. Backend API Route:**
```
/app/api/
└── n8n-image-proxy/
    └── route.ts                 ← Main AI processing logic
```

### **3. Model Configuration:**
```
/app/api/n8n-image-proxy/route.ts (lines 32-418)
├── MODEL_CONFIGS object         ← All AI model definitions
├── Model mapping functions       ← Frontend → KIE API model conversion
└── Request building logic        ← API request construction
```

---

## 🎯 **Detailed Data Flow**

### **Step 1: User Interaction (SceneEditor.tsx)**
```typescript
// Lines 2939-1101 in SceneEditor.tsx
onGenerate={async () => {
  console.log("Generate with mode:", aiEditMode, "model:", aiModel);
  
  // Prepare request body
  const proxyBody = {
    model: aiModel,                    // Selected AI model
    prompt: inpaintPrompt,             // User text prompt
    image: baseImage,                  // Base64 image (if needed)
    referenceImages: refImages,        // Reference images array
    aspectRatio: activeShot?.aspectRatio
  };
  
  // Send to API route
  const proxyRes = await fetch("/api/n8n-image-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proxyBody),
  });
}}
```

### **Step 2: API Route Processing (n8n-image-proxy/route.ts)**
```typescript
// Lines 1450-1549 in route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model: frontendModel, prompt, image, referenceImages } = body;
    
    // Get model configuration
    const config = getModelConfig(frontendModel);
    const kieModel = MODEL_MAP[frontendModel];
    
    // Process images (base64 → URL)
    const imageUrl = image ? await uploadToTemp(image) : null;
    const refUrls = referenceImages ? await Promise.all(
      referenceImages.map((img: string) => uploadToTemp(img))
    ) : [];
    
    // Call appropriate AI model
    if (kieModel === "ideogram/character-edit") {
      // Character Edit with mask support
      resultUrl = await callCharacterEditModel(...);
    } else {
      // Generic Market API models
      resultUrl = await callMarketModel(...);
    }
    
    return NextResponse.json({ image: resultUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### **Step 3: Model Configuration (Lines 32-418)**
```typescript
const MODEL_CONFIGS: Record<string, KieModelConfig> = {
  'nano-banana-2': {
    frontendModel: 'nano-banana-2',
    kieApiModel: 'nano-banana-2',
    displayName: 'Nano Banana 2',
    family: 'nano-banana',
    capabilities: ['image-to-image', 'multi-reference'],
    refMode: 'multi',
    supportsImages: true,
    supportsMultipleReferences: true,
    requestTemplate: {
      required: ['prompt'],
      optional: ['image_urls', 'aspect_ratio'],
      excluded: []
    }
  },
  // ... 20+ more models
};
```

---

## 🔧 **Key Processing Steps**

### **1. Model Selection & Validation:**
- **Frontend**: User selects model from ImageAIPanel dropdown
- **Backend**: Validates model capabilities vs. user input
- **Mapping**: Converts frontend model ID → KIE API model ID

### **2. Image Processing:**
```typescript
// Base64 → Public URL conversion
async function uploadToTemp(base64DataUrl: string): Promise<string> {
  const base64 = base64DataUrl.split(",")[1];
  return await uploadBase64ToFreeImage(base64);
}

// Upload to freeimage.host API
const res = await fetch("https://freeimage.host/api/1/upload", {
  method: "POST",
  body: formData,
});
```

### **3. API Request Building:**
```typescript
// Model-specific request construction
async function buildRequestFromConfig(config: KieModelConfig, params) {
  const request = {};
  
  // Add required fields based on model template
  config.requestTemplate.required.forEach(field => {
    switch (field) {
      case 'prompt': request.prompt = params.prompt; break;
      case 'image_urls': request.image_urls = allUrls; break;
      // ... more field mappings
    }
  });
  
  return request;
}
```

### **4. AI Model Calling:**
```typescript
// Different endpoints for different model families
const KIE_CREATE_URL   = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_FLUX_URL     = "https://api.kie.ai/api/v1/flux/kontext/generate";
const KIE_CHARACTER_URL = "https://api.kie.ai/api/v1/ideogram-character/createTask";
```

### **5. Result Polling:**
```typescript
// Poll for completion (5-minute timeout)
async function pollMarket(taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`${KIE_POLL_URL}?taskId=${taskId}`);
    if (data.successFlag === 1) return data.resultImageUrl;
    await sleep(5000);
  }
}
```

---

## 🎯 **Where the Code Lives**

### **Main Files:**
1. **[/app/manga-studio/storyboard/components/SceneEditor.tsx](cci:7://file:///d:/gemini/startupkit/app/manga-studio/storyboard/components/SceneEditor.tsx:0:0-0:0)**
   - Lines 2939-1101: Main `onGenerate` function
   - Lines 1050-1100: API call to n8n-image-proxy
   - Lines 1800-1850: Rectangle inpaint logic
   - Lines 2400-2450: Character edit logic

2. **[/app/manga-studio/storyboard/components/ImageAIPanel.tsx](cci:7://file:///d:/gemini/startupkit/app/manga-studio/storyboard/components/ImageAIPanel.tsx:0:0-0:0)**
   - Lines 65-75: Available AI models list
   - Lines 176-198: Model options for different tools
   - Lines 307-438: Tool selection logic

3. **[/app/api/n8n-image-proxy/route.ts](cci:7://file:///d:/gemini/startupkit/app/api/n8n-image-proxy/route.ts:0:0-0:0)**
   - Lines 32-418: Model configurations
   - Lines 1450-1549: Main POST handler
   - Lines 880-908: Market API calling logic
   - Lines 735-830: Polling functions

### **Key Functions:**
- **`onGenerate()`** - SceneEditor.tsx (trigger)
- **[POST()](cci:1://file:///d:/gemini/startupkit/app/api/n8n-image-proxy/route.ts:1038:0-1546:1)** - route.ts (main processor)
- **[callMarketModel()](cci:1://file:///d:/gemini/startupkit/app/api/n8n-image-proxy/route.ts:879:0-907:1)** - route.ts (AI caller)
- **[pollMarket()](cci:1://file:///d:/gemini/startupkit/app/api/n8n-image-proxy/route.ts:734:0-775:1)** - route.ts (result polling)

---

## 🚀 **Summary**

Your AI model system works as:

1. **User** selects model & inputs prompt in ImageAIPanel
2. **SceneEditor** calls `onGenerate()` → sends request to `/api/n8n-image-proxy`
3. **API Route** processes images, validates model, builds request
4. **KIE AI** processes the request using selected model
5. **Polling** waits for completion (up to 5 minutes)
6. **Result** returns as public URL → displayed in SceneEditor

The "n8n" in the route name suggests it was originally designed to work with n8n workflows, but currently it directly calls the KIE AI API! 🎯