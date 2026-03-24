"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useOrganization, useUser, UserButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import type { Step, Orientation, ViewMode, Shot, Tag, CommentItem, CastMember, LocationAsset, BoardSettings, Project } from "./types";
import { SAMPLE_SHOTS, SAMPLE_CAST, SAMPLE_LOCATIONS } from "./constants";
import { getCurrentCompanyId } from "@/lib/auth-utils";

import { ProjectsDashboard }  from "./components/ProjectsDashboard";
import { BoardView }          from "./components/BoardView";
import { SceneEditor }        from "./components/SceneEditor";
import { StepNav, ScriptInput, Breakdown, StyleSelection, CastStep } from "./components/WizardSteps";
import { PdfModal, ShareModal, TagModal } from "./components/Modals";
import { AssetGenerator }     from "./components/AssetGenerator";
import { MembersPage }        from "./components/MembersPage";
import { UsageDashboard }     from "./components/UsageDashboard";
import { FileBrowser } from "./components/storyboard/FileBrowser";
import { useStoryboardStudioUI } from "./StoryboardStudioUIContext";
import PricingManagementPage from "./components/admin/PricingManagementPage";

export default function StoryboardPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const { user } = useUser();
  const { activeNav, setActiveNav, sidebarOpen, setSidebarOpen } = useStoryboardStudioUI();
  
  // ✅ Use global getCurrentCompanyId function
  const companyId = getCurrentCompanyId(user);
  const orgId = organization?.id ?? user?.id ?? "personal";

  // ── Convex project data ─────────────────────────────────────────────────────
  const convexProjects = useQuery(api.storyboard.projects.listByOrg, { orgId });
  const createConvexProject = useMutation(api.storyboard.projects.create);
  const removeConvexProject = useMutation(api.storyboard.projects.remove);
  const updateConvexProject = useMutation(api.storyboard.projects.update);
  const duplicateConvexProject = useMutation(api.storyboard.projects.duplicate);
  
  // Client-side mutation for file logging (like FrameCard)
  const logFile = useMutation(api.storyboard.storyboardFiles.logUpload);

  // ── Layout ─────────────────────────────────────────────────────────────────
  // ── Projects (local state kept for legacy BoardView/SceneEditor) ────────────
  const [projects,        setProjects]        = useState<Project[]>([]);
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
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showGlobalFileBrowser, setShowGlobalFileBrowser] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Use a global "unassigned" category for main page uploads
    // This creates a special project for global files
    const globalProjectId = "global-files";
    
    // Ensure global project exists
    if (!convexProjects || convexProjects.length === 0) {
      await createConvexProject({
        name: "Global Files",
        orgId,
        ownerId: user?.id ?? "unknown",
        // ✅ Remove companyId - calculated on server from auth context
        settings: { frameRatio: "16:9", style: "realistic", layout: "grid" },
      });
    }

    try {
      // Use companyId-based storage path: {companyId}/uploads/{timestamp}-{filename}
      const r2Key = `${companyId}/uploads/${Date.now()}-${file.name}`;
      const sigRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: r2Key, contentType: file.type }),
      });
      const { uploadUrl } = await sigRes.json();

      const uploadResponse = await fetch(uploadUrl, { 
        method: "PUT", 
        body: file, 
        headers: { "Content-Type": file.type },
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }
      
      // Use client-side mutation like FrameCard
      await logFile({
        orgId: organization?.id ?? null, // Use null instead of undefined for optional fields
        userId: organization?.id ? null : (user?.id ?? null), // Only set userId if no org
        projectId: null, // Main page uploads don't belong to specific projects
        // ✅ Remove companyId - calculated on server from auth context
        r2Key,
        filename: file.name,
        fileType: file.type.startsWith("video") ? "video" : 
                  file.type.startsWith("audio") ? "audio" : 
                  file.type.includes("pdf") ? "pdf" : "image",
        mimeType: file.type,
        size: file.size,
        category: "uploads", // Standard uploads category
        tags: [],
        uploadedBy: user?.id || "anonymous",
        status: "ready",
      });
      
      console.log(`[Files Upload] Uploaded to global: ${file.name}`);
    } catch (err) {
      console.error("[Files Upload Error]", err);
    } finally {
      e.target.value = "";
    }
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
  useEffect(() => {
    setActiveFilter(activeNav === "projects" ? null : activeNav);

    if (activeNav === "projects") setCurrentStep("dashboard");
    if (activeNav === "asset-generator") setCurrentStep("element-generator");
    if (activeNav === "image-maker") setCurrentStep("image-maker");
    if (activeNav === "price-management") setCurrentStep("price-management");
    if (activeNav === "members") setCurrentStep("members");
    if (activeNav === "usage") setCurrentStep("usage");

    if (
      activeNav.startsWith("tag:") ||
      activeNav.startsWith("status:") ||
      activeNav.startsWith("project:") ||
      activeNav === "favourite" ||
      activeNav === "recent"
    ) {
      setCurrentStep("dashboard");
    }
  }, [activeNav]);

  const handleOpenProject = (project: Project, step: Step) => {
    // If this is a Convex project (ID looks like a Convex ID), navigate to workspace
    if (project.id && project.id.length > 15 && !project.id.startsWith("p")) {
      router.push(`/storyboard-studio/workspace/${project.id}`);
      return;
    }
    setSelectedProject(project);
    setProjectName(project.name);
    setCurrentStep(step);
    if (step === "storyboard") setViewMode("grid");
  };

  const handleCreateConvexProject = async (name: string, frameRatio: string, style: string) => {
    if (!name.trim()) return;
    const id = await createConvexProject({
      name,
      orgId,
      ownerId: user?.id ?? "unknown",
      // ✅ Remove companyId - calculated on server from auth context
      settings: { frameRatio, style, layout: "grid" },
    });
    router.push(`/storyboard-studio/workspace/${id}`);
  };

  const handleDeleteConvexProject = async (id: string) => {
    try {
      await removeConvexProject({ id: id as Parameters<typeof removeConvexProject>[0]["id"] });
      console.log(`[delete project] Successfully deleted project: ${id}`);
    } catch (err) {
      console.error("[delete project]", err);
      
      // User-friendly error message
      if (err instanceof Error && err.message.includes("not found")) {
        alert(`This project may have already been deleted or is no longer available. The project list will refresh automatically.`);
      } else {
        alert(`Unable to delete project. Please try again or refresh the page.`);
      }
    }
  };

  const handleDuplicateConvexProject = async (id: string) => {
    try {
      await duplicateConvexProject({ id: id as Parameters<typeof duplicateConvexProject>[0]["id"] });
    } catch (err) {
      console.error("[duplicate project]", err);
    }
  };

  const handleRemoveImageUrl = async (id: string) => {
    try {
      await updateConvexProject({
        id: id as any,
        imageUrl: undefined
      });
      console.log("ImageUrl unset successfully from project");
    } catch (error) {
      console.error("Failed to unset ImageUrl:", error);
    }
  };

  const handleProjectsChange = async (nextProjects: Project[]) => {
    setProjects(nextProjects);

    if (!convexProjects) {
      return;
    }

    const convexProjectIds = new Set(convexProjects.map((project) => String(project._id)));
    const changedConvexProjects = nextProjects.filter((project) => convexProjectIds.has(project.id));

    await Promise.all(
      changedConvexProjects.map(async (project) => {
        try {
          await updateConvexProject({
            id: project.id as Parameters<typeof updateConvexProject>[0]["id"],
            name: project.name,
            status: project.status,
            isFavorite: project.favourite,
            tags: project.tags,
          });
        } catch (err) {
          console.error("[update project]", project.id, err);
        }
      })
    );
  };

  // ── Breadcrumb for board views ─────────────────────────────────────────────
  const renderBreadcrumb = () => {
    if (
      currentStep === "element-generator" ||
      currentStep === "image-maker" ||
      currentStep === "members" ||
      currentStep === "usage" ||
      currentStep === "price-management"
    ) return null;
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
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1.5">
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
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0d0d12] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Step nav (wizard steps only) */}
        {(currentStep === "script" || currentStep === "breakdown" || currentStep === "style" || currentStep === "cast") && (
          <StepNav currentStep={currentStep} onStepClick={setCurrentStep} />
        )}

        {/* ── Views ── */}

        {currentStep === "dashboard" && (
          <ProjectsDashboard
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            projects={convexProjects?.map(p => ({
              id: p._id,
              name: p.name,
              type: "board" as const,
              status: p.status as Project["status"] ?? "Draft",
              version: 1,
              members: p.teamMemberIds.length + 1,
              reviewers: 0,
              dueDate: "",
              assignee: "You",
              tags: p.tags,
              favourite: p.isFavorite ?? false,
              settings: p.settings,
              imageUrl: p.imageUrl, // ✅ Add imageUrl field
            })) ?? projects}
            onProjectsChange={handleProjectsChange}
            onOpenProject={handleOpenProject}
            onCreateConvexProject={handleCreateConvexProject}
            onDeleteProject={handleDeleteConvexProject}
            onDuplicateProject={handleDuplicateConvexProject}
            onRemoveImageUrl={handleRemoveImageUrl}
            onOpenFileBrowser={() => {
              // Trigger simple file input click
              const fileInput = document.getElementById('files-upload-input') as HTMLInputElement;
              fileInput?.click();
            }}
            onOpenGlobalFileBrowser={() => setShowGlobalFileBrowser(true)}
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
            sidebarOpen={true}
            onToggleSidebar={() => {}}
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

        {currentStep === "element-generator" && (
          <AssetGenerator />
        )}

        {currentStep === "members" && (
          <MembersPage />
        )}

        {currentStep === "usage" && (
          <div className="flex-1 overflow-y-auto">
            <UsageDashboard />
          </div>
        )}

        {currentStep === "price-management" && (
          <PricingManagementPage 
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
      </div>

      {/* Modals */}
      {showPdfModal    && <PdfModal   onClose={() => setShowPdfModal(false)}   boardSettings={boardSettings} />}
      {showShareModal  && <ShareModal onClose={() => setShowShareModal(false)} projectName={projectName} />}
      {showTagModal    && <TagModal   onClose={() => setShowTagModal(false)}   onAdd={handleAddTag} />}
      {showGlobalFileBrowser && (
        <FileBrowser
          projectId="" // Pass empty string for global files (no project association)
          onClose={() => setShowGlobalFileBrowser(false)}
        />
      )}
      
      {/* Hidden file input for Files upload */}
      <input
        type="file"
        id="files-upload-input"
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf"
        onChange={handleFileUpload}
      />
    </div>
  );
}
