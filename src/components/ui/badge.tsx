import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
    variant: {
  success:
    "border-transparent bg-[#22C55E] text-white hover:bg-[#16A34A]",

  default:
    "border-transparent bg-[#2563EB] text-white hover:bg-[#1D4ED8]",

  secondary:
    "border-transparent bg-[#64748B] text-white hover:bg-[#475569]",

  destructive:
    "border-transparent bg-[#EF4444] text-white hover:bg-[#DC2626]",

  outline:
    "border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]",
},

    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
