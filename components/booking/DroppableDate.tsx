"use client";

import { useDroppable } from "@dnd-kit/core";

interface DroppableDateProps {
  id: string;
  date: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DroppableDate({ 
  id, 
  date, 
  children, 
  className,
  onClick 
}: DroppableDateProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { date },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
