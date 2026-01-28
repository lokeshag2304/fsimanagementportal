"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  BookOpen,
  Rocket,
  Users,
  Book,
  UserPlus,
  BarChart3,
  Share2,
  User,
  Settings,
  ChevronDown,
  Menu,
  X,
  UserCog,
  Package,
  Globe
} from "lucide-react"
import { useState } from "react"
import { navigationTabs } from "@/lib/navigation"


// const navigationItems = [
//   { name: "Dashboard", href: "/", icon: Home },
//   { name: "User Management", href: "/user-management", icon: UserCog, hasSubmenu: true, submenu: [
//     { name: "Support Admin", href: "/user-management/support-admin" },
//     { name: "Customer Admin", href: "/user-management/customer-admin" }
//   ] },
//   { name: "Products", href: "/products", icon: Package },
//   { name: "Domain", href: "/domain", icon: Globe },
//   { name: "Courses", href: "/courses", icon: BookOpen, hasSubmenu: true },
//   { name: "Bootcamp", href: "/bootcamp", icon: Rocket, hasSubmenu: true },
//   { name: "Team Training", href: "/team-training", icon: Users, hasSubmenu: true },
//   { name: "EBook", href: "/ebooks", icon: Book, hasSubmenu: true },
//   { name: "Enrollments", href: "/enrollments", icon: UserPlus, hasSubmenu: true },
//   { name: "Reports", href: "/reports", icon: BarChart3, hasSubmenu: true },
//   { name: "Affiliate", href: "/affiliate", icon: Share2, hasSubmenu: true },
//   { name: "Users", href: "/users", icon: User },
//   { name: "Settings", href: "/settings", icon: Settings },
// ]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([])
 
  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 glass-sidebar z-40 transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(255,255,255,var(--glass-border-opacity))]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-white">Clasy</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-88px)]">
          {navigationTabs.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const isDropdownOpen = openDropdowns.includes(item.name)

            return (
              <div key={item.name}>
                {item.hasSubmenu && item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "glass text-white"
                          : "text-[var(--text-tertiary)] hover:text-white hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-white" : "text-[var(--text-muted)] group-hover:text-white"
                        )} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isActive ? "text-white" : "text-[var(--text-muted)]",
                        isDropdownOpen ? "rotate-180" : ""
                      )} />
                    </button>
                    {isDropdownOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "block px-4 py-2 rounded-lg transition-all duration-200",
                                isSubActive
                                  ? "glass text-white"
                                  : "text-[var(--text-tertiary)] hover:text-white hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
                              )}
                            >
                              {subItem.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive
                        ? "glass text-white"
                        : "text-[var(--text-tertiary)] hover:text-white hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-white" : "text-[var(--text-muted)] group-hover:text-white"
                      )} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-white" : "text-[var(--text-muted)]"
                      )} />
                    )}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
