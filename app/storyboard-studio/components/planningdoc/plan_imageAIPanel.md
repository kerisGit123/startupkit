# Image AI Panel — Planning 

> **Schema**: See `corePlaning.md` → `storyboard_items.imageGeneration`, `storyboard_items.imageUrl`, `storyboard_credit_usage`
> **Owns**: Kie AI integration, prompt enhancement, style presets, batch generation, image panel UI
> **Phase**: 3 (Image AI) - **COMPLETED**

---

## Implementation Status: 95% COMPLETE

### Fully Implemented:
- **Kie AI API Configuration** - `lib/storyboard/kieAI.ts`
- **Style Presets** - All 4 styles with proper models
- **Prompt Enhancement** - GPT-4o via Kie AI
- **Image Generation API** - `/api/storyboard/generate-image/route.ts`
- **Callback Handler** - `/api/callback/image/route.ts` with R2 upload
- **UI Component** - `ImageAIPanel.tsx` with full functionality
- **Credit Logging** - Automatic credit tracking
- **Batch Generation** - Multiple items support
- **Character Consistency** - `characterContext` prop support

### Implementation Better Than Planned:
- **Kie AI GPT-4o** instead of OpenAI GPT-5.2 (more integrated)
- **Advanced models** (kie-image-pro-v2 for realistic/cinematic)
- **R2 integration** in callbacks (proper file storage)
- **Progress tracking** with real-time status

---

## Scope

This file covers:

1. Kie AI API configuration and call pattern
2. Prompt enhancement via GPT-5.2
3. Style presets (realistic, cartoon, anime, cinematic)
4. Single-item and batch image generation
5. ImageAIPanel UI component
6. Credit logging per generation (→ `storyboard_credit_usage` table)

This file does NOT cover project/script management (→ `storyboardplanning.md`), video generation (→ `videoplanning.md`), or file storage (→ `filePlaning.md`).

---

## Kie AI API Configuration

```typescript
// lib/kieAI.ts
const KIE_AI_BASE = 'https://api.kie.ai';

// All image + video calls use the same API key
// ENV: KIE_AI_API_KEY, KIE_AI_CALLBACK_URL

export async function generateImage(params: {
  prompt: string;
  style: string;
  aspectRatio: string; // "9:16" (TikTok default) | "16:9" | "1:1"
  quality: string;     // "standard" | "high"
}) {
  const response = await fetch(`${KIE_AI_BASE}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'kie-image-v2', // or select by style
      callBackUrl: process.env.KIE_AI_CALLBACK_URL,
      input: {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        quality: params.quality,
      },
    }),
  });
  return await response.json(); // { code, data: { taskId } }
}
```

---

## Prompt Enhancement (GPT-5.2)

Before calling Kie AI, enhance the raw scene description with cinematic details.

```typescript
// convex/ai.ts — called before image generation
export async function enhancePromptForImage(
  sceneContent: string,
  technical: { camera?: string[]; lighting?: string[]; perspective?: string[]; action?: string[] } | undefined,
  style: string
): Promise<string> {
  const systemPrompt = `You are a professional storyboard artist creating frames for TikTok/YouTube short stories.
Given a scene description, output a detailed image generation prompt.
Style: ${style}. Include camera angle, lighting, mood, character poses, background.
Keep it under 200 words. Output ONLY the prompt, no explanation.`;

  const userInput = technical
    ? `Scene: ${sceneContent}\nCamera: ${technical.camera?.join(', ')}\nLighting: ${technical.lighting?.join(', ')}\nAction: ${technical.action?.join(', ')}`
    : sceneContent;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4', // or gpt-5.2 when available
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  const result = await response.json();
  return result.choices[0].message.content;
}
```

---

## Style Presets

```typescript
const STYLE_PRESETS = {
  realistic: {
    label: 'Photorealistic',
    promptSuffix: 'professional photography, cinematic lighting, high detail, 4K',
  },
  cartoon: {
    label: 'Cartoon',
    promptSuffix: 'colorful cartoon style, bold outlines, vibrant colors',
  },
  anime: {
    label: 'Anime',
    promptSuffix: 'anime style, clean lines, expressive eyes, vibrant palette',
  },
  cinematic: {
    label: 'Cinematic',
    promptSuffix: 'cinematic film still, dramatic lighting, shallow depth of field, moody',
  },
} as const;
```

---

## Convex Mutations

```typescript
// convex/storyboard/imageGeneration.ts

