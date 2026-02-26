"use client";

import { useState, useRef } from "react";
import { Plus, X, Upload } from "lucide-react";

interface ReferenceImagesCardProps {
  referenceImages: string[];
  onAddImages: (images: string[]) => void;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
}

export function ReferenceImagesCard({ 
  referenceImages, 
  onAddImages, 
  onRemoveImage, 
  maxImages = 8 
}: ReferenceImagesCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [];
    const remainingSlots = maxImages - referenceImages.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newImages.push(result);
          
          // When all files are processed, add them to parent
          if (newImages.length === filesToProcess) {
            onAddImages(newImages);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddImages = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const renderSlot = (index: number) => {
    const hasImage = index < referenceImages.length;
    const imageUrl = referenceImages[index];

    if (hasImage) {
      return (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={`Reference ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            onClick={() => onRemoveImage(index)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center text-gray-400">
        <span className="text-xs font-medium">Ref {index + 1}</span>
      </div>
    );
  };

  return (
    <div className="bg-[#1a1a24] rounded-xl border border-white/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Reference Images</h3>
        <div className="text-xs text-gray-400">
          {referenceImages.length}/{maxImages}
        </div>
      </div>

      {/* Add Images Button */}
      <button
        onClick={handleAddImages}
        disabled={referenceImages.length >= maxImages}
        className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
      >
        <Plus className="w-4 h-4" />
        Add Images
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Image Slots Grid */}
      <div
        className={`grid grid-cols-3 gap-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
          isDragging 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-white/20 bg-white/5'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {Array.from({ length: Math.min(maxImages, 6) }, (_, index) => (
          <div
            key={index}
            className="aspect-square border border-white/10 rounded-lg overflow-hidden bg-[#25252f]"
          >
            {renderSlot(index)}
          </div>
        ))}
      </div>

      {/* Instructions */}
      {referenceImages.length === 0 && (
        <div className="text-center py-4">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">
            Drag & drop images here or click "Add Images"
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Character, props, tools, or location references
          </p>
        </div>
      )}

      {/* Model Support Info */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400">
          <strong>Multi-Reference Models:</strong>
        </p>
        <p className="text-xs text-blue-300 mt-1">
          • Flux 2: Up to 8 references<br/>
          • Seedream 4.5: Up to 10 references
        </p>
      </div>
    </div>
  );
}
