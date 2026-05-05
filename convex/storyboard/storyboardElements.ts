import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { syncFileAggregates } from "./aggregates";

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
    identity: v.optional(v.any()),
    referencePhotos: v.optional(v.object({
      face: v.optional(v.string()),
      outfit: v.optional(v.string()),
      fullBody: v.optional(v.string()),
      head: v.optional(v.string()),
      body: v.optional(v.string()),
    })),
    preferredTemplate: v.optional(v.string()),
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
      identity: args.identity,
      referencePhotos: args.referencePhotos,
      preferredTemplate: args.preferredTemplate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { id: v.id("storyboard_elements") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("storyboard_elements")) },
  handler: async (ctx, { ids }) => {
    const results = await Promise.all(ids.map(id => ctx.db.get(id)));
    return results.filter(Boolean);
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("storyboard_projects"),
    type: v.optional(v.string()),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, type, companyId }) => {
    // Get user from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }

    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const candidateCompanyIds = Array.from(new Set([
      companyId,
      project.companyId,
      identity.orgId,
      identity.subject,
    ].filter((value): value is string => Boolean(value))));


    const allProjectElements = await ctx.db
      .query("storyboard_elements")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .collect();

    // Filter: current project elements only
    const results = allProjectElements.filter((element) => {
      if (type && element.type !== type) return false;
      return true;
    });

    // Also include public/shared elements from OTHER projects within same company
    let externalElements: typeof results = [];
    if (candidateCompanyIds.length > 0) {
      const allCompanyElements = await ctx.db
        .query("storyboard_elements")
        .collect();

      externalElements = allCompanyElements.filter((element) => {
        // Skip elements already in current project
        if (element.projectId === projectId) return false;
        // Filter by type if specified
        if (type && element.type !== type) return false;
        // Must belong to same company
        if (!candidateCompanyIds.includes(element.companyId || "")) return false;
        // Include public elements
        if (element.visibility === "public") return true;
        // Include shared elements that include this project
        if (element.visibility === "shared" && element.sharedWith?.includes(projectId)) return true;
        return false;
      });
    }

    const combined = [...results, ...externalElements];

    return combined;
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
    identity: v.optional(v.any()),
    referencePhotos: v.optional(v.object({
      face: v.optional(v.string()),
      outfit: v.optional(v.string()),
      fullBody: v.optional(v.string()),
      head: v.optional(v.string()),
      body: v.optional(v.string()),
    })),
    preferredTemplate: v.optional(v.string()),
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

// Called from kie-callback when an element image generation completes.
// Appends the image URL to referenceUrls, adds variant metadata, and sets primary if first.
export const appendReferenceImage = mutation({
  args: {
    id: v.id("storyboard_elements"),
    imageUrl: v.string(),
    variantLabel: v.optional(v.string()),
    variantModel: v.optional(v.string()),
    setPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, imageUrl, variantLabel, variantModel, setPrimary }) => {
    const el = await ctx.db.get(id);
    if (!el) {
      console.log(`[appendReferenceImage] Element ${id} not found, skipping`);
      return;
    }
    const refs = el.referenceUrls || [];
    const variants = el.variants || [];
    const isFirst = refs.length === 0;

    let newIndex = refs.length; // index of the newly added image
    if (!refs.includes(imageUrl)) {
      refs.push(imageUrl);
      variants.push({
        label: variantLabel || `Variant ${refs.length}`,
        model: variantModel || "gpt-image-2",
        createdAt: Date.now(),
      });
    } else {
      newIndex = refs.indexOf(imageUrl);
    }

    const patch: Record<string, any> = {
      referenceUrls: refs,
      variants,
      updatedAt: Date.now(),
    };

    // A "custom crop" thumbnail is one whose URL is NOT in referenceUrls — preserve it.
    const hasCustomCrop = !!(el.thumbnailUrl && !(el.referenceUrls || []).includes(el.thumbnailUrl));

    if (isFirst || !el.thumbnailUrl || setPrimary) {
      patch.primaryIndex = newIndex;
      // Only overwrite thumbnailUrl if it isn't a custom-cropped image the user made
      if (!hasCustomCrop) {
        patch.thumbnailUrl = imageUrl;
      }
    }
    await ctx.db.patch(id, patch);
    console.log(`[appendReferenceImage] Updated element ${id} — refs: ${refs.length}, primary: ${patch.primaryIndex ?? el.primaryIndex ?? 0}${setPrimary ? " (forced primary)" : ""}`);
  },
});

