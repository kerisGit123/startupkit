"use client";

import { useState } from "react";
import {
  Upload, Sparkles, ChevronRight, Check, X, Pencil, Trash2,
  GripVertical, Plus, Image as ImageIcon, Palette, Edit3,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { toast } from "sonner";
import type { Step, Orientation, Shot, CastMember, LocationAsset } from "../../types";
import { VISUAL_STYLES, STYLE_PROMPTS } from "../../constants";

const WIZARD_ART_STYLES = [
  { id: "Manga (Shonen)",            desc: "Action-packed, bold lines, speed effects",    emoji: "🔥" },
  { id: "Manga (Seinen)",            desc: "Detailed, mature, realistic proportions",      emoji: "🌃" },
  { id: "Manga (Shojo)",             desc: "Soft lines, emotional, decorative tones",      emoji: "🌸" },
  { id: "Western Comic",             desc: "Bold inks, strong shadows, superhero style",   emoji: "💥" },
  { id: "Noir",                      desc: "High contrast B&W, dramatic shadows, gritty",  emoji: "🕵️" },
  { id: "Toon / Cartoon",            desc: "Simplified shapes, bright colors, fun",        emoji: "🤪" },
  { id: "Watercolor / Illustration", desc: "Soft washes, painted textures, organic",       emoji: "🎨" },
  { id: "Webtoon",                   desc: "Clean digital art, full color, vertical scroll",emoji: "📱" },
  { id: "Inking & Coloring",         desc: "Traditional ink + flat/cel color",             emoji: "✒️" },
];

// ── Step nav ─────────────────────────────────────────────────────────────────
const STEP_ORDER: Step[] = ["dashboard", "script", "breakdown", "style", "cast", "storyboard", "scene-editor"];
const getIdx = (s: Step) => STEP_ORDER.indexOf(s);

interface StepNavProps { currentStep: Step; onStepClick: (s: Step) => void; }
export function StepNav({ currentStep, onStepClick }: StepNavProps) {
  const steps = [
    { key: "script"    as Step, label: "SCRIPT" },
    { key: "style"     as Step, label: "STYLE"  },
    { key: "cast"      as Step, label: "CAST"   },
  ];
  return (
    <div className="flex items-center justify-center gap-2 py-3 border-b border-white/6 shrink-0">
      {steps.map((step, i) => {
        const isActive = step.key === currentStep || (currentStep === "breakdown" && step.key === "script");
        const isPast   = getIdx(currentStep) > getIdx(step.key);
        return (
          <div key={step.key} className="flex items-center gap-2">
            <button
              onClick={() => { if (isPast || isActive) onStepClick(step.key === "script" ? "breakdown" : step.key); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                isActive ? "bg-pink-500 text-white" :
                isPast   ? "bg-pink-500/20 text-pink-400" :
                           "bg-white/5 text-gray-500"
              }`}
            >
              {step.label}
            </button>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Script input ──────────────────────────────────────────────────────────────
interface ScriptInputProps {
  scriptIdea: string;
  sceneCount: number;
  onScriptIdeaChange: (v: string) => void;
  onSceneCountChange: (n: number) => void;
  onGenerate: () => void;
}
export function ScriptInput({ scriptIdea, sceneCount, onScriptIdeaChange, onSceneCountChange, onGenerate }: ScriptInputProps) {
  const [artStyle,    setArtStyle]    = useState("Manga (Shonen)");
  const [useCustom,   setUseCustom]   = useState(false);
  const [customStyle, setCustomStyle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0d0d12]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Upload / Generate row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#13131a] border border-white/8 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white text-lg font-bold">Upload script</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">Turn your script into a storyboard or video</p>
            <div className="border-2 border-dashed border-white/8 rounded-xl p-10 text-center">
              <p className="text-gray-400 text-sm mb-1">Drag & Drop your script here</p>
              <p className="text-gray-600 text-xs mb-4">Final Draft, Word, CSV, PDF or TXT</p>
              <div className="flex items-center justify-center gap-3">
                <button className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-sm hover:bg-pink-500/30 transition">Upload</button>
                <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 transition">Paste from clipboard</button>
              </div>
            </div>
          </div>
          <div className="bg-[#13131a] border border-white/8 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-400" />
              <h3 className="text-white text-lg font-bold">Generate script</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">Share your idea, our AI will craft a script</p>
            <textarea
              value={scriptIdea}
              onChange={e => onScriptIdeaChange(e.target.value)}
              placeholder="A medieval knight fights a dragon to save his village"
              className="w-full h-36 bg-[#25252f] border border-white/8 rounded-xl p-4 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-pink-500/50 mb-4"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>{sceneCount} scenes</span>
                <button onClick={() => onSceneCountChange(Math.max(1, sceneCount - 1))} className="w-5 h-5 bg-white/5 rounded text-xs hover:bg-white/10 flex items-center justify-center">-</button>
                <button onClick={() => onSceneCountChange(Math.min(30, sceneCount + 1))} className="w-5 h-5 bg-white/5 rounded text-xs hover:bg-white/10 flex items-center justify-center">+</button>
              </div>
              <button onClick={onGenerate} className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold transition">Generate Script</button>
            </div>
          </div>
        </div>

        {/* Art Style picker */}
        <div className="bg-[#13131a] border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-white font-semibold text-sm">Art Style</span>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setUseCustom(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!useCustom ? "bg-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
              Preset Styles
            </button>
            <button onClick={() => setUseCustom(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${useCustom ? "bg-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
              Custom Style
            </button>
          </div>
          {!useCustom ? (
            <div className="grid grid-cols-3 gap-2">
              {WIZARD_ART_STYLES.map(s => (
                <button key={s.id} onClick={() => setArtStyle(s.id)}
                  className={`p-3 rounded-xl border text-left transition ${artStyle === s.id ? "bg-pink-500/15 border-pink-500/40" : "bg-[#25252f] border-white/5 hover:border-white/15"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{s.emoji}</span>
                    <span className={`text-sm font-semibold ${artStyle === s.id ? "text-pink-300" : "text-white"}`}>{s.id}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{s.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            <input value={customStyle} onChange={e => setCustomStyle(e.target.value)}
              placeholder="Describe your custom art style..."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none text-sm" />
          )}
        </div>

        {/* Brief Description */}
        <div className="bg-[#13131a] border border-white/8 rounded-2xl p-6">
          <label className="text-white font-semibold text-sm block mb-3">Brief Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="A gripping thriller following a detective who uncovers a conspiracy hidden inside an abandoned warehouse district."
            rows={4}
            className="w-full px-4 py-3 bg-[#25252f] border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-pink-500/50" />
        </div>
      </div>
    </div>
  );
}

// ── Breakdown table ───────────────────────────────────────────────────────────
interface BreakdownProps {
  shots: Shot[];
  projectName: string;
  editingName: boolean;
  sceneCount: number;
  orientation: Orientation;
  setting: string;
  scriptIdea: string;
  editingShotId: string | null;
  editingShotText: string;
  onProjectNameChange: (v: string) => void;
  onEditingNameChange: (v: boolean) => void;
  onSceneCountChange: (n: number) => void;
  onOrientationChange: (o: Orientation) => void;
  onSettingChange: (v: string) => void;
  onScriptIdeaChange: (v: string) => void;
  onEditingShotIdChange: (id: string | null) => void;
  onEditingShotTextChange: (v: string) => void;
  onSaveShotEdit: () => void;
  onDeleteShot: (id: string) => void;
  onAddShot: () => void;
  onGenerate: () => void;
  onBack: () => void;
  onNext: () => void;
}
export function Breakdown({
  shots, projectName, editingName, sceneCount, orientation, setting, scriptIdea,
  editingShotId, editingShotText,
  onProjectNameChange, onEditingNameChange, onSceneCountChange, onOrientationChange,
  onSettingChange, onScriptIdeaChange, onEditingShotIdChange, onEditingShotTextChange,
  onSaveShotEdit, onDeleteShot, onAddShot, onGenerate, onBack, onNext,
}: BreakdownProps) {
  const [showOrientDrop, setShowOrientDrop] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-3">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input value={projectName} onChange={e => onProjectNameChange(e.target.value)}
                className="bg-transparent border-b border-pink-500 text-white font-bold text-base focus:outline-none" autoFocus />
              <button onClick={() => onEditingNameChange(false)} className="text-green-400"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">{projectName}</span>
              <button onClick={() => onEditingNameChange(true)} className="text-gray-500 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Scenes:</span>
            <input type="number" value={sceneCount}
              onChange={e => onSceneCountChange(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
              className="w-14 bg-[#25252f] border border-white/10 rounded px-2 py-1 text-white text-sm text-center focus:outline-none" />
          </div>
          <button onClick={onGenerate} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold transition">GENERATE</button>
          <div className="relative">
            <button onClick={() => setShowOrientDrop(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition">
              <span className="text-pink-500">●</span>{orientation}<ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            {showOrientDrop && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOrientDrop(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#25252f] border border-white/10 rounded-lg overflow-hidden z-50 min-w-[160px]">
                  {(["16:9", "9:16", "1:1"] as Orientation[]).map(o => (
                    <button key={o} onClick={() => { onOrientationChange(o); setShowOrientDrop(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 ${orientation === o ? "text-white" : "text-gray-400"}`}>
                      {orientation === o && <Check className="w-3.5 h-3.5 text-pink-500" />}{o}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Script assistant */}
      <div className="px-6 py-3 border-b border-white/6 shrink-0">
        <textarea value={scriptIdea} onChange={e => onScriptIdeaChange(e.target.value)}
          placeholder="Describe your story idea..."
          className="w-full h-14 bg-[#1a1a24] border border-white/8 rounded-lg p-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none" />
        <div className="flex flex-wrap gap-2 mt-2">
          {["Jessica starts a rock band", "Mutiny on spacecraft", "A group of friends start a detective agency"].map(s => (
            <button key={s} onClick={() => onScriptIdeaChange(s)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-full text-xs transition">{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider">
              <th className="py-3 px-2 w-6" scope="col"><span className="sr-only">Drag</span></th>
              <th className="py-3 px-3 w-14">Scene</th>
              <th className="py-3 px-3 w-12">Shot</th>
              <th className="py-3 px-3 min-w-[220px]">Description</th>
              <th className="py-3 px-3 w-16">ERT</th>
              <th className="py-3 px-3 w-28">Shot Size</th>
              <th className="py-3 px-3 w-28">Perspective</th>
              <th className="py-3 px-3 w-20">Movement</th>
              <th className="py-3 px-3 w-28">Equipment</th>
              <th className="py-3 px-3 w-20">Focal</th>
              <th className="py-3 px-3 w-16">Aspect</th>
              <th className="py-3 px-3 w-14" scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {shots.map(shot => (
              <tr key={shot.id} className="border-b border-white/5 hover:bg-white/2 group">
                <td className="py-3 px-2"><GripVertical className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab" /></td>
                <td className="py-3 px-3 text-gray-400">{shot.scene}</td>
                <td className="py-3 px-3 text-gray-400">{shot.shot}</td>
                <td className="py-3 px-3">
                  {editingShotId === shot.id ? (
                    <div className="flex items-center gap-2">
                      <input value={editingShotText} onChange={e => onEditingShotTextChange(e.target.value)}
                        className="flex-1 bg-[#25252f] border border-pink-500/50 rounded px-2 py-1 text-white text-sm focus:outline-none" autoFocus />
                      <button onClick={onSaveShotEdit} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onEditingShotIdChange(null)} className="text-gray-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : <span className="text-gray-200">{shot.description}</span>}
                </td>
                <td className="py-3 px-3 text-gray-400">{shot.ert}</td>
                <td className="py-3 px-3 text-gray-400">{shot.shotSize}</td>
                <td className="py-3 px-3 text-gray-400">{shot.perspective}</td>
                <td className="py-3 px-3 text-gray-400">{shot.movement}</td>
                <td className="py-3 px-3 text-gray-400">{shot.equipment}</td>
                <td className="py-3 px-3 text-gray-400">{shot.focalLength}</td>
                <td className="py-3 px-3 text-gray-400">{shot.aspectRatio}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => { onEditingShotIdChange(shot.id); onEditingShotTextChange(shot.description); }}
                      className="p-1 hover:bg-white/10 rounded"><Pencil className="w-3 h-3 text-gray-400" /></button>
                    <button onClick={() => onDeleteShot(shot.id)}
                      className="p-1 hover:bg-red-500/20 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onAddShot}
          className="mt-3 w-full border-2 border-dashed border-white/8 rounded-lg p-3 text-gray-500 text-sm hover:border-white/20 hover:text-gray-300 hover:bg-white/2 transition flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Storyboard Item
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Setting:</span>
          <input value={setting} onChange={e => onSettingChange(e.target.value)}
            className="bg-[#25252f] border border-white/10 rounded px-3 py-1 text-white text-sm focus:outline-none min-w-[280px]" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">BACK</button>
          <button onClick={onNext} className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold transition flex items-center gap-2">
            NEXT <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Style selection ───────────────────────────────────────────────────────────
interface StyleSelectionProps {
  selectedStyle: string | null;
  onStyleChange: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}
export function StyleSelection({ selectedStyle, onStyleChange, onBack, onNext }: StyleSelectionProps) {
  const companyId = useCurrentCompanyId() || "personal";
  const customStyles = useQuery(api.promptTemplates.getByCompany, { companyId });
  const customStyleTemplates = customStyles?.filter(t => t.type === "style") ?? [];
  const createPromptTemplate = useMutation(api.promptTemplates.create);
  const updatePromptTemplate = useMutation(api.promptTemplates.update);
  const deletePromptTemplate = useMutation(api.promptTemplates.remove);
  const createPreset = useMutation(api.storyboard.presets.create);
  const updatePreset = useMutation(api.storyboard.presets.update);
  const removePreset = useMutation(api.storyboard.presets.remove);
  const stylePresets = useQuery(api.storyboard.presets.list, { companyId, category: "style" });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");

  const resetForm = () => { setShowForm(false); setEditingId(null); setFormName(""); setFormPrompt(""); };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      <div className="px-6 py-4 border-b border-white/6 shrink-0 flex items-center justify-between">
        <h3 className="text-white text-lg font-bold">Choose a Visual Style</h3>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-1 text-[11px] text-[#4A90E2] hover:text-white transition px-2.5 py-1.5 rounded-lg border border-[#3D3D3D] hover:border-[#4A90E2]/30"
        >
          <Plus className="w-3 h-3" /> Custom
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Custom Style Form */}
        {showForm && (
          <div className="mb-4 p-3 bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg space-y-2">
            <p className="text-[11px] text-[#A0A0A0] font-medium">{editingId ? "Edit Custom Style" : "Create Custom Style"}</p>
            <input
              type="text"
              placeholder="Style name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50"
            />
            <textarea
              placeholder="Style prompt (describe the visual style...)"
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={resetForm} className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg transition">Cancel</button>
              <button
                disabled={!formName.trim() || !formPrompt.trim()}
                onClick={async () => {
                  try {
                    if (editingId) {
                      await updatePreset({
                        id: editingId as any,
                        name: formName.trim(),
                        prompt: formPrompt.trim(),
                        format: JSON.stringify({ style: formName.trim(), stylePrompt: formPrompt.trim() }),
                      });
                      toast.success(`Style "${formName}" updated`);
                    } else {
                      await createPreset({
                        name: formName.trim(),
                        category: "style",
                        format: JSON.stringify({ style: formName.trim(), stylePrompt: formPrompt.trim() }),
                        prompt: formPrompt.trim(),
                        companyId,
                        userId: "",
                      });
                      onStyleChange(formName.trim());
                      toast.success(`Style "${formName}" created`);
                    }
                    resetForm();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to save style");
                  }
                }}
                className="px-3 py-1.5 text-xs text-white bg-[#4A90E2] hover:bg-[#357ABD] rounded-lg transition font-medium disabled:opacity-40"
              >
                {editingId ? "Update" : "Create & Apply"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Built-in styles */}
          {VISUAL_STYLES.filter(s => s.id !== 'custom').map(style => (
            <button key={style.id} onClick={() => onStyleChange(style.id)}
              className={`group relative aspect-4/3 rounded-xl overflow-hidden border-2 transition ${
                selectedStyle === style.id ? "border-pink-500 ring-2 ring-pink-500/30" : "border-transparent hover:border-white/20"
              }`}>
              <img src={style.preview} alt={style.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-medium text-white drop-shadow-lg">{style.label}</span>
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}

          {/* Custom styles from storyboard_presets */}
          {(stylePresets || []).map(preset => (
            <button key={preset._id} onClick={() => onStyleChange(preset.name)}
              className={`group relative aspect-4/3 rounded-xl overflow-hidden border-2 transition ${
                selectedStyle === preset.name ? "border-pink-500 ring-2 ring-pink-500/30" : "border-[#3D3D3D] hover:border-white/20"
              }`}>
              {preset.thumbnailUrl ? (
                <img src={preset.thumbnailUrl} alt={preset.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-400/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute bottom-2 left-0 right-0 text-center text-[11px] font-medium text-white drop-shadow-lg truncate px-1">{preset.name}</span>
              {selectedStyle === preset.name && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {/* Edit button */}
              <div role="button" onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(String(preset._id));
                  setFormName(preset.name);
                  setFormPrompt(preset.prompt || "");
                  setShowForm(true);
                }}
                className="absolute bottom-1 right-1 w-5 h-5 bg-[#4A90E2]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Edit3 className="w-2.5 h-2.5 text-white" />
              </div>
              {/* Delete button */}
              <div role="button" onClick={(e) => {
                  e.stopPropagation();
                  removePreset({ id: preset._id });
                  toast.success(`Deleted "${preset.name}"`);
                }}
                className="absolute top-1 left-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <X className="w-2.5 h-2.5 text-white" />
              </div>
            </button>
          ))}

          {/* + Add Custom card */}
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="group relative aspect-4/3 rounded-xl overflow-hidden border-2 border-dashed border-[#3D3D3D] hover:border-[#4A90E2]/50 transition flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <Plus className="w-5 h-5 text-[#6E6E6E] group-hover:text-[#4A90E2] transition" />
              <span className="text-[10px] text-[#6E6E6E] group-hover:text-[#4A90E2] font-medium transition">Add Custom</span>
            </div>
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-white/6 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">BACK</button>
        <button onClick={onNext} disabled={!selectedStyle}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
            selectedStyle ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-white/5 text-gray-500 cursor-not-allowed"
          }`}>
          NEXT <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Cast & Locations ──────────────────────────────────────────────────────────
interface CastProps {
  cast: CastMember[];
  locations: LocationAsset[];
  onBack: () => void;
  onNext: () => void;
}
export function CastStep({ cast, locations, onBack, onNext }: CastProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      <div className="flex-1 overflow-y-auto p-8">
        {/* Cast */}
        <h2 className="text-white text-xl font-bold mb-4">Cast</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
          {cast.map(member => (
            <div key={member.id} className="bg-[#16161f] border border-white/8 rounded-xl overflow-hidden group">
              {/* Portrait area */}
              <div className="aspect-3/4 bg-[#1e1e2a] flex items-center justify-center relative">
                {member.imageUrl
                  ? <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  : (
                    <div className="w-16 h-16 rounded-full bg-[#2a2a38] flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">{member.name[0]}</span>
                    </div>
                  )
                }
                <button className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="p-2.5">
                <p className="text-white text-sm font-semibold truncate">{member.name}</p>
                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 mt-0.5">{member.description}</p>
              </div>
            </div>
          ))}
          {/* Add character */}
          <button className="bg-[#16161f] border-2 border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 aspect-3/4 hover:border-white/20 hover:bg-white/2 transition">
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="text-gray-600 text-xs">Add character</span>
          </button>
        </div>

        {/* Locations */}
        <h2 className="text-white text-xl font-bold mb-4">Locations</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-[#16161f] border border-white/8 rounded-xl overflow-hidden group">
              <div className="aspect-3/4 bg-[#1e1e2a] flex items-center justify-center relative">
                {loc.imageUrl
                  ? <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                  : (
                    <div className="flex flex-col items-center gap-2 text-gray-700">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )
                }
                <button className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="p-2.5">
                <p className="text-white text-sm font-semibold truncate">{loc.name}</p>
                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 mt-0.5">{loc.description}</p>
              </div>
            </div>
          ))}
          <button className="bg-[#16161f] border-2 border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 aspect-3/4 hover:border-white/20 hover:bg-white/2 transition">
            <Plus className="w-5 h-5 text-gray-600" />
            <span className="text-gray-600 text-xs">Add location</span>
          </button>
        </div>
      </div>

      <div className="px-8 py-4 border-t border-white/6 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">BACK</button>
        <button onClick={onNext} className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold transition flex items-center gap-2">
          CREATE PROJECT <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

