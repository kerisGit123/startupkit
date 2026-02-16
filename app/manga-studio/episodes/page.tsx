"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Settings, Plus, Search, ChevronDown, ChevronRight,
  FileText, Sparkles, Check, X, RefreshCw, Eye, Trash2,
  GripVertical, Archive, Circle, Clock, Pencil, CheckCircle2, ExternalLink,
} from "lucide-react";
import { useMangaStudioUI } from "../MangaStudioUIContext";
import { SettingsModal } from "../components/modals/SettingsModal";
import { ManageArcTagsModal } from "../components/modals/ManageArcTagsModal";
import { ManageSectionsModal } from "../components/modals/ManageSectionsModal";

type EpisodeStatus = "todo" | "in_progress" | "review" | "completed" | "archived";
type PanelStatus = "queued" | "drawing" | "review" | "approved" | "redo";

interface MangaPanel {
  id: number;
  name: string;
  page: number;
  panelType: string;
  description: string;
  dialogue?: string;
  characters?: string[];
  scene?: string;
  props?: string[];
  artStyle: string;
  ratio: string;
  status: PanelStatus;
  thumbnail?: string;
}

interface Episode {
  id: number;
  title: string;
  status: EpisodeStatus;
  arc: string;
  pages: number;
  characters: number;
  summary: string;
  expanded: boolean;
  panels: MangaPanel[];
}

const episodeStatusConfig: Record<EpisodeStatus, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  todo: { label: "To Do", color: "text-gray-400", bg: "bg-gray-500/10", icon: Circle },
  in_progress: { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock },
  review: { label: "Review", color: "text-orange-400", bg: "bg-orange-500/10", icon: Pencil },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  archived: { label: "Archived", color: "text-gray-500", bg: "bg-gray-500/10", icon: Archive },
};

const panelStatusConfig: Record<PanelStatus, { label: string; color: string; bg: string }> = {
  queued: { label: "Queued", color: "text-gray-400", bg: "bg-gray-500/10" },
  drawing: { label: "Drawing", color: "text-blue-400", bg: "bg-blue-500/10" },
  review: { label: "Review", color: "text-orange-400", bg: "bg-orange-500/10" },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  redo: { label: "Redo", color: "text-red-400", bg: "bg-red-500/10" },
};

