"use client";

import { forwardRef } from "react";

type InputSize = "xs" | "sm" | "md";

interface DarkInputBaseProps {
  /** Size variant */
  size?: InputSize;
  /** Focus ring color accent */
  accent?: "blue" | "orange" | "green";
  /** Extra className */
  className?: string;
}

interface DarkInputProps
  extends DarkInputBaseProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {}

interface DarkTextareaProps
  extends DarkInputBaseProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  rows?: number;
}

interface DarkSelectProps
  extends DarkInputBaseProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  children: React.ReactNode;
}

const SIZE_MAP: Record<InputSize, string> = {
  xs: "px-3 py-2 text-xs",
  sm: "px-3 py-2.5 text-sm",
  md: "px-4 py-3 text-sm",
};

const ACCENT_MAP = {
  blue: "focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20",
  orange: "focus:border-[#FAAD14]/50 focus:ring-1 focus:ring-[#FAAD14]/20",
  green: "focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20",
};

function baseClasses(size: InputSize, accent: "blue" | "orange" | "green", extra: string) {
  return `w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg text-white placeholder-[#6E6E6E] focus:outline-none ${SIZE_MAP[size]} ${ACCENT_MAP[accent]} ${extra}`;
}

export const DarkInput = forwardRef<HTMLInputElement, DarkInputProps>(
  ({ size = "sm", accent = "blue", className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={baseClasses(size, accent, className)}
      {...props}
    />
  ),
);
DarkInput.displayName = "DarkInput";

export const DarkTextarea = forwardRef<HTMLTextAreaElement, DarkTextareaProps>(
  ({ size = "sm", accent = "blue", className = "", rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={`${baseClasses(size, accent, className)} resize-none`}
      {...props}
    />
  ),
);
DarkTextarea.displayName = "DarkTextarea";

export const DarkSelect = forwardRef<HTMLSelectElement, DarkSelectProps>(
  ({ size = "sm", accent = "blue", className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`${baseClasses(size, accent, className)} appearance-none cursor-pointer hover:bg-[#2C2C2C] transition`}
      {...props}
    >
      {children}
    </select>
  ),
);
DarkSelect.displayName = "DarkSelect";
