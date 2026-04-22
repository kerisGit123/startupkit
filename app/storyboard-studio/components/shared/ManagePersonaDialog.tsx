"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Mic, Check, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConfirmDialog } from "./ConfirmDialog";

interface ManagePersonaDialogProps {
  companyId: string;
  onClose: () => void;
}

export function ManagePersonaDialog({ companyId, onClose }: ManagePersonaDialogProps) {
  const personas = useQuery(api.storyboard.personas.list, { companyId });
  const updatePersona = useMutation(api.storyboard.personas.update);
  const removePersona = useMutation(api.storyboard.personas.remove);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStyle, setEditStyle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const selected = personas?.find(p => String(p._id) === selectedId);

  // Load selected persona into edit fields
  useEffect(() => {
    if (selected) {
      setEditName(selected.name);
      setEditDesc(selected.description);
      setEditStyle(selected.style || "");
    }
  }, [selectedId, selected]);

  // Auto-select first persona
  useEffect(() => {
    if (!selectedId && personas && personas.length > 0) {
      setSelectedId(String(personas[0]._id));
    }
  }, [personas, selectedId]);

  const handleSave = async () => {
    if (!selectedId || !editName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await updatePersona({ id: selectedId as any, name: editName.trim(), description: editDesc.trim(), style: editStyle.trim() || undefined });
      toast.success("Persona updated!");
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await removePersona({ id: pendingDelete.id as any });
      toast.success(`"${pendingDelete.name}" deleted`);
      if (selectedId === pendingDelete.id) setSelectedId(null);
    } catch { toast.error("Failed to delete"); }
    finally { setDeletingId(null); setPendingDelete(null); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }} onClick={() => { if (!pendingDelete) onClose(); }}>
      <div className="bg-[#1A1A1A] rounded-xl w-full max-w-[680px] h-[480px] overflow-hidden border border-[#3D3D3D] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#3D3D3D] shrink-0">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-medium text-sm">Manage Personas</h3>
            <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{personas?.length || 0}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-1 min-h-0">

          {/* Left: Persona list */}
          <div className="w-[220px] border-r border-[#3D3D3D] overflow-y-auto">
            {!personas ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>
            ) : personas.length === 0 ? (
              <div className="text-center py-12 px-4 text-[11px] text-gray-600">No personas yet.<br />Create one from a generated song.</div>
            ) : (
              personas.map((p) => (
                <button
                  key={String(p._id)}
                  onClick={() => setSelectedId(String(p._id))}
                  className={`w-full text-left px-4 py-3 border-b border-[#2A2A32] transition ${
                    selectedId === String(p._id)
                      ? 'bg-purple-500/10 border-l-2 border-l-purple-500'
                      : 'hover:bg-[#1E1E24] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="text-sm text-white font-medium truncate">{p.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.style && <span className="text-[9px] text-gray-500">{p.style}</span>}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right: Edit panel */}
          <div className="flex-1 overflow-y-auto">
            {selected ? (
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Description</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4}
                    className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition resize-none" />
                </div>

                {/* Style */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Style</label>
                  <input type="text" value={editStyle} onChange={(e) => setEditStyle(e.target.value)} placeholder="e.g. Rock, Pop, R&B"
                    className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition" />
                </div>

                {/* Persona ID */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Persona ID</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-[#0A0A0F] border border-[#2A2A32] rounded-lg text-[11px] text-gray-400 font-mono truncate">
                      {selected.personaId}
                    </code>
                    <button onClick={() => { navigator.clipboard.writeText(selected.personaId); toast.success("Persona ID copied"); }}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition" title="Copy ID">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setPendingDelete({ id: String(selected._id), name: selected.name })} disabled={deletingId === String(selected._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50">
                    {deletingId === String(selected._id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete Persona
                  </button>
                  <button onClick={handleSave} disabled={saving || !editName.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-600">
                {personas && personas.length > 0 ? "Select a persona to edit" : "No personas to manage"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Persona"
        subtitle={pendingDelete?.name}
        message={<>Are you sure you want to delete <strong>{pendingDelete?.name}</strong>? This persona will no longer be available for music generation. This action cannot be undone.</>}
        confirmText="Delete"
        variant="danger"
        loading={!!deletingId}
      />
    </div>,
    document.body
  );
}
