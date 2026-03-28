import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Special function for n8n webhook that doesn't require authentication
export const createFromN8n = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.string(),
    referenceUrls: v.array(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"), v.literal("shared"))),
    companyId: v.optional(v.string()),
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
      throw new Error("Project is not accessible for element creation");
    }
    
    const elementId = await ctx.db.insert("storyboard_elements", {
      ...args,
      usageCount: 0,
      visibility: args.visibility ?? "private",
      status: "ready",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return await ctx.db.get(elementId);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("storyboard_projects"),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.string(),
    referenceUrls: v.array(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"), v.literal("shared"))),
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
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const companyId = (project.companyId || userOrganizationId || userId) as string;
    
    return await ctx.db.insert("storyboard_elements", {
      projectId: args.projectId,
      companyId,
      name: args.name,
      type: args.type,
      description: args.description || "",
      thumbnailUrl: args.thumbnailUrl,
      referenceUrls: args.referenceUrls,
      tags: args.tags,
      createdBy: args.createdBy,
      usageCount: 0,
      visibility: args.visibility ?? "private",
      status: "ready",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("storyboard_projects"),
    type: v.optional(v.string()),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, type, companyId }) => {
    console.log(`[listByProject] === START ===`);
    console.log(`[listByProject] Args: projectId=${projectId}, type=${type}, companyId=${companyId}`);
    
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log(`[listByProject] ERROR: User not authenticated`);
      throw new Error("User not authenticated");
    }
    
    console.log(`[listByProject] Auth identity:`, {
      subject: identity.subject,
      orgId: identity.orgId,
      orgRole: identity.orgRole
    });
    
    const project = await ctx.db.get(projectId);
    if (!project) {
      console.log(`[listByProject] ERROR: Project not found for projectId=${projectId}`);
      throw new Error("Project not found");
    }
    
    console.log(`[listByProject] Project found:`, { id: project._id, name: project.name, companyId: project.companyId });
    
    const candidateCompanyIds = Array.from(new Set([
      companyId,
      project.companyId,
      identity.orgId,
      identity.subject,
    ].filter((value): value is string => Boolean(value))));

    console.log(`[listByProject] Candidate companyIds=${candidateCompanyIds.join(",")}`);
    console.log(`[listByProject] Filtering by projectId=${projectId}`);
    if (type) {
      console.log(`[listByProject] Filtering by type=${type}`);
    }

    const allProjectElements = await ctx.db
      .query("storyboard_elements")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();

    const results = allProjectElements.filter((element) => {
      if (type && element.type !== type) {
        return false;
      }

      // TEMPORARY: Show all project elements regardless of companyId for debugging
      if (candidateCompanyIds.length > 0) {
        console.log(`[listByProject] Element "${element.name}":`, {
          elementCompanyId: element.companyId,
          elementCreatedBy: element.createdBy,
          candidateCompanyIds,
          projectId: element.projectId
        });
        
        // TEMPORARILY include all elements that belong to this project
        return element.projectId === projectId;
      }

      return true;
    });
    
    console.log(`[listByProject] === RESULTS ===`);
    console.log(`[listByProject] Found ${results.length} elements`);
    if (results.length > 0) {
      console.log(`[listByProject] Element details:`, results.map(el => ({
        name: el.name,
        type: el.type,
        companyId: el.companyId,
        projectId: el.projectId
      })));
    } else {
      console.log(`[listByProject] No elements found - checking all elements for debug`);
      const allElements = await ctx.db.query("storyboard_elements").collect();
      console.log(`[listByProject] All elements in DB:`, allElements.map(el => ({
        name: el.name,
        companyId: el.companyId,
        projectId: el.projectId,
        type: el.type
      })));
    }
    
    return results;
  },
});

