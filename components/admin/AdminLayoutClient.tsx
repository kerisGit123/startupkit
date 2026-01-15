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
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  children,
}: AdminLayoutClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);
  return (
    <>
      <LoginTracker />
      <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4" suppressHydrationWarning>
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between" suppressHydrationWarning>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <PanelSwitcher />
              <NotificationBell />
              <ThemeSwitcher />
              <HeaderUser />
            </div>
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
