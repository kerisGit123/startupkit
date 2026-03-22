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
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    const modelId = await ctx.db.insert("storyboard_model_credit", {
      modelId: args.modelId,
      modelName: args.modelName,
      modelType: args.modelType,
      isActive: true,
      pricingType: args.pricingType,
      creditCost: args.creditCost,
      factor: args.factor,
      formulaJson: args.formulaJson,
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
    
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    // Only include fields that are being updated
    if (args.modelName !== undefined) updateData.modelName = args.modelName;
    if (args.modelType !== undefined) updateData.modelType = args.modelType;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    if (args.pricingType !== undefined) updateData.pricingType = args.pricingType;
    if (args.creditCost !== undefined) updateData.creditCost = args.creditCost;
    if (args.factor !== undefined) updateData.factor = args.factor;
    if (args.formulaJson !== undefined) updateData.formulaJson = args.formulaJson;
    
    await ctx.db.patch(existing._id, updateData);
    
    return existing._id;
  },
});

// Delete a pricing model
export const deletePricingModel = mutation({
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
    
    await ctx.db.delete(existing._id);
    
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
    let query = ctx.db
      .query("storyboard_model_credit")
      .filter((q) => q.eq("isActive", true));
    
    if (args.modelType) {
      query = query.withIndex("by_model_type").filter((q) => q.eq("modelType", args.modelType));
    }
    
    const models = await query.collect();
    
    return models;
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
          resolution_multipliers: { "480P": 1, "720P": 2, "1080P": 4 },
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
    modelType: "video" as const,
    isActive: true,
    pricingType: "formula" as const,
    creditCost: 7,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 7,
        resolution_multipliers: { "480P": 1, "720P": 2, "1080P": 4 },
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
    factor: 1.3,
  },
  {
    modelId: "ideogram/character-edit",
    modelName: "Character Edit",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 5,
    factor: 1.3,
  },
  {
    modelId: "gpt-image/1.5-text-to-image",
    modelName: "1.5 Text to Image",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 4,
    factor: 1.3,
  },
  {
    modelId: "google/nano-banana-edit",
    modelName: "Nano Banana Edit",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 4,
    factor: 1.3,
  },
  {
    modelId: "qwen/image-to-image",
    modelName: "Image to Image",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 4,
    factor: 1.3,
  },
  {
    modelId: "flux-2/flex-text-to-image",
    modelName: "Flex Text to Image",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 14,
    factor: 1.3,
  },
  {
    modelId: "recraft/crisp-upscale",
    modelName: "Crisp Upscale",
    modelType: "image" as const,
    isActive: true,
    pricingType: "fixed" as const,
    creditCost: 0.5,
    factor: 1.3,
  },
  {
    modelId: "topaz/image-upscale",
    modelName: "Image Upscale",
    modelType: "image" as const,
    isActive: true,
    pricingType: "formula" as const,
    creditCost: 10,
    factor: 1.3,
    formulaJson: JSON.stringify({
      pricing: {
        base_cost: 10,
        qualities: [
          { name: "1K", cost: 10 },
          { name: "2K", cost: 18 },
          { name: "4K", cost: 30 },
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
