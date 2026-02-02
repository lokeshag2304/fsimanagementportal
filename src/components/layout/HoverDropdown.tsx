"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function HoverDropdown({
  tab,
  isActive,
}: {
  tab: any;
  isActive: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  /** calculate dropdown position */
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        left: rect.left,
        top: rect.bottom + 6,
      });
    }
  }, [open]);

  /** close on outside click */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* TRIGGER */}
      <button
  ref={triggerRef}
  className={cn(
    "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
    
    // 👉 SELECTED (ACTIVE) STATE — ALWAYS THEME COLOR
    isActive &&
      "bg-theme-gradient text-[var(--text-primary)]",

    // 👉 OPEN BUT NOT ACTIVE (dropdown open on hover)
    !isActive && open &&
      "bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--text-primary)]",

    // 👉 NORMAL STATE
    !isActive && !open &&
      "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
  )}
>

        {tab.name}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            zIndex: 9999,
          }}
          className="animate-dropdown-fade-in"
        >
          <div className="glass-dropdown min-w-[200px] rounded-xl overflow-hidden p-1">
           {tab.submenu.map((item: any) => {
  const isSubActive =
    typeof window !== "undefined" &&
    window.location.pathname === item.href

  return (
    <Link
      key={item.name}
      href={item.href}
      className={cn(
        "block px-4 py-2 text-sm transition",

        // 👉 SELECTED SUBMENU
        isSubActive &&
          "bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--text-primary)]",

        // 👉 NORMAL + HOVER (LIGHT MODE SAFE)
        !isSubActive &&
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,var(--ui-opacity-10))]"
      )}
      onClick={() => setOpen(false)}
    >
      {item.name}
    </Link>
  )
})}

          </div>
        </div>
      )}
    </div>
  );
}
