"use client";

import { X, Bot, CheckCircle, Zap, Settings } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project Settings</h2>
              <p className="text-sm text-gray-400">Configure your manga project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* AI Model Settings */}
          <div className="bg-[#25252f] rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-semibold text-white">AI Model Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Model</label>
                <select className="w-full px-4 py-3 bg-[#1a1a24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option>Kie.ai Nano Banana</option>
                  <option>DALL-E 3</option>
                  <option>Midjourney</option>
                  <option>Stable Diffusion XL</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Quality</label>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition">
                    Draft
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    Standard
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition">
                    High
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Defaults */}
          <div className="bg-[#25252f] rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">Generation Defaults</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Default settings applied to all panel generation. Override per-panel in Panel Builder.</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Ratio</label>
                <select className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
                  <option>9:16</option><option>3:4</option><option>1:1</option><option>4:3</option><option>16:9</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Quantity</label>
                <select className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
                  <option>1</option><option>2</option><option>3</option><option>4</option><option>6</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1.5">Format</label>
                <select className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
                  <option>Webtoon</option><option>Manga</option><option>Western Comic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Consistency */}
          <div className="bg-[#25252f] rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-base font-semibold text-white">Consistency</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Character Consistency</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Asset Consistency</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Style Transfer</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Batch Generation */}
          <div className="bg-[#25252f] rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-green-400" />
              <h3 className="text-base font-semibold text-white">Batch Generation</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Panels to generate:</span>
                <span className="text-green-400 font-bold">5 panels</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Est. time:</span>
                <span className="text-white font-medium">~2 min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Credits cost:</span>
                <span className="text-orange-400 font-bold">25 credits</span>
              </div>
              <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold mt-2 transition">
                <Zap className="w-4 h-4 inline mr-2" />
                Start Batch Generation
              </button>
            </div>
          </div>

          {/* Credits Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1a24] rounded-xl p-4 text-center border border-orange-500/30">
              <div className="text-xs text-gray-400 mb-1">Credits</div>
              <div className="text-2xl font-bold text-orange-400">1,250</div>
            </div>
            <div className="bg-[#1a1a24] rounded-xl p-4 text-center border border-blue-500/30">
              <div className="text-xs text-gray-400 mb-1">Generated</div>
              <div className="text-2xl font-bold text-blue-400">68</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
