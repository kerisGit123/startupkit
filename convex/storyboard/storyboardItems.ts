import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    sceneId: v.string(),
    order: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    generatedBy: v.string(),
    // Remove companyId from args - calculate from auth context
  },
  handler: async (ctx, args) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    
    const companyId = (userOrganizationId || userId) as string;
    
    return await ctx.db.insert("storyboard_items", {
      ...args,
      companyId, // Use the calculated companyId
      elements: [],
      annotations: [],
      isAIGenerated: false,
      generationStatus: "none",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByProject = query({
  args: { projectId: v.id("storyboard_projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("storyboard_items")
      .withIndex("by_order", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_items"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    generationStatus: v.optional(v.string()),
    tags: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.string(),
    }))),
    imageGeneration: v.optional(v.object({
      model: v.string(),
      creditsUsed: v.number(),
      status: v.string(),
      taskId: v.optional(v.string()),
    })),
    videoGeneration: v.optional(v.object({
      model: v.string(),
      mode: v.string(),
      quality: v.string(),
      duration: v.number(),
      creditsUsed: v.number(),
      status: v.string(),
      taskId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const reorder = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    itemOrders: v.array(v.object({
      itemId: v.id("storyboard_items"),
      newOrder: v.number(),
    })),
  },
  handler: async (ctx, { projectId, itemOrders }) => {
    for (const { itemId, newOrder } of itemOrders) {
      await ctx.db.patch(itemId, { order: newOrder, updatedAt: Date.now() });
    }
    await ctx.db.patch(projectId, { updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_items") },
  handler: async (ctx, { id }) => {
    const item = await ctx.db.get(id);
    if (!item) {
      console.log(`[Remove Item] Item not found: ${id}`);
      return; // Don't throw error, just return if item doesn't exist
    }
    await ctx.db.delete(id);
    console.log(`[Remove Item] Deleted item: ${id}`);
  },
});

export const updateFavorite = mutation({
  args: {
    id: v.id("storyboard_items"),
    isFavorite: v.boolean(),
  },
  handler: async (ctx, { id, isFavorite }) => {
    await ctx.db.patch(id, { 
      isFavorite, 
      updatedAt: Date.now() 
    });
  },
});

export const getByTaskId = query({
  args: { taskId: v.string() },
  handler: async (ctx, { taskId }) => {
    const items = await ctx.db.query("storyboard_items").collect();
    return items.find((i) => i.imageGeneration?.taskId === taskId);
  },
});

export const updateByTaskId = mutation({
  args: {
    taskId: v.string(),
    imageUrl: v.optional(v.string()),
    generationStatus: v.string(),
  },
  handler: async (ctx, { taskId, imageUrl, generationStatus }) => {
    const items = await ctx.db.query("storyboard_items").collect();
    const item = items.find((i) => i.imageGeneration?.taskId === taskId);
    if (!item) return;

    await ctx.db.patch(item._id, {
      generationStatus,
      imageUrl,
      ...(item.imageGeneration
        ? { imageGeneration: { ...item.imageGeneration, status: generationStatus } }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const updateByVideoTaskId = mutation({
  args: {
    taskId: v.string(),
    videoUrl: v.optional(v.string()),
    generationStatus: v.string(),
  },
  handler: async (ctx, { taskId, videoUrl, generationStatus }) => {
    const items = await ctx.db.query("storyboard_items").collect();
    const item = items.find((i) => i.videoGeneration?.taskId === taskId);
    if (!item) return;

    await ctx.db.patch(item._id, {
      generationStatus,
      videoUrl,
      ...(item.videoGeneration
        ? { videoGeneration: { ...item.videoGeneration, status: generationStatus } }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const buildStoryboard = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    // Remove companyId - calculate from auth context
    script: v.string(),
    scenes: v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      characters: v.array(v.string()),
      locations: v.array(v.string()),
      duration: v.optional(v.number()),
    })),
    enhancedElements: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      confidence: v.number(),
      description: v.string(),
      sceneUsage: v.array(v.number()),
      visualConsistency: v.optional(v.any()),
      tags: v.array(v.string()),
    }))),
  },
  handler: async (ctx, { projectId, script, scenes, enhancedElements = [] }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Use current user's organization
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const actualCompanyId = (userOrganizationId || userId) as string;
    
    console.log(`[Build Storyboard] Creating elements with actualCompanyId: ${actualCompanyId}`);
    console.log(`[Build Storyboard] Project ID: ${projectId}`);
    
    // Create character elements for any new characters found
    const uniqueCharacters = [...new Set(scenes.flatMap(s => s.characters))];
    console.log(`[Build Storyboard] Found characters: ${uniqueCharacters.join(', ')}`);
    
    // Create character elements
    for (const characterName of uniqueCharacters) {
      if (!characterName.trim()) continue; // Skip empty characters
      
      // Check if character element already exists for this project
      const existingElements = await ctx.db
        .query("storyboard_elements")
        .collect();
      
      const characterExists = existingElements.some(el => 
        el.projectId === projectId && 
        el.type === "character" &&
        el.name.toLowerCase() === characterName.toLowerCase()
      );
      
      console.log(`[Build Storyboard] Character "${characterName}" exists: ${characterExists}`);
      
      if (!characterExists) {
        console.log(`[Build Storyboard] Creating character with actualCompanyId: "${actualCompanyId}"`);
        await ctx.db.insert("storyboard_elements", {
          projectId,
          companyId: actualCompanyId,
          name: characterName,
          type: "character",
          thumbnailUrl: "",
          referenceUrls: [],
          tags: [],
          createdBy: "system",
          usageCount: 0,
          visibility: "private",
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`[Build Storyboard] Created character element: ${characterName}`);
      }
    }
    
    // Create environment elements - OPTIMIZED: Only create for unique, meaningful locations
    const uniqueLocations = [...new Set(scenes.flatMap(s => s.locations))];
    console.log(`[Build Storyboard] Found locations: ${uniqueLocations.join(', ')}`);
    
    // OPTIMIZATION: Filter out generic/overly specific locations that shouldn't be reusable elements
    const filteredLocations = uniqueLocations.filter(location => {
      const lowerLocation = location.toLowerCase().trim();
      
      // Skip generic locations that aren't reusable
      const genericLocations = [
        'unknown', 'various', 'multiple locations', 'different locations',
        'inside', 'outside', 'interior', 'exterior', 'day', 'night',
        'morning', 'afternoon', 'evening', 'dawn', 'dusk'
      ];
      
      // Skip overly specific locations (room numbers, specific addresses, etc.)
      const isOverlySpecific = /\d/.test(lowerLocation) || 
                              lowerLocation.includes('room') && lowerLocation.split(' ').length > 2 ||
                              lowerLocation.includes('street') && lowerLocation.split(' ').length > 3;
      
      // Skip if it's a generic location or overly specific
      return !genericLocations.includes(lowerLocation) && !isOverlySpecific && lowerLocation.length > 2;
    });
    
    console.log(`[Build Storyboard] Filtered meaningful locations: ${filteredLocations.join(', ')}`);
    
    // Process enhanced elements if provided
    if (enhancedElements.length > 0) {
      console.log(`[Build Storyboard] Processing ${enhancedElements.length} enhanced elements`);
      
      for (const enhancedElement of enhancedElements) {
        // Check if element already exists for this project
        const existingElements = await ctx.db
          .query("storyboard_elements")
          .collect();
        
        const elementExists = existingElements.some(el => 
          el.projectId === projectId && 
          el.type === enhancedElement.type &&
          el.name.toLowerCase() === enhancedElement.name.toLowerCase()
        );
        
        console.log(`[Build Storyboard] Enhanced element "${enhancedElement.name}" exists: ${elementExists}`);
        
        if (!elementExists) {
          console.log(`[Build Storyboard] Creating enhanced element: ${enhancedElement.name} (${enhancedElement.type})`);
          await ctx.db.insert("storyboard_elements", {
            projectId,
            companyId: actualCompanyId,
            name: enhancedElement.name,
            type: enhancedElement.type,
            description: enhancedElement.description, // Store detailed description
            thumbnailUrl: "",
            referenceUrls: [],
            tags: enhancedElement.tags,
            createdBy: "system-enhanced",
            usageCount: 0,
            visibility: "private",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: "ready",
          });
        }
      }
    }
    
    // Create environment elements only for meaningful, reusable locations
    for (const locationName of filteredLocations) {
      if (!locationName.trim()) continue; // Skip empty locations
      
      // Check if environment element already exists for this project
      const existingElements = await ctx.db
        .query("storyboard_elements")
        .collect();
      
      const locationExists = existingElements.some(el => 
        el.projectId === projectId && 
        el.type === "environment" &&
        el.name.toLowerCase() === locationName.toLowerCase()
      );
      
      console.log(`[Build Storyboard] Location "${locationName}" exists: ${locationExists}`);
      
      if (!locationExists) {
        console.log(`[Build Storyboard] Creating environment with actualCompanyId: "${actualCompanyId}"`);
        await ctx.db.insert("storyboard_elements", {
          projectId,
          companyId: actualCompanyId,
          name: locationName,
          type: "environment",
          thumbnailUrl: "",
          referenceUrls: [],
          tags: [],
          createdBy: "system",
          usageCount: 0,
          visibility: "private",
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`[Build Storyboard] Created environment element: ${locationName}`);
      }
    }
    
    // Create storyboard items
    const items = scenes.map((s, i) => {
      const item = {
        projectId,
        companyId: actualCompanyId,
        sceneId: s.id,
        order: i,
        title: s.title,
        description: s.content.substring(0, 300),
        duration: s.duration || 5,
        generatedBy: "system",
        generationStatus: "none",
        isAIGenerated: false,
        elements: [],
        annotations: [],
        notes: "",
        tags: [],
        imageUrl: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      console.log(`[Build Storyboard] Creating item ${i}: duration=${item.duration}, title=${item.title}`);
      return item;
    });
    
    // Insert all items
    for (const item of items) {
      await ctx.db.insert("storyboard_items", item);
    }
    
    return { 
      createdItems: items.length, 
      createdCharacters: uniqueCharacters.length,
      createdEnvironments: uniqueLocations.filter(l => l !== "Unknown").length
    };
  },
});

export const createBatch = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    items: v.array(v.object({
      sceneId: v.string(),
      order: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      duration: v.number(),
      generatedBy: v.string(),
    })),
  },
  handler: async (ctx, { projectId, items }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Use current user's organization
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const actualCompanyId = userOrganizationId || userId;
    
    const ids: string[] = [];
    for (const item of items) {
      const id = await ctx.db.insert("storyboard_items", {
        projectId,
        companyId: actualCompanyId,
        ...item,
        elements: [],
        annotations: [],
        isAIGenerated: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

// NEW: Frame status and notes mutations (safe implementation)
export const updateFrameStatus = mutation({
  args: {
    id: v.id("storyboard_items"),
    frameStatus: v.optional(v.string()),
  },
  handler: async (ctx, { id, frameStatus }) => {
    // Validate status if provided
    if (frameStatus) {
      const validStatuses = ['draft', 'in-progress', 'completed'];
      if (!validStatuses.includes(frameStatus)) {
        throw new Error(`Invalid frameStatus: ${frameStatus}`);
      }
    }
    
    await ctx.db.patch(id, {
      frameStatus,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

export const updateFrameNotes = mutation({
  args: {
    id: v.id("storyboard_items"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, notes }) => {
    await ctx.db.patch(id, {
      notes,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});
