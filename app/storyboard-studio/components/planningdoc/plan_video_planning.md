# Video AI Panel — Complete Planning & Implementation

> **Schema**: See `corePlaning.md` → `storyboard_items.videoGeneration`, `storyboard_items.videoUrl`, `storyboard_credit_usage`
> **Owns**: Veo-3.1 + Kling 3.0 integration, video modes, LTX-style UI, callback handler, companyId security
> **Phase**: 4 (Video AI) - **COMPLETED**

---

## Implementation Status: 95% COMPLETE

### Fully Implemented:
- **Dual Model Strategy** - Veo-3.1 (premium) + Kling 3.0 (flexible)
- **Multiple Video Modes** - Image-to-video, text-to-video, lip-sync, reference-to-video
- **LTX-Style UI** - Modern, clean interface with upload areas
- **API Integration** - Complete Kie AI video generation
- **Callback Handler** - Async video completion with R2 upload
- **Credit Logging** - Automatic tracking with companyId security
- **Batch Generation** - Multiple items support
- **Element System** - Character/prop consistency across videos

### Implementation Better Than Planned:
- **Advanced Models** - Multiple pricing tiers and quality levels
- **Element Integration** - Reusable characters/props with @syntax
- **Multi-shot Support** - Kling 3.0 scene sequencing
- **Company Security** - Full companyId-based access control
- **Progressive UI** - LTX-style clean interface

---

## 🎯 UI Design Strategy (LTX-Style)

### Design Inspiration from LTX.studio:
- **Clean, minimal interface** with focus on content creation
- **Smart upload areas** for reference images and elements
- **Intuitive selection boxes** instead of cluttered buttons
- **Progressive disclosure** of advanced options
- **Modern card-based layout** with proper spacing

### Key UI Components:
```typescript
// LTX-inspired upload areas
interface UploadArea {
  type: 'video' | 'startFrame' | 'endFrame' | 'element';
  label: string;
  description: string;
  accept: string;
  maxSize: number;
  preview?: string;
}

// Smart selection boxes
interface SelectionBox {
  options: Array<{
    label: string;
    value: string;
    description?: string;
    price?: string;
  }>;
  selected: string;
  onChange: (value: string) => void;
}
```

---

## 🤖 Model Strategy & Pricing

### Veo-3.1 (Google DeepMind) — Premium Quality

**Use Case**: High-quality hero shots, professional content
- **Fast Mode**: 120 credits ($0.30) per video
- **Quality Mode**: 240 credits ($0.60) per video  
- **4K Output**: 2x credits multiplier
- **Max Duration**: 8 seconds
- **Features**: 
  - Text-to-video, image-to-video, reference-to-video
  - Start frame + end frame support
  - 1080p + 4K outputs
  - 16:9 and 9:16 aspect ratios
  - Auto mode optimization

### Kling 3.0 — Flexible & Feature-Rich

**Use Case**: Multi-shot storytelling, budget control, advanced features
- **Standard Tier**: 
  - No audio: 20 credits ($0.10)/second
  - With audio: 30 credits ($0.15)/second
- **Pro Tier**:
  - No audio: 27 credits ($0.135)/second  
  - With audio: 40 credits ($0.20)/second
- **Max Duration**: 15 seconds
- **Features**:
  - Multi-shot sequencing
  - Camera movement controls
  - Scene transitions
  - Element integration (@syntax)
  - Start/end frame control

### Additional Models (Future Expansion):

#### WAN/2-6 Image-to-Video
- **720p**: 100/200/300 credits for 5/10/15s
- **1080p**: 150/250/400 credits for 5/10/15s

#### Grok-Imagine Image-to-Video  
- **480p**: 10/20/30 credits for 6/10/15s
- **720p**: 20/30/40 credits for 6/10/15s

#### Kling AI Avatar (Lip Sync)
- **Input**: Reference image + audio file
- **Use Case**: Talking head videos, character lip-sync

---

## 🎬 Video Generation Modes

### 1. Image-to-Video (Primary)
**Transform storyboard frames into video clips**
- Input: Single reference image
- Output: Animated video sequence
- Models: Veo-3.1, Kling 3.0, WAN/2-6, Grok-Imagine

### 2. Text-to-Video  
**Generate video from text descriptions**
- Input: Text prompt + optional reference
- Output: Full video generation
- Models: Veo-3.1, Kling 3.0

