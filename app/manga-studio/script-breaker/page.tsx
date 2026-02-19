"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { FileText, Sparkles, ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Layers, Upload, Wand2, BookOpen, Edit3, Check, RefreshCw, UserPlus, ChevronLeft, Palette, X as XIcon, ArrowRight, Image as ImageIcon, MapPin, Package, Camera } from "lucide-react";

interface PanelBreakdown { id: number; description: string; panelType: string; framing: string; characters: string[]; dialogue: string; }
interface PageBreakdown { id: number; pageNumber: number; panels: PanelBreakdown[]; expanded: boolean; }
interface EpisodeBreakdown { id: number; title: string; summary: string; pages: PageBreakdown[]; expanded: boolean; }
interface ExtractedCharacter { id: string; name: string; role: "main" | "supporting" | "minor"; appearance: string; shortDescription: string; storySummary: string; confirmed: boolean; selected: boolean; }
interface ExtractedScene { id: string; title: string; description: string; characters: string[]; location: string; mood: string; cameraAngle: string; selected: boolean; }
interface ExtractedProp { id: string; name: string; description: string; category: string; scenes: string[]; selected: boolean; }
interface Chapter { id: string; title: string; content: string; }

type WizardStep = "comic-info" | "story" | "characters" | "scenes" | "breakdown";
type StoryMode = "add-content" | "ai-generation";

const DRAWING_STYLES = [
  // Row 1 — User-requested styles
  { id: "3d-cartoon", label: "3D Cartoon", desc: "Stylized 3D render look", gradient: "from-sky-400 to-blue-500", emoji: "🧊" },
  { id: "disney", label: "Disney", desc: "Classic Disney animation", gradient: "from-blue-400 to-purple-500", emoji: "🏰" },
  { id: "epic", label: "Epic", desc: "Cinematic grand scale", gradient: "from-amber-600 to-red-700", emoji: "⚔️" },
  { id: "realistic", label: "Realistic", desc: "Photo-realistic rendering", gradient: "from-gray-500 to-slate-700", emoji: "📸" },
  { id: "ghibli", label: "Ghibli", desc: "Studio Ghibli watercolor", gradient: "from-green-400 to-emerald-500", emoji: "🌿" },
  { id: "kids-story", label: "Kids Story", desc: "Bright, friendly children style", gradient: "from-yellow-300 to-orange-400", emoji: "🧸" },
  { id: "animals", label: "Animals", desc: "Cute animal characters", gradient: "from-amber-400 to-yellow-500", emoji: "🐾" },
  { id: "suspense", label: "Suspense", desc: "Dark thriller atmosphere", gradient: "from-gray-800 to-red-900", emoji: "🔍" },
  { id: "painting", label: "Painting", desc: "Oil painting fine art", gradient: "from-amber-500 to-orange-600", emoji: "🖼️" },
  { id: "lol", label: "LOL", desc: "Meme & humor cartoon", gradient: "from-yellow-400 to-pink-400", emoji: "😂" },
  { id: "clay", label: "Clay", desc: "Claymation stop-motion", gradient: "from-orange-400 to-red-400", emoji: "🏺" },
  { id: "cyberpunk", label: "Cyberpunk", desc: "Neon futuristic world", gradient: "from-purple-600 to-cyan-500", emoji: "🌆" },
  { id: "gta", label: "GTA", desc: "Grand Theft Auto poster", gradient: "from-orange-500 to-yellow-400", emoji: "🚗" },
  { id: "comic", label: "Comic", desc: "Classic comic book style", gradient: "from-red-500 to-blue-600", emoji: "💥" },
  { id: "anime", label: "Anime", desc: "Modern Japanese anime", gradient: "from-pink-500 to-purple-500", emoji: "✨" },
  { id: "josei-romance", label: "Josei Romance", desc: "Mature romance manga", gradient: "from-rose-400 to-pink-500", emoji: "💕" },
  { id: "zootopia", label: "Zootopia", desc: "Anthropomorphic animal city", gradient: "from-green-400 to-blue-400", emoji: "🦊" },
  { id: "meow", label: "Meow", desc: "Cat-themed kawaii style", gradient: "from-pink-300 to-purple-400", emoji: "🐱" },
  // Row 2 — Original styles
  { id: "normal-anime", label: "Normal Anime", desc: "Classic anime aesthetic", gradient: "from-pink-500 to-violet-500", emoji: "💜" },
  { id: "neon-punk", label: "Neon Punk", desc: "Cyberpunk neon glow", gradient: "from-purple-600 to-blue-500", emoji: "🌃" },
  { id: "monochrome", label: "Monochrome", desc: "Black & white grayscale", gradient: "from-gray-500 to-gray-700", emoji: "⚫" },
  { id: "gothic", label: "Gothic", desc: "Dark ornate Victorian", gradient: "from-gray-700 to-purple-900", emoji: "🦇" },
  { id: "heightened-line-art", label: "Line Art", desc: "Bold expressive linework", gradient: "from-red-500 to-pink-500", emoji: "✍️" },
  { id: "analog-film", label: "Analog Film", desc: "Vintage film grain", gradient: "from-yellow-700 to-orange-800", emoji: "📷" },
  { id: "fantasy-art", label: "Fantasy Art", desc: "Ethereal high fantasy", gradient: "from-emerald-500 to-teal-500", emoji: "🧙" },
  { id: "superhero-comic", label: "Superhero Comic", desc: "Dynamic hero poses", gradient: "from-blue-500 to-red-500", emoji: "🦸" },
  { id: "manhwa-romance", label: "Manhwa Romance", desc: "Soft Korean romance", gradient: "from-pink-400 to-rose-500", emoji: "💗" },
  { id: "manhwa-action", label: "Manhwa Action", desc: "Dynamic Korean action", gradient: "from-red-500 to-orange-500", emoji: "⚡" },
  { id: "cel-art", label: "Cel Art", desc: "Cel shaded animation", gradient: "from-blue-500 to-cyan-400", emoji: "🎬" },
  { id: "watercolor", label: "Watercolor", desc: "Soft watercolor washes", gradient: "from-cyan-400 to-purple-400", emoji: "🎨" },
  { id: "webtoon", label: "Webtoon", desc: "Clean Korean webtoon", gradient: "from-green-400 to-blue-400", emoji: "📱" },
  { id: "noir", label: "Noir", desc: "High contrast noir", gradient: "from-gray-900 to-gray-600", emoji: "🕶️" },
  { id: "ink-coloring", label: "Ink & Color", desc: "Traditional ink + flat", gradient: "from-gray-800 to-orange-600", emoji: "🖊️" },
  { id: "toon-cartoon", label: "Toon / Cartoon", desc: "Playful cartoon style", gradient: "from-yellow-400 to-green-400", emoji: "🌟" },
];

