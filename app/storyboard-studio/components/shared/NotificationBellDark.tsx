"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBellDark() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const allNotifications = useQuery(api.adminNotifications.getNotifications) || [];
  const unreadCount = useQuery(api.adminNotifications.getUnreadCount) || 0;
  const markAsRead = useMutation(api.adminNotifications.markAsRead);

  const notifications = allNotifications.slice(0, 8);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left,
    });
  }, []);

  // Auto-mark all unread as read 2s after opening the dropdown
  useEffect(() => {
    if (!open) return;
    const unread = allNotifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const timer = setTimeout(() => {
      unread.forEach(n => {
        markAsRead({ notificationId: n.id, type: n.type });
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [open]); // only trigger on open change, not on every notification update

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-white hover:text-gray-200 hover:bg-(--bg-tertiary) transition-all duration-200"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-72 bg-[#1a1a22] border border-[#2a2a35] rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translateY(-100%)",
            zIndex: 9999,
          }}
        >
          <div className="px-3 py-2.5 border-b border-[#2a2a35]">
            <span className="text-xs font-semibold text-white">Notifications</span>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-5 h-5 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2 px-3 py-2.5 border-b border-[#2a2a35] last:border-b-0 ${
                    n.read ? "opacity-50" : ""
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    {!n.read ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    ) : (
                      <div className="w-1.5 h-1.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-white truncate">{n.title}</span>
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">{formatTimeAgo(n.time)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{n.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
