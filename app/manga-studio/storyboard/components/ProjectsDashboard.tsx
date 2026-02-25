"use client";

import { useState } from "react";
import {
  Star, MoreHorizontal, Search, Filter, Settings, Users, ChevronDown,
  Plus, Image as ImageIcon, LayoutGrid, Folder, FileText, Link2,
  PanelLeftClose, PanelLeftOpen, List, Share2, Pencil, Eye, Copy,
  Trash2, Tag, Hash, Grid3x3, Table2, Edit3, ChevronRight,
} from "lucide-react";
import { VISUAL_STYLES } from "../constants";
import type { Project, Step } from "../types";
import { TAG_COLORS } from "../constants";

interface ProjectsDashboardProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  projects: Project[];
  onProjectsChange: (projects: Project[]) => void;
  onOpenProject: (project: Project, step: Step) => void;
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
  sidebarOpen, onToggleSidebar, projects, onProjectsChange, onOpenProject, activeFilter,
}: ProjectsDashboardProps) {
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Project["type"]>("board");
  const [newArtStyle, setNewArtStyle] = useState(VISUAL_STYLES[0].id);
  const [dashView, setDashView] = useState<"card" | "table">("card");
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [tagPickerProjectId, setTagPickerProjectId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [tagPickerPosition, setTagPickerPosition] = useState<{ top: number; left: number } | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const p: Project = {
      id: `p${Date.now()}`, name: newName, type: newType,
      status: "Draft", version: 1, members: 1, reviewers: 0,
      dueDate: "", assignee: "You", tags: [],
    };
    onProjectsChange([...projects, p]);
    onOpenProject(p, "storyboard");
    setShowCreateModal(false);
    setNewName("");
  };

  const handleDeleteProject = (id: string) => {
    onProjectsChange(projects.filter(p => p.id !== id));
    setContextMenuId(null);
  };

  const handleAddProjectTag = (projectId: string) => {
    if (!newTagName.trim()) return;
    onProjectsChange(projects.map(p =>
      p.id === projectId ? { ...p, tags: [...p.tags, newTagName.trim()] } : p
    ));
    setNewTagName("");
    setTagPickerProjectId(null);
    setTagPickerPosition(null);
  };

  const handleStatusChange = (id: string, status: Project["status"]) => {
    onProjectsChange(projects.map(p => p.id === id ? { ...p, status } : p));
    setContextMenuId(null);
    setMenuPosition(null);
  };

  const handleToggleFavourite = (id: string) => {
    onProjectsChange(projects.map(p => 
      p.id === id ? { ...p, favourite: !p.favourite } : p
    ));
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
    setContextMenuId(null);
    setMenuPosition(null);
  };

  const handleDuplicate = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const duplicate: Project = {
      ...project,
      id: `p${Date.now()}`,
      name: `${project.name} (copy)`,
    };
    onProjectsChange([...projects, duplicate]);
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
    { icon: FileText, label: "File Stage",  desc: "Upload files: Video, Images, Audio, PDF", type: "stage"  as const },
    { icon: LayoutGrid, label: "Board",     desc: "Create your own storyboard",              type: "board"  as const },
    { icon: Folder,    label: "Folder",     desc: "Organize your files with folders",        type: "folder" as const },
    { icon: Link2,     label: "Link",       desc: "Add an external link to your pipeline",   type: "link"   as const },
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
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-400 hover:text-white transition"><Search className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400 hover:text-white transition"><Filter className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400 hover:text-white transition"><Settings className="w-4 h-4" /></button>
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
                      onClick={() => { setNewType(item.type); setShowNewDropdown(false); setShowCreateModal(true); }}
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
          /* ── Card view (pic12) ── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProjects.map(p => {
              const Icon = TYPE_ICON[p.type];
              return (
                <div key={p.id} className="bg-[#16161f] border border-white/8 rounded-xl overflow-hidden cursor-pointer hover:border-white/20 transition group relative">
                  <div className="aspect-video bg-[#1e1e2a] flex items-center justify-center relative" onClick={() => onOpenProject(p, "storyboard")}>
                    <ImageIcon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3 h-3 text-gray-500 shrink-0" />
                      {editingProjectId === p.id ? (
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => handleRename(p.id, editName)}
                          onKeyDown={e => { if (e.key === "Enter") handleRename(p.id, editName); if (e.key === "Escape") { setEditingProjectId(null); setEditName(""); } }}
                          onClick={e => e.stopPropagation()}
                          className="bg-transparent text-white text-sm font-semibold truncate flex-1 outline-none border-b border-white/40"
                          autoFocus
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold truncate flex-1" onClick={() => onOpenProject(p, "storyboard")}>{p.name}</span>
                      )}
                      <span className="text-gray-600 text-[10px]">v{p.version}</span>
                      <button className="opacity-0 group-hover:opacity-100 p-0.5 transition"
                        onClick={e => { 
                          e.stopPropagation(); 
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
                        <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                    <div className="text-gray-600 text-[10px] capitalize mb-2">{p.type}</div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      <button className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-[10px] transition"
                        onClick={e => e.stopPropagation()}>+ Add</button>
                    </div>
                    {p.dueDate && <div className="text-gray-600 text-[10px] mb-1">{p.dueDate} <span className="text-gray-700">Due date</span></div>}
                    <div className="text-[10px] text-gray-600 mb-1"><Eye className="w-2.5 h-2.5 inline mr-1" />Visibility <span className="text-violet-400">Everyone</span></div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 mb-2">
                      <span>{p.members} members</span><span>{p.reviewers} reviewers</span>
                    </div>
                    {p.assignee && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-[9px] text-white font-bold">{p.assignee[0]}</div>
                        <span className="text-gray-500 text-[10px]">{p.assignee}</span>
                      </div>
                    )}
                    {/* Tags on card (pic12) */}
                    <div className="flex items-center gap-1 mt-1">
                      <Tag className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                      {p.tags.length > 0 ? (
                        p.tags.map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[9px]">{t}</span>
                        ))
                      ) : (
                        <button onClick={e => { 
                          e.stopPropagation(); 
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTagPickerPosition({ 
                            top: rect.bottom + window.scrollY + 4, 
                            left: rect.left 
                          });
                          setTagPickerProjectId(p.id); 
                        }} className="text-gray-600 hover:text-gray-400 text-[9px] transition">+ Add Tags</button>
                      )}
                      {p.tags.length > 0 && (
                        <button onClick={e => { 
                          e.stopPropagation(); 
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTagPickerPosition({ 
                            top: rect.bottom + window.scrollY + 4, 
                            left: rect.left 
                          });
                          setTagPickerProjectId(p.id); 
                        }} className="text-gray-600 hover:text-gray-400 text-[9px] transition">+ Add</button>
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
                          <button className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition justify-between">
                            <span className="flex items-center gap-2.5"><Hash className="w-3.5 h-3.5" /> Status</span>
                            <ChevronDown className="w-3 h-3 text-gray-600" />
                          </button>
                          <div className="hidden group-hover/status:block absolute left-full top-0 ml-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl w-36 py-1">
                            {(["On Hold", "In Progress", "Completed", "Draft"] as const).map(s => (
                              <button key={s} onClick={() => handleStatusChange(p.id, s)} className="w-full px-4 py-2 hover:bg-white/5 text-gray-300 text-xs text-left transition">{s}</button>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => { setContextMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Eye className="w-3.5 h-3.5" /> Visibility</button>
                        <button onClick={() => { setContextMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Folder className="w-3.5 h-3.5" /> Move to</button>
                        <button onClick={() => handleDuplicate(p.id)} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><Copy className="w-3.5 h-3.5" /> Duplicate storyboard</button>
                        <button onClick={() => { setContextMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><LayoutGrid className="w-3.5 h-3.5" /> Set default view to grid</button>
                        <button onClick={() => { setContextMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><List className="w-3.5 h-3.5" /> Set default view to table</button>
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
                        <div className="flex items-center gap-1 relative">
                          {p.tags.length > 0 ? p.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[9px]">{t}</span>
                          )) : (
                            <button onClick={e => { 
                              e.stopPropagation(); 
                              if (tagPickerProjectId === p.id) {
                                setTagPickerProjectId(null);
                                setTagPickerPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTagPickerPosition({ 
                                  top: rect.bottom + window.scrollY + 4, 
                                  left: rect.left 
                                });
                                setTagPickerProjectId(p.id);
                              }
                            }}
                              className="text-gray-600 hover:text-gray-400 transition"><Hash className="w-3.5 h-3.5" /></button>
                          )}
                          {p.tags.length > 0 && (
                            <button onClick={e => { 
                              e.stopPropagation(); 
                              if (tagPickerProjectId === p.id) {
                                setTagPickerProjectId(null);
                                setTagPickerPosition(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTagPickerPosition({ 
                                  top: rect.bottom + window.scrollY + 4, 
                                  left: rect.left 
                                });
                                setTagPickerProjectId(p.id);
                              }
                            }}
                              className="text-gray-600 hover:text-gray-400 ml-1 transition"><Pencil className="w-2.5 h-2.5" /></button>
                          )}
                          {/* Tag picker dropdown (pic11/pic15) */}
                          {tagPickerProjectId === p.id && tagPickerPosition && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); setTagPickerProjectId(null); setTagPickerPosition(null); }} />
                              <div className="fixed bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-[100] w-52 p-3" style={{ top: `${tagPickerPosition?.top}px`, left: `${tagPickerPosition?.left}px` }} onClick={e => e.stopPropagation()}>
                                <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && handleAddProjectTag(p.id)}
                                  placeholder="Tag name" className="w-full bg-[#25252f] border border-white/8 rounded-lg px-2.5 py-1.5 text-white text-xs mb-2 focus:outline-none" autoFocus />
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {TAG_COLORS.map(c => (
                                    <button key={c} onClick={() => setNewTagColor(c)} aria-label={`Color ${c}`}
                                      className={`w-5 h-5 rounded transition ${newTagColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#1c1c26]" : ""}`}
                                      style={{ backgroundColor: c }} />
                                  ))}
                                </div>
                                <button onClick={() => handleAddProjectTag(p.id)} disabled={!newTagName.trim()}
                                  className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg text-xs font-medium transition">
                                  Create
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group/status">
                          <button onClick={e => e.stopPropagation()} className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[p.status]} hover:opacity-80 transition`}>
                            {p.status}
                          </button>
                          <div className="hidden group-hover/status:block absolute left-0 top-full mt-1 bg-[#1c1c26] border border-white/10 rounded-xl shadow-2xl z-50 w-32 py-1">
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
                                  <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><LayoutGrid className="w-3.5 h-3.5" /> Set default view to grid</button>
                                  <button onClick={() => { setContextMenuId(null); setMenuPosition(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 text-gray-300 text-xs transition"><List className="w-3.5 h-3.5" /> Set default view to table</button>
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
            className="bg-[#1c1c26] border border-white/10 rounded-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-bold mb-5">Create new</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Stage name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="ex. Animation"
                  className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  autoFocus
                />
                <div className="text-[10px] text-gray-600 mt-1">{newName.length} / 50</div>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Stage type</label>
                <div className="relative">
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as Project["type"])}
                    className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="board">⊞ Board</option>
                    <option value="stage">📄 File Stage</option>
                    <option value="folder">📁 Folder</option>
                    <option value="link">🔗 Link</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
            {/* Art style picker (pic4) */}
            <div>
              <label className="text-gray-400 text-xs mb-2.5 block">Art style</label>
              <div className="grid grid-cols-4 gap-2">
                {VISUAL_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setNewArtStyle(style.id)}
                    className={`relative aspect-square rounded-lg border-2 transition ${
                      newArtStyle === style.id ? "border-violet-500" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${style.gradient}`} />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white text-[9px] font-medium text-center px-1">{style.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                  newName.trim()
                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
