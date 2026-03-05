"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

// Client dashboard is the same as the main dashboard page
// which already passes s_id and the backend filters per login_type
export default function ClientDetailsRedirect() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role) {
      router.replace(`/${user.role}/dashboard`)
    }
  }, [user?.role])

  return null
}