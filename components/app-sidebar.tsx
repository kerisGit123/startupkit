"use client"

import * as React from "react"
import {
  IconLayoutDashboard,
  IconUsers,
  IconSettings,
  IconCreditCard,
  IconBell,
  IconShield,
  IconActivity,
  IconMail,
  IconShoppingCart,
  IconTicket,
  IconFileInvoice,
  IconReceipt,
  IconMessageChatbot,
  IconMessages,
  IconChartBar,
  IconBook,
  IconPalette,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"

const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconLayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Activity",
    url: "/admin/activity",
    icon: IconActivity,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: IconCreditCard,
  },
  {
    title: "Purchases",
    url: "/admin/purchases",
    icon: IconShoppingCart,
  },
  {
    title: "Invoices",
    url: "/admin/invoices",
    icon: IconFileInvoice,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: IconReceipt,
  },
  {
    title: "Tickets",
    url: "/admin/tickets",
    icon: IconTicket,
  },
  {
    title: "Referrals",
    url: "/admin/referrals",
    icon: IconShield,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: IconBell,
  },
  {
    title: "Alerts",
    url: "/admin/alerts",
    icon: IconBell,
  },
  {
    title: "Email Management",
    url: "/admin/email-management",
    icon: IconMail,
  },
  {
    title: "Chatbot Settings",
    url: "/admin/chatbot-settings",
    icon: IconMessageChatbot,
  },
  {
    title: "Widget Designer",
    url: "/admin/chatbot-designer",
    icon: IconPalette,
  },
  {
    title: "Live Chat",
    url: "/admin/live-chat",
    icon: IconMessages,
  },
  {
    title: "Knowledge Base",
    url: "/admin/knowledge-base",
    icon: IconBook,
  },
  {
    title: "Chatbot Analytics",
    url: "/admin/chatbot-analytics",
    icon: IconChartBar,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: IconSettings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconShield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin Panel</span>
                  <span className="truncate text-xs">StartupKit</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
