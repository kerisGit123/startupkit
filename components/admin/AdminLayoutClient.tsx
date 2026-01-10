"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { AdminRole } from "@/lib/adminAuth";

interface AdminLayoutClientProps {
  role: AdminRole;
  isSuperAdmin: boolean;
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  role,
  isSuperAdmin,
  children,
}: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <AdminHeader
        onMenuClick={() => setSidebarOpen(true)}
        isSuperAdmin={isSuperAdmin}
      />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          role={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
