"use client";

import React from "react";
import { X } from "lucide-react";

// Types
interface GeneratedImageMetadata {
  timestamp: Date;
  model: string;
  prompt?: string;
  parameters?: Record<string, any>;
  generationTime: number;
  progress?: number;
  stage?: string;
  estimatedTime?: number;
  error?: string;
}

interface GeneratedImageCard {
  id: string;
  url: string;
  thumbnail: string;
  metadata: GeneratedImageMetadata;
  status: 'processing' | 'completed' | 'error';
  isFavorite: boolean;
}

interface ComparisonViewProps {
  images: GeneratedImageCard[];
  onClose: () => void;
}

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function ComparisonView({ images, onClose }: ComparisonViewProps) {
  if (images.length !== 2) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-(--bg-secondary) rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border-primary)">
          <h3 className="text-white font-medium">Image Comparison</h3>
          <button onClick={onClose} className="text-(--text-secondary) hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Comparison Content */}
        <div className="grid grid-cols-2 gap-4 p-4">
          {images.map((image, index) => (
            <div key={image.id} className="space-y-2">
              <div className="text-white text-sm font-medium">
                {index === 0 ? 'Before' : 'After'}
              </div>
              <div className="relative aspect-video bg-(--bg-primary) rounded-lg overflow-hidden">
                <img 
                  src={image.url} 
                  alt="" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="text-(--text-secondary) text-xs space-y-1">
                <div>Model: {image.metadata.model}</div>
                <div>Time: {formatRelativeTime(image.metadata.timestamp)}</div>
                {image.metadata.generationTime && (
                  <div>Generation: {image.metadata.generationTime}s</div>
                )}
                {image.metadata.prompt && (
                  <div className="text-(--text-secondary) text-xs mt-2 italic">
                    "{image.metadata.prompt}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
