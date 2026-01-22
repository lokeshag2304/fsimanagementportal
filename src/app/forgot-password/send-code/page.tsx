"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassInput } from "@/components/glass/glass-input"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { Mail, Phone, ArrowRight, ArrowLeft } from "lucide-react"

export default function SendCodePage() {
  const [resetMethod, setResetMethod] = useState<'email' | 'phone' | null>(null)
  const [contact, setContact] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { sendOTP } = useAuth()

  useEffect(() => {
    // Get reset method from cookie
    const cookies = document.cookie.split(';')
    const methodCookie = cookies.find(cookie => cookie.trim().startsWith('reset_method='))
    if (methodCookie) {
      const method = methodCookie.split('=')[1] as 'email' | 'phone'
      setResetMethod(method)
    } else {
      router.push('/forgot-password')
    }
  }, [router])

  const handleSendCode = () => {
    if (!resetMethod || !contact) return
    
    setIsLoading(true)
    
    setTimeout(() => {
      // Store reset data for OTP verification
      document.cookie = `reset_contact=${contact}; path=/; max-age=600`
      
      // Send OTP using the auth hook
      const otp = sendOTP(resetMethod === 'phone' ? 'phone' : 'email', contact, contact)
      console.log(`Reset OTP: ${otp}`) // For demo
      
      setIsLoading(false)
      router.push('/auth/verify-otp')
    }, 1000)
  }

  const getPlaceholder = () => {
    return resetMethod === 'email' ? 'example@email.com' : '+91 98765 43210'
  }

  const getIcon = () => {
    return resetMethod === 'email' ? Mail : Phone
  }

  const getTitle = () => {
    return resetMethod === 'email' ? 'Enter Email Address' : 'Enter Phone Number'
  }

  const getDescription = () => {
    return resetMethod === 'email' 
      ? 'Enter the email address associated with your account'
      : 'Enter the phone number associated with your account'
  }

  if (!resetMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <GlassCard className="p-6 w-full max-w-md">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--theme-gradient-from)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">Loading...</p>
          </div>
        </GlassCard>
      </div>
    )
  }

  const Icon = getIcon()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Forgot Password?</h1>
          <p className="text-[var(--text-muted)]">
            {resetMethod === 'email' 
              ? 'Enter your email to receive reset instructions'
              : 'Enter your phone number to receive reset instructions'
            }
          </p>
        </div>
            
        <GlassCard className="p-6">
          {/* Info Box */}
          <div className="mb-6 p-4 rounded-xl bg-[rgba(var(--theme-primary-rgb),0.1)] border border-[rgba(var(--theme-primary-rgb),0.2)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-theme-gradient flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">
                {resetMethod === 'email' ? 'Email Verification' : 'Phone Verification'}
              </h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm ml-11">
              {resetMethod === 'email' 
                ? 'Enter your registered email address to receive password reset instructions'
                : 'Enter your registered phone number to receive password reset instructions'
              }
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <GlassInput
                  type={resetMethod === 'email' ? 'email' : 'tel'}
                  placeholder={getPlaceholder()}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <GlassButton
                onClick={() => router.back()}
                variant="ghost"
                className="flex-1"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </div>
              </GlassButton>
              
              <GlassButton
                onClick={handleSendCode}
                variant="primary"
                className="flex-1"
                disabled={!contact || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Send Code
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}