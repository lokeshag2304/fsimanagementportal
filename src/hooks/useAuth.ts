import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthData {
  email: string
  method: 'email' | 'phone' | 'whatsapp'
  contact: string
}

export function useAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const router = useRouter()

  // Set auth data in cookies
  const setAuthCookie = (data: AuthData) => {
    document.cookie = `auth_data=${JSON.stringify(data)}; path=/; max-age=600` // 10 minutes
    setAuthData(data)
  }

  // Get auth data from cookies
  const getAuthCookie = (): AuthData | null => {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_data='))
    if (authCookie) {
      try {
        const data = JSON.parse(authCookie.split('=')[1])
        return data
      } catch {
        return null
      }
    }
    return null
  }

  // Clear auth cookies
  const clearAuthCookie = () => {
    document.cookie = 'auth_data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    setAuthData(null)
  }

  // Generate OTP
  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  // Send OTP
  const sendOTP = (method: 'email' | 'phone' | 'whatsapp', contact: string, email: string) => {
    const otp = generateOTP()
    // Store OTP in cookie for verification
    document.cookie = `otp_code=${otp}; path=/; max-age=300` // 5 minutes
    
    const authData: AuthData = { email, method, contact }
    setAuthCookie(authData)
    
    console.log(`OTP sent to ${contact} via ${method}: ${otp}`) // For demo
    return otp
  }

  // Verify OTP
  const verifyOTP = (inputOTP: string): boolean => {
    const cookies = document.cookie.split(';')
    const otpCookie = cookies.find(cookie => cookie.trim().startsWith('otp_code='))
    
    if (otpCookie) {
      const storedOTP = otpCookie.split('=')[1]
      if (storedOTP === inputOTP) {
        // Clear OTP cookie after successful verification
        document.cookie = 'otp_code=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        clearAuthCookie()
        return true
      }
    }
    return false
  }

  // Load auth data on mount
  useEffect(() => {
    const data = getAuthCookie()
    if (data) {
      setAuthData(data)
    }
  }, [])

  return {
    authData,
    sendOTP,
    verifyOTP,
    clearAuthCookie,
    setAuthCookie
  }
}