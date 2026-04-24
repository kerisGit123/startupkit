"use client";

import React, { useState, useMemo } from "react";
import { Plus, Upload, FolderOpen, FileText, Camera, Sparkles, X, Film, Volume2 } from "lucide-react";

export interface GeneratedImageItem {
  id: string;
  url: string;
  filename: string;
}

export interface AddImageMenuProps {
  /** Trigger the native file input */
  onUploadClick: () => void;
  /** Open the R2 FileBrowser */
  onR2Click?: () => void;
  /** Whether R2 is available (projectId + companyId exist) */
  canOpenR2?: boolean;
  onR2Unavailable?: () => void;
  /** Open the Element Library */
  onElementsClick?: () => void;
  canOpenElements?: boolean;
  onElementsUnavailable?: () => void;
  /** Capture background from canvas */
  onCaptureClick?: () => void;
  /** Generated images scoped to current storyboard item */
  generatedItemImages?: GeneratedImageItem[];
  /** Generated images scoped to entire project */
  generatedProjectImages?: GeneratedImageItem[];
  onSelectGeneratedImage?: (url: string) => void;
  /** Label override (default: "Add Image") */
  label?: string;
  /** Media type — changes icon and colors (default: "image") */
  mediaType?: "image" | "video" | "audio";
}

export function AddImageMenu({
  onUploadClick,
  onR2Click,
  canOpenR2 = true,
  onR2Unavailable,
  onElementsClick,
  canOpenElements = true,
  onElementsUnavailable,
  onCaptureClick,
  generatedItemImages,
  generatedProjectImages,
  onSelectGeneratedImage,
  label,
  mediaType = "image",
}: AddImageMenuProps) {
  const resolvedLabel = label || (mediaType === "video" ? "Add Video" : mediaType === "audio" ? "Add Audio" : "Add Image");
  const IconComponent = mediaType === "video" ? Film : mediaType === "audio" ? Volume2 : Plus;
  const accentColor = mediaType === "video" ? "green" : mediaType === "audio" ? "purple" : "emerald";
  const [showMenu, setShowMenu] = useState(false);
  const [showGeneratedPicker, setShowGeneratedPicker] = useState(false);
  const [generatedScope, setGeneratedScope] = useState<"item" | "project">("item");

  const hasItemImages = (generatedItemImages?.length ?? 0) > 0;
  const hasProjectImages = (generatedProjectImages?.length ?? 0) > 0;
  const hasAnyGenerated = hasItemImages || hasProjectImages;

  const displayedImages = useMemo(() => {
    if (generatedScope === "item") {
      return generatedItemImages ?? [];
    }
    return generatedProjectImages ?? [];
  }, [generatedScope, generatedItemImages, generatedProjectImages]);

  return (
    <>
      <div className="relative">
        {/* Add Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1 group ${
            accentColor === "green" ? "border-green-500/30 hover:border-green-500/50"
            : accentColor === "purple" ? "border-purple-500/30 hover:border-purple-500/50"
            : "border-emerald-500/30 hover:border-emerald-500/50"
          }`}
          title={resolvedLabel}
        >
          <IconComponent className={`w-4 h-4 transition-colors ${
            accentColor === "green" ? "text-green-400 group-hover:text-green-300"
            : accentColor === "purple" ? "text-purple-400 group-hover:text-purple-300"
            : "text-emerald-400 group-hover:text-emerald-300"
          }`} />
          <span className={`text-[10px] transition-colors ${
            accentColor === "green" ? "text-green-400 group-hover:text-green-300"
            : accentColor === "purple" ? "text-purple-400 group-hover:text-purple-300"
            : "text-emerald-400 group-hover:text-emerald-300"
          }`}>{resolvedLabel}</span>
        </button>

        {/* Slide-out Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute top-0 left-full ml-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50">
              <div className="p-3">
                <div className="flex gap-2">
                  {/* Upload from computer */}
                  <button
                    onClick={() => {
                      onUploadClick();
                      setShowMenu(false);
                    }}
                    className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                    title="Upload from computer"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs">Upload</span>
                  </button>

                  {/* R2 File Browser */}
                  {onR2Click && (
                    <button
                      onClick={() => {
                        if (!canOpenR2) {
                          onR2Unavailable?.();
                          return;
                        }
                        onR2Click();
                        setShowMenu(false);
                      }}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                      title="Browse R2 files"
                    >
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-xs">R2</span>
                    </button>
                  )}

                  {/* Element Library */}
                  {onElementsClick && (
                    <button
                      onClick={() => {
                        if (!canOpenElements) {
                          onElementsUnavailable?.();
                          return;
                        }
                        onElementsClick();
                        setShowMenu(false);
                      }}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                      title="Browse elements"
                    >
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-xs">Elements</span>
                    </button>
                  )}

                  {/* Capture Background */}
                  {onCaptureClick && (
                    <button
                      onClick={() => {
                        onCaptureClick();
                        setShowMenu(false);
                      }}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                      title="Capture background"
                    >
                      <Camera className="w-4 h-4 text-orange-400" />
                      <span className="text-xs">Capture</span>
                    </button>
                  )}

                  {/* Generated Images */}
                  {hasAnyGenerated && onSelectGeneratedImage && (
                    <button
                      onClick={() => {
                        // Default to item if it has images, otherwise project
                        setGeneratedScope(hasItemImages ? "item" : "project");
                        setShowGeneratedPicker(true);
                        setShowMenu(false);
                      }}
                      className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                      title="Use generated image as reference"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs">Generated</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Generated Images Picker Dialog */}
      {showGeneratedPicker && hasAnyGenerated && onSelectGeneratedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl w-[520px] max-h-[560px] flex flex-col">
            {/* Header with scope toggle */}
            <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
              <h3 className="text-white font-medium text-sm">Select Generated Image</h3>
              <button onClick={() => setShowGeneratedPicker(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope Toggle */}
            <div className="flex gap-1 px-4 pt-3">
              <button
                onClick={() => setGeneratedScope("item")}
                disabled={!hasItemImages}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  generatedScope === "item"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : hasItemImages
                      ? "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                      : "text-gray-600 cursor-not-allowed border border-transparent"
                }`}
              >
                Current Frame ({generatedItemImages?.length ?? 0})
              </button>
              <button
                onClick={() => setGeneratedScope("project")}
                disabled={!hasProjectImages}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  generatedScope === "project"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : hasProjectImages
                      ? "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                      : "text-gray-600 cursor-not-allowed border border-transparent"
                }`}
              >
                All Project ({generatedProjectImages?.length ?? 0})
              </button>
            </div>

            {/* Image Grid */}
            <div className="p-4 overflow-y-auto flex-1">
              {displayedImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {displayedImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        onSelectGeneratedImage(img.url);
                        setShowGeneratedPicker(false);
                      }}
                      className="relative group rounded-lg overflow-hidden border border-[#3D3D3D] hover:border-emerald-500 transition-colors aspect-square"
                    >
                      <img src={img.url} alt={img.filename} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                        <span className="text-[10px] text-gray-300 truncate block">{img.filename}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                  No generated images in {generatedScope === "item" ? "this frame" : "this project"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
