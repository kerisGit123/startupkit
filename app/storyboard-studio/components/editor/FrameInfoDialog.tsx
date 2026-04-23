"use client";

import React, { useState } from "react";
import {
  Image, Video, FileText, MessageSquare, Tag,
  Clock, RectangleHorizontal, MapPin, Camera, Film,
  Clapperboard, Mic, Sparkles,
} from "lucide-react";
import type { Shot } from "../../types";
import { DarkModal } from "../shared/DarkModal";

interface FrameInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeShot: Shot | null;
  onShotsChange: (shots: Shot[]) => void;
  shots: Shot[];
  activeShotId: string;
}

// ─── Readout Card (cinema monitor style) ────────────────────────────────────

function ReadoutCard({
  label,
  value,
  icon: Icon,
  accent,
  large,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<any>;
  accent?: string;
  large?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-linear-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-white/4 p-3 group">
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-3 right-3 h-px opacity-40"
        style={{ background: accent || "var(--accent-blue)" }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A] mb-1.5 flex items-center gap-1.5">
            {Icon && <Icon className="w-3 h-3 opacity-60" strokeWidth={1.75} />}
            {label}
          </div>
          <div className={`text-(--text-primary) font-semibold truncate ${large ? "text-[22px] tracking-tight" : "text-[13px]"}`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Media Status Badge ─────────────────────────────────────────────────────

function MediaBadge({ shot }: { shot: Shot }) {
  const hasVideo = !!shot.videoUrl;
  const hasImage = !!shot.imageUrl;

  if (hasVideo) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-linear-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-white/4 p-3">
        <div className="absolute top-0 left-3 right-3 h-px bg-red-500 opacity-40" />
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A] mb-1.5 flex items-center gap-1.5">
          <Film className="w-3 h-3 opacity-60" strokeWidth={1.75} />
          Media
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/15 text-red-400 text-[10px] font-semibold uppercase tracking-wide">
            <Video className="w-3 h-3" strokeWidth={1.75} />
            Video
          </span>
          {hasImage && (
            <span className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400/60 text-[9px] font-medium">
              + Image
            </span>
          )}
        </div>
      </div>
    );
  }

  if (hasImage) {
    return (
      <div className="relative overflow-hidden rounded-lg bg-linear-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-white/4 p-3">
        <div className="absolute top-0 left-3 right-3 h-px bg-emerald-500 opacity-40" />
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A] mb-1.5 flex items-center gap-1.5">
          <Film className="w-3 h-3 opacity-60" strokeWidth={1.75} />
          Media
        </div>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide w-fit">
          <Image className="w-3 h-3" strokeWidth={1.75} />
          Image
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-linear-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-white/4 p-3">
      <div className="absolute top-0 left-3 right-3 h-px bg-(--border-primary) opacity-40" />
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary) mb-1.5 flex items-center gap-1.5">
        <Film className="w-3 h-3 opacity-50" strokeWidth={1.75} />
        Media
      </div>
      <span className="text-[11px] text-(--text-tertiary)">No media</span>
    </div>
  );
}

