"use client";

import { createContext, useContext } from "react";
import type { Project } from "./types";

type StoryboardStudioUIContextValue = {
  activeNav: string;
  setActiveNav: (key: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarProjects: Project[];
  openNewEpisode: () => void;
  openStoryManager: () => void;
};

const StoryboardStudioUIContext = createContext<StoryboardStudioUIContextValue | null>(null);

export function StoryboardStudioUIProvider({
  value,
  children,
}: {
  value: StoryboardStudioUIContextValue;
  children: React.ReactNode;
}) {
  return <StoryboardStudioUIContext.Provider value={value}>{children}</StoryboardStudioUIContext.Provider>;
}

export function useStoryboardStudioUI() {
  const ctx = useContext(StoryboardStudioUIContext);
  if (!ctx) {
    throw new Error("useStoryboardStudioUI must be used within StoryboardStudioUIProvider");
  }
  return ctx;
}
