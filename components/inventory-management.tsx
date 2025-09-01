"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Package, TrendingUp, TrendingDown } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string
}

interface InventoryItem {
  id: string
  category_id: string
  item_name: string
  current_stock: number
  unit: string
  description: string
  created_at: string
  categories: {
    name: string
  }
}

export function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState({ type: "add", quantity: 0, reason: "" })
  const { toast } = useToast()

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch inventory with categories
    const { data: inventoryData } = await supabase
      .from("inventory")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("item_name")

    // Fetch categories
    const { data: categoriesData } = await supabase.from("categories").select("*").order("name")

    if (inventoryData) setInventory(inventoryData)
    if (categoriesData) setCategories(categoriesData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setActionLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("inventory").insert({
        category_id: formData.get("category_id") as string,
        item_name: formData.get("item_name") as string,
        current_stock: Number.parseInt(formData.get("current_stock") as string),
        unit: formData.get("unit") as string,
        description: formData.get("description") as string,
      })

      if (error) throw error

      toast({
        title: "Item berhasil ditambahkan",
        description: "Item baru telah ditambahkan ke inventory",
      })

      setIsAddDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Gagal menambahkan item",
        description: "Terjadi kesalahan saat menambahkan item",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) return

    setActionLoading(true)
    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          category_id: formData.get("category_id") as string,
          item_name: formData.get("item_name") as string,
          unit: formData.get("unit") as string,
          description: formData.get("description") as string,
        })
        .eq("id", selectedItem.id)

      if (error) throw error

      toast({
        title: "Item berhasil diperbarui",
        description: "Informasi item telah diperbarui",
      })

      setIsEditDialogOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Gagal memperbarui item",
        description: "Terjadi kesalahan saat memperbarui item",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleStockAdjustment = async () => {
    if (!selectedItem || stockAdjustment.quantity <= 0) return

    setActionLoading(true)
    const supabase = createClient()

    try {
      const newStock =
        stockAdjustment.type === "add"
          ? selectedItem.current_stock + stockAdjustment.quantity
          : Math.max(0, selectedItem.current_stock - stockAdjustment.quantity)

      const { error } = await supabase.from("inventory").update({ current_stock: newStock }).eq("id", selectedItem.id)

      if (error) throw error

      toast({
        title: "Stok berhasil disesuaikan",
        description: `Stok ${selectedItem.item_name} telah ${stockAdjustment.type === "add" ? "ditambah" : "dikurangi"}`,
      })

      setIsStockDialogOpen(false)
      setSelectedItem(null)
      setStockAdjustment({ type: "add", quantity: 0, reason: "" })
      fetchData()
    } catch (error) {
      console.error("Error adjusting stock:", error)
      toast({
        title: "Gagal menyesuaikan stok",
        description: "Terjadi kesalahan saat menyesuaikan stok",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Memuat data inventory...</div>
  }

  const lowStockItems = inventory.filter((item) => item.current_stock <= 5)
  const totalItems = inventory.length
  const totalStock = inventory.reduce((sum, item) => sum + item.current_stock, 0)

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Item</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Stok</p>
                <p className="text-2xl font-bold">{totalStock}</p>
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
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm font-medium">Kategori</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="low-stock">Stok Rendah</TabsTrigger>
          </TabsList>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Item Baru</DialogTitle>
                <DialogDescription>Tambahkan item baru ke inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="item_name">Nama Item</Label>
                  <Input name="item_name" required placeholder="Nama item" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_stock">Stok Awal</Label>
                    <Input name="current_stock" type="number" min="0" required placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Input name="unit" required placeholder="kg, pcs, dus" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea name="description" placeholder="Deskripsi item" />
                </div>
                <Button type="submit" disabled={actionLoading} className="w-full">
                  {actionLoading ? "Menambahkan..." : "Tambah Item"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4">
            {inventory.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.item_name}</CardTitle>
                      <CardDescription>{item.categories.name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.current_stock <= 5 ? "destructive" : "default"}>
                        {item.current_stock} {item.unit}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {item.description && <p className="text-sm text-muted-foreground mb-4">{item.description}</p>}
                  <div className="flex gap-2">
                    <Dialog
                      open={isStockDialogOpen && selectedItem?.id === item.id}
                      onOpenChange={setIsStockDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                          Sesuaikan Stok
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Sesuaikan Stok - {item.item_name}</DialogTitle>
                          <DialogDescription>
                            Stok saat ini: {item.current_stock} {item.unit}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Jenis Penyesuaian</Label>
                            <Select
                              value={stockAdjustment.type}
                              onValueChange={(value) => setStockAdjustment({ ...stockAdjustment, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="add">Tambah Stok</SelectItem>
                                <SelectItem value="subtract">Kurangi Stok</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                              type="number"
                              min="1"
                              value={stockAdjustment.quantity}
                              onChange={(e) =>
                                setStockAdjustment({
                                  ...stockAdjustment,
                                  quantity: Number.parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="Jumlah"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Alasan</Label>
                            <Textarea
                              value={stockAdjustment.reason}
                              onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                              placeholder="Alasan penyesuaian stok"
                            />
                          </div>
                          <Button onClick={handleStockAdjustment} disabled={actionLoading} className="w-full">
                            {actionLoading ? "Memproses..." : "Sesuaikan Stok"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isEditDialogOpen && selectedItem?.id === item.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Item</DialogTitle>
                          <DialogDescription>Perbarui informasi item</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditItem} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="category_id">Kategori</Label>
                            <Select name="category_id" defaultValue={item.category_id} required>
                              <SelectTrigger>
                                <SelectValue />
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
                          <div className="space-y-2">
                            <Label htmlFor="item_name">Nama Item</Label>
                            <Input name="item_name" defaultValue={item.item_name} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="unit">Satuan</Label>
                            <Input name="unit" defaultValue={item.unit} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea name="description" defaultValue={item.description || ""} />
                          </div>
                          <Button type="submit" disabled={actionLoading} className="w-full">
                            {actionLoading ? "Memperbarui..." : "Perbarui Item"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          {lowStockItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada item dengan stok rendah</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {lowStockItems.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.item_name}</CardTitle>
                        <CardDescription>{item.categories.name}</CardDescription>
                      </div>
                      <Badge variant="destructive">
                        {item.current_stock} {item.unit}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600 font-medium">⚠️ Stok rendah - perlu segera diisi ulang</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