// ─── Section Header (editing bay style) ─────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  accent,
}: {
  icon: React.ComponentType<any>;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center"
        style={{ background: `${accent || "var(--accent-blue)"}20` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent || "var(--accent-blue)" }} strokeWidth={1.75} />
      </div>
      <h4 className="text-[13px] font-bold text-(--text-primary)">{label}</h4>
      <div className="flex-1 h-px bg-linear-to-r from-(--border-primary) to-transparent" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function FrameInfoDialog({
  isOpen,
  onClose,
  activeShot,
  onShotsChange,
  shots,
  activeShotId
}: FrameInfoDialogProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'prompts' | 'info'>('script');

  if (!isOpen || !activeShot) return null;

  const frameNum = String((activeShot.order || 0) + 1).padStart(2, "0");

  const tabs = [
    { id: 'script' as const, label: 'Script', icon: MessageSquare, accent: "var(--accent-blue)" },
    { id: 'prompts' as const, label: 'Prompts', icon: Sparkles, accent: "var(--accent-teal)" },
    { id: 'info' as const, label: 'Details', icon: Tag, accent: "var(--color-warning)" },
  ];

  const textareaClass =
    "w-full bg-(--bg-secondary) border border-white/4 rounded-lg text-(--text-primary) text-[13px] p-3.5 resize-none " +
    "placeholder:text-(--text-tertiary) leading-relaxed " +
    "focus:outline-none focus:border-white/10 focus:bg-(--bg-tertiary) transition-colors";

  return (
    <DarkModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" overlayOpacity={85} noPadding className="bg-(--bg-secondary)">
      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-white/4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/4">
            <Clapperboard className="w-3.5 h-3.5 text-(--accent-blue)" strokeWidth={1.75} />
            <span className="text-[13px] font-semibold text-(--text-primary) tabular-nums">#{frameNum}</span>
          </div>
          <div className="w-px h-4 bg-white/6" />
          <span className="text-[13px] font-semibold text-(--text-primary)">{activeShot.title || "Untitled"}</span>
        </div>

        {/* Inline status pills */}
        <div className="flex items-center gap-2 mr-8">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-white/4 text-[#8A8A8A] tabular-nums">
            <Clock className="w-3 h-3" strokeWidth={1.75} />
            {activeShot.duration || 3}s
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/4 text-(--text-tertiary)">
            <RectangleHorizontal className="w-3 h-3" strokeWidth={1.75} />
            {activeShot.aspectRatio || "16:9"}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex">
        {/* ── Left Column: Readouts ── */}
        <div className="w-[220px] shrink-0 border-r border-white/4 p-4 space-y-2.5 bg-(--bg-secondary)/50">
          <ReadoutCard label="Scene" value={`Scene ${activeShot.scene}`} icon={Clapperboard} large />

          <div className="grid grid-cols-2 gap-2">
            <ReadoutCard label="Duration" value={`${activeShot.duration || 3}s`} icon={Clock} accent="var(--color-warning)" />
            <ReadoutCard label="Ratio" value={activeShot.aspectRatio || "16:9"} icon={RectangleHorizontal} accent="var(--accent-teal)" />
          </div>

          <ReadoutCard label="Location" value={activeShot.location || "Not specified"} icon={MapPin} />
          <ReadoutCard label="Camera" value={activeShot.camera?.length ? activeShot.camera.join(", ") : "Not specified"} icon={Camera} />

          {activeShot.mood && (
            <ReadoutCard label="Mood" value={activeShot.mood} accent="var(--color-warning)" />
          )}
          {activeShot.lighting && (
            <ReadoutCard label="Lighting" value={activeShot.lighting} accent="var(--accent-teal)" />
          )}

          <MediaBadge shot={activeShot} />
        </div>

        {/* ── Right Column: Tabbed Editor ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar — NLE-style segmented control */}
          <div className="flex items-center border-b border-white/4 px-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                    isActive
                      ? "text-(--text-primary)"
                      : "text-[#8A8A8A] hover:text-(--text-primary)"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {tab.label}
                  {/* Active underline */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                      style={{ background: tab.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ── Script Tab ── */}
            {activeTab === "script" && (
              <>
                <div>
                  <SectionHeader icon={MessageSquare} label="Script & Action" />
                  <textarea
                    className={textareaClass}
                    rows={7}
                    defaultValue={activeShot.bgDescription || activeShot.description || activeShot.action || ""}
                    placeholder="Enter script or action description..."
                    onChange={(e) => {
                      onShotsChange(shots.map(s =>
                        s.id === activeShotId
                          ? { ...s, action: e.target.value, bgDescription: e.target.value }
                          : s
                      ));
                    }}
                  />
                </div>
                <div>
                  <SectionHeader icon={Mic} label="Dialogue & Voice-Over" />
                  <textarea
                    className={textareaClass}
                    rows={5}
                    defaultValue={activeShot.voiceOver || ""}
                    placeholder="Enter dialogue or voice-over..."
                    onChange={(e) => {
                      onShotsChange(shots.map(s =>
                        s.id === activeShotId
                          ? { ...s, voiceOver: e.target.value }
                          : s
                      ));
                    }}
                  />
                </div>
              </>
            )}

            {/* ── Prompts Tab ── */}
            {activeTab === "prompts" && (
              <>
                <div>
                  <SectionHeader icon={Image} label="Image Prompt" accent="var(--accent-blue)" />
                  <textarea
                    className={textareaClass}
                    rows={7}
                    defaultValue={activeShot.imagePrompt || ""}
                    placeholder="Enter image generation prompt..."
                    onChange={(e) => {
                      onShotsChange(shots.map(s =>
                        s.id === activeShotId
                          ? { ...s, imagePrompt: e.target.value }
                          : s
                      ));
                    }}
                  />
                </div>
                <div>
                  <SectionHeader icon={Video} label="Video Prompt" accent="var(--accent-teal)" />
                  <textarea
                    className={textareaClass}
                    rows={7}
                    defaultValue={activeShot.videoPrompt || ""}
                    placeholder="Enter video generation prompt..."
                    onChange={(e) => {
                      onShotsChange(shots.map(s =>
                        s.id === activeShotId
                          ? { ...s, videoPrompt: e.target.value }
                          : s
                      ));
                    }}
                  />
                </div>
              </>
            )}

            {/* ── Details Tab ── */}
            {activeTab === "info" && (
              <>
                <div>
                  <SectionHeader icon={Tag} label="Tags" accent="var(--color-warning)" />
                  <div className="flex flex-wrap gap-2">
                    {activeShot.tags?.length > 0 ? (
                      activeShot.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-white uppercase tracking-wide border border-white/6"
                          style={{ backgroundColor: tag.color + "33", color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-(--text-tertiary) text-[11px]">No tags added</span>
                    )}
                  </div>
                </div>

                {/* Characters */}
                {activeShot.characters && activeShot.characters.length > 0 && (
                  <div>
                    <SectionHeader icon={Clapperboard} label="Characters" accent="var(--accent-blue)" />
                    <div className="flex flex-wrap gap-2">
                      {activeShot.characters.map((char, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-white/4 text-(--text-secondary) border border-white/4">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <SectionHeader icon={FileText} label="Director's Notes" />
                  <textarea
                    className={textareaClass}
                    rows={6}
                    defaultValue={activeShot.notes || ""}
                    placeholder="Add director's notes..."
                    onChange={(e) => {
                      onShotsChange(shots.map(s =>
                        s.id === activeShotId
                          ? { ...s, notes: e.target.value }
                          : s
                      ));
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DarkModal>
  );
}
