"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CreditCard, 
  Settings, 
  HelpCircle,
  Users,
  BarChart3,
  Wallet,
  UserCog,
  LogOut
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Usage", href: "/dashboard/usage", icon: BarChart3 },
    { name: "Billing", href: "/dashboard/billing", icon: Wallet },
    { name: "Pricing Plans", href: "/pricing", icon: CreditCard },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "User Management", href: "/dashboard/users", icon: UserCog },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Yellow Sidebar */}
      <aside className="w-64 bg-yellow-400 flex flex-col shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b border-yellow-500">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-black cursor-pointer">StartupKit</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.href)
                    ? "bg-black text-yellow-400 shadow-md"
                    : "text-black hover:bg-yellow-500"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-yellow-500 space-y-2">
          <Link href="/dashboard/help" className="flex items-center gap-3 px-4 py-3 rounded-lg text-black hover:bg-yellow-500 transition w-full">
            <HelpCircle className="w-5 h-5" />
            <span className="font-semibold">Help Center</span>
          </Link>
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-black hover:bg-yellow-500 transition w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100">
        {/* Top Bar with Account */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
