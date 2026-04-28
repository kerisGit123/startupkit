// ── Upload Validation ─────────────────────────────────────────────────
// Shared MIME type allowlist + size limits for all upload routes.

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: [
    "image/png", "image/jpeg", "image/jpg", "image/webp",
    "image/gif", "image/svg+xml", "image/avif", "image/tiff",
  ],
  video: [
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
    "video/x-matroska",
  ],
  audio: [
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
    "audio/m4a", "audio/x-m4a", "audio/aac", "audio/flac",
    "audio/webm", "audio/mp4",
  ],
  document: [
    "application/pdf",
  ],
};

// Flat set for fast lookup
const ALL_ALLOWED_MIMES = new Set(
  Object.values(ALLOWED_MIME_TYPES).flat()
);

// Extension → MIME fallback (when file.type is empty/generic)
const EXT_TO_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
  avif: "image/avif", tiff: "image/tiff",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  avi: "video/x-msvideo", mkv: "video/x-matroska",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  m4a: "audio/m4a", aac: "audio/aac", flac: "audio/flac",
  pdf: "application/pdf",
};

// Size limits per media category (bytes)
const SIZE_LIMITS: Record<string, number> = {
  image:    20 * 1024 * 1024,   // 20 MB
  video:    200 * 1024 * 1024,  // 200 MB
  audio:    50 * 1024 * 1024,   // 50 MB
  document: 10 * 1024 * 1024,   // 10 MB
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

function getMediaCategory(mime: string): string | null {
  for (const [category, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mime)) return category;
  }
  return null;
}

function resolveMime(declaredMime: string | undefined, filename: string | undefined): string | null {
  // Trust declared MIME if it's specific (not generic)
  if (declaredMime && declaredMime !== "application/octet-stream" && ALL_ALLOWED_MIMES.has(declaredMime)) {
    return declaredMime;
  }
  // Fallback to extension
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  }
  return declaredMime || null;
}

export type ValidationResult =
  | { valid: true; mime: string; category: string }
  | { valid: false; error: string };

/**
 * Validate a file upload: MIME type allowlist + size limit.
 *
 * @param mime - Declared MIME type (from file.type or Content-Type header)
 * @param filename - Original filename (used as fallback for MIME detection)
 * @param sizeBytes - File size in bytes
 */
export function validateUpload(
  mime: string | undefined,
  filename: string | undefined,
  sizeBytes: number
): ValidationResult {
  const resolvedMime = resolveMime(mime, filename);

  if (!resolvedMime || !ALL_ALLOWED_MIMES.has(resolvedMime)) {
    const displayType = resolvedMime || mime || "unknown";
    return {
      valid: false,
      error: `File type "${displayType}" is not allowed. Accepted: images, videos, audio, PDF.`,
    };
  }

  const category = getMediaCategory(resolvedMime)!;
  const limit = SIZE_LIMITS[category];

  if (sizeBytes > limit) {
    return {
      valid: false,
      error: `File too large (${formatSize(sizeBytes)}). Max for ${category}: ${formatSize(limit)}.`,
    };
  }

  return { valid: true, mime: resolvedMime, category };
}

/**
 * Validate MIME type only (for presigned URL routes where size isn't known yet).
 */
export function validateMimeType(
  mime: string | undefined,
  filename: string | undefined
): ValidationResult {
  const resolvedMime = resolveMime(mime, filename);

  if (!resolvedMime || !ALL_ALLOWED_MIMES.has(resolvedMime)) {
    const displayType = resolvedMime || mime || "unknown";
    return {
      valid: false,
      error: `File type "${displayType}" is not allowed. Accepted: images, videos, audio, PDF.`,
    };
  }

  const category = getMediaCategory(resolvedMime)!;
  return { valid: true, mime: resolvedMime, category };
}
