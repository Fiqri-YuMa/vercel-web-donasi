import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportingDashboard } from "@/components/reporting-dashboard"

export default async function AdminReportsPage() {
  const supabase = await createClient()

  // Check if user is authenticated and is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Laporan & Analisis</h1>
        <p className="text-muted-foreground">Dashboard laporan lengkap PMI Kabupaten Cianjur</p>
      </div>

      <ReportingDashboard />
    </div>
  )
}
