"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import PricingManagementDark from "./PricingManagementDark";

interface PricingManagementPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function PricingManagementPage({ sidebarOpen, onToggleSidebar }: PricingManagementPageProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary) bg-(--bg-secondary) shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-(--text-secondary) transition hover:text-(--text-primary) md:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Pricing Management</h1>
            <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-(--bg-tertiary) border border-(--border-primary) rounded-xl text-sm text-(--text-secondary) hover:bg-(--bg-primary) hover:text-(--text-primary) transition-all duration-200">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Settings */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-(--bg-tertiary) border border-(--border-primary) rounded-xl text-sm text-(--text-secondary) hover:bg-(--bg-primary) hover:text-(--text-primary) transition-all duration-200">
            <Settings className="w-4 h-4" />
          </button>

          {/* User Button */}
          <div className="hidden items-center self-end md:flex lg:self-auto">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-(--bg-secondary) border border-(--border-primary) shadow-xl",
                  userButtonPopoverActionButton: "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "border-t border-(--border-primary)",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>

          {/* Mobile menu */}
          <div className="flex items-center md:hidden">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-(--bg-secondary) border border-(--border-primary) shadow-xl",
                  userButtonPopoverActionButton: "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "border-t border-(--border-primary)",
                },
              }}
              afterSignOutUrl="/"
            />
            <button className="text-(--text-secondary) transition hover:text-(--text-primary) ml-2">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - No overflow wrapper to let PricingManagementDark handle its own scrolling */}
      <div className="flex-1 min-h-0">
        <PricingManagementDark />
      </div>
    </div>
  );
}
