import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Mutation to handle n8n webhook callback
export const n8nWebhookCallback = mutation({
  args: {
    // The processed data from n8n
    storyboardId: v.id("storyboard_projects"), // Use storyboard_projects table
    scriptType: v.string(),
    language: v.string(),
    buildStrategy: v.string(), // Added: "replace_all" | "add_update"
    elements: v.object({
      characters: v.array(v.object({
        name: v.string(),
        description: v.string(),
        confidence: v.number(),
        type: v.string(),
        appearsInScenes: v.array(v.number())
      })),
      environments: v.array(v.object({
        name: v.string(),
        description: v.string(),
        confidence: v.number(),
        type: v.string(),
        appearsInScenes: v.array(v.number())
      })),
      props: v.array(v.object({
        name: v.string(),
        description: v.string(),
        confidence: v.number(),
        type: v.string(),
        appearsInScenes: v.array(v.number())
      }))
    }),
    scenes: v.array(v.object({
      sceneNumber: v.number(),
      title: v.string(),
      duration: v.string(),
      description: v.string(),
      visualPrompt: v.string(),
      elements: v.object({
        characters: v.array(v.string()),
        environments: v.array(v.string()),
        props: v.array(v.string())
      })
    }))
  },
  handler: async (ctx, args) => {
    const { storyboardId, elements, scenes, buildStrategy } = args;

    try {
      // 1. Clear existing data if replace_all strategy
      if (buildStrategy === "replace_all") {
        await clearExistingElements(ctx, storyboardId);
        await clearExistingScenes(ctx, storyboardId);
      }

      // 2. Create elements (using correct table name)
      const allElements = [
        ...elements.characters.map(char => ({ ...char, type: "character" })),
        ...elements.environments.map(env => ({ ...env, type: "environment" })),
        ...elements.props.map(prop => ({ ...prop, type: "prop" }))
      ];

      for (const element of allElements) {
        await ctx.db.insert("storyboard_elements", {
          projectId: storyboardId, // Use projectId field
          type: element.type,
          name: element.name,
          description: element.description,
          confidence: element.confidence,
          appearsInScenes: element.appearsInScenes
        });
      }

      // 3. Create scenes (using correct table name)
      for (const scene of scenes) {
        await ctx.db.insert("storyboard_items", {
          projectId: storyboardId, // Use projectId field
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          duration: parseFloat(scene.duration) || 5.0, // Convert to number
          description: scene.description,
          visualPrompt: scene.visualPrompt,
          elements: [] // Empty array for now, will be populated later
        });
      }

      // 4. Update task status to completed (per plan requirement)
      await ctx.db.patch(storyboardId, {
        taskStatus: "ready",
        taskMessage: "Build completed"
      });

      return { 
        success: true, 
        message: "Elements and scenes saved successfully",
        storyboardId,
        elementsCount: {
          characters: elements.characters?.length || 0,
          environments: elements.environments?.length || 0,
          props: elements.props?.length || 0
        },
        scenesCount: scenes?.length || 0
      };

    } catch (error: any) {
      console.error("Error in n8nWebhookCallback:", error);
      
      // 5. Update task status to failed on error
      await ctx.db.patch(storyboardId, {
        taskStatus: "error",
        taskMessage: `Build failed: ${error.message}`
      });
      
      return { 
        success: false, 
        error: error.message,
        storyboardId
      };
    }
  }
});

// Helper functions (per plan requirements)
async function clearExistingElements(ctx, storyboardId) {
  const existingElements = await ctx.db.query("storyboard_elements")
    .filter(q => q.eq(q.field("projectId"), storyboardId))
    .collect();
  
  let deletedCount = 0;
  let preservedCount = 0;
  
  for (const element of existingElements) {
    // Preserve public elements, delete private elements for clean regeneration
    if (element.visibility === "public") {
      preservedCount++;
    } else {
      await ctx.db.delete(element._id);
      deletedCount++;
    }
  }
  
  console.log(`Element cleanup: Deleted ${deletedCount} private elements, preserved ${preservedCount} public elements`);
}

async function clearExistingScenes(ctx, storyboardId) {
  const existingScenes = await ctx.db.query("storyboard_items")
    .filter(q => q.eq(q.field("projectId"), storyboardId))
    .collect();
  
  let deletedCount = 0;
  let preservedCount = 0;
  
  for (const scene of existingScenes) {
    if (scene.sceneId.startsWith("scene-")) {
      // Delete script-based scenes
      await ctx.db.delete(scene._id);
      deletedCount++;
    } else if (scene.sceneId.startsWith("manual-")) {
      // Auto-preserve manual scenes - no user choice needed
      preservedCount++;
    }
  }
  
  console.log(`Build cleanup: Deleted ${deletedCount} script scenes, preserved ${preservedCount} manual scenes`);
}

// Query to check if project exists
export const getProject = query({
  args: {
    projectId: v.string()
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project;
  }
});
