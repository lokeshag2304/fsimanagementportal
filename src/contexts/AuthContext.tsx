// contexts/AuthContext.tsx
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { authApi } from '@/components/shared/api'

interface User {
  id: number
  email: string
  name: string
  profile: string
  role: string
  login_type: number
  company_id?: number
  logo?: string
  favicon?: string
  modules?: any[]
  subadmin_id?: number
  whatsapp_status: number
  email_status: number
  sms_status: number
  token?: string // Token को user ऑब्जेक्ट में भी शामिल करें
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  sendOtp: (userId: number, method: 'email' | 'sms' | 'whatsapp', contact?: string) => Promise<any>
  verifyOtp: (otp: string, method: 'email' | 'sms' | 'whatsapp', userId: number) => Promise<any>
  sendResetLink: (email: string) => Promise<any>
  resetPassword: (token: string, newPassword: string) => Promise<any>
  setForgotPasswordData: (contact: string, method: 'email' | 'phone') => void
  setAuthData: (userData: User, token: string) => void
  getToken: () => string | null // Token प्राप्त करने के लिए नया function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('user')
        const token = localStorage.getItem('authToken')
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          // Token को user ऑब्जेक्ट में भी शामिल करें
          if (token) {
            parsedUser.token = token
          }
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Set auth data after login/OTP verification
  const setAuthData = (userData: User, token: string) => {
    // Token को user ऑब्जेक्ट में शामिल करें
    const userWithToken = { ...userData, token }
    
    setUser(userWithToken)
    localStorage.setItem('user', JSON.stringify(userWithToken))
    localStorage.setItem('authToken', token)
    
    // Set modules and subadmin_id if available
    if (userData.modules) {
      localStorage.setItem('modules', JSON.stringify(userData.modules))
    }
    if (userData.subadmin_id) {
      localStorage.setItem('subadmin_id', userData.subadmin_id.toString())
    }
  }

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  // Token प्राप्त करने के लिए function
  const getToken = () => {
    return localStorage.getItem('authToken')
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      return response
    } catch (error: any) {
      throw error
    }
  }

  // Send OTP
  const sendOtp = async (userId: number, method: 'email' | 'sms' | 'whatsapp', contact?: string) => {
    try {
      const response = await authApi.sendOtp(userId, method, contact)
      return response
    } catch (error: any) {
      throw error
    }
  }

  // Verify OTP
  const verifyOtp = async (otp: string, method: 'email' | 'sms' | 'whatsapp', userId: number) => {
    try {
      const response = await authApi.verifyOtp(otp, method, userId)
      
      if (response.status && response.route_access_token && response.Data) {
        const apiUser = response.Data

        const userData: User = {
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          profile: apiUser.profile,
          login_type: apiUser.login_type,
          role: apiUser.login_type === 1
            ? 'superadmin'
            : apiUser.login_type === 2
            ? 'useradmin'
            : 'clientadmin',
          whatsapp_status: 1,
          email_status: 1,
          sms_status: 1,
          subadmin_id: apiUser.subadmin_id ?? undefined,
        }

        setAuthData(userData, response.route_access_token)
      }
      
      return response
    } catch (error: any) {
      throw error
    }
  }

  // Send reset link
  const sendResetLink = async (email: string) => {
    try {
      const response = await authApi.sendResetLink(email)
      return response
    } catch (error: any) {
      throw error
    }
  }

  // Reset password
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await authApi.resetPassword({ 
        id: '', 
        token, 
        newPassword 
      })
      return response
    } catch (error: any) {
      throw error
    }
  }

  const setForgotPasswordData = (contact: string, method: 'email' | 'phone') => {
    // Store in localStorage for forgot password flow
    localStorage.setItem('reset_method', method)
    localStorage.setItem('reset_contact', contact)
  }

  const redirectBasedOnLoginType = (loginType: number) => {
    switch (loginType) {
      case 1:
        router.push('/SuperAdmin/dashboard')
        break
      case 2:
        router.push('/UserAdmin/dashboard')
        break
      case 3:
        router.push('/ClientAdmin/dashboard')
        break
      default:
        router.push('/')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    localStorage.removeItem('modules')
    localStorage.removeItem('subadmin_id')
    localStorage.removeItem('temp_user_data')
    router.push('/auth/login')
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    sendOtp,
    verifyOtp,
    sendResetLink,
    resetPassword,
    setForgotPasswordData,
    setAuthData,
    getToken // नया function जोड़ें
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}




// // contexts/AuthContext.tsx
// "use client"

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// import { useRouter } from 'next/navigation'
// import { useToast } from '@/hooks/useToast'
// import { authApi } from '@/components/shared/api'

// interface User {
//   id: number
//   email: string
//   name: string
//   profile: string
//   role: string
//   login_type: number
//   company_id?: number
//   logo?: string
//   favicon?: string
//   modules?: any[]
//   subadmin_id?: number
//   whatsapp_status: number
//   email_status: number
//   sms_status: number
// }

// interface AuthContextType {
//   user: User | null
//   isAuthenticated: boolean
//   isLoading: boolean
//   login: (email: string, password: string) => Promise<any>
//   logout: () => void
//   updateUser: (userData: Partial<User>) => void
//   sendOtp: (userId: number, method: 'email' | 'sms' | 'whatsapp', contact?: string) => Promise<any>
//   verifyOtp: (otp: string, method: 'email' | 'sms' | 'whatsapp', userId: number) => Promise<any>
//   sendResetLink: (email: string) => Promise<any>
//   resetPassword: (token: string, newPassword: string) => Promise<any>
//   setForgotPasswordData: (contact: string, method: 'email' | 'phone') => void
//   setAuthData: (userData: User, token: string) => void
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const router = useRouter()
//   const { toast } = useToast()
// console.log("userrrrrrrrrrr", user )
//   // Initialize auth state
//   useEffect(() => {
//     const initAuth = () => {
//       try {
//         const savedUser = localStorage.getItem('user')
//         if (savedUser) {
//           setUser(JSON.parse(savedUser))
//         }
//       } catch (error) {
//         console.error('Error initializing auth:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     initAuth()
//   }, [])

//   // Set auth data after login/OTP verification
//   const setAuthData = (userData: User, token: string) => {
//     console.log("setAuthData", userData, token)
//     setUser(userData)
//     localStorage.setItem('user', JSON.stringify(userData))
//     localStorage.setItem('authToken', token)
    
//     // Set modules and subadmin_id if available
//     if (userData.modules) {
//       localStorage.setItem('modules', JSON.stringify(userData.modules))
//     }
//     if (userData.subadmin_id) {
//       localStorage.setItem('subadmin_id', userData.subadmin_id.toString())
//     }
//   }

//   // Update user data
//   const updateUser = (userData: Partial<User>) => {
//     if (user) {
//       const updatedUser = { ...user, ...userData }
//       setUser(updatedUser)
//       localStorage.setItem('user', JSON.stringify(updatedUser))
//     }
//   }

//   // Login function
//   const login = async (email: string, password: string) => {
//     try {
//       const response = await authApi.login(email, password)
//       return response
//     } catch (error: any) {
//       throw error
//     }
//   }

//   // Send OTP
//   const sendOtp = async (userId: number, method: 'email' | 'sms' | 'whatsapp', contact?: string) => {
//     try {
//       const response = await authApi.sendOtp(userId, method, contact)
//       return response
//     } catch (error: any) {
//       throw error
//     }
//   }

//   // Verify OTP
//   const verifyOtp = async (otp: string, method: 'email' | 'sms' | 'whatsapp', userId: number) => {
//     try {
//       const response = await authApi.verifyOtp(otp, method, userId)
      
//       if (response.status && response.route_access_token && response.Data) {
//   const apiUser = response.Data
// console.log("apiUser", apiUser)
//   const userData: User = {
//     id: apiUser.id,
//     name: apiUser.name,
//     email: apiUser.email,
//     profile: apiUser.profile,
//     login_type: apiUser.login_type,
//     role: apiUser.login_type === 1
//       ? 'superadmin'
//       : apiUser.login_type === 2
//       ? 'useradmin'
//       : 'clientadmin',

//     whatsapp_status: 1,
//     email_status: 1,
//     sms_status: 1,
//     subadmin_id: apiUser.subadmin_id ?? undefined,
//   }

//   setAuthData(userData, response.route_access_token)
// }
      
//       return response
//     } catch (error: any) {
//       throw error
//     }
//   }

//   // Send reset link
//   const sendResetLink = async (email: string) => {
//     try {
//       const response = await authApi.sendResetLink(email)
//       return response
//     } catch (error: any) {
//       throw error
//     }
//   }

//   // Reset password
//   const resetPassword = async (token: string, newPassword: string) => {
//     try {
//       const response = await authApi.resetPassword({ 
//         id: '', 
//         token, 
//         newPassword 
//       })
//       return response
//     } catch (error: any) {
//       throw error
//     }
//   }

//   const setForgotPasswordData = (contact: string, method: 'email' | 'phone') => {
//     // Store in localStorage for forgot password flow
//     localStorage.setItem('reset_method', method)
//     localStorage.setItem('reset_contact', contact)
//   }

//   const redirectBasedOnLoginType = (loginType: number) => {
//     switch (loginType) {
//       case 1:
//         router.push('/SuperAdmin/dashboard')
//         break
//       case 2:
//         router.push('/UserAdmin/dashboard')
//         break
//       case 3:
//         router.push('/ClientAdmin/dashboard')
//         break
//       default:
//         router.push('/')

//     }

//   }

//   const logout = () => {
//     setUser(null)
//     localStorage.removeItem('user')
//     localStorage.removeItem('authToken')
//     localStorage.removeItem('modules')
//     localStorage.removeItem('subadmin_id')
//     localStorage.removeItem('temp_user_data')
//     router.push('/auth/login')
//   }

//   const value = {
//     user,
//     isAuthenticated: !!user,
//     isLoading,
//     login,
//     logout,
//     updateUser,
//     sendOtp,
//     verifyOtp,
//     sendResetLink,
//     resetPassword,
//     setForgotPasswordData,setAuthData
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }