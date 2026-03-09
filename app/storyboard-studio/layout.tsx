"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./components/SidebarNav";
import { StoryboardStudioUIProvider } from "./StoryboardStudioUIContext";
import { SettingsModal } from "./components/modals/SettingsModal";

export default function StoryboardStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideStudioSidebar = pathname?.startsWith("/storyboard-studio/projects") ||
    pathname?.startsWith("/storyboard-studio/workspace");

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f0f14] overflow-hidden">
      <StoryboardStudioUIProvider
        value={{
          openNewEpisode: () => {},
          openStoryManager: () => {},
        }}
      >
        {!hideStudioSidebar && (
          <SidebarNav
            open={true}
            activeNav="projects"
            onNavChange={() => {}}
            projects={[]}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </StoryboardStudioUIProvider>
    </div>
  );
}
