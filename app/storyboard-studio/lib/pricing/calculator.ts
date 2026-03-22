// Pricing Calculator Service
// Handles all pricing calculations for AI models

export interface PricingParams {
  modelId: string;
  quality?: string;
  resolution?: string;
  duration?: string;
  hasAudio?: boolean;
  [key: string]: any; // Allow additional parameters
}

// Import Convex functions for database queries
import { api } from "../../../convex/_generated/api";

export interface CostResult {
  credits: number;
  breakdown: {
    method: 'fixed' | 'formula';
    calculation: string;
    steps: string[];
    baseCost?: number;
    multipliers?: Record<string, number>;
  };
}

// Custom error class for consistent error handling
export class PricingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PricingError';
  }
}

export class PricingCalculator {
  static async calculateCost(params: PricingParams): Promise<CostResult> {
    // Get config from database instead of hardcoded
    const config = await this.getModelConfig(params.modelId);
    if (!config) {
      throw new PricingError(`Model ${params.modelId} not found`, 'MODEL_NOT_FOUND');
    }

    if (config.pricingType === 'fixed') {
      return this.calculateFixedCost(config, params);
    } else if (config.pricingType === 'formula') {
      return this.calculateFormulaCost(config, params);
    }
    
    throw new PricingError(`Invalid pricing type for model ${params.modelId}`, 'INVALID_PRICING_TYPE');
  }

  private static async getModelConfig(modelId: string): Promise<any> {
    try {
      // This will be implemented with Convex queries
      // For now, return mock data to test the calculator
      const mockConfigs: Record<string, any> = {
        'nano-banana-2': {
          modelId: 'nano-banana-2',
          modelName: 'Nano Banana 2',
          modelType: 'image',
          isActive: true,
          pricingType: 'formula',
          formula: {
            base_cost: 8,
            qualities: [
              { name: '1K', cost: 8 },
              { name: '2K', cost: 12 },
              { name: '4K', cost: 18 }
            ]
          }
        },
        'seedance-1.5-pro': {
          modelId: 'seedance-1.5-pro',
          modelName: 'Seedance 1.5 Pro',
          modelType: 'video',
          isActive: true,
          pricingType: 'formula',
          formula: {
            base_cost: 7,
            resolution_multipliers: { '480P': 1, '720P': 2, '1080P': 4 },
            audio_multiplier: 2,
            duration_multipliers: { '4s': 1, '8s': 2, '12s': 4 }
          }
        },
        'flux-2-pro': {
          modelId: 'flux-2-pro',
          modelName: 'Flux 2 Pro',
          modelType: 'image',
          isActive: true,
          pricingType: 'fixed',
          creditCost: 5,
          factor: 1.0
        }
      };

      const config = mockConfigs[modelId];
      if (!config || !config.isActive) {
        return null;
      }
      
      return config;
    } catch (error) {
      throw new PricingError(`Failed to fetch model config: ${error instanceof Error ? error.message : 'Unknown error'}`, 'DATABASE_ERROR');
    }
  }

  private static calculateFixedCost(config: any, params: PricingParams): CostResult {
    const baseCost = config.creditCost || 0;
    const factor = config.factor || 1;
    const rawCost = baseCost * factor;
    const totalCredits = Math.ceil(rawCost); // Round up to nearest whole number

    return {
      credits: totalCredits,
      breakdown: {
        method: 'fixed',
        calculation: `${baseCost} × ${factor} = ${rawCost} → ${totalCredits} (ceiling)`,
        steps: [
          `Base cost: ${baseCost} credits`,
          `Multiplier: ${factor}`,
          `Raw cost: ${rawCost} credits`,
          `Final: ${totalCredits} credits (rounded up)`
        ]
      }
    };
  }

