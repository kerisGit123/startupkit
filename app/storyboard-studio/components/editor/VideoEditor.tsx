"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Film, Music, Plus, Loader2, Camera, X, Save, FolderOpen, Download, Trash2, Volume2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { FileBrowser } from "../ai/FileBrowser";

import {
  TimelineClip, SubtitleClip, OverlayLayer,
  R2_PUBLIC_URL, formatTime, getVisDur, getClipAtTime,
  ASPECT_RATIOS, getCanvasSize,
} from "./video-editor/types";
import { useExport } from "./video-editor/useExport";
import { PreviewCanvas } from "./video-editor/PreviewCanvas";
import { ControlBar } from "./video-editor/ControlBar";
import { TimelineTracks } from "./video-editor/TimelineTracks";
import { LayerPanel } from "./video-editor/LayerPanel";

// ─── Component ──────────────────────────────────────────────────────────

interface VideoEditorProps {
  projectId: Id<"storyboard_projects">;
  onClose?: () => void;
  projectName?: string;
}

export function VideoEditor({ projectId, onClose, projectName }: VideoEditorProps) {
  const { user } = useUser();
  const companyId = useCurrentCompanyId();
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const updateProject = useMutation(api.storyboard.projects.update);

  // ── State ──────────────────────────────────────────────────────────────

  const [videoClips, setVideoClips] = useState<TimelineClip[]>([]);
  const [audioClips, setAudioClips] = useState<TimelineClip[]>([]);
  const [subtitleClips, setSubtitleClips] = useState<SubtitleClip[]>([]);
  const [overlayLayers, setOverlayLayers] = useState<OverlayLayer[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<"video" | "audio" | "overlay">("video");
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#000000");
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  const clips = selectedTrack === "video" ? videoClips : audioClips;
  const setClips = selectedTrack === "video" ? setVideoClips : setAudioClips;

  const [playing, _setPlaying] = useState(false);
  const setPlaying = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    _setPlaying(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      playingRef.current = next;
      return next;
    });
  }, []);
  const [currentTime, setCurrentTime] = useState(0);
  const [pxPerSec, setPxPerSec] = useState(100);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"video" | "image" | "audio" | "all">("video");
  const [showRangeCut, setShowRangeCut] = useState(false);
  const [rangeCutStart, setRangeCutStart] = useState(0);
  const [rangeCutEnd, setRangeCutEnd] = useState(30);
  const [clipboard, setClipboard] = useState<TimelineClip | null>(null);
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoing = useRef(false);
  const [, forceRender] = useState(0);
  const [trimming, setTrimming] = useState<{
    clipId: string; side: "left" | "right"; startX: number;
    origTS: number; origTE: number; origDur: number;
  } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [clipContextMenu, setClipContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showLayerFileBrowser, setShowLayerFileBrowser] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────

  const previewRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<number>(0);
  const playingRef = useRef(false);
  const playStart = useRef({ realTime: 0, offset: 0 });

  // ── Queries ─────────────────────────────────────────────────────────────

  const project = useQuery(api.storyboard.projects.get, { id: projectId });
  const projectFiles = useQuery(api.storyboard.storyboardFiles.listByProject, { projectId });
  const canvasSize = useMemo(() => getCanvasSize(project?.aspectRatio), [project?.aspectRatio]);

  const mediaFiles = useMemo(() => {
    if (!projectFiles) return [];
    return projectFiles
      .filter(f => {
        if (f.status === "deleted" || f.deletedAt) return false;
        if (!f.r2Key && !f.sourceUrl) return false;
        if ((f.size ?? 0) <= 0) return false;
        return f.fileType === "video" || f.fileType === "image" || f.fileType === "audio" || f.fileType === "music";
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [projectFiles]);

  const videoDur = videoClips.reduce((s, c) => s + getVisDur(c), 0);
  const audioDur = audioClips.reduce((s, c) => s + getVisDur(c), 0);
  const overlayMaxEnd = overlayLayers.length > 0 ? Math.max(...overlayLayers.map(l => l.endTime || 0)) : 0;
  const totalDur = Math.max(videoDur, audioDur, overlayMaxEnd) || 0;

  // ── Undo / Redo ─────────────────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    if (isUndoRedoing.current) return;
    const snap = [videoClips, audioClips, overlayLayers];
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    const limited = trimmed.length >= 50 ? trimmed.slice(1) : trimmed;
    historyRef.current = [...limited, snap];
    historyIndexRef.current = historyRef.current.length - 1;
  }, [videoClips, audioClips, overlayLayers]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    if (idx < 0 || h.length === 0) return;
    const entry = h[idx];
    if (!entry || !Array.isArray(entry)) return;
    if (idx >= h.length - 1) {
      historyRef.current = [...h, [videoClips, audioClips, overlayLayers]];
    }
    const [v, a, o] = entry;
    isUndoRedoing.current = true;
    setVideoClips(v);
    setAudioClips(a);
    if (o) setOverlayLayers(o);
    historyIndexRef.current = idx - 1;
    forceRender(n => n + 1);
    setTimeout(() => { isUndoRedoing.current = false; }, 0);
  }, [videoClips, audioClips, overlayLayers]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const nextIdx = historyIndexRef.current + 2;
    if (nextIdx >= h.length) return;
    const entry = h[nextIdx];
    if (!entry || !Array.isArray(entry)) return;
    const [v, a, o] = entry;
    isUndoRedoing.current = true;
    setVideoClips(v);
    setAudioClips(a);
    if (o) setOverlayLayers(o);
    historyIndexRef.current = nextIdx - 1;
    forceRender(n => n + 1);
    setTimeout(() => { isUndoRedoing.current = false; }, 0);
  }, []);

  // ── Export ──────────────────────────────────────────────────────────────

  const { handleExport, exporting, exportProgress } = useExport({
    videoClips, audioClips, subtitleClips, overlayLayers,
    totalDur, selectedTrack, bgColor, canvasSize, companyId, userId: user?.id, projectId, logUpload,
  });

  // ── Playback ────────────────────────────────────────────────────────────

  const lastSyncVideoId = useRef<string>("");
  const lastSyncAudioId = useRef<string>("");

  const syncPreview = useCallback((t: number) => {
    const isPlaying = playingRef.current;
    const vr = getClipAtTime(videoClips, t);
    if (vr && (vr.clip.type === "video" || vr.clip.type === "image") && previewRef.current) {
      const vid = previewRef.current;
      const videoChanged = lastSyncVideoId.current !== vr.clip.id;
      lastSyncVideoId.current = vr.clip.id;
      if (vr.clip.type === "video") {
        if (videoChanged) {
          vid.muted = false;
          vid.volume = Math.max(0, Math.min(1, (vr.clip.volume ?? 100) / 100));
          vid.src = vr.clip.src; vid.load(); vid.currentTime = vr.offset;
          if (isPlaying) {
            vid.play().catch(() => {
              vid.oncanplay = () => { vid.oncanplay = null; vid.play().catch(() => {}); };
            });
          } else {
            vid.pause();
          }
        } else if (!isPlaying) {
          vid.currentTime = vr.offset;
        }
      }
    }
    if (!vr && previewRef.current && !previewRef.current.paused) {
      previewRef.current.pause();
      lastSyncVideoId.current = "";
    }

    const ar = getClipAtTime(audioClips, t);
    if (ar && audioRef.current) {
      const aud = audioRef.current;
      const audioChanged = lastSyncAudioId.current !== ar.clip.id;
      lastSyncAudioId.current = ar.clip.id;
      if (audioChanged) {
        aud.src = ar.clip.src; aud.load(); aud.currentTime = ar.offset;
        if (isPlaying) {
          aud.play().catch(() => {
            aud.oncanplay = () => { aud.oncanplay = null; aud.play().catch(() => {}); };
          });
        } else {
          aud.pause();
        }
      } else if (!isPlaying) {
        aud.currentTime = ar.offset;
      }
    }
    if (!ar && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      lastSyncAudioId.current = "";
    }
  }, [videoClips, audioClips]);

  const startPlay = useCallback(() => {
    if (totalDur <= 0) return;
    playingRef.current = true;
    setPlaying(true);
    playStart.current = { realTime: performance.now(), offset: currentTime };

    const vr = getClipAtTime(videoClips, currentTime);
    if (vr && vr.clip.type === "video" && previewRef.current) {
      const vid = previewRef.current;
      vid.muted = false;
      vid.volume = Math.max(0, Math.min(1, (vr.clip.volume ?? 100) / 100));
      const srcChanged = !vid.src || !vid.src.includes(vr.clip.src.split("/").pop()!.split("?")[0]);
      if (srcChanged || vid.readyState === 0) { vid.src = vr.clip.src; vid.load(); }
      const doPlay = () => {
        vid.currentTime = vr.offset;
        vid.play().catch(() => {});
      };
      if (vid.readyState >= 2) {
        doPlay();
      } else {
        vid.oncanplay = () => { vid.oncanplay = null; doPlay(); };
        if (srcChanged || vid.readyState === 0) vid.load();
      }
      lastSyncVideoId.current = vr.clip.id;
    }
    const ar = getClipAtTime(audioClips, currentTime);
    if (ar && audioRef.current) {
      const aud = audioRef.current;
      const srcChanged = !aud.src || !aud.src.includes(ar.clip.src.split("/").pop()!.split("?")[0]);
      if (srcChanged) { aud.src = ar.clip.src; aud.load(); }
      aud.currentTime = ar.offset;
      aud.play().catch(() => {
        aud.oncanplay = () => { aud.oncanplay = null; aud.play().catch(() => {}); };
      });
      lastSyncAudioId.current = ar.clip.id;
    }

    const tick = () => {
      const t = playStart.current.offset + (performance.now() - playStart.current.realTime) / 1000;
      if (t >= totalDur) {
        setPlaying(false); setCurrentTime(0);
        if (previewRef.current) previewRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
        return;
      }
      if (playheadRef.current) playheadRef.current.style.left = `${t * pxPerSec + 48}px`;
      if (progressBarRef.current) progressBarRef.current.style.width = `${t * pxPerSec}px`;
      if (timeDisplayRef.current) timeDisplayRef.current.textContent = `${formatTime(t)} / ${formatTime(totalDur)}`;
      if (Math.floor(t * 4) !== Math.floor((t - 1 / 60) * 4)) setCurrentTime(t);

      const vrr = getClipAtTime(videoClips, t);
      const arr = getClipAtTime(audioClips, t);
      if ((vrr && lastSyncVideoId.current !== vrr.clip.id) || (arr && lastSyncAudioId.current !== arr.clip.id) ||
          (!vrr && lastSyncVideoId.current) || (!arr && lastSyncAudioId.current)) {
        syncPreview(t);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [totalDur, currentTime, syncPreview, videoClips, audioClips, pxPerSec]);

  const stopPlay = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    if (previewRef.current) previewRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const toggle = useCallback(() => { playing ? stopPlay() : startPlay(); }, [playing, startPlay, stopPlay]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  useEffect(() => {
    if (!playing && (videoClips.length > 0 || audioClips.length > 0)) {
      lastSyncVideoId.current = "";
      lastSyncAudioId.current = "";
      syncPreview(currentTime);
    }
  }, [videoClips, audioClips, playing, syncPreview]);

  // ── Clip Actions ────────────────────────────────────────────────────────

  const addClip = useCallback(async (file: any) => {
    const src = file.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file.sourceUrl || "";
    let dur = 3;
    if (file.fileType === "video" || file.fileType === "audio" || file.fileType === "music") {
      dur = await new Promise<number>(r => {
        const el = file.fileType === "video" ? document.createElement("video") : document.createElement("audio");
        el.preload = "metadata"; el.muted = true;
        el.onloadedmetadata = () => { el.src = ""; r(el.duration || 5); };
        el.onerror = () => r(5); setTimeout(() => { el.src = ""; r(5); }, 5000);
        el.src = src;
      });
    }
    const clipType = file.fileType === "video" ? "video" : file.fileType === "image" ? "image" : "audio";
    const c: TimelineClip = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: clipType,
      src, name: file.filename || file.model || "Untitled",
      duration: dur, trimStart: 0, trimEnd: 0, originalDuration: dur,
      prompt: file.prompt || undefined,
    };
    if (clipType === "audio") {
      setAudioClips(p => [...p, c]);
      setSelectedTrack("audio");
    } else {
      setVideoClips(p => [...p, c]);
      setSelectedTrack("video");
    }
    setSelectedClipId(c.id);
    setShowMedia(false);
  }, []);

  const addClipFromUrl = useCallback(async (url: string, fileType: string) => {
    const filename = url.split("/").pop()?.split("?")[0] || "file";
    await addClip({ sourceUrl: url, fileType, filename });
    setShowFileBrowser(false);
  }, [addClip]);

  const addLayerFromUrl = useCallback((url: string, fileType: string) => {
    if (fileType !== "image" && fileType !== "video") return;
    pushHistory();
    const id = `ol-${Date.now()}-m`;
    const st = isNaN(currentTime) ? 0 : currentTime;
    const et = Math.max(st + 5, Math.min(st + 5, totalDur || st + 5));
    setOverlayLayers(p => [...p, {
      id, type: fileType as "image" | "video",
      startTime: parseFloat(st.toFixed(2)), endTime: parseFloat(et.toFixed(2)),
      x: 96, y: 96,
      w: Math.round(canvasSize.w * 0.45), h: Math.round(canvasSize.h * 0.45),
      src: url, borderRadius: 16, borderWidth: 4, borderColor: "#00D4AA",
    }]);
    setSelectedOverlayId(id);
    setShowLayerPanel(true);
    setShowLayerFileBrowser(false);
  }, [currentTime, totalDur, canvasSize, pushHistory]);

  const removeClip = useCallback((id: string) => {
    pushHistory();
    setVideoClips(p => p.filter(c => c.id !== id));
    setAudioClips(p => p.filter(c => c.id !== id));
    if (selectedClipId === id) setSelectedClipId(null);
  }, [selectedClipId, pushHistory]);

  const splitClip = useCallback(() => {
    if (!selectedClipId) return;
    const idx = clips.findIndex(c => c.id === selectedClipId);
    if (idx < 0) return;
    let e = 0;
    for (let i = 0; i < idx; i++) e += getVisDur(clips[i]);
    const lt = currentTime - e;
    const clip = clips[idx];
    const vd = getVisDur(clip);
    if (lt <= 0.1 || lt >= vd - 0.1) { toast.warning("Move playhead inside clip"); return; }
    pushHistory();
    const sp = clip.trimStart + lt;
    setClips(p => [...p.slice(0, idx),
      { ...clip, id: `c-${Date.now()}-a`, trimEnd: clip.duration - sp },
      { ...clip, id: `c-${Date.now()}-b`, trimStart: sp },
      ...p.slice(idx + 1)]);
  }, [clips, selectedClipId, currentTime, pushHistory, setClips]);

  const applyRangeCut = useCallback(() => {
    if (!selectedClipId) return;
    const idx = clips.findIndex(c => c.id === selectedClipId);
    if (idx < 0) return;
    const clip = clips[idx];
    const vd = getVisDur(clip);
    const start = Math.max(0, Math.min(rangeCutStart, vd - 0.1));
    const end = Math.max(start + 0.1, Math.min(rangeCutEnd, vd));
    if (end - start < 0.1) { toast.warning("Range too short"); return; }
    pushHistory();
    const ts = Date.now();
    const pieces: TimelineClip[] = [];
    if (start > 0.1) {
      pieces.push({ ...clip, id: `c-${ts}-before`, trimEnd: clip.duration - (clip.trimStart + start) });
    }
    const middle: TimelineClip = { ...clip, id: `c-${ts}-range`, trimStart: clip.trimStart + start, trimEnd: clip.duration - (clip.trimStart + end) };
    pieces.push(middle);
    if (vd - end > 0.1) {
      pieces.push({ ...clip, id: `c-${ts}-after`, trimStart: clip.trimStart + end });
    }
    setClips(p => [...p.slice(0, idx), ...pieces, ...p.slice(idx + 1)]);
    setSelectedClipId(middle.id);
    setShowRangeCut(false);
    toast.success(`Split into ${pieces.length} pieces — middle selected (${formatTime(end - start)})`);
  }, [selectedClipId, clips, rangeCutStart, rangeCutEnd, pushHistory, setClips]);

  const openRangeCut = useCallback(() => {
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    const vd = getVisDur(clip);
    setRangeCutStart(0);
    setRangeCutEnd(Math.min(30, vd));
    setShowRangeCut(true);
  }, [clips, selectedClipId]);

  const copyClip = useCallback(() => {
    const clip = clips.find(c => c.id === selectedClipId);
    if (clip) { setClipboard({ ...clip }); toast.success("Clip copied"); }
  }, [clips, selectedClipId]);

  const pasteClip = useCallback(() => {
    if (!clipboard) return;
    const pasted: TimelineClip = {
      ...clipboard,
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    const targetTrack = pasted.type === "audio" ? audioClips : videoClips;
    const setTargetTrack = pasted.type === "audio" ? setAudioClips : setVideoClips;
    const idx = selectedClipId ? targetTrack.findIndex(c => c.id === selectedClipId) : -1;
    if (idx >= 0) {
      setTargetTrack(p => [...p.slice(0, idx + 1), pasted, ...p.slice(idx + 1)]);
    } else {
      setTargetTrack(p => [...p, pasted]);
    }
    setSelectedClipId(pasted.id);
    setSelectedTrack(pasted.type === "audio" ? "audio" : "video");
    toast.success("Clip pasted");
  }, [clipboard, videoClips, audioClips, selectedClipId]);

  // ── Extract Audio from Video ────────────────────────────────────────────

  const extractAudioFromVideo = useCallback(async (clip: TimelineClip) => {
    if (clip.type !== "video") return;
    setExtracting(true);
    toast.info("Extracting audio from video...");
    try {
      const res = await fetch(clip.src);
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;
      const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
      const view = new DataView(wavBuffer);
      const writeStr = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
      writeStr(0, "RIFF");
      view.setUint32(4, 36 + length * numChannels * 2, true);
      writeStr(8, "WAVE"); writeStr(12, "fmt ");
      view.setUint32(16, 16, true); view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true); view.setUint16(34, 16, true);
      writeStr(36, "data"); view.setUint32(40, length * numChannels * 2, true);
      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
          view.setInt16(offset, sample * 0x7fff, true);
          offset += 2;
        }
      }
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);
      const dur = audioBuffer.duration;
      const newClip: TimelineClip = {
        id: `c-${Date.now()}-extract`, type: "audio", src: url,
        name: `${clip.name.replace(/\.\w+$/, "")}-audio.wav`,
        duration: dur, trimStart: 0, trimEnd: 0, originalDuration: dur,
      };
      pushHistory();
      setAudioClips(p => [...p, newClip]);
      setSelectedClipId(newClip.id);
      setSelectedTrack("audio");
      toast.success("Audio extracted and added to audio track! Right-click to save or download.");
      audioCtx.close();
    } catch (err) {
      console.error("[VideoEditor] Extract audio failed:", err);
      toast.error("Failed to extract audio — video may not have an audio track");
    } finally {
      setExtracting(false);
    }
  }, [pushHistory]);

  // ── Save Clip to Uploads ────────────────────────────────────────────────

  const saveClipToUploads = useCallback(async (clip: TimelineClip) => {
    if (!companyId || !user?.id) { toast.error("Not authenticated"); return; }
    setSaving(true);
    try {
      const res = await fetch(clip.src);
      const blob = await res.blob();
      const ext = clip.type === "video" ? "mp4" : clip.type === "audio" ? "mp3" : "png";
      const mimeType = clip.type === "video" ? "video/mp4" : clip.type === "audio" ? "audio/mpeg" : "image/png";
      const filename = clip.name.includes(".") ? clip.name : `${clip.name}.${ext}`;
      const uploadRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, mimeType: blob.type || mimeType, companyId, category: "uploads" }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.uploadUrl || !uploadData.key) throw new Error(uploadData.error || "Failed to get upload URL");
      await fetch(uploadData.uploadUrl, { method: "PUT", headers: { "Content-Type": blob.type || mimeType }, body: blob });
      const r2Key = uploadData.key;
      const publicUrl = uploadData.publicUrl || `${R2_PUBLIC_URL}/${r2Key}`;
      await logUpload({
        companyId, userId: user.id, projectId, category: "uploaded", filename,
        fileType: clip.type, mimeType: blob.type || mimeType, size: blob.size,
        status: "completed", r2Key, sourceUrl: publicUrl, tags: [], uploadedBy: user.id,
      });
      toast.success(`Saved "${filename}" to uploads!`);
    } catch (err) {
      console.error("[VideoEditor] Save to uploads failed:", err);
      toast.error("Failed to save to uploads");
    } finally {
      setSaving(false);
      setClipContextMenu(null);
    }
  }, [companyId, user?.id, projectId, logUpload]);

  // ── Drag & Trim ─────────────────────────────────────────────────────────

  const onDragStart = useCallback((e: React.DragEvent, id: string) => { setDraggedClipId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDragEnd = useCallback(() => { setDraggedClipId(null); }, []);
  const onDrop = useCallback((e: React.DragEvent, tid: string) => {
    e.preventDefault();
    if (!draggedClipId || draggedClipId === tid) return;
    const reorder = (p: TimelineClip[]) => { const a = [...p]; const fi = a.findIndex(c => c.id === draggedClipId); const ti = a.findIndex(c => c.id === tid); if (fi < 0 || ti < 0) return p; const [m] = a.splice(fi, 1); a.splice(ti, 0, m); return a; };
    setVideoClips(reorder);
    setAudioClips(reorder);
    setDraggedClipId(null);
  }, [draggedClipId]);

  const onTrimDown = useCallback((e: React.MouseEvent, id: string, side: "left" | "right") => {
    e.stopPropagation(); e.preventDefault();
    const c = videoClips.find(x => x.id === id) || audioClips.find(x => x.id === id);
    if (c) setTrimming({ clipId: id, side, startX: e.clientX, origTS: c.trimStart, origTE: c.trimEnd, origDur: c.duration });
  }, [videoClips, audioClips]);

  useEffect(() => {
    if (!trimming) return;
    const move = (e: MouseEvent) => {
      const dt = (e.clientX - trimming.startX) / pxPerSec;
      const trimMapper = (c: TimelineClip) => {
        if (c.id !== trimming.clipId) return c;
        if (c.type === "image" && trimming.side === "right") {
          const newDur = Math.max(0.5, trimming.origDur + dt);
          return { ...c, duration: newDur, originalDuration: newDur };
        }
        if (trimming.side === "left") return { ...c, trimStart: Math.max(0, Math.min(trimming.origTS + dt, c.duration - c.trimEnd - 0.1)) };
        return { ...c, trimEnd: Math.max(0, Math.min(trimming.origTE - dt, c.duration - c.trimStart - 0.1)) };
      };
      setVideoClips(p => p.map(trimMapper));
      setAudioClips(p => p.map(trimMapper));
    };
    const up = () => setTrimming(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [trimming, pxPerSec]);

  const onTimelineClick = useCallback((e: React.MouseEvent) => {
    if (showRangeCut) return;
    if (!timelineRef.current) return;
    const r = timelineRef.current.getBoundingClientRect();
    const raw = (e.clientX - r.left + timelineRef.current.scrollLeft - 48) / pxPerSec;
    const t = Math.max(0, Math.min(isNaN(raw) ? 0 : raw, totalDur || 0));
    setCurrentTime(t); syncPreview(t);
  }, [pxPerSec, totalDur, syncPreview, showRangeCut]);

  // ── Snapshot ────────────────────────────────────────────────────────────

  const handleSnapshot = useCallback(async () => {
    const curVideo = getClipAtTime(videoClips, currentTime);
    if (!curVideo) return;
    const addSnapshotToTrack = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const snapClip: TimelineClip = {
        id: `c-${Date.now()}-snap`, type: "image", src: url,
        name: `snapshot-${formatTime(currentTime).replace(/[:.]/g, "-")}.png`,
        duration: 3, trimStart: 0, trimEnd: 0, originalDuration: 3,
      };
      setVideoClips(p => [...p, snapClip]);
      setSelectedClipId(snapClip.id);
      setSelectedTrack("video");
      toast.success("Frame captured and added to video track!");
    };

    try {
      if (curVideo.clip.type === "image") {
        const snapClip: TimelineClip = {
          id: `c-${Date.now()}-snap`, type: "image", src: curVideo.clip.src,
          name: `snapshot-${formatTime(currentTime).replace(/[:.]/g, "-")}.png`,
          duration: 3, trimStart: 0, trimEnd: 0, originalDuration: 3,
        };
        setVideoClips(p => [...p, snapClip]);
        setSelectedClipId(snapClip.id);
        setSelectedTrack("video");
        toast.success("Frame captured and added to video track!");
      } else if (curVideo.clip.type === "video" && previewRef.current) {
        toast.info("Capturing frame...");
        const vid = previewRef.current;
        const seekTime = vid.currentTime;
        const fetchRes = await fetch(curVideo.clip.src);
        const blob = await fetchRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const tempVid = document.createElement("video");
        tempVid.src = blobUrl; tempVid.preload = "auto";
        tempVid.onloadeddata = () => { tempVid.currentTime = seekTime; };
        tempVid.onseeked = () => {
          const w = tempVid.videoWidth || 1920;
          const h = tempVid.videoHeight || 1080;
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { toast.error("Canvas not supported"); URL.revokeObjectURL(blobUrl); return; }
          ctx.drawImage(tempVid, 0, 0, w, h);
          canvas.toBlob((snapBlob) => {
            URL.revokeObjectURL(blobUrl);
            if (!snapBlob) { toast.error("Failed to capture"); return; }
            addSnapshotToTrack(snapBlob);
          }, "image/png");
        };
        tempVid.onerror = () => { URL.revokeObjectURL(blobUrl); toast.error("Failed to load video for capture"); };
      }
    } catch {
      toast.error("Failed to capture frame");
    }
  }, [videoClips, currentTime]);

  // Clamp currentTime when totalDur shrinks
  useEffect(() => {
    if (totalDur > 0 && currentTime > totalDur) setCurrentTime(totalDur);
  }, [totalDur, currentTime]);

  // Auto-show layer panel when overlay track selected
  useEffect(() => { if (selectedTrack === "overlay") setShowLayerPanel(true); }, [selectedTrack]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      if ((e.code === "Delete" || e.code === "Backspace") && selectedClipId) removeClip(selectedClipId);
      else if ((e.code === "Delete" || e.code === "Backspace") && selectedOverlayId) {
        pushHistory();
        setOverlayLayers(p => p.filter(l => l.id !== selectedOverlayId));
        setSelectedOverlayId(null);
      }
      if (e.code === "KeyS" && !e.ctrlKey && !e.metaKey) splitClip();
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyC") {
        e.preventDefault();
        if (selectedOverlayId) {
          const ol = overlayLayers.find(l => l.id === selectedOverlayId);
          if (ol) setClipboard({ ...ol } as any);
        } else copyClip();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyV") {
        e.preventDefault();
        const cb = clipboard as any;
        if (cb && cb.startTime !== undefined && cb.endTime !== undefined && !cb.src) {
          pushHistory();
          const copy = { ...cb, id: `ol-${Date.now()}-paste`, x: (cb.x ?? 0) + 30, y: (cb.y ?? 0) + 30 };
          setOverlayLayers(p => [...p, copy]);
          setSelectedOverlayId(copy.id);
        } else pasteClip();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyZ") { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") { e.preventDefault(); undo(); }
      if (e.code === "ArrowLeft") setCurrentTime(t => Math.max(0, t - 0.5));
      if (e.code === "ArrowRight") setCurrentTime(t => Math.min(totalDur, t + 0.5));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggle, selectedClipId, selectedOverlayId, removeClip, splitClip, copyClip, pasteClip, undo, redo, pushHistory, totalDur]);

  // ── Render ──────────────────────────────────────────────────────────────

  const curVideo = getClipAtTime(videoClips, currentTime);
  const sel = videoClips.find(c => c.id === selectedClipId) || audioClips.find(c => c.id === selectedClipId);

  return (
    <div className="flex flex-col h-screen bg-(--bg-primary) text-(--text-primary) select-none overflow-hidden relative">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-(--border-primary) shrink-0 bg-(--bg-secondary)">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition text-(--text-tertiary) hover:text-(--text-primary)">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-(--accent-teal)" />
            <span className="text-[13px] font-semibold text-(--text-primary)">Video Editor</span>
            {projectName && <span className="text-[11px] text-(--text-tertiary)">— {projectName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={project?.aspectRatio || "16:9"}
            onChange={(e) => updateProject({ id: projectId, aspectRatio: e.target.value })}
            className="px-2.5 py-1 text-[11px] bg-(--bg-primary) border border-(--border-primary) rounded-lg text-(--text-secondary) outline-none cursor-pointer hover:border-(--border-secondary)"
            title="Canvas aspect ratio"
          >
            {ASPECT_RATIOS.map(r => <option key={r.key} value={r.key}>{r.label} ({r.w}×{r.h})</option>)}
          </select>
          <button onClick={handleExport} disabled={exporting || (selectedTrack === "audio" ? audioClips.length === 0 : (videoClips.length === 0 && overlayLayers.length === 0))}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-(--accent-teal) hover:bg-(--accent-teal)/80 disabled:opacity-30 text-white text-[12px] font-medium rounded-lg transition">
            {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {exportProgress}%</> : <><Download className="w-3.5 h-3.5" /> Export {selectedTrack === "audio" ? "WAV" : "MP4"}</>}
          </button>
        </div>
      </div>

      {/* Preview + Layer Panel */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-0">
          <PreviewCanvas cur={curVideo} videoClips={videoClips} previewRef={previewRef} audioRef={audioRef}
            currentTime={currentTime} subtitleClips={subtitleClips}
            overlayLayers={overlayLayers} setOverlayLayers={setOverlayLayers}
            selectedOverlayId={selectedOverlayId} setSelectedOverlayId={setSelectedOverlayId}
            bgColor={bgColor} playing={playing}
            canvasSize={canvasSize}
            exporting={exporting} exportProgress={exportProgress}
            onBeforeChange={pushHistory} />

        {curVideo && (curVideo.clip.type === "video" || curVideo.clip.type === "image") && (
          <div className="absolute top-3 right-3 z-10">
            <button onClick={handleSnapshot}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition shadow-lg bg-(--bg-secondary)/90 backdrop-blur text-(--text-secondary) hover:text-(--text-primary) border border-(--border-primary)"
              title="Capture current frame as image">
              <Camera className="w-3.5 h-3.5" /> Snapshot
            </button>
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <button onClick={() => { setShowMedia(!showMedia); if (showMedia) setMediaFilter("video"); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition shadow-lg ${showMedia ? "bg-(--accent-teal) text-white" : "bg-(--bg-secondary)/90 backdrop-blur text-(--text-secondary) hover:text-(--text-primary) border border-(--border-primary)"}`}>
            {showMedia ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showMedia ? "Close" : "Add Media"}
          </button>
          <button onClick={() => { setShowFileBrowser(true); setShowMedia(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition shadow-lg bg-(--bg-secondary)/90 backdrop-blur text-(--text-secondary) hover:text-(--text-primary) border border-(--border-primary)">
            <FolderOpen className="w-3.5 h-3.5" /> Browse Files
          </button>
          {showMedia && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-(--bg-secondary)/90 backdrop-blur rounded-lg border border-(--border-primary) text-[11px] font-medium text-(--text-secondary)">
              {selectedTrack === "video" ? <Film className="w-3 h-3 text-(--accent-teal)" /> : <Music className="w-3 h-3 text-purple-400" />}
              {selectedTrack === "video" ? "Video Track" : "Audio Track"}
            </div>
          )}
        </div>

        {showMedia && (
          <div className="absolute top-12 left-3 bottom-16 w-60 bg-(--bg-secondary)/95 backdrop-blur-md border border-(--border-primary) rounded-xl overflow-hidden z-20 shadow-2xl flex flex-col">
            {/* Filter tabs */}
            <div className="flex gap-1 px-2 pt-2 pb-1 border-b border-(--border-primary) shrink-0">
              {([["video", "🎬 Video"], ["image", "🖼️ Image"], ["audio", "🎵 Audio"]] as const).map(([f, label]) => (
                <button key={f} onClick={() => setMediaFilter(f)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-medium transition ${mediaFilter === f ? "bg-(--accent-teal)/20 text-(--accent-teal)" : "text-(--text-tertiary) hover:text-(--text-secondary)"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {!projectFiles ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-(--border-primary) animate-spin" /></div>
              ) : (() => {
                const filtered = mediaFiles.filter(f =>
                  mediaFilter === "audio" ? (f.fileType === "audio" || f.fileType === "music") :
                  f.fileType === mediaFilter
                );
                if (filtered.length === 0) return (
                  <div className="text-center py-12 text-[11px] text-(--text-tertiary)">
                    No {mediaFilter === "all" ? "media" : mediaFilter} files
                  </div>
                );
                return filtered.map(file => {
                  const src = file.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file.sourceUrl || "";
                  const isAudio = file.fileType === "audio" || file.fileType === "music";
                  return (
                    <button key={file._id} onClick={() => addClip(file)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition text-left group">
                      {file.fileType === "video" ? (
                        <div className="w-16 h-10 rounded-md bg-black overflow-hidden shrink-0 border border-(--border-primary)">
                          <video src={src} className="w-full h-full object-cover" muted preload="metadata"
                            onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
                        </div>
                      ) : file.fileType === "image" ? (
                        <div className="w-16 h-10 rounded-md bg-black overflow-hidden shrink-0 border border-(--border-primary)">
                          <img src={src} className="w-full h-full object-cover" alt="" />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded-md bg-(--bg-primary) flex items-center justify-center shrink-0 border border-(--border-primary)">
                          <Music className="w-5 h-5 text-purple-400/70" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-(--text-secondary) truncate">{file.filename || file.model || "Untitled"}</p>
                        <p className={`text-[9px] capitalize ${isAudio ? "text-purple-400/70" : file.fileType === "video" ? "text-emerald-400/70" : "text-orange-400/70"}`}>{isAudio ? "audio" : file.fileType}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-(--text-tertiary) opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
        </div>

        {/* Layer Panel */}
        {showLayerPanel && (
          <LayerPanel
            overlayLayers={overlayLayers} setOverlayLayers={setOverlayLayers}
            selectedOverlayId={selectedOverlayId} setSelectedOverlayId={setSelectedOverlayId}
            currentTime={currentTime} totalDur={totalDur}
            bgColor={bgColor} setBgColor={setBgColor}
            mediaFiles={mediaFiles} canvasSize={canvasSize}
            onBeforeChange={pushHistory}
            onClose={() => setShowLayerPanel(false)}
            onOpenFileBrowser={() => setShowLayerFileBrowser(true)}
          />
        )}
      </div>

      {/* Bottom Panel */}
      <div className="shrink-0 bg-(--bg-secondary) border-t border-(--border-primary) flex flex-col">
        <ControlBar
          sel={sel} selectedTrack={selectedTrack}
          splitClip={splitClip} removeClip={removeClip}
          showRangeCut={showRangeCut} setShowRangeCut={setShowRangeCut} openRangeCut={openRangeCut}
          extractAudioFromVideo={extractAudioFromVideo} extracting={extracting}
          setVideoClips={setVideoClips}
          playing={playing} toggle={toggle}
          currentTime={currentTime} setCurrentTime={setCurrentTime} totalDur={totalDur}
          timeDisplayRef={timeDisplayRef} pxPerSec={pxPerSec} setPxPerSec={setPxPerSec}
          timelineRef={timelineRef}
          showLayerPanel={showLayerPanel} setShowLayerPanel={setShowLayerPanel}
          undo={undo} redo={redo}
          canUndo={historyIndexRef.current >= 0}
          canRedo={historyIndexRef.current + 2 < historyRef.current.length}
        />
        <TimelineTracks
          videoClips={videoClips} audioClips={audioClips}
          subtitleClips={subtitleClips} overlayLayers={overlayLayers}
          selectedTrack={selectedTrack} selectedClipId={selectedClipId}
          selectedSubtitleId={selectedSubtitleId}
          selectedOverlayId={selectedOverlayId}
          setSelectedOverlayId={setSelectedOverlayId}
          setOverlayLayers={setOverlayLayers}
          pxPerSec={pxPerSec} currentTime={currentTime} totalDur={totalDur}
          playing={playing} draggedClipId={draggedClipId}
          showRangeCut={showRangeCut} rangeCutStart={rangeCutStart} rangeCutEnd={rangeCutEnd}
          setSelectedTrack={setSelectedTrack} setSelectedClipId={setSelectedClipId}
          setSelectedSubtitleId={setSelectedSubtitleId}
          setCurrentTime={setCurrentTime} setRangeCutStart={setRangeCutStart} setRangeCutEnd={setRangeCutEnd}
          onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
          onTrimDown={onTrimDown} onTimelineClick={onTimelineClick}
          splitClip={splitClip} applyRangeCut={applyRangeCut}
          syncPreview={syncPreview} setClipContextMenu={setClipContextMenu}
          timelineRef={timelineRef} playheadRef={playheadRef}
          progressBarRef={progressBarRef} playStart={playStart}
          onBeforeLayerChange={pushHistory}
        />
      </div>

      {/* Clip Context Menu */}
      {clipContextMenu && (() => {
        const ctxClip = videoClips.find(c => c.id === clipContextMenu.clipId) || audioClips.find(c => c.id === clipContextMenu.clipId);
        if (!ctxClip) return null;
        return (
          <div
            className="fixed bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl overflow-hidden py-1.5 min-w-[180px]"
            style={{ left: clipContextMenu.x, bottom: window.innerHeight - clipContextMenu.y, zIndex: 99999 }}
            onClick={() => setClipContextMenu(null)}
          >
            <div className="px-3 py-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Volume2 className="w-3.5 h-3.5 text-(--text-secondary) shrink-0" />
              <input type="range" min={0} max={100} value={ctxClip.volume ?? 100}
                onChange={(e) => {
                  const vol = parseInt(e.target.value);
                  setVideoClips(p => p.map(c => c.id === ctxClip.id ? { ...c, volume: vol } : c));
                  setAudioClips(p => p.map(c => c.id === ctxClip.id ? { ...c, volume: vol } : c));
                  if (previewRef.current && getClipAtTime(videoClips, currentTime)?.clip.id === ctxClip.id)
                    previewRef.current.volume = vol / 100;
                  if (audioRef.current && getClipAtTime(audioClips, currentTime)?.clip.id === ctxClip.id)
                    audioRef.current.volume = vol / 100;
                }}
                className="flex-1 h-1 accent-(--accent-teal) cursor-pointer" />
              <span className="text-[11px] text-(--text-tertiary) w-6 text-right shrink-0">{ctxClip.volume ?? 100}</span>
            </div>
            <div className="h-px bg-(--border-primary) mx-2 mb-1" />
            <button onClick={() => saveClipToUploads(ctxClip)} disabled={saving}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-(--accent-teal) hover:bg-white/5 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save to Uploads"}
            </button>
            <button
              onClick={() => { const link = document.createElement("a"); link.href = ctxClip.src; link.download = ctxClip.name; link.click(); setClipContextMenu(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors">
              <Download className="w-4 h-4 text-(--text-secondary)" /> Download
            </button>
            {ctxClip.type === "video" && (
              <button onClick={() => { extractAudioFromVideo(ctxClip); setClipContextMenu(null); }} disabled={extracting}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors disabled:opacity-50">
                <Music className="w-4 h-4 text-(--text-secondary)" /> {extracting ? "Extracting..." : "Extract Audio"}
              </button>
            )}
            <div className="h-px bg-(--border-primary) mx-2 my-1" />
            <button onClick={() => { removeClip(ctxClip.id); setClipContextMenu(null); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        );
      })()}

      {clipContextMenu && <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setClipContextMenu(null)} />}

      {showFileBrowser && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowFileBrowser(false)}
          onSelectFile={(url, type) => {
            if (type === "image" || type === "video" || type === "audio") addClipFromUrl(url, type);
          }}
        />
      )}

      {showLayerFileBrowser && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowLayerFileBrowser(false)}
          onSelectFile={(url, type) => addLayerFromUrl(url, type)}
        />
      )}
    </div>
  );
}
