"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play, Pause, Upload, Download, Save, Settings, Trash2,
  ChevronDown, Plus, X, Sparkles, Video, Film, Clock, Monitor,
  Zap, Wand2, Volume2, VolumeX, SkipBack, SkipForward, RotateCcw,
  Scissors, Copy, Share2, Eye, EyeOff, MessageSquareText, Scan,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
export type VideoEditMode = "describe" | "style-transfer" | "motion";

interface ReferenceVideo {
  id: string;
  url: string;
  thumbnail: string;
  duration: number;
}

export interface VideoAIPanelProps {
  mode: VideoEditMode;
  onModeChange: (mode: VideoEditMode) => void;
  onGenerate: () => void;
  credits?: number;
  model?: string;
  onModelChange?: (model: string) => void;
  referenceVideos?: ReferenceVideo[];
  onAddReferenceVideo?: (file: File) => void;
  onRemoveReferenceVideo?: (id: string) => void;
  isGenerating?: boolean;
  userPrompt?: string;
  onUserPromptChange?: (prompt: string) => void;
  // Video-specific props
  duration?: number;
  onDurationChange?: (duration: number) => void;
  resolution?: string;
  onResolutionChange?: (resolution: string) => void;
  style?: string;
  onStyleChange?: (style: string) => void;
  frameRate?: number;
  onFrameRateChange?: (frameRate: number) => void;
  aspectRatio?: string;
  onAspectRatioChange?: (aspectRatio: string) => void;
  // Playback controls
  isPlaying?: boolean;
  onPlayPause?: () => void;
  currentTime?: number;
  onSeek?: (time: number) => void;
  totalDuration?: number;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  isMuted?: boolean;
  onMuteToggle?: () => void;
}

// ── Available Video Models ─────────────────────────────────────────────────
const VIDEO_MODELS = [
  { id: "runway-gen-2", label: "Runway Gen-2", icon: "🎬", credits: 15, maxDuration: 4 },
  { id: "pika-labs", label: "Pika Labs", icon: "🎥", credits: 12, maxDuration: 3 },
  { id: "kaiber", label: "Kaiber", icon: "🎨", credits: 18, maxDuration: 5 },
  { id: "stable-video", label: "Stable Video", icon: "🌟", credits: 10, maxDuration: 4 },
  { id: "lumalabs", label: "Luma Labs", icon: "💫", credits: 20, maxDuration: 5 },
];

// ── Video Duration Options ────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { value: 3, label: "3 seconds" },
  { value: 5, label: "5 seconds" },
  { value: 10, label: "10 seconds" },
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
];

// ── Resolution Options ───────────────────────────────────────────────────
const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p HD", width: 1280, height: 720 },
  { value: "1080p", label: "1080p Full HD", width: 1920, height: 1080 },
  { value: "4k", label: "4K Ultra HD", width: 3840, height: 2160 },
];

// ── Video Style Options ───────────────────────────────────────────────────
const STYLE_OPTIONS = [
  { value: "cinematic", label: "🎬 Cinematic", description: "Film-style with dramatic lighting" },
  { value: "anime", label: "🌸 Anime", description: "Japanese animation style" },
  { value: "documentary", label: "📹 Documentary", description: "Realistic documentary style" },
  { value: "animation", label: "🎨 Animation", description: "Cartoon animation style" },
  { value: "vintage", label: "📼 Vintage", description: "Retro film look" },
  { value: "futuristic", label: "🚀 Futuristic", description: "Sci-fi modern style" },
];

// ── Frame Rate Options ───────────────────────────────────────────────────
const FRAME_RATE_OPTIONS = [
  { value: 24, label: "24fps (Cinema)" },
  { value: 30, label: "30fps (Standard)" },
  { value: 60, label: "60fps (Smooth)" },
];

// ── Aspect Ratio Options ─────────────────────────────────────────────────
const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "21:9", label: "21:9 (Cinema)" },
];

