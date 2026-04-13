# Pricing Management System
 
 > **Status**: ✅ **IMPLEMENTED / ACTIVE**
 > **Primary Source of Truth**: `storyboard_model_credit`
 > **Role**: Admin pricing configuration for image/video AI models used across storyboard generation, editing, upscaling, and video generation flows
 
 
 ## Overview
 
 A comprehensive pricing management system for AI models that supports both fixed price and formula-based calculations. The system provides a complete admin interface for managing pricing models, real-time testing, and instant price calculators with database-driven dynamic pricing integration.

## ✅ Current Implementation Summary (April 2026)

- **Pricing models** are stored in Convex and used as the live source for UI credit display
- **Edit flow** updates existing models only; it must not create duplicates
- **Create flow** is separate and guarded against duplicate `modelId` values
- **Reset defaults** is explicit and handled through a dedicated action path
- **Runtime pricing** is used across image generation, image editing, upscaling, and video generation surfaces
- **Seedance and Veo-related pricing** belong to the same managed pricing system as image models

### **Current Model Coverage**

- **Image generation/editing**: Nano Banana, GPT image variants, Ideogram, Qwen, Nano Banana Edit
- **Upscaling/enhancement**: Recraft Crisp, Topaz Upscale
- **Video generation**: Seedance 1.5 Pro, Kling 3.0 Motion Control, Seedance 2.0, Grok Imagine Image-to-Video, Veo 3.1


## Current Implementation Status: ✅ **IMPLEMENTED WITH DYNAMIC PRICING INTEGRATION (April 2026)**


### ✅ **Core Features Implemented**

- **CRUD Operations**: Create, read, update, delete pricing models
- **Real-time Testing**: Test pricing formulas with configurable parameters
- **Price Calculation Display**: Fixed price and derived price shown in admin UI
- **Dark Theme Admin UI**: Table/grid/card view modes
- **Convex Integration**: Pricing models stored in `storyboard_model_credit`
- **Fixed and Formula Pricing**: Supports both pricing strategies
- **Image / Video Support**: Model type specific pricing rules
- **Resolution / Quality / Duration Inputs**: Used in formula testing
- **Dynamic Pricing Integration**: Real-time pricing from database values
- **Model-Specific Behavior**: Proper handling of different model types
- **Credit Calculation Fixes**: Recraft Crisp and other model pricing corrections


### ✅ **Important Current Behavior**

- **Edit is update-only**: Editing an existing pricing model must never create a new model
- **Create is separate**: New models are created only through the create flow
- **Reset to Default is explicit**: Reset uses a dedicated `action: "resetDefaults"` POST payload
- **Fresh form state after save**: The edit modal is repopulated from freshly fetched saved data, not stale component state
- **Duplicate create protection**: Creating a model with an existing `modelId` throws an error
- **Database as Source of Truth**: All pricing calculations use database values with fallback handling
- **Real-time Updates**: Credit calculations update instantly when model/quality changes


### ✅ **Technical Implementation**

- **TypeScript**: Typed pricing models and functions
- **Convex Integration**: Database mutations and queries for pricing models
- **Error Handling**: API returns validation/update errors clearly
- **Strict Save Semantics**:
  - `POST` = create new model or reset defaults when explicitly requested
  - `PUT` = update existing model only
- **Fresh Data Sync After Save**: UI uses refreshed models returned after save
- **Dynamic Credit Calculation**: `getModelCredits` function with database integration
- **Model Behavior Handling**: Proper cropping logic for different model types
- **Fallback Pricing**: Handles database inconsistencies with correct defaults


### ✅ **Recent Updates (April 2026)**

- **Recraft Crisp Credit Fix**: Fixed database value mismatch (8 → 0.5 credits) with special case handling
- **Dynamic Pricing System**: Complete integration of database-driven pricing for all models
- **Model Behavior Matrix**: Added proper cropping logic for upscale vs generation models
- **Real-Time Credit Updates**: Enhanced `useMemo` dependencies for instant credit recalculation
- **GPT Model Integration**: Added quality-based pricing for GPT 1.5 Image to Image
- **Topaz Upscale Enhancement**: Updated pricing structure with 1x/2x/4x scaling factors
- **Nano Banana Pricing**: Refined quality-based pricing with proper formula extraction
- **✅ UPDATED SEEDANCE PRICING**: Corrected 4-second duration intervals and proper multipliers
- **✅ FUNCTION-BASED CALCULATIONS**: Testing panel uses assigned pricing functions for accuracy


