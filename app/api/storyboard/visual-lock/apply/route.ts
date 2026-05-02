import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface UpdatedElement {
  elementId: string;
  newDescription: string;
  newIdentity: Record<string, any>;
}

export async function POST(req: NextRequest) {
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
  try { if (!convexToken) convexToken = await authResult.getToken(); } catch {}

  const { projectId, updatedElements, newScript, rebuildScenes, affectedSceneIds } = await req.json() as {
    projectId: string;
    updatedElements: UpdatedElement[];
    newScript?: string;
    rebuildScenes?: boolean;
    affectedSceneIds?: string[];
  };

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (convexToken) convex.setAuth(convexToken);

  const results: { step: string; success: boolean; error?: string }[] = [];

  // 1. Update element descriptions + identity
  for (const el of updatedElements) {
    try {
      await convex.mutation(api.storyboard.storyboardElements.update, {
        id: el.elementId as Id<"storyboard_elements">,
        description: el.newDescription,
        identity: el.newIdentity,
      });
      results.push({ step: `element:${el.elementId}`, success: true });
    } catch (err) {
      console.error(`[visual-lock/apply] Failed to update element ${el.elementId}:`, err);
      results.push({ step: `element:${el.elementId}`, success: false, error: String(err) });
    }
  }

  // 2. Save updated script
  if (newScript) {
    try {
      await convex.mutation(api.storyboard.projects.update, {
        id: projectId as Id<"storyboard_projects">,
        script: newScript,
      });
      results.push({ step: "script", success: true });
    } catch (err) {
      console.error("[visual-lock/apply] Failed to save script:", err);
      results.push({ step: "script", success: false, error: String(err) });
    }
  }

  // 3. Trigger storyboard rebuild if requested
  if (rebuildScenes) {
    try {
      const hasExistingItems = await convex.query(api.storyboard.build.listItemsForBuild, {
        projectId: projectId as Id<"storyboard_projects">,
      });

      const strategy = hasExistingItems?.length > 0 && affectedSceneIds?.length
        ? "replace_section"
        : "replace_all";

      // Fire-and-forget — same pattern as BuildStoryboardDialogSimplified
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/storyboard/build-storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          rebuildStrategy: strategy,
          replaceSceneIds: strategy === "replace_section" ? affectedSceneIds : undefined,
        }),
      }).catch(err => console.error("[visual-lock/apply] Rebuild trigger failed:", err));

      results.push({ step: "rebuild_triggered", success: true });
    } catch (err) {
      results.push({ step: "rebuild", success: false, error: String(err) });
    }
  }

  const allOk = results.every(r => r.success);
  return NextResponse.json({ success: allOk, results });
}
