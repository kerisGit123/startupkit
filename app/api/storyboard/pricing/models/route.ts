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
    console.log("POST request received with body:", body);
    
    if (body?.action === "resetDefaults") {
      console.log("Attempting to reset to defaults...");
      try {
        const result = await convex.mutation(api.storyboard.pricing.resetToDefaults, {});
        console.log("Reset successful:", result);
        return NextResponse.json(result);
      } catch (convexError) {
        console.error("Convex mutation failed:", convexError);
        throw convexError;
      }
    }

    const result = await convex.mutation(api.storyboard.pricing.createPricingModel, {
      modelId: body.modelId,
      modelName: body.modelName,
      modelType: body.modelType,
      pricingType: body.pricingType,
      creditCost: body.creditCost,
      factor: body.factor,
      formulaJson: body.formulaJson,
      assignedFunction: body.assignedFunction,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to create/reset pricing model(s):", err);
    return NextResponse.json(
      {
        error: "Failed to create/reset pricing models",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log("PUT request received");
    const body = await req.json();
    console.log("Request body:", body);
    
    const result = await convex.mutation(api.storyboard.pricing.updatePricingModel, body);
    console.log("Convex mutation result:", result);
    
    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to update pricing model:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { 
        error: "Failed to update pricing model",
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("DELETE request received");
    const body = await req.json();
    console.log("Request body:", body);
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }
    
    console.log("Deleting model by _id:", body.id);
    
    const result = await convex.mutation(api.storyboard.pricing.deletePricingModel, { id: body.id });
    console.log("Convex delete result:", result);
    
    return NextResponse.json({ success: true, deletedId: result });
  } catch (err) {
    console.error("Failed to delete pricing model:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { 
        error: "Failed to delete pricing model",
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
