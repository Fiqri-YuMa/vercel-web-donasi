"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InventoryData {
  id: string
  item_name: string
  current_stock: number
  unit: string
  description: string
  created_at: string
  categories: {
    name: string
  }
}

export function InventoryReport() {
  const [inventory, setInventory] = useState<InventoryData[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")

  const fetchInventory = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("inventory")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("item_name")

    if (error) {
      console.error("Error fetching inventory:", error)
      return
    }

    setInventory(data || [])
    setFilteredInventory(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    let filtered = inventory

    if (categoryFilter !== "all") {
      filtered = filtered.filter((i) => i.categories.name === categoryFilter)
    }

    if (stockFilter === "low") {
      filtered = filtered.filter((i) => i.current_stock <= 5)
    } else if (stockFilter === "medium") {
      filtered = filtered.filter((i) => i.current_stock > 5 && i.current_stock <= 20)
    } else if (stockFilter === "high") {
      filtered = filtered.filter((i) => i.current_stock > 20)
    }

    setFilteredInventory(filtered)
  }, [inventory, categoryFilter, stockFilter])

  const exportInventoryReport = () => {
    alert("Export laporan inventory (PDF) akan segera tersedia")
  }

  if (loading) {
    return <div className="text-center py-4">Memuat data inventory...</div>
  }

  const totalItems = filteredInventory.length
  const totalStock = filteredInventory.reduce((sum, item) => sum + item.current_stock, 0)
  const lowStockItems = filteredInventory.filter((item) => item.current_stock <= 5).length
  const categories = [...new Set(inventory.map((item) => item.categories.name))]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Item</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{totalStock}</p>
              <p className="text-sm text-muted-foreground">Total Stok</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
              <p className="text-sm text-muted-foreground">Stok Rendah</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Kategori</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Level Stok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="low">Stok Rendah (&lt;=5)</SelectItem>
              <SelectItem value="medium">Stok Sedang (6-20)</SelectItem>
              <SelectItem value="high">Stok Tinggi (&gt;20)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportInventoryReport} variant="outline" className="flex items-center gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Inventory Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInventory.map((item) => (
          <Card key={item.id} className={item.current_stock <= 5 ? "border-l-4 border-l-red-500" : ""}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.item_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.categories.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.current_stock <= 5 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <Badge
                    variant={
                      item.current_stock <= 5 ? "destructive" : item.current_stock <= 10 ? "secondary" : "default"
                    }
                  >
                    {item.current_stock} {item.unit}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
              <div className="text-xs text-muted-foreground">
                Ditambahkan: {new Date(item.created_at).toLocaleDateString("id-ID")}
              </div>
              {item.current_stock <= 5 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  ⚠️ Stok rendah - perlu segera diisi ulang
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Tidak ada data inventory yang sesuai filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
