"use client";

import { createContext, useContext } from "react";

type MangaStudioUIContextValue = {
  openNewEpisode: () => void;
  openStoryManager: () => void;
};

const MangaStudioUIContext = createContext<MangaStudioUIContextValue | null>(null);

export function MangaStudioUIProvider({
  value,
  children,
}: {
  value: MangaStudioUIContextValue;
  children: React.ReactNode;
}) {
  return <MangaStudioUIContext.Provider value={value}>{children}</MangaStudioUIContext.Provider>;
}

export function useMangaStudioUI() {
  const ctx = useContext(MangaStudioUIContext);
  if (!ctx) {
    throw new Error("useMangaStudioUI must be used within MangaStudioUIProvider");
  }
  return ctx;
}
