"use client";

import { X, Sparkles, Image as ImageIcon } from "lucide-react";

interface PanelGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PanelGeneratorModal({ isOpen, onClose }: PanelGeneratorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Panel Generator</h2>
              <p className="text-sm text-gray-400">Upload character references and optional sketch to generate consistent manga panels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - 2 Column Layout */}
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left: Asset Library */}
          <div className="w-80 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-3">Characters</h3>
            

            {/* Character List */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              <div className="bg-[#25252f] rounded-lg p-4 border-2 border-purple-500/50 cursor-pointer transition">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold">
                    K
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Kaito</div>
                  </div>
                </div>
              </div>
              <div className="bg-[#25252f] rounded-lg p-4 border border-white/10 hover:border-purple-500/50 cursor-pointer transition">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                    R
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Ryu</div>
                  </div>
                </div>
              </div>
              <button className="w-full border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-lg p-4 text-center transition group">
                <div className="text-purple-400 text-sm font-medium">+ Add Character</div>
              </button>
            </div>

            {/* Other Assets */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-bold text-white mb-3">Other Assets</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2.5 bg-[#25252f] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-sm font-medium transition text-left">
                  Scenes
                </button>
                <button className="w-full px-4 py-2.5 bg-[#25252f] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-sm font-medium transition text-left">
                  Props
                </button>
                <button className="w-full px-4 py-2.5 bg-[#25252f] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-sm font-medium transition text-left">
                  Tools
                </button>
              </div>
            </div>

            {/* Scene Preview */}
            <div className="mt-4 bg-[#1a1a24] rounded-lg p-4 border border-white/10">
              <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded mb-2 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-xs">Basketball Court</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Panel Configuration */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <h3 className="text-sm font-bold text-white mb-4">Panel Description *</h3>

            <div className="space-y-4">
              {/* Scene Description */}
              <div>
                <textarea
                  className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                  rows={5}
                  placeholder="Character jumping through the air with sword drawn, dynamic action pose, speed lines in background..."
                />
              </div>

              {/* Sketch Reference */}
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Sketch Reference (Optional)</label>
                <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-purple-500/30 transition cursor-pointer bg-[#25252f]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">Upload composition sketch</p>
                  <p className="text-xs text-gray-400">Your rough sketch for panel layout</p>
                </div>
              </div>

              {/* Camera Angle & Shot Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Camera Angle</label>
                  <select className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500">
                    <option>Eye Level</option>
                    <option>Low Angle</option>
                    <option>High Angle</option>
                    <option>Bird's Eye</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Shot Type</label>
                  <select className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500">
                    <option>Close-up</option>
                    <option>Medium Shot</option>
                    <option>Wide Shot</option>
                    <option>Extreme Close-up</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-lg font-semibold shadow-lg transition">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Generate Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
