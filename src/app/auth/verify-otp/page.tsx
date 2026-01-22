"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [timer, setTimer] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { authData, verifyOTP, sendOTP } = useAuth()

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")
    
    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 4) {
      setError("Please enter complete OTP")
      return
    }
    
    setIsLoading(true)
    
    setTimeout(() => {
      const isValid = verifyOTP(otpCode)
      setIsLoading(false)
      
      if (isValid) {
        // Check if this is password reset flow
        const cookies = document.cookie.split(';')
        const resetContact = cookies.find(cookie => cookie.trim().startsWith('reset_contact='))
        
        if (resetContact) {
          // Redirect to change password page for password reset flow
          router.push('/auth/change-password')
        } else {
          // Normal login flow
          router.push('/')
        }
      } else {
        setError("Invalid OTP. Please try again.")
        setOtp(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    }, 1000)
  }

  const handleResend = () => {
    if (!authData || timer > 0) return
    
    sendOTP(authData.method, authData.contact, authData.email)
    setTimer(60)
    setError("")
    setOtp(['', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  const getMethodText = () => {
    if (!authData) return ""
    switch (authData.method) {
      case 'email': return 'email'
      case 'phone': return 'phone number'
      case 'whatsapp': return 'WhatsApp'
      default: return 'selected method'
    }
  }

  if (!authData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <GlassCard className="p-6 w-full max-w-md">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--theme-gradient-from)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">Loading verification data...</p>
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Enter OTP</h1>
          <p className="text-[var(--text-muted)]">
            We've sent a 4-digit OTP to your {getMethodText()}
          </p>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">{authData.contact}</p>
        </div>

        <GlassCard className="p-6">
          {/* OTP Input */}
          <div className="flex gap-3 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-xl font-bold rounded-xl glass-input border-[rgba(255,255,255,var(--glass-border-opacity))] text-[var(--text-primary)] focus:border-[var(--theme-gradient-from)]"
              />
            ))}
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <GlassButton
              onClick={() => router.back()}
              variant="secondary"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </GlassButton>
            <GlassButton
              onClick={handleVerify}
              variant="primary"
              className="flex-1"
              disabled={isLoading || otp.join('').length !== 4}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                "Continue"
              )}
            </GlassButton>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-[var(--text-muted)] text-sm">
                Resend OTP in {timer}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-theme text-sm hover:underline flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Resend OTP
              </button>
            )}
          </div>
        </GlassCard>


      </div>
    </div>
  )
}