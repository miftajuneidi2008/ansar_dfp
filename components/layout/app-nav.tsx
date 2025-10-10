"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Users, Settings, Building } from "lucide-react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"

export function AppNav() {
  const pathname = usePathname()
  const { profile } = useAuthContext()

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["branch_user", "head_office_approver", "system_admin"],
    },
    {
      label: "Applications",
      href: "/applications",
      icon: FileText,
      roles: ["branch_user", "head_office_approver"],
    },
    {
      label: "Products",
      href: "/products",
      icon: Building,
      roles: ["system_admin"],
    },
    {
      label: "Districts & Branches",
      href: "/districts",
      icon: Building,
      roles: ["system_admin"],
    },
    {
      label: "Users",
      href: "/users",
      icon: Users,
      roles: ["system_admin"],
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["system_admin"],
    },
  ]

  const visibleItems = profile ? navItems.filter((item) => item.roles.includes(profile.role)) : navItems

  if (!profile) {
    return (
      <nav className="border-b bg-amber-50">
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-sm text-amber-800">Please complete your profile setup to access the portal features.</p>
          <Link href="/setup">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
              Complete Setup
            </Button>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-white">
      <div className="flex items-center gap-1 px-6">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                isActive ? "text-teal-600 border-teal-600" : "text-slate-600 border-transparent hover:text-slate-900",
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
