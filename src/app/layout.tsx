import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { ThemeScript } from "@/components/theme-script"
import { HydrationFix } from "@/components/hydration-fix"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/components/shared/ToastProvider"
import { Toaster } from "@/components/ui/toaster"
import AuthGuard from "@/components/AuthGuard";


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fsi Management Portal ⭐",
  description: "Sbcription management system",
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
      <body className={inter.className} suppressHydrationWarning>
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
