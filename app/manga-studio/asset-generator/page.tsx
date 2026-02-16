"use client";

import { useState } from "react";
import { Sparkles, Upload, Wand2, Image as ImageIcon, X, ChevronDown, Plus, Palette, Check, Trash2, MapPin, Clapperboard } from "lucide-react";

interface ArtStyle {
  id: string;
  name: string;
  desc: string;
  isCustom?: boolean;
}

interface GenerationJob {
  id: number;
  type: string;
  style: string;
  status: "generating" | "done" | "failed";
  variations: number;
  timestamp: string;
}

export default function AssetGeneratorPage() {
  const [activeTab, setActiveTab] = useState<"character" | "location" | "scene" | "prop">("character");
  const [description, setDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("manga-shonen");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [showStylePopup, setShowStylePopup] = useState(false);
  const [showCustomStyleForm, setShowCustomStyleForm] = useState(false);
  const [customStyleName, setCustomStyleName] = useState("");
  const [customStyleDesc, setCustomStyleDesc] = useState("");
  const [generationHistory, setGenerationHistory] = useState<GenerationJob[]>([]);
  const quantity = 4;

  const tabs = [
    { id: "character" as const, name: "Characters", icon: "character" },
    { id: "location" as const, name: "Locations", icon: "location" },
    { id: "scene" as const, name: "Scenes", icon: "scene" },
    { id: "prop" as const, name: "Props & Tools", icon: "prop" },
  ];

  const [styles, setStyles] = useState<ArtStyle[]>([
    { id: "manga-shonen", name: "Manga (Shonen)", desc: "Action-packed, bold lines, speed effects" },
    { id: "manga-seinen", name: "Manga (Seinen)", desc: "Detailed, mature, realistic proportions" },
    { id: "manga-shojo", name: "Manga (Shojo)", desc: "Soft lines, emotional, decorative tones" },
    { id: "western-comic", name: "Western Comic", desc: "Bold inks, strong shadows, superhero style" },
    { id: "noir", name: "Noir", desc: "High contrast B&W, dramatic shadows, gritty" },
    { id: "toon", name: "Toon / Cartoon", desc: "Simplified shapes, bright colors, fun" },
    { id: "watercolor", name: "Watercolor / Illustration", desc: "Soft washes, painted textures, organic" },
    { id: "webtoon", name: "Webtoon", desc: "Clean digital art, full color, vertical scroll" },
    { id: "ink-color", name: "Inking & Coloring", desc: "Traditional ink + flat/cel color" },
  ]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newJob: GenerationJob = {
      id: Date.now(),
      type: activeTab,
      style: styles.find(s => s.id === selectedStyle)?.name || selectedStyle,
      status: "generating",
      variations: quantity,
      timestamp: new Date().toLocaleTimeString(),
    };
    setGenerationHistory(prev => [newJob, ...prev]);
    setTimeout(() => {
      setGeneratedVariations(Array.from({ length: quantity }, (_, i) => `variation-${i + 1}`));
      setIsGenerating(false);
      setGenerationHistory(prev => prev.map(j => j.id === newJob.id ? { ...j, status: "done" as const } : j));
    }, 2500);
  };

  const handleAddCustomStyle = () => {
    if (!customStyleName.trim()) return;
    const newStyle: ArtStyle = { id: `custom-${Date.now()}`, name: customStyleName, desc: customStyleDesc || "Custom user style", isCustom: true };
    setStyles(prev => [...prev, newStyle]);
    setSelectedStyle(newStyle.id);
    setCustomStyleName("");
    setCustomStyleDesc("");
    setShowCustomStyleForm(false);
  };

  const handleDeleteCustomStyle = (styleId: string) => {
    setStyles(prev => prev.filter(s => s.id !== styleId));
    if (selectedStyle === styleId) setSelectedStyle("manga-shonen");
  };

  const currentStyle = styles.find(s => s.id === selectedStyle);

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Asset Generator</h1>
              <p className="text-xs text-gray-400 mt-0.5">Generate manga-ready characters, locations, scenes & props</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 font-semibold">Credits: 150</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column (3 cols) */}
            <div className="lg:col-span-3 space-y-5">
              {/* Asset Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Asset Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`p-3 rounded-lg border-2 transition text-center ${activeTab === tab.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-[#1a1a24] hover:border-white/20"}`}>
                      <div className="flex justify-center mb-1">
                        {tab.icon === "character" && <span className="text-xl">👤</span>}
                        {tab.icon === "location" && <MapPin className="w-5 h-5 text-emerald-400" />}
                        {tab.icon === "scene" && <Clapperboard className="w-5 h-5 text-blue-400" />}
                        {tab.icon === "prop" && <span className="text-xl">⚔️</span>}
                      </div>
                      <div className="text-xs font-semibold text-white">{tab.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={activeTab === "character" ? "A young basketball player with spiky hair, intense eyes, athletic build. Wearing a red jersey #7..." : activeTab === "location" ? "Old wooden basketball gymnasium, high ceiling with exposed beams, worn wooden floor..." : activeTab === "scene" ? "Dawn practice scene — empty court, morning light through tall windows, dust particles..." : "Vintage leather basketball, worn grip texture, scuff marks, team logo faded..."}
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none" rows={4} />
                <p className="text-xs text-gray-500 mt-1.5">Be specific about appearance, style, mood, and key features</p>
              </div>

              {/* Art Style Popup */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Art Style</label>
                <div className="relative">
                  <button onClick={() => setShowStylePopup(!showStylePopup)} className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a24] border border-white/10 rounded-lg hover:border-emerald-500/30 transition">
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">{currentStyle?.name}</div>
                        <div className="text-xs text-gray-400">{currentStyle?.desc}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showStylePopup ? "rotate-180" : ""}`} />
                  </button>
                  {showStylePopup && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[420px] overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Select Art Style</span>
                        <button onClick={() => { setShowCustomStyleForm(true); setShowStylePopup(false); }} className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"><Plus className="w-3 h-3" />Create Custom</button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2">
                        <div className="grid grid-cols-2 gap-2">
                          {styles.map((style) => (
                            <button key={style.id} onClick={() => { setSelectedStyle(style.id); setShowStylePopup(false); }}
                              className={`p-3 rounded-lg border transition text-left relative group ${selectedStyle === style.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 hover:border-white/20 bg-[#0f1117]"}`}>
                              <div className="text-sm font-semibold text-white mb-0.5">{style.name}</div>
                              <div className="text-xs text-gray-400">{style.desc}</div>
                              {selectedStyle === style.id && <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-emerald-400" /></div>}
                              {style.isCustom && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomStyle(style.id);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteCustomStyle(style.id);
                                    }
                                  }}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  aria-label={`Delete custom style ${style.name}`}
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </span>
                              )}
                              {style.isCustom && <div className="mt-1"><span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">Custom</span></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Reference Image (Optional)</label>
                <div className="border-2 border-dashed border-white/15 rounded-lg p-5 text-center hover:border-emerald-500/40 transition cursor-pointer bg-[#1a1a24]">
                  {referenceImage ? (
                    <div className="relative inline-block">
                      <div className="w-32 h-32 bg-emerald-900/20 rounded-lg flex items-center justify-center"><ImageIcon className="w-10 h-10 text-emerald-400/40" /></div>
                      <button onClick={() => setReferenceImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition">×</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-gray-500 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-400">Upload a reference image</p>
                      <p className="text-[10px] text-gray-600">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button onClick={handleGenerate} disabled={!description.trim() || isGenerating}
                className="w-full px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isGenerating ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Drawing {quantity} variations...</>
                ) : (
                  <><Wand2 className="w-4 h-4" />Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Variations</>
                )}
              </button>
            </div>

            {/* Right Column (2 cols) */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Generated Variations</label>
                {generatedVariations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {generatedVariations.map((_, index) => (
                      <div key={index} className="relative group aspect-square bg-[#1a1a24] rounded-lg border border-white/10 hover:border-emerald-500/50 transition overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-emerald-400/20" /></div>
                        <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                          <div className="flex gap-2">
                            <button className="flex-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition">Use This</button>
                            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold transition">Save</button>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-semibold">#{index + 1}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-3/4 bg-[#1a1a24] rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500">
                    <Sparkles className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No variations generated yet</p>
                    <p className="text-xs mt-1 text-gray-600">Fill in details and click Generate</p>
                  </div>
                )}
              </div>

              {/* Generation Info */}
              {generatedVariations.length > 0 && (
                <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Generation Info</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Asset Type:</span><span className="text-white font-medium capitalize">{activeTab}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Art Style:</span><span className="text-white font-medium">{currentStyle?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Variations:</span><span className="text-emerald-400 font-medium">{generatedVariations.length}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Credits Used:</span><span className="text-orange-400 font-medium">{quantity * 2}</span></div>
                  </div>
                </div>
              )}

              {/* Queue */}
              {generationHistory.length > 0 && (
                <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Drawing Queue</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {generationHistory.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-2.5 bg-[#0f1117] rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${job.status === "generating" ? "bg-yellow-400 animate-pulse" : job.status === "done" ? "bg-emerald-400" : "bg-red-400"}`} />
                          <div>
                            <div className="text-xs font-medium text-white capitalize">{job.type} • {job.style}</div>
                            <div className="text-[10px] text-gray-500">{job.variations} variations • {job.timestamp}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${job.status === "generating" ? "bg-yellow-500/10 text-yellow-400" : job.status === "done" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {job.status === "generating" ? "Drawing" : job.status === "done" ? "Done" : "Failed"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Style Modal */}
      {showCustomStyleForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] rounded-xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Palette className="w-5 h-5 text-purple-400" /><h2 className="text-white font-bold text-lg">Create Custom Art Style</h2></div>
                <button onClick={() => setShowCustomStyleForm(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Style Name</label>
                <input type="text" value={customStyleName} onChange={(e) => setCustomStyleName(e.target.value)} placeholder="e.g., Naruto, Disney, Cyberpunk Webtoon..."
                  className="w-full px-4 py-2.5 bg-[#0f1117] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Description</label>
                <textarea value={customStyleDesc} onChange={(e) => setCustomStyleDesc(e.target.value)} placeholder="e.g., Naruto anime style with bold outlines, vibrant orange/blue palette, dynamic action poses..."
                  className="w-full px-4 py-2.5 bg-[#0f1117] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Style Reference (Optional)</label>
                <div className="border-2 border-dashed border-white/15 rounded-lg p-4 text-center hover:border-purple-500/40 transition cursor-pointer bg-[#0f1117]">
                  <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Upload a reference image for this style</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCustomStyleForm(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition">Cancel</button>
                <button onClick={handleAddCustomStyle} disabled={!customStyleName.trim()} className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">Create Style</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
