// app/auth/change-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassButton } from "@/components/glass/glass-button"
import { GlassInput } from "@/components/glass/glass-input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import { authApi } from "@/components/shared/api"

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
const params = useParams()

const token = Array.isArray(params.token)
  ? params.token[0]
  : params.token

useEffect(() => {
  const userIdFromStorage = localStorage.getItem('forgot_user_id')
  const email = localStorage.getItem('reset_email')

  if (userIdFromStorage) setUserId(userIdFromStorage)
  if (email) setResetEmail(email)

  if (!token) {
    router.replace('/auth/login')
  }
}, [token, router])


  useEffect(() => {
    // Calculate password strength
    let strength = 0
    if (newPassword.length >= 8) strength += 1
    if (/[A-Z]/.test(newPassword)) strength += 1
    if (/[a-z]/.test(newPassword)) strength += 1
    if (/[0-9]/.test(newPassword)) strength += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1
    
    setPasswordStrength(strength)
  }, [newPassword])

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number"
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character"
    }
    return ""
  }

  const handleChangePassword = async () => {
    setError("")
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }
    
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
  
    
    setIsLoading(true)
    
    try {
      let response;
      
      if (userId && token) {
        // For phone/WhatsApp flow (has user ID)
        response = await authApi.resetPasswordWithId(userId, token, newPassword)
      } else {
        // For email flow (only has token)
        response = await authApi.resetPassword(token, newPassword)
      }
      
      if (response.status) {
        setShowSuccessMessage(true)
        toast({
          variant: "success",
          title: "Success",
          description: response.message || "Password changed successfully!"
        })
        
        // Clear all reset data
        localStorage.removeItem('reset_token')
        localStorage.removeItem('reset_email')
        localStorage.removeItem('forgot_password_flow')
        localStorage.removeItem('reset_method')
        localStorage.removeItem('reset_contact')
        localStorage.removeItem('forgot_user_id')
        localStorage.removeItem('forgot_method')
        
        // Redirect to login page with success message
        setTimeout(() => {
          router.push('/auth/login?reset=success')
        }, 1500)
      } else {
        setError(response.message || "Failed to reset password")
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to reset password"
        })
      }
    } catch (error: any) {
      setError(error.message || "An error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred"
      })
    } finally {
      setIsLoading(false)
      setShowSuccessMessage(false)
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500"
    if (passwordStrength <= 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength <= 1) return "Weak"
    if (passwordStrength <= 3) return "Medium"
    return "Strong"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-theme-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {resetEmail ? `Reset Password for ${resetEmail}` : 'Change Password'}
          </h1>
          <p className="text-[var(--text-muted)]">Enter your new password</p>
        </div>

        <GlassCard className="p-6">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm">Password reset successful! You can now login with your new password.</p>
            </div>
          )}

          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                New Password
              </label>
              <div className="relative">
                <GlassInput
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-muted)]">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength <= 1 ? 'text-red-500' :
                      passwordStrength <= 3 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <GlassInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center mt-4">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <GlassButton
              onClick={() => router.push('/auth/login')}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleChangePassword}
              variant="primary"
              className="flex-1"
              disabled={isLoading || !newPassword || !confirmPassword || passwordStrength < 3}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Changing...
                </div>
              ) : (
                "Change Password"
              )}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}