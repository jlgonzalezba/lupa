"use client"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  FileText,
  Users,
  FolderOpen,
  Bell,
  Settings,
  HelpCircle,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const secondaryNav = [
  { name: "Notificaciones", href: "/notifications", icon: Bell },
  { name: "Configuración", href: "/settings", icon: Settings },
  { name: "Ayuda", href: "/help", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const mainNav = [
    { name: "Formularios", href: "/", icon: FileText },
    { name: "Mis Reportes", href: "/mis-reportes", icon: FolderOpen },
    ...(isAdmin ? [
      { name: "Analíticas", href: "/analiticas", icon: BarChart3 },
      { name: "Usuarios", href: "/usuarios", icon: Users },
    ] : []),
  ]

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">
          Panel
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Principal
        </p>
        {mainNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        <div className="my-6 border-t border-border" />

        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sistema
        </p>
        {secondaryNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}