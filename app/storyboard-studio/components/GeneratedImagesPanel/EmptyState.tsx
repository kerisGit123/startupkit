"use client";

import React from "react";
import { Image } from "lucide-react";

interface EmptyStateProps {
  onStartGeneration: () => void;
}

export function EmptyState({ onStartGeneration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
        <Image className="w-8 h-8 text-[#6E6E6E]" />
      </div>
      
      <h3 className="text-white font-medium mb-2">No Generated Images Yet</h3>
      
      <p className="text-[#A0A0A0] text-sm mb-6">
        Start creating images using the AI generation tools. Your generated images will appear here for easy access and comparison.
      </p>
      
      <div className="space-y-2">
        <button
          onClick={onStartGeneration}
          className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition"
        >
          Start Generating
        </button>
        
        <div className="text-[#6E6E6E] text-xs space-y-1">
          <div>💡 Tip: Try text-to-image for creative concepts</div>
          <div>🎨 Use image-to-image to modify existing images</div>
          <div>✂️ Inpaint for precise edits and adjustments</div>
        </div>
      </div>
    </div>
  );
}
