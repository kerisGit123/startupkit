"use client";

import { UserButton } from "@clerk/nextjs";
import { MoreHorizontal, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStoryboardStudioUI } from "../StoryboardStudioUIContext";

export function ImageMakerPage() {
  const { sidebarOpen, setSidebarOpen } = useStoryboardStudioUI();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0d0d12]">
      <div className="border-b border-white/6 shrink-0 px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded p-1.5 text-gray-400 transition hover:text-white md:hidden"
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-4 h-4" />
                : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-gray-500 md:hidden">
                <span className="shrink-0">Projects</span>
                <span>/</span>
                <span className="truncate text-gray-300">Reference Maker</span>
              </div>
              <span className="hidden truncate text-sm font-semibold text-white md:block">Reference Maker</span>
            </div>
            <MoreHorizontal className="w-4 h-4 shrink-0 cursor-pointer text-gray-500 transition hover:text-white" />
          </div>

          <div className="flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-[#1a1a1f] border border-white/10 shadow-xl",
                  userButtonPopoverActionButton: "text-gray-300 hover:bg-white/5 hover:text-white",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "border-t border-white/10",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div className="w-full max-w-xl rounded-2xl border border-dashed border-white/10 bg-[#111118] px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-white">Reference Maker</h2>
          <p className="mt-2 text-sm text-gray-500">This page is ready for future content.</p>
        </div>
      </div>
    </div>
  );
}
