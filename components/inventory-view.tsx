"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InventoryItem {
  id: string
  category_id: string
  item_name: string
  current_stock: number
  unit: string
  description: string
  categories: {
    name: string
  }
}

interface Category {
  id: string
  name: string
}

export function InventoryView() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const supabase = createClient()

    const { data: inventoryData } = await supabase
      .from("inventory")
      .select(`
        *,
        categories (
          name
        )
      `)
      .order("item_name")

    const { data: categoriesData } = await supabase.from("categories").select("*").order("name")

    if (inventoryData) {
      setInventory(inventoryData)
      setFilteredInventory(inventoryData)
    }
    if (categoriesData) setCategories(categoriesData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = inventory

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.categories.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category_id === selectedCategory)
    }

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, selectedCategory])

  if (loading) {
    return <div className="text-center py-8">Memuat data inventory...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Cari barang..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="w-48">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                <Badge
                  variant={item.current_stock <= 5 ? "destructive" : item.current_stock <= 10 ? "secondary" : "default"}
                >
                  {item.current_stock} {item.unit}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              {item.current_stock <= 5 && <p className="text-xs text-red-600 font-medium mt-2">⚠️ Stok rendah</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Tidak ada barang yang ditemukan</p>
        </div>
      )}
    </div>
  )
}
