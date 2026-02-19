"use client";

import { useState } from "react";
import { X, Sparkles, Plus, Trash2, GripVertical, Layers, ChevronDown, ChevronUp, Zap, BookOpen } from "lucide-react";

interface PagePanel {
  id: number;
  description: string;
  characters: string[];
  framing: string;
  cameraAngle: string;
  dialogue: string;
  expanded: boolean;
}

interface PageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PageGenerationModal({ isOpen, onClose }: PageGenerationModalProps) {
  const [panels, setPanels] = useState<PagePanel[]>([
    { id: 1, description: "", characters: [], framing: "none", cameraAngle: "none", dialogue: "", expanded: true },
    { id: 2, description: "", characters: [], framing: "none", cameraAngle: "none", dialogue: "", expanded: true },
    { id: 3, description: "", characters: [], framing: "none", cameraAngle: "none", dialogue: "", expanded: true },
    { id: 4, description: "", characters: [], framing: "none", cameraAngle: "none", dialogue: "", expanded: true },
  ]);
  const [pageLayout, setPageLayout] = useState("vertical-4");
  const [styleModel, setStyleModel] = useState("nano-banana");
  const [weather, setWeather] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [useRulesContext, setUseRulesContext] = useState(true);

  const availableCharacters = [
    { id: "kaito", name: "Kaito" },
    { id: "ryu", name: "Ryu" },
    { id: "coach", name: "Coach Tanaka" },
  ];

  const addPanel = () => {
    const newId = Math.max(...panels.map(p => p.id), 0) + 1;
    setPanels([...panels, { id: newId, description: "", characters: [], framing: "none", cameraAngle: "none", dialogue: "", expanded: true }]);
  };

  const removePanel = (id: number) => {
    if (panels.length <= 1) return;
    setPanels(panels.filter(p => p.id !== id));
  };

