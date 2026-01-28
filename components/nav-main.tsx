"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: LucideIcon | React.ComponentType<{ className?: string }>
    color?: string
    badge?: string
    items?: {
      title: string
      url: string
      icon?: LucideIcon | React.ComponentType<{ className?: string }>
    }[]
  }[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  return (
    <>
      {items.map((item) => {
        const hasSubItems = item.items && item.items.length > 0
        const isOpen = openItems.includes(item.title)
        const isActive = item.url ? pathname === item.url : false

        // If item has a direct URL and no sub-items, render as simple link
        if (item.url && !hasSubItems) {
          return (
            <SidebarGroup key={item.title}>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url}>
                      {item.icon && (
                        <item.icon
                          className={cn("size-4", item.color)}
                        />
                      )}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )
        }

        // If item has sub-items, render as collapsible
        if (hasSubItems) {
          return (
            <SidebarGroup key={item.title}>
              <SidebarMenu>
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon && (
                          <item.icon
                            className={cn("size-4", item.color)}
                          />
                        )}
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            "ml-auto size-4 transition-transform",
                            isOpen && "rotate-90"
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link href={subItem.url}>
                              {subItem.icon && (
                                <subItem.icon className="size-4" />
                              )}
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroup>
          )
        }

        return null
      })}
    </>
  )
}
