"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Settings, ChevronDown, Trash2, Save, FileText, Download,
  Image, Video, Palette, BookOpen, StickyNote, X,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PromptActionsDropdownProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  editorIsEmpty: boolean;
  setEditorIsEmpty: (empty: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  onUserPromptChange?: (prompt: string) => void;
  extractPlainText: () => string;
  extractTextWithBadges: () => string;
  // Save prompt (legacy — still used for naming dialog)
  onSavePrompt: () => void;
  // Load options
  activeShotDescription?: string;
  activeShotImagePrompt?: string;
  activeShotVideoPrompt?: string;
  // Style (optional — only in VideoImageAIPanel)
  projectStylePrompt?: string;
  projectStyleName?: string;
  // Library
  onOpenLibrary: () => void;
  // Optional extra handler after editor input changes
  onEditorInput?: () => void;
  // Presets — for save/load prompt + note
  companyId?: string;
  userId?: string;
  /** Called after loading a prompt — used to inject element badges */
  onAfterLoadPrompt?: () => void;
}

export function PromptActionsDropdown({
  editorRef,
  editorIsEmpty,
  setEditorIsEmpty,
  setCurrentPrompt,
  onUserPromptChange,
  extractPlainText,
  extractTextWithBadges,
  onSavePrompt,
  activeShotDescription,
  activeShotImagePrompt,
  activeShotVideoPrompt,
  projectStylePrompt,
  projectStyleName,
  onOpenLibrary,
  onEditorInput,
  companyId,
  userId,
  onAfterLoadPrompt,
}: PromptActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState<"prompt" | "note" | null>(null);
  const [saveName, setSaveName] = useState("");
  const [presetDialog, setPresetDialog] = useState<"prompt" | "note" | null>(null);

  const createTemplate = useMutation(api.promptTemplates.create);
  const incrementUsage = useMutation(api.promptTemplates.incrementUsage);
  const removeTemplate = useMutation(api.promptTemplates.remove);

  // Load saved notes from promptTemplates (type: "notes")
  const allTemplates = useQuery(
    api.promptTemplates.getByCompany,
    companyId ? { companyId } : "skip"
  );
  const savedNotes = (allTemplates || []).filter((t: any) => t.type === "notes");

  const itemClass = "w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed";
  const iconClass = "w-4 h-4 text-(--text-secondary)";

  const loadText = (text: string) => {
    const el = editorRef.current;
    if (el) {
      el.textContent = text;
      setEditorIsEmpty(false);
      setCurrentPrompt(text);
      onUserPromptChange?.(text);
      onEditorInput?.();
      // Inject element badges after text is loaded
      setTimeout(() => onAfterLoadPrompt?.(), 50);
    }
    setOpen(false);
  };

  const handleSaveNote = async () => {
    if (!companyId || !saveName.trim()) return;
    const text = extractPlainText();
    if (!text.trim()) { toast.error("Nothing to save"); return; }

    try {
      await createTemplate({
        name: saveName.trim(),
        type: "notes" as const,
        prompt: text,
        companyId,
        isPublic: false,
        tags: [],
      });
      toast.success(`Note saved as "${saveName.trim()}"`);
      setSaveName("");
      setShowSaveDialog(null);
      setOpen(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="flex-shrink-0">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
          title="Prompt actions"
        >
          <Settings className="w-4 h-4" strokeWidth={1.75} />
          <span>Actions</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false);  setShowSaveDialog(null); }} />
          <div className="absolute bottom-full right-0 mb-2 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 w-[200px] py-1.5">
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
              Prompt Actions
            </div>

            {/* Clear */}
            <button
              onClick={() => {
                const el = editorRef.current;
                if (el) {
                  el.innerHTML = '';
                  setEditorIsEmpty(true);
                  setCurrentPrompt('');
                  setOpen(false);
                }
              }}
              disabled={editorIsEmpty}
              className={itemClass}
            >
              <Trash2 className={iconClass} strokeWidth={1.75} />
              <span>Clear Text</span>
            </button>

            {/* Save Prompt — saves to Prompt Library */}
            <button
              onClick={() => { onSavePrompt(); setOpen(false); }}
              disabled={editorIsEmpty}
              className={itemClass}
            >
              <Save className={iconClass} strokeWidth={1.75} />
              <span>Save Prompt</span>
            </button>

            {/* Save Note */}
            {companyId && userId && (
              <button
                onClick={() => { setShowSaveDialog("note"); setSaveName(""); }}
                disabled={editorIsEmpty}
                className={itemClass}
              >
                <StickyNote className={iconClass} strokeWidth={1.75} />
                <span>Save Note</span>
              </button>
            )}

            {/* Divider + Load section */}
            <div className="h-px bg-[#32363E] mx-2 my-1" />
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
              Load
            </div>

            <button onClick={() => loadText(activeShotDescription || '')} disabled={!activeShotDescription} className={itemClass}>
              <Download className={iconClass} strokeWidth={1.75} />
              <span>Description</span>
            </button>

            <button onClick={() => loadText(activeShotImagePrompt || '')} disabled={!activeShotImagePrompt} className={itemClass}>
              <Image className={iconClass} strokeWidth={1.75} />
              <span>Image Prompt</span>
            </button>

            <button onClick={() => loadText(activeShotVideoPrompt || '')} disabled={!activeShotVideoPrompt} className={itemClass}>
              <Video className={iconClass} strokeWidth={1.75} />
              <span>Video Prompt</span>
            </button>

            {/* Style */}
            {projectStylePrompt !== undefined && (
              <button
                onClick={() => {
                  if (projectStylePrompt) {
                    const el = editorRef.current;
                    if (el) {
                      const existing = el.textContent || "";
                      const combined = existing ? `${existing}\n\n${projectStylePrompt}` : projectStylePrompt;
                      el.textContent = combined;
                      setEditorIsEmpty(false);
                      setCurrentPrompt(combined);
                      onUserPromptChange?.(combined);
                      onEditorInput?.();
                      toast.success(`Style "${projectStyleName || 'project'}" loaded`);
                    }
                  } else {
                    toast.error("No style set for this project");
                  }
                  setOpen(false);
                }}
                disabled={!projectStylePrompt}
                className={itemClass}
              >
                <Palette className={iconClass} strokeWidth={1.75} />
                <span>Style</span>
              </button>
            )}

            {/* Saved Notes — opens dialog */}
            {savedNotes && savedNotes.length > 0 && (
              <button
                onClick={() => { setPresetDialog("note"); setOpen(false); }}
                className={itemClass}
              >
                <StickyNote className={iconClass} strokeWidth={1.75} />
                <span className="flex-1">Saved Notes</span>
                <span className="text-[10px] text-(--text-tertiary)">{savedNotes.length}</span>
              </button>
            )}

            {/* Library */}
            <button onClick={() => { onOpenLibrary(); setOpen(false); }} className={itemClass}>
              <BookOpen className={iconClass} strokeWidth={1.75} />
              <span>Library</span>
            </button>
          </div>
          </>
        )}

        {/* Save Note Dialog (inline) */}
        {showSaveDialog === "note" && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setShowSaveDialog(null)} />
            <div className="absolute bottom-full right-0 mb-2 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 w-[240px] p-3"
              onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] font-medium text-(--text-primary) mb-2">Save Note</p>
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveNote()}
                placeholder="Note name..."
                autoFocus
                className="w-full px-2.5 py-1.5 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-xs text-(--text-primary) placeholder:text-(--text-tertiary) outline-none focus:border-(--accent-blue)/50 mb-2"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowSaveDialog(null)} className="px-3 py-1 text-[11px] text-(--text-secondary) hover:text-(--text-primary) transition">Cancel</button>
                <button
                  onClick={() => handleSaveNote()}
                  disabled={!saveName.trim()}
                  className="px-3 py-1 text-[11px] bg-(--accent-blue) text-white rounded-lg transition hover:bg-(--accent-blue-hover) disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Saved Notes Dialog — portal to body for correct positioning */}
      {presetDialog === "note" && savedNotes && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 z-[9999]" onClick={() => setPresetDialog(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-(--bg-primary) border border-(--border-primary) rounded-xl w-[400px] max-h-[420px] flex flex-col shadow-2xl z-[10000]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary)">
              <h3 className="text-sm font-semibold text-(--text-primary)">Saved Notes</h3>
              <button onClick={() => setPresetDialog(null)} className="text-(--text-tertiary) hover:text-(--text-primary) transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {savedNotes.length === 0 ? (
                <p className="text-xs text-(--text-tertiary) text-center py-6">No saved notes</p>
              ) : (
                <div className="space-y-2">
                  {savedNotes.map((note) => (
                    <div key={note._id} className="group bg-(--bg-secondary) border border-(--border-primary) rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-(--text-primary)">{note.name}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <button
                            onClick={() => {
                              loadText(note.prompt || "");
                              incrementUsage({ id: note._id as any });
                              setPresetDialog(null);
                            }}
                            className="px-2 py-0.5 text-[10px] bg-(--accent-blue) text-white rounded transition hover:bg-(--accent-blue-hover)"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              removeTemplate({ id: note._id as any });
                              toast.success(`"${note.name}" deleted`);
                            }}
                            className="p-1 rounded hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-(--text-secondary) whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {note.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
