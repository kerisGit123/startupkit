"use client";

import React from "react";
import { TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT } from "./usePromptEditor";

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
}

/**
 * Shared ContentEditable prompt textarea with drag-and-drop badge support.
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
}: PromptTextareaProps) {
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
        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500/30 leading-6 text-sm selection:bg-white/20"
        style={{
          minHeight: `${minHeight ?? TEXTAREA_MIN_HEIGHT}px`,
          maxHeight: `${maxHeight ?? TEXTAREA_MAX_HEIGHT}px`,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
      {editorIsEmpty && (
        <div className="absolute top-2 left-3 right-3 text-gray-500 text-sm pointer-events-none select-none leading-6">
          {placeholder}
        </div>
      )}
      {children}
    </div>
  );
}
