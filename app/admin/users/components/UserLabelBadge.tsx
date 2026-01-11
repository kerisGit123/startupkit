"use client";

interface UserLabelBadgeProps {
  label?: string;
  editable?: boolean;
  onLabelChange?: (newLabel: string) => void;
}

const labelColors: Record<string, string> = {
  "VIP": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Premium": "bg-purple-100 text-purple-800 border-purple-300",
  "Enterprise": "bg-blue-100 text-blue-800 border-blue-300",
  "Beta Tester": "bg-green-100 text-green-800 border-green-300",
  "At Risk": "bg-orange-100 text-orange-800 border-orange-300",
  "Blocked": "bg-red-100 text-red-800 border-red-300",
  "Trial": "bg-gray-100 text-gray-800 border-gray-300",
  "Support Priority": "bg-pink-100 text-pink-800 border-pink-300",
};

export function UserLabelBadge({ label, editable, onLabelChange }: UserLabelBadgeProps) {
  if (!label) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
        No Label
      </span>
    );
  }

  const colorClass = labelColors[label] || "bg-gray-100 text-gray-800 border-gray-300";
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

export const USER_LABELS = [
  "VIP",
  "Premium",
  "Enterprise",
  "Beta Tester",
  "At Risk",
  "Blocked",
  "Trial",
  "Support Priority",
];
