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
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import PricingManagementDark from "./PricingManagementDark";
import CreditBalanceDisplay from "./CreditBalanceDisplay";

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
            <OrgSwitcher
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-2 text-sm mr-3",
                  organizationSwitcherTriggerIcon: "w-4 h-4",
                  organizationSwitcherTriggerText: "font-medium text-white",
                  organizationPreviewText: "text-white",
                  organizationPreviewMainIdentifier: "text-white",
                },
              }}
              afterSelectOrganizationUrl="/storyboard-studio/admin/pricing"
              afterCreateOrganizationUrl="/storyboard-studio/admin/pricing"
            />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-(--bg-secondary) border border-(--border-primary) shadow-xl",
                  userButtonPopoverActionButton: "text-white hover:bg-white/5 hover:text-gray-200",
                  userButtonPopoverActionButtonText: "text-sm",
                  userButtonPopoverFooter: "border-t border-(--border-primary)",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>

          {/* Mobile menu */}
          <div className="flex items-center md:hidden">
            <OrgSwitcher
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger: "px-2 py-1.5 rounded-lg border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-1.5 text-xs",
                  organizationSwitcherTriggerIcon: "w-3.5 h-3.5",
                  organizationSwitcherTriggerText: "font-medium text-xs text-white",
                },
              }}
              afterSelectOrganizationUrl="/storyboard-studio/admin/pricing"
              afterCreateOrganizationUrl="/storyboard-studio/admin/pricing"
            />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "bg-(--bg-secondary) border border-(--border-primary) shadow-xl",
                  userButtonPopoverActionButton: "text-white hover:bg-white/5 hover:text-gray-200",
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
        
        {/* Credit Balance Section */}
        <div className="p-8 pt-0">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-(--text-primary) mb-2">Company Credit Balance</h3>
              <p className="text-(--text-tertiary) text-sm">Monitor your company's credit usage and balance</p>
            </div>
            <CreditBalanceDisplay className="max-w-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
