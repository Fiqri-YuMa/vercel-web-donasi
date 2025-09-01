import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KoorDashboard } from "@/components/koor-dashboard"

export default async function KoorDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated and is koor
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()

  if (profile?.role !== "koor") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Koordinator</h1>
        <p className="text-muted-foreground">Selamat datang, {profile.full_name}</p>
      </div>

      <KoorDashboard />
    </div>
  )
}
