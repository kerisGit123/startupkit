"use client";

import { useRef, useState, useCallback } from "react";

/**
 * Shared hook for the ContentEditable prompt editor with drag-and-drop badge system.
 * Used by both EditImageAIPanel and VideoImageAIPanel.
 */

export interface BadgeEntry {
  id: string;
  imageUrl: string;
  imageNumber: number;
  source?: string;
}

export function usePromptEditor(opts?: {
  onPromptChange?: (text: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<{ container: Node; offset: number } | null>(null);
  const [editorIsEmpty, setEditorIsEmpty] = useState(true);
  const isComposingRef = useRef(false);

  // ── Extract plain text (excluding badges) ──────────────────────────
  const extractPlainText = useCallback((): string => {
    const el = editorRef.current;
    if (!el) return "";
    const collect = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      const htmlEl = node as HTMLElement;
      if (htmlEl.nodeName === "BR") return "\n";
      if (htmlEl.dataset?.type === "mention") return "";
      let result = "";
      node.childNodes.forEach((child) => { result += collect(child); });
      if (htmlEl.tagName === "DIV" && node !== el) result += "\n";
      return result;
    };
    return collect(el).replace(/\n$/, "");
  }, []);

  // ── Extract text WITH badge labels ─────────────────────────────────
  const extractTextWithBadges = useCallback((): string => {
    const el = editorRef.current;
    if (!el) return "";
    const collect = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      const htmlEl = node as HTMLElement;
      if (htmlEl.nodeName === "BR") return "\n";
      if (htmlEl.dataset?.type === "mention") {
        const label = htmlEl.querySelector('span[class*="text-cyan-300"]');
        return label?.textContent || "";
      }
      let result = "";
      node.childNodes.forEach((child) => { result += collect(child); });
      if (htmlEl.tagName === "DIV" && node !== el) result += "\n";
      return result;
    };
    return collect(el).replace(/\n$/, "");
  }, []);

  // ── Create badge DOM element ───────────────────────────────────────
  const createBadgeElement = useCallback((entry: BadgeEntry): HTMLSpanElement => {
    const span = document.createElement("span");
    span.contentEditable = "false";
    span.dataset.type = "mention";
    span.dataset.mentionId = entry.id;
    span.setAttribute(
      "class",
      "inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/40 rounded px-1.5 py-0.5 align-middle mx-0.5 select-none"
    );
    span.style.cursor = "default";
    span.style.fontSize = "inherit";

    const img = document.createElement("img");
    img.src = entry.imageUrl;
    img.alt = `Image ${entry.imageNumber}`;
    img.setAttribute("class", "w-4 h-4 object-cover rounded");

    const label = document.createElement("span");
    label.setAttribute("class", "text-cyan-300 text-sm font-medium whitespace-nowrap");
    label.textContent = entry.source === 'r2' ? `@R2${entry.imageNumber}` :
                        entry.source === 'element' ? `@EL${entry.imageNumber}` :
                        `@Image${entry.imageNumber}`;

    const closeBtn = document.createElement("button");
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("title", "Remove");
    closeBtn.setAttribute(
      "class",
      "ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-cyan-400/70 hover:text-white hover:bg-cyan-400/30 transition-colors"
    );
    closeBtn.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = editorRef.current;
      span.remove();
      if (editor) {
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    span.appendChild(img);
    span.appendChild(label);
    span.appendChild(closeBtn);
    return span;
  }, []);

  // ── Insert badge at caret ──────────────────────────────────────────
  const insertBadgeAtCaret = useCallback((entry: BadgeEntry) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection) return;

    let range: Range;
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      range.deleteContents();
    } else if (savedSelectionRef.current) {
      try {
        range = document.createRange();
        range.setStart(savedSelectionRef.current.container, savedSelectionRef.current.offset);
        range.collapse(true);
        selection.addRange(range);
      } catch {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        selection.addRange(range);
      }
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.addRange(range);
      range = selection.getRangeAt(0);
    }

    const spaceBefore = document.createTextNode('\u00A0');
    range.insertNode(spaceBefore);

    const badge = createBadgeElement(entry);
    range.insertNode(badge);

    const spaceAfter = document.createTextNode('\u00A0');
    range.insertNode(spaceAfter);

    const regularSpace = document.createTextNode(' ');
    range.insertNode(regularSpace);

    const newRange = document.createRange();
    newRange.setStartAfter(regularSpace);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    setEditorIsEmpty(false);
    setTimeout(() => {
      const plainText = extractPlainText();
      opts?.onPromptChange?.(plainText);
    }, 0);
  }, [createBadgeElement, extractPlainText, opts]);

  // ── Editor event handlers ──────────────────────────────────────────
  const handleEditorInput = useCallback(() => {
    if (isComposingRef.current) return;
    const el = editorRef.current;
    if (!el) return;
    const text = el.textContent?.trim() ?? "";
    setEditorIsEmpty(text.length === 0 && el.querySelectorAll('[data-type="mention"]').length === 0);
    const plainText = extractPlainText();
    opts?.onPromptChange?.(plainText);
  }, [extractPlainText, opts]);

  const handleEditorBlur = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = {
        container: range.startContainer,
        offset: range.startOffset,
      };
    }
  }, []);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleEditorInput();
  }, [handleEditorInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Allow all Ctrl/Cmd shortcuts (copy, paste, cut, select all, undo, redo)
    if (e.ctrlKey || e.metaKey) {
      // Handle Ctrl+V paste — insert plain text only
      if (e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          if (!text) return;
          const el = editorRef.current;
          if (!el) return;
          const selection = window.getSelection();
          if (!selection) return;
          let range: Range;
          if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
          } else {
            range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
          }
          if (!range.collapsed) range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }).catch(() => {
          // Fallback: let browser handle it
        });
        return;
      }
      // Let Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+Z etc. pass through natively
      return;
    }

    // Allow Enter for new lines (submission is via Generate button, not Enter key)

    // Handle Backspace on badge elements
    if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed && range.startContainer.nodeType === Node.ELEMENT_NODE) {
        const offset = range.startOffset;
        if (offset > 0) {
          const prevNode = (range.startContainer as Element).childNodes[offset - 1];
          if (prevNode && (prevNode as HTMLElement).dataset?.type === "mention") {
            e.preventDefault();
            (prevNode as HTMLElement).remove();
            editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
            return;
          }
        }
      }
      return; // Let native handle normal backspace
    }

    // Handle Delete key — manually delete forward since some browsers
    // don't natively support Delete in contentEditable
    if (e.key === "Delete") {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);

      // If there's a selection, delete the selected content
      if (!range.collapsed) {
        range.deleteContents();
        editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      const container = range.startContainer;
      const offset = range.startOffset;

      // Cursor is in a text node — delete the next character
      if (container.nodeType === Node.TEXT_NODE) {
        const text = container.textContent || "";
        if (offset < text.length) {
          container.textContent = text.slice(0, offset) + text.slice(offset + 1);
          // Restore cursor position
          const newRange = document.createRange();
          newRange.setStart(container, Math.min(offset, (container.textContent || "").length));
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // At end of text node — delete next sibling node
          const nextSibling = container.nextSibling;
          if (nextSibling) {
            if ((nextSibling as HTMLElement).dataset?.type === "mention") {
              nextSibling.remove();
            } else if (nextSibling.nodeType === Node.TEXT_NODE) {
              const nextText = nextSibling.textContent || "";
              if (nextText.length <= 1) {
                nextSibling.remove();
              } else {
                nextSibling.textContent = nextText.slice(1);
              }
            } else {
              nextSibling.remove();
            }
          }
        }
        editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      // Cursor is in an element node — delete the child at offset
      if (container.nodeType === Node.ELEMENT_NODE) {
        const childNodes = (container as Element).childNodes;
        if (offset < childNodes.length) {
          const targetNode = childNodes[offset];
          if ((targetNode as HTMLElement).dataset?.type === "mention") {
            targetNode.remove();
          } else if (targetNode.nodeType === Node.TEXT_NODE) {
            const text = targetNode.textContent || "";
            if (text.length <= 1) {
              targetNode.remove();
            } else {
              targetNode.textContent = text.slice(1);
            }
          } else if (targetNode.nodeName === "BR") {
            targetNode.remove();
          } else {
            targetNode.remove();
          }
          editorRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      return;
    }
  }, []);

  // ── Drag & Drop ────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const imageUrl = e.dataTransfer.getData("imageUrl");
    const imageIndex = e.dataTransfer.getData("imageIndex");
    if (!imageUrl || imageIndex === "") return;
    const imageNumber = parseInt(imageIndex) + 1;

    let range: Range | null = null;
    const doc = document as any;
    if (typeof doc.caretRangeFromPoint === "function") {
      range = doc.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (typeof doc.caretPositionFromPoint === "function") {
      const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    if (range) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl, imageNumber });
  }, [insertBadgeAtCaret]);

  // ── Set text programmatically ──────────────────────────────────────
  const setText = useCallback((text: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.textContent = text;
    setEditorIsEmpty(!text.trim());
    opts?.onPromptChange?.(text);
  }, [opts]);

  // ── Clear editor ───────────────────────────────────────────────────
  const clear = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = "";
    setEditorIsEmpty(true);
    opts?.onPromptChange?.("");
  }, [opts]);

  return {
    editorRef,
    editorIsEmpty,
    setEditorIsEmpty,
    extractPlainText,
    extractTextWithBadges,
    createBadgeElement,
    insertBadgeAtCaret,
    handleEditorInput,
    handleEditorBlur,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    handleDragOver,
    handleDrop,
    setText,
    clear,
    savedSelectionRef,
  };
}

// ── Shared constants ─────────────────────────────────────────────────
export const TEXTAREA_MIN_HEIGHT = 36;
export const TEXTAREA_MAX_HEIGHT = 120;