  private static calculateFormulaCost(config: any, params: PricingParams): CostResult {
    const formula = config.formula;
    const steps: string[] = [];
    let totalCredits = 0;
    const multipliers: Record<string, number> = {};

    // Handle quality-based formulas (e.g., Nano Banana)
    if (formula.qualities) {
      const quality = params.quality || '1K'; // Default quality
      const qualityConfig = formula.qualities.find((q: any) => q.name === quality);
      
      if (!qualityConfig) {
        throw new PricingError(`Quality ${quality} not available for model ${params.modelId}`, 'INVALID_QUALITY', { 
          availableQualities: formula.qualities.map((q: any) => q.name),
          requestedQuality: quality 
        });
      }
      
      totalCredits = Math.ceil(qualityConfig.cost); // Round up to nearest whole number
      steps.push(`Quality (${quality}): ${qualityConfig.cost} → ${totalCredits} credits (ceiling)`);
      
      return {
        credits: totalCredits,
        breakdown: {
          method: 'formula',
          calculation: `Quality-based: ${quality} = ${totalCredits} credits`,
          steps,
          baseCost: formula.base_cost,
          multipliers: { [quality]: qualityConfig.cost }
        }
      };
    }

    // Handle multiplier-based formulas (e.g., Seedance video)
    if (formula.resolution_multipliers || formula.duration_multipliers) {
      let cost = formula.base_cost || 0;
      steps.push(`Base cost: ${cost} credits`);

      // Validate required parameters and apply multipliers
      if (formula.resolution_multipliers) {
        if (!params.resolution) {
          throw new PricingError(`Resolution required for model ${params.modelId}`, 'MISSING_RESOLUTION', {
            availableResolutions: Object.keys(formula.resolution_multipliers)
          });
        }
        const resMultiplier = formula.resolution_multipliers[params.resolution];
        if (!resMultiplier) {
          throw new PricingError(`Resolution ${params.resolution} not available for model ${params.modelId}`, 'INVALID_RESOLUTION', {
            availableResolutions: Object.keys(formula.resolution_multipliers),
            requestedResolution: params.resolution
          });
        }
        cost *= resMultiplier;
        multipliers.resolution = resMultiplier;
        steps.push(`Resolution (${params.resolution}): ×${resMultiplier} = ${cost} credits`);
      }

      if (formula.duration_multipliers) {
        if (!params.duration) {
          throw new PricingError(`Duration required for model ${params.modelId}`, 'MISSING_DURATION', {
            availableDurations: Object.keys(formula.duration_multipliers)
          });
        }
        const durMultiplier = formula.duration_multipliers[params.duration];
        if (!durMultiplier) {
          throw new PricingError(`Duration ${params.duration} not available for model ${params.modelId}`, 'INVALID_DURATION', {
            availableDurations: Object.keys(formula.duration_multipliers),
            requestedDuration: params.duration
          });
        }
        cost *= durMultiplier;
        multipliers.duration = durMultiplier;
        steps.push(`Duration (${params.duration}): ×${durMultiplier} = ${cost} credits`);
      }

      if (formula.audio_multiplier) {
        cost *= formula.audio_multiplier;
        multipliers.audio = formula.audio_multiplier;
        steps.push(`Audio: ×${formula.audio_multiplier} = ${cost} credits`);
      }

      totalCredits = Math.ceil(cost); // Round up to nearest whole number
      steps.push(`Final total: ${cost} → ${totalCredits} credits (ceiling)`);

      return {
        credits: totalCredits,
        breakdown: {
          method: 'formula',
          calculation: `Formula-based: ${totalCredits} credits`,
          steps,
          baseCost: formula.base_cost,
          multipliers
        }
      };
    }

    throw new PricingError(`Invalid formula structure for model ${params.modelId}`, 'INVALID_FORMULA', { formula });
  }
  
  static async getAvailableModels(modelType: "image" | "video"): Promise<any[]> {
    try {
      // Mock data for testing - will be replaced with database queries
      const mockModels = [
        {
          modelId: 'nano-banana-2',
          modelName: 'Nano Banana 2',
          modelType: 'image',
          isActive: true,
          pricingType: 'formula'
        },
        {
          modelId: 'flux-2-pro',
          modelName: 'Flux 2 Pro',
          modelType: 'image',
          isActive: true,
          pricingType: 'fixed'
        },
        {
          modelId: 'seedance-1.5-pro',
          modelName: 'Seedance 1.5 Pro',
          modelType: 'video',
          isActive: true,
          pricingType: 'formula'
        }
      ];

      return mockModels.filter(model => model.modelType === modelType);
    } catch (error) {
      throw new PricingError(`Failed to fetch available models: ${error instanceof Error ? error.message : 'Unknown error'}`, 'DATABASE_ERROR');
    }
  }
  
  static async validatePricingParams(modelId: string, params: PricingParams): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Get config from database
      const config = await this.getModelConfig(modelId);
      
      if (!config) {
        errors.push(`Model ${modelId} not found`);
        return { valid: false, errors };
      }

      // Validate based on formula type
      if (config.pricingType === 'formula' && config.formula) {
        const formula = config.formula;
        
        // Check required parameters for quality-based formulas
        if (formula.qualities && !params.quality) {
          errors.push('Quality parameter required for this model');
        }
        
        // Check required parameters for multiplier formulas
        if (formula.resolution_multipliers && !params.resolution) {
          errors.push('Resolution parameter required for this model');
        }
        
        if (formula.duration_multipliers && !params.duration) {
          errors.push('Duration parameter required for this model');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      if (error instanceof PricingError) {
        throw error;
      }
      throw new PricingError(`Failed to validate pricing params: ${error instanceof Error ? error.message : 'Unknown error'}`, 'VALIDATION_ERROR');
    }
  }

  static async getModelRequiredParams(modelId: string): Promise<string[]> {
    try {
      const config = await this.getModelConfig(modelId);
      if (!config || config.pricingType !== 'formula' || !config.formula) {
        return [];
      }

      const formula = config.formula;
      const required: string[] = [];

      if (formula.qualities) required.push('quality');
      if (formula.resolution_multipliers) required.push('resolution');
      if (formula.duration_multipliers) required.push('duration');
      if (formula.audio_multiplier) required.push('hasAudio');

      return required;
    } catch (error) {
      if (error instanceof PricingError) {
        throw error;
      }
      throw new PricingError(`Failed to get model required params: ${error instanceof Error ? error.message : 'Unknown error'}`, 'VALIDATION_ERROR');
    }
  }
}
