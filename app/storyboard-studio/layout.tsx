"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { SidebarNav } from "./components/SidebarNav";
import { StoryboardStudioUIProvider } from "./StoryboardStudioUIContext";
import { SettingsModal } from "./components/modals/SettingsModal";
import type { Project } from "./types";

export default function StoryboardStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { user } = useUser();
  const orgId = organization?.id ?? user?.id ?? "personal";
  const hideStudioSidebar = pathname?.startsWith("/storyboard-studio/projects") ||
    pathname?.startsWith("/storyboard-studio/workspace");

  const [showSettings, setShowSettings] = useState(false);
  const [activeNav, setActiveNav] = useState("projects");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const convexProjects = useQuery(api.storyboard.projects.listByOrg, { orgId });

  useEffect(() => {
    const syncSidebar = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };

    syncSidebar();
    window.addEventListener("resize", syncSidebar);

    return () => window.removeEventListener("resize", syncSidebar);
  }, []);

  const sidebarProjects: Project[] = convexProjects?.map((p) => ({
    id: p._id,
    name: p.name,
    type: "board",
    status: (p.status as Project["status"]) ?? "Draft",
    version: 1,
    members: p.teamMemberIds.length + 1,
    reviewers: 0,
    dueDate: "",
    assignee: "You",
    tags: p.tags,
    favourite: p.isFavorite ?? false,
  })) ?? [];

  return (
    <div className="flex h-screen bg-[#0f0f14] overflow-hidden">
      <StoryboardStudioUIProvider
        value={{
          activeNav,
          setActiveNav,
          sidebarOpen,
          setSidebarOpen,
          sidebarProjects,
          openNewEpisode: () => {},
          openStoryManager: () => {},
        }}
      >
        {!hideStudioSidebar && (
          <SidebarNav
            open={sidebarOpen}
            activeNav={activeNav}
            onNavChange={setActiveNav}
            projects={sidebarProjects}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </StoryboardStudioUIProvider>
    </div>
  );
}
