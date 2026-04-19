"use client";

import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /** Danger styling (red text) */
  danger?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Hidden — don't render at all */
  hidden?: boolean;
  /** Render a divider above this item */
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  onClose: () => void;
  /** Fixed position (for right-click context menus) */
  position?: { top: number; left?: number; right?: number };
  /** Width class e.g. "w-52", "w-48" */
  width?: string;
  /** Extra className */
  className?: string;
}

export function ContextMenu({
  items,
  onClose,
  position,
  width = "w-52",
  className = "",
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const visibleItems = items.filter((item) => !item.hidden);

  const style: React.CSSProperties = position
    ? {
        position: "fixed",
        top: position.top,
        ...(position.right != null ? { right: position.right } : {}),
        ...(position.left != null ? { left: position.left } : {}),
      }
    : {};

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={ref}
        className={`${position ? "fixed" : "absolute"} bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[100] ${width} py-1.5 ${className}`}
        style={position ? style : undefined}
      >
        {visibleItems.map((item, i) => (
          <div key={i}>
            {item.divider && (
              <div className="border-t border-(--border-primary) my-1" />
            )}
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition ${
                item.danger
                  ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  : item.disabled
                    ? "text-[#6E6E6E] cursor-not-allowed"
                    : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-white"
              }`}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
