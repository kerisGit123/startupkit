"use client";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-sm",
  lg: "w-10 h-10 text-sm",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({ src, name, size = "md", className = "" }: UserAvatarProps) {
  const sizeClass = SIZE_MAP[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name || "User"}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-[#4A90E2] to-[#4A9E8E] flex items-center justify-center text-white font-bold ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
