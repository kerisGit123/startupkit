import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireWorkspaceAccess, requireWebhookSecret } from "../credits";

// Per-plan project limits. Keep in sync with lib/plan-config.ts PLAN_LIMITS.
// Convex mutations can't import from `lib/` directly (different runtime),
// so this is duplicated. Update both places together.
const PROJECT_LIMITS: Record<string, number> = {
  free: 3,
  pro_personal: Number.MAX_SAFE_INTEGER,
  business: Number.MAX_SAFE_INTEGER,
};

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    orgId: v.string(),
    ownerId: v.string(),
    // Remove companyId - calculate from auth context
    settings: v.object({
      frameRatio: v.string(),
      style: v.string(),
      layout: v.string(),
    }),
    isFavorite: v.optional(v.boolean()),
    style: v.optional(v.string()),
    stylePrompt: v.optional(v.string()),
    // Client-provided plan from useSubscription(). Server re-validates
    // the project count against PROJECT_LIMITS[plan] so a client that
    // lies about its plan is still capped at the lowest tier's limit.
    plan: v.optional(v.string()),
  },
  handler: async (ctx, { name, description, orgId, ownerId, settings, isFavorite, style, stylePrompt, plan }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;

    const companyId = (userOrganizationId || userId) as string;

    // ── Server-side lapsed check (defense in depth) ──
    // Block project creation if the workspace is an org whose
    // subscription has lapsed. The UI already shows a disabled state,
    // but this prevents bypassing via direct mutation calls.
    const isOrg = companyId.startsWith("org_");
    if (isOrg) {
      const preCheckBalance = await ctx.db
        .query("credits_balance")
        .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
        .first();
      if (preCheckBalance?.lapsedAt) {
        throw new Error(
          "This organization's subscription has lapsed. Resubscribe to create new projects.",
        );
      }
    }

    // Enforce project limit based on plan
    const effectivePlan = plan && PROJECT_LIMITS[plan] !== undefined ? plan : "free";
    const maxProjects = PROJECT_LIMITS[effectivePlan];

    const existingProjects = await ctx.db
      .query("storyboard_projects")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .collect();

    if (existingProjects.length >= maxProjects) {
      throw new Error(
        `Project limit reached for ${effectivePlan} plan (${maxProjects} projects). Upgrade to create more.`,
      );
    }

    return await ctx.db.insert("storyboard_projects", {
      name,
      description,
      orgId,
      ownerId,
      companyId, // Use the calculated companyId
      teamMemberIds: [],
      status: "draft",
      isFavorite: isFavorite ?? false,
      style: style || settings.style || "cinematic",
      stylePrompt: stylePrompt || "",
      tags: [],
      script: "",
      scenes: [],
      settings,
      metadata: {
        sceneCount: 0,
        estimatedDuration: 0,
        aiModel: "",
      },
      isAIGenerated: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByOrg = query({
  args: { orgId: v.string(), status: v.optional(v.string()) },
  handler: async (ctx, { orgId, status }) => {
    let q = ctx.db
      .query("storyboard_projects")
      .withIndex("by_org", (q) => q.eq("orgId", orgId));
    const results = await q.order("desc").collect();
    if (status) return results.filter((p) => p.status === status);
    return results;
  },
});

export const get = query({
  args: {
    id: v.id("storyboard_projects"),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, { id, _secret }) => {
    const project = await ctx.db.get(id);
    if (!project) return null;
    if (_secret) {
      requireWebhookSecret(_secret); // n8n / r2-upload webhooks
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null; // Unauthenticated — let Clerk redirect handle it
      // Fast path: the project's creator always has access.
      if (project.ownerId === identity.subject) return project;
      try {
        await requireWorkspaceAccess(ctx, project.companyId ?? project.orgId ?? project.ownerId);
      } catch {
        return null; // Access denied — caller shows 404/denied UI instead of crashing
      }
    }
    return project;
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
    aspectRatio: v.optional(v.string()), // "16:9" | "9:16" | "1:1" | "4:5"
    style: v.optional(v.string()), // Top-level project theme: "cinematic" | "sketch" | "anime" | etc.
    stylePrompt: v.optional(v.string()), // Actual style prompt text appended to generations
    formatPreset: v.optional(v.string()), // Format preset key: "film" | "documentary" | "youtube" | "reel" | etc.
    colorPalette: v.optional(v.object({
      referenceUrl: v.optional(v.string()),
      colors: v.array(v.string()),
    })),
    tags: v.optional(v.array(v.string())),
    script: v.optional(v.string()),
    imageUrl: v.optional(v.string()), // NEW: Image URL for project's main image
    scenes: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      characters: v.array(v.string()),
      locations: v.array(v.string()),
      technical: v.optional(v.object({
        camera: v.array(v.string()),
        lighting: v.array(v.string()),
        perspective: v.array(v.string()),
        action: v.array(v.string()),
      })),
    }))),
    settings: v.optional(v.object({
      frameRatio: v.string(),
      style: v.string(),
      layout: v.string(),
    })),
    metadata: v.optional(v.object({
      sceneCount: v.number(),
      estimatedDuration: v.number(),
      aiModel: v.string(),
    })),
    isAIGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, imageUrl, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Project not found");
    }
    await requireWorkspaceAccess(ctx, existing.companyId ?? existing.orgId ?? existing.ownerId);

    // Create updated document — spread existing first, then override with provided fields
    const updatedDoc = { ...existing, ...fields, updatedAt: Date.now() };

    // Handle imageUrl specially: only update if explicitly provided
    // undefined = not passed (keep existing), empty string = explicitly clear it
    if (imageUrl !== undefined) {
      if (imageUrl === "") {
        delete updatedDoc.imageUrl;
      } else {
        updatedDoc.imageUrl = imageUrl;
      }
    }
    // When imageUrl is undefined (not passed), keep existing imageUrl unchanged

    await ctx.db.replace(id, updatedDoc);
  },
});

