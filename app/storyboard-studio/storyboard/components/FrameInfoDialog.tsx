"use client";

import React, { useState } from "react";
import { Tag, Mic, List, Play, Plus, X, Check } from "lucide-react";

interface FrameInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  frameNumber: number;
  aspectRatio: string;
  version: string;
  activeShot: any;
  onShotsChange: (shots: any[]) => void;
  shots: any[];
  TAG_COLORS: string[];
}

export function FrameInfoDialog({ 
  isOpen, 
  onClose, 
  frameNumber, 
  aspectRatio, 
  version,
  activeShot,
  onShotsChange,
  shots,
  TAG_COLORS
}: FrameInfoDialogProps) {
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingField, setEditingField] = useState<"voice" | "notes" | "action" | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");
  const [showTagPopup, setShowTagPopup] = useState(false);

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const newTag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: newTagColor,
    };
    onShotsChange(shots.map(s => 
      s.id === activeShot.id 
        ? { ...s, tags: [...s.tags, newTag] }
        : s
    ));
    setNewTagName("");
    setShowTagPicker(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onShotsChange(shots.map(s => 
      s.id === activeShot.id 
        ? { ...s, tags: s.tags.filter(t => t.id !== tagId) }
        : s
    ));
  };

  const startEdit = (field: "voice" | "notes" | "action") => {
    setEditingField(field);
    setFieldDraft(activeShot[field] || "");
  };

  const saveField = (field: "voice" | "notes" | "action") => {
    onShotsChange(shots.map(s => 
      s.id === activeShot.id 
        ? { ...s, [field]: fieldDraft }
        : s
    ));
    setEditingField(null);
    setFieldDraft("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Frame Info Dialog */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={onClose}>
        <div 
          className="bg-gradient-to-br from-[#1e1e2a] to-[#151520] border border-white/20 rounded-2xl shadow-2xl p-0 max-w-lg w-full mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Frame Details</h3>
                  <p className="text-gray-400 text-xs">Edit frame information and properties</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Frame Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#0d0d12] to-[#111118] border-b border-white/5">
            <div className="space-y-4">
              {/* Tags (interactive) */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-400 text-sm font-medium">Tags</span>
                  <button onClick={() => setShowTagPicker(v => !v)} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeShot.tags.map(t => (
                    <span key={t.id} className="px-2 py-1 rounded text-xs font-semibold text-white inline-flex items-center gap-1 group/tag" style={{ backgroundColor: t.color + "cc" }}>
                      {t.name}
                      <button onClick={() => handleRemoveTag(t.id)} className="opacity-0 group-hover/tag:opacity-100 transition"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                  {activeShot.tags.length === 0 && <span className="text-gray-700 text-xs italic">No tags</span>}
                </div>
                {showTagPicker && (
                  <div className="mt-2 bg-[#1c1c26] border border-white/10 rounded-lg p-2 space-y-2">
                    <input value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddTag()}
                      placeholder="Tag name" className="w-full bg-[#25252f] border border-white/8 rounded px-2 py-1 text-white text-[10px] focus:outline-none" autoFocus />
                    <div className="flex flex-wrap gap-1">
                      {TAG_COLORS.map(c => (
                        <button key={c} onClick={() => setNewTagColor(c)} aria-label={`Color ${c}`}
                          className={`w-4 h-4 rounded-sm transition ${newTagColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#1c1c26]" : ""}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <button onClick={handleAddTag} disabled={!newTagName.trim()}
                      className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded text-[10px] font-medium transition">
                      Create
                    </button>
                  </div>
                )}
              </div>

              {/* Voice over */}
              <div className="px-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Mic className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-400 text-sm font-medium">Voice</span>
                  <button onClick={() => startEdit("voice")} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {editingField === "voice" ? (
                  <div>
                    <textarea value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                      className="w-full bg-[#1c1c26] border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-violet-500/50 h-24" autoFocus />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveField("voice")} className="text-green-400"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingField(null)} className="text-gray-500"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {activeShot.voiceOver || <span className="text-gray-700 italic">No voice over</span>}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="px-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <List className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-400 text-sm font-medium">Notes</span>
                  <button onClick={() => startEdit("notes")} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {editingField === "notes" ? (
                  <div>
                    <textarea value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                      className="w-full bg-[#1c1c26] border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-violet-500/50 h-24" autoFocus />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveField("notes")} className="text-green-400"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingField(null)} className="text-gray-500"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {activeShot.notes || <span className="text-gray-700 italic">No notes</span>}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="px-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Play className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-400 text-sm font-medium">Action</span>
                  <button onClick={() => startEdit("action")} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {editingField === "action" ? (
                  <div>
                    <textarea value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                      className="w-full bg-[#1c1c26] border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-violet-500/50 h-24" autoFocus />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveField("action")} className="text-green-400"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingField(null)} className="text-gray-500"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {activeShot.action || <span className="text-gray-700 italic">No action</span>}
                  </p>
                )}
              </div>

              {/* Save/Cancel buttons */}
              <div className="flex gap-2 px-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm font-semibold transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Popup */}
      {showTagPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1001]" onClick={() => setShowTagPopup(false)}>
          <div 
            className="bg-gradient-to-br from-[#1e1e2a] to-[#151520] border border-white/20 rounded-2xl shadow-2xl p-0 max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">Insert Tags</h3>
                    <p className="text-gray-400 text-xs">Choose tags to add to this frame</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTagPopup(false)}
                  className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
                >
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tag Options */}
            <div className="px-6 py-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowTagPopup(false);
                  }}
                  className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition"
                >
                  Action
                </button>
                <button
                  onClick={() => {
                    setShowTagPopup(false);
                  }}
                  className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-xs font-medium hover:bg-green-500/30 transition"
                >
                  Dialogue
                </button>
                <button
                  onClick={() => {
                    setShowTagPopup(false);
                  }}
                  className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition"
                >
                  Scene
                </button>
                <button
                  onClick={() => {
                    setShowTagPopup(false);
                  }}
                  className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg text-xs font-medium hover:bg-orange-500/30 transition"
                >
                  Transition
                </button>
                <button
                  onClick={() => {
                    setShowTagPopup(false);
                  }}
                  className="px-3 py-2 bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-lg text-xs font-medium hover:bg-pink-500/30 transition"
                >
                  Emotion
                </button>
                <button
                  onClick={() => {
                    setShowTagPopup(false);
                  }}
                  className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium hover:bg-cyan-500/30 transition"
                >
                  Effect
                </button>
              </div>
              
              {/* Custom Tag Input */}
              <div className="pt-2 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Custom tag name..."
                  className="w-full bg-[#0d0d12] border border-white/10 text-gray-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.currentTarget.value = '';
                      setShowTagPopup(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
