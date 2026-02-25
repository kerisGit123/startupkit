"use client";

import { X, User, Mountain, Grid, FileText, Crop } from "lucide-react";

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption?: (option: string) => void;
}

export function AIGenerationModal({ isOpen, onClose, onSelectOption }: AIGenerationModalProps) {
  if (!isOpen) return null;

  // Check if we have rectangle mask data
  const maskData = typeof window !== 'undefined' ? sessionStorage.getItem('kieRectangleMask') : null;
  const hasRectangleMask = !!maskData;
  
  let rectangleMaskData: { image: string; rectangle: { x: number; y: number; width: number; height: number }; prompt: string; model: string } | null = null;
  if (hasRectangleMask) {
    try {
      rectangleMaskData = JSON.parse(maskData);
    } catch (e) {
      console.error('Failed to parse rectangle mask data:', e);
    }
  }

  const options = [
    ...(hasRectangleMask && rectangleMaskData ? [{
      id: "rectangle-mask",
      icon: Crop,
      title: "Edit Rectangle Mask",
      description: "Generate closer look of selected area from different angles",
      color: "from-emerald-500 to-emerald-600",
      badge: "Rectangle: " + Math.round(rectangleMaskData.rectangle.width) + "×" + Math.round(rectangleMaskData.rectangle.height)
    }] : []),
    {
      id: "character",
      icon: User,
      title: "Generate Character",
      description: "Create AI-generated character designs and profiles",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "scene",
      icon: Mountain,
      title: "Generate Scene",
      description: "Create background scenes and environments",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "panel",
      icon: Grid,
      title: "Generate Panel",
      description: "Generate individual manga panels from descriptions",
      color: "from-pink-500 to-pink-600"
    },
    {
      id: "page",
      icon: FileText,
      title: "Compose Page",
      description: "Arrange panels into complete manga pages",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#1a1a24] rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <i className="fas fa-wand-magic-sparkles text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Generation</h2>
              <p className="text-sm text-gray-400">Choose what to generate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => {
                  onSelectOption?.(option.id);
                  onClose();
                }}
                className="bg-[#25252f] hover:bg-[#2a2a35] rounded-xl p-6 text-left transition-all border border-white/5 hover:border-white/10 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{option.title}</h3>
                  {option.badge && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                      {option.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
