"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Paintbrush } from "lucide-react";
import {
  CanvasEditor,
  type CanvasEditorState,
  type CanvasActiveTool,
} from "../shared/CanvasEditor";

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
  generateImageWithElements?: () => Promise<string | null>;
  zoomLevel?: number;
  
  // Brush Props
  maskBrushSize: number;
  isEraser: boolean;
  maskOpacity?: number;
  showMask?: boolean;
  
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
  activeAIPanel?: 'editimage' | 'videoimage';
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
  zoomLevel = 100,
  canvasContainerRef,
  generateImageWithElements,
  maskBrushSize,
  isEraser,
  maskOpacity,
  showMask,
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
        {/* Default CanvasEditor - works for all panels with brush support */}
        <CanvasEditor
          panelId={panelId}
          imageUrl={backgroundImage ?? activeShot?.imageUrl}
          activeTool={canvasActiveTool}
          state={canvasState}
          onStateChange={setCanvasState}
          // Pass brush props for all inpaint models
          brushSize={maskBrushSize}
          isEraser={isEraser}
          maskOpacity={maskOpacity}
          showMask={showMask}
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
          zoomLevel={zoomLevel}
          resetAllTransformations={() => {
            setCanvasState({
              ...canvasState,
              bubbles: canvasState.bubbles.map(b => ({ ...b, rotation: 0, flipX: false, flipY: false })),
              textElements: canvasState.textElements.map(t => ({ ...t, rotation: 0, flipX: false, flipY: false })),
              assetElements: canvasState.assetElements.map(a => ({ ...a, rotation: 0, flipX: false, flipY: false })),
            });
          }}
        />
      </div>
    </div>
  );
}
