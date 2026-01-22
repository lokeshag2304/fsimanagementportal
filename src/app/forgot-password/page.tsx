"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Mail, Phone, ArrowRight, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone' | null>(null)
  const router = useRouter()

  const handleContinue = () => {
    if (!selectedMethod) return
    
    // Store selected method in cookie
    document.cookie = `reset_method=${selectedMethod}; path=/; max-age=600`
    router.push('/forgot-password/send-code')
  }

  const methods = [
    {
      id: 'email' as const,
      icon: Mail,
      title: 'Reset via Email',
      description: "We'll send a password reset link to your registered email address"
    },
    {
      id: 'phone' as const,
      icon: Phone,
      title: 'Reset via Phone',
      description: 'Receive a verification code via SMS or WhatsApp to reset your password'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Forgot Password?</h1>
          <p className="text-[var(--text-muted)]">Choose how you'd like to reset your password</p>
        </div>

        <GlassCard className="p-6">
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
                      : 'rounded-2xl border-gray-200  hover:border-[rgba(89,18,18,0.3)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedMethod === method.id
                        ? 'bg-theme-gradient'
                        : 'bg-[rgba(255,255,255,var(--ui-opacity-10))]'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        selectedMethod === method.id ? 'text-white' : 'text-[var(--text-muted)]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">{method.title}</h3>
                      <p className="text-[var(--text-muted)] text-sm leading-relaxed">{method.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ${
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

          
          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <GlassButton
              onClick={() => router.push('/login')}
              variant="ghost"
              className="flex-1"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </div>
            </GlassButton>
            
            <GlassButton
              onClick={handleContinue}
              variant="primary"
              className="flex-1"
              disabled={!selectedMethod}
            >
              <div className="flex items-center gap-2">
                Continue
                <ArrowRight className="w-4 h-4" />
              </div>
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}