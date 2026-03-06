"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { StoryboardStudioSidebar } from "./components/StoryboardStudioSidebar";
import { StoryboardStudioUIProvider } from "./StoryboardStudioUIContext";
import { NewEpisodeModal } from "./components/modals/NewEpisodeModal";
import { StoryManagerModal } from "./components/modals/StoryManagerModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { NewComicModal } from "./components/modals/NewComicModal";

export default function StoryboardStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideStudioSidebar = pathname?.startsWith("/storyboard-studio/storyboard");

  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [showStoryManager, setShowStoryManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewComic, setShowNewComic] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f0f14] overflow-hidden">
      <StoryboardStudioUIProvider
        value={{
          openNewEpisode: () => setShowNewEpisode(true),
          openStoryManager: () => setShowStoryManager(true),
        }}
      >
        {!hideStudioSidebar && (
          <StoryboardStudioSidebar
            onManageComics={() => setShowStoryManager(true)}
            onSettings={() => setShowSettings(true)}
            onNewComic={() => setShowNewComic(true)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

        <NewEpisodeModal isOpen={showNewEpisode} onClose={() => setShowNewEpisode(false)} />
        <StoryManagerModal isOpen={showStoryManager} onClose={() => setShowStoryManager(false)} />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <NewComicModal isOpen={showNewComic} onClose={() => setShowNewComic(false)} />
      </StoryboardStudioUIProvider>
    </div>
  );
}
