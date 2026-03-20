"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Play, Sparkles, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface BuildStoryboardDialogSimplifiedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

const SCRIPT_TYPES = [
  { value: "ANIMATED_STORIES", label: "Animated Stories", description: "General animated storytelling" },
  { value: "KIDS_ANIMATED_STORIES", label: "Kids Animated Stories", description: "Child-friendly animation content" },
  { value: "EDUCATIONAL_ANIMATIONS", label: "Educational Animations", description: "Learning-focused animations" },
  { value: "TUTORIAL_ANIMATIONS", label: "Tutorial Animations", description: "Step-by-step tutorials" },
  { value: "DOCUMENTARY_SHORTS", label: "Documentary Shorts", description: "Short documentary films" },
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

export function BuildStoryboardDialogSimplified({
  open,
  onOpenChange,
  projectId,
  onSuccess
}: BuildStoryboardDialogSimplifiedProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scriptType, setScriptType] = useState("ANIMATED_STORIES");
  const [language, setLanguage] = useState("en");
  const project = useQuery(api.storyboard.projects.get, {
    id: projectId as Id<"storyboard_projects">,
  });

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
          buildType: "enhanced", // Fixed to enhanced
          rebuildStrategy: "replace_all", // Fixed to replace all
          scriptType: scriptType,
          language: language,
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

  const sceneCount = project?.script ? 
    project.script.split('SCENE').length - 1 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-white/10 bg-[#0b0b0d] p-0 text-white shadow-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/20">
              <Play className="h-4 w-4 text-white" />
            </span>
            Build Storyboard from Script
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          <div className="text-center">
            <p className="text-neutral-300 mb-6">
              Create storyboard items from your script with AI-powered elements and visuals
            </p>
          </div>

          {/* Features Checklist */}
          <div className="rounded-xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 p-6">
            <h3 className="text-base font-medium text-white mb-4">What will happen automatically:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-neutral-200">Parse script scenes automatically</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-neutral-200">Create storyboard items for all scenes</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-neutral-200">Generate AI elements and visuals</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-neutral-200">Replace existing items with fresh content</span>
              </div>
            </div>
          </div>

          {/* Script Settings */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-base font-medium text-white mb-4">Script Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
            
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Scenes Found</div>
                <div className="text-sm font-medium text-white">{sceneCount}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-1">Build Mode</div>
                <div className="text-sm font-medium text-white">Enhanced</div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4">
            <div className="flex items-center gap-2 font-medium text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              Smart Build
            </div>
            <p className="mt-2 text-sm text-green-200">
              Script-based content will be replaced with new items from your script.
              <br />
              <strong>Manual frames are automatically preserved.</strong>
              <br />
              <span className="text-xs">Private elements will be regenerated, public elements preserved.</span>
            </p>
          </div>

          {/* Alternative Option */}
          <div className="text-center">
            <p className="text-sm text-neutral-400 mb-2">
              Want to add frames manually instead?
            </p>
            <p className="text-xs text-neutral-500">
              Use the "+ Add Frame" button to create individual storyboard items
            </p>
          </div>
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
              disabled={isSubmitting || !project?.script}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  Building...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Build from Script
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