// Set which variant is the primary identity sheet
export const setPrimaryVariant = mutation({
  args: {
    id: v.id("storyboard_elements"),
    index: v.number(),
  },
  handler: async (ctx, { id, index }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");

    const el = await ctx.db.get(id);
    if (!el) throw new Error("Element not found");

    const refs = el.referenceUrls || [];
    if (index < 0 || index >= refs.length) throw new Error("Invalid variant index");

    // Preserve custom-cropped thumbnail (URL not in referenceUrls) — only sync thumbnailUrl to
    // the selected variant when no custom crop exists.
    const hasCustomCrop = !!(el.thumbnailUrl && !refs.includes(el.thumbnailUrl));
    await ctx.db.patch(id, {
      primaryIndex: index,
      ...(!hasCustomCrop && { thumbnailUrl: refs[index] }),
      updatedAt: Date.now(),
    });
    console.log(`[setPrimaryVariant] Element ${id} primary set to index ${index}${hasCustomCrop ? " (custom crop thumbnail preserved)" : ""}`);
  },
});

// Update variant label
export const updateVariantLabel = mutation({
  args: {
    id: v.id("storyboard_elements"),
    index: v.number(),
    label: v.string(),
  },
  handler: async (ctx, { id, index, label }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");

    const el = await ctx.db.get(id);
    if (!el) throw new Error("Element not found");

    const variants = el.variants || [];
    if (index < 0 || index >= variants.length) throw new Error("Invalid variant index");

    variants[index] = { ...variants[index], label };
    await ctx.db.patch(id, { variants, updatedAt: Date.now() });
  },
});

// Remove a variant by index (deletes from referenceUrls + variants arrays, adjusts primaryIndex)
export const removeVariant = mutation({
  args: {
    id: v.id("storyboard_elements"),
    index: v.number(),
  },
  handler: async (ctx, { id, index }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");

    const el = await ctx.db.get(id);
    if (!el) throw new Error("Element not found");

    const refs = [...(el.referenceUrls || [])];
    const variants = [...(el.variants || [])];
    if (index < 0 || index >= refs.length) throw new Error("Invalid variant index");

    const removedUrl = refs[index];
    refs.splice(index, 1);
    if (index < variants.length) variants.splice(index, 1);

    // Adjust primaryIndex
    let primaryIndex = el.primaryIndex ?? 0;
    if (refs.length === 0) {
      primaryIndex = 0;
    } else if (index < primaryIndex) {
      primaryIndex = primaryIndex - 1;
    } else if (index === primaryIndex) {
      primaryIndex = 0; // reset to first
    }

    // Preserve custom crop thumbnail — only sync thumbnailUrl to a variant if
    // it isn't already a standalone crop (URL not in the original referenceUrls).
    const hasCustomCrop = !!(el.thumbnailUrl && !(el.referenceUrls || []).includes(el.thumbnailUrl));
    const newThumbnailUrl = hasCustomCrop
      ? el.thumbnailUrl                              // keep custom crop
      : (refs.length > 0 ? refs[primaryIndex] : ""); // sync to new primary

    await ctx.db.patch(id, {
      referenceUrls: refs,
      variants,
      primaryIndex,
      thumbnailUrl: newThumbnailUrl,
      updatedAt: Date.now(),
    });

    console.log(`[removeVariant] Element ${id}: removed index ${index}, refs: ${refs.length}, primary: ${primaryIndex}`);
    return { removedUrl };
  },
});

export const remove = mutation({
  args: { id: v.id("storyboard_elements") },
  handler: async (ctx, { id }) => {
    const element = await ctx.db.get(id);
    if (!element) {
      console.log(`[Element Remove] Element ${id} not found, skipping deletion`);
      return { r2Keys: [] };
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

    // Collect all R2 URLs from the element for client-side R2 cleanup
    const r2Keys: string[] = [];

    // Collect r2Keys from storyboard_files linked to this element (by categoryId)
    const linkedFiles = await ctx.db
      .query("storyboard_files")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", id))
      .collect();
    for (const file of linkedFiles) {
      if (file.r2Key) r2Keys.push(file.r2Key);
      // Soft-delete: same pattern as storyboardFiles.remove — keep record for credit audit trail
      const before = { ...file };
      await ctx.db.patch(file._id, {
        r2Key: "",
        sourceUrl: "",
        status: "deleted",
        deletedAt: Date.now(),
        size: 0,
        isShared: false,
        tags: [],
        isFavorite: false,
      });
      const after = await ctx.db.get(file._id);
      await syncFileAggregates(ctx, before, after);
    }

    // Also collect URLs stored directly on the element (thumbnailUrl, referenceUrls)
    // so the client can clean up R2 files that may not be linked via categoryId
    const urlsToClean: string[] = [];
    if (element.thumbnailUrl) urlsToClean.push(element.thumbnailUrl);
    if (element.referenceUrls) urlsToClean.push(...element.referenceUrls);

    await ctx.db.delete(id);
    console.log(`[Element Remove] Deleted element ${id} + ${linkedFiles.length} linked files`);
    return { r2Keys, urlsToClean };
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
