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
  // 1. Auth
  const authResult = await auth();
  const clerkUserId = authResult.userId;
  if (!clerkUserId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try {
    convexToken = await authResult.getToken({ template: "convex" });
  } catch {
    try { convexToken = await authResult.getToken(); } catch {}
  }
  if (convexToken) convex.setAuth(convexToken);

  const body = await req.json();
  const {
    projectId,
    rebuildStrategy = "replace_all",
    replaceSceneIds,           // For replace_section: ["1A", "1B", "2"]
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
    await updateStatus(projectId, "processing", "Starting storyboard build...");

    // ── Load existing data (for smart_merge and replace_section) ───────────

    let existingElementMap = new Map<string, { id: Id<"storyboard_elements">; name: string; type: string }>();
    let existingItemsBySceneId = new Map<string, { _id: Id<"storyboard_items">; sceneId: string }>();
    let maxExistingOrder = 0;

    const needsExistingData = rebuildStrategy === "smart_merge" || rebuildStrategy === "replace_section";

    if (needsExistingData) {
      await updateStatus(projectId, "processing", "Loading existing data...");

      const existingElements = await convex.query(api.storyboard.build.listElementsForBuild, { projectId });
      for (const el of existingElements) {
        const key = `${el.name.toLowerCase().trim()}::${el.type}`;
        existingElementMap.set(key, { id: el._id, name: el.name, type: el.type });
      }

      const existingItems = await convex.query(api.storyboard.build.listItemsForBuild, { projectId });
      for (const item of existingItems) {
        if (item.sceneId) existingItemsBySceneId.set(item.sceneId, { _id: item._id, sceneId: item.sceneId });
        if (typeof item.order === "number" && item.order >= maxExistingOrder) {
          maxExistingOrder = item.order + 1;
        }
      }

      console.log(`[build-storyboard] Existing: ${existingElementMap.size} elements, ${existingItemsBySceneId.size} scenes`);
    }

    // ── Clear data based on strategy ──────────────────────────────────────

    if (rebuildStrategy === "replace_all") {
      await updateStatus(projectId, "processing", "Clearing all frames and elements...");
      await convex.mutation(api.storyboard.build.clearExistingData, { projectId });
    }

    if (rebuildStrategy === "replace_section" && replaceSceneIds?.length > 0) {
      await updateStatus(projectId, "processing", `Clearing ${replaceSceneIds.length} scenes...`);
      await convex.mutation(api.storyboard.build.clearItemsBySceneIds, {
        projectId,
        sceneIds: replaceSceneIds,
      });
      // Remove cleared scenes from existing map so they get recreated
      for (const sid of replaceSceneIds) {
        existingItemsBySceneId.delete(sid);
      }
    }

    // ── Analyze script ────────────────────────────────────────────────────

    const analysis = await analyzeScript(script, async (message) => {
      await updateStatus(projectId, "processing", message);
    });

    if (analysis.scenes.length === 0) {
      await updateStatus(projectId, "error", "Could not parse any scenes from the script.");
      return NextResponse.json({ success: false, error: "No scenes found" }, { status: 422 });
    }

    // ── Save elements (with deduplication) ────────────────────────────────

    const savedElementMap = new Map<string, Id<"storyboard_elements">>();
    let elementsReused = 0;
    let elementsCreated = 0;

    await updateStatus(projectId, "processing", `Processing ${analysis.elements.length} elements...`);

    for (const element of analysis.elements) {
      const dedupeKey = `${element.name.toLowerCase().trim()}::${element.type}`;

      // Reuse existing element if found
      if (needsExistingData && existingElementMap.has(dedupeKey)) {
        const existing = existingElementMap.get(dedupeKey)!;
        savedElementMap.set(element.name, existing.id);
        elementsReused++;
        continue;
      }

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
          elementsCreated++;
        }
      } catch (err) {
        console.error(`[build-storyboard] Failed to save element ${element.name}:`, err);
      }
    }

    console.log(`[build-storyboard] Elements: ${elementsReused} reused, ${elementsCreated} created`);

    // ── Save scenes ───────────────────────────────────────────────────────

    let scenesCreated = 0;
    let scenesUpdated = 0;
    let scenesSkipped = 0;
    let nextOrder = rebuildStrategy === "replace_all" ? 0 : maxExistingOrder;

    await updateStatus(projectId, "processing", `Creating storyboard frames...`);

    for (const scene of analysis.scenes) {
      // Build linked elements
      const linkedElements: { id: Id<"storyboard_elements">; name: string; type: string }[] = [];
      for (const element of analysis.elements) {
        if (element.sceneIds.includes(scene.sceneId)) {
          const elementId = savedElementMap.get(element.name);
          if (elementId) {
            linkedElements.push({ id: elementId, name: element.name, type: element.type });
          }
        }
      }

      // ── smart_merge: update existing or create new ────────────────────
      if (rebuildStrategy === "smart_merge") {
        const existing = existingItemsBySceneId.get(scene.sceneId);
        if (existing) {
          // Update prompts on the existing scene
          try {
            await convex.mutation(api.storyboard.storyboardItems.update, {
              id: existing._id,
              title: scene.title,
              description: scene.description,
              imagePrompt: scene.imagePrompt || undefined,
              videoPrompt: scene.videoPrompt || undefined,
              duration: scene.duration,
              linkedElements: linkedElements.length > 0 ? linkedElements : undefined,
            });
            scenesUpdated++;
          } catch (err) {
            console.error(`[build-storyboard] Failed to update scene ${scene.sceneId}:`, err);
          }
          continue;
        }
        // Fall through to create new scene below
      }

      // ── replace_section: skip scenes outside the target range ─────────
      if (rebuildStrategy === "replace_section") {
        const isTarget = replaceSceneIds?.includes(scene.sceneId);
        if (!isTarget) {
          scenesSkipped++;
          continue;
        }
      }

      // ── Create new scene ──────────────────────────────────────────────
      try {
        const order = rebuildStrategy === "replace_all" ? scene.order : nextOrder++;

        await convex.mutation(api.storyboard.storyboardItems.create, {
          projectId,
          sceneId: scene.sceneId,
          order,
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
        scenesCreated++;
      } catch (err) {
        console.error(`[build-storyboard] Failed to save scene ${scene.sceneId}:`, err);
      }
    }

    console.log(`[build-storyboard] Scenes: ${scenesCreated} created, ${scenesUpdated} updated, ${scenesSkipped} skipped`);

    // ── Save preamble ─────────────────────────────────────────────────────

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

    // ── Done ──────────────────────────────────────────────────────────────

    const parts: string[] = [];
    if (scenesCreated) parts.push(`${scenesCreated} created`);
    if (scenesUpdated) parts.push(`${scenesUpdated} updated`);
    if (elementsReused) parts.push(`${elementsReused} elements reused`);
    const summary = parts.length > 0 ? ` (${parts.join(", ")})` : "";

    await updateStatus(projectId, "ready", `Build complete${summary}`);

    return NextResponse.json({
      success: true,
      confidence: analysis.confidence,
      parseMethod: analysis.parseMethod,
      summary: {
        title: analysis.title,
        genre: analysis.genre,
        totalDuration: analysis.totalDuration,
        acts: analysis.actCount,
        scenesCreated,
        scenesUpdated,
        scenesSkipped,
        elementsCreated,
        elementsReused,
      },
    });
  } catch (error) {
    console.error("[build-storyboard] Build failed:", error);
    await updateStatus(projectId, "error", `Build failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Build failed" },
      { status: 500 }
    );
  }
}
