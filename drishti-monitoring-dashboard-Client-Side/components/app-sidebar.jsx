"use client"

import { usePathname, useRouter } from "next/navigation"
import { Gauge, History, Ticket, Phone, Settings, Plus } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Gauge },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Support", href: "/dashboard/tickets", icon: Ticket },
  { name: "Contact", href: "/dashboard/contact", icon: Phone },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path) => pathname === path

  const handleRaiseTicket = () => {
    router.push("/dashboard/tickets/new")
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
            D
          </span>
          <span className="font-semibold text-base tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Drishti
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-auto py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <SidebarMenuItem key={item.href} className="px-2">
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
                      className={`w-full rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <a href={item.href} className="flex items-center gap-3 w-full">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 pt-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="px-2">
                <SidebarMenuButton
                  onClick={handleRaiseTicket}
                  tooltip="Raise New Ticket"
                  className="w-full rounded-md px-3 py-2 flex items-center gap-3 text-sm bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground transition-colors"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Raise Ticket</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
        Drishti v1.0
      </SidebarFooter>
    </Sidebar>
  )
}
