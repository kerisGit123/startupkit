"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Plus, X, User, Package, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";

interface ElementLibraryProps {
  projectId: Id<"storyboard_projects">;
  userId: string;
  onClose: () => void;
  onSelectElement?: (referenceUrls: string[], name: string) => void;
}

const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User,    color: "text-purple-400" },
  { key: "object",    label: "Props",       Icon: Package, color: "text-blue-400"   },
  { key: "logo",      label: "Logos",       Icon: ImageIcon,color: "text-emerald-400"},
];

export function ElementLibrary({ projectId, userId, onClose, onSelectElement }: ElementLibraryProps) {
  const [activeType, setActiveType] = useState("character");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    type: activeType,
  });
  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const updateElement = useMutation(api.storyboard.storyboardElements.update);
  const removeElement = useMutation(api.storyboard.storyboardElements.remove);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createElement({
        projectId,
        name: newName.trim(),
        type: activeType,
        description: newDesc.trim() || undefined,
        thumbnailUrl: newUrl.trim() || "https://placehold.co/200x200/1a1a24/666?text=" + encodeURIComponent(newName.trim().slice(0, 2).toUpperCase()),
        referenceUrls: newUrl.trim() ? [newUrl.trim()] : [],
        tags: [],
        createdBy: userId,
      });
      setNewName(""); setNewDesc(""); setNewUrl("");
      setShowCreate(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadRef = async (e: React.ChangeEvent<HTMLInputElement>, elementId: Id<"storyboard_elements">) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r2Key = `project-${projectId}/elements/${elementId}-${Date.now()}-${file.name}`;
      const sigRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: r2Key, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await sigRes.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const el = elements?.find((el) => el._id === elementId);
      await updateElement({
        id: elementId,
        thumbnailUrl: publicUrl,
        referenceUrls: [...(el?.referenceUrls ?? []), publicUrl],
      });
    } catch (err) {
      console.error("[ElementLibrary upload]", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
          <h2 className="text-sm font-bold text-white">Element Library</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/8 rounded-lg transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 p-3 border-b border-white/6 shrink-0">
          {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
            <button key={key}
              onClick={() => setActiveType(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                activeType === key ? "bg-white/12 text-white" : "text-gray-400 hover:text-white hover:bg-white/6"
              }`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs text-white rounded-lg transition">
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Create form */}
          {showCreate && (
            <div className="mb-4 p-4 bg-white/4 border border-white/8 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-white">New {ELEMENT_TYPES.find(t => t.key === activeType)?.label.slice(0, -1)}</p>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Name (e.g. Hero Character)"
                className="w-full bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60" />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                placeholder="Reference image URL (optional)"
                className="w-full bg-white/6 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/60" />
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={saving || !newName.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs text-white rounded-lg transition">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 bg-white/8 hover:bg-white/12 text-xs text-gray-300 rounded-lg transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Element grid */}
          {!elements ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : elements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <User className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">No {activeType}s yet</p>
              <p className="text-xs text-gray-600 mt-0.5">Add characters, props, or logos to reuse across frames</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {elements.map((el) => (
                <div key={el._id} className="group relative">
                  <button
                    onClick={() => onSelectElement?.(el.referenceUrls, el.name)}
                    className="w-full aspect-square rounded-xl overflow-hidden border border-white/8 hover:border-purple-500/50 transition bg-[#12121a] relative">
                    <img src={el.thumbnailUrl} alt={el.name}
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1.5">
                      <p className="text-[10px] text-white font-medium truncate">{el.name}</p>
                      {el.description && (
                        <p className="text-[9px] text-gray-400 truncate">{el.description}</p>
                      )}
                    </div>
                  </button>
                  <label className="absolute top-1 right-7 opacity-0 group-hover:opacity-100 p-1 bg-black/70 hover:bg-black/90 rounded-md transition cursor-pointer">
                    {uploading ? <Loader2 className="w-3 h-3 text-gray-300 animate-spin" /> : <Plus className="w-3 h-3 text-gray-300" />}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleUploadRef(e, el._id)} />
                  </label>
                  <button
                    onClick={() => removeElement({ id: el._id })}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-600/80 hover:bg-red-600 rounded-md transition">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                  {el.usageCount > 0 && (
                    <div className="absolute top-1 left-1 bg-black/70 rounded-md px-1.5 py-0.5">
                      <span className="text-[9px] text-gray-300">{el.usageCount}×</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
