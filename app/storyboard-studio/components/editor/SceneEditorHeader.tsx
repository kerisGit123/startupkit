"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RectangleHorizontal } from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { CreditBadge } from "../shared/CreditBadge";
import type { Shot } from "../../types";

interface SceneEditorHeaderProps {
  shots: Shot[];
  activeShotId: string;
  activeShot: Shot;
  isMobile: boolean;
  onClose: () => void;
  onNavigateToShot?: (shotId: string) => void;
  onShotsChange: (shots: Shot[]) => void;
  onShowInfoDialog: () => void;
}

export function SceneEditorHeader({
  shots,
  activeShotId,
  activeShot,
  isMobile,
  onClose,
  onNavigateToShot,
  onShotsChange,
  onShowInfoDialog,
}: SceneEditorHeaderProps) {
  const sortedShots = [...shots].sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentIndex = sortedShots.findIndex(s => s.id === activeShotId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < sortedShots.length - 1;

  return (
    <div className={`${isMobile ? 'pt-12' : ''} flex items-center gap-3 px-4 py-2.5 bg-(--bg-secondary) border-b border-(--border-primary) shrink-0`}>
      <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="w-px h-5 bg-white/10" />

      {/* Frame navigation: prev / title / next */}
      <div className="flex items-center gap-1.5">
        {hasPrev && (
          <button
            onClick={() => onNavigateToShot?.(sortedShots[currentIndex - 1].id)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Previous frame"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-white font-semibold text-sm">
          {String((activeShot.order || 0) + 1).padStart(2, "0")}{activeShot.title ? ` - ${activeShot.title}` : ""}
        </span>
        {hasNext && (
          <button
            onClick={() => onNavigateToShot?.(sortedShots[currentIndex + 1].id)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Next frame"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tags */}
      {activeShot.tags.map(t => (
        <span key={t.id} className="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: t.color + "cc" }}>
          {t.name}
        </span>
      ))}

      {/* Aspect ratio — matches VideoImageAIPanel grid popup style */}
      <AspectRatioSelector
        value={activeShot.aspectRatio || "16:9"}
        onChange={(val) => {
          onShotsChange(shots.map(s =>
            s.id === activeShotId ? { ...s, aspectRatio: val } : s
          ));
        }}
      />

      {/* Info button */}
      <button
        onClick={onShowInfoDialog}
        className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition flex items-center gap-1"
        title="Frame Information"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Right side: credits, org, user */}
      <div className="ml-auto flex items-center gap-3">
        <CreditBadge />
        <OrgSwitcher
          appearance={{
            elements: {
              rootBox: "flex items-center",
              organizationSwitcherTrigger: "px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-gray-200 flex items-center gap-2 text-sm",
            },
          }}
        />
        <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
      </div>
    </div>
  );
}

// ─── Aspect Ratio Selector (matches VideoImageAIPanel grid popup) ───────

const ASPECT_OPTIONS = [
  { value: "16:9", label: "16:9", sub: "Landscape" },
  { value: "9:16", label: "9:16", sub: "Portrait" },
  { value: "1:1", label: "1:1", sub: "Square" },
];

function AspectRatioSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
          open ? "text-(--text-primary) bg-white/10" : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
        }`}
        title="Aspect Ratio"
      >
        <RectangleHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>{value}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 p-2">
            <div className="flex flex-col gap-0.5">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`px-3 py-1.5 rounded-md text-[13px] text-center transition-colors min-w-[52px] ${
                    value === opt.value
                      ? "bg-white/10 text-white"
                      : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
