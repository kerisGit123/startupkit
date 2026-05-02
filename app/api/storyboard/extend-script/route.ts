import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAnthropicClient } from "@/lib/support/anthropic";
import type { TextBlock } from "@anthropic-ai/sdk/resources/messages/messages.js";
import type { Id } from "@/convex/_generated/dataModel";

export const maxDuration = 300;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function updateStatus(
  projectId: Id<"storyboard_projects">,
  status: string,
  message: string
) {
  await convex.mutation(api.storyboard.build.setTaskStatus, {
    projectId,
    taskStatus: status,
    taskMessage: message,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await auth();
  const clerkUserId = authResult.userId;
  if (!clerkUserId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Set Convex auth token
  let convexToken: string | null = null;
  try {
    convexToken = await authResult.getToken({ template: "convex" });
  } catch {
    try { convexToken = await authResult.getToken(); } catch {}
  }
  if (convexToken) {
    convex.setAuth(convexToken);
  }

  const body = await req.json();
  const { projectId, prompt, sceneCount } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Verify ownership
  const project = await convex.query(api.storyboard.projects.get, { id: projectId });
  if (!project || project.ownerId !== clerkUserId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    await updateStatus(projectId, "processing", "Preparing to extend story...");

    // 1. Get existing frames as context
    const existingItems = await convex.query(api.storyboard.storyboardItems.listByProject, {
      projectId,
    });

    if (existingItems.length === 0) {
      return NextResponse.json({ error: "No existing frames to extend from. Use Build Storyboard first." }, { status: 400 });
    }

    const lastOrder = Math.max(...existingItems.map((item: any) => item.order));
    const lastSceneNum = existingItems.length;

    // 2. Build context summary from existing scenes
    const existingContext = existingItems
      .sort((a: any, b: any) => a.order - b.order)
      .map((item: any, i: number) => {
        const parts = [`Scene ${i + 1}: ${item.title}`];
        if (item.description) parts.push(item.description.substring(0, 200));
        if (item.imagePrompt) parts.push(`Image: ${item.imagePrompt.substring(0, 150)}`);
        return parts.join("\n");
      })
      .join("\n---\n");

    // Also include the original script if available
    const originalScript = project.script || "";

    await updateStatus(projectId, "processing", "Generating continuation scenes...");

    // 3. Generate continuation with AI
    const anthropic = getAnthropicClient();
    const targetScenes = sceneCount || 4;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: `You are a storyboard script continuator. Given existing scenes, generate ${targetScenes} NEW continuation scenes that naturally follow the story.

RULES:
- Continue the narrative arc — don't repeat or contradict existing scenes
- Match the style, tone, and format of the existing scenes
- Each scene needs: title, description, imagePrompt (detailed visual for AI image gen), videoPrompt (camera + action)
- sceneId format: "scene_${lastSceneNum + 1}", "scene_${lastSceneNum + 2}", etc.
- order starts at ${lastOrder + 1}
- Set duration (seconds) appropriate for the action
- If the existing script uses specific models (seedance 1.5, seedance 2.0), continue that pattern in modelHint
- imagePrompt should be detailed enough for AI image generation (lighting, composition, style)
- videoPrompt should describe camera movement, timing, and action

RETURN ONLY valid JSON:
{
  "scenes": [
    {
      "sceneId": "scene_${lastSceneNum + 1}",
      "act": 1,
      "order": ${lastOrder + 1},
      "title": "Scene title",
      "actTitle": "",
      "description": "What happens in this scene",
      "imagePrompt": "Detailed visual description for AI image generation...",
      "videoPrompt": "Camera movement and action description...",
      "duration": 5,
      "modelHint": null
    }
  ],
  "scriptExtension": "The continuation script text in the same format as the original"
}`,
      messages: [
        {
          role: "user",
          content: `EXISTING STORY (${existingItems.length} scenes):\n${existingContext}\n\n${originalScript ? `ORIGINAL SCRIPT:\n${originalScript.substring(0, 3000)}\n\n` : ""}USER REQUEST: ${prompt || `Continue the story with ${targetScenes} more scenes`}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[extend-script] Failed to parse AI response:", text.substring(0, 300));
      await updateStatus(projectId, "error", "Failed to parse AI response");
      return NextResponse.json({ error: "Failed to parse continuation" }, { status: 500 });
    }

    const newScenes = parsed.scenes || [];
    if (newScenes.length === 0) {
      await updateStatus(projectId, "error", "AI generated no new scenes");
      return NextResponse.json({ error: "No scenes generated" }, { status: 500 });
    }

    // 4. Stamp default models
    for (const scene of newScenes) {
      scene.defaultImageModel = "gpt-image-2-image-to-image";
      if (scene.modelHint === "seedance-1.5-pro") {
        scene.defaultVideoModel = "bytedance/seedance-1.5-pro";
      } else {
        scene.defaultVideoModel = "bytedance/seedance-2-fast";
      }
    }

    await updateStatus(projectId, "processing", `Creating ${newScenes.length} new frames...`);

    // 5. Create new storyboard items (appended after existing)
    let createdCount = 0;
    for (const scene of newScenes) {
      try {
        await convex.mutation(api.storyboard.storyboardItems.create, {
          projectId,
          sceneId: scene.sceneId,
          order: scene.order,
          title: scene.title,
          description: scene.description || "",
          duration: scene.duration || 5,
          generatedBy: clerkUserId,
        });
        createdCount++;
      } catch (err) {
        console.error(`[extend-script] Failed to create scene ${scene.sceneId}:`, err);
      }
    }

    // 6. Update frames with prompts and model defaults
    await updateStatus(projectId, "processing", "Attaching prompts to new frames...");

    const allItems = await convex.query(api.storyboard.storyboardItems.listByProject, {
      projectId,
    });

    for (const scene of newScenes) {
      const item = allItems.find((i: any) => i.sceneId === scene.sceneId);
      if (item) {
        try {
          await convex.mutation(api.storyboard.storyboardItems.update, {
            id: item._id,
            imagePrompt: scene.imagePrompt,
            videoPrompt: scene.videoPrompt,
            defaultImageModel: scene.defaultImageModel,
            defaultVideoModel: scene.defaultVideoModel,
          });
        } catch (err) {
          console.error(`[extend-script] Failed to update prompts for ${scene.sceneId}:`, err);
        }
      }
    }

    await updateStatus(projectId, "ready", `Extended with ${createdCount} new scenes`);

    return NextResponse.json({
      success: true,
      scenesCreated: createdCount,
      totalScenes: existingItems.length + createdCount,
    });
  } catch (error) {
    console.error("[extend-script] Failed:", error);
    await updateStatus(projectId, "error", `Extend failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Extend failed" },
      { status: 500 }
    );
  }
}