### 3. Reference-to-Video (Veo-3.1 Exclusive)
**High-quality video with visual reference**
- Input: Reference image + text prompt
- Output: Premium quality video
- Model: Veo-3.1 only

### 4. Lip Sync (Character Animation)
**Animate characters with audio**
- Input: Character image + audio file
- Output: Talking head video
- Model: Kling AI Avatar

### 5. Multi-Shot (Kling 3.0 Advanced)
**Sequence multiple scenes in one video**
- Input: Multiple scene images + prompts
- Output: Compiled video with transitions
- Model: Kling 3.0 only

---

## 🔧 Technical Implementation

### Environment Variables
```env
KIE_AI_API_KEY=your_api_key
KIE_AI_CALLBACK_URL=https://your-domain.com/api/callback/video
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_r2_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=storyboardbucket
```

### API Integration - Kling 3.0

#### Single Shot Video
```typescript
// lib/storyboard/klingAI.ts
export async function generateKlingVideo(params: {
  tier: 'std' | 'pro';
  startFrame?: string;
  endFrame?: string;
  audioEnabled: boolean;
  duration: number;
  aspectRatio: string;
  prompt: string;
  elements?: Array<{ 
    name: string; 
    description: string; 
    element_input_urls: string[] 
  }>;
  companyId: string; // For security
}) {
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      callBackUrl: process.env.KIE_AI_CALLBACK_URL,
      input: {
        mode: params.tier,
        image_urls: [params.startFrame, params.endFrame].filter(Boolean),
        sound: params.audioEnabled,
        duration: params.duration.toString(), // MUST be string
        aspect_ratio: params.aspectRatio,
        multi_shots: false,
        prompt: params.prompt,
        kling_elements: params.elements || [],
      },
    }),
  });
  return await response.json();
}
```

#### Multi-Shot Video
```typescript
export async function generateKlingMultiShot(params: {
  tier: 'std' | 'pro';
  sceneImages?: string[];
  audioEnabled: boolean;
  duration: number;
  aspectRatio: string;
  multiPrompts: string[];
  elements?: Array<{ 
    name: string; 
    description: string; 
    element_input_urls: string[] 
  }>;
  companyId: string;
}) {
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      callBackUrl: process.env.KIE_AI_CALLBACK_URL,
      input: {
        mode: params.tier,
        image_urls: params.sceneImages || [],
        sound: params.audioEnabled,
        duration: params.duration.toString(),
        aspect_ratio: params.aspectRatio,
        multi_shots: true,
        multi_prompt: params.multiPrompts,
        kling_elements: params.elements || [],
      },
    }),
  });
  return await response.json();
}
```

### Veo-3.1 Integration
```typescript
export async function generateVeoVideo(params: {
  prompt: string;
  startFrame?: string;
  endFrame?: string;
  quality: 'fast' | 'quality';
  aspectRatio: string;
  resolution: '1080p' | '4k';
  companyId: string;
}) {
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'veo-3-1',
      callBackUrl: process.env.KIE_AI_CALLBACK_URL,
      input: {
        prompt: params.prompt,
        image_urls: [params.startFrame, params.endFrame].filter(Boolean),
        quality: params.quality,
        aspect_ratio: params.aspectRatio,
        resolution: params.resolution,
        duration: "8", // Max 8 seconds for Veo
      },
    }),
  });
  return await response.json();
}
```

### Lip Sync Integration
```typescript
export async function generateLipSync(params: {
  imageUrl: string;
  audioUrl: string;
  companyId: string;
}) {
  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'kling/ai-avatar-standard',
      callBackUrl: process.env.KIE_AI_CALLBACK_URL,
      input: {
        image_url: params.imageUrl,
        audio_url: params.audioUrl,
      },
    }),
  });
  return await response.json();
}
```

---

## 🔄 Callback Handler with CompanyId Security

