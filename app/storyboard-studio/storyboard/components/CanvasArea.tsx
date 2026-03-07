"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Paintbrush } from "lucide-react";
import {
  CanvasEditor,
  type CanvasEditorState,
  type CanvasActiveTool,
} from "../../shared/CanvasEditor";

// ── Types ─────────────────────────────────────────────────────────────
interface CanvasAreaProps {
  // Navigation
  activeIdx: number;
  shots: any[];
  goPrev: () => void;
  goNext: () => void;
  
  // Canvas Editor Props
  panelId: string;
  backgroundImage?: string;
  activeShot: any;
  canvasActiveTool: CanvasActiveTool;
  canvasState: CanvasEditorState;
  setCanvasState: (state: CanvasEditorState) => void;
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  generateImageWithElements?: () => void;
  
  // Brush Props
  maskBrushSize: number;
  isEraser: boolean;
  maskOpacity: number;
  hideBrushMask: boolean;
  setHideBrushMask: (value: boolean) => void;
  
  // Canvas Selection
  hiddenIds: Set<string>;
  setCanvasSelection: (selection: any) => void;
  canvasSelection: any;
  
  // Tool Selection
  onToolSelect?: (tool: CanvasActiveTool) => void;
  
  // Rectangle Props
  rectangle: { x: number; y: number; width: number; height: number } | null;
  setRectangle: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  imageIsRectangleVisible: boolean;
  canvasTool: CanvasActiveTool;
  isAspectRatioAnimating: boolean;
  isSquareMode: boolean;
  
  // Crop Props
  selectedAspectRatio?: string;
  onCropExecute?: (aspectRatio: string) => void;
  cropImageToRectangle?: (
    base64Image: string,
    rectangle: { x: number; y: number; width: number; height: number },
    canvasDisplaySize?: { width: number; height: number }
  ) => Promise<string>;
  onShotsChange?: (shots: any[]) => void;
  activeShotId?: string;
  runCrop?: () => void;
  onImageLoad?: (scale: number) => void;
  
  // Color Props
  selectedColor?: string;
  onColorPickerClick?: () => void;
  onDeleteSelected?: () => void;
  
  // AI Edit Mode
  mode?: "describe" | "area-edit" | "annotate";
  
  // Video AI Props
  activeAIPanel?: 'image' | 'video';
  videoState?: any;
  onVideoClick?: (videoUrl: string) => void;
  
  // Original Image Props
  onSetOriginalImage?: (imageUrl: string) => void;
}

// ── CanvasArea Component ─────────────────────────────────────────────────────
export function CanvasArea({
  activeIdx,
  shots,
  goPrev,
  goNext,
  panelId,
  backgroundImage,
  activeShot,
  canvasActiveTool,
  canvasState,
  setCanvasState,
  canvasContainerRef,
  generateImageWithElements,
  maskBrushSize,
  isEraser,
  maskOpacity,
  hideBrushMask,
  setHideBrushMask,
  hiddenIds,
  setCanvasSelection,
  activeAIPanel,
  videoState,
  onVideoClick,
  canvasSelection,
  onToolSelect,
  rectangle,
  setRectangle,
  imageIsRectangleVisible,
  canvasTool,
  isAspectRatioAnimating,
  isSquareMode,
  selectedAspectRatio,
  onCropExecute,
  cropImageToRectangle,
  onShotsChange,
  activeShotId,
  runCrop,
  onImageLoad,
  selectedColor,
  onColorPickerClick,
  onDeleteSelected,
  mode,
  onSetOriginalImage,
}: CanvasAreaProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Navigation Arrows - Mobile Friendly */}
      <button
        onClick={goPrev}
        disabled={activeIdx === 0}
        className="absolute left-[70px] top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition disabled:opacity-20 backdrop-blur-sm"
        aria-label="Previous shot"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
      
      <button
        onClick={goNext}
        disabled={activeIdx === shots.length - 1}
        className="absolute right-[70px] top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition disabled:opacity-20 backdrop-blur-sm"
        aria-label="Next shot"
      >
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>

      {/* Canvas Container — no data-canvas-editor here; the inner CanvasEditor div carries that attribute */}
      <div 
        ref={canvasContainerRef} 
        className="flex-1 overflow-hidden bg-[#0d0d12] relative"
      >
        {/* Video AI Canvas - LTX Studio Inspired */}
        {activeAIPanel === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {videoState?.status === 'empty' && (
              <div className="flex flex-col items-center justify-center text-gray-600">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm">Generate video to preview</p>
              </div>
            )}
            
            {videoState?.status === 'processing' && (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <div className="w-12 h-12 mb-4 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-sm mb-2">Generating video...</p>
                <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${videoState?.processingProgress || 0}%` }}
                  />
                </div>
              </div>
            )}
            
            {videoState?.status === 'ready' && videoState?.content && (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  src={videoState.content.videoUrl}
                  poster={videoState.content.thumbnailUrl}
                  controls
                  loop
                  autoPlay
                  muted
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={onVideoClick}
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Image AI Canvas - Default CanvasEditor */}
        {activeAIPanel === 'image' && (
          <CanvasEditor
          panelId={panelId}
          imageUrl={backgroundImage || activeShot?.imageUrl}
          activeTool={canvasActiveTool}
          state={canvasState}
          onStateChange={setCanvasState}
          // Pass brush props for all inpaint models
          brushSize={maskBrushSize}
          isEraser={isEraser}
          maskOpacity={maskOpacity}
          hideMask={hideBrushMask}
          hiddenObjectIds={hiddenIds}
          onSelectionChange={setCanvasSelection}
          selection={canvasSelection}
          aspectRatio={activeShot?.aspectRatio || "16:9"}
          rectangle={rectangle}
          onRectangleChange={setRectangle}
          rectangleVisible={imageIsRectangleVisible}
          canvasTool={canvasTool}
          isAspectRatioAnimating={isAspectRatioAnimating}
          isSquareMode={isSquareMode}
          onToolSelect={onToolSelect}
          generateImageWithElements={generateImageWithElements}
          onCropClick={runCrop}
          onImageLoad={onImageLoad}
          selectedColor={selectedColor}
          onColorPickerClick={onColorPickerClick}
          onDeleteSelected={onDeleteSelected}
          mode={mode}
          onSetOriginalImage={onSetOriginalImage}
          resetAllTransformations={() => {
            // Reset all transformations for all objects
            setCanvasState((prev) => {
              const newState = { ...prev };
              newState.bubbles = prev.bubbles.map(b => ({ ...b, rotation: 0, flipX: false, flipY: false }));
              newState.textElements = prev.textElements.map(t => ({ ...t, rotation: 0, flipX: false, flipY: false }));
              newState.assetElements = prev.assetElements.map(a => ({ ...a, rotation: 0, flipX: false, flipY: false }));
              return newState;
            });
          }}
        />
        )}
      </div>
    </div>
  );
}
