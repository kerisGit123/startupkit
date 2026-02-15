"use client";

import { X, Upload, FileText } from "lucide-react";

interface PageComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PageComposerModal({ isOpen, onClose }: PageComposerModalProps) {
  if (!isOpen) return null;

  const layouts = [
    { id: 1, name: "Standard Vertical", panels: "3 panel sections", preview: "3-panel" },
    { id: 2, name: "Hero Panel", panels: "1 large + 2 small panels", preview: "hero" },
    { id: 3, name: "Full Scroll", panels: "Single sequential panel", preview: "scroll" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#1a1a24] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Page Composer</h2>
              <p className="text-sm text-gray-400">Arrange your panels into a complete manga page</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Manga Panels */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Upload Manga Panels</label>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-purple-500/30 transition cursor-pointer bg-[#25252f]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Click to upload manga panels</p>
            <p className="text-xs text-gray-400">Upload multiple panels to arrange</p>
          </div>
        </div>

        {/* Webtoon Layout Templates */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-300 mb-3 block">Webtoon Layout Templates</label>
          <p className="text-xs text-gray-400 mb-3">Vertical scroll optimized for mobile</p>
          <div className="grid grid-cols-3 gap-3">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                className="bg-[#25252f] border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition group"
              >
                <div className="aspect-[9/16] bg-[#1a1a24] rounded-lg mb-3 border-2 border-dashed border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 rounded bg-purple-500/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-white mb-1">{layout.name}</p>
                <p className="text-xs text-gray-500">{layout.panels}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Arrangement */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Custom Arrangement (Optional)</label>
          <textarea
            placeholder='Example: "3 panels in top row, 2 large panels in bottom row"'
            className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Compose Manga Page
          </button>
        </div>
      </div>
    </div>
  );
}
