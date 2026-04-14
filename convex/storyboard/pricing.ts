import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Define the pricing model schema
export const pricingModels = {
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
  assignedFunction: v.optional(v.union(    // Function mapping for formula types
    v.literal("getTopazUpscale"),
    v.literal("getSeedance15"),
    v.literal("getSeedance20"),
    v.literal("getSeedance20Fast"),
    v.literal("getKlingMotionControl"),
    v.literal("getNanoBananaPrice"),
    v.literal("getGptImagePrice"),
    v.literal("getVeo31"),
    v.literal("getGrokImageToVideo")
  )),
  
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Create a new pricing model
export const createPricingModel = mutation({
  args: {
    modelId: v.string(),
    modelName: v.string(),
    modelType: v.union(v.literal("image"), v.literal("video")),
    pricingType: v.union(v.literal("fixed"), v.literal("formula")),
    creditCost: v.optional(v.number()),
    factor: v.optional(v.number()),
    formulaJson: v.optional(v.string()),
    assignedFunction: v.optional(v.union(
      v.literal("getTopazUpscale"),
      v.literal("getSeedance15"),
      v.literal("getSeedance20"),
      v.literal("getKlingMotionControl"),
      v.literal("getNanoBananaPrice"),
      v.literal("getGptImagePrice"),
      v.literal("getVeo31")
    )),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const existing = await ctx.db
      .query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq(q.field("modelId"), args.modelId))
      .first();

    if (existing) {
      throw new Error(`Pricing model ${args.modelId} already exists`);
    }
    
    const modelId = await ctx.db.insert("storyboard_model_credit", {
      modelId: args.modelId,
      modelName: args.modelName,
      modelType: args.modelType,
      isActive: true,
      pricingType: args.pricingType,
      creditCost: args.creditCost,
      factor: args.factor,
      formulaJson: args.formulaJson,
      assignedFunction: args.assignedFunction,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    
    return modelId;
  },
});

// Update an existing pricing model
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
      v.literal("getSeedance20"),
      v.literal("getKlingMotionControl"),
      v.literal("getNanoBananaPrice"),
      v.literal("getGptImagePrice"),
      v.literal("getVeo31")
    )),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq(q.field("modelId"), args.modelId))
      .first();

    if (!existing) {
      throw new Error(`Pricing model ${args.modelId} not found for update`);
    }

    const timestamp = Date.now();

    const updateData: any = { updatedAt: timestamp };

    if (args.modelName !== undefined) updateData.modelName = args.modelName;
    if (args.modelType !== undefined) updateData.modelType = args.modelType;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    if (args.pricingType !== undefined) updateData.pricingType = args.pricingType;
    if (args.creditCost !== undefined) updateData.creditCost = args.creditCost;
    if (args.factor !== undefined) updateData.factor = args.factor;
    if (args.formulaJson !== undefined) updateData.formulaJson = args.formulaJson;
    if (args.assignedFunction !== undefined) updateData.assignedFunction = args.assignedFunction;

    await ctx.db.patch(existing._id, updateData);
    return existing._id;
  },
});

// Delete a pricing model
export const deletePricingModel = mutation({
  args: {
    id: v.id("storyboard_model_credit"), // Accept the Convex _id directly
  },
  handler: async (ctx, args) => {
    console.log("Convex: Trying to delete by _id:", args.id);
    
    // Get the model directly by _id
    const existing = await ctx.db.get(args.id);
    
    console.log("Convex: Found model:", existing);
    
    if (!existing) {
      throw new Error(`Pricing model with _id ${args.id} not found`);
    }
    
    // Delete the model directly
    await ctx.db.delete(args.id);
    
    console.log("Convex: Successfully deleted model:", existing.modelId);
    
    return existing._id;
  },
});

// Get pricing model by ID
export const getPricingModel = query({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq("modelId", args.modelId))
      .first();
    
    return model;
  },
});

// Get pricing models by type
export const getPricingModelsByType = query({
  args: {
    modelType: v.union(v.literal("image"), v.literal("video")),
  },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("storyboard_model_credit")
      .withIndex("by_model_type")
      .filter((q) => q.eq("modelType", args.modelType))
      .collect();
    
    return models;
  },
});

