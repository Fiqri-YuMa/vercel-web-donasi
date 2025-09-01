"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DistributionRequest {
  id: string
  recipient_name: string
  recipient_address: string
  incident_description: string
  status: string
  created_at: string
  approved_at: string | null
  distributed_at: string | null
  rejection_reason: string | null
  distribution_request_items: {
    requested_quantity: number
    approved_quantity: number | null
    inventory: {
      item_name: string
      unit: string
    }
  }[]
}

export function DistributionRequestList() {
  const [requests, setRequests] = useState<DistributionRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user.data.user) return

    const { data, error } = await supabase
      .from("distribution_requests")
      .select(`
        *,
        distribution_request_items (
          requested_quantity,
          approved_quantity,
          inventory (
            item_name,
            unit
          )
        )
      `)
      .eq("requested_by", user.data.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching requests:", error)
      return
    }

    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Menunggu Persetujuan", variant: "secondary" as const },
      approved: { label: "Disetujui", variant: "default" as const },
      distributed: { label: "Terdistribusi", variant: "default" as const },
      rejected: { label: "Ditolak", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="text-center py-8">Memuat riwayat request...</div>
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Belum ada request distribusi yang dibuat</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{request.recipient_name}</CardTitle>
                <p className="text-sm text-muted-foreground">Dibuat: {formatDate(request.created_at)}</p>
              </div>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Alamat Penerima:</p>
              <p className="text-sm text-muted-foreground">{request.recipient_address}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Deskripsi Kejadian:</p>
              <p className="text-sm text-muted-foreground">{request.incident_description}</p>
            </div>

            <div>
              <p className="text-sm font-medium">Barang yang Diminta:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                {request.distribution_request_items.map((item, index) => (
                  <div key={index} className="text-sm bg-muted p-2 rounded flex justify-between">
                    <span className="font-medium">{item.inventory.item_name}</span>
                    <span className="text-muted-foreground">
                      {request.status === "approved" || request.status === "distributed"
                        ? `${item.approved_quantity || item.requested_quantity} ${item.inventory.unit}`
                        : `${item.requested_quantity} ${item.inventory.unit}`}
                      {request.status === "approved" && item.approved_quantity !== item.requested_quantity && (
                        <span className="text-xs text-yellow-600 ml-1">(diminta: {item.requested_quantity})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {request.status === "approved" && request.approved_at && (
              <div className="text-sm">
                <span className="font-medium text-green-600">Disetujui pada:</span>{" "}
                <span className="text-muted-foreground">{formatDate(request.approved_at)}</span>
              </div>
            )}

            {request.status === "distributed" && request.distributed_at && (
              <div className="text-sm">
                <span className="font-medium text-blue-600">Terdistribusi pada:</span>{" "}
                <span className="text-muted-foreground">{formatDate(request.distributed_at)}</span>
              </div>
            )}

            {request.status === "rejected" && request.rejection_reason && (
              <div className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                <span className="font-medium text-red-600">Alasan Penolakan:</span>{" "}
                <span className="text-red-700">{request.rejection_reason}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
