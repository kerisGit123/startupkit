import { NextRequest, NextResponse } from "next/server";
import { PricingCalculator, PricingParams } from "../../../../lib/pricing/calculator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { modelId, quality, resolution, duration, hasAudio } = body;
    
    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }
    
    // Build pricing parameters
    const pricingParams: PricingParams = {
      modelId,
      quality,
      resolution,
      duration,
      hasAudio,
      ...body // Allow additional parameters
    };
    
    // Calculate cost using the pricing calculator
    const costResult = await PricingCalculator.calculateCost(pricingParams);
    
    // Return successful calculation
    return NextResponse.json({
      success: true,
      data: {
        modelId: pricingParams.modelId,
        credits: costResult.credits,
        breakdown: costResult.breakdown,
        params: pricingParams
      }
    });
    
  } catch (error) {
    console.error("[Pricing Validation API Error]", error);
    
    // Handle pricing errors specifically
    if (error instanceof Error && error.name === 'PricingError') {
      const pricingError = error as any;
      return NextResponse.json(
        { 
          error: pricingError.message,
          code: pricingError.code,
          details: pricingError.details
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: "Failed to calculate pricing", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('modelType') as 'image' | 'video';
    
    if (!modelType || !['image', 'video'].includes(modelType)) {
      return NextResponse.json(
        { error: "Valid modelType (image or video) is required" },
        { status: 400 }
      );
    }
    
    // Get available models for the specified type
    const models = await PricingCalculator.getAvailableModels(modelType);
    
    return NextResponse.json({
      success: true,
      data: {
        modelType,
        models: models.map(model => ({
          modelId: model.modelId,
          modelName: model.modelName,
          modelType: model.modelType,
          pricingType: model.pricingType,
          isActive: model.isActive
        }))
      }
    });
    
  } catch (error) {
    console.error("[Pricing Models API Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch available models", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
