"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"

interface Donation {
  id: string
  donor_name: string
  donor_email: string
  donor_phone: string
  donation_type: string
  amount: number | null
  item_name: string | null
  quantity: number | null
  unit: string | null
  description: string | null
  status: string
  photo_url: string | null
  created_at: string
  categories: {
    name: string
  }
}

export function DonationApprovalList() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

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
    setLoading(false)
  }

  useEffect(() => {
    fetchDonations()
  }, [])

  const handleApprove = async (donationId: string) => {
    if (!photoFile) {
      toast({
        title: "Foto diperlukan",
        description: "Silakan upload foto sebagai bukti verifikasi",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    const supabase = createClient()

    try {
      // Upload photo
      const fileExt = photoFile.name.split(".").pop()
      const fileName = `${donationId}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("donation-photos")
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("donation-photos").getPublicUrl(fileName)

      // Update donation status
      const { error: updateError } = await supabase
        .from("donations")
        .update({
          status: "approved",
          photo_url: urlData.publicUrl,
          approved_at: new Date().toISOString(),
        })
        .eq("id", donationId)

      if (updateError) throw updateError

      toast({
        title: "Donasi disetujui",
        description: "Donasi berhasil diverifikasi dan disetujui",
      })

      fetchDonations()
      setSelectedDonation(null)
      setPhotoFile(null)
    } catch (error) {
      console.error("Error approving donation:", error)
      toast({
        title: "Gagal menyetujui donasi",
        description: "Terjadi kesalahan saat memproses persetujuan",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (donationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Alasan penolakan diperlukan",
        description: "Silakan berikan alasan penolakan",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
        })
        .eq("id", donationId)

      if (error) throw error

      toast({
        title: "Donasi ditolak",
        description: "Donasi telah ditolak dengan alasan yang diberikan",
      })

      fetchDonations()
      setSelectedDonation(null)
      setRejectionReason("")
    } catch (error) {
      console.error("Error rejecting donation:", error)
      toast({
        title: "Gagal menolak donasi",
        description: "Terjadi kesalahan saat memproses penolakan",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Memuat data donasi...</div>
  }

  const pendingDonations = donations.filter((d) => d.status === "pending")
  const processedDonations = donations.filter((d) => d.status !== "pending")

  return (
    <div className="space-y-8">
      {/* Pending Donations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Donasi Menunggu Persetujuan ({pendingDonations.length})</h2>
        <div className="grid gap-4">
          {pendingDonations.map((donation) => (
            <Card key={donation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{donation.donor_name}</CardTitle>
                    <CardDescription>
                      {donation.donor_email} • {donation.donor_phone}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Jenis Donasi</p>
                    <p className="text-sm text-muted-foreground capitalize">{donation.donation_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kategori</p>
                    <p className="text-sm text-muted-foreground">{donation.categories?.name}</p>
                  </div>
                  {donation.donation_type === "uang" ? (
                    <div>
                      <p className="text-sm font-medium">Jumlah</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(donation.amount || 0)}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium">Barang</p>
                        <p className="text-sm text-muted-foreground">{donation.item_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Jumlah</p>
                        <p className="text-sm text-muted-foreground">
                          {donation.quantity} {donation.unit}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {donation.description && (
                  <div className="mb-4">
                    <p className="text-sm font-medium">Deskripsi</p>
                    <p className="text-sm text-muted-foreground">{donation.description}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedDonation(donation)} className="bg-primary hover:bg-primary/90">
                        Setujui
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Setujui Donasi</DialogTitle>
                        <DialogDescription>Upload foto sebagai bukti verifikasi donasi</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="photo">Foto Bukti Donasi</Label>
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(donation.id)}
                            disabled={actionLoading || !photoFile}
                            className="flex-1"
                          >
                            {actionLoading ? "Memproses..." : "Setujui Donasi"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" onClick={() => setSelectedDonation(donation)}>
                        Tolak
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tolak Donasi</DialogTitle>
                        <DialogDescription>Berikan alasan penolakan donasi</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reason">Alasan Penolakan</Label>
                          <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Jelaskan alasan penolakan..."
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(donation.id)}
                            disabled={actionLoading || !rejectionReason.trim()}
                            className="flex-1"
                          >
                            {actionLoading ? "Memproses..." : "Tolak Donasi"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingDonations.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada donasi yang menunggu persetujuan</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Processed Donations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Riwayat Donasi</h2>
        <div className="grid gap-4">
          {processedDonations.slice(0, 10).map((donation) => (
            <Card key={donation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{donation.donor_name}</CardTitle>
                    <CardDescription>
                      {donation.donation_type === "uang"
                        ? formatCurrency(donation.amount || 0)
                        : `${donation.item_name} - ${donation.quantity} ${donation.unit}`}
                    </CardDescription>
                  </div>
                  <Badge variant={donation.status === "approved" ? "default" : "destructive"}>
                    {donation.status === "approved" ? "Disetujui" : "Ditolak"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
