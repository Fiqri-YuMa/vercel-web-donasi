"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function DonationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [donationType, setDonationType] = useState<string>("")
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const donationData = {
        donation_type: donationType,
        donor_name: formData.get("donor_name") as string,
        donor_email: formData.get("donor_email") as string,
        donor_phone: formData.get("donor_phone") as string,
        amount: donationType === "money" ? Number.parseFloat(formData.get("amount") as string) : null,
        goods_description: donationType === "goods" ? (formData.get("goods_description") as string) : null,
        goods_quantity: donationType === "goods" ? Number.parseInt(formData.get("goods_quantity") as string) : null,
        goods_unit: donationType === "goods" ? (formData.get("goods_unit") as string) : null,
        notes: (formData.get("notes") as string) || null,
        status: "pending",
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("donations").insert([donationData])

      if (error) throw error

      toast({
        title: "Donasi berhasil dibuat!",
        description: "Terima kasih atas donasi Anda. Data telah tersimpan di database.",
      })

      // Reset form
      ;(e.target as HTMLFormElement).reset()
      setDonationType("")

      // Refresh the page to show new donation
      router.refresh()
    } catch (error) {
      console.error("Error creating donation:", error)
      toast({
        title: "Gagal membuat donasi",
        description: "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="donation_type">Jenis Donasi</Label>
        <Select value={donationType} onValueChange={setDonationType} required>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis donasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="money">Uang</SelectItem>
            <SelectItem value="goods">Barang</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="donor_name">Nama Donatur</Label>
        <Input id="donor_name" name="donor_name" type="text" placeholder="Masukkan nama lengkap" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="donor_email">Email</Label>
        <Input id="donor_email" name="donor_email" type="email" placeholder="contoh@email.com" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="donor_phone">Nomor Telepon</Label>
        <Input id="donor_phone" name="donor_phone" type="tel" placeholder="08xxxxxxxxxx" required />
      </div>

      {donationType === "money" && (
        <div className="grid gap-2">
          <Label htmlFor="amount">Jumlah Donasi (Rp)</Label>
          <Input id="amount" name="amount" type="number" min="1000" step="1000" placeholder="50000" required />
        </div>
      )}

      {donationType === "goods" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="goods_description">Deskripsi Barang</Label>
            <Textarea
              id="goods_description"
              name="goods_description"
              placeholder="Contoh: Beras, Minyak goreng, Pakaian bekas layak pakai"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="goods_quantity">Jumlah</Label>
              <Input id="goods_quantity" name="goods_quantity" type="number" min="1" placeholder="10" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goods_unit">Satuan</Label>
              <Input id="goods_unit" name="goods_unit" type="text" placeholder="kg, pcs, dus" required />
            </div>
          </div>
        </>
      )}

      <div className="grid gap-2">
        <Label htmlFor="notes">Catatan (Opsional)</Label>
        <Textarea id="notes" name="notes" placeholder="Tambahkan catatan jika diperlukan" />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !donationType}>
        {isLoading ? "Menyimpan..." : "Buat Donasi"}
      </Button>
    </form>
  )
}
