import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// One-time migration: sets aspectRatio on existing generated files
// GET /api/storyboard/migrate-aspect-ratios
export async function GET() {
  try {
    console.log("[migrate-aspect-ratios] Starting migration...");
    const result = await convex.mutation(api.storyboard.gallery.migrateAspectRatios);
    console.log("[migrate-aspect-ratios] Done:", result);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[migrate-aspect-ratios] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
