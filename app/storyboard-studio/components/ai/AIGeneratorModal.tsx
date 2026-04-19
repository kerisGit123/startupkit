"use client";

import { useState } from "react";
import { Sparkles, Zap, Settings, Download, Share2, Users, MapPin, Package } from "lucide-react";
import { DarkModal } from "../shared/DarkModal";
import { AIGenerationRequest, AIGenerationResponse, Project } from "../../types/storyboard";

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onGenerate: (response: AIGenerationResponse) => void;
}

export function AIGeneratorModal({ isOpen, onClose, project, onGenerate }: AIGeneratorModalProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("shonen");
  const [itemCount, setItemCount] = useState(3);
  const [includeVisuals, setIncludeVisuals] = useState(true);
  const [includeScript, setIncludeScript] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate AI generation progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsGenerating(false);
          
          // Mock AI response
          const mockResponse: AIGenerationResponse = {
            items: [
              {
                id: `ai-${Date.now()}-1`,
                projectId: project.id,
                visual: {
                  composition: "medium shot",
                  cameraAngle: "eye level",
                  style: style,
                },
                script: {
                  dialogue: "This is amazing!",
                  action: "Character reacts with excitement",
                  description: "A moment of pure joy and achievement"
                },
                metadata: {
                  characters: ["Main Character"],
                  locations: ["Unknown"],
                  assets: [],
                  tags: ["emotional", "achievement", "generated"],
                  mood: "excited"
                },
                createdAt: new Date(),
                modifiedAt: new Date(),
                status: 'draft',
                priority: 1
              }
            ]
          };

          onGenerate(mockResponse);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  return (
    <DarkModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" noPadding>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Storyboard Generator
              </h2>
              <p className="text-sm text-gray-400">Generate new storyboard items with AI</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What would you like to generate?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene, action, dialogue, or mood you want to create..."
              className="w-full h-32 px-4 py-3 bg-[#0f1117] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific about characters, locations, emotions, and actions for best results.
            </p>
          </div>

          {/* Generation Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 bg-[#0f1117] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="shonen">Shonen (Action/Adventure)</option>
                <option value="seinen">Seinen (Mature/Drama)</option>
                <option value="shojo">Shojo (Romance/Drama)</option>
                <option value="kodomo">Kodomo (Children/Family)</option>
                <option value="josei">Josei (Adult Romance)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Number of Items</label>
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#0f1117] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value={1}>1 item</option>
                <option value={3}>3 items</option>
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
              </select>
            </div>
          </div>

          {/* Content Type Options */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Generate Content</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeScript}
                  onChange={(e) => setIncludeScript(e.target.checked)}
                  className="w-4 h-4 bg-[#0f1117] border border-white/10 rounded text-purple-500 focus:ring-purple-500/50"
                />
                <div>
                  <span className="text-white">Script Content</span>
                  <p className="text-xs text-gray-500">Dialogue, action, and scene descriptions</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVisuals}
                  onChange={(e) => setIncludeVisuals(e.target.checked)}
                  className="w-4 h-4 bg-[#0f1117] border border-white/10 rounded text-purple-500 focus:ring-purple-500/50"
                />
                <div>
                  <span className="text-white">Visual Composition</span>
                  <p className="text-xs text-gray-500">Camera angles, composition, and style guidance</p>
                </div>
              </label>
            </div>
          </div>

          {/* Context from Project */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Project Context (Optional)</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0f1117] border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-white">Characters</span>
                </div>
                <p className="text-xs text-gray-400">Auto-detected from project</p>
              </div>

              <div className="bg-[#0f1117] border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-white">Locations</span>
                </div>
                <p className="text-xs text-gray-400">Auto-detected from project</p>
              </div>

              <div className="bg-[#0f1117] border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-white">Assets</span>
                </div>
                <p className="text-xs text-gray-400">Auto-detected from project</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          {isGenerating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Generating storyboard items...</span>
                <span className="text-purple-400 font-bold">{Math.round(generationProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {generationProgress < 30 ? "Analyzing your prompt..." :
                   generationProgress < 60 ? "Generating script content..." :
                   generationProgress < 90 ? "Creating visual compositions..." :
                   "Finalizing storyboard items..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>~{itemCount} items</span>
                <span>•</span>
                <span>~{itemCount * 2} credits</span>
                <span>•</span>
                <span>~{itemCount * 5} seconds</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white/5 text-gray-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>
          )}
        </div>
    </DarkModal>
  );
}
