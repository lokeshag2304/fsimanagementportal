"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  Settings,
  ChevronDown,
  User,
  LogOut,
  X,
  Sparkles,
  Grid3X3,
  HelpCircle,
  Search
} from "lucide-react";

import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import { HoverDropdown } from "./HoverDropdown";

const ASSETS_URL = process.env.NEXT_PUBLIC_ASSETS_URL;

interface Tab {
  name: string;
  href: string;
  hasDropdown?: boolean;
  submenu?: { name: string; href: string }[];
}

interface HeaderProps {
  title: string;
  tabs?: Tab[];
  searchQuery?: string;
  onSearch?: (value: string) => void;
}

export function Header({ title, tabs: propTabs, searchQuery, onSearch }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const { logout, user } = useAuth();

  // Memoize navigation tabs to prevent unnecessary re-renders/flicker
  const navigationTabs = useMemo(() => {
    return propTabs || getNavigationByRole(user?.role);
  }, [propTabs, user?.role]);

  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName],
    );
  };

  return (
    <TooltipProvider>
      <header className="relative z-50 px-4 sm:px-6">
        {/* Top Bar - Logo and Icons */}
        <div className="flex items-center justify-between py-4 md:py-5 lg:py-6">
          {/* Logo */}
          <Link
            href={`/${user?.role}/dashboard`}
            className="flex items-center gap-3 group pl-4 md:pl-8 lg:pl-10"
          >
            <div className="flex items-center group">
              <Image
                src="/logo.webp"
                alt="Logo"
                width={280}
                height={55}
                priority
                className="w-48 sm:w-56 md:w-64 lg:w-[280px] h-auto object-contain shrink-0"
              />
            </div>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Theme</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/${user?.role}/settings`} className="hidden md:block">
                  <Button variant="glass-circle" size="icon-lg">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="ml-2 border-2 border-[rgba(255,255,255,var(--glass-border-opacity))] hover:border-[rgba(255,255,255,var(--ui-opacity-20))] transition-colors cursor-pointer">
                  <AvatarImage
                    src={`${ASSETS_URL}/${user?.profile}`}
                    alt="User"
                  />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 glass-dropdown border-[rgba(255,255,255,var(--glass-border-opacity))]"
                align="end"
                sideOffset={12}
              >
                <DropdownMenuLabel className="text-[var(--text-tertiary)]">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[rgba(255,255,255,var(--ui-opacity-10))]" />
                <Link href={`/${user?.role}/settings`}>
                  <DropdownMenuItem className="text-[var(--text-secondary)] focus:bg-[rgba(255,255,255,var(--ui-opacity-10))] focus:text-white cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-[rgba(255,255,255,var(--ui-opacity-10))]" />
                <DropdownMenuItem
                  className="text-red-400 focus:bg-[rgba(255,255,255,var(--ui-opacity-10))] focus:text-red-400 cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="glass-header px-2 sm:px-4 py-1">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-white hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--text-primary)] whitespace-nowrap flex-shrink-0">
              {title}
            </h1>

            {/* Tabs - desktop only */}
            {navigationTabs && navigationTabs.length > 0 && (
              <nav className="hidden md:flex items-center gap-1 ml-2 flex-grow overflow-x-auto scrollbar-hide">
                {navigationTabs.map((tab: any) => {
                  const isActive =
                    pathname === tab.href ||
                    (tab.href !== "/" && pathname.startsWith(tab.href)) ||
                    (tab.href === "/" && pathname === "/");

                  return tab.hasDropdown && tab.submenu ? (
                    <HoverDropdown
                      key={tab.name}
                      tab={tab}
                      isActive={isActive}
                    />
                  ) : (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={cn(
                        "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
                        isActive
                          ? "bg-theme-gradient text-white"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]",
                      )}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Global Search Bar - Added here */}
            {onSearch !== undefined && (
              <div className="hidden lg:flex items-center relative ml-auto min-w-[300px]">
                <Search className="absolute left-3 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery || ""}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Search across all modules..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-full glass-input border-white/[0.08]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Drawer Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100]">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 glass-sidebar animate-slide-in">
              <div className="p-5 border-b border-[rgba(255,255,255,var(--glass-border-opacity))] flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Image
                    src="/logo.webp"
                    alt="Logo"
                    width={200}
                    height={40}
                    priority
                    className="w-40 h-auto object-contain"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-88px)]">
                {navigationTabs.map((item: any) => {
                  const Icon = item?.icon;
                  const isActive =
                    pathname === item?.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  const isDropdownOpen = openDropdowns?.includes(item.name);

                  return (
                    <div key={item.name}>
                      {item.hasSubmenu && item.submenu ? (
                        <>
                          <button
                            onClick={() => toggleDropdown(item.name)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200",
                              isActive
                                ? "glass text-[var(--text-primary)]"
                                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {Icon && (
                                <Icon
                                  className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive
                                      ? "text-[var(--text-primary)]"
                                      : "text-[var(--text-muted)]",
                                  )}
                                />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 transition-transform duration-200",
                                isDropdownOpen ? "rotate-180" : "",
                              )}
                            />
                          </button>
                          {isDropdownOpen && (
                            <div className="ml-8 mt-1 space-y-1">
                              {item.submenu.map((subItem: any) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={cn(
                                    "block px-4 py-2 rounded-lg transition-all duration-200",
                                    pathname === subItem.href
                                      ? "glass text-[var(--text-primary)]"
                                      : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]",
                                  )}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                            isActive
                              ? "glass text-[var(--text-primary)]"
                              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]",
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isActive
                                  ? "text-[var(--text-primary)]"
                                  : "text-[var(--text-muted)]",
                              )}
                            />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>
    </TooltipProvider>
  );
}
