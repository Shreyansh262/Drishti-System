"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Star,
  History,
  Settings,
  Menu,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Complaints", href: "/complaints", icon: MessageSquare },
  { name: "Feedback", href: "/feedback", icon: Star },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
]

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardLayout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-4">
              <div className="mt-6">
                <NavLinks pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
              D
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Drishti (दृष्टि)</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="flex-1 p-4">
            <NavLinks pathname={pathname} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-16">{children}</main>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full z-10 border-t border-border bg-background">
        <div className="flex h-12 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            © 2025 <span className="font-medium text-foreground">Drishti (दृष्टि)</span> — Vehicle Monitoring System
          </p>
        </div>
      </footer>
    </div>
  )
}
