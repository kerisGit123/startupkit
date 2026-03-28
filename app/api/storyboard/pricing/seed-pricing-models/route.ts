import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    console.log("[seed-pricing] Seeding pricing models...");
    
    const result = await convex.mutation(api.storyboard.pricing.seedPricingModels);
    
    console.log("[seed-pricing] Seeding completed:", result);
    
    return NextResponse.json({
      success: true,
      message: "Pricing models seeded successfully",
      result
    });
  } catch (error) {
    console.error("[seed-pricing] Error seeding pricing models:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to seed pricing models",
        details: error instanceof Error ? error.stack : "No stack trace"
      },
      { status: 500 }
    );
  }
}
