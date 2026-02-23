"use client"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Dashboard() {
  const { user, getToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (role && role !== 'undefined' && role !== 'null') {
      router.push(`/${role}/dashboard`);
    }
  }, []);


  return (
    <div className="min-h-screen pb-8">

    </div>
  )
}
