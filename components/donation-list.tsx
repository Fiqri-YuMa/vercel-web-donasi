"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface Donation {
  id: string
  donation_type: string
  donor_name: string
  donor_email: string
  donor_phone: string
  amount?: number
  item_name?: string
  quantity?: number
  unit?: string
  description?: string
  status: string
  photo_url?: string
  created_at: string
  categories?: {
    name: string
  }
}

interface DonationListProps {
  donations: Donation[]
  showAll?: boolean
}

export function DonationList({ donations, showAll = false }: DonationListProps) {
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
      pending: { label: "Menunggu Verifikasi", variant: "secondary" as const },
      approved: { label: "Terverifikasi", variant: "default" as const },
      rejected: { label: "Ditolak", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredDonations = showAll ? donations : donations.filter((d) => d.status === "approved")

  if (filteredDonations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {showAll ? "Belum ada donasi yang tercatat." : "Belum ada donasi yang terverifikasi."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredDonations.map((donation) => (
        <Card key={donation.id} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{donation.donor_name}</CardTitle>
                {donation.categories && <p className="text-sm text-muted-foreground">{donation.categories.name}</p>}
              </div>
              {getStatusBadge(donation.status)}
            </div>
            <p className="text-sm text-muted-foreground">{formatDate(donation.created_at)}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Jenis:</span>
                <Badge variant="outline" className="capitalize">
                  {donation.donation_type}
                </Badge>
              </div>

              {donation.donation_type === "uang" && donation.amount && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Jumlah:</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(donation.amount)}</span>
                </div>
              )}

              {donation.donation_type === "barang" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Barang:</span>
                    <span className="text-sm text-right max-w-xs">{donation.item_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Jumlah:</span>
                    <span className="text-sm">
                      {donation.quantity} {donation.unit}
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

              {donation.description && (
                <div className="pt-2 border-t">
                  <span className="text-sm font-medium">Deskripsi:</span>
                  <p className="text-sm text-muted-foreground mt-1">{donation.description}</p>
                </div>
              )}

              {donation.photo_url && donation.status === "approved" && (
                <div className="pt-2 border-t">
                  <span className="text-sm font-medium">Bukti Verifikasi:</span>
                  <div className="mt-2">
                    <img
                      src={donation.photo_url || "/placeholder.svg"}
                      alt="Bukti donasi"
                      className="w-full max-w-xs rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
