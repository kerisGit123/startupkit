"use client";

import { useState } from "react";
import { Printer, Download, FileDown, Loader2, RectangleHorizontal, RectangleVertical, FileText, Image, Video, EyeOff } from "lucide-react";
import { DarkModal } from "../shared/DarkModal";
import type { Id } from "@/convex/_generated/dataModel";

interface ExportItem {
  _id: Id<"storyboard_items">;
  title: string;
  description?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration: number;
  generationStatus: string;
  order: number;
}

type TextContent = "description" | "imagePrompt" | "videoPrompt" | "none";

interface WorkspaceExportModalProps {
  projectName: string;
  script: string;
  items: ExportItem[];
  frameRatio: string;
  onClose: () => void;
}

/**
 * Load an image as base64 data URL.
 * Uses the server-side proxy to bypass CORS restrictions on R2 images.
 */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  // Method 1: Server-side proxy (bypasses CORS)
  try {
    const proxyUrl = `/api/storyboard/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch { /* fall through */ }

  // Method 2: Direct fetch
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch { /* fall through */ }

  // Method 3: Canvas fallback
  try {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        try { resolve(canvas.toDataURL("image/jpeg", 0.85)); } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
      setTimeout(() => resolve(null), 8000);
    });
  } catch { return null; }
}

/** Get the text content for a frame based on selected mode */
function getFrameText(item: ExportItem, mode: TextContent): string {
  switch (mode) {
    case "description": return item.description || "";
    case "imagePrompt": return item.imagePrompt || "";
    case "videoPrompt": return item.videoPrompt || "";
    case "none": return "";
  }
}

const TEXT_OPTIONS: { value: TextContent; label: string; icon: typeof FileText }[] = [
  { value: "description", label: "Description", icon: FileText },
  { value: "imagePrompt", label: "Image Prompt", icon: Image },
  { value: "videoPrompt", label: "Video Prompt", icon: Video },
  { value: "none",        label: "None",         icon: EyeOff },
];

export function WorkspaceExportModal({
  projectName, script, items, frameRatio, onClose,
}: WorkspaceExportModalProps) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [textContent, setTextContent] = useState<TextContent>("description");

  const handlePrint = async () => {
    if (printBusy) return;
    setPrintBusy(true);
    try {
      const sorted = [...items].sort((a, b) => a.order - b.order);
      const ratio = frameRatio === "9:16" ? "9/16" : frameRatio === "1:1" ? "1/1" : "16/9";
      const isPortrait = orientation === "portrait";
      const cols = isPortrait ? 2 : 3;

      // Preload images via proxy
      const imageDataMap = new Map<string, string>();
      const urls = sorted.map((f) => f.imageUrl).filter(Boolean) as string[];
      if (urls.length > 0) {
        const results = await Promise.allSettled(urls.map((u) => loadImageAsDataUrl(u)));
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value) imageDataMap.set(urls[i], r.value);
        });
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${projectName} \u2014 Storyboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; color: #111; padding: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 24px; }
    .script-section { margin-bottom: 32px; padding: 16px; background: #f8f8f8; border-radius: 8px; border-left: 3px solid #7c3aed; }
    .script-section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; margin-bottom: 8px; }
    .script-section pre { font-size: 11px; line-height: 1.6; white-space: pre-wrap; color: #333; font-family: inherit; }
    .grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 16px; }
    .frame { break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .frame-img { aspect-ratio: ${ratio}; background: #f3f4f6; position: relative; overflow: hidden; }
    .frame-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .frame-img .no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 11px; }
    .frame-num { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 9px; padding: 2px 5px; border-radius: 4px; }
    .frame-dur { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 9px; padding: 2px 5px; border-radius: 4px; }
    .frame-info { padding: 8px 10px; }
    .frame-title { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
    .frame-desc { font-size: 10px; color: #666; line-height: 1.4; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
      @page { size: ${isPortrait ? "portrait" : "landscape"}; margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>${projectName}</h1>
  <p class="subtitle">Storyboard \u00b7 ${sorted.length} frames \u00b7 ${frameRatio}</p>

  ${script.trim() ? `
  <div class="script-section">
    <h2>Script</h2>
    <pre>${script.slice(0, 1500)}${script.length > 1500 ? "\u2026" : ""}</pre>
  </div>` : ""}

  <div class="grid">
    ${sorted.map((item, i) => {
      const dataUrl = item.imageUrl ? imageDataMap.get(item.imageUrl) : null;
      const text = getFrameText(item, textContent);
      return `
    <div class="frame">
      <div class="frame-img">
        ${dataUrl
          ? `<img src="${dataUrl}" alt="${item.title}" />`
          : item.imageUrl
            ? `<img src="${item.imageUrl}" alt="${item.title}" crossorigin="anonymous" />`
            : `<div class="no-img">No image</div>`}
        <span class="frame-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="frame-dur">${item.duration}s</span>
      </div>
      <div class="frame-info">
        <p class="frame-title">${item.title}</p>
        ${text ? `<p class="frame-desc">${text.slice(0, 200)}</p>` : ""}
      </div>
    </div>`;
    }).join("")}
  </div>
</body>
</html>`;

      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); }, 500);
    } finally {
      setPrintBusy(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const sorted = [...items].sort((a, b) => a.order - b.order);

      const isPortrait = orientation === "portrait";
      const pdf = new jsPDF({ orientation: isPortrait ? "portrait" : "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      // Title page
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text(projectName, pageW / 2, isPortrait ? 80 : 60, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100);
      pdf.text(`Storyboard  |  ${sorted.length} frames  |  ${frameRatio}`, pageW / 2, isPortrait ? 92 : 72, { align: "center" });
      pdf.text(new Date().toLocaleDateString(), pageW / 2, isPortrait ? 100 : 80, { align: "center" });
      pdf.setTextColor(0);

      if (script.trim()) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        const scriptLines = pdf.splitTextToSize(script.slice(0, 1200), usableW - 40);
        pdf.text(scriptLines, pageW / 2, isPortrait ? 120 : 100, { align: "center", maxWidth: usableW - 40 });
      }

      // Preload images
      const imageDataMap = new Map<string, string>();
      const urls = sorted.map((f) => f.imageUrl).filter(Boolean) as string[];
      const results = await Promise.allSettled(urls.map((u) => loadImageAsDataUrl(u)));
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) imageDataMap.set(urls[i], r.value);
      });

      // Grid layout
      const cols = 2;
      const rows = isPortrait ? 3 : 2;
      const perPage = cols * rows;
      const gap = 6;
      const cellW = (usableW - gap * (cols - 1)) / cols;
      const imgRatio = frameRatio === "9:16" ? 9 / 16 : frameRatio === "1:1" ? 1 : 16 / 9;
      const imgH = cellW / imgRatio;
      const infoH = textContent === "none" ? 8 : 14;
      const cellH = imgH + infoH;

      // Scale to fit
      const totalRowH = rows * cellH + (rows - 1) * gap;
      const availableH = usableH - 12;
      const scale = totalRowH > availableH ? availableH / totalRowH : 1;
      const sCellW = cellW * scale;
      const sImgH = imgH * scale;
      const sCellH = cellH * scale;
      const sGap = gap * scale;
      const startY = margin + 8;

      for (let p = 0; p < Math.ceil(sorted.length / perPage); p++) {
        pdf.addPage("a4", isPortrait ? "portrait" : "landscape");
        const pageFrames = sorted.slice(p * perPage, (p + 1) * perPage);

        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`${projectName}  \u2014  Page ${p + 1}`, margin, margin + 2);
        pdf.setTextColor(0);

        for (let i = 0; i < pageFrames.length; i++) {
          const frame = pageFrames[i];
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = margin + col * (sCellW + sGap);
          const y = startY + row * (sCellH + sGap);

          // Image background
          pdf.setFillColor(240, 240, 240);
          pdf.roundedRect(x, y, sCellW, sImgH, 2, 2, "F");

          // Image
          const dataUrl = frame.imageUrl ? imageDataMap.get(frame.imageUrl) : null;
          if (dataUrl) {
            try { pdf.addImage(dataUrl, "JPEG", x, y, sCellW, sImgH); } catch { /* skip */ }
          } else {
            pdf.setFontSize(9); pdf.setTextColor(180);
            pdf.text("No image", x + sCellW / 2, y + sImgH / 2, { align: "center" });
            pdf.setTextColor(0);
          }

          // Frame number badge
          const badge = String(p * perPage + i + 1).padStart(2, "0");
          pdf.setFillColor(0, 0, 0);
          pdf.roundedRect(x + 2, y + 2, 10, 5, 1, 1, "F");
          pdf.setFontSize(7); pdf.setTextColor(255);
          pdf.text(badge, x + 7, y + 5.5, { align: "center" });
          pdf.setTextColor(0);

          // Duration badge
          pdf.setFillColor(0, 0, 0);
          pdf.roundedRect(x + sCellW - 12, y + 2, 10, 5, 1, 1, "F");
          pdf.setFontSize(7); pdf.setTextColor(255);
          pdf.text(`${frame.duration}s`, x + sCellW - 7, y + 5.5, { align: "center" });
          pdf.setTextColor(0);

          // Title
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text(frame.title.slice(0, 60), x + 2, y + sImgH + 5);
          pdf.setFont("helvetica", "normal");

          // Text content (description / image prompt / video prompt / none)
          const text = getFrameText(frame, textContent);
          if (text) {
            pdf.setFontSize(7); pdf.setTextColor(100);
            const lines = pdf.splitTextToSize(text.slice(0, 200), sCellW - 4);
            pdf.text(lines, x + 2, y + sImgH + 10);
            pdf.setTextColor(0);
          }
        }
      }

      const filename = `${projectName.replace(/\s+/g, "-").toLowerCase()}-storyboard.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("[PDF export]", err);
      alert("PDF export failed. Please try Print/Save as PDF instead.");
    } finally {
      setPdfBusy(false);
    }
  };

  const handleExportJSON = () => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const payload = {
      project: projectName,
      frameRatio,
      exportedAt: new Date().toISOString(),
      script,
      frames: sorted.map((item, i) => ({
        index: i + 1,
        title: item.title,
        description: item.description,
        imagePrompt: item.imagePrompt,
        videoPrompt: item.videoPrompt,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        duration: item.duration,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}-storyboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const textLabel = TEXT_OPTIONS.find(o => o.value === textContent)?.label ?? "Description";

  return (
    <DarkModal isOpen={true} onClose={onClose} maxWidth="max-w-md" noPadding>
      <div className="flex items-center justify-between p-5 border-b border-(--border-primary)">
        <div>
          <h2 className="text-[14px] font-semibold text-(--text-primary)">Export Storyboard</h2>
          <p className="text-[11px] text-(--text-tertiary) mt-0.5">{items.length} frames · {projectName}</p>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Orientation */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2">Orientation</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrientation("landscape")}
              className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg text-[12px] font-medium border transition-colors ${
                orientation === "landscape"
                  ? "bg-white/10 text-(--text-primary) border-white/20"
                  : "text-(--text-secondary) border-(--border-primary) hover:bg-white/5"
              }`}
            >
              <RectangleHorizontal className="w-4 h-4" strokeWidth={1.75} />
              Landscape
            </button>
            <button
              onClick={() => setOrientation("portrait")}
              className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg text-[12px] font-medium border transition-colors ${
                orientation === "portrait"
                  ? "bg-white/10 text-(--text-primary) border-white/20"
                  : "text-(--text-secondary) border-(--border-primary) hover:bg-white/5"
              }`}
            >
              <RectangleVertical className="w-4 h-4" strokeWidth={1.75} />
              Portrait
            </button>
          </div>
        </div>

        {/* Text content selector */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2">Show Below Title</p>
          <div className="flex items-center gap-1.5">
            {TEXT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = textContent === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTextContent(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors ${
                    isActive
                      ? "bg-white/10 text-(--text-primary) border-white/20"
                      : "text-(--text-secondary) border-(--border-primary) hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5 pt-3 space-y-2.5">
        <button onClick={handleDownloadPDF} disabled={pdfBusy}
          className="w-full flex items-center gap-3 p-3.5 hover:bg-white/5 border border-(--border-primary) hover:border-(--border-secondary) rounded-xl transition-colors text-left disabled:opacity-50">
          <div className="w-9 h-9 rounded-lg bg-(--accent-teal)/15 flex items-center justify-center shrink-0">
            {pdfBusy ? <Loader2 className="w-4 h-4 text-(--accent-teal) animate-spin" /> : <FileDown className="w-4 h-4 text-(--accent-teal)" />}
          </div>
          <div>
            <p className="text-[13px] font-medium text-(--text-primary)">Download PDF</p>
            <p className="text-[11px] text-(--text-tertiary) mt-0.5">{orientation === "landscape" ? "Landscape" : "Portrait"} A4 · {textLabel}</p>
          </div>
        </button>

        <button onClick={handlePrint} disabled={printBusy}
          className="w-full flex items-center gap-3 p-3.5 hover:bg-white/5 border border-(--border-primary) hover:border-(--border-secondary) rounded-xl transition-colors text-left disabled:opacity-50">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
            {printBusy ? <Loader2 className="w-4 h-4 text-purple-400 animate-spin" /> : <Printer className="w-4 h-4 text-purple-400" />}
          </div>
          <div>
            <p className="text-[13px] font-medium text-(--text-primary)">Print / Save as PDF</p>
            <p className="text-[11px] text-(--text-tertiary) mt-0.5">{orientation === "landscape" ? "Landscape" : "Portrait"} · {textLabel}</p>
          </div>
        </button>

        <button onClick={handleExportJSON}
          className="w-full flex items-center gap-3 p-3.5 hover:bg-white/5 border border-(--border-primary) hover:border-(--border-secondary) rounded-xl transition-colors text-left">
          <div className="w-9 h-9 rounded-lg bg-(--accent-blue)/15 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-(--accent-blue)" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-(--text-primary)">Export JSON</p>
            <p className="text-[11px] text-(--text-tertiary) mt-0.5">All frames, prompts, URLs, script</p>
          </div>
        </button>
      </div>
    </DarkModal>
  );
}
