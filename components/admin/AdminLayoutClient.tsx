"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NotificationBell } from "@/components/notification-bell";
import { PanelSwitcher } from "@/components/panel-switcher";
import { HeaderUser } from "@/components/header-user";
import { Separator } from "@/components/ui/separator";
import { LoginTracker } from "@/components/LoginTracker";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
import Link from "next/link";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/customers": "Customers",
  "/admin/leads": "Leads",
  "/admin/users": "User Management",
  "/admin/activity": "User Activity",
  "/admin/revenue": "Revenue Dashboard",
  "/admin/revenue/transactions": "Transactions",
  "/admin/subscriptions": "Subscriptions",
  "/admin/purchases": "Credit Purchases",
  "/admin/invoices-and-pos": "Invoices & Sales Orders",
  "/admin/referrals": "Referral Program",
  "/admin/booking": "Bookings",
  "/admin/inbox": "Inbox",
  "/admin/alerts": "Alerts",
  "/admin/chatbot-analytics": "Chatbot Analytics",
  "/admin/chatbot-settings": "Chatbot Settings",
  "/admin/chatbot-designer": "Widget Designer",
  "/admin/knowledge-base": "Knowledge Base",
  "/admin/email-management": "Email Management",
  "/admin/email-templates": "Email Templates",
  "/admin/email-management/campaigns": "Campaigns",
  "/admin/email-management/analytics": "Email Analytics",
  "/admin/settings": "Settings",
  "/admin/settings/company": "Company Settings",
  "/admin/settings/email": "Email (SMTP)",
  "/admin/security": "Security",
};

export default function AdminLayoutClient({
  children,
}: AdminLayoutClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];
    const pageTitle = BREADCRUMB_MAP[pathname];
    if (pathname === "/admin") return [{ label: "Dashboard", href: "/admin" }];
    const crumbs: { label: string; href: string }[] = [{ label: "Dashboard", href: "/admin" }];
    if (pageTitle) {
      crumbs.push({ label: pageTitle, href: pathname });
    } else {
      // For dynamic routes like /admin/invoice/[id], try parent
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 2) {
        const parentPath = "/" + segments.slice(0, -1).join("/");
        const parentTitle = BREADCRUMB_MAP[parentPath];
        if (parentTitle) crumbs.push({ label: parentTitle, href: parentPath });
      }
      crumbs.push({ label: segments[segments.length - 1] || "", href: pathname });
    }
    return crumbs;
  }, [pathname]);

  return (
    <>
      <LoginTracker />
      <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4" suppressHydrationWarning>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-1.5" suppressHydrationWarning>
            {/* Search */}
            <div className="hidden lg:flex relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-44 pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
              />
            </div>
            <PanelSwitcher />
            <NotificationBell />
            <ThemeSwitcher />
            <HeaderUser />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4 pt-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}
