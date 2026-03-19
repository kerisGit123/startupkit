"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Play, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseScriptScenes } from "@/lib/storyboard/sceneParser";

interface BuildStoryboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentBuildType?: string;
  currentRebuildStrategy?: string;
  currentElementStrategy?: string;
  onSuccess?: () => void;
}

const BUILD_TYPES = [
  { value: "normal", label: "Normal Build", description: "Generate frames without AI extraction" },
  { value: "enhanced", label: "Enhanced Build", description: "Generate frames + AI-powered extraction" }
];

const REBUILD_STRATEGIES = [
  { value: "add_update", label: "Add/Update Scenes", description: "Keep existing content, add/update specific scenes" },
  { value: "replace_all", label: "Replace All", description: "Remove and replace all content" }
];

const ELEMENT_STRATEGIES = [
  { value: "preserve", label: "Preserve Elements", description: "Keep existing elements" },
  { value: "regenerate", label: "Regenerate Elements", description: "Re-extract all elements with AI" }
];

const SCRIPT_TYPES = [
  { value: "ANIMATED_STORIES", label: "Animated Stories", description: "General animated storytelling" },
  { value: "KIDS_ANIMATED_STORIES", label: "Kids Animated Stories", description: "Child-friendly animation content" },
  { value: "EDUCATIONAL_ANIMATIONS", label: "Educational Animations", description: "Learning-focused animations" },
  { value: "TUTORIAL_ANIMATIONS", label: "Tutorial Animations", description: "Step-by-step tutorials" },
  { value: "DOCUMENTARY_SHORTS", label: "Documentary Shorts", label: "Short documentary films" },
  { value: "EDUCATIONAL_SCIENCE_HISTORY", label: "Educational Science History", description: "Historical and scientific content" },
  { value: "FINANCE_EDUCATION", label: "Finance Education", description: "Financial concepts and tutorials" },
  { value: "AI_MUSIC_SONG_VIDEO", label: "AI Music Song Video", description: "Music video generation" },
  { value: "HEALTH_EDUCATION", label: "Health Education", description: "Medical and wellness content" },
  { value: "ADVERTISING", label: "Advertising", description: "Commercial content creation" },
  { value: "TUTORIAL_STEP_BY_STEP", label: "Tutorial Step by Step", description: "Detailed tutorials" }
];

const LANGUAGES = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "ar", label: "العربية", flag: "🇸🇦" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "ko", label: "한국어", flag: "🇰🇷" }
];

type DialogTab = "basic" | "advanced";

