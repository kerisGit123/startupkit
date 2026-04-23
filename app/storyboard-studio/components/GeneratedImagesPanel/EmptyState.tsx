"use client";

import React from "react";
import { Image } from "lucide-react";

interface EmptyStateProps {
  onStartGeneration: () => void;
}

export function EmptyState({ onStartGeneration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-(--bg-secondary) rounded-full flex items-center justify-center mb-4">
        <Image className="w-8 h-8 text-(--text-secondary)" />
      </div>
      
      <h3 className="text-white font-medium mb-2">No Generated Images Yet</h3>
      
      <p className="text-(--text-secondary) text-sm mb-6">
        Start creating images using the AI generation tools. Your generated images will appear here for easy access and comparison.
      </p>
      
      <div className="space-y-2">
        <button
          onClick={onStartGeneration}
          className="px-4 py-2 bg-(--accent-blue) text-white rounded-lg hover:bg-(--accent-blue)/80 transition"
        >
          Start Generating
        </button>
        
        <div className="text-(--text-secondary) text-xs space-y-1">
          <div>💡 Tip: Try text-to-image for creative concepts</div>
          <div>🎨 Use image-to-image to modify existing images</div>
          <div>✂️ Inpaint for precise edits and adjustments</div>
        </div>
      </div>
    </div>
  );
}
