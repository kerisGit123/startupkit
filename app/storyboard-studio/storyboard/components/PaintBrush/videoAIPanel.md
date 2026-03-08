# Video AI Panel — Planning

> **Schema**: See `corePlaning.md` → `storyboardItems.videoGeneration`, `creditUsage`
> **Owns**: Veo-3-1 / Kling 3.0 API integration, video modes, pricing, callback handler, video panel UI
> **Phase**: 4 (Video AI)

---

## Scope

This file covers:

1. Model strategy (Veo-3-1 + Kling 3.0) with pricing
2. Kie AI video API calls (single shot + multi-shot)
3. Callback handler for async video completion
4. Video generation modes (image-to-video, text-to-video, lip-sync, multi-shot)
5. VideoAIPanel UI component
6. Credit logging per generation (→ `creditUsage` table)

This file does NOT cover project/script management (→ `storyboardplanning.md`), image generation (→ `imageAIPanel.md`), or file storage (→ `filePlaning.md`).

---

## Model Strategy (2 Options)

### Veo-3-1 (Google DeepMind) — Premium, Fixed Price

- **Use case**: High-quality single clips, TikTok/YouTube hero shots
- **Cost**: Fast 60 credits ($0.30) / Quality 250 credits ($1.25)
- **Customer price (30% margin)**: Fast 80 credits ($0.39) / Quality 325 credits ($1.63)
- **Max duration**: 8 seconds
- **Features**: text-to-video, image-to-video, reference-to-video, synchronized audio, 1080p

### Kling 3.0 — Flexible, Per-Second

- **Use case**: Multi-shot storytelling, longer clips, budget control
- **Cost (per second)**: Standard 20–30 credits / Pro 27–40 credits (with/without audio)
- **Customer price (30% margin)**: Standard 25–40 / Pro 35–50 credits/s
- **Max duration**: 15 seconds
- **Features**: multi-shot, start/end frame, camera movement, scene transitions, elements

### Why 2 models

- Veo for quality-first (fixed cost, predictable billing)
- Kling for flexibility (per-second, multi-shot storytelling)
- Simple choice for users: "Premium" vs "Flexible"

---

## API Implementation

### Environment

```
KIE_AI_API_KEY=your_key
KIE_AI_CALLBACK_URL=https://your-domain.com/api/callback/video
```

### Kling 3.0 — Single Shot

```typescript
// lib/videoAI.ts
export async function generateKlingVideo(params: {
  tier: 'std' | 'pro';
  startFrame?: string;
  endFrame?: string;
  audioEnabled: boolean;
  duration: number;
  aspectRatio: string;
  prompt: string;
  elements?: Array<{ name: string; description: string; element_input_urls: string[] }>;
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

### Kling 3.0 — Multi-Shot

```typescript
export async function generateKlingMultiShot(params: {
  tier: 'std' | 'pro';
  sceneImages?: string[];
  audioEnabled: boolean;
  duration: number;
  aspectRatio: string;
  multiPrompts: string[];
  elements?: Array<{ name: string; description: string; element_input_urls: string[] }>;
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

### Check Job Status

```typescript
export async function checkVideoJobStatus(taskId: string) {
  const response = await fetch(`https://api.kie.ai/api/v1/jobs/${taskId}`, {
    headers: { 'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}` },
  });
  return await response.json();
  // { code, data: { taskId, status, result: { video_url, thumbnail_url } } }
}
```

---

## Callback Handler

```typescript
// app/api/callback/video/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  if (data.status === 'completed' && data.result?.video_url) {
    // 1. Upload to R2 (→ filePlaning.md)
    const r2Url = await uploadToR2(data.result.video_url, data.taskId);

    // 2. Update storyboardItem.videoUrl + videoGeneration.status
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

## Convex Action

