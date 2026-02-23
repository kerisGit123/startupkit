"use client";

import { useState } from "react";
import { Check, X, RefreshCw, Download, Image as ImageIcon, Eye, Layers, Search, Filter, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type ShotVisibility = "active" | "inactive" | "trash";
type ShotStatus = "queued" | "drawing" | "review" | "approved" | "redo";

interface StoryboardShot {
  id: number;
  shot: string;
  project: number;
  scene: number;
  shotType: string;
  description: string;
  artStyle: string;
  ratio: string;
  status: ShotStatus;
  visibility: ShotVisibility;
}

export default function GenerationManagerScene() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState<"active" | "all" | "inactive" | "trash">("active");

  const [shots, setShots] = useState<StoryboardShot[]>([
    { id: 1, shot: "Shot 1", project: 1, scene: 1, shotType: "Establishing", description: "Basketball court at dawn. Empty bleachers. Morning light streaming...", artStyle: "Shonen", ratio: "3:4", status: "review", visibility: "active" },
    { id: 2, shot: "Shot 2", project: 1, scene: 1, shotType: "Close-up", description: "Extreme close-up of Kaito's eyes — sweat drops, intense focus. Hatchi...", artStyle: "Shonen", ratio: "3:4", status: "review", visibility: "active" },
    { id: 3, shot: "Shot 3", project: 1, scene: 1, shotType: "Wide Shot", description: "Full scene wide establishing shot. The entire basketball court from...", artStyle: "Shonen", ratio: "16:9", status: "drawing", visibility: "active" },
    { id: 4, shot: "Shot 4", project: 1, scene: 2, shotType: "Two-Shot", description: "Kaito and Ryu face each other. Split-shot composition — half for each...", artStyle: "Seinen", ratio: "3:4", status: "queued", visibility: "active" },
    { id: 5, shot: "Shot 5", project: 1, scene: 2, shotType: "Action", description: "Dynamic action — Kaito drives past defenders with speed lines and...", artStyle: "Shonen", ratio: "3:4", status: "approved", visibility: "active" },
    { id: 6, shot: "Shot 6", project: 2, scene: 1, shotType: "Establishing", description: "Morning gym — team warming up. Kaito enters in oversized uniform.", artStyle: "Shonen", ratio: "3:4", status: "queued", visibility: "active" },
    { id: 7, shot: "Shot 7", project: 2, scene: 1, shotType: "Action", description: "Montage — Kaito failing at drills. Ball bouncing off foot, tripping.", artStyle: "Shonen", ratio: "3:4", status: "queued", visibility: "active" },
    { id: 8, shot: "Shot 8", project: 2, scene: 2, shotType: "Close-up", description: "Ryu watches from the doorway. Arms crossed. Small smile.", artStyle: "Seinen", ratio: "3:4", status: "queued", visibility: "inactive" },
  ]);

  const handleApprove = (shotId: number) => {
    setShots(prev => prev.map(p => p.id === shotId ? { ...p, status: "approved" as const } : p));
  };
  const handleRedo = (shotId: number) => {
    setShots(prev => prev.map(p => p.id === shotId ? { ...p, status: "redo" as const } : p));
  };
  const handleRegenerate = (shotId: number) => {
    setShots(prev => prev.map(p => p.id === shotId ? { ...p, status: "drawing" as const } : p));
    setTimeout(() => {
      setShots(prev => prev.map(p => p.id === shotId ? { ...p, status: "review" as const } : p));
    }, 2000);
  };
  const toggleVisibility = (shotId: number) => {
    setShots(prev => prev.map(p => {
      if (p.id !== shotId) return p;
      return { ...p, visibility: p.visibility === "active" ? "inactive" as const : "active" as const };
    }));
  };
  const trashShot = (shotId: number) => {
    setShots(prev => prev.map(p => p.id === shotId ? { ...p, visibility: "trash" as const } : p));
  };

  const statusConfig: Record<ShotStatus, { label: string; color: string; bg: string }> = {
    queued: { label: "Queued", color: "text-gray-400", bg: "bg-gray-500/10" },
    drawing: { label: "Drawing...", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    review: { label: "Review", color: "text-blue-400", bg: "bg-blue-500/10" },
    approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    redo: { label: "Redo", color: "text-orange-400", bg: "bg-orange-500/10" },
  };

  const filtered = shots.filter(p => {
    if (filterVisibility !== "all" && p.visibility !== filterVisibility) return false;
    if (filterProject !== "all" && p.project !== Number(filterProject)) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (searchQuery && !p.description.toLowerCase().includes(searchQuery.toLowerCase()) && !p.shot.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const approvedCount = shots.filter(p => p.status === "approved" && p.visibility === "active").length;
  const activeCount = shots.filter(p => p.visibility === "active").length;
  const projects = [...new Set(shots.map(p => p.project))].sort();

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Shot Manager</h1>
              <p className="text-xs text-gray-400 mt-0.5">Manage projects, scenes & shots — activate, review, or trash</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a24] rounded-lg border border-white/10">
              <span className="text-xs text-gray-400">Progress:</span>
              <div className="w-32 h-2 bg-[#0f1117] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${activeCount > 0 ? (approvedCount / activeCount) * 100 : 0}%` }} />
              </div>
              <span className="text-xs text-emerald-400 font-semibold">{approvedCount}/{activeCount}</span>
            </div>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
              <Download className="w-4 h-4" />Export Scenes
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search shots..."
              className="w-full pl-9 pr-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
          </div>
          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-2.5 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
              <option value="all">All Projects</option>
              {projects.map(ep => <option key={ep} value={ep}>Project {ep}</option>)}
            </select>
          </div>
          {/* Status Filter */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-2.5 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="drawing">Drawing</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="redo">Redo</option>
          </select>
          {/* Visibility Filter */}
          <div className="flex gap-1 ml-auto">
            {(["active", "inactive", "trash", "all"] as const).map(v => (
              <button key={v} onClick={() => setFilterVisibility(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${filterVisibility === v ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                {v} {v === "active" && `(${shots.filter(p => p.visibility === "active").length})`}
                {v === "inactive" && `(${shots.filter(p => p.visibility === "inactive").length})`}
                {v === "trash" && `(${shots.filter(p => p.visibility === "trash").length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-8">#</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3">Shot</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-20">Project</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-16">Scene</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-24">Type</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-20">Style</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-16">Ratio</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 pr-3 w-24">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shot, index) => {
                const sc = statusConfig[shot.status];
                const isInactive = shot.visibility === "inactive";
                const isTrashed = shot.visibility === "trash";
                return (
                  <tr key={shot.id} className={`border-b border-white/5 hover:bg-white/5 transition ${isInactive ? "opacity-50" : ""} ${isTrashed ? "opacity-30 line-through" : ""}`}>
                    <td className="py-3 pr-3"><span className="text-xs text-gray-500 font-mono">{index + 1}</span></td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-14 bg-[#1a1a24] rounded border border-white/10 flex items-center justify-center shrink-0"><ImageIcon className="w-3.5 h-3.5 text-gray-600" /></div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white">{shot.shot}</div>
                          <div className="text-[10px] text-gray-500 line-clamp-1">{shot.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3"><span className="text-xs text-gray-300">Ep {shot.project}</span></td>
                    <td className="py-3 pr-3"><span className="text-xs text-gray-300">Pg {shot.scene}</span></td>
                    <td className="py-3 pr-3"><span className="text-xs text-gray-300">{shot.shotType}</span></td>
                    <td className="py-3 pr-3"><span className="text-xs text-gray-300">{shot.artStyle}</span></td>
                    <td className="py-3 pr-3"><span className="text-xs text-gray-300">{shot.ratio}</span></td>
                    <td className="py-3 pr-3">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded ${sc.bg} ${sc.color}`}>
                        {shot.status === "drawing" && <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse mr-1.5 align-middle" />}
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {shot.status === "review" && (
                          <>
                            <button onClick={() => handleApprove(shot.id)} className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition" title="Approve"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleRedo(shot.id)} className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded transition" title="Redo"><X className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                        <button onClick={() => handleRegenerate(shot.id)} className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded transition" title="Redraw"><RefreshCw className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded transition" title="Preview"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => toggleVisibility(shot.id)} className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded transition" title={isInactive ? "Activate" : "Deactivate"}>
                          {isInactive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                        <button onClick={() => trashShot(shot.id)} className="p-1.5 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded transition" title="Trash"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No shots match your filters</p>
              <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
