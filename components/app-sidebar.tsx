"use client"

import * as React from "react"
import {
  IconLayoutDashboard,
  IconUsers,
  IconSettings,
  IconCreditCard,
  IconShield,
  IconFileInvoice,
  IconReceipt,
  IconMessageChatbot,
  IconChartBar,
  IconBook,
  IconPalette,
  IconCalendar,
  IconCurrencyDollar,
  IconInbox,
  IconMail,
  IconTemplate,
  IconSend,
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
    color: "text-blue-600",
  },
  {
    title: "Finance",
    icon: IconCurrencyDollar,
    color: "text-green-600",
    items: [
      {
        title: "Revenue Dashboard",
        url: "/admin/revenue",
        icon: IconChartBar,
      },
      {
        title: "Transactions",
        url: "/admin/revenue/transactions",
        icon: IconReceipt,
      },
      {
        title: "Subscriptions",
        url: "/admin/subscriptions",
        icon: IconCreditCard,
      },
      {
        title: "Invoices & Sales Orders",
        url: "/admin/invoices-and-pos",
        icon: IconFileInvoice,
      },
      {
        title: "Referral Program",
        url: "/admin/referrals",
        icon: IconShield,
      },
    ],
  },
  {
    title: "Customers",
    icon: IconUsers,
    color: "text-purple-600",
    items: [
      {
        title: "All Customers",
        url: "/admin/customers",
        icon: IconUsers,
      },
      {
        title: "Leads",
        url: "/admin/leads",
        icon: IconUsers,
      },
    ],
  },
  {
    title: "Bookings",
    url: "/admin/booking",
    icon: IconCalendar,
    color: "text-orange-600",
  },
  {
    title: "Inbox",
    icon: IconInbox,
    color: "text-blue-600",
    items: [
      {
        title: "All Messages",
        url: "/admin/inbox",
        icon: IconInbox,
      },
      {
        title: "Chatbot Analytics",
        url: "/admin/chatbot-analytics",
        icon: IconChartBar,
      },
    ],
  },
  {
    title: "Email",
    icon: IconMail,
    color: "text-pink-600",
    items: [
      {
        title: "Email Management",
        url: "/admin/email-management",
        icon: IconMail,
      },
      {
        title: "Email Templates",
        url: "/admin/email-templates",
        icon: IconTemplate,
      },
      {
        title: "Campaigns",
        url: "/admin/email-management/campaigns",
        icon: IconSend,
      },
      {
        title: "Analytics",
        url: "/admin/email-management/analytics",
        icon: IconChartBar,
      },
    ],
  },
  {
    title: "Settings",
    icon: IconSettings,
    color: "text-gray-600",
    items: [
      {
        title: "General",
        url: "/admin/settings",
        icon: IconSettings,
      },
      {
        title: "Chatbot",
        url: "/admin/chatbot-settings",
        icon: IconMessageChatbot,
      },
      {
        title: "Widget Designer",
        url: "/admin/chatbot-designer",
        icon: IconPalette,
      },
      {
        title: "Knowledge Base",
        url: "/admin/knowledge-base",
        icon: IconBook,
      },
    ],
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
