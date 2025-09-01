"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  description: string
}

export function DonationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [donationType, setDonationType] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("categories").select("*").order("name")
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

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
        category_id: formData.get("category_id") as string,
        amount: donationType === "uang" ? Number.parseFloat(formData.get("amount") as string) : null,
        item_name: donationType === "barang" ? (formData.get("item_name") as string) : null,
        quantity: donationType === "barang" ? Number.parseInt(formData.get("quantity") as string) : null,
        unit: donationType === "barang" ? (formData.get("unit") as string) : null,
        description: (formData.get("description") as string) || null,
        status: "pending",
      }

      const { error } = await supabase.from("donations").insert([donationData])

      if (error) throw error

      toast({
        title: "Donasi berhasil dikirim!",
        description: "Terima kasih atas donasi Anda. Donasi akan diverifikasi oleh admin terlebih dahulu.",
      })

      // Reset form
      ;(e.target as HTMLFormElement).reset()
      setDonationType("")

      router.refresh()
    } catch (error) {
      console.error("Error creating donation:", error)
      toast({
        title: "Gagal mengirim donasi",
        description: "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Form Donasi</h2>
        <p className="text-muted-foreground">
          Isi form di bawah untuk mengirim donasi. Donasi akan diverifikasi oleh admin sebelum ditampilkan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="donation_type">Jenis Donasi</Label>
          <Select value={donationType} onValueChange={setDonationType} required>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis donasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uang">Uang</SelectItem>
              <SelectItem value="barang">Barang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category_id">Kategori</Label>
          <Select name="category_id" required>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
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

        {donationType === "uang" && (
          <div className="grid gap-2">
            <Label htmlFor="amount">Jumlah Donasi (Rp)</Label>
            <Input id="amount" name="amount" type="number" min="1000" step="1000" placeholder="50000" required />
          </div>
        )}

        {donationType === "barang" && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="item_name">Nama Barang</Label>
              <Input
                id="item_name"
                name="item_name"
                type="text"
                placeholder="Contoh: Beras, Minyak goreng, Pakaian"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Jumlah</Label>
                <Input id="quantity" name="quantity" type="number" min="1" placeholder="10" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input id="unit" name="unit" type="text" placeholder="kg, pcs, dus" required />
              </div>
            </div>
          </>
        )}

        <div className="grid gap-2">
          <Label htmlFor="description">Deskripsi/Catatan (Opsional)</Label>
          <Textarea id="description" name="description" placeholder="Tambahkan deskripsi atau catatan" />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !donationType}>
          {isLoading ? "Mengirim..." : "Kirim Donasi"}
        </Button>
      </form>
    </div>
  )
}
