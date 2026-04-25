"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Film, Music, Image, Play, Pause, Scissors, Trash2, Camera,
  ZoomIn, ZoomOut, Download, Plus, Loader2, Clock,
  SkipBack, SkipForward, PanelLeftOpen, PanelLeftClose, X, Save, FolderOpen, Type,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { FileBrowser } from "../ai/FileBrowser";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

// ─── Types ──────────────────────────────────────────────────────────────

type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn";
const BLEND_MODES: BlendMode[] = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn"];

interface TimelineClip {
  id: string;
  type: "video" | "image" | "audio";
  src: string;
  name: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  originalDuration: number;
  blendMode?: BlendMode;
  opacity?: number; // 0-100, default 100
}

interface SubtitleClip {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "center" | "bottom";
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  fontWeight: "normal" | "bold";
}

type EditorMode = "video" | "audio";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
}

function getVisDur(c: TimelineClip): number {
  return Math.max(0.1, c.duration - c.trimStart - c.trimEnd);
}

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

  const [videoClips, setVideoClips] = useState<TimelineClip[]>([]);
  const [audioClips, setAudioClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<"video" | "audio" | "subtitle">("video");
  const [subtitleClips, setSubtitleClips] = useState<SubtitleClip[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);

  // Unified clips getter for backward compat
  const clips = selectedTrack === "video" ? videoClips : audioClips;
  const setClips = selectedTrack === "video" ? setVideoClips : setAudioClips;
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pxPerSec, setPxPerSec] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [showRangeCut, setShowRangeCut] = useState(false);
  const [rangeCutStart, setRangeCutStart] = useState(0);
  const [rangeCutEnd, setRangeCutEnd] = useState(30);
  const [clipboard, setClipboard] = useState<TimelineClip | null>(null);
  const [history, setHistory] = useState<TimelineClip[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [trimming, setTrimming] = useState<{
    clipId: string; side: "left" | "right"; startX: number;
    origTS: number; origTE: number;
  } | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<number>(0);
  const playStart = useRef({ realTime: 0, offset: 0 });

  const projectFiles = useQuery(api.storyboard.storyboardFiles.listByProject, { projectId });

  // Undo system — push state before destructive actions (saves both tracks)
  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), [videoClips, audioClips] as any]);
    setHistoryIndex(prev => prev + 1);
  }, [videoClips, audioClips, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    const [v, a] = history[historyIndex] as any;
    setVideoClips(v);
    setAudioClips(a);
    setHistoryIndex(prev => prev - 1);
    toast.success("Undone");
  }, [history, historyIndex]);

  // Track type for media panel filtering
  const trackType = selectedTrack;

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
  const totalDur = Math.max(videoDur, audioDur);

  // ── Playback ──────────────────────────────────────────────────────────

  // Get clip at time for a specific track's clips
  const getClipAtInTrack = useCallback((trackClips: TimelineClip[], t: number) => {
    let e = 0;
    for (let i = 0; i < trackClips.length; i++) {
      const d = getVisDur(trackClips[i]);
      if (t < e + d) return { clip: trackClips[i], offset: t - e + trackClips[i].trimStart, idx: i };
      e += d;
    }
    return null;
  }, []);

  // Backward compat — getClipAt uses selected track
  const getClipAt = useCallback((t: number) => getClipAtInTrack(clips, t), [clips, getClipAtInTrack]);

  const lastSyncVideoId = useRef<string>("");
  const lastSyncAudioId = useRef<string>("");

  const syncPreview = useCallback((t: number) => {
    // Sync video track
    const vr = getClipAtInTrack(videoClips, t);
    if (vr && (vr.clip.type === "video" || vr.clip.type === "image") && previewRef.current) {
      const vid = previewRef.current;
      const videoChanged = lastSyncVideoId.current !== vr.clip.id;
      lastSyncVideoId.current = vr.clip.id;
      if (vr.clip.type === "video") {
        if (videoChanged || vid.src !== vr.clip.src) {
          vid.src = vr.clip.src;
          vid.load();
          vid.currentTime = vr.offset;
          vid.muted = false;
          if (playing) {
            const tryPlay = () => { vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); }); };
            if (vid.readyState >= 2) { tryPlay(); } else { vid.oncanplay = () => { vid.oncanplay = null; tryPlay(); }; }
          }
        } else if (!playing) {
          vid.currentTime = vr.offset;
        }
      }
    }
    if (!vr && previewRef.current && !previewRef.current.paused) {
      previewRef.current.pause();
      lastSyncVideoId.current = "";
    }

    // Sync audio track
    const ar = getClipAtInTrack(audioClips, t);
    if (ar && audioRef.current) {
      const aud = audioRef.current;
      const audioChanged = lastSyncAudioId.current !== ar.clip.id;
      lastSyncAudioId.current = ar.clip.id;
      if (audioChanged || aud.src !== ar.clip.src) {
        aud.src = ar.clip.src;
        aud.load();
        aud.currentTime = ar.offset;
        if (playing) {
          if (aud.readyState >= 2) { aud.play().catch(() => {}); } else { aud.oncanplay = () => { aud.oncanplay = null; aud.play().catch(() => {}); }; }
        }
      } else if (!playing) {
        aud.currentTime = ar.offset;
      }
    }
    if (!ar && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      lastSyncAudioId.current = "";
    }
  }, [videoClips, audioClips, getClipAtInTrack, playing]);

  const startPlay = useCallback(() => {
    if (totalDur <= 0) return;
    setPlaying(true);
    playStart.current = { realTime: performance.now(), offset: currentTime };

    // Start both tracks simultaneously — directly start media (can't rely on syncPreview since playing state hasn't updated yet)
    const vr = getClipAtInTrack(videoClips, currentTime);
    if (vr && vr.clip.type === "video" && previewRef.current) {
      const vid = previewRef.current;
      if (vid.src !== vr.clip.src) { vid.src = vr.clip.src; vid.load(); }
      vid.currentTime = vr.offset;
      vid.muted = false;
      const tryPlay = () => { vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); }); };
      if (vid.readyState >= 2) tryPlay(); else vid.oncanplay = () => { vid.oncanplay = null; tryPlay(); };
      lastSyncVideoId.current = vr.clip.id;
    }
    const ar = getClipAtInTrack(audioClips, currentTime);
    if (ar && audioRef.current) {
      const aud = audioRef.current;
      if (aud.src !== ar.clip.src) { aud.src = ar.clip.src; aud.load(); }
      aud.currentTime = ar.offset;
      if (aud.readyState >= 2) aud.play().catch(() => {}); else aud.oncanplay = () => { aud.oncanplay = null; aud.play().catch(() => {}); };
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

      // Update DOM directly (no React re-render) for smooth playback
      if (playheadRef.current) playheadRef.current.style.left = `${t * pxPerSec + 56}px`;
      if (progressBarRef.current) progressBarRef.current.style.width = `${t * pxPerSec}px`;
      if (timeDisplayRef.current) timeDisplayRef.current.textContent = `${formatTime(t)} / ${formatTime(totalDur)}`;

      // Update React state only 4 times per second
      if (Math.floor(t * 4) !== Math.floor((t - 1/60) * 4)) {
        setCurrentTime(t);
      }

      // Sync on clip boundaries for both tracks
      const vr = getClipAtInTrack(videoClips, t);
      const ar = getClipAtInTrack(audioClips, t);
      if ((vr && lastSyncVideoId.current !== vr.clip.id) || (ar && lastSyncAudioId.current !== ar.clip.id) ||
          (!vr && lastSyncVideoId.current) || (!ar && lastSyncAudioId.current)) {
        syncPreview(t);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [totalDur, currentTime, syncPreview, videoClips, audioClips, getClipAtInTrack]);

  const stopPlay = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    if (previewRef.current) previewRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const toggle = useCallback(() => { playing ? stopPlay() : startPlay(); }, [playing, startPlay, stopPlay]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // Sync preview when clips change or currentTime is seeked while paused
  useEffect(() => {
    if (!playing && (videoClips.length > 0 || audioClips.length > 0)) {
      lastSyncVideoId.current = "";
      lastSyncAudioId.current = "";
      syncPreview(currentTime);
    }
  }, [videoClips, audioClips, playing, syncPreview]);

  // ── Clip Actions ──────────────────────────────────────────────────────

  const addClip = useCallback(async (file: any) => {
    const src = file.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file.sourceUrl || "";
    let dur = 3;
    if (file.fileType === "video" || file.fileType === "audio" || file.fileType === "music") {
      dur = await new Promise<number>(r => {
        const el = file.fileType === "video" ? document.createElement("video") : document.createElement("audio");
        el.src = src; el.preload = "metadata";
        el.onloadedmetadata = () => r(el.duration || 5);
        el.onerror = () => r(5); setTimeout(() => r(5), 5000);
      });
    }
    const clipType = file.fileType === "video" ? "video" : file.fileType === "image" ? "image" : "audio";
    const c: TimelineClip = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: clipType,
      src, name: file.filename || file.model || "Untitled",
      duration: dur, trimStart: 0, trimEnd: 0, originalDuration: dur,
    };
    // Route to correct track
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
    // Piece 1: Before (if start > 0)
    if (start > 0.1) {
      pieces.push({ ...clip, id: `c-${ts}-before`, trimEnd: clip.duration - (clip.trimStart + start) });
    }
    // Piece 2: Selected range (always)
    const middle: TimelineClip = { ...clip, id: `c-${ts}-range`, trimStart: clip.trimStart + start, trimEnd: clip.duration - (clip.trimStart + end) };
    pieces.push(middle);
    // Piece 3: After (if end < vd)
    if (vd - end > 0.1) {
      pieces.push({ ...clip, id: `c-${ts}-after`, trimStart: clip.trimStart + end });
    }
    setClips(p => [...p.slice(0, idx), ...pieces, ...p.slice(idx + 1)]);
    setSelectedClipId(middle.id);
    setShowRangeCut(false);
    toast.success(`Split into ${pieces.length} pieces — middle selected (${formatTime(end - start)})`);
  }, [selectedClipId, clips, rangeCutStart, rangeCutEnd, pushHistory]);

  const openRangeCut = useCallback(() => {
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    const vd = getVisDur(clip);
    setRangeCutStart(0);
    setRangeCutEnd(Math.min(30, vd));
    setShowRangeCut(true);
  }, [clips, selectedClipId]);

  const addClipFromUrl = useCallback(async (url: string, fileType: string) => {
    const filename = url.split("/").pop()?.split("?")[0] || "file";
    await addClip({ sourceUrl: url, fileType, filename });
    setShowFileBrowser(false);
  }, [addClip]);

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
  }, [clips, selectedClipId, currentTime]);

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

  // ── Extract Audio from Video ─────────────────────────────────────────

  const [extracting, setExtracting] = useState(false);
  const [clipContextMenu, setClipContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  // rangeCutStart/rangeCutEnd state moved up near other state declarations

  const extractAudioFromVideo = useCallback(async (clip: TimelineClip) => {
    if (clip.type !== "video") return;
    setExtracting(true);
    toast.info("Extracting audio from video...");

    try {
      // Fetch video as blob
      const res = await fetch(clip.src);
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Decode audio using Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Encode as WAV
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length;
      const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
      const view = new DataView(wavBuffer);

      // WAV header
      const writeStr = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
      writeStr(0, "RIFF");
      view.setUint32(4, 36 + length * numChannels * 2, true);
      writeStr(8, "WAVE");
      writeStr(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, "data");
      view.setUint32(40, length * numChannels * 2, true);

      // Interleave channels
      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]));
          view.setInt16(offset, sample * 0x7fff, true);
          offset += 2;
        }
      }

      // Create blob and download
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);

      // Add as audio clip to timeline
      const dur = audioBuffer.duration;
      const newClip: TimelineClip = {
        id: `c-${Date.now()}-extract`,
        type: "audio",
        src: url,
        name: `${clip.name.replace(/\.\w+$/, "")}-audio.wav`,
        duration: dur,
        trimStart: 0,
        trimEnd: 0,
        originalDuration: dur,
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

  // ── Save Clip to Uploads ─────────────────────────────────────────────

  const [saving, setSaving] = useState(false);

  const saveClipToUploads = useCallback(async (clip: TimelineClip) => {
    if (!companyId || !user?.id) { toast.error("Not authenticated"); return; }
    setSaving(true);
    try {
      // Fetch the file
      const res = await fetch(clip.src);
      const blob = await res.blob();

      // Determine file details
      const ext = clip.type === "video" ? "mp4" : clip.type === "audio" ? "mp3" : "png";
      const mimeType = clip.type === "video" ? "video/mp4" : clip.type === "audio" ? "audio/mpeg" : "image/png";
      const filename = clip.name.includes(".") ? clip.name : `${clip.name}.${ext}`;

      // Get presigned upload URL from R2
      const uploadRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          mimeType: blob.type || mimeType,
          companyId,
          category: "uploads",
        }),
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.uploadUrl || !uploadData.key) {
        throw new Error(uploadData.error || "Failed to get upload URL");
      }

      // Upload file to R2
      await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type || mimeType },
        body: blob,
      });

      const r2Key = uploadData.key;
      const publicUrl = uploadData.publicUrl || `${R2_PUBLIC_URL}/${r2Key}`;

      // Log to storyboard_files
      await logUpload({
        companyId,
        userId: user.id,
        projectId,
        category: "uploaded",
        filename,
        fileType: clip.type,
        mimeType: blob.type || mimeType,
        size: blob.size,
        status: "completed",
        r2Key,
        sourceUrl: publicUrl,
        tags: [],
        uploadedBy: user.id,
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

  // ── Drag & Trim ──────────────────────────────────────────────────────

  const onDragStart = useCallback((e: React.DragEvent, id: string) => { setDraggedClipId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDragEnd = useCallback(() => { setDraggedClipId(null); }, []);
  const onDrop = useCallback((e: React.DragEvent, tid: string) => {
    e.preventDefault();
    if (!draggedClipId || draggedClipId === tid) return;
    // Rearrange within the same track
    const reorder = (p: TimelineClip[]) => { const a = [...p]; const fi = a.findIndex(c => c.id === draggedClipId); const ti = a.findIndex(c => c.id === tid); if (fi < 0 || ti < 0) return p; const [m] = a.splice(fi, 1); a.splice(ti, 0, m); return a; };
    setVideoClips(reorder);
    setAudioClips(reorder);
    setDraggedClipId(null);
  }, [draggedClipId]);

  const onTrimDown = useCallback((e: React.MouseEvent, id: string, side: "left" | "right") => {
    e.stopPropagation(); e.preventDefault();
    const c = videoClips.find(x => x.id === id) || audioClips.find(x => x.id === id);
    if (c) setTrimming({ clipId: id, side, startX: e.clientX, origTS: c.trimStart, origTE: c.trimEnd });
  }, [videoClips, audioClips]);

  useEffect(() => {
    if (!trimming) return;
    const move = (e: MouseEvent) => {
      const dt = (e.clientX - trimming.startX) / pxPerSec;
      const trimMapper = (c: TimelineClip) => {
        if (c.id !== trimming.clipId) return c;
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
    if (showRangeCut) return; // Don't move playhead when range cut is active
    if (!timelineRef.current) return;
    const r = timelineRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min((e.clientX - r.left + timelineRef.current.scrollLeft - 56) / pxPerSec, totalDur));
    setCurrentTime(t); syncPreview(t);
  }, [pxPerSec, totalDur, syncPreview, showRangeCut]);

  // ── Audio Export (WAV — pure JS, no library needed) ────────────────────

  const handleAudioExport = useCallback(async () => {
    if (clips.length === 0) { toast.warning("Add clips first"); return; }
    setExporting(true); setExportProgress(0);

    try {
      const SAMPLE_RATE = 44100;
      const NUM_CHANNELS = 2;

      toast.info("Loading audio files...");

      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      const pcmChunks: Float32Array[] = [];
      const pcmChunksR: Float32Array[] = [];

      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        setExportProgress(Math.round((i / clips.length) * 30));

        let blob: Blob;
        try {
          const directRes = await fetch(c.src);
          if (!directRes.ok) throw new Error();
          blob = await directRes.blob();
        } catch {
          const r2Key = c.src.replace(`${R2_PUBLIC_URL}/`, "");
          const presignRes = await fetch("/api/storyboard/download-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ r2Key, filename: c.name }),
          });
          const presignData = await presignRes.json();
          const res = await fetch(presignData.downloadUrl);
          blob = await res.blob();
        }

        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const startSample = Math.floor(c.trimStart * audioBuffer.sampleRate);
        const endSample = Math.floor((audioBuffer.duration - c.trimEnd) * audioBuffer.sampleRate);
        const leftChannel = audioBuffer.getChannelData(0).slice(startSample, endSample);
        const rightChannel = audioBuffer.numberOfChannels > 1
          ? audioBuffer.getChannelData(1).slice(startSample, endSample)
          : leftChannel;

        pcmChunks.push(leftChannel);
        pcmChunksR.push(rightChannel);
      }

      toast.info("Encoding WAV...");

      // Calculate total length
      const totalSamples = pcmChunks.reduce((s, c) => s + c.length, 0);
      const dataSize = totalSamples * NUM_CHANNELS * 2; // 16-bit = 2 bytes per sample
      const fileSize = 44 + dataSize;

      // Build WAV file
      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, "RIFF");
      view.setUint32(4, fileSize - 8, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);           // chunk size
      view.setUint16(20, 1, true);            // PCM format
      view.setUint16(22, NUM_CHANNELS, true); // channels
      view.setUint32(24, SAMPLE_RATE, true);  // sample rate
      view.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * 2, true); // byte rate
      view.setUint16(32, NUM_CHANNELS * 2, true);               // block align
      view.setUint16(34, 16, true);           // bits per sample
      writeString(36, "data");
      view.setUint32(40, dataSize, true);

      // Write interleaved PCM data
      let offset = 44;
      let samplesWritten = 0;
      for (let ci = 0; ci < pcmChunks.length; ci++) {
        const left = pcmChunks[ci];
        const right = pcmChunksR[ci];
        for (let i = 0; i < left.length; i++) {
          const l = Math.max(-1, Math.min(1, left[i]));
          const r = Math.max(-1, Math.min(1, right[i]));
          view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7FFF, true);
          offset += 2;
          view.setInt16(offset, r < 0 ? r * 0x8000 : r * 0x7FFF, true);
          offset += 2;

          samplesWritten++;
          if (samplesWritten % 50000 === 0) {
            setExportProgress(30 + Math.round((samplesWritten / totalSamples) * 70));
          }
        }
      }

      // Download
      const exportFilename = `audio-export-${Date.now()}.wav`;
      const blob = new Blob([buffer], { type: "audio/wav" });

      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = exportFilename; a.click();
      URL.revokeObjectURL(url);

      // Save to project
      await saveExportToProject(blob, exportFilename, "audio", "audio/wav");
      audioCtx.close();
      toast.success("Exported & saved to project!");
    } catch (err) {
      console.error("Audio export error:", err);
      toast.error(`Audio export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(false); setExportProgress(0);
    }
  }, [clips]);

  // ── Video Export (WebCodecs + mp4-muxer) ──────────────────────────────

  const handleVideoExport = useCallback(async () => {
    if (clips.length === 0) { toast.warning("Add clips first"); return; }
    if (typeof VideoEncoder === "undefined") { toast.error("Use Chrome or Edge"); return; }
    setExporting(true); setExportProgress(0);
    const blobUrls: string[] = [];
    try {
      const FPS = 30, W = 1920, H = 1080, total = Math.ceil(totalDur * FPS);
      const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const M = await import("mp4-muxer");
      const muxer = new M.Muxer({ target: new M.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" });
      const enc = new VideoEncoder({ output: (ch, m) => muxer.addVideoChunk(ch, m), error: console.error });
      enc.configure({ codec: "avc1.640028", width: W, height: H, bitrate: 8_000_000, framerate: FPS });

      // Pre-load media as blobs → ImageBitmap/Video for CORS-safe canvas drawing
      toast.info("Loading media files...");
      const videoEls: Record<string, HTMLVideoElement> = {};
      const imageBitmaps: Record<string, ImageBitmap> = {};

      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        setExportProgress(Math.round((i / clips.length) * 10)); // 0-10% for loading

        try {
          let blob: Blob;

          // Try direct fetch first (works if R2 CORS is configured)
          try {
            const directRes = await fetch(c.src);
            if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
            blob = await directRes.blob();
          } catch {
            // Fallback: get presigned URL from our API
            const r2Key = c.src.replace(`${R2_PUBLIC_URL}/`, "");
            const presignRes = await fetch("/api/storyboard/download-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ r2Key, filename: c.name }),
            });
            const presignData = await presignRes.json();
            if (!presignData.downloadUrl) throw new Error("No download URL");
            const res = await fetch(presignData.downloadUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            blob = await res.blob();
          }

          if (c.type === "image") {
            // Use createImageBitmap — always works, no CORS issues
            const bmp = await createImageBitmap(blob);
            imageBitmaps[c.id] = bmp;
          } else if (c.type === "video") {
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push(blobUrl);
            const v = document.createElement("video");
            v.src = blobUrl;
            v.muted = true;
            v.preload = "auto";
            v.playsInline = true;
            await new Promise<void>(r => {
              v.oncanplaythrough = () => r();
              v.onerror = () => r();
              v.load();
              setTimeout(r, 10000);
            });
            // Seek to start to decode first frame
            v.currentTime = c.trimStart || 0.1;
            await new Promise<void>(r => { v.onseeked = () => r(); setTimeout(r, 1000); });
            videoEls[c.id] = v;
          }
        } catch (err) {
          console.error(`Failed to load ${c.name}:`, err);
          toast.error(`Cannot load: ${c.name}`);
          setExporting(false);
          blobUrls.forEach(u => URL.revokeObjectURL(u));
          return;
        }
      }

      // Helper: seek video and wait for frame to be ready
      const seekVideo = (vid: HTMLVideoElement, time: number): Promise<void> => {
        return new Promise((resolve) => {
          if (Math.abs(vid.currentTime - time) < 0.05) { resolve(); return; }
          const onSeeked = () => { vid.removeEventListener("seeked", onSeeked); resolve(); };
          vid.addEventListener("seeked", onSeeked);
          vid.currentTime = time;
          // Fallback timeout
          setTimeout(resolve, 500);
        });
      };

      toast.info("Encoding frames...");

      for (let f = 0; f < total; f++) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);

        const r = getClipAt(f / FPS);
        if (r) {
          // Apply blend mode and opacity for export
          const prevComposite = ctx.globalCompositeOperation;
          const prevAlpha = ctx.globalAlpha;
          if (r.clip.blendMode && r.clip.blendMode !== "normal") {
            ctx.globalCompositeOperation = r.clip.blendMode as GlobalCompositeOperation;
          }
          if (r.clip.opacity != null && r.clip.opacity < 100) {
            ctx.globalAlpha = r.clip.opacity / 100;
          }

          if (r.clip.type === "video") {
            const vid = videoEls[r.clip.id];
            if (vid && vid.videoWidth > 0) {
              await seekVideo(vid, r.offset);
              const sc = Math.min(W / vid.videoWidth, H / vid.videoHeight);
              const dw = vid.videoWidth * sc, dh = vid.videoHeight * sc;
              ctx.drawImage(vid, (W - dw) / 2, (H - dh) / 2, dw, dh);
            }
          } else if (r.clip.type === "image") {
            const bmp = imageBitmaps[r.clip.id];
            if (bmp) {
              const sc = Math.min(W / bmp.width, H / bmp.height);
              const dw = bmp.width * sc, dh = bmp.height * sc;
              ctx.drawImage(bmp, (W - dw) / 2, (H - dh) / 2, dw, dh);
            }
          }

          // Restore composite state
          ctx.globalCompositeOperation = prevComposite;
          ctx.globalAlpha = prevAlpha;
        }

        // Render active subtitle on export frame
        const exportTime = f / FPS;
        const activeSub = subtitleClips.find(s => exportTime >= s.startTime && exportTime < s.endTime);
        if (activeSub) {
          ctx.save();
          ctx.font = `${activeSub.fontWeight} ${activeSub.fontSize}px sans-serif`;
          ctx.textAlign = "center";
          const metrics = ctx.measureText(activeSub.text);
          const tx = W / 2;
          const ty = activeSub.position === "top" ? 60 : activeSub.position === "center" ? H / 2 : H - 40;
          // Background
          ctx.fillStyle = activeSub.backgroundColor;
          ctx.fillRect(tx - metrics.width / 2 - 12, ty - activeSub.fontSize + 4, metrics.width + 24, activeSub.fontSize + 12);
          // Text
          ctx.fillStyle = activeSub.fontColor;
          ctx.fillText(activeSub.text, tx, ty);
          ctx.restore();
        }

        const vf = new VideoFrame(canvas, { timestamp: (f / FPS) * 1e6, duration: (1 / FPS) * 1e6 });
        enc.encode(vf, { keyFrame: f % (FPS * 4) === 0 });
        vf.close();

        if (enc.encodeQueueSize > 10) {
          await new Promise<void>(r => { enc.ondequeue = () => { enc.ondequeue = null; r(); }; });
        }

        if (f % 5 === 0) setExportProgress(10 + Math.round((f / total) * 90));
      }

      // Cleanup bitmaps
      Object.values(imageBitmaps).forEach(bmp => bmp.close());
      await enc.flush(); muxer.finalize();
      const exportFilename = `export-${Date.now()}.mp4`;
      const blob = new Blob([(muxer.target as any).buffer], { type: "video/mp4" });

      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = exportFilename; a.click();
      URL.revokeObjectURL(url);

      // Save to project
      await saveExportToProject(blob, exportFilename, "video", "video/mp4");
      toast.success("Exported & saved to project!");
    } catch (err) { console.error("Export error:", err); toast.error(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally {
      setExporting(false); setExportProgress(0);
      // Clean up blob URLs
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    }
  }, [clips, totalDur, getClipAt]);

  // ── Save exported file to R2 + storyboard_files ──────────────────────

  const saveExportToProject = useCallback(async (blob: Blob, filename: string, fileType: "video" | "audio", mimeType: string) => {
    try {
      const r2Key = `${companyId}/uploads/${filename}`;

      // Get presigned upload URL
      const sigRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: r2Key, contentType: mimeType }),
      });
      const { uploadUrl } = await sigRes.json();

      // Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": mimeType },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      // Log to storyboard_files
      await logUpload({
        companyId,
        userId: user?.id,
        projectId,
        r2Key,
        filename,
        fileType,
        mimeType,
        size: blob.size,
        category: "uploads",
        categoryId: projectId,
        tags: [],
        uploadedBy: user?.id || "unknown",
        status: "ready",
      });

      toast.success(`Saved to project: ${filename}`);
    } catch (err) {
      console.error("Save to project failed:", err);
      toast.error("Failed to save to project");
    }
  }, [companyId, user, projectId, logUpload]);

  // Route export based on track type
  const handleExport = useCallback(() => {
    if (trackType === "audio") handleAudioExport();
    else handleVideoExport();
  }, [trackType, handleAudioExport, handleVideoExport]);

  // ── Keys ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      if ((e.code === "Delete" || e.code === "Backspace") && selectedClipId) removeClip(selectedClipId);
      if (e.code === "KeyS" && !e.ctrlKey && !e.metaKey) splitClip();
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyC") { e.preventDefault(); copyClip(); }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyV") { e.preventDefault(); pasteClip(); }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") { e.preventDefault(); undo(); }
      if (e.code === "ArrowLeft") setCurrentTime(t => Math.max(0, t - 0.5));
      if (e.code === "ArrowRight") setCurrentTime(t => Math.min(totalDur, t + 0.5));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [toggle, selectedClipId, removeClip, splitClip, copyClip, pasteClip, undo, totalDur]);

  // ── Render ────────────────────────────────────────────────────────────

  // Current clip for preview — always show video track in preview area
  const curVideo = getClipAtInTrack(videoClips, currentTime);
  const curAudio = getClipAtInTrack(audioClips, currentTime);
  const cur = curVideo; // Preview shows video track
  const sel = videoClips.find(c => c.id === selectedClipId) || audioClips.find(c => c.id === selectedClipId);
  const tlWidth = Math.max(totalDur * pxPerSec + 200, 500);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white select-none overflow-hidden relative">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-[#1e1e28] shrink-0 bg-[#0f0f17]">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1a1a24] transition text-[#6E6E6E] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold text-white">Video Editor</span>
            {projectName && <span className="text-xs text-[#4A4A4A]">— {projectName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || clips.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-30 text-white text-xs font-semibold rounded-lg transition"
          >
            {exporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {exportProgress}%</> : <><Download className="w-3.5 h-3.5" /> Export {trackType === "audio" ? "WAV" : "MP4"}</>}
          </button>
        </div>
      </div>

      {/* ── Preview (takes all available space) ── */}
      <div className="flex-1 flex items-center justify-center bg-black relative min-h-0">
        {/* Audio element — visible controls when audio clip is active */}
        <audio ref={audioRef} style={{ display: "none" }} preload="auto" />

        {cur?.clip.type === "video" ? (
          <video
            ref={previewRef}
            className="max-w-full max-h-full object-contain"
            playsInline
            style={{
              mixBlendMode: (cur.clip.blendMode || "normal") as any,
              opacity: (cur.clip.opacity ?? 100) / 100,
            }}
          />
        ) : cur?.clip.type === "audio" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#1a1a24] flex items-center justify-center border border-[#2a2a35]">
              <Music className="w-10 h-10 text-teal-500/60" />
            </div>
            <span className="text-sm text-[#6E6E6E]">{cur.clip.name}</span>
          </div>
        ) : cur?.clip.type === "image" ? (
          <img
            src={cur.clip.src}
            className="max-w-full max-h-full object-contain"
            alt=""
            style={{
              mixBlendMode: (cur.clip.blendMode || "normal") as any,
              opacity: (cur.clip.opacity ?? 100) / 100,
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-[#2a2a35]">
            <Film className="w-20 h-20" />
            <p className="text-sm text-[#4A4A4A]">Click <span className="text-teal-500 font-medium">+ Add Media</span> to start building your video</p>
          </div>
        )}

        {/* Subtitle overlay on preview */}
        {(() => {
          const activeSub = subtitleClips.find(s => currentTime >= s.startTime && currentTime < s.endTime);
          if (!activeSub) return null;
          return (
            <div className={`absolute left-0 right-0 pointer-events-none flex justify-center px-4 ${
              activeSub.position === "top" ? "top-4" :
              activeSub.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-4"
            }`}>
              <span
                style={{
                  fontSize: activeSub.fontSize,
                  color: activeSub.fontColor,
                  backgroundColor: activeSub.backgroundColor,
                  fontWeight: activeSub.fontWeight,
                }}
                className="px-3 py-1 rounded-md max-w-[80%] text-center"
              >
                {activeSub.text}
              </span>
            </div>
          );
        })()}

        {/* Export overlay */}
        {exporting && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 z-30">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <p className="text-white font-medium">Exporting... {exportProgress}%</p>
            <div className="w-56 h-2 bg-[#2a2a35] rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 transition-all" style={{ width: `${exportProgress}%` }} />
            </div>
          </div>
        )}

        {/* Top-right: Snapshot button */}
        {cur && (cur.clip.type === "video" || cur.clip.type === "image") && (
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={async () => {
                const addSnapshotToTrack = (blob: Blob) => {
                  const url = URL.createObjectURL(blob);
                  const snapClip: TimelineClip = {
                    id: `c-${Date.now()}-snap`,
                    type: "image",
                    src: url,
                    name: `snapshot-${formatTime(currentTime).replace(/[:.]/g, "-")}.png`,
                    duration: 3,
                    trimStart: 0,
                    trimEnd: 0,
                    originalDuration: 3,
                  };
                  setVideoClips(p => [...p, snapClip]);
                  setSelectedClipId(snapClip.id);
                  setSelectedTrack("video");
                  toast.success("Frame captured and added to video track!");
                };

                try {
                  if (cur.clip.type === "image") {
                    // For images — just reuse the source URL directly as a new clip
                    const snapClip: TimelineClip = {
                      id: `c-${Date.now()}-snap`,
                      type: "image",
                      src: cur.clip.src,
                      name: `snapshot-${formatTime(currentTime).replace(/[:.]/g, "-")}.png`,
                      duration: 3,
                      trimStart: 0,
                      trimEnd: 0,
                      originalDuration: 3,
                    };
                    setVideoClips(p => [...p, snapClip]);
                    setSelectedClipId(snapClip.id);
                    setSelectedTrack("video");
                    toast.success("Frame captured and added to video track!");
                  } else if (cur.clip.type === "video" && previewRef.current) {
                    // Fetch the video as blob, create a crossOrigin video from blob URL, then capture frame
                    toast.info("Capturing frame...");
                    const vid = previewRef.current;
                    const seekTime = vid.currentTime;

                    const res = await fetch(cur.clip.src);
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);

                    const tempVid = document.createElement("video");
                    tempVid.src = blobUrl;
                    tempVid.preload = "auto";
                    tempVid.onloadeddata = () => { tempVid.currentTime = seekTime; };
                    tempVid.onseeked = () => {
                      const w = tempVid.videoWidth || 1920;
                      const h = tempVid.videoHeight || 1080;
                      const canvas = document.createElement("canvas");
                      canvas.width = w;
                      canvas.height = h;
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
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition shadow-lg bg-[#1a1a24]/90 backdrop-blur text-[#c0c0c0] hover:text-white border border-[#2a2a35]"
              title="Capture current frame as image"
            >
              <Camera className="w-3.5 h-3.5" />
              Snapshot
            </button>
          </div>
        )}

        {/* Top-left: Add Media button */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <button
            onClick={() => setShowMedia(!showMedia)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition shadow-lg ${
              showMedia ? "bg-teal-600 text-white" : "bg-[#1a1a24]/90 backdrop-blur text-[#c0c0c0] hover:text-white border border-[#2a2a35]"
            }`}
          >
            {showMedia ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showMedia ? "Close" : "Add Media"}
          </button>

          <button
            onClick={() => { setShowFileBrowser(true); setShowMedia(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition shadow-lg bg-[#1a1a24]/90 backdrop-blur text-[#c0c0c0] hover:text-white border border-[#2a2a35]"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Browse Files
          </button>

          {/* Track type indicator */}
          {showMedia && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a24]/90 backdrop-blur rounded-lg border border-[#2a2a35] text-[10px] font-medium text-[#A0A0A0]">
              {selectedTrack === "video" ? <Film className="w-3 h-3 text-teal-500" /> : <Music className="w-3 h-3 text-purple-500" />}
              {selectedTrack === "video" ? "Video Track" : "Audio Track"}
            </div>
          )}
        </div>

        {/* Media Panel (overlay on left, like a drawer) */}
        {showMedia && (
          <div className="absolute top-12 left-3 bottom-16 w-52 bg-[#0f0f17]/95 backdrop-blur-md border border-[#2a2a35] rounded-xl overflow-hidden z-20 shadow-2xl flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {!projectFiles ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-[#3D3D3D] animate-spin" /></div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-12 text-[11px] text-[#4A4A4A]">No media files in this project</div>
              ) : (
                mediaFiles.map(file => {
                  const src = file.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file.sourceUrl || "";
                  return (
                    <button key={file._id} onClick={() => addClip(file)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1a1a24] transition text-left group">
                      {file.fileType === "video" ? (
                        <div className="w-16 h-10 rounded-md bg-black overflow-hidden shrink-0 border border-[#2a2a35]">
                          <video src={src} className="w-full h-full object-cover" muted preload="metadata"
                            onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
                        </div>
                      ) : file.fileType === "image" ? (
                        <div className="w-16 h-10 rounded-md bg-black overflow-hidden shrink-0 border border-[#2a2a35]">
                          <img src={src} className="w-full h-full object-cover" alt="" />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded-md bg-[#1a1a24] flex items-center justify-center shrink-0 border border-[#2a2a35]">
                          <Music className="w-5 h-5 text-teal-500/60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#c0c0c0] truncate">{file.filename || file.model || "Untitled"}</p>
                        <p className="text-[8px] text-[#4A4A4A] capitalize">{file.fileType}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-[#4A4A4A] opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Panel (Controls + Ruler + Timeline) ── */}
      <div className="shrink-0 bg-[#111118] border-t border-[#1e1e28] flex flex-col">

        {/* Controls bar */}
        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-b border-[#1e1e28]">
          {/* Left: clip actions */}
          <div className="flex items-center gap-1 absolute left-4">
            {sel && (
              <>
                <button onClick={splitClip} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-white hover:bg-[#1a1a24] rounded transition">
                  <Scissors className="w-3.5 h-3.5" /> Split
                </button>
                {(sel.type === "video" || sel.type === "audio") && (
                  <button onClick={() => showRangeCut ? setShowRangeCut(false) : openRangeCut()} className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition ${showRangeCut ? 'text-teal-400 bg-teal-500/10' : 'text-[#A0A0A0] hover:text-white hover:bg-[#1a1a24]'}`}>
                    <Scissors className="w-3.5 h-3.5" /> Range Cut
                  </button>
                )}
                {sel.type === "image" && (
                  <div className="flex items-center gap-0.5 px-2.5 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded-full text-[10px] text-[#A0A0A0]">
                    <Clock className="w-3 h-3 text-teal-500" />
                    <input type="number" min={1} max={30} value={sel.duration}
                      onChange={(e) => setClips(p => p.map(c => c.id !== sel.id ? c : { ...c, duration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)), originalDuration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)) }))}
                      className="w-7 px-0 py-0 bg-transparent border-none text-[10px] text-white text-center outline-none" />
                    <span>s</span>
                  </div>
                )}
                {sel.type === "video" && (
                  <button onClick={() => extractAudioFromVideo(sel)} disabled={extracting}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-teal-400 hover:bg-teal-500/10 rounded transition disabled:opacity-50">
                    {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
                    {extracting ? "Extracting..." : "Extract Audio"}
                  </button>
                )}
                {/* Blend mode (video/image only) */}
                {(sel.type === "video" || sel.type === "image") && (
                  <select
                    value={sel.blendMode || "normal"}
                    onChange={(e) => {
                      const mode = e.target.value as BlendMode;
                      setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, blendMode: mode }));
                    }}
                    className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] hover:text-white outline-none cursor-pointer"
                    title="Blend mode"
                  >
                    {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                {/* Opacity (video/image only) */}
                {(sel.type === "video" || sel.type === "image") && (
                  <div className="flex items-center gap-1 px-1.5 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded text-[10px] text-[#A0A0A0]">
                    <input
                      type="range"
                      min={0} max={100}
                      value={sel.opacity ?? 100}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, opacity: val }));
                      }}
                      className="w-12 h-1 accent-teal-500 cursor-pointer"
                      title={`Opacity: ${sel.opacity ?? 100}%`}
                    />
                    <span className="w-6 text-center tabular-nums">{sel.opacity ?? 100}%</span>
                  </div>
                )}
                <button onClick={() => removeClip(sel.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}

            {/* Subtitle controls */}
            {selectedTrack === "subtitle" && (() => {
              const selSub = subtitleClips.find(s => s.id === selectedSubtitleId);
              return (
                <>
                  <button
                    onClick={() => {
                      const newSub: SubtitleClip = {
                        id: `sub-${Date.now()}`,
                        text: "Subtitle text",
                        startTime: currentTime,
                        endTime: Math.min(currentTime + 3, totalDur || currentTime + 3),
                        position: "bottom",
                        fontSize: 32,
                        fontColor: "#FFFFFF",
                        backgroundColor: "#00000080",
                        fontWeight: "normal",
                      };
                      setSubtitleClips(p => [...p, newSub]);
                      setSelectedSubtitleId(newSub.id);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-yellow-400 hover:bg-yellow-500/10 rounded transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sub
                  </button>
                  {selSub && (
                    <>
                      <input
                        value={selSub.text}
                        onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, text: e.target.value }))}
                        className="px-2 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none w-32"
                        placeholder="Subtitle text..."
                      />
                      <select
                        value={selSub.position}
                        onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, position: e.target.value as "top" | "center" | "bottom" }))}
                        className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                      <select
                        value={selSub.fontWeight}
                        onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, fontWeight: e.target.value as "normal" | "bold" }))}
                        className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                      <input
                        type="color" value={selSub.fontColor}
                        onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, fontColor: e.target.value }))}
                        className="w-5 h-5 rounded cursor-pointer border-none"
                        title="Font color"
                      />
                      <button
                        onClick={() => { setSubtitleClips(p => p.filter(s => s.id !== selSub.id)); setSelectedSubtitleId(null); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {/* Center: playback */}
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentTime(0)} className="p-1 text-[#6E6E6E] hover:text-white transition"><SkipBack className="w-4 h-4" /></button>
            <button onClick={toggle} className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition shadow-lg">
              {playing ? <Pause className="w-4.5 h-4.5 text-black" /> : <Play className="w-4.5 h-4.5 text-black ml-0.5" />}
            </button>
            <button onClick={() => setCurrentTime(totalDur)} className="p-1 text-[#6E6E6E] hover:text-white transition"><SkipForward className="w-4 h-4" /></button>
          </div>

          {/* Right: time + zoom */}
          <div className="flex items-center gap-3 absolute right-4">
            <span ref={timeDisplayRef} className="text-[11px] text-[#6E6E6E] font-mono">{formatTime(currentTime)} / {formatTime(totalDur)}</span>
            <div className="flex items-center gap-1.5">
              <ZoomOut className="w-3 h-3 text-[#4A4A4A]" />
              <input
                type="range"
                min={2}
                max={300}
                value={pxPerSec}
                onChange={(e) => setPxPerSec(parseInt(e.target.value))}
                className="w-20 h-1 accent-teal-500 cursor-pointer"
              />
              <ZoomIn className="w-3 h-3 text-[#4A4A4A]" />
              <button
                onClick={() => { if (timelineRef.current && totalDur > 0) setPxPerSec(Math.max(2, Math.floor((timelineRef.current.clientWidth - 80) / totalDur))); }}
                className="px-3 py-1 text-[10px] font-semibold text-[#A0A0A0] hover:text-white bg-[#1a1a24] border border-[#2a2a35] rounded-full hover:border-teal-500/50 hover:bg-teal-500/10 transition"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        {/* Range Cut is rendered directly on the clip in the timeline */}

        {/* Ruler + Timeline */}
        <div
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-hidden cursor-pointer"
          style={{ height: (videoClips.length > 0 || audioClips.length > 0 || subtitleClips.length > 0) ? 340 : 60 }}
          onClick={onTimelineClick}
        >
          {videoClips.length === 0 && audioClips.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-[#2a2a35]">
              <Plus className="w-4 h-4 mr-2" /> Add clips to build your timeline
            </div>
          ) : (
            <>
              {/* Track labels (fixed left) */}
              <div className="absolute left-0 top-7 bottom-0 w-14 bg-[#111118] border-r border-[#1e1e28] z-20 flex flex-col">
                <button onClick={() => setSelectedTrack("video")}
                  className={`h-[120px] flex items-center gap-1 px-1.5 text-[8px] border-b border-[#1e1e28] transition ${selectedTrack === "video" ? "text-teal-400 bg-teal-500/5" : "text-[#6E6E6E] hover:text-[#A0A0A0]"}`}>
                  <Film className="w-3 h-3" /><span>Video</span>
                </button>
                <button onClick={() => setSelectedTrack("audio")}
                  className={`h-[100px] flex items-center gap-1 px-1.5 text-[8px] transition ${selectedTrack === "audio" ? "text-purple-400 bg-purple-500/5" : "text-[#6E6E6E] hover:text-[#A0A0A0]"}`}>
                  <Music className="w-3 h-3" /><span>Audio</span>
                </button>
                <button onClick={() => setSelectedTrack("subtitle")}
                  className={`h-[60px] flex items-center gap-1 px-1.5 text-[8px] transition ${selectedTrack === "subtitle" ? "text-yellow-400 bg-yellow-500/5" : "text-[#6E6E6E] hover:text-[#A0A0A0]"}`}>
                  <Type className="w-3 h-3" /><span>Subs</span>
                </button>
              </div>

              {/* Ruler with progress bar */}
              <div className="sticky top-0 h-7 bg-[#111118] border-b border-[#1e1e28] z-10 pointer-events-none" style={{ width: tlWidth, marginLeft: 56 }}>
                {/* Progress bar */}
                {totalDur > 0 && (
                  <div ref={progressBarRef} className="absolute bottom-0 left-0 h-[2px] bg-teal-500/40" style={{ width: currentTime * pxPerSec }} />
                )}
                {(() => {
                  // Adaptive ruler: choose tick interval based on zoom level
                  const tickInterval = pxPerSec >= 60 ? 1 : pxPerSec >= 20 ? 5 : pxPerSec >= 8 ? 10 : pxPerSec >= 4 ? 30 : 60;
                  const tickCount = Math.ceil(totalDur / tickInterval) + 2;
                  return Array.from({ length: tickCount }, (_, i) => {
                    const sec = i * tickInterval;
                    return (
                      <div key={sec} className="absolute top-0" style={{ left: sec * pxPerSec }}>
                        <div className="w-px h-3 bg-[#2a2a35]" />
                        <span className="text-[9px] text-[#4A4A4A] ml-1 select-none">{formatTime(sec)}</span>
                        {pxPerSec >= 60 && (
                          <div className="absolute top-0 w-px h-2 bg-[#1e1e28]" style={{ left: pxPerSec / 2 }} />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Video Track */}
              <div className={`absolute top-[28px] left-14 h-[120px] flex items-stretch gap-2 px-3 py-2 border-b border-[#1e1e28] ${selectedTrack === "video" ? "bg-teal-500/[0.02]" : ""}`} style={{ width: tlWidth }}>
                {videoClips.map(clip => {
                  const vd = getVisDur(clip);
                  const w = vd * pxPerSec;
                  const isSel = clip.id === selectedClipId;
                  return (
                    <div key={clip.id} data-clip draggable onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, clip.id)} onDragEnd={onDragEnd}
                      onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("video"); }}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("video"); setClipContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); }}
                      className={`relative shrink-0 rounded-xl overflow-hidden transition cursor-grab active:cursor-grabbing ${
                        isSel ? "ring-[3px] ring-teal-400 shadow-lg shadow-teal-500/30" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"
                      } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                      style={{ width: Math.max(w, 36), height: "100%" }}>
                      {clip.type === "video" && (
                        <video src={clip.src} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata"
                          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = clip.trimStart + 0.5; }} />
                      )}
                      {clip.type === "image" && (
                        <img src={clip.src} className="absolute inset-0 w-full h-full object-cover" alt="" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${clip.type === "video" ? "bg-emerald-600/90" : "bg-purple-600/90"} text-white shadow-sm`}>
                          {clip.type === "video" ? "VIDEO" : "IMAGE"}
                        </span>
                        {clip.src.startsWith("blob:") && (
                          <span className="text-[7px] font-medium px-1 py-0.5 rounded bg-amber-500/80 text-white shadow-sm" title="Unsaved — right-click to save">
                            UNSAVED
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[10px] text-white/90 font-medium truncate">{clip.name}</span>
                          {clip.blendMode && clip.blendMode !== "normal" && (
                            <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-orange-500/80 text-white shrink-0">{clip.blendMode.toUpperCase()}</span>
                          )}
                          {clip.opacity != null && clip.opacity < 100 && (
                            <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-white/20 text-white shrink-0">{clip.opacity}%</span>
                          )}
                        </div>
                        <span className="text-[9px] text-white/50 shrink-0 ml-1 bg-black/40 px-1.5 py-0.5 rounded">{formatTime(vd)}</span>
                      </div>
                      {showRangeCut && isSel && (() => {
                        const rcVd = getVisDur(clip); const rcStartPct = (rangeCutStart / rcVd) * 100; const rcEndPct = (rangeCutEnd / rcVd) * 100;
                        return <div className="absolute top-0 bottom-0 bg-red-500/25 z-20 pointer-events-none" style={{ left: `${rcStartPct}%`, width: `${rcEndPct - rcStartPct}%` }} />;
                      })()}
                      {!showRangeCut && (<>
                        <div className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-400/0 group-hover/t:bg-teal-400 transition rounded-l-xl flex items-center justify-center"><div className="w-0.5 h-8 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-teal-400/0 group-hover/t:bg-teal-400 transition rounded-r-xl flex items-center justify-center"><div className="w-0.5 h-8 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                        </div>
                      </>)}
                    </div>
                  );
                })}
              </div>

              {/* Audio Track */}
              <div className={`absolute top-[148px] left-14 h-[100px] flex items-stretch gap-2 px-3 py-2 border-b border-[#1e1e28] ${selectedTrack === "audio" ? "bg-purple-500/[0.02]" : ""}`} style={{ width: tlWidth }}>
                {audioClips.map(clip => {
                  const vd = getVisDur(clip);
                  const w = vd * pxPerSec;
                  const isSel = clip.id === selectedClipId;
                  return (
                    <div key={clip.id} data-clip draggable onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, clip.id)} onDragEnd={onDragEnd}
                      onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("audio"); }}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("audio"); setClipContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); }}
                      className={`relative shrink-0 rounded-xl overflow-hidden transition cursor-grab active:cursor-grabbing ${
                        isSel ? "ring-[3px] ring-purple-400 shadow-lg shadow-purple-500/30" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"
                      } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                      style={{ width: Math.max(w, 36), height: "100%" }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a2a] to-[#1a1a30] flex items-center justify-center">
                        <Music className="w-5 h-5 text-purple-500/30" />
                      </div>
                      <div className="absolute top-1.5 left-2">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white shadow-sm">AUDIO</span>
                      </div>
                      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                        <span className="text-[9px] text-white/90 font-medium truncate">{clip.name}</span>
                        <span className="text-[8px] text-white/50 shrink-0 ml-1 bg-black/40 px-1 py-0.5 rounded">{formatTime(vd)}</span>
                      </div>
                      {showRangeCut && isSel && (() => {
                        const rcVd = getVisDur(clip); const rcStartPct = (rangeCutStart / rcVd) * 100; const rcEndPct = (rangeCutEnd / rcVd) * 100;
                        return <div className="absolute top-0 bottom-0 bg-red-500/25 z-20 pointer-events-none" style={{ left: `${rcStartPct}%`, width: `${rcEndPct - rcStartPct}%` }} />;
                      })()}
                      {!showRangeCut && (<>
                        <div className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-400/0 group-hover/t:bg-purple-400 transition rounded-l-xl flex items-center justify-center"><div className="w-0.5 h-6 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-purple-400/0 group-hover/t:bg-purple-400 transition rounded-r-xl flex items-center justify-center"><div className="w-0.5 h-6 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                        </div>
                      </>)}
                    </div>
                  );
                })}
              </div>

              {/* Subtitle Track */}
              <div className={`absolute top-[248px] left-14 h-[60px] px-3 py-1 border-b border-[#1e1e28] ${selectedTrack === "subtitle" ? "bg-yellow-500/[0.02]" : ""}`} style={{ width: tlWidth }}>
                {subtitleClips.map(sub => {
                  const x = sub.startTime * pxPerSec;
                  const w = (sub.endTime - sub.startTime) * pxPerSec;
                  const isSel = sub.id === selectedSubtitleId;
                  return (
                    <div key={sub.id}
                      className={`absolute top-1 bottom-1 rounded-lg cursor-pointer transition ${isSel ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/20" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"}`}
                      style={{ left: x, width: Math.max(w, 30) }}
                      onClick={(e) => { e.stopPropagation(); setSelectedSubtitleId(sub.id); setSelectedTrack("subtitle"); }}
                    >
                      <div className="h-full bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 rounded-lg px-2 flex items-center overflow-hidden">
                        <span className="text-[9px] text-yellow-200/80 truncate">{sub.text}</span>
                      </div>
                    </div>
                  );
                })}
                {/* Add subtitle button (when track selected and empty area clicked) */}
                {selectedTrack === "subtitle" && subtitleClips.length === 0 && (
                  <div className="flex items-center justify-center h-full text-[10px] text-[#2a2a35]">
                    <Plus className="w-3 h-3 mr-1" /> Click "Add Sub" to add subtitles
                  </div>
                )}
              </div>

              {/* Playhead needle */}
              <div ref={playheadRef} className="absolute top-0 bottom-0 z-30" style={{ left: currentTime * pxPerSec + 56 }}>
                {/* Draggable triangle head */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing pointer-events-auto"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startTime = currentTime;
                    const onMove = (me: MouseEvent) => {
                      const dt = (me.clientX - startX) / pxPerSec;
                      const newTime = Math.max(0, Math.min(totalDur, startTime + dt));
                      setCurrentTime(newTime);
                      // If playing, reset the animation clock so playback continues from new position
                      if (playing) {
                        playStart.current = { realTime: performance.now(), offset: newTime };
                        syncPreview(newTime);
                      }
                    };
                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                >
                  <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-red-500" />
                </div>
                {/* Vertical line (top half) */}
                <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-px bg-red-500 pointer-events-none" style={{ height: "calc(50% - 9px)" }} />
                {/* Cut button in the middle */}
                <button
                  onClick={(e) => { e.stopPropagation(); splitClip(); }}
                  className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 hover:scale-110 transition shadow-[0_0_10px_rgba(239,68,68,0.4)] pointer-events-auto z-10 border-2 border-red-400/50"
                  title="Split here (S)"
                >
                  <Scissors className="w-4 h-4 text-white" />
                </button>
                {/* Vertical line (bottom half) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-red-500 pointer-events-none" style={{ height: "calc(50% - 13px)" }} />
              </div>
            </>
          )}

              {/* Range Cut needles — full timeline height, same level as playhead */}
              {showRangeCut && sel && (() => {
                const rcVd = getVisDur(sel);
                // Calculate the selected clip's X offset in the timeline
                let clipOffset = 0;
                for (const c of clips) {
                  if (c.id === sel.id) break;
                  clipOffset += getVisDur(c) * pxPerSec + 8; // 8px = gap-2
                }
                const rcStartX = clipOffset + (rangeCutStart / rcVd) * (getVisDur(sel) * pxPerSec) + 56 + 12; // 56=left-14, 12=px-3
                const rcEndX = clipOffset + (rangeCutEnd / rcVd) * (getVisDur(sel) * pxPerSec) + 56 + 12;

                const makeDrag = (side: "start" | "end") => (e: React.MouseEvent) => {
                  e.stopPropagation();
                  const clipW = getVisDur(sel) * pxPerSec;
                  const clipLeft = clipOffset + 56 + 12;
                  const tl = timelineRef.current;
                  const onMove = (me: MouseEvent) => {
                    if (!tl) return;
                    const tlRect = tl.getBoundingClientRect();
                    const x = me.clientX - tlRect.left + tl.scrollLeft - clipLeft;
                    const t = parseFloat((Math.max(0, Math.min(1, x / clipW)) * rcVd).toFixed(1));
                    if (side === "start") setRangeCutStart(Math.max(0, Math.min(t, rangeCutEnd - 0.5)));
                    else setRangeCutEnd(Math.max(rangeCutStart + 0.5, Math.min(t, rcVd)));
                  };
                  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                };

                return (
                  <>
                    {/* Start needle — green */}
                    <div className="absolute top-0 bottom-0 z-30" style={{ left: rcStartX }}>
                      <div className="absolute top-0 bottom-[9px] left-1/2 -translate-x-1/2 w-px bg-green-400 pointer-events-none" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-green-400 pointer-events-none" />
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto" onMouseDown={makeDrag("start")} />
                    </div>

                    {/* End needle — red */}
                    <div className="absolute top-0 bottom-0 z-30" style={{ left: rcEndX }}>
                      <div className="absolute top-0 bottom-[9px] left-1/2 -translate-x-1/2 w-px bg-red-400 pointer-events-none" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-red-400 pointer-events-none" />
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto" onMouseDown={makeDrag("end")} />
                    </div>

                    {/* CUT button — centered between needles */}
                    <div className="absolute z-30 flex items-center justify-center pointer-events-none" style={{ left: rcStartX, width: rcEndX - rcStartX, top: "50%", transform: "translateY(-50%)" }}>
                      <button onClick={(e) => { e.stopPropagation(); applyRangeCut(); }}
                        className="pointer-events-auto px-5 py-2 bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 transition border border-red-400/50">
                        CUT
                      </button>
                    </div>
                  </>
                );
              })()}

        </div>
      </div>
      {/* Clip Context Menu */}
      {clipContextMenu && (() => {
        const ctxClip = videoClips.find(c => c.id === clipContextMenu.clipId) || audioClips.find(c => c.id === clipContextMenu.clipId);
        if (!ctxClip) return null;
        return (
          <div
            className="fixed bg-[#1e1e28] border border-[#3D3D3D] rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1 min-w-[180px]"
            style={{ left: clipContextMenu.x, top: clipContextMenu.y, zIndex: 99999 }}
            onClick={() => setClipContextMenu(null)}
          >
            <button
              onClick={() => saveClipToUploads(ctxClip)}
              disabled={saving}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-teal-400 hover:bg-[#2a2a35] transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save to Uploads"}
            </button>
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = ctxClip.src;
                link.download = ctxClip.name;
                link.click();
                setClipContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#A0A0A0] hover:bg-[#2a2a35] hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            {ctxClip.type === "video" && (
              <button
                onClick={() => { extractAudioFromVideo(ctxClip); setClipContextMenu(null); }}
                disabled={extracting}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#A0A0A0] hover:bg-[#2a2a35] hover:text-white transition-colors disabled:opacity-50"
              >
                <Music className="w-3.5 h-3.5" />
                {extracting ? "Extracting..." : "Extract Audio"}
              </button>
            )}
            <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
            <button
              onClick={() => { removeClip(ctxClip.id); setClipContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-[#2a2a35] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        );
      })()}

      {/* Close context menu on click outside */}
      {clipContextMenu && (
        <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setClipContextMenu(null)} />
      )}

      {/* FileBrowser */}
      {showFileBrowser && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowFileBrowser(false)}
          onSelectFile={(url, type) => {
            if (type === "image" || type === "video" || type === "audio") {
              addClipFromUrl(url, type);
            }
          }}
        />
      )}
    </div>
  );
}
