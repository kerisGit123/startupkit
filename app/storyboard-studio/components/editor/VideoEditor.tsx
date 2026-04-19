"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Film, Music, Image, Play, Pause, Scissors, Trash2,
  ZoomIn, ZoomOut, Download, Plus, Loader2, Clock,
  SkipBack, SkipForward, PanelLeftOpen, PanelLeftClose, X,
} from "lucide-react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

// ─── Types ──────────────────────────────────────────────────────────────

interface TimelineClip {
  id: string;
  type: "video" | "image" | "audio";
  src: string;
  name: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  originalDuration: number;
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
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [pxPerSec, setPxPerSec] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
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

  // Undo system — push state before destructive actions
  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), [...clips]]);
    setHistoryIndex(prev => prev + 1);
  }, [clips, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    setClips(history[historyIndex]);
    setHistoryIndex(prev => prev - 1);
    toast.success("Undone");
  }, [history, historyIndex]);

  // Track type: determined by first clip. Empty = unlocked (show all files)
  const trackType: "video" | "audio" | null = useMemo(() => {
    if (clips.length === 0) return null;
    return clips[0].type === "audio" ? "audio" : "video";
  }, [clips]);

  const mediaFiles = useMemo(() => {
    if (!projectFiles) return [];
    return projectFiles
      .filter(f => {
        if (f.status === "deleted" || f.deletedAt) return false;
        if (!f.r2Key && !f.sourceUrl) return false;
        if ((f.size ?? 0) <= 0) return false;
        // If track is locked, only show matching type
        if (trackType === "video") return f.fileType === "video" || f.fileType === "image";
        if (trackType === "audio") return f.fileType === "audio";
        // Unlocked — show everything
        return f.fileType === "video" || f.fileType === "image" || f.fileType === "audio";
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [projectFiles, trackType]);

  const totalDur = clips.reduce((s, c) => s + getVisDur(c), 0);

  // ── Playback ──────────────────────────────────────────────────────────

  const getClipAt = useCallback((t: number) => {
    let e = 0;
    for (let i = 0; i < clips.length; i++) {
      const d = getVisDur(clips[i]);
      if (t < e + d) return { clip: clips[i], offset: t - e + clips[i].trimStart, idx: i };
      e += d;
    }
    return null;
  }, [clips]);

  const lastSyncClipId = useRef<string>("");

  const syncPreview = useCallback((t: number) => {
    const r = getClipAt(t);
    if (!r) return;

    const clipChanged = lastSyncClipId.current !== r.clip.id;
    lastSyncClipId.current = r.clip.id;

    if (r.clip.type === "video" && previewRef.current) {
      if (clipChanged) {
        const vid = previewRef.current;
        vid.src = r.clip.src;
        vid.currentTime = r.offset;
        if (playing) {
          vid.oncanplay = () => { vid.oncanplay = null; vid.play().catch(() => {}); };
        }
      } else if (!playing) {
        previewRef.current.currentTime = r.offset;
      }
    }

    if (r.clip.type === "audio" && audioRef.current) {
      if (clipChanged) {
        const aud = audioRef.current;
        aud.src = r.clip.src;
        aud.currentTime = r.offset;
        if (playing) {
          aud.oncanplay = () => { aud.oncanplay = null; aud.play().catch(() => {}); };
        }
      } else if (!playing) {
        audioRef.current.currentTime = r.offset;
      }
    }

    // Pause media when switching away from their type
    if (r.clip.type !== "audio" && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    if (r.clip.type !== "video" && previewRef.current && !previewRef.current.paused) {
      previewRef.current.pause();
    }
  }, [getClipAt, playing]);

  const startPlay = useCallback(() => {
    if (totalDur <= 0) return;
    setPlaying(true);
    playStart.current = { realTime: performance.now(), offset: currentTime };

    // Set src and play — wait for canplay before calling play()
    const curClip = getClipAt(currentTime);
    if (curClip) {
      if (curClip.clip.type === "video" && previewRef.current) {
        const vid = previewRef.current;
        vid.src = curClip.clip.src;
        vid.currentTime = curClip.offset;
        vid.oncanplay = () => { vid.oncanplay = null; vid.play().catch(() => {}); };
      }
      if (curClip.clip.type === "audio" && audioRef.current) {
        const aud = audioRef.current;
        aud.src = curClip.clip.src;
        aud.currentTime = curClip.offset;
        aud.oncanplay = () => { aud.oncanplay = null; aud.play().catch(() => {}); };
      }
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

      // Update React state only 4 times per second (for UI that depends on currentTime)
      if (Math.floor(t * 4) !== Math.floor((t - 1/60) * 4)) {
        setCurrentTime(t);
      }

      // Only sync media on clip boundaries
      const r = getClipAt(t);
      if (r && lastSyncClipId.current !== r.clip.id) {
        syncPreview(t);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [totalDur, currentTime, syncPreview]);

  const stopPlay = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    if (previewRef.current) previewRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const toggle = useCallback(() => { playing ? stopPlay() : startPlay(); }, [playing, startPlay, stopPlay]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // ── Clip Actions ──────────────────────────────────────────────────────

  const addClip = useCallback(async (file: any) => {
    const src = file.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file.sourceUrl || "";
    let dur = 3;
    if (file.fileType === "video" || file.fileType === "audio") {
      dur = await new Promise<number>(r => {
        const el = file.fileType === "video" ? document.createElement("video") : document.createElement("audio");
        el.src = src; el.preload = "metadata";
        el.onloadedmetadata = () => r(el.duration || 5);
        el.onerror = () => r(5); setTimeout(() => r(5), 5000);
      });
    }
    const c: TimelineClip = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: file.fileType === "video" ? "video" : file.fileType === "image" ? "image" : "audio",
      src, name: file.filename || file.model || "Untitled",
      duration: dur, trimStart: 0, trimEnd: 0, originalDuration: dur,
    };
    setClips(p => [...p, c]);
    setSelectedClipId(c.id);
    setShowMedia(false);
  }, []);

  const removeClip = useCallback((id: string) => {
    pushHistory();
    setClips(p => p.filter(c => c.id !== id));
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
    // Insert after selected clip, or at end
    const idx = selectedClipId ? clips.findIndex(c => c.id === selectedClipId) : -1;
    if (idx >= 0) {
      setClips(p => [...p.slice(0, idx + 1), pasted, ...p.slice(idx + 1)]);
    } else {
      setClips(p => [...p, pasted]);
    }
    setSelectedClipId(pasted.id);
    toast.success("Clip pasted");
  }, [clipboard, clips, selectedClipId]);

  // ── Drag & Trim ──────────────────────────────────────────────────────

  const onDragStart = useCallback((e: React.DragEvent, id: string) => { setDraggedClipId(id); e.dataTransfer.effectAllowed = "move"; }, []);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDrop = useCallback((e: React.DragEvent, tid: string) => {
    e.preventDefault();
    if (!draggedClipId || draggedClipId === tid) return;
    setClips(p => { const a = [...p]; const fi = a.findIndex(c => c.id === draggedClipId); const ti = a.findIndex(c => c.id === tid); if (fi < 0 || ti < 0) return p; const [m] = a.splice(fi, 1); a.splice(ti, 0, m); return a; });
    setDraggedClipId(null);
  }, [draggedClipId]);

  const onTrimDown = useCallback((e: React.MouseEvent, id: string, side: "left" | "right") => {
    e.stopPropagation(); e.preventDefault();
    const c = clips.find(x => x.id === id);
    if (c) setTrimming({ clipId: id, side, startX: e.clientX, origTS: c.trimStart, origTE: c.trimEnd });
  }, [clips]);

  useEffect(() => {
    if (!trimming) return;
    const move = (e: MouseEvent) => {
      const dt = (e.clientX - trimming.startX) / pxPerSec;
      setClips(p => p.map(c => {
        if (c.id !== trimming.clipId) return c;
        if (trimming.side === "left") return { ...c, trimStart: Math.max(0, Math.min(trimming.origTS + dt, c.duration - c.trimEnd - 0.1)) };
        return { ...c, trimEnd: Math.max(0, Math.min(trimming.origTE - dt, c.duration - c.trimStart - 0.1)) };
      }));
    };
    const up = () => setTrimming(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [trimming, pxPerSec]);

  const onTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const r = timelineRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min((e.clientX - r.left + timelineRef.current.scrollLeft - 56) / pxPerSec, totalDur));
    setCurrentTime(t); syncPreview(t);
  }, [pxPerSec, totalDur, syncPreview]);

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
      const blob = new Blob([buffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audio-export-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);

      audioCtx.close();
      toast.success("Audio exported as WAV!");
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
      const blobUrls: string[] = [];

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
      const blob = new Blob([(muxer.target as any).buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `export-${Date.now()}.mp4`; a.click(); URL.revokeObjectURL(url);
      toast.success("Exported!");
    } catch (err) { console.error("Export error:", err); toast.error(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally {
      setExporting(false); setExportProgress(0);
      // Clean up blob URLs
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    }
  }, [clips, totalDur, getClipAt]);

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

  const cur = getClipAt(currentTime);
  const sel = clips.find(c => c.id === selectedClipId);
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
          <video ref={previewRef} src={cur.clip.src} className="max-w-full max-h-full object-contain" playsInline crossOrigin="anonymous" />
        ) : cur?.clip.type === "audio" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#1a1a24] flex items-center justify-center border border-[#2a2a35]">
              <Music className="w-10 h-10 text-teal-500/60" />
            </div>
            <span className="text-sm text-[#6E6E6E]">{cur.clip.name}</span>
          </div>
        ) : cur?.clip.type === "image" ? (
          <img src={cur.clip.src} className="max-w-full max-h-full object-contain" alt="" />
        ) : (
          <div className="flex flex-col items-center gap-4 text-[#2a2a35]">
            <Film className="w-20 h-20" />
            <p className="text-sm text-[#4A4A4A]">Click <span className="text-teal-500 font-medium">+ Add Media</span> to start building your video</p>
          </div>
        )}

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

          {/* Track type indicator */}
          {showMedia && trackType && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1a24]/90 backdrop-blur rounded-lg border border-[#2a2a35] text-[10px] font-medium text-[#A0A0A0]">
              {trackType === "video" ? <Film className="w-3 h-3 text-teal-500" /> : <Music className="w-3 h-3 text-teal-500" />}
              {trackType === "video" ? "Video Track" : "Audio Track"}
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
                {sel.type === "image" && (
                  <div className="flex items-center gap-0.5 px-2.5 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded-full text-[10px] text-[#A0A0A0]">
                    <Clock className="w-3 h-3 text-teal-500" />
                    <input type="number" min={1} max={30} value={sel.duration}
                      onChange={(e) => setClips(p => p.map(c => c.id !== sel.id ? c : { ...c, duration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)), originalDuration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)) }))}
                      className="w-7 px-0 py-0 bg-transparent border-none text-[10px] text-white text-center outline-none" />
                    <span>s</span>
                  </div>
                )}
                <button onClick={() => removeClip(sel.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
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
                min={30}
                max={300}
                value={pxPerSec}
                onChange={(e) => setPxPerSec(parseInt(e.target.value))}
                className="w-20 h-1 accent-teal-500 cursor-pointer"
              />
              <ZoomIn className="w-3 h-3 text-[#4A4A4A]" />
              <button
                onClick={() => { if (timelineRef.current && totalDur > 0) setPxPerSec(Math.max(30, Math.floor((timelineRef.current.clientWidth - 80) / totalDur))); }}
                className="px-3 py-1 text-[10px] font-semibold text-[#A0A0A0] hover:text-white bg-[#1a1a24] border border-[#2a2a35] rounded-full hover:border-teal-500/50 hover:bg-teal-500/10 transition"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        {/* Ruler + Timeline */}
        <div
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-hidden cursor-pointer"
          style={{ height: clips.length > 0 ? 200 : 60 }}
          onClick={onTimelineClick}
        >
          {clips.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-[#2a2a35]">
              <Plus className="w-4 h-4 mr-2" /> Add clips to build your timeline
            </div>
          ) : (
            <>
              {/* Track label (fixed left) */}
              <div className="absolute left-0 top-7 bottom-0 w-14 bg-[#111118] border-r border-[#1e1e28] z-20 flex flex-col justify-center gap-1 px-1.5">
                <div className="flex items-center gap-1 text-[8px] text-[#6E6E6E]">
                  {trackType === "audio" ? <Music className="w-3 h-3 text-teal-500/60" /> : <Film className="w-3 h-3 text-teal-500/60" />}
                  <span>{trackType === "audio" ? "Audio" : "Video"}</span>
                </div>
              </div>

              {/* Ruler with progress bar */}
              <div className="sticky top-0 h-7 bg-[#111118] border-b border-[#1e1e28] z-10 pointer-events-none" style={{ width: tlWidth, marginLeft: 56 }}>
                {/* Progress bar */}
                {totalDur > 0 && (
                  <div ref={progressBarRef} className="absolute bottom-0 left-0 h-[2px] bg-teal-500/40" style={{ width: currentTime * pxPerSec }} />
                )}
                {Array.from({ length: Math.ceil(totalDur) + 2 }, (_, i) => (
                  <div key={i} className="absolute top-0" style={{ left: i * pxPerSec }}>
                    <div className="w-px h-3 bg-[#2a2a35]" />
                    <span className="text-[9px] text-[#4A4A4A] ml-1 select-none">{formatTime(i)}</span>
                    {pxPerSec >= 60 && (
                      <div className="absolute top-0 w-px h-2 bg-[#1e1e28]" style={{ left: pxPerSec / 2 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Clip track */}
              <div className="absolute top-12 left-14 bottom-8 flex items-stretch gap-2 px-3" style={{ width: tlWidth }}>
                {clips.map(clip => {
                  const vd = getVisDur(clip);
                  const w = vd * pxPerSec;
                  const isSel = clip.id === selectedClipId;

                  return (
                    <div key={clip.id} draggable onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, clip.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }}
                      className={`relative shrink-0 rounded-xl overflow-hidden transition cursor-grab active:cursor-grabbing ${
                        isSel ? "ring-[3px] ring-teal-400 shadow-lg shadow-teal-500/30" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"
                      } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                      style={{ width: Math.max(w, 36), height: "100%" }}>

                      {/* Full thumbnail */}
                      {clip.type === "video" && (
                        <video src={clip.src} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata"
                          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = clip.trimStart + 0.5; }} />
                      )}
                      {clip.type === "image" && (
                        <img src={clip.src} className="absolute inset-0 w-full h-full object-cover" alt="" />
                      )}
                      {clip.type === "audio" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a2a] to-[#1a1a30] flex items-center justify-center">
                          <Music className="w-6 h-6 text-teal-500/30" />
                        </div>
                      )}

                      {/* Gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                          clip.type === "video" ? "bg-emerald-600/90" : clip.type === "image" ? "bg-purple-600/90" : "bg-blue-600/90"
                        } text-white shadow-sm`}>
                          {clip.type === "video" ? "VIDEO" : clip.type === "image" ? "IMAGE" : "AUDIO"}
                        </span>
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-[10px] text-white/90 font-medium truncate">{clip.name}</span>
                        <span className="text-[9px] text-white/50 shrink-0 ml-1 bg-black/40 px-1.5 py-0.5 rounded">{formatTime(vd)}</span>
                      </div>

                      {/* Trim handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-400/0 group-hover/t:bg-teal-400 transition rounded-l-xl flex items-center justify-center">
                          <div className="w-0.5 h-8 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" />
                        </div>
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-teal-400/0 group-hover/t:bg-teal-400 transition rounded-r-xl flex items-center justify-center">
                          <div className="w-0.5 h-8 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      setCurrentTime(Math.max(0, Math.min(totalDur, startTime + dt)));
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
        </div>
      </div>
    </div>
  );
}
