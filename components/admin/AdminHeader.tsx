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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-[60]">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link href="/admin" className="text-base lg:text-lg font-semibold text-gray-900">
            Admin Panel
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          {isSuperAdmin && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Go to User Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">User Dashboard</span>
            </Link>
          )}
          
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
