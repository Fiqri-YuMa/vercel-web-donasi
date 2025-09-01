"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, X } from "lucide-react"

interface InventoryItem {
  id: string
  item_name: string
  current_stock: number
  unit: string
  categories: {
    name: string
  }
}

interface RequestItem {
  inventory_id: string
  item_name: string
  current_stock: number
  unit: string
  requested_quantity: number
}

interface DistributionRequestFormProps {
  onSuccess?: () => void
}

export function DistributionRequestForm({ onSuccess }: DistributionRequestFormProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [requestItems, setRequestItems] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchInventory = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("inventory")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("item_name")

    if (data) setInventory(data)
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const addRequestItem = (inventoryItem: InventoryItem) => {
    const existingItem = requestItems.find((item) => item.inventory_id === inventoryItem.id)
    if (existingItem) {
      toast({
        title: "Item sudah ditambahkan",
        description: "Item ini sudah ada dalam daftar request",
        variant: "destructive",
      })
      return
    }

    setRequestItems([
      ...requestItems,
      {
        inventory_id: inventoryItem.id,
        item_name: inventoryItem.item_name,
        current_stock: inventoryItem.current_stock,
        unit: inventoryItem.unit,
        requested_quantity: 1,
      },
    ])
  }

  const updateRequestQuantity = (inventoryId: string, quantity: number) => {
    setRequestItems(
      requestItems.map((item) =>
        item.inventory_id === inventoryId ? { ...item, requested_quantity: Math.max(1, quantity) } : item,
      ),
    )
  }

  const removeRequestItem = (inventoryId: string) => {
    setRequestItems(requestItems.filter((item) => item.inventory_id !== inventoryId))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (requestItems.length === 0) {
      toast({
        title: "Tidak ada item yang dipilih",
        description: "Silakan pilih minimal satu item untuk didistribusikan",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.data.user) throw new Error("User not authenticated")

      // Create distribution request
      const { data: request, error: requestError } = await supabase
        .from("distribution_requests")
        .insert({
          requested_by: user.data.user.id,
          recipient_name: formData.get("recipient_name") as string,
          recipient_address: formData.get("recipient_address") as string,
          incident_description: formData.get("incident_description") as string,
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Create request items
      const requestItemsData = requestItems.map((item) => ({
        request_id: request.id,
        inventory_id: item.inventory_id,
        requested_quantity: item.requested_quantity,
      }))

      const { error: itemsError } = await supabase.from("distribution_request_items").insert(requestItemsData)

      if (itemsError) throw itemsError

      toast({
        title: "Request berhasil dibuat",
        description: "Permintaan distribusi telah dikirim dan menunggu persetujuan admin",
      })

      // Reset form
      ;(e.target as HTMLFormElement).reset()
      setRequestItems([])
      onSuccess?.()
    } catch (error) {
      console.error("Error creating request:", error)
      toast({
        title: "Gagal membuat request",
        description: "Terjadi kesalahan saat membuat permintaan distribusi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Penerima</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Nama Penerima</Label>
              <Input id="recipient_name" name="recipient_name" required placeholder="Nama lengkap penerima bantuan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient_address">Alamat Penerima</Label>
              <Textarea
                id="recipient_address"
                name="recipient_address"
                required
                placeholder="Alamat lengkap penerima bantuan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incident_description">Deskripsi Kejadian/Alasan</Label>
              <Textarea
                id="incident_description"
                name="incident_description"
                required
                placeholder="Jelaskan kejadian atau alasan mengapa bantuan diperlukan"
              />
            </div>
          </CardContent>
        </Card>

        {/* Item Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pilih Barang untuk Distribusi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tambah Barang</Label>
              <Select
                onValueChange={(value) => {
                  const item = inventory.find((i) => i.id === value)
                  if (item) addRequestItem(item)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih barang dari inventory" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name} - {item.current_stock} {item.unit} tersedia
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Items */}
            {requestItems.length > 0 && (
              <div className="space-y-3">
                <Label>Barang yang Dipilih:</Label>
                {requestItems.map((item) => (
                  <div key={item.inventory_id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Tersedia: {item.current_stock} {item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateRequestQuantity(item.inventory_id, item.requested_quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">
                        {item.requested_quantity} {item.unit}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateRequestQuantity(item.inventory_id, item.requested_quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.requested_quantity > item.current_stock && <Badge variant="secondary">Melebihi stok</Badge>}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequestItem(item.inventory_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading || requestItems.length === 0} className="w-full">
          {loading ? "Membuat Request..." : "Buat Request Distribusi"}
        </Button>
      </form>
    </div>
  )
}
