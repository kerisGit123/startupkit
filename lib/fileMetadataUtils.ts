/**
 * 🎯 CENTRALIZED FILE METADATA UTILITY
 * 
 * Helper functions to standardize file metadata storage across the application.
 * Use these functions whenever you need to store file metadata in storyboard_files.
 */

import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * 📁 STORE FILE METADATA
 * 
 * Call this function EVERY time a file is uploaded, created, or saved.
 * It handles all metadata storage for uploads, elements, storyboard frames, etc.
 */
export async function storeFileMetadata(params: {
  // Required fields
  r2Key: string;           // R2 storage key (e.g., "org_123/uploads/file.jpg")
  filename: string;        // Original filename
  fileType: "image" | "video" | "audio" | "document";
  mimeType: string;        // MIME type (e.g., "image/jpeg")
  size: number;            // File size in bytes
  category: "temps" | "uploads" | "generated" | "elements" | "storyboard" | "videos";
  companyId: string;       // Current user's companyId
  uploadedBy: string;      // User ID who uploaded
  status: "uploading" | "ready" | "error";
  
  // Optional context fields
  orgId?: string;
  userId?: string;
  projectId?: string;
  tags?: string[];
  elementType?: "character" | "object" | "logo" | "font" | "style";
  elementData?: any;
  frameNumber?: number;
  sceneId?: string;
  usageType?: string;
}) {
  try {
    const result = await convex.mutation(api.storyboard.fileMetadataHandler.storeFileMetadata, {
      ...params,
      // Ensure arrays are properly handled
      tags: params.tags || [],
      // Cast string IDs to Convex Id types
      projectId: params.projectId as Id<"storyboard_projects"> | undefined,
      sceneId: params.sceneId as Id<"storyboard_items"> | undefined,
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to store file metadata:`, error);
    throw error;
  }
}

/**
 * 🔄 UPDATE FILE METADATA
 * 
 * Update existing file metadata (e.g., move between categories, update tags)
 */
export async function updateFileMetadata(params: {
  fileId: string;
  category?: string;
  tags?: string[];
  projectId?: string;
  elementType?: string;
  elementData?: any;
  frameNumber?: number;
  sceneId?: string;
  usageType?: string;
  status?: string;
  isFavorite?: boolean;
}) {
  try {
    const result = await convex.mutation(api.storyboard.fileMetadataHandler.updateFileMetadata, {
      ...params,
      fileId: params.fileId as Id<"storyboard_files">,
      projectId: params.projectId as Id<"storyboard_projects"> | undefined,
      sceneId: params.sceneId as Id<"storyboard_items"> | undefined,
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to update file metadata:`, error);
    throw error;
  }
}

/**
 * 🗑️ DELETE FILE METADATA
 * 
 * Remove file metadata from storyboard_files table
 */
export async function deleteFileMetadata(params: {
  fileId: string;
  deleteFromR2?: boolean; // Optional: also delete from R2
}) {
  try {
    const result = await convex.mutation(api.storyboard.fileMetadataHandler.deleteFileMetadata, {
      ...params,
      fileId: params.fileId as Id<"storyboard_files">,
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to delete file metadata:`, error);
    throw error;
  }
}

/**
 * 📊 LOG FILE USAGE
 * 
 * Track when files are used in different contexts
 */
export async function logFileUsage(params: {
  fileId: string;
  usageType: "storyboard-frame" | "element-reference" | "video-generation" | "download";
  context?: any;
  projectId?: string;
}) {
  try {
    const result = await convex.mutation(api.storyboard.fileMetadataHandler.logFileUsage, {
      ...params,
      fileId: params.fileId as Id<"storyboard_files">,
      projectId: params.projectId as Id<"storyboard_projects"> | undefined,
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to log file usage:`, error);
    throw error;
  }
}

// 🎯 CONVENIENCE FUNCTIONS FOR COMMON USE CASES

/**
 * 📤 HANDLE FILE UPLOAD
 * 
 * Complete flow for file upload with metadata storage
 */
export async function handleFileUpload(params: {
  file: File;
  category: "temps" | "uploads" | "generated" | "elements" | "storyboard" | "videos";
  companyId: string;
  uploadedBy: string;
  projectId?: string;
  tags?: string[];
  elementType?: "character" | "object" | "logo" | "font" | "style";
  frameNumber?: number;
  sceneId?: string;
}) {
  try {
    // 1. Upload file to R2 (you'll need to implement this part)
    const uploadResult = await uploadToR2({
      file: params.file,
      category: params.category,
      companyId: params.companyId,
    });
    
    // 2. Store metadata in Convex
    const metadataResult = await storeFileMetadata({
      r2Key: uploadResult.r2Key,
      filename: params.file.name,
      fileType: getFileType(params.file.type),
      mimeType: params.file.type,
      size: params.file.size,
      category: params.category,
      companyId: params.companyId,
      uploadedBy: params.uploadedBy,
      status: "ready",
      projectId: params.projectId,
      tags: params.tags,
      elementType: params.elementType,
      frameNumber: params.frameNumber,
      sceneId: params.sceneId,
    });
    
    return {
      upload: uploadResult,
      metadata: metadataResult,
    };
  } catch (error) {
    console.error(`❌ File upload failed:`, error);
    throw error;
  }
}

/**
 * 🎨 HANDLE ELEMENT SAVE
 * 
 * For LTX-style elements (character, object, logo, font, style)
 */
export async function handleElementSave(params: {
  file: File;
  elementType: "character" | "object" | "logo" | "font" | "style";
  elementData: any;
  companyId: string;
  uploadedBy: string;
  projectId?: string;
  tags?: string[];
}) {
  return handleFileUpload({
    ...params,
    category: "elements",
    elementType: params.elementType,
  });
}

/**
 * 📖 HANDLE STORYBOARD FRAME
 * 
 * For storyboard frame images
 */
export async function handleStoryboardFrame(params: {
  file: File;
  frameNumber: number;
  sceneId?: string;
  companyId: string;
  uploadedBy: string;
  projectId: string;
  tags?: string[];
}) {
  return handleFileUpload({
    ...params,
    category: "storyboard",
    frameNumber: params.frameNumber,
    sceneId: params.sceneId,
  });
}

/**
 * 🤖 HANDLE AI GENERATED CONTENT
 * 
 * For AI-generated images, videos, etc.
 */
export async function handleAIGenerated(params: {
  file: File;
  generatedType: "image" | "video" | "audio";
  companyId: string;
  uploadedBy: string;
  projectId?: string;
  tags?: string[];
}) {
  const category = params.generatedType === "video" ? "videos" : "generated";
  
  return handleFileUpload({
    ...params,
    category,
  });
}

// 🔧 HELPER FUNCTIONS

/**
 * Get file type from MIME type
 */
function getFileType(mimeType: string): "image" | "video" | "audio" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

/**
 * Upload file to R2 (placeholder - implement your R2 upload logic)
 */
async function uploadToR2(params: {
  file: File;
  category: string;
  companyId: string;
}): Promise<{ r2Key: string; publicUrl: string }> {
  // This is a placeholder - implement your actual R2 upload logic
  // You might call your existing upload API route here
  
  const timestamp = Date.now();
  const ext = params.file.name.split('.').pop();
  const r2Key = `${params.companyId}/${params.category}/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;
  
  // TODO: Implement actual R2 upload
  // For now, return a mock result
  return {
    r2Key,
    publicUrl: `https://pub-xxxxxxxx.r2.dev/${r2Key}`,
  };
}
