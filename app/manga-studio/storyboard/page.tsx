"use client";

import { useState } from "react";
import type { Step, Orientation, ViewMode, Shot, Tag, CommentItem, CastMember, LocationAsset, BoardSettings, Project } from "./types";
import { SAMPLE_SHOTS, SAMPLE_CAST, SAMPLE_LOCATIONS } from "./constants";

import { SidebarNav }         from "./components/SidebarNav";
import { ProjectsDashboard }  from "./components/ProjectsDashboard";
import { BoardView }          from "./components/BoardView";
import { SceneEditor }        from "./components/SceneEditor";
import { StepNav, ScriptInput, Breakdown, StyleSelection, CastStep } from "./components/WizardSteps";
import { PdfModal, ShareModal, TagModal } from "./components/Modals";
import { UniverseManager }    from "./components/UniverseManager";
import type { UMTab }         from "./components/UniverseManager";
import { AssetGenerator }     from "./components/AssetGenerator";
import { MembersPage }        from "./components/MembersPage";

const INITIAL_PROJECTS: Project[] = [
  { id: "p1", name: "Sample Storyboard", type: "board",  status: "On Hold",    version: 1, members: 10, reviewers: 1, dueDate: "14 Jun, 2025", assignee: "Alex", tags: [] },
  { id: "p2", name: "Character Design",  type: "folder", status: "On Hold",    version: 1, members: 10, reviewers: 1, dueDate: "14 Jun, 2025", assignee: "Alex", tags: [] },
  { id: "p3", name: "Script v1",         type: "stage",  status: "In Progress",version: 1, members: 10, reviewers: 1, dueDate: "20 Jun, 2025", assignee: "Alex", tags: [] },
];

