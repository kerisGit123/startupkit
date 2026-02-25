"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Film, FolderOpen, Users, Star, Clock, Tag, Check, Globe,
  ChevronDown, ChevronUp, Layers, Sliders, BookText, Crosshair, Sparkles,
} from "lucide-react";
import type { Project } from "../types";

interface SidebarNavProps {
  open: boolean;
  activeNav: string;
  onNavChange: (key: string) => void;
  projects?: Project[];
}

const TOP_ITEMS = [
  { key: "projects", icon: FolderOpen, label: "Projects",    desc: "Manage storyboard projects" },
  { key: "members",  icon: Users,      label: "Members",     desc: "" },
];

const ORGANIZE_ITEMS = [
  { key: "favourite", icon: Star,  label: "Favourite" },
  { key: "recent",    icon: Clock, label: "Recent" },
  { key: "tags",      icon: Tag,   label: "Tags" },
  { key: "statuses",  icon: Check, label: "Statuses" },
];

const UNIVERSE_NAV_ITEMS = [
  { key: "universe",        icon: Globe,    label: "Universe Manager" },
  { key: "asset-generator", icon: Sparkles, label: "Asset Generator"  },
];

const EXTERNAL_LINK_ITEMS = [
  { key: "manga-editor",       icon: Layers,    label: "Manga Editor",       href: "/manga-studio" },
  { key: "editor-playground",  icon: Sliders,   label: "Editor Playground",  href: "/manga-studio/playground" },
  { key: "storyboard-builder", icon: BookText,  label: "Storyboard Builder", href: "/manga-studio/script-breaker" },
  { key: "shot-manager",       icon: Crosshair, label: "Shot Manager",       href: "/manga-studio/episodes" },
];

export function SidebarNav({ open, activeNav, onNavChange, projects = [] }: SidebarNavProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    favourite: false, recent: false, tags: false, statuses: false,
  });

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const navBtn = (key: string, Icon: React.ElementType, label: string) => (
    <button
      key={key}
      onClick={() => onNavChange(key)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
        activeNav === key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <aside
      className={`flex flex-col bg-[#111118] border-r border-white/6 shrink-0 overflow-hidden transition-all duration-300 ${open ? "w-52" : "w-0"}`}
    >
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm whitespace-nowrap tracking-tight">
            Storyboard Studio
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Top items */}
        {TOP_ITEMS.map(item => navBtn(item.key, item.icon, item.label))}

        {/* Organize section */}
        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Organize</span>
        </div>

        {ORGANIZE_ITEMS.map(item => (
          <div key={item.key}>
            <button
              onClick={() => toggle(item.key)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {expanded[item.key]
                ? <ChevronUp className="w-3 h-3 opacity-60" />
                : <ChevronDown className="w-3 h-3 opacity-60" />}
            </button>
            {expanded[item.key] && (
              <div className="ml-9 py-1">
                {item.key === "tags" && (
                  <>
                    {(() => {
                      const allTags = new Set<string>();
                      projects.forEach(p => p.tags.forEach(t => allTags.add(t)));
                      return Array.from(allTags).map(tag => (
                        <button
                          key={tag}
                          onClick={() => onNavChange(`tag:${tag}`)}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                            activeNav === `tag:${tag}` ? "bg-white/10 text-white" : "text-gray-600 hover:text-white"
                          }`}
                        >
                          <Tag className="w-2.5 h-2.5 inline mr-1.5" />
                          {tag}
                        </button>
                      ));
                    })()}
                    {(() => {
                      const allTags = new Set<string>();
                      projects.forEach(p => p.tags.forEach(t => allTags.add(t)));
                      return allTags.size === 0 && (
                        <div className="text-xs text-gray-600">No tags yet</div>
                      );
                    })()}
                  </>
                )}
                {item.key === "favourite" && (
                  <>
                    {projects.filter(p => p.favourite).map(p => (
                      <button
                        key={p.id}
                        onClick={() => onNavChange(`project:${p.id}`)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                          activeNav === `project:${p.id}` ? "bg-white/10 text-white" : "text-gray-600 hover:text-white"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    {projects.filter(p => p.favourite).length === 0 && (
                      <div className="text-xs text-gray-600">No favourites yet</div>
                    )}
                  </>
                )}
                {item.key === "recent" && (
                  <>
                    {projects.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => onNavChange(`project:${p.id}`)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                          activeNav === `project:${p.id}` ? "bg-white/10 text-white" : "text-gray-600 hover:text-white"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <div className="text-xs text-gray-600">No recent items</div>
                    )}
                  </>
                )}
                {item.key === "statuses" && (
                  <>
                    {["On Hold", "In Progress", "Completed", "Draft"].map(status => (
                      <button
                        key={status}
                        onClick={() => onNavChange(`status:${status}`)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition ${
                          activeNav === `status:${status}` ? "bg-white/10 text-white" : "text-gray-600 hover:text-white"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Assets section */}
        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Assets</span>
        </div>

        {UNIVERSE_NAV_ITEMS.map(item => navBtn(item.key, item.icon, item.label))}

        {EXTERNAL_LINK_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.key} href={item.href}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
