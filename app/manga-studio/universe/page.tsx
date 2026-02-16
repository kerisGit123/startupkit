"use client";

import { useState } from "react";
import { Save, Sparkles, Download, Settings, BookOpen, MapPin, Users, Image, Wrench, Globe, Lock, Tag, Plus, Pencil, X as XIcon, BookImage } from "lucide-react";

type TabType = "rules" | "locations" | "characters" | "scenes" | "props" | "frontcover";

export default function UniverseManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>("rules");

  const tabs = [
    { id: "rules" as TabType, label: "Rules", icon: BookOpen, category: "management" },
    { id: "frontcover" as TabType, label: "Front Cover", icon: BookImage, category: "management" },
    { id: "characters" as TabType, label: "Character Database", icon: Users, category: "assets" },
    { id: "locations" as TabType, label: "Locations", icon: MapPin, category: "assets" },
    { id: "scenes" as TabType, label: "Scenes", icon: Image, category: "assets" },
    { id: "props" as TabType, label: "Props & Tools", icon: Wrench, category: "assets" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="h-16 bg-[#13131a] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-bold text-lg">Universe Manager</h2>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
            World-building hub
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-[#13131a] border-r border-white/5 p-4">
          {/* Management Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-3">Management</h4>
            <div className="space-y-2">
              {tabs.filter(t => t.category === "management").map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assets Section */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-3">Assets</h4>
            <div className="space-y-2">
              {tabs.filter(t => t.category === "assets").map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
          {activeTab === "scenes" && <ScenesTab />}
          {activeTab === "props" && <PropsTab />}
          {activeTab === "rules" && <RulesTab />}
          {activeTab === "locations" && <LocationsTab />}
          {activeTab === "characters" && <CharactersTab />}
          {activeTab === "frontcover" && <FrontCoverTab />}
        </div>
      </div>
    </>
  );
}

// Scenes Tab Component
function ScenesTab() {
  const [library, setLibrary] = useState("all");
  const [editScene, setEditScene] = useState<string | null>(null);
  const [tagsScene, setTagsScene] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [sceneTags, setSceneTags] = useState<Record<string, string[]>>({
    "basketball-court": ["Outdoor", "Day", "Sports"],
    "seirin-school": ["Outdoor", "School"],
  });

  const scenes = [
    { id: "basketball-court", name: "Basketball Court", desc: "Main training ground", emoji: "🏀", gradient: "from-blue-900/30 to-cyan-900/30" },
    { id: "seirin-school", name: "Seirin High School", desc: "School building exterior", emoji: "🏫", gradient: "from-purple-900/30 to-pink-900/30" },
  ];

  const addTag = (id: string) => { if (!newTagInput.trim()) return; setSceneTags(prev => ({ ...prev, [id]: [...(prev[id] || []), newTagInput.trim()] })); setNewTagInput(""); };
  const removeTag = (id: string, tag: string) => { setSceneTags(prev => ({ ...prev, [id]: (prev[id] || []).filter(t => t !== tag) })); };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Scenes Database</h3>
          <p className="text-gray-400 text-sm">Manage background scenes and locations</p>
        </div>
        <div className="flex items-center gap-3">
          <LibraryFilter library={library} setLibrary={setLibrary} />
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Add Scene
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenes.map(scene => (
          <div key={scene.id} className="bg-[#13131a] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition">
            <div className={`aspect-video bg-gradient-to-br ${scene.gradient} flex items-center justify-center`}>
              <div className="text-6xl">{scene.emoji}</div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-bold text-white">{scene.name}</h4>
                <Lock className="w-3 h-3 text-purple-400" />
              </div>
              <p className="text-xs text-gray-400 mb-2">{scene.desc}</p>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {(sceneTags[scene.id] || []).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{tag}</span>
                ))}
              </div>
              <div className="flex gap-1.5 pt-2 border-t border-white/5">
                <button onClick={() => setEditScene(scene.id)} className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] transition flex items-center justify-center gap-1"><Pencil className="w-3 h-3" />Edit</button>
                <button onClick={() => setTagsScene(scene.id)} className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] transition flex items-center justify-center gap-1"><Tag className="w-3 h-3" />Tags</button>
                <button className="px-2 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] transition"><XIcon className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Scene Dialog */}
      {editScene && (() => {
        const scene = scenes.find(s => s.id === editScene);
        if (!scene) return null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold">Edit Scene — {scene.name}</h3>
                <button onClick={() => setEditScene(null)} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Scene Name</label><input type="text" defaultValue={scene.name} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" /></div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Description</label><textarea defaultValue={scene.desc} className="w-full h-20 px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 resize-none" /></div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Reference Image</label><button className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition"><Image className="w-5 h-5 mx-auto mb-1 text-purple-400" /><span className="text-xs text-purple-400 font-medium">Upload or Generate</span></button></div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setEditScene(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">Cancel</button>
                <button onClick={() => setEditScene(null)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tags Scene Dialog */}
      {tagsScene && (() => {
        const scene = scenes.find(s => s.id === tagsScene);
        if (!scene) return null;
        const tags = sceneTags[tagsScene] || [];
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div><h3 className="text-white font-bold">Manage Tags — {scene.name}</h3><p className="text-xs text-gray-400 mt-0.5">Add, remove, or organize tags</p></div>
                <button onClick={() => { setTagsScene(null); setNewTagInput(""); }} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20 flex items-center gap-2"><Tag className="w-3 h-3" />{tag}<button onClick={() => removeTag(tagsScene, tag)} className="hover:text-red-400 transition"><XIcon className="w-3 h-3" /></button></span>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-gray-500">No tags yet</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag(tagsScene)} placeholder="Type new tag..." className="flex-1 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                  <button onClick={() => addTag(tagsScene)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="mt-4"><label className="text-[10px] text-gray-500 uppercase font-semibold">Suggested</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Indoor", "Outdoor", "Night", "Day", "Urban", "Rural", "Sports", "School", "Dramatic"].filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                      <button key={tag} onClick={() => setSceneTags(prev => ({ ...prev, [tagsScene]: [...(prev[tagsScene] || []), tag] }))} className="px-2.5 py-1 bg-white/5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-lg text-[10px] transition border border-white/5">+ {tag}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end"><button onClick={() => { setTagsScene(null); setNewTagInput(""); }} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">Done</button></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Props Tab Component
function PropsTab() {
  const [library, setLibrary] = useState("all");
  const [editProp, setEditProp] = useState<string | null>(null);
  const [tagsProp, setTagsProp] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [propTags, setPropTags] = useState<Record<string, string[]>>({
    basketball: ["Sports", "Equipment"],
    jersey: ["Clothing"],
    phone: ["Tech"],
  });

  const props = [
    { id: "basketball", name: "Basketball", desc: "Standard ball", emoji: "🏀", gradient: "from-orange-900/20 to-red-900/20" },
    { id: "jersey", name: "Team Jersey", desc: "Seirin uniform", emoji: "👕", gradient: "from-blue-900/20 to-cyan-900/20" },
    { id: "phone", name: "Smartphone", desc: "Modern phone", emoji: "📱", gradient: "from-gray-900/20 to-gray-700/20" },
  ];

  const addTag = (id: string) => { if (!newTagInput.trim()) return; setPropTags(prev => ({ ...prev, [id]: [...(prev[id] || []), newTagInput.trim()] })); setNewTagInput(""); };
  const removeTag = (id: string, tag: string) => { setPropTags(prev => ({ ...prev, [id]: (prev[id] || []).filter(t => t !== tag) })); };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Props & Tools Database</h3>
          <p className="text-gray-400 text-sm">Manage objects, equipment, and tools</p>
        </div>
        <div className="flex items-center gap-3">
          <LibraryFilter library={library} setLibrary={setLibrary} />
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Add Prop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {props.map(prop => (
          <div key={prop.id} className="bg-[#13131a] rounded-xl p-4 border border-white/5 hover:border-purple-500/50 transition">
            <div className={`aspect-square bg-gradient-to-br ${prop.gradient} rounded-lg flex items-center justify-center mb-3`}>
              <div className="text-4xl">{prop.emoji}</div>
            </div>
            <h4 className="text-sm font-bold text-white text-center mb-1">{prop.name}</h4>
            <p className="text-xs text-gray-400 text-center mb-2">{prop.desc}</p>
            <div className="flex gap-1 justify-center flex-wrap mb-2">
              {(propTags[prop.id] || []).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] flex items-center gap-0.5"><Tag className="w-2 h-2" />{tag}</span>
              ))}
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditProp(prop.id)} className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-[10px] transition flex items-center justify-center gap-1"><Pencil className="w-2.5 h-2.5" />Edit</button>
              <button onClick={() => setTagsProp(prop.id)} className="flex-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-[10px] transition flex items-center justify-center gap-1"><Tag className="w-2.5 h-2.5" />Tags</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Prop Dialog */}
      {editProp && (() => {
        const prop = props.find(p => p.id === editProp);
        if (!prop) return null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold">Edit Prop — {prop.name}</h3>
                <button onClick={() => setEditProp(null)} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Name</label><input type="text" defaultValue={prop.name} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" /></div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Description</label><textarea defaultValue={prop.desc} className="w-full h-16 px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 resize-none" /></div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Category</label>
                  <select className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"><option>Sports Equipment</option><option>Clothing</option><option>Technology</option><option>Weapon</option><option>Food</option><option>Vehicle</option><option>Other</option></select>
                </div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Reference Image</label><button className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition"><Image className="w-5 h-5 mx-auto mb-1 text-purple-400" /><span className="text-xs text-purple-400 font-medium">Upload or Generate</span></button></div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setEditProp(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">Cancel</button>
                <button onClick={() => setEditProp(null)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tags Prop Dialog */}
      {tagsProp && (() => {
        const prop = props.find(p => p.id === tagsProp);
        if (!prop) return null;
        const tags = propTags[tagsProp] || [];
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div><h3 className="text-white font-bold">Manage Tags — {prop.name}</h3><p className="text-xs text-gray-400 mt-0.5">Add, remove, or organize tags</p></div>
                <button onClick={() => { setTagsProp(null); setNewTagInput(""); }} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs border border-emerald-500/20 flex items-center gap-2"><Tag className="w-3 h-3" />{tag}<button onClick={() => removeTag(tagsProp, tag)} className="hover:text-red-400 transition"><XIcon className="w-3 h-3" /></button></span>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-gray-500">No tags yet</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag(tagsProp)} placeholder="Type new tag..." className="flex-1 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                  <button onClick={() => addTag(tagsProp)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="mt-4"><label className="text-[10px] text-gray-500 uppercase font-semibold">Suggested</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Sports", "Equipment", "Clothing", "Tech", "Weapon", "Food", "Vehicle", "Personal", "Team"].filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                      <button key={tag} onClick={() => setPropTags(prev => ({ ...prev, [tagsProp]: [...(prev[tagsProp] || []), tag] }))} className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-lg text-[10px] transition border border-white/5">+ {tag}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end"><button onClick={() => { setTagsProp(null); setNewTagInput(""); }} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">Done</button></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Rules System Tab
function RulesTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Rules System</h3>
          <p className="text-gray-400 text-sm">Define power systems, technologies, and laws of your world</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zone Defense System */}
        <div className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Zone Defense System</h4>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">Power System</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Players can create defensive zones that slow opponents...
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition">Edit</button>
            <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition">Delete</button>
          </div>
        </div>

        {/* Court Technology */}
        <div className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Court Technology</h4>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">Technology</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Smart courts with holographic displays and AI analysis...
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition">Edit</button>
            <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Locations Database Tab
function LocationsTab() {
  const [editLoc, setEditLoc] = useState<string | null>(null);
  const [tagsLoc, setTagsLoc] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [locTags, setLocTags] = useState<Record<string, string[]>>({
    seirin: ["Urban", "School"],
    arena: ["Arena", "Indoor"],
  });

  const locations = [
    { id: "seirin", name: "Seirin High School", desc: "Main training ground", emoji: "🏫", gradient: "from-purple-900/30 to-pink-900/30" },
    { id: "arena", name: "National Arena", desc: "Tournament venue", emoji: "🏟️", gradient: "from-orange-900/30 to-red-900/30" },
  ];

  const addTag = (id: string) => { if (!newTagInput.trim()) return; setLocTags(prev => ({ ...prev, [id]: [...(prev[id] || []), newTagInput.trim()] })); setNewTagInput(""); };
  const removeTag = (id: string, tag: string) => { setLocTags(prev => ({ ...prev, [id]: (prev[id] || []).filter(t => t !== tag) })); };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Locations Database</h3>
          <p className="text-gray-400 text-sm">Catalog all places in your manga world</p>
        </div>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {locations.map(loc => (
          <div key={loc.id} className="bg-[#13131a] rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition">
            <div className={`aspect-video bg-gradient-to-br ${loc.gradient} flex items-center justify-center`}>
              <div className="text-5xl">{loc.emoji}</div>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-bold text-white mb-1">{loc.name}</h4>
              <p className="text-xs text-gray-400 mb-2">{loc.desc}</p>
              <div className="flex gap-1 flex-wrap mb-3">
                {(locTags[loc.id] || []).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{tag}</span>
                ))}
              </div>
              <div className="flex gap-1.5 pt-2 border-t border-white/5">
                <button onClick={() => setEditLoc(loc.id)} className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] transition flex items-center justify-center gap-1"><Pencil className="w-3 h-3" />Edit</button>
                <button onClick={() => setTagsLoc(loc.id)} className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] transition flex items-center justify-center gap-1"><Tag className="w-3 h-3" />Tags</button>
                <button className="px-2 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] transition"><XIcon className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
        <div className="bg-[#13131a] rounded-lg border-2 border-dashed border-white/20 hover:border-purple-500/50 transition cursor-pointer flex items-center justify-center aspect-video">
          <div className="text-center p-4">
            <Plus className="w-6 h-6 mx-auto mb-1 text-purple-400" />
            <p className="text-xs font-medium text-gray-400">Add Location</p>
          </div>
        </div>
      </div>

      {/* Edit Location Dialog */}
      {editLoc && (() => {
        const loc = locations.find(l => l.id === editLoc);
        if (!loc) return null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold">Edit Location — {loc.name}</h3>
                <button onClick={() => setEditLoc(null)} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Location Name</label><input type="text" defaultValue={loc.name} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" /></div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Description</label><textarea defaultValue={loc.desc} className="w-full h-20 px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Type</label>
                    <select className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"><option>Indoor</option><option>Outdoor</option><option>Mixed</option></select>
                  </div>
                  <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Time of Day</label>
                    <select className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"><option>Any</option><option>Day</option><option>Night</option><option>Dawn</option><option>Dusk</option></select>
                  </div>
                </div>
                <div><label className="text-xs font-semibold text-gray-400 block mb-1.5">Reference Image</label><button className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition"><Image className="w-5 h-5 mx-auto mb-1 text-purple-400" /><span className="text-xs text-purple-400 font-medium">Upload or Generate</span></button></div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setEditLoc(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">Cancel</button>
                <button onClick={() => setEditLoc(null)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tags Location Dialog */}
      {tagsLoc && (() => {
        const loc = locations.find(l => l.id === tagsLoc);
        if (!loc) return null;
        const tags = locTags[tagsLoc] || [];
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div><h3 className="text-white font-bold">Manage Tags — {loc.name}</h3><p className="text-xs text-gray-400 mt-0.5">Add, remove, or organize tags</p></div>
                <button onClick={() => { setTagsLoc(null); setNewTagInput(""); }} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20 flex items-center gap-2"><Tag className="w-3 h-3" />{tag}<button onClick={() => removeTag(tagsLoc, tag)} className="hover:text-red-400 transition"><XIcon className="w-3 h-3" /></button></span>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-gray-500">No tags yet</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag(tagsLoc)} placeholder="Type new tag..." className="flex-1 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                  <button onClick={() => addTag(tagsLoc)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="mt-4"><label className="text-[10px] text-gray-500 uppercase font-semibold">Suggested</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Indoor", "Outdoor", "Urban", "Rural", "School", "Arena", "Night", "Day", "Scenic", "Sports"].filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                      <button key={tag} onClick={() => setLocTags(prev => ({ ...prev, [tagsLoc]: [...(prev[tagsLoc] || []), tag] }))} className="px-2.5 py-1 bg-white/5 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 rounded-lg text-[10px] transition border border-white/5">+ {tag}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end"><button onClick={() => { setTagsLoc(null); setNewTagInput(""); }} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">Done</button></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Reusable Library Filter Component
function LibraryFilter({ library, setLibrary }: { library: string; setLibrary: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[#1a1a24] rounded-lg p-1 border border-white/10">
      <button onClick={() => setLibrary("all")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${library === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"}`}>All</button>
      <button onClick={() => setLibrary("private")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1 ${library === "private" ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-gray-300"}`}><Lock className="w-3 h-3" />Story</button>
      <button onClick={() => setLibrary("public")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1 ${library === "public" ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-gray-300"}`}><Globe className="w-3 h-3" />Public</button>
    </div>
  );
}

// Character Database Tab
function CharactersTab() {
  const [library, setLibrary] = useState("all");
  const [editChar, setEditChar] = useState<string | null>(null);
  const [tagsChar, setTagsChar] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [charTags, setCharTags] = useState<Record<string, string[]>>({
    kaito: ["Main", "Hero", "Male", "Student"],
    ryu: ["Support", "Rival", "Male", "Athlete"],
  });

  const tagColors: Record<string, string> = { Main: "blue", Hero: "purple", Male: "orange", Student: "emerald", Support: "orange", Rival: "red", Athlete: "cyan" };
  const getTagColor = (tag: string) => tagColors[tag] || "gray";

  const addTag = (charId: string) => {
    if (!newTagInput.trim()) return;
    setCharTags(prev => ({ ...prev, [charId]: [...(prev[charId] || []), newTagInput.trim()] }));
    setNewTagInput("");
  };

  const removeTag = (charId: string, tag: string) => {
    setCharTags(prev => ({ ...prev, [charId]: (prev[charId] || []).filter(t => t !== tag) }));
  };

  const characters = [
    { id: "kaito", name: "Kaito", role: "Protagonist", age: "16", ability: "Speed Burst", episodes: "1, 2, 4, 8", color: "from-pink-500 to-orange-500" },
    { id: "ryu", name: "Ryu", role: "Rival", age: "17", ability: "Defense Zone", episodes: "2, 4, 5", color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Character Database</h3>
          <p className="text-gray-400 text-sm">Centralized character information and tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <LibraryFilter library={library} setLibrary={setLibrary} />
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Add Character
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map(char => (
          <div key={char.id} className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-white font-bold text-2xl shrink-0`}>
                {char.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-bold text-white">{char.name}</h4>
                  <span title="Story Asset"><Lock className="w-3 h-3 text-purple-400" /></span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{char.role}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(charTags[char.id] || []).map(tag => (
                    <span key={tag} className={`px-2 py-0.5 bg-${getTagColor(tag)}-500/20 text-${getTagColor(tag)}-400 rounded text-[10px] flex items-center gap-1`}><Tag className="w-2.5 h-2.5" />{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Age:</span><span className="text-white">{char.age}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ability:</span><span className="text-white">{char.ability}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Episodes:</span><span className="text-purple-400">{char.episodes}</span></div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
              <button onClick={() => setEditChar(char.id)} className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition flex items-center justify-center gap-1.5"><Pencil className="w-3 h-3" />Edit</button>
              <button onClick={() => setTagsChar(char.id)} className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition flex items-center justify-center gap-1.5"><Tag className="w-3 h-3" />Tags</button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition"><XIcon className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Character Dialog */}
      {editChar && (() => {
        const char = characters.find(c => c.id === editChar);
        if (!char) return null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${char.color} flex items-center justify-center text-white font-bold`}>{char.name[0]}</div>
                  <div>
                    <h3 className="text-white font-bold">Edit {char.name}</h3>
                    <p className="text-xs text-gray-400">Update character details</p>
                  </div>
                </div>
                <button onClick={() => setEditChar(null)} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Name</label>
                  <input type="text" defaultValue={char.name} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">Role</label>
                    <input type="text" defaultValue={char.role} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">Age</label>
                    <input type="text" defaultValue={char.age} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Special Ability</label>
                  <input type="text" defaultValue={char.ability} className="w-full px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Description</label>
                  <textarea defaultValue={`${char.name} is the ${char.role.toLowerCase()} of the story.`} className="w-full h-20 px-3 py-2.5 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">Reference Image</label>
                  <button className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition">
                    <Image className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">Upload or Generate</span>
                  </button>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setEditChar(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">Cancel</button>
                <button onClick={() => setEditChar(null)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                  <Save className="w-4 h-4" />Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tags Management Dialog */}
      {tagsChar && (() => {
        const char = characters.find(c => c.id === tagsChar);
        if (!char) return null;
        const tags = charTags[tagsChar] || [];
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">Manage Tags — {char.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Add, remove, or organize tags</p>
                </div>
                <button onClick={() => { setTagsChar(null); setNewTagInput(""); }} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs border border-purple-500/20 flex items-center gap-2">
                      <Tag className="w-3 h-3" />{tag}
                      <button onClick={() => removeTag(tagsChar, tag)} className="hover:text-red-400 transition"><XIcon className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-gray-500">No tags yet</p>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag(tagsChar)}
                    placeholder="Type new tag..."
                    className="flex-1 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <button onClick={() => addTag(tagsChar)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <label className="text-[10px] text-gray-500 uppercase font-semibold">Suggested Tags</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Protagonist", "Antagonist", "Female", "Male", "Student", "Teacher", "Athlete", "Support", "Villain", "Mentor", "Comic Relief"].filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                      <button key={tag} onClick={() => { setCharTags(prev => ({ ...prev, [tagsChar]: [...(prev[tagsChar] || []), tag] })); }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 rounded-lg text-[10px] transition border border-white/5 hover:border-purple-500/20">
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end">
                <button onClick={() => { setTagsChar(null); setNewTagInput(""); }} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">Done</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Front Cover Tab Component
function FrontCoverTab() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Front Cover</h3>
          <p className="text-gray-400 text-sm">Design and generate your manga front cover</p>
        </div>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />Generate Cover with AI
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cover Preview */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 block">Cover Preview</label>
          <div className="aspect-[2/3] bg-[#13131a] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-black/80" />
            <div className="relative z-10 text-center px-8">
              <div className="text-6xl mb-6">🏀</div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>Basketball Dreams</h2>
              <p className="text-sm text-gray-300 mb-4">Volume 1: The Beginning</p>
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-xs border border-purple-500/30">Sports</span>
                <span className="px-3 py-1 bg-orange-500/30 text-orange-300 rounded-full text-xs border border-orange-500/30">Shonen</span>
              </div>
              <p className="text-xs text-gray-400 mt-6">By Author Name</p>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-gray-500">
              <span>Volume 1</span>
              <span>Chapter 1–6</span>
            </div>
          </div>
        </div>

        {/* Cover Settings */}
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Title</label>
            <input type="text" defaultValue="Basketball Dreams" className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Subtitle</label>
            <input type="text" defaultValue="Volume 1: The Beginning" className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Author</label>
            <input type="text" defaultValue="Author Name" className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Cover Style</label>
            <select defaultValue="" className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm appearance-none cursor-pointer">
              <option value="">None (AI decides)</option>
              <option value="dynamic-action">Dynamic Action</option>
              <option value="character-portrait">Character Portrait</option>
              <option value="scenic">Scenic / Atmospheric</option>
              <option value="minimalist">Minimalist</option>
              <option value="collage">Collage</option>
              <option value="manga-traditional">Manga Traditional</option>
              <option value="dramatic-closeup">Dramatic Close-up</option>
              <option value="silhouette">Silhouette</option>
              <option value="watercolor">Watercolor</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Featured Characters</label>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs border border-orange-500/20 flex items-center gap-1.5">Kaito <XIcon className="w-3 h-3 cursor-pointer hover:text-orange-200" /></span>
              <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20 flex items-center gap-1.5">Ryu <XIcon className="w-3 h-3 cursor-pointer hover:text-blue-200" /></span>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs border border-dashed border-white/20 transition"><Plus className="w-3 h-3 inline mr-1" />Add</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Scene Description</label>
            <textarea
              defaultValue="Kaito stands alone on a basketball court at dawn, ball in hand, looking determined. City skyline in the background."
              className="w-full h-20 px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Reference Image (Optional)</label>
            <button className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg text-center transition">
              <Image className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Upload reference image for the cover scene</span>
              <p className="text-[9px] text-gray-500 mt-1">AI will use this as style/composition reference</p>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Color Mood</label>
              <select defaultValue="" className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm appearance-none cursor-pointer">
                <option value="">None (AI decides)</option>
                <option value="warm-sunrise">Warm Sunrise</option>
                <option value="cool-night">Cool Night</option>
                <option value="vibrant-action">Vibrant Action</option>
                <option value="dark-dramatic">Dark Dramatic</option>
                <option value="soft-pastel">Soft Pastel</option>
                <option value="monochrome">Monochrome</option>
                <option value="neon">Neon / Cyberpunk</option>
                <option value="custom">Custom (define in description)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">Format</label>
              <select defaultValue="webtoon" className="w-full px-4 py-3 bg-[#13131a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm appearance-none cursor-pointer">
                <option value="webtoon">Webtoon (Vertical)</option>
                <option value="manga-b6">Manga (B6)</option>
                <option value="us-comic">US Comic</option>
                <option value="square">Square</option>
                <option value="a4">A4 Print</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" />Generate Cover
            </button>
            <button className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition text-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
