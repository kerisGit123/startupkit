"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ClipboardCopy, ClipboardPaste, Film, ChevronRight } from "lucide-react";
import { TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT } from "./usePromptEditor";

export interface CameraMotionOption {
  value: string;
  label: string;
  description: string;
}

export interface PromptTextareaProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  editorIsEmpty: boolean;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onInput: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onBlur: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
  children?: React.ReactNode;
  /** Camera motion options — only passed for video mode */
  cameraMotionOptions?: CameraMotionOption[];
  /** Called when a camera motion is selected from context menu */
  onCameraMotionSelect?: (value: string) => void;
  /** Called when prompt text changes via context menu actions (paste, camera motion insert) */
  onPromptChange?: (text: string) => void;
}

/**
 * Shared ContentEditable prompt textarea with drag-and-drop badge support
 * and right-click context menu (Copy, Paste, Camera Motion).
 * Used by EditImageAIPanel and VideoImageAIPanel.
 */
export function PromptTextarea({
  editorRef,
  editorIsEmpty,
  placeholder = "Describe your scene... drag & drop reference images here",
  minHeight,
  maxHeight,
  onInput,
  onDrop,
  onDragOver,
  onBlur,
  onCompositionStart,
  onCompositionEnd,
  onKeyDown,
  className,
  children,
  cameraMotionOptions,
  onCameraMotionSelect,
  onPromptChange,
}: PromptTextareaProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showCameraSubmenu, setShowCameraSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Save cursor position so we can insert at it later
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
    setShowCameraSubmenu(false);
  }, []);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
    setShowCameraSubmenu(false);
  }, []);

  const handleCopy = useCallback(async () => {
    const sel = window.getSelection();
    const text = sel?.toString() || editorRef.current?.innerText || '';
    if (text) {
      try { await navigator.clipboard.writeText(text); } catch { /* denied */ }
    }
    closeMenu();
  }, [editorRef, closeMenu]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { closeMenu(); return; }
      const el = editorRef.current;
      if (!el) { closeMenu(); return; }

      const sel = window.getSelection();
      const saved = savedRangeRef.current;
      // Restore saved cursor and insert there
      if (saved && el.contains(saved.startContainer)) {
        sel?.removeAllRanges();
        sel?.addRange(saved);
        const range = sel?.getRangeAt(0);
        if (range) {
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } else {
        const hasContent = el.innerText && el.innerText.trim();
        if (hasContent) {
          el.appendChild(document.createTextNode(text));
        } else {
          el.textContent = text;
        }
      }
      onPromptChange?.(el.innerText || '');
      el.dispatchEvent(new Event("input", { bubbles: true }));
      savedRangeRef.current = null;
    } catch { /* clipboard permission denied */ }
    closeMenu();
  }, [editorRef, onPromptChange, closeMenu]);

  const handleCameraMotion = useCallback((option: CameraMotionOption) => {
    const el = editorRef.current;
    if (el && option.description) {
      const sel = window.getSelection();
      const saved = savedRangeRef.current;
      // Restore saved cursor position and insert at that point
      if (saved && el.contains(saved.startContainer)) {
        sel?.removeAllRanges();
        sel?.addRange(saved);
        const range = sel?.getRangeAt(0);
        if (range) {
          // Insert newline + text at cursor
          const br = document.createElement('br');
          const textNode = document.createTextNode(option.description);
          range.collapse(false);
          range.insertNode(textNode);
          range.insertNode(br);
          // Move cursor after inserted text
          range.setStartAfter(textNode);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } else {
        // No saved cursor — append at end
        const hasContent = el.innerText?.trim();
        if (hasContent) {
          el.innerHTML = el.innerHTML + '<br>' + option.description;
        } else {
          el.textContent = option.description;
        }
      }
      onPromptChange?.(el.innerText || '');
      onCameraMotionSelect?.(option.value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      savedRangeRef.current = null;
    }
    closeMenu();
  }, [editorRef, onPromptChange, onCameraMotionSelect, closeMenu]);

  // Calculate menu position — open upward from click point
  const getMenuStyle = (): React.CSSProperties => {
    if (!contextMenu) return {};
    const menuH = cameraMotionOptions ? 140 : 88; // approximate height
    const y = contextMenu.y - menuH; // open upward
    return {
      left: Math.max(4, contextMenu.x),
      top: Math.max(4, y),
    };
  };

  // Calculate submenu position — open upward and to the right of menu
  const getSubmenuStyle = (): React.CSSProperties => {
    if (!menuRef.current) return {};
    const menuRect = menuRef.current.getBoundingClientRect();
    const submenuH = 340; // approximate max height
    return {
      left: menuRect.right + 4,
      top: Math.max(4, menuRect.bottom - submenuH),
    };
  };

  return (
    <div className={`relative flex-1 ${className || ""}`}>
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={onInput}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onBlur={onBlur}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        onContextMenu={handleContextMenu}
        className="w-full bg-transparent px-3 py-2.5 text-(--text-primary) focus:outline-none leading-5 text-[14px] selection:bg-blue-500/20"
        style={{
          minHeight: `${minHeight ?? TEXTAREA_MIN_HEIGHT}px`,
          maxHeight: `${maxHeight ?? TEXTAREA_MAX_HEIGHT}px`,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
      {editorIsEmpty && (
        <div className="absolute top-2.5 left-3 right-3 text-(--text-secondary) text-[14px] pointer-events-none select-none leading-5">
          {placeholder}
        </div>
      )}
      {children}

      {/* Context Menu (portal to body) — uses design system CSS variables */}
      {contextMenu && createPortal(
        <>
          {/* Backdrop — closes menu on click outside */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={closeMenu}
            onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}
          />

          {/* Menu container — keeps main menu + submenu together above the backdrop */}
          <div className="fixed z-[9999]" style={{ left: 0, top: 0, pointerEvents: 'none' }}>
            {/* Main menu — opens upward */}
            <div
              ref={menuRef}
              className="absolute w-[200px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl py-1.5"
              style={{ ...getMenuStyle(), pointerEvents: 'auto' }}
            >
              {/* Section header */}
              <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
                Edit
              </div>
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <ClipboardCopy className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                Copy
                <span className="ml-auto text-[11px] text-(--text-tertiary)">Ctrl+C</span>
              </button>
              <button
                onClick={handlePaste}
                className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors flex items-center gap-2.5"
              >
                <ClipboardPaste className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                Paste
                <span className="ml-auto text-[11px] text-(--text-tertiary)">Ctrl+V</span>
              </button>

              {/* Camera Motion — video mode only */}
              {cameraMotionOptions && cameraMotionOptions.length > 0 && (
                <>
                  <div className="h-px bg-[#32363E] mx-2 my-1" />
                  <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
                    Camera
                  </div>
                  <button
                    onClick={() => setShowCameraSubmenu(!showCameraSubmenu)}
                    onMouseEnter={() => setShowCameraSubmenu(true)}
                    className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors flex items-center gap-2.5"
                  >
                    <Film className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                    Camera Motion
                    <ChevronRight className="w-4 h-4 text-(--text-tertiary) ml-auto" strokeWidth={1.75} />
                  </button>
                </>
              )}
            </div>

            {/* Camera Motion submenu — opens upward + to the right */}
            {showCameraSubmenu && cameraMotionOptions && (
              <div
                ref={submenuRef}
                className="absolute w-[180px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl py-1.5 max-h-[320px] overflow-y-auto"
                style={{ ...getSubmenuStyle(), pointerEvents: 'auto' }}
              >
                <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
                  Motion Preset
                </div>
                {cameraMotionOptions.filter(o => o.value !== "none").map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleCameraMotion(option)}
                    className="w-full px-3 py-2 text-left text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
