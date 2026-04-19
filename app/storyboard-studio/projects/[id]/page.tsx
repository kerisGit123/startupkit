"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Settings, Download, Share, Plus, Sparkles, Layers, FileText, Grid3x3, Eye, Zap, BarChart3 } from "lucide-react";
import { AIGeneratorModal } from "../../components/ai/AIGeneratorModal";
import { TimelineView } from "../../components/storyboard/TimelineView";
import { ExportModal } from "../../components/modals/ExportModal";
import { MetadataManager } from "../../components/storyboard/MetadataManager";
import { ScriptView, StoryboardView, SingleModeView } from "../../components/storyboard/ViewComponents";

// Types
interface StoryboardItem {
  id: string;
  projectId: string;
  visual: {
    imageUrl?: string;
    composition: string;
    cameraAngle: string;
    style: string;
  };
  script: {
    dialogue: string;
    action: string;
    description: string;
  };
  metadata: {
    characters: string[];
    locations: string[];
    assets: string[];
    tags: string[];
    mood: string;
  };
  createdAt: Date;
  modifiedAt: Date;
  status: 'draft' | 'completed';
  priority: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  storyboard: StoryboardItem[];
  settings: {
    theme: string;
    style: string;
    defaultView: 'script' | 'storyboard' | 'single';
    aiModel: string;
  };
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  status: 'draft' | 'in-progress' | 'completed';
  collaborators: string[];
}

export default function StoryboardWorkspace() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'script' | 'storyboard' | 'single'>('storyboard');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock project data
  useEffect(() => {
    const mockProject: Project = {
      id: projectId,
      name: "Basketball Story",
      description: "A tale of determination and teamwork",
      settings: {
        theme: "sports",
        style: "storyboard",
        defaultView: "storyboard",
        aiModel: "gpt-4"
      },
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20'),
      tags: ['sports', 'shonen', 'school'],
      status: 'in-progress' as const,
      collaborators: ['user1', 'artist2'],
      storyboard: [
        {
          id: "item-1",
          projectId,
          visual: {
            composition: "wide shot",
            cameraAngle: "eye level",
            style: "shonen"
          },
          script: {
            dialogue: "Hi team! I'm ready to join.",
            action: "Kaito enters the gym with determination",
            description: "Morning light streams through gym windows as Kaito steps inside"
          },
          metadata: {
            characters: ["Kaito", "Team"],
            locations: ["Gym"],
            assets: ["Basketball", "Uniform"],
            tags: ["intro", "gym", "morning", "determined"],
            mood: "hopeful"
          },
          createdAt: new Date('2024-01-15'),
          modifiedAt: new Date('2024-01-20'),
          status: 'completed',
          priority: 1
        },
        {
          id: "item-2",
          projectId,
          visual: {
            composition: "medium shot",
            cameraAngle: "low angle",
            style: "shonen"
          },
          script: {
            dialogue: "Let's see what you've got, rookie.",
            action: "Team captain eyes Kaito up and down",
            description: "Team captain stands with arms crossed, assessing the new player"
          },
          metadata: {
            characters: ["Team Captain", "Kaito"],
            locations: ["Gym"],
            assets: ["Whistle"],
            tags: ["confrontation", "gym", "team", "challenge"],
            mood: "tense"
          },
          createdAt: new Date('2024-01-16'),
          modifiedAt: new Date('2024-01-21'),
          status: 'draft',
          priority: 2
        }
      ]
    };

    setProject(mockProject);
    setViewMode(mockProject.settings.defaultView);
    setIsLoading(false);
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f0f14]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <p className="text-gray-400 mb-4">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/storyboard/projects')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Extract all unique tags, characters, locations
  const allTags = [...new Set(project.storyboard.flatMap(item => item.metadata.tags))];
  const allCharacters = [...new Set(project.storyboard.flatMap(item => item.metadata.characters))];
  const allLocations = [...new Set(project.storyboard.flatMap(item => item.metadata.locations))];

  const filteredItems = project.storyboard.filter(item => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tag => item.metadata.tags.includes(tag));
  });

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/storyboard/projects')}
              className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              <p className="text-sm text-gray-400">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-[#1a1a24] rounded-lg p-1">
              <button
                onClick={() => setViewMode('script')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'script' ? 'bg-white/10 text-white' : 'text-gray-500'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Script
              </button>
              <button
                onClick={() => setViewMode('storyboard')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'storyboard' ? 'bg-white/10 text-white' : 'text-gray-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Storyboard
              </button>
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'single' ? 'bg-white/10 text-white' : 'text-gray-500'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Single
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowAIGenerator(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>

            <button className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
              <Download className="w-4 h-4" />
            </button>

            <button className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
              <Share className="w-4 h-4" />
            </button>

            <button className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Items:</span>
              <span className="text-white font-medium">{filteredItems.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Characters:</span>
              <span className="text-white font-medium">{allCharacters.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Locations:</span>
              <span className="text-white font-medium">{allLocations.length}</span>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filter by tags:</span>
            <div className="flex gap-1">
              {allTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => 
                    prev.includes(tag) 
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 8 && (
                <button className="px-2 py-1 bg-white/5 text-gray-500 rounded text-xs">
                  +{allTags.length - 8} more
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'script' && (
          <ScriptView items={filteredItems} characters={allCharacters} locations={allLocations} />
        )}
        {viewMode === 'storyboard' && (
          <StoryboardView items={filteredItems} characters={allCharacters} locations={allLocations} />
        )}
        {viewMode === 'single' && (
          <SingleModeView items={filteredItems} characters={allCharacters} locations={allLocations} />
        )}
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <AIGeneratorModal
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          project={project}
          onGenerate={(response) => {
            setProject(prev => prev ? {
              ...prev,
              storyboard: [...prev.storyboard, ...response.items as StoryboardItem[]]
            } : null);
            setShowAIGenerator(false);
          }}
        />
      )}
    </div>
  );
}

