import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const keys = await convex.query(api.storyboard.kieAiConfig.getAllKeys);
    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch KIE AI keys" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await convex.mutation(api.storyboard.kieAiConfig.createKey, {
      name: body.name,
      apiKey: body.apiKey,
      isDefault: body.isDefault ?? false,
    });
    return NextResponse.json({ success: true, id: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create key" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await convex.mutation(api.storyboard.kieAiConfig.updateKey, {
      id: body.id,
      name: body.name,
      apiKey: body.apiKey,
      isDefault: body.isDefault,
      isActive: body.isActive,
    });
    return NextResponse.json({ success: true, id: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update key" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }
    const result = await convex.mutation(api.storyboard.kieAiConfig.deleteKey, {
      id: body.id,
    });
    return NextResponse.json({ success: true, deletedId: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete key" },
      { status: 500 }
    );
  }
}