// ── Toolbar button helper ────────────────────────────────────────────
function ToolBtn({
  active,
  danger,
  onClick,
  title,
  children,
  className,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
        active
          ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 shadow-2xl shadow-purple-400/60 ring-4 ring-purple-400/40 ring-offset-0"
          : danger
          ? "text-red-500 hover:bg-red-50 hover:text-red-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${className || ""}`}
      title={title}
    >
      {children}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────
export function VideoAIPanel({
  mode,
  onModeChange,
  onGenerate,
  credits,
  model = "runway-gen-2",
  onModelChange,
  referenceVideos,
  onAddReferenceVideo,
  onRemoveReferenceVideo,
  isGenerating,
  userPrompt,
  onUserPromptChange,
  // Video-specific props
  duration = 5,
  onDurationChange,
  resolution = "1080p",
  onResolutionChange,
  style = "cinematic",
  onStyleChange,
  frameRate = 30,
  onFrameRateChange,
  aspectRatio = "16:9",
  onAspectRatioChange,
  // Playback controls
  isPlaying = false,
  onPlayPause,
  currentTime = 0,
  onSeek,
  totalDuration = 5,
  volume = 0.8,
  onVolumeChange,
  isMuted = false,
  onMuteToggle,
}: VideoAIPanelProps) {
  const [activeTool, setActiveTool] = useState("elements");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showFrameRateDropdown, setShowFrameRateDropdown] = useState(false);
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);

  // Use passed props for prompt
  const currentPrompt = userPrompt || "";
  const handlePromptChange = (value: string) => {
    onUserPromptChange?.(value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get selected model display
  const getSelectedModelDisplay = () => {
    const selectedModel = VIDEO_MODELS.find(m => m.id === model);
    return selectedModel ? selectedModel.label : "Select Model";
  };

  const getSelectedModelCredits = () => {
    const selectedModel = VIDEO_MODELS.find(m => m.id === model);
    return selectedModel ? selectedModel.credits : 0;
  };

  // Handle file upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddReferenceVideo) {
      onAddReferenceVideo(file);
    }
  };

  // ── Left Toolbar ─────────────────────────────────────────────────────
  const renderLeftToolbar = () => {
    const ic = "w-4 h-4";
    const grp = "flex flex-col gap-1.5";

    return (
      <div className="absolute left-4 top-4 flex flex-col gap-6">
        {/* Group 1: Play/Pause, Reset */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => onPlayPause?.()} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className={ic} /> : <Play className={ic} />}
          </ToolBtn>
          <ToolBtn active={false} onClick={() => onSeek?.(0)} title="Reset to Start">
            <RotateCcw className={ic} />
          </ToolBtn>
        </div>

        {/* Group 2: Volume Controls */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => onMuteToggle?.()} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className={ic} /> : <Volume2 className={ic} />}
          </ToolBtn>
        </div>

        {/* Group 3: Video Tools */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => {}} title="Trim Video">
            <Scissors className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => {}} title="Duplicate">
            <Copy className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => {}} title="Export">
            <Download className={ic} />
          </ToolBtn>
        </div>
      </div>
    );
  };

  // ── Right Toolbar ────────────────────────────────────────────────────
  const renderRightToolbar = () => {
    const ic = "w-4 h-4";
    const grp = "flex flex-col gap-1.5";

    return (
      <div className="absolute right-4 top-4 flex flex-col gap-6">
        {/* Group 1: View Controls */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => {}} title="Preview">
            <Eye className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => {}} title="Fullscreen">
            <Monitor className={ic} />
          </ToolBtn>
        </div>

        {/* Group 2: Settings */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => {}} title="Video Settings">
            <Settings className={ic} />
          </ToolBtn>
        </div>
      </div>
    );
  };

  // ── Bottom Bar (openart.ai style with 20px gaps) ───────────────────────
  const renderBottomBar = () => {
    const modeTabs: {
      id: VideoEditMode;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [
      { id: "describe", label: "Describe", icon: MessageSquareText },
    ];

    return (
      <div className="absolute bottom-0 left-0 right-0 mx-[20px] mb-[20px] flex flex-col gap-3">
        {/* Reference Videos Panel */}
        <div className="mb-[0px]">
          {renderReferencePanel()}
        </div>

        {/* Main Panel */}
        <div className="bg-[#0a0a0f]/95 backdrop-blur-xl rounded-2xl border border-white/12 shadow-2xl shadow-black/20 ring-1 ring-white/5">
          {/* User Prompt Area (only in describe mode) */}
          {renderUserPromptArea()}
          
          {/* Row 1: Mode tabs + Video Settings + Model + Generate */}
          <div className="px-5 py-4 flex items-center gap-4">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5">
            {modeTabs.map((tab) => {
              const isActive = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onModeChange(tab.id);
                  }}
                  className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-full transition-all text-[13px] font-semibold tracking-tight ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-purple-500/40 text-purple-100 shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/50 ring-offset-2 ring-offset-black/20 backdrop-blur-sm border border-purple-400/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] hover:shadow-md hover:shadow-black/10 border border-transparent"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Video Settings Row */}
          <div className="flex items-center gap-2.5">
            {/* Duration */}
            <div className="relative">
              <button
                onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1a1a24]/90 backdrop-blur-sm text-white rounded-xl text-xs font-semibold hover:bg-[#1f1f2a]/90 transition-all duration-300 border border-white/15 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 group"
              >
                <Clock className="w-4 h-4 text-purple-300" />
                <span className="text-white/90">{duration}s</span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-purple-300 transition-all duration-200 group-hover:rotate-180 flex-shrink-0" />
              </button>
              {showDurationDropdown && (
                <div className="absolute bottom-full left-0 mb-3 bg-[#1a1a24]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl shadow-black/30 ring-1 ring-white/10 z-50 overflow-hidden">
                  <div className="p-2">
                    {DURATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onDurationChange?.(option.value);
                          setShowDurationDropdown(false);
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-white/[0.08] rounded-lg transition-all duration-200 text-xs group"
                      >
                        <div className="font-semibold text-white/90 group-hover:text-white">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution */}
            <div className="relative">
              <button
                onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1a1a24]/90 backdrop-blur-sm text-white rounded-xl text-xs font-semibold hover:bg-[#1f1f2a]/90 transition-all duration-300 border border-white/15 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 group"
              >
                <Monitor className="w-4 h-4 text-purple-300" />
                <span className="text-white/90">{resolution}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-purple-300 transition-all duration-200 group-hover:rotate-180 flex-shrink-0" />
              </button>
              {showResolutionDropdown && (
                <div className="absolute bottom-full left-0 mb-3 bg-[#1a1a24]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl shadow-black/30 ring-1 ring-white/10 z-50 overflow-hidden">
                  <div className="p-2">
                    {RESOLUTION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onResolutionChange?.(option.value);
                          setShowResolutionDropdown(false);
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-white/[0.08] rounded-lg transition-all duration-200 text-xs group"
                      >
                        <div className="font-semibold text-white/90 group-hover:text-white">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Aspect Ratio */}
            <div className="relative">
              <button
                onClick={() => setShowAspectRatioDropdown(!showAspectRatioDropdown)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1a1a24]/90 backdrop-blur-sm text-white rounded-xl text-xs font-semibold hover:bg-[#1f1f2a]/90 transition-all duration-300 border border-white/15 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 group"
              >
                <Film className="w-4 h-4 text-purple-300" />
                <span className="text-white/90">{aspectRatio}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-purple-300 transition-all duration-200 group-hover:rotate-180 flex-shrink-0" />
              </button>
              {showAspectRatioDropdown && (
                <div className="absolute bottom-full left-0 mb-3 bg-[#1a1a24]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl shadow-black/30 ring-1 ring-white/10 z-50 overflow-hidden">
                  <div className="p-2">
                    {ASPECT_RATIO_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onAspectRatioChange?.(option.value);
                          setShowAspectRatioDropdown(false);
                        }}
                        className="w-full px-3 py-2.5 text-left hover:bg-white/[0.08] rounded-lg transition-all duration-200 text-xs group"
                      >
                        <div className="font-semibold text-white/90 group-hover:text-white">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Dropdown */}
          <div className="relative" style={{ width: "220px" }}>
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1e1e24]/90 backdrop-blur-md text-white rounded-xl text-sm font-medium hover:bg-[#22222a]/90 transition-all duration-200 border border-white/8 hover:border-white/12 group"
            >
              <span className="text-sm text-white/95 truncate">{getSelectedModelDisplay()}</span>
              <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-all duration-200 group-hover:rotate-180 flex-shrink-0" />
            </button>
            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-3 w-full bg-[#1e1e24]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/20 z-50 overflow-hidden">
                <div className="p-3 space-y-1">
                  {VIDEO_MODELS.map((modelOption) => (
                    <button
                      key={modelOption.id}
                      onClick={() => {
                        onModelChange?.(modelOption.id);
                        setShowModelDropdown(false);
                      }}
                      className="w-full px-3 py-2.5 text-left hover:bg-white/[0.06] rounded-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-start">
                          <div className="text-sm font-medium text-white/95 group-hover:text-white">{modelOption.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300">{modelOption.credits} credits • {modelOption.maxDuration}s max</div>
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-400">
                          {modelOption.label.includes('Runway') ? '🎬' : modelOption.label.includes('Pika') ? '🎥' : modelOption.label.includes('Kaiber') ? '🎨' : modelOption.label.includes('Stable') ? '🌟' : '💫'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <button
              onClick={() => {}}
              className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-sm border border-white/15 hover:border-white/25 flex items-center justify-center transition-all duration-300 text-gray-400 hover:text-white hover:shadow-lg hover:shadow-black/20 group"
              title="Video Settings"
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Reset Button */}
            <button
              onClick={() => {
                onDurationChange?.(5);
                onResolutionChange?.("1080p");
                onStyleChange?.("cinematic");
                onAspectRatioChange?.("16:9");
                onFrameRateChange?.(30);
              }}
              className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-sm border border-white/15 hover:border-white/25 flex items-center justify-center transition-all duration-300 text-gray-400 hover:text-white hover:shadow-lg hover:shadow-black/20 group"
              title="Reset to Defaults"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold text-[13px] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/50 group"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              )}
              <span className="hidden sm:inline">Generate</span>
              <span className="text-white/80 text-xs font-medium">✦ {getSelectedModelCredits()}</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  };

  // ── Reference Videos Panel (all modes) ──────────────────
  const renderReferencePanel = () => {
    return (
      <div className="px-0 py-0">
        <div className="flex items-start gap-2.5 overflow-x-auto">
          {/* Reference video thumbnails */}
          {(referenceVideos ?? []).map((video) => (
            <div
              key={video.id}
              className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-white/20 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-xs text-white">
                {video.duration}s
              </div>
              {onRemoveReferenceVideo && (
                <button
                  onClick={() => onRemoveReferenceVideo(video.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          ))}

          {/* Add Video button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-14 h-14 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 flex flex-col items-center justify-center gap-1 transition text-gray-400 hover:text-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[9px]">Video</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoUpload}
        />
      </div>
    );
  };

  // ── User Prompt Text Area (inside bottom panel) ───────────────────────
  const renderUserPromptArea = () => {
    if (mode !== "describe") return null;

    return (
      <div className="px-[10px] pt-[10px] pb-0">
        <div className="flex items-start gap-2">
          <textarea
            value={currentPrompt || ""}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Describe the video you want to create..."
            className="flex-1 min-h-[40px] px-4 py-2 bg-transparent border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-all text-sm overflow-hidden resize-none"
            style={{ 
              caretColor: 'white',
              height: 'auto',
              minHeight: '40px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button
            className="shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 flex items-center justify-center transition text-gray-400 hover:text-gray-200 mt-1"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ── Timeline/Progress Bar ───────────────────────────────────────────────
  const renderTimeline = () => {
    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

    return (
      <div className="px-[10px] py-[6px] border-t border-white/[0.05]">
        <div className="flex items-center gap-3">
          {/* Time display */}
          <span className="text-xs text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          {/* Progress bar */}
          <div className="flex-1 relative">
            <div className="h-1 bg-white/20 rounded-full">
              <div 
                className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={totalDuration}
              value={currentTime}
              onChange={(e) => onSeek?.(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
            />
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMuteToggle}
              className="text-gray-400 hover:text-white transition"
            >
              {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  };

  // ── Utility Functions ───────────────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
      {/* Video area with toolbars */}
      <div className="flex-1 relative">
        <div className="pointer-events-auto">{renderLeftToolbar()}</div>
        <div className="pointer-events-auto">{renderRightToolbar()}</div>
      </div>

      {/* Bottom: Reference panel + Controls */}
      <div className="pointer-events-auto">
        {renderBottomBar()}
      </div>
    </div>
  );
}