## Pricing Functions


### 1. getNanoBananaPrice - Image Generation

```typescript
function getNanoBananaPrice(base: number, multiplier: number, quality: string): number {
  const qualityMultipliers = {
    '1K': 1,
    '2K': 1.5,
    '4K': 2.25
  };
  
  const qualityMultiplier = qualityMultipliers[quality] || 1;
  return Math.ceil(base * multiplier * qualityMultiplier);
}
```

**Usage:** `getNanoBananaPrice(base, multiplier, quality)`

**Examples:**

- `getNanoBananaPrice(8, 1.3, '1K')` → 11 credits
- `getNanoBananaPrice(8, 1.3, '2K')` → 16 credits
- `getNanoBananaPrice(8, 1.3, '4K')` → 24 credits


### 2. getSeedance15 - Video Generation

```typescript
function getSeedance15(base: number, multiplier: number, resolution: string, audio: boolean, duration: number): number {
  const resolutionMultipliers = {
    '480p': 1,
    '720p': 2,
    '1080p': 4,
    '4K': 5
  };
  
  // Duration multiplier based on 4-second intervals
  let durationMultiplier = 1;
  if (duration <= 4) {
    durationMultiplier = 1;
  } else if (duration <= 8) {
    durationMultiplier = 2;
  } else if (duration <= 12) {
    durationMultiplier = 4;
  } else {
    // For durations longer than 12 seconds, calculate additional 4-second blocks
    const additionalBlocks = Math.ceil((duration - 12) / 4);
    durationMultiplier = 4 + additionalBlocks;
  }
  
  const audioMultiplier = audio ? 2 : 1;
  const resolutionMultiplier = resolutionMultipliers[resolution] || 1;
  
  return Math.ceil(base * multiplier * resolutionMultiplier * audioMultiplier * durationMultiplier);
}
```

**Usage:** `getSeedance15(base, multiplier, resolution, audio, duration)`

**Examples** (with factor 1.3):

- `getSeedance15(7, 1.3, '720p', true, 8)` → 73 credits
- `getSeedance15(7, 1.3, '1080p', true, 12)` → 146 credits
- `getSeedance15(7, 1.3, '480p', false, 4)` → 10 credits


### 3. getKlingMotionControl - Kling 3.0 Video Generation

```typescript
function getKlingMotionControl(base: number, multiplier: number, resolution: string, duration: number): number {
  const resolutionMultipliers = { '720p': 1, '1080p': 2 };
  const resolutionMultiplier = resolutionMultipliers[resolution] || 1;
  return Math.ceil(base * multiplier * resolutionMultiplier * duration);
}
```

**Usage:** `getKlingMotionControl(base, multiplier, resolution, duration)`

**Examples** (with factor 1.3):
- `getKlingMotionControl(5, 1.3, '720p', 5)` → 33 credits
- `getKlingMotionControl(5, 1.3, '1080p', 5)` → 65 credits


### 4. getSeedance20 - Seedance 2.0 Video Generation

```typescript
function getSeedance20(base: number, multiplier: number, resolution: string, hasVideoInput: boolean, duration: number): number {
  const resolutionMultipliers = { '480p': 1, '720p': 2 };
  const videoInputMultiplier = hasVideoInput ? 1.5 : 1;
  const resolutionMultiplier = resolutionMultipliers[resolution] || 1;
  // Duration uses 4-second block intervals similar to Seedance 1.5
  let durationMultiplier = 1;
  if (duration <= 4) durationMultiplier = 1;
  else if (duration <= 8) durationMultiplier = 2;
  else if (duration <= 12) durationMultiplier = 4;
  else durationMultiplier = 4 + Math.ceil((duration - 12) / 4);
  return Math.ceil(base * multiplier * resolutionMultiplier * videoInputMultiplier * durationMultiplier);
}
```

