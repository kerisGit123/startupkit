"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star, MoreHorizontal, Search, Filter, Settings, Users, ChevronDown,
  Plus, Image as ImageIcon, LayoutGrid, Folder, FileText, Link2,
  PanelLeftClose, PanelLeftOpen, List, Share2, Pencil, Eye, Copy,
  Trash2, Tag, Hash, Grid3x3, Table2, Edit3, ChevronRight, Loader2, FolderOpen, X,
} from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_LIMITS } from "@/lib/plan-config";
import { VISUAL_STYLES, GENRE_PRESETS, GENRE_COMBO_TIPS, SIMPLE_TAGS, TAG_COLORS } from "../../constants";
import type { Project, Step } from "../../types";
import { TagEditor } from "../storyboard/TagEditor";
import { TopNavSearch } from "./TopNavSearch";
import { TopNavFilters } from "./TopNavFilters";
import { CreditBadge } from "../shared/CreditBadge";
import { DarkModal } from "../shared/DarkModal";
import { DarkInput, DarkTextarea, DarkSelect } from "../shared/DarkInput";
import { AlertBannerDark } from "../shared/AlertBannerDark";

type ProjectTagOption = {
  id: string;
  name: string;
  color: string;
};

const toProjectTagOption = (tag: string, index: number): ProjectTagOption => {
  const predefinedTag = SIMPLE_TAGS.find((t) => t.id === tag || t.name === tag);
  if (predefinedTag) {
    return predefinedTag;
  }

  // Create a tag option from string tag
  const color = TAG_COLORS[index % TAG_COLORS.length];
  return {
    id: tag,
    name: tag,
    color: color
  };
};

interface ProjectsDashboardProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  onOpenProject: (project: Project, step: Step) => void;
  onCreateConvexProject?: (name: string, frameRatio: string, style: string, stylePrompt?: string) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onDuplicateProject?: (id: string) => Promise<void>;
  onRemoveImageUrl?: (id: string) => Promise<void>;
  onOpenFileBrowser?: () => void;
  onOpenGlobalFileBrowser?: () => void;
  activeFilter?: string | null;
}

const TYPE_ICON: Record<Project["type"], React.ElementType> = {
  board: LayoutGrid,
  folder: Folder,
  stage: FileText,
  link: Link2,
};

const STATUS_STYLE: Record<Project["status"], string> = {
  "On Hold":    "bg-gray-700/60 text-gray-300",
  "In Progress":"bg-blue-500/20 text-blue-400",
  "Completed":  "bg-green-500/20 text-green-400",
  "Draft":      "bg-gray-500/20 text-gray-300 border border-gray-500/30",
};

const normalizeStatusFilter = (value: string): Project["status"] | null => {
  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");

  if (normalized === "draft") return "Draft";
  if (normalized === "completed") return "Completed";
  if (normalized === "in-progress" || normalized === "progress" || normalized === "active") return "In Progress";
  if (normalized === "on-hold" || normalized === "hold") return "On Hold";

  return null;
};

