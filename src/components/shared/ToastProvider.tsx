"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-2xl p-4 pr-8 shadow-2xl backdrop-blur-xl transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: cn(
          "glass-morphism border border-white/20",
          "bg-gradient-to-br from-white/20 via-white/15 to-white/10",
          "text-gray-900 dark:text-gray-100"
        ),
        success: cn(
          "glass-morphism-success border-emerald-500/30",
          "bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/5",
          "text-emerald-800 dark:text-emerald-200"
        ),
        destructive: cn(
          "glass-morphism-destructive border-red-500/30",
          "bg-gradient-to-br from-red-500/15 via-red-500/10 to-red-500/5",
          "text-red-800 dark:text-red-200"
        ),
        warning: cn(
          "glass-morphism-warning border-amber-500/30",
          "bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-amber-500/5",
          "text-amber-800 dark:text-amber-200"
        ),
        info: cn(
          "glass-morphism-info border-blue-500/30",
          "bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-blue-500/5",
          "text-blue-800 dark:text-blue-200"
        ),
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

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all",
      "bg-white/20 hover:bg-white/30 text-gray-900 dark:text-gray-100",
      "border border-white/30 hover:border-white/40",
      "focus:outline-none focus:ring-2 focus:ring-white/50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1.5 transition-all",
      "text-gray-500 hover:text-gray-900",
      "dark:text-gray-400 dark:hover:text-gray-100",
      "hover:bg-white/20 active:scale-95",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastIcon = ({ variant }: { variant?: string }) => {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    case "destructive":
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />
    default:
      return null
  }
}

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm leading-relaxed opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
}