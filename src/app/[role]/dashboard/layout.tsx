import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { ThemeScript } from "@/components/theme-script"
import { HydrationFix } from "@/components/hydration-fix"
import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@radix-ui/react-toast"
import AuthGuard from "@/components/AuthGuard";


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Flying ⭐",
  description: "Sbcription management system",
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
