import { Metadata } from "next";
import Link from "next/link";
import { Settings, User, Building2, TestTube, FileText, ShoppingCart, Receipt, Image, Mail, RefreshCw, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and set e-mail preferences.",
};

const sidebarNavItems = [
  {
    title: "Company",
    href: "/admin/settings/company",
    icon: Building2,
  },
  {
    title: "Profile",
    href: "/admin/settings/profile",
    icon: User,
  },
  {
    title: "Email Settings",
    href: "/admin/settings/email",
    icon: Mail,
  },
  {
    title: "Invoice & SO Config",
    href: "/admin/settings/invoice-po-config",
    icon: Receipt,
  },
  {
    title: "Report Header",
    href: "/admin/settings/report-header",
    icon: Image,
  },
  {
    title: "Invoices",
    href: "/admin/settings/invoices",
    icon: FileText,
  },
  {
    title: "Sales Orders",
    href: "/admin/settings/po",
    icon: ShoppingCart,
  },
  {
    title: "Resend Email",
    href: "/admin/settings/resend",
    icon: Send,
  },
  {
    title: "Sync Data",
    href: "/admin/settings/sync-data",
    icon: RefreshCw,
  },
  {
    title: "Testing",
    href: "/admin/settings/testing",
    icon: TestTube,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
