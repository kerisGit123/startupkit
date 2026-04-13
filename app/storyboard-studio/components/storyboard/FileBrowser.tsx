"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { useState, useMemo, useRef } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Star,
  Download,
  Trash2,
  Search,
  Upload,
  Filter,
  ChevronDown,
  Grid3x3,
  Volume2,
  Plus,
} from "lucide-react";
import { uploadToR2, deleteFromR2, batchDeleteFromR2 } from "@/lib/uploadToR2";
import { useMutation } from "convex/react";
import { useCurrentCompanyId } from "@/lib/auth-utils";

// ─── Element Types ───────────────────────────────────────────────────────────────
const ELEMENT_TYPES = [
  { key: "character", label: "Characters", color: "text-purple-400" },
  { key: "prop", label: "Props", color: "text-blue-400" },
  { key: "environment", label: "Environment", color: "text-emerald-400" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface FileBrowserProps {
  projectId?: string;
  onClose: () => void;
  onSelectFile?: (url: string, type: string) => void;
  onSelectImage?: (imageUrl: string, filename: string, file: any) => void;
  imageSelectionMode?: boolean;
}

type FileType = "all" | "image" | "video" | "audio" | "file";
type CategoryFilter = "all" | "temps" | "uploads" | "generated" | "elements" | "storyboard" | "videos";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  all:        { label: "All Sources",    icon: "🗂️"  },
  temps:      { label: "Temporary",      icon: "⏰"   },
  uploads:    { label: "Uploads",        icon: "📤"   },
  generated:  { label: "AI Generated",   icon: "🤖"   },
  elements:   { label: "Elements",       icon: "🎨"   },
  storyboard: { label: "Storyboard",     icon: "📖"   },
  videos:     { label: "Videos",         icon: "🎬"   },
};

const CATEGORY_LABELS = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([k, v]) => [k, `${v.icon} ${v.label}`])
);

const TYPE_ICON: Record<string, any> = {
  image:  ImageIcon,
  video:  Video,
  audio:  Volume2,
  file:   FileText,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileUrl = (r2Key: string): string => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return `${base}/${r2Key}`;
};

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf"))      return "📄";
  if (mimeType.includes("text"))     return "📝";
  return "📎";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-(--border-primary) animate-pulse">
      <div className="bg-(--bg-tertiary)" style={{ height: "140px" }} />
      <div className="p-2 bg-(--bg-secondary)">
        <div className="h-3 bg-(--bg-tertiary) rounded w-3/4" />
      </div>
    </div>
  );
}

function EmptyState({ hasFilter, onUpload }: { hasFilter: boolean; onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🗂️</div>
      <p className="text-(--text-secondary) font-medium">
        {hasFilter ? "No files match your filters" : "No files yet"}
      </p>
      {!hasFilter && (
        <button
          onClick={onUpload}
          className="mt-4 px-5 py-2 bg-(--accent-blue) text-white rounded-xl text-sm font-medium hover:bg-(--accent-blue)/90 transition-all"
        >
          Upload your first file
        </button>
      )}
    </div>
  );
}

