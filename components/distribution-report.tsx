"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DistributionData {
  id: string
  recipient_name: string
  recipient_address: string
  incident_description: string
  status: string
  created_at: string
  distributed_at: string | null
  profiles: {
    full_name: string
  }
  distribution_request_items: {
    requested_quantity: number
    approved_quantity: number | null
    inventory: {
      item_name: string
      unit: string
    }
  }[]
}

export function DistributionReport() {
  const [distributions, setDistributions] = useState<DistributionData[]>([])
  const [filteredDistributions, setFilteredDistributions] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchDistributions = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("distribution_requests")
      .select(`
        *,
        profiles!distribution_requests_requested_by_fkey (
          full_name
        ),
        distribution_request_items (
          requested_quantity,
          approved_quantity,
          inventory (
            item_name,
            unit
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching distributions:", error)
      return
    }

    setDistributions(data || [])
    setFilteredDistributions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDistributions()
  }, [])

  useEffect(() => {
    let filtered = distributions

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    setFilteredDistributions(filtered)
  }, [distributions, statusFilter])

  const exportDistributionReport = () => {
    alert("Export laporan distribusi (PDF) akan segera tersedia")
  }

  if (loading) {
    return <div className="text-center py-4">Memuat data distribusi...</div>
  }

  const distributedCount = filteredDistributions.filter((d) => d.status === "distributed").length
  const pendingCount = filteredDistributions.filter((d) => d.status === "pending").length
  const approvedCount = filteredDistributions.filter((d) => d.status === "approved").length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{filteredDistributions.length}</p>
              <p className="text-sm text-muted-foreground">Total Request</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Menunggu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Disetujui</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{distributedCount}</p>
              <p className="text-sm text-muted-foreground">Terdistribusi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="distributed">Terdistribusi</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={exportDistributionReport} variant="outline" className="flex items-center gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Distributions List */}
      <div className="space-y-4">
        {filteredDistributions.map((distribution) => (
          <Card key={distribution.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{distribution.recipient_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Koordinator: {distribution.profiles?.full_name}</p>
                </div>
                <Badge
                  variant={
                    distribution.status === "distributed"
                      ? "default"
                      : distribution.status === "approved"
                        ? "secondary"
                        : distribution.status === "pending"
                          ? "outline"
                          : "destructive"
                  }
                >
                  {distribution.status === "distributed"
                    ? "Terdistribusi"
                    : distribution.status === "approved"
                      ? "Disetujui"
                      : distribution.status === "pending"
                        ? "Pending"
                        : "Ditolak"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Alamat Penerima:</p>
                  <p className="text-sm text-muted-foreground">{distribution.recipient_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Deskripsi Kejadian:</p>
                  <p className="text-sm text-muted-foreground">{distribution.incident_description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Barang yang Diminta:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {distribution.distribution_request_items.map((item, index) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        <span className="font-medium">{item.inventory.item_name}</span>
                        <span className="text-muted-foreground ml-2">
                          {item.approved_quantity || item.requested_quantity} {item.inventory.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    <span className="font-medium">Tanggal Request:</span>{" "}
                    {new Date(distribution.created_at).toLocaleDateString("id-ID")}
                  </span>
                  {distribution.distributed_at && (
                    <span>
                      <span className="font-medium">Tanggal Distribusi:</span>{" "}
                      {new Date(distribution.distributed_at).toLocaleDateString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDistributions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada data distribusi yang sesuai filter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
