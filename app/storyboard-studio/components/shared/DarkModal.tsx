"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface DarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width class e.g. "max-w-lg", "max-w-2xl", "max-w-4xl" */
  maxWidth?: string;
  /** Show X close button in top-right corner */
  showCloseButton?: boolean;
  /** Overlay opacity: 50, 70, 80, 85 */
  overlayOpacity?: 50 | 70 | 80 | 85;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Extra className for the content container */
  className?: string;
  /** Whether to add default padding */
  noPadding?: boolean;
}

export function DarkModal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-lg",
  showCloseButton = true,
  overlayOpacity = 70,
  closeOnBackdrop = true,
  className = "",
  noPadding = false,
}: DarkModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const opacityMap = { 50: "bg-black/50", 70: "bg-black/70", 80: "bg-black/80", 85: "bg-black/85" };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${opacityMap[overlayOpacity]} backdrop-blur-sm`}>
      {/* Backdrop click */}
      {closeOnBackdrop && (
        <div className="absolute inset-0" onClick={onClose} />
      )}

      {/* Content */}
      <div
        className={`relative bg-(--bg-primary) border border-(--border-primary) rounded-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ${maxWidth} ${noPadding ? "" : "p-6"} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
