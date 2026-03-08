# Storyboard & Script — Planning

> **Schema**: See `corePlaning.md` → tables `projects`, `storyboardItems`
> **Owns**: Project CRUD, script generation, scene parsing, storyboard editor UI, item CRUD
> **Phase**: 1–2 (Foundation + Script & Storyboard)

---

## Scope

This file covers:

1. Project CRUD (create, list, update, delete, tag, filter)
2. Script editor (manual write + AI generation via GPT-5.2)
3. Scene parser (script text → structured scenes → storyboardItems)
4. Storyboard editor UI (frame grid, reorder, select)
5. StoryboardItem component (frame card with media, elements, annotations)
6. Export (PDF, MP4 compilation — Phase 6)

This file does NOT cover image generation (→ `imageAIPanel.md`), video generation (→ `videoAIPanel.md`), or file storage (→ `filePlaning.md`).

---

## Convex Mutations

### Project CRUD

```typescript
// convex/projects.ts

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    orgId: v.string(),
    settings: v.object({
      frameRatio: v.string(), // "9:16" | "16:9" | "1:1"
      style: v.string(),      // "realistic" | "cartoon" | "anime" | "cinematic"
    }),
  },
  handler: async (ctx, { name, description, orgId, settings }) => {
    return await ctx.db.insert('projects', {
      name,
      description,
      orgId,
      ownerId: ctx.auth.userId,
      status: 'draft',
      tags: [],
      script: '',
      scenes: [],
      metadata: { characterCount: 0, sceneCount: 0, estimatedDuration: 0 },
      settings: {
        ...settings,
        duration: 5,
        backgroundColor: '#ffffff',
        layout: 'grid',
      },
      isAIGenerated: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByOrg = query({
  args: { orgId: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, { orgId, status }) => {
    let q = ctx.db.query('projects').withIndex('by_org', q => q.eq('orgId', orgId));
    if (status) q = q.filter(q2 => q2.eq(q2.field('status'), status));
    return await q.order('desc').collect();
  },
});
```

### AI Script Generation (GPT-5.2)

```typescript
// convex/ai.ts

export const generateScript = action({
  args: {
    projectId: v.id('projects'),
    prompt: v.string(),
    genre: v.optional(v.string()),
    targetDuration: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, prompt, genre, targetDuration }) => {
    const project = await ctx.runQuery(internal.projects.get, { id: projectId });

    const systemPrompt = `You are a professional TikTok/YouTube short-form scriptwriter for the SEA market.
Write a storyboard script with clear scene breaks. Each scene should include:
- Scene title and location
- Visual description (what the viewer sees)
- Character actions and dialogue
- Camera angle and lighting suggestions
${genre ? `Genre: ${genre}` : ''}
${targetDuration ? `Target: ${targetDuration} seconds total` : ''}
Output format: SCENE [n]: [title]\n[content]\nCharacters: [list]\nLocation: [loc]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const result = await response.json();
    const scriptContent = result.choices[0].message.content;
    const scenes = parseScriptScenes(scriptContent);

    await ctx.runMutation(internal.projects.patch, {
      id: projectId,
      script: scriptContent,
      scenes,
      metadata: {
        characterCount: Math.max(...scenes.map(s => s.characters.length), 0),
        sceneCount: scenes.length,
        estimatedDuration: scenes.length * 5,
        genre,
        aiModel: 'gpt-4',
      },
      isAIGenerated: true,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});
```

### Scene Parser

```typescript
// lib/sceneParser.ts

export function parseScriptScenes(content: string) {
  const scenes: Array<{
    id: string;
    title: string;
    content: string;
    characters: string[];
    locations: string[];
    startTime: number;
    endTime: number;
  }> = [];

  const sceneRegex = /SCENE (\d+): ([^\n]+)\n([\s\S]*?)(?=SCENE \d+:|$)/g;
  let match;

  while ((match = sceneRegex.exec(content)) !== null) {
    const [, num, title, body] = match;
    const charRegex = /([A-Za-z][A-Za-z\s]*):/g;
    const characters = [...new Set([...body.matchAll(charRegex)].map(m => m[1].trim()))];

    scenes.push({
      id: `scene-${num}`,
      title: title.trim(),
      content: body.trim(),
      characters,
      locations: [title.split('-')[1]?.trim() || 'Unknown'],
      startTime: 0,
      endTime: 0,
    });
  }

  return scenes;
}
```

### Storyboard Generation (scenes → items)

```typescript
// convex/storyboardGeneration.ts

