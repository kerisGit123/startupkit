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
  Grid3x3,
  Volume2,
  Plus,
  Play,
  Pause,
  Pencil,
  Scan,
  Users,
  Package,
  Mountain,
  Minus,
  ZoomIn,
} from "lucide-react";
import { uploadToR2, deleteFromR2, batchDeleteFromR2 } from "@/lib/uploadToR2";
import { useMutation } from "convex/react";
import { useCurrentCompanyId } from "@/lib/auth-utils";

// ─── Tab System ───────────────────────────────────────────────────────────────

type TabKey = "all" | "images" | "videos" | "audio" | "characters" | "props" | "environments";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "all",          label: "All",          icon: Grid3x3  },
  { key: "images",       label: "Images",       icon: ImageIcon },
  { key: "videos",       label: "Videos",       icon: Video     },
  { key: "audio",        label: "Audio",        icon: Volume2   },
  { key: "characters",   label: "Characters",   icon: Users     },
  { key: "props",        label: "Props",        icon: Package   },
  { key: "environments", label: "Environments", icon: Mountain  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface FileBrowserProps {
  projectId?: string;
  onClose: () => void;
  onSelectFile?: (url: string, type: string) => void;
  onSelectImage?: (imageUrl: string, filename: string, file: any) => void;
  imageSelectionMode?: boolean;
  defaultFileType?: FileType;
  defaultCategory?: CategoryFilter;
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
  image:    ImageIcon,
  video:    Video,
  audio:    Volume2,
  file:     FileText,
  analysis: Scan,
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

/** Derive which tab should be active from the filter state */
function deriveActiveTab(
  selectedType: FileType,
  selectedFilter: CategoryFilter,
  selectedElementCategory: string
): TabKey {
  if (selectedFilter === "elements") {
    if (selectedElementCategory === "character") return "characters";
    if (selectedElementCategory === "prop") return "props";
    if (selectedElementCategory === "environment") return "environments";
  }
  if (selectedType === "image") return "images";
  if (selectedType === "video") return "videos";
  if (selectedType === "audio") return "audio";
  return "all";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden animate-pulse">
      <div className="bg-(--bg-tertiary)" style={{ height: "140px" }} />
    </div>
  );
}

function UploadTile({ onClick, uploading }: { onClick: () => void; uploading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={uploading}
      className="w-full rounded-lg border-2 border-dashed border-(--border-primary) hover:border-(--accent-blue)/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-(--accent-blue)/5 disabled:opacity-50 group"
    >
      <div className="w-9 h-9 rounded-full bg-(--bg-tertiary) group-hover:bg-(--accent-blue)/15 flex items-center justify-center transition-colors">
        <Plus className="w-4 h-4 text-(--text-secondary) group-hover:text-(--accent-blue) transition-colors" />
      </div>
      <span className="text-[10px] font-medium text-(--text-secondary) group-hover:text-(--accent-blue) transition-colors">
        {uploading ? "Uploading..." : "Upload"}
      </span>
    </button>
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
  defaultFileType,
  defaultCategory,
}: FileBrowserProps) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]           = useState("");
  const [selectedFilter, setSelectedFilter]   = useState<CategoryFilter>(defaultCategory || "all");
  const [selectedType, setSelectedType]       = useState<FileType>(defaultFileType || (imageSelectionMode ? "image" : "all"));
  const [selectedElementCategory, setSelectedElementCategory] = useState<string>("all");
  const [viewSize, setViewSize]               = useState(140);
  const [uploading, setUploading]             = useState(false);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<any>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [refreshKey, setRefreshKey]           = useState(0);
  const [playingAudioId, setPlayingAudioId]   = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const [renamingId, setRenamingId]           = useState<string | null>(null);
  const [renameValue, setRenameValue]         = useState("");
  const renameFileMutation = useMutation(api.storyboard.storyboardFiles.renameFile);
  const [fileContextMenu, setFileContextMenu] = useState<{ x: number; y: number; file: any } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived active tab
  const activeTab = deriveActiveTab(selectedType, selectedFilter, selectedElementCategory);

  // Tab click handler
  const handleTabClick = (tab: TabKey) => {
    switch (tab) {
      case "all":
        setSelectedType("all");
        setSelectedFilter("all");
        setSelectedElementCategory("all");
        break;
      case "images":
        setSelectedType("image");
        setSelectedFilter("all");
        setSelectedElementCategory("all");
        break;
      case "videos":
        setSelectedType("video");
        setSelectedFilter("all");
        setSelectedElementCategory("all");
        break;
      case "audio":
        setSelectedType("audio");
        setSelectedFilter("all");
        setSelectedElementCategory("all");
        break;
      case "characters":
        setSelectedType("all");
        setSelectedFilter("elements");
        setSelectedElementCategory("character");
        break;
      case "props":
        setSelectedType("all");
        setSelectedFilter("elements");
        setSelectedElementCategory("prop");
        break;
      case "environments":
        setSelectedType("all");
        setSelectedFilter("elements");
        setSelectedElementCategory("environment");
        break;
    }
  };

  // ── Auth / identity ───────────────────────────────────────────────────────
  const { user } = useUser();
  const projectCompanyId = useCurrentCompanyId();
  const companyId = projectCompanyId;
  const userId = user?.id || "";

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
      if (file.category === 'generated' || file.category === 'combine' || file.category === 'temps') return true;

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files;
    if (!picked || picked.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadCategory = selectedFilter === "all" ? "uploads" : selectedFilter;

      for (const file of Array.from(picked)) {
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 50MB.`);
          continue;
        }

        await uploadToR2({
          file,
          category: uploadCategory as any,
          userId,
          companyId,
          projectId,
        });
      }
    } catch (err) {
      console.error("[FileBrowser] Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (file: any) => {
    setPendingDeleteFile(file);
  };

  const confirmDelete = async () => {
    const file = pendingDeleteFile;
    if (!file) return;
    setPendingDeleteFile(null);

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

  // Should we show the filename on this file?
  const shouldShowFilename = (file: any): boolean => {
    // Always show for audio — you can't identify audio by visuals
    if (file.fileType === "audio") return true;
    // Always show for documents and analysis
    if (file.fileType === "file" || file.fileType === "analysis") return true;
    // Hide for images and videos at smaller sizes
    return false;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-(--bg-secondary) rounded-2xl border border-(--border-primary) w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="bg-(--bg-secondary) rounded-t-2xl border-b border-(--border-primary)">
          {/* Top row: Title + Search + Size + Upload + Close */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="text-xl font-semibold text-(--text-primary)">File Browser</h2>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56 pl-10 pr-4 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-xl text-sm text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewSize(Math.max(80, viewSize - 20))}
                  className="p-1 rounded-md hover:bg-(--bg-tertiary) transition-colors text-(--text-secondary) hover:text-(--text-primary)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range" min="80" max="220" value={viewSize}
                  onChange={(e) => setViewSize(Number(e.target.value))}
                  className="w-20 h-1 bg-(--bg-tertiary) rounded-lg appearance-none cursor-pointer accent-(--accent-blue)"
                />
                <button
                  onClick={() => setViewSize(Math.min(220, viewSize + 20))}
                  className="p-1 rounded-md hover:bg-(--bg-tertiary) transition-colors text-(--text-secondary) hover:text-(--text-primary)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-(--text-tertiary) font-medium w-8 text-center tabular-nums">{Math.round(((viewSize - 80) / 140) * 100)}%</span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-(--accent-blue) text-white rounded-xl hover:bg-(--accent-blue)/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload"}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2.5 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5 text-(--text-secondary)" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pb-0 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTabClick(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-200 border-b-2 whitespace-nowrap ${
                    isActive
                      ? "text-(--accent-blue) border-(--accent-blue) bg-(--accent-blue)/10"
                      : "text-(--text-secondary) border-transparent hover:text-(--text-primary) hover:bg-(--bg-tertiary)"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-(--accent-blue)" : ""}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <audio ref={previewAudioRef} style={{ display: "none" }} preload="none" />

        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <ErrorDisplay error={error} onRetry={() => { setError(null); setRefreshKey((k) => k + 1); }} />
          ) : isLoading ? (
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))` }}>
              {Array.from({ length: 12 }).map((_, i) => <FileSkeleton key={i} />)}
            </div>
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              hasFilter={searchTerm !== "" || activeTab !== "all"}
              onUpload={() => fileInputRef.current?.click()}
            />
          ) : (
            <div className="space-y-5">
              {categories.map((cat, catIndex) => {
                const catFiles = grouped[cat] ?? [];
                if (catFiles.length === 0) return null;
                const showHeader = categories.length > 1;
                return (
                  <div key={cat}>
                    {showHeader && (
                      <p className="text-xs text-(--text-tertiary) font-semibold uppercase tracking-wider mb-2">
                        {CATEGORY_LABELS[cat] ?? cat} ({catFiles.length})
                      </p>
                    )}
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))` }}>
                      {/* Upload tile — only in first group */}
                      {catIndex === 0 && <UploadTile onClick={() => fileInputRef.current?.click()} uploading={uploading} />}
                      {catFiles.map((file) => {
                        if (!file) return null;
                        const Icon        = TYPE_ICON[file.fileType] ?? FileText;
                        const isImage     = file.fileType === "image";
                        const isVideo     = file.fileType === "video";
                        const isAudio     = file.fileType === "audio";
                        const isAnalysis  = file.fileType === "analysis";
                        const publicUrl   = isAnalysis ? "" : getFileUrl(file.r2Key ?? "");
                        const isDeleting  = deletingId === file._id;
                        const showName    = shouldShowFilename(file);

                        return (
                          <div key={file._id} className="relative group">

                            {/* Image-selection overlay */}
                            {isImage && imageSelectionMode && onSelectImage && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-15 pointer-events-none rounded-lg">
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
                              className={`w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-(--accent-blue)/50 ${isAudio ? "border border-(--border-primary)" : ""}`}
                              style={{ height: `${viewSize}px` }}
                              onClick={() => {
                                if (isAnalysis && file.prompt) {
                                  navigator.clipboard.writeText(file.prompt);
                                  toast.success("Analysis copied to clipboard");
                                } else if (!isAnalysis) {
                                  onSelectFile?.(publicUrl, file.fileType);
                                }
                              }}
                              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setFileContextMenu({ x: e.clientX, y: e.clientY, file }); }}
                            >
                              {isImage ? (
                                /* Image with fallback for broken loads */
                                <div className="w-full h-full relative bg-(--bg-tertiary)">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-(--text-tertiary) opacity-30" />
                                  </div>
                                  <img
                                    src={publicUrl}
                                    alt={file.filename}
                                    loading="lazy"
                                    className="w-full h-full object-cover relative z-[1]"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                              ) : isVideo ? (
                                <div className="w-full h-full relative bg-(--bg-tertiary)">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Video className="w-8 h-8 text-(--text-tertiary) opacity-30" />
                                  </div>
                                  <video
                                    src={publicUrl}
                                    className="w-full h-full object-cover relative z-[1]"
                                    muted
                                    preload="metadata"
                                    onMouseEnter={(e) => {
                                      const playPromise = e.currentTarget.play();
                                      if (playPromise && typeof playPromise.catch === "function") {
                                        playPromise.catch(() => {});
                                      }
                                    }}
                                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                              ) : isAudio ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative px-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                                  <Volume2 className="w-7 h-7 opacity-50" style={{ color: "var(--text-tertiary)" }} />
                                  {/* Filename — always visible for audio */}
                                  <p className="text-[10px] text-center leading-tight truncate w-full font-medium" style={{ color: "var(--text-secondary)" }}>
                                    {file.metadata?.musicTitle || file.filename}
                                  </p>
                                  {/* Play/Pause overlay on hover */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const audio = previewAudioRef.current;
                                        if (!audio) return;
                                        if (playingAudioId === String(file._id)) {
                                          audio.pause();
                                          setPlayingAudioId(null);
                                        } else {
                                          audio.src = publicUrl;
                                          audio.play().catch(() => {});
                                          setPlayingAudioId(String(file._id));
                                          audio.onended = () => setPlayingAudioId(null);
                                        }
                                      }}
                                      className="w-10 h-10 rounded-full bg-purple-500/90 hover:bg-purple-400 flex items-center justify-center shadow-lg transition"
                                    >
                                      {playingAudioId === String(file._id)
                                        ? <Pause className="w-4 h-4 text-white" />
                                        : <Play className="w-4 h-4 text-white ml-0.5" />
                                      }
                                    </button>
                                  </div>
                                  {/* Playing indicator */}
                                  {playingAudioId === String(file._id) && (
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1">
                                      <div className="flex items-end gap-0.5 h-3">
                                        <div className="w-0.5 bg-purple-400 animate-pulse rounded-full" style={{ height: '40%', animationDelay: '0ms' }} />
                                        <div className="w-0.5 bg-purple-400 animate-pulse rounded-full" style={{ height: '80%', animationDelay: '150ms' }} />
                                        <div className="w-0.5 bg-purple-400 animate-pulse rounded-full" style={{ height: '60%', animationDelay: '300ms' }} />
                                        <div className="w-0.5 bg-purple-400 animate-pulse rounded-full" style={{ height: '90%', animationDelay: '100ms' }} />
                                      </div>
                                      <span className="text-[9px] text-purple-400">Playing</span>
                                    </div>
                                  )}
                                </div>
                              ) : isAnalysis ? (
                                <div
                                  className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-2 cursor-pointer"
                                  style={{ backgroundColor: "var(--bg-secondary)" }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (file.prompt) {
                                      navigator.clipboard.writeText(file.prompt);
                                      toast.success("Analysis copied to clipboard");
                                    }
                                  }}
                                  title={file.prompt ? file.prompt.slice(0, 200) + (file.prompt.length > 200 ? "..." : "") : "No analysis result"}
                                >
                                  <Scan className="w-6 h-6 text-amber-400/70" />
                                  <span className="text-[9px] font-medium text-amber-400/80">{file.model || "Analysis"}</span>
                                  {file.prompt && (
                                    <p className="text-[8px] text-center leading-tight opacity-50 line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                                      {file.prompt.slice(0, 80)}...
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                                  <Icon className="w-8 h-8 opacity-60" style={{ color: "var(--text-tertiary)" }} />
                                </div>
                              )}
                            </div>

                            {/* Favorite star */}
                            <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={file.isFavorite ? { opacity: 1 } : {}}
                            >
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileAction("favorite", file); }}
                                className={`${file.isFavorite ? "bg-yellow-500/90 text-yellow-100" : "bg-black/50 backdrop-blur-sm text-white/70 hover:text-white"} p-1.5 rounded-full transition-all duration-200`}
                                title={file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star className={`w-3.5 h-3.5 ${file.isFavorite ? "fill-current" : ""}`} />
                              </button>
                            </div>

                            {/* File type badge — top left (video/audio only) */}
                            {(isVideo || isAudio) && (
                              <div className="absolute top-1.5 left-1.5 z-10">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold backdrop-blur-sm ${
                                  isVideo ? 'bg-green-500/80 text-white' : 'bg-purple-500/80 text-white'
                                }`}>
                                  {isVideo ? 'VIDEO' : 'AUDIO'}
                                </span>
                              </div>
                            )}

                            {/* Action buttons on hover */}
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileAction("download", file); }}
                                className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-200"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5 text-white/80" />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileAction("delete", file); }}
                                disabled={isDeleting}
                                className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-red-600/70 transition-all duration-200 disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting
                                  ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5 text-white/80" />
                                }
                              </button>
                            </div>

                            {/* Filename — only for audio/docs, shown below the card */}
                            {showName && !isAudio && (
                              <p className="mt-1 text-[10px] text-(--text-secondary) truncate px-1" title={file.filename}>
                                {file.filename}
                              </p>
                            )}
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
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/mp4,audio/ogg,.mp3,.wav,.aac,.ogg,.m4a,.mpeg,.mpg,.flac,.wma" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* File Context Menu */}
      {fileContextMenu && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setFileContextMenu(null)} />
          <div className="fixed bg-[#1e1e28] border border-[#3D3D3D] rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1 min-w-[160px]"
            style={{ left: fileContextMenu.x, top: fileContextMenu.y, zIndex: 99999 }}>
            <button onClick={() => { setRenamingId(String(fileContextMenu.file._id)); setRenameValue(fileContextMenu.file.filename); setFileContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-[#2a2a35] transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Rename
            </button>
            {fileContextMenu.file.fileType === "analysis" ? (
              <button onClick={() => {
                if (fileContextMenu.file.prompt) {
                  navigator.clipboard.writeText(fileContextMenu.file.prompt);
                  toast.success("Analysis copied to clipboard");
                }
                setFileContextMenu(null);
              }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-[#2a2a35] transition-colors">
                <Scan className="w-3.5 h-3.5" /> Copy Result
              </button>
            ) : (
              <button onClick={() => { handleFileAction("download", fileContextMenu.file); setFileContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-[#2a2a35] transition-colors">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            )}
            <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
            <button onClick={() => { handleFileAction("delete", fileContextMenu.file); setFileContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-[#2a2a35] transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}

      {/* Rename Dialog */}
      {renamingId && (
        <>
          <div className="fixed inset-0 bg-black/60" style={{ zIndex: 99999 }} onClick={() => setRenamingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-5 w-[360px] shadow-2xl" style={{ zIndex: 100000 }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-medium text-sm mb-3">Rename File</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) {
                  renameFileMutation({ fileId: renamingId as any, filename: renameValue.trim() })
                    .then(() => { toast.success("Renamed!"); setRenamingId(null); })
                    .catch(() => toast.error("Failed to rename"));
                } else if (e.key === "Escape") { setRenamingId(null); }
              }}
              autoFocus
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition"
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setRenamingId(null)} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition">Cancel</button>
              <button onClick={() => {
                if (renameValue.trim()) {
                  renameFileMutation({ fileId: renamingId as any, filename: renameValue.trim() })
                    .then(() => { toast.success("Renamed!"); setRenamingId(null); })
                    .catch(() => toast.error("Failed to rename"));
                }
              }} className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium rounded-lg transition">
                Save
              </button>
            </div>
          </div>
        </>
      )}

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
