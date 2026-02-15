"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Film,
  Globe,
  Layers,
  Plus,
  BookMarked,
} from "lucide-react";

export function MangaStudioSidebar({
  onNewEpisode,
  onManageStories,
}: {
  onNewEpisode: () => void;
  onManageStories: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      id: "editor",
      label: "Manga Editor",
      icon: Layers,
      href: "/manga-studio",
      description: "Build pages & panels",
    },
    {
      id: "episodes",
      label: "Episodes",
      icon: Film,
      href: "/manga-studio/episodes",
      description: "Manage episodes & arcs",
    },
    {
      id: "universe",
      label: "Universe Manager",
      icon: Globe,
      href: "/manga-studio/universe",
      description: "Assets, Story, Rules",
    },
  ];

  return (
    <div className="w-[280px] bg-[#13131a] border-r border-white/5 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Manga Studio</h1>
            <p className="text-xs text-gray-400">Ultimate Edition</p>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="p-4 border-b border-white/5">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Basketball Dreams</span>
          </div>
          <div className="flex gap-4 text-xs">
            <div>
              <div className="text-gray-400">Episodes</div>
              <div className="text-white font-bold">12</div>
            </div>
            <div>
              <div className="text-gray-400">Pages</div>
              <div className="text-white font-bold">84</div>
            </div>
            <div>
              <div className="text-gray-400">Chars</div>
              <div className="text-white font-bold">8</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="p-4 border-b border-white/5">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">QUICK START GUIDE</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <div>1. Create Story & Episodes</div>
          <div>2. Build Assets (Characters, Scenes)</div>
          <div>3. Generate Panels</div>
          <div>4. Compose Pages</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs opacity-70 truncate">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={onNewEpisode}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          New Episode
        </button>
        <button
          onClick={onManageStories}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition"
        >
          <BookMarked className="w-4 h-4" />
          Manage Stories
        </button>
      </div>
    </div>
  );
}