export const generateItemsFromScenes = action({
  args: {
    projectId: v.id('projects'),
    generateImages: v.boolean(),
    style: v.string(),
  },
  handler: async (ctx, { projectId, generateImages, style }) => {
    const project = await ctx.runQuery(internal.projects.get, { id: projectId });

    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];

      await ctx.runMutation(internal.storyboardItems.create, {
        projectId,
        sceneId: scene.id,
        order: i,
        title: scene.title,
        description: scene.content.substring(0, 200),
        duration: 5,
        elements: [],
        annotations: [],
        fileIds: [],
        isAIGenerated: false,
        generationStatus: generateImages ? 'pending' : 'none',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // If generateImages, trigger batch image generation (→ imageAIPanel.md)
    if (generateImages) {
      await ctx.runAction(internal.imageGeneration.batchGenerateImages, {
        projectId,
        style,
        quality: 'standard',
      });
    }

    await ctx.runMutation(internal.projects.patch, {
      id: projectId,
      status: 'active',
      updatedAt: Date.now(),
    });
  },
});
```

### StoryboardItem CRUD

```typescript
// convex/storyboardItems.ts

export const update = mutation({
  args: {
    itemId: v.id('storyboardItems'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, { itemId, ...updates }) => {
    await ctx.db.patch(itemId, { ...updates, updatedAt: Date.now() });
  },
});

export const reorder = mutation({
  args: {
    projectId: v.id('projects'),
    itemOrders: v.array(v.object({
      itemId: v.id('storyboardItems'),
      newOrder: v.number(),
    })),
  },
  handler: async (ctx, { projectId, itemOrders }) => {
    for (const { itemId, newOrder } of itemOrders) {
      await ctx.db.patch(itemId, { order: newOrder, updatedAt: Date.now() });
    }
    await ctx.db.patch(projectId, { updatedAt: Date.now() });
  },
});

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query('storyboardItems')
      .withIndex('by_project', q => q.eq('projectId', projectId))
      .order('asc')
      .collect();
  },
});
```

---

## UI Components

### StoryboardEditor (main view)

```typescript
// components/StoryboardEditor.tsx
interface StoryboardEditorProps {
  projectId: string;
}

export function StoryboardEditor({ projectId }: StoryboardEditorProps) {
  const project = useQuery(api.projects.get, { id: projectId });
  const items = useQuery(api.storyboardItems.listByProject, { projectId });
  const [activeTab, setActiveTab] = useState<'script' | 'storyboard'>('script');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">{project?.name}</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
            onClick={() => setActiveTab('script')}>Script</button>
          <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
            onClick={() => setActiveTab('storyboard')}>Storyboard</button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'script' ? (
        <ScriptPanel projectId={projectId} />
      ) : (
        <div className="flex flex-1">
          {/* Frame grid */}
          <div className="flex-1 p-4 grid grid-cols-3 gap-4 auto-rows-min">
            {items?.map((item, i) => (
              <FrameCard key={item._id} item={item} index={i}
                selected={selectedItemId === item._id}
                onSelect={() => setSelectedItemId(item._id)} />
            ))}
          </div>

          {/* Properties panel */}
          {selectedItemId && (
            <div className="w-80 border-l p-4">
              <ItemProperties itemId={selectedItemId}
                onClose={() => setSelectedItemId(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### FrameCard (individual storyboard item)

```typescript
// components/FrameCard.tsx
interface FrameCardProps {
  item: StoryboardItem;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function FrameCard({ item, index, selected, onSelect }: FrameCardProps) {
  return (
    <div onClick={onSelect}
      className={`border rounded-xl p-2 cursor-pointer transition
        ${selected ? 'ring-2 ring-emerald-500' : 'hover:border-gray-300'}`}>
      <div className="text-xs text-gray-400 mb-1">#{index + 1}</div>

      {/* Media */}
      <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden mb-2">
        {item.videoUrl ? (
          <video src={item.videoUrl} className="w-full h-full object-cover" />
        ) : item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            No media
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-sm font-medium truncate">{item.title}</p>
      <p className="text-xs text-gray-400">{item.duration}s</p>
    </div>
  );
}