export default function EpisodesPage() {
  const { openNewEpisode } = useMangaStudioUI();
  const [showSettings, setShowSettings] = useState(false);
  const [showArcTags, setShowArcTags] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [showScriptBreaker, setShowScriptBreaker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<EpisodeStatus | "active" | "all">("active");
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(1);
  const [scriptText, setScriptText] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [targetEpisode, setTargetEpisode] = useState<string>("new");
  const [breakdownResult, setBreakdownResult] = useState<{
    episodes: { title: string; pages: { pageNum: number; description: string; panels: { name: string; type: string; description: string; dialogue: string; characters: string[]; scene: string; props: string[] }[] }[] }[];
    characters: { name: string; role: string; mentions: number; tags: string[] }[];
    locations: { name: string; mentions: number; tags: string[] }[];
    props: { name: string; mentions: number; tags: string[] }[];
    scenes: { name: string; description: string; tags: string[] }[];
    suggestedStart: number;
  } | null>(null);

  const [episodes, setEpisodes] = useState<Episode[]>([
    {
      id: 1, title: "The Beginning", status: "in_progress", arc: "Training Arc", pages: 3, characters: 3, expanded: false,
      summary: "Kaito discovers basketball from the rooftop. He joins the team despite zero experience.",
      panels: [
        { id: 1, name: "Panel 1", page: 1, panelType: "Establishing", description: "Wide shot — school rooftop, sunset. Kaito watches a street basketball game below.", dialogue: '"Someday... I want to fly like that."', characters: ["Kaito"], scene: "School Rooftop", props: ["Basketball"], artStyle: "Shonen", ratio: "3:4", status: "review", thumbnail: "🌅" },
        { id: 2, name: "Panel 2", page: 1, panelType: "Close-up", description: "Close-up of Kaito's eyes reflecting the game, sparkling with excitement.", characters: ["Kaito"], scene: "School Rooftop", props: [], artStyle: "Shonen", ratio: "3:4", status: "approved", thumbnail: "👁️" },
        { id: 3, name: "Panel 3", page: 1, panelType: "Action", description: "A player dunks. Speed lines, impact effect. Kaito grips the railing.", characters: ["Kaito", "Ryu"], scene: "Basketball Court", props: ["Basketball"], artStyle: "Shonen", ratio: "16:9", status: "drawing", thumbnail: "🏀" },
        { id: 4, name: "Panel 4", page: 2, panelType: "Dramatic Reveal", description: "Next morning — Kaito at the gym door, nervous. Coach inside.", dialogue: '"Is... is this where I sign up?"', characters: ["Kaito", "Coach"], scene: "Training Gym", props: [], artStyle: "Shonen", ratio: "3:4", status: "queued" },
        { id: 5, name: "Panel 5", page: 2, panelType: "Reaction", description: "Coach looks at Kaito's small frame. Skeptical expression.", dialogue: '"You? Basketball? ...Show me what you got."', characters: ["Coach", "Kaito"], scene: "Training Gym", props: ["Whistle"], artStyle: "Shonen", ratio: "3:4", status: "queued" },
        { id: 6, name: "Panel 6", page: 3, panelType: "Silent", description: "Kaito shakes his head. Embarrassed but determined.", characters: ["Kaito"], scene: "Training Gym", props: [], artStyle: "Shonen", ratio: "3:4", status: "queued" },
      ],
    },
    {
      id: 2, title: "First Practice", status: "todo", arc: "Training Arc", pages: 2, characters: 5, expanded: false,
      summary: "Kaito's first practice is a disaster. He can't dribble, can't shoot. But Ryu sees something.",
      panels: [
        { id: 7, name: "Panel 1", page: 1, panelType: "Establishing", description: "Morning gym — team warming up. Kaito enters in oversized uniform.", artStyle: "Shonen", ratio: "3:4", status: "queued" },
        { id: 8, name: "Panel 2", page: 1, panelType: "Action", description: "Montage — Kaito failing at drills. Ball bouncing off foot, tripping.", artStyle: "Shonen", ratio: "3:4", status: "queued" },
        { id: 9, name: "Panel 3", page: 2, panelType: "Reaction", description: "Team members whispering and laughing.", artStyle: "Shonen", ratio: "3:4", status: "queued" },
        { id: 10, name: "Panel 4", page: 2, panelType: "Close-up", description: "Ryu watches from the doorway. Arms crossed. Small smile.", artStyle: "Seinen", ratio: "3:4", status: "queued" },
      ],
    },
    {
      id: 3, title: "The Rival", status: "review", arc: "Rivalry Arc", pages: 2, characters: 4, expanded: false,
      summary: "Ryu challenges Kaito to a one-on-one. Score once, you stay.",
      panels: [
        { id: 11, name: "Panel 1", page: 1, panelType: "Two-Shot", description: "Ryu approaches Kaito. Dramatic tension lines.", artStyle: "Shonen", ratio: "3:4", status: "approved" },
        { id: 12, name: "Panel 2", page: 1, panelType: "Splash Page", description: "Gym is packed. Students in bleachers. Center court.", artStyle: "Shonen", ratio: "16:9", status: "review" },
        { id: 13, name: "Panel 3", page: 2, panelType: "Action", description: "Ryu dribbles past Kaito effortlessly.", artStyle: "Shonen", ratio: "3:4", status: "review" },
        { id: 14, name: "Panel 4", page: 2, panelType: "Impact", description: "Kaito falls. Gets back up immediately.", artStyle: "Shonen", ratio: "3:4", status: "drawing" },
      ],
    },
    {
      id: 4, title: "Tournament Begins", status: "todo", arc: "Tournament Arc", pages: 0, characters: 8, expanded: false,
      summary: "The school enters the regional tournament. Stakes are high.",
      panels: [],
    },
    {
      id: 5, title: "Training Montage", status: "completed", arc: "Training Arc", pages: 3, characters: 2, expanded: false,
      summary: "Kaito trains alone every night. Slow improvement montage.",
      panels: [
        { id: 15, name: "Panel 1", page: 1, panelType: "Establishing", description: "Empty court at night. Single light on.", artStyle: "Shonen", ratio: "3:4", status: "approved" },
        { id: 16, name: "Panel 2", page: 2, panelType: "Action", description: "Montage of Kaito shooting, dribbling, running.", artStyle: "Shonen", ratio: "3:4", status: "approved" },
      ],
    },
    {
      id: 6, title: "Origin Story", status: "archived", arc: "Flashback Arc", pages: 4, characters: 3, expanded: false,
      summary: "Flashback to Kaito's childhood. Why he fears competition.",
      panels: [
        { id: 17, name: "Panel 1", page: 1, panelType: "Establishing", description: "Young Kaito at a track meet. Nervous.", artStyle: "Shonen", ratio: "3:4", status: "approved" },
      ],
    },
  ]);

  const router = useRouter();
  const totalPanels = episodes.reduce((sum, ep) => sum + ep.panels.length, 0);
  const totalPages = episodes.reduce((sum, ep) => sum + ep.pages, 0);

  const editPage = (episodeId: number, page: number) => {
    router.push(`/manga-studio?episode=${episodeId}&page=${page}`);
  };

  const filtered = episodes.filter(ep => {
    if (filterStatus === "active" && (ep.status === "archived" || ep.status === "completed")) return false;
    if (filterStatus !== "all" && filterStatus !== "active" && ep.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchEp = ep.title.toLowerCase().includes(q) || ep.summary.toLowerCase().includes(q);
      const matchPanel = ep.panels.some(p => p.description.toLowerCase().includes(q) || p.panelType.toLowerCase().includes(q));
      if (!matchEp && !matchPanel) return false;
    }
    return true;
  });

  const toggleExpand = (id: number) => {
    setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, expanded: !ep.expanded } : ep));
    setSelectedEpisodeId(id);
  };

  const changeEpisodeStatus = (id: number, newStatus: EpisodeStatus) => {
    setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, status: newStatus } : ep));
  };

  const changePanelStatus = (episodeId: number, panelId: number, newStatus: PanelStatus) => {
    setEpisodes(prev => prev.map(ep =>
      ep.id === episodeId ? { ...ep, panels: ep.panels.map(p => p.id === panelId ? { ...p, status: newStatus } : p) } : ep
    ));
  };

  const handleScriptBreak = () => {
    if (!scriptText.trim()) return;
    setIsBreaking(true);
    setBreakdownResult(null);

    setTimeout(() => {
      const words = scriptText.toLowerCase();
      const extractedChars = [
        ...(words.includes("kaito") ? [{ name: "Kaito", role: "Protagonist", mentions: (words.match(/kaito/g) || []).length, tags: ["Main Character", "Male", "Student"] }] : []),
        ...(words.includes("ryu") ? [{ name: "Ryu", role: "Rival", mentions: (words.match(/ryu/g) || []).length, tags: ["Rival", "Male", "Athlete"] }] : []),
        ...(words.includes("coach") ? [{ name: "Coach", role: "Mentor", mentions: (words.match(/coach/g) || []).length, tags: ["Mentor", "Adult", "Authority"] }] : []),
        ...(words.includes("sakura") ? [{ name: "Sakura", role: "Support", mentions: (words.match(/sakura/g) || []).length, tags: ["Female", "Support", "Friend"] }] : []),
      ];
      if (extractedChars.length === 0) extractedChars.push({ name: "Character A", role: "Lead", mentions: 1, tags: ["Auto-detected", "Lead"] });

      const extractedLocations = [
        ...(words.includes("court") || words.includes("basketball") ? [{ name: "Basketball Court", mentions: (words.match(/court/g) || []).length + (words.match(/basketball/g) || []).length, tags: ["Outdoor", "Sports", "Day"] }] : []),
        ...(words.includes("school") ? [{ name: "School", mentions: (words.match(/school/g) || []).length, tags: ["Indoor", "Urban", "Day"] }] : []),
        ...(words.includes("gym") ? [{ name: "Training Gym", mentions: (words.match(/gym/g) || []).length, tags: ["Indoor", "Sports"] }] : []),
        ...(words.includes("rooftop") ? [{ name: "Rooftop", mentions: (words.match(/rooftop/g) || []).length, tags: ["Outdoor", "Elevated", "Scenic"] }] : []),
        ...(words.includes("street") || words.includes("city") ? [{ name: "City Street", mentions: 1, tags: ["Outdoor", "Urban"] }] : []),
      ];

      const extractedProps = [
        ...(words.includes("ball") || words.includes("basketball") ? [{ name: "Basketball", mentions: (words.match(/ball/g) || []).length + (words.match(/basketball/g) || []).length, tags: ["Sports", "Equipment"] }] : []),
        ...(words.includes("phone") ? [{ name: "Smartphone", mentions: (words.match(/phone/g) || []).length, tags: ["Tech", "Personal"] }] : []),
        ...(words.includes("jersey") || words.includes("uniform") ? [{ name: "Team Jersey", mentions: 1, tags: ["Clothing", "Sports"] }] : []),
        ...(words.includes("whistle") ? [{ name: "Whistle", mentions: 1, tags: ["Sports", "Equipment"] }] : []),
      ];

      const sentences = scriptText.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
      const sceneCount = Math.max(2, Math.min(sentences.length, 6));
      const extractedScenes: { name: string; description: string; tags: string[] }[] = [];
      for (let i = 0; i < sceneCount; i++) {
        extractedScenes.push({
          name: `Scene ${i + 1}`,
          description: sentences[i]?.trim() || `Scene ${i + 1} from script`,
          tags: i === 0 ? ["Opening", "Establishing"] : i === sceneCount - 1 ? ["Climax", "Emotional"] : ["Development", "Action"],
        });
      }

      // Build episodes with pages → panels structure including dialogue/characters/scene/props
      const epCount = Math.max(1, Math.ceil(sceneCount / 3));
      const newId = Math.max(...episodes.map(e => e.id)) + 1;
      const panelTypes = ["Establishing", "Close-up", "Action", "Reaction", "Dramatic Reveal", "Silent"];
      const charNames = extractedChars.map(c => c.name);
      const locNames = extractedLocations.map(l => l.name);
      const propNames = extractedProps.map(p => p.name);

      type PageDef = { pageNum: number; description: string; panels: { name: string; type: string; description: string; dialogue: string; characters: string[]; scene: string; props: string[] }[] };

      const generatedEpisodes: { title: string; pages: PageDef[] }[] = [];

      for (let ep = 0; ep < epCount; ep++) {
        const epScenes = extractedScenes.slice(ep * 3, (ep + 1) * 3);
        const epPages: PageDef[] = [];
        let currentPage = 1;
        let currentPanels: PageDef["panels"] = [];

        epScenes.forEach((scene, si) => {
          if (si > 0 && si % 2 === 0) {
            epPages.push({ pageNum: currentPage, description: `Page ${currentPage}: ${currentPanels.map(p => p.scene).join(", ")}`, panels: currentPanels });
            currentPage++;
            currentPanels = [];
          }
          const panelChars = charNames.filter(c => scene.description.toLowerCase().includes(c.toLowerCase())).length > 0
            ? charNames.filter(c => scene.description.toLowerCase().includes(c.toLowerCase()))
            : [charNames[0] || "Unknown"];
          const panelLoc = locNames.find(l => scene.description.toLowerCase().includes(l.toLowerCase().split(" ")[0])) || locNames[0] || "Unknown";
          const panelProps = propNames.filter(p => scene.description.toLowerCase().includes(p.toLowerCase().split(" ")[0]));

          currentPanels.push({
            name: `Panel ${si + 1}`,
            type: panelTypes[si % panelTypes.length],
            description: scene.description,
            dialogue: si === 0 ? `"This is where it begins..."` : si === sceneCount - 1 ? `"I won't give up!"` : "",
            characters: panelChars,
            scene: panelLoc,
            props: panelProps,
          });
        });
        if (currentPanels.length > 0) {
          epPages.push({ pageNum: currentPage, description: `Page ${currentPage}: ${currentPanels.map(p => p.scene).join(", ")}`, panels: currentPanels });
        }

        generatedEpisodes.push({
          title: ep === 0 ? "Opening Arc" : ep === epCount - 1 ? "Climax" : `Development ${ep}`,
          pages: epPages,
        });
      }

      setBreakdownResult({
        episodes: generatedEpisodes,
        characters: extractedChars,
        locations: extractedLocations,
        props: extractedProps,
        scenes: extractedScenes,
        suggestedStart: newId,
      });
      setIsBreaking(false);
    }, 2500);
  };

  const applyBreakdown = () => {
    if (!breakdownResult) return;
    let panelId = Math.max(...episodes.flatMap(e => e.panels.map(p => p.id)), 0) + 1;

    if (targetEpisode !== "new") {
      // Append panels to existing episode
      const epId = parseInt(targetEpisode);
      const allPanels: MangaPanel[] = breakdownResult.episodes.flatMap(ep =>
        ep.pages.flatMap(pg => pg.panels.map(p => ({
          id: panelId++, name: p.name, page: pg.pageNum, panelType: p.type,
          description: p.description, dialogue: p.dialogue, characters: p.characters,
          scene: p.scene, props: p.props,
          artStyle: "Shonen", ratio: "3:4", status: "queued" as PanelStatus,
        })))
      );
      setEpisodes(prev => prev.map(ep => ep.id === epId ? {
        ...ep,
        panels: [...ep.panels, ...allPanels],
        pages: ep.pages + breakdownResult.episodes.reduce((s, e) => s + e.pages.length, 0),
      } : ep));
      setSelectedEpisodeId(epId);
    } else {
      // Create new episodes
      const newId = Math.max(...episodes.map(e => e.id)) + 1;
      const newEpisodes: Episode[] = breakdownResult.episodes.map((ep, i) => ({
        id: newId + i,
        title: ep.title,
        status: "todo" as EpisodeStatus,
        arc: "From Script",
        pages: ep.pages.length,
        characters: breakdownResult.characters.length,
        expanded: i === 0,
        summary: ep.pages.flatMap(pg => pg.panels.map(p => p.description)).join(" ").slice(0, 120) + "...",
        panels: ep.pages.flatMap(pg => pg.panels.map(p => ({
          id: panelId++, name: p.name, page: pg.pageNum, panelType: p.type,
          description: p.description, dialogue: p.dialogue, characters: p.characters,
          scene: p.scene, props: p.props,
          artStyle: "Shonen", ratio: "3:4", status: "queued" as PanelStatus,
        }))),
      }));
      setEpisodes(prev => [...prev, ...newEpisodes]);
      setSelectedEpisodeId(newId);
    }

    setBreakdownResult(null);
    setShowScriptBreaker(false);
    setScriptText("");
    setTargetEpisode("new");
  };

  const statusCounts = {
    active: episodes.filter(e => e.status !== "archived" && e.status !== "completed").length,
    todo: episodes.filter(e => e.status === "todo").length,
    in_progress: episodes.filter(e => e.status === "in_progress").length,
    review: episodes.filter(e => e.status === "review").length,
    completed: episodes.filter(e => e.status === "completed").length,
    archived: episodes.filter(e => e.status === "archived").length,
    all: episodes.length,
  };

  return (
    <>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ManageArcTagsModal isOpen={showArcTags} onClose={() => setShowArcTags(false)} />
      <ManageSectionsModal isOpen={showSections} onClose={() => setShowSections(false)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Sidebar */}
        <div className="w-56 bg-[#13131a] border-r border-white/5 flex flex-col">
          <div className="p-3 border-b border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Episode Timeline</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {episodes.filter(e => filterStatus === "all" || filterStatus === "archived" ? true : e.status !== "archived").map((ep) => {
              const sc = episodeStatusConfig[ep.status];
              const Icon = sc.icon;
              const isSelected = selectedEpisodeId === ep.id;
              return (
                <button key={ep.id} onClick={() => { setSelectedEpisodeId(ep.id); toggleExpand(ep.id); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition ${isSelected ? "bg-purple-500/20 border border-purple-500/30" : "hover:bg-white/5 border border-transparent"} ${ep.status === "archived" ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3 h-3 ${sc.color}`} />
                    <span className="text-xs font-semibold text-white truncate">Ep {ep.id}</span>
                    <span className="text-[9px] text-gray-500 ml-auto">{ep.panels.length}p</span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">{ep.title}</div>
                  {ep.panels.length > 0 && (
                    <div className="mt-1.5 w-full bg-white/5 rounded-full h-1">
                      <div className="h-1 rounded-full bg-purple-500 transition-all" style={{ width: `${Math.round((ep.panels.filter(p => p.status === "approved").length / ep.panels.length) * 100)}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-white/5 space-y-1.5">
            <button onClick={() => setShowScriptBreaker(!showScriptBreaker)}
              className="w-full px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-xs font-semibold transition flex items-center gap-2 border border-orange-500/20">
              <FileText className="w-3.5 h-3.5" />Script Breaker
            </button>
            <button onClick={openNewEpisode}
              className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />New Episode
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#13131a] border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">Episodes</h1>
                <p className="text-[10px] text-gray-400 mt-0.5">Manage episodes, pages & panels — expand episodes to see their panels</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{episodes.length} episodes</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500">{totalPages} pages</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500">{totalPanels} panels</span>
                </div>
                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
                <button onClick={() => setShowSettings(true)} className="w-8 h-8 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition flex items-center justify-center">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Dashboard */}
          <div className="bg-[#13131a] border-b border-white/10 px-6 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Project Progress</span>
              <span className="text-[9px] text-gray-600">— {episodes.filter(e => e.status === "completed").length}/{episodes.length} episodes complete</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {/* Overall Progress */}
              <div className="shrink-0 bg-[#1a1a24] rounded-lg border border-white/5 p-3 min-w-[140px]">
                <div className="text-[9px] text-gray-500 uppercase font-semibold mb-1">Overall</div>
                <div className="text-lg font-bold text-white mb-1.5">
                  {episodes.length > 0 ? Math.round(episodes.reduce((sum, ep) => sum + (ep.panels.length > 0 ? (ep.panels.filter(p => p.status === "approved").length / ep.panels.length) * 100 : 0), 0) / episodes.filter(e => e.panels.length > 0).length || 0) : 0}%
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${episodes.length > 0 ? Math.round(episodes.reduce((sum, ep) => sum + (ep.panels.length > 0 ? (ep.panels.filter(p => p.status === "approved").length / ep.panels.length) * 100 : 0), 0) / (episodes.filter(e => e.panels.length > 0).length || 1)) : 0}%` }} />
                </div>
              </div>
              {/* Per-Episode Progress */}
              {episodes.filter(e => e.status !== "archived").map(ep => {
                const approved = ep.panels.filter(p => p.status === "approved").length;
                const pct = ep.panels.length > 0 ? Math.round((approved / ep.panels.length) * 100) : 0;
                const barColor = pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-blue-500" : pct > 0 ? "bg-orange-500" : "bg-gray-600";
                return (
                  <div key={ep.id} className="shrink-0 bg-[#1a1a24] rounded-lg border border-white/5 p-3 min-w-[120px]">
                    <div className="text-[9px] text-gray-500 truncate mb-1">Ep {ep.id}: {ep.title}</div>
                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className="text-sm font-bold text-white">{pct}%</span>
                      <span className="text-[8px] text-gray-600">{approved}/{ep.panels.length}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-[#13131a] border-b border-white/10 px-6 py-2.5">
            <div className="flex items-center gap-2">
              {/* Status Tabs */}
              <div className="flex gap-1">
                {(["active", "todo", "in_progress", "review", "completed", "archived", "all"] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition capitalize ${filterStatus === s ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"}`}>
                    {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s]})
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                    className="w-44 pl-7 pr-3 py-1.5 bg-[#1a1a24] border border-white/10 rounded-lg text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                </div>
                <button onClick={() => setShowArcTags(true)} className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[10px] font-medium transition">Arcs</button>
              </div>
            </div>
          </div>

          {/* Script Breaker Inline */}
          {showScriptBreaker && (
            <div className="bg-[#1a1a24] border-b border-orange-500/20 px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-white">Script Breaker</span>
                <span className="text-[10px] text-gray-500">— Paste story → AI extracts characters, locations, props → creates episodes &amp; panels</span>
                <button onClick={() => { setShowScriptBreaker(false); setBreakdownResult(null); setTargetEpisode("new"); }} className="ml-auto p-1 text-gray-500 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>
              </div>

              {/* Step 1: Input */}
              {!breakdownResult && (
                <>
                  <textarea value={scriptText} onChange={(e) => setScriptText(e.target.value)}
                    placeholder={"Paste your story, screenplay, or outline here...\n\nExample: Kaito discovers basketball from the school rooftop. He watches Ryu dunk in the court below. The coach sees Kaito's speed and invites him to try out. At the gym, Kaito fumbles but shows raw talent..."}
                    className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 resize-none leading-relaxed" rows={5} />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500">{scriptText.length > 0 ? `${scriptText.split(/\s+/).filter(Boolean).length} words` : "Include character names, locations, actions, emotions"}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-600">Target:</span>
                        <select value={targetEpisode} onChange={(e) => setTargetEpisode(e.target.value)}
                          className="px-2 py-1 bg-[#0f1117] border border-white/10 rounded text-[10px] text-white focus:outline-none focus:border-orange-500/30 appearance-none cursor-pointer">
                          <option value="new">New Episode(s)</option>
                          {episodes.map(ep => <option key={ep.id} value={String(ep.id)}>Ep {ep.id}: {ep.title}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={handleScriptBreak} disabled={!scriptText.trim() || isBreaking}
                      className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5">
                      {isBreaking ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3" />Analyze &amp; Break Down</>}
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Breakdown Results */}
              {breakdownResult && (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-400 font-medium">
                      Analysis complete — {breakdownResult.episodes.length} ep, {breakdownResult.episodes.reduce((s, e) => s + e.pages.length, 0)} pages, {breakdownResult.episodes.reduce((s, e) => s + e.pages.reduce((s2, pg) => s2 + pg.panels.length, 0), 0)} panels, {breakdownResult.characters.length} chars, {breakdownResult.locations.length} locs
                    </span>
                    <span className="text-[9px] text-emerald-500/60 ml-auto">
                      {targetEpisode !== "new" ? `→ Append to Ep ${targetEpisode}` : `→ Create new episode(s)`}
                    </span>
                  </div>

                  {/* Asset Extraction Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0f1117] rounded-lg border border-white/5 p-2.5">
                      <div className="text-[9px] text-orange-400 uppercase font-bold mb-1.5">👤 Characters ({breakdownResult.characters.length})</div>
                      {breakdownResult.characters.map((c, i) => (
                        <div key={i} className="mb-1.5 last:mb-0">
                          <div className="text-[10px] text-white font-semibold">{c.name} <span className="text-[8px] text-gray-500">({c.role})</span></div>
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            {c.tags.map(t => <span key={t} className="px-1 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[7px]">{t}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#0f1117] rounded-lg border border-white/5 p-2.5">
                      <div className="text-[9px] text-blue-400 uppercase font-bold mb-1.5">📍 Locations ({breakdownResult.locations.length})</div>
                      {breakdownResult.locations.map((l, i) => (
                        <div key={i} className="mb-1.5 last:mb-0">
                          <div className="text-[10px] text-white font-semibold">{l.name}</div>
                          <div className="flex gap-1 flex-wrap mt-0.5">{l.tags.map(t => <span key={t} className="px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[7px]">{t}</span>)}</div>
                        </div>
                      ))}
                      {breakdownResult.locations.length === 0 && <p className="text-[8px] text-gray-600">None detected</p>}
                    </div>
                    <div className="bg-[#0f1117] rounded-lg border border-white/5 p-2.5">
                      <div className="text-[9px] text-emerald-400 uppercase font-bold mb-1.5">🔧 Props ({breakdownResult.props.length})</div>
                      {breakdownResult.props.map((p, i) => (
                        <div key={i} className="mb-1.5 last:mb-0">
                          <div className="text-[10px] text-white font-semibold">{p.name}</div>
                          <div className="flex gap-1 flex-wrap mt-0.5">{p.tags.map(t => <span key={t} className="px-1 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[7px]">{t}</span>)}</div>
                        </div>
                      ))}
                      {breakdownResult.props.length === 0 && <p className="text-[8px] text-gray-600">None detected</p>}
                    </div>
                  </div>

                  {/* Episodes → Pages → Panels detail view */}
                  <div className="bg-[#0f1117] rounded-lg border border-white/5 p-3">
                    <div className="text-[9px] text-purple-400 uppercase font-bold mb-2">📖 Episode &amp; Page Breakdown</div>
                    {breakdownResult.episodes.map((ep, ei) => (
                      <div key={ei} className="mb-3 last:mb-0">
                        <div className="text-[11px] text-white font-bold mb-1.5 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[9px]">Ep {ei + 1}</span>
                          {ep.title}
                          <span className="text-[8px] text-gray-500 font-normal ml-auto">{ep.pages.length} pages, {ep.pages.reduce((s, pg) => s + pg.panels.length, 0)} panels</span>
                        </div>
                        {ep.pages.map((pg, pi) => (
                          <div key={pi} className="ml-3 mb-2 last:mb-0 border-l-2 border-purple-500/20 pl-3">
                            <div className="text-[10px] text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                              <span className="px-1 py-0.5 bg-white/5 text-gray-400 rounded text-[8px]">Pg {pg.pageNum}</span>
                              {pg.description}
                            </div>
                            {pg.panels.map((panel, panelIdx) => (
                              <div key={panelIdx} className="ml-3 mb-1.5 last:mb-0 bg-[#13131a] rounded-md p-2 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[8px] px-1 py-0.5 bg-purple-500/10 text-purple-300 rounded">{panel.type}</span>
                                  <span className="text-[10px] text-white font-medium flex-1">{panel.description}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-[8px]">
                                  {panel.dialogue && <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded italic">{panel.dialogue}</span>}
                                  {panel.characters.map(c => <span key={c} className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">👤 {c}</span>)}
                                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">📍 {panel.scene}</span>
                                  {panel.props.map(p => <span key={p} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">🔧 {p}</span>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button onClick={() => setBreakdownResult(null)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs transition">← Re-edit Script</button>
                    <div className="flex items-center gap-2">
                      <select value={targetEpisode} onChange={(e) => setTargetEpisode(e.target.value)}
                        className="px-2 py-1 bg-[#0f1117] border border-white/10 rounded text-[10px] text-white focus:outline-none appearance-none cursor-pointer">
                        <option value="new">Create New Episode(s)</option>
                        {episodes.map(ep => <option key={ep.id} value={String(ep.id)}>Append to Ep {ep.id}: {ep.title}</option>)}
                      </select>
                      <button onClick={applyBreakdown} className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                        <Check className="w-3 h-3" />Apply Breakdown
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Episodes Table with Expandable Panels */}
          <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
            <div className="p-4 space-y-1">
              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm text-gray-400">No episodes match your filters</p>
                  <p className="text-xs text-gray-600 mt-1">Try &quot;Active&quot; or &quot;All&quot; to see more</p>
                </div>
              )}
              {filtered.map((ep) => {
                const sc = episodeStatusConfig[ep.status];
                const Icon = sc.icon;
                const approvedCount = ep.panels.filter(p => p.status === "approved").length;
                const progress = ep.panels.length > 0 ? Math.round((approvedCount / ep.panels.length) * 100) : 0;
                return (
                  <div key={ep.id} className={`bg-[#13131a] rounded-lg border border-white/5 overflow-hidden ${ep.status === "archived" ? "opacity-60" : ""}`}>
                    {/* Episode Row */}
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition cursor-pointer" onClick={() => toggleExpand(ep.id)}>
                      {ep.expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon className={`w-3.5 h-3.5 ${sc.color} shrink-0`} />
                        <span className="text-sm font-semibold text-white truncate">Ep {ep.id}: {ep.title}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded shrink-0">{ep.arc}</span>
                        <span className="text-[10px] text-gray-500 truncate hidden xl:inline">{ep.summary}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span>{ep.pages}pg</span><span>•</span><span>{ep.panels.length}pn</span>
                        </div>
                        {ep.panels.length > 0 && (
                          <div className="w-16 bg-white/5 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-purple-500"}`} style={{ width: `${progress}%` }} />
                          </div>
                        )}
                        {/* Status Dropdown */}
                        <select value={ep.status} onChange={(e) => { e.stopPropagation(); changeEpisodeStatus(ep.id, e.target.value as EpisodeStatus); }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[10px] font-semibold px-2 py-1 rounded ${sc.bg} ${sc.color} bg-transparent border-0 focus:outline-none cursor-pointer appearance-none`}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Expanded Panels (Panel Manager) */}
                    {ep.expanded && (
                      <div className="border-t border-white/5 bg-[#0f1117]">
                        {ep.panels.length === 0 ? (
                          <div className="px-6 py-6 text-center">
                            <p className="text-xs text-gray-500 mb-2">No panels yet</p>
                            <button className="px-4 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium transition border border-purple-500/20">
                              + Add Panel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="px-5 py-3 space-y-2">
                              {ep.panels.map((panel, pi) => {
                                const ps = panelStatusConfig[panel.status];
                                return (
                                  <div key={panel.id} className="bg-[#13131a] rounded-lg border border-white/5 hover:border-white/10 transition overflow-hidden">
                                    {/* Panel header row */}
                                    <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
                                      <GripVertical className="w-3 h-3 text-gray-700 cursor-grab shrink-0" />
                                      <div className="w-8 h-8 rounded bg-[#1a1a24] border border-white/10 flex items-center justify-center shrink-0">
                                        {panel.thumbnail ? <span className="text-sm">{panel.thumbnail}</span> : <Eye className="w-3 h-3 text-gray-600" />}
                                      </div>
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[9px] font-bold shrink-0">P{pi + 1}</span>
                                        <span className="text-[10px] text-gray-400 font-mono shrink-0">Pg {panel.page}</span>
                                        <span className="text-[10px] text-gray-500 shrink-0">{panel.panelType}</span>
                                      </div>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${ps.bg} ${ps.color}`}>{ps.label}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {panel.status === "review" && (
                                          <>
                                            <button onClick={() => changePanelStatus(ep.id, panel.id, "approved")} className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition" title="Approve"><Check className="w-3 h-3" /></button>
                                            <button onClick={() => changePanelStatus(ep.id, panel.id, "redo")} className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition" title="Redo"><X className="w-3 h-3" /></button>
                                          </>
                                        )}
                                        <button onClick={() => editPage(ep.id, panel.page)} className="p-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition" title="Edit"><ExternalLink className="w-3 h-3" /></button>
                                        <button className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 transition" title="Regenerate"><RefreshCw className="w-3 h-3" /></button>
                                        <button className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-500 hover:text-red-400 transition" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                    </div>
                                    {/* Panel detail body */}
                                    <div className="px-4 py-2.5 space-y-2">
                                      {/* Description */}
                                      <div>
                                        <span className="text-[8px] text-gray-600 uppercase font-semibold tracking-wider">Description</span>
                                        <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">{panel.description}</p>
                                      </div>
                                      {/* Dialogue */}
                                      {panel.dialogue && (
                                        <div>
                                          <span className="text-[8px] text-yellow-500/80 uppercase font-semibold tracking-wider">Dialogue</span>
                                          <p className="text-[11px] text-yellow-400 mt-0.5 italic bg-yellow-500/5 rounded px-2 py-1 border-l-2 border-yellow-500/30">{panel.dialogue}</p>
                                        </div>
                                      )}
                                      {/* Characters, Scene, Props row */}
                                      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                        {panel.characters && panel.characters.length > 0 && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[8px] text-orange-500/80 uppercase font-semibold">Characters</span>
                                            <div className="flex gap-1">
                                              {panel.characters.map(c => <span key={c} className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[9px] font-medium">{c}</span>)}
                                            </div>
                                          </div>
                                        )}
                                        {panel.scene && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[8px] text-blue-500/80 uppercase font-semibold">Scene</span>
                                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-medium">{panel.scene}</span>
                                          </div>
                                        )}
                                        {panel.props && panel.props.length > 0 && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[8px] text-emerald-500/80 uppercase font-semibold">Props</span>
                                            <div className="flex gap-1">
                                              {panel.props.map(p => <span key={p} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-medium">{p}</span>)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Add Panel */}
                            <div className="px-5 py-2 bg-[#0a0a0f]">
                              <button className="w-full py-1.5 border border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-[10px] text-gray-500 hover:text-purple-400 transition flex items-center justify-center gap-1">
                                <Plus className="w-3 h-3" />Add Panel to Episode {ep.id}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