export function ProjectsDashboard({
  sidebarOpen, onToggleSidebar, projects, onProjectsChange, onOpenProject, onCreateConvexProject, onDeleteProject, onDuplicateProject, onRemoveImageUrl, onOpenFileBrowser, onOpenGlobalFileBrowser, activeFilter,
}: ProjectsDashboardProps) {
  // Credit balance for header display
  const dashboardCompanyId = useCurrentCompanyId() || "personal";
  // Plan-aware project limit + lapsed-subscription freeze
  const { plan: currentPlan, isLapsed } = useSubscription();
  const maxProjects = PLAN_LIMITS[currentPlan].maxProjects;
  // Don't count the "Global Files" bucket project against the user's quota
  const visibleProjectCount = projects.filter(
    (p) => p.name?.toLowerCase() !== "global files",
  ).length;
  const atProjectLimit = visibleProjectCount >= maxProjects;
  // Frozen state: in an org whose subscription has lapsed (admin cancelled)
  const createBlocked = atProjectLimit || isLapsed;

  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Project["type"]>("board");
  const [newArtStyle, setNewArtStyle] = useState(VISUAL_STYLES[0].id);
  const [newFrameRatio, setNewFrameRatio] = useState("9:16");
  const [isCreating, setIsCreating] = useState(false);
  const [dashView, setDashView] = useState<"card" | "table">("card");
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  // Custom style state
  const [showCustomStyleForm, setShowCustomStyleForm] = useState(false);
  const [customStyleName, setCustomStyleName] = useState("");
  const [customStylePrompt, setCustomStylePrompt] = useState("");
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const allCustomTemplates = useQuery(api.promptTemplates.getByCompany, { companyId: dashboardCompanyId }) ?? [];
  const customStyleTemplates = allCustomTemplates.filter(t => t.type === "style");
  const createPromptTemplate = useMutation(api.promptTemplates.create);
  const updatePromptTemplate = useMutation(api.promptTemplates.update);
  const deletePromptTemplate = useMutation(api.promptTemplates.remove);
  const stylePresets = useQuery(api.storyboard.presets.list, { companyId: dashboardCompanyId, category: "style" });
  const createPreset = useMutation(api.storyboard.presets.create);
  const updatePresetMut = useMutation(api.storyboard.presets.update);
  const removePreset = useMutation(api.storyboard.presets.remove);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: [] as string[],
    favorite: false,
  });

  // Tag editor state for projects
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectTagsChange = (newTags: ProjectTagOption[]) => {
    if (!selectedProjectId) return;

    // Convert tag objects back to strings and deduplicate
    const tagStrings = [...new Set(newTags.map(tag => tag.name))];
    onProjectsChange(projects.map((p) =>
      p.id === selectedProjectId ? { ...p, tags: tagStrings } : p
    ));
  };

  // Filter and search logic
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        project.status.toLowerCase().includes(query)
      );
    }

    // Apply status filter (only if status exists - for non-storyboard usage)
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(project => 
        filters.status.includes(project.status)
      );
    }

    // Apply favorite filter
    if (filters.favorite) {
      filtered = filtered.filter(project => project.favourite);
    }

    return filtered;
  }, [projects, searchQuery, filters]);

  // Calculate counts for UI
  const favoriteCount = projects.filter(p => p.favourite).length;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      if (newType === "board" && onCreateConvexProject) {
        // Resolve genrePrompt: check presets first, then built-in GENRE_PROMPTS
        const presetMatch = (stylePresets || []).find(p => p.name === newArtStyle);
        const customMatch = presetMatch ? { prompt: presetMatch.prompt || "" } : customStyleTemplates.find(s => s.name === newArtStyle);
        const { GENRE_PROMPTS } = await import("../../constants");
        const resolvedStylePrompt = customMatch?.prompt || GENRE_PROMPTS[newArtStyle] || "";
        await onCreateConvexProject(newName, newFrameRatio, newArtStyle, resolvedStylePrompt);
      } else {
        const p: Project = {
          id: `p${Date.now()}`, name: newName, type: newType,
          status: "Draft", version: 1, members: 1, reviewers: 0,
          dueDate: "", assignee: "You", tags: [],
        };
        onProjectsChange([...projects, p]);
        onOpenProject(p, "storyboard");
      }
      setShowCreateModal(false);
      setNewName("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (onDeleteProject) {
      await onDeleteProject(id);
    } else {
      onProjectsChange(projects.filter(p => p.id !== id));
    }
    setContextMenuId(null);
  };

  const handleStatusChange = (id: string, status: Project["status"]) => {
    onProjectsChange(projects.map(p => p.id === id ? { ...p, status } : p));
    setStatusMenuId(null);
    setContextMenuId(null);
    setMenuPosition(null);
  };

  const handleToggleFavourite = (id: string) => {
    onProjectsChange(projects.map(p =>
      p.id === id ? { ...p, favourite: !p.favourite } : p
    ));
    setStatusMenuId(null);
    setContextMenuId(null);
    setMenuPosition(null);
  };

  const handleRename = (id: string, newName: string) => {
    if (!newName.trim()) return;
    onProjectsChange(projects.map(p =>
      p.id === id ? { ...p, name: newName.trim() } : p
    ));
    setEditingProjectId(null);
    setEditName("");
    setStatusMenuId(null);
    setContextMenuId(null);
    setMenuPosition(null);
  };

  const handleDuplicate = async (id: string) => {
    if (onDuplicateProject) {
      await onDuplicateProject(id);
      setStatusMenuId(null);
      setContextMenuId(null);
      setMenuPosition(null);
      return;
    }

    const project = projects.find(p => p.id === id);
    if (!project) return;
    const duplicate: Project = {
      ...project,
      id: `project-${Date.now()}`,
      name: `${project.name} (copy)`,
    };
    onProjectsChange([...projects, duplicate]);
    setStatusMenuId(null);
    setContextMenuId(null);
    setMenuPosition(null);
  };

  const handleRemoveImageUrl = async (id: string) => {
    if (onRemoveImageUrl) {
      await onRemoveImageUrl(id);
    } else {
      // Fallback: update local projects array
      onProjectsChange(projects.map(p => 
        p.id === id ? { ...p, imageUrl: undefined } : p
      ));
    }
    setContextMenuId(null);
    setMenuPosition(null);
    console.log("ImageUrl unset successfully from project");
  };

  // Combine all filters
  const finalFilteredProjects = useMemo(() => {
    let result = filteredProjects;
    
    // Apply active filter if exists - but apply it to already filtered results
    if (activeFilter) {
      if (activeFilter.startsWith('tag:')) {
        const tag = activeFilter.replace('tag:', '');
        result = result.filter(p => p.tags.some(projectTag => projectTag.toLowerCase() === tag.toLowerCase()));
      } else if (activeFilter.startsWith('status:')) {
        const rawStatus = activeFilter.replace('status:', '');
        const normalizedStatus = normalizeStatusFilter(rawStatus);
        if (normalizedStatus) {
          result = result.filter(p => p.status === normalizedStatus);
        }
      } else if (activeFilter.startsWith('project:')) {
        const projectId = activeFilter.replace('project:', '');
        result = result.filter(p => p.id === projectId);
      } else if (activeFilter === 'favourite') {
        result = result.filter(p => p.favourite);
      } else if (activeFilter === 'recent') {
        // Show last 5 projects (most recent first) from filtered results
        const sortedProjects = [...result].reverse();
        result = sortedProjects.slice(0, 5).filter(recent => 
          result.some(p => p.id === recent.id)
        );
      }
    }
    
    return result;
  }, [filteredProjects, activeFilter]);

  const NEW_ITEMS = [
    { icon: FileText, label: "Files",  desc: "Upload files: Video, Images, Audio, PDF", type: "stage"  as const },
    { icon: LayoutGrid, label: "Board",     desc: "Create your own storyboard",              type: "board"  as const },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-(--bg-primary)">
      {/* Top bar — design system */}
      <div className="border-b border-(--border-primary) shrink-0 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: sidebar toggle + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors md:hidden"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <span className="text-[13px] font-semibold text-(--text-primary) truncate">Any project</span>
            <MoreHorizontal className="hidden md:block w-4 h-4 text-(--text-tertiary) hover:text-(--text-primary) cursor-pointer transition-colors shrink-0" />
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <TopNavSearch onSearch={setSearchQuery} />
            <TopNavFilters
              onFiltersChange={setFilters as any}
              projectCount={finalFilteredProjects.length}
            />

            {/* All Files */}
            <button
              onClick={onOpenGlobalFileBrowser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.75} /> All Files
            </button>

            {/* View toggle — pill style */}
            <div className="flex items-center rounded-xl border border-white/8 overflow-hidden">
              <button
                onClick={() => setDashView("card")}
                title="Card view"
                className={`p-1.5 transition-all ${dashView === "card" ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"}`}
              >
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDashView("table")}
                title="Table view"
                className={`p-1.5 transition-all ${dashView === "table" ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* New button */}
            <div className="relative">
              <button
                onClick={() => setShowNewDropdown(v => !v)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium bg-(--accent-teal) hover:opacity-90 text-white transition-colors"
              >
                New <ChevronDown className="w-3 h-3" />
              </button>
              {showNewDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNewDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-[200px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl py-1.5">
                    <button
                      onClick={() => { setShowCreateModal(true); setShowNewDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-(--text-primary) hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} /> New Storyboard
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Separator */}
            <div className="hidden md:block w-px h-5 bg-(--border-primary)" />

            {/* Right side: credits, org, user */}
            <div className="hidden md:flex items-center gap-2">
              <CreditBadge />
              <OrgSwitcher
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger: "px-3 py-1.5 rounded-md border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-2 text-[12px]",
                    organizationSwitcherTriggerIcon: "w-4 h-4",
                    organizationSwitcherTriggerText: "font-medium text-white",
                    organizationPreviewText: "text-white",
                    organizationPreviewMainIdentifier: "text-white",
                  },
                }}
                afterSelectOrganizationUrl="/storyboard-studio"
                afterCreateOrganizationUrl="/storyboard-studio"
              />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-(--bg-secondary) border border-(--border-primary) shadow-xl",
                    userButtonPopoverActionButton: "text-white hover:bg-white/5 hover:text-gray-200",
                    userButtonPopoverActionButtonText: "text-sm",
                    userButtonPopoverFooter: "border-t border-(--border-primary)",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System alerts */}
      <AlertBannerDark />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <Plus className="w-7 h-7 text-gray-500" />
            </div>
            <p className="text-gray-400 text-sm">Drag files or click to create stage</p>
            <span className="text-gray-600 text-xs">or</span>
            <button onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm border border-white/10 transition">
              Create from Template ▾
            </button>
          </div>
        ) : dashView === "card" ? (
          /* ── Card view - Modern FrameCard style ── */
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {finalFilteredProjects.map(p => {
              const Icon = TYPE_ICON[p.type];
              return (
                <div key={p.id} className="relative group cursor-pointer overflow-hidden rounded-xl border border-(--border-primary) bg-(--bg-secondary) shadow-sm transition-all duration-300 hover:border-(--accent-blue) hover:shadow-xl hover:shadow-(--accent-blue)/20 md:rounded-2xl">
                  {/* Image/Preview Area */}
                  <div className="relative flex aspect-[3/4] items-center justify-center bg-(--bg-primary) sm:aspect-video" onClick={() => onOpenProject(p, "storyboard")}>
                    {p.imageUrl ? (
                      <>
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                        />
                        {/* Subtle vignette effect */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      </>
                    ) : (
                      <ImageIcon className="w-9 h-9 text-(--text-tertiary) md:w-12 md:h-12" />
                    )}
                    
                    {/* Top overlay with version */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-2 md:p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
                            <span className="text-xs text-white font-medium">v{p.version}</span>
                          </div>
                          {p.favourite && (
                            <div className="bg-black/40 backdrop-blur-md rounded-full p-1.5 border border-white/10">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            </div>
                          )}
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-md rounded-full p-1.5 border border-white/10 hover:bg-black/60 transition"
                          onClick={e => { 
                            e.stopPropagation(); 
                            setStatusMenuId(null);
                            if (contextMenuId === p.id) {
                              setContextMenuId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({ 
                                top: rect.bottom + window.scrollY + 4, 
                                right: window.innerWidth - rect.right 
                              });
                              setContextMenuId(p.id);
                            }
                          }}>
                          <MoreHorizontal className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="border-t border-(--border-primary) bg-(--bg-secondary) p-3 md:p-4">
                    {/* Title */}
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-(--text-tertiary) shrink-0" />
                      {editingProjectId === p.id ? (
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => handleRename(p.id, editName)}
                          onKeyDown={e => { if (e.key === "Enter") handleRename(p.id, editName); if (e.key === "Escape") { setEditingProjectId(null); setEditName(""); } }}
                          onClick={e => e.stopPropagation()}
                          className="bg-transparent text-white text-sm font-medium truncate flex-1 outline-none border-b border-white/40"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-white font-medium flex-1 truncate" onClick={() => onOpenProject(p, "storyboard")}>{p.name}</p>
                      )}
                    </div>

                    {/* Type & Status & Aspect Ratio */}
                    <div className="mb-2.5 flex flex-wrap items-center gap-1.5 md:mb-3 md:gap-2">
                      <span className="text-xs text-gray-500 capitalize">{p.type}</span>
                      <span className="text-gray-700">•</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      <span className="text-gray-700">•</span>
                      <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded">{p.settings?.frameRatio || "16:9"}</span>
                    </div>

                    {/* Visibility & Members */}
                    <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 md:mb-3 md:gap-3 md:text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Everyone</span>
                      </div>
                      <span className="text-gray-700">•</span>
                      <span>{p.members} members</span>
                    </div>

                    {/* Tags - FrameCard style */}
                    <div className="flex items-center gap-1.5 flex-wrap cursor-pointer hover:opacity-80 transition"
                      onClick={e => { 
                        e.stopPropagation(); 
                        setSelectedProjectId(p.id);
                        setShowTagEditor(true);
                      }}>
                      {p.tags.length > 0 ? (
                        <>
                          {p.tags.slice(0, 3).map((tag, index) => {
                            // Ensure tag is a string, not an object
                            const tagString = typeof tag === 'string' ? tag : (tag as any).id || (tag as any).name || String(tag);
                            // Get tag color from predefined tags or use default
                            const tagColor = SIMPLE_TAGS.find(t => t.id === tagString)?.color || TAG_COLORS[index % TAG_COLORS.length];
                            return (
                              <span 
                                key={`${tagString}-${index}`} 
                                className="px-2 py-1 rounded text-xs flex items-center gap-1"
                                style={{ 
                                  backgroundColor: tagColor + '15', 
                                  color: tagColor,
                                  border: `1px solid ${tagColor}25`
                                }}
                              >
                                <Hash className="w-3 h-3" />
                                {tagString}
                              </span>
                            );
                          })}
                          {p.tags.length > 3 && (
                            <span className="text-xs text-gray-500 font-medium">+{p.tags.length - 3}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 hover:text-gray-400 transition">+ Add tags</span>
                      )}
                    </div>
                  </div>
                  {/* Context menu (LTX Theme) */}
                  {contextMenuId === p.id && menuPosition && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setContextMenuId(null); setMenuPosition(null); }} />
                      <div className="fixed bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[100] w-52 py-1.5" style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}>
                        <button onClick={() => handleToggleFavourite(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Star className={`w-3.5 h-3.5 ${p.favourite ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {p.favourite ? 'Remove from favourite' : 'Add to favourite'}</button>
                        <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Share2 className="w-3.5 h-3.5" /> Share</button>
                        <button onClick={() => { setEditingProjectId(p.id); setEditName(p.name); setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Pencil className="w-3.5 h-3.5" /> Rename</button>
                        <div className="relative group/status">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusMenuId((current) => current === p.id ? null : p.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition justify-between"
                          >
                            <span className="flex items-center gap-2.5"><Hash className="w-3.5 h-3.5" /> Status</span>
                            <ChevronDown className="w-3 h-3 text-(--text-tertiary)" />
                          </button>
                          <div className={`${statusMenuId === p.id ? "block" : "hidden"} absolute left-full top-0 ml-1 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[200] w-36 py-1`}>
                            {(["On Hold", "In Progress", "Completed", "Draft"] as const).map(s => (
                              <button key={s} onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, s); }} className="w-full px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs text-left transition-all duration-200">{s}</button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => { setContextMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Eye className="w-3.5 h-3.5" /> Visibility</button>
                        <button onClick={() => handleDuplicate(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Copy className="w-3.5 h-3.5" /> Duplicate storyboard</button>
                        {/* Remove ImageUrl Option */}
                        {p.imageUrl && (
                          <button onClick={() => handleRemoveImageUrl(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--color-error) text-xs transition"><Trash2 className="w-3.5 h-3.5" /> remove ImageUrl</button>
                        )}
                        <div className="border-t border-(--border-primary) my-1" />
                        <button onClick={() => handleDeleteProject(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--color-error)/10 text-(--color-error) text-xs transition"><Trash2 className="w-3.5 h-3.5" /> Delete storyboard</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {isLapsed ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-yellow-500/40 bg-yellow-500/5 px-4 text-center md:min-h-[180px]">
                <Plus className="w-5 h-5 text-yellow-400/60" />
                <span className="text-yellow-300 text-xs font-semibold">
                  Subscription lapsed
                </span>
                <span className="text-[10px] text-yellow-200/60">
                  Resubscribe to create projects
                </span>
              </div>
            ) : atProjectLimit ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-(--border-primary) bg-(--bg-tertiary)/50 px-4 text-center md:min-h-[180px]">
                <Plus className="w-5 h-5 text-(--text-tertiary) opacity-40" />
                <span className="text-(--text-tertiary) text-xs">
                  Project limit reached ({visibleProjectCount}/{maxProjects})
                </span>
                <span className="text-[10px] text-(--text-tertiary)">
                  Upgrade to create more projects
                </span>
              </div>
            ) : (
              <button onClick={() => setShowCreateModal(true)}
                className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-(--border-primary) bg-(--bg-tertiary) transition hover:border-(--accent-blue) hover:bg-(--bg-secondary) md:min-h-[180px]">
                <Plus className="w-5 h-5 text-(--text-tertiary)" />
                <span className="text-(--text-tertiary) text-xs">Add storyboard</span>
              </button>
            )}
          </div>
        ) : (
          /* ── Table view (pic9/pic11) ── */
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/6 text-left">
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium w-16">Preview</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Project</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Tags</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Status</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Aspect Ratio</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {finalFilteredProjects.map(p => {
                  const Icon = TYPE_ICON[p.type];
                  return (
                    <tr key={p.id} className="border-b border-(--border-primary) hover:bg-(--bg-tertiary) transition cursor-pointer" onClick={() => onOpenProject(p, "storyboard")}>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 bg-[#1e1e2a] rounded-lg overflow-hidden flex items-center justify-center">
                          {p.imageUrl ? (
                            <img 
                              src={p.imageUrl} 
                              alt={p.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          {editingProjectId === p.id ? (
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => handleRename(p.id, editName)}
                          onKeyDown={e => { if (e.key === "Enter") handleRename(p.id, editName); if (e.key === "Escape") { setEditingProjectId(null); setEditName(""); } }}
                          onClick={e => e.stopPropagation()}
                          className="bg-transparent text-white text-sm font-medium outline-none border-b border-white/40"
                          autoFocus
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">{p.name}</span>
                      )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap cursor-pointer hover:opacity-80 transition"
                          onClick={e => { 
                            e.stopPropagation(); 
                            setSelectedProjectId(p.id);
                            setShowTagEditor(true);
                          }}>
                          {p.tags.length > 0 ? (
                            <>
                              {p.tags.slice(0, 2).map((tag, index) => {
                                // Ensure tag is a string, not an object
                                const tagString = typeof tag === 'string' ? tag : (tag as any).id || (tag as any).name || String(tag);
                                // Get tag color from predefined tags or use default
                                const tagColor = SIMPLE_TAGS.find(t => t.id === tagString)?.color || TAG_COLORS[index % TAG_COLORS.length];
                                return (
                                  <span 
                                    key={`${tagString}-${index}`} 
                                    className="px-2 py-1 rounded text-xs flex items-center gap-1"
                                    style={{ 
                                      backgroundColor: tagColor + '15', 
                                      color: tagColor,
                                      border: `1px solid ${tagColor}25`
                                    }}
                                  >
                                    <Hash className="w-3 h-3" />
                                    {tagString}
                                  </span>
                                );
                              })}
                              {p.tags.length > 2 && (
                                <span className="text-[9px] text-gray-500 font-medium">+{p.tags.length - 2}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-[9px] text-gray-500 hover:text-gray-400 transition">+ Add tags</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                         <button
                           onClick={e => {
                             e.stopPropagation();
                             setStatusMenuId((current) => current === p.id ? null : p.id);
                           }}
                           className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[p.status]} hover:opacity-80 transition`}
                         >
                           {p.status}
                         </button>
                         <div className={`${statusMenuId === p.id ? "block" : "hidden"} absolute left-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-[200] w-32 py-1`}>
                           {(["On Hold", "In Progress", "Completed", "Draft"] as const).map(s => (
                             <button key={s} onClick={e => { e.stopPropagation(); handleStatusChange(p.id, s); }} className="w-full px-3 py-1.5 hover:bg-white/5 text-gray-300 text-xs text-left transition">{s}</button>
                           ))}
                         </div>
                       </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">{p.settings?.frameRatio || "16:9"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); handleToggleFavourite(p.id); }} className="p-1 transition"><Star className={`w-3.5 h-3.5 ${p.favourite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`} /></button>
                          <button onClick={e => e.stopPropagation()} className="p-1 text-gray-500 hover:text-white transition"><Share2 className="w-3.5 h-3.5" /></button>
                          <div className="relative">
                            <button onClick={e => {
                              e.stopPropagation();
                              setStatusMenuId(null);
                              if (contextMenuId === p.id) {
                                setContextMenuId(null);
                                setMenuPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  right: window.innerWidth - rect.right
                                });
                                setContextMenuId(p.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-white transition">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {contextMenuId === p.id && menuPosition && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={ev => { ev.stopPropagation(); setContextMenuId(null); setMenuPosition(null); }} />
                                <div className="fixed bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[100] w-52 py-1.5" style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}>
                                  <button onClick={() => handleToggleFavourite(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Star className={`w-3.5 h-3.5 ${p.favourite ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {p.favourite ? 'Remove from favourite' : 'Add to favourite'}</button>
                                  <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Share2 className="w-3.5 h-3.5" /> Share</button>
                                  <button onClick={() => { setEditingProjectId(p.id); setEditName(p.name); setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Pencil className="w-3.5 h-3.5" /> Rename</button>
                                  <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Eye className="w-3.5 h-3.5" /> Visibility</button>
                                  <button onClick={() => handleDuplicate(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--text-secondary) text-xs transition"><Copy className="w-3.5 h-3.5" /> Duplicate storyboard</button>
                                  {p.imageUrl && (
                                    <button onClick={() => handleRemoveImageUrl(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--color-error) text-xs transition"><Trash2 className="w-3.5 h-3.5" /> remove ImageUrl</button>
                                  )}
                                  <div className="border-t border-(--border-primary) my-1" />
                                  <button onClick={() => handleDeleteProject(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--color-error)/10 text-(--color-error) text-xs transition"><Trash2 className="w-3.5 h-3.5" /> Delete storyboard</button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            {/* Add stage row */}
            <button onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-dashed border-white/6 text-gray-600 hover:text-gray-400 text-xs transition">
              <Plus className="w-3.5 h-3.5" /> Add storyboard
            </button>
          </div>
        )}
      </div>

      {/* Create modal (pic12) */}
      <DarkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        maxWidth="max-w-3xl"
        overlayOpacity={70}
        className="bg-[#2C2C2C]"
      >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#FFFFFF] text-lg font-semibold">Create new</h3>
            </div>
            
            {/* Files name, Files type, and Frame ratio row */}
            <div className="flex gap-4 mb-5">
              <div className="flex-1">
                <label className="text-[#A0A0A0] text-xs mb-1.5 block">Files name</label>
                <DarkInput
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="ex. Animation"
                  autoFocus
                />
                <div className="text-[10px] text-[#6E6E6E] mt-1">{newName.length} / 50</div>
              </div>
              <div className="w-28">
                <label className="text-[#A0A0A0] text-xs mb-1.5 block">Files type</label>
                <div className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-3 py-2.5 text-[#FFFFFF] text-sm">
                  Board
                </div>
              </div>
              <div className="w-36">
                <label className="text-[#A0A0A0] text-xs mb-1.5 block">Frame ratio</label>
                <div className="relative">
                  <DarkSelect
                    value={newFrameRatio}
                    onChange={(e) => setNewFrameRatio(e.target.value)}
                    className="!rounded-full !px-4"
                  >
                    <option value="9:16">TikTok</option>
                    <option value="16:9">YouTube</option>
                    <option value="1:1">Square</option>
                  </DarkSelect>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] text-xs">{newFrameRatio}</span>
                  <ChevronDown className="w-4 h-4 text-[#A0A0A0] absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Genre picker with preview images */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[#A0A0A0] text-sm block">Genre</label>
                <button
                  onClick={() => { setEditingStyleId(null); setCustomStyleName(""); setCustomStylePrompt(""); setShowCustomStyleForm(!showCustomStyleForm); }}
                  className="flex items-center gap-1 text-[11px] text-[#4A90E2] hover:text-white transition px-2 py-1 rounded-lg border border-[#3D3D3D] hover:border-[#4A90E2]/30"
                >
                  <Plus className="w-3 h-3" /> Custom
                </button>
              </div>

              {/* Custom Style Create / Edit Form */}
              {showCustomStyleForm && (
                <div className="mb-3 p-3 bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg space-y-2">
                  <p className="text-[11px] text-[#A0A0A0] font-medium">{editingStyleId ? "Edit Custom Genre" : "Create Custom Genre"}</p>
                  <DarkInput
                    type="text"
                    placeholder="Genre name (e.g. Dark Thriller)"
                    value={customStyleName}
                    onChange={(e) => setCustomStyleName(e.target.value)}
                    size="xs"
                  />
                  <DarkTextarea
                    placeholder="Style prompt (describe the visual style...)"
                    value={customStylePrompt}
                    onChange={(e) => setCustomStylePrompt(e.target.value)}
                    rows={4}
                    size="xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setShowCustomStyleForm(false); setEditingStyleId(null); setCustomStyleName(""); setCustomStylePrompt(""); }}
                      className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!customStyleName.trim() || !customStylePrompt.trim()}
                      onClick={async () => {
                        try {
                          if (editingStyleId) {
                            await updatePresetMut({
                              id: editingStyleId as any,
                              name: customStyleName.trim(),
                              prompt: customStylePrompt.trim(),
                              format: JSON.stringify({ style: customStyleName.trim(), stylePrompt: customStylePrompt.trim() }),
                            });
                            toast.success(`Genre "${customStyleName}" updated`);
                          } else {
                            await createPreset({
                              name: customStyleName.trim(),
                              category: "style",
                              format: JSON.stringify({ style: customStyleName.trim(), stylePrompt: customStylePrompt.trim() }),
                              prompt: customStylePrompt.trim(),
                              companyId: dashboardCompanyId,
                              userId: "",
                            });
                            setNewArtStyle(customStyleName.trim());
                            toast.success(`Custom genre "${customStyleName}" created`);
                          }
                          setCustomStyleName(""); setCustomStylePrompt(""); setEditingStyleId(null); setShowCustomStyleForm(false);
                        } catch (err: any) { toast.error(err.message || "Failed to save style"); }
                      }}
                      className="px-3 py-1.5 text-xs text-white bg-[#4A90E2] hover:bg-[#357ABD] rounded-lg transition font-medium disabled:opacity-40"
                    >
                      {editingStyleId ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              )}

              <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {GENRE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setNewArtStyle(style.id)}
                      className={`relative aspect-[4/3] rounded-lg border-2 transition overflow-hidden ${
                        newArtStyle === style.id ? "border-[#4A90E2]" : "border-[#3D3D3D] hover:border-[#4A90E2]/50"
                      }`}
                    >
                      <img
                        src={style.preview}
                        alt={style.label}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-1.5">
                        <span className="text-[#FFFFFF] text-[10px] font-medium leading-tight block">{style.label}</span>
                      </div>
                      {newArtStyle === style.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#4A90E2] rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}

                {/* Custom genres from storyboard_presets */}
                {(stylePresets || []).map(preset => (
                  <button
                    key={preset._id}
                    onClick={() => setNewArtStyle(preset.name)}
                    className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                      newArtStyle === preset.name
                        ? 'border-purple-500 ring-2 ring-purple-500/30 scale-[1.02]'
                        : 'border-[#3D3D3D] hover:border-white/20'
                    }`}
                  >
                    {preset.thumbnailUrl ? (
                      <img src={preset.thumbnailUrl} alt={preset.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-purple-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-white drop-shadow-lg truncate px-1">
                      {preset.name}
                    </span>
                    {newArtStyle === preset.name && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {/* Edit button */}
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation(); e.preventDefault();
                        setEditingStyleId(String(preset._id));
                        setCustomStyleName(preset.name);
                        setCustomStylePrompt(preset.prompt || "");
                        setShowCustomStyleForm(true);
                      }}
                      className="absolute bottom-1 right-1 w-5 h-5 bg-[#4A90E2]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5 text-white" />
                    </div>
                    {/* Delete button */}
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation(); e.preventDefault();
                        removePreset({ id: preset._id });
                        if (newArtStyle === preset.name) setNewArtStyle(VISUAL_STYLES[0].id);
                        toast.success(`Genre "${preset.name}" deleted`);
                      }}
                      className="absolute top-1 left-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </div>
                  </button>
                ))}

                {/* Add Custom card */}
                <button
                  onClick={() => { setEditingStyleId(null); setCustomStyleName(""); setCustomStylePrompt(""); setShowCustomStyleForm(true); }}
                  className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-[#3D3D3D] hover:border-[#4A90E2]/50 transition flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="w-5 h-5 text-[#6E6E6E]" />
                  <span className="text-[10px] text-[#6E6E6E]">Add Custom</span>
                </button>
              </div>
            </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-[#A0A0A0] hover:text-[#FFFFFF] text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  newName.trim() && !isCreating
                    ? "bg-[#4A90E2] hover:bg-[#357ABD] text-[#FFFFFF]"
                    : "bg-[#3D3D3D] text-[#6E6E6E] cursor-not-allowed"
                }`}
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
                Create step
              </button>
            </div>
      </DarkModal>

      {/* TagEditor Modal for Projects */}
      {showTagEditor && selectedProjectId && (
        <TagEditor
          selectedTags={(() => {
            const project = projects.find((p) => p.id === selectedProjectId);
            if (!project) return [];
            
            // Deduplicate tags safely and convert to objects
            const uniqueTagStrings = Array.from(new Set(project.tags.filter(tag => typeof tag === 'string')));
            return uniqueTagStrings.map((tagId, index) => toProjectTagOption(tagId, index));
          })()}
          onTagsChange={handleProjectTagsChange}
          onClose={() => {
            setShowTagEditor(false);
            setSelectedProjectId(null);
          }}
        />
      )}
    </div>
  );
}