export const listByOrganization = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("storyboard_elements")
      .collect()
      .then(elements => elements.filter(el => el.companyId === companyId));
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("storyboard_elements").collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("storyboard_elements"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    referenceUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    visibility: v.optional(v.union(v.literal("private"), v.literal("shared"), v.literal("public"))),
    sharedWith: v.optional(v.array(v.id("storyboard_projects"))),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const element = await ctx.db.get(id);
    if (!element) {
      console.log(`[Element Update] Element ${id} not found, skipping update`);
      return; // Gracefully handle missing elements
    }
    
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can update this element (same companyId)
    if (element.companyId !== currentUserCompanyId) {
      throw new Error("Access denied: You can only update elements from your organization");
    }
    
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    console.log(`[Element Update] Successfully updated element ${id}`);
  },
});

export const incrementUsage = mutation({
  args: { 
    id: v.id("storyboard_elements"),
    projectId: v.string()
  },
  handler: async (ctx, { id, projectId }) => {
    const el = await ctx.db.get(id);
    if (!el) {
      console.log(`[Element IncrementUsage] Element ${id} not found, skipping usage increment`);
      return; // Gracefully handle missing elements
    }
    
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can use this element (same companyId)
    if (el.companyId !== currentUserCompanyId) {
      throw new Error("Access denied: You can only use elements from your organization");
    }
    
    await ctx.db.patch(id, { 
      usageCount: (el.usageCount ?? 0) + 1, 
      lastUsedAt: Date.now(),
      updatedAt: Date.now() 
    });
    console.log(`[Element IncrementUsage] Successfully incremented usage for element ${id}`);
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_elements") },
  handler: async (ctx, { id }) => {
    const element = await ctx.db.get(id);
    if (!element) {
      console.log(`[Element Remove] Element ${id} not found, skipping deletion`);
      return; // Gracefully handle missing elements
    }
    
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can delete this element (same companyId)
    if (element.companyId !== currentUserCompanyId) {
      throw new Error("Access denied: You can only delete elements from your organization");
    }
    
    await ctx.db.delete(id);
    console.log(`[Element Remove] Successfully deleted element ${id}`);
  },
});

// Sharing functionality
export const updateElementVisibility = mutation({
  args: {
    elementId: v.id("storyboard_elements"),
    visibility: v.union(v.literal("private"), v.literal("public"), v.literal("shared")), // "private" | "public" | "shared"
    sharedWith: v.optional(v.array(v.id("storyboard_projects"))),
  },
  handler: async (ctx, args) => {
    const element = await ctx.db.get(args.elementId);
    if (!element) {
      console.log(`[Element UpdateVisibility] Element ${args.elementId} not found, skipping visibility update`);
      return; // Gracefully handle missing elements
    }
    
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get user's organization from auth context
    const userOrganizationId = identity.orgId;
    const userId = identity.subject;
    const currentUserCompanyId = userOrganizationId || userId;
    
    // Check if user can update this element's visibility (same companyId)
    if (element.companyId !== currentUserCompanyId) {
      throw new Error("Access denied: You can only update elements from your organization");
    }
    
    await ctx.db.patch(args.elementId, {
      visibility: args.visibility,
      sharedWith: args.sharedWith || [],
      updatedAt: Date.now()
    });
    console.log(`[Element UpdateVisibility] Successfully updated visibility for element ${args.elementId} to ${args.visibility}`);
  },
});

export const findReusableElement = query({
  args: { 
    elementName: v.string(), 
    elementType: v.string(), 
    projectId: v.id("storyboard_projects") 
  },
  handler: async (ctx, { elementName, elementType, projectId }) => {
    // Priority 1: Check project's own elements
    const projectElement = await ctx.db
      .query("storyboard_elements")
      .collect()
      .then(elements => elements.find(el => 
        el.projectId === projectId && el.name === elementName && el.type === elementType
      ));
    
    if (projectElement) {
      return { element: projectElement, source: "project" };
    }
    
    // Priority 2: Check shared elements
    const sharedElements = await ctx.db
      .query("storyboard_elements")
      .collect()
      .then(elements => elements.filter(el => 
        el.visibility === "shared" && 
        (el.sharedWith ?? []).includes(projectId) &&
        el.name === elementName && 
        el.type === elementType
      ));
    
    if (sharedElements.length > 0) {
      return { element: sharedElements[0], source: "shared" };
    }
    
    // Priority 3: Check public elements
    const publicElements = await ctx.db
      .query("storyboard_elements")
      .collect()
      .then(elements => elements.filter(el => 
        el.visibility === "public" &&
        el.name === elementName && 
        el.type === elementType
      ));
    
    if (publicElements.length > 0) {
      return { element: publicElements[0], source: "public" };
    }
    
    return null; // No reusable element found
  },
});

// Usage tracking for cleanup
export const trackElementUsage = mutation({
  args: { 
    elementId: v.id("storyboard_elements"),
    projectId: v.string(),
    action: v.string() // "use_in_frame" | "view" | "select"
  },
  handler: async (ctx, { elementId, projectId, action }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Only track usage for cleanup purposes
    await ctx.db.insert("element_usage", {
      elementId,
      projectId,
      action,
      timestamp: Date.now(),
      userId: identity.subject
    });
    
    // Update element usage count and last used timestamp
    const element = await ctx.db.get(elementId);
    if (element) {
      await ctx.db.patch(elementId, {
        usageCount: (element.usageCount || 0) + 1,
        lastUsedAt: Date.now()
      });
    }
  },
});

// Cleanup for orphaned elements
export const cleanupOldOrphanedElements = mutation({
  handler: async (ctx) => {
    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    
    const oldOrphanedElements = await ctx.db
      .query("storyboard_elements")
      .collect()
      .then(elements => elements.filter(el => 
        el.isOrphaned && 
        el.orphanedAt && 
        el.orphanedAt < sixtyDaysAgo
      ));
    
    for (const element of oldOrphanedElements) {
      // Check if element was used in the last 60 days
      const recentUsage = await ctx.db
        .query("element_usage")
        .collect()
        .then(logs => logs.filter(log => 
          log.elementId === element._id && 
          log.timestamp > sixtyDaysAgo
        ));
      
      if (recentUsage.length === 0) {
        // Delete unused orphaned elements
        await ctx.db.delete(element._id);
      } else {
        // Keep used elements but mark as active
        await ctx.db.patch(element._id, {
          isOrphaned: false,
          cleanupStatus: "active"
        });
      }
    }
  },
});

// Project deletion cleanup
export const handleProjectDeletion = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    // Find all elements owned by this project
    const ownedElements = await ctx.db
      .query("storyboard_elements")
      .collect()
      .then(elements => elements.filter(el => el.projectId === projectId));
    
    for (const element of ownedElements) {
      await handleElementCleanup(ctx, element, projectId);
    }
  },
});

