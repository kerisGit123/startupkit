"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { X, AlertTriangle, Settings, Play } from "lucide-react";

interface BuildStoryboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"storyboard_projects">;
  onBuild: (config: BuildConfig) => Promise<void>;
  isBuilding: boolean;
  existingItems?: any[]; // Pass existing items from workspace
}

interface BuildConfig {
  buildType: "normal" | "enhanced";
  rebuildStrategy: "append_update" | "hard_rebuild";
  selectedScenes: string[]; // For append/update mode
  elementStrategy: "preserve" | "regenerate";
}

interface BuildAnalysis {
  hasExistingItems: boolean;
  hasExistingElements: boolean;
  sceneCount: number;
  elementCount: number;
  scenes: Array<{ id: string; sceneNumber: number; title: string }>;
}

export function BuildStoryboardModal({ isOpen, onClose, projectId, onBuild, isBuilding, existingItems = [] }: BuildStoryboardModalProps) {
  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    buildType: "normal",
    rebuildStrategy: "append_update",
    selectedScenes: [],
    elementStrategy: "preserve"
  });

  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");

  // Use existing items instead of making a separate query
  const analysis = existingItems;
  
  // Debug: Log the analysis data
  console.log('[BuildStoryboardModal] Analysis data:', analysis);
  console.log('[BuildStoryboardModal] Analysis length:', analysis?.length);
  console.log('[BuildStoryboardModal] ProjectId:', projectId);
  
  const buildAnalysis: BuildAnalysis = {
    hasExistingItems: (analysis?.length || 0) > 0,
    hasExistingElements: false, // TODO: Get from elements query
    sceneCount: analysis?.length || 0,
    elementCount: 0, // TODO: Get from elements query
    scenes: analysis?.map(item => ({
      id: item._id,
      sceneNumber: parseInt(item.sceneId?.replace('scene-', '') || '0') || 0,
      sceneId: item.sceneId,
      title: item.title
    })) || []
  };
  
  // Debug: Log the mapped scenes
  console.log('[BuildStoryboardModal] Mapped scenes:', buildAnalysis.scenes);

  const showRebuildOptions = buildAnalysis.hasExistingItems;
  const showSceneSelector = buildAnalysis.sceneCount > 0;

  const handleBuild = async () => {
    if (buildConfig.rebuildStrategy === "append_update" && buildConfig.selectedScenes.length === 0 && buildAnalysis.hasExistingItems) {
      alert("Please select scenes to update or choose Hard Rebuild to replace all content.");
      return;
    }

    const config: BuildConfig = {
      ...buildConfig
    };

    await onBuild(config);
    onClose();
  };

  const toggleSceneSelection = (sceneId: string) => {
    setBuildConfig(prev => ({
      ...prev,
      selectedScenes: prev.selectedScenes.includes(sceneId)
        ? prev.selectedScenes.filter(id => id !== sceneId)
        : [...prev.selectedScenes, sceneId]
    }));
  };

  const selectAllScenes = () => {
    setBuildConfig(prev => ({
      ...prev,
      selectedScenes: buildAnalysis.scenes.map(scene => scene.id)
    }));
  };

  const clearSceneSelection = () => {
    setBuildConfig(prev => ({
      ...prev,
      selectedScenes: []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 border border-neutral-800/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              Build Storyboard
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
              disabled={isBuilding}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-800/50 mb-6">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "basic"
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-neutral-400 hover:text-white"
              }`}
              disabled={isBuilding}
            >
              Basic Settings
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "advanced"
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-neutral-400 hover:text-white"
              }`}
              disabled={isBuilding}
            >
              Advanced Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-[50vh] overflow-y-auto">
            {activeTab === "basic" ? (
              /* Basic Tab Content - Compact Layout */
              <div className="grid grid-cols-1 gap-6">
                {/* Build Type and Rebuild Strategy Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Build Type Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Build Type</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-800/50 rounded-lg hover:bg-neutral-900 transition-colors">
                        <input
                          type="radio"
                          name="buildType"
                          checked={buildConfig.buildType === "normal"}
                          onChange={() => setBuildConfig(prev => ({ ...prev, buildType: "normal" }))}
                          className="w-4 h-4 text-indigo-500 mt-1"
                          disabled={isBuilding}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Normal Build</div>
                          <div className="text-sm text-neutral-400">Generate frames without AI extraction</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-800/50 rounded-lg hover:bg-neutral-900 transition-colors">
                        <input
                          type="radio"
                          name="buildType"
                          checked={buildConfig.buildType === "enhanced"}
                          onChange={() => setBuildConfig(prev => ({ ...prev, buildType: "enhanced" }))}
                          className="w-4 h-4 text-indigo-500 mt-1"
                          disabled={isBuilding}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Enhanced Build</div>
                          <div className="text-sm text-neutral-400">Generate frames + AI extraction</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Rebuild Strategy */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Rebuild Strategy</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-800/50 rounded-lg hover:bg-neutral-900 transition-colors">
                        <input
                          type="radio"
                          name="rebuildStrategy"
                          checked={buildConfig.rebuildStrategy === "append_update"}
                          onChange={() => setBuildConfig(prev => ({ ...prev, rebuildStrategy: "append_update" }))}
                          className="w-4 h-4 text-indigo-500 mt-1"
                          disabled={isBuilding}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Add/Update Scenes</div>
                          <div className="text-sm text-neutral-400">Add new or update existing scenes</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-red-600 rounded-lg hover:bg-red-900 transition-colors">
                        <input
                          type="radio"
                          name="rebuildStrategy"
                          checked={buildConfig.rebuildStrategy === "hard_rebuild"}
                          onChange={() => setBuildConfig(prev => ({ ...prev, rebuildStrategy: "hard_rebuild" }))}
                          className="w-4 h-4 text-red-500 mt-1"
                          disabled={isBuilding}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <div className="font-medium text-white">Replace All</div>
                          </div>
                          <div className="text-sm text-neutral-400">Remove and replace all content</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Element Strategy - Consistent 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Element Strategy</h3>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-800/50 rounded-lg hover:bg-neutral-900 transition-colors">
                        <input
                          type="radio"
                          name="elementStrategy"
                          checked={buildConfig.elementStrategy === "preserve"}
                          onChange={() => setBuildConfig(prev => ({ ...prev, elementStrategy: "preserve" }))}
                          className="w-4 h-4 text-indigo-500 mt-1"
                          disabled={isBuilding}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Preserve Elements</div>
                          <div className="text-sm text-neutral-400">Keep current elements unchanged</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-3 border border-neutral-800/50 rounded-lg hover:bg-neutral-900 transition-colors">
                        <input
                          type="radio"
                          name="elementStrategy"
                          checked={buildConfig.elementStrategy === "regenerate"}
                          onChange={() => setBuildConfig(prev => ({ ...prev, elementStrategy: "regenerate" }))}
                          className="w-4 h-4 text-indigo-500 mt-1"
                          disabled={isBuilding}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Regenerate Elements</div>
                          <div className="text-sm text-neutral-400">Create new elements</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Warning for destructive operations */}
                {buildConfig.rebuildStrategy === "hard_rebuild" && (
                  <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-semibold">Warning</span>
                    </div>
                    <p className="text-red-300 text-sm">
                      This will permanently delete all existing storyboard items and elements. This action cannot be undone.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Advanced Tab Content */
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Scene Selection (for Add/Update)</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-neutral-400">
                      {buildAnalysis.scenes.length} scene{buildAnalysis.scenes.length !== 1 ? 's' : ''} available
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllScenes}
                        className="px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors disabled:opacity-50"
                        disabled={isBuilding || buildConfig.rebuildStrategy !== "append_update"}
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSceneSelection}
                        className="px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors disabled:opacity-50"
                        disabled={isBuilding || buildConfig.rebuildStrategy !== "append_update"}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {buildAnalysis.scenes.length > 0 ? (
                    <div className={`max-h-64 overflow-y-auto border border-neutral-800/50 rounded-lg p-3 space-y-2 ${buildConfig.rebuildStrategy !== "append_update" ? "opacity-50" : ""}`}>
                      {buildAnalysis.scenes.map(scene => (
                        <label key={scene.id} className={`flex items-center gap-3 cursor-pointer p-2 hover:bg-neutral-900 rounded-md transition-colors ${buildConfig.rebuildStrategy !== "append_update" ? "cursor-not-allowed" : ""}`}>
                          <input
                            type="checkbox"
                            checked={buildConfig.selectedScenes.includes(scene.id)}
                            onChange={() => toggleSceneSelection(scene.id)}
                            className="w-4 h-4 text-indigo-500"
                            disabled={isBuilding || buildConfig.rebuildStrategy !== "append_update"}
                          />
                          <span className="text-sm text-neutral-300">
                            Scene {scene.sceneNumber}: {scene.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-neutral-800/50 rounded-lg p-4 text-center">
                      <p className="text-neutral-400 text-sm">
                        No scenes available. Build storyboard first to create scenes for selection.
                      </p>
                    </div>
                  )}
                </div>

                {/* Add/Update Info */}
                {buildConfig.rebuildStrategy === "append_update" && (
                  <div className="p-4 bg-indigo-900/20 border border-indigo-600 rounded-lg">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                      <Settings className="w-4 h-4" />
                      <span className="font-semibold">Add/Update Mode</span>
                    </div>
                    <p className="text-indigo-300 text-sm">
                      Unchecked scenes will be added as new content. Checked scenes will be updated with new content.
                    </p>
                    {buildConfig.selectedScenes.length > 0 && (
                      <p className="text-indigo-300 text-sm mt-2">
                        {buildConfig.selectedScenes.length} scene{buildConfig.selectedScenes.length !== 1 ? 's' : ''} selected for update
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-neutral-900 border-t border-neutral-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
            disabled={isBuilding}
          >
            Cancel
          </button>
          <button
            onClick={handleBuild}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            disabled={isBuilding}
          >
            {isBuilding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Building...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Build Storyboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