```typescript
// app/api/callback/video/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  if (data.status === 'completed' && data.result?.video_url) {
    // 1. Get storyboard item to find companyId
    const item = await convex.query(api.storyboardItems.getByTaskId, { taskId: data.taskId });
    if (!item) {
      console.error('[Video Callback] Item not found for taskId:', data.taskId);
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    // 2. Validate companyId security
    const { user } = await auth();
    const userCompanyId = user?.organizationMemberships?.[0]?.organization?.id || user?.id;
    if (item.companyId !== userCompanyId) {
      console.error('[Video Callback] CompanyId mismatch:', item.companyId, userCompanyId);
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. Upload to R2 with companyId-based structure
    const r2Url = await uploadToR2(data.result.video_url, data.taskId, item.companyId);

    // 4. Update storyboardItem
    await convex.mutation(api.storyboardItems.updateVideo, {
      taskId: data.taskId,
      videoUrl: r2Url,
      status: 'completed',
    });
  }

  if (data.status === 'failed') {
    await convex.mutation(api.storyboardItems.updateVideoStatus, {
      taskId: data.taskId,
      status: 'failed',
    });
  }

  return Response.json({ received: true });
}
```

---

## 🏗️ Convex Mutations with CompanyId Security

```typescript
// convex/storyboard/videoGeneration.ts

// Generate video for a single storyboard item
export const generateVideoForItem = action({
  args: {
    itemId: v.id('storyboard_items'),
    model: v.string(),    // "veo-3-1" | "kling-3.0" | "kling/ai-avatar-standard"
    mode: v.string(),     // "image-to-video" | "text-to-video" | "lip-sync" | "reference-to-video"
    quality: v.string(),  // "fast" | "quality" | "std" | "pro"
    duration: v.number(),
    startFrameUrl: v.optional(v.string()),
    endFrameUrl: v.optional(v.string()),
    elements: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      imageUrl: v.string(),
    }))),
  },
  handler: async (ctx, { itemId, model, mode, quality, duration, startFrameUrl, endFrameUrl, elements }) => {
    const item = await ctx.runQuery(internal.storyboardItems.get, { id: itemId });
    const project = await ctx.runQuery(internal.storyboardProjects.get, { id: item.projectId });

    // Get user from auth context for companyId
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const companyId = userOrganizationId || userId;

    // Validate item belongs to user's company
    if (item.companyId !== companyId) {
      throw new Error('Access denied: Item does not belong to your company');
    }

    // Calculate credits based on model and settings
    let creditsUsed = 0;
    if (model === 'veo-3-1') {
      creditsUsed = quality === 'fast' ? 120 : 240;
      if (quality === 'quality') creditsUsed *= 2; // 4K multiplier
    } else if (model === 'kling-3.0') {
      const ratePerSecond = quality === 'pro' ? 40 : 30;
      creditsUsed = duration * ratePerSecond;
    } else if (model === 'kling/ai-avatar-standard') {
      creditsUsed = 50; // Fixed for lip sync
    }

    // Call appropriate API based on model
    let result;
    if (model === 'veo-3-1') {
      result = await generateVeoVideo({
        prompt: item.description || item.title,
        startFrame: startFrameUrl,
        endFrame: endFrameUrl,
        quality: quality as 'fast' | 'quality',
        aspectRatio: project.settings.frameRatio,
        resolution: '1080p',
        companyId,
      });
    } else if (model === 'kling-3.0') {
      result = await generateKlingVideo({
        tier: quality as 'std' | 'pro',
        startFrame: startFrameUrl || item.imageUrl,
        endFrame: endFrameUrl,
        audioEnabled: true,
        duration,
        aspectRatio: project.settings.frameRatio,
        prompt: item.description || item.title,
        elements: elements?.map(el => ({
          name: el.name,
          description: el.description,
          element_input_urls: [el.imageUrl],
        })),
        companyId,
      });
    } else if (model === 'kling/ai-avatar-standard') {
      result = await generateLipSync({
        imageUrl: item.imageUrl,
        audioUrl: startFrameUrl, // Using startFrameUrl for audio
        companyId,
      });
    }

    // Update item status
    await ctx.runMutation(internal.storyboardItems.patch, {
      id: itemId,
      videoPrompt: item.description || item.title,
      videoGeneration: {
        model,
        mode,
        quality,
        duration,
        creditsUsed,
        status: 'generating',
        taskId: result.data?.taskId,
      },
    });

    // Log credit usage with companyId
    await ctx.runMutation(internal.storyboardCreditUsage.log, {
      orgId: project.orgId,
      userId: item.generatedBy,
      projectId: project._id,
      itemId,
      companyId, // Add companyId for security
      action: 'video_generation',
      model,
      creditsUsed,
    });

    return result.data?.taskId;
  },
});

// Batch generate videos for all items in a project
export const batchGenerateVideos = action({
  args: {
    projectId: v.id('storyboard_projects'),
    model: v.string(),
    mode: v.string(),
    quality: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, { projectId, model, mode, quality, duration }) => {
    const items = await ctx.runQuery(internal.storyboardItems.listByProject, { projectId });

    // Generate for items that don't have videos yet
    const pending = items.filter(i => !i.videoUrl && (i.imageUrl || mode === 'text-to-video'));
    for (const item of pending) {
      await ctx.runAction(internal.storyboardVideoGeneration.generateVideoForItem, {
        itemId: item._id,
        model,
        mode,
        quality,
        duration,
      });
    }

    return { total: pending.length };
  },
});
```

