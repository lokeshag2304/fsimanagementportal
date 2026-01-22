"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { Mail, Phone, MessageCircle, ArrowRight, ArrowLeft } from "lucide-react"

export default function SelectMethodPage() {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone' | 'whatsapp' | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { sendOTP } = useAuth()

  useEffect(() => {
    // Get email from cookie
    const cookies = document.cookie.split(';')
    const emailCookie = cookies.find(cookie => cookie.trim().startsWith('user_email='))
    if (emailCookie) {
      setUserEmail(emailCookie.split('=')[1])
    }
  }, [])

  const handleSendOTP = () => {
    if (!selectedMethod || !userEmail) return
    
    setIsLoading(true)
    
    let contact = ""
    switch (selectedMethod) {
      case 'email':
        contact = userEmail
        break
      case 'phone':
        contact = "+91 98765 43210" // Demo number
        break
      case 'whatsapp':
        contact = "+91 98765 43210" // Demo number
        break
    }
    
    setTimeout(() => {
      const otp = sendOTP(selectedMethod, contact, userEmail)
      console.log(`Demo OTP: ${otp}`) // Show OTP in console for testing
      setIsLoading(false)
      router.push('/auth/verify-otp')
    }, 1000)
  }

  const methods = [
    {
      id: 'email' as const,
      icon: Mail,
      title: 'Email',
      description: 'Send OTP to your email address',
      contact: userEmail
    },
    {
      id: 'phone' as const,
      icon: Phone,
      title: 'SMS',
      description: 'Send OTP via SMS',
      contact: '+91 98765 43210'
    },
    {
      id: 'whatsapp' as const,
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Send OTP via WhatsApp',
      contact: '+91 98765 43210'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Two-Step Verification</h1>
          <p className="text-[var(--text-muted)]">Choose how you'd like to receive your OTP</p>
        </div>

        <GlassCard className="p-6">
          {!userEmail ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[var(--theme-gradient-from)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">Loading...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {methods.map((method) => {
                  const Icon = method.icon
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 border-2 cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'rounded-xl border-[var(--theme-gradient-from)] bg-[rgba(var(--theme-primary-rgb),0.1)]'
                          : 'rounded-2xl border-gray-200 hover:border-[rgba(89,18,18,0.3)]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedMethod === method.id
                            ? 'bg-theme-gradient'
                            : 'bg-[rgba(255,255,255,var(--ui-opacity-10))]'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            selectedMethod === method.id ? 'text-white' : 'text-[var(--text-muted)]'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[var(--text-primary)]">{method.title}</h3>
                          <p className="text-[var(--text-muted)] text-sm">{method.description}</p>
                          <p className="text-[var(--text-tertiary)] text-xs mt-1">
                            {method.id === 'email' ? userEmail : method.contact}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedMethod === method.id
                            ? 'border-[var(--theme-gradient-from)] bg-[var(--theme-gradient-from)]'
                            : 'border-[rgba(255,255,255,var(--glass-border-opacity))]'
                        }`}>
                          {selectedMethod === method.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={() => router.back()}
                  variant="secondary"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </GlassButton>
                <GlassButton
                  onClick={handleSendOTP}
                  variant="primary"
                  className="flex-1"
                  disabled={!selectedMethod || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Send OTP
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </GlassButton>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  )
}