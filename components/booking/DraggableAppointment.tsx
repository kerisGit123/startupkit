"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableAppointmentProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function DraggableAppointment({ 
  id, 
  children, 
  style, 
  className,
  onClick 
}: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const dragStyle = {
    ...style,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`${className} group/apt`}
      onClick={onClick}
    >
      {/* Drag Handle - only this area triggers drag */}
      <div
        className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors cursor-grab active:cursor-grabbing z-20 rounded-l"
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3 text-white/90" />
      </div>
      
      {/* Content - clickable for editing */}
      <div className="pl-7">
        {children}
      </div>
    </div>
  );
}