```typescript
// convex/videoGeneration.ts
export const generateVideoForItem = action({
  args: {
    itemId: v.id('storyboardItems'),
    model: v.string(),    // "veo-3-1" | "kling-3.0"
    mode: v.string(),     // "image-to-video" | "text-to-video" | "lip-sync"
    quality: v.string(),  // "fast" | "quality" | "std" | "pro"
    duration: v.number(),
  },
  handler: async (ctx, { itemId, model, mode, quality, duration }) => {
    const item = await ctx.runQuery(internal.storyboardItems.get, { id: itemId });
    const project = await ctx.runQuery(internal.projects.get, { id: item.projectId });

    // Calculate credits
    const creditsUsed = model === 'veo-3-1'
      ? (quality === 'fast' ? 80 : 325)
      : duration * (quality === 'pro' ? 50 : 30);

    // Call Kie AI
    const result = await generateKlingVideo({
      tier: quality as 'std' | 'pro',
      startFrame: item.imageUrl,
      audioEnabled: true,
      duration,
      aspectRatio: project.settings.frameRatio,
      prompt: item.description || item.title,
    });

    // Update item
    await ctx.runMutation(internal.storyboardItems.patch, {
      id: itemId,
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

    // Log credits
    await ctx.runMutation(internal.creditUsage.log, {
      orgId: project.orgId,
      userId: item.generatedBy,
      projectId: project._id,
      itemId,
      action: 'video_generation',
      model,
      creditsUsed,
    });

    return result.data?.taskId;
  },
});
```

---

## UI Component

```typescript
// components/VideoAIPanel.tsx
interface VideoAIPanelProps {
  projectId: string;
  itemId: string;
  onClose: () => void;
}

export function VideoAIPanel({ projectId, itemId, onClose }: VideoAIPanelProps) {
  const [model, setModel] = useState<'veo-3-1' | 'kling-3.0'>('kling-3.0');
  const [mode, setMode] = useState<'image-to-video' | 'text-to-video' | 'lip-sync'>('image-to-video');
  const [quality, setQuality] = useState('std');
  const [duration, setDuration] = useState(5);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await generateVideoForItem({ itemId, model, mode, quality, duration });
    setGenerating(false);
    onClose();
  };

  return (
    <div className="p-4 border rounded-xl bg-white space-y-4">
      <h3 className="text-lg font-semibold">Generate Video</h3>

      {/* Model */}
      <div className="flex gap-2">
        <button onClick={() => setModel('kling-3.0')}
          className={`px-3 py-1.5 rounded-lg text-sm ${model === 'kling-3.0' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
          Kling 3.0 (Flexible)
        </button>
        <button onClick={() => setModel('veo-3-1')}
          className={`px-3 py-1.5 rounded-lg text-sm ${model === 'veo-3-1' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
          Veo-3-1 (Premium)
        </button>
      </div>

      {/* Mode */}
      <div className="flex gap-2">
        {['image-to-video', 'text-to-video', 'lip-sync'].map(m => (
          <button key={m} onClick={() => setMode(m as any)}
            className={`px-3 py-1.5 rounded-lg text-sm ${mode === m ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>
            {m.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* Duration */}
      <div>
        <label className="text-sm text-gray-500">Duration: {duration}s</label>
        <input type="range" min={3} max={model === 'kling-3.0' ? 15 : 8}
          value={duration} onChange={e => setDuration(Number(e.target.value))}
          className="w-full" />
      </div>

      {/* Generate */}
      <button onClick={handleGenerate} disabled={generating}
        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
        {generating ? 'Generating...' : 'Generate Video'}
      </button>
    </div>
  );
}
```

---

## API Notes

- **Duration format**: must be string (`"5"`, not `5`)
- **Image requirements**: min 300x300px, max 10MB each
- **Element limits**: 2–4 images per element, 1 video per element (max 50MB)
- **Callback URL**: must be publicly accessible
- **Polling fallback**: check status every 30s if not using callbacks
- **Element syntax**: use `@element_name` in prompts
- **Multi-shot**: `multi_shots: true` + `multi_prompt: ["scene1", "scene2"]`