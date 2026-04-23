"use client";

import React, { useState } from "react";
import {
  Settings, ChevronDown, Trash2, Save, FileText, Download,
  Image, Video, Palette, BookOpen,
} from "lucide-react";
import { toast } from "sonner";

interface PromptActionsDropdownProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  editorIsEmpty: boolean;
  setEditorIsEmpty: (empty: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  onUserPromptChange?: (prompt: string) => void;
  extractPlainText: () => string;
  extractTextWithBadges: () => string;
  // Save prompt
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
}: PromptActionsDropdownProps) {
  const [open, setOpen] = useState(false);

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
    }
    setOpen(false);
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
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
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

            {/* Save */}
            <button
              onClick={() => { onSavePrompt(); setOpen(false); }}
              disabled={editorIsEmpty}
              className={itemClass}
            >
              <Save className={iconClass} strokeWidth={1.75} />
              <span>Save Prompt</span>
            </button>

            {/* Test */}
            <button
              onClick={() => {
                const htmlContent = editorRef.current?.innerHTML || '';
                const plainText = extractPlainText();
                const textWithBadges = extractTextWithBadges();
                const mentions = (htmlContent.match(/@(?:Image|R2|EL)\d+/g) || []).join(' ') || 'None';
                alert(`Content:\n${textWithBadges}\n\nMentions: ${mentions}\n\nPlain text:\n${plainText}`);
                setOpen(false);
              }}
              disabled={editorIsEmpty}
              className={itemClass}
            >
              <FileText className={iconClass} strokeWidth={1.75} />
              <span>Test</span>
            </button>

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

            {/* Style — only shown when projectStylePrompt is provided */}
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

            {/* Library */}
            <button onClick={() => { onOpenLibrary(); setOpen(false); }} className={itemClass}>
              <BookOpen className={iconClass} strokeWidth={1.75} />
              <span>Library</span>
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