  const updatePanel = (id: number, field: keyof PagePanel, value: string | string[] | boolean) => {
    setPanels(panels.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const toggleCharacter = (panelId: number, charId: string) => {
    setPanels(panels.map(p => {
      if (p.id !== panelId) return p;
      const chars = p.characters.includes(charId)
        ? p.characters.filter(c => c !== charId)
        : [...p.characters, charId];
      return { ...p, characters: chars };
    }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const filledPanels = panels.filter(p => p.description.trim()).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl max-w-4xl w-full mx-4 max-h-[92vh] flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Page Generation Mode</h2>
              <p className="text-xs text-gray-400">Generate a complete manga page with multiple panels in one go</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Panels:</span>
              <span className="text-purple-400 font-bold">{filledPanels}/{panels.length}</span>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Page Settings */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Page Layout</label>
              <select value={pageLayout} onChange={(e) => setPageLayout(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer">
                <option value="vertical-3">3 Panels (Vertical)</option>
                <option value="vertical-4">4 Panels (Standard)</option>
                <option value="vertical-5">5 Panels (Dense)</option>
                <option value="vertical-6">6 Panels (Packed)</option>
                <option value="grid-2x2">2×2 Grid</option>
                <option value="grid-2x3">2×3 Grid</option>
                <option value="custom">Custom Layout</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Style Model</label>
              <select value={styleModel} onChange={(e) => setStyleModel(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer">
                <option value="nano-banana">Nano Banana</option>
                <option value="flux-pro">Flux Pro</option>
                <option value="sdxl">SDXL 1.0</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Weather</label>
              <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)}
                placeholder="Auto (leave blank)"
                className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Rules Context</label>
              <button onClick={() => setUseRulesContext(!useRulesContext)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  useRulesContext
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-[#1a1a24] border border-white/10 text-gray-400"
                }`}>
                <BookOpen className="w-3.5 h-3.5" />
                {useRulesContext ? "Rules Active" : "Rules Off"}
              </button>
            </div>
          </div>

          {/* Panel Descriptions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Panel Descriptions</label>
              <span className="text-[10px] text-gray-500">Define each panel&apos;s content for this page</span>
            </div>

            {panels.map((panel, idx) => (
              <div key={panel.id} className="bg-[#1a1a24] border border-white/10 rounded-lg overflow-hidden">
                {/* Panel Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                  <GripVertical className="w-3 h-3 text-gray-600 cursor-grab" />
                  <span className="text-[10px] font-bold text-purple-400 w-14">Panel {idx + 1}</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    {panel.characters.map(c => {
                      const char = availableCharacters.find(ac => ac.id === c);
                      return char ? (
                        <span key={c} className="text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">{char.name}</span>
                      ) : null;
                    })}
                    {panel.framing !== "none" && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">{panel.framing}</span>}
                  </div>
                  <button onClick={() => updatePanel(panel.id, "expanded", !panel.expanded)}
                    className="p-1 hover:bg-white/10 rounded transition text-gray-500">
                    {panel.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button onClick={() => removePanel(panel.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition text-gray-600 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Panel Body */}
                {panel.expanded && (
                  <div className="p-3 space-y-2">
                    <textarea
                      value={panel.description}
                      onChange={(e) => updatePanel(panel.id, "description", e.target.value)}
                      placeholder={`Describe what happens in panel ${idx + 1}...`}
                      className="w-full px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none"
                      rows={2}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Characters</label>
                        <div className="flex flex-wrap gap-1">
                          {availableCharacters.map(char => (
                            <button key={char.id} onClick={() => toggleCharacter(panel.id, char.id)}
                              className={`px-1.5 py-0.5 rounded text-[9px] transition ${
                                panel.characters.includes(char.id)
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                  : "bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300"
                              }`}>
                              {char.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Framing</label>
                        <select value={panel.framing} onChange={(e) => updatePanel(panel.id, "framing", e.target.value)}
                          className="w-full px-2 py-1 bg-[#13131a] border border-white/10 rounded text-[10px] text-white focus:outline-none appearance-none cursor-pointer">
                          <option value="none">Auto</option>
                          <option value="extreme-close">Extreme Close-up</option>
                          <option value="close">Close-up</option>
                          <option value="bust">Bust Shot</option>
                          <option value="waist">Waist Shot</option>
                          <option value="full">Full Body</option>
                          <option value="wide">Wide Shot</option>
                          <option value="two-shot">Two-Shot</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Camera Angle</label>
                        <select value={panel.cameraAngle} onChange={(e) => updatePanel(panel.id, "cameraAngle", e.target.value)}
                          className="w-full px-2 py-1 bg-[#13131a] border border-white/10 rounded text-[10px] text-white focus:outline-none appearance-none cursor-pointer">
                          <option value="none">Auto</option>
                          <option value="front-view">Front View</option>
                          <option value="eye-level">Eye Level</option>
                          <option value="from-above">From Above</option>
                          <option value="from-below">From Below</option>
                          <option value="from-behind">From Behind</option>
                          <option value="dutch">Dutch Angle</option>
                          <option value="dynamic">Dynamic</option>
                          <option value="cinematic">Cinematic</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Dialogue (optional)</label>
                      <input type="text" value={panel.dialogue} onChange={(e) => updatePanel(panel.id, "dialogue", e.target.value)}
                        placeholder={'e.g. Kaito: "I won\'t give up!"'}
                        className="w-full px-2 py-1.5 bg-[#13131a] border border-white/10 rounded text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Panel */}
            <button onClick={addPanel}
              className="w-full py-2.5 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-xs text-gray-500 hover:text-purple-400 transition flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />Add Panel
            </button>
          </div>

          {/* Token Savings Info */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Token Savings with Page Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-[10px]">
              <div>
                <span className="text-gray-500">Panel-by-panel:</span>
                <span className="text-red-400 font-semibold ml-1">{panels.length} API calls</span>
              </div>
              <div>
                <span className="text-gray-500">Page Mode:</span>
                <span className="text-emerald-400 font-bold ml-1">1 API call</span>
              </div>
              <div>
                <span className="text-gray-500">Savings:</span>
                <span className="text-emerald-400 font-bold ml-1">~{Math.round((1 - 1/panels.length) * 100)}% fewer tokens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 shrink-0">
          {isGenerating ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Generating page with {panels.length} panels...</span>
                <span className="text-purple-400 font-bold">{generationProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                  style={{ width: `${generationProgress}%` }} />
              </div>
              <p className="text-[10px] text-gray-500">
                {generationProgress < 30 ? "Composing panel layout..." :
                 generationProgress < 60 ? "Generating character poses..." :
                 generationProgress < 90 ? "Rendering backgrounds and effects..." :
                 "Finalizing page composition..."}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{panels.length} panels</span>
                <span>•</span>
                <span>~5 credits</span>
                <span>•</span>
                <span>~15 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-medium transition">
                  Cancel
                </button>
                <button onClick={handleGenerate} disabled={filledPanels === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Full Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
