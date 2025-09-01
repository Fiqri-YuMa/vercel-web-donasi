"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Donation {
  id: string
  donation_type: string
  donor_name: string
  donor_email: string
  donor_phone: string
  amount?: number
  goods_description?: string
  goods_quantity?: number
  goods_unit?: string
  notes?: string
  status: string
  created_at: string
}

interface DonationListProps {
  donations: Donation[]
}

export function DonationList({ donations }: DonationListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Menunggu", variant: "secondary" as const },
      approved: { label: "Disetujui", variant: "default" as const },
      received: { label: "Diterima", variant: "default" as const },
      rejected: { label: "Ditolak", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Belum ada donasi yang tercatat.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {donations.map((donation) => (
        <Card key={donation.id} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{donation.donor_name}</CardTitle>
              {getStatusBadge(donation.status)}
            </div>
            <p className="text-sm text-muted-foreground">{formatDate(donation.created_at)}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Jenis:</span>
                <Badge variant="outline">{donation.donation_type === "money" ? "Uang" : "Barang"}</Badge>
              </div>

              {donation.donation_type === "money" && donation.amount && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Jumlah:</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(donation.amount)}</span>
                </div>
              )}

              {donation.donation_type === "goods" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Barang:</span>
                    <span className="text-sm text-right max-w-xs">{donation.goods_description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Jumlah:</span>
                    <span className="text-sm">
                      {donation.goods_quantity} {donation.goods_unit}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <span className="text-sm font-medium">Kontak:</span>
                <div className="text-sm text-right">
                  <div>{donation.donor_email}</div>
                  <div>{donation.donor_phone}</div>
                </div>
              </div>

              {donation.notes && (
                <div className="pt-2 border-t">
                  <span className="text-sm font-medium">Catatan:</span>
                  <p className="text-sm text-muted-foreground mt-1">{donation.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
