// app/auth/login/page.tsx
"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/glass/glass-card"
import { GlassInput } from "@/components/glass/glass-input"
import { GlassButton } from "@/components/glass/glass-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { authApi } from "@/components/shared/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, setAuthData } = useAuth()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (token && role && role !== 'undefined' && role !== 'null') {
      router.push(`/${role}/dashboard`);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!email.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      })
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address"
      })
      return
    }

    setIsLoading(true)

    try {
      // Call login API directly
      const response = await authApi.login(email, password)

      if (response.status) {
        // Store user data temporarily for 2FA flow
        const userData = {
          id: response.admin_id,
          email: email,
          name: response.name,
          profile: response.profile,
          role: response.role,
          login_type: response.login_type,
          company_id: response.company_id,
          logo: response.logo,
          favicon: response.favicon,
          modules: response.modules,
          subadmin_id: response?.subadmin_id,
          whatsapp_status: response.whatsapp_status,
          email_status: response.email_status,
          sms_status: response.sms_status
        }

        localStorage.setItem('temp_user_data', JSON.stringify(userData))

        // Check how many 2FA methods are active
        const activeMethods = [
          response.email_status === 1 ? 'email' : null,
          response.whatsapp_status === 1 ? 'whatsapp' : null,
          response.sms_status === 1 ? 'sms' : null
        ].filter(Boolean)

        if (activeMethods.length === 1) {
          // Only one method active, send OTP directly
          try {
            const otpResponse = await authApi.sendOtp(
              response.admin_id,
              activeMethods[0] as 'email' | 'sms' | 'whatsapp',
              email
            )

            if (otpResponse.status) {
              toast({
                variant: "success",
                title: "Success",
                description: otpResponse.message || `OTP sent to your ${activeMethods[0]}`
              })

              // Clear any leftover forgot password states
              localStorage.removeItem('forgot_password_flow')
              localStorage.removeItem('forgot_user_id')
              localStorage.removeItem('forgot_method')
              localStorage.removeItem('reset_contact')

              // Store data for verification page
              localStorage.setItem('otp_user_id', response.admin_id.toString())
              localStorage.setItem('otp_method', activeMethods[0] as string)
              localStorage.setItem('user_email', email)

              // Redirect to verify OTP page
              setTimeout(() => {
                router.push('/auth/verify-otp')
              }, 500)
            } else {
              toast({
                variant: "destructive",
                title: "Error",
                description: otpResponse.message || "Failed to send OTP"
              })
            }
          } catch (error: any) {
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message || "Failed to send OTP"
            })
          }
        } else if (activeMethods.length > 1) {
          // Multiple methods active, go to selection page

          // Clear any leftover forgot password states
          localStorage.removeItem('forgot_password_flow')
          localStorage.removeItem('forgot_user_id')
          localStorage.removeItem('forgot_method')
          localStorage.removeItem('reset_contact')

          localStorage.setItem('otp_user_id', response.admin_id.toString())
          localStorage.setItem('user_email', email)
          router.push('/auth/select-method')
        } else {
          // No 2FA enabled, complete login immediately
          setAuthData(userData as any, response.token || '')
          localStorage.setItem('token', response.token || '')

          // Redirect to correct role dashboard
          const roleMap: Record<number, string> = { 1: 'SuperAdmin', 2: 'UserAdmin', 3: 'ClientAdmin' };
          const roleName = roleMap[response.login_type] || '';
          if (roleName) localStorage.setItem('role', roleName);

          setTimeout(() => {
            switch (response.login_type) {
              case 1:
                router.push('/SuperAdmin/dashboard');
                break;
              case 2:
                router.push('/UserAdmin/dashboard');
                break;
              case 3:
                router.push('/client/dashboard');
                break;
              default:
                router.push('/');
            }
          }, 1000);

          toast({
            variant: "success",
            title: "Success",
            description: "Login successful!"
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Login failed"
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during login"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Sign In</h1>
          <p className="text-[var(--text-muted)]">Enter your email and password to sign in!</p>
        </div>

        {/* Login Form */}
        <GlassCard className="p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Email</label>
              <div className="relative">
                {/* <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" /> */}
                <GlassInput
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className=""
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[var(--text-tertiary)] text-sm mb-2">Password</label>
              <div className="relative">
                {/* <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" /> */}
                <GlassInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className=""
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--glass-border-opacity)] bg-transparent"
                  disabled={isLoading}
                />
                <span className="text-[var(--text-tertiary)] text-sm">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-theme text-sm hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <GlassButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}