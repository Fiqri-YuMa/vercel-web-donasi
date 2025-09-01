"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Download, TrendingUp, TrendingDown, Package, FileText } from "lucide-react"
import { DonationReport } from "@/components/donation-report"
import { DistributionReport } from "@/components/distribution-report"
import { InventoryReport } from "@/components/inventory-report"

interface ReportStats {
  totalDonations: number
  totalDonationValue: number
  totalDistributions: number
  totalInventoryItems: number
  pendingDonations: number
  pendingDistributions: number
  lowStockItems: number
}

export function ReportingDashboard() {
  const [stats, setStats] = useState<ReportStats>({
    totalDonations: 0,
    totalDonationValue: 0,
    totalDistributions: 0,
    totalInventoryItems: 0,
    pendingDonations: 0,
    pendingDistributions: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    const supabase = createClient()

    try {
      // Fetch donation stats
      const { data: donations } = await supabase.from("donations").select("status, amount, donation_type")

      // Fetch distribution stats
      const { data: distributions } = await supabase.from("distribution_requests").select("status")

      // Fetch inventory stats
      const { data: inventory } = await supabase.from("inventory").select("current_stock")

      if (donations) {
        const approvedDonations = donations.filter((d) => d.status === "approved")
        const totalValue = approvedDonations
          .filter((d) => d.donation_type === "uang")
          .reduce((sum, d) => sum + (d.amount || 0), 0)

        setStats((prev) => ({
          ...prev,
          totalDonations: approvedDonations.length,
          totalDonationValue: totalValue,
          pendingDonations: donations.filter((d) => d.status === "pending").length,
        }))
      }

      if (distributions) {
        setStats((prev) => ({
          ...prev,
          totalDistributions: distributions.filter((d) => d.status === "distributed").length,
          pendingDistributions: distributions.filter((d) => d.status === "pending").length,
        }))
      }

      if (inventory) {
        setStats((prev) => ({
          ...prev,
          totalInventoryItems: inventory.length,
          lowStockItems: inventory.filter((i) => i.current_stock <= 5).length,
        }))
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const generateFullReport = async () => {
    // This would generate a comprehensive PDF report
    // For now, we'll show a placeholder
    alert("Fitur export PDF akan segera tersedia")
  }

  if (loading) {
    return <div className="text-center py-8">Memuat data laporan...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Donasi</p>
                <p className="text-2xl font-bold">{stats.totalDonations}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalDonationValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Distribusi</p>
                <p className="text-2xl font-bold">{stats.totalDistributions}</p>
                <p className="text-xs text-muted-foreground">Bantuan tersalurkan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingDonations + stats.pendingDistributions}
                </p>
                <p className="text-xs text-muted-foreground">Perlu tindakan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Stok Rendah</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
                <p className="text-xs text-muted-foreground">Item perlu diisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={generateFullReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Laporan Lengkap (PDF)
        </Button>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="donations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="donations">Laporan Donasi</TabsTrigger>
          <TabsTrigger value="distributions">Laporan Distribusi</TabsTrigger>
          <TabsTrigger value="inventory">Laporan Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Donasi Masuk</CardTitle>
              <CardDescription>Analisis donasi yang diterima PMI Kabupaten Cianjur</CardDescription>
            </CardHeader>
            <CardContent>
              <DonationReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Bantuan Keluar</CardTitle>
              <CardDescription>Analisis distribusi bantuan kepada masyarakat</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Stok Tersedia</CardTitle>
              <CardDescription>Status inventory dan ketersediaan barang di gudang</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryReport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
