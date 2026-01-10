"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  onMenuClick: () => void;
  isSuperAdmin: boolean;
}

export default function AdminHeader({ onMenuClick, isSuperAdmin }: AdminHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-700 sticky top-0 z-[60]">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={onMenuClick}
            className="p-2.5 text-white hover:text-purple-200 hover:bg-purple-700 rounded-lg transition-colors border border-purple-600"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link href="/admin" className="text-lg lg:text-xl font-bold text-white">
            Admin Panel
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {isSuperAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-purple-700 hover:bg-purple-600 rounded-lg transition border border-purple-600"
              title="Go to User Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">User Dashboard</span>
            </Link>
          )}
          
          <button className="relative p-2 text-white hover:text-purple-200 hover:bg-purple-700 rounded-lg transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