export default function StoryboardPage() {
  // ── Layout ─────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav,   setActiveNav]   = useState("projects");
  const [umTab,       setUmTab]       = useState<UMTab>("basic-info");

  // ── Projects ───────────────────────────────────────────────────────────────
  const [projects,        setProjects]        = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // ── Wizard / step state ────────────────────────────────────────────────────
  const [currentStep,   setCurrentStep]   = useState<Step>("dashboard");
  const [projectName,   setProjectName]   = useState("Sample Storyboard");
  const [editingName,   setEditingName]   = useState(false);
  const [orientation,   setOrientation]   = useState<Orientation>("16:9");
  const [sceneCount,    setSceneCount]    = useState(5);
  const [scriptIdea,    setScriptIdea]    = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [setting,       setSetting]       = useState("Modern city, abandoned industrial district");

  // ── Storyboard data ────────────────────────────────────────────────────────
  const [shots,     setShots]     = useState<Shot[]>(SAMPLE_SHOTS);
  const [cast,      setCast]      = useState<CastMember[]>(SAMPLE_CAST);
  const [locations, setLocations] = useState<LocationAsset[]>(SAMPLE_LOCATIONS);

  // ── Board view state ───────────────────────────────────────────────────────
  const [viewMode,          setViewMode]          = useState<ViewMode>("grid");
  const [zoomLevel,         setZoomLevel]         = useState(100);
  const [selectedShotId,    setSelectedShotId]    = useState<string | null>(null);
  const [sceneEditorShotId, setSceneEditorShotId] = useState<string | null>(null);
  const [draggedShotId,     setDraggedShotId]     = useState<string | null>(null);

  // ── View mode change handler ─────────────────────────────────────────────────────
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };
  const [commentText,       setCommentText]       = useState("");
  const [commentTab,        setCommentTab]        = useState<"selected" | "all">("selected");

  // ── UI toggles ─────────────────────────────────────────────────────────────
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showPdfModal,       setShowPdfModal]       = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showBoardSettings, setShowBoardSettings] = useState(false);

  const [boardSettings, setBoardSettings] = useState<BoardSettings>({
    showNotes: true, showScript: true, showAction: true, showCamera: true,
    showLighting: true, showTags: true, showIcons: true, showFrameNumbers: true,
    frameFormat: "1:1",
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGenerateScript = () => {
    setShots(SAMPLE_SHOTS.slice(0, sceneCount));
    setProjectName(scriptIdea ? scriptIdea.substring(0, 30) + "..." : "Warehouse Whispers");
    setCurrentStep("breakdown");
  };

  const handleDeleteShot = (id: string) => setShots(s => s.filter(x => x.id !== id));

  const handleAddShot = () => {
    const mx = shots.length > 0 ? Math.max(...shots.map(s => s.shot)) : 0;
    setShots(prev => [...prev, {
      id: `s${Date.now()}`, scene: 1, shot: mx + 1,
      description: "New storyboard item...", ert: "5 sec",
      shotSize: "Medium shot", perspective: "Eye-level shot", movement: "Static",
      equipment: "Handheld camera", focalLength: "35mm", aspectRatio: orientation,
      cast: [], location: setting, voiceOver: "", action: "",
      tags: [], notes: "", comments: [],
    }]);
  };

  const handleDragStart = (id: string) => setDraggedShotId(id);
  const handleDragOver  = (e: React.DragEvent) => e.preventDefault();
  const handleDrop      = (targetId: string) => {
    if (!draggedShotId || draggedShotId === targetId) return;
    const di = shots.findIndex(s => s.id === draggedShotId);
    const ti = shots.findIndex(s => s.id === targetId);
    if (di < 0 || ti < 0) return;
    const r = [...shots]; const [rm] = r.splice(di, 1); r.splice(ti, 0, rm);
    setShots(r); setDraggedShotId(null);
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedShotId) return;
    const nc: CommentItem = { id: `cm${Date.now()}`, author: "You", avatar: "Y", text: commentText, timestamp: "Just now" };
    setShots(s => s.map(x => x.id === selectedShotId ? { ...x, comments: [...x.comments, nc] } : x));
    setCommentText("");
  };

  const handleProjectStatusChange = (status: Project["status"]) => {
    if (selectedProject) {
      setSelectedProject({ ...selectedProject, status });
    }
  };

  const handleAddTag = (name: string, color: string) => {
    const t: Tag = { id: `tag${Date.now()}`, name, color };
    if (selectedShotId) {
      setShots(s => s.map(x => x.id === selectedShotId ? { ...x, tags: [...x.tags, t] } : x));
    }
  };


  const handleNavChange = (key: string) => {
    setActiveNav(key);
    setActiveFilter(key);
    if (key === "projects")        setCurrentStep("dashboard");
    if (key === "universe")        setCurrentStep("universe");
    if (key === "asset-generator") setCurrentStep("asset-generator");
    if (key === "members")          setCurrentStep("members");
    // For filters, stay on dashboard
    if (key.startsWith("tag:") || key.startsWith("status:") || key.startsWith("project:") || key === "favourite" || key === "recent") {
      setCurrentStep("dashboard");
    }
  };

  const handleOpenProject = (project: Project, step: Step) => {
    setSelectedProject(project);
    setProjectName(project.name);
    setCurrentStep(step);
    // Set view mode to grid when opening storyboard
    if (step === "storyboard") {
      setViewMode("grid");
    }
  };

  // ── Breadcrumb for board views ─────────────────────────────────────────────
  const renderBreadcrumb = () => {
    if (currentStep === "dashboard") return null;
    const crumbs: { label: string; step: Step }[] = [
      { label: "Projects", step: "dashboard" },
    ];
    if (selectedProject) crumbs.push({ label: selectedProject.name, step: "storyboard" });
    if (currentStep === "scene-editor" && sceneEditorShotId) {
      const shot = shots.find(s => s.id === sceneEditorShotId);
      if (shot) crumbs.push({ label: `Frame ${String(shot.shot).padStart(2, "0")}`, step: "scene-editor" });
    }
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/6 bg-[#0d0d12] text-xs text-gray-500 shrink-0">
        {crumbs.map((c, i) => (
          <span key={c.step} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-700">/</span>}
            <button
              onClick={() => setCurrentStep(c.step)}
              className={`hover:text-white transition ${i === crumbs.length - 1 ? "text-white font-medium" : "hover:text-gray-300"}`}
            >
              {c.label}
            </button>
          </span>
        ))}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0d0d12] overflow-hidden">
      {/* Sidebar */}
      <SidebarNav
        open={sidebarOpen}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        projects={projects}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Breadcrumb */}
        {renderBreadcrumb()}

        {/* Step nav (wizard steps only) */}
        {(currentStep === "script" || currentStep === "breakdown" || currentStep === "style" || currentStep === "cast") && (
          <StepNav currentStep={currentStep} onStepClick={setCurrentStep} />
        )}

        {/* ── Views ── */}

        {currentStep === "dashboard" && (
          <ProjectsDashboard
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            projects={projects}
            onProjectsChange={setProjects}
            onOpenProject={handleOpenProject}
            activeFilter={activeFilter}
          />
        )}

        {currentStep === "script" && (
          <ScriptInput
            scriptIdea={scriptIdea}
            sceneCount={sceneCount}
            onScriptIdeaChange={setScriptIdea}
            onSceneCountChange={setSceneCount}
            onGenerate={handleGenerateScript}
          />
        )}

        {currentStep === "breakdown" && (
          <Breakdown
            shots={shots}
            projectName={projectName}
            editingName={editingName}
            sceneCount={sceneCount}
            orientation={orientation}
            setting={setting}
            scriptIdea={scriptIdea}
            editingShotId={null}
            editingShotText=""
            onProjectNameChange={setProjectName}
            onEditingNameChange={setEditingName}
            onSceneCountChange={setSceneCount}
            onOrientationChange={setOrientation}
            onSettingChange={setSetting}
            onScriptIdeaChange={setScriptIdea}
            onEditingShotIdChange={() => {}}
            onEditingShotTextChange={() => {}}
            onSaveShotEdit={() => {}}
            onDeleteShot={handleDeleteShot}
            onAddShot={handleAddShot}
            onGenerate={handleGenerateScript}
            onBack={() => setCurrentStep("script")}
            onNext={() => setCurrentStep("style")}
          />
        )}

        {currentStep === "style" && (
          <StyleSelection
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            onBack={() => setCurrentStep("breakdown")}
            onNext={() => { setCast(SAMPLE_CAST); setLocations(SAMPLE_LOCATIONS); setCurrentStep("cast"); }}
          />
        )}

        {currentStep === "cast" && (
          <CastStep
            cast={cast}
            locations={locations}
            onBack={() => setCurrentStep("style")}
            onNext={() => setCurrentStep("storyboard")}
          />
        )}

        {currentStep === "storyboard" && selectedProject && (
          <BoardView
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            project={selectedProject}
            shots={shots}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            selectedShotId={selectedShotId}
            onSelectShot={setSelectedShotId}
            onOpenSceneEditor={id => { setSceneEditorShotId(id); setCurrentStep("scene-editor"); }}
            onAddShot={handleAddShot}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            boardSettings={boardSettings}
            showBoardSettings={showBoardSettings}
            onToggleBoardSettings={() => setShowBoardSettings(v => !v)}
            onBoardSettingsChange={setBoardSettings}
            showExportDropdown={showExportDropdown}
            onToggleExportDropdown={() => setShowExportDropdown(v => !v)}
            onOpenPdfModal={() => setShowPdfModal(true)}
            onOpenShareModal={() => setShowShareModal(true)}
            commentTab={commentTab}
            onCommentTabChange={setCommentTab}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            onAddComment={handleAddComment}
            onProjectStatusChange={handleProjectStatusChange}
          />
        )}

        {currentStep === "scene-editor" && sceneEditorShotId && (
          <SceneEditor
            shots={shots}
            initialShotId={sceneEditorShotId}
            onClose={() => setCurrentStep("storyboard")}
            onShotsChange={setShots}
          />
        )}

        {currentStep === "universe" && (
          <UniverseManager
            projectName={projectName}
            activeTab={umTab}
            onTabChange={setUmTab}
          />
        )}

        {currentStep === "asset-generator" && (
          <AssetGenerator />
        )}

        {currentStep === "members" && (
          <MembersPage />
        )}
      </div>

      {/* Modals */}
      {showPdfModal    && <PdfModal   onClose={() => setShowPdfModal(false)}   boardSettings={boardSettings} />}
      {showShareModal  && <ShareModal onClose={() => setShowShareModal(false)} projectName={projectName} />}
      {showTagModal    && <TagModal   onClose={() => setShowTagModal(false)}   onAdd={handleAddTag} />}
    </div>
  );
}
