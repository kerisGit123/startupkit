"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Settings, 
  HelpCircle,
  Users,
  BarChart3,
  Wallet,
  LogOut,
  Menu,
  X,
  Ticket,
  Bell,
  ShieldAlert,
  FileText,
  Search,
  Gift,
  ChevronRight,
  BookOpen,
  Sparkles
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoginTracker } from "@/components/LoginTracker";
import { ChatWidget } from "@/components/ChatWidget";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const tickets = useQuery(
    api.tickets.getUserTickets,
    user?.id ? {} : "skip"
  );
  
  // Check if user is blocked
  const currentUser = useQuery(
    api.adminUsers.getAllUsers,
    user?.id ? {} : "skip"
  );
  
  const userRecord = currentUser?.find(u => u.clerkUserId === user?.id);
  const isBlocked = userRecord?.isBlocked || false;
  
  useEffect(() => {
    if (isBlocked) {
      signOut();
      router.push("/blocked");
    }
  }, [isBlocked, signOut, router]);
  
  const openTicketsCount = tickets?.filter(t => t.status === "open").length || 0;

  const mainNav = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Manga Studio", href: "/manga-studio", icon: BookOpen },
    { name: "Script Breaker", href: "/manga-studio/script-breaker", icon: Sparkles },
    { name: "Episodes", href: "/manga-studio/episodes", icon: FileText },
    { name: "Playground", href: "/manga-studio/playground", icon: BarChart3 },
    { name: "Usage", href: "/dashboard/usage", icon: BarChart3 },
    { name: "Billing", href: "/dashboard/billing", icon: Wallet },
    { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  ];

  const accountNav = [
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Support", href: "/support", icon: Ticket },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname?.startsWith(href + "/"));

  // Show blocked message if user is blocked
  if (isBlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your account has been blocked by an administrator. Please contact support for assistance.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <LoginTracker />
      <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
        {/* Backdrop overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — Consist Style: white bg, emerald accent */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[240px] bg-white border-r border-gray-100 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Logo */}
          <div className="px-5 py-5 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-[15px] font-bold text-gray-900">StartupKit</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Main</p>
            <div className="space-y-0.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[13px] group ${
                      active
                        ? "bg-emerald-600 text-white font-medium shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-[16px] h-[16px] ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <p className="px-3 mt-5 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Account</p>
            <div className="space-y-0.5">
              {accountNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[13px] group ${
                      active
                        ? "bg-emerald-600 text-white font-medium shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className={`w-[16px] h-[16px] ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.name === "Support" && openTicketsCount > 0 && (
                      <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ${active ? "bg-white/20 text-white" : "bg-red-50 text-red-500"}`}>
                        {openTicketsCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Promo Card */}
          <div className="px-3 pb-2">
            <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
                <Gift className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-gray-800 mb-0.5">Refer & Earn</p>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Invite friends and earn free credits</p>
              <Link
                href="/dashboard/referrals"
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Learn More <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
            <Link
              href="/dashboard/help"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-[13px]"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span>Help & docs</span>
            </Link>
            <button 
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all w-full text-[13px]"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
          {/* Top Bar — Consist Style: search bar + actions */}
          <div className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything here..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                />
              </div>
            </div>

            <div className="flex-1" />

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link 
                href="/support" 
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
                {openTicketsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>
              <div className="w-px h-6 bg-gray-100 mx-1" />
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          {children}
        </main>
      </div>

      {/* Chat Widget for User Panel */}
      <ChatWidget type="user_panel" userId={user?.id} />
    </>
  );
}
