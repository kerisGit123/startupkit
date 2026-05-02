// Thin HTTP wrapper around lib/storyboard/cleanupFiles.ts.
// Called directly from the browser (workspace single-item delete).
// Server-to-server callers (build-storyboard, delete-project) import the
// module directly to avoid the server-to-server auth problem.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { cleanupItemFiles } from "@/lib/storyboard/cleanupFiles";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
  try { if (!convexToken) convexToken = await authResult.getToken(); } catch {}
  if (convexToken) convex.setAuth(convexToken);

  const { itemIds = [], elementIds = [] } = await req.json();
  const result = await cleanupItemFiles(convex, itemIds, elementIds);

  return NextResponse.json({ success: result.errors === 0, ...result });
}
