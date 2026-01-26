"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableTimeSlotProps {
  id: string;
  date: string;
  time: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DroppableTimeSlot({ 
  id, 
  date, 
  time, 
  children, 
  className,
  onClick 
}: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { date, time },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "bg-blue-100 ring-2 ring-blue-500" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
