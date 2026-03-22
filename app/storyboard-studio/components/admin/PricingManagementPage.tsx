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
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 bg-[#0d0d12] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-gray-500 transition hover:text-white md:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">Pricing Management</h1>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1a1a1f] border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Settings */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1a1a1f] border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition">
            <Settings className="w-4 h-4" />
          </button>

          {/* User Button */}
          <div className="hidden items-center self-end md:flex lg:self-auto">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-[#1a1a1f] border border-white/10 shadow-xl",
                  userButtonPopoverActionButton: "text-gray-300 hover:bg-white/5 hover:text-white",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "border-t border-white/10",
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
                  userButtonPopoverCard: "bg-[#1a1a1f] border border-white/10 shadow-xl",
                  userButtonPopoverActionButton: "text-gray-300 hover:bg-white/5 hover:text-white",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "border-t border-white/10",
                },
              }}
              afterSignOutUrl="/"
            />
            <button className="text-gray-500 transition hover:text-white ml-2">
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
