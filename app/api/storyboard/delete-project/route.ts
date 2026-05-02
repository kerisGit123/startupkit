import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { cleanupItemFiles } from "@/lib/storyboard/cleanupFiles";
import type { Id } from "@/convex/_generated/dataModel";

// Full project deletion cascade:
// 1. R2 cleanup for all items + elements (via cleanup-item-files)
//    — AI-generated files: soft-deleted (record kept, status="deleted", r2Key="", categoryId=null)
//    — User-uploaded files: hard-deleted (record gone)
// 2. Convex cascade: items → elements → files → project record
//
// Must be called as an API route (not a Convex mutation) because R2 deletion
// requires server-side HTTP calls that Convex mutations cannot make.

export const maxDuration = 120;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function DELETE(req: NextRequest) {
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
  try { if (!convexToken) convexToken = await authResult.getToken(); } catch {}
  if (convexToken) convex.setAuth(convexToken);

  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await convex.query(api.storyboard.projects.get, {
    id: projectId as Id<"storyboard_projects">,
  });

  if (!project || project.ownerId !== authResult.userId) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
  }

  // Step 1: Collect all items and elements to clean up
  const [allItems, allElements] = await Promise.all([
    convex.query(api.storyboard.build.listItemsForBuild, {
      projectId: projectId as Id<"storyboard_projects">,
    }),
    convex.query(api.storyboard.build.listElementsForBuild, {
      projectId: projectId as Id<"storyboard_projects">,
    }),
  ]);

  const itemIds = allItems.map((i: any) => i._id);
  const elementIds = allElements.map((e: any) => e._id);

  // Step 2: R2 cleanup + mark files correctly (AI: soft-delete, uploaded: hard-delete)
  if (itemIds.length > 0 || elementIds.length > 0) {
    await cleanupItemFiles(convex, itemIds, elementIds);
  }

  // Step 3: Cascade-delete Convex records (items → elements → files → project)
  // The projects.remove mutation handles the Convex side; R2 is already clean.
  await convex.mutation(api.storyboard.projects.remove, {
    id: projectId as Id<"storyboard_projects">,
  });

  return NextResponse.json({ success: true });
}
