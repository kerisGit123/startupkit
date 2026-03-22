# Pricing Plan Formula System

## Overview

A flexible pricing system that supports both fixed price and formula-based calculations for AI models. The system uses JSON configurations to define pricing structures, making it easy to add new models and adjust pricing without code changes.

## Architecture

### Database Schema

```typescript
// convex/schema.ts
pricingModels: defineTable({
  modelId: v.string(),                    // "nano-banana-2", "seedance-1.5-pro"
  modelName: v.string(),                  // "Nano Banana 2", "Seedance 1.5 Pro"
  modelType: v.union(v.literal("image"), v.literal("video")),
  isActive: v.boolean(),                   // true = available, false = disabled
  pricingType: v.union(v.literal("fixed"), v.literal("formula")),
  
  // For fixed pricing
  creditCost: v.optional(v.number()),      // Base credit cost
  factor: v.optional(v.number()),         // Multiplier factor
  
  // For formula pricing
  formulaJson: v.optional(v.string()),     // JSON string with pricing formula
  
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_model_type", ["modelType", "isActive"])

storyboard_model_credit: defineTable({
  modelId: v.string(),                    // "nano-banana-2", "seedance-1.5-pro"
  modelName: v.string(),                  // "Nano Banana 2", "Seedance 1.5 Pro"
  modelType: v.union(v.literal("image"), v.literal("video")),
  isActive: v.boolean(),                   // true = available, false = disabled
  pricingType: v.union(v.literal("fixed"), v.literal("formula")),
  
  // For fixed pricing
  creditCost: v.optional(v.number()),      // Base credit cost
  factor: v.optional(v.number()),         // Multiplier factor
  
  // For formula pricing
  formulaJson: v.optional(v.string()),     // JSON string with pricing formula
  
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_model_type", ["modelType", "isActive"])
.index("by_model_id", ["modelId"])
```

### Pricing Formula Types

#### 1. Fixed Price Models
Simple credit cost × multiplier pricing.

**Example:**
```json
{
  "pricing_type": "fixed",
  "credit_cost": 8,
  "factor": 1.0
}
```

**Usage:** `totalCredits = creditCost × factor`

#### 2. Quality-Based Formula
Different costs for quality/resolution tiers.

**Example:**
```json
{
  "pricing": {
    "base_cost": 8,
    "qualities": [
      { "name": "1K", "cost": 8 },
      { "name": "2K", "cost": 12 },
      { "name": "4K", "cost": 18 }
    ]
  }
}
```

#### 3. Multiplier Formula
Complex pricing with multiple factors (resolution, audio, duration).

**Example:**
```json
{
  "pricing": {
    "base_cost": 7,
    "resolution_multipliers": {
      "480P": 1,
      "720P": 2,
      "1080P": 4
    },
    "audio_multiplier": 2,
    "duration_multipliers": {
      "4s": 1,
      "8s": 2,
      "12s": 4
    }
  },
  "example_calculation": {
    "scenario": "1080P with audio, 12s",
    "calculation": "7 (base) × 4 (1080P multiplier) × 2 (audio multiplier) × 4 (12s multiplier)",
    "total": 224
  }
}
```

## Implementation Plan

### Phase 1: Core Pricing Engine

#### 1.1 Pricing Calculator Service
```typescript
// lib/pricing/calculator.ts
interface PricingParams {
  modelId: string;
  quality?: string;
  resolution?: string;
  duration?: string;
  hasAudio?: boolean;
  [key: string]: any; // Allow additional parameters
}

interface CostResult {
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
      // Fetch from Convex database
      const config = await convex.query.api.storyboard_model_credit.getByModelId(modelId);
      if (!config || !config.isActive) {
        return null;
      }
      
      // Parse formula JSON if needed
      if (config.pricingType === 'formula' && config.formulaJson) {
        return {
          ...config,
          formula: JSON.parse(config.formulaJson)
        };
      }
      
      return config;
    } catch (error) {
      throw new PricingError(`Failed to fetch model config: ${error.message}`, 'DATABASE_ERROR');
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
      // Fetch from database instead of hardcoded configs
      const models = await convex.query.api.storyboard_model_credit.getByType({ modelType });
      return models || [];
    } catch (error) {
      throw new PricingError(`Failed to fetch available models: ${error.message}`, 'DATABASE_ERROR');
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
      throw new PricingError(`Failed to validate pricing params: ${error.message}`, 'VALIDATION_ERROR');
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
      throw new PricingError(`Failed to get model required params: ${error.message}`, 'VALIDATION_ERROR');
    }
  }
}

// ... rest of the code remains the same ...
```typescript
// lib/pricing/config.ts
// No hardcoded configs - all data comes from storyboard_model_credit table
// Use PricingCalculator methods to fetch from database
```

### Phase 2: Database Integration

#### 2.1 Convex Mutations
```typescript
// convex/pricing.ts
export const createPricingModel = mutation({
  args: {
    modelId: v.string(),
    modelName: v.string(),
    modelType: v.union(v.literal("image"), v.literal("video")),
    pricingType: v.union(v.literal("fixed"), v.literal("formula")),
    creditCost: v.optional(v.number()),
    factor: v.optional(v.number()),
    formulaJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create pricing model in database
  }
});

