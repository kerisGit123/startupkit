"use client";

import { useCallback, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { TimelineClip, SubtitleClip, OverlayLayer, R2_PUBLIC_URL, getVisDur, getClipAtTime, getTransitionClips, getTransitionLayers } from "./types";

interface UseExportParams {
  videoClips: TimelineClip[];
  audioClips: TimelineClip[];
  subtitleClips: SubtitleClip[];
  overlayLayers: OverlayLayer[];
  totalDur: number;
  selectedTrack: "video" | "audio" | "overlay";
  bgColor?: string;
  canvasSize?: { w: number; h: number };
  companyId: string | undefined;
  userId: string | undefined;
  projectId: Id<"storyboard_projects">;
  logUpload: any;
}

export function useExport({
  videoClips, audioClips, subtitleClips, overlayLayers, bgColor, canvasSize,
  totalDur, selectedTrack, companyId, userId, projectId, logUpload,
}: UseExportParams) {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const saveExportToProject = useCallback(async (blob: Blob, filename: string, fileType: "video" | "audio", mimeType: string) => {
    try {
      const r2Key = `${companyId}/uploads/${filename}`;
      const sigRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: r2Key, contentType: mimeType }),
      });
      const { uploadUrl } = await sigRes.json();
      const uploadRes = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
      if (!uploadRes.ok) throw new Error("Upload failed");
      await logUpload({
        companyId, userId, projectId, r2Key, filename, fileType, mimeType,
        size: blob.size, category: "uploads", categoryId: projectId,
        tags: [], uploadedBy: userId || "unknown", status: "ready",
      });
      toast.success(`Saved to project: ${filename}`);
    } catch (err) {
      console.error("Save to project failed:", err);
      toast.error("Failed to save to project");
    }
  }, [companyId, userId, projectId, logUpload]);

  // ── Audio Export (WAV) ──

  const handleAudioExport = useCallback(async () => {
    if (audioClips.length === 0) { toast.warning("Add audio clips first"); return; }
    setExporting(true); setExportProgress(0);
    try {
      const SAMPLE_RATE = 44100;
      const NUM_CHANNELS = 2;
      toast.info("Loading audio files...");
      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
      const pcmChunks: Float32Array[] = [];
      const pcmChunksR: Float32Array[] = [];

      for (let i = 0; i < audioClips.length; i++) {
        const c = audioClips[i];
        setExportProgress(Math.round((i / audioClips.length) * 30));
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
      const totalSamples = pcmChunks.reduce((s, c) => s + c.length, 0);
      const dataSize = totalSamples * NUM_CHANNELS * 2;
      const fileSize = 44 + dataSize;
      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, "RIFF");
      view.setUint32(4, fileSize - 8, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, NUM_CHANNELS, true);
      view.setUint32(24, SAMPLE_RATE, true);
      view.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * 2, true);
      view.setUint16(32, NUM_CHANNELS * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, "data");
      view.setUint32(40, dataSize, true);

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

      const exportFilename = `audio-export-${Date.now()}.wav`;
      const wavBlob = new Blob([buffer], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url; a.download = exportFilename; a.click();
      URL.revokeObjectURL(url);
      audioCtx.close();
      toast.success("Export downloaded!");
    } catch (err) {
      console.error("Audio export error:", err);
      toast.error(`Audio export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(false); setExportProgress(0);
    }
  }, [audioClips, saveExportToProject]);

  // ── Video Export (WebCodecs + mp4-muxer) ──

  const handleVideoExport = useCallback(async () => {
    if (videoClips.length === 0 && overlayLayers.length === 0) { toast.warning("Add clips or layers first"); return; }
    if (typeof VideoEncoder === "undefined") { toast.error("Use Chrome or Edge"); return; }
    setExporting(true); setExportProgress(0);
    const blobUrls: string[] = [];
    try {
      const FPS = 30, W = canvasSize?.w || 1920, H = canvasSize?.h || 1080, AUDIO_SR = 44100, total = Math.round(totalDur * FPS);
      const hasVideoWithAudio = videoClips.some(c => c.type === "video");
      const hasOverlayVideo = overlayLayers.some(l => l.type === "video" && l.src && (l.visible ?? true));
      const hasAudio = audioClips.length > 0 || hasVideoWithAudio || hasOverlayVideo;
      const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const M = await import("mp4-muxer");
      const muxerConfig: ConstructorParameters<typeof M.Muxer>[0] = {
        target: new M.ArrayBufferTarget(),
        video: { codec: "avc", width: W, height: H },
        fastStart: "in-memory",
      };
      if (hasAudio) muxerConfig.audio = { codec: "aac", numberOfChannels: 2, sampleRate: AUDIO_SR };
      const muxer = new M.Muxer(muxerConfig);
      const enc = new VideoEncoder({ output: (ch, m) => muxer.addVideoChunk(ch, m), error: console.error });
      enc.configure({ codec: "avc1.640028", width: W, height: H, bitrate: 8_000_000, framerate: FPS });

      let audioEnc: AudioEncoder | null = null;
      if (hasAudio) {
        audioEnc = new AudioEncoder({ output: (ch, m) => muxer.addAudioChunk(ch, m), error: console.error });
        audioEnc.configure({ codec: "mp4a.40.2", sampleRate: AUDIO_SR, numberOfChannels: 2, bitrate: 128_000 });
      }

      // Pre-load video/image clips as blobs
      toast.info("Loading media files...");
      const videoEls: Record<string, HTMLVideoElement> = {};
      const imageBitmaps: Record<string, ImageBitmap> = {};

      for (let i = 0; i < videoClips.length; i++) {
        const c = videoClips[i];
        setExportProgress(Math.round((i / videoClips.length) * 10));
        try {
          let blob: Blob;
          try {
            const directRes = await fetch(c.src);
            if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
            blob = await directRes.blob();
          } catch {
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
            imageBitmaps[c.id] = await createImageBitmap(blob);
          } else if (c.type === "video") {
            const blobUrl = URL.createObjectURL(blob);
            blobUrls.push(blobUrl);
            const v = document.createElement("video");
            v.src = blobUrl; v.muted = true; v.preload = "auto"; v.playsInline = true;
            await new Promise<void>(r => {
              v.oncanplaythrough = () => r(); v.onerror = () => r(); v.load(); setTimeout(r, 10000);
            });
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

      // Shared fetch helper with presigned URL fallback
      const fetchBlob = async (src: string, name: string): Promise<Blob> => {
        try {
          const res = await fetch(src);
          if (!res.ok) throw new Error();
          return await res.blob();
        } catch {
          const r2Key = src.replace(`${R2_PUBLIC_URL}/`, "");
          const presignRes = await fetch("/api/storyboard/download-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ r2Key, filename: name }),
          });
          const { downloadUrl } = await presignRes.json();
          const res = await fetch(downloadUrl);
          return await res.blob();
        }
      };

      // Pre-load overlay images/videos
      const overlayBitmaps: Record<string, ImageBitmap> = {};
      const overlayVideos: Record<string, HTMLVideoElement> = {};
      const overlayBlobs: Record<string, Blob> = {}; // keep blobs for audio extraction
      for (const layer of overlayLayers) {
        if ((layer.type === "image" || layer.type === "video") && layer.src && (layer.visible ?? true)) {
          try {
            const blob = await fetchBlob(layer.src, layer.src.split("/").pop() || layer.id);
            if (layer.type === "image") {
              overlayBitmaps[layer.id] = await createImageBitmap(blob);
            } else {
              overlayBlobs[layer.id] = blob;
              const blobUrl = URL.createObjectURL(blob);
              blobUrls.push(blobUrl);
              const v = document.createElement("video");
              v.src = blobUrl; v.muted = true; v.preload = "auto"; v.playsInline = true;
              await new Promise<void>(r => { v.oncanplaythrough = () => r(); v.onerror = () => r(); v.load(); setTimeout(r, 8000); });
              overlayVideos[layer.id] = v;
            }
          } catch (err) {
            console.error(`Failed to load overlay: ${layer.id}`, err);
          }
        }
      }

      // Load & mix audio clips + video-embedded audio into stereo buffer
      let mixedAudioL: Float32Array | null = null;
      let mixedAudioR: Float32Array | null = null;
      if (hasAudio) {
        const totalAudioSamples = Math.ceil(totalDur * AUDIO_SR);
        mixedAudioL = new Float32Array(totalAudioSamples);
        mixedAudioR = new Float32Array(totalAudioSamples);
        const audioCtx = new AudioContext({ sampleRate: AUDIO_SR });

        // Mix audio track clips
        let audioTimeOffset = 0;
        for (const ac of audioClips) {
          const audioBlob = await fetchBlob(ac.src, ac.name);
          const audioBuf = await audioCtx.decodeAudioData(await audioBlob.arrayBuffer());
          const startSample = Math.floor(ac.trimStart * audioBuf.sampleRate);
          const endSample = Math.floor((audioBuf.duration - ac.trimEnd) * audioBuf.sampleRate);
          const left = audioBuf.getChannelData(0).slice(startSample, endSample);
          const right = audioBuf.numberOfChannels > 1
            ? audioBuf.getChannelData(1).slice(startSample, endSample)
            : left;
          const destOffset = Math.round(audioTimeOffset * AUDIO_SR);
          for (let i = 0; i < left.length && destOffset + i < totalAudioSamples; i++) {
            mixedAudioL![destOffset + i] += left[i];
            mixedAudioR![destOffset + i] += right[i];
          }
          audioTimeOffset += getVisDur(ac);
        }

        // Mix embedded audio from video track clips
        let videoTimeOffset = 0;
        for (const vc of videoClips) {
          if (vc.type === "video") {
            try {
              const videoBlob = await fetchBlob(vc.src, vc.name);
              const audioBuf = await audioCtx.decodeAudioData(await videoBlob.arrayBuffer());
              const startSample = Math.floor(vc.trimStart * audioBuf.sampleRate);
              const endSample = Math.floor((audioBuf.duration - vc.trimEnd) * audioBuf.sampleRate);
              const left = audioBuf.getChannelData(0).slice(startSample, endSample);
              const right = audioBuf.numberOfChannels > 1
                ? audioBuf.getChannelData(1).slice(startSample, endSample)
                : left;
              const destOffset = Math.round(videoTimeOffset * AUDIO_SR);
              for (let i = 0; i < left.length && destOffset + i < totalAudioSamples; i++) {
                mixedAudioL![destOffset + i] += left[i];
                mixedAudioR![destOffset + i] += right[i];
              }
            } catch {
              // Video may not have audio track — skip silently
            }
          }
          videoTimeOffset += getVisDur(vc);
        }

        // Mix audio from overlay video layers (reuse cached blobs from preloading)
        for (const layer of overlayLayers) {
          if (layer.type === "video" && layer.src && (layer.visible ?? true)) {
            try {
              const cachedBlob = overlayBlobs[layer.id] || await fetchBlob(layer.src, layer.src.split("/").pop() || layer.id);
              const audioBuf = await audioCtx.decodeAudioData(await cachedBlob.arrayBuffer());
              const layerDur = layer.endTime - layer.startTime;
              const left = audioBuf.getChannelData(0);
              const right = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : left;
              const destOffset = Math.round(layer.startTime * AUDIO_SR);
              const maxSamples = Math.min(left.length, Math.round(layerDur * audioBuf.sampleRate));
              for (let i = 0; i < maxSamples && destOffset + i < totalAudioSamples; i++) {
                mixedAudioL![destOffset + i] += left[i];
                mixedAudioR![destOffset + i] += right[i];
              }
            } catch {
              // Overlay video may not have audio — skip
            }
          }
        }

        audioCtx.close();
      }

      const seekVideo = (vid: HTMLVideoElement, time: number): Promise<void> => {
        return new Promise((resolve) => {
          // Skip seek if already close enough (within half a frame)
          if (Math.abs(vid.currentTime - time) < 0.5 / FPS) { resolve(); return; }
          const onSeeked = () => { vid.removeEventListener("seeked", onSeeked); resolve(); };
          vid.addEventListener("seeked", onSeeked);
          vid.currentTime = time;
          setTimeout(resolve, 300);
        });
      };

      // Pre-seek all video clips to their start positions
      for (const c of videoClips) {
        if (c.type === "video" && videoEls[c.id]) {
          const vid = videoEls[c.id];
          vid.currentTime = c.trimStart;
          await new Promise<void>(r => { vid.onseeked = () => { vid.onseeked = null; r(); }; setTimeout(r, 500); });
        }
      }

      // Pre-seek overlay videos to time 0
      for (const layer of overlayLayers) {
        if (layer.type === "video" && overlayVideos[layer.id]) {
          const vid = overlayVideos[layer.id];
          vid.currentTime = 0;
          await new Promise<void>(r => { vid.onseeked = () => { vid.onseeked = null; r(); }; setTimeout(r, 500); });
        }
      }

      toast.info("Encoding frames...");

      // Track which clip was last drawn to avoid unnecessary seeks
      let lastVideoClipId = "";

      for (let f = 0; f < total; f++) {
        ctx.fillStyle = bgColor || "#000000";
        ctx.fillRect(0, 0, W, H);

        const r = getClipAtTime(videoClips, f / FPS);
        if (r) {
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
              // Only seek if clip changed or time drifted too far
              if (lastVideoClipId !== r.clip.id) {
                await seekVideo(vid, r.offset);
                lastVideoClipId = r.clip.id;
              } else if (Math.abs(vid.currentTime - r.offset) > 1 / FPS) {
                await seekVideo(vid, r.offset);
              }
              ctx.drawImage(vid, 0, 0, W, H);
              // Advance video by one frame for next iteration
              vid.currentTime = r.offset + 1 / FPS;
            }
          } else if (r.clip.type === "image") {
            const bmp = imageBitmaps[r.clip.id];
            if (bmp) {
              ctx.drawImage(bmp, 0, 0, W, H);
            }
            lastVideoClipId = "";
          }
          ctx.globalCompositeOperation = prevComposite;
          ctx.globalAlpha = prevAlpha;
        } else {
          lastVideoClipId = "";
        }

        // Render video-track transition effects (overlay layer transitions are handled inline below)
        const exportTime2 = f / FPS;
        const activeTrans = overlayLayers.find(l => l.type === "transition" && exportTime2 >= l.startTime && exportTime2 < l.endTime && (l.visible ?? true));
        let transP = 0;
        let transLayerA: OverlayLayer | null = null;
        let transLayerB: OverlayLayer | null = null;
        if (activeTrans) {
          transP = (exportTime2 - activeTrans.startTime) / (activeTrans.endTime - activeTrans.startTime);
          const tl = getTransitionLayers(overlayLayers, activeTrans.startTime, activeTrans.endTime);
          transLayerA = tl.layerA;
          transLayerB = tl.layerB;

          // Video-track transitions only (when no overlay layers match)
          if (!transLayerA && !transLayerB) {
            const tt = activeTrans.transitionType || "crossfade";
            const tc = getTransitionClips(videoClips, activeTrans.startTime, activeTrans.endTime);
            const clipB = tc.clipB?.clip;
            const hasB = !!(clipB && (clipB.type === "image" || clipB.type === "video"));
            const drawClipB = () => {
              if (!clipB) return;
              if (clipB.type === "image" && imageBitmaps[clipB.id]) ctx.drawImage(imageBitmaps[clipB.id], 0, 0, W, H);
              else if (clipB.type === "video" && videoEls[clipB.id]) ctx.drawImage(videoEls[clipB.id], 0, 0, W, H);
            };

            if (tt === "fade-color") {
              const colorOpacity = transP < 0.5 ? transP * 2 : (1 - transP) * 2;
              ctx.fillStyle = activeTrans.backgroundColor || "#000000";
              ctx.globalAlpha = colorOpacity;
              ctx.fillRect(0, 0, W, H);
              ctx.globalAlpha = 1;
            } else if ((tt === "crossfade" || tt === "cross-dissolve") && hasB) {
              ctx.globalAlpha = transP; drawClipB(); ctx.globalAlpha = 1;
            } else if (tt === "slide-left" && hasB) {
              ctx.save(); ctx.translate((1 - transP) * W, 0); drawClipB(); ctx.restore();
            } else if (tt === "wipe" && hasB) {
              ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * transP, H); ctx.clip(); drawClipB(); ctx.restore();
            }
          }
        }

        // Render overlay layers (with inline transition effects for participating layers)
        const exportTime = f / FPS;
        for (const layer of overlayLayers) {
          if (exportTime < layer.startTime || exportTime >= layer.endTime) continue;
          if (layer.visible === false) continue;
          if (layer.type === "transition") continue;
          ctx.save();

          // Compute transition modifications
          let layerOpacity = (layer.opacity ?? 100) / 100;
          let slideX = 0;
          let wipeP = -1;
          if (activeTrans && (transLayerA || transLayerB)) {
            const isA = transLayerA?.id === layer.id;
            const isB = transLayerB?.id === layer.id;
            if (isA || isB) {
              const tt = activeTrans.transitionType || "crossfade";
              if (tt === "crossfade" || tt === "cross-dissolve") {
                layerOpacity *= isA ? (1 - transP) : transP;
              } else if (tt === "fade-color") {
                // A visible in first half, B visible in second half; color rect drawn after
                layerOpacity *= isA ? (transP < 0.5 ? 1 : 0) : (transP >= 0.5 ? 1 : 0);
              } else if (tt === "slide-left") {
                slideX = isA ? -transP * W : (1 - transP) * W;
              } else if (tt === "wipe" && isB) {
                wipeP = transP;
              }
            }
          }

          ctx.globalAlpha = layerOpacity;
          if (slideX !== 0) ctx.translate(slideX, 0);
          if (wipeP >= 0) { ctx.beginPath(); ctx.rect(layer.x, layer.y, layer.w * wipeP, layer.h); ctx.clip(); }
          if (layer.rotation) {
            ctx.translate(layer.x + layer.w / 2, layer.y + layer.h / 2);
            ctx.rotate((layer.rotation * Math.PI) / 180);
            ctx.translate(-(layer.x + layer.w / 2), -(layer.y + layer.h / 2));
          }
          if (layer.type === "text") {
            const bgColor = layer.backgroundColor || "transparent";
            const br = layer.borderRadius || 0;
            if (bgColor !== "transparent") {
              ctx.fillStyle = bgColor;
              if (br > 0 && ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(layer.x, layer.y, layer.w, layer.h, br);
                ctx.fill();
              } else {
                ctx.fillRect(layer.x, layer.y, layer.w, layer.h);
              }
            }
            ctx.font = `${layer.fontWeight || "bold"} ${layer.fontSize || 48}px ${layer.fontFamily || "sans-serif"}`;
            ctx.fillStyle = layer.fontColor || "#FFFFFF";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(layer.text || "", layer.x + layer.w / 2, layer.y + layer.h / 2);
          } else if (layer.type === "scrolling-text") {
            // Background
            const scBg = layer.backgroundColor || "rgba(0,0,0,0.75)";
            if (scBg !== "transparent") {
              ctx.fillStyle = scBg;
              const br = layer.borderRadius || 0;
              if (br > 0 && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, br); ctx.fill(); }
              else ctx.fillRect(layer.x, layer.y, layer.w, layer.h);
            }
            // Clip to layer bounds
            ctx.save();
            ctx.beginPath(); ctx.rect(layer.x, layer.y, layer.w, layer.h); ctx.clip();
            // Calculate scroll offset with ease-in-out
            const layerDur = layer.endTime - layer.startTime;
            const elapsed = exportTime - layer.startTime;
            const rawProgress = layerDur > 0 ? Math.max(0, Math.min(1, elapsed / layerDur)) : 0;
            const progress = rawProgress < 0.5
              ? 4 * rawProgress * rawProgress * rawProgress
              : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
            const dir = layer.scrollDirection || "up";
            const fontSize = layer.fontSize || 24;
            ctx.font = `${layer.fontWeight || "normal"} ${fontSize}px ${layer.fontFamily || "sans-serif"}`;
            ctx.fillStyle = layer.fontColor || "#FFFFFF";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const lines = (layer.text || "").split("\n");
            const lineHeight = fontSize * 1.6;
            const textBlockH = lines.length * lineHeight;
            const totalScroll = layer.h + textBlockH;
            const scrollOffset = dir === "up"
              ? layer.y + layer.h - progress * totalScroll
              : layer.y - textBlockH + progress * totalScroll;
            for (let li = 0; li < lines.length; li++) {
              const ly = scrollOffset + li * lineHeight;
              if (ly + lineHeight > layer.y && ly < layer.y + layer.h) {
                ctx.fillText(lines[li], layer.x + layer.w / 2, ly);
              }
            }
            ctx.restore();
          } else if (layer.type === "shape") {
            ctx.strokeStyle = layer.strokeColor || "#FF00FF";
            ctx.lineWidth = layer.strokeWidth || 2;
            if (layer.shapeType === "rectangle") {
              if (layer.fillColor && layer.fillColor !== "transparent") {
                ctx.fillStyle = layer.fillColor;
                if (layer.borderRadius && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.borderRadius); ctx.fill(); }
                else ctx.fillRect(layer.x, layer.y, layer.w, layer.h);
              }
              if (layer.borderRadius && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.borderRadius); ctx.stroke(); }
              else ctx.strokeRect(layer.x, layer.y, layer.w, layer.h);
            } else if (layer.shapeType === "circle") {
              ctx.beginPath();
              ctx.ellipse(layer.x + layer.w / 2, layer.y + layer.h / 2, layer.w / 2, layer.h / 2, 0, 0, Math.PI * 2);
              if (layer.fillColor && layer.fillColor !== "transparent") { ctx.fillStyle = layer.fillColor; ctx.fill(); }
              ctx.stroke();
            } else if (layer.shapeType === "arrow" || layer.shapeType === "line") {
              const x1 = layer.x, y1 = layer.y;
              const x2 = layer.endX ?? (layer.x + layer.w), y2 = layer.endY ?? layer.y;
              ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
              if (layer.shapeType === "arrow") {
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const hl = 8;
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
                ctx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
                ctx.closePath(); ctx.fillStyle = layer.strokeColor || "#FF00FF"; ctx.fill();
              }
            }
          } else if (layer.type === "image" && overlayBitmaps[layer.id]) {
            const bmp = overlayBitmaps[layer.id];
            if (layer.borderRadius && ctx.roundRect) {
              ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.borderRadius); ctx.clip();
            }
            ctx.drawImage(bmp, layer.x, layer.y, layer.w, layer.h);
            if (layer.borderWidth && layer.borderColor) {
              ctx.strokeStyle = layer.borderColor; ctx.lineWidth = layer.borderWidth;
              if (layer.borderRadius && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.borderRadius); ctx.stroke(); }
              else ctx.strokeRect(layer.x, layer.y, layer.w, layer.h);
            }
          } else if (layer.type === "video" && overlayVideos[layer.id]) {
            const vid = overlayVideos[layer.id];
            const layerTime = exportTime - layer.startTime;
            if (vid.duration > 0 && layerTime >= 0) {
              // Clamp to last frame instead of looping
              const target = Math.min(layerTime, vid.duration - 0.01);
              await seekVideo(vid, target);
            }
            let drawn = false;
            if (vid.readyState >= 2) {
              if (layer.borderRadius && ctx.roundRect) {
                ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.borderRadius); ctx.clip();
              }
              ctx.drawImage(vid, layer.x, layer.y, layer.w, layer.h);
              drawn = true;
            }
            if (drawn && layer.borderWidth && layer.borderColor) {
              ctx.strokeStyle = layer.borderColor; ctx.lineWidth = layer.borderWidth;
              if (layer.borderRadius && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.borderRadius); ctx.stroke(); }
              else ctx.strokeRect(layer.x, layer.y, layer.w, layer.h);
            }
          }
          ctx.restore();
        }

        // Fade-to-color overlay for overlay-layer transitions
        if (activeTrans && (transLayerA || transLayerB) && activeTrans.transitionType === "fade-color") {
          const colorOp = transP < 0.5 ? transP * 2 : (1 - transP) * 2;
          const a = transLayerA, b = transLayerB;
          const aX = a?.x ?? b!.x, aY = a?.y ?? b!.y, aR = a ? a.x + a.w : b!.x + b!.w, aB = a ? a.y + a.h : b!.y + b!.h;
          const bX = b?.x ?? a!.x, bY = b?.y ?? a!.y, bR = b ? b.x + b.w : a!.x + a!.w, bB = b ? b.y + b.h : a!.y + a!.h;
          const x1 = Math.min(aX, bX), y1 = Math.min(aY, bY);
          const x2 = Math.max(aR, bR), y2 = Math.max(aB, bB);
          ctx.save();
          ctx.globalAlpha = colorOp;
          ctx.fillStyle = activeTrans.backgroundColor || "#000000";
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
          ctx.restore();
        }

        // Render active subtitle
        const activeSub = subtitleClips.find(s => exportTime >= s.startTime && exportTime < s.endTime);
        if (activeSub) {
          ctx.save();
          ctx.font = `${activeSub.fontWeight} ${activeSub.fontSize}px sans-serif`;
          ctx.textAlign = "center";
          const metrics = ctx.measureText(activeSub.text);
          const tx = W / 2;
          const ty = activeSub.position === "top" ? 60 : activeSub.position === "center" ? H / 2 : H - 40;
          ctx.fillStyle = activeSub.backgroundColor;
          ctx.fillRect(tx - metrics.width / 2 - 12, ty - activeSub.fontSize + 4, metrics.width + 24, activeSub.fontSize + 12);
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

      Object.values(imageBitmaps).forEach(bmp => bmp.close());

      // Encode audio into MP4
      if (audioEnc && mixedAudioL && mixedAudioR) {
        const CHUNK_FRAMES = 1024;
        const totalAudioSamples = mixedAudioL.length;
        for (let i = 0; i < totalAudioSamples; i += CHUNK_FRAMES) {
          const len = Math.min(CHUNK_FRAMES, totalAudioSamples - i);
          const planar = new Float32Array(len * 2);
          planar.set(mixedAudioL.subarray(i, i + len), 0);
          planar.set(mixedAudioR.subarray(i, i + len), len);
          const ad = new AudioData({
            format: "f32-planar",
            sampleRate: AUDIO_SR,
            numberOfFrames: len,
            numberOfChannels: 2,
            timestamp: Math.round((i / AUDIO_SR) * 1e6),
            data: planar,
          });
          audioEnc.encode(ad);
          ad.close();
        }
        await audioEnc.flush();
      }

      await enc.flush(); muxer.finalize();
      const exportFilename = `export-${Date.now()}.mp4`;
      const blob = new Blob([(muxer.target as any).buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = exportFilename; a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(false); setExportProgress(0);
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    }
  }, [videoClips, audioClips, totalDur, subtitleClips, overlayLayers, saveExportToProject, canvasSize, bgColor]);

  const handleExport = useCallback(() => {
    if (selectedTrack === "audio") handleAudioExport();
    else handleVideoExport();
  }, [selectedTrack, handleAudioExport, handleVideoExport]);

  return { handleExport, exporting, exportProgress };
}
