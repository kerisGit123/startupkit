import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// Special function for n8n webhook that doesn't require authentication
export const createFromN8n = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    sceneId: v.string(),
    order: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    generatedBy: v.string(),
    companyId: v.optional(v.string()),
    elementNames: v.optional(v.object({
      characters: v.array(v.string()),
      environments: v.array(v.string()),
      props: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Skip authentication check for n8n webhook
    // This is safe because we validate the Bearer token in the API route
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Verify project exists and is accessible
    if (project.status !== "active" && project.status !== "draft") {
      throw new Error("Project is not accessible for scene creation");
    }
    
    const sceneId = await ctx.db.insert("storyboard_items", {
      ...args,
      elements: [],
      annotations: [],
      isAIGenerated: false,
      generationStatus: "completed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return await ctx.db.get(sceneId);
  },
});

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
    elementNames: v.optional(v.object({
      characters: v.array(v.string()),
      environments: v.array(v.string()),
      props: v.array(v.string()),
    })),
    linkedElements: v.optional(v.array(v.object({
      id: v.id("storyboard_elements"),
      name: v.string(),
      type: v.string(),
    }))),
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
    rebuildStrategy: v.optional(v.union(v.literal("append_update"), v.literal("hard_rebuild"))),
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
      locationType: v.optional(v.string()), // For smart environment grouping
    }))),
    metadata: v.optional(v.object({
      genre: v.optional(v.string()),
      visualStyle: v.optional(v.string()),
      creatureDesign: v.optional(v.string()),
      mainCharacter: v.optional(v.string()),
      totalDuration: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { projectId, rebuildStrategy, script, scenes, enhancedElements = [], metadata }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Use project companyId as canonical value, fallback to auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const actualCompanyId = (project.companyId || userOrganizationId || userId) as string;
    
    console.log(`[Build Storyboard] Creating elements with actualCompanyId: ${actualCompanyId}`);
    console.log(`[Build Storyboard] Project ID: ${projectId}`);
    console.log(`[Build Storyboard] Metadata received:`, metadata);
    
    // Update project metadata if provided
    if (metadata && (metadata.genre || metadata.visualStyle)) {
      const currentMetadata = project.metadata || { sceneCount: 0, estimatedDuration: 0, aiModel: "unknown" };
      await ctx.db.patch(projectId, {
        metadata: {
          ...currentMetadata,
          sceneCount: scenes.length,
          estimatedDuration: scenes.reduce((sum, s) => sum + (s.duration || 5), 0),
          genre: metadata.genre || currentMetadata.genre,
          visualStyle: metadata.visualStyle || currentMetadata.visualStyle,
          creatureDesign: metadata.creatureDesign || currentMetadata.creatureDesign,
          mainCharacter: metadata.mainCharacter || currentMetadata.mainCharacter,
        }
      });
      console.log(`[Build Storyboard] Updated project metadata with genre: ${metadata.genre}, visualStyle: ${metadata.visualStyle}`);
    }
    console.log(`[Build Storyboard] Scenes to process: ${scenes.length}`);
    console.log(`[Build Storyboard] Rebuild strategy: ${rebuildStrategy ?? "append_update"}`);
    
    if (rebuildStrategy === "hard_rebuild") {
      const existingItems = await ctx.db
        .query("storyboard_items")
        .collect()
        .then((items) => items.filter((item) => item.projectId === projectId));

      if (existingItems.length > 0) {
        console.log(`[Build Storyboard] Hard Rebuild: Deleting ${existingItems.length} existing storyboard items`);
        for (const item of existingItems) {
          await ctx.db.delete(item._id);
        }
        console.log(`[Build Storyboard] Successfully deleted all existing items for hard rebuild`);
      }

      const existingProjectElements = await ctx.db
        .query("storyboard_elements")
        .filter((q) => q.eq("projectId", projectId))
        .collect();

      if (existingProjectElements.length > 0) {
        console.log(`[Build Storyboard] Hard Rebuild: Deleting ${existingProjectElements.length} existing project elements`);
        for (const element of existingProjectElements) {
          await ctx.db.delete(element._id);
        }
        console.log(`[Build Storyboard] Successfully deleted all existing project elements for hard rebuild`);
      }
    }
    
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
      
      const characterExists = existingElements.find(el => 
        el.projectId === projectId && 
        el.companyId === actualCompanyId && 
        el.type === "character" && 
        el.name.toLowerCase() === characterName.toLowerCase().trim()
      );
      
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
    
    console.log(`[Build Storyboard Debug] Enhanced elements received: ${enhancedElements?.length ?? 'undefined (skip element creation)'}`);

    // Skip all element creation if enhancedElements is undefined (preserve strategy)
    if (enhancedElements === undefined) {
      console.log(`[Build Storyboard] Skipping all element creation (preserve existing elements)`);
    } else if (enhancedElements.length > 0) {
      console.log(`[Build Storyboard] Creating ${enhancedElements.length} enhanced elements (smart detection) - skipping fallback environment creation`);
      
      // Count environment elements to skip fallback creation
      const enhancedEnvironments = enhancedElements.filter(e => e.type === 'environment').length;
      console.log(`[Build Storyboard] Enhanced environments found: ${enhancedEnvironments} - will NOT create generic fallback environments`);

      for (const enhancedElement of enhancedElements) {
        const existingElements = await ctx.db
          .query("storyboard_elements")
          .collect();

        const elementExists = existingElements.some((el) =>
          el.projectId === projectId &&
          el.companyId === actualCompanyId &&
          el.type === enhancedElement.type &&
          el.name.toLowerCase() === enhancedElement.name.toLowerCase().trim()
        );

        if (!elementExists) {
          await ctx.db.insert("storyboard_elements", {
            projectId,
            companyId: actualCompanyId,
            name: enhancedElement.name,
            type: enhancedElement.type,
            description: enhancedElement.description,
            thumbnailUrl: "",
            referenceUrls: [],
            tags: enhancedElement.tags,
            createdBy: "system-enhanced",
            usageCount: 0,
            visibility: "private",
            status: "ready",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          console.log(`[Build Storyboard] ✅ Created enhanced element: ${enhancedElement.name} (${enhancedElement.type}) with description: ${enhancedElement.description?.substring(0, 100)}...`);
        } else {
          console.log(`[Build Storyboard] ⚠️ Element already exists: ${enhancedElement.name} (${enhancedElement.type})`);
        }
      }
    } else {
      console.log(`[Build Storyboard Debug] No enhanced elements provided, checking fallback locations: ${filteredLocations.join(', ')}`);

      for (const locationName of filteredLocations) {
        if (!locationName.trim()) continue; // Skip empty locations
        
        const existingElements = await ctx.db
          .query("storyboard_elements")
          .collect();
        
        const environmentExists = existingElements.some(el => 
          el.projectId === projectId && 
          el.companyId === actualCompanyId && 
          el.type === "environment" && 
          el.name.toLowerCase() === locationName.toLowerCase().trim()
        );
        
        if (!environmentExists) {
          console.log(`[Build Storyboard] Creating fallback environment: ${locationName}`);
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
          console.log(`[Build Storyboard] Created fallback environment element: ${locationName}`);
        }
      }
    }
    
    // Get all created elements for this project to attach to storyboard items
    const allProjectElements = await ctx.db
      .query("storyboard_elements")
      .filter((q) => q.eq(q.field("projectId"), projectId))
      .collect();
    
    console.log(`[Build Storyboard] Found ${allProjectElements.length} elements to potentially attach to items`);
    
    // Create storyboard items (frames) with attached elements
    for (const scene of scenes) {
      // Extract scene number from scene.id (e.g., "scene-1" -> 1)
      const sceneNumber = parseInt(scene.id.replace(/\D/g, '')) || 0;
      
      // Find elements that should be attached to this scene based on sceneUsage
      const sceneElements: Array<{ id: Id<"storyboard_elements">; name: string; type: string }> = [];
      
      if (enhancedElements && enhancedElements.length > 0) {
        // Collect all matching elements for this scene
        const matchingElements = enhancedElements.filter(el => el.sceneUsage.includes(sceneNumber));
        
        // For environments, only select the MOST SPECIFIC one (highest confidence)
        const environments = matchingElements.filter(el => el.type === 'environment');
        const mostSpecificEnvironment = environments.length > 0 
          ? environments.reduce((prev, current) => (current.confidence > prev.confidence) ? current : prev)
          : null;
        
        // Add the most specific environment only
        if (mostSpecificEnvironment) {
          const dbElement = allProjectElements.find(el => 
            el.name === mostSpecificEnvironment.name && 
            el.type === mostSpecificEnvironment.type
          );
          if (dbElement) {
            sceneElements.push({
              id: dbElement._id as Id<"storyboard_elements">,
              name: dbElement.name,
              type: dbElement.type
            });
          }
        }
        
        // Add all characters and props (not environments)
        const nonEnvironments = matchingElements.filter(el => el.type !== 'environment');
        for (const enhancedElement of nonEnvironments) {
          const dbElement = allProjectElements.find(el => 
            el.name === enhancedElement.name && 
            el.type === enhancedElement.type
          );
          if (dbElement) {
            sceneElements.push({
              id: dbElement._id as Id<"storyboard_elements">,
              name: dbElement.name,
              type: dbElement.type
            });
          }
        }
      }
      
      console.log(`[Build Storyboard] Scene ${sceneNumber} (${scene.title}): Attaching ${sceneElements.length} elements:`, sceneElements.map(e => `${e.name} (${e.type})`).join(', '));
      
      await ctx.db.insert("storyboard_items", {
        projectId,
        sceneId: scene.id,
        title: scene.title,
        order: scene.duration || 5, // Default 5 seconds if not specified
        description: scene.content,
        duration: scene.duration || 5,
        tags: [],
        imageUrl: "",
        generationStatus: "pending",
        isFavorite: false,
        notes: "",
        generatedBy: "system", // Required field
        isAIGenerated: false, // Required field
        createdAt: Date.now(),
        updatedAt: Date.now(),
        
        // Required fields
        annotations: [], // Empty array for new items
        elements: [], // Canvas elements (annotations/drawings)
        linkedElements: sceneElements, // Link to element library items
        frameStatus: undefined, // Optional field - undefined for new items
      });
    }
    
    console.log(`[Build Storyboard] Created ${scenes.length} storyboard items`);
    
    // Return success info
    return {
      createdItems: scenes.length,
      createdCharacters: uniqueCharacters.length,
      createdEnvironments: filteredLocations.length,
      createdElements: enhancedElements.length,
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
