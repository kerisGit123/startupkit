"use client";

import { useState } from "react";
import {
  Edit3, Sparkles, Users, MapPin, Wrench, Plus, Pencil,
  X as XIcon, Image as ImageIcon, LayoutGrid, List, Table2,
} from "lucide-react";

export type UMTab = "basic-info" | "characters" | "locations" | "props";

const ART_STYLES = [
  { id: "Manga (Shonen)",            desc: "Action-packed, bold lines, speed effects" },
  { id: "Manga (Seinen)",            desc: "Detailed, mature, realistic proportions" },
  { id: "Manga (Shojo)",             desc: "Soft lines, emotional, decorative tones" },
  { id: "Western Comic",             desc: "Bold inks, strong shadows, superhero style" },
  { id: "Noir",                      desc: "High contrast B&W, dramatic shadows, gritty" },
  { id: "Toon / Cartoon",            desc: "Simplified shapes, bright colors, fun" },
  { id: "Watercolor / Illustration", desc: "Soft washes, painted textures, organic" },
  { id: "Webtoon",                   desc: "Clean digital art, full color, vertical scroll" },
  { id: "Inking & Coloring",         desc: "Traditional ink + flat/cel color" },
];

const STYLE_ICON: Record<string, string> = {
  "Manga (Shonen)": "🔥", "Manga (Seinen)": "🌃", "Manga (Shojo)": "🌸",
  "Western Comic": "💥", "Noir": "🕵️", "Toon / Cartoon": "🤪",
  "Watercolor / Illustration": "🎨", "Webtoon": "📱", "Inking & Coloring": "✒️",
};

const SAMPLE_CHARS = [
  { id: "c1", name: "Grant",  cat: "Lead",       desc: "Dark jacket, rugged build, short brown hair",  scenes: ["Warehouse", "Rooftop"] },
  { id: "c2", name: "Riley",  cat: "Supporting", desc: "Gray hoodie, athletic build, long dark hair",   scenes: ["Warehouse"] },
  { id: "c3", name: "Morgan", cat: "Antagonist", desc: "Tall, silver-haired, always in a suit",         scenes: ["Office"] },
];

const SAMPLE_LOCS = [
  { id: "l1", name: "Abandoned Warehouse", cat: "Industrial", desc: "Vast space with towering wooden crates, dim lighting", scenes: ["Scene 1", "Scene 4"] },
  { id: "l2", name: "City Rooftop",        cat: "Urban",      desc: "Night skyline, neon reflections on wet concrete",      scenes: ["Scene 2"] },
  { id: "l3", name: "Corporate Office",    cat: "Interior",   desc: "Glass walls, minimalist, cold fluorescent lighting",   scenes: ["Scene 3"] },
];

const SAMPLE_PROPS = [
  { id: "p1", name: "Flashlight",    cat: "Equipment",     desc: "Small tactical flashlight, worn grip" },
  { id: "p2", name: "Blueprints",    cat: "Document",      desc: "Rolled paper blueprints marked with red X" },
  { id: "p3", name: "Wooden Crate",  cat: "Environment",   desc: "Large shipping crate, stenciled markings" },
  { id: "p4", name: "Dark Jacket",   cat: "Clothing",      desc: "Grant's signature dark jacket" },
  { id: "p5", name: "Walkie-Talkie", cat: "Communication", desc: "Old-school two-way radio" },
];

