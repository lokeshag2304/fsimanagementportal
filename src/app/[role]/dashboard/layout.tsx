import type { Metadata } from "next"

import "../../globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { ThemeScript } from "@/components/theme-script"
import { HydrationFix } from "@/components/hydration-fix"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@radix-ui/react-toast"
import AuthGuard from "@/components/AuthGuard";



export const metadata: Metadata = {
  title: "Fsi Management Portal ⭐",
  description: "Sbcription management system",
  icons: {
    icon: "/tab-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="min-h-screen">
      <AuthGuard>
        {children}
      </AuthGuard>
    </main>
  )
}
