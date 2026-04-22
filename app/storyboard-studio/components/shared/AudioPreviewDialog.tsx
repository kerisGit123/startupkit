"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Pencil, Check, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AudioPreviewDialogProps {
  url: string;
  name: string;
  prompt?: string;
  model?: string;
  fileId?: string;
  onClose: () => void;
  onNameChange?: (newName: string) => void;
}

export function AudioPreviewDialog({
  url,
  name,
  prompt,
  model,
  fileId,
  onClose,
  onNameChange,
}: AudioPreviewDialogProps) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const renameFile = useMutation(api.storyboard.storyboardFiles.renameFile);

  const handleSave = async () => {
    if (!nameValue.trim() || !fileId) return;
    try {
      await renameFile({ fileId: fileId as any, filename: nameValue.trim() });
      toast.success("Renamed!");
      setEditing(false);
      onNameChange?.(nameValue.trim());
    } catch {
      toast.error("Failed to rename");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] rounded-xl max-w-lg w-full overflow-hidden border border-[#3D3D3D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — editable name */}
        <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
          {editing && fileId ? (
            <div className="flex items-center gap-2 flex-1 mr-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  else if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="flex-1 px-2 py-1 bg-[#2C2C2C] border border-[#4A90E2] rounded text-sm text-white outline-none"
              />
              <button onClick={handleSave} className="p-1 text-green-400 hover:text-green-300">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3
              className={`text-white font-medium flex items-center gap-2 ${fileId ? "cursor-pointer group/name" : ""}`}
              onClick={() => {
                if (fileId) {
                  setNameValue(name);
                  setEditing(true);
                }
              }}
            >
              <span className="truncate max-w-[300px]">{name || "Audio"}</span>
              {fileId && (
                <Pencil className="w-3 h-3 text-gray-600 opacity-0 group-hover/name:opacity-100 transition" />
              )}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <audio src={url} controls autoPlay className="w-full" />
        </div>

        {/* Footer — model + prompt */}
        <div className="p-4 border-t border-[#3D3D3D]">
          {model && <div className="text-sm text-gray-400">Model: {model}</div>}
          {prompt && (
            <div className="mt-2 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">Prompt / Lyrics</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(prompt);
                    toast.success("Prompt copied!");
                  }}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#4A90E2] transition"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <div className="bg-[#0A0A0F] border border-[#2A2A32] rounded-lg p-3 max-h-[150px] overflow-y-auto">
                <p className="text-[12px] text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {prompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
