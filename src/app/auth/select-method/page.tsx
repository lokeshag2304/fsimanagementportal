// app/auth/select-method/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/useToast"
import { Mail, Phone, MessageCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { authApi } from "@/components/shared/api"

export default function SelectMethodPage() {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms' | 'whatsapp' | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [authData, setAuthData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Get data from localStorage
    const email = localStorage.getItem('user_email')
    const userIdStr = localStorage.getItem('otp_user_id')
    const authDataStr = localStorage.getItem('temp_user_data')
    
    if (email) setUserEmail(email)
    if (userIdStr) setUserId(parseInt(userIdStr))
    if (authDataStr) {
      const data = JSON.parse(authDataStr)
      setAuthData(data)
    }
  }, [])

  const handleMethodSelect = async (method: 'email' | 'sms' | 'whatsapp') => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information not found. Please login again."
      })
      router.push('/auth/login')
      return
    }
    
    setSelectedMethod(method)
    setIsLoading(true)
    
    try {
      const response = await authApi.sendOtp(userId, method, userEmail)
      
      if (response.status) {
        toast({
          variant: "success",
          title: "Success",
          description: response.message || `OTP sent to your ${method}`
        })
        
        // Store method for verification page
        localStorage.setItem('otp_method', method)
        
        // Redirect to verify OTP page
        setTimeout(() => {
          router.push('/auth/verify-otp')
        }, 500)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to send OTP"
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const methods = [
    {
      id: 'email' as const,
      icon: Mail,
      title: 'Email',
      description: 'Send OTP to your email address',
      available: authData?.email_status === 1,
      contact: userEmail
    },
    {
      id: 'sms' as const,
      icon: Phone,
      title: 'SMS',
      description: 'Send OTP via SMS',
      available: authData?.sms_status === 1,
      contact: '+91 XXXXX XXXXX'
    },
    {
      id: 'whatsapp' as const,
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Send OTP via WhatsApp',
      available: authData?.whatsapp_status === 1,
      contact: '+91 XXXXX XXXXX'
    }
  ].filter(method => method.available)

  if (methods.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <GlassCard className="p-6 w-full max-w-md">
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)] mb-4">No 2FA methods available</p>
            <GlassButton onClick={() => router.push('/auth/login')}>
              Back to Login
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    )
  }

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
          {!userEmail || !authData ? (
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
                      onClick={() => !isLoading && setSelectedMethod(method.id)}
                      className={`p-4 border-2 cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'rounded-xl border-[var(--theme-gradient-from)] bg-[rgba(var(--theme-primary-rgb),0.1)]'
                          : 'rounded-2xl border-gray-200 hover:border-[rgba(89,18,18,0.3)]'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </GlassButton>
                <GlassButton
                  onClick={() => selectedMethod && handleMethodSelect(selectedMethod)}
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