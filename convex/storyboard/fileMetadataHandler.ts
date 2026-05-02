import { mutation, internalMutation, internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * 🎯 CENTRALIZED FILE METADATA HANDLER
 * 
 * This function handles ALL file metadata storage for:
 * - File uploads (temps, uploads, generated)
 * - Element references (character, object, logo, font, style)
 * - Storyboard frame images
 * - Video AI results
 * 
 * Every time a file is saved/created, call this function to store metadata in storyboard_files
 */
export const storeFileMetadata = mutation({
  args: {
    // Required fields
    r2Key: v.string(),           // R2 storage key (e.g., "org_123/uploads/file.jpg")
    filename: v.string(),        // Original filename
    fileType: v.string(),        // "image" | "video" | "audio" | "document"
    mimeType: v.string(),        // MIME type (e.g., "image/jpeg")
    size: v.number(),            // File size in bytes
    
    // Context fields
    category: v.string(),        // "temps" | "uploads" | "generated" | "elements" | "storyboard" | "videos"
    companyId: v.string(),       // Current user's companyId (REQUIRED)
    orgId: v.optional(v.string()), // Legacy org support
    userId: v.optional(v.string()), // User ID if user-specific
    projectId: v.optional(v.id("storyboard_projects")), // Project association
    
    // Optional metadata
    tags: v.optional(v.array(v.string())), // Tag IDs (strings only)
    uploadedBy: v.string(),      // User ID who uploaded
    status: v.string(),          // "uploading" | "ready" | "error"
    
    // Element-specific fields (for LTX-style elements)
    elementType: v.optional(v.string()), // "character" | "object" | "logo" | "font" | "style"
    elementData: v.optional(v.any()),   // Element-specific JSON data
    
    // Storyboard-specific fields
    frameNumber: v.optional(v.number()), // Frame number for storyboard images
    sceneId: v.optional(v.id("storyboard_items")), // Scene association
    
    // Usage tracking
    usageType: v.optional(v.string()), // "upload" | "element" | "storyboard" | "generated" | "video"
  },
  handler: async (ctx, args) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Extract and validate required fields
    const {
      r2Key,
      filename,
      fileType,
      mimeType,
      size,
      category,
      companyId,
      uploadedBy,
      status,
      ...optionalFields
    } = args;
    
    // Validate category
    const validCategories = ["temps", "uploads", "generated", "elements", "storyboard", "videos"];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}. Must be one of: ${validCategories.join(", ")}`);
    }
    
    // Validate file type
    const validFileTypes = ["image", "video", "audio", "document"];
    if (!validFileTypes.includes(fileType)) {
      throw new Error(`Invalid file type: ${fileType}. Must be one of: ${validFileTypes.join(", ")}`);
    }
    
    // Prepare metadata object
    const metadata = {
      r2Key,
      filename,
      fileType,
      mimeType,
      size,
      category,
      companyId, // CRITICAL: Always use current user's companyId
      uploadedBy,
      status,
      uploadedAt: Date.now(),
      createdAt: Date.now(),
      isFavorite: false, // Default to not favorited
      
      // Include optional fields if provided
      ...optionalFields,
      
      // Ensure tags is always an array
      tags: optionalFields.tags || [],
    };
    
    // Store in storyboard_files table
    const fileId = await ctx.db.insert("storyboard_files", metadata);
    
    console.log(`📁 File metadata stored: ${filename} (${category}) -> ${fileId}`);
    
    return {
      success: true,
      fileId,
      metadata: {
        id: fileId,
        filename,
        category,
        r2Key,
        size,
        uploadedAt: metadata.uploadedAt,
      },
    };
  },
});

/**
 * 🔄 UPDATE FILE METADATA
 * 
 * For updating existing file metadata (e.g., moving between categories, updating tags)
 */
export const updateFileMetadata = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    
    // Updatable fields
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("storyboard_projects")),
    elementType: v.optional(v.string()),
    elementData: v.optional(v.any()),
    frameNumber: v.optional(v.number()),
    sceneId: v.optional(v.id("storyboard_items")),
    usageType: v.optional(v.string()),
    status: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
  },
  handler: async (ctx, { fileId, ...updateFields }) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get existing file
    const existingFile = await ctx.db.get(fileId);
    if (!existingFile) {
      throw new Error("File not found");
    }
    
    // Prepare update data (only include provided fields)
    const updateData: any = {};
    
    if (updateFields.category !== undefined) {
      // Validate category if provided
      const validCategories = ["temps", "uploads", "generated", "elements", "storyboard", "videos"];
      if (!validCategories.includes(updateFields.category)) {
        throw new Error(`Invalid category: ${updateFields.category}`);
      }
      updateData.category = updateFields.category;
    }
    
    if (updateFields.tags !== undefined) {
      updateData.tags = updateFields.tags;
    }
    
    if (updateFields.projectId !== undefined) {
      updateData.projectId = updateFields.projectId;
    }
    
    if (updateFields.elementType !== undefined) {
      updateData.elementType = updateFields.elementType;
    }
    
    if (updateFields.elementData !== undefined) {
      updateData.elementData = updateFields.elementData;
    }
    
    if (updateFields.frameNumber !== undefined) {
      updateData.frameNumber = updateFields.frameNumber;
    }
    
    if (updateFields.sceneId !== undefined) {
      updateData.sceneId = updateFields.sceneId;
    }
    
    if (updateFields.usageType !== undefined) {
      updateData.usageType = updateFields.usageType;
    }
    
    if (updateFields.status !== undefined) {
      updateData.status = updateFields.status;
    }
    
    if (updateFields.isFavorite !== undefined) {
      updateData.isFavorite = updateFields.isFavorite;
    }
    
    // Apply updates
    await ctx.db.patch(fileId, updateData);
    
    console.log(`📝 File metadata updated: ${existingFile.filename} -> ${fileId}`);
    
    return {
      success: true,
      fileId,
      updatedFields: Object.keys(updateData),
    };
  },
});

/**
 * 🗑️ DELETE FILE METADATA
 * 
 * For removing file metadata from storyboard_files table
 * Note: This doesn't delete the actual file from R2, just the metadata
 */
export const deleteFileMetadata = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    deleteFromR2: v.optional(v.boolean()), // Optional: also delete from R2
  },
  handler: async (ctx, { fileId, deleteFromR2 = false }) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get existing file
    const existingFile = await ctx.db.get(fileId);
    if (!existingFile) {
      throw new Error("File not found");
    }
    
    // Delete from database
    await ctx.db.delete(fileId);
    
    console.log(`🗑️ File metadata deleted: ${existingFile.filename} (${existingFile.r2Key})`);
    
    // TODO: Implement R2 deletion if deleteFromR2 is true
    // This would require R2 admin credentials or a separate API route
    
    return {
      success: true,
      deletedFile: {
        filename: existingFile.filename,
        r2Key: existingFile.r2Key,
        category: existingFile.category,
      },
    };
  },
});

/**
 * 📊 LOG FILE USAGE
 * 
 * Track when files are used in different contexts (storyboard frames, elements, etc.)
 */
export const logFileUsage = mutation({
  args: {
    fileId: v.id("storyboard_files"),
    usageType: v.string(), // "storyboard-frame" | "element-reference" | "video-generation" | "download"
    context: v.optional(v.any()), // Additional context data
    projectId: v.optional(v.id("storyboard_projects")), // Project context if applicable
  },
  handler: async (ctx, { fileId, usageType, context, projectId }) => {
    // Verify user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
    
    // Get file to verify it exists
    const file = await ctx.db.get(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    
    // Log the usage (you could create a separate usage_log table for this)
    // For now, we'll just update a usage count if the file has that field
    // This is a placeholder implementation
    
    console.log(`📊 File usage logged: ${file.filename} (${usageType})`);
    
    if (projectId) {
      console.log(`   Project context: ${projectId}`);
    }
    
    if (context) {
      console.log(`   Context:`, context);
    }
    
    return { 
      success: true, 
      fileId, 
      usageType,
      loggedAt: Date.now(),
    };
  },
});


/**
 * CLEANUP EXPIRED TEMP FILES
 * Internal mutation called by daily cron (convex/crons.ts).
 * Deletes storyboard_files metadata rows where category='temps'
 * and uploadedAt is older than 30 days.
 *
 * To also purge actual R2 objects, set an Object Expiration lifecycle
 * rule on the temps/ prefix in the Cloudflare R2 dashboard.
 */
export const cleanupExpiredTemps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_DAYS_MS;

    const tempFiles = await ctx.db
      .query("storyboard_files")
      .filter((q) => q.eq(q.field("category"), "temps"))
      .collect();

    const expired = tempFiles.filter((f) => f.uploadedAt < cutoff);

    console.log(
      "cleanupExpiredTemps: " + expired.length + "/" + tempFiles.length +
      " expired (cutoff " + new Date(cutoff).toISOString() + ")"
    );

    for (const file of expired) {
      await ctx.db.delete(file._id);
      console.log("  deleted: " + file.filename + " uploaded=" + new Date(file.uploadedAt).toISOString());
    }

    return {
      found: tempFiles.length,
      deleted: expired.length,
      cutoffDate: new Date(cutoff).toISOString(),
    };
  },
});

/**
 * ORPHAN REPAIR — daily safety net (cron runs this via repairOrphanFiles action)
 *
 * Finds storyboard_files whose categoryId points to a deleted parent (item/element)
 * but status != "deleted" — meaning cleanup didn't run when the parent was deleted.
 *
 * defaultAI present → soft-delete: r2Key="", status="deleted", categoryId=null (kept for logs)
 * defaultAI absent  → hard-delete: record removed entirely
 *
 * Batches 50 per run to stay within action timeout. Runs daily at 04:00 UTC.
 */
export const repairOrphanFiles = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scanned: number; repaired: number; skipped: number }> => {
    const candidates: any[] = await ctx.runQuery(
      internal.storyboard.fileMetadataHandler.listOrphanCandidates,
      { limit: 50 }
    );

    let repaired = 0;
    let skipped = 0;
    const softDeleteIds: string[] = [];
    const hardDeleteIds: string[] = [];

    // Collect r2Keys to delete in a single batched HTTP call after the scan loop.
    // Convex actions cannot use the AWS SDK directly (no Node runtime in V8 isolates),
    // so we delegate R2 deletion to an internal HTTP endpoint that does have the SDK.
    const orphanR2Keys: string[] = [];

    for (const file of candidates) {
      const parentStillExists: boolean = await ctx.runQuery(
        internal.storyboard.fileMetadataHandler.parentExists,
        { categoryId: file.categoryId }
      );

      if (parentStillExists) { skipped++; continue; }

      if (file.r2Key) orphanR2Keys.push(file.r2Key);
      if (file.defaultAI) { softDeleteIds.push(file._id); }
      else { hardDeleteIds.push(file._id); }
      repaired++;
    }

    // Batch-delete the R2 bytes via a server-side endpoint that has the AWS SDK
    if (orphanR2Keys.length > 0) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/storyboard/repair-r2-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_REPAIR_SECRET || "",
        },
        body: JSON.stringify({ r2Keys: orphanR2Keys }),
      }).catch(err => console.warn("[orphanRepair] repair-r2-batch failed:", err));
    }

    if (softDeleteIds.length > 0) {
      await ctx.runMutation(internal.storyboard.fileMetadataHandler.markOrphansDeleted, { fileIds: softDeleteIds });
    }
    if (hardDeleteIds.length > 0) {
      await ctx.runMutation(internal.storyboard.fileMetadataHandler.hardDeleteOrphans, { fileIds: hardDeleteIds });
    }

    console.log(`[orphanRepair] scanned:${candidates.length} repaired:${repaired} skipped:${skipped}`);
    return { scanned: candidates.length, repaired, skipped };
  },
});

export const listOrphanCandidates = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("storyboard_files")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "deleted"),
          q.neq(q.field("categoryId"), null),
          q.neq(q.field("categoryId"), undefined)
        )
      )
      .take(limit);
  },
});

export const parentExists = internalQuery({
  args: { categoryId: v.string() },
  handler: async (ctx, { categoryId }) => {
    const doc = await ctx.db.get(categoryId as any);
    return doc !== null;
  },
});

export const markOrphansDeleted = internalMutation({
  args: { fileIds: v.array(v.string()) },
  handler: async (ctx, { fileIds }) => {
    for (const id of fileIds) {
      const file = await ctx.db.get(id as any);
      if (!file || (file as any).status === "deleted") continue;
      await ctx.db.patch(id as any, {
        r2Key: "", sourceUrl: "", status: "deleted",
        categoryId: null, deletedAt: Date.now(), size: 0,
      });
    }
  },
});

export const hardDeleteOrphans = internalMutation({
  args: { fileIds: v.array(v.string()) },
  handler: async (ctx, { fileIds }) => {
    for (const id of fileIds) {
      const file = await ctx.db.get(id as any);
      if (file) await ctx.db.delete(id as any);
    }
  },
});
