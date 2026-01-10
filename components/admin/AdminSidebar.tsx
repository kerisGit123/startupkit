"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingCart,
  Ticket,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { AdminRole } from "@/lib/adminAuth";

interface AdminSidebarProps {
  role: AdminRole;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["super_admin", "billing_admin", "support_admin"],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["super_admin"],
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
    roles: ["super_admin", "billing_admin"],
  },
  {
    name: "Purchases",
    href: "/admin/purchases",
    icon: ShoppingCart,
    roles: ["super_admin", "billing_admin"],
  },
  {
    name: "Tickets",
    href: "/admin/tickets",
    icon: Ticket,
    roles: ["super_admin", "support_admin"],
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["super_admin", "billing_admin"],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
];

export default function AdminSidebar({ role, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-gray-50 border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          h-full overflow-y-auto
        `}
      >
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-lg font-semibold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Admin Panel</h2>
        </div>

        <nav className="p-3 space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Role</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
