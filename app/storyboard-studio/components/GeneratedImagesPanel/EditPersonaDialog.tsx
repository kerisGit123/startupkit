"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mic, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface EditPersonaDialogProps {
  personaId: string; // Kie AI persona ID
  fileId: string;
  fileMetadata?: any;
  companyId: string;
  audioUrl?: string;
  onClose: () => void;
}

export function EditPersonaDialog({
  personaId,
  fileId,
  fileMetadata,
  companyId,
  audioUrl,
  onClose,
}: EditPersonaDialogProps) {
  const personas = useQuery(api.storyboard.personas.list, { companyId });
  const persona = personas?.find(p => p.personaId === personaId);

  const [name, setName] = useState(persona?.name || fileMetadata?.personaName || "");
  const [description, setDescription] = useState(persona?.description || "");
  const [style, setStyle] = useState(persona?.style || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const updatePersona = useMutation(api.storyboard.personas.update);
  const updateFile = useMutation(api.storyboard.storyboardFiles.updateFromCallback);

  // Update local state when persona loads
  React.useEffect(() => {
    if (persona) {
      setName(persona.name);
      setDescription(persona.description);
      setStyle(persona.style || "");
    }
  }, [persona]);

  // Audio duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => { if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration); };
    audio.addEventListener("loadedmetadata", onLoaded);
    if (audio.duration && isFinite(audio.duration)) onLoaded();
    return () => audio.removeEventListener("loadedmetadata", onLoaded);
  }, [audioUrl]);

  // Playback tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      if (audio.ended) { setIsPlaying(false); return; }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!persona) { toast.error("Persona not found"); return; }

    setIsSaving(true);
    try {
      // 1. Update persona record
      await updatePersona({
        id: persona._id,
        name: name.trim(),
        description: description.trim(),
        style: style.trim() || undefined,
      });

      // 2. Update file metadata with new persona name
      if (fileMetadata?.personaName !== name.trim()) {
        try {
          await updateFile({
            fileId: fileId as any,
            status: "completed",
            metadata: { ...fileMetadata, personaName: name.trim() },
          });
        } catch {
          // Non-critical
        }
      }

      toast.success("Persona updated!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update persona");
    } finally {
      setIsSaving(false);
    }
  };

  if (!persona && personas !== undefined) {
    return createPortal(
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }} onClick={onClose}>
        <div className="bg-(--bg-secondary) rounded-xl p-6 max-w-sm text-center" onClick={e => e.stopPropagation()}>
          <p className="text-gray-400 text-sm">Persona not found in database.</p>
          <button onClick={onClose} className="mt-4 px-4 py-1.5 text-sm text-gray-400 hover:text-white transition">Close</button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-(--bg-secondary) rounded-xl w-full max-w-md overflow-hidden border border-(--border-primary)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-(--border-primary)">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-medium text-sm">Edit Persona</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-[#141418] rounded-lg p-4 border border-[#2A2A32]">
              <audio ref={audioRef} src={audioUrl} preload="metadata" />
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handlePlayPause}
                  className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center transition flex-shrink-0"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                </button>
                <div className="text-xs text-gray-400">
                  <span className="text-purple-400 font-medium">{formatTime(currentTime)}</span>
                </div>
                <div className="ml-auto text-xs text-gray-600">{formatTime(duration)}</div>
              </div>
              {/* Timeline track */}
              <div
                ref={trackRef}
                className="relative h-6 bg-[#0A0A0F] rounded-lg cursor-pointer select-none"
                onClick={handleTrackClick}
              >
                {/* Progress fill */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-purple-500/20 rounded-lg"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-purple-400 z-10"
                  style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
                {/* Time ruler marks */}
                <div className="absolute bottom-0 left-0 right-0 h-3 flex items-end">
                  {duration > 0 && Array.from({ length: Math.min(Math.ceil(duration / 10) + 1, 30) }, (_, i) => i * 10).map((sec) => (
                    <div key={sec} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${(sec / duration) * 100}%` }}>
                      <div className="w-px h-2 bg-white/10" />
                      <span className="text-[7px] text-gray-600 mt-0.5">{formatTime(sec)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Persona ID display */}
          <div className="text-[10px] text-gray-600 font-mono bg-[#0A0A0F] px-3 py-1.5 rounded">
            ID: {personaId}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition resize-none"
            />
          </div>

          {/* Style */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Style <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. Pop, R&B, Electronic"
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-(--border-primary) flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-5 py-1.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
          >
            {isSaving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
