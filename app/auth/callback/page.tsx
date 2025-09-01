"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/login?error=callback_error")
        return
      }

      if (data.session) {
        // Get user profile to determine redirect
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single()

        if (profile?.role === "admin") {
          router.push("/admin/dashboard")
        } else if (profile?.role === "koor") {
          router.push("/koor/dashboard")
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/auth/login")
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Memproses autentikasi...</p>
      </div>
    </div>
  )
}
