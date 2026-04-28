import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { analyzeScript } from "@/lib/storyboard/scriptAnalyzer";
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
  // 1. Auth + get Convex token
  const authResult = await auth();
  const clerkUserId = authResult.userId;
  if (!clerkUserId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Set Convex auth token so mutations requiring identity work
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
  const {
    projectId,
    rebuildStrategy = "replace_all",
  } = body;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // 2. Verify ownership
  const project = await convex.query(api.storyboard.projects.get, { id: projectId });
  if (!project || project.ownerId !== clerkUserId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const script = project.script;
  if (!script || script.trim().length < 20) {
    return NextResponse.json({ error: "Script is empty or too short" }, { status: 400 });
  }

  try {
    // 3. Set processing status
    await updateStatus(projectId, "processing", "Starting storyboard build...");

    // 4. Clear existing data if replace_all
    if (rebuildStrategy === "replace_all") {
      await updateStatus(projectId, "processing", "Clearing existing frames...");
      await convex.mutation(api.storyboard.build.clearExistingData, { projectId });
    }

    // 5. Analyze script with AI
    const analysis = await analyzeScript(script, async (message) => {
      await updateStatus(projectId, "processing", message);
    });

    if (analysis.scenes.length === 0) {
      await updateStatus(projectId, "error", "Could not parse any scenes from the script. Try formatting scenes as: SCENE 1: Title");
      return NextResponse.json({
        success: false,
        error: "No scenes found in script",
        confidence: analysis.confidence,
      }, { status: 422 });
    }

    // 6. Save elements
    console.log(`[build-storyboard] Analysis complete: ${analysis.scenes.length} scenes, ${analysis.elements.length} elements, confidence: ${analysis.confidence}`);
    if (analysis.elements.length > 0) {
      console.log(`[build-storyboard] Elements:`, analysis.elements.map(e => `${e.name} (${e.type}, ${e.sceneIds.length} scenes)`));
    }
    await updateStatus(
      projectId,
      "processing",
      `Creating ${analysis.elements.length} elements...`
    );

    const savedElementMap = new Map<string, Id<"storyboard_elements">>();

    for (const element of analysis.elements) {
      try {
        const saved = await convex.mutation(api.storyboard.storyboardElements.create, {
          projectId,
          name: element.name,
          type: element.type,
          description: element.description,
          thumbnailUrl: "",
          referenceUrls: [],
          tags: element.tags,
          createdBy: clerkUserId,
          visibility: "private",
        });
        if (saved) {
          savedElementMap.set(element.name, saved);
        }
      } catch (err) {
        console.error(`[build-storyboard] Failed to save element ${element.name}:`, err);
      }
    }

    // 7. Save scenes as storyboard items
    await updateStatus(
      projectId,
      "processing",
      `Creating ${analysis.scenes.length} storyboard frames...`
    );

    let savedSceneCount = 0;
    for (const scene of analysis.scenes) {
      try {
        // Build linked elements for this scene
        const linkedElements: { id: Id<"storyboard_elements">; name: string; type: string }[] = [];
        for (const element of analysis.elements) {
          if (element.sceneIds.includes(scene.sceneId)) {
            const elementId = savedElementMap.get(element.name);
            if (elementId) {
              linkedElements.push({
                id: elementId,
                name: element.name,
                type: element.type,
              });
            }
          }
        }

        // Create frame with prompts + model defaults in one call (no separate update step)
        await convex.mutation(api.storyboard.storyboardItems.create, {
          projectId,
          sceneId: scene.sceneId,
          order: scene.order,
          title: scene.title,
          description: scene.description,
          duration: scene.duration,
          generatedBy: clerkUserId,
          imagePrompt: scene.imagePrompt || undefined,
          videoPrompt: scene.videoPrompt || undefined,
          defaultImageModel: scene.defaultImageModel,
          defaultVideoModel: scene.defaultVideoModel,
          linkedElements: linkedElements.length > 0 ? linkedElements : undefined,
        });

        savedSceneCount++;
      } catch (err) {
        console.error(`[build-storyboard] Failed to save scene ${scene.sceneId}:`, err);
      }
    }

    // 9. Save preamble as project description (if available)
    if (analysis.preamble) {
      try {
        await convex.mutation(api.storyboard.build.updateProjectDescription, {
          projectId,
          description: analysis.preamble,
        });
      } catch (err) {
        console.error("[build-storyboard] Failed to save preamble:", err);
      }
    }

    // 10. Done
    await updateStatus(projectId, "ready", "Storyboard built successfully");

    return NextResponse.json({
      success: true,
      confidence: analysis.confidence,
      parseMethod: analysis.parseMethod,
      summary: {
        title: analysis.title,
        genre: analysis.genre,
        totalDuration: analysis.totalDuration,
        acts: analysis.actCount,
        scenes: savedSceneCount,
        elements: savedElementMap.size,
      },
    });
  } catch (error) {
    console.error("[build-storyboard] Build failed:", error);

    await updateStatus(
      projectId,
      "error",
      `Build failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Build failed" },
      { status: 500 }
    );
  }
}
