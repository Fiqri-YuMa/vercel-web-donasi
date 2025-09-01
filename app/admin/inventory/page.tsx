import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InventoryManagement } from "@/components/inventory-management"

export default async function AdminInventoryPage() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Manajemen Inventory</h1>
        <p className="text-muted-foreground">Kelola stok barang dan inventory gudang PMI</p>
      </div>

      <InventoryManagement />
    </div>
  )
}
