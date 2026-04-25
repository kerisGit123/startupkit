"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, ChevronRight, Film, Play, Pause, X, Plus,
  Camera, SkipForward, CheckCircle2, Copy, Trash2, GripVertical,
  Columns3, Loader2, StickyNote,
} from "lucide-react";
import type { Shot } from "../../types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface StoryboardStripProps {
  shots: Shot[];
  activeShotId: string;
  onNavigateToShot: (shotId: string) => void;
  projectFiles?: any[];
  isMobile?: boolean;
  /** Capture current canvas/video → save as this frame's imageUrl */
  onSnapshotToSelf?: () => Promise<void>;
  /** Capture current canvas/video → save as NEXT frame's imageUrl */
  onSnapshotToNext?: () => Promise<void>;
  /** Called when user reorders frames via drag. Array of { id, newOrder }. */
  onReorder?: (updates: { id: string; newOrder: number }[]) => void;
  /** Called when user marks a frame complete/draft */
  onFrameStatusChange?: (shotId: string, status: "draft" | "in-progress" | "completed") => void;
  /** Called when user duplicates a frame */
  onDuplicate?: (shotId: string) => void;
  /** Called when user deletes a frame */
  onDelete?: (shotId: string) => void;
  /** Called when user edits frame notes */
  onEditNotes?: (shotId: string, notes: string) => void;
  /** Called during animatic when a frame has video — parent should play it in the canvas */
  onPlayVideo?: (videoUrl: string) => void;
  /** Called during animatic when advancing away from video — parent should stop video */
  onStopVideo?: () => void;
  /** Called when user clicks a generated image output to load it in the canvas */
  onSelectOutput?: (url: string) => void;
  /** Called when user clicks a generated video output to play it */
  onPlayVideoOutput?: (url: string) => void;
  /** Called when user clicks the + button to add a new frame */
  onAddFrame?: () => void;
}

// Derive frame status from available media
function getFrameStatus(shot: Shot): "completed" | "in-progress" | "draft" {
  if (shot.videoUrl) return "completed";
  if (shot.imageUrl) return "in-progress";
  return "draft";
}

// Get the best thumbnail URL for a shot
function getThumbnail(shot: Shot): { url: string | null; type: "video" | "image" | "none"; videoUrl: string | null } {
  if (shot.videoUrl) return { url: shot.imageUrl || shot.videoUrl, type: "video", videoUrl: shot.videoUrl };
  if (shot.imageUrl) return { url: shot.imageUrl, type: "image", videoUrl: null };
  return { url: null, type: "none", videoUrl: null };
}

// Group shots by scene number
function groupByScene(shots: Shot[]): { scene: number; shots: Shot[] }[] {
  const groups: Map<number, Shot[]> = new Map();
  for (const shot of shots) {
    const scene = shot.scene ?? 0;
    if (!groups.has(scene)) groups.set(scene, []);
    groups.get(scene)!.push(shot);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([scene, shots]) => ({ scene, shots }));
}

// ─── Status Dot ─────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  completed: "bg-[var(--color-success)]",
  "in-progress": "bg-[var(--color-warning)]",
  draft: "bg-(--border-primary)",
};

