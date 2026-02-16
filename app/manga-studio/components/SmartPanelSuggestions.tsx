"use client";

import { Lightbulb, Layout, Camera, Zap } from "lucide-react";

interface Suggestion {
  type: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  action: Record<string, any>;
}

interface SmartPanelSuggestionsProps {
  dialogue: string;
  stageDirection: string;
  onApplySuggestion: (suggestion: Record<string, any>) => void;
}

export function SmartPanelSuggestions({ 
  dialogue, 
  stageDirection, 
  onApplySuggestion 
}: SmartPanelSuggestionsProps) {
  
  // AI analysis based on dialogue length and content
  const analyzeDialogue = () => {
    const wordCount = dialogue.split(/\s+/).filter(Boolean).length;
    const hasAction = stageDirection.toLowerCase().includes("action") || 
                      stageDirection.toLowerCase().includes("fight") ||
                      stageDirection.toLowerCase().includes("running");
    const hasEmotion = dialogue.includes("!") || dialogue.includes("?");
    
    return { wordCount, hasAction, hasEmotion };
  };

  const { wordCount, hasAction, hasEmotion } = analyzeDialogue();

  const suggestions: Suggestion[] = [];

  // Panel layout suggestions
  if (wordCount > 50) {
    suggestions.push({
      type: "layout",
      title: "Wide Panel Recommended",
      desc: "Long dialogue needs more space",
      icon: Layout,
      color: "blue",
      action: { layout: "wide", panels: 2 }
    });
  } else if (wordCount < 10) {
    suggestions.push({
      type: "layout",
      title: "Compact Panel",
      desc: "Short dialogue - use smaller panel",
      icon: Layout,
      color: "green",
      action: { layout: "compact", panels: 4 }
    });
  }

  // Camera angle suggestions
  if (hasAction) {
    suggestions.push({
      type: "camera",
      title: "Dynamic Angle",
      desc: "Action scene - use dutch angle or low angle",
      icon: Camera,
      color: "purple",
      action: { cameraAngle: "dutch-angle" }
    });
  }

  if (hasEmotion) {
    suggestions.push({
      type: "camera",
      title: "Close-Up Shot",
      desc: "Emotional dialogue - focus on character face",
      icon: Camera,
      color: "orange",
      action: { cameraAngle: "close-up", panelSize: "large" }
    });
  }

  // Composition suggestions
  if (wordCount > 30 && hasAction) {
    suggestions.push({
      type: "composition",
      title: "Split Panel",
      desc: "Balance action and dialogue with 2-panel layout",
      icon: Zap,
      color: "yellow",
      action: { composition: "split", panels: 2 }
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: "general",
      title: "Standard Layout",
      desc: "Current setup looks good",
      icon: Lightbulb,
      color: "gray",
      action: {}
    });
  }

  const colorClasses = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    yellow: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    gray: "bg-gray-500/10 border-gray-500/30 text-gray-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">Smart Suggestions</h3>
        <span className="text-xs text-gray-400">AI-powered recommendations</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onApplySuggestion(suggestion.action)}
              className={`w-full p-3 rounded-lg border-2 transition text-left hover:scale-[1.02] ${
                colorClasses[suggestion.color as keyof typeof colorClasses]
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1">{suggestion.title}</div>
                  <div className="text-xs opacity-80">{suggestion.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Analysis Info */}
      <div className="mt-4 p-3 bg-[#0f1117] rounded-lg border border-white/10">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Dialogue words:</span>
            <span className="text-white font-medium">{wordCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Action detected:</span>
            <span className={hasAction ? "text-green-400" : "text-gray-500"}>
              {hasAction ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Emotion detected:</span>
            <span className={hasEmotion ? "text-orange-400" : "text-gray-500"}>
              {hasEmotion ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
