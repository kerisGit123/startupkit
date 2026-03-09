"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft, Sparkles, Loader2, Plus, Trash2,
  FileText, Grid3x3, Save, Play, Image as ImageIcon, Clock, Upload, FolderOpen, Users, Copy,
} from "lucide-react";
import { ImageAIPanel } from "../../components/storyboard/ImageAIPanel";
import { VideoAIPanel } from "../../components/storyboard/VideoAIPanel";
import { WorkspaceExportModal } from "../../components/storyboard/WorkspaceExportModal";
import { FileBrowser } from "../../components/storyboard/FileBrowser";
import { ElementLibrary } from "../../components/storyboard/ElementLibrary";
import { SceneEditor } from "../../components/SceneEditor";
import { TagEditor } from "../../components/storyboard/TagEditor";
import { parseScriptScenes } from "@/lib/storyboard/sceneParser";
import type { Shot } from "../../types";

type Tab = "script" | "storyboard";


export default function StoryboardWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { user } = useUser();

  const pid = projectId as Id<"storyboard_projects">;

  const project = useQuery(api.storyboard.projects.get, { id: pid });
  const items = useQuery(api.storyboard.storyboardItems.listByProject, { projectId: pid });

  const updateScript = useMutation(api.storyboard.projects.updateScript);
  const createBatch = useMutation(api.storyboard.storyboardItems.createBatch);
  const createItem = useMutation(api.storyboard.storyboardItems.create);
  const updateItem = useMutation(api.storyboard.storyboardItems.update);
  const removeItem = useMutation(api.storyboard.storyboardItems.remove);

  // Duplicate item function
  const duplicateItem = async (itemToDuplicate: any) => {
    try {
      // Find the position to insert the duplicate (right after the original)
      const currentItems = items || [];
      const originalIndex = currentItems.findIndex(item => item._id === itemToDuplicate._id);
      const insertOrder = originalIndex >= 0 ? itemToDuplicate.order + 0.5 : currentItems.length;
      
      // Create a new item with only the fields that match the Convex schema
      const newItem = {
        projectId: pid,
        sceneId: itemToDuplicate.sceneId,
        order: insertOrder,
        title: `${itemToDuplicate.title} (Copy)`,
        description: itemToDuplicate.description,
        duration: itemToDuplicate.duration,
        generatedBy: user?.id || "unknown"
      };

      const result = await createItem(newItem);
      console.log("Item duplicated successfully:", result);
    } catch (error) {
      console.error("Failed to duplicate item:", error);
    }
  };

  // Handle tag changes
  const handleTagsChange = async (itemId: string, newTags: Array<{ id: string; name: string; color: string }>) => {
    try {
      await updateItem({ 
        id: itemId as Id<"storyboard_items">, 
        tags: newTags 
      });
    } catch (error) {
      console.error("Failed to update tags:", error);
    }
  };

  const [tab, setTab] = useState<Tab>("storyboard");
  const [scriptText, setScriptText] = useState("");
  const [scriptDirty, setScriptDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showElementLibrary, setShowElementLibrary] = useState(false);
  const [showSceneEditor, setShowSceneEditor] = useState(false);
  const [selectedSceneItem, setSelectedSceneItem] = useState<any>(null);
  const [characterRef, setCharacterRef] = useState<{ name: string; urls: string[] } | null>(null);
  const [genre, setGenre] = useState("drama");
  const [duration, setDuration] = useState(30);

  // Sync script text from DB on first load
  const scriptFromDb = project?.script ?? "";
  const displayScript = scriptDirty ? scriptText : scriptFromDb;

  const handleScriptChange = (val: string) => {
    setScriptText(val);
    setScriptDirty(true);
  };

  const handleSaveScript = async () => {
    const scenes = parseScriptScenes(displayScript);
    await updateScript({
      id: pid,
      script: displayScript,
      scenes,
      isAIGenerated: false,
    });
    setScriptDirty(false);
  };

  const handleOpenSceneEditor = (item: any) => {
    setSelectedSceneItem(item);
    setShowSceneEditor(true);
  };

  const handleCloseSceneEditor = () => {
    setShowSceneEditor(false);
    setSelectedSceneItem(null);
  };

  const handleGenerateScript = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/storyboard/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, genre, targetDuration: duration }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScriptText(data.script);
      setScriptDirty(true);
      setShowAiInput(false);
      await updateScript({
        id: pid,
        script: data.script,
        scenes: data.scenes,
        isAIGenerated: true,
        aiModel: "gpt-4o (Kie AI)",
      });
      setScriptDirty(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBuildStoryboard = async () => {
    const src = scriptDirty ? scriptText : scriptFromDb;
    if (!src.trim()) return;
    setIsBuilding(true);
    try {
      const scenes = parseScriptScenes(src);
      if (scenes.length === 0) return;
      await createBatch({
        projectId: pid,
        items: scenes.map((s, i) => ({
          sceneId: s.id,
          order: i,
          title: s.title,
          description: s.content.substring(0, 300),
          duration: 5,
          generatedBy: user?.id ?? "unknown",
          generationStatus: "none",
        })),
      });
      if (scriptDirty) {
        await updateScript({ id: pid, script: src, scenes, isAIGenerated: false });
        setScriptDirty(false);
      }
      setTab("storyboard");
    } finally {
      setIsBuilding(false);
    }
  };

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0d12]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/storyboard-studio")}
            className="p-1.5 rounded-lg hover:bg-white/8 transition text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold">{project.name}</h1>
            <p className="text-[11px] text-gray-500 capitalize">{project.status} · {project.settings.frameRatio}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
            {(["script", "storyboard"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition
                  ${tab === t ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {t === "script" ? <FileText className="w-3.5 h-3.5" /> : <Grid3x3 className="w-3.5 h-3.5" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "script" && (
            <>
              <button onClick={() => setShowAiInput(!showAiInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition">
                <Sparkles className="w-3.5 h-3.5" />
                AI Script
              </button>
              <button onClick={handleSaveScript} disabled={!scriptDirty}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/12 text-white text-xs font-medium rounded-lg transition disabled:opacity-40">
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              <button onClick={handleBuildStoryboard} disabled={isBuilding || !displayScript.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
                {isBuilding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Build Storyboard
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Prompt Bar */}
      {tab === "script" && showAiInput && (
        <div className="flex items-center gap-3 px-4 py-3 bg-purple-950/40 border-b border-purple-500/20 shrink-0">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateScript()}
            placeholder="Describe your story idea… e.g. 'A thriller about a hacker who discovers government secrets'"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <select value={genre} onChange={(e) => setGenre(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1.5 outline-none">
              {["drama", "comedy", "thriller", "horror", "romance", "action", "documentary"].map((g) => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1.5 outline-none">
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={90}>90s</option>
            </select>
            <button onClick={handleGenerateScript} disabled={isGenerating || !aiPrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* ── Script Tab ── */}
        {tab === "script" && (
          <div className="flex h-full">
            <textarea
              value={displayScript}
              onChange={(e) => handleScriptChange(e.target.value)}
              placeholder={`Write your script here...\n\nTip: Format scenes as:\nSCENE 1: Title - Location\n[Scene description]\n\nOr use AI to generate a script automatically.`}
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 p-6 outline-none resize-none font-mono leading-relaxed"
            />
            {/* Scene preview panel */}
            {parseScriptScenes(displayScript).length > 0 && (
              <div className="w-64 border-l border-white/8 overflow-y-auto p-3 shrink-0">
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">
                  {parseScriptScenes(displayScript).length} Scenes
                </p>
                {parseScriptScenes(displayScript).map((s, i) => (
                  <div key={s.id} className="mb-2 p-2.5 rounded-lg bg-white/4 border border-white/6">
                    <p className="text-[11px] text-gray-400 mb-0.5">Scene {i + 1}</p>
                    <p className="text-xs text-white font-medium truncate">{s.title}</p>
                    {s.characters.length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{s.characters.slice(0, 3).join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Storyboard Tab ── */}
        {tab === "storyboard" && (
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
            {!items || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Grid3x3 className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-400 font-medium mb-2">No frames yet</p>
                <p className="text-gray-600 text-sm mb-6">Write a script and click "Build Storyboard" to create frames</p>
                <button onClick={() => setTab("script")}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition">
                  <FileText className="w-4 h-4" />
                  Go to Script
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-gray-300">{items.length} Frames</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowImagePanel(!showImagePanel); setShowVideoPanel(false); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                        showImagePanel ? "bg-purple-600 text-white" : "bg-white/8 hover:bg-white/12 text-gray-300"
                      }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Images
                    </button>
                    <button onClick={() => { setShowVideoPanel(!showVideoPanel); setShowImagePanel(false); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                        showVideoPanel ? "bg-blue-600 text-white" : "bg-white/8 hover:bg-white/12 text-gray-300"
                      }`}>
                      <Play className="w-3.5 h-3.5" />
                      AI Video
                    </button>
                    <button onClick={() => setShowFileBrowser(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/12 text-xs text-gray-300 rounded-lg transition">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Files
                    </button>
                    <button onClick={() => setShowElementLibrary(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/12 text-xs text-gray-300 rounded-lg transition">
                      <Users className="w-3.5 h-3.5" />
                      Elements
                    </button>
                    <button onClick={() => setShowExportModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/70 hover:bg-emerald-700 text-xs text-white rounded-lg transition">
                      Export
                    </button>
                  </div>
                </div>
                <div className={`grid gap-4 ${project.settings.frameRatio === "9:16"
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
                  {items.map((item, i) => (
                    <FrameCard
                      key={item._id}
                      item={item}
                      index={i}
                      frameRatio={project.settings.frameRatio}
                      selected={selectedItemIds.includes(item._id)}
                      projectId={pid}
                      onSelect={() => setSelectedItemIds((prev) =>
                        prev.includes(item._id)
                          ? prev.filter((id) => id !== item._id)
                          : [...prev, item._id]
                      )}
                      onDelete={() => removeItem({ id: item._id })}
                      onImageUploaded={(id, url) => updateItem({ id: id as Id<"storyboard_items">, imageUrl: url, generationStatus: "completed" })}
                      onDoubleClick={() => handleOpenSceneEditor(item)}
                      onDuplicate={() => duplicateItem(item)}
                      onTagsChange={(newTags) => handleTagsChange(item._id, newTags)}
                      userId={user?.id ?? "unknown"}
                    />
                  ))}
                  {/* Add frame button */}
                  <button
                    disabled={isAddingFrame}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 hover:bg-white/3 transition text-gray-600 hover:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ aspectRatio: project.settings.frameRatio === "9:16" ? "9/16" : project.settings.frameRatio === "1:1" ? "1/1" : "16/9" }}
                    onClick={async () => {
                      if (isAddingFrame) return;
                      setIsAddingFrame(true);
                      try {
                        await createItem({
                          projectId: pid,
                          sceneId: `manual-${Date.now()}`,
                          order: (items?.length ?? 0),
                          title: `Frame ${(items?.length ?? 0) + 1}`,
                          duration: 3,
                          generatedBy: "manual",
                        });
                      } finally { setIsAddingFrame(false); }
                    }}>
                    {isAddingFrame
                      ? <Loader2 className="w-6 h-6 mb-1 animate-spin" />
                      : <Plus className="w-6 h-6 mb-1" />}
                    <span className="text-xs">{isAddingFrame ? "Adding…" : "Add Frame"}</span>
                  </button>
                </div>
              </>
            )}
            </div>
            {showImagePanel && items && items.length > 0 && (
              <div className="w-72 shrink-0">
                <ImageAIPanel
                  projectId={pid}
                  items={items}
                  selectedItemIds={selectedItemIds}
                  frameRatio={project.settings.frameRatio}
                  projectStyle={project.settings.style}
                  userId={user?.id ?? "unknown"}
                  orgId={project.orgId}
                  onClose={() => setShowImagePanel(false)}
                  characterRef={characterRef}
                />
              </div>
            )}
            {showVideoPanel && items && items.length > 0 && (
              <div className="w-72 shrink-0">
                <VideoAIPanel
                  projectId={pid}
                  items={items}
                  selectedItemIds={selectedItemIds}
                  frameRatio={project.settings.frameRatio}
                  userId={user?.id ?? "unknown"}
                  orgId={project.orgId}
                  onClose={() => setShowVideoPanel(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {showElementLibrary && (
        <ElementLibrary
          projectId={pid}
          userId={user?.id ?? "unknown"}
          onClose={() => setShowElementLibrary(false)}
          onSelectElement={(urls, name) => {
            setCharacterRef({ name, urls });
            setShowElementLibrary(false);
            setShowImagePanel(true);
          }}
        />
      )}
      {showFileBrowser && (
        <FileBrowser
          projectId={pid}
          onClose={() => setShowFileBrowser(false)}
        />
      )}
      {showExportModal && items && project && (
        <WorkspaceExportModal
          projectName={project.name}
          script={project.script ?? ""}
          items={items}
          frameRatio={project.settings.frameRatio}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showSceneEditor && selectedSceneItem && (
        <SceneEditor
          shots={[
            {
              id: selectedSceneItem._id,
              scene: 1,
              shot: Number(selectedSceneItem.order ?? 1),
              title: selectedSceneItem.title,
              description: selectedSceneItem.description || "",
              ert: "",
              shotSize: "",
              perspective: "",
              movement: "",
              equipment: "",
              focalLength: "",
              imageUrl: selectedSceneItem.imageUrl,
              videoUrl: selectedSceneItem.videoUrl,
              duration: selectedSceneItem.duration,
              aspectRatio: project.settings.frameRatio,
              order: selectedSceneItem.order,
              dialogue: [],
              cast: [],
              voiceOver: "",
              action: "",
              bgDescription: selectedSceneItem.description || "",
              characters: [],
              location: "",
              notes: "",
              mood: "",
              lighting: "",
              camera: [],
              sound: [],
              props: [],
              wardrobe: [],
              makeup: [],
              editing: "",
              vfx: "",
              colorGrade: "",
              music: "",
              sfx: [],
              transition: "",
              specialInstructions: "",
              comments: [],
              tags: [],
            } as Shot
          ]}
          initialShotId={selectedSceneItem._id}
          onClose={handleCloseSceneEditor}
          onShotsChange={(shots) => {
            // Update the item if needed
            console.log("Scene updated:", shots);
          }}
        />
      )}
    </div>
  );
}

// ── Frame Card ────────────────────────────────────────────────────────────────
interface FrameCardProps {
  item: { _id: string; title: string; description?: string; imageUrl?: string; videoUrl?: string; duration: number; generationStatus: string; order: number; tags?: Array<{ id: string; name: string; color: string }> };
  index: number;
  frameRatio: string;
  selected: boolean;
  projectId: string;
  onSelect: () => void;
  onDelete: () => void;
  onImageUploaded: (id: string, url: string) => void;
  onDoubleClick: () => void;
  onDuplicate: () => void;
  onTagsChange: (tags: Array<{ id: string; name: string; color: string }>) => void;
  userId: string;
}

function FrameCard({ item, index, frameRatio, selected, projectId, onSelect, onDelete, onImageUploaded, onDoubleClick, onDuplicate, onTagsChange, userId }: FrameCardProps) {
  const [uploading, setUploading] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const logFile = useMutation(api.storyboard.storyboardFiles.logFile);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r2Key = `project-${projectId}/uploads/${item._id}-${Date.now()}-${file.name}`;
      const sigRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: r2Key, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await sigRes.json();
      // Debug: Log the upload URL for manual testing
      console.log("[Upload Debug] Upload URL:", uploadUrl);
      console.log("[Upload Debug] File type:", file.type);
      console.log("[Upload Debug] File size:", file.size);

      const uploadResponse = await fetch(uploadUrl, { 
        method: "PUT", 
        body: file, 
        headers: { "Content-Type": file.type },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("[R2 Upload Error]", uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }
      
      console.log("[R2 Upload Success]", uploadUrl);
      onImageUploaded(item._id, publicUrl);
      await logFile({
        projectId: projectId as Id<"storyboard_projects">,
        r2Key,
        filename: file.name,
        fileType: file.type.startsWith("video") ? "video" : "image",
        mimeType: file.type,
        size: file.size,
        category: "uploads",
        tags: [],
        uploadedBy: userId,
        status: "ready",
      });
    } catch (err) {
      console.error("[FrameCard upload]", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  const ratio = frameRatio === "9:16" ? "9/16" : frameRatio === "1:1" ? "1/1" : "16/9";
  
  // Format duration display
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div onClick={onSelect} onDoubleClick={onDoubleClick}
      className={`relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm
        ${selected 
          ? "border-purple-400/50 ring-2 ring-purple-400/20 shadow-purple-400/10" 
          : "border-white/5 hover:border-white/10 hover:shadow-md"}`}>
      {/* Media area */}
      <div className="bg-[#0f0f14]" style={{ aspectRatio: ratio }}>
        {item.videoUrl ? (
          <>
            <video src={item.videoUrl} className="w-full h-full object-cover" />
            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-black/20" />
          </>
        ) : item.imageUrl ? (
          <>
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">No media</span>
            <label className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 rounded-lg cursor-pointer transition-all duration-200">
              {uploading
                ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                : <Upload className="w-4 h-4 text-gray-400" />}
              <span className="text-xs text-gray-400">Upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        )}
        
        {/* Top overlay with refined badges */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-3">
          <div className="flex items-center justify-between">
            {/* Frame number */}
            <div className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
              <span className="text-xs text-white font-medium tracking-wide">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            
            {/* Duration */}
            <div className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-xs text-gray-200 font-medium">{formatDuration(item.duration)}</span>
            </div>
          </div>
        </div>
        
        {/* Generation status overlays */}
        {item.generationStatus === "generating" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
            <span className="text-sm text-purple-300 font-medium">Generating…</span>
          </div>
        )}
        {item.generationStatus === "failed" && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <div className="bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-xs text-white font-medium">Failed</span>
            </div>
          </div>
        )}
        
        {/* Video indicator */}
        {item.videoUrl && item.generationStatus !== "generating" && (
          <div className="absolute bottom-3 left-3 bg-blue-600/80 backdrop-blur-sm rounded-full px-2.5 py-1 border border-blue-500/30">
            <span className="text-xs text-white font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Video
            </span>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {/* Duplicate button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
          >
            <div className="w-8 h-8 bg-gray-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
              <Copy className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          
          {/* Delete button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
          >
            <div className="w-8 h-8 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>
      </div>
      
      {/* Enhanced info section */}
      <div className="p-4 bg-[#0a0a0f] border-t border-white/5">
        <p className="text-sm text-white font-medium mb-2">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
        )}
        
        {/* Tags section */}
        <div 
          className="flex flex-wrap gap-1.5 items-center cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); setShowTagEditor(true); }}
        >
          {item.tags && item.tags.length > 0 ? (
            <>
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: tag.color + '25', 
                    color: tag.color,
                    border: `1px solid ${tag.color}30`
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50 text-gray-400 font-medium border border-gray-600/30">
                  +{item.tags.length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              + Add tags
            </span>
          )}
          <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </span>
        </div>
      </div>
      
      {/* Tag Editor Modal */}
      {showTagEditor && (
        <TagEditor
          selectedTags={item.tags || []}
          onTagsChange={onTagsChange}
          onClose={() => setShowTagEditor(false)}
        />
      )}
    </div>
  );
}
