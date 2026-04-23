"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Play, Pause, Music, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreatePersonaDialogProps {
  audioUrl: string;
  taskId: string;
  audioId: string;
  fileId: string;
  companyId: string;
  userId: string;
  fileMetadata?: any;
  onClose: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function CreatePersonaDialog({
  audioUrl,
  taskId,
  audioId,
  fileId,
  companyId,
  userId,
  fileMetadata,
  onClose,
}: CreatePersonaDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [vocalStart, setVocalStart] = useState(0);
  const [vocalEnd, setVocalEnd] = useState(20);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragging, setDragging] = useState<"start" | "end" | "range" | null>(null);
  const dragOffsetRef = useRef(0); // offset from mouse to vocalStart when dragging range

  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const createPersona = useMutation(api.storyboard.personas.create);
  const updateFile = useMutation(api.storyboard.storyboardFiles.updateFromCallback);
  const existingPersonas = useQuery(api.storyboard.personas.list, { companyId });
  const alreadyUsed = fileMetadata?.personaCreated || existingPersonas?.some(p => p.sourceAudioId === audioId);

  // Load audio duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur)) {
        setDuration(dur);
        setVocalEnd(Math.min(20, Math.floor(dur)));
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    if (audio.duration && isFinite(audio.duration)) onLoaded();
    return () => audio.removeEventListener("loadedmetadata", onLoaded);
  }, [audioUrl]);

  // Update currentTime during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      // Stop at end marker
      if (audio.currentTime >= vocalEnd) {
        audio.pause();
        setIsPlaying(false);
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, vocalEnd]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.currentTime = vocalStart;
      audio.play();
      setIsPlaying(true);
    }
  };

  // Drag handling for start/end markers
  const getTimeFromX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || !duration) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * duration);
    },
    [duration]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const t = getTimeFromX(e.clientX);
      if (dragging === "start") {
        setVocalStart(Math.min(t, vocalEnd - 1));
      } else if (dragging === "end") {
        setVocalEnd(Math.max(t, vocalStart + 1));
      } else if (dragging === "range") {
        const rangeLen = vocalEnd - vocalStart;
        let newStart = t - dragOffsetRef.current;
        newStart = Math.max(0, Math.min(newStart, Math.floor(duration) - rangeLen));
        setVocalStart(newStart);
        setVocalEnd(newStart + rangeLen);
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, vocalStart, vocalEnd, duration, getTimeFromX]);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!description.trim()) { toast.error("Description is required"); return; }
    const rangeDuration = vocalEnd - vocalStart;
    if (rangeDuration < 10) { toast.error("Vocal range must be at least 10 seconds"); return; }
    if (rangeDuration > 30) { toast.error("Vocal range must be 30 seconds or less"); return; }
    if (alreadyUsed) { toast.error("A persona has already been created from this audio"); return; }

    setIsSubmitting(true);
    try {
      // 1. Call Kie AI to generate persona
      const res = await fetch("/api/storyboard/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          audioId,
          name: name.trim(),
          description: description.trim(),
          vocalStart,
          vocalEnd,
          style: style.trim() || undefined,
          companyId,
        }),
      });

      const result = await res.json();
      if (!res.ok || (result.responseCode && result.responseCode !== 200)) {
        toast.error(result.error || result.responseMessage || "Failed to create persona");
        return;
      }

      if (!result.personaId) {
        toast.error("No persona ID returned from API");
        return;
      }

      // 2. Save to Convex
      await createPersona({
        companyId,
        userId,
        personaId: result.personaId,
        name: name.trim(),
        description: description.trim(),
        sourceTaskId: taskId,
        sourceAudioId: audioId,
        sourceFileId: fileId as any,
        style: style.trim() || undefined,
      });

      // 3. Mark the file's audioId as used for persona
      try {
        await updateFile({
          fileId: fileId as any,
          status: "completed",
          metadata: { ...fileMetadata, personaCreated: true, personaId: result.personaId, personaName: name.trim() },
        });
      } catch {
        // Non-critical — persona was already saved
      }

      toast.success(`Persona "${name.trim()}" created!`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create persona");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPct = duration > 0 ? (vocalStart / duration) * 100 : 0;
  const endPct = duration > 0 ? (vocalEnd / duration) * 100 : 100;
  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-(--bg-secondary) rounded-xl w-full max-w-lg overflow-hidden border border-(--border-primary)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-(--border-primary)">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-medium text-sm">Create Persona</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Audio Player + Range Selector */}
          <div className="bg-[#141418] rounded-lg p-4 border border-[#2A2A32]">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Play button + time display */}
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center transition flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                )}
              </button>
              <div className="text-xs text-gray-400">
                <span className="text-purple-400 font-medium">{formatTime(vocalStart)}</span>
                <span className="mx-1">-</span>
                <span className="text-purple-400 font-medium">{formatTime(vocalEnd)}</span>
                <span className="text-gray-600 ml-2">({vocalEnd - vocalStart}s selected)</span>
              </div>
              <div className="ml-auto text-xs text-gray-600">{formatTime(duration)}</div>
            </div>

            {/* Timeline track */}
            <div
              ref={trackRef}
              className="relative h-10 bg-[#0A0A0F] rounded-lg cursor-pointer select-none"
              onClick={(e) => {
                if (dragging) return;
                const t = getTimeFromX(e.clientX);
                const audio = audioRef.current;
                if (audio) {
                  audio.currentTime = t;
                  setCurrentTime(t);
                }
              }}
            >
              {/* Selected range highlight — draggable to move both markers */}
              <div
                className="absolute top-0 bottom-0 bg-purple-500/15 border-y border-purple-500/30 cursor-grab active:cursor-grabbing z-10"
                style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const t = getTimeFromX(e.clientX);
                  dragOffsetRef.current = t - vocalStart;
                  setDragging("range");
                }}
              />

              {/* Current time playhead */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10 pointer-events-none"
                  style={{ left: `${currentPct}%` }}
                />
              )}

              {/* Start marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-green-400 cursor-ew-resize z-20 group"
                style={{ left: `${startPct}%` }}
                onMouseDown={(e) => { e.stopPropagation(); setDragging("start"); }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-green-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                  {formatTime(vocalStart)}
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-6 bg-green-400 rounded-sm" />
              </div>

              {/* End marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-red-400 cursor-ew-resize z-20 group"
                style={{ left: `${endPct}%` }}
                onMouseDown={(e) => { e.stopPropagation(); setDragging("end"); }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-red-400 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                  {formatTime(vocalEnd)}
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-6 bg-red-400 rounded-sm" />
              </div>

              {/* Time ruler marks */}
              <div className="absolute bottom-0 left-0 right-0 h-3 flex items-end">
                {duration > 0 && Array.from({ length: Math.min(Math.ceil(duration / 10) + 1, 30) }, (_, i) => i * 10).map((sec) => (
                  <div
                    key={sec}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: `${(sec / duration) * 100}%` }}
                  >
                    <div className="w-px h-2 bg-white/10" />
                    <span className="text-[7px] text-gray-600 mt-0.5">{formatTime(sec)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-gray-600 mt-2">
              Drag the <span className="text-green-400">green</span> and <span className="text-red-400">red</span> markers to select the vocal range (<span className="text-white">required: 10-30 seconds</span>)
            </p>
            {alreadyUsed && (
              <p className="text-[10px] text-amber-400 mt-1">
                A persona has already been created from this audio. Each audio can only generate one persona.
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Pop Singer"
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Female pop voice, breathy and soft, good for ballads"
              rows={4}
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition resize-none"
            />
          </div>

          {/* Style (optional) */}
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
        <div className="px-5 py-3 border-t border-(--border-primary) flex items-center justify-between">
          <div className="text-[10px] text-gray-600">
            Vocal: {formatTime(vocalStart)} - {formatTime(vocalEnd)} ({vocalEnd - vocalStart}s)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim() || !description.trim() || !!alreadyUsed}
              className="px-5 py-1.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Persona"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
