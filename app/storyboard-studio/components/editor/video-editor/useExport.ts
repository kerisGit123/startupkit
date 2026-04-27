"use client";

import { useCallback, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { TimelineClip, SubtitleClip, OverlayLayer, R2_PUBLIC_URL, getVisDur, getClipAtTime } from "./types";

interface UseExportParams {
  videoClips: TimelineClip[];
  audioClips: TimelineClip[];
  subtitleClips: SubtitleClip[];
  overlayLayers: OverlayLayer[];
  totalDur: number;
  selectedTrack: "video" | "audio" | "subtitle" | "overlay";
  companyId: string | undefined;
  userId: string | undefined;
  projectId: Id<"storyboard_projects">;
  logUpload: any;
}

export function useExport({
  videoClips, audioClips, subtitleClips, overlayLayers,
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
      await saveExportToProject(wavBlob, exportFilename, "audio", "audio/wav");
      audioCtx.close();
      toast.success("Exported & saved to project!");
    } catch (err) {
      console.error("Audio export error:", err);
      toast.error(`Audio export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(false); setExportProgress(0);
    }
  }, [audioClips, saveExportToProject]);

  // ── Video Export (WebCodecs + mp4-muxer) ──

  const handleVideoExport = useCallback(async () => {
    if (videoClips.length === 0) { toast.warning("Add video clips first"); return; }
    if (typeof VideoEncoder === "undefined") { toast.error("Use Chrome or Edge"); return; }
    setExporting(true); setExportProgress(0);
    const blobUrls: string[] = [];
    try {
      const FPS = 30, W = 1920, H = 1080, AUDIO_SR = 44100, total = Math.ceil(totalDur * FPS);
      const hasAudio = audioClips.length > 0;
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

      // Load & mix audio clips into stereo buffer
      let mixedAudioL: Float32Array | null = null;
      let mixedAudioR: Float32Array | null = null;
      if (hasAudio) {
        const totalAudioSamples = Math.ceil(totalDur * AUDIO_SR);
        mixedAudioL = new Float32Array(totalAudioSamples);
        mixedAudioR = new Float32Array(totalAudioSamples);
        const audioCtx = new AudioContext({ sampleRate: AUDIO_SR });
        let audioTimeOffset = 0;
        for (const ac of audioClips) {
          let audioBlob: Blob;
          try {
            const res = await fetch(ac.src);
            if (!res.ok) throw new Error();
            audioBlob = await res.blob();
          } catch {
            const r2Key = ac.src.replace(`${R2_PUBLIC_URL}/`, "");
            const presignRes = await fetch("/api/storyboard/download-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ r2Key, filename: ac.name }),
            });
            const { downloadUrl } = await presignRes.json();
            const res = await fetch(downloadUrl);
            audioBlob = await res.blob();
          }
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
        audioCtx.close();
      }

      const seekVideo = (vid: HTMLVideoElement, time: number): Promise<void> => {
        return new Promise((resolve) => {
          if (Math.abs(vid.currentTime - time) < 0.05) { resolve(); return; }
          const onSeeked = () => { vid.removeEventListener("seeked", onSeeked); resolve(); };
          vid.addEventListener("seeked", onSeeked);
          vid.currentTime = time;
          setTimeout(resolve, 500);
        });
      };

      toast.info("Encoding frames...");

      for (let f = 0; f < total; f++) {
        ctx.fillStyle = "#000";
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
          ctx.globalCompositeOperation = prevComposite;
          ctx.globalAlpha = prevAlpha;
        }

        // Render overlay layers
        const exportTime = f / FPS;
        for (const layer of overlayLayers) {
          if (exportTime < layer.startTime || exportTime >= layer.endTime) continue;
          ctx.save();
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
              const x1 = layer.x, y1 = layer.y + layer.h / 2;
              const x2 = layer.x + layer.w, y2 = layer.y + layer.h / 2;
              ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
              if (layer.shapeType === "arrow") {
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const hl = 12;
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
                ctx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
                ctx.closePath(); ctx.fillStyle = layer.strokeColor || "#FF00FF"; ctx.fill();
              }
            }
          } else if ((layer.type === "video" || layer.type === "image") && layer.src) {
            // Video/image overlays would need pre-loaded media — skip in basic export for now
            // TODO: Pre-load overlay video/image sources and draw them here
          }
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
      await saveExportToProject(blob, exportFilename, "video", "video/mp4");
      toast.success("Exported & saved to project!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(false); setExportProgress(0);
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    }
  }, [videoClips, audioClips, totalDur, subtitleClips, overlayLayers, saveExportToProject]);

  const handleExport = useCallback(() => {
    if (selectedTrack === "audio") handleAudioExport();
    else handleVideoExport();
  }, [selectedTrack, handleAudioExport, handleVideoExport]);

  return { handleExport, exporting, exportProgress };
}
