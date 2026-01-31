import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface HoverDropdownProps {
  tab: any;
  isActive: boolean;
  openDropdown: string | null;
  setOpenDropdown: (value: string | null) => void;
}

export function HoverDropdown({
  tab,
  isActive,
  openDropdown,
  setOpenDropdown,
}: HoverDropdownProps) {
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenDropdown(tab.name);
  };

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  return (
    <DropdownMenu open={openDropdown === tab.name}>
      <DropdownMenuTrigger asChild>
        <button
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            isActive
              ? "bg-theme-gradient text-white"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
          )}
        >
          {tab.name}
          <ChevronDown className="w-4 h-4 ml-0.5" />
        </button>
      </DropdownMenuTrigger>

<DropdownMenuContent
  side="bottom"
  align="start"
  sideOffset={2}
  className="glass-dropdown border-[rgba(255,255,255,var(--glass-border-opacity))]"
  style={{
    position: 'fixed', // Use fixed positioning
    transform: 'translateY(0px) !important', // Override any transform
  }}
  onMouseEnter={openMenu}
  onMouseLeave={closeMenu}
>
        {tab.submenu.map((subItem: any) => (
          <DropdownMenuItem key={subItem.name} asChild>
            <Link
              href={subItem.href}
              className="block w-full text-[var(--text-secondary)] focus:bg-[rgba(255,255,255,var(--ui-opacity-10))] focus:text-white"
            >
              {subItem.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}