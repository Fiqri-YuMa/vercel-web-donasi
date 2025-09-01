import { createServiceClient } from "@/lib/supabase/service"
import { DonationForm } from "@/components/donation-form"
import { DonationList } from "@/components/donation-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = createServiceClient()

  const { data: donations, error } = await supabase
    .from("donations")
    .select(`
      *,
      categories (
        name
      )
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching donations:", error)
  }

  const approvedDonations = donations || []
  const totalMoneyDonations = approvedDonations
    .filter((d) => d.donation_type === "uang")
    .reduce((sum, d) => sum + (d.amount || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-primary-foreground rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-lg">PMI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">PMI Kabupaten Cianjur</h1>
                <p className="text-sm opacity-90">Sistem Koordinasi Bantuan</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" asChild>
                <Link href="/auth/login">Login Staff</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Platform Donasi & Bantuan</h2>
          <p className="text-muted-foreground text-lg">Bersama membantu sesama yang membutuhkan di Kabupaten Cianjur</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <DonationForm />
          </div>

          {/* Donation Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik Donasi</CardTitle>
                <CardDescription>Donasi yang telah terverifikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{approvedDonations.length}</div>
                    <div className="text-sm text-muted-foreground">Total Donasi</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-semibold text-secondary">
                        {approvedDonations.filter((d) => d.donation_type === "uang").length}
                      </div>
                      <div className="text-xs text-muted-foreground">Donasi Uang</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-semibold text-secondary">
                        {approvedDonations.filter((d) => d.donation_type === "barang").length}
                      </div>
                      <div className="text-xs text-muted-foreground">Donasi Barang</div>
                    </div>
                  </div>

                  {totalMoneyDonations > 0 && (
                    <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="text-lg font-bold text-primary">{formatCurrency(totalMoneyDonations)}</div>
                      <div className="text-sm text-muted-foreground">Total Dana Terkumpul</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-1">Proses Verifikasi:</p>
                  <p className="text-muted-foreground text-xs">
                    Setiap donasi akan diverifikasi oleh admin PMI sebelum ditampilkan untuk memastikan transparansi.
                  </p>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Kontak PMI Cianjur:</p>
                  <p className="text-muted-foreground text-xs">
                    Email: info@pmi-cianjur.org
                    <br />
                    Telepon: (0263) 123-4567
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Donation List */}
        <div className="mt-12">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-2">Donasi Terverifikasi</h3>
            <p className="text-muted-foreground">
              Daftar donasi yang telah diverifikasi dan dikonfirmasi oleh tim PMI Kabupaten Cianjur
            </p>
          </div>
          <DonationList donations={approvedDonations} />
        </div>
      </div>

      <footer className="bg-muted mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PMI</span>
            </div>
            <span className="font-semibold">PMI Kabupaten Cianjur</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Palang Merah Indonesia Kabupaten Cianjur - Kemanusiaan, Kesukarelaan, Kenetralan, Kemandirian, Kesatuan,
            Keutuhan
          </p>
        </div>
      </footer>
    </div>
  )
}
