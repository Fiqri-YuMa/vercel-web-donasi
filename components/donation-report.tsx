"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DonationData {
  id: string
  donor_name: string
  donation_type: string
  amount: number | null
  item_name: string | null
  quantity: number | null
  unit: string | null
  status: string
  created_at: string
  categories: {
    name: string
  }
}

export function DonationReport() {
  const [donations, setDonations] = useState<DonationData[]>([])
  const [filteredDonations, setFilteredDonations] = useState<DonationData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const fetchDonations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching donations:", error)
      return
    }

    setDonations(data || [])
    setFilteredDonations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDonations()
  }, [])

  useEffect(() => {
    let filtered = donations

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((d) => d.donation_type === typeFilter)
    }

    setFilteredDonations(filtered)
  }, [donations, statusFilter, typeFilter])

  const exportDonationReport = () => {
    // This would generate a PDF report of donations
    alert("Export laporan donasi (PDF) akan segera tersedia")
  }

  if (loading) {
    return <div className="text-center py-4">Memuat data donasi...</div>
  }

  const totalValue = filteredDonations
    .filter((d) => d.donation_type === "uang" && d.status === "approved")
    .reduce((sum, d) => sum + (d.amount || 0), 0)

  const approvedCount = filteredDonations.filter((d) => d.status === "approved").length
  const pendingCount = filteredDonations.filter((d) => d.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{filteredDonations.length}</p>
              <p className="text-sm text-muted-foreground">Total Donasi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Terverifikasi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-muted-foreground">Total Nilai Uang</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Terverifikasi</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="uang">Uang</SelectItem>
              <SelectItem value="barang">Barang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportDonationReport} variant="outline" className="flex items-center gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Donations Table */}
      <div className="space-y-4">
        {filteredDonations.map((donation) => (
          <Card key={donation.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{donation.donor_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{donation.categories?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      donation.status === "approved"
                        ? "default"
                        : donation.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {donation.status === "approved"
                      ? "Terverifikasi"
                      : donation.status === "pending"
                        ? "Pending"
                        : "Ditolak"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {donation.donation_type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Nilai/Jumlah:</p>
                  <p className="text-muted-foreground">
                    {donation.donation_type === "uang"
                      ? formatCurrency(donation.amount || 0)
                      : `${donation.quantity} ${donation.unit}`}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Tanggal:</p>
                  <p className="text-muted-foreground">{new Date(donation.created_at).toLocaleDateString("id-ID")}</p>
                </div>
                {donation.donation_type === "barang" && (
                  <div>
                    <p className="font-medium">Item:</p>
                    <p className="text-muted-foreground">{donation.item_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDonations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada data donasi yang sesuai filter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
