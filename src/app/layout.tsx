import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { ThemeScript } from "@/components/theme-script"
import { HydrationFix } from "@/components/hydration-fix"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/components/shared/ToastProvider"
import { Toaster } from "@/components/ui/toaster"
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <HydrationFix />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AuthGuard>
                <main className="min-h-screen">
                  {children}
                </main>
                <Toaster />
              </AuthGuard>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
