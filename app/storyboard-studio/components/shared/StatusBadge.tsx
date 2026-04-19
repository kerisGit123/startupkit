"use client";

type StatusVariant = "draft" | "in-progress" | "completed" | "on-hold" | "processing" | "error" | "success";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const VARIANT_MAP: Record<StatusVariant, string> = {
  "draft": "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400",
  "completed": "bg-green-500/20 text-green-400",
  "on-hold": "bg-gray-700/60 text-gray-300",
  "processing": "bg-yellow-500/20 text-yellow-400",
  "error": "bg-red-500/20 text-red-400",
  "success": "bg-green-500/20 text-green-400",
};

function normalizeStatus(status: string): StatusVariant {
  const s = status.toLowerCase().replace(/\s+/g, "-");
  if (s === "draft") return "draft";
  if (s === "in-progress" || s === "progress" || s === "active") return "in-progress";
  if (s === "completed" || s === "done") return "completed";
  if (s === "on-hold" || s === "hold") return "on-hold";
  if (s === "processing" || s === "pending") return "processing";
  if (s === "error" || s === "failed") return "error";
  if (s === "success") return "success";
  return "draft";
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const variant = normalizeStatus(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${VARIANT_MAP[variant]} ${className}`}>
      {status}
    </span>
  );
}
