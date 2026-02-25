"use client";

import {
  LayoutGrid, List, Square, Film, ChevronDown, Plus, ZoomIn, ZoomOut,
  Download, Filter, Settings, Image as ImageIcon, MoreHorizontal,
  Hash, MessageSquare, Clock, PanelLeftClose, PanelLeftOpen,
  Sparkles, Upload, Send, GripVertical, StickyNote, FileText,
  Play, Camera, Lightbulb, RotateCcw, CheckSquare,
} from "lucide-react";
import type { Shot, ViewMode, BoardSettings, Project } from "../types";

interface BoardViewProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  project: Project;
  shots: Shot[];
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  zoomLevel: number;
  onZoomChange: (z: number) => void;
  selectedShotId: string | null;
  onSelectShot: (id: string | null) => void;
  onOpenSceneEditor: (id: string) => void;
  onAddShot: () => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetId: string) => void;
  boardSettings: BoardSettings;
  showBoardSettings: boolean;
  onToggleBoardSettings: () => void;
  onBoardSettingsChange: (s: BoardSettings) => void;
  showExportDropdown: boolean;
  onToggleExportDropdown: () => void;
  onOpenPdfModal: () => void;
  onOpenShareModal: () => void;
  commentTab: "selected" | "all";
  onCommentTabChange: (t: "selected" | "all") => void;
  commentText: string;
  onCommentTextChange: (v: string) => void;
  onAddComment: () => void;
  onProjectStatusChange?: (status: Project["status"]) => void;
}

const VIEW_ICONS = [
  { mode: "grid"   as ViewMode, Icon: LayoutGrid, title: "Grid view"   },
  { mode: "script" as ViewMode, Icon: List,        title: "Script view" },
  { mode: "video"  as ViewMode, Icon: Film,        title: "Video view"  },
];

const TAG_PILL_COLORS: Record<string, string> = {
  motion:      "bg-violet-500/80",
  "live action":"bg-yellow-500/80",
  "3D":        "bg-blue-500/80",
  cel:         "bg-green-500/80",
};

function tagPillClass(name: string) {
  return TAG_PILL_COLORS[name] ?? "bg-gray-500/80";
}