// Generate image for a single storyboard item
export const generateImageForItem = action({
  args: {
    itemId: v.id('storyboard_items'),
    style: v.string(),
    quality: v.string(),
  },
  handler: async (ctx, { itemId, style, quality }) => {
    const item = await ctx.runQuery(internal.storyboardItems.get, { id: itemId });
    const project = await ctx.runQuery(internal.storyboardProjects.get, { id: item.projectId });
    const scene = project.scenes.find(s => s.id === item.sceneId);

    // Get user from auth context for companyId
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const companyId = userOrganizationId || userId;

    // 1. Enhance prompt
    const prompt = await enhancePromptForImage(
      scene?.content || item.description || item.title,
      scene?.technical,
      style
    );

    // 2. Call Kie AI
    const result = await generateImage({
      prompt: `${prompt}, ${STYLE_PRESETS[style]?.promptSuffix || ''}`,
      style,
      aspectRatio: project.settings.frameRatio,
      quality,
    });

    // 3. Update item status
    await ctx.runMutation(internal.storyboardItems.patch, {
      id: itemId,
      imagePrompt: prompt,
      imageGeneration: {
        model: 'kie-image-v2',
        creditsUsed: quality === 'high' ? 10 : 5,
        status: 'generating',
        taskId: result.data?.taskId,
      },
    });

    // 4. Log credit usage with companyId
    await ctx.runMutation(internal.storyboardCreditUsage.log, {
      orgId: project.orgId,
      userId: item.generatedBy,
      projectId: project._id,
      itemId,
      companyId, // Add companyId for security
      action: 'image_generation',
      model: 'kie-image-v2',
      creditsUsed: quality === 'high' ? 10 : 5,
    });

    return result.data?.taskId;
  },
});

// Batch generate images for all items in a project
export const batchGenerateImages = action({
  args: {
    projectId: v.id('storyboard_projects'),
    style: v.string(),
    quality: v.string(),
  },
  handler: async (ctx, { projectId, style, quality }) => {
    const items = await ctx.runQuery(internal.storyboardItems.listByProject, { projectId });

    // Generate for items that don't have images yet
    const pending = items.filter(i => !i.imageUrl);
    for (const item of pending) {
      await ctx.runAction(internal.storyboardImageGeneration.generateImageForItem, {
        itemId: item._id,
        style,
        quality,
      });
    }

    return { total: pending.length };
  },
});
```

---

## Callback Handler

```typescript
// app/api/callback/image/route.ts
// Kie AI calls this when image generation completes

export async function POST(request: Request) {
  const data = await request.json();

  if (data.status === 'completed' && data.result?.image_url) {
    // 1. Get storyboard item to find companyId
    const item = await convex.query(api.storyboardItems.getByTaskId, { taskId: data.taskId });
    if (!item) {
      console.error('[Image Callback] Item not found for taskId:', data.taskId);
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    // 2. Upload to R2 with companyId-based structure (→ filePlaning.md handles storage)
    const r2Url = await uploadToR2(data.result.image_url, data.taskId, item.companyId);

    // 3. Update storyboardItem
    await convex.mutation(api.storyboardItems.updateImage, {
      taskId: data.taskId,
      imageUrl: r2Url,
      status: 'completed',
    });
  }

  if (data.status === 'failed') {
    await convex.mutation(api.storyboardItems.updateImageStatus, {
      taskId: data.taskId,
      status: 'failed',
    });
  }

  return Response.json({ received: true });
}
```

---

## UI Component

```typescript
// components/storyboard/ImageAIPanel.tsx
interface ImageAIPanelProps {
  projectId: string;
  selectedItemIds: string[];
  onClose: () => void;
}

export function ImageAIPanel({ projectId, selectedItemIds, onClose }: ImageAIPanelProps) {
  const { user } = useUser();
  const [style, setStyle] = useState<keyof typeof STYLE_PRESETS>('realistic');
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [generating, setGenerating] = useState(false);

  // Get current user's companyId for credit logging
  const companyId = user?.organizationMemberships?.[0]?.organization?.id || user?.id;

  const handleGenerate = async () => {
    setGenerating(true);
    if (selectedItemIds.length > 1) {
      await batchGenerateImages({ projectId, style, quality });
    } else {
      await generateImageForItem({ itemId: selectedItemIds[0], style, quality });
    }
    setGenerating(false);
    onClose();
  };

  return (
    <div className="p-4 border rounded-xl bg-white space-y-4">
      <h3 className="text-lg font-semibold">Generate Images</h3>

      {/* Style selector */}
      <div className="flex gap-2">
        {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => setStyle(key as any)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              style === key ? 'bg-emerald-600 text-white' : 'bg-gray-100'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Quality */}
      <div className="flex gap-2">
        <button
          onClick={() => setQuality('standard')}
          className={`px-3 py-1.5 rounded-lg text-sm ${quality === 'standard' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}
        >
          Standard (5 credits)
        </button>
        <button
          onClick={() => setQuality('high')}
          className={`px-3 py-1.5 rounded-lg text-sm ${quality === 'high' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}
        >
          High (10 credits)
        </button>
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {generating
          ? 'Generating...'
          : `Generate ${selectedItemIds.length > 1 ? `${selectedItemIds.length} images` : 'image'}`}
      </button>
    </div>
  );
}