export default function ScriptBreakerPage() {
  // Wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>("comic-info");

  // Step 1: Comic Info
  const [comicTitle, setComicTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("normal-anime");
  const [customStyleActive, setCustomStyleActive] = useState(false);
  const [customStyleText, setCustomStyleText] = useState("");

  // Step 2: Story
  const [storyMode, setStoryMode] = useState<StoryMode>("add-content");
  const [script, setScript] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");

  // Step 2: Story — Chapters
  const [chapters, setChapters] = useState<Chapter[]>([{ id: "ch-1", title: "Chapter 1", content: "" }]);
  const [activeChapterId, setActiveChapterId] = useState("ch-1");

  // Step 3: Characters
  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([]);
  const [isExtractingCharacters, setIsExtractingCharacters] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // Step 4: Scenes & Props
  const [extractedScenes, setExtractedScenes] = useState<ExtractedScene[]>([]);
  const [extractedProps, setExtractedProps] = useState<ExtractedProp[]>([]);
  const [isExtractingScenes, setIsExtractingScenes] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [scenesPropsTab, setScenesPropsTab] = useState<"scenes" | "props">("scenes");

  // Step 5: Breakdown
  const [episodes, setEpisodes] = useState<EpisodeBreakdown[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetEpisodes, setTargetEpisodes] = useState("auto");
  const [panelsPerPage, setPanelsPerPage] = useState("5");
  const [mangaFormat, setMangaFormat] = useState("webtoon");

  // Derived
  const storyText = script || generatedStory;
  const wordCount = storyText.trim() ? storyText.trim().split(/\s+/).length : 0;
  const totalPanels = episodes.reduce((sum, ep) => sum + ep.pages.reduce((ps, pg) => ps + pg.panels.length, 0), 0);
  const totalPages = episodes.reduce((sum, ep) => sum + ep.pages.length, 0);

  const steps: { id: WizardStep; label: string; num: number }[] = [
    { id: "comic-info", label: "Style", num: 1 },
    { id: "story", label: "Story", num: 2 },
    { id: "characters", label: "Characters", num: 3 },
    { id: "scenes", label: "Scenes & Props", num: 4 },
    { id: "breakdown", label: "Panels", num: 5 },
  ];
  const stepIdx = steps.findIndex(s => s.id === currentStep);
  const selectedChar = extractedCharacters.find(c => c.id === selectedCharId) || extractedCharacters[0] || null;
  const selectedScene = extractedScenes.find(s => s.id === selectedSceneId) || extractedScenes[0] || null;

  const canGoNext = () => {
    if (currentStep === "comic-info") return comicTitle.trim().length > 0;
    if (currentStep === "story") return storyText.trim().length > 0;
    if (currentStep === "characters") return extractedCharacters.length > 0;
    if (currentStep === "scenes") return extractedScenes.length > 0;
    return true;
  };

  const activeStyleLabel = customStyleActive ? (customStyleText || "Custom") : DRAWING_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle;

  // Handlers
  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingStory(true);
    setTimeout(() => {
      const generated = "Kaito Hayashi is a 16-year-old high school student who has never played basketball. One evening, walking home from cram school, he stumbles upon a street basketball game under the highway overpass. A particular player \u2014 tall, with wild hair and a fierce grin \u2014 executes a slam dunk that seems to defy physics. Something ignites inside Kaito.\n\nThe next morning, Kaito marches into the gym of Seirin High School and demands to join the basketball team. Coach Tanaka looks at his small frame and laughs. \"Have you ever even touched a basketball?\" Kaito shakes his head but refuses to leave.\n\nHis first practice is a disaster. He trips over his own feet. \"Who let this shrimp in?\" whispers Takeshi, the shooting guard. But Ryu Kagami, the team captain and best player in the prefecture, watches silently from the bleachers.\n\nThat night, Kaito stays in the gym alone. Ryu appears in the doorway. \"One-on-one. Tomorrow. Score even once against me, and you stay on the team.\"\n\nThe challenge spreads like wildfire. The gym is packed. Ryu moves like water \u2014 every dribble, every feint is perfection. Kaito falls, gets up, falls again. His knees bleed. But he keeps getting up.\n\nIn the final minute, Kaito sees an opening. He darts right with a burst of speed and releases a wild, off-balance shot. The ball rattles around the rim\u2026 and drops in. The gym erupts. Ryu smiles. \"Welcome to the team.\"";
      setGeneratedStory(generated);
      setScript(generated);
      setIsGeneratingStory(false);
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => { setScript(ev.target?.result as string); };
    reader.readAsText(file);
  };

  const handleExtractCharacters = () => {
    if (!storyText.trim()) return;
    setIsExtractingCharacters(true);
    setTimeout(() => {
      const chars: ExtractedCharacter[] = [
        { id: "kaito", name: "Kaito Hayashi", role: "main", appearance: "16-year-old male, short black hair, small build, determined brown eyes, Seirin High uniform", shortDescription: "Inexperienced but determined student who discovers basketball", storySummary: "Protagonist who joins the team with zero experience. His raw speed and determination earn him a spot after scoring against captain Ryu.", confirmed: false, selected: true },
        { id: "ryu", name: "Ryu Kagami", role: "main", appearance: "17-year-old male, tall athletic build, wild dark hair, intense sharp eyes, team captain jersey", shortDescription: "Prodigious team captain and best player in the prefecture", storySummary: "Recognizes Kaito\u2019s hidden potential. Challenges him to a one-on-one, then welcomes him to the team.", confirmed: false, selected: false },
        { id: "tanaka", name: "Coach Tanaka", role: "supporting", appearance: "Middle-aged male, grizzled veteran, stern face, tracksuit, coaching whistle", shortDescription: "Experienced but skeptical basketball team coach", storySummary: "Initially skeptical of Kaito but allows him to try out.", confirmed: false, selected: false },
        { id: "takeshi", name: "Takeshi", role: "minor", appearance: "High school male, average build, shooting guard, dismissive expression", shortDescription: "Team shooting guard who mocks Kaito", storySummary: "Represents the skeptics who doubt Kaito\u2019s ability.", confirmed: false, selected: false },
      ];
      setExtractedCharacters(chars);
      setSelectedCharId(chars[0].id);
      setIsExtractingCharacters(false);
    }, 2500);
  };

  const handleExtractScenes = () => {
    if (!storyText.trim()) return;
    setIsExtractingScenes(true);
    setTimeout(() => {
      const scenes: ExtractedScene[] = [
        { id: "sc-1", title: "Street Basketball Game", description: "Highway overpass at sunset. A street basketball game is in full swing under flickering lights. A player executes a gravity-defying slam dunk.", characters: ["Kaito", "Street Player"], location: "Highway Overpass", mood: "Exciting, Inspiring", cameraAngle: "Wide Shot", selected: true },
        { id: "sc-2", title: "Gym Confrontation", description: "Seirin High gym, morning. Kaito stands nervously at the door while Coach Tanaka sits inside with clipboard.", characters: ["Kaito", "Coach Tanaka"], location: "School Gym", mood: "Tense, Determined", cameraAngle: "Medium Shot", selected: false },
        { id: "sc-3", title: "First Practice Disaster", description: "Gym during practice. Kaito fails at every drill — tripping, dropping the ball. Team members snicker in the background.", characters: ["Kaito", "Takeshi", "Team"], location: "School Gym", mood: "Humiliating, Frustrating", cameraAngle: "Various / Montage", selected: false },
        { id: "sc-4", title: "Midnight Practice", description: "Empty gym at night. Moon visible through windows. Kaito practices alone, shooting basket after basket. Ryu watches from the doorway.", characters: ["Kaito", "Ryu"], location: "School Gym (Night)", mood: "Lonely, Determined", cameraAngle: "Wide Shot", selected: false },
        { id: "sc-5", title: "The One-on-One Challenge", description: "Packed gym. Students fill the bleachers. Kaito and Ryu face off at center court. Intense atmosphere.", characters: ["Kaito", "Ryu", "Crowd"], location: "School Gym (Full)", mood: "Epic, Climactic", cameraAngle: "Dramatic Low Angle", selected: false },
        { id: "sc-6", title: "The Winning Shot", description: "Final moment — Kaito darts right, releases an off-balance shot. The ball rattles around the rim and drops in. Gym erupts. Ryu smiles.", characters: ["Kaito", "Ryu"], location: "School Gym (Full)", mood: "Triumphant, Emotional", cameraAngle: "Close-up → Wide", selected: false },
      ];
      const props: ExtractedProp[] = [
        { id: "pr-1", name: "Basketball", description: "Standard orange basketball used in games and practice", category: "Sports Equipment", scenes: ["sc-1", "sc-3", "sc-4", "sc-5", "sc-6"], selected: true },
        { id: "pr-2", name: "Team Captain Jersey", description: "Seirin High #1 jersey worn by Ryu Kagami", category: "Clothing", scenes: ["sc-5", "sc-6"], selected: false },
        { id: "pr-3", name: "Coaching Whistle", description: "Silver whistle on lanyard worn by Coach Tanaka", category: "Accessory", scenes: ["sc-2", "sc-3"], selected: false },
        { id: "pr-4", name: "Bleachers", description: "Wooden gymnasium bleachers filled with student spectators", category: "Environment", scenes: ["sc-5", "sc-6"], selected: false },
        { id: "pr-5", name: "Oversized Uniform", description: "Ill-fitting practice uniform given to Kaito on his first day", category: "Clothing", scenes: ["sc-3"], selected: false },
      ];
      setExtractedScenes(scenes);
      setExtractedProps(props);
      setSelectedSceneId(scenes[0].id);
      setIsExtractingScenes(false);
    }, 2500);
  };

  const confirmCharacter = (id: string) => { setExtractedCharacters(prev => prev.map(c => c.id === id ? { ...c, confirmed: true } : c)); };
  const confirmAllCharacters = () => { setExtractedCharacters(prev => prev.map(c => ({ ...c, confirmed: true }))); };
  const toggleEpisode = (id: number) => { setEpisodes(prev => prev.map(ep => ep.id === id ? { ...ep, expanded: !ep.expanded } : ep)); };
  const togglePage = (epId: number, pgId: number) => { setEpisodes(prev => prev.map(ep => ep.id === epId ? { ...ep, pages: ep.pages.map(pg => pg.id === pgId ? { ...pg, expanded: !pg.expanded } : pg) } : ep)); };
  const addChapter = () => {
    const id = `ch-${Date.now()}`;
    setChapters(prev => [...prev, { id, title: `Chapter ${prev.length + 1}`, content: "" }]);
    setActiveChapterId(id);
  };

  const handleBreakdown = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setEpisodes([
        { id: 1, title: "Episode 1: The Beginning", summary: "Kaito discovers basketball.", expanded: true, pages: [
          { id: 1, pageNumber: 1, expanded: true, panels: [
            { id: 1, description: "Wide establishing shot — school rooftop, sunset. Kaito watches a street game below.", panelType: "Establishing", framing: "Wide", characters: ["Kaito"], dialogue: "" },
            { id: 2, description: "Close-up of Kaito's eyes reflecting the game.", panelType: "Close-up", framing: "Extreme Close-up", characters: ["Kaito"], dialogue: "" },
            { id: 3, description: "Action panel — a player dunks with speed lines.", panelType: "Action", framing: "Full Body", characters: ["Street Player"], dialogue: "" },
          ]},
          { id: 2, pageNumber: 2, expanded: false, panels: [
            { id: 4, description: "Next morning — Kaito at the gym door, nervous.", panelType: "Dramatic Reveal", framing: "Bust Shot", characters: ["Kaito", "Coach"], dialogue: "Kaito: \"I want to join the basketball team.\"" },
            { id: 5, description: "Coach looks at Kaito's small frame. Skeptical.", panelType: "Reaction", framing: "Close-up", characters: ["Coach"], dialogue: "Coach: \"Have you ever played before?\"" },
            { id: 6, description: "Silent panel — Kaito shakes his head.", panelType: "Silent", framing: "Bust Shot", characters: ["Kaito"], dialogue: "" },
          ]},
        ]},
        { id: 2, title: "Episode 2: First Practice", summary: "Kaito's first practice is a disaster.", expanded: false, pages: [
          { id: 3, pageNumber: 1, expanded: false, panels: [
            { id: 7, description: "Morning gym — team warming up.", panelType: "Establishing", framing: "Wide", characters: ["Kaito", "Team"], dialogue: "" },
            { id: 8, description: "Montage — Kaito failing at drills, tripping over.", panelType: "Action", framing: "Various", characters: ["Kaito"], dialogue: "" },
            { id: 9, description: "Team members whispering, laughing.", panelType: "Reaction", framing: "Two-Shot", characters: ["Team Members"], dialogue: "\"Who let this guy in?\"" },
          ]},
          { id: 4, pageNumber: 2, expanded: false, panels: [
            { id: 10, description: "Kaito alone at court. Moon rising through windows.", panelType: "Establishing", framing: "Wide", characters: ["Kaito"], dialogue: "" },
            { id: 11, description: "Ryu watches from doorway, arms crossed.", panelType: "Close-up", framing: "Bust Shot", characters: ["Ryu"], dialogue: "" },
          ]},
        ]},
        { id: 3, title: "Episode 3: The Challenge", summary: "Ryu challenges Kaito to a one-on-one.", expanded: false, pages: [
          { id: 5, pageNumber: 1, expanded: false, panels: [
            { id: 12, description: "Ryu approaches Kaito. Tension.", panelType: "Two-Shot", framing: "Bust Shot", characters: ["Kaito", "Ryu"], dialogue: "Ryu: \"One-on-one. Score once, you stay.\"" },
            { id: 13, description: "Splash — gym packed, center court.", panelType: "Splash Page", framing: "Wide", characters: ["Kaito", "Ryu", "Crowd"], dialogue: "" },
          ]},
          { id: 6, pageNumber: 2, expanded: false, panels: [
            { id: 14, description: "Action — Ryu dribbles past Kaito.", panelType: "Action", framing: "Full Body", characters: ["Kaito", "Ryu"], dialogue: "" },
            { id: 15, description: "Kaito falls but gets back up.", panelType: "Impact", framing: "Close-up", characters: ["Kaito"], dialogue: "Kaito: \"Again.\"" },
          ]},
        ]},
      ]);
      setIsProcessing(false);
    }, 2500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] overflow-hidden">
      {/* Header with step indicator */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Create Comic</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">{comicTitle || "Untitled"} {creatorName && <span>&bull; by {creatorName}</span>} {activeStyleLabel && <span>&bull; {activeStyleLabel}</span>}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <button key={step.id} onClick={() => setCurrentStep(step.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition flex items-center gap-1.5 ${
                  step.id === currentStep ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                  i < stepIdx ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  "bg-white/5 text-gray-500 border border-white/5"
                }`}>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                  i < stepIdx ? "bg-emerald-500 text-white" : step.id === currentStep ? "bg-purple-500 text-white" : "bg-white/10 text-gray-500"
                }`}>{i < stepIdx ? "\u2713" : step.num}</span>
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">

          {/* ═══ STEP 1: Comic Information ═══ */}
          {currentStep === "comic-info" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Comic Information</h2>
                <p className="text-sm text-gray-400">Set up your comic title, creator name, and choose a drawing style</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Comic Title</label>
                  <input type="text" value={comicTitle} onChange={(e) => setComicTitle(e.target.value)} placeholder="Give your comic a name..."
                    className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Creator</label>
                  <input type="text" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="Your pen name..."
                    className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>

              {/* Drawing Style */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Choose A Drawing Style</label>
                  <button onClick={() => { setCustomStyleActive(!customStyleActive); if (!customStyleActive) setSelectedStyle(""); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${customStyleActive ? "bg-pink-500/20 border border-pink-500/30 text-pink-400" : "bg-white/5 border border-white/10 text-gray-400 hover:text-gray-300"}`}>
                    <Palette className="w-3 h-3" />{customStyleActive ? "Using Custom Style" : "Custom Style"}
                  </button>
                </div>

                {customStyleActive && (
                  <div className="mb-4">
                    <div className="relative">
                      <input type="text" value={customStyleText} onChange={(e) => setCustomStyleText(e.target.value)}
                        placeholder="e.g. Naruto style, Bleach style, Ghibli style..."
                        className="w-full px-4 py-3 bg-[#13131a] border border-pink-500/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50" />
                      <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5">AI translates this into an IP-safe art direction automatically</p>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-2.5">
                  {DRAWING_STYLES.map((style) => (
                    <button key={style.id} onClick={() => { setSelectedStyle(style.id); setCustomStyleActive(false); }}
                      className={`relative rounded-xl overflow-hidden border-2 transition group ${
                        !customStyleActive && selectedStyle === style.id ? "border-purple-500 ring-2 ring-purple-500/30" : "border-transparent hover:border-white/20"
                      }`}>
                      <div className={`aspect-4/3 bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                        <span className="text-3xl">{style.emoji}</span>
                        {!customStyleActive && selectedStyle === style.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-[#13131a]">
                        <p className="text-[10px] font-semibold text-white truncate">{style.label}</p>
                        <p className="text-[8px] text-gray-500 truncate">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setCurrentStep("story")} disabled={!canGoNext()}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Tell a Story (with chapters sidebar) ═══ */}
          {currentStep === "story" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Tell a Story</h2>
                  <p className="text-sm text-gray-400">Inputed content preferably within 1000 words</p>
                </div>
                <div className="flex gap-1 bg-[#13131a] rounded-lg p-1">
                  <button onClick={() => setStoryMode("add-content")}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${storyMode === "add-content" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"}`}>
                    <Edit3 className="w-3.5 h-3.5" /> Add content
                  </button>
                  <button onClick={() => setStoryMode("ai-generation")}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${storyMode === "ai-generation" ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-gray-300"}`}>
                    <Wand2 className="w-3.5 h-3.5" /> AI Generation
                  </button>
                </div>
              </div>

              <div className="flex gap-4" style={{ minHeight: 440 }}>
                {/* Left: Chapters sidebar */}
                <div className="w-44 shrink-0 space-y-2">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Chapters</p>
                  <button onClick={addChapter} className="w-full px-3 py-2 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl text-[10px] text-gray-500 hover:text-purple-400 transition flex items-center justify-center gap-1"><Plus className="w-3 h-3" />New chapter</button>
                  {chapters.map((ch) => (
                    <button key={ch.id} onClick={() => setActiveChapterId(ch.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition text-xs font-medium ${activeChapterId === ch.id ? "bg-purple-500/10 border-purple-500/30 text-white" : "bg-[#13131a] border-white/10 text-gray-400 hover:border-white/20"}`}>
                      {ch.title}
                    </button>
                  ))}
                </div>

                {/* Right: Content area */}
                <div className="flex-1 space-y-3">
                  {storyMode === "add-content" && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-400">Body Text</label>
                        <div className="flex items-center gap-2">
                          <input ref={fileInputRef} type="file" accept=".txt,.pdf,.md,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                          <button onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-semibold transition flex items-center gap-1">
                            <Upload className="w-3 h-3" />Upload TXT/PDF
                          </button>
                        </div>
                      </div>
                      {uploadedFileName && (
                        <div className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-semibold">{uploadedFileName}</span>
                          <span className="text-[10px] text-gray-500">{wordCount} words</span>
                          <button onClick={() => { setUploadedFileName(""); setScript(""); }} className="ml-auto text-gray-500 hover:text-red-400 transition"><XIcon className="w-3 h-3" /></button>
                        </div>
                      )}
                      <textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Enter Your Story..."
                        className="w-full bg-[#13131a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition resize-none leading-relaxed" rows={14} />
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-500">{wordCount > 0 ? `${wordCount} words` : "Write or paste your story, or upload a file"}</p>
                        <p className="text-[10px] text-gray-600">Skip story and start directly from the panel? <button onClick={() => setCurrentStep("breakdown")} className="text-purple-400 hover:text-purple-300 underline">Click to Skip</button></p>
                      </div>
                    </>
                  )}

                  {storyMode === "ai-generation" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Everything you know about the story</label>
                        <div className="flex gap-3">
                          <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe your story idea briefly... e.g. A short high school student discovers basketball and must prove himself."
                            className="flex-1 bg-[#13131a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition resize-none" rows={3} />
                          <button onClick={handleAIGenerate} disabled={!aiPrompt.trim() || isGeneratingStory}
                            className="px-6 bg-[#13131a] border border-white/10 hover:border-purple-500/30 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2 shrink-0">
                            {isGeneratingStory ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
                            Generate
                          </button>
                        </div>
                      </div>
                      {generatedStory && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400">Generated Story</span>
                            <div className="flex items-center gap-2">
                              <button onClick={handleAIGenerate} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[10px] transition flex items-center gap-1"><RefreshCw className="w-3 h-3" />Regenerate</button>
                              <button onClick={() => { setScript(generatedStory); setStoryMode("add-content"); }}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"><Edit3 className="w-3 h-3" />Edit</button>
                            </div>
                          </div>
                          <div className="bg-[#13131a] border border-purple-500/10 rounded-xl px-5 py-4 text-sm text-gray-300 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-line">{generatedStory}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setCurrentStep("comic-info")} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm font-medium transition flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => { if (storyText.trim()) { setCurrentStep("characters"); if (extractedCharacters.length === 0) handleExtractCharacters(); } }} disabled={!canGoNext()}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Characters (Comica.ai 3-column) ═══ */}
          {currentStep === "characters" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Character Design</h2>
                  <p className="text-sm text-gray-400">AI identified {extractedCharacters.length} characters. Select one to preview and edit.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={confirmAllCharacters} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"><Check className="w-3 h-3" />Confirm All</button>
                  <button className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"><UserPlus className="w-3 h-3" />Save to Library</button>
                </div>
              </div>

              {isExtractingCharacters ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Extracting characters from story...</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4" style={{ minHeight: 460 }}>
                  {/* Left: Character list */}
                  <div className="w-48 shrink-0 space-y-2">
                    <button className="w-full px-3 py-2 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl text-[10px] text-gray-500 hover:text-purple-400 transition flex items-center justify-center gap-1"><Plus className="w-3 h-3" />New Character</button>
                    {extractedCharacters.map((char) => (
                      <button key={char.id} onClick={() => setSelectedCharId(char.id)}
                        className={`w-full text-left p-3 rounded-xl border transition ${selectedCharId === char.id ? "bg-purple-500/10 border-purple-500/30" : "bg-[#13131a] border-white/10 hover:border-white/20"}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                            char.role === "main" ? "bg-pink-500/20 text-pink-400" :
                            char.role === "supporting" ? "bg-blue-500/20 text-blue-400" :
                            "bg-gray-500/20 text-gray-400"
                          }`}>{char.name.charAt(0)}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{char.name}</p>
                            <p className="text-[9px] text-gray-500 capitalize">{char.role}</p>
                          </div>
                        </div>
                        {char.confirmed && <span className="text-[8px] text-emerald-400 mt-1 block ml-12">✓ Confirmed</span>}
                      </button>
                    ))}
                  </div>

                  {/* Center: Image preview */}
                  <div className="flex-1 bg-[#13131a] rounded-xl border border-white/10 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
                      <ImageIcon className="w-12 h-12 text-pink-400/30" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{selectedChar?.name || "Select a character"}</p>
                    <p className="text-xs text-gray-500 mb-4">{selectedChar?.role ? `${selectedChar.role.charAt(0).toUpperCase() + selectedChar.role.slice(1)} Character` : ""}</p>
                    {selectedChar && (
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Generate Image</button>
                        <button className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs transition"><RefreshCw className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>

                  {/* Right: Properties panel */}
                  {selectedChar && (
                    <div className="w-64 shrink-0 space-y-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Name</label>
                        <input type="text" defaultValue={selectedChar.name} className="w-full px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Role</label>
                        <div className="flex gap-1">
                          {(["main", "supporting", "minor"] as const).map(r => (
                            <span key={r} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${selectedChar.role === r ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-gray-500 border border-white/5"}`}>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Appearance Description</label>
                        <textarea defaultValue={selectedChar.appearance} className="w-full px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed" rows={4} />
                        <p className="text-[9px] text-gray-600 mt-0.5 text-right">{selectedChar.appearance.length} / 1000</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Story Summary</label>
                        <textarea defaultValue={selectedChar.storySummary} className="w-full px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none" rows={3} />
                      </div>
                      {!selectedChar.confirmed ? (
                        <button onClick={() => confirmCharacter(selectedChar.id)} className="w-full px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" />Confirm Character</button>
                      ) : (
                        <div className="px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-semibold text-center flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" />Confirmed</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setCurrentStep("story")} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm font-medium transition flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => { setCurrentStep("scenes"); if (extractedScenes.length === 0) handleExtractScenes(); }} disabled={!canGoNext()}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Scenes & Props ═══ */}
          {currentStep === "scenes" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Scenes & Props</h2>
                  <p className="text-sm text-gray-400">AI extracted scenes and props from your story. Review and edit before generating panels.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-semibold">{extractedScenes.length} Scenes</span>
                  <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 font-semibold">{extractedProps.length} Props</span>
                </div>
              </div>

              {/* Scenes / Props toggle */}
              <div className="flex gap-1 bg-[#13131a] rounded-lg p-1 w-fit">
                <button onClick={() => setScenesPropsTab("scenes")} className={`px-5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${scenesPropsTab === "scenes" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"}`}><MapPin className="w-3.5 h-3.5" />Scenes</button>
                <button onClick={() => setScenesPropsTab("props")} className={`px-5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${scenesPropsTab === "props" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"}`}><Package className="w-3.5 h-3.5" />Props</button>
              </div>

              {isExtractingScenes ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Extracting scenes and props from story...</p>
                  </div>
                </div>
              ) : scenesPropsTab === "scenes" ? (
                <div className="flex gap-4" style={{ minHeight: 420 }}>
                  {/* Left: Scene list */}
                  <div className="w-56 shrink-0 space-y-2">
                    {extractedScenes.map((sc, i) => (
                      <button key={sc.id} onClick={() => setSelectedSceneId(sc.id)}
                        className={`w-full text-left p-3 rounded-xl border transition ${selectedSceneId === sc.id || (!selectedSceneId && i === 0) ? "bg-purple-500/10 border-purple-500/30" : "bg-[#13131a] border-white/10 hover:border-white/20"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-blue-400" /></div>
                          <span className="text-xs font-semibold text-white truncate">{sc.title}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 ml-10">{sc.description}</p>
                      </button>
                    ))}
                  </div>
                  {/* Center: Preview */}
                  <div className="flex-1 bg-[#13131a] rounded-xl border border-white/10 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4"><ImageIcon className="w-10 h-10 text-blue-400/30" /></div>
                      <p className="text-sm font-semibold text-white mb-1">{selectedScene?.title || "Select a scene"}</p>
                      <p className="text-xs text-gray-400 max-w-md">{selectedScene?.description}</p>
                      <button className="mt-4 px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 mx-auto"><Sparkles className="w-3.5 h-3.5" />Generate Image</button>
                    </div>
                  </div>
                  {/* Right: Properties */}
                  {selectedScene && (
                    <div className="w-64 shrink-0 space-y-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Location</label>
                        <div className="px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white">{selectedScene.location}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Mood</label>
                        <div className="px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white">{selectedScene.mood}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Camera Angle</label>
                        <div className="px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-gray-400" />{selectedScene.cameraAngle}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Characters in Scene</label>
                        <div className="flex flex-wrap gap-1">{selectedScene.characters.map(c => <span key={c} className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-[10px] font-semibold">{c}</span>)}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">Image Description</label>
                        <textarea defaultValue={selectedScene.description} className="w-full px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500/50 resize-none" rows={4} />
                      </div>
                      <button className="w-full px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Regenerate</button>
                    </div>
                  )}
                </div>
              ) : (
                /* Props tab */
                <div className="grid grid-cols-2 gap-3">
                  {extractedProps.map(prop => (
                    <div key={prop.id} className="bg-[#13131a] rounded-xl border border-white/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-orange-400" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{prop.name}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-400 rounded">{prop.category}</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{prop.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {prop.scenes.map(sid => {
                              const sc = extractedScenes.find(s => s.id === sid);
                              return sc ? <span key={sid} className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">{sc.title}</span> : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setCurrentStep("characters")} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm font-medium transition flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => { setCurrentStep("breakdown"); if (episodes.length === 0) handleBreakdown(); }}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold transition flex items-center gap-2">Generate Panels <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* ═══ STEP 5: Panel Breakdown ═══ */}
          {currentStep === "breakdown" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Panel Breakdown</h2>
                  <p className="text-sm text-gray-400">AI has broken your story into episodes and panels</p>
                </div>
                {episodes.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 font-semibold">{episodes.length} Episodes</div>
                    <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-semibold">{totalPages} Pages</div>
                    <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-semibold">{totalPanels} Panels</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Episodes</label>
                  <select value={targetEpisodes} onChange={(e) => setTargetEpisodes(e.target.value)} className="w-full px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
                    <option value="auto">Auto-detect</option><option value="3">3</option><option value="5">5</option><option value="8">8</option><option value="12">12</option><option value="24">24</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Panels / Page</label>
                  <select value={panelsPerPage} onChange={(e) => setPanelsPerPage(e.target.value)} className="w-full px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
                    <option value="3">3 (spacious)</option><option value="4">4 (webtoon)</option><option value="5">5 (manga)</option><option value="6">6 (dense)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Format</label>
                  <select value={mangaFormat} onChange={(e) => setMangaFormat(e.target.value)} className="w-full px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white focus:outline-none appearance-none cursor-pointer">
                    <option value="webtoon">Webtoon</option><option value="manga">Manga</option><option value="western">Western Comic</option><option value="manhwa">Manhwa</option>
                  </select>
                </div>
              </div>

              {isProcessing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Breaking story into episodes and panels...</p>
                  </div>
                </div>
              ) : episodes.length > 0 ? (
                <>
                  {episodes.map((episode) => {
                    const epPanelCount = episode.pages.reduce((s, pg) => s + pg.panels.length, 0);
                    return (
                      <div key={episode.id} className="bg-[#13131a] rounded-xl border border-white/10 overflow-hidden">
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
                            <span>{episode.pages.length} pages</span><span>&bull;</span><span>{epPanelCount} panels</span>
                          </div>
                        </button>
                        {episode.expanded && (
                          <div className="border-t border-white/5">
                            {episode.pages.map((page) => (
                              <div key={page.id} className="border-b border-white/5 last:border-0">
                                {/* Page header */}
                                <button onClick={() => togglePage(episode.id, page.id)} className="w-full flex items-center justify-between px-6 py-2.5 bg-[#0f0f14]/50 hover:bg-white/5 transition">
                                  <div className="flex items-center gap-2.5">
                                    {page.expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                                    <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">Page {page.pageNumber}</div>
                                    <span className="text-[10px] text-gray-500">{page.panels.length} panels</span>
                                  </div>
                                  <Link href={`/manga-studio?ep=${episode.id}&page=${page.pageNumber}`} onClick={(e) => e.stopPropagation()} className="text-[9px] px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition font-semibold">Open in Editor</Link>
                                </button>
                                {/* Panels inside page */}
                                {page.expanded && (
                                  <div>
                                    {page.panels.map((panel, pi) => (
                                      <div key={panel.id} className="flex items-start gap-3 px-8 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                                        <div className="flex items-center gap-2 pt-0.5">
                                          <GripVertical className="w-3 h-3 text-gray-600 cursor-grab" />
                                          <span className="text-[10px] text-gray-500 font-mono w-4">{pi + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-semibold">{panel.panelType}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{panel.framing}</span>
                                            {panel.characters.map(c => (<span key={c} className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">{c}</span>))}
                                          </div>
                                          <p className="text-xs text-gray-300 leading-relaxed">{panel.description}</p>
                                          {panel.dialogue && <p className="text-xs text-purple-300 mt-0.5 italic">{panel.dialogue}</p>}
                                        </div>
                                        <button className="p-1 hover:bg-white/10 rounded transition text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                    ))}
                                    <div className="px-8 py-1.5 bg-[#0f1117]">
                                      <button className="w-full py-1.5 border border-dashed border-white/10 hover:border-purple-500/30 rounded text-[10px] text-gray-500 hover:text-purple-400 transition flex items-center justify-center gap-1"><Plus className="w-3 h-3" />Add Panel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="px-6 py-1.5 bg-[#0f1117]">
                              <button className="w-full py-1.5 border border-dashed border-white/10 hover:border-blue-500/30 rounded text-[10px] text-gray-500 hover:text-blue-400 transition flex items-center justify-center gap-1"><Plus className="w-3 h-3" />Add Page</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add New Episode */}
                  <div className="bg-[#13131a] rounded-xl border border-dashed border-white/10 hover:border-purple-500/30 transition p-4">
                    <button className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-purple-400 transition">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-semibold">Add New Episode</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center pt-2 pb-6">
                    <Link href="/manga-studio" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                      <Layers className="w-4 h-4" />Send All to Panel Manager
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">No breakdown yet. Click &quot;Generate Panels&quot; to break down your story.</div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setCurrentStep("scenes")} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm font-medium transition flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Back</button>
                {episodes.length === 0 && <button onClick={handleBreakdown} disabled={isProcessing}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"><Sparkles className="w-4 h-4" />Break Down Script</button>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