export const duplicate = mutation({
  args: { id: v.id("storyboard_projects") },
  handler: async (ctx, { id }) => {
    const project = await ctx.db.get(id);
    if (!project) {
      throw new Error("Storyboard project not found");
    }
    await requireWorkspaceAccess(ctx, project.companyId ?? project.orgId ?? project.ownerId);

    const duplicatedProjectId = await ctx.db.insert("storyboard_projects", {
      name: `${project.name} (copy)`,
      description: project.description,
      orgId: project.orgId,
      ownerId: project.ownerId,
      companyId: project.companyId,
      teamMemberIds: project.teamMemberIds,
      status: project.status,
      isFavorite: false,
      tags: project.tags,
      script: project.script,
      scenes: project.scenes,
      settings: project.settings,
      metadata: project.metadata,
      isAIGenerated: project.isAIGenerated,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const storyboardItems = await ctx.db
      .query("storyboard_items")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();

    for (const item of storyboardItems) {
      await ctx.db.insert("storyboard_items", {
        projectId: duplicatedProjectId,
        companyId: project.companyId, // Inherit companyId from project
        sceneId: item.sceneId,
        order: item.order,
        title: item.title,
        description: item.description,
        duration: item.duration,
        imageUrl: item.imageUrl,
        imagePrompt: item.imagePrompt,
        videoUrl: item.videoUrl,
        audioUrl: item.audioUrl,
        tags: item.tags,
        imageGeneration: item.imageGeneration,
        videoGeneration: item.videoGeneration,
        elements: item.elements,
        annotations: item.annotations,
        generatedBy: item.generatedBy,
        isAIGenerated: item.isAIGenerated,
        generationStatus: item.generationStatus,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return duplicatedProjectId;
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_projects") },
  handler: async (ctx, { id }) => {
    // Get the project to verify it exists and get its ID
    const project = await ctx.db.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    await requireWorkspaceAccess(ctx, project.companyId ?? project.orgId ?? project.ownerId);

    console.log(`[Project Remove] Starting cleanup for project: ${id}`);

    // 1. Remove all storyboard items for this project
    try {
      const storyboardItems = await ctx.db
        .query("storyboard_items")
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();
      
      console.log(`[Project Remove] Found ${storyboardItems.length} storyboard items to delete`);
      
      for (const item of storyboardItems) {
        await ctx.db.delete(item._id);
        console.log(`[Project Remove] Deleted storyboard item: ${item._id}`);
      }
    } catch (error) {
      console.error(`[Project Remove] Error deleting storyboard items:`, error);
    }

    // 2. Remove all private elements for this project
    try {
      // First get all elements for this project
      const allElements = await ctx.db
        .query("storyboard_elements")
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();
      
      // Filter for private elements only
      const privateElements = allElements.filter(element => element.visibility === "private");
      
      console.log(`[Project Remove] Found ${privateElements.length} private elements to delete (out of ${allElements.length} total elements)`);
      
      for (const element of privateElements) {
        await ctx.db.delete(element._id);
        console.log(`[Project Remove] Deleted private element: ${element._id}`);
      }
    } catch (error) {
      console.error(`[Project Remove] Error deleting private elements:`, error);
    }

    // 3. Handle files for this project.
    // R2 bytes should already be deleted by the API route (delete-project)
    // before this mutation runs. This step handles the Convex records only:
    //   defaultAI present → keep record (audit trail), clear r2Key/categoryId
    //   defaultAI absent  → hard delete the record entirely
    try {
      const projectFiles = await ctx.db
        .query("storyboard_files")
        .withIndex("by_project", (q) => q.eq("projectId", id))
        .collect();

      console.log(`[Project Remove] Processing ${projectFiles.length} files`);

      for (const file of projectFiles) {
        // Skip files already processed by cleanupItemFiles (status="deleted", categoryId=null).
        // The API route runs cleanup before this mutation — this loop is a safety net
        // for files that were missed (e.g. if cleanup partially failed).
        if (file.status === "deleted") continue;

        if (file.defaultAI) {
          // AI-generated: keep for logs, mark as deleted, clear pointers
          await ctx.db.patch(file._id, {
            r2Key: "",
            sourceUrl: "",
            status: "deleted",
            categoryId: null,
            deletedAt: Date.now(),
            size: 0,
          });
        } else {
          // User-uploaded: no audit need, hard delete
          await ctx.db.delete(file._id);
        }
      }
    } catch (error) {
      console.error(`[Project Remove] Error processing files:`, error);
    }

    // NOTE: Credit usage records are PRESERVED for billing and audit purposes
    // These records track user charges and should not be deleted

    // 4. Finally, delete the project itself
    await ctx.db.delete(id);
    
    // 5. Verification - Check if deletion was successful
    const remainingItems = await ctx.db
      .query("storyboard_items")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    const remainingElements = await ctx.db
      .query("storyboard_elements")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    const remainingFiles = await ctx.db
      .query("storyboard_files")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    console.log(`[Project Remove] Verification - Remaining data after deletion:`);
    console.log(`  - Storyboard items: ${remainingItems.length} (should be 0)`);
    console.log(`  - Elements: ${remainingElements.length} (should be public elements only)`);
    console.log(`  - Files: ${remainingFiles.length} (should be 0)`);
    
    console.log(`[Project Remove] Successfully deleted project ${id} and all associated data (credit usage preserved)`);
  },
});

// Update project build status without changing script content
export const updateBuildStatus = mutation({
  args: {
    id: v.id("storyboard_projects"),
    taskStatus: v.optional(v.string()),          // "idle" | "processing" | "ready" | "error"
    taskMessage: v.optional(v.string()), // "Building storyboard..." etc.
    scriptType: v.optional(v.string()), // "ANIMATED_STORIES" | "KIDS_ANIMATED_STORIES" | etc.
    scenes: v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      characters: v.array(v.string()),
      locations: v.array(v.string()),
      technical: v.optional(v.object({
        camera: v.array(v.string()),
        lighting: v.array(v.string()),
        perspective: v.array(v.string()),
        action: v.array(v.string()),
      })),
    })),
    isAIGenerated: v.boolean(),
    _secret: v.optional(v.string()),
  },
  handler: async (ctx, { id, taskStatus, taskMessage, scriptType, scenes, isAIGenerated, _secret }) => {
    // Called only by n8n webhook (no Clerk identity); guard with shared secret.
    requireWebhookSecret(_secret);
    await ctx.db.patch(id, {
      taskStatus,
      taskMessage,
      scriptType,
      scenes,
      isAIGenerated,
      metadata: {
        sceneCount: scenes.length,
        estimatedDuration: scenes.length * 5,
        aiModel: "",
      },
      updatedAt: Date.now(),
    });
  },
});

export const updateScript = mutation({
  args: {
    id: v.id("storyboard_projects"),
    script: v.string(),
    scenes: v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.string(),
      characters: v.array(v.string()),
      locations: v.array(v.string()),
      technical: v.optional(v.object({
        camera: v.array(v.string()),
        lighting: v.array(v.string()),
        perspective: v.array(v.string()),
        action: v.array(v.string()),
      })),
    })),
    isAIGenerated: v.boolean(),
    aiModel: v.optional(v.string()),
    taskStatus: v.optional(v.string()),          // "idle" | "processing" | "ready" | "error"
    taskMessage: v.optional(v.string()), // "Building storyboard..." etc.
    scriptType: v.optional(v.string()), // "ANIMATED_STORIES" | "KIDS_ANIMATED_STORIES" | etc.
  },
  handler: async (ctx, { id, script, scenes, isAIGenerated, aiModel, taskStatus, taskMessage, scriptType }) => {
    const project = await ctx.db.get(id);
    if (!project) throw new Error("Project not found");
    await requireWorkspaceAccess(ctx, project.companyId ?? project.orgId ?? project.ownerId);
    await ctx.db.patch(id, {
      script,
      scenes,
      isAIGenerated,
      taskStatus,
      taskMessage,
      scriptType,
      metadata: {
        sceneCount: scenes.length,
        estimatedDuration: scenes.length * 5,
        aiModel: aiModel ?? "",
      },
      updatedAt: Date.now(),
    });
  },
});

export const updateWorldView = mutation({
  args: {
    id: v.id("storyboard_projects"),
    worldViewConcept: v.optional(v.string()),
    worldViewImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, worldViewConcept, worldViewImageUrl }) => {
    const project = await ctx.db.get(id);
    if (!project) throw new Error("Project not found");
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (worldViewConcept !== undefined) patch.worldViewConcept = worldViewConcept;
    if (worldViewImageUrl !== undefined) patch.worldViewImageUrl = worldViewImageUrl;
    await ctx.db.patch(id, patch);
  },
});