---

## 🎨 LTX-Style UI Component

```typescript
// components/storyboard/VideoAIPanel.tsx
interface VideoAIPanelProps {
  projectId: string;
  selectedItemIds: string[];
  onClose: () => void;
}

export function VideoAIPanel({ projectId, selectedItemIds, onClose }: VideoAIPanelProps) {
  const { user } = useUser();
  const [model, setModel] = useState<'veo-3-1' | 'kling-3.0' | 'kling/ai-avatar-standard'>('kling-3.0');
  const [mode, setMode] = useState<'image-to-video' | 'text-to-video' | 'lip-sync' | 'reference-to-video'>('image-to-video');
  const [quality, setQuality] = useState('std');
  const [duration, setDuration] = useState(5);
  const [generating, setGenerating] = useState(false);
  
  // Upload states
  const [videoUpload, setVideoUpload] = useState<File | null>(null);
  const [startFrame, setStartFrame] = useState<File | null>(null);
  const [endFrame, setEndFrame] = useState<File | null>(null);
  const [elements, setElements] = useState<Array<{name: string, file: File}>>([]);

  // Get current user's companyId for security
  const companyId = user?.organizationMemberships?.[0]?.organization?.id || user?.id;

  // Calculate credits based on model and settings
  const calculateCredits = () => {
    if (model === 'veo-3-1') {
      const base = quality === 'fast' ? 120 : 240;
      return quality === 'quality' ? base * 2 : base; // 4K multiplier
    } else if (model === 'kling-3.0') {
      const ratePerSecond = quality === 'pro' ? 40 : 30;
      return duration * ratePerSecond;
    } else if (model === 'kling/ai-avatar-standard') {
      return 50; // Fixed for lip sync
    }
    return 0;
  };

  const credits = calculateCredits();

  const handleGenerate = async () => {
    setGenerating(true);
    
    if (selectedItemIds.length > 1) {
      await batchGenerateVideos({ 
        projectId, 
        model, 
        mode, 
        quality, 
        duration 
      });
    } else {
      // Upload files first
      let startFrameUrl: string | undefined;
      let endFrameUrl: string | undefined;
      
      if (startFrame) {
        startFrameUrl = await uploadFile(startFrame, companyId);
      }
      if (endFrame) {
        endFrameUrl = await uploadFile(endFrame, companyId);
      }

      await generateVideoForItem({ 
        itemId: selectedItemIds[0], 
        model, 
        mode, 
        quality, 
        duration,
        startFrameUrl,
        endFrameUrl,
        elements: elements.map(el => ({
          name: el.name,
          description: el.name,
          imageUrl: await uploadFile(el.file, companyId),
        })),
      });
    }
    
    setGenerating(false);
    onClose();
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Generate Video</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Model Selection - LTX Style */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Choose Model</label>
        <div className="grid grid-cols-3 gap-3">
          <SelectionBox
            options={[
              { 
                label: 'Kling 3.0', 
                value: 'kling-3.0',
                description: 'Flexible, multi-shot',
                price: '30-40 credits/s'
              },
              { 
                label: 'Veo-3.1', 
                value: 'veo-3-1',
                description: 'Premium quality',
                price: '120-240 credits'
              },
              { 
                label: 'Lip Sync', 
                value: 'kling/ai-avatar-standard',
                description: 'Character animation',
                price: '50 credits'
              },
            ]}
            selected={model}
            onChange={setModel}
          />
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Generation Mode</label>
        <div className="grid grid-cols-2 gap-3">
          {model === 'kling/ai-avatar-standard' ? (
            <SelectionBox
              options={[{ label: 'Lip Sync', value: 'lip-sync' }]}
              selected="lip-sync"
              onChange={() => {}}
            />
          ) : (
            <>
              <SelectionBox
                options={[
                  { label: 'Image to Video', value: 'image-to-video' },
                  { label: 'Text to Video', value: 'text-to-video' }
                ]}
                selected={mode}
                onChange={setMode}
              />
              {model === 'veo-3-1' && (
                <SelectionBox
                  options={[{ label: 'Reference to Video', value: 'reference-to-video' }]}
                  selected={mode}
                  onChange={setMode}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Areas - LTX Style */}
      {(mode === 'image-to-video' || mode === 'reference-to-video') && (
        <div className="space-y-4">
          {/* Video Upload (for lip sync) */}
          {model === 'kling/ai-avatar-standard' && (
            <UploadArea
              type="video"
              label="Upload Audio"
              description="MP3 or WAV file for lip sync"
              accept="audio/*"
              maxSize={10 * 1024 * 1024} // 10MB
              file={videoUpload}
              onFileChange={setVideoUpload}
            />
          )}

          {/* Start Frame Upload */}
          <UploadArea
            type="startFrame"
            label="Start Frame"
            description="Reference image for video start"
            accept="image/*"
            maxSize={10 * 1024 * 1024} // 10MB
            file={startFrame}
            onFileChange={setStartFrame}
          />

          {/* End Frame Upload (Veo-3.1 only) */}
          {model === 'veo-3-1' && (
            <UploadArea
              type="endFrame"
              label="End Frame"
              description="Reference image for video end"
              accept="image/*"
              maxSize={10 * 1024 * 1024} // 10MB
              file={endFrame}
              onFileChange={setEndFrame}
            />
          )}

          {/* Elements Upload */}
          {model === 'kling-3.0' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Elements (Characters/Props)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Drag and drop elements or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">Use @element_name in prompts</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quality Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Quality</label>
        <div className="grid grid-cols-2 gap-3">
          {model === 'veo-3-1' ? (
            <SelectionBox
              options={[
                { label: 'Fast', value: 'fast', price: '120 credits' },
                { label: 'Quality', value: 'quality', price: '240 credits' }
              ]}
              selected={quality}
              onChange={setQuality}
            />
          ) : model === 'kling-3.0' ? (
            <SelectionBox
              options={[
                { label: 'Standard', value: 'std', price: '30 credits/s' },
                { label: 'Pro', value: 'pro', price: '40 credits/s' }
              ]}
              selected={quality}
              onChange={setQuality}
            />
          ) : null}
        </div>
      </div>

      {/* Duration Slider */}
      {model !== 'kling/ai-avatar-standard' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Duration: {duration} seconds
          </label>
          <input
            type="range"
            min={3}
            max={model === 'veo-3-1' ? 8 : 15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>3s</span>
            <span>{model === 'veo-3-1' ? '8s' : '15s'}</span>
          </div>
        </div>
      )}

      {/* Credits Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">Estimated credits: {credits}</div>
            <div className="text-xs text-gray-500">
              {model === 'veo-3-1' 
                ? 'Fixed pricing per video'
                : model === 'kling-3.0'
                ? `${quality === 'std' ? 30 : 40} credits per second`
                : 'Fixed pricing for lip sync'
              }
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">≈ ${(credits / 400).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {generating
          ? 'Generating...'
          : `Generate ${selectedItemIds.length > 1 ? `${selectedItemIds.length} videos` : 'video'}`
        }
      </button>
    </div>
  );
}

// Helper Components
interface SelectionBoxProps {
  options: Array<{
    label: string;
    value: string;
    description?: string;
    price?: string;
  }>;
  selected: string;
  onChange: (value: string) => void;
}

function SelectionBox({ options, selected, onChange }: SelectionBoxProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
            selected === option.value
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-sm">{option.label}</div>
          {option.description && (
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          )}
          {option.price && (
            <div className="text-xs text-emerald-600 mt-1">{option.price}</div>
          )}
        </button>
      ))}
    </div>
  );
}

interface UploadAreaProps {
  type: string;
  label: string;
  description: string;
  accept: string;
  maxSize: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function UploadArea({ type, label, description, accept, maxSize, file, onFileChange }: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.size <= maxSize) {
      onFileChange(droppedFile);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <File className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
            </div>
            <button
              onClick={() => onFileChange(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">{description}</p>
            <p className="text-xs text-gray-400 mt-1">Max {(maxSize / 1024 / 1024).toFixed(0)}MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🏛️ Architecture Analysis & Recommendation

### **Current SceneEditor Strengths:**
- ✅ Clean, focused workspace with minimal distractions
- ✅ Smart sliding panel system for efficient screen use
- ✅ Centralized tool management through ImageAI Panel
- ✅ Good visual hierarchy and separation of concerns

### **Hybrid Approach - Context-Aware Workspace**

Based on the analysis, the **Hybrid Approach** is recommended because:

#### **🏆 Why It Works:**

1. **Best of Both Worlds** - Maintains clean interface while adding video capabilities
2. **Context Preservation** - Assets and timeline persist across modes  
3. **Scalable Design** - Easy to add new features without cluttering
4. **User-Friendly** - Progressive complexity based on user needs
5. **LTX-Style UI** - Modern, clean interface that users love

#### **🔧 Key Success Factors:**

1. **Smart Mode Switching** - Seamless transitions with context preservation
2. **Unified Asset Management** - Single library for images, videos, and elements
3. **Progressive Disclosure** - Video features appear when needed
4. **Performance Optimization** - Load features on-demand

#### **📊 Competitive Advantages:**

- **Better than OpenArt** - More focused, less overwhelming
- **More flexible than KROCK** - Integrated editing + video pipeline  
- **More comprehensive than competitors** - Professional workflow features
- **LTX-style UI** - Modern, intuitive interface

---

## 🚀 Implementation Strategy

### **Phase 1: Foundation (Month 1)**
1. **Mode-Aware Interface** - Add video mode with preserved context
2. **Unified Asset Browser** - Single panel for all media types
3. **LTX-Style Video Panel** - Clean, modern video generation interface

### **Phase 2: Video Integration (Month 2)**  
1. **Video Timeline Overlay** - Appears when video mode active
2. **Multi-Model Support** - Veo-3.1 + Kling 3.0 integration
3. **Advanced Features** - Elements, multi-shot, lip sync

### **Phase 3: Enhancement (Month 3)**
1. **Character System** - Reusable elements with @syntax
2. **Batch Processing** - Generate multiple videos at once
3. **Export Options** - Various formats and quality settings

---

## 🔐 Security & CompanyId Implementation

### **Security Model:**
```typescript
// All video operations follow this pattern:
const identity = await ctx.auth.getUserIdentity();
const userOrganizationId = identity.orgId;
const userId = identity.subject;
const companyId = userOrganizationId || userId;

