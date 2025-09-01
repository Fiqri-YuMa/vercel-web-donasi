import { createServiceClient } from "@/lib/supabase/service"
import { DonationForm } from "@/components/donation-form"
import { DonationList } from "@/components/donation-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const supabase = createServiceClient()

  // Fetch existing donations using service client to bypass RLS
  const { data: donations, error } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching donations:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Platform Donasi</h1>
          <p className="text-muted-foreground text-lg">Berbagi kebaikan untuk sesama</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Donation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Buat Donasi Baru</CardTitle>
              <CardDescription>Isi form di bawah untuk membuat donasi baru</CardDescription>
            </CardHeader>
            <CardContent>
              <DonationForm />
            </CardContent>
          </Card>

          {/* Donation Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik Donasi</CardTitle>
              <CardDescription>Ringkasan donasi yang telah terkumpul</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Donasi:</span>
                  <span className="text-2xl font-bold text-primary">{donations?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Donasi Uang:</span>
                  <span className="text-lg font-semibold">
                    {donations?.filter((d) => d.donation_type === "money").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Donasi Barang:</span>
                  <span className="text-lg font-semibold">
                    {donations?.filter((d) => d.donation_type === "goods").length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donation List */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Donasi</CardTitle>
              <CardDescription>Semua donasi yang telah diterima</CardDescription>
            </CardHeader>
            <CardContent>
              <DonationList donations={donations || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