function StatusDot({ status }: { status: "completed" | "in-progress" | "draft" }) {
  return <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]} shrink-0`} />;
}

// ─── Context Menu ───────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  shotId: string;
  status: "completed" | "in-progress" | "draft";
  currentNotes?: string;
}

function StripContextMenu({
  menu,
  onClose,
  onMarkStatus,
  onDuplicate,
  onDelete,
  onEditNotes,
}: {
  menu: ContextMenuState;
  onClose: () => void;
  onMarkStatus?: (shotId: string, status: "draft" | "in-progress" | "completed") => void;
  onDuplicate?: (shotId: string) => void;
  onDelete?: (shotId: string) => void;
  onEditNotes?: (shotId: string, notes: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const nextStatus = menu.status === "completed" ? "draft" : "completed";
  const nextLabel = menu.status === "completed" ? "Mark as Draft" : "Mark Complete";

  return createPortal(
    <div
      ref={ref}
      className="fixed bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl py-1.5 w-[180px] z-99999"
      style={{ top: menu.y, left: menu.x }}
    >
      {onMarkStatus && (
        <button
          onClick={() => { onMarkStatus(menu.shotId, nextStatus); onClose(); }}
          className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
          {nextLabel}
        </button>
      )}
      {onEditNotes && (
        <button
          onClick={() => {
            const note = prompt("Frame notes:", menu.currentNotes || "");
            if (note !== null) onEditNotes(menu.shotId, note);
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 flex items-center gap-2.5"
        >
          <StickyNote className="w-4 h-4 text-yellow-400/70" strokeWidth={1.75} />
          {menu.currentNotes ? "Edit Notes" : "Add Notes"}
        </button>
      )}
      {onDuplicate && (
        <button
          onClick={() => { onDuplicate(menu.shotId); onClose(); }}
          className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 flex items-center gap-2.5"
        >
          <Copy className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
          Duplicate
        </button>
      )}
      {onDelete && (
        <>
          <div className="h-px bg-(--border-primary) mx-2 my-1" />
          <button
            onClick={() => { onDelete(menu.shotId); onClose(); }}
            className="w-full px-3 py-2 text-left text-[13px] text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            Delete
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

// ─── Frame Card ─────────────────────────────────────────────────────────────

function FrameCard({
  shot,
  isActive,
  isLast,
  onClick,
  onContextMenu,
  onSnapshotToSelf,
  onSnapshotToNext,
  isDragging,
  onDragStart,
}: {
  shot: Shot;
  isActive: boolean;
  isLast: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onSnapshotToSelf?: () => Promise<void>;
  onSnapshotToNext?: () => Promise<void>;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const thumb = getThumbnail(shot);
  const status = getFrameStatus(shot);
  const frameNum = String((shot.order ?? 0) + 1).padStart(2, "0");

  // ── Video hover preview ─────────────────────────────────────────────────
  const [showVideo, setShowVideo] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (thumb.type !== "video" || !thumb.videoUrl) return;
    hoverTimer.current = setTimeout(() => setShowVideo(true), 500);
  }, [thumb.type, thumb.videoUrl]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setShowVideo(false);
  }, []);

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [showVideo]);

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  const handleSnapshot = async (e: React.MouseEvent, handler?: () => Promise<void>) => {
    e.stopPropagation();
    if (!handler || snapping) return;
    setSnapping(true);
    try { await handler(); } finally { setSnapping(false); }
  };

  return (
    <div
      className={`shrink-0 relative group ${isDragging ? "opacity-40" : ""}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
    >
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          flex flex-col rounded-lg overflow-hidden transition-all duration-200 cursor-pointer
          ${isActive
            ? "border-(--accent-blue) ring-1 ring-(--accent-blue)/30 scale-105 z-10"
            : "border-(--border-primary) hover:border-(--border-secondary)"
          }
          border bg-(--bg-primary)
        `}
        style={{ width: 80 }}
        title={shot.title || `Frame ${frameNum}`}
      >
        {/* Thumbnail */}
        <div className="relative w-full h-[52px] bg-(--bg-primary) overflow-hidden">
          {showVideo && thumb.videoUrl && (
            <video
              ref={videoRef}
              src={thumb.videoUrl}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-1"
            />
          )}

          {thumb.url ? (
            <img
              src={thumb.url}
              alt={`Frame ${frameNum}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-4 h-4 text-(--text-tertiary)" strokeWidth={1.75} />
            </div>
          )}

          {thumb.type === "video" && !showVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" strokeWidth={1.75} />
              </div>
            </div>
          )}

          {thumb.type !== "none" && (
            <span
              className={`
                absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-md font-semibold leading-none tracking-wide uppercase
                ${thumb.type === "video" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}
              `}
            >
              {thumb.type === "video" ? "VIDEO" : "IMAGE"}
            </span>
          )}

          {/* Director's Notes indicator — bottom-right when shot has notes */}
          {shot.notes && shot.notes.trim() && (
            <div className="absolute bottom-1 right-1 pointer-events-none" title={shot.notes}>
              <StickyNote className="w-3 h-3 text-yellow-400/80 drop-shadow" strokeWidth={1.75} />
            </div>
          )}

          {/* Drag handle — visible on hover, top-right */}
          {onDragStart && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-70 transition-opacity pointer-events-none">
              <GripVertical className="w-3 h-3 text-white drop-shadow" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-1 px-1.5 py-1 min-w-0">
          <span className="text-[10px] text-(--text-secondary) font-medium shrink-0">{frameNum}</span>
          {shot.title && (
            <span className="text-[9px] text-(--text-secondary) truncate min-w-0">{shot.title}</span>
          )}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <StatusDot status={status} />
            {shot.duration != null && shot.duration > 0 && (
              <span className="text-[9px] text-(--text-tertiary)">{shot.duration}s</span>
            )}
          </div>
        </div>
      </button>

      {/* Snapshot action buttons (active frame only, on hover) */}
      {isActive && (onSnapshotToSelf || onSnapshotToNext) && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1
                        opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {onSnapshotToSelf && (
            <button
              onClick={(e) => handleSnapshot(e, onSnapshotToSelf)}
              disabled={snapping}
              className="w-5 h-5 rounded bg-black/70 backdrop-blur flex items-center justify-center
                         text-white/80 hover:text-white hover:bg-(--accent-blue)/80 transition
                         disabled:opacity-40"
              title="Snapshot → save as this frame"
            >
              <Camera className="w-3 h-3" strokeWidth={1.75} />
            </button>
          )}
          {onSnapshotToNext && !isLast && (
            <button
              onClick={(e) => handleSnapshot(e, onSnapshotToNext)}
              disabled={snapping}
              className="w-5 h-5 rounded bg-black/70 backdrop-blur flex items-center justify-center
                         text-white/80 hover:text-white hover:bg-amber-500/80 transition
                         disabled:opacity-40"
              title="Snapshot → send to next frame"
            >
              <SkipForward className="w-3 h-3" strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Scene Divider ──────────────────────────────────────────────────────────

function SceneDivider({ scene }: { scene: number }) {
  return (
    <div className="shrink-0 flex flex-col items-center justify-center px-1 self-stretch">
      <div className="w-px flex-1 bg-(--border-primary)/60" />
      <span className="text-[8px] text-(--text-tertiary) font-medium py-0.5 select-none">S{scene}</span>
      <div className="w-px flex-1 bg-(--border-primary)/60" />
    </div>
  );
}

// ─── Output Thumbnail (Generated Outputs Row) ──────────────────────────────

function OutputThumb({
  file,
  onClickImage,
  onClickVideo,
}: {
  file: any;
  onClickImage: (url: string) => void;
  onClickVideo: (url: string) => void;
}) {
  const isVideo = file.fileType === "video";
  const isProcessing = file.status === "generating" || file.status === "processing";
  const url = file.sourceUrl || (file.r2Key ? `${file.r2Key}` : null);

  return (
    <button
      onClick={() => {
        if (!url) return;
        if (isVideo) onClickVideo(url);
        else onClickImage(url);
      }}
      className="shrink-0 w-[48px] h-[36px] rounded-md overflow-hidden border border-(--border-primary)
                 hover:border-(--border-secondary) bg-(--bg-primary) relative transition"
      title={file.model || file.filename || "Output"}
    >
      {isProcessing ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-(--accent-blue) animate-spin" />
        </div>
      ) : isVideo && url ? (
        /* Video thumbnail: use <video> element to show first frame */
        <video
          src={url}
          muted
          preload="metadata"
          className="w-full h-full object-cover"
          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0.5; }}
        />
      ) : url ? (
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Film className="w-3 h-3 text-(--text-tertiary)" />
        </div>
      )}
      {isVideo && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-2 h-2 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
      {isVideo && !isProcessing && (
        <span className="absolute top-0.5 left-0.5 text-[6px] px-0.5 rounded bg-red-500 text-white font-semibold leading-none">V</span>
      )}
      {file.model && (
        <span className="absolute bottom-0 inset-x-0 text-[6px] text-center text-white/70 bg-black/50 leading-tight truncate px-0.5">
          {file.model.split("-").pop()}
        </span>
      )}
    </button>
  );
}

// ─── Comparison Frame (prev / current / next) ──────────────────────────────

function ComparisonFrame({
  shot,
  label,
  isActive,
  onClick,
}: {
  shot: Shot;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const thumb = getThumbnail(shot);
  const frameNum = String((shot.order ?? 0) + 1).padStart(2, "0");

  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center gap-1 rounded-lg overflow-hidden transition cursor-pointer
        ${isActive ? "ring-2 ring-(--accent-blue)" : "ring-1 ring-(--border-primary) hover:ring-(--border-secondary)"}`}
      style={{ width: 140 }}
    >
      <div className="relative w-full h-[56px] bg-(--bg-primary) overflow-hidden">
        {thumb.url ? (
          <img src={thumb.url} alt={`Frame ${frameNum}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-(--bg-primary)">
            <Film className="w-5 h-5 text-(--text-tertiary)" />
          </div>
        )}
        {thumb.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 pb-1">
        <span className="text-[9px] text-(--text-tertiary) uppercase tracking-wide">{label}</span>
        <span className="text-[10px] text-(--text-secondary) font-medium">{frameNum}</span>
        {shot.notes && shot.notes.trim() && (
          <StickyNote className="w-3 h-3 text-yellow-400/60" strokeWidth={1.75} />
        )}
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StoryboardStrip({
  shots,
  activeShotId,
  onNavigateToShot,
  projectFiles,
  isMobile = false,
  onSnapshotToSelf,
  onSnapshotToNext,
  onReorder,
  onFrameStatusChange,
  onDuplicate,
  onDelete,
  onPlayVideo,
  onStopVideo,
  onSelectOutput,
  onPlayVideoOutput,
  onEditNotes,
  onAddFrame,
}: StoryboardStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!isMobile);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPreviewId, setComparisonPreviewId] = useState<string | null>(null);

  // Drag reorder
  const [dragShotId, setDragShotId] = useState<string | null>(null);
  const [dragOverShotId, setDragOverShotId] = useState<string | null>(null);

  // Animatic playback
  const [animaticPlaying, setAnimaticPlaying] = useState(false);
  const animaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort shots by order
  const sortedShots = useMemo(
    () => [...shots].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [shots]
  );

  // Group by scene
  const sceneGroups = useMemo(() => groupByScene(sortedShots), [sortedShots]);
  const hasMultipleScenes = sceneGroups.length > 1;

  // Total duration
  const totalDuration = useMemo(
    () => sortedShots.reduce((sum, s) => sum + (s.duration ?? 0), 0),
    [sortedShots]
  );

  // Current index for "3 / 12" display
  const activeIdx = sortedShots.findIndex((s) => s.id === activeShotId);

  // Comparison mode: prev / current / next shots
  const prevShot = activeIdx > 0 ? sortedShots[activeIdx - 1] : null;
  const activeShot = sortedShots[activeIdx] ?? null;
  const nextShot = activeIdx < sortedShots.length - 1 ? sortedShots[activeIdx + 1] : null;

  // Generated outputs for active frame
  const activeOutputs = useMemo(() => {
    if (!projectFiles) return [];
    return projectFiles
      .filter((f: any) =>
        String(f.categoryId ?? "") === activeShotId &&
        (f.category === "generated" || f.category === "combine") &&
        !f.deletedAt &&
        (f.fileType === "image" || f.fileType === "video")
      )
      .sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [projectFiles, activeShotId]);

  // ── Context Menu handler ──────────────────────────────────────────────────

  const handleContextMenu = useCallback((e: React.MouseEvent, shot: Shot) => {
    e.preventDefault();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 200),
      shotId: shot.id,
      status: getFrameStatus(shot),
      currentNotes: shot.notes || "",
    });
  }, []);

  // ── Drag reorder ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, shotId: string) => {
    setDragShotId(shotId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shotId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, shotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverShotId(shotId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetShotId: string) => {
    e.preventDefault();
    setDragOverShotId(null);
    if (!dragShotId || dragShotId === targetShotId || !onReorder) {
      setDragShotId(null);
      return;
    }

    // Compute new order: remove dragged from array, insert at target position
    const ids = sortedShots.map(s => s.id);
    const fromIdx = ids.indexOf(dragShotId);
    const toIdx = ids.indexOf(targetShotId);
    if (fromIdx < 0 || toIdx < 0) { setDragShotId(null); return; }

    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragShotId);

    const updates = ids.map((id, i) => ({ id, newOrder: i }));
    onReorder(updates);
    setDragShotId(null);
  }, [dragShotId, sortedShots, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragShotId(null);
    setDragOverShotId(null);
  }, []);

  // ── Animatic playback ─────────────────────────────────────────────────────
  // Plays through frames like a slideshow.
  // - Image frames: hold for frame.duration (default 3s), then advance.
  // - Video frames: tell parent to play video, use a hidden <video> to detect
  //   actual video duration, wait for it to finish, then advance.

  const animaticVideoRef = useRef<HTMLVideoElement>(null);

  const stopAnimatic = useCallback(() => {
    setAnimaticPlaying(false);
    if (animaticTimer.current) {
      clearTimeout(animaticTimer.current);
      animaticTimer.current = null;
    }
    // Stop any playing video
    if (animaticVideoRef.current) {
      animaticVideoRef.current.pause();
      animaticVideoRef.current.src = "";
    }
    onStopVideo?.();
  }, [onStopVideo]);

  const startAnimatic = useCallback(() => {
    if (sortedShots.length === 0) return;
    setAnimaticPlaying(true);
    let idx = Math.max(0, sortedShots.findIndex(s => s.id === activeShotId));

    const playFrame = (frameIdx: number) => {
      const shot = sortedShots[frameIdx];
      onNavigateToShot(shot.id);

      if (shot.videoUrl && onPlayVideo) {
        // ── Video frame: play video, advance when it ends ──
        onPlayVideo(shot.videoUrl);

        const vid = animaticVideoRef.current;
        if (vid) {
          vid.src = shot.videoUrl;
          vid.currentTime = 0;
          vid.play().catch(() => {});

          const onEnd = () => {
            vid.removeEventListener("ended", onEnd);
            onStopVideo?.();
            advance();
          };
          vid.addEventListener("ended", onEnd);

          // Safety fallback: if video doesn't fire "ended" within 60s, advance anyway
          animaticTimer.current = setTimeout(() => {
            vid.removeEventListener("ended", onEnd);
            onStopVideo?.();
            advance();
          }, 60000);
        } else {
          // No video element — fall back to duration timer
          const duration = (shot.duration || 3) * 1000;
          animaticTimer.current = setTimeout(advance, duration);
        }
      } else {
        // ── Image frame: hold for duration, then advance ──
        const duration = (shot.duration || 3) * 1000;
        animaticTimer.current = setTimeout(advance, duration);
      }
    };

    const advance = () => {
      if (animaticTimer.current) {
        clearTimeout(animaticTimer.current);
        animaticTimer.current = null;
      }
      idx++;
      if (idx >= sortedShots.length) idx = 0;
      playFrame(idx);
    };

    // Start with current frame
    playFrame(idx);
  }, [sortedShots, activeShotId, onNavigateToShot, onPlayVideo, onStopVideo]);

  const toggleAnimatic = useCallback(() => {
    if (animaticPlaying) stopAnimatic();
    else startAnimatic();
  }, [animaticPlaying, stopAnimatic, startAnimatic]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (animaticTimer.current) clearTimeout(animaticTimer.current);
    if (animaticVideoRef.current) animaticVideoRef.current.pause();
  }, []);

  // ── Scroll state ──────────────────────────────────────────────────────────

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      ro.disconnect();
    };
  }, [updateScrollButtons, isVisible]);

  // ── Auto-scroll to active frame ───────────────────────────────────────────

  useEffect(() => {
    if (!isVisible) return;
    const el = scrollRef.current;
    if (!el) return;
    const activeCard = el.querySelector(`[data-shot-id="${activeShotId}"]`) as HTMLElement | null;
    if (!activeCard) return;

    const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
    const scrollTarget = cardCenter - el.clientWidth / 2;
    el.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, [activeShotId, isVisible]);

  // ── Scroll arrows ─────────────────────────────────────────────────────────

  const scrollBy = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  // ── Wheel → horizontal scroll ────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollRef.current?.scrollBy({ left: e.deltaY, behavior: "auto" });
    }
  }, []);

  // ── Mobile toggle ─────────────────────────────────────────────────────────

  if (isMobile && !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 mx-auto mt-1 mb-0 rounded-full
                   bg-(--bg-secondary)/80 border border-(--border-primary) text-[10px] text-(--text-secondary)
                   hover:text-(--text-primary) hover:border-(--accent-blue)/40 transition-all"
      >
        <Film className="w-3 h-3" strokeWidth={1.75} />
        <span>Filmstrip ({sortedShots.length})</span>
      </button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="shrink-0 select-none">
      {/* ── Main strip bar ── */}
      <div className="relative flex items-center h-[82px] px-2 py-[8px] bg-(--bg-secondary)/95 backdrop-blur-md border-b border-(--border-primary)">
        {/* Left scroll arrow */}
        {!comparisonMode && canScrollLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center
                       text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition mr-1"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}

        {/* Animatic play/pause button */}
        <button
          onClick={toggleAnimatic}
          className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition mr-1
            ${animaticPlaying
              ? "text-(--accent-blue) bg-(--accent-blue)/15"
              : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
            }`}
          title={animaticPlaying ? "Stop animatic" : "Play animatic (auto-advance frames)"}
        >
          {animaticPlaying
            ? <Pause className="w-3.5 h-3.5" strokeWidth={1.75} />
            : <Play className="w-3.5 h-3.5 ml-0.5" strokeWidth={1.75} />
          }
        </button>

        {/* Comparison mode toggle */}
        <button
          onClick={() => setComparisonMode(v => !v)}
          className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition mr-1
            ${comparisonMode
              ? "text-(--accent-blue) bg-(--accent-blue)/15"
              : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
            }`}
          title={comparisonMode ? "Exit comparison" : "Compare prev / current / next"}
        >
          <Columns3 className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>

        {/* ── Comparison view OR scrollable filmstrip ── */}
        {comparisonMode ? (() => {
          const previewShot = comparisonPreviewId
            ? sortedShots.find(s => s.id === comparisonPreviewId) ?? activeShot
            : activeShot;
          const previewThumb = previewShot ? getThumbnail(previewShot) : null;

          return (
            <div className="flex-1 flex flex-col items-center gap-1 overflow-hidden">
              {/* Three comparison frames */}
              <div className="flex items-center justify-center gap-3">
                {prevShot ? (
                  <ComparisonFrame shot={prevShot} label="Previous"
                    isActive={comparisonPreviewId === prevShot.id}
                    onClick={() => { setComparisonPreviewId(prevShot.id); onNavigateToShot(prevShot.id); }} />
                ) : (
                  <div className="w-[140px] h-[56px] rounded-lg border border-dashed border-(--border-primary) flex items-center justify-center">
                    <span className="text-[9px] text-(--text-tertiary)">No prev</span>
                  </div>
                )}
                {activeShot && (
                  <ComparisonFrame shot={activeShot} label="Current"
                    isActive={!comparisonPreviewId || comparisonPreviewId === activeShot.id}
                    onClick={() => setComparisonPreviewId(activeShot.id)} />
                )}
                {nextShot ? (
                  <ComparisonFrame shot={nextShot} label="Next"
                    isActive={comparisonPreviewId === nextShot.id}
                    onClick={() => { setComparisonPreviewId(nextShot.id); onNavigateToShot(nextShot.id); }} />
                ) : (
                  <div className="w-[140px] h-[56px] rounded-lg border border-dashed border-(--border-primary) flex items-center justify-center">
                    <span className="text-[9px] text-(--text-tertiary)">No next</span>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          <>
            {/* Scrollable strip */}
            <div
              ref={scrollRef}
              onWheel={handleWheel}
              onDragEnd={handleDragEnd}
              className="flex-1 flex items-center gap-[5px] overflow-x-auto scrollbar-hide py-[5px]"
              style={{ scrollbarWidth: "none" }}
            >
              {sceneGroups.map((group, gi) => (
                <React.Fragment key={group.scene}>
                  {hasMultipleScenes && gi > 0 && <SceneDivider scene={group.scene} />}

                  {group.shots.map((shot) => (
                    <div
                      key={shot.id}
                      data-shot-id={shot.id}
                      className={`shrink-0 ${dragOverShotId === shot.id && dragShotId !== shot.id ? "border-l-2 border-(--accent-blue)" : ""}`}
                      onDragOver={onReorder ? (e) => handleDragOver(e, shot.id) : undefined}
                      onDrop={onReorder ? (e) => handleDrop(e, shot.id) : undefined}
                    >
                      <FrameCard
                        shot={shot}
                        isActive={shot.id === activeShotId}
                        isLast={shot.id === sortedShots[sortedShots.length - 1]?.id}
                        onClick={() => { stopAnimatic(); onNavigateToShot(shot.id); }}
                        onContextMenu={(e) => handleContextMenu(e, shot)}
                        onSnapshotToSelf={shot.id === activeShotId ? onSnapshotToSelf : undefined}
                        onSnapshotToNext={shot.id === activeShotId ? onSnapshotToNext : undefined}
                        isDragging={dragShotId === shot.id}
                        onDragStart={onReorder ? (e) => handleDragStart(e, shot.id) : undefined}
                      />
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {/* Add Frame button */}
              {onAddFrame && (
                <button
                  onClick={onAddFrame}
                  className="shrink-0 w-[80px] h-[52px] rounded-lg border border-dashed border-(--border-primary) hover:border-(--accent-blue)/50
                             flex items-center justify-center bg-(--bg-primary)/30 hover:bg-(--accent-blue)/5
                             transition-colors cursor-pointer group"
                  title="Add new frame"
                >
                  <Plus className="w-5 h-5 text-(--text-tertiary) group-hover:text-(--accent-blue) transition-colors" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Right scroll arrow */}
            {canScrollRight && (
              <button
                onClick={() => scrollBy(1)}
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center
                           text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition ml-1"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </>
        )}

        {/* Right info section: frame counter + total duration */}
        <div className="shrink-0 flex items-center gap-2 ml-2 pl-2 border-l border-(--border-primary)/60">
          <span className="text-[11px] text-(--text-secondary) font-medium tabular-nums whitespace-nowrap">
            {activeIdx >= 0 ? activeIdx + 1 : "—"} / {sortedShots.length}
          </span>
          {totalDuration > 0 && (
            <span className="text-[10px] text-(--text-tertiary) tabular-nums whitespace-nowrap">
              {totalDuration.toFixed(1)}s
            </span>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setIsVisible(false)}
            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center
                       text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition ml-1"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <StripContextMenu
            menu={contextMenu}
            onClose={() => setContextMenu(null)}
            onMarkStatus={onFrameStatusChange}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onEditNotes={onEditNotes}
          />
        )}

        {/* Hidden video element for animatic video duration detection */}
        <video ref={animaticVideoRef} muted playsInline className="hidden" />
      </div>

      {/* ── Generated Outputs Row ── */}
      {activeOutputs.length > 0 && !comparisonMode && (
        <div className="flex items-center h-[46px] px-2 py-1 bg-(--bg-primary)/80 border-b border-(--border-primary)/40">
          <span className="text-[9px] text-(--text-tertiary) font-medium uppercase tracking-wide mr-2 shrink-0">
            Outputs
          </span>
          <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {activeOutputs.map((file: any) => (
              <OutputThumb
                key={file._id}
                file={file}
                onClickImage={(url) => onSelectOutput?.(url)}
                onClickVideo={(url) => onPlayVideoOutput?.(url)}
              />
            ))}
          </div>
          <span className="text-[9px] text-(--text-tertiary) ml-2 shrink-0 tabular-nums">
            {activeOutputs.length}
          </span>
        </div>
      )}
    </div>
  );
}
