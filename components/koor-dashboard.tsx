"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryView } from "@/components/inventory-view"
import { DistributionRequestForm } from "@/components/distribution-request-form"
import { DistributionRequestList } from "@/components/distribution-request-list"
import { Package, FileText, Clock, CheckCircle } from "lucide-react"

interface Stats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  distributedRequests: number
}

export function KoorDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    distributedRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user.data.user) return

    const { data: requests } = await supabase
      .from("distribution_requests")
      .select("status")
      .eq("requested_by", user.data.user.id)

    if (requests) {
      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter((r) => r.status === "pending").length,
        approvedRequests: requests.filter((r) => r.status === "approved").length,
        distributedRequests: requests.filter((r) => r.status === "distributed").length,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Memuat dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Request</p>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Terdistribusi</p>
                <p className="text-2xl font-bold text-blue-600">{stats.distributedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Lihat Inventory</TabsTrigger>
          <TabsTrigger value="request">Buat Request</TabsTrigger>
          <TabsTrigger value="history">Riwayat Request</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Gudang</CardTitle>
              <CardDescription>Daftar barang yang tersedia di gudang PMI</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request">
          <Card>
            <CardHeader>
              <CardTitle>Buat Request Distribusi</CardTitle>
              <CardDescription>Ajukan permintaan distribusi bantuan untuk penerima</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionRequestForm onSuccess={fetchStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Request</CardTitle>
              <CardDescription>Daftar semua request distribusi yang pernah dibuat</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionRequestList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
