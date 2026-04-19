"use client";

import { Loader2 } from "lucide-react";

type SpinnerSize = "xs" | "sm" | "md" | "lg";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** Show inline (with mr-2) for button usage */
  inline?: boolean;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function LoadingSpinner({ size = "sm", className = "", inline = false }: LoadingSpinnerProps) {
  return (
    <Loader2 className={`${SIZE_MAP[size]} animate-spin ${inline ? "inline mr-2" : ""} ${className}`} />
  );
}