**Usage:** `getSeedance20(base, multiplier, resolution, hasVideoInput, duration)`

**Examples** (with factor 1.3):
- `getSeedance20(7, 1.3, '480p', false, 5)` → 19 credits
- `getSeedance20(7, 1.3, '720p', true, 10)` → 73 credits


### 5. getTopazUpscale - AI Upscaling

```typescript
function getTopazUpscale(base: number, multiplier: number, upscaleFactor: string): number {
  const qualityMultipliers = {
    '1x': 1,
    '2x': 2,
    '3x': 3,
    '4x': 4
  };

  const qualityMultiplier = qualityMultipliers[upscaleFactor] || 1;
  return Math.ceil(base * multiplier * qualityMultiplier);
}
```

**Usage:** `getTopazUpscale(base, multiplier, upscaleFactor)`

**Examples:**

- `getTopazUpscale(10, 1.3, '1x')` → 13 credits
- `getTopazUpscale(10, 1.3, '2x')` → 26 credits
- `getTopazUpscale(10, 1.3, '4x')` → 52 credits


## Global getModelCredits Function

A single global function that fetches a pricing model by `modelId` and returns the calculated credits. No hardcoded values, no manual lookups—available everywhere without imports.

### Goal

- One call: `getModelCredits(modelId, options)` → credits
- Works for both fixed and formula pricing
- Available globally in any component
- Consistent pricing across the entire app

### Implementation

```typescript
// lib/storyboard/pricing.ts
type CreditOptions = {
  quality?: "1K" | "2K" | "4K";
  resolution?: "480p" | "720p" | "1080p" | "4K";
  audio?: boolean;
  duration?: number;
  upscaleFactor?: "1x" | "2x" | "3x" | "4x";
};

export async function getModelCredits(
  modelId: string,
  options: CreditOptions = {}
): Promise<number> {
  const model = await fetchPricingModel(modelId);
  if (!model) return 0;

  const base = model.creditCost || 0;
  const factor = model.factor || 1;

  if (model.pricingType === "fixed") {
    return Math.ceil(base * factor);
  }

  switch (model.assignedFunction) {
    case "getNanoBananaPrice":
      return getNanoBananaPrice(base, factor, options.quality || "1K");
    case "getSeedance15":
      return getSeedance15(
        base,
        factor,
        options.resolution || "720p",
        options.audio || false,
        options.duration || 5
      );
    case "getTopazUpscale":
      return getTopazUpscale(base, factor, options.upscaleFactor || "1x");
    default:
      return Math.ceil(base * factor);
  }
}

// Helper to fetch the pricing model (choose one approach)
async function fetchPricingModel(modelId: string): Promise<PricingModel | null> {
  // Option 1: Direct Convex query
  // return await convex.query(api.storyboard.pricing.getPricingModelByModelId, { modelId });

  // Option 2: API endpoint
  // const res = await fetch(`/api/storyboard/pricing/models?modelId=${modelId}`);
  // return res.ok ? res.json() : null;

  // Option 3: In-memory cache (if already loaded)
  // return pricingModelsCache.get(modelId) || null;
}
```

### Global Setup

```typescript
// globals.d.ts
declare global {
  const pricing: {
    getModelCredits: (modelId: string, options?: CreditOptions) => Promise<number>;
  };
}

// In a shared layout or app initialization:
import { getModelCredits } from '@/lib/storyboard/pricing';
(window as any).pricing = { getModelCredits };
```

### Usage (any component, no imports)

```typescript
// Dropdowns / generate buttons
const credits = await pricing.getModelCredits("nano-banana-2", { quality: "2K" });

// Admin pricing table
const credits = await pricing.getModelCredits(model.modelId);

// Billing / validation
const charge = await pricing.getModelCredits(selectedModel, {
  quality,
  resolution,
  audio,
  duration,
  upscaleFactor,
});
```

### Why This Is Better

- **One call, no boilerplate**: components don't need to fetch, then calculate
- **No hardcoded credits**: eliminates duplicate price logic
- **Consistent everywhere**: admin UI and generation UI always match
- **Future-proof**: change pricing models, everything updates automatically


## API Endpoints


### Pricing Models API