export const updatePricingModel = mutation({
  // Update existing pricing model
});

export const getPricingModels = query({
  args: { modelType: v.optional(v.union(v.literal("image"), v.literal("video"))) },
  handler: async (ctx, args) => {
    // Return active pricing models
  }
});
```

#### 2.2 Data Migration
```typescript
// scripts/migrate-pricing.ts
// Script to populate pricing models from price.md file
```

### Phase 3: UI Components

#### 3.1 Model Selector
```typescript
// components/storyboard/ModelSelector.tsx
interface ModelSelectorProps {
  modelType: "image" | "video";
  onModelSelect: (modelId: string, params: any) => void;
}

const ModelSelector = ({ modelType, onModelSelect }) => {
  const models = useQuery(api.pricing.getPricingModels, { modelType });
  
  return (
    <div className="model-selector">
      {models?.map(model => (
        <ModelCard 
          key={model.modelId}
          model={model}
          onSelect={onModelSelect}
        />
      ))}
// components/storyboard/PricingCalculator.tsx
const PricingCalculator = ({ modelId, onCostCalculated }) => {
  const [params, setParams] = useState({});
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requiredParams, setRequiredParams] = useState([]);
  
  useEffect(() => {
    const calculateCost = async () => {
      if (!modelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get required params for this model
        const required = await PricingCalculator.getModelRequiredParams(modelId);
        setRequiredParams(required);
        
        // Calculate cost
        const calculated = await PricingCalculator.calculateCost({ modelId, ...params });
        setCost(calculated);
        onCostCalculated(calculated);
      } catch (error) {
        setError(error.message);
        setCost(null);
      } finally {
        setLoading(false);
      }
    };
    
    calculateCost();
  }, [modelId, params]);
  
  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="pricing-calculator space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {cost && !loading && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-emerald-800">Total Credits:</span>
            <span className="text-2xl font-bold text-emerald-600">{cost.credits}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600">
            {cost.breakdown.calculation}
          </div>
        </div>
      )}
      
      {/* Dynamic form based on required parameters */}
      {requiredParams.includes('quality') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
          <select 
            value={params.quality || '1K'} 
            onChange={(e) => handleParamChange('quality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        </div>
      )}
      
      {requiredParams.includes('resolution') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
          <select 
            value={params.resolution || '720P'} 
            onChange={(e) => handleParamChange('resolution', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="480P">480P</option>
            <option value="720P">720P</option>
            <option value="1080P">1080P</option>
          </select>
        </div>
      )}
      
      {requiredParams.includes('duration') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <select 
            value={params.duration || '8s'} 
            onChange={(e) => handleParamChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="4s">4 seconds</option>
            <option value="8s">8 seconds</option>
            <option value="12s">12 seconds</option>
          </select>
        </div>
      )}
      
      {requiredParams.includes('hasAudio') && (
        <div className="flex items-center">
          <input 
            type="checkbox" 
            checked={params.hasAudio || false} 
            onChange={(e) => handleParamChange('hasAudio', e.target.checked)}
            className="mr-2 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <label className="text-sm font-medium text-gray-700">Include Audio</label>
        </div>
      )}
    </div>
  );
};

const ModelCard = ({ model, onEdit, onToggleActive }) => (
  <div className={`rounded-lg border p-4 transition-all hover:shadow-md ${
    model.isActive 
      ? 'border-emerald-200 bg-emerald-50' 
      : 'border-gray-200 bg-white'
  }`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{model.modelName}</h3>
        <p className="text-sm text-gray-500">{model.modelId}</p>
      </div>
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
        model.isActive 
          ? 'bg-emerald-100 text-emerald-800' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {model.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
        required: cost.credits,
        breakdown: cost.breakdown 
      }, { status: 400 });
    }
    
    // Deduct credits and start generation
    await deductCredits(cost.credits);
    // ... rest of generation logic
    
  } catch (error) {
    if (error instanceof PricingError) {
      return Response.json({ 
        error: error.message, 
        code: error.code,
        details: error.details 
      }, { status: 400 });
    }
    return Response.json({ error: "Pricing calculation failed" }, { status: 500 });
  }
}
```

## ⚠️ **Critical Issues Found**

### **1. API Integration Issues**
```typescript
// ❌ CRITICAL: Missing await (LINE 526)
const cost = PricingCalculator.calculateCost({ modelId, ...pricingParams });
- JSON-based configuration

### ✅ **Maintainability** 
- Centralized pricing logic
- Clear separation of concerns
- Easy to update pricing

### ✅ **User Experience**
- Dynamic UI based on model requirements
- Real-time cost calculation
- Clear cost breakdown

### ✅ **Business Control**
- Enable/disable models instantly
- A/B test pricing strategies
- Detailed usage analytics

## Migration Strategy

1. **Phase 1**: Implement pricing engine with hardcoded configs
2. **Phase 2**: Add database storage and admin UI
3. **Phase 3**: Migrate existing models to new system
4. **Phase 4**: Add advanced features (dynamic pricing, discounts)

## Testing Strategy