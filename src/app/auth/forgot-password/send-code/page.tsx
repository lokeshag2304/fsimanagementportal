// app/auth/forgot-password/send-code/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassInput } from "@/components/glass/glass-input"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/useToast"
import { Mail, Phone, MessageCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { authApi } from "@/components/shared/api"

export default function SendCodePage() {
  const [resetMethod, setResetMethod] = useState<'email' | 'sms' | 'whatsapp' | null>(null)
  const [contact, setContact] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Get reset method from localStorage
    const method = localStorage.getItem('reset_method') as 'email' | 'sms' | 'whatsapp' | null
    if (method) {
      setResetMethod(method)
    } else {
      router.push('/auth/forgot-password')
    }
  }, [router])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePhone = (phone: string) => {
    const re = /^\+?[\d\s-]{10,}$/
    return re.test(phone)
  }

  const handleSendCode = async () => {
    if (!resetMethod || !contact) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your contact information"
      })
      return
    }

    // Validation
    if (resetMethod === 'email' && !validateEmail(contact)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address"
      })
      return
    }

    if ((resetMethod === 'sms' || resetMethod === 'whatsapp') && !validatePhone(contact)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid phone number"
      })
      return
    }

    setIsLoading(true)

    try {
      if (resetMethod === 'email') {
        // Send reset link via email
        const response = await authApi.sendResetLink(contact)
        
        if (response.status) {
          toast({
            variant: "success",
            title: "Success",
            description: response.message || "Password reset link has been sent to your email"
          })
          
          // Store reset data
          if (response.data?.token) {
            localStorage.setItem('reset_token', response.data.token)
            localStorage.setItem('reset_email', contact)
          }
          
          // Clear method and contact
          localStorage.removeItem('reset_method')
          localStorage.removeItem('reset_contact')
          
          // Redirect to login page
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to send reset link"
          })
        }
      } else if (resetMethod === 'sms') {
        // Send SMS OTP
        const response = await authApi.sendSmsOtp(contact, '91')
        
        if (response.status && response.Data?.id) {
          toast({
            variant: "success",
            title: "Success",
            description: response.message || "OTP sent to your phone via SMS"
          })
          
          // Store data for OTP verification
          localStorage.setItem('forgot_user_id', response.Data.id.toString())
          localStorage.setItem('forgot_method', 'sms')
          localStorage.setItem('reset_contact', contact)
          localStorage.setItem('forgot_password_flow', 'true')
          
          // Clear method
          localStorage.removeItem('reset_method')
          
          // Redirect to OTP verification page
          setTimeout(() => {
            router.push('/auth/verify-otp')
          }, 1500)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to send SMS OTP"
          })
        }
      } else if (resetMethod === 'whatsapp') {
        // Send WhatsApp OTP
        const response = await authApi.sendWhatsappOtp(contact, '91')
        
        if (response.status && response.Data?.id) {
          toast({
            variant: "success",
            title: "Success",
            description: response.message || "OTP sent to your WhatsApp"
          })
          
          // Store data for OTP verification
          localStorage.setItem('forgot_user_id', response.Data.id.toString())
          localStorage.setItem('forgot_method', 'whatsapp')
          localStorage.setItem('reset_contact', contact)
          localStorage.setItem('forgot_password_flow', 'true')
          
          // Clear method
          localStorage.removeItem('reset_method')
          
          // Redirect to OTP verification page
          setTimeout(() => {
            router.push('/auth/verify-otp')
          }, 1500)
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to send WhatsApp OTP"
          })
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification code"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPlaceholder = () => {
    switch (resetMethod) {
      case 'email': return 'example@email.com'
      case 'sms': return '+91 98765 43210'
      case 'whatsapp': return '+91 98765 43210'
      default: return ''
    }
  }

  const getIcon = () => {
    switch (resetMethod) {
      case 'email': return Mail
      case 'sms': return Phone
      case 'whatsapp': return MessageCircle
      default: return Mail
    }
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
              : 'Enter your phone number to receive verification code'
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
                {resetMethod === 'email' ? 'Email Verification' : 
                 resetMethod === 'sms' ? 'SMS Verification' : 
                 'WhatsApp Verification'}
              </h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm ml-11">
              {resetMethod === 'email' 
                ? 'Enter your registered email address to receive password reset instructions'
                : resetMethod === 'sms'
                ? 'Enter your registered phone number to receive verification code via SMS'
                : 'Enter your registered phone number to receive verification code via WhatsApp'
              }
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="relative">
                {/* <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" /> */}
                <GlassInput
                  type={resetMethod === 'email' ? 'email' : 'tel'}
                  placeholder={getPlaceholder()}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className=""
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <GlassButton
                onClick={() => router.back()}
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
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
                    {resetMethod === 'email' ? 'Send Link' : 'Send Code'}
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