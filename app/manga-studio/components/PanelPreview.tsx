"use client";

import { useState } from "react";
import { Move, RotateCw } from "lucide-react";

interface Character {
  id: string;
  name: string;
  x: number;
  y: number;
  scale: number;
}

interface PanelPreviewProps {
  panelId: number;
  characters: Character[];
  cameraAngle: string;
  onUpdateCharacter: (id: string, x: number, y: number) => void;
  onUpdateCameraAngle: (angle: string) => void;
}

export function PanelPreview({ 
  panelId, 
  characters, 
  cameraAngle, 
  onUpdateCharacter,
  onUpdateCameraAngle 
}: PanelPreviewProps) {
  const [draggedChar, setDraggedChar] = useState<string | null>(null);

  const cameraAngles = [
    { id: "eye-level", name: "Eye Level", desc: "Neutral perspective" },
    { id: "high-angle", name: "High Angle", desc: "Looking down" },
    { id: "low-angle", name: "Low Angle", desc: "Looking up" },
    { id: "birds-eye", name: "Bird's Eye", desc: "Top-down view" },
    { id: "dutch-angle", name: "Dutch Angle", desc: "Tilted frame" },
  ];

  const handleDragStart = (charId: string) => {
    setDraggedChar(charId);
  };

  const handleDragEnd = (e: React.DragEvent, charId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onUpdateCharacter(charId, x, y);
    setDraggedChar(null);
  };

  return (
    <div className="space-y-4">
      {/* Camera Angle Selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <RotateCw className="w-4 h-4 text-blue-400" />
          <label className="text-sm font-semibold text-white">Camera Angle</label>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {cameraAngles.map((angle) => (
            <button
              key={angle.id}
              onClick={() => onUpdateCameraAngle(angle.id)}
              className={`p-3 rounded-lg border-2 transition text-center ${
                cameraAngle === angle.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 bg-[#0f1117] hover:border-blue-500/30"
              }`}
            >
              <div className="text-xs font-semibold text-white mb-1">{angle.name}</div>
              <div className="text-[10px] text-gray-400">{angle.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Canvas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Move className="w-4 h-4 text-purple-400" />
          <label className="text-sm font-semibold text-white">Character Positioning</label>
          <span className="text-xs text-gray-400">(Drag to position)</span>
        </div>
        <div 
          className="relative w-full aspect-[9/16] bg-[#0a0a0f] rounded-lg border-2 border-white/10 overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/5"></div>
            ))}
          </div>

          {/* Characters */}
          {characters.map((char) => (
            <div
              key={char.id}
              draggable
              onDragStart={() => handleDragStart(char.id)}
              onDragEnd={(e) => handleDragEnd(e, char.id)}
              className="absolute cursor-move"
              style={{
                left: `${char.x}%`,
                top: `${char.y}%`,
                transform: `translate(-50%, -50%) scale(${char.scale})`,
              }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xl border-2 border-white shadow-lg">
                {char.name.charAt(0)}
              </div>
              <div className="text-xs text-white text-center mt-1 font-semibold bg-black/70 rounded px-2 py-1">
                {char.name}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {characters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Add characters to position them
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
