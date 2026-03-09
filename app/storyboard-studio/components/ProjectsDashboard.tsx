"use client";

import { useState } from "react";
import {
  Star, MoreHorizontal, Search, Filter, Settings, Users, ChevronDown,
  Plus, Image as ImageIcon, LayoutGrid, Folder, FileText, Link2,
  PanelLeftClose, PanelLeftOpen, List, Share2, Pencil, Eye, Copy,
  Trash2, Tag, Hash, Grid3x3, Table2, Edit3, ChevronRight, Loader2, FolderOpen, X,
} from "lucide-react";
import { VISUAL_STYLES, SIMPLE_TAGS, TAG_COLORS } from "../constants";
import type { Project, Step } from "../types";
import { TagEditor } from "./storyboard/TagEditor";

type ProjectTagOption = {
  id: string;
  name: string;
  color: string;
};

const toProjectTagOption = (tagId: string, index: number): ProjectTagOption => {
  const predefinedTag = SIMPLE_TAGS.find((tag) => tag.id === tagId);
  if (predefinedTag) {
    return predefinedTag;
  }

  return {
    id: tagId,
    name: tagId,
    color: TAG_COLORS[index % TAG_COLORS.length],
  };
};

interface ProjectsDashboardProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  onOpenProject: (project: Project, step: Step) => void;
  onCreateConvexProject?: (name: string, frameRatio: string, style: string) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
  onDuplicateProject?: (id: string) => Promise<void>;
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
  "Draft":      "bg-white/5 text-gray-400",
};