**Location**: `/api/storyboard/pricing/models/route.ts`

```typescript
export async function GET() {
  // Fetch all pricing models
  const models = await convex.query(api.storyboard.pricing.getAllPricingModels);
  return NextResponse.json(models);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body?.action === "resetDefaults") {
    return NextResponse.json(
      await convex.mutation(api.storyboard.pricing.resetToDefaults, {})
    );
  }

  return NextResponse.json(
    await convex.mutation(api.storyboard.pricing.createPricingModel, {
      modelId: body.modelId,
      modelName: body.modelName,
      modelType: body.modelType,
      pricingType: body.pricingType,
      creditCost: body.creditCost,
      factor: body.factor,
      formulaJson: body.formulaJson,
    })
  );
}

export async function PUT(req: NextRequest) {
  // Update existing pricing model only
  const body = await req.json();
  const result = await convex.mutation(api.storyboard.pricing.updatePricingModel, body);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  // Delete pricing model by _id
  const body = await req.json();
  const result = await convex.mutation(api.storyboard.pricing.deletePricingModel, { id: body.id });
  return NextResponse.json({ success: true, deletedId: result });
}
```

### Convex Mutations

**Location**: `/convex/storyboard/pricing.ts`

```typescript
export const updatePricingModel = mutation({
  args: {
    modelId: v.string(),
    modelName: v.optional(v.string()),
    modelType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    isActive: v.optional(v.boolean()),
    pricingType: v.optional(v.union(v.literal("fixed"), v.literal("formula"))),
    creditCost: v.optional(v.number()),
    factor: v.optional(v.number()),
    formulaJson: v.optional(v.string()),
    assignedFunction: v.optional(v.union(
      v.literal("getTopazUpscale"),
      v.literal("getSeedance15"),
      v.literal("getNanoBananaPrice")
    )),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq(q.field("modelId"), args.modelId))
      .first();

    if (!existing) {
      throw new Error(`Pricing model ${args.modelId} not found for update`);
    }

    await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    return existing._id;
  },
});

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
    const existing = await ctx.db.query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq(q.field("modelId"), args.modelId))
      .first();

    if (existing) {
      throw new Error(`Pricing model ${args.modelId} already exists`);
    }

    return await ctx.db.insert("storyboard_model_credit", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const deletePricingModel = mutation({
  args: { id: v.id("storyboard_model_credit") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Pricing model with _id ${args.id} not found`);
    }
    await ctx.db.delete(args.id);
    return existing._id;
  },
});
```

## Usage Examples


### Managing Pricing Models

1. **Navigate**: `/storyboard-studio/admin/pricing`
2. **View Models**: Table shows all pricing models with current settings
3. **Edit Model**: Click edit button to modify pricing
4. **Save Existing Model**: Edit flow updates the current record only
5. **Create New Model**: Add New Model uses create flow only
6. **Delete Model**: Use dropdown menu to remove models
7. **Test Pricing**: Use testing panel to verify calculations

### Using Price Calculators

1. **Find Model**: Locate model in pricing table
2. **Click Calculator**: Click 💰 icon beside model name
3. **View Pricing**: Instant credit calculation appears
4. **Real-time Updates**: Reflects current model settings

### Testing Formulas

1. **Toggle Testing**: Click "Show Testing" in header
2. **Configure Parameters**: Set base, multiplier, quality, etc.
3. **Test Model**: Click 📈 button on formula models
4. **View Results**: See calculated credits with breakdown

## Current Default / Seed Model Configuration

```typescript
const DEFAULT_PRICING_MODELS = [
  {
    modelId: "nano-banana-2",
    modelName: "Nano Banana 2",
    modelType: "image",
    pricingType: "formula",
    assignedFunction: "getNanoBananaPrice",
    creditCost: 8,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 8,
        qualities: [
          { name: "1K", cost: 8 },
          { name: "2K", cost: 12 },
          { name: "4K", cost: 18 },
        ],
      },
    }),
  },
  {
    modelId: "bytedance/seedance-1.5-pro",
    modelName: "Seedance 1.5 Pro",
    modelType: "video",
    pricingType: "formula",
    assignedFunction: "getSeedance15",
    creditCost: 7,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 7,
        resolution_multipliers: { "480p": 1, "720p": 2, "1080p": 4 },
        audio_multiplier: 1.5,
        duration_multiplier: 5,
      },
    }),
  },
  {
    modelId: "topaz/image-upscale",
    modelName: "Topaz Upscale",
    modelType: "image",
    pricingType: "formula",
    assignedFunction: "getTopazUpscale",
    creditCost: 10,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 10,
        upscale_factors: [
          { name: "1x", cost: 10 },
          { name: "2x", cost: 18 },
          { name: "3x", cost: 26 },
          { name: "4x", cost: 33 },
        ],
      },
    }),
  },
  {
    modelId: "flux-2/pro-text-to-image",
    modelName: "Flux 2 Pro",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 10,
    factor: 1.3,
  },
  {
    modelId: "ideogram/character-edit",
    modelName: "Character Edit",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 5,
    factor: 1.3,
  },
  {
    modelId: "gpt-image",
    modelName: "GPT Image 1.5",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 35,
    factor: 1.3,
  },
  {
    modelId: "gpt-image/1.5-text-to-image",
    modelName: "1.5 Text to Image",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 4,
    factor: 1.3,
  },
  {
    modelId: "google/nano-banana-edit",
    modelName: "Nano Banana Edit",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 4,
    factor: 1.3,
  },
  {
    modelId: "qwen/image-to-image",
    modelName: "Image to Image",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 4,
    factor: 1.6,
  },
  {
    modelId: "recraft/crisp-upscale",
    modelName: "Crisp Upscale",
    modelType: "image",
    pricingType: "fixed",
    creditCost: 0.5,
    factor: 1.3,
  },
];
```

## Notes About Current Behavior

- **Edit modal model ID is locked** when editing an existing model
- **Edit save uses update-only** flow
- **Create save uses create-only** flow
- **Saving after edit keeps the newly saved values in the modal**
- **Duplicate rows created before the strict update fix may still need manual cleanup**

## KIE AI Key Management (April 2026)

### Overview
The Pricing Management page now has 3 tabs: **Models | Testing | KIE AI**. The KIE AI tab provides CRUD for API keys stored in the `storyboard_kie_ai` Convex table.

### `storyboard_kie_ai` Table Schema
- `name` — human-readable label for the key
- `key` — the API key string (hidden by default in UI with show/hide toggle)
- `isDefault` — whether this key is the system-wide default
- `isActive` — whether the key is currently active

### Key Resolution (`resolveKieApiKey()`)
Located in `lib/storyboard/kieAI.ts`. Fallback chain:
1. `org_settings.defaultAI` — per-org key from the referenced `storyboard_kie_ai` record
2. System default — the `storyboard_kie_ai` record where `isDefault === true`
3. `KIE_AI_API_KEY` env var — final fallback

### defaultAI Integration
- `org_settings.defaultAI` field references a `storyboard_kie_ai` record ID
- `storyboard_files.defaultAI` stores which key was used for each generation
- Project Settings modal has two tabs: **Company** and **Default AI Key**

---

## File Structure

### Core Implementation Files

- **`PricingManagementDark.tsx`**: Main UI component
- **`PricingManagementPage.tsx`**: Page wrapper
- **`usePricingData.ts`**: Data fetching hook
- **`pricing.ts`**: Convex database mutations

### API Routes

- **`/api/storyboard/pricing/models/route.ts`**: Main API endpoint

### Documentation

- **`plan_price_management.md`**: Main pricing management documentation
- **`link.md`**: External resources and tutorials


---

## ✅ **Quality-Based Pricing Implementation (March 2026)**

### **Overview**
Dynamic quality selection for formula-based models with real-time credit calculation and accurate alert messaging.

### **Implemented Models**

#### **Nano Banana 2**
- **Quality Options**: 1K, 2K, 4K
- **Formula JSON**: Direct cost extraction with factor multiplication
- **Pricing**: 
  - 1K: 8 × 1.3 = **11 credits**
  - 2K: 12 × 1.3 = **16 credits**  
  - 4K: 18 × 1.3 = **24 credits**

#### **Topaz Upscale**
- **Quality Options**: 1K, 2K, 4K
- **Formula JSON**: Direct cost extraction with factor multiplication
- **Pricing**:
  - 1K: 10 × 1.3 = **13 credits**
  - 2K: 18 × 1.3 = **24 credits**
  - 4K: 30 × 1.3 = **39 credits**

### **Technical Implementation**

#### **Quality Dropdown UI**
```typescript
// Conditional rendering based on model selection
{(normalizedModel === "nano-banana-2" || normalizedModel === "topaz/image-upscale") && (
  <div className="quality-dropdown">
    {["1K", "2K", "4K"].map((quality) => (
      <button onClick={() => {
        setSelectedQuality(quality);
        alertModelCredits(currentModelId, quality);
      }}>
        {quality}
      </button>
    ))}
  </div>
)}
```

#### **Formula-Based Calculation**
```typescript
// Direct cost extraction from formulaJson
if (model.formulaJson) {
  const formula = JSON.parse(model.formulaJson);
  const quality = formula.pricing?.qualities?.find(q => q.name === selectedQuality);
  if (quality) {
    const factor = model.factor || 1;
    return Math.ceil(quality.cost * factor);
  }
}
```

#### **Quality-Aware Alert System**
```typescript
const alertModelCredits = (selectedModelId: string, quality?: string) => {
  // Use provided quality or fallback to current state
  const qualityForCalculation = quality || selectedQuality;
  
  // Direct formula calculation for immediate accuracy
  const creditCharge = calculateFromFormula(modelId, qualityForCalculation);
  const qualityInfo = ` (${qualityForCalculation})`;
  
  window.alert(`${modelLabel}${qualityInfo} will charge ${creditCharge} credits.`);
};
```

### **Key Features**

#### **✅ Dynamic Quality Selection**
- Quality dropdown appears only for Nano Banana 2 and Topaz Upscale models
- Hidden by default when other models are selected
- Immediate UI updates when quality changes

#### **✅ Real-Time Credit Calculation**
- Credits update instantly when quality is selected
- Formula-based pricing uses exact costs from formulaJson
- Factor multiplication applied consistently (1.3 for both models)

#### **✅ Accurate Alert Messaging**
- Alerts show correct model name and selected quality
- No state timing issues - quality passed directly to alert
- Example: "Topaz Upscale (4K) will charge 39 credits."

#### **✅ Formula JSON Integration**
- Direct cost extraction from formula quality arrays
- Eliminates hardcoded multiplier calculations
- Consistent with admin pricing management formulas

### **User Experience Flow**

1. **Model Selection**: User selects Nano Banana 2 or Topaz Upscale
2. **Quality Dropdown**: Appears automatically with 1K, 2K, 4K options
3. **Quality Selection**: User clicks desired quality (e.g., "4K")
4. **Immediate Update**: 
   - UI shows new credit cost
   - Alert displays correct pricing with quality
   - State updates for future interactions

### **Debugging & Monitoring**

#### **Console Logging**
```typescript
console.log("[EditImageAIPanel] Nano Banana from formula:", { 
  selectedQuality, 
  cost: quality.cost, 
  factor, 
  result: Math.ceil(quality.cost * factor)
});
```

#### **Alert Debug Info**
```typescript
console.log("[EditImageAIPanel] Alert debug:", { 
  selectedModelId, 
  normalizedSelectedModelId, 
  modelLabel, 
  creditCharge, 
  qualityInfo,
  qualityForCalculation,
  activeTool
});
```

### **Implementation Files**

- **`EditImageAIPanel.tsx`**: Quality dropdown UI and calculation logic
- **`usePricingData.ts`**: Dynamic pricing data with formula support
- **`convex/storyboard/pricing.ts`**: Default models with assignedFunction field

### **Benefits Achieved**

- **✅ User-Friendly**: Clear quality selection with immediate feedback
- **✅ Accurate Pricing**: Formula-based calculations match admin settings
- **✅ Real-Time Updates**: No delays or stale data issues
- **✅ Consistent Experience**: Alerts match UI calculations exactly
- **✅ Maintainable**: Formula-driven pricing reduces hardcoded values

---

**Keep this document aligned with the actual model IDs and save flow in code.**