"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Film,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";

export function MangaStudioSidebar({
  onManageStories,
  onSettings,
}: {
  onManageStories: () => void;
  onSettings: () => void;
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
      description: "Episodes, panels & scripts",
    },
    {
      id: "universe",
      label: "Universe Manager",
      icon: Globe,
      href: "/manga-studio/universe",
      description: "Characters, Locations, Rules",
    },
    {
      id: "asset-generator",
      label: "Asset Generator",
      icon: Sparkles,
      href: "/manga-studio/asset-generator",
      description: "AI-powered asset creation",
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

      {/* Project Info - Redesigned */}
      <div className="p-4 border-b border-white/5">
        <div className="bg-[#1a1a24] rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-white">Basketball Dreams</span>
            <button
              onClick={onManageStories}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-purple-500/20"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Switch
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">12</div>
              <div className="text-xs text-gray-400 mt-1">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">48</div>
              <div className="text-xs text-gray-400 mt-1">Panels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">8</div>
              <div className="text-xs text-gray-400 mt-1">Chars</div>
            </div>
          </div>
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
          onClick={onManageStories}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 text-gray-300 rounded-lg text-sm hover:bg-white/10 transition"
        >
          <BookOpen className="w-4 h-4" />
          Manage Stories
        </button>
        <button
          onClick={onSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
}
