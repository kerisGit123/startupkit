"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Settings, BookOpen, Plus, ChevronDown, Repeat, Trash2, Image as ImageIcon, Grid3x3, LayoutGrid, SlidersHorizontal, Download, FileText, RefreshCw, Archive, Timer, Save, GripHorizontal, Keyboard, ChevronLeft, ChevronRight, X as XIcon, Pencil } from "lucide-react";
import { useMangaStudioUI } from "./MangaStudioUIContext";
import { SettingsModal } from "./components/modals/SettingsModal";
import { AIGenerationModal } from "./components/modals/AIGenerationModal";
import { NewPageModal } from "./components/modals/NewPageModal";
import { AssetGeneratorModal } from "./components/modals/AssetGeneratorModal";
import { NewEpisodeModal } from "./components/modals/NewEpisodeModal";

export default function MangaStudioPage() {
  const { openNewEpisode, openStoryManager } = useMangaStudioUI();
  const [showSettings, setShowSettings] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [hasEpisode] = useState(true);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const [selectedPage, setSelectedPage] = useState(1);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showLayoutTemplates, setShowLayoutTemplates] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [showAssetGenerator, setShowAssetGenerator] = useState(false);
  const [assetGeneratorType, setAssetGeneratorType] = useState<"character" | "location" | "prop" | "scene">("character");
  const [currentEpisode, setCurrentEpisode] = useState("Episode 1");
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [stageDirection, setStageDirection] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("standard-vertical");
  const [editingPanelId, setEditingPanelId] = useState<number | null>(null);
  const [activeBuilderTab, setActiveBuilderTab] = useState("characters");
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [techniqueActive, setTechniqueActive] = useState(false);
  const [panelType, setPanelType] = useState("none");
  const [framing, setFraming] = useState("none");
  const [mangaAngle, setMangaAngle] = useState("none");
  const [inkStyle, setInkStyle] = useState("none");
  const [moodTone, setMoodTone] = useState("none");
  const [showBatchQueue, setShowBatchQueue] = useState(false);
  const [batchJobs, setBatchJobs] = useState<{id:number;panel:string;status:string;thumb:string}[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [pageStatus, setPageStatus] = useState<"queued"|"drawing"|"review"|"approved"|"redo">("drawing");
  const [showTimeline, setShowTimeline] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [styleModel, setStyleModel] = useState("nano-banana");
  const [panelEditorMode, setPanelEditorMode] = useState<"canvas" | "editing">("canvas");
  const [activeTool, setActiveTool] = useState<"select" | "paint" | "bubble" | null>(null);
  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(24);
  const [isPainting, setIsPainting] = useState(false);
  const [paintMask, setPaintMask] = useState<{x:number;y:number;r:number}[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [panelOrder, setPanelOrder] = useState<number[]>([]);

  const handleCreateFirstEpisode = () => {
    openNewEpisode();
  };

  const handleCreatePage = (pageName: string, template: string) => {
    console.log("Creating page:", pageName, template);
    // Add page creation logic here
  };

  const handleEpisodeChange = (episodeName: string) => {
    setCurrentEpisode(episodeName);
    setShowEpisodeDropdown(false);
  };

  const openAssetGenerator = (type: "character" | "location" | "prop" | "scene") => {
    setAssetGeneratorType(type);
    setShowAssetGenerator(true);
  };

  const [panels] = useState([
    { id: 1, title: "Scene 1: Opening Shot", characters: ["Kaito"], location: "Basketball Court", time: "Dawn", stageDirection: "Basketball court at dawn. Empty bleachers. Morning light streaming through windows. Kaito stands alone, dribbling the ball.", dialogue: "Kaito: \"This is where it all begins... my journey to become the best.\"" },
    { id: 2, title: "Scene 2: Determination", characters: ["Kaito"], location: "Basketball Court", time: "Dawn", stageDirection: "Close-up of Kaito's face, sweat dripping, eyes focused and determined.", dialogue: "" },
  ]);

  const presets = [
    { id: 1, name: "Action Dunk", characters: ["kaito"], location: "basketball-court", time: "afternoon", direction: "Dynamic dunk shot with speed lines", icon: "🏀" },
    { id: 2, name: "Rooftop Sunset", characters: ["kaito", "ryu"], location: "school-hallway", time: "evening", direction: "Characters on rooftop looking at sunset", icon: "🌅" },
    { id: 3, name: "Training Montage", characters: ["kaito"], location: "gym", time: "morning", direction: "Intense training sequence, sweat drops", icon: "💪" },
  ];

  const navigatePanel = useCallback((direction: "prev" | "next") => {
    const currentIndex = panels.findIndex(p => p.id === editingPanelId);
    if (direction === "next") {
      const nextPanel = panels[currentIndex + 1] || panels[0];
      setEditingPanelId(nextPanel.id);
    } else {
      const prevPanel = panels[currentIndex - 1] || panels[panels.length - 1];
      setEditingPanelId(prevPanel.id);
    }
  }, [panels, editingPanelId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "g") {
        e.preventDefault();
        const newJob = { id: Date.now(), panel: `Panel ${panels.length + 1}`, status: "generating", thumb: "" };
        setBatchJobs(prev => [newJob, ...prev]);
        setShowBatchQueue(true);
        setTimeout(() => {
          setBatchJobs(prev => prev.map(j => j.id === newJob.id ? {...j, status: "done"} : j));
        }, 3000);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (!document.activeElement || document.activeElement === document.body) {
          e.preventDefault();
          navigatePanel("prev");
        }
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (!document.activeElement || document.activeElement === document.body) {
          e.preventDefault();
          navigatePanel("next");
        }
      }
      if (e.key === "?") {
        setShowShortcutHint(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panels, navigatePanel]);

  const pages = [
    { id: 1, number: 1, panelCount: 8, template: "standard", status: "drawing" as const },
    { id: 2, number: 2, panelCount: 0, template: "standard", status: "queued" as const },
    { id: 3, number: 3, panelCount: 0, template: "standard", status: "queued" as const },
  ];

  const pageStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    queued: { label: "Queued", color: "text-gray-400", bg: "bg-gray-500/10" },
    drawing: { label: "Drawing", color: "text-blue-400", bg: "bg-blue-500/10" },
    review: { label: "Review", color: "text-orange-400", bg: "bg-orange-500/10" },
    approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    redo: { label: "Redo", color: "text-red-400", bg: "bg-red-500/10" },
  };

  const locations = [
    { id: "basketball-court", name: "Basketball Court", type: "Outdoor", thumbnail: "🏀" },
    { id: "school-hallway", name: "School Hallway", type: "Indoor", thumbnail: "🏫" },
    { id: "kaito-room", name: "Kaito's Room", type: "Indoor", thumbnail: "🛏️" },
    { id: "gym", name: "Training Gym", type: "Indoor", thumbnail: "💪" },
  ];

  const props = [
    { id: "basketball", name: "Basketball", category: "Sports", thumbnail: "🏀" },
    { id: "backpack", name: "School Backpack", category: "School", thumbnail: "🎒" },
    { id: "water-bottle", name: "Water Bottle", category: "Items", thumbnail: "💧" },
  ];

  const times = [
    { id: "dawn", name: "Dawn" },
    { id: "morning", name: "Morning" },
    { id: "afternoon", name: "Afternoon" },
    { id: "evening", name: "Evening" },
    { id: "night", name: "Night" },
  ];

  const templates = [
    { id: "standard-vertical", name: "Standard Vertical", icon: LayoutGrid, description: "3-panel webtoon", preview: "Vertical scroll optimized" },
    { id: "hero-panel", name: "Hero Panel", icon: Grid3x3, description: "Large + small panels", preview: "Impact moments" },
    { id: "full-scroll", name: "Full Scroll", icon: LayoutGrid, description: "Single column", preview: "Mobile-friendly" },
  ];

  const episodes = [
    { id: 1, title: "Episode 1: The Beginning", pages: 12, status: "Current" },
    { id: 2, title: "Episode 2: First Match", pages: 10, status: "Draft" },
    { id: 3, title: "Episode 3: Training Arc", pages: 0, status: "Planned" },
  ];

  const characters = [
    { id: "kaito", name: "Kaito", avatar: "K" },
    { id: "ryu", name: "Ryu", avatar: "R" },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar - Clean & Minimal */}
        <div className="h-16 bg-gradient-to-r from-[#1a1a24] to-[#1f1f2a] border-b border-white/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            {/* Page Title */}
            <div>
              <h1 className="text-white font-bold text-xl">Manga Editor</h1>
              <p className="text-xs text-gray-400 mt-0.5">Build pages & panels</p>
            </div>
            
            {/* Episode Info with Switch */}
            {hasEpisode && (
              <>
                <div className="h-8 w-px bg-white/10"></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{currentEpisode}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-base text-white font-semibold">Basketball Dreams</span>
                  </div>
                  <button
                    onClick={openStoryManager}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-purple-500/20"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    Switch
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            {hasEpisode && (
              <button
                onClick={() => setShowQuickStart(!showQuickStart)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Quick Start
              </button>
            )}

            {/* Export Dropdown */}
            {hasEpisode && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-orange-500/20"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition flex items-center gap-3">
                      <FileText className="w-4 h-4 text-red-400" />Export as PDF
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition flex items-center gap-3">
                      <ImageIcon className="w-4 h-4 text-blue-400" />Export as PNG
                    </button>
                    <button className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition flex items-center gap-3">
                      <Archive className="w-4 h-4 text-purple-400" />Export as CBZ
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setShowAIGeneration(true)}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition flex items-center justify-center"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Episode, Page, Panel Sequence */}
          {hasEpisode && (
            <div className="w-72 bg-[#13131a] border-r border-white/10 flex flex-col">
              {/* Episode Selector */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Episode</label>
                  <button
                    onClick={() => setShowNewEpisode(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Episode
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowEpisodeDropdown(!showEpisodeDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a24] text-white rounded-lg text-sm font-semibold hover:bg-[#1f1f2a] transition-all duration-200 border border-white/10 hover:border-purple-500/30 group"
                  >
                    <span>Episode 1</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition" />
                  </button>
                  {showEpisodeDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        {episodes.map((ep) => (
                          <button
                            key={ep.id}
                            onClick={() => handleEpisodeChange(ep.title.split(":")[0])}
                            className="w-full px-3 py-2 text-left hover:bg-white/5 rounded-lg transition"
                          >
                            <div className="text-sm font-medium text-white">{ep.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{ep.pages} pages • {ep.status}</div>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/10 p-2">
                        <button
                          onClick={() => {
                            setShowNewEpisode(true);
                            setShowEpisodeDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          + New Episode
                        </button>
                      </div>
                      <div className="border-t border-white/10 p-2">
                        <button
                          onClick={() => {
                            openStoryManager();
                            setShowEpisodeDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/5 rounded-lg transition flex items-center gap-2"
                        >
                          <Repeat className="w-4 h-4" />
                          Switch Story
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Selector */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Page</label>
                  <button
                    onClick={() => setShowNewPage(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Page
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowPageDropdown(!showPageDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a24] text-white rounded-lg text-sm font-semibold hover:bg-[#1f1f2a] transition-all duration-200 border border-white/10 hover:border-blue-500/30 group"
                  >
                    <span>Page {selectedPage}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition" />
                  </button>
                  {showPageDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        {pages.map((page) => (
                          <button
                            key={page.id}
                            onClick={() => {
                              setSelectedPage(page.number);
                              setShowPageDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left rounded-lg transition mb-1 ${
                              selectedPage === page.number
                                ? "bg-blue-500/20 text-blue-400"
                                : "text-gray-300 hover:bg-white/5"
                            }`}
                          >
                            <div className="text-sm font-medium">Page {page.number}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{page.panelCount} panels</div>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-white/10 p-2">
                        <button className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add New Page
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel Sequence — Detail Editor (sidebar) */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Panel Editor</label>
                    <p className="text-[9px] text-gray-600 mt-0.5">Click to edit content &amp; details</p>
                  </div>
                  <button
                    onClick={() => setEditingPanelId(null)}
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border border-purple-500/20 hover:scale-105"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Panel
                  </button>
                </div>
                <div className="space-y-2">
                  {panels.map((panel, index) => (
                    <button
                      key={panel.id}
                      onClick={() => { setEditingPanelId(panel.id); setPanelEditorMode("editing"); }}
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                        editingPanelId === panel.id
                          ? "bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10 scale-[1.02]"
                          : "bg-[#1a1a24] border-white/10 hover:border-white/20 hover:bg-[#1f1f2a] hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="text-xs font-medium text-white">{panel.title}</div>
                        </div>
                        <Pencil className={`w-3 h-3 shrink-0 ${editingPanelId === panel.id ? "text-purple-400" : "text-gray-600"}`} />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {panel.characters.map((char) => (
                          <span key={char} className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                            {char}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">{panel.location}</span>
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px]">{panel.time}</span>
                      </div>
                      <div className="text-xs text-gray-400 line-clamp-2 mb-1">{panel.stageDirection}</div>
                      {panel.dialogue && (
                        <div className="text-xs text-gray-500 italic line-clamp-1">{panel.dialogue}</div>
                      )}
                    </button>
                  ))}
                  <button className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition">
                    <Plus className="w-6 h-6 mx-auto text-purple-400 mb-1" />
                    <div className="text-purple-400 text-xs font-medium">Add New Panel</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Center - Page Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
            <div className="flex-1 p-6 overflow-auto">
              {!hasEpisode ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Welcome to Manga Studio</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      Start by creating episodes, building your universe, or generating panels with AI
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={handleCreateFirstEpisode}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
                      >
                        Create First Episode
                      </button>
                      <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-semibold transition">
                        Explore Universe
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-white font-bold text-lg">Page {selectedPage}</h3>
                        <p className="text-gray-400 text-sm">Webtoon Format • 3 Panels</p>
                      </div>
                      <select
                        value={pageStatus}
                        onChange={(e) => setPageStatus(e.target.value as typeof pageStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border appearance-none cursor-pointer focus:outline-none ${pageStatusConfig[pageStatus]?.bg} ${pageStatusConfig[pageStatus]?.color} border-white/10`}
                      >
                        <option value="queued">Queued</option>
                        <option value="drawing">Drawing</option>
                        <option value="review">Review</option>
                        <option value="approved">Approved</option>
                        <option value="redo">Redo</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setShowLayoutTemplates(true)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Change Layout
                    </button>
                  </div>

                  {/* Canvas Toolbar — Paint Brush, Select, Bubble */}
                  <div className="flex items-center gap-1 mb-3 bg-[#13131a] rounded-lg border border-white/10 p-1.5">
                    <span className="text-[9px] text-gray-500 uppercase font-semibold px-2">Tools</span>
                    <div className="w-px h-5 bg-white/10" />
                    <button onClick={() => { setActiveTool(activeTool === "select" ? null : "select"); if (panelEditorMode !== "editing" && editingPanelId) setPanelEditorMode("editing"); }}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition flex items-center gap-1.5 ${activeTool === "select" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 hover:bg-purple-500/10 text-gray-400 hover:text-purple-400"}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      Select
                    </button>
                    <button onClick={() => { setActiveTool(activeTool === "paint" ? null : "paint"); if (panelEditorMode !== "editing" && editingPanelId) setPanelEditorMode("editing"); }}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition flex items-center gap-1.5 ${activeTool === "paint" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400"}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Paint Mask
                    </button>
                    <button onClick={() => { setActiveTool(activeTool === "bubble" ? null : "bubble"); if (panelEditorMode !== "editing" && editingPanelId) setPanelEditorMode("editing"); }}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition flex items-center gap-1.5 ${activeTool === "bubble" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400"}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Bubble
                    </button>
                    {/* Brush size slider — visible when paint tool active */}
                    {activeTool === "paint" && (
                      <>
                        <div className="w-px h-5 bg-white/10" />
                        <div className="flex items-center gap-2 px-2">
                          <span className="text-[8px] text-gray-500">Brush</span>
                          <input type="range" min={4} max={64} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-20 h-1 accent-blue-500 cursor-pointer" />
                          <span className="text-[9px] text-blue-400 font-mono w-5">{brushSize}</span>
                          {paintMask.length > 0 && (
                            <button onClick={() => setPaintMask([])} className="px-2 py-0.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded text-[8px] transition">Clear</button>
                          )}
                        </div>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      {panelEditorMode === "editing" && (
                        <button onClick={() => { setPanelEditorMode("canvas"); setActiveTool(null); setInpaintPrompt(""); setPaintMask([]); }}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md text-[10px] font-medium transition">
                          ← Back to Canvas
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Canvas / Panel Editor */}
                  {panelEditorMode === "editing" && editingPanelId ? (
                    <div className="bg-[#13131a] rounded-2xl border border-white/10 h-[600px] flex flex-col overflow-hidden shadow-2xl">
                      {/* Panel Image Area with paint mask overlay */}
                      <div className="flex-1 relative bg-[#0a0a0f] overflow-hidden"
                        style={{ cursor: activeTool === "paint" ? "crosshair" : activeTool === "select" ? "crosshair" : "default" }}
                        onMouseDown={(e) => {
                          if (activeTool === "paint") {
                            setIsPainting(true);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPaintMask(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, r: brushSize }]);
                          }
                        }}
                        onMouseMove={(e) => {
                          if (isPainting && activeTool === "paint") {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPaintMask(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, r: brushSize }]);
                          }
                        }}
                        onMouseUp={() => setIsPainting(false)}
                        onMouseLeave={() => setIsPainting(false)}
                      >
                        {/* Simulated panel image */}
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-[#13131a] to-blue-900/20 flex items-center justify-center relative">
                          <div className="text-center z-10 pointer-events-none">
                            <div className="text-6xl mb-3">{editingPanelId === 1 ? "🌅" : "👁️"}</div>
                            <p className="text-sm text-gray-400 font-medium">{panels.find(p => p.id === editingPanelId)?.title}</p>
                            <p className="text-xs text-gray-600 mt-1 max-w-sm">{panels.find(p => p.id === editingPanelId)?.stageDirection}</p>
                          </div>

                          {/* Blue paint mask overlay (like pic3) */}
                          {paintMask.length > 0 && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: "normal" }}>
                              {paintMask.map((dot, i) => (
                                <circle key={i} cx={dot.x} cy={dot.y} r={dot.r / 2} fill="rgba(59, 130, 246, 0.45)" />
                              ))}
                            </svg>
                          )}

                          {/* Paint tool hint */}
                          {activeTool === "paint" && paintMask.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/60 px-4 py-2 rounded-lg border border-blue-500/30">
                                <p className="text-[11px] text-blue-400 font-medium">Paint over the area you want to edit</p>
                                <p className="text-[9px] text-gray-500 mt-0.5">Click &amp; drag to paint a mask, then type a prompt below</p>
                              </div>
                            </div>
                          )}

                          {/* Select tool hint */}
                          {activeTool === "select" && (
                            <div className="absolute inset-8 border-2 border-dashed border-purple-500/40 rounded-lg flex items-center justify-center pointer-events-none">
                              <div className="bg-black/60 px-3 py-1.5 rounded-lg"><span className="text-[10px] text-purple-400">Click &amp; drag to select area</span></div>
                            </div>
                          )}

                          {/* Bubble overlay */}
                          {activeTool === "bubble" && (
                            <div className="absolute top-8 right-8 bg-white rounded-2xl rounded-br-sm px-4 py-2 shadow-lg border border-gray-200 max-w-[160px] z-20">
                              <p className="text-[11px] text-gray-800 font-medium">{panels.find(p => p.id === editingPanelId)?.dialogue || "Click to place bubble..."}</p>
                            </div>
                          )}

                          {/* Area Selected indicator (when mask painted) */}
                          {paintMask.length > 0 && (
                            <div className="absolute bottom-3 left-3 z-20">
                              <div className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-semibold flex items-center gap-1.5 shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Area Selected
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Prompt Bar — shown when paint mask exists or select tool active */}
                      {(activeTool === "paint" || activeTool === "select") && (
                        <div className="border-t border-white/10 bg-[#1a1a24] px-4 py-3">
                          {paintMask.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[9px] font-semibold flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" /> Area Selected
                              </div>
                              <span className="text-[9px] text-gray-500">Describe what you want to add, remove or replace</span>
                              <button onClick={() => setPaintMask([])} className="ml-auto text-[9px] text-gray-500 hover:text-red-400 transition">Clear mask</button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input type="text" value={inpaintPrompt} onChange={(e) => setInpaintPrompt(e.target.value)}
                              placeholder="Describe what you want to add, remove or replace..."
                              className="flex-1 px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                            <button disabled={paintMask.length === 0} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />Apply AI Edit
                            </button>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {["Remove object", "Change expression", "Add details", "Enhance area", "Replace background"].map(q => (
                              <button key={q} onClick={() => setInpaintPrompt(q)} className="px-2 py-1 bg-white/5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded text-[9px] transition">{q}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bubble editing bar */}
                      {activeTool === "bubble" && (
                        <div className="border-t border-white/10 bg-[#1a1a24] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <input type="text" placeholder="Type dialogue text..."
                              className="flex-1 px-3 py-2.5 bg-[#0f1117] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
                            <div className="flex gap-1">
                              {["Speech", "Thought", "Shout", "Whisper"].map(bt => (
                                <button key={bt} className="px-2.5 py-1.5 bg-white/5 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded text-[9px] transition">{bt}</button>
                              ))}
                            </div>
                            <button className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition">Place</button>
                          </div>
                        </div>
                      )}

                      {/* No active tool — quick actions */}
                      {!activeTool && (
                        <div className="border-t border-white/10 bg-[#1a1a24] px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-gray-400">Select a tool to start editing</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setActiveTool("paint")} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-semibold transition border border-blue-500/20 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              Paint &amp; AI Edit
                            </button>
                            <button className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-semibold transition border border-purple-500/20">Regenerate</button>
                            <button className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold transition border border-emerald-500/20">Enhance with AI</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#13131a] rounded-2xl border border-white/10 h-[600px] flex items-center justify-center relative overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 flex flex-col p-4 gap-3">
                        {panels.map((panel, idx) => (
                          <div key={panel.id}
                            onClick={() => { setEditingPanelId(panel.id); setPanelEditorMode("editing"); }}
                            className={`flex-1 bg-[#1a1a24] rounded-lg border cursor-pointer transition-all group relative overflow-hidden ${
                              editingPanelId === panel.id ? "border-purple-500/50 ring-1 ring-purple-500/20" : "border-white/10 hover:border-purple-500/30"
                            }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-sm text-gray-400 font-medium group-hover:text-white transition">Panel {idx + 1}</span>
                                <p className="text-[9px] text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition">Click to edit with AI tools</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                        <p className="text-sm font-semibold text-gray-500">{templates.find(t => t.id === selectedTemplate)?.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Strip - Below Canvas (Drag to reorder, visually distinct) */}
            {hasEpisode && showTimeline && (
              <div className="h-24 bg-[#0a0a0f] border-t-2 border-purple-500/20 flex flex-col shrink-0">
                <div className="flex items-center justify-between px-4 py-1 bg-[#0f1117]">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3 h-3 text-purple-400" />
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Timeline</span>
                    <span className="text-[8px] text-gray-600">— Drag panels to reorder sequence</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => navigatePanel("prev")} className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 transition"><ChevronLeft className="w-3 h-3" /></button>
                    <span className="text-[9px] text-gray-500 font-mono">{panels.findIndex(p => p.id === editingPanelId) + 1}/{panels.length}</span>
                    <button onClick={() => navigatePanel("next")} className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 transition"><ChevronRight className="w-3 h-3" /></button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button onClick={() => setShowTimeline(false)} className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 transition"><XIcon className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-1 px-3 overflow-x-auto">
                  {panels.map((panel, i) => (
                    <div
                      key={panel.id}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => {
                        if (dragIdx !== null && dragIdx !== i) {
                          const newOrder = [...(panelOrder.length ? panelOrder : panels.map((_, idx) => idx))];
                          const [moved] = newOrder.splice(dragIdx, 1);
                          newOrder.splice(i, 0, moved);
                          setPanelOrder(newOrder);
                        }
                        setDragIdx(null);
                      }}
                      onDragEnd={() => setDragIdx(null)}
                      onClick={() => { setEditingPanelId(panel.id); setPanelEditorMode("editing"); }}
                      className={`shrink-0 h-[52px] rounded-md border transition-all cursor-grab active:cursor-grabbing flex items-center gap-0 overflow-hidden ${
                        dragIdx === i ? "opacity-50 scale-95 border-purple-500" :
                        editingPanelId === panel.id
                          ? "border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10 w-36"
                          : "border-white/5 bg-[#13131a] hover:border-white/15 w-28"
                      }`}
                    >
                      <div className="w-6 h-full bg-purple-500/10 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0 border-r border-white/5">
                        {i + 1}
                      </div>
                      <div className="flex-1 px-1.5 py-1 min-w-0">
                        <div className="text-[9px] text-white font-semibold truncate">{panel.title.replace("Scene ", "").replace(": ", " ")}</div>
                        <div className="text-[7px] text-gray-500 truncate">{panel.characters.join(", ")}</div>
                      </div>
                      <GripHorizontal className="w-3 h-3 text-gray-700 shrink-0 mr-1" />
                    </div>
                  ))}
                  <button className="shrink-0 h-[52px] w-12 rounded-md border border-dashed border-white/10 hover:border-purple-500/30 flex items-center justify-center transition">
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Panel Builder */}
          {hasEpisode && (
            <div className="w-[400px] bg-[#13131a] border-l border-white/10 flex flex-col">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-base">Panel Builder</h3>
                    <p className="text-xs text-gray-400 mt-1">Scene {editingPanelId || panels.length + 1} • Page {selectedPage}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowPresets(!showPresets)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${showPresets ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5"}`}>
                      <Save className="w-3 h-3" />Presets
                    </button>
                    <button onClick={() => setShowShortcutHint(!showShortcutHint)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition" title="Keyboard Shortcuts (?)">
                      <Keyboard className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Presets Panel */}
                {showPresets && (
                  <div className="mt-3 space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Quick Presets</label>
                    {presets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedCharacters(preset.characters);
                          setSelectedLocation(preset.location);
                          setSelectedTime(preset.time);
                          setStageDirection(preset.direction);
                          setShowPresets(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 bg-[#1a1a24] hover:bg-[#1f1f2a] border border-white/5 rounded-lg transition text-left"
                      >
                        <span className="text-lg">{preset.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-white">{preset.name}</div>
                          <div className="text-[9px] text-gray-500 truncate">{preset.direction}</div>
                        </div>
                      </button>
                    ))}
                    <button className="w-full p-2 border border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition">
                      <span className="text-[10px] text-purple-400 font-medium">+ Save Current as Preset</span>
                    </button>
                  </div>
                )}
                {/* Keyboard Shortcuts Hint */}
                {showShortcutHint && (
                  <div className="mt-3 bg-[#1a1a24] rounded-lg border border-white/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Keyboard Shortcuts</span>
                      <button onClick={() => setShowShortcutHint(false)} className="text-gray-500 hover:text-white"><XIcon className="w-3 h-3" /></button>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between"><span className="text-gray-400">Generate Panel</span><kbd className="px-1.5 py-0.5 bg-white/5 rounded text-purple-400 font-mono">Ctrl+G</kbd></div>
                      <div className="flex justify-between"><span className="text-gray-400">Previous Panel</span><kbd className="px-1.5 py-0.5 bg-white/5 rounded text-purple-400 font-mono">← / ↑</kbd></div>
                      <div className="flex justify-between"><span className="text-gray-400">Next Panel</span><kbd className="px-1.5 py-0.5 bg-white/5 rounded text-purple-400 font-mono">→ / ↓</kbd></div>
                      <div className="flex justify-between"><span className="text-gray-400">Toggle Shortcuts</span><kbd className="px-1.5 py-0.5 bg-white/5 rounded text-purple-400 font-mono">?</kbd></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 bg-[#0f1117]">
                <button
                  onClick={() => setActiveBuilderTab("characters")}
                  className={`flex-1 px-4 py-3 text-xs font-semibold transition ${
                    activeBuilderTab === "characters"
                      ? "text-orange-400 border-b-2 border-orange-400 bg-[#13131a]"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#13131a]"
                  }`}
                >
                  Characters
                </button>
                <button
                  onClick={() => setActiveBuilderTab("scene")}
                  className={`flex-1 px-4 py-3 text-xs font-semibold transition ${
                    activeBuilderTab === "scene"
                      ? "text-blue-400 border-b-2 border-blue-400 bg-[#13131a]"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#13131a]"
                  }`}
                >
                  Scene
                </button>
                <button
                  onClick={() => setActiveBuilderTab("props")}
                  className={`flex-1 px-4 py-3 text-xs font-semibold transition ${
                    activeBuilderTab === "props"
                      ? "text-emerald-400 border-b-2 border-emerald-400 bg-[#13131a]"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#13131a]"
                  }`}
                >
                  Props
                </button>
                <button
                  onClick={() => setActiveBuilderTab("time")}
                  className={`flex-1 px-4 py-3 text-xs font-semibold transition ${
                    activeBuilderTab === "time"
                      ? "text-purple-400 border-b-2 border-purple-400 bg-[#13131a]"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#13131a]"
                  }`}
                >
                  Time
                </button>
                <button
                  onClick={() => setActiveBuilderTab("advanced")}
                  className={`flex-1 px-4 py-3 text-xs font-semibold transition flex items-center justify-center gap-1 ${
                    activeBuilderTab === "advanced"
                      ? "text-pink-400 border-b-2 border-pink-400 bg-[#13131a]"
                      : "text-gray-400 hover:text-gray-300 hover:bg-[#13131a]"
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Advanced
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Characters Tab */}
                  {activeBuilderTab === "characters" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Select Characters</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCharacters.map((charId) => {
                          const char = characters.find(c => c.id === charId);
                          return char ? (
                            <button
                              key={charId}
                              onClick={() => setSelectedCharacters(prev => prev.filter(id => id !== charId))}
                              className="px-3 py-2 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-semibold hover:bg-orange-500/20 transition flex items-center gap-2 border border-orange-500/20"
                            >
                              {char.name}
                              <span className="text-orange-300">×</span>
                            </button>
                          ) : null;
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {characters.map((char) => (
                          <button
                            key={char.id}
                            onClick={() => {
                              if (!selectedCharacters.includes(char.id)) {
                                setSelectedCharacters(prev => [...prev, char.id]);
                              }
                            }}
                            disabled={selectedCharacters.includes(char.id)}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                              selectedCharacters.includes(char.id)
                                ? "bg-orange-500/10 border-orange-500 text-orange-400"
                                : "bg-[#1a1a24] border-white/10 text-gray-300 hover:border-white/20 hover:bg-[#1f1f2a]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs">
                                {char.avatar}
                              </div>
                              <span className="text-xs font-medium text-white">{char.name}</span>
                            </div>
                          </button>
                        ))}
                        <button 
                          onClick={() => openAssetGenerator("character")}
                          className="p-2 border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-lg text-center transition"
                        >
                          <Plus className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                          <div className="text-orange-400 text-xs font-medium">Add</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scene Tab */}
                  {activeBuilderTab === "scene" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Select Location</label>
                      {selectedLocation && (
                        <div className="mb-2">
                          <button
                            onClick={() => setSelectedLocation("")}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition flex items-center gap-2"
                          >
                            {locations.find(l => l.id === selectedLocation)?.thumbnail} {locations.find(l => l.id === selectedLocation)?.name}
                            <span className="text-blue-300">×</span>
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {locations.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => setSelectedLocation(loc.id)}
                            disabled={selectedLocation === loc.id}
                            className={`p-2 rounded-lg border transition text-left ${
                              selectedLocation === loc.id
                                ? "bg-blue-500/10 border-blue-500/30 opacity-50"
                                : "bg-[#1a1a24] border-white/10 hover:border-blue-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{loc.thumbnail}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">{loc.name}</div>
                                <div className="text-xs text-gray-400">{loc.type}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        <button 
                          onClick={() => openAssetGenerator("location")}
                          className="p-2 border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-lg text-center transition"
                        >
                          <Plus className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                          <div className="text-blue-400 text-xs font-medium">Add</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Props Tab */}
                  {activeBuilderTab === "props" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Select Props</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedProps.map((propId) => {
                          const prop = props.find(p => p.id === propId);
                          return prop ? (
                            <button
                              key={propId}
                              onClick={() => setSelectedProps(prev => prev.filter(id => id !== propId))}
                              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition flex items-center gap-2"
                            >
                              {prop.thumbnail} {prop.name}
                              <span className="text-emerald-300">×</span>
                            </button>
                          ) : null;
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {props.map((prop) => (
                          <button
                            key={prop.id}
                            onClick={() => {
                              if (!selectedProps.includes(prop.id)) {
                                setSelectedProps(prev => [...prev, prop.id]);
                              }
                            }}
                            disabled={selectedProps.includes(prop.id)}
                            className={`p-2 rounded-lg border transition text-left ${
                              selectedProps.includes(prop.id)
                                ? "bg-emerald-500/10 border-emerald-500/30 opacity-50"
                                : "bg-[#1a1a24] border-white/10 hover:border-emerald-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{prop.thumbnail}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">{prop.name}</div>
                                <div className="text-xs text-gray-400">{prop.category}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                        <button 
                          onClick={() => openAssetGenerator("prop")}
                          className="p-2 border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-lg text-center transition"
                        >
                          <Plus className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                          <div className="text-emerald-400 text-xs font-medium">Add</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Time Tab */}
                  {activeBuilderTab === "time" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Select Time</label>
                      <div className="grid grid-cols-3 gap-2">
                        {times.map((time) => (
                          <button
                            key={time.id}
                            onClick={() => setSelectedTime(time.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                              selectedTime === time.id
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                                : "bg-[#1a1a24] text-gray-300 border border-white/10 hover:border-purple-500/30"
                            }`}
                          >
                            {time.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advanced Tab - Manga Techniques */}
                  {activeBuilderTab === "advanced" && (
                    <div>
                      {/* Style Transfer Model */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Style Transfer Model</label>
                        <select value={styleModel} onChange={(e) => setStyleModel(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                          <option value="nano-banana">Nano Banana (Recommended)</option>
                          <option value="flux-pro">Flux Pro</option>
                          <option value="sdxl">SDXL 1.0</option>
                          <option value="sd3">Stable Diffusion 3</option>
                          <option value="dalle3">DALL-E 3</option>
                          <option value="midjourney">Midjourney v6</option>
                        </select>
                        <p className="text-[9px] text-gray-500 mt-1">Nano Banana provides best manga style consistency with character LoRA support.</p>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Manga Techniques</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={techniqueActive}
                            onChange={(e) => setTechniqueActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                          <span className="ml-2 text-[10px] text-gray-400">{techniqueActive ? "Active" : "None"}</span>
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-3">Override drawing style for this panel. When &quot;None&quot;, engine uses project defaults.</p>

                      <div className={`space-y-3 transition-opacity ${techniqueActive ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Panel Type</label>
                            <select value={panelType} onChange={(e) => setPanelType(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[11px] text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                              <option value="none">None (Auto)</option>
                              <option value="action">Action / Fight</option>
                              <option value="emotion">Emotion / Romance</option>
                              <option value="establishing">Establishing</option>
                              <option value="dramatic">Dramatic Reveal</option>
                              <option value="reaction">Reaction Shot</option>
                              <option value="flashback">Flashback</option>
                              <option value="impact">Impact Moment</option>
                              <option value="splash">Splash Page</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Framing</label>
                            <select value={framing} onChange={(e) => setFraming(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[11px] text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                              <option value="none">None (Auto)</option>
                              <option value="extreme-close">Extreme Close-up</option>
                              <option value="close">Close-up (face)</option>
                              <option value="bust">Bust Shot (chest up)</option>
                              <option value="waist">Waist Shot</option>
                              <option value="full">Full Body</option>
                              <option value="wide">Wide / Establishing</option>
                              <option value="two-shot">Two-Shot</option>
                              <option value="group">Group Shot</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Angle</label>
                            <select value={mangaAngle} onChange={(e) => setMangaAngle(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[11px] text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                              <option value="none">None (Auto)</option>
                              <option value="eye-level">Eye Level</option>
                              <option value="dramatic-up">Dramatic Up</option>
                              <option value="birds-eye">Bird&apos;s Eye</option>
                              <option value="dutch">Dutch Tilt</option>
                              <option value="over-shoulder">Over Shoulder</option>
                              <option value="silhouette">Silhouette</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Ink Style</label>
                            <select value={inkStyle} onChange={(e) => setInkStyle(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[11px] text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                              <option value="none">None (Auto)</option>
                              <option value="clean">Clean Lines</option>
                              <option value="hatching">Cross-Hatching</option>
                              <option value="screentone">Screentone</option>
                              <option value="ink-wash">Ink Wash</option>
                              <option value="sketch">Rough Sketch</option>
                              <option value="thick">Thick Bold</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Mood / Tone</label>
                            <select value={moodTone} onChange={(e) => setMoodTone(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[11px] text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                              <option value="none">None (Auto)</option>
                              <option value="intense">Intense / Hype</option>
                              <option value="calm">Calm / Peaceful</option>
                              <option value="dark">Dark / Ominous</option>
                              <option value="comedic">Comedic / Light</option>
                              <option value="romantic">Romantic / Tender</option>
                              <option value="melancholy">Melancholy / Sad</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stage Direction / Action - Always Visible */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Stage Direction / Action</label>
                    <textarea
                      value={stageDirection}
                      onChange={(e) => setStageDirection(e.target.value)}
                      placeholder="Basketball court at dawn. Empty bleachers. Morning light streaming through windows. Kaito stands alone, dribbling the ball."
                      className="w-full h-20 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Dialogue - Always Visible */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Dialogue (Optional)</label>
                    <textarea
                      value={dialogue}
                      onChange={(e) => setDialogue(e.target.value)}
                      placeholder='Kaito: "This is where it all begins... my journey to become the best."'
                      className="w-full h-16 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Reference Image - Always Visible */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Reference Image (Optional)</label>
                    {referenceImage ? (
                      <div className="relative">
                        <div className="w-full h-24 bg-purple-900/10 rounded-lg border border-white/10 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-purple-400/30" />
                        </div>
                        <button
                          onClick={() => setReferenceImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button className="w-full p-3 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition">
                        <ImageIcon className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                        <div className="text-purple-400 text-xs font-medium">Upload Reference</div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Fixed at Bottom */}
              <div className="p-3 border-t border-white/5 space-y-2">
                {editingPanelId ? (
                  <>
                    <button
                      onClick={() => {
                        // Update panel data only (no image regeneration)
                        console.log("Updating panel data:", editingPanelId);
                      }}
                      className="w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Update Panel
                    </button>
                    <button
                      onClick={() => {
                        const newJob = {
                          id: Date.now(),
                          panel: `Panel ${editingPanelId}`,
                          status: "generating",
                          thumb: "",
                        };
                        setBatchJobs(prev => [newJob, ...prev]);
                        setShowBatchQueue(true);
                        setTimeout(() => {
                          setBatchJobs(prev => prev.map(j => j.id === newJob.id ? {...j, status: "done"} : j));
                        }, 3000);
                      }}
                      className="w-full px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm border border-orange-500/20"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate Panel
                    </button>
                    <button 
                      onClick={() => setEditingPanelId(null)}
                      className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition text-sm"
                    >
                      Cancel Edit
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const newJob = {
                        id: Date.now(),
                        panel: `Panel ${panels.length + 1}`,
                        status: "generating",
                        thumb: "",
                      };
                      setBatchJobs(prev => [newJob, ...prev]);
                      setShowBatchQueue(true);
                      setTimeout(() => {
                        setBatchJobs(prev => prev.map(j => j.id === newJob.id ? {...j, status: "done"} : j));
                      }, 3000);
                    }}
                    className="w-full px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Variations
                  </button>
                )}
              </div>

              {/* Batch Generation Queue */}
              {showBatchQueue && batchJobs.length > 0 && (
                <div className="border-t border-white/5">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-400">Generation Queue</label>
                      <button
                        onClick={() => setShowBatchQueue(false)}
                        className="text-[10px] text-gray-500 hover:text-gray-300 transition"
                      >Hide</button>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {batchJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-2 bg-[#0f1117] rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'generating' ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
                            <span className="text-[11px] text-white">{job.panel}</span>
                          </div>
                          <span className={`text-[10px] font-semibold ${
                            job.status === 'generating' ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {job.status === 'generating' ? 'Running...' : 'Done'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <AIGenerationModal
        isOpen={showAIGeneration}
        onClose={() => setShowAIGeneration(false)}
        onSelectOption={() => {
          setShowAIGeneration(false);
        }}
      />

      {/* Layout Templates Modal */}
      {showLayoutTemplates && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-6xl shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-xl">Webtoon Layout Templates</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Vertical scroll optimized for mobile</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLayoutTemplates(false)}
                  className="w-10 h-10 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-3 gap-6">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setShowLayoutTemplates(false);
                    }}
                    className={`group relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                      selectedTemplate === template.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 hover:border-purple-500/50 bg-[#13131a]"
                    }`}
                  >
                    <div className="aspect-[9/16] bg-[#0f1117] p-4 flex flex-col gap-2">
                      {template.id === "standard-vertical" && (
                        <>
                          <div className="flex-1 bg-white/5 rounded border border-white/10"></div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10"></div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10"></div>
                        </>
                      )}
                      {template.id === "hero-panel" && (
                        <>
                          <div className="flex-[2] bg-white/5 rounded border border-white/10"></div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10"></div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10"></div>
                        </>
                      )}
                      {template.id === "full-scroll" && (
                        <div className="flex-1 bg-white/5 rounded border border-white/10"></div>
                      )}
                    </div>
                    <div className="p-4 border-t border-white/10">
                      <h3 className="text-white font-semibold text-sm mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-400">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Guide Modal */}
      {showQuickStart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] rounded-xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">QUICK START GUIDE</h2>
                <button
                  onClick={() => setShowQuickStart(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full text-left px-4 py-3 bg-[#252530] hover:bg-[#2a2a35] rounded-lg border border-white/10 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <span className="text-white font-medium group-hover:text-purple-400 transition">Create Story & Episodes</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-[#252530] hover:bg-[#2a2a35] rounded-lg border border-white/10 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <span className="text-white font-medium group-hover:text-blue-400 transition">Build Assets </span>
                    <span className="text-blue-400 text-sm">(Characters, Scenes)</span>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-[#252530] hover:bg-[#2a2a35] rounded-lg border border-white/10 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <span className="text-white font-medium group-hover:text-emerald-400 transition">Generate Panels</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-[#252530] hover:bg-[#2a2a35] rounded-lg border border-white/10 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                    4
                  </div>
                  <span className="text-white font-medium group-hover:text-orange-400 transition">Compose Pages</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewPageModal
        isOpen={showNewPage}
        onClose={() => setShowNewPage(false)}
        onCreatePage={handleCreatePage}
      />
      
      <AssetGeneratorModal
        isOpen={showAssetGenerator}
        onClose={() => setShowAssetGenerator(false)}
        assetType={assetGeneratorType}
      />
      
      <NewEpisodeModal
        isOpen={showNewEpisode}
        onClose={() => setShowNewEpisode(false)}
      />
    </>
  );
}
