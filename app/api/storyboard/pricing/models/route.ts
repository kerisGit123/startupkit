import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const models = await convex.query(api.storyboard.pricing.getAllPricingModels);
    return NextResponse.json(models);
  } catch (err) {
    console.error("Failed to fetch pricing models:", err);
    return NextResponse.json(
      { error: "Failed to fetch pricing models" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await convex.mutation(api.storyboard.pricing.resetToDefaults, body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to reset pricing models:", err);
    return NextResponse.json(
      { error: "Failed to reset pricing models" },
      { status: 500 }
    );
  }
}