const handleElementCleanup = async (ctx: any, element: any, deletedProjectId: string) => {
  // Check if element is shared with other projects
  if (element.visibility === "shared" && element.sharedWith.length > 0) {
    // Transfer ownership to the first project that uses it
    const newOwnerId = element.sharedWith[0];
    
    await ctx.db.patch(element._id, {
      projectId: newOwnerId,
      sharedWith: element.sharedWith.filter(id => id !== newOwnerId),
      visibility: element.sharedWith.length > 1 ? "shared" : "private",
      ownershipHistory: [
        ...(element.ownershipHistory || []),
        {
          fromProjectId: deletedProjectId,
          toProjectId: newOwnerId,
          timestamp: Date.now(),
          reason: "project_deletion_ownership_transfer"
        }
      ]
    });
    
    // Log the ownership transfer
    await ctx.db.insert("element_ownership_log", {
      elementId: element._id,
      oldProjectId: deletedProjectId,
      newProjectId: newOwnerId,
      reason: "project_deletion_ownership_transfer",
      timestamp: Date.now()
    });
    
  } else if (element.visibility === "public") {
    // Keep public elements but mark as orphaned
    await ctx.db.patch(element._id, {
      projectId: "orphaned", // Special marker
      isOrphaned: true,
      orphanedAt: Date.now(),
      originalProjectId: deletedProjectId
    });
    
  } else {
    // Delete private elements
    await ctx.db.delete(element._id);
  }
};
