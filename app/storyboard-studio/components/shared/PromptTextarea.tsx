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
    </div>
  );
}
