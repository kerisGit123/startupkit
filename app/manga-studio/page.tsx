"use client";

import { useState } from "react";
import { Save, Sparkles, Download, Settings, BookOpen, Plus, ChevronDown, Repeat, Edit3, Trash2, Image as ImageIcon, Grid3x3, LayoutGrid, Book, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMangaStudioUI } from "./MangaStudioUIContext";
import { SettingsModal } from "./components/modals/SettingsModal";
import { AIGenerationModal } from "./components/modals/AIGenerationModal";

export default function MangaStudioPage() {
  const pathname = usePathname();
  const { openNewEpisode, openStoryManager } = useMangaStudioUI();
  const [showSettings, setShowSettings] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [hasEpisode, setHasEpisode] = useState(true);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const [selectedPage, setSelectedPage] = useState(1);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showPageComposer, setShowPageComposer] = useState(false);
  const [stageDirection, setStageDirection] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("standard-vertical");
  const [editingPanelId, setEditingPanelId] = useState<number | null>(null);
  const [activeBuilderTab, setActiveBuilderTab] = useState("characters");

  const handleCreateFirstEpisode = () => {
    openNewEpisode();
  };

  const [panels] = useState([
    { id: 1, title: "Scene 1: Opening Shot", characters: ["Kaito"], location: "Basketball Court", time: "Dawn", stageDirection: "Basketball court at dawn. Empty bleachers. Morning light streaming through windows. Kaito stands alone, dribbling the ball.", dialogue: "Kaito: \"This is where it all begins... my journey to become the best.\"" },
    { id: 2, title: "Scene 2: Determination", characters: ["Kaito"], location: "Basketball Court", time: "Dawn", stageDirection: "Close-up of Kaito's face, sweat dripping, eyes focused and determined.", dialogue: "" },
  ]);

  const pages = [
    { id: 1, number: 1, panelCount: 8, template: "standard" },
    { id: 2, number: 2, panelCount: 0, template: "standard" },
    { id: 3, number: 3, panelCount: 0, template: "standard" },
  ];

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

  const [selectedProps, setSelectedProps] = useState<string[]>([]);

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

  const navItems = [
    { name: "Manga Editor", href: "/manga-studio", icon: BookOpen },
    { name: "Episodes", href: "/manga-studio/episodes", icon: Layers },
    { name: "Universe Manager", href: "/manga-studio/universe", icon: Book },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="h-14 bg-[#13131a] border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    isActive
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => setShowQuickStart(!showQuickStart)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-gray-400 hover:text-gray-300 hover:bg-white/5"
            >
              <BookOpen className="w-4 h-4" />
              Quick Start Guide
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => setShowAIGeneration(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
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
            <div className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col">
              {/* Episode Selector */}
              <div className="p-3 border-b border-white/5">
                <label className="text-xs font-semibold text-gray-400 mb-2 block">Episode</label>
                <div className="relative">
                  <button
                    onClick={() => setShowEpisodeDropdown(!showEpisodeDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#13131a] text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/10 transition border border-purple-500/20"
                  >
                    <span>Episode 1</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showEpisodeDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            openStoryManager();
                            setShowEpisodeDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition flex items-center gap-2"
                        >
                          <Repeat className="w-4 h-4" />
                          Switch Story
                        </button>
                      </div>
                      <div className="border-t border-white/10 p-2">
                        {episodes.map((ep) => (
                          <button
                            key={ep.id}
                            onClick={() => setShowEpisodeDropdown(false)}
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
                            openNewEpisode();
                            setShowEpisodeDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          New Episode
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Page Selector */}
              <div className="p-3 border-b border-white/5">
                <label className="text-xs font-semibold text-gray-400 mb-2 block">Page</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPageDropdown(!showPageDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#13131a] text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition border border-blue-500/20"
                  >
                    <span>Page {selectedPage}</span>
                    <ChevronDown className="w-4 h-4" />
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

              {/* Panel Sequence */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-400">Panel Sequence</label>
                  <button
                    onClick={() => setEditingPanelId(null)}
                    className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs font-medium transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {panels.map((panel, index) => (
                    <button
                      key={panel.id}
                      onClick={() => setEditingPanelId(panel.id)}
                      className={`w-full p-3 rounded-lg border-2 transition text-left ${
                        editingPanelId === panel.id
                          ? "bg-purple-500/10 border-purple-500"
                          : "bg-[#13131a] border-white/10 hover:border-purple-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="text-xs font-medium text-white">{panel.title}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {panel.characters.map((char) => (
                          <span key={char} className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                            {char}
                          </span>
                        ))}
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

          {/* Center - Page Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 bg-[#1a1f2e] p-8 overflow-auto">
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
                <div className="max-w-2xl mx-auto">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-base">Page {selectedPage}</h3>
                      <p className="text-gray-400 text-xs">Webtoon Format</p>
                    </div>
                    <button
                      onClick={() => setShowPageComposer(true)}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition flex items-center gap-2"
                    >
                      <LayoutGrid className="w-3 h-3" />
                      Change Layout
                    </button>
                  </div>
                  <div className="bg-[#252b3a] rounded-xl border-2 border-dashed border-white/10 h-[500px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex flex-col p-3 gap-2">
                      {selectedTemplate === "standard-vertical" && (
                        <>
                          <div className="flex-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Panel 1</span>
                          </div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Panel 2</span>
                          </div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Panel 3</span>
                          </div>
                        </>
                      )}
                      {selectedTemplate === "hero-panel" && (
                        <>
                          <div className="flex-[2] bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Hero Panel</span>
                          </div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Panel 2</span>
                          </div>
                          <div className="flex-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">Panel 3</span>
                          </div>
                        </>
                      )}
                      {selectedTemplate === "full-scroll" && (
                        <div className="flex-1 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                          <span className="text-xs text-gray-500">Full Panel</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
                      <p className="text-xs font-medium text-gray-400">{templates.find(t => t.id === selectedTemplate)?.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Panel Builder */}
          {hasEpisode && (
            <div className="w-[380px] bg-[#13131a] border-l border-white/5 flex flex-col">
              <div className="p-3 border-b border-white/5">
                <h3 className="text-white font-bold text-sm">Panel Builder</h3>
                <p className="text-xs text-gray-400 mt-1">Scene {editingPanelId || panels.length + 1} • Page {selectedPage}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveBuilderTab("characters")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    activeBuilderTab === "characters"
                      ? "text-orange-400 border-b-2 border-orange-400 bg-orange-500/10"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Characters
                </button>
                <button
                  onClick={() => setActiveBuilderTab("scene")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    activeBuilderTab === "scene"
                      ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Scene
                </button>
                <button
                  onClick={() => setActiveBuilderTab("props")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    activeBuilderTab === "props"
                      ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Props
                </button>
                <button
                  onClick={() => setActiveBuilderTab("time")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition ${
                    activeBuilderTab === "time"
                      ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Time
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-4">
                  {/* Characters Tab */}
                  {activeBuilderTab === "characters" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Select Characters</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCharacters.map((charId) => {
                          const char = characters.find(c => c.id === charId);
                          return char ? (
                            <button
                              key={charId}
                              onClick={() => setSelectedCharacters(prev => prev.filter(id => id !== charId))}
                              className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition flex items-center gap-2"
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
                            className={`p-2 rounded-lg border transition text-left ${
                              selectedCharacters.includes(char.id)
                                ? "bg-orange-500/10 border-orange-500/30 opacity-50"
                                : "bg-[#1a1a24] border-white/10 hover:border-orange-500/30"
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
                        <button className="p-2 border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-lg text-center transition">
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
                        <button className="p-2 border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-lg text-center transition">
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
                        <button className="p-2 border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-lg text-center transition">
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
                        <img src={referenceImage} alt="Reference" className="w-full h-24 object-cover rounded-lg" />
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
                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" />
                  {editingPanelId ? "Update Panel" : "Generate Panel"}
                </button>
                {editingPanelId && (
                  <button 
                    onClick={() => setEditingPanelId(null)}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition text-sm"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
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
    </>
  );
}