// Get all pricing models
export const getAllPricingModels = query({
  handler: async (ctx) => {
    const models = await ctx.db
      .query("storyboard_model_credit")
      .collect();
    
    return models;
  },
});

// Get active pricing models only
export const getActivePricingModels = query({
  args: {
    modelType: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyboard_model_credit")
      .filter((q) =>
        args.modelType
          ? q.and(
              q.eq(q.field("isActive"), true),
              q.eq(q.field("modelType"), args.modelType)
            )
          : q.eq(q.field("isActive"), true)
      )
      .collect();
  },
});

// Get a single pricing model by modelId
export const getPricingModelByModelId = query({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq("modelId", args.modelId))
      .first();
    
    return model || null;
  },
});

// Toggle model active status
export const togglePricingModel = mutation({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("storyboard_model_credit")
      .withIndex("by_model_id")
      .filter((q) => q.eq("modelId", args.modelId))
      .first();
    
    if (!existing) {
      throw new Error(`Pricing model ${args.modelId} not found`);
    }
    
    await ctx.db.patch(existing._id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    
    return !existing.isActive;
  },
});

// Seed initial pricing models (for testing)
export const seedPricingModels = mutation({
  handler: async (ctx) => {
    const timestamp = Date.now();
    
    const initialModels = [
      {
        modelId: "nano-banana-2",
        modelName: "Nano Banana 2",
        modelType: "image" as const,
        isActive: true,
        pricingType: "formula" as const,
        formulaJson: JSON.stringify({
          base_cost: 8,
          qualities: [
            { name: "1K", cost: 8 },
            { name: "2K", cost: 12 },
            { name: "4K", cost: 18 }
          ]
        }),
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        modelId: "seedance-1.5-pro",
        modelName: "Seedance 1.5 Pro",
        modelType: "video" as const,
        isActive: true,
        pricingType: "formula" as const,
        formulaJson: JSON.stringify({
          base_cost: 7,
          resolution_multipliers: { "480p": 1, "720p": 2, "1080p": 4 },
          audio_multiplier: 2,
          duration_multipliers: { "4s": 1, "8s": 2, "12s": 4 }
        }),
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        modelId: "flux-2-pro",
        modelName: "Flux 2 Pro",
        modelType: "image" as const,
        isActive: true,
        pricingType: "fixed" as const,
        creditCost: 5,
        factor: 1.0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];
    
    // Check if models already exist
    for (const model of initialModels) {
      const existing = await ctx.db
        .query("storyboard_model_credit")
        .withIndex("by_model_id")
        .filter((q) => q.eq("modelId", model.modelId))
        .first();
      
      if (!existing) {
        await ctx.db.insert("storyboard_model_credit", model);
      }
    }
    
    return { seeded: initialModels.length };
  },
});

// Default dataset matching the reference image & price_plan_formula.md
const DEFAULT_PRICING_MODELS = [
  {
    modelId: "nano-banana-2",
    modelName: "Nano Banana 2",
    modelType: "image" as const,
    isActive: true,
    pricingType: "formula" as const,
    assignedFunction: "getNanoBananaPrice" as const,
    creditCost: 8,
    factor: 1.2,
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
    modelId: "nano-banana-pro",
    modelName: "Nano Banana Pro",
    modelType: "image" as const,
    isActive: true,
    pricingType: "formula" as const,
    assignedFunction: "getNanoBananaPrice" as const,
    creditCost: 18,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 18,
        qualities: [
          { name: "1K", cost: 18 },
          { name: "2K", cost: 18 },
          { name: "4K", cost: 24 },
        ],
      },
    }),
  },
  {
    modelId: "bytedance/seedance-1.5-pro",
    modelName: "Seedance 1.5 Pro",
    modelType: "video" as const,
    isActive: true,
    pricingType: "formula" as const,
    creditCost: 7,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 7,
        resolution_multipliers: { "480p": 1, "720p": 2, "1080p": 4 },
        audio_multiplier: 2,
        duration_multipliers: { "4s": 1, "8s": 2, "12s": 4 },
      },
    }),
  },
  {
    modelId: "flux-2/pro-text-to-image",
    modelName: "Flux 2 Pro",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 10,
    factor: 1.2,
  },
  {
    modelId: "ideogram/character-edit",
    modelName: "Character Edit",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 5,
    factor: 1.2,
  },
  {
    modelId: "gpt-image/1.5-image-to-image",
    modelName: "GPT 1.5 Image to Image",
    modelType: "image" as const,
    isActive: true,
    pricingType: "formula" as const,
    creditCost: 4,
    factor: 1.2,
    assignedFunction: "getGptImagePrice" as const,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 4,
        qualities: [
          { name: "medium", cost: 4 },
          { name: "high", cost: 22 }
        ]
      }
    }),
  },
  {
    modelId: "google/nano-banana-edit",
    modelName: "Nano Banana Edit",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 4,
    factor: 1.2,
  },
  {
    modelId: "flux-2/flex-text-to-image",
    modelName: "Flex Text to Image",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 14,
    factor: 1.2,
  },
  {
    modelId: "recraft/crisp-upscale",
    modelName: "Crisp Upscale",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 0.5,
    factor: 1.2,
  },
  {
    modelId: "topaz/image-upscale",
    modelName: "Image Upscale",
    modelType: "image" as const,
    isActive: true,
    pricingType: "formula" as const,
    assignedFunction: "getTopazUpscale" as const,
    creditCost: 10,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 10,
        qualities: [
          { name: "1", cost: 10 },
          { name: "2", cost: 20 },
          { name: "4", cost: 40 },
        ],
      },
    }),
  },
  {
    modelId: "bytedance/seedance-2",
    modelName: "Seedance 2.0",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getSeedance20",
    creditCost: 11.5,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 11.5,
        resolutions: {
          "480p": { video_input: 11.5, no_video: 19 },
          "720p": { video_input: 25, no_video: 41 },
        },
        duration_rule: "total_duration = input_duration + output_duration",
      },
    }),
  },
  {
    modelId: "bytedance/seedance-2-fast",
    modelName: "Seedance 2.0 Fast",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getSeedance20Fast",
    creditCost: 9,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        unit: "credits_per_second",
        base_cost: 15.5,
        resolutions: {
          "480p": { video_input: 9, no_video: 15.5 },
          "720p": { video_input: 20, no_video: 33 },
        },
        duration_rule: "total_duration = input_duration + output_duration",
      },
    }),
  },
  {
    modelId: "grok-imagine/image-to-video",
    modelName: "Grok Imagine",
    modelType: "video",
    isActive: true,
    pricingType: "formula",
    assignedFunction: "getGrokImageToVideo",
    creditCost: 1.6,
    factor: 1.2,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 1.6,
        qualities: [
          { name: "480p", cost: 1.6 },
          { name: "720p", cost: 3 },
        ],
      },
    }),
  },
];

// Reset all pricing models to factory defaults (clears everything and re-seeds)
export const resetToDefaults = mutation({
  handler: async (ctx) => {
    // Delete all existing records
    const allExisting = await ctx.db.query("storyboard_model_credit").collect();
    for (const record of allExisting) {
      await ctx.db.delete(record._id);
    }

    // Insert default models
    const timestamp = Date.now();
    for (const model of DEFAULT_PRICING_MODELS) {
      await ctx.db.insert("storyboard_model_credit", {
        ...model,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    return { deleted: allExisting.length, inserted: DEFAULT_PRICING_MODELS.length };
  },
});

// Bulk update the burn-rate `factor` on every pricing model.
// Used when changing the global markup (e.g. 1.3 → 1.2) without resetting other fields.
// Run from the Convex dashboard: `storyboard/pricing:updateAllFactors { newFactor: 1.2 }`
export const updateAllFactors = mutation({
  args: {
    newFactor: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("storyboard_model_credit").collect();
    const timestamp = Date.now();
    let updated = 0;

    for (const record of all) {
      await ctx.db.patch(record._id, {
        factor: args.newFactor,
        updatedAt: timestamp,
      });
      updated++;
    }

    return { updated, newFactor: args.newFactor };
  },
});