function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-(--color-error) font-medium mb-3">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-(--bg-tertiary) text-(--text-secondary) rounded-xl text-sm"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FileBrowser({
  projectId,
  onClose,
  onSelectFile,
  onSelectImage,
  imageSelectionMode = false,
}: FileBrowserProps) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedFilter, setSelectedFilter]   = useState<CategoryFilter>("all");
  const [selectedType, setSelectedType]       = useState<FileType>("all");
  const [selectedElementCategory, setSelectedElementCategory] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewSize, setViewSize]               = useState(140);
  const [uploading, setUploading]             = useState(false);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<any>(null);
  const [error, setError]                     = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auth / identity ───────────────────────────────────────────────────────
  const { user } = useUser();
  const projectCompanyId = useCurrentCompanyId(); // ✅ Use hook for active organization detection
  const companyId = projectCompanyId; // Use same pattern as ElementLibrary
  const userId = user?.id || "";

  console.log(`[FileBrowser] Using companyId: ${companyId} (from useCurrentCompanyId hook)`);

  // ── Data (paginated, server-side filtered) ─────────────────────────────
  const { results: files, status: paginationStatus, loadMore } = usePaginatedQuery(
    api.storyboard.storyboardFiles.listFiltered,
    {
      companyId: companyId || "",
      category: selectedFilter === "all" ? undefined : selectedFilter,
      fileType: selectedType === "all" ? undefined : selectedType,
      searchTerm: searchTerm || undefined,
    },
    { initialNumItems: 50 }
  );
  
  const toggleFavorite = useMutation(api.storyboard.storyboardFiles.toggleFavorite);
  const removeFile = useMutation(api.storyboard.storyboardFiles.remove);
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);

  // ── Filter (client-side — only element sub-category remains) ──
  const filteredFiles = useMemo(() => {
    if (!files) return [];

    return files.filter((file) => {
      // Generated and temps: always show (no project filter)
      if (file.category === 'generated' || file.category === 'temps') return true;

      // Project filtering for other categories
      const matchesProject = !projectId || file.projectId === projectId ||
        (!file.projectId && ['uploads', 'elements'].includes(file.category));

      // Element sub-category filtering (tag-based)
      let matchesElementCategory = true;
      if (selectedFilter === "elements" && selectedElementCategory !== "all") {
        matchesElementCategory = file.tags?.includes(selectedElementCategory) || false;
      }

      return matchesProject && matchesElementCategory;
    });
  }, [files, selectedFilter, selectedElementCategory, projectId]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filteredFiles> = {};
    for (const file of filteredFiles) {
      const cat = file.category || "uploads";
      if (!g[cat]) g[cat] = [];
      g[cat].push(file);
    }
    return g;
  }, [filteredFiles]);

  const categories = Object.keys(grouped).sort();
  const isLoading  = paginationStatus === "LoadingFirstPage";

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Upload files via uploadToR2 (handles R2 + storyboard_files metadata) */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files;
    if (!picked || picked.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadCategory = selectedFilter === "all" ? "uploads" : selectedFilter;
      
      for (const file of Array.from(picked)) {
        // Check file size — API route FormData parsing fails for very large files
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          toast.error(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 50MB.`);
          continue;
        }

        console.log("[FileBrowser] Starting upload:", {
          fileName: file.name,
          fileSize: file.size,
          category: uploadCategory,
          companyId,
          userId,
          projectId
        });

        const result = await uploadToR2({
          file,
          category: uploadCategory as any,
          userId,
          companyId,
          projectId,
        });
        
        console.log("[FileBrowser] Upload successful:", {
          r2Key: result.r2Key,
          publicUrl: result.publicUrl,
          category: result.category,
          filename: result.filename
        });
        
        // uploadToR2 already saves to database via API route
        // No need to call logUpload again - this was causing double saves
        console.log("[FileBrowser] File saved to database via uploadToR2");
      }
    } catch (err) {
      console.error("[FileBrowser] Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /** Delete a file from R2 + storyboard_files using deleteFromR2 */
  const handleDelete = (file: any) => {
    setPendingDeleteFile(file);
  };

  const confirmDelete = async () => {
    const file = pendingDeleteFile;
    if (!file) return;
    setPendingDeleteFile(null);

    console.log('[FileBrowser] Deleting file:', {
      filename: file.filename,
      fileId: file._id,
      r2Key: file.r2Key,
      category: file.category,
    });

    setDeletingId(file._id);
    try {
      if (!file.r2Key) {
        await removeFile({ id: file._id });
      } else {
        await deleteFromR2({
          r2Key: file.r2Key,
          fileId: file._id,
        });
      }
      toast.success(`"${file.filename}" deleted`);
    } catch (err) {
      console.error('[FileBrowser] Delete failed:', err);
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (file: any) => {
    const url  = getFileUrl(file.r2Key);
    const link = document.createElement("a");
    link.href     = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileAction = async (action: string, file: any) => {
    try {
      switch (action) {
        case "download":  handleDownload(file); break;
        case "delete":    await handleDelete(file); break;
        case "favorite":  await toggleFavorite({ id: file._id }); break;
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-(--bg-secondary) rounded-2xl border border-(--border-primary) w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="bg-(--bg-secondary) p-4 rounded-t-2xl border-b border-(--border-primary)">
          <div className="flex items-center justify-between">

            {/* Left: Title + Filter */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-(--text-primary)">
                File Browser
                {selectedFilter !== "all" && (
                  <span className="text-(--accent-blue) ml-2">
                    / {CATEGORY_CONFIG[selectedFilter]?.label || selectedFilter}
                    {selectedFilter === "elements" && selectedElementCategory !== "all" && (
                      <span className="ml-1">
                        / {ELEMENT_TYPES.find(t => t.key === selectedElementCategory)?.label || selectedElementCategory}
                      </span>
                    )}
                  </span>
                )}
              </h2>

              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-(--bg-tertiary) border border-(--border-primary) rounded-xl hover:bg-(--bg-primary) hover:border-(--accent-blue) transition-all duration-200 group"
                >
                  <Filter className="w-4 h-4 text-(--text-secondary) group-hover:text-(--accent-blue) transition-colors" />
                  <span className="text-sm font-medium text-(--text-primary) group-hover:text-(--accent-blue) transition-colors">
                    {selectedFilter === "all" ? "All Files" : CATEGORY_CONFIG[selectedFilter]?.label || selectedFilter}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-(--text-secondary) transition-all duration-200 ${showFilterDropdown ? "rotate-180 text-(--accent-blue)" : "group-hover:text-(--text-primary)"}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-(--text-primary) mb-3">File Type</h3>
                      <div className="space-y-1">
                        {[
                          { value: "all",   label: "All Files",  icon: Grid3x3  },
                          { value: "image", label: "Images",     icon: ImageIcon },
                          { value: "video", label: "Videos",     icon: Video     },
                          { value: "audio", label: "Audio",      icon: Volume2   },
                          { value: "file",  label: "Documents",  icon: FileText  },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => { setSelectedType(value as FileType); setShowFilterDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                              selectedType === value
                                ? "bg-(--accent-blue)/20 text-(--accent-blue) border border-(--accent-blue)/30"
                                : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${selectedType === value ? "text-(--accent-blue)" : ""}`} />
                            <span className="text-sm font-medium">{label}</span>
                            {selectedType === value && <div className="ml-auto w-2 h-2 bg-(--accent-blue) rounded-full" />}
                          </button>
                        ))}
                      </div>

                      <div className="h-px bg-(--border-primary) my-4" />

                      <h3 className="text-sm font-semibold text-(--text-primary) mb-3">Source</h3>
                      <div className="space-y-1">
                        {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                          <button
                            key={value}
                            onClick={() => { setSelectedFilter(value as CategoryFilter); setShowFilterDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                              selectedFilter === value
                                ? "bg-(--accent-blue)/20 text-(--accent-blue) border border-(--accent-blue)/30"
                                : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)"
                            }`}
                          >
                            <span className="text-sm font-medium">{config.label}</span>
                            <span className="text-xs ml-auto">{config.icon}</span>
                            {selectedFilter === value && <div className="w-2 h-2 bg-(--accent-blue) rounded-full" />}
                          </button>
                        ))}
                      </div>

                      {/* Element Category Filter - Only show when elements is selected */}
                      {selectedFilter === "elements" && (
                        <>
                          <div className="h-px bg-(--border-primary) my-4" />
                          <h3 className="text-sm font-semibold text-(--text-primary) mb-3">Element Type</h3>
                          <div className="space-y-1">
                            <button
                              onClick={() => { setSelectedElementCategory("all"); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                selectedElementCategory === "all"
                                  ? "bg-(--accent-blue)/20 text-(--accent-blue) border border-(--accent-blue)/30"
                                  : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)"
                              }`}
                            >
                              <span className="text-sm font-medium">All Elements</span>
                              {selectedElementCategory === "all" && <div className="w-2 h-2 bg-(--accent-blue) rounded-full" />}
                            </button>
                            {ELEMENT_TYPES.map(({ key, label, color }) => (
                              <button
                                key={key}
                                onClick={() => { setSelectedElementCategory(key); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                  selectedElementCategory === key
                                    ? "bg-(--accent-blue)/20 text-(--accent-blue) border border-(--accent-blue)/30"
                                    : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)"
                                }`}
                              >
                                <span className={`text-sm font-medium ${color}`}>{label}</span>
                                {selectedElementCategory === key && <div className="w-2 h-2 bg-(--accent-blue) rounded-full" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Search + Zoom + Upload + Close */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-xl text-sm text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-xl">
                <span className="text-xs text-(--text-secondary) font-medium">Size</span>
                <input
                  type="range" min="80" max="220" value={viewSize}
                  onChange={(e) => setViewSize(Number(e.target.value))}
                  className="w-24 h-1.5 bg-(--bg-tertiary) rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-(--text-secondary) w-8">{viewSize}</span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-(--accent-blue) text-white rounded-xl hover:bg-(--accent-blue)/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">{uploading ? "Uploading…" : "Upload"}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2.5 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5 text-(--text-secondary)" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-(--border-primary)" />

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <ErrorDisplay error={error} onRetry={() => { setError(null); setRefreshKey((k) => k + 1); }} />
          ) : isLoading ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))` }}>
              {Array.from({ length: 8 }).map((_, i) => <FileSkeleton key={i} />)}
            </div>
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              hasFilter={searchTerm !== "" || selectedFilter !== "all" || selectedType !== "all"}
              onUpload={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="space-y-8">
              {categories.map((cat) => {
                const catFiles = grouped[cat] ?? [];
                if (catFiles.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-sm text-(--text-secondary) font-semibold uppercase tracking-wider mb-4">
                      {CATEGORY_LABELS[cat] ?? cat} ({catFiles.length})
                    </p>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))` }}>
                      {catFiles.map((file) => {
                        if (!file) return null;
                        const Icon        = TYPE_ICON[file.fileType] ?? FileText;
                        const isImage     = file.fileType === "image";
                        const isVideo     = file.fileType === "video";
                        const publicUrl   = getFileUrl(file.r2Key);
                        const isDeleting  = deletingId === file._id;

                        return (
                          <div key={file._id} className="relative group">

                            {/* Image-selection overlay — use pointer-events-none so action buttons underneath remain clickable */}
                            {isImage && imageSelectionMode && onSelectImage && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-15 pointer-events-none">
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectImage(publicUrl, file.filename, file); }}
                                  className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600 transition-colors shadow-lg pointer-events-auto"
                                  title="Use this image"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* File content */}
                            <div
                              className="w-full rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-xl"
                              style={{ height: `${viewSize}px`, borderColor: "var(--border-primary)" }}
                              onClick={() => onSelectFile?.(publicUrl, file.fileType)}
                            >
                              {isImage ? (
                                <img src={publicUrl} alt={file.filename} loading="lazy" className="w-full h-full object-cover rounded-2xl" />
                              ) : isVideo ? (
                                <video
                                  src={publicUrl}
                                  className="w-full h-full object-cover rounded-2xl"
                                  muted
                                  preload="none"
                                  onMouseEnter={(e) => {
                                    const playPromise = e.currentTarget.play();
                                    if (playPromise && typeof playPromise.catch === "function") {
                                      playPromise.catch(() => {});
                                    }
                                  }}
                                  onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center rounded-2xl gap-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                                  <Icon className="w-8 h-8 opacity-60" style={{ color: "var(--text-tertiary)" }} />
                                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{getFileIcon(file.mimeType)}</span>
                                </div>
                              )}
                            </div>

                            {/* Favorite */}
                            <div className="absolute top-3 right-3 z-10">
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileAction("favorite", file); }}
                                className={`${file.isFavorite ? "bg-yellow-500 hover:bg-yellow-400 border-2 border-yellow-300" : "border-2"} p-2 rounded-full transition-all duration-200 shadow-lg`}
                                style={!file.isFavorite ? { backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" } : {}}
                                title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star className={`w-5 h-5 ${file.isFavorite ? "text-yellow-200 drop-shadow-md" : "text-(--text-secondary)"}`} />
                              </button>
                            </div>

                            {/* Action buttons */}
                            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileAction("download", file); }}
                                className="p-2 rounded-full bg-(--bg-secondary) hover:bg-(--bg-tertiary) border-2 border-(--border-primary) transition-all duration-200 shadow-lg"
                                title="Download"
                              >
                                <Download className="w-4 h-4 text-(--text-secondary)" />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileAction("delete", file); }}
                                disabled={isDeleting}
                                className="p-2 rounded-full bg-(--bg-secondary) hover:bg-red-900/50 border-2 border-(--border-primary) hover:border-red-500 transition-all duration-200 shadow-lg disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting
                                  ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                  : <Trash2 className="w-4 h-4 text-(--text-secondary)" />
                                }
                              </button>
                            </div>

                            {/* File type badge — top left */}
                            {!isImage && (
                              <div className="absolute top-3 left-3 z-10">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium backdrop-blur-sm ${
                                  isVideo ? 'bg-green-500/80 text-white' :
                                  file.fileType === 'audio' ? 'bg-purple-500/80 text-white' :
                                  'bg-gray-500/80 text-white'
                                }`}>
                                  {isVideo ? 'VIDEO' : file.fileType === 'audio' ? 'AUDIO' : 'DOC'}
                                </span>
                              </div>
                            )}

                            {/* File info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-3 py-2">
                              <div className="flex items-center gap-2">
                                {file.projectId
                                  ? <span className="text-[10px] px-1.5 py-0.5 bg-(--accent-blue)/20 text-(--accent-blue) rounded-md font-medium">Project</span>
                                  : <span className="text-[10px] px-1.5 py-0.5 bg-(--accent-teal)/20 text-(--accent-teal) rounded-md font-medium">Global</span>
                                }
                                {/* File extension */}
                                {(() => {
                                  const ext = file.filename.split('.').pop()?.toUpperCase();
                                  return ext ? (
                                    <span className="text-[9px] px-1 py-0.5 bg-white/10 text-gray-300 rounded font-mono">{ext}</span>
                                  ) : null;
                                })()}
                                <p className="text-xs text-white truncate flex-1 font-medium">{file.filename}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Load More */}
              {paginationStatus === "CanLoadMore" && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => loadMore(50)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    Load More Files
                  </button>
                </div>
              )}
              {paginationStatus === "LoadingMore" && (
                <div className="flex justify-center pt-6">
                  <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden input */}
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!pendingDeleteFile}
        onCancel={() => setPendingDeleteFile(null)}
        onConfirm={confirmDelete}
        title="Delete File"
        subtitle="This action cannot be undone"
        message={<>Are you sure you want to delete <span className="text-white font-medium">"{pendingDeleteFile?.filename}"</span>?</>}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
