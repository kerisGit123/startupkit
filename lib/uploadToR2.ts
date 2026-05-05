/**
 * Global Upload + Delete Utility for R2 Storage
 *
 * Core file management functions for the Storyboard Studio:
 *   - uploadToR2          → upload file to R2 + log metadata in storyboard_files
 *   - deleteFromR2        → delete file from R2 + remove metadata from storyboard_files
 *   - uploadMultipleToR2  → parallel upload of multiple files
 *   - batchDeleteFromR2   → sequential batch delete with progress
 *   - uploadToR2WithRetry → upload with exponential-backoff retry
 *
 * Architecture: Frontend → /api/storyboard/upload (POST) or
 *                          /api/storyboard/delete-file (POST) → R2 + Convex
 *
 * @module lib/uploadToR2
 */

export interface UploadOptions {
  file?: File;
  category?: 'temps' | 'uploads' | 'generated' | 'elements' | 'storyboard' | 'videos';
  projectId?: string;
  tags?: string[];
  userId: string;
  companyId: string;
  sourceUrl?: string;
  sourceFilename?: string;
  sourceMimeType?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  noLog?: boolean;
}

export interface UploadResult {
  r2Key: string;
  publicUrl: string;
  filename: string;
  fileType: 'image' | 'video' | 'audio' | 'music' | 'file';
  mimeType: string;
  size: number;
  category: string;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file before upload
 * 
 * @param file - The file to validate
 * @param options - Validation options (maxSize, allowedTypes)
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```typescript
 * const validation = validateFile(file, {
 *   maxSize: 50 * 1024 * 1024, // 50MB
 *   allowedTypes: ['image/jpeg', 'image/png', 'video/mp4']
 * });
 * 
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 * ```
 */
export function validateFile(
  file: File,
  options?: FileValidationOptions
): FileValidationResult {
  const { maxSize = 50 * 1024 * 1024, allowedTypes } = options || {};

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
    };
  }

  // Check file type — also check extension as fallback for misidentified MIME types
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    const ext = file.name?.toLowerCase().split('.').pop() || '';
    const knownExtensions: Record<string, string> = {
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
      'aac': 'audio/aac', 'm4a': 'audio/mp4', 'flac': 'audio/flac',
      'mpeg': 'audio/mpeg', 'mpg': 'audio/mpeg', 'wma': 'audio/x-ms-wma',
      'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'webp': 'image/webp', 'gif': 'image/gif',
    };
    const mappedType = knownExtensions[ext];
    if (!mappedType || !allowedTypes.includes(mappedType)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Determine file type from MIME type
 * 
 * @param mimeType - The MIME type of the file
 * @returns File type category
 */
function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

/**
 * Upload a file to R2 storage
 * 
 * This function handles the complete upload flow:
 * 1. Validates the file (optional)
 * 2. Uploads to R2 via API route
 * 3. Returns metadata for Convex logging
 * 
 * @param options - Upload options including file, category, user info, and callbacks
 * @returns Upload result with R2 key and metadata
 * @throws Error if upload fails
 * 
 * @example
 * ```typescript
 * const result = await uploadToR2({
 *   file: selectedFile,
 *   category: 'uploads',
 *   userId: user.id,
 *   companyId: company.id,
 *   onProgress: (progress) => console.log(`${progress}%`),
 *   onSuccess: (result) => console.log('Upload complete:', result),
 *   onError: (error) => console.error('Upload failed:', error),
 * });
 * ```
 */
export async function uploadToR2(options: UploadOptions): Promise<UploadResult> {
  const {
    file,
    category = 'uploads',
    projectId,
    tags = [],
    userId,
    companyId,
    sourceUrl,
    sourceFilename,
    sourceMimeType,
    onProgress,
    onSuccess,
    onError,
    noLog,
  } = options;

  try {
    if (!file && !sourceUrl) {
      throw new Error('Either file or sourceUrl is required for upload');
    }

    if (file) {
      const validation = validateFile(file, {
        maxSize: 100 * 1024 * 1024,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/webm',
          'video/mpeg',       // .mpeg files — browser may report as video/mpeg even for audio
          'video/quicktime',  // .mov files
          'audio/mpeg',       // .mp3
          'audio/wav',        // .wav
          'audio/x-wav',      // .wav (alternative MIME)
          'audio/aac',        // .aac
          'audio/mp4',        // .m4a
          'audio/ogg',        // .ogg
          'audio/flac',       // .flac
          'audio/x-m4a',      // .m4a (alternative MIME)
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // For large files (>4MB), use presigned URL to bypass Turbopack FormData limit
    const usePresignedUrl = file && file.size > 4 * 1024 * 1024;

    let result: any;

    if (usePresignedUrl && file) {
      // Large files: send raw bytes via binary upload route (bypasses FormData parsing)
      const response = await fetch('/api/storyboard/upload-binary', {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-filename': encodeURIComponent(file.name),
          'x-category': category || 'uploads',
          'x-company-id': companyId || userId || '',
          ...(projectId ? { 'x-project-id': projectId } : {}),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      result = await response.json();
    } else {
      // Small files: use FormData upload (original approach)
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (category) formData.append('category', category);
      if (projectId) formData.append('projectId', projectId);
      if (companyId) formData.append('companyId', companyId);
      if (userId) formData.append('userId', userId);
      if (tags && tags.length > 0) formData.append('tags', JSON.stringify(tags));
      if (sourceUrl) formData.append('sourceUrl', sourceUrl);
      if (sourceFilename) formData.append('sourceFilename', sourceFilename);
      if (sourceMimeType) formData.append('sourceMimeType', sourceMimeType);
      if (noLog) formData.append('noLog', '1');

      const response = await fetch('/api/storyboard/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      result = await response.json();
    }

    // Determine file type
    const detectedMimeType = file?.type || sourceMimeType || 'application/octet-stream';
    const fileType = getFileType(detectedMimeType);

    // Prepare metadata
    const metadata: UploadResult = {
      r2Key: result.r2Key,
      publicUrl: result.publicUrl || `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${result.r2Key}`,
      filename: result.fileName || file?.name || sourceFilename || 'upload.bin',
      fileType,
      mimeType: detectedMimeType,
      size: result.fileSize || file?.size || 0,
      category,
    };

    // Call success callback if provided
    onSuccess?.(metadata);

    return metadata;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Upload failed');
    onError?.(err);
    throw err;
  }
}

/**
 * Upload multiple files in parallel
 * 
 * @param files - Array of files to upload
 * @param options - Upload options (same as uploadToR2 but without file parameter)
 * @returns Array of upload results
 * @throws Error if any upload fails
 * 
 * @example
 * ```typescript
 * const results = await uploadMultipleToR2(
 *   [file1, file2, file3],
 *   {
 *     category: 'uploads',
 *     userId: user.id,
 *     companyId: company.id,
 *   }
 * );
 * ```
 */
export async function uploadMultipleToR2(
  files: File[],
  options: Omit<UploadOptions, 'file'>
): Promise<UploadResult[]> {
  const uploads = files.map((file) =>
    uploadToR2({
      ...options,
      file,
    })
  );

  return Promise.all(uploads);
}

/**
 * Upload with automatic retry on failure
 * 
 * Uses exponential backoff strategy:
 * - Attempt 1: Immediate
 * - Attempt 2: Wait 2 seconds
 * - Attempt 3: Wait 4 seconds
 * - Attempt 4: Wait 8 seconds
 * 
 * @param options - Upload options
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Upload result
 * @throws Error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await uploadToR2WithRetry(
 *   {
 *     file: selectedFile,
 *     category: 'uploads',
 *     userId: user.id,
 *     companyId: company.id,
 *   },
 *   3 // Max 3 retries
 * );
 * ```
 */
export async function uploadToR2WithRetry(
  options: UploadOptions,
  maxRetries = 3
): Promise<UploadResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToR2(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Upload failed after all retries');
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export interface DeleteOptions {
  /** R2 storage key from storyboard_files.r2Key */
  r2Key: string;
  /** Convex document _id from storyboard_files */
  fileId: string;
  /** Called on successful deletion */
  onSuccess?: () => void;
  /** Called if deletion fails */
  onError?: (error: Error) => void;
  /** If true, don't throw error when metadata deletion fails (just log and continue) */
  graceful?: boolean;
}

export interface DeleteResult {
  success: boolean;
  r2Key: string;
  fileId: string;
}

/**
 * Delete a file from R2 storage AND remove its metadata from storyboard_files.
 *
 * Flow:
 *  1. DELETE object from R2 via  POST /api/storyboard/delete-file
 *  2. Remove Convex document via POST /api/storyboard/delete-convex
 *
 * If R2 deletion succeeds but Convex removal fails, the error is surfaced so
 * callers can retry / show a message. The metadata row will remain until the
 * next cleanup run.
 *
 * @example
 * ```typescript
 * await deleteFromR2({
 *   r2Key: file.r2Key,
 *   fileId: file._id,
 * });
 * ```
 */
export async function deleteFromR2(options: DeleteOptions): Promise<DeleteResult> {
  const { r2Key, fileId, onSuccess, onError } = options;

  if (!r2Key || !fileId) {
    const err = new Error('deleteFromR2: r2Key and fileId are required');
    onError?.(err);
    throw err;
  }

  try {
    // ── Step 1: Delete the object from R2 ────────────────────────────────────
    const r2Response = await fetch('/api/storyboard/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ r2Key }),
    });

    if (!r2Response.ok) {
      const body = await r2Response.json().catch(() => ({}));
      throw new Error(`R2 deletion failed: ${body.error ?? r2Response.statusText}`);
    }

    // ── Step 2: Remove metadata from storyboard_files (via API route) ────────
    const convexResponse = await fetch('/api/storyboard/delete-convex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });

    if (!convexResponse.ok) {
      let body: any = {};
      try {
        const responseText = await convexResponse.text();
        body = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('[deleteFromR2] Failed to parse JSON response:', jsonError);
        const textBody = await convexResponse.text().catch(() => '');
        console.error('[deleteFromR2] Raw response text (second attempt):', textBody);
        body = { error: textBody || 'Unknown error' };
      }
      
      // R2 already deleted — log the orphan but decide whether to throw based on options
      console.error('[deleteFromR2] R2 deleted but Convex removal failed — orphaned metadata:', { 
        r2Key, 
        fileId, 
        body,
        status: convexResponse.status,
        statusText: convexResponse.statusText
      });
      
      // Check if it's a "not found" / "nonexistent" case, which is actually success for us
      const errorStr = JSON.stringify(body).toLowerCase();
      if ((body.warning && body.warning.includes('not found')) || errorStr.includes('nonexistent') || errorStr.includes('not found')) {
        // Don't throw error - this is actually a success case
      } else {
        // Check if graceful mode is enabled (don't throw error, just log and continue)
        if (options?.graceful !== true) {
          throw new Error(`Metadata removal failed: ${body.error ?? convexResponse.statusText}`);
        }
      }
    }

    const result: DeleteResult = { success: true, r2Key, fileId };
    onSuccess?.();
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Delete failed');
    onError?.(err);
    throw err;
  }
}

/**
 * Batch-delete multiple files sequentially, reporting progress.
 *
 * @param files  - Array of { r2Key, fileId } objects
 * @param onProgress - Called after each deletion: (completed, total)
 *
 * @example
 * ```typescript
 * const { successful, failed } = await batchDeleteFromR2(
 *   selectedFiles.map(f => ({ r2Key: f.r2Key, fileId: f._id })),
 *   (done, total) => setProgress(Math.round((done / total) * 100))
 * );
 * ```
 */
export async function batchDeleteFromR2(
  files: Array<{ r2Key: string; fileId: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<{ successful: string[]; failed: Array<{ fileId: string; error: string }> }> {
  const successful: string[] = [];
  const failed: Array<{ fileId: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      await deleteFromR2({ r2Key: file.r2Key, fileId: file.fileId });
      successful.push(file.fileId);
    } catch (error) {
      failed.push({
        fileId: file.fileId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    onProgress?.(i + 1, files.length);
  }

  return { successful, failed };
}
