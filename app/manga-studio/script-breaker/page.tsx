"use client";

import { useState } from "react";
import { FileText, Sparkles, ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Layers } from "lucide-react";

interface PanelBreakdown {
  id: number;
  description: string;
  panelType: string;
  framing: string;
  characters: string[];
  dialogue: string;
}

interface EpisodeBreakdown {
  id: number;
  title: string;
  summary: string;
  pages: number;
  panels: PanelBreakdown[];
  expanded: boolean;
}

export default function ScriptBreakerPage() {
  const [script, setScript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [episodes, setEpisodes] = useState<EpisodeBreakdown[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [targetEpisodes, setTargetEpisodes] = useState("auto");
  const [panelsPerPage, setPanelsPerPage] = useState("5");
  const [mangaFormat, setMangaFormat] = useState("webtoon");

  const handleBreakdown = () => {
    if (!script.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setEpisodes([
        {
          id: 1, title: "Episode 1: The Beginning",
          summary: "Kaito discovers his passion for basketball after watching a street game. He joins the school team despite having no experience.",
          pages: 8, expanded: true,
          panels: [
            { id: 1, description: "Wide establishing shot — school rooftop, sunset. Kaito watches a street basketball game below.", panelType: "Establishing", framing: "Wide", characters: ["Kaito"], dialogue: "" },
            { id: 2, description: "Close-up of Kaito's eyes reflecting the game, sparkling with excitement.", panelType: "Close-up", framing: "Extreme Close-up", characters: ["Kaito"], dialogue: "" },
            { id: 3, description: "Action panel — a player dunks. Speed lines, impact effect. Kaito grips the railing.", panelType: "Action", framing: "Full Body", characters: ["Street Player"], dialogue: "Kaito (thought): \"That's... incredible.\"" },
            { id: 4, description: "Next morning — Kaito at the gym door, nervous. Coach inside.", panelType: "Dramatic Reveal", framing: "Bust Shot", characters: ["Kaito", "Coach"], dialogue: "Kaito: \"I want to join the basketball team.\"" },
            { id: 5, description: "Reaction shot — Coach looks at Kaito's small frame. Skeptical.", panelType: "Reaction", framing: "Close-up", characters: ["Coach"], dialogue: "Coach: \"Have you ever played before?\"" },
            { id: 6, description: "Silent panel — Kaito shakes his head. Embarrassed but determined.", panelType: "Silent", framing: "Bust Shot", characters: ["Kaito"], dialogue: "" },
          ],
        },
        {
          id: 2, title: "Episode 2: First Practice",
          summary: "Kaito's first practice is a disaster. He can't dribble, can't shoot, and the team mocks him. But Ryu sees something.",
          pages: 10, expanded: false,
          panels: [
            { id: 7, description: "Morning gym — team warming up. Kaito enters in oversized uniform.", panelType: "Establishing", framing: "Wide", characters: ["Kaito", "Team"], dialogue: "" },
            { id: 8, description: "Montage — Kaito failing at drills. Ball bouncing off foot, tripping.", panelType: "Action", framing: "Various", characters: ["Kaito"], dialogue: "" },
            { id: 9, description: "Team members whispering and laughing. Kaito hears them.", panelType: "Reaction", framing: "Two-Shot", characters: ["Team Members"], dialogue: "\"Who let this guy in?\"" },
            { id: 10, description: "Kaito alone at the court after practice. Shooting over and over. Moon rising.", panelType: "Establishing", framing: "Wide", characters: ["Kaito"], dialogue: "" },
            { id: 11, description: "Ryu watches from the doorway. Arms crossed. Small smile.", panelType: "Close-up", framing: "Bust Shot", characters: ["Ryu"], dialogue: "Ryu (thought): \"That look in his eyes...\"" },
          ],
        },
        {
          id: 3, title: "Episode 3: The Challenge",
          summary: "Ryu challenges Kaito to a one-on-one. If Kaito scores even once, he stays on the team.",
          pages: 12, expanded: false,
          panels: [
            { id: 12, description: "Ryu approaches Kaito. Dramatic two-shot, tension lines.", panelType: "Two-Shot", framing: "Bust Shot", characters: ["Kaito", "Ryu"], dialogue: "Ryu: \"One-on-one. Score once, you stay.\"" },
            { id: 13, description: "Splash — gym packed. Students in bleachers. Kaito and Ryu at center court.", panelType: "Splash Page", framing: "Wide", characters: ["Kaito", "Ryu", "Crowd"], dialogue: "" },
            { id: 14, description: "Action — Ryu dribbles past Kaito effortlessly. Speed lines.", panelType: "Action", framing: "Full Body", characters: ["Kaito", "Ryu"], dialogue: "" },
            { id: 15, description: "Impact — Kaito falls but gets back up immediately.", panelType: "Impact", framing: "Close-up", characters: ["Kaito"], dialogue: "Kaito: \"Again.\"" },
          ],
        },
      ]);
      setIsProcessing(false);
    }, 2500);
  };

  const toggleEpisode = (id: number) => {
    setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, expanded: !ep.expanded } : ep));
  };

  const resetBreakdown = () => {
    setEpisodes([]);
  };

  const totalPanels = episodes.reduce((sum, ep) => sum + ep.panels.length, 0);
  const totalPages = episodes.reduce((sum, ep) => sum + ep.pages, 0);

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Script Breaker</h1>
              <p className="text-xs text-gray-400 mt-0.5">Paste your story → AI breaks it into episodes, pages & panels</p>
            </div>
          </div>
          {episodes.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 font-semibold">{episodes.length} Episodes</div>
              <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-semibold">{totalPages} Pages</div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-semibold">{totalPanels} Panels</div>
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />Send to Panel Manager
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-5">

          {/* Script Input Section — always visible */}
          <div className={`bg-[#13131a] rounded-lg border border-white/10 p-5 ${episodes.length > 0 ? "" : ""}`}>
            {/* Title + Settings Row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Story Title</label>
                <input type="text" value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="e.g., Basketball Dreams"
                  className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Episodes</label>
                <select value={targetEpisodes} onChange={(e) => setTargetEpisodes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
                  <option value="auto">Auto-detect</option>
                  <option value="3">3</option><option value="5">5</option><option value="8">8</option><option value="12">12</option><option value="24">24</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Panels / Page</label>
                <select value={panelsPerPage} onChange={(e) => setPanelsPerPage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
                  <option value="3">3 (spacious)</option><option value="4">4 (webtoon)</option><option value="5">5 (manga)</option><option value="6">6 (dense)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Format</label>
                <select value={mangaFormat} onChange={(e) => setMangaFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
                  <option value="webtoon">Webtoon</option><option value="manga">Manga</option><option value="western">Western Comic</option><option value="manhwa">Manhwa</option>
                </select>
              </div>
            </div>

            {/* Script Textarea */}
            <textarea value={script} onChange={(e) => setScript(e.target.value)}
              placeholder={"Paste your story, screenplay, or outline here...\n\nExample: Kaito is a high school student who discovers his passion for basketball after watching a street game. He joins the school team despite having no experience. His first practice is a disaster — he can't dribble, can't shoot, and the team mocks him. But the team captain Ryu sees something special...\n\nAI breaks this into episodes → pages → panels with character names, dialogue, and panel types."}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition resize-none leading-relaxed"
              rows={episodes.length > 0 ? 5 : 10} />

            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-gray-500">{script.length > 0 ? `${script.split(/\s+/).filter(Boolean).length} words` : "Include character names, dialogue in quotes, emotional beats"}</p>
              <div className="flex items-center gap-2">
                {episodes.length > 0 && (
                  <button onClick={resetBreakdown} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-medium transition">Clear Results</button>
                )}
                <button onClick={handleBreakdown} disabled={!script.trim() || isProcessing}
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                  {isProcessing ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Breaking down...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" />{episodes.length > 0 ? "Re-analyze" : "Break Down Script"}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results — Episodes & Panels */}
          {episodes.length > 0 && (
            <>
              {episodes.map((episode) => (
                <div key={episode.id} className="bg-[#13131a] rounded-lg border border-white/10 overflow-hidden">
                  <button onClick={() => toggleEpisode(episode.id)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition">
                    <div className="flex items-center gap-3">
                      {episode.expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      <div className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">Ep {episode.id}</div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-white">{episode.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xl">{episode.summary}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{episode.pages} pages</span><span>•</span><span>{episode.panels.length} panels</span>
                    </div>
                  </button>
                  {episode.expanded && (
                    <div className="border-t border-white/5">
                      {episode.panels.map((panel, pi) => (
                        <div key={panel.id} className="flex items-start gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                          <div className="flex items-center gap-2 pt-0.5">
                            <GripVertical className="w-3 h-3 text-gray-600 cursor-grab" />
                            <span className="text-[10px] text-gray-500 font-mono w-4">{pi + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-semibold">{panel.panelType}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{panel.framing}</span>
                              {panel.characters.map(c => (
                                <span key={c} className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">{c}</span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed">{panel.description}</p>
                            {panel.dialogue && <p className="text-xs text-purple-300 mt-0.5 italic">{panel.dialogue}</p>}
                          </div>
                          <button className="p-1 hover:bg-white/10 rounded transition text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <div className="p-2 bg-[#0f1117]">
                        <button className="w-full py-1.5 border border-dashed border-white/10 hover:border-purple-500/30 rounded text-[10px] text-gray-500 hover:text-purple-400 transition flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" />Add Panel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Bottom Action */}
              <div className="flex items-center justify-center pt-2 pb-6">
                <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  <Layers className="w-4 h-4" />
                  Send All to Panel Manager
                </button>
              </div>
            </>
          )}

          {/* Tips — only show when no results */}
          {episodes.length === 0 && (
            <div className="bg-[#1a1a24] rounded-lg border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">How It Works</h3>
              <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                <div>
                  <div className="text-purple-400 font-semibold mb-1">1. Story → Episodes</div>
                  <p>AI chunks your story into episodes based on narrative arcs and pacing</p>
                </div>
                <div>
                  <div className="text-blue-400 font-semibold mb-1">2. Episodes → Pages</div>
                  <p>Each episode is divided into pages based on your panels-per-page setting</p>
                </div>
                <div>
                  <div className="text-emerald-400 font-semibold mb-1">3. Pages → Panels</div>
                  <p>Pages break down into individual panels with type, framing, characters & dialogue</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
