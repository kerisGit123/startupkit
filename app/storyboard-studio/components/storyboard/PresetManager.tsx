"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Pencil, Trash2, FileText, Camera, Compass, Palette, Package, StickyNote } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  all:             { label: "All",          icon: FileText,   color: "text-gray-400" },
  note:            { label: "Notes",        icon: StickyNote, color: "text-yellow-400" },
  "camera-studio": { label: "Camera",       icon: Camera,     color: "text-green-400" },
  "camera-angle":  { label: "Angles",       icon: Compass,    color: "text-cyan-400" },
  style:           { label: "Styles",       icon: Palette,    color: "text-purple-400" },
};

// Lookup for icon/color on any category (including ones not in tabs)
const ALL_CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  ...CATEGORY_CONFIG,
  bundle:          { label: "Bundles",       icon: Package,    color: "text-emerald-400" },
};

interface PresetManagerProps {
  companyId: string;
  onClose: () => void;
}

export function PresetManager({ companyId, onClose }: PresetManagerProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrompt, setEditPrompt] = useState("");

  const presets = useQuery(api.storyboard.presets.list, {
    companyId,
    category: activeTab === "all" ? undefined : activeTab,
  });
  const updatePreset = useMutation(api.storyboard.presets.update);
  const removePreset = useMutation(api.storyboard.presets.remove);

  const handleDelete = async (id: any, name: string) => {
    try {
      await removePreset({ id });
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete preset");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updatePreset({
        id: editingId as any,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        prompt: editPrompt.trim() || undefined,
      });
      toast.success("Preset updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-(--bg-primary) border border-(--border-primary) rounded-xl w-[480px] max-h-[520px] flex flex-col shadow-2xl z-50"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border-primary)">
          <h3 className="text-sm font-semibold text-(--text-primary)">Manage Presets</h3>
          <button onClick={onClose} className="text-(--text-tertiary) hover:text-(--text-primary) transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-(--border-primary) overflow-x-auto">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition whitespace-nowrap ${
                activeTab === key
                  ? "bg-white/10 text-(--text-primary)"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
              }`}
            >
              <config.icon className={`w-3 h-3 ${activeTab === key ? config.color : ""}`} />
              {config.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!presets ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-(--text-tertiary)">No presets saved yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {presets.map((preset) => {
                const config = ALL_CATEGORY_CONFIG[preset.category] || ALL_CATEGORY_CONFIG.all;
                const isEditing = editingId === String(preset._id);

                return (
                  <div key={preset._id} className="group flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition">
                    {/* Icon */}
                    <config.icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            autoFocus
                            placeholder="Name"
                            className="w-full px-2 py-1 bg-(--bg-secondary) border border-(--border-primary) rounded text-xs text-(--text-primary) outline-none focus:border-(--accent-blue)/50"
                          />
                          {!["style", "note", "camera-studio", "camera-angle"].includes(preset.category) && (
                            <input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-2 py-1 bg-(--bg-secondary) border border-(--border-primary) rounded text-[10px] text-(--text-secondary) outline-none focus:border-(--accent-blue)/50"
                            />
                          )}
                          <textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Prompt text..."
                            rows={3}
                            className="w-full px-2 py-1 bg-(--bg-secondary) border border-(--border-primary) rounded text-[10px] text-(--text-secondary) outline-none focus:border-(--accent-blue)/50 resize-none"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={handleSaveEdit} className="px-2 py-0.5 text-[10px] bg-(--accent-blue) text-white rounded transition hover:bg-(--accent-blue-hover)">Save</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-0.5 text-[10px] text-(--text-tertiary) hover:text-(--text-primary) transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-(--text-primary) truncate">{preset.name}</p>
                          {preset.description && !["style", "note", "camera-studio", "camera-angle"].includes(preset.category) && (
                            <p className="text-[10px] text-(--text-tertiary) truncate">{preset.description}</p>
                          )}
                          {preset.prompt && (
                            <p className="text-[10px] text-(--text-tertiary) opacity-60 truncate mt-0.5">{preset.prompt.slice(0, 60)}...</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Category badge */}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-(--text-tertiary) shrink-0">
                      {config.label}
                    </span>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(String(preset._id));
                            setEditName(preset.name);
                            setEditDescription(preset.description || "");
                            setEditPrompt(preset.prompt || "");
                          }}
                          className="p-1 rounded hover:bg-white/10 transition"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3 text-(--text-secondary)" />
                        </button>
                        <button
                          onClick={() => handleDelete(preset._id, preset.name)}
                          className="p-1 rounded hover:bg-red-500/10 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-(--border-primary) text-[10px] text-(--text-tertiary)">
          {presets?.length || 0} preset{(presets?.length || 0) !== 1 ? "s" : ""}
        </div>
      </div>
    </>
  );
}
