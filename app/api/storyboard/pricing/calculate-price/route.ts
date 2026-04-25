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

        case 'getSeedance15': {
          // Seedance 1.5 Pro: fixed Kie credit costs per resolution/duration/audio
          // Audio = 2x the no-audio Kie cost. Kie rates from API docs:
          //   480p: 4s=7, 8s=14, 12s=19 | 720p: 4s=14, 8s=28, 12s=42 | 1080p: 4s=30, 8s=60, 12s=90
          const s15KieCosts: Record<string, Record<string, number>> = {
            '480p': { '4': 7, '8': 14, '12': 19 },
            '480P': { '4': 7, '8': 14, '12': 19 },
            '720p': { '4': 14, '8': 28, '12': 42 },
            '720P': { '4': 14, '8': 28, '12': 42 },
            '1080p': { '4': 30, '8': 60, '12': 90 },
            '1080P': { '4': 30, '8': 60, '12': 90 },
          };
          const s15ResCosts = s15KieCosts[resolution] || s15KieCosts['480p'];
          // Find closest duration tier (4, 8, or 12)
          const s15Dur = duration <= 4 ? '4' : duration <= 8 ? '8' : '12';
          const s15KieBase = s15ResCosts[s15Dur] || s15ResCosts['4'];
          const s15AudioMul = audio ? 2 : 1;
          credits = Math.ceil(s15KieBase * s15AudioMul * (model.factor || 1));
          console.log("[pricing-calc] Seedance 1.5 Pro formula:", {
            resolution, duration, s15Dur, audio, kieBase: s15KieBase, audioMul: s15AudioMul, factor: model.factor, result: credits
          });
          break;
        }

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
          // with_input (img2vid) = CHEAPER per second (has reference frame)
          // no_input (txt2vid) = MORE EXPENSIVE per second (generates from scratch)
          // 480p: with_input=11.5, no_input=19 | 720p: with_input=25, no_input=41
          const seed20Costs: Record<string, { withInput: number; noInput: number }> = {
            '480p': { withInput: 11.5, noInput: 19 },
            '720p': { withInput: 25, noInput: 41 },
          };
          const seed20Res = seed20Costs[resolution] || seed20Costs['480p'];
          const seed20CostPerSec = audio ? seed20Res.withInput : seed20Res.noInput;
          credits = Math.ceil(seed20CostPerSec * duration * (model.factor || 1));
          console.log("[pricing-calc] Seedance 2.0 formula:", {
            resolution, hasVideoInput: audio, costPerSec: seed20CostPerSec, duration, factor: model.factor, result: credits
          });
          break;
        }

        case 'getSeedance20Fast': {
          // Per-second pricing, same structure as Seedance 2.0 but cheaper rates
          // with_input (img2vid) = CHEAPER | no_input (txt2vid) = MORE EXPENSIVE
          // 480p: with_input=9, no_input=15.5 | 720p: with_input=20, no_input=33
          const seed20fCosts: Record<string, { withInput: number; noInput: number }> = {
            '480p': { withInput: 9, noInput: 15.5 },
            '720p': { withInput: 20, noInput: 33 },
          };
          const seed20fRes = seed20fCosts[resolution] || seed20fCosts['480p'];
          const seed20fCostPerSec = audio ? seed20fRes.withInput : seed20fRes.noInput;
          credits = Math.ceil(seed20fCostPerSec * duration * (model.factor || 1));
          console.log("[pricing-calc] Seedance 2.0 Fast formula:", {
            resolution, hasVideoInput: audio, costPerSec: seed20fCostPerSec, duration, factor: model.factor, result: credits
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
