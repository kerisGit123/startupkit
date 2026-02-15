"use client";

import { useState } from "react";
import { Save, Sparkles, Download, Settings, Plus, MoreVertical } from "lucide-react";
import { useMangaStudioUI } from "../MangaStudioUIContext";
import { SettingsModal } from "../components/modals/SettingsModal";
import { ManageArcTagsModal } from "../components/modals/ManageArcTagsModal";
import { ManageSectionsModal } from "../components/modals/ManageSectionsModal";

export default function EpisodesPage() {
  const { openNewEpisode } = useMangaStudioUI();
  const [showSettings, setShowSettings] = useState(false);
  const [showArcTags, setShowArcTags] = useState(false);
  const [showSections, setShowSections] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <div className="h-16 bg-[#13131a] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-bold text-lg">Episodes</h2>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
            Manage your manga episodes and pages
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Generate
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition flex items-center justify-center"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ManageArcTagsModal isOpen={showArcTags} onClose={() => setShowArcTags(false)} />
      <ManageSectionsModal isOpen={showSections} onClose={() => setShowSections(false)} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0f] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Actions */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setShowArcTags(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
              >
                Manage Arc Tags
              </button>
              <button
                onClick={() => setShowSections(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
              >
                Manage Sections
              </button>
            </div>
            <button
              onClick={openNewEpisode}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Episode
            </button>
          </div>

          {/* Filter Tags */}
          <div className="mb-6 flex gap-2">
            <button className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
              All Episodes
            </button>
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm font-medium transition">
              Tournament Arc
            </button>
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm font-medium transition">
              Rivalry Arc
            </button>
          </div>

          {/* Episodes List */}
          <div className="space-y-4">
            {/* Episode 1 */}
            <div className="bg-[#13131a] rounded-xl p-5 border border-white/5 hover:border-purple-500/30 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">Episode 1: The Beginning</h3>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                      Published
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                      Training Arc
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Kaito&apos;s first day at Seirin High. He meets the team and gets challenged.</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>12 pages</span>
                    <span>48 panels</span>
                    <span>3 characters</span>
                  </div>
                </div>
                <div className="relative">
                  <button className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 transition">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Page Thumbnails */}
              <div className="flex gap-3">
                <div className="w-20 h-28 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-white/10 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Page 1</span>
                </div>
                <div className="w-20 h-28 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-white/10 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Page 2</span>
                </div>
                <div className="w-20 h-28 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-white/10 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Page 3</span>
                </div>
              </div>
            </div>

            {/* Episode 2 */}
            <div className="bg-[#13131a] rounded-xl p-5 border border-white/5 hover:border-purple-500/30 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">Episode 2: First Challenge</h3>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
                      Draft
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Kaito faces his first opponent in a practice match...
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>10 pages</span>
                    <span>38 panels</span>
                    <span>5 characters</span>
                  </div>
                </div>
                <div className="relative">
                  <button className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 transition">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
