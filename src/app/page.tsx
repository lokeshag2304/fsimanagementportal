"use client"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Dashboard() {
  const {user, getToken} = useAuth()
   const router = useRouter()
 
  useEffect(() => {
    if(getToken() === null) {
      router.push('/auth/login')
    }
    if(user) {
      router.push(`/${user?.role}/dashboard`)
    }
  }, [user])


  return (
    <div className="min-h-screen pb-8">

    </div>
  )
}