export function BuildStoryboardDialog({
  open,
  onOpenChange,
  projectId,
  currentBuildType = "normal",
  currentRebuildStrategy = "add_update",
  currentElementStrategy = "preserve",
  onSuccess
}: BuildStoryboardDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>("basic");
  const [buildType, setBuildType] = useState(currentBuildType || "enhanced");
  const [rebuildStrategy, setRebuildStrategy] = useState(currentRebuildStrategy || "add_update");
  const [elementStrategy, setElementStrategy] = useState(currentElementStrategy || "regenerate");
  const [scriptType, setScriptType] = useState("ANIMATED_STORIES");
  const [language, setLanguage] = useState("en");
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const project = useQuery(api.storyboard.projects.get, {
    id: projectId as Id<"storyboard_projects">,
  });

  const parsedScenes = useMemo(() => {
    const script = project?.script ?? "";
    return parseScriptScenes(script).scenes.map((scene, index) => ({
      id: scene.id,
      title: scene.title,
      label: `Scene ${index + 1}: ${scene.title}`,
    }));
  }, [project?.script]);

  const handleBuild = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/n8n-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          buildType,
          rebuildStrategy,
          scriptType,
          language,
          companyId: project?.companyId || '',
          script: project?.script || ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Build request failed');
      }
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Build failed');
      }
    } catch (error) {
      console.error('Build failed:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEnhancedBuild = buildType === "enhanced";
  const showSceneSelection = rebuildStrategy === "add_update";

  const toggleScene = (sceneId: string) => {
    setSelectedScenes((prev) =>
      prev.includes(sceneId)
        ? prev.filter((id) => id !== sceneId)
        : [...prev, sceneId]
    );
  };

  const selectedScriptType = SCRIPT_TYPES.find((type) => type.value === scriptType);
  const selectedLanguage = LANGUAGES.find((item) => item.value === language);

  const tabButtonClass = (tab: DialogTab) =>
    `border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
      activeTab === tab
        ? "border-violet-500 text-white"
        : "border-transparent text-neutral-500 hover:text-neutral-300"
    }`;

  const choiceCardClass = (selected: boolean, danger = false) =>
    `rounded-xl border p-4 text-left transition-all ${
      selected
        ? danger
          ? "border-red-500 bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]"
          : "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
    }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-white/10 bg-[#0b0b0d] p-0 text-white shadow-2xl sm:max-w-5xl">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/20">
              <Play className="h-4 w-4 text-white" />
            </span>
            Build Storyboard
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-2">
          <div className="flex border-b border-white/10">
            <button 
              type="button" 
              onClick={() => setActiveTab("basic")} 
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "basic"
                  ? "border-violet-500 text-white bg-violet-500/5"
                  : "border-transparent text-neutral-500 hover:text-neutral-300 hover:border-white/20"
              }`}
            >
              Basic Settings
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab("advanced")} 
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "advanced"
                  ? "border-violet-500 text-white bg-violet-500/5"
                  : "border-transparent text-neutral-500 hover:text-neutral-300 hover:border-white/20"
              }`}
            >
              Advanced Settings
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {activeTab === "basic" ? (
            <div className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4">Build Configuration</h3>
                    <div className="space-y-3">
                      {BUILD_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setBuildType(type.value)}
                          className={`w-full rounded-lg border p-4 text-left transition-all ${
                            buildType === type.value
                              ? "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 h-4 w-4 rounded-full border ${buildType === type.value ? "border-violet-400 bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" : "border-white/40 bg-transparent"}`} />
                            <div className="flex-1">
                              <div className="font-medium text-white">{type.label}</div>
                              <div className="mt-1 text-sm text-neutral-400">{type.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-white mb-4">Element Strategy</h3>
                    <div className="space-y-3">
                      {ELEMENT_STRATEGIES.map((strategy) => (
                        <button
                          key={strategy.value}
                          type="button"
                          onClick={() => setElementStrategy(strategy.value)}
                          className={`w-full rounded-lg border p-4 text-left transition-all ${
                            elementStrategy === strategy.value
                              ? "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 h-4 w-4 rounded-full border ${elementStrategy === strategy.value ? "border-violet-400 bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" : "border-white/40 bg-transparent"}`} />
                            <div className="flex-1">
                              <div className="font-medium text-white">{strategy.label}</div>
                              <div className="mt-1 text-sm text-neutral-400">{strategy.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4">Rebuild Strategy</h3>
                    <div className="space-y-3">
                      {REBUILD_STRATEGIES.map((strategy) => (
                        <button
                          key={strategy.value}
                          type="button"
                          onClick={() => setRebuildStrategy(strategy.value)}
                          className={`w-full rounded-lg border p-4 text-left transition-all ${
                            rebuildStrategy === strategy.value
                              ? strategy.value === "replace_all"
                                ? "border-red-500 bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]"
                                : "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
                              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 h-4 w-4 rounded-full border ${
                              rebuildStrategy === strategy.value
                                ? strategy.value === "replace_all"
                                  ? "border-red-400 bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                                  : "border-violet-400 bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                                : "border-white/40 bg-transparent"
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 font-medium text-white">
                                {strategy.value === "replace_all" && <AlertCircle className="h-4 w-4 text-red-400" />}
                                {strategy.label}
                              </div>
                              <div className="mt-1 text-sm text-neutral-400">{strategy.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                    <h3 className="text-base font-medium text-white mb-4">Script Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-neutral-300 mb-2 block">Script Type</Label>
                        <Select value={scriptType} onValueChange={setScriptType}>
                          <SelectTrigger className="border-white/10 bg-black/30 text-white">
                            <SelectValue placeholder="Select script type" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCRIPT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex flex-col">
                                  <span>{type.label}</span>
                                  <span className="text-xs text-neutral-400">{type.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-neutral-300 mb-2 block">Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="border-white/10 bg-black/30 text-white">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                <div className="flex items-center gap-2">
                                  <span>{lang.flag}</span>
                                  <span>{lang.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 p-6">
                <h3 className="text-base font-medium text-white mb-4">Build Summary</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Build Type</div>
                    <div className="text-sm font-medium text-white">{BUILD_TYPES.find((type) => type.value === buildType)?.label}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Strategy</div>
                    <div className="text-sm font-medium text-white">{REBUILD_STRATEGIES.find((item) => item.value === rebuildStrategy)?.label}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Elements</div>
                    <div className="text-sm font-medium text-white">{ELEMENT_STRATEGIES.find((item) => item.value === elementStrategy)?.label}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Script Type</div>
                    <div className="text-sm font-medium text-white">{selectedScriptType?.label}</div>
                  </div>
                  <div className="text-center sm:col-span-2 lg:col-span-1">
                    <div className="text-xs text-neutral-400 mb-1">Language</div>
                    <div className="text-sm font-medium text-white">{selectedLanguage?.label}</div>
                  </div>
                </div>
              </div>

              {rebuildStrategy === "replace_all" && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 font-medium text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    Warning
                  </div>
                  <p className="mt-2 text-sm text-red-200">
                    Replace All will remove existing storyboard content before rebuilding.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Scene Selection</h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    Select the scenes you want to update when using Add/Update mode.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
                    onClick={() => setSelectedScenes(parsedScenes.map((scene) => scene.id))}
                    disabled={!showSceneSelection || parsedScenes.length === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
                    onClick={() => setSelectedScenes([])}
                    disabled={!showSceneSelection || selectedScenes.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-4">
                <div className={`max-h-[400px] space-y-2 overflow-y-auto pr-2 ${!showSceneSelection ? "opacity-50" : ""}`}>
                  {parsedScenes.length > 0 ? (
                    parsedScenes.map((scene) => {
                      const checked = selectedScenes.includes(scene.id);
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => showSceneSelection && toggleScene(scene.id)}
                          className={`w-full rounded-lg border p-3 text-left transition-all ${
                            checked
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
                          disabled={!showSceneSelection}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`h-4 w-4 rounded border ${checked ? "border-violet-400 bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" : "border-white/30"}`} />
                            <span className="text-sm text-neutral-200">{scene.label}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-neutral-500">
                      No scenes found in the current script yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 p-6">
                <h3 className="text-base font-medium text-white mb-4">Advanced Summary</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Mode</div>
                    <div className="text-sm font-medium text-white">{showSceneSelection ? "Add / Update" : "Replace All"}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Scenes Available</div>
                    <div className="text-sm font-medium text-white">{parsedScenes.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">Scenes Selected</div>
                    <div className="text-sm font-medium text-white">{selectedScenes.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-400 mb-1">AI Build</div>
                    <div className="text-sm font-medium text-white">{isEnhancedBuild ? "Enhanced" : "Normal"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBuild}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  Building...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Build Storyboard
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
