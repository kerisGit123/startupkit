"use client";

import { useState } from "react";
import { Printer, Download, FileDown, Loader2 } from "lucide-react";
import { DarkModal } from "../shared/DarkModal";
import type { Id } from "@/convex/_generated/dataModel";

interface ExportItem {
  _id: Id<"storyboard_items">;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration: number;
  generationStatus: string;
  order: number;
}

interface WorkspaceExportModalProps {
  projectName: string;
  script: string;
  items: ExportItem[];
  frameRatio: string;
  onClose: () => void;
}

/** Load an image as base64 data URL, returns null on failure */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function WorkspaceExportModal({
  projectName, script, items, frameRatio, onClose,
}: WorkspaceExportModalProps) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const handlePrint = () => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const ratio = frameRatio === "9:16" ? "9/16" : frameRatio === "1:1" ? "1/1" : "16/9";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${projectName} — Storyboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; color: #111; padding: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 24px; }
    .script-section { margin-bottom: 32px; padding: 16px; background: #f8f8f8; border-radius: 8px; border-left: 3px solid #7c3aed; }
    .script-section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; margin-bottom: 8px; }
    .script-section pre { font-size: 11px; line-height: 1.6; white-space: pre-wrap; color: #333; font-family: inherit; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .frame { break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .frame-img { aspect-ratio: ${ratio}; background: #f3f4f6; position: relative; overflow: hidden; }
    .frame-img img { width: 100%; height: 100%; object-fit: cover; }
    .frame-img .no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 11px; }
    .frame-num { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 9px; padding: 2px 5px; border-radius: 4px; }
    .frame-dur { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 9px; padding: 2px 5px; border-radius: 4px; }
    .frame-info { padding: 8px 10px; }
    .frame-title { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
    .frame-desc { font-size: 10px; color: #666; line-height: 1.4; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <h1>${projectName}</h1>
  <p class="subtitle">Storyboard · ${sorted.length} frames · ${frameRatio}</p>

  ${script.trim() ? `
  <div class="script-section">
    <h2>Script</h2>
    <pre>${script.slice(0, 1500)}${script.length > 1500 ? "…" : ""}</pre>
  </div>` : ""}

  <div class="grid">
    ${sorted.map((item, i) => `
    <div class="frame">
      <div class="frame-img">
        ${item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.title}" crossorigin="anonymous" />`
          : `<div class="no-img">No image</div>`}
        <span class="frame-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="frame-dur">${item.duration}s</span>
      </div>
      <div class="frame-info">
        <p class="frame-title">${item.title}</p>
        ${item.description ? `<p class="frame-desc">${item.description.slice(0, 120)}</p>` : ""}
      </div>
    </div>`).join("")}
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const handleDownloadPDF = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const sorted = [...items].sort((a, b) => a.order - b.order);

      // Landscape A4: 297 x 210 mm
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();   // 297
      const pageH = pdf.internal.pageSize.getHeight();   // 210
      const margin = 12;
      const usableW = pageW - margin * 2;

      // ── Title page ──
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text(projectName, pageW / 2, 60, { align: "center" });
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100);
      pdf.text(`Storyboard  |  ${sorted.length} frames  |  ${frameRatio}`, pageW / 2, 72, { align: "center" });
      pdf.text(new Date().toLocaleDateString(), pageW / 2, 80, { align: "center" });
      pdf.setTextColor(0);

      if (script.trim()) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        const scriptLines = pdf.splitTextToSize(script.slice(0, 1200), usableW - 40);
        pdf.text(scriptLines, pageW / 2, 100, { align: "center", maxWidth: usableW - 40 });
      }

      // ── Preload images ──
      const imageDataMap = new Map<string, string>();
      const urls = sorted.map((f) => f.imageUrl).filter(Boolean) as string[];
      const results = await Promise.allSettled(urls.map((u) => loadImageAsDataUrl(u)));
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) imageDataMap.set(urls[i], r.value);
      });

      // ── Frame pages — 2x2 grid per page ──
      const cols = 2;
      const rows = 2;
      const perPage = cols * rows;
      const gap = 8;
      const cellW = (usableW - gap * (cols - 1)) / cols;
      // Aspect ratio for image area
      const imgRatio = frameRatio === "9:16" ? 9 / 16 : frameRatio === "1:1" ? 1 : 16 / 9;
      const imgH = cellW / imgRatio;
      const infoH = 14; // space for title+desc below image
      const cellH = imgH + infoH;
      const startY = margin + 8;

      for (let p = 0; p < Math.ceil(sorted.length / perPage); p++) {
        pdf.addPage("a4", "landscape");
        const pageFrames = sorted.slice(p * perPage, (p + 1) * perPage);

        // Page header
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`${projectName}  —  Page ${p + 1}`, margin, margin + 2);
        pdf.setTextColor(0);

        for (let i = 0; i < pageFrames.length; i++) {
          const frame = pageFrames[i];
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = margin + col * (cellW + gap);
          const y = startY + row * (cellH + gap);

          // Image area background
          pdf.setFillColor(240, 240, 240);
          pdf.roundedRect(x, y, cellW, imgH, 2, 2, "F");

          // Image
          const dataUrl = frame.imageUrl ? imageDataMap.get(frame.imageUrl) : null;
          if (dataUrl) {
            try {
              pdf.addImage(dataUrl, "JPEG", x, y, cellW, imgH);
            } catch { /* skip broken images */ }
          } else {
            pdf.setFontSize(9);
            pdf.setTextColor(180);
            pdf.text("No image", x + cellW / 2, y + imgH / 2, { align: "center" });
            pdf.setTextColor(0);
          }

          // Frame number badge
          const frameIdx = p * perPage + i + 1;
          const badge = String(frameIdx).padStart(2, "0");
          pdf.setFillColor(0, 0, 0);
          pdf.roundedRect(x + 2, y + 2, 10, 5, 1, 1, "F");
          pdf.setFontSize(7);
          pdf.setTextColor(255);
          pdf.text(badge, x + 7, y + 5.5, { align: "center" });
          pdf.setTextColor(0);

          // Duration badge
          pdf.setFillColor(0, 0, 0);
          const durText = `${frame.duration}s`;
          pdf.roundedRect(x + cellW - 12, y + 2, 10, 5, 1, 1, "F");
          pdf.setFontSize(7);
          pdf.setTextColor(255);
          pdf.text(durText, x + cellW - 7, y + 5.5, { align: "center" });
          pdf.setTextColor(0);

          // Title
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text(frame.title.slice(0, 60), x + 2, y + imgH + 5);
          pdf.setFont("helvetica", "normal");

          // Description
          if (frame.description) {
            pdf.setFontSize(7);
            pdf.setTextColor(100);
            const descLines = pdf.splitTextToSize(frame.description.slice(0, 120), cellW - 4);
            pdf.text(descLines, x + 2, y + imgH + 10);
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

  return (
    <DarkModal isOpen={true} onClose={onClose} maxWidth="max-w-md" noPadding>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div>
            <h2 className="text-base font-bold text-white">Export Storyboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">{items.length} frames · {projectName}</p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <button onClick={handleDownloadPDF} disabled={pdfBusy}
            className="w-full flex items-center gap-3 p-4 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-xl transition text-left disabled:opacity-50">
            <div className="w-9 h-9 rounded-lg bg-teal-600/20 flex items-center justify-center shrink-0">
              {pdfBusy ? <Loader2 className="w-4 h-4 text-teal-400 animate-spin" /> : <FileDown className="w-4 h-4 text-teal-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Download PDF</p>
              <p className="text-xs text-gray-500 mt-0.5">Landscape A4 with images, titles & descriptions</p>
            </div>
          </button>

          <button onClick={handlePrint}
            className="w-full flex items-center gap-3 p-4 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-xl transition text-left">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Print / Save as PDF</p>
              <p className="text-xs text-gray-500 mt-0.5">Opens print dialog — choose "Save as PDF"</p>
            </div>
          </button>

          <button onClick={handleExportJSON}
            className="w-full flex items-center gap-3 p-4 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/16 rounded-xl transition text-left">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Export JSON</p>
              <p className="text-xs text-gray-500 mt-0.5">All frames, URLs, script as structured JSON</p>
            </div>
          </button>
        </div>
    </DarkModal>
  );
}