// ── View toggle ───────────────────────────────────────────────────────────────
type AssetView = "grid" | "list" | "table";
function ViewToggle({ view, onChange }: { view: AssetView; onChange: (v: AssetView) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[#1e1e2a] rounded-lg p-1">
      <button onClick={() => onChange("grid")} aria-label="Grid view" className={`p-1.5 rounded transition ${view === "grid" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"}`}><LayoutGrid className="w-4 h-4" /></button>
      <button onClick={() => onChange("list")} aria-label="List view" className={`p-1.5 rounded transition ${view === "list" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"}`}><List className="w-4 h-4" /></button>
      <button onClick={() => onChange("table")} aria-label="Table view" className={`p-1.5 rounded transition ${view === "table" ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"}`}><Table2 className="w-4 h-4" /></button>
    </div>
  );
}

// ── Edit Modal helper ─────────────────────────────────────────────────────────
function EditModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c26] border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><XIcon className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Basic Info ────────────────────────────────────────────────────────────────
function BasicInfoTab({ projectName }: { projectName: string }) {
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState({ name: projectName, director: "Alex Chen", style: "Manga (Shonen)", useCustom: false, customStyle: "", description: "A gripping thriller following Grant as he uncovers a conspiracy hidden inside an abandoned warehouse district." });
  const [draft, setDraft] = useState(info);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div><h3 className="text-2xl font-bold text-white">Basic Information</h3><p className="text-gray-400 text-sm mt-1">Core details about your storyboard universe</p></div>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">Cancel</button>
            <button onClick={() => { setInfo(draft); setEditing(false); }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition">Save Changes</button>
          </div>
        ) : (
          <button onClick={() => { setDraft(info); setEditing(true); }} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">
            <Edit3 className="w-4 h-4" /> Edit Info
          </button>
        )}
      </div>
      <div className="bg-[#13131a] rounded-xl border border-white/8 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Storyboard Name</label>
            {editing ? <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500/50" />
              : <div className="px-4 py-3 bg-[#25252f] border border-white/5 rounded-lg text-white">{info.name}</div>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Director / Author</label>
            {editing ? <input value={draft.director} onChange={e => setDraft(d => ({ ...d, director: e.target.value }))} className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-violet-500/50" />
              : <div className="px-4 py-3 bg-[#25252f] border border-white/5 rounded-lg text-white">{info.director}</div>}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-violet-400" /> Art Style</label>
          {editing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setDraft(d => ({ ...d, useCustom: false }))} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!draft.useCustom ? "bg-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>Preset Styles</button>
                <button onClick={() => setDraft(d => ({ ...d, useCustom: true }))} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${draft.useCustom ? "bg-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>Custom Style</button>
              </div>
              {!draft.useCustom ? (
                <div className="grid grid-cols-3 gap-2">
                  {ART_STYLES.map(s => (
                    <button key={s.id} onClick={() => setDraft(d => ({ ...d, style: s.id }))}
                      className={`p-3 rounded-xl border text-left transition ${draft.style === s.id ? "bg-pink-500/15 border-pink-500/40" : "bg-[#25252f] border-white/5 hover:border-white/15"}`}>
                      <div className="flex items-center gap-2 mb-1"><span>{STYLE_ICON[s.id] || "🎨"}</span><span className={`text-sm font-semibold ${draft.style === s.id ? "text-pink-300" : "text-white"}`}>{s.id}</span></div>
                      <div className="text-[11px] text-gray-500">{s.desc}</div>
                    </button>
                  ))}
                </div>
              ) : <input value={draft.customStyle} onChange={e => setDraft(d => ({ ...d, customStyle: e.target.value }))} placeholder="Describe your custom art style..." className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none" />}
            </div>
          ) : (
            <div className="px-4 py-3 bg-[#25252f] border border-white/5 rounded-lg text-white flex items-center gap-2">
              <span>{STYLE_ICON[info.style] || "🎨"}</span><span>{info.useCustom ? info.customStyle || "Custom Style" : info.style}</span>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">Brief Description</label>
          {editing ? <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={4} className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none resize-none" />
            : <div className="px-4 py-3 bg-[#25252f] border border-white/5 rounded-lg text-white min-h-[80px] text-sm leading-relaxed">{info.description}</div>}
        </div>
        <div className="pt-4 border-t border-white/8">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Storyboard Items", value: "5",                           color: "text-violet-400" },
              { label: "Characters",       value: String(SAMPLE_CHARS.length),   color: "text-emerald-400" },
              { label: "Locations",        value: String(SAMPLE_LOCS.length),    color: "text-orange-400" },
              { label: "Props",            value: String(SAMPLE_PROPS.length),   color: "text-pink-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#25252f] rounded-lg p-4 border border-white/5 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Characters ────────────────────────────────────────────────────────────────
function CharactersTab() {
  const [editId, setEditId] = useState<string | null>(null);
  const [view, setView] = useState<AssetView>("grid");
  const editChar = SAMPLE_CHARS.find(c => c.id === editId);
  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Characters</h3>
          <p className="text-gray-400 text-sm mt-1">{SAMPLE_CHARS.length} characters in this universe</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> Add Character
          </button>
        </div>
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-3 gap-4">
          {SAMPLE_CHARS.map(c => (
            <div key={c.id} className="bg-[#13131a] border border-white/8 rounded-xl overflow-hidden group hover:border-white/20 transition">
              <div className="aspect-square bg-[#1e1e2a] flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-[#2a2a38] flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">{c.name[0]}</span>
                </div>
                <button onClick={() => setEditId(c.id)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{c.name}</span>
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px] font-medium">{c.cat}</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{c.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.scenes.map(s => <span key={s} className="px-1.5 py-0.5 bg-white/5 text-gray-500 rounded text-[9px]">{s}</span>)}
                </div>
              </div>
            </div>
          ))}
          <button className="bg-[#13131a] border-2 border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 aspect-square hover:border-white/20 hover:bg-white/2 transition">
            <Plus className="w-6 h-6 text-gray-600" /><span className="text-gray-600 text-xs">Add character</span>
          </button>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-2">
          {SAMPLE_CHARS.map(c => (
            <div key={c.id} className="bg-[#13131a] border border-white/8 rounded-xl p-4 flex items-center gap-4 group hover:border-white/20 transition">
              <div className="w-10 h-10 rounded-full bg-[#2a2a38] flex items-center justify-center shrink-0">
                <span className="text-white font-bold">{c.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{c.name}</span>
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px]">{c.cat}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{c.desc}</p>
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                {c.scenes.map(s => <span key={s} className="px-1.5 py-0.5 bg-white/5 text-gray-500 rounded text-[9px]">{s}</span>)}
              </div>
              <button onClick={() => setEditId(c.id)} className="p-1.5 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {view === "table" && (
        <div className="bg-[#13131a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-500 text-xs">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Scenes</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="px-4 py-3" scope="col"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CHARS.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 group">
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-[10px]">{c.cat}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.scenes.join(", ")}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{c.desc}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditId(c.id)} className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition"><Pencil className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editId && editChar && (
        <EditModal title="Edit Character" onClose={() => setEditId(null)}>
          <div className="space-y-4">
            <div><label className="text-gray-400 text-xs mb-1.5 block">Name</label><input defaultValue={editChar.name} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none" /></div>
            <div><label className="text-gray-400 text-xs mb-1.5 block">Category</label><select defaultValue={editChar.cat} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none appearance-none cursor-pointer"><option>Lead</option><option>Supporting</option><option>Antagonist</option><option>Minor</option></select></div>
            <div><label className="text-gray-400 text-xs mb-1.5 block">Description</label><textarea defaultValue={editChar.desc} rows={3} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none resize-none" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setEditId(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
            <button onClick={() => setEditId(null)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">Save</button>
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ── Locations ─────────────────────────────────────────────────────────────────
function LocationsTab() {
  const [editId, setEditId] = useState<string | null>(null);
  const [view, setView] = useState<AssetView>("grid");
  const editLoc = SAMPLE_LOCS.find(l => l.id === editId);
  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Locations</h3>
          <p className="text-gray-400 text-sm mt-1">{SAMPLE_LOCS.length} locations in this universe</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </div>
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-3 gap-4">
          {SAMPLE_LOCS.map(loc => (
            <div key={loc.id} className="bg-[#13131a] border border-white/8 rounded-xl overflow-hidden group hover:border-white/20 transition">
              <div className="aspect-square bg-[#1e1e2a] flex items-center justify-center relative">
                <ImageIcon className="w-10 h-10 text-gray-700" />
                <button onClick={() => setEditId(loc.id)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{loc.name}</span>
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px] font-medium">{loc.cat}</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{loc.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {loc.scenes.map(s => <span key={s} className="px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded text-[9px]">{s}</span>)}
                </div>
              </div>
            </div>
          ))}
          <button className="bg-[#13131a] border-2 border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 aspect-square hover:border-white/20 hover:bg-white/2 transition">
            <Plus className="w-6 h-6 text-gray-600" /><span className="text-gray-600 text-xs">Add location</span>
          </button>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-2">
          {SAMPLE_LOCS.map(loc => (
            <div key={loc.id} className="bg-[#13131a] border border-white/8 rounded-xl p-4 flex items-center gap-4 group hover:border-white/20 transition">
              <div className="w-10 h-10 rounded-lg bg-[#2a2a38] flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{loc.name}</span>
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px]">{loc.cat}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{loc.desc}</p>
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                {loc.scenes.map(s => <span key={s} className="px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded text-[9px]">{s}</span>)}
              </div>
              <button onClick={() => setEditId(loc.id)} className="p-1.5 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {view === "table" && (
        <div className="bg-[#13131a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-500 text-xs">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Scenes</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="px-4 py-3" scope="col"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_LOCS.map(loc => (
                <tr key={loc.id} className="border-b border-white/5 hover:bg-white/2 group">
                  <td className="px-4 py-3 text-white font-medium">{loc.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px]">{loc.cat}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{loc.scenes.join(", ")}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{loc.desc}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditId(loc.id)} className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition"><Pencil className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editId && editLoc && (
        <EditModal title="Edit Location" onClose={() => setEditId(null)}>
          <div className="space-y-4">
            <div><label className="text-gray-400 text-xs mb-1.5 block">Name</label><input defaultValue={editLoc.name} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none" /></div>
            <div><label className="text-gray-400 text-xs mb-1.5 block">Category</label><select defaultValue={editLoc.cat} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none appearance-none cursor-pointer"><option>Industrial</option><option>Urban</option><option>Interior</option><option>Exterior</option><option>Natural</option></select></div>
            <div><label className="text-gray-400 text-xs mb-1.5 block">Description</label><textarea defaultValue={editLoc.desc} rows={3} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none resize-none" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setEditId(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
            <button onClick={() => setEditId(null)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">Save</button>
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
function PropsTab() {
  const [editId, setEditId] = useState<string | null>(null);
  const [view, setView] = useState<AssetView>("grid");
  const editProp = SAMPLE_PROPS.find(p => p.id === editId);
  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Props</h3>
          <p className="text-gray-400 text-sm mt-1">{SAMPLE_PROPS.length} props in this universe</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> Add Prop
          </button>
        </div>
      </div>

      {view === "grid" && (
        <div className="grid grid-cols-3 gap-4">
          {SAMPLE_PROPS.map(prop => (
            <div key={prop.id} className="bg-[#13131a] border border-white/8 rounded-xl overflow-hidden group hover:border-white/20 transition">
              <div className="aspect-square bg-[#1e1e2a] flex items-center justify-center relative">
                <Wrench className="w-10 h-10 text-gray-700" />
                <button onClick={() => setEditId(prop.id)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition">
                  <Pencil className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold text-sm">{prop.name}</span>
                  <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-[10px]">{prop.cat}</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{prop.desc}</p>
              </div>
            </div>
          ))}
          <button className="bg-[#13131a] border-2 border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 aspect-square hover:border-white/20 hover:bg-white/2 transition">
            <Plus className="w-6 h-6 text-gray-600" /><span className="text-gray-600 text-xs">Add prop</span>
          </button>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-2">
          {SAMPLE_PROPS.map(prop => (
            <div key={prop.id} className="bg-[#13131a] border border-white/8 rounded-xl p-4 flex items-center gap-4 group hover:border-white/20 transition">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{prop.name}</span>
                  <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-[10px]">{prop.cat}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{prop.desc}</p>
              </div>
              <button onClick={() => setEditId(prop.id)} className="p-1.5 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {view === "table" && (
        <div className="bg-[#13131a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-gray-500 text-xs">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="px-4 py-3" scope="col"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_PROPS.map(prop => (
                <tr key={prop.id} className="border-b border-white/5 hover:bg-white/2 group">
                  <td className="px-4 py-3 text-white font-medium">{prop.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-[10px]">{prop.cat}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{prop.desc}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditId(prop.id)} className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition"><Pencil className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editId && editProp && (
        <EditModal title="Edit Prop" onClose={() => setEditId(null)}>
          <div className="space-y-4">
            <div><label className="text-gray-400 text-xs mb-1.5 block">Name</label><input defaultValue={editProp.name} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none" /></div>
            <div><label className="text-gray-400 text-xs mb-1.5 block">Category</label><select defaultValue={editProp.cat} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none appearance-none cursor-pointer"><option>Equipment</option><option>Document</option><option>Environment</option><option>Clothing</option><option>Communication</option></select></div>
            <div><label className="text-gray-400 text-xs mb-1.5 block">Description</label><textarea defaultValue={editProp.desc} rows={3} className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none resize-none" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setEditId(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
            <button onClick={() => setEditId(null)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">Save</button>
          </div>
        </EditModal>
      )}
    </div>
  );
}

// ── Main exported shell ───────────────────────────────────────────────────────
interface UniverseManagerProps {
  projectName: string;
  activeTab: UMTab;
  onTabChange: (tab: UMTab) => void;
}

export function UniverseManager({ projectName, activeTab, onTabChange }: UniverseManagerProps) {
  const tabs: { id: UMTab; label: string; icon: React.ElementType }[] = [
    { id: "basic-info", label: "Basic Info",  icon: Edit3  },
    { id: "characters", label: "Characters",  icon: Users  },
    { id: "locations",  label: "Locations",   icon: MapPin },
    { id: "props",      label: "Props",       icon: Wrench },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left tab rail */}
      <div className="w-52 bg-[#0f0f16] border-r border-white/6 flex flex-col py-4 shrink-0">
        <div className="px-4 mb-3">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Universe</span>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => onTabChange(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition w-full text-left ${activeTab === t.id ? "bg-violet-600/20 text-violet-300 font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
        {activeTab === "basic-info"  && <BasicInfoTab projectName={projectName} />}
        {activeTab === "characters"  && <CharactersTab />}
        {activeTab === "locations"   && <LocationsTab />}
        {activeTab === "props"       && <PropsTab />}
      </div>
    </div>
  );
}
