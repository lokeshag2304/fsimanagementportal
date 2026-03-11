"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, XCircle, Info, AlertTriangle, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

/* ─────────────────────────────────────────────
   Viewport — bottom-right, stacked column
───────────────────────────────────────────── */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // position
      "fixed bottom-4 right-4 z-[9999]",
      // stack
      "flex flex-col gap-3",
      // max size
      "max-h-screen w-[380px] max-w-[calc(100vw-2rem)]",
      // no pointer events on the container itself
      "pointer-events-none",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

/* ─────────────────────────────────────────────
   Per-variant config: colors, glow, left bar
───────────────────────────────────────────── */
const toastVariants = cva(
  [
    // base shell
    "pointer-events-auto relative w-full overflow-hidden",
    "rounded-2xl border",
    // glassmorphism dark base
    "bg-[#0f0f0f]/90 backdrop-blur-2xl",
    // shadow + depth
    "shadow-[0_8px_32px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]",
    // layout
    "flex items-stretch",
    // animation
    "transition-all duration-300 ease-out",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-bottom-full data-[state=open]:zoom-in-95",
    // swipe
    "data-[swipe=cancel]:translate-x-0",
    "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-white/10",
          "[--accent:#6366f1] [--accent-muted:rgba(99,102,241,0.15)] [--accent-glow:rgba(99,102,241,0.4)]",
          "[--text-color:#e2e8f0] [--desc-color:#94a3b8] [--icon-color:#6366f1]",
        ].join(" "),

        success: [
          "border-emerald-500/20",
          "[--accent:#16a34a] [--accent-muted:rgba(22,163,74,0.12)] [--accent-glow:rgba(34,197,94,0.35)]",
          "[--text-color:#ecfdf5] [--desc-color:#86efac] [--icon-color:#22c55e]",
        ].join(" "),

        destructive: [
          "border-red-500/20",
          "[--accent:#dc2626] [--accent-muted:rgba(220,38,38,0.12)] [--accent-glow:rgba(239,68,68,0.35)]",
          "[--text-color:#fff1f2] [--desc-color:#fca5a5] [--icon-color:#ef4444]",
        ].join(" "),

        warning: [
          "border-amber-400/20",
          "[--accent:#d97706] [--accent-muted:rgba(245,158,11,0.12)] [--accent-glow:rgba(251,191,36,0.35)]",
          "[--text-color:#fffbeb] [--desc-color:#fcd34d] [--icon-color:#fbbf24]",
        ].join(" "),

        info: [
          "border-blue-500/20",
          "[--accent:#2563eb] [--accent-muted:rgba(37,99,235,0.12)] [--accent-glow:rgba(59,130,246,0.35)]",
          "[--text-color:#eff6ff] [--desc-color:#93c5fd] [--icon-color:#60a5fa]",
        ].join(" "),

        update: [
          "border-slate-500/20",
          "[--accent:#475569] [--accent-muted:rgba(71,85,105,0.12)] [--accent-glow:rgba(148,163,184,0.3)]",
          "[--text-color:#f1f5f9] [--desc-color:#94a3b8] [--icon-color:#94a3b8]",
        ].join(" "),

        duplicate: [
          "border-yellow-400/20",
          "[--accent:#ca8a04] [--accent-muted:rgba(202,138,4,0.12)] [--accent-glow:rgba(250,204,21,0.35)]",
          "[--text-color:#fefce8] [--desc-color:#fde047] [--icon-color:#facc15]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={toastVariants({ variant, className })}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

/* ─────────────────────────────────────────────
   Left accent bar
───────────────────────────────────────────── */
const ToastAccentBar = () => (
  <div
    className="w-[3px] flex-shrink-0 rounded-l-2xl"
    style={{
      background: "var(--accent)",
      boxShadow: "0 0 8px 1px var(--accent-glow)",
    }}
  />
)

/* ─────────────────────────────────────────────
   Icon badge
───────────────────────────────────────────── */
const ToastIcon = ({ variant }: { variant?: string | null }) => {
  const Icon = (() => {
    switch (variant) {
      case "success":    return CheckCircle2
      case "destructive":return XCircle
      case "warning":    return AlertTriangle
      case "info":       return Info
      case "update":     return Pencil
      case "duplicate":  return AlertTriangle
      default:           return Info
    }
  })()

  return (
    <div
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
      style={{
        background: "var(--accent-muted)",
        border: "1px solid var(--accent-glow)",
        boxShadow: "0 0 10px 1px var(--accent-glow)",
        color: "var(--icon-color)",
      }}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
    </div>
  )
}

/* ─────────────────────────────────────────────
   Progress bar (auto-dismiss indicator)
───────────────────────────────────────────── */
const ToastProgressBar = ({ duration = 4000 }: { duration?: number }) => {
  const [width, setWidth] = React.useState(100)

  React.useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setWidth(remaining)
      if (remaining === 0) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [duration])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden rounded-b-2xl">
      <div
        className="h-full transition-none rounded-b-2xl"
        style={{
          width: `${width}%`,
          background: "var(--accent)",
          opacity: 0.7,
          transition: "width 50ms linear",
        }}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────
   Close button
───────────────────────────────────────────── */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-lg p-1 transition-all duration-150",
      "text-white/30 hover:text-white/80",
      "hover:bg-white/10 active:scale-90",
      "focus:outline-none focus:ring-1 focus:ring-white/30",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

/* ─────────────────────────────────────────────
   Action button
───────────────────────────────────────────── */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-7 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-medium transition-all",
      "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white",
      "border border-white/10 hover:border-white/20",
      "focus:outline-none focus:ring-1 focus:ring-white/30",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

/* ─────────────────────────────────────────────
   Title
───────────────────────────────────────────── */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold leading-snug tracking-tight",
      className
    )}
    style={{ color: "var(--text-color)" }}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

/* ─────────────────────────────────────────────
   Description
───────────────────────────────────────────── */
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-xs leading-relaxed", className)}
    style={{ color: "var(--desc-color)" }}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

/* ─────────────────────────────────────────────
   Types & exports
───────────────────────────────────────────── */
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastAccentBar,
  ToastIcon,
  ToastProgressBar,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}