export function ProjectsDashboard({
  sidebarOpen, onToggleSidebar, projects, onProjectsChange, onOpenProject, onCreateConvexProject, onDeleteProject, onDuplicateProject, onOpenFileBrowser, onOpenGlobalFileBrowser, activeFilter,
}: ProjectsDashboardProps) {
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

  // Tag editor state for projects
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectTagsChange = (newTags: ProjectTagOption[]) => {
    if (!selectedProjectId) return;

    // Convert tag objects back to string IDs for project storage
    const tagIds = newTags.map((tag) => tag.id);

    onProjectsChange(projects.map((p) =>
      p.id === selectedProjectId ? { ...p, tags: tagIds } : p
    ));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      if (newType === "board" && onCreateConvexProject) {
        await onCreateConvexProject(newName, newFrameRatio, newArtStyle);
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
      id: `p${Date.now()}`,
      name: `${project.name} (copy)`,
    };
    onProjectsChange([...projects, duplicate]);
    setStatusMenuId(null);
    setContextMenuId(null);
    setMenuPosition(null);
  };

  // Filter projects based on activeFilter
  const filteredProjects = activeFilter ? projects.filter(p => {
    if (activeFilter.startsWith('tag:')) {
      const tag = activeFilter.replace('tag:', '');
      return p.tags.includes(tag);
    } else if (activeFilter.startsWith('status:')) {
      const status = activeFilter.replace('status:', '');
      return p.status === status;
    } else if (activeFilter.startsWith('project:')) {
      const projectId = activeFilter.replace('project:', '');
      return p.id === projectId;
    } else if (activeFilter === 'favourite') {
      return p.favourite;
    } else if (activeFilter === 'recent') {
      // Show last 5 projects (most recent first)
      const sortedProjects = [...projects].reverse();
      return sortedProjects.slice(0, 5).some(recent => p.id === recent.id);
    }
    return true;
  }) : projects;

  const NEW_ITEMS = [
    { icon: FileText, label: "Files",  desc: "Upload files: Video, Images, Audio, PDF", type: "stage"  as const },
    { icon: LayoutGrid, label: "Board",     desc: "Create your own storyboard",              type: "board"  as const },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-400 hover:text-white rounded transition"
          >
            {sidebarOpen
              ? <PanelLeftClose className="w-4 h-4" />
              : <PanelLeftOpen  className="w-4 h-4" />}
          </button>
          <span className="text-white font-semibold text-sm">Any project</span>
          <Star className="w-3.5 h-3.5 text-gray-500 hover:text-yellow-400 cursor-pointer transition" />
          <MoreHorizontal className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition" />
        </div>
        <div className="flex items-center gap-3">
          {/* Left side tools */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-white transition"><Search className="w-4 h-4" /></button>
            <button className="p-1.5 text-gray-400 hover:text-white transition"><Filter className="w-4 h-4" /></button>
            <button className="p-1.5 text-gray-400 hover:text-white transition"><Settings className="w-4 h-4" /></button>
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* All Files button - Prominent position */}
          <button onClick={onOpenGlobalFileBrowser} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-600/20">
            <FolderOpen className="w-4 h-4" /> All Files
          </button>
          
          {/* Share button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition">
            <Users className="w-3.5 h-3.5" /> Share
          </button>
          
          {/* View toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 gap-0.5">
            <button onClick={() => setDashView("card")} title="Card view"
              className={`p-1.5 rounded-md transition ${dashView === "card" ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setDashView("table")} title="Table view"
              className={`p-1.5 rounded-md transition ${dashView === "table" ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* New dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNewDropdown(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition"
            >
              New <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showNewDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNewDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-50 w-64 py-2">
                  {NEW_ITEMS.map(item => (
                    <button
                      key={item.type}
                      onClick={() => {
                        setShowNewDropdown(false);
                        if (item.type === "stage" && onOpenFileBrowser) {
                          onOpenFileBrowser();
                        } else {
                          setNewType(item.type);
                          setShowCreateModal(true);
                        }
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                    >
                      <item.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-white text-sm font-medium">{item.label}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProjects.map(p => {
              const Icon = TYPE_ICON[p.type];
              return (
                <div key={p.id} className="relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm border-white/5 hover:border-white/10 hover:shadow-md bg-[#0a0a0f]">
                  {/* Image/Preview Area */}
                  <div className="bg-[#0f0f14] aspect-video flex items-center justify-center relative" onClick={() => onOpenProject(p, "storyboard")}>
                    <ImageIcon className="w-12 h-12 text-gray-700" />
                    
                    {/* Top overlay with version */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-3">
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
                  <div className="p-4 bg-[#0a0a0f] border-t border-white/5">
                    {/* Title */}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-500 shrink-0" />
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

                    {/* Type & Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 capitalize">{p.type}</span>
                      <span className="text-gray-700">•</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                    </div>

                    {/* Visibility & Members */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
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
                            const tagObj = toProjectTagOption(tag, index);
                            return (
                              <span 
                                key={tag} 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                                style={{ 
                                  backgroundColor: tagObj.color + '25', 
                                  color: tagObj.color,
                                  border: `1px solid ${tagObj.color}30`
                                }}
                              >
                                {tagObj.name}
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
                  {/* Context menu (pic16) */}
                  {contextMenuId === p.id && menuPosition && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setContextMenuId(null); setMenuPosition(null); }} />
                      <div className="fixed bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-[100] w-52 py-1.5" style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}>
                        <button onClick={() => handleToggleFavourite(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Star className={`w-3.5 h-3.5 ${p.favourite ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {p.favourite ? 'Remove from favourite' : 'Add to favourite'}</button>
                        <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Share2 className="w-3.5 h-3.5" /> Share</button>
                        <button onClick={() => { setEditingProjectId(p.id); setEditName(p.name); setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Pencil className="w-3.5 h-3.5" /> Rename</button>
                        <div className="relative group/status">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusMenuId((current) => current === p.id ? null : p.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition justify-between"
                          >
                            <span className="flex items-center gap-2.5"><Hash className="w-3.5 h-3.5" /> Status</span>
                            <ChevronDown className="w-3 h-3 text-gray-600" />
                          </button>
                          <div className={`${statusMenuId === p.id ? "block" : "hidden"} absolute left-full top-0 ml-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl w-36 py-1`}>
                            {(["On Hold", "In Progress", "Completed", "Draft"] as const).map(s => (
                              <button key={s} onClick={(e) => { e.stopPropagation(); handleStatusChange(p.id, s); }} className="w-full px-4 py-2 hover:bg-white/5 text-gray-300 text-xs text-left transition">{s}</button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => { setContextMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Eye className="w-3.5 h-3.5" /> Visibility</button>
                        <button onClick={() => handleDuplicate(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Copy className="w-3.5 h-3.5" /> Duplicate storyboard</button>
                        <div className="border-t border-white/6 my-1" />
                        <button onClick={() => handleDeleteProject(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-500/10 text-red-400 text-xs transition"><Trash2 className="w-3.5 h-3.5" /> Delete storyboard</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <button onClick={() => setShowCreateModal(true)}
              className="bg-[#16161f] border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center gap-2 min-h-[180px] hover:border-white/20 hover:bg-white/2 transition">
              <Plus className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600 text-xs">Add storyboard</span>
            </button>
          </div>
        ) : (
          /* ── Table view (pic9/pic11) ── */
          <div className="bg-[#111118] border border-white/6 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/6 text-left">
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium w-16">Preview</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Project</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Tags</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Status</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium">Last Update</th>
                  <th className="px-4 py-3 text-gray-500 text-xs font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(p => {
                  const Icon = TYPE_ICON[p.type];
                  return (
                    <tr key={p.id} className="border-b border-white/4 hover:bg-white/2 transition cursor-pointer" onClick={() => onOpenProject(p, "storyboard")}>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 bg-[#1e1e2a] rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-700" />
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
                                const tagObj = toProjectTagOption(tag, index);
                                return (
                                  <span 
                                    key={tag} 
                                    className="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-medium transition-all duration-200 hover:scale-105"
                                    style={{ 
                                      backgroundColor: tagObj.color + '25', 
                                      color: tagObj.color,
                                      border: `1px solid ${tagObj.color}30`
                                    }}
                                  >
                                    {tagObj.name}
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
                         <div className={`${statusMenuId === p.id ? "block" : "hidden"} absolute left-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-50 w-32 py-1`}>
                           {(["On Hold", "In Progress", "Completed", "Draft"] as const).map(s => (
                             <button key={s} onClick={e => { e.stopPropagation(); handleStatusChange(p.id, s); }} className="w-full px-3 py-1.5 hover:bg-white/5 text-gray-300 text-xs text-left transition">{s}</button>
                           ))}
                         </div>
                       </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.dueDate || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); handleToggleFavourite(p.id); }} className="p-1 transition"><Star className={`w-3.5 h-3.5 ${p.favourite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`} /></button>
                          <button onClick={e => e.stopPropagation()} className="p-1 text-gray-500 hover:text-white transition"><Share2 className="w-3.5 h-3.5" /></button>
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
                            className="p-1 text-gray-500 hover:text-white transition relative">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                            {contextMenuId === p.id && menuPosition && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={ev => { ev.stopPropagation(); setContextMenuId(null); setMenuPosition(null); }} />
                                <div className="fixed bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-[100] w-52 py-1.5" style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}>
                                  <button onClick={() => handleToggleFavourite(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Star className={`w-3.5 h-3.5 ${p.favourite ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {p.favourite ? 'Remove from favourite' : 'Add to favourite'}</button>
                                  <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Share2 className="w-3.5 h-3.5" /> Share</button>
                                  <button onClick={() => { setEditingProjectId(p.id); setEditName(p.name); setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Pencil className="w-3.5 h-3.5" /> Rename</button>
                                  <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Eye className="w-3.5 h-3.5" /> Visibility</button>
                                  <button onClick={() => handleDuplicate(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Copy className="w-3.5 h-3.5" /> Duplicate storyboard</button>
                                  <div className="border-t border-white/6 my-1" />
                                  <button onClick={() => handleDeleteProject(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-500/10 text-red-400 text-xs transition"><Trash2 className="w-3.5 h-3.5" /> Delete storyboard</button>
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Add stage row */}
            <button onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-dashed border-white/6 text-gray-600 hover:text-gray-400 text-xs transition">
              <Plus className="w-3.5 h-3.5" /> Add storyboard
            </button>
          </div>
        )}
      </div>

      {/* Create modal (pic12) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#1c1c26] border border-white/10 rounded-2xl w-full max-w-3xl p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with X button */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold">Create new</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Files name, Files type, and Frame ratio row */}
            <div className="flex gap-4 mb-5">
              <div className="flex-1">
                <label className="text-gray-400 text-xs mb-1.5 block">Files name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="ex. Animation"
                  className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  autoFocus
                />
                <div className="text-[10px] text-gray-500 mt-1">{newName.length} / 50</div>
              </div>
              <div className="w-28">
                <label className="text-gray-400 text-xs mb-1.5 block">Files type</label>
                <div className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm">
                  Board
                </div>
              </div>
              <div className="w-36">
                <label className="text-gray-400 text-xs mb-1.5 block">Frame ratio</label>
                <div className="relative">
                  <select
                    value={newFrameRatio}
                    onChange={(e) => setNewFrameRatio(e.target.value)}
                    className="w-full bg-[#1a1a1f] border border-white/10 rounded-full px-4 py-2.5 text-white text-sm appearance-none cursor-pointer hover:bg-[#25252a] transition focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="9:16">TikTok</option>
                    <option value="16:9">YouTube</option>
                    <option value="1:1">Square</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{newFrameRatio}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Art style picker with preview images - 6 columns, 3 rows, no scroll */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-3 block">Art style</label>
              <div className="grid grid-cols-6 gap-2">
                {VISUAL_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setNewArtStyle(style.id)}
                    className={`relative aspect-[4/3] rounded-lg border-2 transition overflow-hidden ${
                      newArtStyle === style.id ? "border-violet-500" : "border-white/10 hover:border-white/30"
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
                      <span className="text-white text-[10px] font-medium leading-tight block">{style.label}</span>
                    </div>
                    {newArtStyle === style.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  newName.trim() && !isCreating
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-white/10 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
                Create step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TagEditor Modal for Projects */}
      {showTagEditor && selectedProjectId && (
        <TagEditor
          selectedTags={(() => {
            const project = projects.find((p) => p.id === selectedProjectId);
            if (!project) return [];
            
            return project.tags.map((tagId, index) => toProjectTagOption(tagId, index));
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