export function BoardView({
  sidebarOpen, onToggleSidebar, project, shots, viewMode, onViewModeChange,
  zoomLevel, onZoomChange, selectedShotId, onSelectShot, onOpenSceneEditor,
  onAddShot, onDragStart, onDragOver, onDrop, boardSettings, showBoardSettings,
  onToggleBoardSettings, onBoardSettingsChange, showExportDropdown,
  onToggleExportDropdown, onOpenPdfModal, onOpenShareModal,
  commentTab, onCommentTabChange, commentText, onCommentTextChange, onAddComment,
  onProjectStatusChange,
}: BoardViewProps) {

  // Columns driven by zoom: 100% = 6 cols, 75% = 4, 50% = 3
  const cols =
    zoomLevel >= 100 ? "grid-cols-6" :
    zoomLevel >= 75  ? "grid-cols-4" :
                       "grid-cols-3";

  const selectedShot = shots.find(s => s.id === selectedShotId);
  const allComments = shots.flatMap(s => s.comments.map(c => ({ ...c, shotNum: s.shot })));

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 shrink-0">
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar} className="p-1.5 text-gray-400 hover:text-white rounded transition shrink-0">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Project name + status */}
        <div className="flex items-center gap-2 min-w-0">
          <button className="flex items-center gap-1.5 text-white font-semibold text-sm hover:bg-white/5 px-2 py-1 rounded-lg transition">
            {project.name} <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <div className="relative group/status">
            <button className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                {project.status}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
            <div className="hidden group-hover/status:block absolute left-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-50 w-32 py-1">
              {(["On Hold", "In Progress", "Completed", "Draft"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => onProjectStatusChange?.(status)}
                  className="w-full px-3 py-1.5 hover:bg-white/5 text-gray-300 text-xs text-left transition"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <button className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition">
            Ver. {project.version} <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        <div className="flex-1" />

        {/* View mode toggles (pic9) */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 gap-0.5">
          {VIEW_ICONS.map(({ mode, Icon, title }) => (
            <button
              key={mode}
              title={title}
              onClick={() => onViewModeChange(mode)}
              className={`p-1.5 rounded-md transition ${viewMode === mode ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => onZoomChange(Math.max(50, zoomLevel - 25))} className="p-1.5 text-gray-400 hover:text-white transition"><ZoomOut className="w-3.5 h-3.5" /></button>
          <button onClick={() => onZoomChange(Math.min(150, zoomLevel + 25))} className="p-1.5 text-gray-400 hover:text-white transition"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* AI buttons */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Script AI
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Storyboard AI
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition">
          <Upload className="w-3.5 h-3.5" /> Import
        </button>

        <div className="w-px h-5 bg-white/10" />

        {/* Filter / Settings */}
        <button className="p-1.5 text-gray-400 hover:text-white transition"><Filter className="w-3.5 h-3.5" /></button>

        {/* Export dropdown */}
        <div className="relative">
          <button onClick={onToggleExportDropdown} className="p-1.5 text-gray-400 hover:text-white transition">
            <Download className="w-3.5 h-3.5" />
          </button>
          {showExportDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={onToggleExportDropdown} />
              <div className="absolute right-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-50 w-48 py-1.5">
                <button onClick={() => { onOpenPdfModal(); onToggleExportDropdown(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-gray-300 text-sm transition">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-gray-300 text-sm transition">
                  <Download className="w-3.5 h-3.5" /> Download all media
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-gray-300 text-sm transition">
                  <List className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </>
          )}
        </div>

        <button onClick={onToggleBoardSettings} className={`p-1.5 rounded transition ${showBoardSettings ? "text-white bg-white/10" : "text-gray-400 hover:text-white"}`}>
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Share */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Share
        </button>
      </div>

      {/* ── Main area: grid + right panel ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Storyboard content area */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Grid view ── */}
          {viewMode === "grid" && (
            <div className={`grid ${cols} gap-3`}>
              {shots.map((shot, idx) => (
                <div
                  key={shot.id}
                  draggable
                  onDragStart={() => onDragStart(shot.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(shot.id)}
                  onClick={() => onSelectShot(shot.id === selectedShotId ? null : shot.id)}
                  onDoubleClick={() => onOpenSceneEditor(shot.id)}
                  className={`group bg-[#16161f] rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                    selectedShotId === shot.id ? "border-white/60" : "border-transparent hover:border-white/20"
                  }`}
                >
                  <div className={`${boardSettings.frameFormat === "1:1" ? "aspect-square" : "aspect-video"} bg-[#1e1e2a] flex items-center justify-center relative`}>
                    {shot.imageUrl
                      ? <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-7 h-7 text-gray-700" />
                    }
                    {boardSettings.showFrameNumbers && (
                      <div className="absolute bottom-1.5 left-2 text-[10px] text-white/70 font-mono">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                    )}
                    {shot.ert && (
                      <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[10px] text-white/50">
                        <Clock className="w-2.5 h-2.5" /> {shot.ert}
                      </div>
                    )}
                    {shot.comments.length > 0 && (
                      <div className="absolute top-1.5 right-2 flex items-center gap-0.5 text-[10px] text-white/50">
                        <MessageSquare className="w-2.5 h-2.5" /> {shot.comments.length}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    {boardSettings.showTags && shot.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        <Hash className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                        {shot.tags.map(t => (
                          <span key={t.id} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold text-white ${tagPillClass(t.name)}`}>{t.name}</span>
                        ))}
                      </div>
                    )}
                    {boardSettings.showScript && (
                      <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-500">
                        <List className="w-2.5 h-2.5 shrink-0" /> script
                      </div>
                    )}
                    {boardSettings.showAction && shot.action && (
                      <div className="flex items-start gap-1 text-[10px] text-gray-400 leading-relaxed">
                        <span className="text-gray-600 shrink-0 mt-0.5">↑</span>
                        <span className="line-clamp-3">{shot.action || shot.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={onAddShot}
                className={`${boardSettings.frameFormat === "1:1" ? "aspect-square" : "aspect-video"} bg-[#16161f] border-2 border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-white/20 hover:bg-white/2 transition`}>
                <Plus className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600 text-xs">Add frame</span>
              </button>
            </div>
          )}

          {/* ── Script view (pic5) ── */}
          {viewMode === "script" && (
            <div className="space-y-0">
              {/* Column headers */}
              <div className="flex items-center border-b border-white/6 pb-2 mb-2 text-gray-500 text-xs font-medium">
                <div className="w-8 shrink-0">#</div>
                <div className="w-52 shrink-0">Image</div>
                <div className="flex-1 flex items-center gap-1"><FileText className="w-3 h-3" /> script</div>
                <div className="flex-1 flex items-center gap-1"><Play className="w-3 h-3" /> Action</div>
              </div>
              {shots.map((shot, idx) => (
                <div
                  key={shot.id}
                  onClick={() => onSelectShot(shot.id === selectedShotId ? null : shot.id)}
                  onDoubleClick={() => onOpenSceneEditor(shot.id)}
                  className={`flex items-stretch border-2 rounded-xl mb-3 cursor-pointer transition overflow-hidden ${
                    selectedShotId === shot.id ? "border-white/60 bg-[#16161f]" : "border-white/6 bg-[#12121a] hover:border-white/15"
                  }`}
                >
                  {/* Left toolbar */}
                  <div className="w-7 shrink-0 bg-[#0e0e15] flex flex-col items-center py-3 gap-2 text-gray-700">
                    <GripVertical className="w-3 h-3" />
                    <Camera className="w-3 h-3" />
                    <Lightbulb className="w-3 h-3" />
                    <MoreHorizontal className="w-3 h-3" />
                  </div>

                  {/* Frame number + duration + tags */}
                  <div className="w-52 shrink-0 flex flex-col">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/4">
                      <span className="text-white font-bold text-sm font-mono">{String(idx + 1).padStart(2, "0")}</span>
                      {shot.ert && (
                        <span className="flex items-center gap-0.5 text-gray-500 text-[10px]">
                          <Clock className="w-2.5 h-2.5" /> {shot.ert}
                        </span>
                      )}
                      {shot.tags.map(t => (
                        <span key={t.id} className={`px-1.5 py-0.5 rounded text-[9px] font-semibold text-white ${tagPillClass(t.name)}`}>{t.name}</span>
                      ))}
                    </div>
                    {/* Image */}
                    <div className="flex-1 bg-[#1e1e2a] flex items-center justify-center min-h-[120px]">
                      {shot.imageUrl
                        ? <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <ImageIcon className="w-8 h-8 text-gray-700" />
                      }
                    </div>
                  </div>

                  {/* Script column */}
                  <div className="flex-1 border-l border-white/4 p-3">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {shot.voiceOver || shot.description || <span className="text-gray-700 italic">No script</span>}
                    </p>
                  </div>

                  {/* Action column */}
                  <div className="flex-1 border-l border-white/4 p-3">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {shot.action || <span className="text-gray-700 italic">No action</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

                    
          {/* ── Video mode (pic7/pic8) ── */}
          {viewMode === "video" && (
            <div className="flex flex-col h-full">
              {/* Filmstrip row */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {shots.map((shot, idx) => (
                  <button key={shot.id} onClick={() => onSelectShot(shot.id)}
                    className={`shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      selectedShotId === shot.id ? "border-blue-500" : "border-transparent hover:border-white/20"
                    }`} style={{ width: 100 }}>
                    <div className="aspect-video bg-[#1e1e2a] flex items-center justify-center relative">
                      {shot.imageUrl
                        ? <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-gray-700 text-[9px]">.mov</span>
                      }
                      <div className="absolute top-0.5 left-1 text-[8px] text-white/60 font-mono">{shot.ert || "00:00"}</div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white/70 text-center py-0.5 font-mono">{String(idx + 1).padStart(2, "0")}</div>
                    </div>
                  </button>
                ))}
                <button className="shrink-0 w-[100px] aspect-video bg-[#16161f] border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center hover:border-white/20 transition">
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Video player area */}
              <div className="flex-1 bg-[#0a0a10] rounded-xl flex items-center justify-center relative min-h-[300px]">
                {selectedShot?.imageUrl
                  ? <img src={selectedShot.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                  : <div className="text-gray-700 flex flex-col items-center gap-2"><Film className="w-12 h-12" /><span className="text-xs">No video</span></div>
                }
              </div>

              {/* Timeline + playback controls */}
              <div className="mt-3 space-y-2">
                {/* Timeline bar */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full w-1/4 bg-blue-500 rounded-full" />
                    <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                </div>
                {/* Controls */}
                <div className="flex items-center gap-3 text-gray-400">
                  <button className="hover:text-white transition"><Play className="w-4 h-4" /></button>
                  <button className="hover:text-white transition"><Square className="w-3.5 h-3.5" /></button>
                  <span className="text-xs font-mono">00:00 / {selectedShot?.ert || "00:00"}</span>
                  <div className="flex-1" />
                  <span className="text-xs">Sync playhead</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: comments ── */}
        <div className="w-64 border-l border-white/6 flex flex-col bg-[#111118] shrink-0">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
            <div className="flex gap-1">
              {(["selected", "all"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => onCommentTabChange(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition capitalize ${
                    commentTab === tab ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "selected" ? "Selected file" : "All comments"}
                </button>
              ))}
            </div>
            <button className="text-gray-500 hover:text-white transition text-xs">Filter</button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-3">
            {commentTab === "selected" && !selectedShot && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <MessageSquare className="w-8 h-8 text-gray-700" />
                <p className="text-gray-600 text-xs">There are no comments yet</p>
              </div>
            )}
            {commentTab === "selected" && selectedShot && selectedShot.comments.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <MessageSquare className="w-8 h-8 text-gray-700" />
                <p className="text-gray-600 text-xs">No comments on this frame</p>
              </div>
            )}
            {commentTab === "selected" && selectedShot && selectedShot.comments.map(c => (
              <div key={c.id} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">{c.avatar}</div>
                  <span className="text-white text-xs font-medium">{c.author}</span>
                  <span className="text-gray-600 text-[10px] ml-auto">{c.timestamp}</span>
                </div>
                <p className="text-gray-300 text-xs ml-8 leading-relaxed">{c.text}</p>
              </div>
            ))}
            {commentTab === "all" && allComments.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <MessageSquare className="w-8 h-8 text-gray-700" />
                <p className="text-gray-600 text-xs">No comments yet</p>
              </div>
            )}
            {commentTab === "all" && allComments.map(c => (
              <div key={c.id} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">{c.avatar}</div>
                  <span className="text-white text-xs font-medium">{c.author}</span>
                  <span className="text-gray-500 text-[10px]">Frame {c.shotNum}</span>
                  <span className="text-gray-600 text-[10px] ml-auto">{c.timestamp}</span>
                </div>
                <p className="text-gray-300 text-xs ml-8 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="p-3 border-t border-white/6 shrink-0">
            <div className="flex items-center gap-2 bg-[#1c1c26] border border-white/10 rounded-xl px-3 py-2">
              <input
                value={commentText}
                onChange={e => onCommentTextChange(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onAddComment()}
                placeholder="Leave a comment..."
                className="flex-1 bg-transparent text-white text-xs placeholder-gray-600 focus:outline-none"
              />
              <button onClick={onAddComment} aria-label="Send comment" className="text-blue-400 hover:text-blue-300 transition">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Board settings panel (pic3 style) */}
        {showBoardSettings && (
          <div className="w-60 border-l border-white/6 flex flex-col bg-[#111118] shrink-0">
            <div className="px-4 py-3 border-b border-white/6 shrink-0">
              <span className="text-white text-sm font-semibold">Board settings</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* Field rows with drag handle + icon + label + checkbox */}
              {([
                { key: "showNotes" as const,    icon: StickyNote, label: "Notes",    color: "text-yellow-400" },
                { key: "showScript" as const,   icon: FileText,   label: "script",   color: "text-blue-400"   },
                { key: "showAction" as const,   icon: Play,       label: "Action",   color: "text-green-400"  },
                { key: "showCamera" as const,   icon: Camera,     label: "Camera",   color: "text-violet-400" },
                { key: "showLighting" as const, icon: Lightbulb,  label: "Lighting", color: "text-orange-400" },
              ] as const).map(({ key, icon: Icon, label, color }) => (
                <div key={key} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 group">
                  <GripVertical className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-500 cursor-grab shrink-0" />
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />
                  <span className="flex-1 text-gray-300 text-xs">{label}</span>
                  <button
                    onClick={() => onBoardSettingsChange({ ...boardSettings, [key]: !boardSettings[key] })}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                      boardSettings[key]
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-600 bg-transparent"
                    }`}
                  >
                    {boardSettings[key] && <CheckSquare className="w-3 h-3 text-white" />}
                  </button>
                </div>
              ))}

              <div className="border-t border-white/6 my-2" />

              {/* Frame format */}
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-gray-300 text-xs">Frame format 1:1</span>
                <button
                  onClick={() => onBoardSettingsChange({
                    ...boardSettings,
                    frameFormat: boardSettings.frameFormat === "1:1" ? "16:9" : "1:1",
                  })}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    boardSettings.frameFormat === "1:1"
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-600 bg-transparent"
                  }`}
                >
                  {boardSettings.frameFormat === "1:1" && <CheckSquare className="w-3 h-3 text-white" />}
                </button>
              </div>

              {/* Show tags */}
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-gray-300 text-xs">Show tags</span>
                <button
                  onClick={() => onBoardSettingsChange({ ...boardSettings, showTags: !boardSettings.showTags })}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    boardSettings.showTags ? "bg-blue-600 border-blue-600" : "border-gray-600 bg-transparent"
                  }`}
                >
                  {boardSettings.showTags && <CheckSquare className="w-3 h-3 text-white" />}
                </button>
              </div>

              {/* Show icons */}
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-gray-300 text-xs">Show icons</span>
                <button
                  onClick={() => onBoardSettingsChange({ ...boardSettings, showIcons: !boardSettings.showIcons })}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    boardSettings.showIcons ? "bg-blue-600 border-blue-600" : "border-gray-600 bg-transparent"
                  }`}
                >
                  {boardSettings.showIcons && <CheckSquare className="w-3 h-3 text-white" />}
                </button>
              </div>

              {/* Show frame numbers */}
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-gray-300 text-xs">Show frame numbers</span>
                <button
                  onClick={() => onBoardSettingsChange({ ...boardSettings, showFrameNumbers: !boardSettings.showFrameNumbers })}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    boardSettings.showFrameNumbers ? "bg-blue-600 border-blue-600" : "border-gray-600 bg-transparent"
                  }`}
                >
                  {boardSettings.showFrameNumbers && <CheckSquare className="w-3 h-3 text-white" />}
                </button>
              </div>

              {/* Reviewer can edit notes */}
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-gray-300 text-xs">Reviewer can edit notes</span>
                <button
                  aria-label="Toggle reviewer can edit notes"
                  className="w-4 h-4 rounded border border-gray-600 bg-transparent flex items-center justify-center transition"
                />
              </div>

              <div className="border-t border-white/6 my-2" />

              {/* Restore default settings */}
              <button
                onClick={() => onBoardSettingsChange({
                  showNotes: true, showScript: true, showAction: true,
                  showCamera: false, showLighting: false, showTags: true,
                  showIcons: true, showFrameNumbers: true, frameFormat: "16:9",
                })}
                className="flex items-center gap-2 px-2 py-2 text-gray-500 hover:text-gray-300 text-xs transition w-full"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore default settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
