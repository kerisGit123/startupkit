import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { modelId, quality = '1K', resolution = '720p', audio = false, duration = 5, upscaleFactor = '1x' } = await req.json();
    
    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    console.log("[pricing-calc] Calculating price for model:", modelId);

    // Get the pricing model from database
    const model = await convex.query(api.storyboard.pricing.getPricingModelByModelId, { modelId });
    if (!model) {
      console.log("[pricing-calc] Model not found in price management, using fallback");
      return NextResponse.json({ 
        success: true, 
        credits: 0, // Fallback to 0 if not found
        modelName: 'Unknown',
        pricingType: 'unknown',
        message: 'Model not found in price management system'
      });
    }

    console.log("[pricing-calc] Found model in price management:", {
      modelName: model.modelName,
      pricingType: model.pricingType,
      assignedFunction: model.assignedFunction,
      creditCost: model.creditCost,
      factor: model.factor
    });

    let credits = 0;

    if (model.pricingType === 'fixed') {
      // Fixed pricing: creditCost * factor
      credits = Math.ceil((model.creditCost || 0) * (model.factor || 1));
      console.log("[pricing-calc] Fixed pricing calculation:", {
        creditCost: model.creditCost,
        factor: model.factor,
        result: credits
      });
    } else if (model.pricingType === 'formula' && model.assignedFunction) {
      // Formula-based pricing: use the assigned function
      console.log("[pricing-calc] Using formula function:", model.assignedFunction);
      
      switch (model.assignedFunction) {
        case 'getNanoBananaPrice':
          // getNanoBananaPrice(base, multiplier, quality)
          const qualityMultipliers = {
            '1K': 1,
            '2K': 1.5,
            '4K': 2.25
          };
          const qualityMultiplier = qualityMultipliers[quality] || 1;
          credits = Math.ceil((model.creditCost || 0) * (model.factor || 1) * qualityMultiplier);
          console.log("[pricing-calc] Nano Banana formula calculation:", {
            base: model.creditCost,
            factor: model.factor,
            quality,
            qualityMultiplier,
            result: credits
          });
          break;

        case 'getSeedance15':
          // getSeedance15(base, multiplier, resolution, audio, duration)
          const resolutionMultipliers = {
            '480p': 1,
            '720p': 2,
            '1080p': 4,
            '4K': 5
          };
          const audioMultiplier = audio ? 1.5 : 1;
          const durationMultiplier = Math.ceil(duration / 5); // Every 5 seconds adds multiplier
          const resolutionMultiplier = resolutionMultipliers[resolution] || 1;
          credits = Math.ceil((model.creditCost || 0) * (model.factor || 1) * resolutionMultiplier * audioMultiplier * durationMultiplier);
          console.log("[pricing-calc] Seedance formula calculation:", {
            base: model.creditCost,
            factor: model.factor,
            resolution,
            audio,
            duration,
            resolutionMultiplier,
            audioMultiplier,
            durationMultiplier,
            result: credits
          });
          break;

        case 'getTopazUpscale':
          // getTopazUpscale(base, multiplier, upscaleFactor)
          const upscaleMultipliers = {
            '1x': 1,
            '2x': 2,
            '3x': 3,
            '4x': 4
          };
          const upscaleMultiplier = upscaleMultipliers[upscaleFactor] || 1;
          credits = Math.ceil((model.creditCost || 0) * (model.factor || 1) * upscaleMultiplier);
          console.log("[pricing-calc] Topaz Upscale formula calculation:", {
            base: model.creditCost,
            factor: model.factor,
            upscaleFactor,
            upscaleMultiplier,
            result: credits
          });
          break;

        case 'getTopazVideoUpscale': {
          // Per-second pricing: upscale factor cost * duration * factor
          // 1x/2x = 8 credits/s, 4x = 14 credits/s
          const topazFactorCosts: Record<string, number> = { '1': 8, '1x': 8, '2': 8, '2x': 8, '4': 14, '4x': 14 };
          const topazCostPerSec = topazFactorCosts[upscaleFactor] || (model.creditCost || 8);
          credits = Math.ceil(topazCostPerSec * duration * (model.factor || 1));
          console.log("[pricing-calc] Topaz Video Upscale formula:", {
            upscaleFactor, costPerSec: topazCostPerSec, duration, factor: model.factor, result: credits
          });
          break;
        }

        case 'getKlingMotionControl': {
          // Per-second pricing: resolution cost * duration * factor
          // 720p = 20 credits/s, 1080p = 27 credits/s
          const klingCosts: Record<string, number> = { '720p': 20, '1080p': 27 };
          const klingCostPerSec = klingCosts[resolution] || (model.creditCost || 20);
          credits = Math.ceil(klingCostPerSec * duration * (model.factor || 1));
          console.log("[pricing-calc] Kling Motion Control formula:", {
            resolution, costPerSec: klingCostPerSec, duration, factor: model.factor, result: credits
          });
          break;
        }

        case 'getSeedance20': {
          // Per-second pricing: resolution + video input type * duration * factor
          // no_video = cheaper (text-to-video), video_input = more expensive (image/video-to-video)
          // 480p: no_video=11.5, video_input=19 | 720p: no_video=25, video_input=41
          const seedCosts: Record<string, { noVideo: number; videoInput: number }> = {
            '480p': { noVideo: 11.5, videoInput: 19 },
            '720p': { noVideo: 25, videoInput: 41 },
          };
          const seedRes = seedCosts[resolution] || seedCosts['480p'];
          const seedCostPerSec = audio ? seedRes.videoInput : seedRes.noVideo;
          credits = Math.ceil(seedCostPerSec * duration * (model.factor || 1));
          console.log("[pricing-calc] Seedance 2.0 formula:", {
            resolution, hasVideoInput: audio, costPerSec: seedCostPerSec, duration, factor: model.factor, result: credits
          });
          break;
        }

        case 'getInfinitalkFromAudio': {
          const itCosts: Record<string, number> = { "480p": 3, "480P": 3, "720p": 12, "720P": 12 };
          const itCostPerSec = itCosts[resolution] || model.creditCost || 3;
          credits = Math.ceil(itCostPerSec * duration * (model.factor || 1));
          console.log("[pricing-calc] InfiniteTalk formula:", { resolution, costPerSec: itCostPerSec, duration, factor: model.factor, result: credits });
          break;
        }

        default:
          console.log("[pricing-calc] Unknown formula function, using simple calculation");
          // Fallback to simple calculation
          credits = Math.ceil((model.creditCost || 0) * (model.factor || 1));
      }
    } else {
      console.log("[pricing-calc] No pricing type or function, using simple calculation");
      // Fallback to simple calculation
      credits = Math.ceil((model.creditCost || 0) * (model.factor || 1));
    }

    console.log("[pricing-calc] Final calculated credits:", credits);

    return NextResponse.json({
      success: true,
      credits,
      modelName: model.modelName,
      pricingType: model.pricingType,
      assignedFunction: model.assignedFunction,
      baseCost: model.creditCost,
      factor: model.factor,
      calculation: {
        modelId,
        quality,
        resolution,
        audio,
        duration,
        upscaleFactor
      }
    });

  } catch (error) {
    console.error("[pricing-calc] Error calculating price:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to calculate price",
        details: error instanceof Error ? error.stack : "No stack trace"
      },
      { status: 500 }
    );
  }
}
