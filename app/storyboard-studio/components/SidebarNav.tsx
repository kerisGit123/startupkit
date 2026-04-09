"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Film, FolderOpen, Users, Star, Clock, Tag, Check,
  ChevronDown, ChevronUp, BarChart2, LayoutGrid, Settings,
  LogOut, DollarSign, CreditCard, Trash2, LifeBuoy, ScrollText,
} from "lucide-react";
import type { Project } from "../types";
import { useStoryboardStudioUI } from "../StoryboardStudioUIContext";
import CreditBalanceDisplay from "./account/CreditBalanceDisplay";

interface SidebarNavProps {
  open: boolean;
  activeNav: string;
  onNavChange: (key: string) => void;
  projects?: Project[];
  onOpenSettings?: () => void;
}

const TOP_ITEMS = [
  { key: "projects", icon: FolderOpen, label: "Projects",    desc: "Manage storyboard projects" },
  { key: "members",  icon: Users,      label: "Members",     desc: "" },
  { key: "usage",    icon: BarChart2,  label: "Usage",       desc: "Credit usage analytics" },
];

const ORGANIZE_ITEMS = [
  { key: "recent", icon: Clock, label: "Recent" },
  { key: "tags",  icon: Tag,   label: "Tags" },
];

const UNIVERSE_NAV_ITEMS = [
  { key: "price-management", icon: DollarSign, label: "Price Management" },
  { key: "billing", icon: CreditCard, label: "Billing & Subscription" },
  { key: "support", icon: LifeBuoy, label: "Support" },
  { key: "logs", icon: ScrollText, label: "Logs" },
  { key: "cleaning", icon: Trash2, label: "Cleaning" },
];

const EXTERNAL_LINK_ITEMS = [
  // Removed manga editor references
];

export function SidebarNav({ open, activeNav, onNavChange, projects = [], onOpenSettings }: SidebarNavProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    recent: false, tags: false,
  });
  const { setSidebarOpen } = useStoryboardStudioUI();

  const handleNavChange = (key: string) => {
    onNavChange(key);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const navBtn = (key: string, Icon: React.ElementType, label: string) => (
    <button
      key={key}
      onClick={() => handleNavChange(key)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${
        activeNav === key ? "bg-(--accent-purple) text-(--text-primary) shadow-sm" : "text-white hover:text-gray-200 hover:bg-(--bg-tertiary)"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <>
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-(--bg-secondary) border-r border-(--border-primary) overflow-hidden transition-transform duration-300 md:static md:z-auto md:w-52 md:max-w-none md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-linear-to-br from-(--accent-purple) to-(--accent-purple-hover) flex items-center justify-center shrink-0 shadow-lg shadow-(--accent-purple)/25">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-(--text-primary) font-bold text-sm whitespace-nowrap tracking-tight">
            Storyboard Studio
          </span>
        </div>
      </div>

      {/* Credit Balance */}
      <div className="px-4 py-3 border-b border-(--border-primary) shrink-0">
        <CreditBalanceDisplay className="w-full" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Top items */}
        {TOP_ITEMS.map(item => navBtn(item.key, item.icon, item.label))}
        {/* Organize section */}
        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Organize</span>
        </div>

        {ORGANIZE_ITEMS.map(item => (
          <div key={item.key}>
            <button
              onClick={() => toggle(item.key)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white hover:text-gray-200 hover:bg-(--bg-tertiary) transition-all duration-200 whitespace-nowrap"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {expanded[item.key]
                ? <ChevronUp className="w-3 h-3 text-gray-400" />
                : <ChevronDown className="w-3 h-3 text-gray-400" />}
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
                          onClick={() => {
                            const filterKey = `tag:${tag}`;
                            if (activeNav === filterKey) {
                              handleNavChange('');
                            } else {
                              handleNavChange(filterKey);
                            }
                          }}
                          className={`w-full text-left px-2 py-1 rounded-xl text-xs transition-all duration-200 ${
                            activeNav === `tag:${tag}` ? "bg-(--accent-purple) text-(--text-primary) shadow-sm" : "text-gray-300 hover:text-white hover:bg-(--bg-tertiary)"
                          }`}
                        >
                          <Tag className="w-2.5 h-2.5 inline mr-1.5 text-(--accent-purple)" />
                          {tag}
                        </button>
                      ));
                    })()}
                    {(() => {
                      const allTags = new Set<string>();
                      projects.forEach(p => p.tags.forEach(t => allTags.add(t)));
                      return allTags.size === 0 && (
                        <div className="text-xs text-gray-400">No tags yet</div>
                      );
                    })()}
                  </>
                )}
                {item.key === "recent" && (
                  <>
                    {[...projects].reverse().slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const filterKey = `project:${p.id}`;
                          if (activeNav === filterKey) {
                            handleNavChange('');
                          } else {
                            handleNavChange(filterKey);
                          }
                        }}
                        className={`w-full text-left px-2 py-1 rounded-xl text-xs transition-all duration-200 ${
                          activeNav === `project:${p.id}` ? "bg-(--accent-purple) text-(--text-primary) shadow-sm" : "text-gray-300 hover:text-white hover:bg-(--bg-tertiary)"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <div className="text-xs text-gray-400">No recent items</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Assets section */}
        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Assets</span>
        </div>

        {UNIVERSE_NAV_ITEMS.map(item => navBtn(item.key, item.icon, item.label))}

        {/* External links section removed - no manga editor links */}
      </nav>

      <div className="border-t border-(--border-primary) p-2 shrink-0">
        <div className="space-y-1">
          <button
            onClick={() => handleNavChange("projects")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${
              activeNav === "projects" ? "bg-(--accent-purple) text-(--text-primary) shadow-sm" : "text-white hover:text-gray-200 hover:bg-(--bg-tertiary)"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            logout
          </button>

          <button
            onClick={() => {
              onOpenSettings?.();
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all duration-200 text-white hover:text-gray-200 hover:bg-(--bg-tertiary)"
          >
            <Settings className="w-4 h-4 shrink-0" />
            Setting
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