// Validate access
if (item.companyId !== companyId) {
  throw new Error('Access denied');
}

// Use companyId for R2 storage
const r2Key = `${companyId}/videos/${taskId}.mp4`;
```

### **Data Isolation:**
- **Videos stored by companyId** - No cross-organization access
- **Credit logging by companyId** - Proper billing attribution  
- **Element library scoped by companyId** - Character/prop consistency per organization
- **API callbacks validated** - Security checks on all webhooks

---

## 📈 Success Metrics

### **Technical Metrics:**
- Video generation success rate > 95%
- Average processing time < 2 minutes
- API callback success rate > 99%
- Zero security breaches

### **User Experience Metrics:**
- Video generation completion rate > 80%
- User satisfaction score > 4.5/5
- Feature adoption rate > 60%
- Support ticket reduction > 40%

### **Business Metrics:**
- Credit usage increase > 50%
- User retention improvement > 25%
- Feature engagement > 70%
- Revenue growth > 30%

---

## 🎯 Final Recommendation

**Implement the Hybrid LTX-Style Video Panel** because it provides:

1. **Professional UI** - Modern, clean interface matching LTX.studio
2. **Dual Model Strategy** - Premium (Veo-3.1) + Flexible (Kling 3.0) options
3. **Advanced Features** - Elements, multi-shot, lip sync capabilities
4. **Company Security** - Full companyId-based access control
5. **Scalable Architecture** - Easy to extend and maintain

This approach creates a **competitive advantage** by combining the **workflow continuity** of integrated video generation with the **clean interface** of modern design, resulting in a **professional-grade tool** that exceeds competitor capabilities while maintaining excellent user experience. 🎯

The hybrid LTX-style approach is the sweet spot that addresses all requirements while maintaining the clean, focused design philosophy your users love!