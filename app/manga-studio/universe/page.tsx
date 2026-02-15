"use client";

import { useState } from "react";
import { Save, Sparkles, Download, Settings, BookOpen, MapPin, Users, BookMarked, Image, Wrench } from "lucide-react";

type TabType = "rules" | "locations" | "characters" | "story" | "scenes" | "props";

export default function UniverseManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>("story");

  const tabs = [
    { id: "rules" as TabType, label: "Rules", icon: BookOpen },
    { id: "locations" as TabType, label: "Locations", icon: MapPin },
    { id: "characters" as TabType, label: "Character Database", icon: Users },
    { id: "story" as TabType, label: "Story Structure", icon: BookMarked },
    { id: "scenes" as TabType, label: "Scenes", icon: Image },
    { id: "props" as TabType, label: "Props & Tools", icon: Wrench },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="h-16 bg-[#13131a] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-bold text-lg">Universe Manager</h2>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
            World-building hub
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
          <button className="w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-[#13131a] border-r border-white/5 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
          {activeTab === "story" && <StoryStructureTab />}
          {activeTab === "scenes" && <ScenesTab />}
          {activeTab === "props" && <PropsTab />}
          {activeTab === "rules" && <RulesTab />}
          {activeTab === "locations" && <LocationsTab />}
          {activeTab === "characters" && <CharactersTab />}
        </div>
      </div>
    </>
  );
}

// Story Structure Tab Component
function StoryStructureTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Story Structure</h3>
        <p className="text-gray-400 text-sm">Story → Sections → Episodes → Panels</p>
      </div>

      {/* Basketball Dreams Story */}
      <div className="bg-[#13131a] rounded-xl p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <div>
              <h4 className="text-xl font-bold text-white">Basketball Dreams</h4>
              <p className="text-xs text-gray-400">Main Story</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">
            Edit
          </button>
        </div>

        {/* Section 1 */}
        <div className="bg-[#1a1a24] rounded-xl p-5 mb-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-orange-400 font-bold">Section 1: The Beginning</div>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Training Arc</span>
            </div>
            <span className="text-xs text-gray-400">4 Episodes</span>
          </div>

          {/* Episodes */}
          <div className="space-y-2">
            <div className="bg-[#0a0a0f] rounded-lg p-3 border border-green-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm font-semibold text-white">Episode 1: First Day</span>
                  <span className="text-xs text-gray-500">9 panels</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-blue-400 rounded text-xs">View</button>
                  <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-xs">Edit</button>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0f] rounded-lg p-3 border border-blue-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm font-semibold text-white">Episode 2: The Challenge</span>
                  <span className="text-xs text-gray-500">8 panels</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-blue-400 rounded text-xs">View</button>
                  <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-xs">Edit</button>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-sm transition">
            + Add Episode
          </button>
        </div>

        {/* Section 2 */}
        <div className="bg-[#1a1a24] rounded-xl p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-purple-400 font-bold">Section 2: Training Arc</div>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">Tournament Arc</span>
            </div>
            <span className="text-xs text-gray-400">3 Episodes</span>
          </div>
        </div>

        <button className="w-full mt-4 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition">
          + Add Section
        </button>
      </div>
    </div>
  );
}

// Scenes Tab Component
function ScenesTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Scenes Database</h3>
          <p className="text-gray-400 text-sm">Manage background scenes and locations</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition">
          + Add Scene
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#13131a] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-cyan-900/30 flex items-center justify-center">
            <div className="text-6xl">🏀</div>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-bold text-white mb-1">Basketball Court</h4>
            <p className="text-xs text-gray-400 mb-3">Main training ground</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Outdoor</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Day</span>
            </div>
          </div>
        </div>

        <div className="bg-[#13131a] rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
            <div className="text-6xl">🏫</div>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-bold text-white mb-1">Seirin High School</h4>
            <p className="text-xs text-gray-400 mb-3">School building exterior</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">Outdoor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Props Tab Component
function PropsTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Props & Tools Database</h3>
          <p className="text-gray-400 text-sm">Manage objects, equipment, and tools</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition">
          + Add Prop
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#13131a] rounded-xl p-4 border border-white/5 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-square bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-lg flex items-center justify-center mb-3">
            <div className="text-4xl">🏀</div>
          </div>
          <h4 className="text-sm font-bold text-white text-center mb-1">Basketball</h4>
          <p className="text-xs text-gray-400 text-center">Standard ball</p>
        </div>

        <div className="bg-[#13131a] rounded-xl p-4 border border-white/5 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-square bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg flex items-center justify-center mb-3">
            <div className="text-4xl">👕</div>
          </div>
          <h4 className="text-sm font-bold text-white text-center mb-1">Team Jersey</h4>
          <p className="text-xs text-gray-400 text-center">Seirin uniform</p>
        </div>

        <div className="bg-[#13131a] rounded-xl p-4 border border-white/5 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-square bg-gradient-to-br from-gray-900/20 to-gray-700/20 rounded-lg flex items-center justify-center mb-3">
            <div className="text-4xl">📱</div>
          </div>
          <h4 className="text-sm font-bold text-white text-center mb-1">Smartphone</h4>
          <p className="text-xs text-gray-400 text-center">Modern phone</p>
        </div>
      </div>
    </div>
  );
}

// Rules System Tab
function RulesTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Rules System</h3>
          <p className="text-gray-400 text-sm">Define power systems, technologies, and laws of your world</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zone Defense System */}
        <div className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Zone Defense System</h4>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">Power System</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Players can create defensive zones that slow opponents...
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition">Edit</button>
            <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition">Delete</button>
          </div>
        </div>

        {/* Court Technology */}
        <div className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Court Technology</h4>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">Technology</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Smart courts with holographic displays and AI analysis...
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition">Edit</button>
            <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Locations Database Tab
function LocationsTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Locations Database</h3>
          <p className="text-gray-400 text-sm">Catalog all places in your manga world</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seirin High School */}
        <div className="bg-[#13131a] rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
            <svg className="w-20 h-20 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="p-4">
            <h4 className="text-lg font-bold text-white mb-2">Seirin High School</h4>
            <p className="text-sm text-gray-400 mb-3">Main training ground</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Urban</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">School</span>
            </div>
          </div>
        </div>

        {/* National Arena */}
        <div className="bg-[#13131a] rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition cursor-pointer">
          <div className="aspect-video bg-gradient-to-br from-orange-900/30 to-red-900/30 flex items-center justify-center">
            <svg className="w-20 h-20 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="p-4">
            <h4 className="text-lg font-bold text-white mb-2">National Arena</h4>
            <p className="text-sm text-gray-400 mb-3">Tournament venue</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">Arena</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Character Database Tab
function CharactersTab() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Character Database</h3>
          <p className="text-gray-400 text-sm">Centralized character information and tracking</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Character
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kaito */}
        <div className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              K
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-1">Kaito</h4>
              <p className="text-sm text-gray-400 mb-2">Protagonist</p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Main</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Hero</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Age:</span>
              <span className="text-white">16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ability:</span>
              <span className="text-white">Speed Burst</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Episodes:</span>
              <span className="text-purple-400">1, 2, 4, 8</span>
            </div>
          </div>
        </div>

        {/* Ryu */}
        <div className="bg-[#13131a] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              R
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-1">Ryu</h4>
              <p className="text-sm text-gray-400 mb-2">Rival</p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">Support</span>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Rival</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Age:</span>
              <span className="text-white">17</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ability:</span>
              <span className="text-white">Defense Zone</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Episodes:</span>
              <span className="text-purple-400">2, 4, 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
