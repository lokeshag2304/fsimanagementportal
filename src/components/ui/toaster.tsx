"use client"

import { useToast } from "@/hooks/useToast"
import {
  Toast,
  ToastAccentBar,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProgressBar,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "../shared/ToastProvider"

/** Auto-maps toast title → correct semantic variant.
 *  Handles legacy calls where every toast used `variant: "destructive"`. */
function resolveVariant(
  variant: string | undefined | null,
  title: React.ReactNode
): "default" | "success" | "destructive" | "warning" | "info" | "update" | "duplicate" {
  // If an explicit semantic variant was passed, honour it
  if (variant && !["destructive", "default"].includes(variant)) {
    return variant as any
  }

  const t = typeof title === "string" ? title.toLowerCase() : ""

  if (t === "success" || t.includes("successful") || t.includes("created") || t.includes("added") || t.includes("sent"))
    return "success"

  if (t === "updated" || t === "update" || t.includes("updated") || t.includes("edited") || t.includes("changed") || t.includes("saved"))
    return "update"

  if (t.includes("duplicate") || t.includes("already exists"))
    return "duplicate"

  if (t === "warning" || t.includes("warning"))
    return "warning"

  if (t === "info" || t.includes("info") || t.includes("session"))
    return "info"

  return "destructive"
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const v = resolveVariant(variant, title)
        return (
          <Toast key={id} {...props} variant={v}>

            {/* Left glow accent bar */}
            <ToastAccentBar />

            {/* Body */}
            <div className="flex flex-1 items-start gap-3 px-4 py-3.5 pr-8 min-w-0">

              {/* Icon badge */}
              <div className="flex-shrink-0 mt-0.5">
                <ToastIcon variant={v} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                {title && (
                  <ToastTitle className="mb-0.5">{title}</ToastTitle>
                )}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>

            {/* Optional action */}
            {action}

            {/* Close */}
            <ToastClose />

            {/* Progress bar — synced to TOAST_REMOVE_DELAY (4 s) */}
            <ToastProgressBar duration={4000} />

          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
