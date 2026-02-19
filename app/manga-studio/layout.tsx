"use client";

import { useState } from "react";
import { MangaStudioSidebar } from "./components/MangaStudioSidebar";
import { MangaStudioUIProvider } from "./MangaStudioUIContext";
import { NewEpisodeModal } from "./components/modals/NewEpisodeModal";
import { StoryManagerModal } from "./components/modals/StoryManagerModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { NewComicModal } from "./components/modals/NewComicModal";

export default function MangaStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNewEpisode, setShowNewEpisode] = useState(false);
  const [showStoryManager, setShowStoryManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewComic, setShowNewComic] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f0f14] overflow-hidden">
      <MangaStudioUIProvider
        value={{
          openNewEpisode: () => setShowNewEpisode(true),
          openStoryManager: () => setShowStoryManager(true),
        }}
      >
        <MangaStudioSidebar
          onManageComics={() => setShowStoryManager(true)}
          onSettings={() => setShowSettings(true)}
          onNewComic={() => setShowNewComic(true)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

        <NewEpisodeModal isOpen={showNewEpisode} onClose={() => setShowNewEpisode(false)} />
        <StoryManagerModal isOpen={showStoryManager} onClose={() => setShowStoryManager(false)} />
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <NewComicModal isOpen={showNewComic} onClose={() => setShowNewComic(false)} />
      </MangaStudioUIProvider>
    </div>
  );
}
